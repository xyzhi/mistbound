@echo off
chcp 65001 >nul
setlocal

cd /d "%~dp0.."

if not exist "Configs" mkdir "Configs"

node "scripts\export-configs.mjs"
if errorlevel 2 (
  echo.
  echo Export completed partially. Close the occupied Excel file and run again.
  pause
  exit /b 2
)
if errorlevel 1 (
  echo.
  echo Export failed. Please check Node.js, project path, and whether Excel files are open.
  pause
  exit /b 1
)

echo.
echo Generated: %cd%\Configs\Skills.xls
echo Generated: %cd%\Configs\SideStories.xls
pause
