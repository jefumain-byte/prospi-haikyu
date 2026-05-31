import {
  countsAsAtBat,
  effectivePitchResult,
  groupPitchesIntoPlateAppearances,
  isHitForAverage,
  isHbp,
  isSacrificeFly,
  isWalk,
  plateAppearanceEnds,
} from './atBatLogic'
import { isThreeBuntFailure } from './buntLogic'
import { resolveBattingSide } from './gameLogic'
import { getSessionPitchesInGameOrder } from './storage'
import {
  formatAverage,
  formatDecimalRate,
  formatObp,
  formatOps,
  formatPercentRate,
  formatSlg,
  MIN_RATE_SAMPLE,
} from './statsFormat'
import type { GameSession, PitchRecord } from './types'

export interface BattingCountingStats {
  hits: number
  atBats: number
  plateAppearances: number
  walks: number
  hbp: number
  sacrificeFlies: number
  homeruns: number
  strikeouts: number
  totalBases: number
}

export interface BattingRateStats {
  battingAverage: string
  onBasePercentage: string
  sluggingPercentage: string
  ops: string
  strikeoutRate: string
  walkRate: string
}

export interface ZoneStat {
  row: number
  col: number
  hits: number
  atBats: number
  totalBases: number
  average: string
  slugging: string
}

export interface BattingAnalysisResult extends BattingCountingStats, BattingRateStats {
  zoneBatting: ZoneStat[]
}

export interface BattingAccumulator {
  stats: BattingCountingStats
  zoneMap: Map<string, { hits: number; atBats: number; totalBases: number }>
}

function zoneKey(row: number, col: number): string {
  return `${row}-${col}`
}

export function createBattingAccumulator(): BattingAccumulator {
  return {
    stats: {
      hits: 0,
      atBats: 0,
      plateAppearances: 0,
      walks: 0,
      hbp: 0,
      sacrificeFlies: 0,
      homeruns: 0,
      strikeouts: 0,
      totalBases: 0,
    },
    zoneMap: new Map(),
  }
}

export function isStrikeout(pitch: PitchRecord): boolean {
  if (!plateAppearanceEnds(pitch)) return false
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

export function accumulateBattingPlateAppearance(
  acc: BattingAccumulator,
  ending: PitchRecord,
  battingSide: ReturnType<typeof resolveBattingSide>,
): void {
  if (battingSide !== 'self' || !plateAppearanceEnds(ending)) return

  acc.stats.plateAppearances += 1

  if (isWalk(ending)) {
    acc.stats.walks += 1
    return
  }
  if (isHbp(ending)) {
    acc.stats.hbp += 1
    return
  }
  if (isSacrificeFly(ending)) {
    acc.stats.sacrificeFlies += 1
    return
  }
  if (isStrikeout(ending)) {
    acc.stats.strikeouts += 1
  }
  if (!countsAsAtBat(ending)) return

  acc.stats.atBats += 1
  const bases = hitTotalBases(ending)
  acc.stats.totalBases += bases

  if (isHitForAverage(ending)) {
    acc.stats.hits += 1
    if (effectivePitchResult(ending) === 'homerun') acc.stats.homeruns += 1
  }

  const zone = zoneKey(ending.row, ending.col)
  const cell = acc.zoneMap.get(zone) ?? { hits: 0, atBats: 0, totalBases: 0 }
  cell.atBats += 1
  cell.totalBases += bases
  if (isHitForAverage(ending)) cell.hits += 1
  acc.zoneMap.set(zone, cell)
}

function buildZoneStats(map: Map<string, { hits: number; atBats: number; totalBases: number }>): ZoneStat[] {
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

export function finalizeBattingAnalysis(acc: BattingAccumulator): BattingAnalysisResult {
  const { stats } = acc
  const onBasePercentage = formatObp(stats)
  const sluggingPercentage = formatSlg(stats.totalBases, stats.atBats, 1)

  return {
    ...stats,
    battingAverage: formatAverage(stats.hits, stats.atBats, 1),
    onBasePercentage,
    sluggingPercentage,
    ops: formatOps(onBasePercentage, sluggingPercentage),
    strikeoutRate: formatPercentRate(stats.strikeouts, stats.plateAppearances, 1),
    walkRate: formatPercentRate(stats.walks, stats.plateAppearances, 1),
    zoneBatting: buildZoneStats(acc.zoneMap),
  }
}

export function computeBattingAnalysis(sessions: GameSession[]): BattingAnalysisResult {
  const acc = createBattingAccumulator()

  for (const session of sessions) {
    for (const plateAppearance of groupPitchesIntoPlateAppearances(getSessionPitchesInGameOrder(session))) {
      const ending = plateAppearance[plateAppearance.length - 1]
      if (!ending) continue
      const battingSide = resolveBattingSide(session.battingFirst, ending.halfInning)
      accumulateBattingPlateAppearance(acc, ending, battingSide)
    }
  }

  return finalizeBattingAnalysis(acc)
}
