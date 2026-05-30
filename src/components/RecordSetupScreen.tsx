import { useState, type FormEvent } from 'react'

interface RecordSetupScreenProps {
  onStart: (pitcherName: string) => void
  onBack: () => void
}

export function RecordSetupScreen({ onStart, onBack }: RecordSetupScreenProps) {
  const [pitcherName, setPitcherName] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!pitcherName.trim()) return
    onStart(pitcherName.trim())
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
        <p className="setup-lead">まず相手投手の名前を入力してください。打者は1番〜9番で自動記録されます。</p>

        <label className="session-label" htmlFor="setup-pitcher-name">
          投手名
        </label>
        <input
          id="setup-pitcher-name"
          className="session-input"
          value={pitcherName}
          onChange={(event) => setPitcherName(event.target.value)}
          placeholder="相手投手名"
          autoFocus
        />

        <button type="submit" className="primary-btn setup-submit" disabled={!pitcherName.trim()}>
          1回表から記録開始
        </button>
      </form>
    </div>
  )
}
