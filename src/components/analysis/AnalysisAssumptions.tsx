import { MIN_RATE_SAMPLE } from '../../statsFormat'

export function AnalysisAssumptions() {
  return (
    <details className="analysis-assumptions panel-card">
      <summary className="analysis-assumptions-summary">集計の前提条件</summary>
      <div className="analysis-assumptions-body">
        <section>
          <h3>打撃成績</h3>
          <ul>
            <li>
              <strong>打数</strong> — 打席数から四死球・犠打・犠飛・打撃妨害・走塁妨害を除いた数（打率・長打率の分母）
            </li>
            <li>
              <strong>出塁率</strong> — (安打+四球+死球) ÷ (打数+四球+死球+犠飛)
            </li>
            <li>
              <strong>OPS</strong> — 出塁率 + 長打率
            </li>
          </ul>
        </section>

        <section>
          <h3>投球成績</h3>
          <ul>
            <li>
              <strong>防御率</strong> — 自責点 × 9 ÷ 投球回
            </li>
            <li>
              <strong>自責点</strong> — 公認野球規則9.16準拠（失策・3アウトの機会以降の得点は非自責）
            </li>
            <li>
              <strong>非自責点</strong> — 失点 − 自責点
            </li>
            <li>
              <strong>WHIP</strong> — (被安打+与四球) ÷ 投球回（死球は含まない）
            </li>
            <li>
              <strong>K/9 · BB/9</strong> — 9回換算（与四死球は四球+死球）
            </li>
          </ul>
        </section>

        <section>
          <h3>勝率・対象</h3>
          <ul>
            <li>自分側の記録のみ集計</li>
            <li>勝率は試合終了分のみ（記録中・引き分けは除外）</li>
          </ul>
        </section>

        <section>
          <h3>コース別ヒートマップ</h3>
          <ul>
            <li>打席終了球が記録されたコースで集計</li>
            <li>打数 n≥{MIN_RATE_SAMPLE} のゾーンのみ色付け（未満はグレーアウト・「n=2」等を表示）</li>
            <li>打率・長打率（または被安打率・被長打率）を指標切替で表示</li>
            <li>ストライクゾーン表示は中央9マスのみ（`inZone`）</li>
          </ul>
        </section>

        <section>
          <h3>状況別分析（Phase 2）</h3>
          <ul>
            <li>打席終了球のカウント・走者状況・左右の組み合わせで集計</li>
            <li>カウントはその球の投球前カウント（初球=0-0、2ストライク以降、3-2）</li>
            <li>走者状況はその球の投球前走者（得点圏=二塁または三塁）</li>
            <li>打率・長打率は打数{MIN_RATE_SAMPLE}未満で「---」</li>
          </ul>
        </section>

        <section>
          <h3>球種別分析（配球タブ）</h3>
          <ul>
            <li>使用率は全投球数に対する割合</li>
            <li>打率/被打率は打席終了球ベース（打数{MIN_RATE_SAMPLE}未満は「---」）</li>
            <li>同一球種は大分類の最初のグループのみに計上</li>
          </ul>
        </section>
      </div>
    </details>
  )
}
