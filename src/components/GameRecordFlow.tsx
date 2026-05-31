import { useMemo, useState } from 'react'
import {
  formatPitchResultDisplay,
  getPitchResultColorClass,
  getPitchSideLabel,
  getPitchTypeLabel,
} from '../constants'
import { atBatEnds } from '../gameLogic'
import {
  formatHalfInningRunLabel,
  formatHandMatchup,
  formatRecordCount,
  formatRunnersBefore,
  formatScoreBefore,
  formatZoneShort,
  sumHalfInningRuns,
} from '../recordDisplayLogic'
import { groupSessionPitchesByHalfInning, getSessionPitchCount } from '../storage'
import type { GameSession, PitchRecord } from '../types'

interface AtBatGroup {
  batterOrder: number
  pitches: PitchRecord[]
}

interface GameRecordFlowProps {
  session: GameSession
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getBatterLabel(session: GameSession, order: number): string {
  return session.batters.find((batter) => batter.order === order)?.label ?? `${order}番`
}

function pitchEndsAtBat(pitch: PitchRecord): boolean {
  return atBatEnds(pitch.primaryResult ?? pitch.result, pitch.countBefore, pitch.extraResult)
}

function groupPitchesIntoAtBats(pitches: PitchRecord[]): AtBatGroup[] {
  const groups: AtBatGroup[] = []
  let current: AtBatGroup | null = null

  for (const pitch of pitches) {
    const prevEnded =
      current != null &&
      current.pitches.length > 0 &&
      pitchEndsAtBat(current.pitches[current.pitches.length - 1]!)

    if (current == null || current.batterOrder !== pitch.batterOrder || prevEnded) {
      if (current) groups.push(current)
      current = { batterOrder: pitch.batterOrder, pitches: [pitch] }
      continue
    }
    current.pitches.push(pitch)
  }

  if (current) groups.push(current)
  return groups
}

function atBatFrameClass(pitches: PitchRecord[]): string {
  const last = pitches[pitches.length - 1]
  if (!last) return 'result-ongoing'
  if (!pitchEndsAtBat(last)) return 'result-ongoing'
  return getPitchResultColorClass(last)
}

function atBatSummary(pitches: PitchRecord[]): string {
  const last = pitches[pitches.length - 1]
  if (!last) return ''
  if (!pitchEndsAtBat(last)) return `${pitches.length}球 · 打席続行`
  return formatPitchResultDisplay(last)
}

function PitchRecordRow({ pitch, index }: { pitch: PitchRecord; index: number }) {
  const tone = getPitchResultColorClass(pitch)
  const scoreBefore = formatScoreBefore(pitch)
  const runs = pitch.runsScored ?? 0

  return (
    <li className={`records-pitch-row ${tone}`}>
      <div className="records-pitch-row-top">
        <span className="records-atbat-pitch-index">{index + 1}</span>
        <span className={`side-badge side-${pitch.pitchSide}`}>{getPitchSideLabel(pitch.pitchSide)}</span>
        <strong className="records-pitch-zone">{formatZoneShort(pitch)}</strong>
        <span className={`history-badge ${tone}`}>{formatPitchResultDisplay(pitch)}</span>
      </div>
      <div className="records-pitch-row-meta">
        <span className="records-pitch-meta-item">
          <span className="records-pitch-meta-label">球種</span>
          {getPitchTypeLabel(pitch.pitchType)}
        </span>
        <span className="records-pitch-meta-item">
          <span className="records-pitch-meta-label">カウント</span>
          {formatRecordCount(pitch.countBefore)}
        </span>
        <span className="records-pitch-meta-item">
          <span className="records-pitch-meta-label">走者</span>
          {formatRunnersBefore(pitch.runnersBefore)}
        </span>
        <span className="records-pitch-meta-item">
          <span className="records-pitch-meta-label">対戦</span>
          {formatHandMatchup(pitch)}
        </span>
      </div>
      <div className="records-pitch-row-foot">
        <span>{pitch.pitcherName}</span>
        {scoreBefore ? <span className="records-score-chip">スコア {scoreBefore}</span> : null}
        {runs > 0 ? (
          <span className="records-run-badge">
            +{runs}点 ({pitch.scoringSide === 'self' ? '自分' : '相手'})
          </span>
        ) : null}
        <span className="records-pitch-time">{formatTime(pitch.timestamp)}</span>
      </div>
    </li>
  )
}

export function GameRecordFlow({ session }: GameRecordFlowProps) {
  const groups = useMemo(() => groupSessionPitchesByHalfInning(session), [session])
  const pitchCount = getSessionPitchCount(session)
  const [compactAtBats, setCompactAtBats] = useState(false)

  if (pitchCount === 0) {
    return <p className="records-empty">この試合の記録はまだありません</p>
  }

  return (
    <div className="records-game-flow">
      <div className="records-flow-toolbar">
        <span className="records-flow-toolbar-label">表示</span>
        <button
          type="button"
          className={`records-flow-toggle ${compactAtBats ? 'active' : ''}`}
          aria-pressed={compactAtBats}
          onClick={() => setCompactAtBats((value) => !value)}
        >
          {compactAtBats ? '打席を展開表示' : '打席を折りたたむ'}
        </button>
      </div>

      {groups.map((group, groupIndex) => {
        const { selfRuns, opponentRuns } = sumHalfInningRuns(group.pitches)
        const runLabel = formatHalfInningRunLabel(selfRuns, opponentRuns)
        const atBats = groupPitchesIntoAtBats(group.pitches)

        return (
          <details key={group.key} className="records-inning-block" open={groupIndex === 0}>
            <summary className="records-inning-summary">
              <span className="records-inning-title">{group.label}</span>
              <span className="records-inning-meta">
                {atBats.length}打席 · {group.pitches.length}球
                {runLabel ? ` · ${runLabel}` : ''}
              </span>
            </summary>

            <div className="records-atbat-list">
              {atBats.map((atBat, atBatIndex) => {
                const frameClass = atBatFrameClass(atBat.pitches)
                const summary = atBatSummary(atBat.pitches)

                if (compactAtBats) {
                  return (
                    <article
                      key={`${group.key}-${atBatIndex}-${atBat.batterOrder}`}
                      className={`records-atbat-compact ${frameClass}`}
                    >
                      <span className="records-atbat-batter">{getBatterLabel(session, atBat.batterOrder)}</span>
                      <span className="records-atbat-pitch-count">{atBat.pitches.length}球</span>
                      <span className={`history-badge ${frameClass}`}>{summary}</span>
                    </article>
                  )
                }

                return (
                  <article
                    key={`${group.key}-${atBatIndex}-${atBat.batterOrder}`}
                    className={`records-atbat-card ${frameClass}`}
                  >
                    <header className="records-atbat-head">
                      <strong className="records-atbat-batter">{getBatterLabel(session, atBat.batterOrder)}</strong>
                      <span className="records-atbat-pitch-count">{atBat.pitches.length}球</span>
                      <span className={`history-badge ${frameClass}`}>{summary}</span>
                    </header>
                    <ul className="records-atbat-pitches">
                      {atBat.pitches.map((pitch, index) => (
                        <PitchRecordRow key={pitch.id} pitch={pitch} index={index} />
                      ))}
                    </ul>
                  </article>
                )
              })}
            </div>
          </details>
        )
      })}
    </div>
  )
}
