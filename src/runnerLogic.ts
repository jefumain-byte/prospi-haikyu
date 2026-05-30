import type { OutTarget, PitchResult, Runners, RunnerBase } from './types'
import { applyOutTargets } from './outLogic'
import { applyRunnerAdvances } from './runnerAdvanceLogic'

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
  const next: Runners = { first: false, second: false, third: false }
  let runsScored = 0

  const advanceExisting = (fromBase: 1 | 2 | 3) => {
    const dest = fromBase + bases
    if (dest === 1) next.first = true
    else if (dest === 2) next.second = true
    else if (dest === 3) next.third = true
    else runsScored += 1
  }

  if (runners.first) advanceExisting(1)
  if (runners.second) advanceExisting(2)
  if (runners.third) advanceExisting(3)

  if (bases === 1) next.first = true
  else if (bases === 2) next.second = true
  else if (bases === 3) next.third = true

  return { runners: next, runsScored }
}

export function updateRunners(
  runners: Runners,
  result: PitchResult,
  atBatEnded: boolean,
  outsRecorded?: OutTarget[],
  runnersAdvanced?: RunnerBase[],
): RunnerUpdate {
  if (result === 'double_play') {
    const next = outsRecorded?.length
      ? applyOutTargets(runners, outsRecorded)
      : { ...runners, first: false }
    return { runners: next, runsScored: 0 }
  }

  if (!atBatEnded) {
    return { runners: cloneRunners(runners), runsScored: 0 }
  }

  switch (result) {
    case 'walk':
    case 'hbp':
      return forceWalk(runners)
    case 'single':
    case 'bunt':
    case 'error':
      return hitAdvance(runners, 1)
    case 'double':
      return hitAdvance(runners, 2)
    case 'triple':
      return hitAdvance(runners, 3)
    case 'homerun':
      return { runners: { ...EMPTY_RUNNERS }, runsScored: 1 + runnerCount(runners) }
    case 'groundout':
    case 'flyout':
    case 'liner': {
      let next = outsRecorded?.length ? applyOutTargets(runners, outsRecorded) : cloneRunners(runners)
      if (runnersAdvanced?.length) {
        const advanced = applyRunnerAdvances(next, runnersAdvanced)
        return { runners: advanced.runners, runsScored: advanced.runsScored }
      }
      return { runners: next, runsScored: 0 }
    }
    default:
      return { runners: cloneRunners(runners), runsScored: 0 }
  }
}
