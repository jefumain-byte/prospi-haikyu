import { useMemo, useState } from 'react'
import { ZoneFrame } from './ZoneFrame'
import { SideFilterToggle, type SideFilter } from './SideFilterToggle'
import { ZONE_GRID, getPitchResultLabel, getPitchTypeLabel } from '../constants'
import type { PitchRecord, PitchResult, PitchType, ZoneCell } from '../types'

interface StatsPanelProps {
  pitches: PitchRecord[]
}

function cellKey(row: number, col: number) {
  return `${row}-${col}`
}

export function StatsPanel({ pitches }: StatsPanelProps) {
  const [filterSide, setFilterSide] = useState<SideFilter>('all')

  const filteredPitches = useMemo(() => {
    if (filterSide === 'all') return pitches
    return pitches.filter((pitch) => pitch.pitchSide === filterSide)
  }, [pitches, filterSide])

  const stats = useMemo(() => {
    const zoneCounts = new Map<string, number>()
    const typeCounts = new Map<string, number>()
    const resultCounts = new Map<string, number>()
    let inZone = 0

    for (const pitch of filteredPitches) {
      const key = cellKey(pitch.row, pitch.col)
      zoneCounts.set(key, (zoneCounts.get(key) ?? 0) + 1)
      typeCounts.set(pitch.pitchType, (typeCounts.get(pitch.pitchType) ?? 0) + 1)
      resultCounts.set(pitch.result, (resultCounts.get(pitch.result) ?? 0) + 1)
      if (ZONE_GRID[pitch.row]?.[pitch.col]?.inZone) inZone++
    }

    const maxZone = Math.max(...zoneCounts.values(), 1)

    return {
      zoneCounts,
      maxZone,
      inZone,
      topTypes: [...typeCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
      topResults: [...resultCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
    }
  }, [filteredPitches])

  if (pitches.length === 0) {
    return (
      <div className="panel-card empty-state">
        <div className="empty-icon">📊</div>
        <p>分析データがありません</p>
        <p className="empty-hint">配球を記録するとヒートマップが表示されます</p>
      </div>
    )
  }

  const renderHeatCell = (cell: ZoneCell) => {
    const count = stats.zoneCounts.get(cellKey(cell.row, cell.col)) ?? 0
    const intensity = count / stats.maxZone

    return (
      <div
        key={cellKey(cell.row, cell.col)}
        className={`heatmap-cell ${cell.inZone ? 'in-zone' : 'out-zone'}`}
        style={{
          background: count ? `rgba(56, 189, 120, ${0.18 + intensity * 0.72})` : undefined,
        }}
        title={`${cell.label}: ${count}球`}
      >
        <span className="heatmap-count">{count || ''}</span>
        <span className="heatmap-label">{cell.shortLabel}</span>
      </div>
    )
  }

  const total = filteredPitches.length
  const zoneRate = total ? Math.round((stats.inZone / total) * 100) : 0

  return (
    <div className="stats-panel">
      <div className="filter-row panel-card">
        <SideFilterToggle value={filterSide} onChange={setFilterSide} />
      </div>

      {total === 0 ? (
        <div className="panel-card empty-state inline">
          <p>該当する記録がありません</p>
        </div>
      ) : (
        <>
          <div className="stats-summary">
            <div className="stat-card highlight">
              <span className="stat-value">{total}</span>
              <span className="stat-label">総投球数</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{zoneRate}%</span>
              <span className="stat-label">ゾーン率</span>
            </div>
          </div>

          <section className="stats-section panel-card">
            <h3>配球ヒートマップ</h3>
            <ZoneFrame renderCell={renderHeatCell} />
          </section>

          <section className="stats-section panel-card">
            <h3>球種内訳</h3>
            <ul className="bar-list">
              {stats.topTypes.map(([type, count]) => (
                <li key={type}>
                  <span className="bar-label">{getPitchTypeLabel(type as PitchType)}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(count / total) * 100}%` }} />
                  </div>
                  <span className="bar-count">{count}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="stats-section panel-card">
            <h3>結果内訳</h3>
            <ul className="bar-list">
              {stats.topResults.map(([result, count]) => (
                <li key={result}>
                  <span className="bar-label">{getPitchResultLabel(result as PitchResult)}</span>
                  <div className="bar-track">
                    <div className="bar-fill accent" style={{ width: `${(count / total) * 100}%` }} />
                  </div>
                  <span className="bar-count">{count}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}
