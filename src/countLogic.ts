import type { Count, PitchResult } from './types'

export function updateCount(count: Count, result: PitchResult): Count {
  const { balls, strikes, outs } = count

  switch (result) {
    case 'ball': {
      const nextBalls = balls + 1
      if (nextBalls >= 4) return { balls: 0, strikes: 0, outs }
      return { balls: nextBalls, strikes, outs }
    }
    case 'called_strike':
    case 'swinging_strike': {
      const nextStrikes = strikes + 1
      if (nextStrikes >= 3) return { balls: 0, strikes: 0, outs: outs + 1 }
      return { balls, strikes: nextStrikes, outs }
    }
    case 'foul':
      if (strikes < 2) return { balls, strikes: strikes + 1, outs }
      return count
    case 'walk':
    case 'hbp':
      return { balls: 0, strikes: 0, outs }
    case 'groundout':
    case 'flyout':
    case 'liner':
      return { balls: 0, strikes: 0, outs: Math.min(outs + 1, 3) }
    case 'double_play':
      return { balls: 0, strikes: 0, outs: Math.min(outs + 2, 3) }
    case 'single':
    case 'double':
    case 'triple':
    case 'homerun':
    case 'bunt':
    case 'error':
      return { balls: 0, strikes: 0, outs }
    default:
      return count
  }
}
