/**
 * Unified k6 Performance Test Runner for Statify
 * Outputs reports to ../reports/performance directory
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Configuration
const REPORTS_DIR = '../reports/performance';
const K6_EXECUTABLE = process.platform === 'win32' ? 'k6.exe' : 'k6';

// Ensure reports directory exists
const ensureReportsDir = () => {
  const reportsPath = join(process.cwd(), REPORTS_DIR);
  if (!existsSync(reportsPath)) {
    mkdirSync(reportsPath, { recursive: true });
  }
  return reportsPath;
};

// Run k6 test with proper reporting
const runK6Test = (testFile, scenario, outputDir) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFile = `${scenario}-${timestamp}`;
  
  const command = [
    K6_EXECUTABLE,
    'run',
    testFile,
    '--out', `json=${join(outputDir, `${reportFile}.json`)}`,
    '--out', `html=${join(outputDir, `${reportFile}.html`)}`,
    '--summary-export', `${join(outputDir, `${reportFile}-summary.json`)}`,
    '--config', 'k6.config.json'
  ].join(' ');

  try {
    console.log(`Running: ${command}`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ Test completed. Reports saved to: ${join(outputDir, reportFile)}`);
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    process.exit(1);
  }
};

// Main execution
const main = () => {
  const outputDir = ensureReportsDir();
  
  console.log('🚀 Starting Statify Performance Tests...');
  console.log(`📊 Reports will be saved to: ${outputDir}`);
  
  // Run simplified load tests - Backend POST and Frontend GET only
  const tests = [
    { file: './scenarios/backend-post-test.js', scenario: 'backend-post' },
    { file: './scenarios/frontend-get-test.js', scenario: 'frontend-get' }
  ];

  tests.forEach(({ file, scenario }) => {
    console.log(`\n🧪 Running ${scenario}...`);
    runK6Test(file, scenario, outputDir);
  });
  
  console.log('\n✅ All performance tests completed!');
  console.log(`📈 Check reports at: ${outputDir}`);
};

// CLI support
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
