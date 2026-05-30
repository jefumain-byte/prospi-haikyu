import { getBatterHandLabel, getPitcherArmLabel, PITCH_RESULTS, PITCH_TYPES } from '../constants'
import type { Handedness, PitchResult, PitchSide, PitchType } from '../types'
import { PitchSideToggle } from './PitchSideToggle'

const QUICK_RESULTS: PitchResult[] = ['ball', 'called_strike', 'swinging_strike', 'foul']

interface PitchFormProps {
  zoneLabel: string
  pitchSide: PitchSide
  onPitchSideChange: (side: PitchSide) => void
  batterHand: Handedness
  pitcherArm: Handedness
  pitchType: PitchType
  result: PitchResult
  onPitchTypeChange: (type: PitchType) => void
  onResultChange: (result: PitchResult) => void
  onSubmit: () => void
  onCancel: () => void
}

function resultTone(id: PitchResult): string {
  if (id === 'ball' || id === 'walk' || id === 'hbp') return 'tone-ball'
  if (['called_strike', 'swinging_strike', 'foul'].includes(id)) return 'tone-strike'
  if (['single', 'double', 'triple', 'homerun'].includes(id)) return 'tone-hit'
  return 'tone-out'
}

export function PitchForm({
  zoneLabel,
  pitchSide,
  onPitchSideChange,
  batterHand,
  pitcherArm,
  pitchType,
  result,
  onPitchTypeChange,
  onResultChange,
  onSubmit,
  onCancel,
}: PitchFormProps) {
  const groups = [...new Set(PITCH_RESULTS.map((r) => r.group))]

  return (
    <div className="pitch-form">
      <div className="sheet-handle" aria-hidden="true" />

      <div className="pitch-form-header">
        <div>
          <div className="pitch-form-title">配球を記録</div>
          <div className="pitch-form-zone">{zoneLabel}</div>
          <div className="pitch-form-matchup">
            {getBatterHandLabel(batterHand)} / {getPitcherArmLabel(pitcherArm)}
          </div>
        </div>
        <button type="button" className="icon-btn" onClick={onCancel} aria-label="閉じる">
          ✕
        </button>
      </div>

      <section className="form-section">
        <h3>誰の投球？</h3>
        <PitchSideToggle value={pitchSide} onChange={onPitchSideChange} />
      </section>

      <section className="form-section quick-section">
        <h3>よく使う結果</h3>
        <div className="quick-result-grid">
          {QUICK_RESULTS.map((id) => {
            const item = PITCH_RESULTS.find((r) => r.id === id)!
            return (
              <button
                key={id}
                type="button"
                className={`quick-result-btn ${resultTone(id)} ${result === id ? 'active' : ''}`}
                onClick={() => onResultChange(id)}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </section>

      <section className="form-section">
        <h3>球種</h3>
        <div className="chip-grid">
          {PITCH_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              className={`chip chip-type ${pitchType === type.id ? 'active' : ''}`}
              onClick={() => onPitchTypeChange(type.id)}
            >
              {type.label}
            </button>
          ))}
        </div>
      </section>

      <section className="form-section">
        <h3>すべての結果</h3>
        {groups.map((group) => (
          <div key={group} className="result-group">
            <div className="result-group-label">{group}</div>
            <div className="chip-grid">
              {PITCH_RESULTS.filter((r) => r.group === group).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`chip ${resultTone(item.id)} ${result === item.id ? 'active' : ''}`}
                  onClick={() => onResultChange(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <div className="form-footer">
        <button type="button" className="primary-btn" onClick={onSubmit}>
          記録する
        </button>
      </div>
    </div>
  )
}
