@echo off
title Pulse Plan Launcher
cd /d "C:\Users\godha\.claude\pulse-plan"

REM Already running on port 3000? Just open the browser.
netstat -ano | findstr /C:":3000 " | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 goto openbrowser

REM Start dev server in its own console window so user can see logs / kill it.
start "Pulse Plan Server" cmd /k "npm run dev"

REM Wait until server is listening on 3000 (max ~30s)
echo Starting Pulse Plan server...
set /a tries=0
:waitloop
timeout /t 1 /nobreak >nul
netstat -ano | findstr /C:":3000 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 goto openbrowser
set /a tries+=1
if %tries% GEQ 30 (
    echo Server did not start in 30 seconds. Check the server window.
    pause
    exit /b 1
)
goto waitloop

:openbrowser
timeout /t 1 /nobreak >nul
start "" http://localhost:3000
exit
