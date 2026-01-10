@echo off
REM Batch script untuk menjalankan specific pages load test di Windows
REM Author: Principal Software Engineer - Statify Team

echo ========================================
echo Statify - Specific Pages Load Test
echo ========================================
echo.

REM Set default values
set DURATION=3m
set VUS=20
set OUTPUT_FORMAT=json
set TEST_ENV=development

REM Parse command line arguments
:parse
if "%~1"=="" goto :run
if "%~1"=="--help" goto :help
if "%~1"=="-h" goto :help
if "%~1"=="--duration" (
    set DURATION=%~2
    shift
    shift
    goto :parse
)
if "%~1"=="--vus" (
    set VUS=%~2
    shift
    shift
    goto :parse
)
if "%~1"=="--env" (
    set TEST_ENV=%~2
    shift
    shift
    goto :parse
)
if "%~1"=="--output" (
    set OUTPUT_FORMAT=%~2
    shift
    shift
    goto :parse
)
shift
goto :parse

:help
echo Usage: run-specific-pages-test.bat [options]
echo.
echo Options:
echo   --duration DURATION    Test duration (default: 3m)
echo   --vus VUS              Number of virtual users (default: 20)
echo   --env ENV              Test environment (default: development)
echo   --output FORMAT        Output format: json, csv, influxdb (default: json)
echo   --help, -h             Show this help message
echo.
echo Examples:
echo   run-specific-pages-test.bat
echo   run-specific-pages-test.bat --duration 5m --vus 50
echo   run-specific-pages-test.bat --env production --output csv
echo.
echo Test Scenarios:
echo   - Dashboard Data Page Load Test
echo   - Help Page Load Test  
echo   - Landing Page Load Test
echo   - Mixed Navigation Test
echo.
goto :end

:run
echo Starting load test with following configuration:
echo - Duration: %DURATION%
echo - Virtual Users: %VUS%
echo - Environment: %TEST_ENV%
echo - Output Format: %OUTPUT_FORMAT%
echo.

REM Create results directory if it doesn't exist
if not exist "..\..\..\..\results" mkdir "..\..\..\..\results"
if not exist "..\..\..\..\results\performance" mkdir "..\..\..\..\results\performance"

REM Generate timestamp for result file
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%-%MM%-%DD%_%HH%-%Min%-%Sec%"

REM Set output file based on format
if "%OUTPUT_FORMAT%"=="json" (
    set "OUTPUT_FILE=..\..\..\..\results\performance\specific-pages-test_%timestamp%.json"
    set "K6_OUTPUT=--out json=%OUTPUT_FILE%"
) else if "%OUTPUT_FORMAT%"=="csv" (
    set "OUTPUT_FILE=..\..\..\..\results\performance\specific-pages-test_%timestamp%.csv"
    set "K6_OUTPUT=--out csv=%OUTPUT_FILE%"
) else (
    set "K6_OUTPUT="
)

REM Run the load test
echo Running k6 load test...
echo.

k6 run %K6_OUTPUT% ^--vus %VUS% ^--duration %DURATION% ^--env TEST_ENV=%TEST_ENV% ^--summary-trend-stats="avg,min,med,max,p(90),p(95),p(99)" specific-pages-load-test.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Load test completed successfully!
    echo ========================================
    if defined OUTPUT_FILE (
        echo Results saved to: %OUTPUT_FILE%
    )
    echo.
    echo Test Summary:
    echo - Pages tested: dashboard/data, help, landing
    echo - Test duration: %DURATION%
    echo - Virtual users: %VUS%
    echo - Environment: %TEST_ENV%
    echo.
) else (
    echo.
    echo ========================================
    echo Load test failed with error code: %ERRORLEVEL%
    echo ========================================
    echo.
    echo Please check:
    echo - k6 is installed and in PATH
    echo - Network connectivity to target URLs
    echo - Test configuration parameters
    echo.
)

:end
pause