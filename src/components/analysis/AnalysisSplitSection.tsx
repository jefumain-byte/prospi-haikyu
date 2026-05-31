import type { SplitGroup } from '../../analysisLogic'
import { MIN_RATE_SAMPLE } from '../../statsFormat'

interface AnalysisSplitSectionProps {
  title: string
  subtitle: string
  groups: SplitGroup[]
  averageLabel: string
}

function SplitGroupAccordion({
  group,
  averageLabel,
  defaultOpen = false,
}: {
  group: SplitGroup
  averageLabel: string
  defaultOpen?: boolean
}) {
  return (
    <details className="analysis-split-group" open={defaultOpen}>
      <summary className="analysis-split-group-summary">{group.title}</summary>
      <div className="analysis-split-table-wrap">
        <table className="analysis-split-table">
          <thead>
            <tr>
              <th scope="col">状況</th>
              <th scope="col">打席</th>
              <th scope="col">打数</th>
              <th scope="col">{averageLabel}</th>
              <th scope="col">長打率</th>
            </tr>
          </thead>
          <tbody>
            {group.lines.map((line) => (
              <tr key={line.id}>
                <td>{line.label}</td>
                <td>{line.plateAppearances}</td>
                <td>
                  {line.atBats > 0 ? `${line.hits}/${line.atBats}` : '---'}
                  {line.atBats > 0 && line.atBats < MIN_RATE_SAMPLE ? (
                    <span className="analysis-split-sub">n={line.atBats}</span>
                  ) : null}
                </td>
                <td>{line.average}</td>
                <td>{line.slugging}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}

export function AnalysisSplitSection({ title, subtitle, groups, averageLabel }: AnalysisSplitSectionProps) {
  if (groups.length === 0) {
    return (
      <section className="panel-card analysis-split-section">
        <h2 className="analysis-section-title">{title}</h2>
        <p className="analysis-empty-section">{subtitle} — データなし</p>
      </section>
    )
  }

  return (
    <section className="panel-card analysis-split-section">
      <div className="analysis-zone-head">
        <h2 className="analysis-section-title">{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="analysis-split-groups">
        {groups.map((group, index) => (
          <SplitGroupAccordion
            key={group.id}
            group={group}
            averageLabel={averageLabel}
            defaultOpen={index === 0}
          />
        ))}
      </div>
    </section>
  )
}
