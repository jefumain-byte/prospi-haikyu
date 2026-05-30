@echo off
cd /d "%~dp0"
title Setup .env

echo ================================
echo   Create .env from template
echo ================================
echo.

if exist ".env" (
  echo .env already exists.
  set /p OVERWRITE=Overwrite? (y/N): 
  if /i not "%OVERWRITE%"=="y" (
    echo Cancelled.
    pause
    exit /b 0
  )
)

copy /Y ".env.example" ".env" >nul
if errorlevel 1 (
  echo [ERROR] Failed to copy .env.example
  pause
  exit /b 1
)

echo Created .env
echo.
echo Next steps:
echo   1. Edit .env and fill in your Supabase URL, keys, login ID/password
echo   2. For Vercel: Settings ^> Environment Variables ^> Import .env
echo   3. Or run import-env-vercel.bat (requires Vercel CLI)
echo.

notepad ".env"
pause
