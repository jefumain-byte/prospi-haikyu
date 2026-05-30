import { EMPTY_RUNNERS } from './runnerLogic'
import type { Runners } from './types'

export const DEFAULT_SPECIAL_EXTRA_INNING_START = 3

export const SPECIAL_EXTRA_INNING_OPTIONS = Array.from({ length: 15 }, (_, index) => index + 1)

/** 打順 order の1つ前（1番の前は9番） */
export function previousBatterOrder(order: number): number {
  return order === 1 ? 9 : order - 1
}

/** 打順 order の2つ前 */
export function twoBattersBefore(order: number): number {
  if (order === 1) return 8
  if (order === 2) return 9
  return order - 2
}

export function isSpecialExtraInningHalf(inning: number, specialExtraInningStart: number): boolean {
  return inning >= specialExtraInningStart
}

/** 特別延長の半イニング開始時: ノーアウト・一塁・二塁 */
export function getSpecialExtraRunners(): Runners {
  return { first: true, second: true, third: false }
}

/** 打席の打者に対し、一塁・二塁走者の打順（前の2人） */
export function getSpecialExtraRunnerOrders(activeBatterOrder: number): { first: number; second: number } {
  return {
    first: previousBatterOrder(activeBatterOrder),
    second: twoBattersBefore(activeBatterOrder),
  }
}

export function formatSpecialExtraRunnerNote(activeBatterOrder: number): string {
  const { first, second } = getSpecialExtraRunnerOrders(activeBatterOrder)
  return `1塁 ${first}番 · 2塁 ${second}番`
}

export function applySpecialExtraHalfStart(
  inning: number,
  specialExtraInningStart: number,
): Runners {
  if (!isSpecialExtraInningHalf(inning, specialExtraInningStart)) {
    return { ...EMPTY_RUNNERS }
  }
  return getSpecialExtraRunners()
}
