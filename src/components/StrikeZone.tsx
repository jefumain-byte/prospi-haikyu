import { ZoneFrame } from './ZoneFrame'
import type { ZoneCell } from '../types'

interface ZoneCellButtonProps {
  cell: ZoneCell
  count: number
  isSelected: boolean
  onSelect: (row: number, col: number) => void
}

function ZoneCellButton({ cell, count, isSelected, onSelect }: ZoneCellButtonProps) {
  return (
    <button
      type="button"
      className={[
        'zone-cell',
        cell.inZone ? 'in-zone' : 'out-zone',
        isSelected ? 'selected' : '',
        count > 0 ? 'has-data' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => onSelect(cell.row, cell.col)}
      aria-label={cell.label}
      title={cell.label}
    >
      <span className="zone-cell-label">{cell.shortLabel}</span>
      {count > 0 && <span className="zone-cell-count">{count}</span>}
    </button>
  )
}

interface StrikeZoneProps {
  pitches: { row: number; col: number }[]
  selectedRow: number | null
  selectedCol: number | null
  onSelect: (row: number, col: number) => void
}

function cellKey(row: number, col: number) {
  return `${row}-${col}`
}

export function StrikeZone({ pitches, selectedRow, selectedCol, onSelect }: StrikeZoneProps) {
  const counts = new Map<string, number>()
  for (const pitch of pitches) {
    const key = cellKey(pitch.row, pitch.col)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const renderCell = (cell: ZoneCell) => (
    <ZoneCellButton
      key={cellKey(cell.row, cell.col)}
      cell={cell}
      count={counts.get(cellKey(cell.row, cell.col)) ?? 0}
      isSelected={selectedRow === cell.row && selectedCol === cell.col}
      onSelect={onSelect}
    />
  )

  return (
    <div className="strike-zone-wrap panel-card">
      <div className="zone-legend">
        <span className="legend-item strike">
          <span className="legend-swatch strike" />
          ストライク
        </span>
        <span className="legend-item ball">
          <span className="legend-swatch ball" />
          ボール
        </span>
        <span className="legend-item recorded">
          <span className="legend-swatch recorded" />
          記録済
        </span>
      </div>

      <ZoneFrame renderCell={renderCell} />

      <p className="zone-hint">マスをタップ → 球種・結果を選んで記録</p>
    </div>
  )
}
