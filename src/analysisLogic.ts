import { computeBattingAnalysis, type BattingAnalysisResult, type ZoneStat } from './battingAnalysisLogic'
import { computePitchTypeAnalysis, type PitchTypeAnalysisResult } from './pitchTypeAnalysisLogic'
import { computePitchingAnalysis, type PitchingAnalysisResult } from './pitchingAnalysisLogic'
import { computeSplitAnalysis, type SplitAnalysisResult } from './splitAnalysisLogic'
import { getSessionPitchCount, getSessionUpdatedAt } from './storage'
import { formatInningsPitched, formatWinRate, zoneHeatLevel } from './statsFormat'
import type { GameSession } from './types'

export type { BattingAnalysisResult, ZoneStat } from './battingAnalysisLogic'
export type { PitchingAnalysisResult, ZoneAgainstStat } from './pitchingAnalysisLogic'
export type { PitchTypeAnalysisResult, PitchTypeGroupStat, PitchTypeSideAnalysis, PitchTypeStat } from './pitchTypeAnalysisLogic'
export type { SplitAnalysisResult, SplitGroup, SplitStatLine } from './splitAnalysisLogic'

export interface WinStats {
  wins: number
  losses: number
  winRate: string
}

export interface AnalysisHeaderStats {
  games: number
  plateAppearances: number
  inningsPitched: string
  outsRecorded: number
}

export interface SelfAnalysisSnapshot {
  header: AnalysisHeaderStats
  win: WinStats
  batting: BattingAnalysisResult
  pitching: PitchingAnalysisResult
  pitchTypes: PitchTypeAnalysisResult
  splits: SplitAnalysisResult
}

export function getAnalysisSessions(sessions: GameSession[], limit?: number): GameSession[] {
  const sorted = [...sessions]
    .filter((session) => getSessionPitchCount(session) > 0)
    .sort((a, b) => getSessionUpdatedAt(b) - getSessionUpdatedAt(a))
  return limit ? sorted.slice(0, limit) : sorted
}

function computeWinStats(sessions: GameSession[]): WinStats {
  let wins = 0
  let losses = 0

  for (const session of sessions) {
    if (session.finishedAt == null) continue
    if (session.selfScore > session.opponentScore) wins += 1
    else if (session.selfScore < session.opponentScore) losses += 1
  }

  return {
    wins,
    losses,
    winRate: formatWinRate(wins, losses),
  }
}

export function computeSelfAnalysis(sessions: GameSession[]): SelfAnalysisSnapshot {
  const batting = computeBattingAnalysis(sessions)
  const pitching = computePitchingAnalysis(sessions)
  const pitchTypes = computePitchTypeAnalysis(sessions)
  const splits = computeSplitAnalysis(sessions)

  return {
    header: {
      games: sessions.length,
      plateAppearances: batting.plateAppearances,
      inningsPitched: formatInningsPitched(pitching.outsRecorded),
      outsRecorded: pitching.outsRecorded,
    },
    win: computeWinStats(sessions),
    batting,
    pitching,
    pitchTypes,
    splits,
  }
}

export function getZoneStat(
  stats: ZoneStat[],
  row: number,
  col: number,
): ZoneStat | undefined {
  return stats.find((item) => item.row === row && item.col === col)
}

export { zoneHeatLevel }
