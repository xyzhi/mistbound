@echo off
chcp 65001 >nul
setlocal EnableExtensions DisableDelayedExpansion

cd /d "%~dp0"
set "logFile=%~dp0git-submit-push.log"
set "commandOutput=%TEMP%\mistbound_git_output_%RANDOM%.txt"
set "statusFile=%TEMP%\mistbound_git_status_%RANDOM%.txt"

>> "%logFile%" echo.
>> "%logFile%" echo ============================================================
call :log "Script started"
call :log "Script path: %~f0"
call :log "Working directory: %CD%"

echo.
echo === Mistbound Commit and Push ===
echo Log file: %logFile%
echo.

where git >nul 2>nul
set "checkExit=%errorlevel%"
call :log "Git check exit code: %checkExit%"
if not "%checkExit%"=="0" goto :missing_git

git rev-parse --is-inside-work-tree >nul 2>nul
set "checkExit=%errorlevel%"
call :log "Repository check exit code: %checkExit%"
if not "%checkExit%"=="0" goto :not_repo

git config user.name "xyzhi"
set "configExit=%errorlevel%"
call :log "Set Git user name exit code: %configExit%"
if not "%configExit%"=="0" goto :failed

git config user.email "xxxyyyzzzhi@163.com"
set "configExit=%errorlevel%"
call :log "Set Git email exit code: %configExit%"
if not "%configExit%"=="0" goto :failed

for /f "delims=" %%b in ('git branch --show-current') do set "branch=%%b"
call :log "Current branch: %branch%"
if not defined branch goto :detached

git status --porcelain > "%statusFile%" 2>> "%logFile%"
set "statusExit=%errorlevel%"
if not "%statusExit%"=="0" goto :failed

for %%s in ("%statusFile%") do set "statusSize=%%~zs"
del "%statusFile%" >nul 2>nul

if "%statusSize%"=="0" goto :push_only

echo Changes found. All repository changes will be committed.
echo.
set /p "commitMessage=Commit message (press Enter for default): "
if not defined commitMessage set "commitMessage=chore: update mistbound"

echo.
echo [1/3] Staging all changes...
call :run_git git add -A
if errorlevel 1 goto :failed

echo [2/3] Creating commit...
call :run_commit
if errorlevel 1 goto :failed

goto :push

:push_only
echo No new file changes. Commit skipped.
call :log "No new file changes; commit skipped"

:push
echo.
echo [3/3] Pushing branch: %branch%
git rev-parse --abbrev-ref --symbolic-full-name @{u} >> "%logFile%" 2>&1
if errorlevel 1 (
  call :run_git git push -u origin "%branch%"
) else (
  call :run_git git push
)
if errorlevel 1 goto :failed

echo.
echo Done. Commit and push completed successfully.
call :log "Operation completed successfully"
call :show_status
call :wait_close
exit /b 0

:missing_git
echo Git was not found. Install Git or check PATH.
call :log "Failure: Git was not found"
call :wait_close
exit /b 1

:not_repo
echo This directory is not a Git repository.
call :log "Failure: directory is not a Git repository"
call :wait_close
exit /b 1

:detached
echo No normal branch is checked out. Switch to main or another branch first.
call :log "Failure: detached HEAD or branch name unavailable"
call :wait_close
exit /b 1

:failed
set "failedExit=%errorlevel%"
echo.
echo Operation failed. See the output above and the log file.
call :log "Operation failed; previous exit code: %failedExit%"
call :show_status
call :wait_close
exit /b 1

:show_status
echo.
echo === Current Git Status ===
echo Branch: %branch%
echo Latest commit:
git log -1 --oneline 2>nul
echo.
git status -sb
>> "%logFile%" echo.
>> "%logFile%" echo === Final Git Status ===
git log -1 --oneline >> "%logFile%" 2>&1
git status -sb >> "%logFile%" 2>&1
exit /b 0

:wait_close
echo.
choice /c Q /n /m "Press Q to close this window..."
set "choiceExit=%errorlevel%"
call :log "Close prompt exit code: %choiceExit%"
if not "%choiceExit%"=="1" (
  echo Close prompt failed. Type exit to close this window.
  call :log "Close prompt failed; entering cmd /k"
  cmd /k
)
exit /b 0

:run_git
call :log "Command: %*"
%* > "%commandOutput%" 2>&1
set "commandExit=%errorlevel%"
type "%commandOutput%"
type "%commandOutput%" >> "%logFile%"
call :log "Command exit code: %commandExit%"
del "%commandOutput%" >nul 2>nul
exit /b %commandExit%

:run_commit
call :log "Command: git commit"
git commit -m "%commitMessage%" > "%commandOutput%" 2>&1
set "commandExit=%errorlevel%"
type "%commandOutput%"
type "%commandOutput%" >> "%logFile%"
call :log "Command exit code: %commandExit%"
del "%commandOutput%" >nul 2>nul
exit /b %commandExit%

:log
>> "%logFile%" echo [%date% %time%] %~1
exit /b 0
