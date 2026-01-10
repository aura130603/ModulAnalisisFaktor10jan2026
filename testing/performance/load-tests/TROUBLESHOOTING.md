# Troubleshooting Load Tests

## Common Issues and Solutions

### 1. Threshold Errors

If you see errors like:
```
thresholds on metrics 'errors' have been crossed
```

This means your application didn't meet the performance criteria defined in the test. This could be due to:
- High response times
- Too many failed requests
- Server overload

**Solutions:**
- Adjust thresholds in the test script to match realistic expectations
- Check server performance and capacity
- Optimize application code
- Reduce load (fewer VUs or shorter duration)

### 2. HTTP Request Failures

If you see high `http_req_failed` rates:
```
http_req_failed: 48.27% 14 out of 29
```

**Possible causes:**
- Server is unreachable
- Authentication required
- Incorrect URLs
- Server overload

**Solutions:**
- Verify the base URL is correct
- Check if authentication is needed
- Ensure the server is running
- Reduce concurrent users

### 3. Connection Errors

If you see connection timeouts or refused connections:

**Solutions:**
- Check if the application server is running
- Verify network connectivity
- Check firewall settings
- Ensure the server can handle the load

## Interpreting Test Results

### Success Indicators
- Low error count
- Response times within acceptable limits
- High success rate for HTTP requests
- Stable memory and CPU usage on server

### Warning Signs
- High error rates (>5%)
- Response times consistently above thresholds
- Server timeouts
- Resource exhaustion on server

## Next Steps

1. **Start with smoke tests** - Run short tests with few users to verify setup
2. **Gradually increase load** - Slowly increase VUs and duration
3. **Monitor server resources** - Watch CPU, memory, and network usage
4. **Adjust thresholds** - Set realistic performance goals
5. **Optimize and retest** - Fix issues and run tests again

## Example Commands for Different Test Levels

```bash
# Smoke test (quick verification)
npm run test:load:smoke

# Light load test
npx k6 run --vus 10 --duration 30s load-tests/basic-load-test.js

# Medium load test
npx k6 run --vus 50 --duration 2m load-tests/basic-load-test.js

# Heavy load test
npx k6 run --vus 100 --duration 5m load-tests/spss-operations-test.js
```

Remember to monitor your application server during testing to ensure you don't overload it in a way that could cause issues.
