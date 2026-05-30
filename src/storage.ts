import { STORAGE_KEY, getZoneLabel } from './constants'
import type { AppData, BatterRecord, Count, GameSession, Handedness, PitchRecord, PitchSide } from './types'

const STORAGE_KEY_V3 = 'prospi-haikyu-data-v3'
const STORAGE_KEY_V2 = 'prospi-haikyu-data-v2'
const STORAGE_KEY_V1 = 'prospi-haikyu-data-v1'

const initialCount: Count = { balls: 0, strikes: 0, outs: 0 }

const defaultData: AppData = {
  sessions: [],
  activeSessionId: null,
}

type LegacySession = Partial<GameSession> & {
  activeBatterId?: string
  pitches?: PitchRecord[]
  currentBatterHand?: Handedness
  batters?: BatterRecord[]
}

export function formatGameLabel(createdAt: number): string {
  const date = new Date(createdAt)
  return `試合 ${date.getMonth() + 1}/${date.getDate()}`
}

export function createBatter(order: number, batterHand: Handedness = 'right'): BatterRecord {
  return {
    id: crypto.randomUUID(),
    order,
    label: `${order}番`,
    batterHand,
    createdAt: Date.now(),
    pitches: [],
  }
}

export function createLineup(): BatterRecord[] {
  return Array.from({ length: 9 }, (_, index) => createBatter(index + 1))
}

export function createSession(pitcherName: string, defaultPitchSide: PitchSide = 'opponent'): GameSession {
  const now = Date.now()
  const batters = createLineup()
  return {
    id: crypto.randomUUID(),
    createdAt: now,
    label: formatGameLabel(now),
    pitcherName: pitcherName.trim() || (defaultPitchSide === 'self' ? '自分' : '相手投手'),
    defaultPitchSide,
    currentPitcherArm: 'right',
    inning: 1,
    halfInning: 'top',
    activeBatterOrder: 1,
    count: { ...initialCount },
    batters,
  }
}

export function getBatterByOrder(session: GameSession, order: number): BatterRecord | null {
  return session.batters.find((batter) => batter.order === order) ?? null
}

export function getActiveBatter(session: GameSession | null | undefined): BatterRecord | null {
  if (!session) return null
  return getBatterByOrder(session, session.activeBatterOrder) ?? session.batters[0] ?? null
}

export function getSessionPitchCount(session: GameSession): number {
  return session.batters.reduce((sum, batter) => sum + batter.pitches.length, 0)
}

export function getLastSessionPitch(session: GameSession): { batter: BatterRecord; pitch: PitchRecord } | null {
  let last: { batter: BatterRecord; pitch: PitchRecord } | null = null

  for (const batter of session.batters) {
    for (const pitch of batter.pitches) {
      if (!last || pitch.timestamp > last.pitch.timestamp) {
        last = { batter, pitch }
      }
    }
  }

  return last
}

function normalizePitch(pitch: PitchRecord, batter: BatterRecord, session: GameSession): PitchRecord {
  return {
    ...pitch,
    pitchSide: pitch.pitchSide ?? session.defaultPitchSide ?? 'opponent',
    batterHand: pitch.batterHand ?? batter.batterHand,
    pitcherArm: pitch.pitcherArm ?? session.currentPitcherArm ?? 'right',
    batterOrder: pitch.batterOrder ?? batter.order,
    inning: pitch.inning ?? 1,
    halfInning: pitch.halfInning ?? 'top',
    zoneLabel: getZoneLabel(pitch.row, pitch.col),
  }
}

function padLineup(batters: BatterRecord[]): BatterRecord[] {
  const sorted = [...batters].sort((a, b) => a.order - b.order)
  const lineup = createLineup()

  for (const batter of sorted) {
    if (batter.order >= 1 && batter.order <= 9) {
      lineup[batter.order - 1] = {
        ...lineup[batter.order - 1],
        ...batter,
        label: batter.label || `${batter.order}番`,
      }
    }
  }

  return lineup
}

function migrateSession(session: LegacySession): GameSession {
  const createdAt = session.createdAt ?? Date.now()
  const batters = padLineup(session.batters ?? [])
  const activeOrder =
    session.activeBatterOrder ??
    batters.find((batter) => batter.id === session.activeBatterId)?.order ??
    1

  const migrated: GameSession = {
    id: session.id ?? crypto.randomUUID(),
    createdAt,
    label: session.label || formatGameLabel(createdAt),
    pitcherName: session.pitcherName ?? '相手投手',
    defaultPitchSide: session.defaultPitchSide ?? 'opponent',
    currentPitcherArm: session.currentPitcherArm ?? 'right',
    inning: session.inning ?? 1,
    halfInning: session.halfInning ?? 'top',
    activeBatterOrder: activeOrder,
    count: session.count ?? { ...initialCount },
    batters: batters.map((batter) => ({
      ...batter,
      label: batter.label || `${batter.order}番`,
      pitches: (batter.pitches ?? []).map((pitch) => normalizePitch(pitch, batter, session as GameSession)),
    })),
  }

  if (session.pitches?.length && migrated.batters[0]) {
    migrated.batters[0].pitches = session.pitches.map((pitch) =>
      normalizePitch(pitch, migrated.batters[0], migrated),
    )
  }

  return migrated
}

function migrateGridRows(data: AppData): AppData {
  return {
    ...data,
    sessions: data.sessions.map((session) => ({
      ...session,
      batters: session.batters.map((batter) => ({
        ...batter,
        pitches: batter.pitches.map((pitch) => {
          const row = pitch.row + 1
          return {
            ...pitch,
            row,
            zoneLabel: getZoneLabel(row, pitch.col),
          }
        }),
      })),
    })),
  }
}

export function syncStoredData(data: AppData): AppData {
  return {
    ...data,
    sessions: data.sessions.map((session) => migrateSession(session as LegacySession)),
  }
}

function loadFromKey(key: string): AppData | null {
  const raw = localStorage.getItem(key)
  if (!raw) return null
  const parsed = JSON.parse(raw) as AppData
  return syncStoredData({
    sessions: parsed.sessions ?? [],
    activeSessionId: parsed.activeSessionId ?? null,
    updatedAt: parsed.updatedAt,
  })
}

export function loadLocalAppData(): AppData {
  try {
    const current = loadFromKey(STORAGE_KEY)
    if (current) return current

    const v3 = loadFromKey(STORAGE_KEY_V3)
    if (v3) {
      saveLocalAppData(v3)
      return v3
    }

    const v2 = loadFromKey(STORAGE_KEY_V2)
    if (v2) {
      saveLocalAppData(v2)
      return v2
    }

    const rawV1 = localStorage.getItem(STORAGE_KEY_V1)
    if (rawV1) {
      const parsed = JSON.parse(rawV1) as AppData
      const migrated = migrateGridRows(syncStoredData(parsed))
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(syncStoredData(data)))
}

/** @deprecated use loadLocalAppData */
export function loadAppData(): AppData {
  return loadLocalAppData()
}

/** @deprecated use saveLocalAppData */
export function saveAppData(data: AppData): void {
  saveLocalAppData(data)
}
