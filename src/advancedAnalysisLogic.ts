import {
  groupPitchesIntoPlateAppearances,
  isSacrificeBunt,
  isSacrificeFly,
  plateAppearanceEnds,
} from './atBatLogic'
import { isFourBallWalk } from './countLogic'
import { resolveBattingSide } from './gameLogic'
import { getSessionPitchesInGameOrder } from './storage'
import { formatPercentRate } from './statsFormat'
import type { GameSession, PitchRecord } from './types'

export interface StealAnalysisStats {
  attempts: number
  successes: number
  successRate: string
}

export interface PitchQualityStats {
  firstPitchStrikes: number
  firstPitchTotal: number
  firstPitchStrikeRate: string
  twoStrikePlateAppearances: number
  twoStrikeReach: number
  twoStrikeReachRate: string
}

export interface SacrificeAnalysisStats {
  sacrificeFlies: number
  sacrificeBunts: number
}

export interface AdvancedAnalysisResult {
  steals: StealAnalysisStats
  pitchQuality: PitchQualityStats
  sacrifices: SacrificeAnalysisStats
}

function isFirstPitch(pitch: PitchRecord): boolean {
  return pitch.countBefore.balls === 0 && pitch.countBefore.strikes === 0
}

function isFirstPitchStrike(pitch: PitchRecord): boolean {
  const primary = pitch.primaryResult ?? pitch.result
  if (primary === 'ball') return false
  if (primary === 'hbp') return false
  if (isFourBallWalk(pitch.countBefore, primary)) return false
  return true
}

function plateAppearanceReachedTwoStrikes(pitches: PitchRecord[]): boolean {
  for (const pitch of pitches) {
    if (pitch.countBefore.strikes >= 2) return true
  }
  return false
}

export function computeAdvancedAnalysis(sessions: GameSession[]): AdvancedAnalysisResult {
  let stealAttempts = 0
  let stealSuccesses = 0
  let firstPitchStrikes = 0
  let firstPitchTotal = 0
  let twoStrikePlateAppearances = 0
  let twoStrikeReach = 0
  let sacrificeFlies = 0
  let sacrificeBunts = 0

  for (const session of sessions) {
    const pitches = getSessionPitchesInGameOrder(session)

    for (const pitch of pitches) {
      const battingSide = resolveBattingSide(session.battingFirst, pitch.halfInning)

      if (battingSide === 'self' && pitch.extraResult === 'steal' && pitch.stealAttempt) {
        stealAttempts += 1
        if (pitch.stealAttempt.outcome === 'success') stealSuccesses += 1
      }

      if (pitch.pitchSide === 'self' && isFirstPitch(pitch)) {
        firstPitchTotal += 1
        if (isFirstPitchStrike(pitch)) firstPitchStrikes += 1
      }
    }

    for (const plateAppearance of groupPitchesIntoPlateAppearances(pitches)) {
      const ending = plateAppearance[plateAppearance.length - 1]
      if (!ending || !plateAppearanceEnds(ending)) continue

      const battingSide = resolveBattingSide(session.battingFirst, ending.halfInning)
      if (battingSide === 'self') {
        if (isSacrificeBunt(ending)) sacrificeBunts += 1
        if (isSacrificeFly(ending)) sacrificeFlies += 1
      }

      if (ending.pitchSide === 'self' && battingSide === 'opponent') {
        twoStrikePlateAppearances += 1
        if (plateAppearanceReachedTwoStrikes(plateAppearance)) twoStrikeReach += 1
      }
    }
  }

  return {
    steals: {
      attempts: stealAttempts,
      successes: stealSuccesses,
      successRate: formatPercentRate(stealSuccesses, stealAttempts, 1),
    },
    pitchQuality: {
      firstPitchStrikes,
      firstPitchTotal,
      firstPitchStrikeRate: formatPercentRate(firstPitchStrikes, firstPitchTotal, 1),
      twoStrikePlateAppearances,
      twoStrikeReach,
      twoStrikeReachRate: formatPercentRate(twoStrikeReach, twoStrikePlateAppearances, 1),
    },
    sacrifices: {
      sacrificeFlies,
      sacrificeBunts,
    },
  }
}
