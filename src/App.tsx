import { useEffect, useMemo, useState } from 'react'
import { CountBoard } from './components/CountBoard'
import { HistoryPanel } from './components/HistoryPanel'
import { MatchupPanel } from './components/MatchupPanel'
import { PitchForm } from './components/PitchForm'
import { PitchSideToggle } from './components/PitchSideToggle'
import { StatsPanel } from './components/StatsPanel'
import { StrikeZone } from './components/StrikeZone'
import { updateCount } from './countLogic'
import { getZoneLabel } from './constants'
import { createSession, loadAppData, saveAppData } from './storage'
import type { AppData, Count, Handedness, PitchRecord, PitchResult, PitchSide, PitchType, TabId } from './types'
import './App.css'

const initialCount: Count = { balls: 0, strikes: 0, outs: 0 }

function App() {
  const [data, setData] = useState<AppData>(() => loadAppData())
  const [tab, setTab] = useState<TabId>('record')
  const [count, setCount] = useState<Count>(initialCount)
  const [selectedRow, setSelectedRow] = useState<number | null>(null)
  const [selectedCol, setSelectedCol] = useState<number | null>(null)
  const [pitchType, setPitchType] = useState<PitchType>('fastball')
  const [result, setResult] = useState<PitchResult>('called_strike')
  const [pitchSide, setPitchSide] = useState<PitchSide>('opponent')
  const [batterHand, setBatterHand] = useState<Handedness>('right')
  const [pitcherArm, setPitcherArm] = useState<Handedness>('right')
  const [showForm, setShowForm] = useState(false)

  const activeSession = useMemo(() => {
    if (!data.activeSessionId) return null
    return data.sessions.find((s) => s.id === data.activeSessionId) ?? null
  }, [data])

  const pitcherName = activeSession?.pitcherName ?? ''
  const pitches = activeSession?.pitches ?? []

  useEffect(() => {
    if (activeSession) {
      setPitchSide(activeSession.defaultPitchSide)
      setBatterHand(activeSession.currentBatterHand)
      setPitcherArm(activeSession.currentPitcherArm)
    }
  }, [
    activeSession?.id,
    activeSession?.defaultPitchSide,
    activeSession?.currentBatterHand,
    activeSession?.currentPitcherArm,
  ])

  useEffect(() => {
    saveAppData(data)
  }, [data])

  useEffect(() => {
    if (!data.activeSessionId && data.sessions.length === 0) {
      const session = createSession('相手投手')
      setData({ sessions: [session], activeSessionId: session.id })
    } else if (!data.activeSessionId && data.sessions.length > 0) {
      setData((prev) => ({ ...prev, activeSessionId: prev.sessions[0].id }))
    }
  }, [data.activeSessionId, data.sessions.length])

  const updateData = (updater: (prev: AppData) => AppData) => {
    setData((prev) => updater(prev))
  }

  const handleZoneSelect = (row: number, col: number) => {
    setSelectedRow(row)
    setSelectedCol(col)
    setShowForm(true)
  }

  const handleSubmitPitch = () => {
    if (selectedRow === null || selectedCol === null || !data.activeSessionId) return

    const record: PitchRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      row: selectedRow,
      col: selectedCol,
      zoneLabel: getZoneLabel(selectedRow, selectedCol),
      pitchType,
      result,
      countBefore: { ...count },
      pitchSide,
      batterHand,
      pitcherArm,
      pitcherName,
    }

    updateData((prev) => ({
      ...prev,
      sessions: prev.sessions.map((session) =>
        session.id === prev.activeSessionId
          ? { ...session, pitches: [...session.pitches, record] }
          : session,
      ),
    }))

    setCount((prev) => updateCount(prev, result))
    setShowForm(false)
    setSelectedRow(null)
    setSelectedCol(null)
  }

  const handleUndo = () => {
    if (!data.activeSessionId || pitches.length === 0) return
    const last = pitches[pitches.length - 1]
    setCount(last.countBefore)
    setBatterHand(last.batterHand)
    setPitcherArm(last.pitcherArm)
    updateData((prev) => ({
      ...prev,
      sessions: prev.sessions.map((session) =>
        session.id === prev.activeSessionId
          ? { ...session, pitches: session.pitches.slice(0, -1) }
          : session,
      ),
    }))
  }

  const handleNewSession = () => {
    const name = window.prompt('相手投手名を入力', pitcherName || '相手投手')
    if (name === null) return
    const session = createSession(name)
    setCount(initialCount)
    setShowForm(false)
    setSelectedRow(null)
    setSelectedCol(null)
    updateData((prev) => ({
      sessions: [session, ...prev.sessions],
      activeSessionId: session.id,
    }))
    setTab('record')
  }

  const handleResetCount = () => {
    setCount(initialCount)
  }

  const updateSessionMatchup = (updates: {
    defaultPitchSide?: PitchSide
    currentBatterHand?: Handedness
    currentPitcherArm?: Handedness
    pitcherName?: string
  }) => {
    if (!data.activeSessionId) return
    updateData((prev) => ({
      ...prev,
      sessions: prev.sessions.map((session) =>
        session.id === prev.activeSessionId ? { ...session, ...updates } : session,
      ),
    }))
  }

  const handlePitchSideChange = (side: PitchSide) => {
    setPitchSide(side)
    updateSessionMatchup({ defaultPitchSide: side })
  }

  const handleBatterHandChange = (hand: Handedness) => {
    setBatterHand(hand)
    updateSessionMatchup({ currentBatterHand: hand })
  }

  const handlePitcherArmChange = (arm: Handedness) => {
    setPitcherArm(arm)
    updateSessionMatchup({ currentPitcherArm: arm })
  }

  const handleBatterChange = () => {
    setCount((prev) => ({ ...prev, balls: 0, strikes: 0 }))
  }

  const handlePitcherChange = () => {
    document.getElementById('pitcher-name')?.focus()
  }

  const handlePitcherNameChange = (value: string) => {
    updateSessionMatchup({ pitcherName: value })
  }

  const handleDeleteSession = () => {
    if (!data.activeSessionId) return
    if (!window.confirm('この記録セッションを削除しますか？')) return

    updateData((prev) => {
      const sessions = prev.sessions.filter((s) => s.id !== prev.activeSessionId)
      return {
        sessions,
        activeSessionId: sessions[0]?.id ?? null,
      }
    })
    setCount(initialCount)
    setShowForm(false)
  }

  return (
    <div className="app">
      <header className="app-header panel-card">
        <div className="header-main">
          <p className="app-kicker">eBASEBALL プロスピA</p>
          <h1>配球記録</h1>
        </div>
        <div className="pitch-badge">{pitches.length}球</div>
      </header>

      <section className="session-bar panel-card">
        <div className="session-top">
          <label className="session-label">投球者</label>
          <PitchSideToggle value={pitchSide} onChange={handlePitchSideChange} />
        </div>
        <label className="session-label" htmlFor="pitcher-name">
          投手名
        </label>
        <input
          id="pitcher-name"
          className="session-input"
          value={pitcherName}
          onChange={(e) => handlePitcherNameChange(e.target.value)}
          placeholder={pitchSide === 'self' ? '自分の投手名' : '相手投手名'}
        />
        <div className="session-actions">
          <button type="button" className="ghost-btn compact" onClick={handleResetCount} title="カウント重置">
            重置
          </button>
          <button type="button" className="primary-btn compact" onClick={handleNewSession}>
            新規
          </button>
          <button type="button" className="danger-btn compact" onClick={handleDeleteSession} title="セッション削除">
            削除
          </button>
        </div>
      </section>

      <MatchupPanel
        batterHand={batterHand}
        pitcherArm={pitcherArm}
        onBatterHandChange={handleBatterHandChange}
        onPitcherArmChange={handlePitcherArmChange}
        onBatterChange={handleBatterChange}
        onPitcherChange={handlePitcherChange}
      />

      <CountBoard count={count} onChange={setCount} />

      <main className="app-main">
        {tab === 'record' && (
          <>
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
          </>
        )}
        {tab === 'history' && <HistoryPanel pitches={pitches} onUndo={handleUndo} />}
        {tab === 'stats' && <StatsPanel pitches={pitches} />}
      </main>

      <nav className="tab-bar">
        {(
          [
            ['record', '記録', '◎'],
            ['history', '履歴', '☰'],
            ['stats', '分析', '▦'],
          ] as const
        ).map(([id, label, icon]) => (
          <button
            key={id}
            type="button"
            className={`tab-btn ${tab === id ? 'active' : ''}`}
            onClick={() => setTab(id)}
          >
            <span className="tab-icon">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App
