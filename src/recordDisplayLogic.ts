import { getBatterHandLabel, getPitcherArmLabel } from './constants'
import type { Count, PitchRecord, Runners } from './types'

export function formatRecordCount(count: Count): string {
  return `${count.balls}B-${count.strikes}S-${count.outs}O`
}

export function formatRunnersBefore(runners: Runners): string {
  const bases: string[] = []
  if (runners.first) bases.push('1塁')
  if (runners.second) bases.push('2塁')
  if (runners.third) bases.push('3塁')
  return bases.length > 0 ? bases.join(' · ') : '走者なし'
}

export function formatHandMatchup(
  pitch: Pick<PitchRecord, 'batterHand' | 'pitcherArm'>,
): string {
  return `${getBatterHandLabel(pitch.batterHand)} vs ${getPitcherArmLabel(pitch.pitcherArm)}`
}

export function formatScoreBefore(pitch: PitchRecord): string | null {
  if (pitch.selfScoreBefore == null || pitch.opponentScoreBefore == null) return null
  return `${pitch.selfScoreBefore}-${pitch.opponentScoreBefore}`
}

export function sumHalfInningRuns(pitches: PitchRecord[]): {
  selfRuns: number
  opponentRuns: number
} {
  let selfRuns = 0
  let opponentRuns = 0
  for (const pitch of pitches) {
    const runs = pitch.runsScored ?? 0
    if (runs <= 0) continue
    if (pitch.scoringSide === 'self') selfRuns += runs
    else if (pitch.scoringSide === 'opponent') opponentRuns += runs
  }
  return { selfRuns, opponentRuns }
}

export function formatHalfInningRunLabel(selfRuns: number, opponentRuns: number): string | null {
  if (selfRuns <= 0 && opponentRuns <= 0) return null
  const parts: string[] = []
  if (selfRuns > 0) parts.push(`自分+${selfRuns}`)
  if (opponentRuns > 0) parts.push(`相手+${opponentRuns}`)
  return parts.join(' · ')
}

export function formatZoneShort(pitch: Pick<PitchRecord, 'row' | 'col' | 'zoneLabel'>): string {
  return `${pitch.zoneLabel} (${pitch.row},${pitch.col})`
}
