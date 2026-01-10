#!/usr/bin/env node

/**
 * Simple test runner for single execution during development
 * Usage: node run-single-test.js [test-name]
 */

const { spawn } = require('child_process');
const path = require('path');

const testName = process.argv[2] || 'should open ImportCsv modal through File menu';
const testFile = 'testing/e2e/specs/dashboard/import-csv.spec.ts';

console.log(`🧪 Running single test: ${testName}`);
console.log(`📁 Test file: ${testFile}`);

const playwright = spawn('npx', [
  'playwright',
  'test',
  '--config=testing/e2e/playwright.config.ts',
  testFile,
  '--headed',
  '--timeout=30000',
  '--grep',
  testName
], {
  stdio: 'inherit',
  shell: true,
  cwd: path.resolve(__dirname, '../../')
});

playwright.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Test completed successfully!');
  } else {
    console.log(`❌ Test failed with code ${code}`);
  }
  process.exit(code);
});

playwright.on('error', (error) => {
  console.error('Error running test:', error);
  process.exit(1);
});
