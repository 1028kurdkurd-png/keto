@echo off
cls
echo Building Mazin App with Optimizations...
echo.
cd /d D:\menu
node node_modules\vite\bin\vite.js build
echo.
echo ============================================
echo Checking bundle sizes...
echo ============================================
dir dist\assets\*.js /S
echo.
echo ============================================
echo Build Complete!
echo ============================================
pause
