@echo off
chcp 65001 > nul
echo ========================================================
echo   RESTORAN TELEGRAM MINI APP VA ADMIN PANEL TIZIMI
echo ========================================================
echo.
echo 1. Backend Server ishga tushirilmoqda...
start "Restoran Backend Server" cmd /k "cd /d "%~dp0backend" && node src/index.js"

echo 2. Foydalanuvchi Telegram Mini App ishga tushirilmoqda...
start "Mini App (Mijoz)" cmd /k "cd /d "%~dp0mini-app" && npm run dev"

echo 3. Restoran Web Admin Panel ishga tushirilmoqda...
start "Web Admin Panel" cmd /k "cd /d "%~dp0admin-panel" && npm run dev"

echo.
echo ========================================================
echo Barcha xizmatlar alohida oynalarda ishga tushdi!
echo.
echo - Backend API:        http://localhost:5000
echo - Telegram Mini App:  http://localhost:5173
echo - Web Admin Panel:    http://localhost:5174
echo.
echo Admin panelga kirish uchun parol: admin123
echo ========================================================
pause
