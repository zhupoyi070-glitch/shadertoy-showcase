@echo off
setlocal
rem Restore all files from a snapshot:  restore.bat snapshot-YYYYMMDD-HHMMSS

if "%~1"=="" (
    echo Usage: restore.bat ^<snapshot-folder-name^>
    echo.
    echo Available snapshots:
    dir /B versions 2>nul
    echo.
    echo Example:  restore.bat snapshot-20260917-153000
    pause
    exit /b
)

set SRC=versions\%~1
if not exist "%SRC%\*.html" (
    echo [ERROR] Snapshot not found or empty: %SRC%
    pause
    exit /b
)

copy /Y "%SRC%\*.html" . >nul
copy /Y "%SRC%\*.frag" . >nul
copy /Y "%SRC%\*.json" . >nul
copy /Y "%SRC%\*.md" . >nul

echo [OK] Restored from: %SRC%
echo NOTE: press F5 in the browser to see the restored version.
pause
