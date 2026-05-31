import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'
import { zoneHeatLevel, type ZoneStat } from '../../analysisLogic'
import { hasEnoughSample, MIN_RATE_SAMPLE, NO_STAT } from '../../statsFormat'
import type { ZoneCell } from '../../types'
import { isStrikeZoneCell, ZoneFrame } from '../ZoneFrame'

export type ZoneHeatmapMetric = 'avg' | 'slg'
export type ZoneHeatmapScope = 'strike' | 'full'

interface ZoneAnalysisMapProps {
  title: string
  subtitle: string
  zones: Pick<ZoneStat, 'row' | 'col' | 'hits' | 'atBats' | 'average' | 'slugging'>[]
  variant: 'batting' | 'pitching'
}

const METRIC_OPTIONS: Record<
  ZoneAnalysisMapProps['variant'],
  { id: ZoneHeatmapMetric; label: string }[]
> = {
  batting: [
    { id: 'avg', label: '打率' },
    { id: 'slg', label: '長打率' },
  ],
  pitching: [
    { id: 'avg', label: '被安打率' },
    { id: 'slg', label: '被長打率' },
  ],
}

function metricValue(stat: ZoneStat | undefined, metric: ZoneHeatmapMetric): string {
  if (!stat) return NO_STAT
  return metric === 'avg' ? stat.average : stat.slugging
}

export function ZoneAnalysisMap({ title, subtitle, zones, variant }: ZoneAnalysisMapProps) {
  const [metric, setMetric] = useState<ZoneHeatmapMetric>('avg')
  const [scope, setScope] = useState<ZoneHeatmapScope>('strike')
  const lowerIsBetter = variant === 'pitching'
  const metricOptions = METRIC_OPTIONS[variant]
  const metricLabel = metricOptions.find((item) => item.id === metric)?.label ?? ''

  const zoneMap = useMemo(() => {
    const map = new Map<string, ZoneStat>()
    for (const zone of zones) {
      map.set(`${zone.row}-${zone.col}`, zone)
    }
    return map
  }, [zones])

  const renderCell = (cell: ZoneCell) => {
    if (scope === 'strike' && !isStrikeZoneCell(cell)) {
      return null
    }

    const stat = zoneMap.get(`${cell.row}-${cell.col}`)
    const sampleSize = stat?.atBats ?? 0
    const enoughSample = hasEnoughSample(sampleSize, MIN_RATE_SAMPLE)
    const displayValue = metricValue(stat, metric)
    const heat = zoneHeatLevel(displayValue, sampleSize, lowerIsBetter)

    return (
      <div
        className={`analysis-zone-cell ${cell.inZone ? 'in-zone' : 'out-zone'} ${enoughSample ? 'has-data' : sampleSize > 0 ? 'low-sample' : 'no-data'}`}
        style={{ '--heat': heat } as CSSProperties}
        title={
          sampleSize > 0
            ? enoughSample
              ? `${metricLabel} ${displayValue} · ${stat!.hits}安打 / ${stat!.atBats}打数`
              : `${metricLabel} --- · n=${sampleSize}（${MIN_RATE_SAMPLE}未満）`
            : 'データなし'
        }
      >
        <span className="analysis-zone-short">{cell.shortLabel}</span>
        <span className="analysis-zone-avg">{sampleSize > 0 ? displayValue : NO_STAT}</span>
        {sampleSize > 0 ? (
          enoughSample ? (
            <span className="analysis-zone-count">
              {stat!.hits}/{stat!.atBats}
            </span>
          ) : (
            <span className="analysis-zone-sample-tag">n={sampleSize}</span>
          )
        ) : null}
      </div>
    )
  }

  return (
    <section className="analysis-zone-section panel-card">
      <div className="analysis-zone-head">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>

      <div className="analysis-zone-controls">
        <div className="analysis-zone-control">
          <span className="analysis-zone-control-label">指標</span>
          <select
            className="analysis-zone-select"
            value={metric}
            onChange={(event) => setMetric(event.target.value as ZoneHeatmapMetric)}
            aria-label="ヒートマップ指標"
          >
            {metricOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="analysis-zone-control">
          <span className="analysis-zone-control-label">表示</span>
          <div className="analysis-zone-toggle" role="group" aria-label="ゾーン表示範囲">
            <button
              type="button"
              className={`analysis-zone-toggle-btn ${scope === 'strike' ? 'active' : ''}`}
              aria-pressed={scope === 'strike'}
              onClick={() => setScope('strike')}
            >
              ストライクゾーン
            </button>
            <button
              type="button"
              className={`analysis-zone-toggle-btn ${scope === 'full' ? 'active' : ''}`}
              aria-pressed={scope === 'full'}
              onClick={() => setScope('full')}
            >
              ボール含む
            </button>
          </div>
        </div>
      </div>

      <div className="analysis-zone-wrap">
        <ZoneFrame renderCell={renderCell} strikeZoneOnly={scope === 'strike'} />
      </div>

      <div className="analysis-zone-legend">
        <span>
          {lowerIsBetter ? '低いほど良い' : '高いほど良い'}（{metricLabel}）· n≥{MIN_RATE_SAMPLE}のみ色付け
        </span>
        <div className="analysis-zone-legend-bar" aria-hidden="true">
          <span>低</span>
          <span className="analysis-zone-legend-gradient" />
          <span>高</span>
        </div>
      </div>
    </section>
  )
}

export { getZoneStat } from '../../analysisLogic'
