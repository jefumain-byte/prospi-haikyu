@echo off
cd /d "%~dp0"
title Import .env to Vercel

echo ================================
echo   Import .env to Vercel
echo ================================
echo.

if not exist ".env" (
  echo [ERROR] .env not found.
  echo Run setup-env.bat first.
  pause
  exit /b 1
)

where vercel >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Vercel CLI not found.
  echo Install: npm install -g vercel
  echo.
  echo Or import manually in Vercel dashboard:
  echo   Settings ^> Environment Variables ^> Import .env
  pause
  exit /b 1
)

echo Linking project if needed...
vercel link --yes 2>nul

echo.
echo Importing variables from .env to Production...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\import-env-vercel.ps1"
if errorlevel 1 (
  echo.
  echo [ERROR] Import failed.
  echo Try manual import: Vercel ^> Settings ^> Environment Variables ^> Import .env
  pause
  exit /b 1
)

echo.
echo Done. Redeploy on Vercel to apply changes.
echo   Deployments ^> ... ^> Redeploy
echo.
pause
