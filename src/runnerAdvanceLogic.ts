import { getOccupiedRunnerBases, getRunnerBaseLabel } from './stealLogic'
import type { OutTarget, PitchResult, Runners, RunnerBase } from './types'

const BATTER_OUT_RUNNER_ADVANCE_RESULTS: PitchResult[] = ['groundout', 'flyout', 'liner']

function runnerCount(runners: Runners): number {
  return Number(runners.first) + Number(runners.second) + Number(runners.third)
}

function baseRank(base: RunnerBase): number {
  return base === 'first' ? 1 : base === 'second' ? 2 : 3
}

export function requiresRunnerAdvanceSelection(
  runners: Runners,
  outs: number,
  gameResult: PitchResult,
): boolean {
  if (outs >= 2) return false
  if (runnerCount(runners) === 0) return false
  return BATTER_OUT_RUNNER_ADVANCE_RESULTS.includes(gameResult)
}

export function getAvailableRunnerAdvanceBases(
  runners: Runners,
  outsRecorded?: OutTarget[],
): RunnerBase[] {
  const outRunnerBases = new Set(
    (outsRecorded ?? []).filter((target): target is RunnerBase => target !== 'batter'),
  )
  return getOccupiedRunnerBases(runners).filter((base) => !outRunnerBases.has(base))
}

export function isRunnerAdvanceSelectionValid(
  runners: Runners,
  outs: number,
  gameResult: PitchResult,
  runnersAdvanced: RunnerBase[],
  outsRecorded?: OutTarget[],
): boolean {
  if (!requiresRunnerAdvanceSelection(runners, outs, gameResult)) return true
  if (runnersAdvanced.length === 0) return true

  const available = new Set(getAvailableRunnerAdvanceBases(runners, outsRecorded))
  if (new Set(runnersAdvanced).size !== runnersAdvanced.length) return false
  return runnersAdvanced.every((base) => available.has(base))
}

export function applyRunnerAdvances(
  runners: Runners,
  advanced: RunnerBase[],
): { runners: Runners; runsScored: number } {
  let next = { ...runners }
  let runsScored = 0
  const ordered = [...advanced].sort((a, b) => baseRank(b) - baseRank(a))

  for (const base of ordered) {
    if (!next[base]) continue
    next[base] = false
    if (base === 'third') {
      runsScored += 1
    } else if (base === 'second') {
      next.third = true
    } else {
      next.second = true
    }
  }

  return { runners: next, runsScored }
}

export function formatRunnerAdvanceSuffix(advanced?: RunnerBase[]): string {
  if (!advanced?.length) return ''
  const labels = advanced.map(getRunnerBaseLabel).join('・')
  return `（${labels}進塁）`
}
