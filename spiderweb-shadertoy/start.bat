@echo off
rem 可选:通过本地 HTTP 服务打开(其实直接双击 index.html 也能运行)
cd /d "%~dp0"
start "" "http://localhost:8767/index.html"
python -m http.server 8767
