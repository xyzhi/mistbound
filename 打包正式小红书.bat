@echo off
setlocal

cd /d "%~dp0"

set "MISTBOUND_ENABLE_CHEATS=0"
set "PACKAGE_NAME=mistbound-1.0.3-official.zip"

echo [1/5] Building official XHS package without cheats...
call npm run build
if errorlevel 1 goto :failed

echo [2/5] Checking that cheat UI was removed...
findstr /s /m /c:"data-cheat-panel" "dist\assets\*.js" >nul 2>nul
if not errorlevel 1 goto :cheats_found

echo [3/5] Auditing build output...
node ".codex\scripts\audit_artifact.mjs" "dist"
if errorlevel 1 goto :failed

echo [4/5] Creating ZIP...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "scripts\package-xhs.ps1" -Source "dist" -Output "%PACKAGE_NAME%"
if errorlevel 1 goto :failed

echo [5/5] Auditing ZIP...
node ".codex\scripts\audit_artifact.mjs" "%PACKAGE_NAME%"
if errorlevel 1 goto :failed

echo.
echo Done: %PACKAGE_NAME%
pause
exit /b 0

:cheats_found
echo.
echo Packaging failed. Cheat UI is still present in the official build.
pause
exit /b 1

:failed
echo.
echo Packaging failed. Check the error above.
pause
exit /b 1
