# プロスピ配球記録

eBASEBALL プロスピA（プロスピ）の対戦で、相手投手の**配球位置**と**結果**を記録・分析するWebアプリです。

## 機能

- **配球記録**: 5×5のゾーン（捕手視点）をタップして位置を選択
- **球種・結果**: ストレート、スライダー、見逃し、空振り、ヒットなどを記録
- **カウント管理**: ボール・ストライク・アウトを自動更新（手動調整も可）
- **履歴**: 記録した投球の一覧表示、1球取り消し
- **分析**: 配球ヒートマップ、球種・結果の内訳
- **データ保存**: ブラウザの LocalStorage に自動保存

## 使い方

1. 相手投手名を入力
2. 「記録」タブで配球位置をタップ
3. 球種と結果を選んで「記録する」
4. 「履歴」「分析」タブで振り返り

## 起動方法

```bash
npm install
npm run dev
```

ブラウザで表示された URL（通常 `http://localhost:5173`）を開いてください。

スマホから使う場合は、PC と同じ Wi-Fi 上で `npm run dev -- --host` を実行し、表示された IP アドレスにアクセスしてください。

## ビルド

```bash
npm run build
npm run preview
```

## Vercel + GitHub で公開する

このアプリは静的サイトなので、Vercel へのデプロイにサーバーは不要です。データは各端末の LocalStorage に保存されます。

### 1. GitHub にコードを上げる

PC に [Git](https://git-scm.com/download/win) をインストールし、GitHub で空のリポジトリ（例: `prospi-haikyu`）を作成します。

プロジェクトフォルダで次を実行します。

```bash
git init
git add .
git commit -m "Initial commit: プロスピ配球記録アプリ"
git branch -M main
git remote add origin https://github.com/あなたのユーザー名/prospi-haikyu.git
git push -u origin main
```

### 2. Vercel と連携する

1. [https://vercel.com/](https://vercel.com/) にアクセスし、GitHub アカウントでサインアップ
2. **Add New… → Project**
3. 先ほどの GitHub リポジトリを **Import**
4. 設定はそのままで OK（Vite を自動検出）
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. **Deploy** をクリック

1〜2分で `https://プロジェクト名.vercel.app` の URL が発行されます。

### 3. 更新を反映する

コードを変更したら、GitHub に push するだけで Vercel が自動で再デプロイします。

```bash
git add .
git commit -m "更新内容の説明"
git push
```

### 補足

- スマホでは公開 URL をホーム画面に追加するとアプリのように使えます
- 無料プランで HTTPS 対応済み
- `vercel.json` にビルド設定を記載済みです
