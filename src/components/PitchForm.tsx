import { useEffect, useMemo, useState } from 'react'
import {
  formatPitchResultDisplay,
  getBatterHandLabel,
  getPitchTypeLabel,
  getPitcherArmLabel,
  PITCH_RESULT_EXTRA_GROUP,
  PITCH_RESULT_NORMAL_GROUPS,
  PITCH_RESULTS,
  PITCH_TYPE_GROUPS,
} from '../constants'
import {
  getAvailableOutTargets,
  getOutTargetLabel,
  isOutSelectionValid,
  requiredOutSelectionCount,
  requiresOutSelection,
} from '../outLogic'
import {
  getAvailableRunnerAdvanceBases,
  isRunnerAdvanceSelectionValid,
  requiresRunnerAdvanceSelection,
} from '../runnerAdvanceLogic'
import {
  getOccupiedRunnerBases,
  getRunnerBaseLabel,
  isStealAttemptValid,
  isStealSelectionAllowed,
} from '../stealLogic'
import type { Handedness, OutTarget, PitchResult, PitchType, Runners, RunnerBase, StealAttempt } from '../types'

type FormStep = 'type' | 'result'

interface PitchFormProps {
  zoneLabel: string
  inZone: boolean
  runners: Runners
  outs: number
  batterLabel: string
  batterHand: Handedness
  pitcherArm: Handedness
  pitchType: PitchType
  primaryResult: PitchResult
  extraResult: PitchResult | null
  outsRecorded: OutTarget[]
  stealAttempt: StealAttempt | null
  runnersAdvanced: RunnerBase[]
  onPitchTypeChange: (type: PitchType) => void
  onPrimaryResultChange: (result: PitchResult) => void
  onExtraResultChange: (result: PitchResult | null) => void
  onOutsRecordedChange: (outs: OutTarget[]) => void
  onStealAttemptChange: (attempt: StealAttempt | null) => void
  onRunnersAdvancedChange: (bases: RunnerBase[]) => void
  onSubmit: () => void
  onCancel: () => void
}

function resultTone(id: PitchResult): string {
  if (id === 'ball' || id === 'walk' || id === 'hbp') return 'tone-ball'
  if (['called_strike', 'swinging_strike', 'foul'].includes(id)) return 'tone-strike'
  if (['single', 'double', 'triple', 'homerun'].includes(id)) return 'tone-hit'
  return 'tone-out'
}

function isNormalResultGroup(group: string): boolean {
  return (PITCH_RESULT_NORMAL_GROUPS as readonly string[]).includes(group)
}

export function PitchForm({
  zoneLabel,
  inZone,
  runners,
  outs,
  batterLabel,
  batterHand,
  pitcherArm,
  pitchType,
  primaryResult,
  extraResult,
  outsRecorded,
  stealAttempt,
  runnersAdvanced,
  onPitchTypeChange,
  onPrimaryResultChange,
  onExtraResultChange,
  onOutsRecordedChange,
  onStealAttemptChange,
  onRunnersAdvancedChange,
  onSubmit,
  onCancel,
}: PitchFormProps) {
  const [activeGroup, setActiveGroup] = useState(0)
  const [step, setStep] = useState<FormStep>('type')

  const hasRunners = runners.first || runners.second || runners.third
  const canDoublePlay = hasRunners && outs < 2
  const gameResult = extraResult && extraResult !== 'steal' ? extraResult : primaryResult
  const needsOutSelection = requiresOutSelection(runners, gameResult)
  const requiredOutCount = requiredOutSelectionCount(gameResult)
  const outSelectionValid = isOutSelectionValid(outsRecorded, gameResult, runners)
  const availableOutTargets = getAvailableOutTargets(runners)
  const occupiedBases = getOccupiedRunnerBases(runners)
  const stealValid = extraResult !== 'steal' || isStealAttemptValid(runners, stealAttempt)
  const stealBases = stealAttempt?.bases ?? []
  const needsRunnerAdvanceSelection = requiresRunnerAdvanceSelection(runners, outs, gameResult)
  const availableAdvanceBases = getAvailableRunnerAdvanceBases(runners, outsRecorded)
  const runnerAdvanceValid = isRunnerAdvanceSelectionValid(
    runners,
    outs,
    gameResult,
    runnersAdvanced,
    outsRecorded,
  )

  useEffect(() => {
    setStep('type')
    onExtraResultChange(null)
    onOutsRecordedChange([])
    onOutsRecordedChange([])
    onStealAttemptChange(null)
    onRunnersAdvancedChange([])
  }, [zoneLabel, onExtraResultChange, onOutsRecordedChange, onStealAttemptChange, onRunnersAdvancedChange])

  useEffect(() => {
    onOutsRecordedChange([])
    onRunnersAdvancedChange([])
  }, [primaryResult, extraResult, onOutsRecordedChange, onRunnersAdvancedChange])

  useEffect(() => {
    if (primaryResult === 'double_play' && !canDoublePlay) {
      onPrimaryResultChange(inZone ? 'called_strike' : 'ball')
    }
  }, [canDoublePlay, inZone, onPrimaryResultChange, primaryResult])

  const unavailablePrimary: PitchResult[] = inZone ? ['ball'] : ['called_strike']
  const normalResults = PITCH_RESULTS.filter(
    (item) =>
      isNormalResultGroup(item.group) &&
      !unavailablePrimary.includes(item.id) &&
      (item.id !== 'double_play' || canDoublePlay),
  )
  const extraResults = PITCH_RESULTS.filter(
    (item) => item.group === PITCH_RESULT_EXTRA_GROUP && (item.id !== 'steal' || hasRunners),
  )
  const normalGroups = [...new Set(normalResults.map((item) => item.group))]

  const currentGroup = PITCH_TYPE_GROUPS[activeGroup]
  const selectedTypeLabel = getPitchTypeLabel(pitchType)
  const batterOrder = Number.parseInt(batterLabel, 10) || 0
  const selectedResultLabel = formatPitchResultDisplay({
    result: gameResult,
    primaryResult,
    extraResult: extraResult ?? undefined,
    stealAttempt: stealAttempt ?? undefined,
    runnersAdvanced: runnersAdvanced.length ? runnersAdvanced : undefined,
    outsRecorded: outsRecorded.length ? outsRecorded : undefined,
    batterOrder,
  })

  const groupIndexForType = useMemo(
    () => PITCH_TYPE_GROUPS.findIndex((group) => group.types.some((type) => type.id === pitchType)),
    [pitchType],
  )

  useEffect(() => {
    if (groupIndexForType >= 0) setActiveGroup(groupIndexForType)
  }, [groupIndexForType])

  const handleTypeSelect = (type: PitchType, groupIndex: number) => {
    setActiveGroup(groupIndex)
    onPitchTypeChange(type)
    setStep('result')
  }

  const handlePrimarySelect = (id: PitchResult) => {
    onPrimaryResultChange(id)
  }

  const handleExtraSelect = (id: PitchResult) => {
    if (extraResult === id) {
      onExtraResultChange(null)
      onStealAttemptChange(null)
      return
    }
    onExtraResultChange(id)
    if (id === 'steal') {
      onStealAttemptChange({ bases: [], outcome: 'success' })
    } else {
      onStealAttemptChange(null)
    }
  }

  const handleStealBaseToggle = (base: RunnerBase) => {
    const current = stealAttempt ?? { bases: [], outcome: 'success' as const }
    const nextBases = current.bases.includes(base)
      ? current.bases.filter((item) => item !== base)
      : [...current.bases, base]
    onStealAttemptChange({
      ...current,
      bases: nextBases,
      outBase:
        current.outcome === 'failed' && current.outBase && nextBases.includes(current.outBase)
          ? current.outBase
          : undefined,
    })
  }

  const handleStealOutcome = (outcome: StealAttempt['outcome']) => {
    const current = stealAttempt ?? { bases: [], outcome: 'success' }
    onStealAttemptChange({
      ...current,
      outcome,
      outBase: outcome === 'failed' ? current.outBase : undefined,
    })
  }

  const handleStealOutBase = (base: RunnerBase) => {
    if (!stealAttempt) return
    onStealAttemptChange({ ...stealAttempt, outBase: base })
  }

  const handleRunnerAdvanceToggle = (base: RunnerBase) => {
    if (runnersAdvanced.includes(base)) {
      onRunnersAdvancedChange(runnersAdvanced.filter((item) => item !== base))
      return
    }
    onRunnersAdvancedChange([...runnersAdvanced, base])
  }

  const handleOutTargetToggle = (target: OutTarget) => {
    let nextOuts: OutTarget[]
    if (requiredOutCount === 1) {
      nextOuts = [target]
    } else if (outsRecorded.includes(target)) {
      nextOuts = outsRecorded.filter((item) => item !== target)
    } else if (outsRecorded.length < requiredOutCount) {
      nextOuts = [...outsRecorded, target]
    } else {
      return
    }

    onOutsRecordedChange(nextOuts)
    const available = new Set(getAvailableRunnerAdvanceBases(runners, nextOuts))
    onRunnersAdvancedChange(runnersAdvanced.filter((base) => available.has(base)))
  }

  return (
    <section className="pitch-form pitch-form-inline panel-card" aria-label="配球記録">
      <header className="record-panel-head">
        <div>
          <span className={`zone-badge ${inZone ? 'in-zone' : 'out-zone'}`}>{zoneLabel}</span>
          <p className="record-panel-meta">
            {getBatterHandLabel(batterHand)} · {getPitcherArmLabel(pitcherArm)}
          </p>
        </div>
        <button type="button" className="ghost-btn compact" onClick={onCancel}>
          取消
        </button>
      </header>

      <div className="form-step-tabs" role="tablist" aria-label="入力ステップ">
        <button
          type="button"
          role="tab"
          aria-selected={step === 'type'}
          className={`form-step-tab ${step === 'type' ? 'active' : ''}`}
          onClick={() => setStep('type')}
        >
          <span className="form-step-num">1</span>
          球種
          <span className="form-step-value">{selectedTypeLabel}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={step === 'result'}
          className={`form-step-tab ${step === 'result' ? 'active' : ''}`}
          onClick={() => setStep('result')}
        >
          <span className="form-step-num">2</span>
          結果
          <span className={`form-step-value ${resultTone(extraResult ?? primaryResult)}`}>{selectedResultLabel}</span>
        </button>
      </div>

      <div className="record-panel-body">
        {step === 'type' ? (
          <>
            <div className="category-tabs" role="tablist" aria-label="球種系統">
              {PITCH_TYPE_GROUPS.map((group, index) => (
                <button
                  key={group.group}
                  type="button"
                  role="tab"
                  aria-selected={activeGroup === index}
                  className={`category-tab ${activeGroup === index ? 'active' : ''} ${groupIndexForType === index ? 'has-selection' : ''}`}
                  onClick={() => setActiveGroup(index)}
                >
                  {group.shortLabel}
                </button>
              ))}
            </div>
            <div className="type-grid">
              {currentGroup.types.map((type) => (
                <button
                  key={`${currentGroup.group}-${type.id}`}
                  type="button"
                  className={`type-btn ${pitchType === type.id ? 'active' : ''}`}
                  onClick={() => handleTypeSelect(type.id, activeGroup)}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="result-all-groups">
            <section className="result-section result-section-required" aria-label="通常の結果">
              <div className="result-section-head">
                <div className="result-subgroup-label">通常</div>
                <span className="result-section-badge required">必須</span>
              </div>
              {normalGroups.map((group) => (
                <div key={group} className="result-subgroup">
                  <div className="result-subgroup-label">{group}</div>
                  <div className="result-extra-grid">
                    {normalResults
                      .filter((item) => item.group === group)
                      .map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`result-extra-btn ${resultTone(item.id)} ${primaryResult === item.id ? 'active' : ''}`}
                          onClick={() => handlePrimarySelect(item.id)}
                        >
                          {item.label}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </section>

            <section className="result-section result-section-optional" aria-label="その他の結果">
              <div className="result-section-head">
                <div className="result-subgroup-label">その他</div>
                <span className="result-section-badge optional">任意</span>
              </div>
              <div className="result-extra-grid">
                {extraResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`result-extra-btn ${resultTone(item.id)} ${extraResult === item.id ? 'active' : ''}`}
                    onClick={() => handleExtraSelect(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {extraResult && (
                <button
                  type="button"
                  className="result-extra-clear"
                  onClick={() => {
                    onExtraResultChange(null)
                    onStealAttemptChange(null)
                  }}
                >
                  その他を解除
                </button>
              )}

              {extraResult === 'steal' && (
                <section className="result-section steal-section" aria-label="盗塁記録">
                  <div className="result-section-head">
                    <div className="result-subgroup-label">盗塁</div>
                    <span className="result-section-badge required">必須</span>
                  </div>
                  <div className="steal-outcome-toggle">
                    <button
                      type="button"
                      className={`steal-outcome-btn ${stealAttempt?.outcome === 'success' ? 'active' : ''}`}
                      onClick={() => handleStealOutcome('success')}
                    >
                      成功
                    </button>
                    <button
                      type="button"
                      className={`steal-outcome-btn ${stealAttempt?.outcome === 'failed' ? 'active' : ''}`}
                      onClick={() => handleStealOutcome('failed')}
                    >
                      失敗
                    </button>
                  </div>
                  <p className="out-target-note">盗塁する走者（複数可）</p>
                  <div className="out-target-grid">
                    {occupiedBases.map((base) => (
                      <button
                        key={base}
                        type="button"
                        className={`out-target-btn ${stealBases.includes(base) ? 'active' : ''}`}
                        onClick={() => handleStealBaseToggle(base)}
                      >
                        {getRunnerBaseLabel(base)}
                      </button>
                    ))}
                  </div>
                  {stealAttempt?.outcome === 'failed' && stealBases.length > 0 && (
                    <>
                      <p className="out-target-note">アウトになった走者</p>
                      <div className="out-target-grid">
                        {stealBases.map((base) => (
                          <button
                            key={base}
                            type="button"
                            className={`out-target-btn ${stealAttempt.outBase === base ? 'active' : ''}`}
                            onClick={() => handleStealOutBase(base)}
                          >
                            {getRunnerBaseLabel(base)}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {stealBases.length > 0 && !isStealSelectionAllowed(runners, stealBases) && (
                    <p className="steal-error">この走者の組み合わせでは盗塁できません</p>
                  )}
                </section>
              )}
            </section>

            {needsOutSelection && (
              <section className="result-section result-section-required out-target-section" aria-label="アウトの走者">
                <div className="result-section-head">
                  <div className="result-subgroup-label">アウト</div>
                  <span className="result-section-badge required">
                    {requiredOutCount === 2 ? '2人選択' : '1人選択'}
                  </span>
                </div>
                <p className="out-target-note">
                  {requiredOutCount === 2
                    ? 'アウトになった2人を選んでください'
                    : 'アウトになった走者または打者を選んでください'}
                </p>
                <div className="out-target-grid">
                  {availableOutTargets.map((target) => (
                    <button
                      key={target}
                      type="button"
                      className={`out-target-btn ${outsRecorded.includes(target) ? 'active' : ''}`}
                      onClick={() => handleOutTargetToggle(target)}
                    >
                      {getOutTargetLabel(target, batterLabel)}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {needsRunnerAdvanceSelection && (
              <section className="result-section result-section-optional advance-section" aria-label="走者の進塁">
                <div className="result-section-head">
                  <div className="result-subgroup-label">進塁</div>
                  <span className="result-section-badge optional">任意</span>
                </div>
                <p className="out-target-note">1塁進んだ走者（複数可・未選択は進塁なし）</p>
                <div className="out-target-grid">
                  {availableAdvanceBases.map((base) => (
                    <button
                      key={base}
                      type="button"
                      className={`out-target-btn ${runnersAdvanced.includes(base) ? 'active' : ''}`}
                      onClick={() => handleRunnerAdvanceToggle(base)}
                    >
                      {getRunnerBaseLabel(base)}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <footer className="record-panel-footer">
        {step === 'type' ? (
          <button type="button" className="ghost-btn wide-btn" onClick={() => setStep('result')}>
            結果を選ぶ →
          </button>
        ) : (
          <button type="button" className="ghost-btn wide-btn" onClick={() => setStep('type')}>
            ← 球種を変更
          </button>
        )}
        <button
          type="button"
          className="primary-btn pitch-submit-btn"
          disabled={
            !primaryResult ||
            (needsOutSelection && !outSelectionValid) ||
            !stealValid ||
            !runnerAdvanceValid
          }
          onClick={onSubmit}
        >
          記録する
        </button>
      </footer>
    </section>
  )
}
