import { useEffect, useMemo, useState } from 'react'
import { formatSessionPitchers, formatSessionScore, getSessionProgressLabel } from '../gameLogic'
import {
  formatGameLabel,
  getSessionPitchCount,
  getSessionUpdatedAt,
  isSessionFinished,
} from '../storage'
import type { GameSession } from '../types'
import { GameRecordFlow } from './GameRecordFlow'
import { GameRecordSummary } from './GameRecordSummary'

interface RecordsPanelProps {
  sessions: GameSession[]
  onBack: () => void
  onResumeSession: (sessionId: string) => void
  onDeleteSession: (sessionId: string) => void
  initialSelectedSessionId?: string | null
  detailBackLabel?: string
  onDetailBack?: () => void
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

function gameResultLabel(session: GameSession): string | null {
  if (session.finishedAt == null) return '記録中'
  if (session.selfScore > session.opponentScore) return '勝'
  if (session.selfScore < session.opponentScore) return '敗'
  return '分'
}

function gameResultClass(label: string | null): string {
  if (label === '勝') return 'win'
  if (label === '敗') return 'loss'
  if (label === '分') return 'draw'
  return 'ongoing'
}

export function RecordsPanel({
  sessions,
  onBack,
  onResumeSession,
  onDeleteSession,
  initialSelectedSessionId = null,
  detailBackLabel,
  onDetailBack,
}: RecordsPanelProps) {
  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => getSessionUpdatedAt(b) - getSessionUpdatedAt(a)),
    [sessions],
  )
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(initialSelectedSessionId)

  useEffect(() => {
    if (initialSelectedSessionId) {
      setSelectedSessionId(initialSelectedSessionId)
    }
  }, [initialSelectedSessionId])

  const selectedSession = useMemo(
    () => sortedSessions.find((session) => session.id === selectedSessionId) ?? null,
    [sortedSessions, selectedSessionId],
  )

  const handleDelete = (session: GameSession) => {
    if (!confirmDeleteSession(session)) return
    onDeleteSession(session.id)
    if (selectedSessionId === session.id) {
      if (onDetailBack) onDetailBack()
      else setSelectedSessionId(null)
    }
  }

  const handleDetailBack = () => {
    if (onDetailBack) {
      onDetailBack()
      return
    }
    setSelectedSessionId(null)
  }

  if (selectedSession) {
    const pitchCount = getSessionPitchCount(selectedSession)
    const label = selectedSession.label || formatGameLabel(selectedSession.createdAt)
    const result = gameResultLabel(selectedSession)

    return (
      <div className="flow-screen browse-screen browse-detail-screen">
        <header className="flow-header panel-card">
          <button type="button" className="ghost-btn compact back-btn" onClick={handleDetailBack}>
            {detailBackLabel ?? '← 試合一覧'}
          </button>
          <div>
            <p className="app-kicker">試合の流れ</p>
            <h1>{label}</h1>
            <p className="records-detail-summary">
              {formatSessionPitchers(selectedSession)} · {formatSessionScore(selectedSession)} · {pitchCount}球
              {isSessionFinished(selectedSession) ? ' · 終了' : ` · ${getSessionProgressLabel(selectedSession)}`}
            </p>
            {result ? (
              <p className="records-detail-result">
                <span className={`records-game-result-badge result-${gameResultClass(result)}`}>{result}</span>
                <span>{formatDate(getSessionUpdatedAt(selectedSession))}</span>
              </p>
            ) : null}
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
          <GameRecordSummary session={selectedSession} />
          <GameRecordFlow session={selectedSession} />
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
          <p className="records-list-lead">試合を選ぶとイニング別・打席別の詳細が見られます</p>
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
              const result = gameResultLabel(session)

              return (
                <li key={session.id}>
                  <button
                    type="button"
                    className="records-game-btn records-game-select-btn"
                    onClick={() => setSelectedSessionId(session.id)}
                  >
                    <div className="records-game-btn-head">
                      <span className="records-game-label">
                        {label}
                        {result ? (
                          <span className={`records-game-result-badge result-${gameResultClass(result)}`}>{result}</span>
                        ) : null}
                      </span>
                      <span className="records-game-open">詳細 →</span>
                    </div>
                    <span className="records-game-meta">
                      {getSessionProgressLabel(session)} · {pitchCount}球 · {formatSessionScore(session)}
                    </span>
                    <span className="records-game-pitchers">{formatSessionPitchers(session)}</span>
                    <span className="records-game-date">{formatDate(getSessionUpdatedAt(session))}</span>
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
