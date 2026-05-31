import { useState } from 'react'
import { AnalysisPanel } from './components/AnalysisPanel'
import { HomeScreen } from './components/HomeScreen'
import { RecordSetupScreen } from './components/RecordSetupScreen'
import { RecordScreen } from './components/RecordScreen'
import { RecordsPanel } from './components/RecordsPanel'
import { SyncPanel } from './components/SyncPanel'
import { useCloudSync } from './hooks/useCloudSync'
import { createSession, deleteSession, finishSession, resumeSession } from './storage'
import type { AppMode, BattingFirst } from './types'
import './App.css'

function App() {
  const { data, setData, ready, loggedInUser, syncStatus, authMessage, login, logout, uploadNow, downloadNow, authConfigured, cloudEnabled } =
    useCloudSync()
  const [mode, setMode] = useState<AppMode>('home')
  const [battingFirst, setBattingFirst] = useState<BattingFirst>('opponent')
  const [recordingSessionId, setRecordingSessionId] = useState<string | null>(null)

  const handleStartRecording = (
    battingFirstPitcher: string,
    battingSecondPitcher: string,
    specialExtraInningStart: number,
  ) => {
    const session = createSession(battingFirst, battingFirstPitcher, battingSecondPitcher, specialExtraInningStart)
    setData((prev) => ({
      ...prev,
      sessions: [session, ...prev.sessions],
      activeSessionId: session.id,
    }))
    setRecordingSessionId(session.id)
    setMode('record')
  }

  const handleResumeSession = (sessionId: string) => {
    const session = data.sessions.find((item) => item.id === sessionId)
    if (!session) return
    setBattingFirst(session.battingFirst)
    setRecordingSessionId(session.id)
    setData((prev) => resumeSession(prev, sessionId))
    setMode('record')
  }

  const handleFinishSession = (sessionId: string) => {
    setData((prev) => finishSession(prev, sessionId))
    if (recordingSessionId === sessionId) {
      setRecordingSessionId(null)
      setMode('home')
    }
  }

  const handleDeleteSession = (sessionId: string) => {
    setData((prev) => deleteSession(prev, sessionId))
    if (recordingSessionId === sessionId) {
      setRecordingSessionId(null)
      setMode('home')
    }
  }

  const handleUpdateSession = (
    sessionId: string,
    fields: { label: string; selfPitcherName: string; opponentPitcherName: string },
  ) => {
    setData((prev) => ({
      ...prev,
      sessions: prev.sessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              label: fields.label,
              selfPitcherName: fields.selfPitcherName,
              opponentPitcherName: fields.opponentPitcherName,
            }
          : session,
      ),
    }))
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
          <HomeScreen
            battingFirst={battingFirst}
            sessions={data.sessions}
            onBattingFirstChange={setBattingFirst}
            onBrowse={() => setMode('browse')}
            onAnalysis={() => setMode('analysis')}
            onRecord={() => setMode('record-setup')}
            onResumeSession={handleResumeSession}
            onUpdateSession={handleUpdateSession}
            onDeleteSession={handleDeleteSession}
          />
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

      {mode === 'browse' && (
        <RecordsPanel
          sessions={data.sessions}
          onBack={() => setMode('home')}
          onResumeSession={handleResumeSession}
          onDeleteSession={handleDeleteSession}
        />
      )}

      {mode === 'analysis' && (
        <AnalysisPanel sessions={data.sessions} onBack={() => setMode('home')} />
      )}

      {mode === 'record-setup' && (
        <RecordSetupScreen
          battingFirst={battingFirst}
          onStart={handleStartRecording}
          onBack={() => setMode('home')}
        />
      )}

      {mode === 'record' && recordingSessionId && (
        <RecordScreen
          data={data}
          sessionId={recordingSessionId}
          onChange={setData}
          onBack={() => setMode('home')}
          onFinishGame={() => handleFinishSession(recordingSessionId)}
        />
      )}
    </div>
  )
}

export default App
