import type { TrendSeries } from '../../analysisLogic'

interface AnalysisSparklineProps {
  series: TrendSeries
  lowerIsBetter?: boolean
}

export function AnalysisSparkline({ series, lowerIsBetter = false }: AnalysisSparklineProps) {
  const validPoints = series.points.filter((point) => point.value != null)
  if (validPoints.length === 0) {
    return <p className="analysis-sparkline-empty">推移データがありません</p>
  }

  const values = validPoints.map((point) => point.value!)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 0.001
  const width = 320
  const height = 88
  const padding = 8

  const coords = validPoints.map((point, index) => {
    const x = padding + (index / Math.max(validPoints.length - 1, 1)) * (width - padding * 2)
    const normalized = (point.value! - min) / range
    const y = lowerIsBetter
      ? padding + normalized * (height - padding * 2)
      : height - padding - normalized * (height - padding * 2)
    return { x, y, point }
  })

  const polyline = coords.map(({ x, y }) => `${x},${y}`).join(' ')

  return (
    <div className="analysis-sparkline">
      <div className="analysis-sparkline-head">
        <strong>{series.label}</strong>
        <span className="analysis-sparkline-latest">
          最新 {series.points[series.points.length - 1]?.displayValue ?? '---'}
        </span>
      </div>
      <svg
        className="analysis-sparkline-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${series.label}の推移`}
      >
        <polyline className="analysis-sparkline-line" points={polyline} fill="none" />
        {coords.map(({ x, y, point }) => (
          <circle key={point.sessionId} className="analysis-sparkline-dot" cx={x} cy={y} r="3.5">
            <title>
              {point.shortLabel}: {point.displayValue}
            </title>
          </circle>
        ))}
      </svg>
      <div className="analysis-sparkline-axis">
        <span>{validPoints[0]?.shortLabel}</span>
        <span>{validPoints[validPoints.length - 1]?.shortLabel}</span>
      </div>
    </div>
  )
}
