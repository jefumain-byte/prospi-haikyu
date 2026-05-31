import type { PitchTypeGroupStat, PitchTypeSideAnalysis, SelfAnalysisSnapshot } from '../../analysisLogic'
import { MIN_RATE_SAMPLE } from '../../statsFormat'

function PitchTypeGroupAccordion({
  group,
  averageLabel,
  defaultOpen = false,
}: {
  group: PitchTypeGroupStat
  averageLabel: string
  defaultOpen?: boolean
}) {
  return (
    <details className="analysis-pitch-type-group" open={defaultOpen}>
      <summary className="analysis-pitch-type-group-summary">
        <span className="analysis-pitch-type-group-name">{group.group}</span>
        <span className="analysis-pitch-type-group-metrics">
          <span className="analysis-pitch-type-metric">
            <span className="analysis-pitch-type-metric-label">使用率</span>
            <strong>{group.usageRate}</strong>
          </span>
          <span className="analysis-pitch-type-metric">
            <span className="analysis-pitch-type-metric-label">{averageLabel}</span>
            <strong>{group.average}</strong>
          </span>
          <span className="analysis-pitch-type-metric">
            <span className="analysis-pitch-type-metric-label">球数</span>
            <strong>{group.pitchCount}</strong>
          </span>
        </span>
      </summary>

      <div className="analysis-pitch-type-table-wrap">
        <table className="analysis-pitch-type-table">
          <thead>
            <tr>
              <th scope="col">球種</th>
              <th scope="col">使用率</th>
              <th scope="col">打数</th>
              <th scope="col">{averageLabel}</th>
            </tr>
          </thead>
          <tbody>
            {group.types.map((row) => (
              <tr key={row.pitchType}>
                <td>{row.label}</td>
                <td>
                  {row.usageRate}
                  <span className="analysis-pitch-type-sub">{row.pitchCount}球</span>
                </td>
                <td>
                  {row.atBats > 0 ? `${row.hits}/${row.atBats}` : '---'}
                  {row.atBats > 0 && row.atBats < MIN_RATE_SAMPLE ? (
                    <span className="analysis-pitch-type-sub">n={row.atBats}</span>
                  ) : null}
                </td>
                <td>{row.average}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}

function PitchTypeSidePanel({
  title,
  subtitle,
  side,
  averageLabel,
}: {
  title: string
  subtitle: string
  side: PitchTypeSideAnalysis
  averageLabel: string
}) {
  if (side.pitchTotal === 0) {
    return (
      <section className="panel-card analysis-pitch-type-section">
        <h2 className="analysis-section-title">{title}</h2>
        <p className="analysis-empty-section">{subtitle} — データなし</p>
      </section>
    )
  }

  return (
    <section className="panel-card analysis-pitch-type-section">
      <div className="analysis-zone-head">
        <h2 className="analysis-section-title">{title}</h2>
        <p>{subtitle}</p>
        <p className="analysis-pitch-type-total">全{side.pitchTotal}球 · {side.byType.length}球種</p>
      </div>

      <div className="analysis-pitch-type-groups">
        {side.byGroup.map((group, index) => (
          <PitchTypeGroupAccordion
            key={group.group}
            group={group}
            averageLabel={averageLabel}
            defaultOpen={index === 0}
          />
        ))}
      </div>
    </section>
  )
}

export function AnalysisPitchTypeTab({ snapshot }: { snapshot: SelfAnalysisSnapshot }) {
  const { pitchTypes } = snapshot

  return (
    <>
      <PitchTypeSidePanel
        title="打席での球種別打率"
        subtitle="自分の打席で投げられた球種（全投球の使用率 · 打席終了球ベースの打率）"
        side={pitchTypes.batting}
        averageLabel="打率"
      />
      <PitchTypeSidePanel
        title="投球の球種別被打率"
        subtitle="自分が投げた球種（全投球の使用率 · 相手打席終了球ベースの被打率）"
        side={pitchTypes.pitching}
        averageLabel="被打率"
      />
    </>
  )
}
