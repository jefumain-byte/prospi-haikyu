import { HandToggle } from './HandToggle'
import type { Handedness } from '../types'

interface MatchupPanelProps {
  batterLabel: string
  batterHand: Handedness
  pitcherArm: Handedness
  onBatterHandChange: (hand: Handedness) => void
  onPitcherArmChange: (arm: Handedness) => void
}

export function MatchupPanel({
  batterLabel,
  batterHand,
  pitcherArm,
  onBatterHandChange,
  onPitcherArmChange,
}: MatchupPanelProps) {
  return (
    <section className="matchup-panel panel-card">
      <div className="matchup-row">
        <div className="matchup-info">
          <span className="matchup-label">打者</span>
          <span className="matchup-batter-name">{batterLabel}</span>
          <HandToggle
            value={batterHand}
            onChange={onBatterHandChange}
            rightLabel="右打"
            leftLabel="左打"
          />
        </div>
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
      </div>
    </section>
  )
}
