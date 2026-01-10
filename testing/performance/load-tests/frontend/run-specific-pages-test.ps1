<#
.SYNOPSIS
    PowerShell script untuk menjalankan Statify Specific Pages Load Test

.DESCRIPTION
    Script ini memungkinkan eksekusi load test untuk halaman spesifik Statify
    dengan berbagai konfigurasi dan opsi monitoring yang advanced.

.PARAMETER Duration
    Durasi test (default: 3m)

.PARAMETER VUs
    Jumlah virtual users (default: 20)

.PARAMETER Environment
    Environment target: development, staging, production (default: development)

.PARAMETER LoadProfile
    Load profile: light, medium, heavy (default: medium)

.PARAMETER OutputFormat
    Format output: json, csv, influxdb (default: json)

.PARAMETER Scenario
    Scenario spesifik: dashboard_data, help_page, landing_page, mixed_navigation, all (default: all)

.PARAMETER GenerateReport
    Generate HTML report setelah test selesai

.PARAMETER Verbose
    Enable verbose logging

.EXAMPLE
    .\run-specific-pages-test.ps1
    
.EXAMPLE
    .\run-specific-pages-test.ps1 -Duration "5m" -VUs 50 -Environment "staging"
    
.EXAMPLE
    .\run-specific-pages-test.ps1 -LoadProfile "heavy" -Scenario "dashboard_data" -GenerateReport

.NOTES
    Author: Principal Software Engineer - Statify Team
    Version: 1.0.0
    Requires: k6, PowerShell 5.1+
#>

param(
    [string]$Duration = "3m",
    [int]$VUs = 20,
    [ValidateSet("development", "staging", "production")]
    [string]$Environment = "development",
    [ValidateSet("light", "medium", "heavy")]
    [string]$LoadProfile = "medium",
    [ValidateSet("json", "csv", "influxdb")]
    [string]$OutputFormat = "json",
    [ValidateSet("dashboard_data", "help_page", "landing_page", "mixed_navigation", "all")]
    [string]$Scenario = "all",
    [switch]$GenerateReport,
    [switch]$Verbose
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Function to write colored output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Function to check prerequisites
function Test-Prerequisites {
    Write-ColorOutput "Checking prerequisites..." "Yellow"
    
    # Check if k6 is installed
    try {
        $k6Version = k6 version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✓ k6 is installed: $($k6Version.Split()[1])" "Green"
        } else {
            throw "k6 not found"
        }
    } catch {
        Write-ColorOutput "✗ k6 is not installed or not in PATH" "Red"
        Write-ColorOutput "Please install k6 from https://k6.io/docs/getting-started/installation/" "Yellow"
        exit 1
    }
    
    # Check if test file exists
    $testFile = "specific-pages-load-test.js"
    if (-not (Test-Path $testFile)) {
        Write-ColorOutput "✗ Test file not found: $testFile" "Red"
        exit 1
    }
    Write-ColorOutput "✓ Test file found: $testFile" "Green"
    
    # Check if config file exists
    $configFile = "specific-pages-config.json"
    if (Test-Path $configFile) {
        Write-ColorOutput "✓ Config file found: $configFile" "Green"
    } else {
        Write-ColorOutput "⚠ Config file not found: $configFile (using defaults)" "Yellow"
    }
}

# Function to create results directory
function New-ResultsDirectory {
    $resultsPath = "..\..\..\..\results\performance"
    if (-not (Test-Path $resultsPath)) {
        New-Item -ItemType Directory -Path $resultsPath -Force | Out-Null
        Write-ColorOutput "✓ Created results directory: $resultsPath" "Green"
    }
    return $resultsPath
}

# Function to generate timestamp
function Get-Timestamp {
    return Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
}

# Function to build k6 command
function Build-K6Command {
    param(
        [string]$ResultsPath,
        [string]$Timestamp
    )
    
    $k6Args = @()
    $k6Args += "run"
    
    # Add output format
    if ($OutputFormat -ne "none") {
        $outputFile = Join-Path $ResultsPath "specific-pages-test_$Timestamp.$OutputFormat"
        $k6Args += "--out"
        $k6Args += "$OutputFormat=$outputFile"
    }
    
    # Add VUs and duration
    $k6Args += "--vus"
    $k6Args += $VUs.ToString()
    $k6Args += "--duration"
    $k6Args += $Duration
    
    # Add environment variables
    $k6Args += "--env"
    $k6Args += "TEST_ENV=$Environment"
    $k6Args += "--env"
    $k6Args += "LOAD_PROFILE=$LoadProfile"
    
    if ($Scenario -ne "all") {
        $k6Args += "--env"
        $k6Args += "SCENARIO=$Scenario"
    }
    
    # Add summary options
    $k6Args += "--summary-trend-stats"
    $k6Args += "avg,min,med,max,p(90),p(95),p(99)"
    
    # Add verbose if requested
    if ($Verbose) {
        $k6Args += "--verbose"
    }
    
    # Add test file
    $k6Args += "specific-pages-load-test.js"
    
    return $k6Args
}

# Function to generate HTML report
function New-HtmlReport {
    param(
        [string]$ResultsPath,
        [string]$Timestamp
    )
    
    $jsonFile = Join-Path $ResultsPath "specific-pages-test_$Timestamp.json"
    if (Test-Path $jsonFile) {
        Write-ColorOutput "Generating HTML report..." "Yellow"
        
        $htmlFile = Join-Path $ResultsPath "specific-pages-test_$Timestamp.html"
        
        # Simple HTML report generation (you can enhance this)
        $htmlContent = @"
<!DOCTYPE html>
<html>
<head>
    <title>Statify Load Test Report - $Timestamp</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
        .metrics { margin: 20px 0; }
        .metric { background-color: #f9f9f9; padding: 10px; margin: 5px 0; border-left: 4px solid #007acc; }
        .success { border-left-color: #28a745; }
        .warning { border-left-color: #ffc107; }
        .error { border-left-color: #dc3545; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Statify Specific Pages Load Test Report</h1>
        <p><strong>Timestamp:</strong> $Timestamp</p>
        <p><strong>Environment:</strong> $Environment</p>
        <p><strong>Load Profile:</strong> $LoadProfile</p>
        <p><strong>Duration:</strong> $Duration</p>
        <p><strong>Virtual Users:</strong> $VUs</p>
        <p><strong>Scenario:</strong> $Scenario</p>
    </div>
    
    <div class="metrics">
        <h2>Test Results</h2>
        <div class="metric success">
            <h3>✓ Test Completed Successfully</h3>
            <p>Detailed metrics are available in the JSON file: <code>$jsonFile</code></p>
        </div>
        
        <div class="metric">
            <h3>Pages Tested</h3>
            <ul>
                <li>Dashboard Data Page (/dashboard/data)</li>
                <li>Help Page (/help)</li>
                <li>Landing Page (/landing)</li>
                <li>Mixed Navigation Flow</li>
            </ul>
        </div>
        
        <div class="metric">
            <h3>Key Metrics Monitored</h3>
            <ul>
                <li>Page Load Time</li>
                <li>Error Rate</li>
                <li>Success Rate</li>
                <li>Connection Time</li>
                <li>Time to First Byte (TTFB)</li>
                <li>User Journey Time</li>
                <li>Navigation Speed</li>
            </ul>
        </div>
    </div>
    
    <div class="footer">
        <p><em>Generated by Statify Load Test Suite</em></p>
    </div>
</body>
</html>
"@
        
        $htmlContent | Out-File -FilePath $htmlFile -Encoding UTF8
        Write-ColorOutput "✓ HTML report generated: $htmlFile" "Green"
    } else {
        Write-ColorOutput "⚠ JSON file not found, skipping HTML report generation" "Yellow"
    }
}

# Main execution
try {
    Write-ColorOutput "========================================" "Cyan"
    Write-ColorOutput "Statify - Specific Pages Load Test" "Cyan"
    Write-ColorOutput "========================================" "Cyan"
    Write-ColorOutput ""
    
    # Check prerequisites
    Test-Prerequisites
    Write-ColorOutput ""
    
    # Create results directory
    $resultsPath = New-ResultsDirectory
    $timestamp = Get-Timestamp
    
    # Display configuration
    Write-ColorOutput "Test Configuration:" "Yellow"
    Write-ColorOutput "- Duration: $Duration" "White"
    Write-ColorOutput "- Virtual Users: $VUs" "White"
    Write-ColorOutput "- Environment: $Environment" "White"
    Write-ColorOutput "- Load Profile: $LoadProfile" "White"
    Write-ColorOutput "- Output Format: $OutputFormat" "White"
    Write-ColorOutput "- Scenario: $Scenario" "White"
    Write-ColorOutput "- Generate Report: $GenerateReport" "White"
    Write-ColorOutput ""
    
    # Build and execute k6 command
    $k6Args = Build-K6Command -ResultsPath $resultsPath -Timestamp $timestamp
    
    Write-ColorOutput "Executing k6 load test..." "Yellow"
    Write-ColorOutput "Command: k6 $($k6Args -join ' ')" "Gray"
    Write-ColorOutput ""
    
    # Execute k6
    & k6 @k6Args
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput ""
        Write-ColorOutput "========================================" "Green"
        Write-ColorOutput "Load test completed successfully!" "Green"
        Write-ColorOutput "========================================" "Green"
        
        if ($OutputFormat -ne "none") {
            $outputFile = Join-Path $resultsPath "specific-pages-test_$timestamp.$OutputFormat"
            Write-ColorOutput "Results saved to: $outputFile" "Green"
        }
        
        # Generate HTML report if requested
        if ($GenerateReport) {
            New-HtmlReport -ResultsPath $resultsPath -Timestamp $timestamp
        }
        
        Write-ColorOutput ""
        Write-ColorOutput "Test Summary:" "Yellow"
        Write-ColorOutput "- Pages tested: dashboard/data, help, landing" "White"
        Write-ColorOutput "- Test duration: $Duration" "White"
        Write-ColorOutput "- Virtual users: $VUs" "White"
        Write-ColorOutput "- Environment: $Environment" "White"
        Write-ColorOutput "- Load profile: $LoadProfile" "White"
        
    } else {
        Write-ColorOutput ""
        Write-ColorOutput "========================================" "Red"
        Write-ColorOutput "Load test failed with error code: $LASTEXITCODE" "Red"
        Write-ColorOutput "========================================" "Red"
        Write-ColorOutput ""
        Write-ColorOutput "Please check:" "Yellow"
        Write-ColorOutput "- Network connectivity to target URLs" "White"
        Write-ColorOutput "- Test configuration parameters" "White"
        Write-ColorOutput "- Server availability and capacity" "White"
        exit $LASTEXITCODE
    }
    
} catch {
    Write-ColorOutput ""
    Write-ColorOutput "========================================" "Red"
    Write-ColorOutput "Error occurred: $($_.Exception.Message)" "Red"
    Write-ColorOutput "========================================" "Red"
    exit 1
}

Write-ColorOutput ""
Write-ColorOutput "Press any key to continue..." "Gray"
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")