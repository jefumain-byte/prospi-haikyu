import { computeBattingAnalysis } from './battingAnalysisLogic'
import { formatSessionScore } from './gameLogic'
import { computePitchingAnalysis } from './pitchingAnalysisLogic'
import { getSessionPitchCount, getSessionUpdatedAt } from './storage'
import { formatAverage, formatEra, formatInningsPitched, inningsAsDecimal, NO_ERA, NO_STAT } from './statsFormat'
import type { GameSession } from './types'

export const TREND_GAME_LIMIT = 20

export interface GameAnalysisRow {
  sessionId: string
  label: string
  dateLabel: string
  finished: boolean
  resultLabel: string
  scoreLabel: string
  plateAppearances: number
  battingAverage: string
  inningsPitched: string
  era: string
  pitchCount: number
}

export interface TrendPoint {
  sessionId: string
  shortLabel: string
  value: number | null
  displayValue: string
}

export interface TrendSeries {
  id: 'battingAverage' | 'era'
  label: string
  points: TrendPoint[]
}

export interface GameAnalysisResult {
  games: GameAnalysisRow[]
  trends: TrendSeries[]
}

function formatAnalysisDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
  })
}

function formatGameResult(session: GameSession): string {
  if (session.finishedAt == null) return '記録中'
  if (session.selfScore > session.opponentScore) return '勝'
  if (session.selfScore < session.opponentScore) return '敗'
  return '分'
}

function numericAverage(hits: number, atBats: number): number | null {
  if (atBats <= 0) return null
  return hits / atBats
}

function numericEra(earnedRuns: number, outsRecorded: number): number | null {
  const innings = inningsAsDecimal(outsRecorded)
  if (innings <= 0) return null
  return (earnedRuns * 9) / innings
}

function computeGameRow(session: GameSession): GameAnalysisRow {
  const batting = computeBattingAnalysis([session])
  const pitching = computePitchingAnalysis([session])

  return {
    sessionId: session.id,
    label: session.label,
    dateLabel: formatAnalysisDate(getSessionUpdatedAt(session)),
    finished: session.finishedAt != null,
    resultLabel: formatGameResult(session),
    scoreLabel: formatSessionScore(session),
    plateAppearances: batting.plateAppearances,
    battingAverage: formatAverage(batting.hits, batting.atBats, 1),
    inningsPitched: formatInningsPitched(pitching.outsRecorded),
    era: formatEra(pitching.earnedRuns, pitching.outsRecorded),
    pitchCount: getSessionPitchCount(session),
  }
}

function buildTrendSeries(
  id: TrendSeries['id'],
  label: string,
  sessions: GameSession[],
): TrendSeries {
  const chronological = [...sessions].slice(0, TREND_GAME_LIMIT).reverse()

  const points: TrendPoint[] = chronological.map((session) => {
    const batting = computeBattingAnalysis([session])
    const pitching = computePitchingAnalysis([session])
    const shortLabel = formatAnalysisDate(getSessionUpdatedAt(session))

    if (id === 'battingAverage') {
      const value = numericAverage(batting.hits, batting.atBats)
      return {
        sessionId: session.id,
        shortLabel,
        value,
        displayValue: formatAverage(batting.hits, batting.atBats, 1),
      }
    }

    const value = numericEra(pitching.earnedRuns, pitching.outsRecorded)
    return {
      sessionId: session.id,
      shortLabel,
      value,
      displayValue: value == null ? NO_ERA : formatEra(pitching.earnedRuns, pitching.outsRecorded),
    }
  })

  return { id, label, points }
}

export function computeGameAnalysis(sessions: GameSession[]): GameAnalysisResult {
  const games = sessions.map(computeGameRow)

  return {
    games,
    trends: [
      buildTrendSeries('battingAverage', '打率', sessions),
      buildTrendSeries('era', '防御率', sessions),
    ],
  }
}
