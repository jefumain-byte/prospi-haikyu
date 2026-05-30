import { HandToggle } from './HandToggle'
import { formatSpecialExtraRunnerNote, getSpecialExtraRunnerOrders, isSpecialExtraInningHalf } from '../specialExtraLogic'
import type { Count, Handedness, Runners } from '../types'

interface GameSituationBoardProps {
  count: Count
  runners: Runners
  selfScore: number
  opponentScore: number
  inning: number
  specialExtraInningStart: number
  activeBatterOrder: number
  batterHand: Handedness
  pitcherArm: Handedness
  onBatterHandChange: (hand: Handedness) => void
  onPitcherArmChange: (arm: Handedness) => void
}

function BaseDiamond({
  occupied,
  label,
  runnerOrder,
}: {
  occupied: boolean
  label: string
  runnerOrder?: number
}) {
  return (
    <div className={`base-diamond ${occupied ? 'occupied' : ''}`} aria-label={`${label}${occupied ? ' 走者あり' : ''}`}>
      <span className="base-diamond-inner" />
      {occupied && <span className="base-runner-dot" />}
      {occupied && runnerOrder != null && <span className="base-runner-order">{runnerOrder}番</span>}
      <span className="base-label">{label}</span>
    </div>
  )
}

export function GameSituationBoard({
  count,
  runners,
  selfScore,
  opponentScore,
  inning,
  specialExtraInningStart,
  activeBatterOrder,
  batterHand,
  pitcherArm,
  onBatterHandChange,
  onPitcherArmChange,
}: GameSituationBoardProps) {
  const specialExtraActive = isSpecialExtraInningHalf(inning, specialExtraInningStart)
  const showRunnerOrders =
    specialExtraActive &&
    count.outs === 0 &&
    count.balls === 0 &&
    count.strikes === 0 &&
    runners.first &&
    runners.second &&
    !runners.third
  const runnerOrderNote = showRunnerOrders ? formatSpecialExtraRunnerNote(activeBatterOrder) : null
  const runnerOrders = showRunnerOrders ? getSpecialExtraRunnerOrders(activeBatterOrder) : null

  return (
    <section className="game-situation panel-card" aria-label="試合状況">
      {specialExtraActive && (
        <div className="special-extra-banner">
          <span className="special-extra-badge">特別延長</span>
          {runnerOrderNote && <span className="special-extra-runners">{runnerOrderNote}</span>}
        </div>
      )}

      <div className="scoreboard" aria-label="スコア">
        <div className="scoreboard-team side-opponent">
          <span className="scoreboard-label">敵</span>
          <strong className="scoreboard-value">{opponentScore}</strong>
        </div>
        <span className="scoreboard-divider" aria-hidden="true">
          -
        </span>
        <div className="scoreboard-team side-self">
          <span className="scoreboard-label">自分</span>
          <strong className="scoreboard-value">{selfScore}</strong>
        </div>
      </div>

      <div className="situation-main">
        <div className="diamond-field">
          <svg className="diamond-lines" viewBox="0 0 120 120" aria-hidden="true">
            <polygon points="60,14 106,60 60,106 14,60" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <line x1="60" y1="106" x2="60" y2="118" stroke="currentColor" strokeWidth="2" />
          </svg>
          <div className="base second">
            <BaseDiamond occupied={runners.second} label="2" runnerOrder={runnerOrders?.second} />
          </div>
          <div className="base third">
            <BaseDiamond occupied={runners.third} label="3" />
          </div>
          <div className="base first">
            <BaseDiamond occupied={runners.first} label="1" runnerOrder={runnerOrders?.first} />
          </div>
          <div className="home-plate" aria-hidden="true">
            <span className="home-plate-shape" />
          </div>
        </div>

        <div className="situation-side">
          <div className="count-strip">
            <div className="count-strip-item tone-ball">
              <span className="count-strip-key">B</span>
              <div className="count-strip-dots">
                {[0, 1, 2].map((i) => (
                  <span key={i} className={`count-strip-dot ${i < count.balls ? 'on' : ''}`} />
                ))}
              </div>
              <span className="count-strip-num">{count.balls}</span>
            </div>
            <div className="count-strip-item tone-strike">
              <span className="count-strip-key">S</span>
              <div className="count-strip-dots">
                {[0, 1].map((i) => (
                  <span key={i} className={`count-strip-dot ${i < count.strikes ? 'on' : ''}`} />
                ))}
              </div>
              <span className="count-strip-num">{count.strikes}</span>
            </div>
            <div className="count-strip-item tone-out">
              <span className="count-strip-key">O</span>
              <div className="count-strip-dots">
                {[0, 1, 2].map((i) => (
                  <span key={i} className={`count-strip-dot ${i < count.outs ? 'on' : ''}`} />
                ))}
              </div>
              <span className="count-strip-num">{count.outs}</span>
            </div>
          </div>

          <div className="situation-hands">
            <div className="situation-hand-row">
              <span className="situation-hand-label">打</span>
              <HandToggle value={batterHand} onChange={onBatterHandChange} rightLabel="右" leftLabel="左" />
            </div>
            <div className="situation-hand-row">
              <span className="situation-hand-label">投</span>
              <HandToggle value={pitcherArm} onChange={onPitcherArmChange} rightLabel="右" leftLabel="左" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
