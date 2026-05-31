/** 打率・被打率などの最低サンプル数 */
export const MIN_RATE_SAMPLE = 3

export const NO_STAT = '---'
export const NO_ERA = '--.--'

export function hasEnoughSample(sampleSize: number, minSample = MIN_RATE_SAMPLE): boolean {
  return sampleSize >= minSample
}

export function inningsAsDecimal(outsRecorded: number): number {
  return outsRecorded / 3
}

/** 投球回表示（例: 12.1 = 12回1/3） */
export function formatInningsPitched(outsRecorded: number): string {
  if (outsRecorded <= 0) return '0'
  const full = Math.floor(outsRecorded / 3)
  const remainder = outsRecorded % 3
  if (remainder === 0) return String(full)
  return `${full}.${remainder}`
}

export function formatAverage(
  hits: number,
  atBats: number,
  minSample = MIN_RATE_SAMPLE,
): string {
  if (!hasEnoughSample(atBats, minSample)) return NO_STAT
  const value = hits / atBats
  return value >= 1 ? '1.000' : value.toFixed(3).slice(1)
}

export function formatDecimalRate(
  numerator: number,
  denominator: number,
  minSample = MIN_RATE_SAMPLE,
): string {
  if (!hasEnoughSample(denominator, minSample)) return NO_STAT
  const value = numerator / denominator
  return value >= 1 ? '1.000' : value.toFixed(3).slice(1)
}

export function formatPercentRate(
  numerator: number,
  denominator: number,
  minSample = MIN_RATE_SAMPLE,
): string {
  if (!hasEnoughSample(denominator, minSample)) return NO_STAT
  return `${((numerator / denominator) * 100).toFixed(1)}%`
}

export function formatObp(stats: {
  hits: number
  atBats: number
  walks: number
  hbp: number
  sacrificeFlies: number
}): string {
  const numerator = stats.hits + stats.walks + stats.hbp
  const denominator = stats.atBats + stats.walks + stats.hbp + stats.sacrificeFlies
  return formatDecimalRate(numerator, denominator, 1)
}

export function formatSlg(totalBases: number, atBats: number, minSample = MIN_RATE_SAMPLE): string {
  return formatAverage(totalBases, atBats, minSample)
}

export function formatOps(obp: string, slg: string): string {
  if (obp === NO_STAT || slg === NO_STAT) return NO_STAT
  const obpValue = Number.parseFloat(obp.startsWith('.') ? `0${obp}` : obp)
  const slgValue = Number.parseFloat(slg.startsWith('.') ? `0${slg}` : slg)
  if (Number.isNaN(obpValue) || Number.isNaN(slgValue)) return NO_STAT
  const value = obpValue + slgValue
  return value >= 1 ? '1.000' : value.toFixed(3).slice(1)
}

/** 防御率（9.16準拠の自責点 × 9 ÷ 投球回） */
export function formatEra(earnedRuns: number, outsRecorded: number): string {
  const innings = inningsAsDecimal(outsRecorded)
  if (innings === 0) return NO_ERA
  return ((earnedRuns * 9) / innings).toFixed(2)
}

export function formatEraRate(value: number, outsRecorded: number): string {
  const innings = inningsAsDecimal(outsRecorded)
  if (innings === 0) return NO_ERA
  return ((value * 9) / innings).toFixed(2)
}

export function formatWhiP(hitsAllowed: number, walksAllowed: number, outsRecorded: number): string {
  const innings = inningsAsDecimal(outsRecorded)
  if (innings === 0) return NO_ERA
  return ((hitsAllowed + walksAllowed) / innings).toFixed(2)
}

export function formatWinRate(wins: number, losses: number): string {
  const total = wins + losses
  return formatDecimalRate(wins, total, 1)
}

export function formatUsageRate(count: number, total: number): string {
  if (total === 0) return NO_STAT
  return `${((count / total) * 100).toFixed(1)}%`
}

export function zoneHeatLevel(
  average: string,
  sampleSize: number,
  lowerIsBetter = false,
  minSample = MIN_RATE_SAMPLE,
): number {
  if (!hasEnoughSample(sampleSize, minSample) || average === NO_STAT) return 0
  const value = Number.parseFloat(average.startsWith('.') ? `0${average}` : average)
  if (Number.isNaN(value)) return 0
  const normalized = lowerIsBetter ? 1 - value : value
  return Math.max(0, Math.min(1, normalized / 0.4))
}
