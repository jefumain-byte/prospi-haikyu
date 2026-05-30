import { useEffect, useState } from 'react'
import { PitcherNameInput } from './PitcherNameInput'
import { resolvePitcherName } from '../data/pitcherNames'
import { getPitcherNameForSide } from '../gameLogic'
import type { Handedness, PitchSide } from '../types'

interface PitcherChangePanelProps {
  pitchSide: PitchSide
  selfPitcherName: string
  opponentPitcherName: string
  pitcherArm: Handedness
  onChangePitcher: (side: PitchSide, name: string) => void
}

function sideLabel(side: PitchSide): string {
  return side === 'opponent' ? '敵' : '自分'
}

export function PitcherChangePanel({
  pitchSide,
  selfPitcherName,
  opponentPitcherName,
  pitcherArm,
  onChangePitcher,
}: PitcherChangePanelProps) {
  const [newPitcherName, setNewPitcherName] = useState('')

  const sessionPitchers = { selfPitcherName, opponentPitcherName }
  const currentName = getPitcherNameForSide(sessionPitchers, pitchSide)

  useEffect(() => {
    setNewPitcherName('')
  }, [pitchSide, currentName])

  const handleSubmit = () => {
    const resolved = resolvePitcherName(newPitcherName.trim())
    if (!resolved) return
    onChangePitcher(pitchSide, resolved)
    setNewPitcherName('')
  }

  return (
    <section className="pitcher-change panel-card" aria-label="投手交代">
      <div className="pitcher-change-head">
        <h3 className="pitcher-change-title">投手交代</h3>
      </div>

      <div className={`pitcher-change-current side-${pitchSide}`}>
        <span className="pitcher-change-current-label">現在の投手</span>
        <div className="pitcher-change-current-main">
          <span className={`side-badge side-${pitchSide}`}>{sideLabel(pitchSide)}</span>
          <strong className="pitcher-change-current-name">{currentName}</strong>
          <span className="pitcher-change-arm">{pitcherArm === 'left' ? '左投' : '右投'}</span>
        </div>
      </div>

      <div className="pitcher-change-form">
        <PitcherNameInput
          id="pitcher-change-name"
          value={newPitcherName}
          onChange={setNewPitcherName}
          placeholder={`${sideLabel(pitchSide)}の新しい投手名`}
        />
        <button
          type="button"
          className="primary-btn compact pitcher-change-submit"
          disabled={!newPitcherName.trim()}
          onClick={handleSubmit}
        >
          交代
        </button>
      </div>

      <p className="pitcher-change-note">
        表裏が変わると記録する投手も自動で切り替わります
      </p>
    </section>
  )
}
