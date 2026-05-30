import { useMemo, useState } from 'react'
import {
  getBatterHandLabel,
  getPitchResultLabel,
  getPitchSideLabel,
  getPitchTypeLabel,
  getPitcherArmLabel,
} from '../constants'
import { formatInningLabel } from '../gameLogic'
import { formatGameLabel, getSessionPitchCount } from '../storage'
import type { BatterRecord, GameSession, PitchRecord, PitchResult } from '../types'

interface RecordsPanelProps {
  sessions: GameSession[]
  onBack: () => void
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function resultClass(result: PitchResult): string {
  if (result === 'ball' || result === 'walk' || result === 'hbp') return 'result-ball'
  if (['called_strike', 'swinging_strike', 'foul'].includes(result)) return 'result-strike'
  if (['single', 'double', 'triple', 'homerun'].includes(result)) return 'result-hit'
  return 'result-out'
}

function PitchMiniList({ pitches }: { pitches: PitchRecord[] }) {
  if (pitches.length === 0) {
    return <p className="records-empty">この打者の記録はまだありません</p>
  }

  const reversed = [...pitches].reverse()

  return (
    <ul className="history-list records-pitch-list">
      {reversed.map((pitch, index) => (
        <li key={pitch.id} className={`history-item ${resultClass(pitch.result)}`}>
          <div className="history-index">{pitches.length - index}</div>
          <div className="history-body">
            <div className="history-top">
              <span className="inning-badge">{formatInningLabel(pitch.inning, pitch.halfInning)}</span>
              <span className={`side-badge side-${pitch.pitchSide}`}>{getPitchSideLabel(pitch.pitchSide)}</span>
              <strong>{pitch.zoneLabel}</strong>
              <span className={`history-badge ${resultClass(pitch.result)}`}>
                {getPitchResultLabel(pitch.result)}
              </span>
            </div>
            <div className="history-bottom">
              <span>{getPitchTypeLabel(pitch.pitchType)}</span>
              <span className="hand-badge">{getBatterHandLabel(pitch.batterHand)}</span>
              <span className="hand-badge">{getPitcherArmLabel(pitch.pitcherArm)}</span>
              <span className="history-count">
                {pitch.countBefore.balls}-{pitch.countBefore.strikes}
              </span>
              <span>{formatTime(pitch.timestamp)}</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function RecordsPanel({ sessions, onBack }: RecordsPanelProps) {
  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => b.createdAt - a.createdAt),
    [sessions],
  )
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(sortedSessions[0]?.id ?? null)
  const [selectedBatterId, setSelectedBatterId] = useState<string | null>(sortedSessions[0]?.batters[0]?.id ?? null)

  const selectedSession = useMemo(
    () => sortedSessions.find((session) => session.id === selectedSessionId) ?? null,
    [sortedSessions, selectedSessionId],
  )

  const selectedBatter = useMemo(() => {
    if (!selectedSession) return null
    return selectedSession.batters.find((batter) => batter.id === selectedBatterId) ?? selectedSession.batters[0] ?? null
  }, [selectedSession, selectedBatterId])

  const handleSelectSession = (session: GameSession) => {
    setSelectedSessionId(session.id)
    setSelectedBatterId(session.batters[0]?.id ?? null)
  }

  const handleSelectBatter = (batter: BatterRecord) => {
    setSelectedBatterId(batter.id)
  }

  return (
    <div className="flow-screen browse-screen">
      <header className="flow-header panel-card">
        <button type="button" className="ghost-btn compact back-btn" onClick={onBack}>
          ← ホーム
        </button>
        <div>
          <p className="app-kicker">保存済み</p>
          <h1>記録を閲覧</h1>
        </div>
      </header>

      {sortedSessions.length === 0 ? (
        <div className="panel-card empty-state">
          <div className="empty-icon">📁</div>
          <p>保存された試合がありません</p>
          <p className="empty-hint">「記録する」から新しい試合を始めてください</p>
        </div>
      ) : (
        <div className="records-panel">
          <div className="records-layout">
            <section className="panel-card records-tree">
              <h3>試合</h3>
              <ul className="records-game-list">
                {sortedSessions.map((session) => {
                  const pitchCount = getSessionPitchCount(session)
                  const isActive = session.id === selectedSessionId
                  const batters = [...session.batters].sort((a, b) => a.order - b.order)

                  return (
                    <li key={session.id}>
                      <button
                        type="button"
                        className={`records-game-btn ${isActive ? 'active' : ''}`}
                        onClick={() => handleSelectSession(session)}
                      >
                        <span className="records-game-label">{session.label || formatGameLabel(session.createdAt)}</span>
                        <span className="records-game-meta">
                          {session.pitcherName} · {pitchCount}球
                        </span>
                        <span className="records-game-date">{formatDate(session.createdAt)}</span>
                      </button>

                      {isActive && (
                        <ul className="records-batter-list">
                          {batters.map((batter) => (
                            <li key={batter.id}>
                              <button
                                type="button"
                                className={`records-batter-btn ${batter.id === selectedBatterId ? 'active' : ''}`}
                                onClick={() => handleSelectBatter(batter)}
                              >
                                <span>{batter.label}</span>
                                <span className="records-batter-meta">
                                  {getBatterHandLabel(batter.batterHand)} · {batter.pitches.length}球
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>

            <section className="panel-card records-detail">
              {selectedSession && selectedBatter ? (
                <>
                  <div className="panel-head">
                    <div>
                      <h3>{selectedBatter.label}</h3>
                      <p className="panel-sub">
                        {selectedSession.label} / {selectedSession.pitcherName} · {selectedBatter.pitches.length}球
                      </p>
                    </div>
                  </div>
                  <PitchMiniList pitches={selectedBatter.pitches} />
                </>
              ) : (
                <p className="records-empty">打者を選んでください</p>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  )
}
