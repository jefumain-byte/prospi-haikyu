export function AnalysisStatCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail?: string
}) {
  return (
    <div className="analysis-stat-card">
      <span className="analysis-stat-label">{label}</span>
      <strong className="analysis-stat-value">{value}</strong>
      {detail ? <span className="analysis-stat-detail">{detail}</span> : null}
    </div>
  )
}
