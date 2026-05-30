import { PITCH_SIDES } from '../constants'
import type { PitchSide } from '../types'

export type SideFilter = PitchSide | 'all'

interface SideFilterToggleProps {
  value: SideFilter
  onChange: (value: SideFilter) => void
}

export function SideFilterToggle({ value, onChange }: SideFilterToggleProps) {
  return (
    <div className="side-filter-toggle" role="group" aria-label="投球者フィルター">
      <button
        type="button"
        className={`side-filter-btn ${value === 'all' ? 'active' : ''}`}
        onClick={() => onChange('all')}
      >
        全部
      </button>
      {PITCH_SIDES.map((side) => (
        <button
          key={side.id}
          type="button"
          className={`side-filter-btn side-${side.id} ${value === side.id ? 'active' : ''}`}
          onClick={() => onChange(side.id)}
        >
          {side.label}
        </button>
      ))}
    </div>
  )
}
