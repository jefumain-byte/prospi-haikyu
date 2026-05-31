import { TREND_GAME_LIMIT } from '../../gameAnalysisLogic'
import type { SelfAnalysisSnapshot } from '../../analysisLogic'
import { AnalysisSparkline } from './AnalysisSparkline'
import { AnalysisStatCard } from './AnalysisStatCard'

interface AnalysisTrendTabProps {
  snapshot: SelfAnalysisSnapshot
  onOpenSession?: (sessionId: string) => void
}

function gameResultTone(label: string): string {
  if (label === '勝') return 'win'
  if (label === '敗') return 'loss'
  if (label === '分') return 'draw'
  return 'ongoing'
}

export function AnalysisTrendTab({ snapshot, onOpenSession }: AnalysisTrendTabProps) {
  const { games, advanced } = snapshot
  const battingTrend = games.trends.find((item) => item.id === 'battingAverage')
  const eraTrend = games.trends.find((item) => item.id === 'era')

  return (
    <>
      <section className="panel-card analysis-summary">
        <h2 className="analysis-section-title">直近{TREND_GAME_LIMIT}試合の推移</h2>
        <p className="analysis-trend-lead">古い試合 ← → 新しい試合（期間タブの対象内）</p>
        <div className="analysis-sparkline-grid">
          {battingTrend ? <AnalysisSparkline series={battingTrend} /> : null}
          {eraTrend ? <AnalysisSparkline series={eraTrend} lowerIsBetter /> : null}
        </div>
      </section>

      <section className="panel-card analysis-summary">
        <h2 className="analysis-section-title">詳細指標</h2>
        <div className="analysis-stats-grid">
          <AnalysisStatCard
            label="初球ストライク率"
            value={advanced.pitchQuality.firstPitchStrikeRate}
            detail={`${advanced.pitchQuality.firstPitchStrikes}/${advanced.pitchQuality.firstPitchTotal}球`}
          />
          <AnalysisStatCard
            label="追い込み率"
            value={advanced.pitchQuality.twoStrikeReachRate}
            detail={`${advanced.pitchQuality.twoStrikeReach}/${advanced.pitchQuality.twoStrikePlateAppearances}打席`}
          />
          <AnalysisStatCard
            label="盗塁成功率"
            value={advanced.steals.successRate}
            detail={`${advanced.steals.successes}/${advanced.steals.attempts}試行`}
          />
          <AnalysisStatCard
            label="犠打・犠飛"
            value={`${advanced.sacrifices.sacrificeBunts}/${advanced.sacrifices.sacrificeFlies}`}
            detail="犠打 / 犠飛"
          />
        </div>
      </section>

      <section className="panel-card analysis-game-list-section">
        <div className="analysis-zone-head">
          <h2 className="analysis-section-title">試合一覧</h2>
          <p>各試合の打率・防御率（行タップで記録閲覧）</p>
        </div>
        <div className="analysis-game-table-wrap">
          <table className="analysis-game-table">
            <thead>
              <tr>
                <th scope="col">日付</th>
                <th scope="col">試合</th>
                <th scope="col">結果</th>
                <th scope="col">打率</th>
                <th scope="col">ERA</th>
              </tr>
            </thead>
            <tbody>
              {games.games.map((game) => (
                <tr
                  key={game.sessionId}
                  className={onOpenSession ? 'analysis-game-row-clickable' : undefined}
                  onClick={onOpenSession ? () => onOpenSession(game.sessionId) : undefined}
                  onKeyDown={
                    onOpenSession
                      ? (event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            onOpenSession(game.sessionId)
                          }
                        }
                      : undefined
                  }
                  tabIndex={onOpenSession ? 0 : undefined}
                  role={onOpenSession ? 'button' : undefined}
                >
                  <td>{game.dateLabel}</td>
                  <td>
                    {onOpenSession ? (
                      <span className="analysis-game-link">{game.label}</span>
                    ) : (
                      game.label
                    )}
                    <span className="analysis-game-sub">
                      {game.scoreLabel} · {game.pitchCount}球
                    </span>
                  </td>
                  <td>
                    <span className={`analysis-game-result result-${gameResultTone(game.resultLabel)}`}>
                      {game.resultLabel}
                    </span>
                  </td>
                  <td>{game.battingAverage}</td>
                  <td>{game.inningsPitched === '0' ? '---' : game.era}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
