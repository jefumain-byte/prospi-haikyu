import { useEffect, useMemo, useState } from 'react'
import { GameSituationBoard } from './GameSituationBoard'
import { PitcherChangePanel } from './PitcherChangePanel'
import { PitchForm } from './PitchForm'
import { StrikeZone } from './StrikeZone'
import { advanceGameState, formatInningLabel, getActiveBatterOrder, getCurrentPitcherName, resolvePitchSide } from '../gameLogic'
import { getZoneLabel, isInStrikeZone } from '../constants'
import { formatGameLabel, getActiveBatter, getLastSessionPitch, getSessionPitchCount } from '../storage'
import type { AppData, GameSession, Handedness, OutTarget, PitchRecord, PitchResult, PitchSide, PitchType, RunnerBase, StealAttempt } from '../types'
import { isOutSelectionValid } from '../outLogic'
import { isRunnerAdvanceSelectionValid, requiresRunnerAdvanceSelection } from '../runnerAdvanceLogic'
import { isStealAttemptValid } from '../stealLogic'

interface RecordScreenProps {
  data: AppData
  sessionId: string
  onChange: (updater: (prev: AppData) => AppData) => void
  onBack: () => void
  onFinishGame: () => void
}

export function RecordScreen({ data, sessionId, onChange, onBack, onFinishGame }: RecordScreenProps) {
  const session = useMemo(
    () => data.sessions.find((item) => item.id === sessionId) ?? null,
    [data.sessions, sessionId],
  )
  const activeBatter = useMemo(() => getActiveBatter(session), [session])
  const activeBatterOrder = session ? getActiveBatterOrder(session) : 1
  const [selectedRow, setSelectedRow] = useState<number | null>(null)
  const [selectedCol, setSelectedCol] = useState<number | null>(null)
  const [pitchType, setPitchType] = useState<PitchType>('fastball')
  const [primaryResult, setPrimaryResult] = useState<PitchResult>('called_strike')
  const [extraResult, setExtraResult] = useState<PitchResult | null>(null)
  const [outsRecorded, setOutsRecorded] = useState<OutTarget[]>([])
  const [stealAttempt, setStealAttempt] = useState<StealAttempt | null>(null)
  const [runnersAdvanced, setRunnersAdvanced] = useState<RunnerBase[]>([])
  const [pitcherArm, setPitcherArm] = useState<Handedness>(session?.currentPitcherArm ?? 'right')

  useEffect(() => {
    setSelectedRow(null)
    setSelectedCol(null)
    setExtraResult(null)
    setOutsRecorded([])
    setStealAttempt(null)
    setRunnersAdvanced([])
  }, [session?.inning, session?.halfInning, activeBatterOrder])

  const atBatPitches = useMemo(() => {
    if (!session || !activeBatter) return []
    return activeBatter.pitches.filter(
      (pitch) =>
        pitch.inning === session.inning &&
        pitch.halfInning === session.halfInning &&
        pitch.batterOrder === activeBatterOrder,
    )
  }, [activeBatter, session, activeBatterOrder])

  if (!session || !activeBatter) {
    return (
      <div className="flow-screen">
        <div className="panel-card empty-state">
          <p>試合データが見つかりません</p>
          <button type="button" className="primary-btn" onClick={onBack}>
            ホームへ戻る
          </button>
        </div>
      </div>
    )
  }

  const count = session.count
  const batterHand = activeBatter.batterHand
  const batterLabel = activeBatter.label
  const gamePitchCount = getSessionPitchCount(session)
  const canUndo = gamePitchCount > 0
  const pitchSide = resolvePitchSide(session.battingFirst, session.halfInning)
  const pitchSideLabel = pitchSide === 'opponent' ? '敵' : '自分'
  const currentPitcherName = getCurrentPitcherName(session)
  const zoneSelected = selectedRow !== null && selectedCol !== null

  const updateSession = (updater: (prev: GameSession) => GameSession) => {
    onChange((prev) => ({
      ...prev,
      sessions: prev.sessions.map((item) => (item.id === sessionId ? updater(item) : item)),
    }))
  }

  const clearSelection = () => {
    setSelectedRow(null)
    setSelectedCol(null)
    setExtraResult(null)
    setOutsRecorded([])
    setStealAttempt(null)
    setRunnersAdvanced([])
  }

  const handleZoneSelect = (row: number, col: number) => {
    setSelectedRow(row)
    setSelectedCol(col)
    setExtraResult(null)
    setOutsRecorded([])
    setStealAttempt(null)
    setRunnersAdvanced([])
    if (isInStrikeZone(row, col)) {
      setPrimaryResult((prev) => (prev === 'ball' ? 'called_strike' : prev))
    } else {
      setPrimaryResult((prev) => (prev === 'called_strike' ? 'ball' : prev))
    }
  }

  const handleSubmitPitch = () => {
    if (selectedRow === null || selectedCol === null) return

    const countBefore = { ...count }
    const runnersBefore = { ...session.runners }
    const selfScoreBefore = session.selfScore
    const opponentScoreBefore = session.opponentScore
    const currentPitchSide = resolvePitchSide(session.battingFirst, session.halfInning)
    const outCheckResult = extraResult && extraResult !== 'steal' ? extraResult : primaryResult
    const stealForSubmit = extraResult === 'steal' ? stealAttempt : null
    const outsForSubmit = outsRecorded.length ? outsRecorded : undefined
    const advanceForSubmit = requiresRunnerAdvanceSelection(runnersBefore, countBefore.outs, outCheckResult)
      ? runnersAdvanced
      : undefined
    if (!isOutSelectionValid(outsRecorded, outCheckResult, runnersBefore)) return
    if (extraResult === 'steal' && !isStealAttemptValid(runnersBefore, stealForSubmit)) return
    if (
      !isRunnerAdvanceSelectionValid(
        runnersBefore,
        countBefore.outs,
        outCheckResult,
        runnersAdvanced,
        outsForSubmit,
      )
    ) {
      return
    }

    const { runsScored, scoringSide, holdBatterOrderAfterHalf, ...nextState } = advanceGameState(
      session,
      countBefore,
      primaryResult,
      extraResult,
      outsForSubmit,
      stealForSubmit,
      advanceForSubmit?.length ? advanceForSubmit : undefined,
    )

    const effectiveResult = extraResult && extraResult !== 'steal' ? extraResult : primaryResult

    const record: PitchRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      row: selectedRow,
      col: selectedCol,
      zoneLabel: getZoneLabel(selectedRow, selectedCol),
      pitchType,
      result: effectiveResult,
      primaryResult,
      ...(extraResult ? { extraResult } : {}),
      ...(stealForSubmit ? { stealAttempt: stealForSubmit } : {}),
      ...(holdBatterOrderAfterHalf ? { holdBatterOrderAfterHalf: true } : {}),
      ...(outsForSubmit ? { outsRecorded: outsForSubmit } : {}),
      ...(advanceForSubmit?.length ? { runnersAdvanced: advanceForSubmit } : {}),
      countBefore,
      runnersBefore,
      pitchSide: currentPitchSide,
      batterHand,
      pitcherArm,
      pitcherName: getCurrentPitcherName(session),
      batterOrder: activeBatter.order,
      inning: session.inning,
      halfInning: session.halfInning,
      selfScoreBefore,
      opponentScoreBefore,
      selfBatterOrderBefore: session.selfBatterOrder,
      opponentBatterOrderBefore: session.opponentBatterOrder,
      heldBatterOrderBefore: session.heldBatterOrder,
      heldBattingSideBefore: session.heldBattingSide,
      ...(runsScored > 0 && scoringSide
        ? { runsScored, scoringSide }
        : {}),
    }

    updateSession((prev) => ({
      ...prev,
      ...nextState,
      currentPitcherArm: pitcherArm,
      batters: prev.batters.map((batter) =>
        batter.id === activeBatter.id ? { ...batter, pitches: [...batter.pitches, record] } : batter,
      ),
    }))

    clearSelection()
  }

  const handleUndo = () => {
    const current = data.sessions.find((item) => item.id === sessionId)
    if (!current) return
    const last = getLastSessionPitch(current)
    if (!last) return

    updateSession((prev) => {
      const selfBatterOrder = last.pitch.selfBatterOrderBefore ?? last.pitch.batterOrder
      const opponentBatterOrder = last.pitch.opponentBatterOrderBefore ?? last.pitch.batterOrder
      return {
        ...prev,
        inning: last.pitch.inning,
        halfInning: last.pitch.halfInning,
        selfBatterOrder,
        opponentBatterOrder,
        activeBatterOrder: getActiveBatterOrder({
          battingFirst: prev.battingFirst,
          halfInning: last.pitch.halfInning,
          selfBatterOrder,
          opponentBatterOrder,
        }),
        count: { ...last.pitch.countBefore },
        runners: { ...last.pitch.runnersBefore },
        selfScore: last.pitch.selfScoreBefore ?? 0,
        opponentScore: last.pitch.opponentScoreBefore ?? 0,
        heldBatterOrder: last.pitch.heldBatterOrderBefore,
        heldBattingSide: last.pitch.heldBattingSideBefore,
        batters: prev.batters.map((batter) =>
          batter.id === last.batter.id
            ? { ...batter, pitches: batter.pitches.filter((pitch) => pitch.id !== last.pitch.id) }
            : batter,
        ),
      }
    })
    clearSelection()
  }

  const handleBatterHandChange = (hand: Handedness) => {
    updateSession((prev) => ({
      ...prev,
      batters: prev.batters.map((batter) =>
        batter.id === activeBatter.id ? { ...batter, batterHand: hand } : batter,
      ),
    }))
  }

  const handlePitcherArmChange = (arm: Handedness) => {
    setPitcherArm(arm)
    updateSession((prev) => ({ ...prev, currentPitcherArm: arm }))
  }

  const handlePitcherChange = (side: PitchSide, name: string) => {
    updateSession((prev) => ({
      ...prev,
      selfPitcherName: side === 'self' ? name : prev.selfPitcherName,
      opponentPitcherName: side === 'opponent' ? name : prev.opponentPitcherName,
    }))
    clearSelection()
  }

  const handleFinishGame = () => {
    const label = session.label || formatGameLabel(session.createdAt)
    if (!window.confirm(`「${label}」を終了しますか？\n記録は保存され、ホームに戻ります。`)) {
      return
    }
    onFinishGame()
  }

  return (
    <div className="flow-screen record-screen">
      <header className="record-toolbar panel-card">
        <button type="button" className="ghost-btn compact back-btn" onClick={onBack}>
          ←
        </button>
        <div className="record-toolbar-center">
          <strong>{formatInningLabel(session.inning, session.halfInning)}</strong>
          <span className="record-toolbar-sub">{batterLabel}</span>
          <span className={`record-toolbar-pitcher side-${pitchSide}`}>
            <span className={`side-badge side-${pitchSide}`}>{pitchSideLabel}</span>
            <span className="record-toolbar-pitcher-name">{currentPitcherName}</span>
          </span>
        </div>
        <button type="button" className="ghost-btn compact undo-btn" onClick={handleUndo} disabled={!canUndo}>
          戻す
        </button>
      </header>

      <GameSituationBoard
        count={count}
        runners={session.runners}
        selfScore={session.selfScore}
        opponentScore={session.opponentScore}
        inning={session.inning}
        specialExtraInningStart={session.specialExtraInningStart}
        activeBatterOrder={getActiveBatterOrder(session)}
        batterHand={batterHand}
        pitcherArm={pitcherArm}
        onBatterHandChange={handleBatterHandChange}
        onPitcherArmChange={handlePitcherArmChange}
      />

      <PitcherChangePanel
        pitchSide={pitchSide}
        selfPitcherName={session.selfPitcherName}
        opponentPitcherName={session.opponentPitcherName}
        pitcherArm={pitcherArm}
        onChangePitcher={handlePitcherChange}
      />

      <main className="record-workspace">
        <StrikeZone
          pitches={atBatPitches}
          selectedRow={selectedRow}
          selectedCol={selectedCol}
          onSelect={handleZoneSelect}
        />

        {zoneSelected ? (
          <PitchForm
            zoneLabel={getZoneLabel(selectedRow, selectedCol)}
            inZone={isInStrikeZone(selectedRow, selectedCol)}
            runners={session.runners}
            outs={count.outs}
            batterLabel={batterLabel}
            batterHand={batterHand}
            pitcherArm={pitcherArm}
            pitchType={pitchType}
            primaryResult={primaryResult}
            extraResult={extraResult}
            outsRecorded={outsRecorded}
            stealAttempt={stealAttempt}
            runnersAdvanced={runnersAdvanced}
            onPitchTypeChange={setPitchType}
            onPrimaryResultChange={setPrimaryResult}
            onExtraResultChange={setExtraResult}
            onOutsRecordedChange={setOutsRecorded}
            onStealAttemptChange={setStealAttempt}
            onRunnersAdvancedChange={setRunnersAdvanced}
            onSubmit={handleSubmitPitch}
            onCancel={clearSelection}
          />
        ) : (
          <div className="record-placeholder panel-card">
            <p>ストライクゾーンのマスをタップ</p>
            <p className="record-placeholder-sub">球種 → 結果 → 記録する</p>
          </div>
        )}

        <p className="record-footnote">この打席 {atBatPitches.length}球 · 試合 {gamePitchCount}球</p>
      </main>

      <footer className="record-finish panel-card">
        <button type="button" className="ghost-btn record-finish-btn" onClick={handleFinishGame}>
          試合終了
        </button>
      </footer>
    </div>
  )
}
