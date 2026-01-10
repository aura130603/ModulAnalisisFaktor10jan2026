# Statify K6 Load Testing Dashboard Runner
# PowerShell script untuk menjalankan comprehensive load testing

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    Statify K6 Load Testing Dashboard" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function untuk check apakah command tersedia
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check if k6 is installed
if (-not (Test-Command "k6")) {
    Write-Host "❌ K6 is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install K6 from: https://k6.io/docs/getting-started/installation/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ K6 detected" -ForegroundColor Green
Write-Host ""

# Create dashboard directory if it doesn't exist
if (-not (Test-Path "dashboard")) {
    New-Item -ItemType Directory -Path "dashboard" | Out-Null
    Write-Host "📁 Created dashboard directory" -ForegroundColor Blue
}

Write-Host "🚀 Starting comprehensive load testing..." -ForegroundColor Yellow
Write-Host ""
Write-Host "This will run:" -ForegroundColor White
Write-Host "  - Backend SAV API tests" -ForegroundColor Gray
Write-Host "  - Frontend basic load tests" -ForegroundColor Gray
Write-Host "  - Frontend routes tests" -ForegroundColor Gray
Write-Host "  - Spike testing" -ForegroundColor Gray
Write-Host "  - Stress testing" -ForegroundColor Gray
Write-Host ""
Write-Host "⏱️  Estimated duration: ~12 minutes" -ForegroundColor Magenta
Write-Host ""

# Ask for confirmation
$confirmation = Read-Host "Do you want to proceed? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "❌ Test cancelled by user" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🔄 Running K6 load tests..." -ForegroundColor Yellow

# Run the comprehensive test
try {
    $startTime = Get-Date
    
    # Run k6 with multiple outputs
    & k6 run `
        --out json=dashboard/raw-metrics.json `
        --out csv=dashboard/metrics-timeseries.csv `
        run-comprehensive-tests.js
    
    if ($LASTEXITCODE -ne 0) {
        throw "K6 test execution failed with exit code $LASTEXITCODE"
    }
    
    $endTime = Get-Date
    $duration = $endTime - $startTime
    
    Write-Host ""
    Write-Host "✅ Load testing completed successfully!" -ForegroundColor Green
    Write-Host "⏱️  Actual duration: $($duration.ToString('mm\:ss'))" -ForegroundColor Blue
    
} catch {
    Write-Host ""
    Write-Host "❌ Load testing failed: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "📊 Results generated:" -ForegroundColor Green
Write-Host "  - dashboard/test-results.html (HTML Report)" -ForegroundColor Gray
Write-Host "  - dashboard/metrics-summary.json (Summary for Dashboard)" -ForegroundColor Gray
Write-Host "  - dashboard/detailed-metrics.json (Detailed Metrics)" -ForegroundColor Gray
Write-Host "  - dashboard/metrics-export.csv (CSV Export)" -ForegroundColor Gray
Write-Host "  - dashboard/raw-metrics.json (Raw K6 Output)" -ForegroundColor Gray
Write-Host "  - dashboard/metrics-timeseries.csv (Time Series Data)" -ForegroundColor Gray
Write-Host ""

# Check if files were created
$expectedFiles = @(
    "dashboard/metrics-summary.json",
    "dashboard/detailed-metrics.json", 
    "dashboard/raw-metrics.json"
)

$missingFiles = @()
foreach ($file in $expectedFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "⚠️  Warning: Some output files were not created:" -ForegroundColor Yellow
    foreach ($file in $missingFiles) {
        Write-Host "  - $file" -ForegroundColor Red
    }
    Write-Host ""
}

# Generate additional dashboard data if needed
Write-Host "🔧 Preparing dashboard data..." -ForegroundColor Blue

# Create a simple status file for dashboard
$statusData = @{
    lastRun = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    testDuration = $duration.TotalSeconds
    status = "completed"
    filesGenerated = $expectedFiles.Count - $missingFiles.Count
    totalFiles = $expectedFiles.Count
} | ConvertTo-Json

$statusData | Out-File -FilePath "dashboard/test-status.json" -Encoding UTF8

Write-Host "✅ Dashboard data prepared" -ForegroundColor Green
Write-Host ""

# Open dashboard in default browser
Write-Host "🌐 Opening dashboard in browser..." -ForegroundColor Cyan

try {
    $dashboardPath = Resolve-Path "dashboard/index.html"
    Start-Process $dashboardPath
    Write-Host "✅ Dashboard opened successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not auto-open dashboard. Please manually open: dashboard/index.html" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Dashboard is now running!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Dashboard location: $(Resolve-Path 'dashboard/index.html')" -ForegroundColor Blue
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "  - Use the dashboard controls to switch between demo and real data" -ForegroundColor Gray
Write-Host "  - Export data using the Export button for further analysis" -ForegroundColor Gray
Write-Host "  - Re-run this script to update the dashboard with new test data" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to exit"