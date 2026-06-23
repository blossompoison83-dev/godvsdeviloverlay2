@echo off
title God vs Devil - TikTok Gift Server
color 0A

echo.
echo  ==========================================
echo   GOD VS DEVIL - TikTok Live Gift Server
echo  ==========================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
  echo  ERROR: Node.js is not installed!
  echo.
  echo  Please download and install it from:
  echo  https://nodejs.org
  echo.
  echo  Then run this file again.
  pause
  exit
)

echo  Node.js found!
echo.

:: Install packages if needed
if not exist "node_modules" (
  echo  Installing packages for the first time...
  echo  (This only happens once, please wait)
  echo.
  npm install
  echo.
)

:: Reminder to set username
echo  ==========================================
echo   IMPORTANT: Have you set your TikTok
echo   username in server.js?
echo.
echo   Open server.js and change:
echo   YOUR_TIKTOK_USERNAME
echo   to your actual TikTok username
echo  ==========================================
echo.
echo  Starting server...
echo  Overlay will be at: http://localhost:3000
echo  Add that URL as a Browser Source in OBS
echo.
echo  Press CTRL+C to stop the server
echo.

node server.js
pause
