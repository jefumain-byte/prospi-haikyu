import { useMemo, useState, type FormEvent } from 'react'
import { PitcherNameInput } from './PitcherNameInput'
import { BATTING_FIRST_OPTIONS } from '../constants'
import { resolvePitcherName } from '../data/pitcherNames'
import { getSetupPitcherFields } from '../gameLogic'
import { DEFAULT_SPECIAL_EXTRA_INNING_START, SPECIAL_EXTRA_INNING_OPTIONS } from '../specialExtraLogic'
import type { BattingFirst } from '../types'

interface RecordSetupScreenProps {
  battingFirst: BattingFirst
  onStart: (battingFirstPitcher: string, battingSecondPitcher: string, specialExtraInningStart: number) => void
  onBack: () => void
}

export function RecordSetupScreen({ battingFirst, onStart, onBack }: RecordSetupScreenProps) {
  const [battingFirstPitcher, setBattingFirstPitcher] = useState('')
  const [battingSecondPitcher, setBattingSecondPitcher] = useState('')
  const [specialExtraInningStart, setSpecialExtraInningStart] = useState(DEFAULT_SPECIAL_EXTRA_INNING_START)

  const [firstField, secondField] = useMemo(() => getSetupPitcherFields(battingFirst), [battingFirst])
  const battingFirstOption = BATTING_FIRST_OPTIONS.find((option) => option.id === battingFirst)
  const canStart = battingFirstPitcher.trim() && battingSecondPitcher.trim()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canStart) return
    onStart(
      resolvePitcherName(battingFirstPitcher),
      resolvePitcherName(battingSecondPitcher),
      specialExtraInningStart,
    )
  }

  return (
    <div className="flow-screen">
      <header className="flow-header panel-card">
        <button type="button" className="ghost-btn compact back-btn" onClick={onBack}>
          ← 戻る
        </button>
        <div>
          <p className="app-kicker">新しい試合</p>
          <h1>記録を開始</h1>
        </div>
      </header>

      <form className="setup-form panel-card" onSubmit={handleSubmit}>
        <p className="setup-lead">
          あなたは{battingFirstOption?.label}（{battingFirstOption?.desc}）· 1回表から記録します。
        </p>
        <p className="setup-note">
          上から先攻・後攻の順です。{firstField.fieldLabel} → {secondField.fieldLabel}
        </p>

        <div className="setup-pitcher-grid">
          <section className="setup-pitcher-block">
            <label className="session-label" htmlFor="setup-first-pitcher">
              {firstField.fieldLabel}の先発投手
            </label>
            <PitcherNameInput
              id="setup-first-pitcher"
              value={battingFirstPitcher}
              onChange={setBattingFirstPitcher}
              placeholder={`${firstField.orderLabel}の投手名`}
              autoFocus
            />
          </section>

          <section className="setup-pitcher-block">
            <label className="session-label" htmlFor="setup-second-pitcher">
              {secondField.fieldLabel}の先発投手
            </label>
            <PitcherNameInput
              id="setup-second-pitcher"
              value={battingSecondPitcher}
              onChange={setBattingSecondPitcher}
              placeholder={`${secondField.orderLabel}の投手名`}
            />
          </section>
        </div>

        <section className="setup-special-extra">
          <div className="setup-special-extra-head">
            <label className="session-label" htmlFor="setup-special-extra-start">
              特別延長開始イニング
            </label>
            <p className="setup-special-extra-note">
              {specialExtraInningStart}回以降の各半イニングは、打順をそのままにノーアウト・一塁・二塁から開始します。
              走者は打者の前の打順2人（例: 4番打席なら1塁3番・2塁2番）です。
            </p>
          </div>
          <select
            id="setup-special-extra-start"
            className="session-input"
            value={specialExtraInningStart}
            onChange={(event) => setSpecialExtraInningStart(Number(event.target.value))}
          >
            {SPECIAL_EXTRA_INNING_OPTIONS.map((inning) => (
              <option key={inning} value={inning}>
                {inning}回から
              </option>
            ))}
          </select>
        </section>

        <button type="submit" className="primary-btn setup-submit" disabled={!canStart}>
          1回表から記録開始
        </button>
      </form>
    </div>
  )
}
