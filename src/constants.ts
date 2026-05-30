import type { Handedness, PitchResult, PitchSide, PitchType, ZoneCell } from './types'

export const STORAGE_KEY = 'prospi-haikyu-data-v2'
export const SYNC_ID_KEY = 'prospi-sync-id-v1'

export const PITCH_SIDES: { id: PitchSide; label: string }[] = [
  { id: 'opponent', label: '相手' },
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

export const PITCH_TYPES: { id: PitchType; label: string }[] = [
  { id: 'fastball', label: 'ストレート' },
  { id: 'shoot', label: 'シュート' },
  { id: 'two_seam', label: 'ツーシーム' },
  { id: 'slider', label: 'スライダー' },
  { id: 'cut', label: 'カット' },
  { id: 'curve', label: 'カーブ' },
  { id: 'slow_curve', label: 'スローカーブ' },
  { id: 'fork', label: 'フォーク' },
  { id: 'changeup', label: 'チェンジアップ' },
  { id: 'sinker', label: 'シンカー' },
  { id: 'knuckle', label: 'ナックル' },
  { id: 'other', label: 'その他' },
]

export const PITCH_RESULTS: { id: PitchResult; label: string; group: string }[] = [
  { id: 'ball', label: 'ボール', group: '判定' },
  { id: 'called_strike', label: '見逃し', group: '判定' },
  { id: 'swinging_strike', label: '空振り', group: '判定' },
  { id: 'foul', label: 'ファウル', group: '判定' },
  { id: 'groundout', label: 'ゴロアウト', group: '打球' },
  { id: 'flyout', label: 'フライアウト', group: '打球' },
  { id: 'liner', label: 'ライナー', group: '打球' },
  { id: 'single', label: 'ヒット', group: '打球' },
  { id: 'double', label: '二塁打', group: '打球' },
  { id: 'triple', label: '三塁打', group: '打球' },
  { id: 'homerun', label: 'ホームラン', group: '打球' },
  { id: 'walk', label: '四球', group: 'その他' },
  { id: 'hbp', label: '死球', group: 'その他' },
  { id: 'bunt', label: 'バント', group: 'その他' },
  { id: 'error', label: 'エラー', group: 'その他' },
]

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
  return PITCH_RESULTS.find((r) => r.id === id)?.label ?? id
}

export function getZoneLabel(row: number, col: number): string {
  return ZONE_GRID[row]?.[col]?.label ?? `${row},${col}`
}
