import type { SelfAnalysisSnapshot } from '../../analysisLogic'
import { AnalysisSplitSection } from './AnalysisSplitSection'
import { AnalysisStatCard } from './AnalysisStatCard'
import { ZoneAnalysisMap } from './ZoneAnalysisMap'

export function AnalysisPitchingTab({ snapshot }: { snapshot: SelfAnalysisSnapshot }) {
  const { pitching } = snapshot
  const unearnedRuns = Math.max(0, pitching.runsAllowed - pitching.earnedRuns)

  return (
    <>
      <section className="panel-card analysis-summary">
        <h2 className="analysis-section-title">投球成績</h2>
        <div className="analysis-stats-grid">
          <AnalysisStatCard
            label="防御率"
            value={pitching.era}
            detail={`自責${pitching.earnedRuns} · ${snapshot.header.inningsPitched}回`}
          />
          <AnalysisStatCard
            label="WHIP"
            value={pitching.whip}
            detail={`(被安打${pitching.hitsAllowed}+与四球${pitching.walksAllowed})÷回`}
          />
          <AnalysisStatCard
            label="奪三振"
            value={String(pitching.strikeouts)}
            detail={`K/9 ${pitching.strikeoutsPerNine}`}
          />
          <AnalysisStatCard
            label="与四死球"
            value={String(pitching.walksAllowed + pitching.hbpAllowed)}
            detail={`四球${pitching.walksAllowed} · 死球${pitching.hbpAllowed} · BB/9 ${pitching.walksPerNine}`}
          />
          <AnalysisStatCard label="被本塁打" value={String(pitching.homerunsAllowed)} detail={`被安打${pitching.hitsAllowed}`} />
        </div>
      </section>

      <section className="panel-card analysis-run-breakdown">
        <h2 className="analysis-section-title">失点 vs 自責点</h2>
        <div className="analysis-run-breakdown-grid">
          <div className="analysis-run-item">
            <span className="analysis-run-label">失点</span>
            <strong className="analysis-run-value">{pitching.runsAllowed}</strong>
          </div>
          <div className="analysis-run-item earned">
            <span className="analysis-run-label">自責点</span>
            <strong className="analysis-run-value">{pitching.earnedRuns}</strong>
          </div>
          <div className="analysis-run-item unearned">
            <span className="analysis-run-label">非自責点</span>
            <strong className="analysis-run-value">{unearnedRuns}</strong>
          </div>
        </div>
      </section>

      <AnalysisSplitSection
        title="状況別投球"
        subtitle="相手打席終了球のカウント・走者・左右の組み合わせごと（打数3未満は---）"
        groups={snapshot.splits.pitching}
        averageLabel="被打率"
      />

      <ZoneAnalysisMap
        title="コース別分析"
        subtitle="自分が投げた球で相手打席が終了したコースごと"
        zones={pitching.zoneAgainst}
        variant="pitching"
      />
    </>
  )
}
