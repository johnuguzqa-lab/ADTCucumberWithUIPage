@echo off
rem Start the Vegetable Counter app server on Windows boot.
rem This is launched by the scheduled task "VegetableCounterApp".
rem It is intentionally idempotent: if the server is already running on
rem port 8080, it does nothing instead of starting a duplicate.

set "APP_DIR=C:\Users\elifu\AI Agentic1"
set "LOG=%APP_DIR%\app-autostart.log"

rem If port 8080 is already listening, we're done.
netstat -ano | findstr /R /C:":8080 .*LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo %date% %time% - Already running, skipping. >> "%LOG%"
    exit /b 0
)

start "" /B "%ProgramFiles%\nodejs\node.exe" "%APP_DIR%\app\server.js" >> "%LOG%" 2>&1
echo %date% %time% - Started Vegetable Counter app. >> "%LOG%"
