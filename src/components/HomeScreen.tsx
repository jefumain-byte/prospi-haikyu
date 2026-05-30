interface HomeScreenProps {
  onBrowse: () => void
  onRecord: () => void
}

export function HomeScreen({ onBrowse, onRecord }: HomeScreenProps) {
  return (
    <div className="home-screen">
      <header className="home-hero panel-card">
        <p className="app-kicker">eBASEBALL プロスピA</p>
        <h1>配球記録</h1>
        <p className="home-lead">試合の配球を記録したり、保存済みの記録を閲覧できます</p>
      </header>

      <div className="home-actions">
        <button type="button" className="home-action-card browse-card" onClick={onBrowse}>
          <span className="home-action-icon">📁</span>
          <span className="home-action-title">記録を閲覧</span>
          <span className="home-action-desc">試合を選んで、各バッターの配球記録を見る</span>
        </button>

        <button type="button" className="home-action-card record-card" onClick={onRecord}>
          <span className="home-action-icon">◎</span>
          <span className="home-action-title">記録する</span>
          <span className="home-action-desc">新しい試合を始めて配球を記録する</span>
        </button>
      </div>
    </div>
  )
}
