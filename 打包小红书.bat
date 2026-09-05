@echo off
setlocal

cd /d "%~dp0"

echo [1/4] Building XHS package...
call npm run build
if errorlevel 1 goto :failed

echo [2/4] Auditing build output...
node ".codex\scripts\audit_artifact.mjs" "dist"
if errorlevel 1 goto :failed

echo [3/4] Creating ZIP...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "scripts\package-xhs.ps1" -Source "dist" -Output "mistbound-1.0.1.zip"
if errorlevel 1 goto :failed

echo [4/4] Auditing ZIP...
node ".codex\scripts\audit_artifact.mjs" "mistbound-1.0.1.zip"
if errorlevel 1 goto :failed

echo.
echo Done: mistbound-1.0.1.zip
pause
exit /b 0

:failed
echo.
echo Packaging failed. Check the error above.
pause
exit /b 1
