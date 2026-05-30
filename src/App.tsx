import { useState } from 'react'
import { HomeScreen } from './components/HomeScreen'
import { RecordSetupScreen } from './components/RecordSetupScreen'
import { RecordScreen } from './components/RecordScreen'
import { RecordsPanel } from './components/RecordsPanel'
import { SyncPanel } from './components/SyncPanel'
import { useCloudSync } from './hooks/useCloudSync'
import { createSession } from './storage'
import type { AppMode } from './types'
import './App.css'

function App() {
  const { data, setData, ready, loggedInUser, syncStatus, authMessage, login, logout, uploadNow, downloadNow, authConfigured, cloudEnabled } =
    useCloudSync()
  const [mode, setMode] = useState<AppMode>('home')
  const [recordingSessionId, setRecordingSessionId] = useState<string | null>(null)

  const handleStartRecording = (pitcherName: string) => {
    const session = createSession(pitcherName)
    setData((prev) => ({
      ...prev,
      sessions: [session, ...prev.sessions],
      activeSessionId: session.id,
    }))
    setRecordingSessionId(session.id)
    setMode('record')
  }

  if (!ready) {
    return (
      <div className="app loading-screen">
        <p>記録を読み込み中…</p>
      </div>
    )
  }

  return (
    <div className="app">
      {mode === 'home' && (
        <>
          <HomeScreen onBrowse={() => setMode('browse')} onRecord={() => setMode('record-setup')} />
          <SyncPanel
            loggedInUser={loggedInUser}
            syncStatus={syncStatus}
            cloudEnabled={cloudEnabled}
            authConfigured={authConfigured}
            authMessage={authMessage}
            onLogin={login}
            onLogout={logout}
            onUpload={() => void uploadNow()}
            onDownload={() => void downloadNow()}
          />
        </>
      )}

      {mode === 'browse' && <RecordsPanel sessions={data.sessions} onBack={() => setMode('home')} />}

      {mode === 'record-setup' && (
        <RecordSetupScreen onStart={handleStartRecording} onBack={() => setMode('home')} />
      )}

      {mode === 'record' && recordingSessionId && (
        <RecordScreen
          data={data}
          sessionId={recordingSessionId}
          onChange={setData}
          onBack={() => setMode('home')}
        />
      )}
    </div>
  )
}

export default App
