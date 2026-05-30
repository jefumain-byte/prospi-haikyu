import { HandToggle } from './HandToggle'
import type { Handedness } from '../types'

interface MatchupPanelProps {
  batterHand: Handedness
  pitcherArm: Handedness
  onBatterHandChange: (hand: Handedness) => void
  onPitcherArmChange: (arm: Handedness) => void
  onBatterChange: () => void
  onPitcherChange: () => void
}

export function MatchupPanel({
  batterHand,
  pitcherArm,
  onBatterHandChange,
  onPitcherArmChange,
  onBatterChange,
  onPitcherChange,
}: MatchupPanelProps) {
  return (
    <section className="matchup-panel panel-card">
      <div className="matchup-row">
        <div className="matchup-info">
          <span className="matchup-label">打者</span>
          <HandToggle
            value={batterHand}
            onChange={onBatterHandChange}
            rightLabel="右打"
            leftLabel="左打"
          />
        </div>
        <button type="button" className="ghost-btn compact matchup-btn" onClick={onBatterChange}>
          打者交代
        </button>
      </div>

      <div className="matchup-row">
        <div className="matchup-info">
          <span className="matchup-label">投手</span>
          <HandToggle
            value={pitcherArm}
            onChange={onPitcherArmChange}
            rightLabel="右投"
            leftLabel="左投"
          />
        </div>
        <button type="button" className="ghost-btn compact matchup-btn" onClick={onPitcherChange}>
          投手交代
        </button>
      </div>
    </section>
  )
}
