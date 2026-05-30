import type { Count, Runners, RunnerBase, StealAttempt } from './types'

export function getOccupiedRunnerBases(runners: Runners): RunnerBase[] {
  const bases: RunnerBase[] = []
  if (runners.first) bases.push('first')
  if (runners.second) bases.push('second')
  if (runners.third) bases.push('third')
  return bases
}

export function getRunnerBaseLabel(base: RunnerBase): string {
  switch (base) {
    case 'first':
      return '1塁走者'
    case 'second':
      return '2塁走者'
    case 'third':
      return '3塁走者'
  }
}

/** 1塁+2塁のみで1塁単独、2塁+3塁のみで2塁単独の盗塁は不可 */
export function isStealSelectionAllowed(runners: Runners, selected: RunnerBase[]): boolean {
  if (selected.length === 0) return false
  if (!selected.every((base) => runners[base])) return false

  if (runners.first && runners.second && !runners.third) {
    if (selected.length === 1 && selected[0] === 'first') return false
  }
  if (runners.second && runners.third && !runners.first) {
    if (selected.length === 1 && selected[0] === 'second') return false
  }
  return true
}

export function isStealAttemptValid(
  runners: Runners,
  attempt: StealAttempt | null | undefined,
): boolean {
  if (!attempt || attempt.bases.length === 0) return false
  if (!isStealSelectionAllowed(runners, attempt.bases)) return false
  if (attempt.outcome === 'failed') {
    return attempt.outBase != null && attempt.bases.includes(attempt.outBase)
  }
  return true
}

function baseRank(base: RunnerBase): number {
  return base === 'first' ? 1 : base === 'second' ? 2 : 3
}

function advanceOneBase(runners: Runners, from: RunnerBase): { runners: Runners; runsScored: number } {
  const next = { ...runners }
  next[from] = false
  if (from === 'third') {
    return { runners: next, runsScored: 1 }
  }
  if (from === 'second') {
    next.third = true
    return { runners: next, runsScored: 0 }
  }
  next.second = true
  return { runners: next, runsScored: 0 }
}

export function applyStealSuccess(runners: Runners, bases: RunnerBase[]): { runners: Runners; runsScored: number } {
  let next = { ...runners }
  let runsScored = 0
  const ordered = [...bases].sort((a, b) => baseRank(b) - baseRank(a))

  for (const base of ordered) {
    if (!next[base]) continue
    const moved = advanceOneBase(next, base)
    next = moved.runners
    runsScored += moved.runsScored
  }

  return { runners: next, runsScored }
}

export function applyStealFailed(runners: Runners, outBase: RunnerBase): { runners: Runners; outsAdded: number } {
  return {
    runners: { ...runners, [outBase]: false },
    outsAdded: 1,
  }
}

export function applyStealAttempt(
  runners: Runners,
  count: Count,
  attempt: StealAttempt,
): { runners: Runners; count: Count; runsScored: number } {
  if (attempt.outcome === 'success') {
    const { runners: nextRunners, runsScored } = applyStealSuccess(runners, attempt.bases)
    return { runners: nextRunners, count, runsScored }
  }

  const outBase = attempt.outBase ?? attempt.bases[0]
  const { runners: nextRunners, outsAdded } = applyStealFailed(runners, outBase)
  return {
    runners: nextRunners,
    count: { ...count, outs: Math.min(count.outs + outsAdded, 3) },
    runsScored: 0,
  }
}

export function formatStealAttemptDisplay(attempt: StealAttempt): string {
  const bases = attempt.bases.map(getRunnerBaseLabel).join('・')
  if (attempt.outcome === 'success') {
    return `盗塁成功（${bases}）`
  }
  const outLabel = attempt.outBase ? getRunnerBaseLabel(attempt.outBase) : bases
  return `盗塁失敗（${outLabel}アウト）`
}
