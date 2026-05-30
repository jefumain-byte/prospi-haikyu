import type { AppData } from '../types'

export function stampData(data: AppData): AppData {
  return { ...data, updatedAt: Date.now() }
}

export function mergeAppData(local: AppData, remote: AppData): AppData {
  const localTime = local.updatedAt ?? 0
  const remoteTime = remote.updatedAt ?? 0
  return remoteTime >= localTime ? remote : local
}
