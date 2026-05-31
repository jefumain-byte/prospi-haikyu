/**
 * 自責点の判定は公認野球規則 9.16（NPB公式記録要項）に基づく。
 * - 安打・犠打・犠飛・盗塁・刺殺・四死球・暴投等による得点
 * - 守備失策・捕逸・妨害等は自責点に含めない
 * - 「アウトの機会」が3回ある以降の得点は自責点にしない
 */
import { isFourBallWalk } from './countLogic'
import { resolveBattingSide } from './gameLogic'
import {
  atBatEnds,
  isBuntSacrifice,
  isThreeBuntFailure,
} from './buntLogic'
import { groupSessionPitchesByHalfInning } from './storage'
import type { GameSession, PitchRecord, PitchResult } from './types'

function pitchEndsAtBat(pitch: PitchRecord): boolean {
  return atBatEnds(pitch.primaryResult ?? pitch.result, pitch.countBefore, pitch.extraResult)
}

function effectiveResult(pitch: PitchRecord): PitchResult {
  const primary = pitch.primaryResult ?? pitch.result
  if (isFourBallWalk(pitch.countBefore, primary)) return 'walk'
  return pitch.result
}

function isHitResult(result: PitchResult): boolean {
  return result === 'single' || result === 'double' || result === 'triple' || result === 'homerun'
}

function isWalk(pitch: PitchRecord): boolean {
  return effectiveResult(pitch) === 'walk'
}

function isHbp(pitch: PitchRecord): boolean {
  return effectiveResult(pitch) === 'hbp'
}

function isSacrificeFly(pitch: PitchRecord): boolean {
  if (effectiveResult(pitch) !== 'flyout') return false
  return (pitch.runsScored ?? 0) > 0
}

function isSacrificeBunt(pitch: PitchRecord): boolean {
  return isBuntSacrifice(pitch.primaryResult ?? pitch.result, pitch.extraResult)
}

function isReachOnError(pitch: PitchRecord): boolean {
  return pitchEndsAtBat(pitch) && effectiveResult(pitch) === 'error'
}

function outsOnPitch(pitch: PitchRecord): number {
  if (!pitchEndsAtBat(pitch)) {
    if (pitch.stealAttempt?.outcome === 'failed') return 1
    return 0
  }
  const result = effectiveResult(pitch)
  if (result === 'double_play') return 2
  if (isSacrificeBunt(pitch) || isThreeBuntFailure(pitch)) return 1
  if (isWalk(pitch) || isHbp(pitch) || isHitResult(result)) return 0
  if (['groundout', 'flyout', 'liner', 'called_strike', 'swinging_strike'].includes(result)) return 1
  return 0
}

/** 9.16: アウトの機会の増分 */
function outOpportunitiesAddedByPitch(pitch: PitchRecord): number {
  if (isReachOnError(pitch)) return 1
  return outsOnPitch(pitch)
}

function opponentRunsOnPitch(pitch: PitchRecord): number {
  if ((pitch.runsScored ?? 0) <= 0) return 0
  if (pitch.scoringSide !== 'opponent') return 0
  return pitch.runsScored ?? 0
}

function isExtraBaseHit(result: PitchResult): boolean {
  return result === 'double' || result === 'triple' || result === 'homerun'
}

/**
 * 失策後の進塁得点（9.16d）: エラー以降の単打・四死球のみの得点は非自責とみなす。
 * 長打以上であれば自責点とする。
 */
function runsUnearnedDespiteCleanOpportunities(
  pitch: PitchRecord,
  errorOccurredInHalf: boolean,
): boolean {
  if (!errorOccurredInHalf) return false
  const result = effectiveResult(pitch)
  if (isExtraBaseHit(result)) return false
  if (isSacrificeFly(pitch) || isSacrificeBunt(pitch)) return false
  if (result === 'error') return true
  if (result === 'single' || result === 'walk' || result === 'hbp') return true
  return false
}

function classifyEarnedRunsOnPitch(
  pitch: PitchRecord,
  outOpportunitiesBefore: number,
  errorOccurredInHalf: boolean,
): number {
  const runs = opponentRunsOnPitch(pitch)
  if (runs <= 0) return 0

  if (outOpportunitiesBefore >= 3) return 0
  if (effectiveResult(pitch) === 'error') return 0
  if (runsUnearnedDespiteCleanOpportunities(pitch, errorOccurredInHalf)) return 0

  return runs
}

function computeEarnedRunsForHalfInning(pitches: PitchRecord[]): number {
  let outOpportunities = 0
  let errorOccurredInHalf = false
  let earned = 0

  for (const pitch of pitches) {
    if (pitch.pitchSide !== 'self') continue

    earned += classifyEarnedRunsOnPitch(pitch, outOpportunities, errorOccurredInHalf)

    if (effectiveResult(pitch) === 'error') {
      errorOccurredInHalf = true
    }

    outOpportunities += outOpportunitiesAddedByPitch(pitch)
  }

  return earned
}

export function computeSelfPitchingEarnedRuns(session: GameSession): number {
  let earned = 0

  for (const group of groupSessionPitchesByHalfInning(session)) {
    if (group.pitches.length === 0) continue
    const battingSide = resolveBattingSide(session.battingFirst, group.pitches[0]!.halfInning)
    if (battingSide !== 'opponent') continue
    earned += computeEarnedRunsForHalfInning(group.pitches)
  }

  return earned
}

export function computeSelfPitchingOuts(session: GameSession): number {
  let outs = 0
  for (const pitch of session.batters.flatMap((batter) => batter.pitches)) {
    if (pitch.pitchSide !== 'self') continue
    outs += outsOnPitch(pitch)
  }
  return outs
}
