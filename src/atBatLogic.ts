/**
 * 打数: 打席数から四死球・犠打・犠飛・打撃妨害・走塁妨害を除いたもの。
 * 打率・長打率などの分母として用いる。
 */
import { isFourBallWalk } from './countLogic'
import { atBatEnds, isBuntSacrifice } from './buntLogic'
import type { PitchRecord, PitchResult } from './types'

export function effectivePitchResult(pitch: PitchRecord): PitchResult {
  const primary = pitch.primaryResult ?? pitch.result
  if (isFourBallWalk(pitch.countBefore, primary)) return 'walk'
  return pitch.result
}

/** 打席が終了したか */
export function plateAppearanceEnds(pitch: PitchRecord): boolean {
  return atBatEnds(pitch.primaryResult ?? pitch.result, pitch.countBefore, pitch.extraResult)
}

/** 四球 */
export function isWalk(pitch: PitchRecord): boolean {
  return effectivePitchResult(pitch) === 'walk'
}

/** 死球 */
export function isHbp(pitch: PitchRecord): boolean {
  return effectivePitchResult(pitch) === 'hbp'
}

/** 四死球（四球・死球） */
export function isFourDeadBall(pitch: PitchRecord): boolean {
  return isWalk(pitch) || isHbp(pitch)
}

/** 犠打 */
export function isSacrificeBunt(pitch: PitchRecord): boolean {
  return isBuntSacrifice(pitch.primaryResult ?? pitch.result, pitch.extraResult)
}

/** 犠飛（飛球アウトで得点が記録された場合） */
export function isSacrificeFly(pitch: PitchRecord): boolean {
  if (effectivePitchResult(pitch) !== 'flyout') return false
  return (pitch.runsScored ?? 0) > 0
}

/** 打撃妨害 */
export function isBatterInterference(pitch: PitchRecord): boolean {
  return effectivePitchResult(pitch) === 'batter_interference'
}

/** 走塁妨害 */
export function isRunnerInterference(pitch: PitchRecord): boolean {
  return effectivePitchResult(pitch) === 'runner_interference'
}

/** 打数から除外する打席 */
export function excludesFromAtBatCount(pitch: PitchRecord): boolean {
  return (
    isFourDeadBall(pitch) ||
    isSacrificeBunt(pitch) ||
    isSacrificeFly(pitch) ||
    isBatterInterference(pitch) ||
    isRunnerInterference(pitch)
  )
}

/** 打数に数える打席か */
export function countsAsAtBat(pitch: PitchRecord): boolean {
  if (!plateAppearanceEnds(pitch)) return false
  return !excludesFromAtBatCount(pitch)
}

export function isHitForAverage(pitch: PitchRecord): boolean {
  const result = effectivePitchResult(pitch)
  return result === 'single' || result === 'double' || result === 'triple' || result === 'homerun'
}

export function groupPitchesIntoPlateAppearances(pitches: PitchRecord[]): PitchRecord[][] {
  const groups: PitchRecord[][] = []
  let current: PitchRecord[] = []

  for (const pitch of pitches) {
    const prevEnded =
      current.length > 0 && plateAppearanceEnds(current[current.length - 1]!)
    if (current.length === 0 || current[0]!.batterOrder !== pitch.batterOrder || prevEnded) {
      if (current.length > 0) groups.push(current)
      current = [pitch]
      continue
    }
    current.push(pitch)
  }

  if (current.length > 0) groups.push(current)
  return groups
}
