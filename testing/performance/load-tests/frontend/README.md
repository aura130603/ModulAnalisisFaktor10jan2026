# Frontend Load Tests

This directory contains load tests for the Statify frontend application.

## Test Scripts

1. **basic-load-test.js** - Basic load test that simulates users accessing different pages of the application
2. **spss-operations-test.js** - Test that covers frontend pages related to data and variable management
3. **frontend-routes-test.js** - Targeted test that specifically covers all frontend routes in the application (landing, dashboard, data, variable, result, help pages)
4. **specific-pages-load-test.js** - Focused load test for specific pages: dashboard/data, help, and landing with realistic user behavior simulation

## Running Tests

From the project root directory:

```bash
# Run basic load test
npm run test:load:basic

# Run SPSS operations load test
npm run test:load:operations

# Run frontend routes test
npm run test:load:routes

# Run specific pages load test (NEW)
npm run test:performance:specific-pages

# Run individual page tests
npm run test:performance:dashboard-data
npm run test:performance:help-page
npm run test:performance:landing-page

# Run a quick smoke test
npm run test:load:smoke
```

### Specific Pages Load Test

The new specific pages load test focuses on three critical pages:
- **Dashboard Data Page** (`/dashboard/data`) - Main data management interface
- **Help Page** (`/help`) - User documentation and support
- **Landing Page** (`/landing`) - Application entry point

#### Quick Start
```bash
# Run all specific pages scenarios
k6 run testing/performance/load-tests/frontend/specific-pages-load-test.js

# Windows Batch Script
cd testing/performance/load-tests/frontend
run-specific-pages-test.bat

# Windows PowerShell Script (Advanced)
cd testing/performance/load-tests/frontend
.\run-specific-pages-test.ps1 -Duration "5m" -VUs 30 -Environment "staging"
```

#### Advanced Usage
```bash
# Custom duration and virtual users
k6 run --vus 50 --duration 5m testing/performance/load-tests/frontend/specific-pages-load-test.js

# With JSON output
k6 run --out json=results.json testing/performance/load-tests/frontend/specific-pages-load-test.js

# Test specific scenario only
k6 run --env SCENARIO=dashboard_data_load testing/performance/load-tests/frontend/specific-pages-load-test.js
```
