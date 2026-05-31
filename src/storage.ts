import { STORAGE_KEY, getZoneLabel } from './constants'
import { normalizePitcherName } from './data/pitcherNames'
import { atBatEnds, formatInningLabel, getActiveBatterOrder, mapSetupPitchers, resolveBattingSide, resolvePitchSide } from './gameLogic'
import { applyDoublePlayRunners } from './doublePlayLogic'
import { applySacrificeBuntRunners, applyBuntBatterOutRunners, isBuntBatterOutOnly, isBuntSacrifice, resolveEffectiveGameResult } from './buntLogic'
import { isFourBallWalk } from './countLogic'
import { resolvePitchRunnerAdvances } from './runnerAdvanceLogic'
import { DEFAULT_SPECIAL_EXTRA_INNING_START } from './specialExtraLogic'
import { EMPTY_RUNNERS, updateRunners } from './runnerLogic'
import { applyStealAttempt } from './stealLogic'
import type { AppData, BatterRecord, BattingFirst, Count, GameSession, Handedness, HalfInning, PitchRecord, PitchSide, PitchType } from './types'

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
  defaultPitchSide?: 'self' | 'opponent'
  pitches?: PitchRecord[]
  currentBatterHand?: Handedness
  batters?: BatterRecord[]
  pitcherName?: string
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

export function createSession(
  battingFirst: BattingFirst,
  battingFirstPitcher: string,
  battingSecondPitcher: string,
  specialExtraInningStart: number = DEFAULT_SPECIAL_EXTRA_INNING_START,
): GameSession {
  const now = Date.now()
  const batters = createLineup()
  const { selfPitcherName, opponentPitcherName } = mapSetupPitchers(
    battingFirst,
    battingFirstPitcher,
    battingSecondPitcher,
  )
  return {
    id: crypto.randomUUID(),
    createdAt: now,
    label: formatGameLabel(now),
    selfPitcherName,
    opponentPitcherName,
    battingFirst,
    currentPitcherArm: 'right',
    inning: 1,
    halfInning: 'top',
    selfBatterOrder: 1,
    opponentBatterOrder: 1,
    activeBatterOrder: 1,
    count: { ...initialCount },
    runners: { ...EMPTY_RUNNERS },
    selfScore: 0,
    opponentScore: 0,
    specialExtraInningStart,
    batters,
  }
}

function getAllSessionPitches(session: GameSession): PitchRecord[] {
  return session.batters
    .flatMap((batter) => batter.pitches)
    .sort((a, b) => a.timestamp - b.timestamp)
}

export function getSessionPitchesInGameOrder(session: GameSession): PitchRecord[] {
  return getAllSessionPitches(session).sort((a, b) => {
    if (a.inning !== b.inning) return a.inning - b.inning
    if (a.halfInning !== b.halfInning) return a.halfInning === 'top' ? -1 : 1
    return a.timestamp - b.timestamp
  })
}

function halfInningKey(inning: number, halfInning: HalfInning): string {
  return `${inning}-${halfInning}`
}

export function groupSessionPitchesByHalfInning(
  session: GameSession,
): { key: string; label: string; pitches: PitchRecord[] }[] {
  const groups: { key: string; label: string; pitches: PitchRecord[] }[] = []
  for (const pitch of getSessionPitchesInGameOrder(session)) {
    const key = halfInningKey(pitch.inning, pitch.halfInning)
    const last = groups[groups.length - 1]
    if (last?.key === key) {
      last.pitches.push(pitch)
      continue
    }
    groups.push({
      key,
      label: formatInningLabel(pitch.inning, pitch.halfInning),
      pitches: [pitch],
    })
  }
  return groups
}

function getEffectivePitchResultForScore(pitch: PitchRecord): PitchRecord['result'] {
  return resolveEffectiveGameResult(pitch.primaryResult ?? pitch.result, pitch.extraResult)
}

function rebuildSessionScores(session: GameSession): Pick<GameSession, 'selfScore' | 'opponentScore'> {
  let selfScore = 0
  let opponentScore = 0

  for (const pitch of getAllSessionPitches(session)) {
    if (pitch.runsScored != null && pitch.scoringSide != null) {
      if (pitch.scoringSide === 'self') selfScore += pitch.runsScored
      else opponentScore += pitch.runsScored
      continue
    }

    const effectiveResult = getEffectivePitchResultForScore(pitch)
    const runnerGameResult = isFourBallWalk(pitch.countBefore, pitch.primaryResult ?? pitch.result)
      ? 'walk'
      : effectiveResult
    const atBatEnded = atBatEnds(pitch.primaryResult ?? pitch.result, pitch.countBefore, pitch.extraResult)
    const runnerUpdate =
      pitch.primaryResult === 'double_play' || pitch.result === 'double_play'
        ? applyDoublePlayRunners(pitch.runnersBefore, pitch.outsRecorded, pitch.countBefore.outs)
        : isBuntSacrifice(pitch.primaryResult ?? pitch.result, pitch.extraResult)
          ? applySacrificeBuntRunners(pitch.runnersBefore, pitch.outsRecorded)
          : isBuntBatterOutOnly(pitch.primaryResult ?? pitch.result, pitch.extraResult)
            ? applyBuntBatterOutRunners(pitch.runnersBefore)
            : updateRunners(
                pitch.runnersBefore,
                runnerGameResult,
                atBatEnded,
                pitch.outsRecorded,
                resolvePitchRunnerAdvances(pitch),
                pitch.countBefore.outs,
              )
    let runsScored = runnerUpdate.runsScored

    if (pitch.stealAttempt) {
      const stealUpdate = applyStealAttempt(runnerUpdate.runners, pitch.countBefore, pitch.stealAttempt)
      runsScored += stealUpdate.runsScored
    }

    if (runsScored <= 0) continue

    const scoringSide = resolveBattingSide(session.battingFirst, pitch.halfInning)
    if (scoringSide === 'self') selfScore += runsScored
    else opponentScore += runsScored
  }

  return { selfScore, opponentScore }
}

export function getBatterByOrder(session: GameSession, order: number): BatterRecord | null {
  return session.batters.find((batter) => batter.order === order) ?? null
}

export function getActiveBatter(session: GameSession | null | undefined): BatterRecord | null {
  if (!session) return null
  return getBatterByOrder(session, getActiveBatterOrder(session)) ?? session.batters[0] ?? null
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

export function getSessionUpdatedAt(session: GameSession): number {
  const last = getLastSessionPitch(session)
  return last?.pitch.timestamp ?? session.finishedAt ?? session.createdAt
}

export function isSessionFinished(session: GameSession): boolean {
  return session.finishedAt != null
}

export function getActiveSession(sessions: GameSession[]): GameSession | null {
  const active = sessions.filter((session) => !isSessionFinished(session))
  if (active.length === 0) return null
  return [...active].sort((a, b) => getSessionUpdatedAt(b) - getSessionUpdatedAt(a))[0] ?? null
}

export function getMostRecentSession(sessions: GameSession[]): GameSession | null {
  if (sessions.length === 0) return null
  return [...sessions].sort((a, b) => getSessionUpdatedAt(b) - getSessionUpdatedAt(a))[0] ?? null
}

export function finishSession(data: AppData, sessionId: string): AppData {
  const now = Date.now()
  return {
    ...data,
    activeSessionId: data.activeSessionId === sessionId ? null : data.activeSessionId,
    sessions: data.sessions.map((session) =>
      session.id === sessionId ? { ...session, finishedAt: now } : session,
    ),
  }
}

export function resumeSession(data: AppData, sessionId: string): AppData {
  return {
    ...data,
    activeSessionId: sessionId,
    sessions: data.sessions.map((session) =>
      session.id === sessionId ? { ...session, finishedAt: undefined } : session,
    ),
  }
}

export function deleteSession(data: AppData, sessionId: string): AppData {
  return {
    ...data,
    sessions: data.sessions.filter((session) => session.id !== sessionId),
    activeSessionId: data.activeSessionId === sessionId ? null : data.activeSessionId,
  }
}

function migratePitcherNames(session: LegacySession, battingFirst: BattingFirst): {
  selfPitcherName: string
  opponentPitcherName: string
} {
  if (session.selfPitcherName && session.opponentPitcherName) {
    return {
      selfPitcherName: session.selfPitcherName,
      opponentPitcherName: session.opponentPitcherName,
    }
  }

  const legacyPitcher = session.pitcherName?.trim()
  if (battingFirst === 'opponent') {
    return {
      selfPitcherName: session.selfPitcherName ?? legacyPitcher ?? '自分',
      opponentPitcherName: session.opponentPitcherName ?? '敵',
    }
  }
  return {
    opponentPitcherName: session.opponentPitcherName ?? legacyPitcher ?? '敵',
    selfPitcherName: session.selfPitcherName ?? '自分',
  }
}

function resolvePitchSideLegacy(session: LegacySession, halfInning: HalfInning): PitchSide {
  if (session.battingFirst) {
    return resolvePitchSide(session.battingFirst, halfInning)
  }
  return session.defaultPitchSide ?? 'opponent'
}

const LEGACY_PITCH_TYPES: Record<string, PitchType> = {
  shoot: 'natural_shoot',
  two_seam: 'two_seam_fast',
  cut: 'cut_ball',
  sinker: 'sinker_screw',
  other: 'straight',
}

function migratePitchType(type: string): PitchType {
  if (LEGACY_PITCH_TYPES[type]) return LEGACY_PITCH_TYPES[type]
  return type as PitchType
}

function normalizePitch(pitch: PitchRecord, batter: BatterRecord, session: LegacySession): PitchRecord {
  const primaryResult = pitch.primaryResult ?? pitch.result
  const extraResult = pitch.extraResult
  const result = extraResult && extraResult !== 'steal' ? extraResult : primaryResult

  return {
    ...pitch,
    pitchType: migratePitchType(pitch.pitchType),
    pitchSide: pitch.pitchSide ?? resolvePitchSideLegacy(session, pitch.halfInning ?? 'top'),
    batterHand: pitch.batterHand ?? batter.batterHand,
    pitcherArm: pitch.pitcherArm ?? session.currentPitcherArm ?? 'right',
    batterOrder: pitch.batterOrder ?? batter.order,
    inning: pitch.inning ?? 1,
    halfInning: pitch.halfInning ?? 'top',
    countBefore: pitch.countBefore ?? { ...initialCount },
    runnersBefore: pitch.runnersBefore ?? { ...EMPTY_RUNNERS },
    zoneLabel: getZoneLabel(pitch.row, pitch.col),
    primaryResult,
    extraResult,
    result,
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

  const battingFirst: BattingFirst = session.battingFirst ?? 'opponent'
  const { selfPitcherName, opponentPitcherName } = migratePitcherNames(session, battingFirst)

  const migrated: GameSession = {
    id: session.id ?? crypto.randomUUID(),
    createdAt,
    label: session.label || formatGameLabel(createdAt),
    selfPitcherName,
    opponentPitcherName,
    battingFirst,
    currentPitcherArm: session.currentPitcherArm ?? 'right',
    inning: session.inning ?? 1,
    halfInning: session.halfInning ?? 'top',
    selfBatterOrder: session.selfBatterOrder ?? activeOrder,
    opponentBatterOrder: session.opponentBatterOrder ?? activeOrder,
    activeBatterOrder: activeOrder,
    count: session.count ?? { ...initialCount },
    runners: session.runners ?? { ...EMPTY_RUNNERS },
    selfScore: session.selfScore ?? 0,
    opponentScore: session.opponentScore ?? 0,
    specialExtraInningStart: session.specialExtraInningStart ?? DEFAULT_SPECIAL_EXTRA_INNING_START,
    heldBatterOrder: session.heldBatterOrder,
    heldBattingSide: session.heldBattingSide,
    batters: batters.map((batter) => ({
      ...batter,
      label: batter.label || `${batter.order}番`,
      pitches: (batter.pitches ?? []).map((pitch) => normalizePitch(pitch, batter, { ...session, battingFirst })),
    })),
  }

  if (session.pitches?.length && migrated.batters[0]) {
    migrated.batters[0].pitches = session.pitches.map((pitch) =>
      normalizePitch(pitch, migrated.batters[0], migrated),
    )
  }

  return { ...migrated, ...rebuildSessionScores(migrated) }
}

function normalizeSessionPitcherNames(session: GameSession): GameSession {
  return {
    ...session,
    selfPitcherName: normalizePitcherName(session.selfPitcherName),
    opponentPitcherName: normalizePitcherName(session.opponentPitcherName),
    batters: session.batters.map((batter) => ({
      ...batter,
      pitches: batter.pitches.map((pitch) => ({
        ...pitch,
        pitcherName: normalizePitcherName(pitch.pitcherName),
      })),
    })),
  }
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
    sessions: data.sessions.map((session) => normalizeSessionPitcherNames(migrateSession(session as LegacySession))),
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
