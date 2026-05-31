import {
  countsAsAtBat,
  groupPitchesIntoPlateAppearances,
  isHitForAverage,
  plateAppearanceEnds,
} from './atBatLogic'
import { getPitchTypeLabel, PITCH_TYPE_GROUPS } from './constants'
import { resolveBattingSide } from './gameLogic'
import { getSessionPitchesInGameOrder } from './storage'
import { formatAverage, formatUsageRate, MIN_RATE_SAMPLE } from './statsFormat'
import type { GameSession, PitchRecord, PitchType } from './types'

export interface PitchTypeStat {
  pitchType: PitchType
  label: string
  pitchCount: number
  usageRate: string
  atBats: number
  hits: number
  average: string
}

export interface PitchTypeGroupStat {
  group: string
  shortLabel: string
  pitchCount: number
  usageRate: string
  atBats: number
  hits: number
  average: string
  types: PitchTypeStat[]
}

export interface PitchTypeSideAnalysis {
  pitchTotal: number
  byType: PitchTypeStat[]
  byGroup: PitchTypeGroupStat[]
}

export interface PitchTypeAnalysisResult {
  batting: PitchTypeSideAnalysis
  pitching: PitchTypeSideAnalysis
}

interface PitchTypeBucket {
  pitchCount: number
  atBats: number
  hits: number
}

function createBucketMap(): Map<PitchType, PitchTypeBucket> {
  return new Map()
}

function getBucket(map: Map<PitchType, PitchTypeBucket>, pitchType: PitchType): PitchTypeBucket {
  const existing = map.get(pitchType)
  if (existing) return existing
  const bucket: PitchTypeBucket = { pitchCount: 0, atBats: 0, hits: 0 }
  map.set(pitchType, bucket)
  return bucket
}

function accumulatePitchUsage(map: Map<PitchType, PitchTypeBucket>, pitch: PitchRecord): void {
  getBucket(map, pitch.pitchType).pitchCount += 1
}

function accumulateOutcome(map: Map<PitchType, PitchTypeBucket>, pitch: PitchRecord): void {
  if (!countsAsAtBat(pitch)) return
  const bucket = getBucket(map, pitch.pitchType)
  bucket.atBats += 1
  if (isHitForAverage(pitch)) bucket.hits += 1
}

function finalizePitchTypeStats(
  map: Map<PitchType, PitchTypeBucket>,
  totalPitches: number,
): PitchTypeStat[] {
  return [...map.entries()]
    .map(([pitchType, bucket]) => ({
      pitchType,
      label: getPitchTypeLabel(pitchType),
      pitchCount: bucket.pitchCount,
      usageRate: formatUsageRate(bucket.pitchCount, totalPitches),
      atBats: bucket.atBats,
      hits: bucket.hits,
      average: formatAverage(bucket.hits, bucket.atBats, MIN_RATE_SAMPLE),
    }))
    .filter((item) => item.pitchCount > 0)
    .sort((a, b) => b.pitchCount - a.pitchCount)
}

function buildGroupSummary(
  group: string,
  shortLabel: string,
  types: PitchTypeStat[],
  pitchTotal: number,
): PitchTypeGroupStat {
  const pitchCount = types.reduce((sum, item) => sum + item.pitchCount, 0)
  const atBats = types.reduce((sum, item) => sum + item.atBats, 0)
  const hits = types.reduce((sum, item) => sum + item.hits, 0)

  return {
    group,
    shortLabel,
    pitchCount,
    usageRate: formatUsageRate(pitchCount, pitchTotal),
    atBats,
    hits,
    average: formatAverage(hits, atBats, MIN_RATE_SAMPLE),
    types: types.sort((a, b) => b.pitchCount - a.pitchCount),
  }
}

/** 球種を大分類グループに割り当て（同一球種は最初のグループのみ） */
export function groupPitchTypesByCategory(
  stats: PitchTypeStat[],
  pitchTotal: number,
): PitchTypeGroupStat[] {
  const statMap = new Map(stats.map((item) => [item.pitchType, item]))
  const assigned = new Set<PitchType>()
  const groups: PitchTypeGroupStat[] = []

  for (const groupDef of PITCH_TYPE_GROUPS) {
    const types: PitchTypeStat[] = []
    for (const typeDef of groupDef.types) {
      if (assigned.has(typeDef.id)) continue
      const stat = statMap.get(typeDef.id)
      if (!stat) continue
      assigned.add(typeDef.id)
      types.push(stat)
    }
    if (types.length === 0) continue
    groups.push(buildGroupSummary(groupDef.group, groupDef.shortLabel, types, pitchTotal))
  }

  const ungrouped = stats.filter((item) => !assigned.has(item.pitchType))
  if (ungrouped.length > 0) {
    groups.push(buildGroupSummary('その他', 'その他', ungrouped, pitchTotal))
  }

  return groups.sort((a, b) => b.pitchCount - a.pitchCount)
}

function finalizeSideAnalysis(
  map: Map<PitchType, PitchTypeBucket>,
  pitchTotal: number,
): PitchTypeSideAnalysis {
  const byType = finalizePitchTypeStats(map, pitchTotal)
  return {
    pitchTotal,
    byType,
    byGroup: groupPitchTypesByCategory(byType, pitchTotal),
  }
}

export function computePitchTypeAnalysis(sessions: GameSession[]): PitchTypeAnalysisResult {
  const battingMap = createBucketMap()
  const pitchingMap = createBucketMap()
  let battingPitchTotal = 0
  let pitchingPitchTotal = 0

  for (const session of sessions) {
    const pitches = getSessionPitchesInGameOrder(session)

    for (const pitch of pitches) {
      const battingSide = resolveBattingSide(session.battingFirst, pitch.halfInning)
      if (battingSide === 'self') {
        accumulatePitchUsage(battingMap, pitch)
        battingPitchTotal += 1
      }
      if (pitch.pitchSide === 'self') {
        accumulatePitchUsage(pitchingMap, pitch)
        pitchingPitchTotal += 1
      }
    }

    for (const plateAppearance of groupPitchesIntoPlateAppearances(pitches)) {
      const ending = plateAppearance[plateAppearance.length - 1]
      if (!ending || !plateAppearanceEnds(ending)) continue

      const battingSide = resolveBattingSide(session.battingFirst, ending.halfInning)
      if (battingSide === 'self') {
        accumulateOutcome(battingMap, ending)
      } else if (ending.pitchSide === 'self') {
        accumulateOutcome(pitchingMap, ending)
      }
    }
  }

  return {
    batting: finalizeSideAnalysis(battingMap, battingPitchTotal),
    pitching: finalizeSideAnalysis(pitchingMap, pitchingPitchTotal),
  }
}
