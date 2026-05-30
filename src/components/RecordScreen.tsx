import { useMemo, useState } from 'react'
import { CountBoard } from './CountBoard'
import { MatchupPanel } from './MatchupPanel'
import { PitchForm } from './PitchForm'
import { PitchSideToggle } from './PitchSideToggle'
import { StrikeZone } from './StrikeZone'
import { advanceGameState, formatInningLabel } from '../gameLogic'
import { getZoneLabel, isInStrikeZone } from '../constants'
import { getActiveBatter, getLastSessionPitch, getSessionPitchCount } from '../storage'
import type { AppData, Count, GameSession, Handedness, PitchRecord, PitchResult, PitchSide, PitchType } from '../types'

interface RecordScreenProps {
  data: AppData
  sessionId: string
  onChange: (updater: (prev: AppData) => AppData) => void
  onBack: () => void
}

export function RecordScreen({ data, sessionId, onChange, onBack }: RecordScreenProps) {
  const session = useMemo(
    () => data.sessions.find((item) => item.id === sessionId) ?? null,
    [data.sessions, sessionId],
  )
  const activeBatter = useMemo(() => getActiveBatter(session), [session])
  const [selectedRow, setSelectedRow] = useState<number | null>(null)
  const [selectedCol, setSelectedCol] = useState<number | null>(null)
  const [pitchType, setPitchType] = useState<PitchType>('fastball')
  const [result, setResult] = useState<PitchResult>('called_strike')
  const [pitchSide, setPitchSide] = useState<PitchSide>(session?.defaultPitchSide ?? 'opponent')
  const [pitcherArm, setPitcherArm] = useState<Handedness>(session?.currentPitcherArm ?? 'right')
  const [showForm, setShowForm] = useState(false)

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
  const pitches = activeBatter.pitches
  const gamePitchCount = getSessionPitchCount(session)
  const canUndo = gamePitchCount > 0

  const updateSession = (updater: (prev: GameSession) => GameSession) => {
    onChange((prev) => ({
      ...prev,
      sessions: prev.sessions.map((item) => (item.id === sessionId ? updater(item) : item)),
    }))
  }

  const handleZoneSelect = (row: number, col: number) => {
    setSelectedRow(row)
    setSelectedCol(col)
    if (isInStrikeZone(row, col)) {
      setResult((prev) => (prev === 'ball' ? 'called_strike' : prev))
    } else {
      setResult((prev) => (prev === 'called_strike' ? 'ball' : prev))
    }
    setShowForm(true)
  }

  const handleSubmitPitch = () => {
    if (selectedRow === null || selectedCol === null) return

    const countBefore = { ...count }
    const record: PitchRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      row: selectedRow,
      col: selectedCol,
      zoneLabel: getZoneLabel(selectedRow, selectedCol),
      pitchType,
      result,
      countBefore,
      pitchSide,
      batterHand,
      pitcherArm,
      pitcherName: session.pitcherName,
      batterOrder: activeBatter.order,
      inning: session.inning,
      halfInning: session.halfInning,
    }

    const nextState = advanceGameState(session, countBefore, result)

    updateSession((prev) => ({
      ...prev,
      ...nextState,
      defaultPitchSide: pitchSide,
      currentPitcherArm: pitcherArm,
      batters: prev.batters.map((batter) =>
        batter.id === activeBatter.id ? { ...batter, pitches: [...batter.pitches, record] } : batter,
      ),
    }))

    setShowForm(false)
    setSelectedRow(null)
    setSelectedCol(null)
  }

  const handleUndo = () => {
    const current = data.sessions.find((item) => item.id === sessionId)
    if (!current) return
    const last = getLastSessionPitch(current)
    if (!last) return

    updateSession((prev) => ({
      ...prev,
      inning: last.pitch.inning,
      halfInning: last.pitch.halfInning,
      activeBatterOrder: last.pitch.batterOrder,
      count: { ...last.pitch.countBefore },
      batters: prev.batters.map((batter) =>
        batter.id === last.batter.id
          ? { ...batter, pitches: batter.pitches.filter((pitch) => pitch.id !== last.pitch.id) }
          : batter,
      ),
    }))
    setShowForm(false)
    setSelectedRow(null)
    setSelectedCol(null)
  }

  const handleCountChange = (nextCount: Count) => {
    updateSession((prev) => ({ ...prev, count: nextCount }))
  }

  const handlePitchSideChange = (side: PitchSide) => {
    setPitchSide(side)
    updateSession((prev) => ({ ...prev, defaultPitchSide: side }))
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

  return (
    <div className="flow-screen record-screen">
      <header className="record-header panel-card">
        <div className="record-header-top">
          <button type="button" className="ghost-btn compact back-btn" onClick={onBack}>
            ← ホーム
          </button>
          <button type="button" className="ghost-btn compact" onClick={handleUndo} disabled={!canUndo}>
            1球戻す
          </button>
        </div>

        <div className="record-status-grid">
          <div className="record-status-item">
            <span className="record-status-label">イニング</span>
            <strong>{formatInningLabel(session.inning, session.halfInning)}</strong>
          </div>
          <div className="record-status-item">
            <span className="record-status-label">打者</span>
            <strong>{batterLabel}</strong>
          </div>
          <div className="record-status-item">
            <span className="record-status-label">投手</span>
            <strong>{session.pitcherName}</strong>
          </div>
          <div className="record-status-item">
            <span className="record-status-label">記録</span>
            <strong>{gamePitchCount}球</strong>
          </div>
        </div>
      </header>

      <section className="session-bar panel-card compact-bar">
        <div className="session-top">
          <label className="session-label">投球者</label>
          <PitchSideToggle value={pitchSide} onChange={handlePitchSideChange} />
        </div>
      </section>

      <MatchupPanel
        batterLabel={batterLabel}
        batterHand={batterHand}
        pitcherArm={pitcherArm}
        onBatterHandChange={handleBatterHandChange}
        onPitcherArmChange={handlePitcherArmChange}
      />

      <CountBoard count={count} onChange={handleCountChange} />

      <main className="app-main record-main">
        <StrikeZone
          pitches={pitches}
          selectedRow={selectedRow}
          selectedCol={selectedCol}
          onSelect={handleZoneSelect}
        />

        {showForm && selectedRow !== null && selectedCol !== null && (
          <div className="form-overlay">
            <PitchForm
              zoneLabel={getZoneLabel(selectedRow, selectedCol)}
              inZone={isInStrikeZone(selectedRow, selectedCol)}
              pitchSide={pitchSide}
              onPitchSideChange={handlePitchSideChange}
              batterHand={batterHand}
              pitcherArm={pitcherArm}
              pitchType={pitchType}
              result={result}
              onPitchTypeChange={setPitchType}
              onResultChange={setResult}
              onSubmit={handleSubmitPitch}
              onCancel={() => {
                setShowForm(false)
                setSelectedRow(null)
                setSelectedCol(null)
              }}
            />
          </div>
        )}
      </main>
    </div>
  )
}
