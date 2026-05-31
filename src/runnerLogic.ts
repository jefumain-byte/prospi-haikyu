import type { OutTarget, PitchResult, Runners, RunnerAdvanceRecord } from './types'
import { applyDoublePlayRunners } from './doublePlayLogic'
import { applyOutTargets } from './outLogic'
import {
  applyRunnerAdvanceRecords,
  getBatterDestinationForHit,
  getDefaultRunnerAdvances,
} from './runnerAdvanceLogic'

export const EMPTY_RUNNERS: Runners = { first: false, second: false, third: false }

export function cloneRunners(runners: Runners): Runners {
  return { ...runners }
}

export function runnerCount(runners: Runners): number {
  return Number(runners.first) + Number(runners.second) + Number(runners.third)
}

export interface RunnerUpdate {
  runners: Runners
  runsScored: number
}

function forceWalk(runners: Runners): RunnerUpdate {
  if (!runners.first) {
    return { runners: { ...runners, first: true }, runsScored: 0 }
  }
  if (!runners.second) {
    return { runners: { first: true, second: true, third: runners.third }, runsScored: 0 }
  }
  if (!runners.third) {
    return { runners: { first: true, second: true, third: true }, runsScored: 0 }
  }
  return { runners: { first: true, second: true, third: true }, runsScored: 1 }
}

function hitAdvance(runners: Runners, bases: number): RunnerUpdate {
  const advances = getDefaultRunnerAdvances(runners, bases === 1 ? 'single' : bases === 2 ? 'double' : 'triple')
  const batterTo = getBatterDestinationForHit(bases === 1 ? 'single' : bases === 2 ? 'double' : 'triple')
  return applyRunnerAdvanceRecords(runners, advances, batterTo)
}

function applyOutWithRunnerAdvances(
  runners: Runners,
  outsRecorded: OutTarget[] | undefined,
  runnerAdvances: RunnerAdvanceRecord[] | undefined,
  gameResult: PitchResult,
): RunnerUpdate {
  const afterOuts = outsRecorded?.length ? applyOutTargets(runners, outsRecorded) : cloneRunners(runners)
  const records = runnerAdvances?.length
    ? runnerAdvances
    : getDefaultRunnerAdvances(runners, gameResult, outsRecorded)
  return applyRunnerAdvanceRecords(afterOuts, records)
}

export function updateRunners(
  runners: Runners,
  result: PitchResult,
  atBatEnded: boolean,
  outsRecorded?: OutTarget[],
  runnerAdvances?: RunnerAdvanceRecord[],
  outsBefore = 0,
): RunnerUpdate {
  if (result === 'double_play') {
    return applyDoublePlayRunners(runners, outsRecorded, outsBefore)
  }

  if (!atBatEnded) {
    return { runners: cloneRunners(runners), runsScored: 0 }
  }

  switch (result) {
    case 'walk':
    case 'hbp':
      return forceWalk(runners)
    case 'single':
    case 'double':
    case 'triple': {
      const batterTo = getBatterDestinationForHit(result)
      const records = runnerAdvances?.length
        ? runnerAdvances
        : getDefaultRunnerAdvances(runners, result, outsRecorded)
      return applyRunnerAdvanceRecords(runners, records, batterTo)
    }
    case 'error':
      return hitAdvance(runners, 1)
    case 'homerun':
      return { runners: { ...EMPTY_RUNNERS }, runsScored: 1 + runnerCount(runners) }
    case 'groundout':
    case 'flyout':
    case 'liner':
      return applyOutWithRunnerAdvances(runners, outsRecorded, runnerAdvances, result)
    default:
      return { runners: cloneRunners(runners), runsScored: 0 }
  }
}
