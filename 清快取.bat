@echo off
chcp 65001 >nul
title Astro Observatory - Clean cache
setlocal

set "ROOT=%~dp0"
set "FRONTEND_PORT=9527"
set "NEXT_DIR=%ROOT%frontend\.next"

echo Cleaning Next.js build cache...
echo   Target: %NEXT_DIR%
echo.

REM stop the frontend dev server first so the cache files are not locked
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":%FRONTEND_PORT% " ^| findstr LISTENING') do (
    echo   Stopping frontend ^(PID %%p^) to release file locks...
    taskkill /F /T /PID %%p >nul 2>&1
)

if not exist "%NEXT_DIR%" (
    echo   .next not found - nothing to clean.
    goto end
)

rmdir /s /q "%NEXT_DIR%"

if exist "%NEXT_DIR%" (
    echo   [WARN] Could not fully remove .next. Make sure the app is closed, then run again.
) else (
    echo   Done. .next cache removed.
)

:end
echo.
echo (It will be rebuilt automatically next time you run 啟動.vbs.)
echo.
timeout /t 4 >nul
endlocal
