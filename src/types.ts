export type PitchResult =
  | 'ball'
  | 'called_strike'
  | 'swinging_strike'
  | 'foul'
  | 'groundout'
  | 'flyout'
  | 'liner'
  | 'single'
  | 'double'
  | 'triple'
  | 'homerun'
  | 'walk'
  | 'hbp'
  | 'bunt'
  | 'error'

export type PitchType =
  | 'fastball'
  | 'shoot'
  | 'two_seam'
  | 'slider'
  | 'cut'
  | 'curve'
  | 'slow_curve'
  | 'fork'
  | 'changeup'
  | 'sinker'
  | 'knuckle'
  | 'other'

export interface ZoneCell {
  row: number
  col: number
  label: string
  shortLabel: string
  inZone: boolean
}

export interface Count {
  balls: number
  strikes: number
  outs: number
}

export type PitchSide = 'self' | 'opponent'

export type Handedness = 'right' | 'left'

export type HalfInning = 'top' | 'bottom'

export type AppMode = 'home' | 'browse' | 'record-setup' | 'record'

export interface PitchRecord {
  id: string
  timestamp: number
  row: number
  col: number
  zoneLabel: string
  pitchType: PitchType
  result: PitchResult
  countBefore: Count
  pitchSide: PitchSide
  batterHand: Handedness
  pitcherArm: Handedness
  pitcherName: string
  batterOrder: number
  inning: number
  halfInning: HalfInning
}

export interface BatterRecord {
  id: string
  order: number
  label: string
  batterHand: Handedness
  createdAt: number
  pitches: PitchRecord[]
}

export interface GameSession {
  id: string
  createdAt: number
  label: string
  pitcherName: string
  defaultPitchSide: PitchSide
  currentPitcherArm: Handedness
  inning: number
  halfInning: HalfInning
  activeBatterOrder: number
  count: Count
  batters: BatterRecord[]
}

export interface AppData {
  sessions: GameSession[]
  activeSessionId: string | null
  updatedAt?: number
}
