import { getZoneLabel, STORAGE_KEY } from './constants'
import type { AppData, GameSession, PitchSide } from './types'

const STORAGE_KEY_V1 = 'prospi-haikyu-data-v1'

const defaultData: AppData = {
  sessions: [],
  activeSessionId: null,
}

function migrateGridRows(data: AppData): AppData {
  return {
    ...data,
    sessions: data.sessions.map((session) => ({
      ...session,
      pitches: session.pitches.map((pitch) => {
        const row = pitch.row + 1
        return {
          ...pitch,
          row,
          pitchSide: pitch.pitchSide ?? 'opponent',
          batterHand: pitch.batterHand ?? 'right',
          pitcherArm: pitch.pitcherArm ?? 'right',
          zoneLabel: getZoneLabel(row, pitch.col),
        }
      }),
    })),
  }
}

export function syncStoredData(data: AppData): AppData {
  return {
    ...data,
    sessions: data.sessions.map((session) => ({
      ...session,
      defaultPitchSide: session.defaultPitchSide ?? 'opponent',
      currentBatterHand: session.currentBatterHand ?? 'right',
      currentPitcherArm: session.currentPitcherArm ?? 'right',
      pitcherName: session.pitcherName ?? '相手投手',
      pitches: session.pitches.map((pitch) => ({
        ...pitch,
        pitchSide: pitch.pitchSide ?? 'opponent',
        batterHand: pitch.batterHand ?? 'right',
        pitcherArm: pitch.pitcherArm ?? 'right',
        zoneLabel: getZoneLabel(pitch.row, pitch.col),
      })),
    })),
  }
}

export function loadLocalAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppData
      return syncStoredData({
        sessions: parsed.sessions ?? [],
        activeSessionId: parsed.activeSessionId ?? null,
        updatedAt: parsed.updatedAt,
      })
    }

    const rawV1 = localStorage.getItem(STORAGE_KEY_V1)
    if (rawV1) {
      const parsed = JSON.parse(rawV1) as AppData
      const migrated = migrateGridRows(parsed)
      saveLocalAppData(migrated)
      localStorage.removeItem(STORAGE_KEY_V1)
      return migrated
    }

    return { ...defaultData }
  } catch {
    return { ...defaultData }
  }
}

export function saveLocalAppData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/** @deprecated use loadLocalAppData */
export function loadAppData(): AppData {
  return loadLocalAppData()
}

/** @deprecated use saveLocalAppData */
export function saveAppData(data: AppData): void {
  saveLocalAppData(data)
}

export function createSession(pitcherName: string, defaultPitchSide: PitchSide = 'opponent'): GameSession {
  return {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    pitcherName: pitcherName.trim() || (defaultPitchSide === 'self' ? '自分' : '相手投手'),
    defaultPitchSide,
    currentBatterHand: 'right',
    currentPitcherArm: 'right',
    pitches: [],
  }
}
