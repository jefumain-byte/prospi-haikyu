import { isBuntSacrifice } from './buntLogic'
import { getOccupiedRunnerBases, getRunnerBaseLabel } from './stealLogic'
import type { OutTarget, PitchRecord, PitchResult, Runners, RunnerAdvanceRecord, RunnerBase, RunnerDestination } from './types'

const RUNNER_ADVANCE_SELECT_RESULTS: PitchResult[] = [
  'single',
  'double',
  'triple',
  'groundout',
  'flyout',
  'liner',
]

function runnerCount(runners: Runners): number {
  return Number(runners.first) + Number(runners.second) + Number(runners.third)
}

function baseRank(base: RunnerBase): number {
  return base === 'first' ? 1 : base === 'second' ? 2 : 3
}

function hitBases(result: PitchResult): number {
  if (result === 'single') return 1
  if (result === 'double') return 2
  if (result === 'triple') return 3
  return 0
}

function advanceDestination(from: RunnerBase, bases: number): RunnerDestination {
  const rank = baseRank(from) + bases
  if (rank >= 4) return 'home'
  if (rank === 3) return 'third'
  if (rank === 2) return 'second'
  return 'first'
}

export function getBatterDestinationForHit(gameResult: PitchResult): RunnerDestination | undefined {
  if (gameResult === 'single') return 'first'
  if (gameResult === 'double') return 'second'
  if (gameResult === 'triple') return 'third'
  return undefined
}

export function getDestinationLabel(to: RunnerDestination): string {
  switch (to) {
    case 'first':
      return '1塁'
    case 'second':
      return '2塁'
    case 'third':
      return '3塁'
    case 'home':
      return '本塁'
  }
}

export function getDestinationOptions(from: RunnerBase): RunnerDestination[] {
  const options: RunnerDestination[] = []
  if (baseRank(from) <= 1) options.push('first')
  if (baseRank(from) <= 2) options.push('second')
  if (baseRank(from) <= 3) options.push('third')
  options.push('home')
  return options
}

export function requiresRunnerAdvanceSelection(
  runners: Runners,
  _outs: number,
  gameResult: PitchResult,
  extraResult?: PitchResult | null,
  primaryResult?: PitchResult,
): boolean {
  if (isBuntSacrifice(primaryResult ?? gameResult, extraResult)) return false
  if (runnerCount(runners) === 0) return false
  return RUNNER_ADVANCE_SELECT_RESULTS.includes(gameResult)
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

export function getDefaultRunnerAdvances(
  runners: Runners,
  gameResult: PitchResult,
  outsRecorded?: OutTarget[],
): RunnerAdvanceRecord[] {
  const bases = getAvailableRunnerAdvanceBases(runners, outsRecorded)
  const hitBaseCount = hitBases(gameResult)
  if (hitBaseCount > 0) {
    return bases.map((from) => ({ from, to: advanceDestination(from, hitBaseCount) }))
  }
  return bases.map((from) => ({ from, to: from }))
}

export function isRunnerAdvanceSelectionValid(
  runners: Runners,
  outs: number,
  gameResult: PitchResult,
  runnerAdvances: RunnerAdvanceRecord[],
  outsRecorded?: OutTarget[],
  extraResult?: PitchResult | null,
  primaryResult?: PitchResult,
): boolean {
  if (!requiresRunnerAdvanceSelection(runners, outs, gameResult, extraResult, primaryResult)) return true

  const available = getAvailableRunnerAdvanceBases(runners, outsRecorded)
  if (available.length === 0) return true

  if (runnerAdvances.length !== available.length) return false

  const availableSet = new Set(available)
  const occupiedBases = new Set<RunnerDestination>()

  for (const entry of runnerAdvances) {
    if (!availableSet.has(entry.from)) return false
    const options = getDestinationOptions(entry.from)
    if (!options.includes(entry.to)) return false
    if (entry.to !== 'home') {
      if (occupiedBases.has(entry.to)) return false
      occupiedBases.add(entry.to)
    }
  }

  const batterTo = getBatterDestinationForHit(gameResult)
  if (batterTo && batterTo !== 'home' && occupiedBases.has(batterTo)) return false

  return true
}

export function legacyRunnersAdvancedToRecords(bases: RunnerBase[]): RunnerAdvanceRecord[] {
  return bases.map((from) => ({ from, to: advanceDestination(from, 1) }))
}

/** @deprecated 旧形式（1塁進塁トグル） */
export function applyRunnerAdvances(
  runners: Runners,
  advanced: RunnerBase[],
): { runners: Runners; runsScored: number } {
  return applyRunnerAdvanceRecords(runners, legacyRunnersAdvancedToRecords(advanced))
}

export function applyRunnerAdvanceRecords(
  _runners: Runners,
  advances: RunnerAdvanceRecord[],
  batterTo?: RunnerDestination,
): { runners: Runners; runsScored: number } {
  const next: Runners = { first: false, second: false, third: false }
  let runsScored = 0

  for (const { to } of advances) {
    if (to === 'home') runsScored += 1
    else next[to] = true
  }

  if (batterTo) {
    if (batterTo === 'home') runsScored += 1
    else next[batterTo] = true
  }

  return { runners: next, runsScored }
}

export function resolvePitchRunnerAdvances(pitch: Pick<PitchRecord, 'runnerAdvances' | 'runnersAdvanced'>): RunnerAdvanceRecord[] | undefined {
  if (pitch.runnerAdvances?.length) return pitch.runnerAdvances
  if (pitch.runnersAdvanced?.length) return legacyRunnersAdvancedToRecords(pitch.runnersAdvanced)
  return undefined
}

export function formatRunnerAdvanceSuffix(
  advances?: RunnerAdvanceRecord[],
  legacyAdvanced?: RunnerBase[],
): string {
  if (advances?.length) {
    const parts = advances.map(({ from, to }) => `${getRunnerBaseLabel(from)}→${getDestinationLabel(to)}`)
    return `（${parts.join('・')}）`
  }
  if (legacyAdvanced?.length) {
    return `（${legacyAdvanced.map(getRunnerBaseLabel).join('・')}進塁）`
  }
  return ''
}
