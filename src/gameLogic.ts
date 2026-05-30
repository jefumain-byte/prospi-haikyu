import { updateCount } from './countLogic'
import type { Count, GameSession, HalfInning, PitchResult } from './types'

export function formatInningLabel(inning: number, half: HalfInning): string {
  return `${inning}回${half === 'top' ? '表' : '裏'}`
}

export function atBatEnds(result: PitchResult, countBefore: Count): boolean {
  switch (result) {
    case 'groundout':
    case 'flyout':
    case 'liner':
    case 'walk':
    case 'hbp':
    case 'single':
    case 'double':
    case 'triple':
    case 'homerun':
    case 'bunt':
    case 'error':
      return true
    case 'called_strike':
    case 'swinging_strike':
      return countBefore.strikes >= 2
    case 'ball':
      return countBefore.balls >= 3
    case 'foul':
      return false
    default:
      return false
  }
}

export function advanceGameState(
  session: Pick<GameSession, 'inning' | 'halfInning' | 'activeBatterOrder'>,
  countBefore: Count,
  result: PitchResult,
): Pick<GameSession, 'inning' | 'halfInning' | 'activeBatterOrder'> & { count: Count } {
  let count = updateCount(countBefore, result)
  let { inning, halfInning, activeBatterOrder } = session

  if (atBatEnds(result, countBefore)) {
    activeBatterOrder = activeBatterOrder >= 9 ? 1 : activeBatterOrder + 1
  }

  if (count.outs >= 3) {
    count = { ...count, outs: 0 }
    if (halfInning === 'top') {
      halfInning = 'bottom'
    } else {
      halfInning = 'top'
      inning += 1
    }
  }

  return { inning, halfInning, activeBatterOrder, count }
}
