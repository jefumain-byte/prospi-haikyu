@echo off
chcp 65001 >nul
cd /d "%~dp0"

title プロスピ配球記録

echo ================================
echo   プロスピ配球記録 - 起動
echo ================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [エラー] Node.js が見つかりません。
  echo https://nodejs.org/ から Node.js をインストールしてください。
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo 初回起動のため、必要なファイルをインストールしています...
  echo.
  call npm.cmd install
  if errorlevel 1 (
    echo.
    echo [エラー] インストールに失敗しました。
    pause
    exit /b 1
  )
  echo.
)

echo サーバーを起動します...
echo   PC:     http://localhost:5173/
echo   スマホ: 同じ Wi-Fi 内の Network 表示 URL
echo.
echo 終了する場合は、このウィンドウで Ctrl+C を押してください。
echo.

timeout /t 2 /nobreak >nul
start "" "http://localhost:5173/"

call npm.cmd run dev -- --host

echo.
pause
