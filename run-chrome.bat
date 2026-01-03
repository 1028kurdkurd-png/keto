@echo off
cd /d "%~dp0"
echo Starting Mazin Menu App...
echo.
echo Server starting on http://localhost:3000
timeout /t 3
start chrome http://localhost:3000
node node_modules\vite\bin\vite.js
