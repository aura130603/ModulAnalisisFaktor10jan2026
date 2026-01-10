@echo off
echo ========================================
echo    Statify K6 Load Testing Dashboard
echo ========================================
echo.

REM Check if k6 is installed
k6 version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ K6 is not installed or not in PATH
    echo Please install K6 from: https://k6.io/docs/getting-started/installation/
    pause
    exit /b 1
)

echo ✅ K6 detected
echo.

REM Create dashboard directory if it doesn't exist
if not exist "dashboard" mkdir dashboard

echo 🚀 Starting comprehensive load testing...
echo.
echo This will run:
echo   - Backend SAV API tests
echo   - Frontend basic load tests  
echo   - Frontend routes tests
echo   - Spike testing
echo   - Stress testing
echo.
echo ⏱️  Estimated duration: ~12 minutes
echo.

REM Run the comprehensive test
k6 run --out json=dashboard/raw-metrics.json run-comprehensive-tests.js

if %errorlevel% neq 0 (
    echo ❌ Load testing failed
    pause
    exit /b 1
)

echo.
echo ✅ Load testing completed successfully!
echo.
echo 📊 Results generated:
echo   - dashboard/test-results.html (HTML Report)
echo   - dashboard/metrics-summary.json (Summary for Dashboard)
echo   - dashboard/detailed-metrics.json (Detailed Metrics)
echo   - dashboard/metrics-export.csv (CSV Export)
echo   - dashboard/raw-metrics.json (Raw K6 Output)
echo.

REM Open dashboard in default browser
echo 🌐 Opening dashboard in browser...
start "" "dashboard\index.html"

echo.
echo 🎉 Dashboard is now running!
echo.
echo You can also manually open: dashboard\index.html
echo.
pause