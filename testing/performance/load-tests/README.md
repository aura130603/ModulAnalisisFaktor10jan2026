# Load Testing with k6

This directory contains load tests for the Statify SPSS application using k6.

## Test Scripts

### Frontend Tests
1. **basic-load-test.js** - Basic load test that simulates users accessing different pages of the application
2. **spss-operations-test.js** - Test that covers frontend pages related to data and variable management
3. **frontend-routes-test.js** - Targeted test that specifically covers all frontend routes in the application (landing, dashboard, data, variable, result, help pages)

### Backend Tests
4. **sav-apis-test.js** - Test specifically for the two SAV APIs (read and write operations)

## Running Tests

### Using npm scripts (recommended)

```bash
# Run basic load test
npm run test:load:basic

# Run SPSS operations load test
npm run test:load:operations

# Run frontend routes test
npm run test:load:routes

# Run SAV APIs test
npm run test:load:sav

# Run a quick smoke test
npm run test:load:smoke
```

### Direct k6 commands

```bash
# Run basic test with default settings
npx k6 run basic-load-test.js

# Run with custom settings
npx k6 run --vus 20 --duration 60s basic-load-test.js

# Run with output to file
npx k6 run --out json=results.json basic-load-test.js
```

## Test Configuration

- **VUs (Virtual Users)**: Number of concurrent users simulated
- **Duration**: How long the test runs
- **Thresholds**: Performance criteria that must be met

## Interpreting Results

Key metrics to watch:

- **http_req_duration**: Response time for HTTP requests
- **http_req_failed**: Rate of failed requests
- **iterations**: Number of test iterations completed
- **data_received/sent**: Network traffic

## Customizing Tests

You can modify the test scripts to:

1. Change the target URLs
2. Adjust the load patterns
3. Add new SPSS operations
4. Modify thresholds
5. Add new metrics

For more information about k6 scripting, visit [https://k6.io/docs/](https://k6.io/docs/)
