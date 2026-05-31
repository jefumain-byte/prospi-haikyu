import {
  countsAsAtBat,
  effectivePitchResult,
  groupPitchesIntoPlateAppearances,
  isHitForAverage,
  plateAppearanceEnds,
} from './atBatLogic'
import { resolveBattingSide } from './gameLogic'
import { getSessionPitchesInGameOrder } from './storage'
import { formatAverage, formatSlg, MIN_RATE_SAMPLE } from './statsFormat'
import type { Count, GameSession, PitchRecord, Runners } from './types'

export interface SplitBucket {
  label: string
  plateAppearances: number
  atBats: number
  hits: number
  totalBases: number
}

export interface SplitStatLine {
  id: string
  label: string
  plateAppearances: number
  atBats: number
  hits: number
  average: string
  slugging: string
}

export interface SplitGroup {
  id: string
  title: string
  lines: SplitStatLine[]
}

export interface SplitAnalysisResult {
  batting: SplitGroup[]
  pitching: SplitGroup[]
}

interface SplitDefinitions {
  id: string
  title: string
  matchers: { id: string; label: string; match: (pitch: PitchRecord) => boolean }[]
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

function isFirstPitchCount(count: Count): boolean {
  return count.balls === 0 && count.strikes === 0
}

function isTwoStrikeCount(count: Count): boolean {
  return count.strikes >= 2
}

function isFullCount(count: Count): boolean {
  return count.balls === 3 && count.strikes === 2
}

function hasAnyRunner(runners: Runners): boolean {
  return runners.first || runners.second || runners.third
}

function isScoringPosition(runners: Runners): boolean {
  return runners.second || runners.third
}

const COUNT_SPLITS: SplitDefinitions = {
  id: 'count',
  title: 'カウント別',
  matchers: [
    { id: 'first-pitch', label: '初球（0-0）', match: (p) => isFirstPitchCount(p.countBefore) },
    { id: 'two-strike', label: '2ストライク以降', match: (p) => isTwoStrikeCount(p.countBefore) },
    { id: 'full-count', label: '3-2', match: (p) => isFullCount(p.countBefore) },
  ],
}

const RUNNER_SPLITS: SplitDefinitions = {
  id: 'runners',
  title: '走者状況',
  matchers: [
    { id: 'empty', label: '走者なし', match: (p) => !hasAnyRunner(p.runnersBefore) },
    { id: 'on-base', label: '走者あり', match: (p) => hasAnyRunner(p.runnersBefore) },
    { id: 'risp', label: '得点圏', match: (p) => isScoringPosition(p.runnersBefore) },
  ],
}

function handednessLabel(hand: Handedness): string {
  return hand === 'left' ? '左' : '右'
}

function buildHandednessSplits(side: 'batting' | 'pitching'): SplitDefinitions {
  if (side === 'batting') {
    return {
      id: 'handedness',
      title: '投手の腕別（自分の打席）',
      matchers: [
        {
          id: 'vs-rhp',
          label: '対右投',
          match: (p) => p.pitcherArm === 'right',
        },
        {
          id: 'vs-lhp',
          label: '対左投',
          match: (p) => p.pitcherArm === 'left',
        },
      ],
    }
  }

  return {
    id: 'handedness',
    title: '打者の利き腕別（自分の投球）',
    matchers: [
      {
        id: 'vs-rhb',
        label: '対右打',
        match: (p) => p.batterHand === 'right',
      },
      {
        id: 'vs-lhb',
        label: '対左打',
        match: (p) => p.batterHand === 'left',
      },
    ],
  }
}

function buildPlatoonSplits(side: 'batting' | 'pitching'): SplitDefinitions {
  if (side === 'batting') {
    return {
      id: 'platoon',
      title: '左右の組み合わせ（打席）',
      matchers: [
        {
          id: 'rvr',
          label: '右打 vs 右投',
          match: (p) => p.batterHand === 'right' && p.pitcherArm === 'right',
        },
        {
          id: 'rvl',
          label: '右打 vs 左投',
          match: (p) => p.batterHand === 'right' && p.pitcherArm === 'left',
        },
        {
          id: 'lvr',
          label: '左打 vs 右投',
          match: (p) => p.batterHand === 'left' && p.pitcherArm === 'right',
        },
        {
          id: 'lvl',
          label: '左打 vs 左投',
          match: (p) => p.batterHand === 'left' && p.pitcherArm === 'left',
        },
      ],
    }
  }

  return {
    id: 'platoon',
    title: '左右の組み合わせ（投球）',
    matchers: [
      {
        id: 'rvr',
        label: '右投 vs 右打',
        match: (p) => p.pitcherArm === 'right' && p.batterHand === 'right',
      },
      {
        id: 'rvl',
        label: '右投 vs 左打',
        match: (p) => p.pitcherArm === 'right' && p.batterHand === 'left',
      },
      {
        id: 'lvr',
        label: '左投 vs 右打',
        match: (p) => p.pitcherArm === 'left' && p.batterHand === 'right',
      },
      {
        id: 'lvl',
        label: '左投 vs 左打',
        match: (p) => p.pitcherArm === 'left' && p.batterHand === 'left',
      },
    ],
  }
}

function createBucketMap(definitions: SplitDefinitions): Map<string, SplitBucket> {
  const map = new Map<string, SplitBucket>()
  for (const matcher of definitions.matchers) {
    map.set(matcher.id, {
      label: matcher.label,
      plateAppearances: 0,
      atBats: 0,
      hits: 0,
      totalBases: 0,
    })
  }
  return map
}

function accumulateSplitPitch(
  definitions: SplitDefinitions,
  buckets: Map<string, SplitBucket>,
  ending: PitchRecord,
): void {
  for (const matcher of definitions.matchers) {
    if (!matcher.match(ending)) continue
    const bucket = buckets.get(matcher.id)!
    bucket.plateAppearances += 1
    if (!countsAsAtBat(ending)) continue
    bucket.atBats += 1
    const bases = hitTotalBases(ending)
    bucket.totalBases += bases
    if (isHitForAverage(ending)) bucket.hits += 1
  }
}

function finalizeSplitGroup(
  definitions: SplitDefinitions,
  buckets: Map<string, SplitBucket>,
): SplitGroup {
  const lines: SplitStatLine[] = definitions.matchers.map((matcher) => {
    const bucket = buckets.get(matcher.id)!
    return {
      id: matcher.id,
      label: bucket.label,
      plateAppearances: bucket.plateAppearances,
      atBats: bucket.atBats,
      hits: bucket.hits,
      average: formatAverage(bucket.hits, bucket.atBats, MIN_RATE_SAMPLE),
      slugging: formatSlg(bucket.totalBases, bucket.atBats, MIN_RATE_SAMPLE),
    }
  })

  return {
    id: definitions.id,
    title: definitions.title,
    lines: lines.filter((line) => line.plateAppearances > 0),
  }
}

function computeSideSplits(
  sessions: GameSession[],
  side: 'batting' | 'pitching',
): SplitGroup[] {
  const countBuckets = createBucketMap(COUNT_SPLITS)
  const runnerBuckets = createBucketMap(RUNNER_SPLITS)
  const handednessDefs = buildHandednessSplits(side)
  const platoonDefs = buildPlatoonSplits(side)
  const handednessBuckets = createBucketMap(handednessDefs)
  const platoonBuckets = createBucketMap(platoonDefs)

  for (const session of sessions) {
    for (const plateAppearance of groupPitchesIntoPlateAppearances(getSessionPitchesInGameOrder(session))) {
      const ending = plateAppearance[plateAppearance.length - 1]
      if (!ending || !plateAppearanceEnds(ending)) continue

      const battingSide = resolveBattingSide(session.battingFirst, ending.halfInning)
      const isSelfBatting = battingSide === 'self'
      const isSelfPitching = ending.pitchSide === 'self' && battingSide === 'opponent'

      if (side === 'batting' && !isSelfBatting) continue
      if (side === 'pitching' && !isSelfPitching) continue

      accumulateSplitPitch(COUNT_SPLITS, countBuckets, ending)
      accumulateSplitPitch(RUNNER_SPLITS, runnerBuckets, ending)
      accumulateSplitPitch(handednessDefs, handednessBuckets, ending)
      accumulateSplitPitch(platoonDefs, platoonBuckets, ending)
    }
  }

  return [
    finalizeSplitGroup(COUNT_SPLITS, countBuckets),
    finalizeSplitGroup(handednessDefs, handednessBuckets),
    finalizeSplitGroup(platoonDefs, platoonBuckets),
    finalizeSplitGroup(RUNNER_SPLITS, runnerBuckets),
  ].filter((group) => group.lines.length > 0)
}

export function computeSplitAnalysis(sessions: GameSession[]): SplitAnalysisResult {
  return {
    batting: computeSideSplits(sessions, 'batting'),
    pitching: computeSideSplits(sessions, 'pitching'),
  }
}