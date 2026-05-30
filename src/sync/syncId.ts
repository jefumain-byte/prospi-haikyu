import { SYNC_ID_KEY } from '../constants'

export function readSyncIdFromUrl(): string | null {
  const value = new URLSearchParams(window.location.search).get('sync')?.trim()
  return value || null
}

export function getStoredSyncId(): string | null {
  return localStorage.getItem(SYNC_ID_KEY)
}

export function storeSyncId(syncId: string): void {
  localStorage.setItem(SYNC_ID_KEY, syncId)
}

export function createSyncId(): string {
  return crypto.randomUUID()
}

export function resolveSyncId(): string {
  const fromUrl = readSyncIdFromUrl()
  if (fromUrl) {
    storeSyncId(fromUrl)
    return fromUrl
  }

  const stored = getStoredSyncId()
  if (stored) return stored

  const created = createSyncId()
  storeSyncId(created)
  return created
}

export function buildSyncLink(syncId: string): string {
  const url = new URL(window.location.href)
  url.searchParams.set('sync', syncId)
  return url.toString()
}

export function formatSyncIdShort(syncId: string): string {
  return syncId.slice(0, 8)
}
