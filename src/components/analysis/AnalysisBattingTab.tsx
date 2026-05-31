import type { SelfAnalysisSnapshot } from '../../analysisLogic'
import { AnalysisSplitSection } from './AnalysisSplitSection'
import { AnalysisStatCard } from './AnalysisStatCard'
import { ZoneAnalysisMap } from './ZoneAnalysisMap'

export function AnalysisBattingTab({ snapshot }: { snapshot: SelfAnalysisSnapshot }) {
  const { batting } = snapshot

  return (
    <>
      <section className="panel-card analysis-summary">
        <h2 className="analysis-section-title">打撃成績</h2>
        <div className="analysis-stats-grid">
          <AnalysisStatCard
            label="打率"
            value={batting.battingAverage}
            detail={`${batting.hits}安打 / ${batting.atBats}打数`}
          />
          <AnalysisStatCard label="出塁率" value={batting.onBasePercentage} detail={`犠飛${batting.sacrificeFlies}`} />
          <AnalysisStatCard
            label="長打率"
            value={batting.sluggingPercentage}
            detail={`塁打${batting.totalBases} / ${batting.atBats}打数`}
          />
          <AnalysisStatCard label="OPS" value={batting.ops} detail="出塁率 + 長打率" />
          <AnalysisStatCard label="本塁打" value={String(batting.homeruns)} detail={`${batting.plateAppearances}打席`} />
          <AnalysisStatCard
            label="三振"
            value={String(batting.strikeouts)}
            detail={`三振率 ${batting.strikeoutRate}`}
          />
          <AnalysisStatCard
            label="四球"
            value={String(batting.walks)}
            detail={`四球率 ${batting.walkRate}`}
          />
          <AnalysisStatCard label="死球" value={String(batting.hbp)} detail={`打席${batting.plateAppearances}`} />
        </div>
      </section>

      <AnalysisSplitSection
        title="状況別打撃"
        subtitle="打席終了球のカウント・走者・左右の組み合わせごと（打数3未満は---）"
        groups={snapshot.splits.batting}
        averageLabel="打率"
      />

      <ZoneAnalysisMap
        title="コース別分析"
        subtitle="自分の打席が終了した球のコースごと"
        zones={batting.zoneBatting}
        variant="batting"
      />
    </>
  )
}
