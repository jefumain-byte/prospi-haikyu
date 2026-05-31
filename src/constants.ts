import { formatOutTargetsSuffix } from './outLogic'
import { formatRunnerAdvanceSuffix } from './runnerAdvanceLogic'
import { formatStealAttemptDisplay } from './stealLogic'
import type { Handedness, PitchRecord, PitchResult, PitchSide, PitchType, ZoneCell, BattingFirst } from './types'
import { isFourBallWalk } from './countLogic'
import { isThreeBuntFailure } from './buntLogic'

export const STORAGE_KEY = 'prospi-haikyu-data-v4'
export const SYNC_ID_KEY = 'prospi-sync-id-v1'

export const BATTING_FIRST_OPTIONS: { id: BattingFirst; label: string; desc: string }[] = [
  { id: 'self', label: '先攻', desc: '1回表から打つ' },
  { id: 'opponent', label: '後攻', desc: '1回裏から打つ' },
]

export const PITCH_SIDES: { id: PitchSide; label: string }[] = [
  { id: 'opponent', label: '敵' },
  { id: 'self', label: '自分' },
]

export const BATTER_HANDS: { id: Handedness; label: string }[] = [
  { id: 'right', label: '右打' },
  { id: 'left', label: '左打' },
]

export const PITCHER_ARMS: { id: Handedness; label: string }[] = [
  { id: 'right', label: '右投' },
  { id: 'left', label: '左投' },
]

export const PITCH_TYPE_GROUPS: { group: string; shortLabel: string; types: { id: PitchType; label: string }[] }[] = [
  {
    group: 'ストレート系',
    shortLabel: 'ストレート',
    types: [
      { id: 'fastball', label: 'ストレート' },
      { id: 'two_seam_fast', label: 'ツーシームファスト' },
      { id: 'moving_fast', label: 'ムービングファスト' },
      { id: 'one_seam', label: 'ワンシーム' },
      { id: 'change_of_pace', label: 'チェンジオブペース' },
      { id: 'changeup', label: 'チェンジアップ' },
      { id: 'ultra_slow', label: '超スローボール' },
      { id: 'straight', label: '真っスラ' },
      { id: 'natural_shoot', label: 'ナチュラルシュート' },
      { id: 'ephus', label: 'イーファスピッチ' },
    ],
  },
  {
    group: 'スライダー系',
    shortLabel: 'スライダー',
    types: [
      { id: 'slider', label: 'スライダー' },
      { id: 'slurve', label: 'スラーブ' },
      { id: 'cut_ball', label: 'カットボール' },
    ],
  },
  {
    group: 'カーブ系',
    shortLabel: 'カーブ',
    types: [
      { id: 'curve', label: 'カーブ' },
      { id: 'slow_curve', label: 'スローカーブ' },
      { id: 'd_curve', label: 'Dカーブ' },
      { id: 'power_curve', label: 'パワーカーブ' },
      { id: 'knuckle_curve', label: 'ナックルカーブ' },
    ],
  },
  {
    group: 'フォーク系',
    shortLabel: 'フォーク',
    types: [
      { id: 'fork', label: 'フォーク' },
      { id: 'sff', label: 'SFF' },
      { id: 'palm', label: 'パーム' },
      { id: 'knuckle', label: 'ナックル' },
      { id: 'vertical_slider', label: '縦スライダー' },
      { id: 'vertical_cut', label: '縦カット' },
      { id: 'changeup', label: 'チェンジアップ' },
      { id: 'split_change', label: 'スプリットチェンジ' },
    ],
  },
  {
    group: 'シンカー系',
    shortLabel: 'シンカー',
    types: [
      { id: 'sinker_screw', label: 'シンカー(スクリュー)' },
      { id: 'high_speed_sinker', label: '高速シンカー' },
      { id: 'circle_change', label: 'サークルチェンジ' },
      { id: 'palm', label: 'パーム' },
    ],
  },
]

export const PITCH_TYPES: { id: PitchType; label: string }[] = PITCH_TYPE_GROUPS.flatMap((g) => g.types).filter(
  (type, index, list) => list.findIndex((item) => item.id === type.id) === index,
)

export const PITCH_RESULT_NORMAL_GROUPS = ['判定', '打球'] as const
export const PITCH_RESULT_EXTRA_GROUP = 'その他'

export const PITCH_RESULTS: { id: PitchResult; label: string; group: string }[] = [
  { id: 'ball', label: 'ボール', group: '判定' },
  { id: 'called_strike', label: '見逃し', group: '判定' },
  { id: 'swinging_strike', label: '空振り', group: '判定' },
  { id: 'foul', label: 'ファウル', group: '判定' },
  { id: 'hbp', label: '死球', group: '判定' },
  { id: 'groundout', label: 'ゴロアウト', group: '打球' },
  { id: 'flyout', label: 'フライアウト', group: '打球' },
  { id: 'liner', label: 'ライナー', group: '打球' },
  { id: 'double_play', label: 'ダブルプレー', group: '打球' },
  { id: 'single', label: 'ヒット', group: '打球' },
  { id: 'double', label: '二塁打', group: '打球' },
  { id: 'triple', label: '三塁打', group: '打球' },
  { id: 'homerun', label: 'ホームラン', group: '打球' },
  { id: 'bunt', label: 'バント', group: 'その他' },
  { id: 'steal', label: '盗塁', group: 'その他' },
]

const LEGACY_PITCH_RESULT_LABELS: Partial<Record<PitchResult, string>> = {
  walk: '四球',
  error: 'エラー',
  batter_interference: '打撃妨害',
  runner_interference: '走塁妨害',
}

export const ZONE_GRID: ZoneCell[][] = [
  [
    { row: 0, col: 0, label: '左上（ボール）', shortLabel: '↖', inZone: false },
    { row: 0, col: 1, label: '上・外（ボール）', shortLabel: '上外', inZone: false },
    { row: 0, col: 2, label: '上（ボール）', shortLabel: '上', inZone: false },
    { row: 0, col: 3, label: '上・内（ボール）', shortLabel: '上内', inZone: false },
    { row: 0, col: 4, label: '右上（ボール）', shortLabel: '↗', inZone: false },
  ],
  [
    { row: 1, col: 0, label: '左・上（ボール）', shortLabel: '左↑', inZone: false },
    { row: 1, col: 1, label: '高外角', shortLabel: '高外', inZone: true },
    { row: 1, col: 2, label: '高真ん中', shortLabel: '高中', inZone: true },
    { row: 1, col: 3, label: '高内角', shortLabel: '高内', inZone: true },
    { row: 1, col: 4, label: '右・上（ボール）', shortLabel: '右↑', inZone: false },
  ],
  [
    { row: 2, col: 0, label: '左（ボール）', shortLabel: '左', inZone: false },
    { row: 2, col: 1, label: '外角', shortLabel: '外角', inZone: true },
    { row: 2, col: 2, label: '真ん中', shortLabel: '真中', inZone: true },
    { row: 2, col: 3, label: '内角', shortLabel: '内角', inZone: true },
    { row: 2, col: 4, label: '右（ボール）', shortLabel: '右', inZone: false },
  ],
  [
    { row: 3, col: 0, label: '左・下（ボール）', shortLabel: '左↓', inZone: false },
    { row: 3, col: 1, label: '低外角', shortLabel: '低外', inZone: true },
    { row: 3, col: 2, label: '低真ん中', shortLabel: '低中', inZone: true },
    { row: 3, col: 3, label: '低内角', shortLabel: '低内', inZone: true },
    { row: 3, col: 4, label: '右・下（ボール）', shortLabel: '右↓', inZone: false },
  ],
  [
    { row: 4, col: 0, label: '左下（ボール）', shortLabel: '↙', inZone: false },
    { row: 4, col: 1, label: '下・外（ボール）', shortLabel: '下外', inZone: false },
    { row: 4, col: 2, label: '下（ボール）', shortLabel: '下', inZone: false },
    { row: 4, col: 3, label: '下・内（ボール）', shortLabel: '下内', inZone: false },
    { row: 4, col: 4, label: '右下（ボール）', shortLabel: '↘', inZone: false },
  ],
]

export function getPitchSideLabel(id: PitchSide): string {
  return PITCH_SIDES.find((s) => s.id === id)?.label ?? id
}

export function getBattingFirstLabel(id: BattingFirst): string {
  return BATTING_FIRST_OPTIONS.find((o) => o.id === id)?.label ?? id
}

export function getBatterHandLabel(id: Handedness): string {
  return BATTER_HANDS.find((h) => h.id === id)?.label ?? id
}

export function getPitcherArmLabel(id: Handedness): string {
  return PITCHER_ARMS.find((a) => a.id === id)?.label ?? id
}

export function getPitchTypeLabel(id: PitchType): string {
  return PITCH_TYPES.find((t) => t.id === id)?.label ?? id
}

export function getPitchResultLabel(id: PitchResult): string {
  return PITCH_RESULTS.find((r) => r.id === id)?.label ?? LEGACY_PITCH_RESULT_LABELS[id] ?? id
}

export function getEffectivePitchResult(pitch: Pick<PitchRecord, 'result' | 'primaryResult' | 'extraResult'>): PitchResult {
  const primary = pitch.primaryResult ?? pitch.result
  const extra = pitch.extraResult
  if (!extra || extra === 'steal' || extra === 'bunt') return primary
  return extra
}

export function getPitchResultColorClass(
  pitch: Pick<PitchRecord, 'result' | 'primaryResult' | 'extraResult' | 'countBefore'>,
): string {
  if (isThreeBuntFailure(pitch)) return 'result-strike'
  return getPitchResultColorClassByResult(pitch.result)
}

export function getPitchResultColorClassByResult(result: PitchResult): string {
  if (result === 'ball' || result === 'walk' || result === 'hbp') return 'result-ball'
  if (result === 'batter_interference' || result === 'runner_interference') return 'result-ball'
  if (['called_strike', 'swinging_strike', 'foul'].includes(result)) return 'result-strike'
  if (['single', 'double', 'triple', 'homerun'].includes(result)) return 'result-hit'
  return 'result-out'
}

export function formatPitchResultDisplay(
  pitch: Pick<
    PitchRecord,
    | 'result'
    | 'primaryResult'
    | 'extraResult'
    | 'outsRecorded'
    | 'runnersAdvanced'
    | 'runnerAdvances'
    | 'batterOrder'
    | 'stealAttempt'
    | 'countBefore'
  >,
): string {
  const primary = pitch.primaryResult ?? pitch.result
  const extra = pitch.extraResult
  const batterLabel = `${pitch.batterOrder}番`
  const outSuffix = formatOutTargetsSuffix(pitch.outsRecorded, batterLabel)
  const advanceSuffix = formatRunnerAdvanceSuffix(pitch.runnerAdvances, pitch.runnersAdvanced)

  let base: string
  if (isThreeBuntFailure(pitch)) {
    base = 'スリーバント失敗'
  } else if (pitch.countBefore && isFourBallWalk(pitch.countBefore, primary)) {
    base = getPitchResultLabel('walk')
  } else if (extra === 'steal' && pitch.stealAttempt) {
    base = `${getPitchResultLabel(primary)} · ${formatStealAttemptDisplay(pitch.stealAttempt)}`
  } else if (extra) {
    base = `${getPitchResultLabel(primary)} · ${getPitchResultLabel(extra)}`
  } else {
    base = getPitchResultLabel(primary)
  }

  return `${base}${outSuffix}${advanceSuffix}`
}

export function getZoneLabel(row: number, col: number): string {
  return ZONE_GRID[row]?.[col]?.label ?? `${row},${col}`
}

export function isInStrikeZone(row: number, col: number): boolean {
  return ZONE_GRID[row]?.[col]?.inZone ?? false
}
