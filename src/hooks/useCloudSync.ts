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
  AUTO_CLOUD_BACKUP_INTERVAL_MS,
  isCloudSyncEnabled,
  pullCloudData,
  pushCloudData,
  subscribeCloudChanges,
} from '../sync/cloudSync'
import { mergeAppData, stampData } from '../sync/mergeData'
import { loadLocalAppData, saveLocalAppData } from '../storage'
import type { AppData } from '../types'

export type SyncStatus = 'loading' | 'local' | 'synced' | 'syncing' | 'offline' | 'error'

function ensureSession(data: AppData): AppData {
  return data
}

function runWhenIdle(task: () => void, timeoutMs = 3000) {
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(task, { timeout: timeoutMs })
    return
  }
  window.setTimeout(task, 0)
}

export function useCloudSync() {
  const [data, setData] = useState<AppData>({ sessions: [], activeSessionId: null })
  const [ready, setReady] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState<string | null>(() => getSessionUser())
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading')
  const [authMessage, setAuthMessage] = useState('')

  const skipPush = useRef(false)
  const pushTimer = useRef<number | undefined>(undefined)
  const pushInFlightRef = useRef(false)
  const lastPushedUpdatedAtRef = useRef<number | null>(null)

  const cloudKey = loggedInUser ? getActiveCloudKey() : null

  const markPushed = useCallback((payload: AppData) => {
    lastPushedUpdatedAtRef.current = payload.updatedAt ?? null
  }, [])

  const performCloudPush = useCallback(
    async (payload: AppData, options?: { showStatus?: boolean; force?: boolean }) => {
      if (!cloudKey || !isCloudSyncEnabled()) return false
      if (document.visibilityState !== 'visible') return false
      if (pushInFlightRef.current) return false

      const updatedAt = payload.updatedAt ?? 0
      if (!options?.force && lastPushedUpdatedAtRef.current === updatedAt) return false

      pushInFlightRef.current = true
      if (options?.showStatus) setSyncStatus('syncing')

      try {
        await pushCloudData(cloudKey, payload)
        markPushed(payload)
        if (options?.showStatus) setSyncStatus('synced')
        return true
      } catch {
        if (options?.showStatus) setSyncStatus('error')
        return false
      } finally {
        pushInFlightRef.current = false
      }
    },
    [cloudKey, markPushed],
  )

  const pullAndMerge = useCallback(async (key: string, base?: AppData) => {
    const local = base ?? loadLocalAppData()
    const remote = await pullCloudData(key)
    let merged = remote ? mergeAppData(local, remote) : local
    merged = ensureSession(merged)
    merged = stampData(merged)
    saveLocalAppData(merged)
    skipPush.current = true
    markPushed(merged)
    setData(merged)
    return merged
  }, [markPushed])

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
        markPushed(merged)
        return merged
      })
      setSyncStatus('synced')
    })
  }, [ready, cloudKey, markPushed])

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
      markPushed(stamped)
      return
    }

    if (!cloudKey || !isCloudSyncEnabled()) return

    window.clearTimeout(pushTimer.current)
    pushTimer.current = window.setTimeout(() => {
      runWhenIdle(() => {
        void performCloudPush(stamped)
      })
    }, 700)

    return () => window.clearTimeout(pushTimer.current)
  }, [data, ready, cloudKey, performCloudPush, markPushed])

  useEffect(() => {
    if (!ready || !cloudKey || !isCloudSyncEnabled()) return

    const runAutoBackup = () => {
      if (document.visibilityState !== 'visible') return

      runWhenIdle(() => {
        const local = loadLocalAppData()
        void performCloudPush(local)
      }, 5000)
    }

    runAutoBackup()
    const intervalId = window.setInterval(runAutoBackup, AUTO_CLOUD_BACKUP_INTERVAL_MS)
    return () => window.clearInterval(intervalId)
  }, [ready, cloudKey, performCloudPush])

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
        const stamped = stampData(loadLocalAppData())
        await pushCloudData(key, stamped)
        markPushed(stamped)
        setSyncStatus('synced')
        setAuthMessage('ログインしました。クラウドと同期中です')
      } catch {
        setSyncStatus('error')
        setAuthMessage('ログインしましたが同期に失敗しました')
      }

      window.setTimeout(() => setAuthMessage(''), 2500)
      return true
    },
    [pullAndMerge, markPushed],
  )

  const logout = useCallback(() => {
    clearSessionUser()
    setLoggedInUser(null)
    lastPushedUpdatedAtRef.current = null
    setSyncStatus('local')
    setAuthMessage('ログアウトしました（この端末の記録は残ります）')
    window.setTimeout(() => setAuthMessage(''), 2500)
  }, [])

  const uploadNow = useCallback(async () => {
    if (!cloudKey) return
    const stamped = stampData(data)
    saveLocalAppData(stamped)
    const ok = await performCloudPush(stamped, { showStatus: true, force: true })
    if (ok) {
      setAuthMessage('クラウドに送信しました')
    } else if (!pushInFlightRef.current) {
      setSyncStatus('error')
      setAuthMessage('送信に失敗しました')
    }
    window.setTimeout(() => setAuthMessage(''), 2500)
  }, [cloudKey, data, performCloudPush])

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
