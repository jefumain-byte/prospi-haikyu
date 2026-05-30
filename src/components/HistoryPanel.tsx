import { useMemo, useState } from 'react'
import { getBatterHandLabel, getPitchResultLabel, getPitchSideLabel, getPitchTypeLabel, getPitcherArmLabel } from '../constants'
import { SideFilterToggle, type SideFilter } from './SideFilterToggle'
import type { PitchRecord, PitchResult } from '../types'

interface HistoryPanelProps {
  pitches: PitchRecord[]
  onUndo: () => void
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function resultClass(result: PitchResult): string {
  if (result === 'ball' || result === 'walk' || result === 'hbp') return 'result-ball'
  if (['called_strike', 'swinging_strike', 'foul'].includes(result)) return 'result-strike'
  if (['single', 'double', 'triple', 'homerun'].includes(result)) return 'result-hit'
  return 'result-out'
}

export function HistoryPanel({ pitches, onUndo }: HistoryPanelProps) {
  const [filterSide, setFilterSide] = useState<SideFilter>('all')

  const filteredPitches = useMemo(() => {
    if (filterSide === 'all') return pitches
    return pitches.filter((pitch) => pitch.pitchSide === filterSide)
  }, [pitches, filterSide])

  if (pitches.length === 0) {
    return (
      <div className="panel-card empty-state">
        <div className="empty-icon">⚾</div>
        <p>まだ記録がありません</p>
        <p className="empty-hint">「記録」タブで配球位置をタップしてください</p>
      </div>
    )
  }

  const reversed = [...filteredPitches].reverse()

  return (
    <div className="history-panel panel-card">
      <div className="panel-head">
        <div>
          <h2>投球履歴</h2>
          <p className="panel-sub">
            {filteredPitches.length} 球
            {filterSide !== 'all' ? `（${getPitchSideLabel(filterSide)}）` : ''}
          </p>
        </div>
        <button type="button" className="ghost-btn compact" onClick={onUndo}>
          1球戻す
        </button>
      </div>

      <div className="filter-row">
        <SideFilterToggle value={filterSide} onChange={setFilterSide} />
      </div>

      {filteredPitches.length === 0 ? (
        <div className="empty-state inline">
          <p>該当する記録がありません</p>
        </div>
      ) : (
        <ul className="history-list">
          {reversed.map((pitch, index) => (
            <li key={pitch.id} className={`history-item ${resultClass(pitch.result)}`}>
              <div className="history-index">{filteredPitches.length - index}</div>
              <div className="history-body">
                <div className="history-top">
                  <span className={`side-badge side-${pitch.pitchSide}`}>
                    {getPitchSideLabel(pitch.pitchSide)}
                  </span>
                  <strong>{pitch.zoneLabel}</strong>
                  <span className={`history-badge ${resultClass(pitch.result)}`}>
                    {getPitchResultLabel(pitch.result)}
                  </span>
                </div>
                <div className="history-bottom">
                  <span>{getPitchTypeLabel(pitch.pitchType)}</span>
                  <span className="hand-badge">{getBatterHandLabel(pitch.batterHand)}</span>
                  <span className="hand-badge">{getPitcherArmLabel(pitch.pitcherArm)}</span>
                  <span className="history-count">
                    {pitch.countBefore.balls}-{pitch.countBefore.strikes}
                  </span>
                  <span>{formatTime(pitch.timestamp)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
