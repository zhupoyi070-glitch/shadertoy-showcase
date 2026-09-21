@echo off
chcp 65001 >nul
title 根须生物 - 本地服务器 8097
cd /d "%~dp0"

rem 先清理端口上可能残留的旧进程（防止多个服务器冲突）
for /f "tokens=5" %%p in ('netstat -ano ^| findstr "8097.*LISTENING"') do taskkill /PID %%p /F >nul 2>&1

echo ============================================
echo   本地服务器运行中: http://127.0.0.1:8097
echo   请保持本窗口开启，关闭窗口即停止服务
echo ============================================

"C:\Users\Cloudy\AppData\Local\Programs\Python\Python312\python.exe" -m http.server 8097 --bind 127.0.0.1
pause
