import { useMemo, useState } from 'react'
import { computeSelfAnalysis, getAnalysisSessions, type SelfAnalysisSnapshot } from '../analysisLogic'
import type { GameSession } from '../types'
import { AnalysisAssumptions } from './analysis/AnalysisAssumptions'
import { AnalysisBattingTab } from './analysis/AnalysisBattingTab'
import { AnalysisOverviewTab } from './analysis/AnalysisOverviewTab'
import { AnalysisPitchingTab } from './analysis/AnalysisPitchingTab'
import { AnalysisPitchTypeTab } from './analysis/AnalysisPitchTypeTab'
import { AnalysisTrendTab } from './analysis/AnalysisTrendTab'

interface AnalysisPanelProps {
  sessions: GameSession[]
  onBack: () => void
  onOpenSession?: (sessionId: string) => void
}

type AnalysisRange = 'all' | 'recent30'
type AnalysisTab = 'overview' | 'batting' | 'pitching' | 'pitchTypes' | 'trends'

const ANALYSIS_TABS: { id: AnalysisTab; label: string }[] = [
  { id: 'overview', label: '概要' },
  { id: 'batting', label: '打撃' },
  { id: 'pitching', label: '投球' },
  { id: 'pitchTypes', label: '配球' },
  { id: 'trends', label: '推移' },
]

function AnalysisTabPanel({
  tab,
  snapshot,
  onOpenSession,
}: {
  tab: AnalysisTab
  snapshot: SelfAnalysisSnapshot
  onOpenSession?: (sessionId: string) => void
}) {
  switch (tab) {
    case 'overview':
      return <AnalysisOverviewTab snapshot={snapshot} />
    case 'batting':
      return <AnalysisBattingTab snapshot={snapshot} />
    case 'pitching':
      return <AnalysisPitchingTab snapshot={snapshot} />
    case 'pitchTypes':
      return <AnalysisPitchTypeTab snapshot={snapshot} />
    case 'trends':
      return <AnalysisTrendTab snapshot={snapshot} onOpenSession={onOpenSession} />
  }
}

export function AnalysisPanel({ sessions, onBack, onOpenSession }: AnalysisPanelProps) {
  const [range, setRange] = useState<AnalysisRange>('all')
  const [tab, setTab] = useState<AnalysisTab>('overview')

  const targetSessions = useMemo(
    () => getAnalysisSessions(sessions, range === 'recent30' ? 30 : undefined),
    [sessions, range],
  )

  const snapshot = useMemo(() => computeSelfAnalysis(targetSessions), [targetSessions])

  return (
    <div className="flow-screen analysis-screen">
      <header className="flow-header panel-card">
        <button type="button" className="ghost-btn compact back-btn" onClick={onBack}>
          ← ホーム
        </button>
        <div>
          <p className="app-kicker">自分側のみ</p>
          <h1>分析</h1>
          <p className="analysis-lead">通算と直近30試合の成績を表示します</p>
          {targetSessions.length > 0 ? (
            <p className="analysis-header-stats">
              {snapshot.header.games}試合 · {snapshot.header.plateAppearances}打席 · {snapshot.header.inningsPitched}投球回
            </p>
          ) : null}
        </div>
      </header>

      <div className="analysis-range-tabs" role="tablist" aria-label="集計期間">
        <button
          type="button"
          role="tab"
          aria-selected={range === 'all'}
          className={`analysis-range-tab ${range === 'all' ? 'active' : ''}`}
          onClick={() => setRange('all')}
        >
          通算
          <span className="analysis-range-sub">{getAnalysisSessions(sessions).length}試合</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={range === 'recent30'}
          className={`analysis-range-tab ${range === 'recent30' ? 'active' : ''}`}
          onClick={() => setRange('recent30')}
        >
          直近30試合
          <span className="analysis-range-sub">{Math.min(30, getAnalysisSessions(sessions).length)}試合</span>
        </button>
      </div>

      {targetSessions.length === 0 ? (
        <div className="panel-card empty-state">
          <div className="empty-icon">📊</div>
          <p>分析できる試合がありません</p>
          <p className="empty-hint">記録した試合がここに集計されます</p>
        </div>
      ) : (
        <>
          <div className="analysis-section-tabs" role="tablist" aria-label="分析カテゴリ">
            {ANALYSIS_TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                className={`analysis-section-tab ${tab === item.id ? 'active' : ''}`}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="analysis-tab-panel" role="tabpanel">
            <AnalysisTabPanel tab={tab} snapshot={snapshot} onOpenSession={onOpenSession} />
          </div>

          <AnalysisAssumptions />
        </>
      )}
    </div>
  )
}
