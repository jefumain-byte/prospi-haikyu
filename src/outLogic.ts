import type { OutTarget, PitchResult, Runners } from './types'

function runnerCount(runners: Runners): number {
  return Number(runners.first) + Number(runners.second) + Number(runners.third)
}

export const FIELD_OUT_RESULTS: PitchResult[] = ['groundout', 'flyout', 'liner', 'double_play']

export function getOutTargetLabel(target: OutTarget, batterLabel = '打者'): string {
  switch (target) {
    case 'batter':
      return batterLabel
    case 'first':
      return '1塁走者'
    case 'second':
      return '2塁走者'
    case 'third':
      return '3塁走者'
  }
}

export function getAvailableOutTargets(runners: Runners): OutTarget[] {
  const targets: OutTarget[] = ['batter']
  if (runners.first) targets.push('first')
  if (runners.second) targets.push('second')
  if (runners.third) targets.push('third')
  return targets
}

export function requiresOutSelection(
  runners: Runners,
  gameResult: PitchResult,
  extraResult?: PitchResult | null,
  primaryResult?: PitchResult,
): boolean {
  const primary = primaryResult ?? gameResult
  if (extraResult === 'bunt' && (primary === 'flyout' || primary === 'liner')) return false
  if (runnerCount(runners) < 2) return false
  if (gameResult === 'double_play') return true
  return ['groundout', 'flyout', 'liner'].includes(gameResult)
}

export function requiredOutSelectionCount(gameResult: PitchResult): number {
  return gameResult === 'double_play' ? 2 : 1
}

export function isOutSelectionValid(
  outsRecorded: OutTarget[],
  gameResult: PitchResult,
  runners: Runners,
  extraResult?: PitchResult | null,
  primaryResult?: PitchResult,
): boolean {
  if (!requiresOutSelection(runners, gameResult, extraResult, primaryResult)) return true

  const required = requiredOutSelectionCount(gameResult)
  const available = new Set(getAvailableOutTargets(runners))
  if (outsRecorded.length !== required) return false
  if (new Set(outsRecorded).size !== outsRecorded.length) return false
  return outsRecorded.every((target) => available.has(target))
}

export function applyOutTargets(runners: Runners, outsRecorded: OutTarget[]): Runners {
  const next = { ...runners }
  for (const target of outsRecorded) {
    if (target === 'first') next.first = false
    if (target === 'second') next.second = false
    if (target === 'third') next.third = false
  }
  return next
}

export function formatOutTargetsSuffix(
  outsRecorded: OutTarget[] | undefined,
  batterLabel: string,
): string {
  if (!outsRecorded?.length) return ''
  const labels = outsRecorded.map((target) => getOutTargetLabel(target, batterLabel))
  return `（${labels.join('・')}）`
}
