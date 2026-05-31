import { applyOutTargets } from './outLogic'
import { applyRunnerAdvanceRecords } from './runnerAdvanceLogic'
import { cloneRunners, type RunnerUpdate } from './runnerLogic'
import { getOccupiedRunnerBases } from './stealLogic'
import type { Count, OutTarget, PitchRecord, PitchResult, Runners, RunnerAdvanceRecord, RunnerBase } from './types'

const BUNT_VALID_PRIMARY_RESULTS: PitchResult[] = ['foul', 'groundout', 'flyout', 'liner']

export function isBuntAttempt(extraResult?: PitchResult | null): boolean {
  return extraResult === 'bunt'
}

export function isBuntFoul(primaryResult: PitchResult, extraResult?: PitchResult | null): boolean {
  return extraResult === 'bunt' && primaryResult === 'foul'
}

/** 犠打バント（走者全員1塁進塁）: ゴロアウト + バントのみ */
export function isBuntSacrifice(primaryResult: PitchResult, extraResult?: PitchResult | null): boolean {
  return extraResult === 'bunt' && primaryResult === 'groundout'
}

/** フライ・ライナーバント: 打者のみアウト（走者は進塁選択時のみ動く） */
export function isBuntBatterOutOnly(primaryResult: PitchResult, extraResult?: PitchResult | null): boolean {
  return extraResult === 'bunt' && (primaryResult === 'flyout' || primaryResult === 'liner')
}

export function isBuntExtraValid(primaryResult: PitchResult, extraResult?: PitchResult | null): boolean {
  if (extraResult !== 'bunt') return true
  return BUNT_VALID_PRIMARY_RESULTS.includes(primaryResult)
}

export function isTwoStrikeBuntFoulOut(countBefore: Count): boolean {
  return countBefore.strikes >= 2
}

/** 2ストライクからのバントファウルで打者アウト（スリーバント失敗） */
export function isThreeBuntFailure(
  pitch: Pick<PitchRecord, 'primaryResult' | 'extraResult' | 'countBefore' | 'result'>,
): boolean {
  const primary = pitch.primaryResult ?? pitch.result
  return isBuntFoul(primary, pitch.extraResult) && isTwoStrikeBuntFoulOut(pitch.countBefore)
}

/** バントファウル: 2ストライク未満はストライク+1、2ストライクからは打者アウト */
export function applyBuntFoulCount(countBefore: Count): Count {
  if (isTwoStrikeBuntFoulOut(countBefore)) {
    return { balls: 0, strikes: 0, outs: Math.min(countBefore.outs + 1, 3) }
  }
  return { balls: countBefore.balls, strikes: countBefore.strikes + 1, outs: countBefore.outs }
}

/** 犠打: 走者全員1塁進塁、打者はアウト（塁上に残らない） */
export function applySacrificeBuntRunners(
  runners: Runners,
  outsRecorded?: OutTarget[],
): RunnerUpdate {
  const afterOuts = outsRecorded?.length ? applyOutTargets(runners, outsRecorded) : cloneRunners(runners)
  const bases = getOccupiedRunnerBases(afterOuts)
  if (bases.length === 0) {
    return { runners: afterOuts, runsScored: 0 }
  }
  return applyRunnerAdvanceRecords(afterOuts, bases.map((from) => ({ from, to: advanceDestination(from, 1) })))
}

function advanceDestination(from: RunnerBase, bases: number): 'first' | 'second' | 'third' | 'home' {
  const rank = (from === 'first' ? 1 : from === 'second' ? 2 : 3) + bases
  if (rank >= 4) return 'home'
  if (rank === 3) return 'third'
  if (rank === 2) return 'second'
  return 'first'
}

/** フライ/ライナーバント: 走者はそのまま（進塁選択があれば適用） */
export function applyBuntBatterOutRunners(
  runners: Runners,
  runnerAdvances?: RunnerAdvanceRecord[],
): RunnerUpdate {
  const next = cloneRunners(runners)
  if (runnerAdvances?.length) {
    return applyRunnerAdvanceRecords(next, runnerAdvances)
  }
  return { runners: next, runsScored: 0 }
}

export function resolveEffectiveGameResult(
  primaryResult: PitchResult,
  extraResult?: PitchResult | null,
): PitchResult {
  if (!extraResult || extraResult === 'steal' || extraResult === 'bunt') return primaryResult
  return extraResult
}

export function atBatEnds(
  primaryResult: PitchResult,
  countBefore: Count,
  extraResult?: PitchResult | null,
): boolean {
  if (isBuntFoul(primaryResult, extraResult)) {
    return isTwoStrikeBuntFoulOut(countBefore)
  }

  const result = resolveEffectiveGameResult(primaryResult, extraResult)
  switch (result) {
    case 'groundout':
    case 'flyout':
    case 'liner':
    case 'double_play':
    case 'walk':
    case 'hbp':
    case 'single':
    case 'double':
    case 'triple':
    case 'homerun':
    case 'error':
    case 'batter_interference':
    case 'runner_interference':
      return true
    case 'called_strike':
    case 'swinging_strike':
      return countBefore.strikes >= 2
    case 'ball':
      return countBefore.balls >= 3
    case 'foul':
    case 'steal':
      return false
    default:
      return false
  }
}
