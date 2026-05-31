import type { SelfAnalysisSnapshot } from '../../analysisLogic'
import { AnalysisStatCard } from './AnalysisStatCard'

export function AnalysisOverviewTab({ snapshot }: { snapshot: SelfAnalysisSnapshot }) {
  const { batting, pitching, win } = snapshot

  return (
    <>
      <section className="panel-card analysis-summary">
        <h2 className="analysis-section-title">成績概要</h2>
        <div className="analysis-stats-grid">
          <AnalysisStatCard
            label="打率"
            value={batting.battingAverage}
            detail={`${batting.hits}安打 / ${batting.atBats}打数`}
          />
          <AnalysisStatCard label="OPS" value={batting.ops} detail={`出塁${batting.onBasePercentage} + 長打${batting.sluggingPercentage}`} />
          <AnalysisStatCard label="勝率" value={win.winRate} detail={`${win.wins}勝 ${win.losses}敗`} />
          <AnalysisStatCard label="防御率" value={pitching.era} detail={`自責${pitching.earnedRuns} · ${snapshot.header.inningsPitched}回`} />
          <AnalysisStatCard
            label="WHIP"
            value={pitching.whip}
            detail={`被安打${pitching.hitsAllowed} · 与四球${pitching.walksAllowed}`}
          />
          <AnalysisStatCard
            label="出塁率"
            value={batting.onBasePercentage}
            detail={`四球${batting.walks} · 死球${batting.hbp}`}
          />
        </div>
      </section>
    </>
  )
}
