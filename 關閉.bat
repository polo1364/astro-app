@echo off
chcp 65001 >nul
title Astro Observatory - Stop
setlocal

set "FRONTEND_PORT=9527"
set "BACKEND_PORT=9528"

echo Stopping Astro Observatory...
echo.
call :killport %FRONTEND_PORT% Frontend
call :killport %BACKEND_PORT%  Backend
echo.
echo Done.
timeout /t 2 >nul
endlocal
exit /b

:killport
set "PORT=%~1"
set "LABEL=%~2"
set "FOUND="
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":%PORT% " ^| findstr LISTENING') do (
    echo   Killing %LABEL% ^(port %PORT%, PID %%p^)
    taskkill /F /T /PID %%p >nul 2>&1
    set "FOUND=1"
)
if not defined FOUND echo   %LABEL% ^(port %PORT%^) - nothing running
exit /b
