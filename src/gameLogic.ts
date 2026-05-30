import { updateCount } from './countLogic'
import { applySpecialExtraHalfStart } from './specialExtraLogic'
import { applyStealAttempt } from './stealLogic'
import { updateRunners } from './runnerLogic'
import type {
  BattingFirst,
  Count,
  GameSession,
  HalfInning,
  OutTarget,
  PitchResult,
  PitchSide,
  StealAttempt,
  RunnerBase,
} from './types'

export function formatInningLabel(inning: number, half: HalfInning): string {
  return `${inning}回${half === 'top' ? '表' : '裏'}`
}

/** 表裏と先攻から、いま打っている側（得点が入る側）を決める */
export function resolveBattingSide(battingFirst: BattingFirst, halfInning: HalfInning): PitchSide {
  const selfBatting =
    (battingFirst === 'self' && halfInning === 'top') ||
    (battingFirst === 'opponent' && halfInning === 'bottom')
  return selfBatting ? 'self' : 'opponent'
}

/** 表裏と先攻から、記録する投球側（敵/自分）を決める */
export function resolvePitchSide(battingFirst: BattingFirst, halfInning: HalfInning): PitchSide {
  return resolveBattingSide(battingFirst, halfInning) === 'self' ? 'opponent' : 'self'
}

export type TeamSide = 'self' | 'opponent'

export function getTeamSideLabel(side: TeamSide): string {
  return side === 'self' ? '自分' : '敵'
}

export interface SetupPitcherFieldDef {
  orderLabel: '先攻' | '後攻'
  side: TeamSide
  fieldLabel: string
  storageKey: 'selfPitcherName' | 'opponentPitcherName'
}

/** 先攻を上・後攻を下。battingFirst と self/opponent の対応を固定 */
export function getSetupPitcherFields(battingFirst: BattingFirst): [SetupPitcherFieldDef, SetupPitcherFieldDef] {
  if (battingFirst === 'self') {
    return [
      {
        orderLabel: '先攻',
        side: 'self',
        fieldLabel: '先攻（自分）',
        storageKey: 'selfPitcherName',
      },
      {
        orderLabel: '後攻',
        side: 'opponent',
        fieldLabel: '後攻（敵）',
        storageKey: 'opponentPitcherName',
      },
    ]
  }
  return [
    {
      orderLabel: '先攻',
      side: 'opponent',
      fieldLabel: '先攻（敵）',
      storageKey: 'opponentPitcherName',
    },
    {
      orderLabel: '後攻',
      side: 'self',
      fieldLabel: '後攻（自分）',
      storageKey: 'selfPitcherName',
    },
  ]
}

/** セットアップ画面の先攻・後攻投手名を self / opponent に割り当て */
export function mapSetupPitchers(
  battingFirst: BattingFirst,
  battingFirstPitcher: string,
  battingSecondPitcher: string,
): { selfPitcherName: string; opponentPitcherName: string } {
  const first = battingFirstPitcher.trim()
  const second = battingSecondPitcher.trim()
  if (battingFirst === 'self') {
    return {
      selfPitcherName: first || '自分',
      opponentPitcherName: second || '敵',
    }
  }
  return {
    opponentPitcherName: first || '敵',
    selfPitcherName: second || '自分',
  }
}

export function getPitcherNameForSide(
  session: Pick<GameSession, 'selfPitcherName' | 'opponentPitcherName'>,
  pitchSide: PitchSide,
): string {
  return pitchSide === 'self' ? session.selfPitcherName : session.opponentPitcherName
}

export function getCurrentPitcherName(session: GameSession): string {
  return getPitcherNameForSide(session, resolvePitchSide(session.battingFirst, session.halfInning))
}

export function formatSessionPitchers(session: Pick<GameSession, 'selfPitcherName' | 'opponentPitcherName'>): string {
  return `${session.selfPitcherName} / ${session.opponentPitcherName}`
}

export function formatSessionScore(session: Pick<GameSession, 'selfScore' | 'opponentScore'>): string {
  return `敵 ${session.opponentScore} - ${session.selfScore} 自分`
}

export function getActiveBatterOrder(
  session: Pick<GameSession, 'battingFirst' | 'halfInning' | 'selfBatterOrder' | 'opponentBatterOrder' | 'activeBatterOrder'>,
): number {
  if (session.selfBatterOrder != null && session.opponentBatterOrder != null) {
    const side = resolveBattingSide(session.battingFirst, session.halfInning)
    return side === 'self' ? session.selfBatterOrder : session.opponentBatterOrder
  }
  return session.activeBatterOrder ?? 1
}

function advanceBatterOrder(order: number): number {
  return order >= 9 ? 1 : order + 1
}

export function getSessionProgressLabel(
  session: Pick<
    GameSession,
    'inning' | 'halfInning' | 'selfBatterOrder' | 'opponentBatterOrder' | 'activeBatterOrder' | 'battingFirst' | 'selfScore' | 'opponentScore'
  >,
): string {
  return `${formatInningLabel(session.inning, session.halfInning)} · ${getActiveBatterOrder(session)}番 · ${formatSessionScore(session)}`
}

export function atBatEnds(result: PitchResult, countBefore: Count): boolean {
  switch (result) {
    case 'groundout':
    case 'flyout':
    case 'liner':
    case 'double_play':
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
    case 'steal':
      return false
    default:
      return false
  }
}

function resolveEffectiveGameResult(primaryResult: PitchResult, extraResult?: PitchResult | null): PitchResult {
  if (!extraResult || extraResult === 'steal') return primaryResult
  return extraResult
}

export function advanceGameState(
  session: Pick<
    GameSession,
    | 'inning'
    | 'halfInning'
    | 'selfBatterOrder'
    | 'opponentBatterOrder'
    | 'activeBatterOrder'
    | 'runners'
    | 'battingFirst'
    | 'selfScore'
    | 'opponentScore'
    | 'specialExtraInningStart'
    | 'heldBatterOrder'
    | 'heldBattingSide'
  >,
  countBefore: Count,
  primaryResult: PitchResult,
  extraResult?: PitchResult | null,
  outsRecorded?: OutTarget[],
  stealAttempt?: StealAttempt | null,
  runnersAdvanced?: RunnerBase[],
): Pick<
  GameSession,
  | 'inning'
  | 'halfInning'
  | 'selfBatterOrder'
  | 'opponentBatterOrder'
  | 'activeBatterOrder'
  | 'runners'
  | 'selfScore'
  | 'opponentScore'
  | 'heldBatterOrder'
  | 'heldBattingSide'
> & {
  count: Count
  runsScored: number
  scoringSide: PitchSide | null
  holdBatterOrderAfterHalf: boolean
} {
  const effectiveGameResult = resolveEffectiveGameResult(primaryResult, extraResult)
  let count = updateCount(countBefore, primaryResult)
  let { inning, halfInning, runners, selfScore, opponentScore } = session
  let selfBatterOrder = session.selfBatterOrder ?? session.activeBatterOrder ?? 1
  let opponentBatterOrder = session.opponentBatterOrder ?? session.activeBatterOrder ?? 1
  let heldBatterOrder = session.heldBatterOrder
  let heldBattingSide = session.heldBattingSide
  const battingSideThisPitch = resolveBattingSide(session.battingFirst, halfInning)
  let currentBatterOrder =
    battingSideThisPitch === 'self' ? selfBatterOrder : opponentBatterOrder
  const atBatEnded = atBatEnds(effectiveGameResult, countBefore)

  const runnerUpdate = updateRunners(
    runners,
    effectiveGameResult,
    atBatEnded,
    outsRecorded,
    runnersAdvanced,
  )
  runners = runnerUpdate.runners
  let runsScored = runnerUpdate.runsScored
  let scoringSide: PitchSide | null = null

  if (runsScored > 0) {
    scoringSide = battingSideThisPitch
    if (scoringSide === 'self') {
      selfScore += runsScored
    } else {
      opponentScore += runsScored
    }
  }

  if (stealAttempt) {
    const stealUpdate = applyStealAttempt(runners, count, stealAttempt)
    runners = stealUpdate.runners
    count = stealUpdate.count
    if (stealUpdate.runsScored > 0) {
      scoringSide = battingSideThisPitch
      if (scoringSide === 'self') {
        selfScore += stealUpdate.runsScored
      } else {
        opponentScore += stealUpdate.runsScored
      }
      runsScored += stealUpdate.runsScored
    }
  }

  if (atBatEnded) {
    currentBatterOrder = advanceBatterOrder(currentBatterOrder)
    if (battingSideThisPitch === 'self') selfBatterOrder = currentBatterOrder
    else opponentBatterOrder = currentBatterOrder
  }

  let holdBatterOrderAfterHalf = false
  if (stealAttempt?.outcome === 'failed' && count.outs >= 3) {
    heldBatterOrder = currentBatterOrder
    heldBattingSide = battingSideThisPitch
    holdBatterOrderAfterHalf = true
  }

  if (count.outs >= 3) {
    count = { balls: 0, strikes: 0, outs: 0 }
    if (halfInning === 'top') {
      halfInning = 'bottom'
    } else {
      halfInning = 'top'
      inning += 1
    }

    const battingSideAfter = resolveBattingSide(session.battingFirst, halfInning)
    if (heldBatterOrder != null && heldBattingSide === battingSideAfter) {
      if (heldBattingSide === 'self') selfBatterOrder = heldBatterOrder
      else opponentBatterOrder = heldBatterOrder
      heldBatterOrder = undefined
      heldBattingSide = undefined
    }

    runners = applySpecialExtraHalfStart(inning, session.specialExtraInningStart)
  }

  const activeBatterOrder = getActiveBatterOrder({
    battingFirst: session.battingFirst,
    halfInning,
    selfBatterOrder,
    opponentBatterOrder,
  })

  return {
    inning,
    halfInning,
    selfBatterOrder,
    opponentBatterOrder,
    activeBatterOrder,
    runners,
    selfScore,
    opponentScore,
    heldBatterOrder,
    heldBattingSide,
    count,
    runsScored,
    scoringSide,
    holdBatterOrderAfterHalf,
  }
}
