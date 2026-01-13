@echo off
setlocal

rem === Configuration ===
rem Project Root Directory
set "PROJECT_DIR=%~dp0..\src"
rem Log Directory
set "LOG_DIR=%~dp0..\audit_logs"

rem === Execution ===
cd /d "%PROJECT_DIR%"

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

echo [INFO] Running npm audit...
call npm audit --json > audit_result_temp.json

rem npm audit returns non-zero if vulnerabilities are found
if %errorlevel% neq 0 (
    echo [WARN] Vulnerabilities found! Saving log...
    
    rem Generate Timestamp (YYYY-MM-DD_HH-MM-SS)
    for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
    set "TIMESTAMP=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%_%datetime:~8,2%-%datetime:~10,2%-%datetime:~12,2%"
    
    copy audit_result_temp.json "%LOG_DIR%\audit_%TIMESTAMP%.json"
    echo [INFO] Log saved to %LOG_DIR%\audit_%TIMESTAMP%.json
) else (
    echo [INFO] No vulnerabilities found.
)

if exist audit_result_temp.json del audit_result_temp.json

endlocal
