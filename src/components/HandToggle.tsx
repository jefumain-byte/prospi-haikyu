import type { Handedness } from '../types'

interface HandToggleProps {
  value: Handedness
  onChange: (value: Handedness) => void
  rightLabel?: string
  leftLabel?: string
}

export function HandToggle({
  value,
  onChange,
  rightLabel = '右',
  leftLabel = '左',
}: HandToggleProps) {
  return (
    <div className="hand-toggle" role="group">
      <button
        type="button"
        className={`hand-btn ${value === 'right' ? 'active' : ''}`}
        onClick={() => onChange('right')}
      >
        {rightLabel}
      </button>
      <button
        type="button"
        className={`hand-btn ${value === 'left' ? 'active' : ''}`}
        onClick={() => onChange('left')}
      >
        {leftLabel}
      </button>
    </div>
  )
}
