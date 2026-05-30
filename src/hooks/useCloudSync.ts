import { useCallback, useEffect, useRef, useState } from 'react'
import {
  clearSessionUser,
  getActiveCloudKey,
  getCloudKeyForUser,
  getSessionUser,
  isAuthConfigured,
  setSessionUser,
  verifyLogin,
} from '../auth/syncAuth'
import {
  isCloudSyncEnabled,
  pullCloudData,
  pushCloudData,
  subscribeCloudChanges,
} from '../sync/cloudSync'
import { mergeAppData, stampData } from '../sync/mergeData'
import { createSession, loadLocalAppData, saveLocalAppData } from '../storage'
import type { AppData } from '../types'

export type SyncStatus = 'loading' | 'local' | 'synced' | 'syncing' | 'offline' | 'error'

function ensureSession(data: AppData): AppData {
  if (data.sessions.length > 0) return data
  const session = createSession('相手投手')
  return stampData({ sessions: [session], activeSessionId: session.id })
}

export function useCloudSync() {
  const [data, setData] = useState<AppData>({ sessions: [], activeSessionId: null })
  const [ready, setReady] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState<string | null>(() => getSessionUser())
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading')
  const [authMessage, setAuthMessage] = useState('')

  const skipPush = useRef(false)
  const pushTimer = useRef<number | undefined>(undefined)

  const cloudKey = loggedInUser ? getActiveCloudKey() : null

  const pullAndMerge = useCallback(async (key: string, base?: AppData) => {
    const local = base ?? loadLocalAppData()
    const remote = await pullCloudData(key)
    let merged = remote ? mergeAppData(local, remote) : local
    merged = ensureSession(merged)
    merged = stampData(merged)
    saveLocalAppData(merged)
    skipPush.current = true
    setData(merged)
    return merged
  }, [])

  useEffect(() => {
    let cancelled = false

    async function init() {
      const local = ensureSession(loadLocalAppData())
      saveLocalAppData(local)

      if (!cancelled) {
        setData(local)
      }

      const user = getSessionUser()
      if (user && isCloudSyncEnabled() && isAuthConfigured()) {
        try {
          await pullAndMerge(getCloudKeyForUser(user), local)
          if (!cancelled) setSyncStatus('synced')
        } catch {
          if (!cancelled) setSyncStatus('error')
        }
      } else if (!isCloudSyncEnabled() || !isAuthConfigured()) {
        if (!cancelled) setSyncStatus('offline')
      } else {
        if (!cancelled) setSyncStatus('local')
      }

      if (!cancelled) setReady(true)
    }

    void init()
    return () => {
      cancelled = true
    }
  }, [pullAndMerge])

  useEffect(() => {
    if (!ready || !cloudKey || !isCloudSyncEnabled()) return

    return subscribeCloudChanges(cloudKey, (remote) => {
      skipPush.current = true
      setData((current) => {
        const merged = mergeAppData(current, remote)
        saveLocalAppData(merged)
        return merged
      })
      setSyncStatus('synced')
    })
  }, [ready, cloudKey])

  useEffect(() => {
    if (!ready || !cloudKey) return

    const refresh = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        await pullAndMerge(cloudKey)
        setSyncStatus('synced')
      } catch {
        setSyncStatus('error')
      }
    }

    document.addEventListener('visibilitychange', refresh)
    return () => document.removeEventListener('visibilitychange', refresh)
  }, [ready, cloudKey, pullAndMerge])

  useEffect(() => {
    if (!ready) return

    const stamped = stampData(data)
    saveLocalAppData(stamped)

    if (skipPush.current) {
      skipPush.current = false
      return
    }

    if (!cloudKey || !isCloudSyncEnabled()) return

    window.clearTimeout(pushTimer.current)
    setSyncStatus('syncing')
    pushTimer.current = window.setTimeout(() => {
      void pushCloudData(cloudKey, stamped)
        .then(() => setSyncStatus('synced'))
        .catch(() => setSyncStatus('error'))
    }, 700)

    return () => window.clearTimeout(pushTimer.current)
  }, [data, ready, cloudKey])

  const login = useCallback(
    async (userId: string, password: string) => {
      if (!isAuthConfigured()) {
        setAuthMessage('ID/パスワードが未設定です（環境変数を確認）')
        return false
      }
      if (!verifyLogin(userId, password)) {
        setAuthMessage('IDまたはパスワードが違います')
        return false
      }
      if (!isCloudSyncEnabled()) {
        setAuthMessage('Supabase が未設定です')
        return false
      }

      setSessionUser(userId)
      setLoggedInUser(userId.trim())
      setAuthMessage('')

      try {
        const key = getCloudKeyForUser(userId)
        await pullAndMerge(key)
        await pushCloudData(key, stampData(loadLocalAppData()))
        setSyncStatus('synced')
        setAuthMessage('ログインしました。クラウドと同期中です')
      } catch {
        setSyncStatus('error')
        setAuthMessage('ログインしましたが同期に失敗しました')
      }

      window.setTimeout(() => setAuthMessage(''), 2500)
      return true
    },
    [pullAndMerge],
  )

  const logout = useCallback(() => {
    clearSessionUser()
    setLoggedInUser(null)
    setSyncStatus('local')
    setAuthMessage('ログアウトしました（この端末の記録は残ります）')
    window.setTimeout(() => setAuthMessage(''), 2500)
  }, [])

  const uploadNow = useCallback(async () => {
    if (!cloudKey) return
    try {
      setSyncStatus('syncing')
      const stamped = stampData(data)
      await pushCloudData(cloudKey, stamped)
      saveLocalAppData(stamped)
      setSyncStatus('synced')
      setAuthMessage('クラウドに送信しました')
    } catch {
      setSyncStatus('error')
      setAuthMessage('送信に失敗しました')
    }
    window.setTimeout(() => setAuthMessage(''), 2500)
  }, [cloudKey, data])

  const downloadNow = useCallback(async () => {
    if (!cloudKey) return
    try {
      setSyncStatus('syncing')
      await pullAndMerge(cloudKey)
      setSyncStatus('synced')
      setAuthMessage('クラウドから取得しました')
    } catch {
      setSyncStatus('error')
      setAuthMessage('取得に失敗しました')
    }
    window.setTimeout(() => setAuthMessage(''), 2500)
  }, [cloudKey, pullAndMerge])

  return {
    data,
    setData,
    ready,
    loggedInUser,
    syncStatus,
    authMessage,
    login,
    logout,
    uploadNow,
    downloadNow,
    authConfigured: isAuthConfigured(),
    cloudEnabled: isCloudSyncEnabled(),
  }
}
