import {
  countsAsAtBat,
  effectivePitchResult,
  groupPitchesIntoPlateAppearances,
  isHitForAverage,
  isHbp,
  isWalk,
  plateAppearanceEnds,
} from './atBatLogic'
import { isThreeBuntFailure } from './buntLogic'
import {
  computeSelfPitchingEarnedRuns,
  computeSelfPitchingOuts,
} from './earnedRunLogic'
import { resolveBattingSide } from './gameLogic'
import { getSessionPitchesInGameOrder } from './storage'
import {
  formatAverage,
  formatEra,
  formatEraRate,
  formatSlg,
  formatWhiP,
  MIN_RATE_SAMPLE,
} from './statsFormat'
import type { GameSession, PitchRecord } from './types'

export interface PitchingCountingStats {
  outsRecorded: number
  earnedRuns: number
  runsAllowed: number
  hitsAllowed: number
  walksAllowed: number
  hbpAllowed: number
  homerunsAllowed: number
  strikeouts: number
}

export interface PitchingRateStats {
  era: string
  whip: string
  strikeoutsPerNine: string
  walksPerNine: string
}

export interface ZoneAgainstStat {
  row: number
  col: number
  hits: number
  atBats: number
  totalBases: number
  average: string
  slugging: string
}

export interface PitchingAnalysisResult extends PitchingCountingStats, PitchingRateStats {
  zoneAgainst: ZoneAgainstStat[]
}

export interface PitchingAccumulator {
  stats: PitchingCountingStats
  zoneMap: Map<string, { hits: number; atBats: number; totalBases: number }>
}

function zoneKey(row: number, col: number): string {
  return `${row}-${col}`
}

export function createPitchingAccumulator(): PitchingAccumulator {
  return {
    stats: {
      outsRecorded: 0,
      earnedRuns: 0,
      runsAllowed: 0,
      hitsAllowed: 0,
      walksAllowed: 0,
      hbpAllowed: 0,
      homerunsAllowed: 0,
      strikeouts: 0,
    },
    zoneMap: new Map(),
  }
}

function isPitchingStrikeout(pitch: PitchRecord): boolean {
  if (pitch.pitchSide !== 'self' || !plateAppearanceEnds(pitch)) return false
  if (isThreeBuntFailure(pitch)) return true
  const result = effectivePitchResult(pitch)
  return result === 'called_strike' || result === 'swinging_strike'
}

function hitTotalBases(pitch: PitchRecord): number {
  if (!isHitForAverage(pitch)) return 0
  const result = effectivePitchResult(pitch)
  if (result === 'single') return 1
  if (result === 'double') return 2
  if (result === 'triple') return 3
  if (result === 'homerun') return 4
  return 0
}

export function accumulatePitchingFromSession(acc: PitchingAccumulator, session: GameSession): void {
  acc.stats.earnedRuns += computeSelfPitchingEarnedRuns(session)
  acc.stats.outsRecorded += computeSelfPitchingOuts(session)

  for (const pitch of getSessionPitchesInGameOrder(session)) {
    if (pitch.pitchSide !== 'self') continue

    if ((pitch.runsScored ?? 0) > 0 && pitch.scoringSide === 'opponent') {
      acc.stats.runsAllowed += pitch.runsScored ?? 0
    }

    if (isPitchingStrikeout(pitch)) {
      acc.stats.strikeouts += 1
    }
  }

  for (const plateAppearance of groupPitchesIntoPlateAppearances(getSessionPitchesInGameOrder(session))) {
    const ending = plateAppearance[plateAppearance.length - 1]
    if (!ending || ending.pitchSide !== 'self' || !plateAppearanceEnds(ending)) continue

    const battingSide = resolveBattingSide(session.battingFirst, ending.halfInning)
    if (battingSide !== 'opponent') continue

    if (isWalk(ending)) acc.stats.walksAllowed += 1
    else if (isHbp(ending)) acc.stats.hbpAllowed += 1

    if (countsAsAtBat(ending)) {
      if (isHitForAverage(ending)) {
        acc.stats.hitsAllowed += 1
        if (effectivePitchResult(ending) === 'homerun') acc.stats.homerunsAllowed += 1
      }

      const zone = zoneKey(ending.row, ending.col)
      const bases = hitTotalBases(ending)
      const cell = acc.zoneMap.get(zone) ?? { hits: 0, atBats: 0, totalBases: 0 }
      cell.atBats += 1
      cell.totalBases += bases
      if (isHitForAverage(ending)) cell.hits += 1
      acc.zoneMap.set(zone, cell)
    }
  }
}

function buildZoneAgainstStats(map: Map<string, { hits: number; atBats: number; totalBases: number }>): ZoneAgainstStat[] {
  return [...map.entries()]
    .map(([key, value]) => {
      const [row, col] = key.split('-').map(Number)
      return {
        row,
        col,
        hits: value.hits,
        atBats: value.atBats,
        totalBases: value.totalBases,
        average: formatAverage(value.hits, value.atBats, MIN_RATE_SAMPLE),
        slugging: formatSlg(value.totalBases, value.atBats, MIN_RATE_SAMPLE),
      }
    })
    .sort((a, b) => a.row - b.row || a.col - b.col)
}

export function finalizePitchingAnalysis(acc: PitchingAccumulator): PitchingAnalysisResult {
  const { stats } = acc
  const walksPlusHbp = stats.walksAllowed + stats.hbpAllowed

  return {
    ...stats,
    era: formatEra(stats.earnedRuns, stats.outsRecorded),
    whip: formatWhiP(stats.hitsAllowed, stats.walksAllowed, stats.outsRecorded),
    strikeoutsPerNine: formatEraRate(stats.strikeouts, stats.outsRecorded),
    walksPerNine: formatEraRate(walksPlusHbp, stats.outsRecorded),
    zoneAgainst: buildZoneAgainstStats(acc.zoneMap),
  }
}

export function computePitchingAnalysis(sessions: GameSession[]): PitchingAnalysisResult {
  const acc = createPitchingAccumulator()
  for (const session of sessions) {
    accumulatePitchingFromSession(acc, session)
  }
  return finalizePitchingAnalysis(acc)
}
