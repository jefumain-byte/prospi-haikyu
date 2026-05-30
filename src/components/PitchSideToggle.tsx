import { PITCH_SIDES } from '../constants'
import type { PitchSide } from '../types'

interface PitchSideToggleProps {
  value: PitchSide
  onChange: (side: PitchSide) => void
  compact?: boolean
}

export function PitchSideToggle({ value, onChange, compact = false }: PitchSideToggleProps) {
  return (
    <div className={`pitch-side-toggle ${compact ? 'compact' : ''}`} role="group" aria-label="投球者">
      {PITCH_SIDES.map((side) => (
        <button
          key={side.id}
          type="button"
          className={`pitch-side-btn side-${side.id} ${value === side.id ? 'active' : ''}`}
          onClick={() => onChange(side.id)}
        >
          {side.label}
        </button>
      ))}
    </div>
  )
}
