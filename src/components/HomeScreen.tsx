import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { PitcherNameInput } from './PitcherNameInput'
import { BATTING_FIRST_OPTIONS } from '../constants'
import { resolvePitcherName } from '../data/pitcherNames'
import { formatSessionPitchers, getSessionProgressLabel, getSetupPitcherFields } from '../gameLogic'
import { formatGameLabel, getActiveSession, getSessionPitchCount } from '../storage'
import type { BattingFirst, GameSession } from '../types'

interface SessionEditFields {
  label: string
  selfPitcherName: string
  opponentPitcherName: string
}

interface HomeScreenProps {
  battingFirst: BattingFirst
  sessions: GameSession[]
  onBattingFirstChange: (value: BattingFirst) => void
  onBrowse: () => void
  onAnalysis: () => void
  onRecord: () => void
  onResumeSession: (sessionId: string) => void
  onUpdateSession: (sessionId: string, fields: SessionEditFields) => void
  onDeleteSession: (sessionId: string) => void
}

function toEditFields(session: GameSession): SessionEditFields {
  return {
    label: session.label,
    selfPitcherName: session.selfPitcherName,
    opponentPitcherName: session.opponentPitcherName,
  }
}

function confirmDeleteSession(session: GameSession): boolean {
  const label = session.label || formatGameLabel(session.createdAt)
  return window.confirm(`「${label}」の記録を削除しますか？\nこの操作は取り消せません。`)
}

export function HomeScreen({
  battingFirst,
  sessions,
  onBattingFirstChange,
  onBrowse,
  onAnalysis,
  onRecord,
  onResumeSession,
  onUpdateSession,
  onDeleteSession,
}: HomeScreenProps) {
  const latestSession = useMemo(() => getActiveSession(sessions), [sessions])
  const setupPitcherFields = useMemo(
    () => (latestSession ? getSetupPitcherFields(latestSession.battingFirst) : null),
    [latestSession],
  )
  const [isEditing, setIsEditing] = useState(false)
  const [editFields, setEditFields] = useState<SessionEditFields>(() =>
    latestSession ? toEditFields(latestSession) : { label: '', selfPitcherName: '', opponentPitcherName: '' },
  )

  useEffect(() => {
    if (!latestSession) {
      setIsEditing(false)
      return
    }
    setEditFields(toEditFields(latestSession))
    setIsEditing(false)
  }, [latestSession?.id, latestSession?.label, latestSession?.selfPitcherName, latestSession?.opponentPitcherName])

  const canSaveEdit =
    editFields.label.trim() && editFields.selfPitcherName.trim() && editFields.opponentPitcherName.trim()

  const handleSaveEdit = (event: FormEvent) => {
    event.preventDefault()
    if (!latestSession || !canSaveEdit) return
    onUpdateSession(latestSession.id, {
      label: editFields.label.trim(),
      selfPitcherName: resolvePitcherName(editFields.selfPitcherName),
      opponentPitcherName: resolvePitcherName(editFields.opponentPitcherName),
    })
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    if (latestSession) setEditFields(toEditFields(latestSession))
    setIsEditing(false)
  }

  return (
    <div className="home-screen">
      <header className="home-hero panel-card">
        <p className="app-kicker">eBASEBALL プロスピA</p>
        <h1>配球記録</h1>
        <p className="home-lead">試合の配球を記録したり、保存済みの記録を閲覧・分析できます</p>
      </header>

      {latestSession && (
        <section className="panel-card home-sessions">
          <h2 className="home-section-title">記録中の試合</h2>
          <div className="home-session-item home-session-summary">
            {!isEditing ? (
              <>
                <div className="home-session-info">
                  <strong>{latestSession.label || formatGameLabel(latestSession.createdAt)}</strong>
                  <span className="home-session-meta">
                    {getSessionProgressLabel(latestSession)} · {getSessionPitchCount(latestSession)}球
                  </span>
                  <span className="home-session-pitchers">{formatSessionPitchers(latestSession)}</span>
                </div>
                <div className="home-session-actions">
                  <button
                    type="button"
                    className="primary-btn compact"
                    onClick={() => onResumeSession(latestSession.id)}
                  >
                    記録を続ける
                  </button>
                  <button type="button" className="ghost-btn compact" onClick={() => setIsEditing(true)}>
                    編集
                  </button>
                  <button
                    type="button"
                    className="ghost-btn compact danger-btn"
                    onClick={() => {
                      if (confirmDeleteSession(latestSession)) onDeleteSession(latestSession.id)
                    }}
                  >
                    削除
                  </button>
                </div>
              </>
            ) : (
              <form className="home-session-edit" onSubmit={handleSaveEdit}>
                <label className="session-label" htmlFor="home-session-label">
                  試合名
                </label>
                <input
                  id="home-session-label"
                  className="session-input"
                  value={editFields.label}
                  onChange={(event) => setEditFields((prev) => ({ ...prev, label: event.target.value }))}
                />

                {setupPitcherFields?.map((field) => (
                  <section key={field.storageKey} className="setup-pitcher-block">
                    <label className="session-label" htmlFor={`home-${field.storageKey}`}>
                      {field.fieldLabel}の先発投手
                    </label>
                    <PitcherNameInput
                      id={`home-${field.storageKey}`}
                      value={editFields[field.storageKey]}
                      onChange={(value) =>
                        setEditFields((prev) => ({ ...prev, [field.storageKey]: value }))
                      }
                    />
                  </section>
                ))}

                <div className="home-session-actions">
                  <button type="submit" className="primary-btn compact" disabled={!canSaveEdit}>
                    保存
                  </button>
                  <button type="button" className="ghost-btn compact" onClick={handleCancelEdit}>
                    キャンセル
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      )}

      <section className="panel-card home-batting-first">
        <h2 className="home-section-title">先攻・後攻</h2>
        <div className="batting-first-grid" role="group" aria-label="先攻・後攻">
          {BATTING_FIRST_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`batting-first-btn ${battingFirst === option.id ? 'active' : ''}`}
              onClick={() => onBattingFirstChange(option.id)}
            >
              <span className="batting-first-label">{option.label}</span>
              <span className="batting-first-desc">{option.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="home-actions">
        <button type="button" className="home-action-card browse-card" onClick={onBrowse}>
          <span className="home-action-icon">📁</span>
          <span className="home-action-title">記録を閲覧</span>
          <span className="home-action-desc">試合の閲覧・続きから記録・削除</span>
        </button>

        <button type="button" className="home-action-card analysis-card" onClick={onAnalysis}>
          <span className="home-action-icon">📊</span>
          <span className="home-action-title">分析</span>
          <span className="home-action-desc">打率・出塁率・勝率・防御率とコース別成績</span>
        </button>

        <button type="button" className="home-action-card record-card" onClick={onRecord}>
          <span className="home-action-icon">◎</span>
          <span className="home-action-title">記録する</span>
          <span className="home-action-desc">新しい試合を始めて配球を記録する</span>
        </button>
      </div>
    </div>
  )
}
