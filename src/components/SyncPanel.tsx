import { useState } from 'react'
import type { SyncStatus } from '../hooks/useCloudSync'

interface SyncPanelProps {
  loggedInUser: string | null
  syncStatus: SyncStatus
  cloudEnabled: boolean
  authConfigured: boolean
  authMessage: string
  onLogin: (userId: string, password: string) => Promise<boolean>
  onLogout: () => void
  onUpload: () => void
  onDownload: () => void
}

function statusLabel(
  status: SyncStatus,
  cloudEnabled: boolean,
  authConfigured: boolean,
  loggedIn: boolean,
): string {
  if (!cloudEnabled || !authConfigured) return 'この端末に保存（クラウド未設定）'
  if (!loggedIn) return 'この端末に保存（ログインでクラウド送信）'
  switch (status) {
    case 'syncing':
      return 'クラウドへ送信中…'
    case 'synced':
      return 'ログイン中・クラウド同期済み'
    case 'error':
      return '同期エラー（端末内データは保存済み）'
    default:
      return 'ログイン中'
  }
}

export function SyncPanel({
  loggedInUser,
  syncStatus,
  cloudEnabled,
  authConfigured,
  authMessage,
  onLogin,
  onLogout,
  onUpload,
  onDownload,
}: SyncPanelProps) {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleLogin = async () => {
    setSubmitting(true)
    await onLogin(userId, password)
    setSubmitting(false)
  }

  return (
    <section className="sync-panel panel-card">
      <div className="sync-head">
        <div>
          <h2 className="sync-title">データ保存・クラウド</h2>
          <p className={`sync-status status-${syncStatus}`}>
            {statusLabel(syncStatus, cloudEnabled, authConfigured, Boolean(loggedInUser))}
          </p>
        </div>
        {loggedInUser ? (
          <button type="button" className="ghost-btn compact" onClick={onLogout}>
            ログアウト
          </button>
        ) : null}
      </div>

      <p className="sync-hint">
        記録は<strong>常にこの端末</strong>に保存されます。ログインすると同じIDの端末とクラウドで同期できます。
      </p>

      {loggedInUser ? (
        <div className="sync-logged-in">
          <p className="sync-user">
            ログイン: <code>{loggedInUser}</code>
          </p>
          <div className="sync-actions">
            <button type="button" className="primary-btn compact" onClick={onUpload}>
              クラウドに送信
            </button>
            <button type="button" className="ghost-btn compact" onClick={onDownload}>
              クラウドから取得
            </button>
          </div>
        </div>
      ) : (
        <div className="sync-login-form">
          <label className="sync-field">
            <span>ID</span>
            <input
              className="session-input"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="設定したID"
              autoComplete="username"
            />
          </label>
          <label className="sync-field">
            <span>パスワード</span>
            <input
              className="session-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="設定したパスワード"
              autoComplete="current-password"
            />
          </label>
          <button
            type="button"
            className="primary-btn"
            onClick={() => void handleLogin()}
            disabled={submitting || !userId || !password}
          >
            ログインして同期
          </button>
        </div>
      )}

      {authMessage ? <p className="sync-copy-msg">{authMessage}</p> : null}

      {!authConfigured || !cloudEnabled ? (
        <p className="sync-hint warn">
          Vercel に `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` / `VITE_SYNC_USER` /
          `VITE_SYNC_PASSWORD` を設定してください。
        </p>
      ) : null}
    </section>
  )
}
