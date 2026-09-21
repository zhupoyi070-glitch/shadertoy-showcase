@echo off
setlocal
rem Create a timestamped snapshot of all page/shader files into versions\

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set TS=%%i
set DEST=versions\snapshot-%TS%
mkdir "%DEST%" 2>nul

copy /Y *.html "%DEST%\" >nul
copy /Y *.frag "%DEST%\" >nul
copy /Y *.json "%DEST%\" >nul
copy /Y *.md "%DEST%\" >nul

echo [OK] Snapshot saved to: %DEST%
echo Files:
dir /B "%DEST%"
echo.
echo To restore later:  double-click restore.bat  and follow the hint.
pause
