@echo off
cd /d "%~dp0"
title GitHub Push

echo ================================
echo   GitHub Push - prospi-haikyu
echo ================================
echo.

where git >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Git is not installed.
  echo Install from https://git-scm.com/download/win
  pause
  exit /b 1
)

where gh >nul 2>&1
if errorlevel 1 (
  echo [ERROR] GitHub CLI ^(gh^) is not installed.
  echo Install from https://cli.github.com/
  pause
  exit /b 1
)

gh auth status >nul 2>&1
if errorlevel 1 (
  echo Login to GitHub in your browser...
  gh auth login --hostname github.com --git-protocol https --web
  if errorlevel 1 (
    echo [ERROR] Login failed.
    pause
    exit /b 1
  )
)

set GIT_AUTHOR_NAME=jefumain-byte
set GIT_COMMITTER_NAME=jefumain-byte
set GIT_AUTHOR_EMAIL=jefumain-byte@users.noreply.github.com
set GIT_COMMITTER_EMAIL=jefumain-byte@users.noreply.github.com

echo Adding files...
git add .

echo Committing...
git commit -m "Update app with cloud sync and login"
if errorlevel 1 (
  echo No new changes to commit, or commit failed.
)

echo Pushing to origin main...
git push origin main
if errorlevel 1 (
  echo.
  echo [ERROR] Push failed.
  echo Try: git push -u origin main
  pause
  exit /b 1
)

echo.
echo Done! Check Vercel for auto-deploy.
echo.
pause
