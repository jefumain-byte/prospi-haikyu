@echo off
cd /d "%~dp0"
title Prospi Haikyu

echo ================================
echo   Prospi Pitch Record - Start
echo ================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js is not installed.
  echo Install from https://nodejs.org/
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Installing dependencies...
  call npm.cmd install
  if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
)

echo Starting server...
echo   PC:     http://localhost:5173/
echo   Phone:  use Network URL shown below
echo   Stop:   Ctrl+C in this window
echo.

timeout /t 2 /nobreak >nul
start "" "http://localhost:5173/"

call npm.cmd run dev -- --host

pause
