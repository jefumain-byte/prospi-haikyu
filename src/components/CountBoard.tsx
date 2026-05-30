import type { Count } from '../types'

interface CountBoardProps {
  count: Count
}

function DotRow({ total, filled, tone }: { total: number; filled: number; tone: 'ball' | 'strike' | 'out' }) {
  return (
    <div className={`count-dots tone-${tone}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`count-dot ${i < filled ? 'filled' : ''}`} />
      ))}
    </div>
  )
}

export function CountBoard({ count }: CountBoardProps) {
  return (
    <div className="count-board">
      <div className="count-item tone-ball">
        <div className="count-head">
          <span className="count-label">Ball</span>
          <span className="count-value">{count.balls}</span>
        </div>
        <DotRow total={3} filled={Math.min(count.balls, 3)} tone="ball" />
      </div>

      <div className="count-item tone-strike">
        <div className="count-head">
          <span className="count-label">Strike</span>
          <span className="count-value">{count.strikes}</span>
        </div>
        <DotRow total={2} filled={Math.min(count.strikes, 2)} tone="strike" />
      </div>

      <div className="count-item tone-out">
        <div className="count-head">
          <span className="count-label">Out</span>
          <span className="count-value">{count.outs}</span>
        </div>
        <DotRow total={3} filled={count.outs} tone="out" />
      </div>
    </div>
  )
}
