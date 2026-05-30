export type PitchResult =
  | 'ball'
  | 'called_strike'
  | 'swinging_strike'
  | 'foul'
  | 'groundout'
  | 'flyout'
  | 'liner'
  | 'double_play'
  | 'single'
  | 'double'
  | 'triple'
  | 'homerun'
  | 'walk'
  | 'hbp'
  | 'bunt'
  | 'error'
  | 'steal'

export type RunnerBase = 'first' | 'second' | 'third'

export type StealOutcome = 'success' | 'failed'

export interface StealAttempt {
  bases: RunnerBase[]
  outcome: StealOutcome
  /** 失敗時にアウトになった走者の塁 */
  outBase?: RunnerBase
}

export type PitchType =
  | 'fastball'
  | 'two_seam_fast'
  | 'moving_fast'
  | 'one_seam'
  | 'change_of_pace'
  | 'changeup'
  | 'ultra_slow'
  | 'straight'
  | 'natural_shoot'
  | 'ephus'
  | 'slider'
  | 'slurve'
  | 'cut_ball'
  | 'curve'
  | 'slow_curve'
  | 'd_curve'
  | 'power_curve'
  | 'knuckle_curve'
  | 'fork'
  | 'sff'
  | 'palm'
  | 'knuckle'
  | 'vertical_slider'
  | 'vertical_cut'
  | 'split_change'
  | 'sinker_screw'
  | 'high_speed_sinker'
  | 'circle_change'

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

export interface Runners {
  first: boolean
  second: boolean
  third: boolean
}

export type PitchSide = 'self' | 'opponent'

/** 先攻 = 1回表から打つ側 */
export type BattingFirst = 'self' | 'opponent'

export type Handedness = 'right' | 'left'

export type HalfInning = 'top' | 'bottom'

/** アウトになった走者・打者 */
export type OutTarget = 'batter' | 'first' | 'second' | 'third'

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
  runnersBefore: Runners
  pitchSide: PitchSide
  batterHand: Handedness
  pitcherArm: Handedness
  pitcherName: string
  batterOrder: number
  inning: number
  halfInning: HalfInning
  /** 通常の結果（判定・打球） */
  primaryResult?: PitchResult
  /** その他の結果（任意） */
  extraResult?: PitchResult
  /** 盗塁（extraResult が steal のとき） */
  stealAttempt?: StealAttempt
  /** 盗塁失敗で3アウト終了した半イニングの直後、打順を進めない */
  holdBatterOrderAfterHalf?: boolean
  /** アウトになった走者・打者（複数塁走者時など） */
  outsRecorded?: OutTarget[]
  /** 打球アウト時に1塁進んだ走者 */
  runnersAdvanced?: RunnerBase[]
  /** この球で入った得点（0 のとき省略可） */
  runsScored?: number
  /** 得点した打撃側（自分 / 敵） */
  scoringSide?: PitchSide
  selfScoreBefore?: number
  opponentScoreBefore?: number
  selfBatterOrderBefore?: number
  opponentBatterOrderBefore?: number
  heldBatterOrderBefore?: number
  heldBattingSideBefore?: PitchSide
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
  selfPitcherName: string
  opponentPitcherName: string
  battingFirst: BattingFirst
  currentPitcherArm: Handedness
  inning: number
  halfInning: HalfInning
  /** 自分側の打順（1〜9） */
  selfBatterOrder: number
  /** 敵側の打順（1〜9） */
  opponentBatterOrder: number
  /** @deprecated 互換用。getActiveBatterOrder を使用 */
  activeBatterOrder?: number
  count: Count
  runners: Runners
  selfScore: number
  opponentScore: number
  /** この回から各半イニング開始時に特別延長（ノーアウト一・二塁）を適用 */
  specialExtraInningStart: number
  /** 盗塁失敗で半イニング終了後、次の同チーム攻撃で打順を固定 */
  heldBatterOrder?: number
  heldBattingSide?: PitchSide
  batters: BatterRecord[]
  /** 試合終了時刻（未設定なら記録中） */
  finishedAt?: number
}

export interface AppData {
  sessions: GameSession[]
  activeSessionId: string | null
  updatedAt?: number
}
