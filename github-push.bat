@echo off
chcp 65001 >nul
cd /d "%~dp0"

title GitHub へ push

echo ================================
echo   GitHub へ push
echo ================================
echo.

where gh >nul 2>&1
if errorlevel 1 (
  echo [エラー] GitHub CLI ^(gh^) が見つかりません。
  pause
  exit /b 1
)

gh auth status >nul 2>&1
if errorlevel 1 (
  echo GitHub にログインしてください。
  echo ブラウザが開いたら、表示されたコードを入力します。
  echo.
  gh auth login --hostname github.com --git-protocol https --web
  if errorlevel 1 (
    echo [エラー] ログインに失敗しました。
    pause
    exit /b 1
  )
)

echo.
echo GitHub にリポジトリを作成して push します...
echo リポジトリ名: prospi-haikyu
echo.

gh repo create prospi-haikyu --public --source=. --remote=origin --push

if errorlevel 1 (
  echo.
  echo リポジトリが既にある場合は、次を実行してください:
  echo   git remote add origin https://github.com/あなたのユーザー名/prospi-haikyu.git
  echo   git push -u origin main
  pause
  exit /b 1
)

echo.
echo 完了しました！
echo Vercel でこのリポジトリを Import してください。
echo.
pause
