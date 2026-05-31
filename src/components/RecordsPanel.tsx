import { useMemo, useState } from 'react'
import {
  formatPitchResultDisplay,
  getPitchResultColorClass,
  getPitchSideLabel,
  getPitchTypeLabel,
} from '../constants'
import { atBatEnds, formatSessionPitchers, formatSessionScore, getSessionProgressLabel } from '../gameLogic'
import {
  formatGameLabel,
  getSessionPitchCount,
  getSessionUpdatedAt,
  groupSessionPitchesByHalfInning,
  isSessionFinished,
} from '../storage'
import type { GameSession, PitchRecord } from '../types'

interface AtBatGroup {
  batterOrder: number
  pitches: PitchRecord[]
}

interface RecordsPanelProps {
  sessions: GameSession[]
  onBack: () => void
  onResumeSession: (sessionId: string) => void
  onDeleteSession: (sessionId: string) => void
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

function confirmDeleteSession(session: GameSession): boolean {
  const label = session.label || formatGameLabel(session.createdAt)
  return window.confirm(`「${label}」の記録を削除しますか？\nこの操作は取り消せません。`)
}

function getBatterLabel(session: GameSession, order: number): string {
  return session.batters.find((batter) => batter.order === order)?.label ?? `${order}番`
}

function pitchEndsAtBat(pitch: PitchRecord): boolean {
  return atBatEnds(pitch.primaryResult ?? pitch.result, pitch.countBefore, pitch.extraResult)
}

function groupPitchesIntoAtBats(pitches: PitchRecord[]): AtBatGroup[] {
  const groups: AtBatGroup[] = []
  let current: AtBatGroup | null = null

  for (const pitch of pitches) {
    const prevEnded =
      current != null &&
      current.pitches.length > 0 &&
      pitchEndsAtBat(current.pitches[current.pitches.length - 1]!)

    if (current == null || current.batterOrder !== pitch.batterOrder || prevEnded) {
      if (current) groups.push(current)
      current = { batterOrder: pitch.batterOrder, pitches: [pitch] }
      continue
    }
    current.pitches.push(pitch)
  }

  if (current) groups.push(current)
  return groups
}

function atBatFrameClass(pitches: PitchRecord[]): string {
  const last = pitches[pitches.length - 1]
  if (!last) return 'result-ongoing'
  if (!pitchEndsAtBat(last)) return 'result-ongoing'
  return getPitchResultColorClass(last)
}

function atBatSummary(pitches: PitchRecord[]): string {
  const last = pitches[pitches.length - 1]
  if (!last) return ''
  if (!pitchEndsAtBat(last)) return `${pitches.length}球 · 打席続行`
  return formatPitchResultDisplay(last)
}

function GameFlowList({ session }: { session: GameSession }) {
  const groups = useMemo(() => groupSessionPitchesByHalfInning(session), [session])
  const pitchCount = getSessionPitchCount(session)

  if (pitchCount === 0) {
    return <p className="records-empty">この試合の記録はまだありません</p>
  }

  return (
    <div className="records-game-flow">
      {groups.map((group) => (
        <section key={group.key} className="records-inning-block">
          <div className="records-inning-head">
            <h4>{group.label}</h4>
            <span className="records-inning-count">{group.pitches.length}球</span>
          </div>
          <div className="records-atbat-list">
            {groupPitchesIntoAtBats(group.pitches).map((atBat, atBatIndex) => {
              const frameClass = atBatFrameClass(atBat.pitches)
              return (
                <article
                  key={`${group.key}-${atBatIndex}-${atBat.batterOrder}`}
                  className={`records-atbat-card ${frameClass}`}
                >
                  <header className="records-atbat-head">
                    <strong className="records-atbat-batter">{getBatterLabel(session, atBat.batterOrder)}</strong>
                    <span className="records-atbat-pitch-count">{atBat.pitches.length}球</span>
                    <span className={`history-badge ${frameClass}`}>{atBatSummary(atBat.pitches)}</span>
                  </header>
                  <ul className="records-atbat-pitches">
                    {atBat.pitches.map((pitch, index) => (
                      <li key={pitch.id} className={`records-atbat-pitch ${getPitchResultColorClass(pitch)}`}>
                        <div className="records-atbat-pitch-index">{index + 1}</div>
                        <div className="history-body">
                          <div className="history-top">
                            <span className={`side-badge side-${pitch.pitchSide}`}>{getPitchSideLabel(pitch.pitchSide)}</span>
                            <strong>{pitch.zoneLabel}</strong>
                            <span className={`history-badge ${getPitchResultColorClass(pitch)}`}>
                              {formatPitchResultDisplay(pitch)}
                            </span>
                          </div>
                          <div className="history-bottom">
                            <span>{getPitchTypeLabel(pitch.pitchType)}</span>
                            <span>{pitch.pitcherName}</span>
                            <span className="history-count">
                              {pitch.countBefore.balls}-{pitch.countBefore.strikes} · {pitch.countBefore.outs}アウト
                            </span>
                            {pitch.runsScored != null && pitch.runsScored > 0 ? (
                              <span className="records-run-badge">+{pitch.runsScored}点</span>
                            ) : null}
                            <span>{formatTime(pitch.timestamp)}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </article>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

export function RecordsPanel({ sessions, onBack, onResumeSession, onDeleteSession }: RecordsPanelProps) {
  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => getSessionUpdatedAt(b) - getSessionUpdatedAt(a)),
    [sessions],
  )
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)

  const selectedSession = useMemo(
    () => sortedSessions.find((session) => session.id === selectedSessionId) ?? null,
    [sortedSessions, selectedSessionId],
  )

  const handleDelete = (session: GameSession) => {
    if (!confirmDeleteSession(session)) return
    onDeleteSession(session.id)
    if (selectedSessionId === session.id) {
      setSelectedSessionId(null)
    }
  }

  if (selectedSession) {
    const pitchCount = getSessionPitchCount(selectedSession)
    const label = selectedSession.label || formatGameLabel(selectedSession.createdAt)

    return (
      <div className="flow-screen browse-screen browse-detail-screen">
        <header className="flow-header panel-card">
          <button type="button" className="ghost-btn compact back-btn" onClick={() => setSelectedSessionId(null)}>
            ← 試合一覧
          </button>
          <div>
            <p className="app-kicker">試合の流れ</p>
            <h1>{label}</h1>
            <p className="records-detail-summary">
              {formatSessionPitchers(selectedSession)} · {formatSessionScore(selectedSession)} · {pitchCount}球
              {isSessionFinished(selectedSession) ? ' · 終了' : ` · ${getSessionProgressLabel(selectedSession)}`}
            </p>
          </div>
        </header>

        <section className="panel-card records-detail">
          <div className="records-detail-actions-bar">
            <button type="button" className="primary-btn compact" onClick={() => onResumeSession(selectedSession.id)}>
              {isSessionFinished(selectedSession) ? '記録を再開' : '続きから記録'}
            </button>
            <button
              type="button"
              className="ghost-btn compact danger-btn"
              onClick={() => handleDelete(selectedSession)}
            >
              削除
            </button>
          </div>
          <GameFlowList session={selectedSession} />
        </section>
      </div>
    )
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
          <p className="records-list-lead">見たい試合を選んでください</p>
        </div>
      </header>

      {sortedSessions.length === 0 ? (
        <div className="panel-card empty-state">
          <div className="empty-icon">📁</div>
          <p>保存された試合がありません</p>
          <p className="empty-hint">「記録する」から新しい試合を始めてください</p>
        </div>
      ) : (
        <section className="panel-card records-list">
          <ul className="records-game-list">
            {sortedSessions.map((session) => {
              const pitchCount = getSessionPitchCount(session)
              const label = session.label || formatGameLabel(session.createdAt)

              return (
                <li key={session.id}>
                  <button
                    type="button"
                    className="records-game-btn records-game-select-btn"
                    onClick={() => setSelectedSessionId(session.id)}
                  >
                    <span className="records-game-label">
                      {label}
                      {isSessionFinished(session) ? <span className="records-game-status">終了</span> : null}
                    </span>
                    <span className="records-game-meta">
                      {getSessionProgressLabel(session)} · {pitchCount}球 · {formatSessionScore(session)}
                    </span>
                    <span className="records-game-pitchers">{formatSessionPitchers(session)}</span>
                    <span className="records-game-date">{formatDate(getSessionUpdatedAt(session))}</span>
                    <span className="records-game-open">詳細を見る →</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
