import { applyOutTargets } from './outLogic'
import { applyRunnerAdvances } from './runnerAdvanceLogic'
import { runnerCount, type RunnerUpdate } from './runnerLogic'
import { getOccupiedRunnerBases } from './stealLogic'
import type { OutTarget, Runners } from './types'

/** 0アウト・走者2人以上のダブルプレー: 安全な走者と打者が1塁進塁 */
export function usesDoublePlaySafeAdvanceRule(outsBefore: number, runners: Runners): boolean {
  return outsBefore === 0 && runnerCount(runners) >= 2
}

export function applyDoublePlayRunners(
  runners: Runners,
  outsRecorded: OutTarget[] | undefined,
  outsBefore: number,
): RunnerUpdate {
  if (!outsRecorded?.length) {
    return { runners: { ...runners, first: false }, runsScored: 0 }
  }

  if (!usesDoublePlaySafeAdvanceRule(outsBefore, runners) || outsRecorded.length !== 2) {
    return { runners: applyOutTargets(runners, outsRecorded), runsScored: 0 }
  }

  const batterOut = outsRecorded.includes('batter')
  const afterOuts = applyOutTargets(runners, outsRecorded)
  const safeBases = getOccupiedRunnerBases(afterOuts)
  const advanced =
    safeBases.length > 0
      ? applyRunnerAdvances(afterOuts, safeBases)
      : { runners: afterOuts, runsScored: 0 }

  if (!batterOut) {
    return { runners: { ...advanced.runners, first: true }, runsScored: advanced.runsScored }
  }

  return advanced
}
