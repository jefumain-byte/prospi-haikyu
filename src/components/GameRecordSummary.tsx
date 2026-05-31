import { useMemo } from 'react'
import { computeBattingAnalysis } from '../battingAnalysisLogic'
import { computePitchingAnalysis } from '../pitchingAnalysisLogic'
import { formatInningsPitched } from '../statsFormat'
import type { GameSession } from '../types'
import { AnalysisStatCard } from './analysis/AnalysisStatCard'

interface GameRecordSummaryProps {
  session: GameSession
}

export function GameRecordSummary({ session }: GameRecordSummaryProps) {
  const { batting, pitching, inningsPitched } = useMemo(() => {
    const battingStats = computeBattingAnalysis([session])
    const pitchingStats = computePitchingAnalysis([session])
    return {
      batting: battingStats,
      pitching: pitchingStats,
      inningsPitched: formatInningsPitched(pitchingStats.outsRecorded),
    }
  }, [session])

  const hasBatting = batting.plateAppearances > 0
  const hasPitching =
    pitching.outsRecorded > 0 ||
    pitching.earnedRuns > 0 ||
    pitching.runsAllowed > 0 ||
    pitching.strikeouts > 0 ||
    pitching.hitsAllowed > 0 ||
    pitching.walksAllowed > 0

  if (!hasBatting && !hasPitching) {
    return (
      <p className="records-summary-empty">この試合はまだ打席・投球の記録がありません</p>
    )
  }

  return (
    <div className="records-game-summary">
      {hasBatting ? (
        <section className="records-summary-section">
          <h2 className="records-summary-title">打撃</h2>
          <div className="analysis-stats-grid records-summary-grid">
            <AnalysisStatCard
              label="打率"
              value={batting.battingAverage}
              detail={`${batting.hits}安打 / ${batting.atBats}打数`}
            />
            <AnalysisStatCard
              label="OPS"
              value={batting.ops}
              detail={`出塁${batting.onBasePercentage} · 長打${batting.sluggingPercentage}`}
            />
            <AnalysisStatCard
              label="打席"
              value={`${batting.plateAppearances}`}
              detail={`三振${batting.strikeouts} · 四球${batting.walks} · 死球${batting.hbp}`}
            />
            <AnalysisStatCard
              label="本塁打"
              value={`${batting.homeruns}`}
              detail={batting.homeruns > 0 ? `${batting.hits}安打中` : '---'}
            />
          </div>
        </section>
      ) : null}

      {hasPitching ? (
        <section className="records-summary-section">
          <h2 className="records-summary-title">投球</h2>
          <div className="analysis-stats-grid records-summary-grid">
            <AnalysisStatCard
              label="防御率"
              value={pitching.era}
              detail={`自責${pitching.earnedRuns} · ${inningsPitched}回`}
            />
            <AnalysisStatCard
              label="自責点"
              value={`${pitching.earnedRuns}`}
              detail={`失点${pitching.runsAllowed} · ${inningsPitched}回`}
            />
            <AnalysisStatCard
              label="WHIP"
              value={pitching.whip}
              detail={`被安打${pitching.hitsAllowed} · 与四球${pitching.walksAllowed}`}
            />
            <AnalysisStatCard
              label="奪三振"
              value={`${pitching.strikeouts}`}
              detail={`K/9 ${pitching.strikeoutsPerNine}`}
            />
          </div>
        </section>
      ) : null}
    </div>
  )
}
