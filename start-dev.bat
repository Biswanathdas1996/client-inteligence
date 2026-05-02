@echo off
setlocal ENABLEEXTENSIONS
cd /d "%~dp0"

REM Extend PATH for Explorer double-click (often missing fnm/nvm/vs tools that your terminal has)
set "PATH=%ProgramFiles%\nodejs;%ProgramFiles(x86)%\nodejs;%USERPROFILE%\AppData\Roaming\npm;%LOCALAPPDATA%\fnm_multishells;%PATH%"

REM ASCII only in REM lines (cmd encoding issues on some systems).
title Client Intelligence - dev stack

where pnpm.cmd >nul 2>nul
if errorlevel 1 where pnpm >nul 2>nul
if errorlevel 1 goto :NO_PNPM

echo Stopping leftover listeners on 3000 ^(API^), 5173 ^(Vite^), 4173 ^(preview optional^)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0free-dev-ports.ps1"
timeout /t 1 /nobreak >nul 2>nul

echo Starting API port 3000 + Pitch Intel Vite...
echo Repo: %CD%
echo.

call pnpm run dev:pitch

echo.
echo Process exited with code %ERRORLEVEL%.
pause
exit /b %ERRORLEVEL%

:NO_PNPM
echo ERROR: pnpm not found in PATH for this CMD window.
echo Install Node.js, then enable pnpm: https://pnpm.io/installation
echo If pnpm works in PowerShell only, ensure Node and npm-global bin dirs are on the system PATH.
pause
exit /b 1
