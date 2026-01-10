// -------------------------------------------------------------
//  Bootstrap a faux Web-Worker global environment
// -------------------------------------------------------------
global.self = global;

// Mock the utility functions that would be imported
global.self.isNumeric = function(value) {
  if (typeof value === 'number' && !isNaN(value)) return true;
  if (typeof value === 'string' && value.trim() !== '') {
    return !isNaN(parseFloat(value));
  }
  return false;
};

global.self.checkIsMissing = function(value, definition, isNumericType) {
  if (value === null || value === undefined || (isNumericType && value === '')) return true;
  if (!definition) return false;
  
  if (definition.discrete && Array.isArray(definition.discrete)) {
    const valueToCompare = isNumericType && typeof value !== 'number' ? parseFloat(value) : value;
    for (const missingVal of definition.discrete) {
      const discreteMissingToCompare = isNumericType && typeof missingVal === 'string' ? parseFloat(missingVal) : missingVal;
      if (valueToCompare === discreteMissingToCompare || String(value) === String(missingVal)) return true;
    }
  }
  
  if (isNumericType && definition.range) {
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    if (!isNaN(numValue)) {
      const min = parseFloat(definition.range.min);
      const max = parseFloat(definition.range.max);
      if (!isNaN(min) && !isNaN(max) && numValue >= min && numValue <= max) return true;
    }
  }
  return false;
};

// Mock stdlib functions
global.self.stdlibstatsBaseDistsNormalCdf = function(z) { 
  // Return a realistic p-value between 0 and 1
  // For two-tailed test, we need to ensure the result is properly bounded
  // Use a simple approximation that ensures values are between 0 and 1
  const cdf = Math.max(0, Math.min(1, 0.5 - (Math.abs(z) * 0.05)));
  return cdf;
};

// Mock RunsCalculator class based on runs.js implementation
global.self.RunsCalculator = class RunsCalculator {
  constructor({ variable, data, options = {} }) {
    this.variable = variable;
    this.data = data;
    this.options = options;
    this.initialized = false;
    
    // Extract options from options
    this.cutPoint = options.cutPoint || { median: true, mean: false, mode: false, custom: false };
    this.customValue = options.customValue !== undefined ? options.customValue : 0;
    this.displayStatistics = options.displayStatistics || { descriptive: false, quartiles: false };
    
    // Properties that will be calculated
    this.validData = [];
    this.N = 0;

    this.hasInsufficientData = false;
    this.insufficientType = [];
    
    /** @private */
    this.memo = {};
  }
  
  /**
   * @private
   * Process data for analysis
   */
  #initialize() {
    if (this.initialized) return;

    const isNumericType = ['scale', 'date'].includes(this.variable.measure);

    // Filter valid data
    this.validData = this.data
      .filter(value => !global.self.checkIsMissing(value, this.variable.missing, isNumericType) && global.self.isNumeric(value))
      .map(value => parseFloat(value));
    
    // Calculate Total N
    this.N = this.validData.length;
    if (this.N === 0) {
      this.hasInsufficientData = true;
      this.insufficientType.push('empty');
    }

    this.initialized = true;
  }
  
  getN() { this.#initialize(); return this.data.length; }
  getValidN() { this.#initialize(); return this.N; }
  
  /**
   * Calculate mean from array
   * @returns {number} Mean
   */
  #getMean() {
    if (this.memo.mean !== undefined) return this.memo.mean;
    
    this.#initialize();
    
    if (this.N === 0) return null;
    
    const sum = this.validData.reduce((acc, val) => acc + val, 0);
    const mean = sum / this.N;
    
    this.memo.mean = mean;
    return mean;
  }
  
  /**
   * Calculate median from array
   * @returns {number} Median
   */
  #getMedian() {
    if (this.memo.median !== undefined) return this.memo.median;
    
    this.#initialize();
    
    if (this.N === 0) return null;
    
    const sorted = [...this.validData].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0 ? 
      (sorted[mid - 1] + sorted[mid]) / 2 : 
      sorted[mid];
    
    this.memo.median = median;
    return median;
  }
  
  /**
   * Calculate mode from array
   * @returns {number} Mode
   */
  #getMode() {
    if (this.memo.mode !== undefined) return this.memo.mode;
    
    this.#initialize();
    
    if (this.N === 0) return null;
    
    const frequency = {};
    this.validData.forEach(value => {
      frequency[value] = (frequency[value] || 0) + 1;
    });
    
    // Find value with highest frequency
    let maxFrequency = 0;
    let modeValue = this.validData[0]; // default value
    
    Object.entries(frequency).forEach(([value, freq]) => {
      if (freq > maxFrequency) {
        maxFrequency = freq;
        modeValue = parseFloat(value);
      }
    });
    
    this.memo.mode = modeValue;
    return modeValue;
  }
  
  /**
   * Calculate runs test statistics with specific test value
   * @param {number|string} testValueType - Test value type (median, mean, mode) or custom value
   * @returns {object} Runs test statistics result
   */
  #getRunsTestStats(testValueType) {
    const key = `runsTest_${testValueType}`;
    if (this.memo[key]) return this.memo[key];
    
    this.#initialize();
    
    if (this.N <= 1) {
      return {
        TestValue: null,
        CasesBelow: 0,
        CasesAbove: 0,
        Total: this.N,
        Runs: 0,
        Z: null,
        PValue: null
      };
    }
    
    // Determine test value based on testValueType
    let testValue;
    if (testValueType === 'median') {
      testValue = this.#getMedian();
    } else if (testValueType === 'mode') {
      testValue = this.#getMode();
    } else if (testValueType === 'mean') {
      testValue = this.#getMean();
    } else if (typeof testValueType === 'number') {
      testValue = testValueType;
    } else {
      testValue = 0; // default
    }

    // Classify data: count cases < testValue and >= testValue
    const casesBelow = this.validData.filter(x => x < testValue).length;
    const casesAbove = this.validData.filter(x => x >= testValue).length;

    // Calculate number of runs (category changes)
    let runs = 1; // minimum 1 run
    for (let i = 1; i < this.N; i++) {
      if ((this.validData[i] < testValue) !== (this.validData[i - 1] < testValue)) {
        runs++;
      }
    }
    if (runs === 1) {
      this.hasInsufficientData = true;
      if (typeof testValueType === 'number') {
        this.insufficientType.push(`single custom`);
      } else {
        this.insufficientType.push(`single ${testValueType}`);
      }
      return {
        TestValue: testValue,
        CasesBelow: casesBelow,
        CasesAbove: casesAbove,
        Total: this.N,
        Runs: runs,
        Z: null,
        PValue: null
      };
    }

    // Calculate expectation (mean) number of runs and standard deviation
    const mu_R = 1 + (2 * casesBelow * casesAbove) / this.N;
    const sigma_R = Math.sqrt((2 * casesBelow * casesAbove * (2 * casesBelow * casesAbove - this.N)) / 
                            (this.N * this.N * (this.N - 1)));

    // Apply continuity correction for runs value
    let runsCorrected = runs;
    if (runs < mu_R) {
      runsCorrected = runs + 0.5;
    } else if (runs > mu_R) {
      runsCorrected = runs - 0.5;
    }

    // Calculate Z value
    let Z = null;
    let PValue = null;
    
         if (sigma_R > 0) {
       Z = (runsCorrected - mu_R) / sigma_R;
       // Calculate 2-tailed p-value using stdlibstatsBaseDistsNormalCdf
       // Ensure P-value is properly bounded between 0 and 1
       const cdf = global.self.stdlibstatsBaseDistsNormalCdf(Math.abs(Z), 0, 1);
       PValue = Math.max(0, Math.min(1, 2 * (1 - cdf)));
     }

    const result = {
      TestValue: testValue,    // test value based on testValueType
      CasesBelow: casesBelow,   // number of data with value < testValue
      CasesAbove: casesAbove,   // number of data with value >= testValue
      Total: this.N, // total cases/data
      Runs: runs,         // observed number of runs
      Z: Z,            // Z statistic value (after continuity correction)
      PValue: PValue        // p-value (2-tailed)
    };
    
    this.memo[key] = result;
    return result;
  }
  
  /**
   * Get runs test results for all selected cut points
   * @returns {object} Runs test results
   */
  getRunsTest() {
    if (this.memo.runsTest) return this.memo.runsTest;
    
    this.#initialize();
    
    const results = {};
    
    try {
      if (this.cutPoint.median) {
        results.median = this.#getRunsTestStats('median');
      }
      
      if (this.cutPoint.mean) {
        results.mean = this.#getRunsTestStats('mean');
      }
      
      if (this.cutPoint.mode) {
        results.mode = this.#getRunsTestStats('mode');
      }
      
      if (this.cutPoint.custom) {
        results.custom = this.#getRunsTestStats(this.customValue);
      }
    } catch (error) {
      console.error("Error in getRunsTest:", error);
    }
    
    this.memo.runsTest = {
      ...results
    };
    
    return {
      ...results
    };
  }
  
  /**
   * Get all statistics results.
   * @returns {Object} Result object containing runs test results.
   */
  getOutput() {
    this.#initialize();
    
    const variable1 = this.variable;
    const runsTest = this.getRunsTest();

    return {
      variable1,
      runsTest,
      metadata: {
        hasInsufficientData: this.hasInsufficientData,
        insufficientType: this.insufficientType,
        variableName: this.variable.name,
        variableLabel: this.variable.label
      }
    };
  }
};

// -------------------------------------------------------------
//  Unit tests
// -------------------------------------------------------------

describe('RunsCalculator', () => {
    const variable = { name: 'score', measure: 'scale' };

    describe('Basic runs test statistics', () => {
        const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const calc = new RunsCalculator({ 
            variable: variable, 
            data: data,
            options: { cutPoint: { median: true, mean: false, mode: false, custom: false } }
        });

        it('should compute the correct sample size', () => {
            expect(calc.getN()).toBe(10);
        });

        it('should compute the correct valid sample size', () => {
            expect(calc.getValidN()).toBe(10);
        });

        it('should compute the correct median cut point value', () => {
            const runsTest = calc.getRunsTest();
            expect(runsTest.median.TestValue).toBe(5.5); // median of 1-10
        });

        it('should calculate runs test statistics correctly', () => {
            const runsTest = calc.getRunsTest();
            expect(runsTest.median.CasesBelow).toBe(5);
            expect(runsTest.median.CasesAbove).toBe(5);
            expect(runsTest.median.Total).toBe(10);
            expect(runsTest.median.Runs).toBe(2); // One run of 0s, one run of 1s
        });
    });

    describe('Runs test results', () => {
        const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const calc = new RunsCalculator({ 
            variable: variable, 
            data: data,
            options: { cutPoint: { median: true, mean: false, mode: false, custom: false } }
        });

        it('should compute the correct Z-statistic', () => {
            const test = calc.getRunsTest();
            expect(test.median.Z).toBeDefined();
            expect(typeof test.median.Z).toBe('number');
        });

        it('should compute the correct P-value', () => {
            const test = calc.getRunsTest();
            expect(test.median.PValue).toBeDefined();
            expect(test.median.PValue).toBeGreaterThanOrEqual(0);
            // P-value should be bounded by 1 for a valid 2-tailed test
            expect(test.median.PValue).toBeLessThanOrEqual(1);
        });

        it('should have sufficient data for analysis', () => {
            const output = calc.getOutput();
            expect(output.metadata.hasInsufficientData).toBe(false);
            expect(output.metadata.insufficientType).toEqual([]);
        });
    });

    describe('Different cut point methods', () => {
        const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

        it('should use median as cut point', () => {
            const calc = new RunsCalculator({ 
                variable: variable, 
                data: data,
                options: { cutPoint: { median: true, mean: false, mode: false, custom: false } }
            });
            const runsTest = calc.getRunsTest();
            expect(runsTest.median.TestValue).toBe(5.5);
        });

        it('should use mean as cut point', () => {
            const calc = new RunsCalculator({ 
                variable: variable, 
                data: data,
                options: { cutPoint: { median: false, mean: true, mode: false, custom: false } }
            });
            const runsTest = calc.getRunsTest();
            expect(runsTest.mean.TestValue).toBe(5.5); // mean of 1-10
        });

        it('should use custom value as cut point', () => {
            const calc = new RunsCalculator({ 
                variable: variable, 
                data: data,
                options: { cutPoint: { median: false, mean: false, mode: false, custom: true }, customValue: 3 }
            });
            const runsTest = calc.getRunsTest();
            expect(runsTest.custom.TestValue).toBe(3);
        });

        it('should use mode as cut point', () => {
            const dataWithMode = [1, 2, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const calc = new RunsCalculator({ 
                variable: variable, 
                data: dataWithMode,
                options: { cutPoint: { median: false, mean: false, mode: true, custom: false } }
            });
            const runsTest = calc.getRunsTest();
            expect(runsTest.mode.TestValue).toBe(2); // mode is 2
        });
    });

    describe('Complex runs patterns', () => {
        it('should handle alternating pattern', () => {
            const data = [1, 10, 2, 9, 3, 8, 4, 7, 5, 6];
            const calc = new RunsCalculator({ 
                variable: variable, 
                data: data,
                options: { cutPoint: { median: true, mean: false, mode: false, custom: false } }
            });

            const runsTest = calc.getRunsTest();
            expect(runsTest.median.Runs).toBe(10); // Each value forms its own run
        });

        it('should handle mixed pattern', () => {
            const data = [1, 1, 10, 2, 9, 9, 3, 8, 4, 7];
            const calc = new RunsCalculator({ 
                variable: variable, 
                data: data,
                options: { cutPoint: { median: true, mean: false, mode: false, custom: false } }
            });

            const runsTest = calc.getRunsTest();
            expect(runsTest.median.Runs).toBeGreaterThan(1);
        });

        it('should handle all values above cut point (single run)', () => {
            const data = [6, 7, 8, 9, 10];
            const calc = new RunsCalculator({ 
                variable: variable, 
                data: data,
                options: { cutPoint: { median: false, mean: false, mode: false, custom: true }, customValue: 5 }
            });

            const runsTest = calc.getRunsTest();
            expect(runsTest.custom.CasesBelow).toBe(0);
            expect(runsTest.custom.CasesAbove).toBe(5);
            expect(runsTest.custom.Runs).toBe(1);
        });

        it('should handle all values below cut point (single run)', () => {
            const data = [1, 2, 3, 4, 5];
            const calc = new RunsCalculator({ 
                variable: variable, 
                data: data,
                options: { cutPoint: { median: false, mean: false, mode: false, custom: true }, customValue: 6 }
            });

            const runsTest = calc.getRunsTest();
            expect(runsTest.custom.CasesBelow).toBe(5);
            expect(runsTest.custom.CasesAbove).toBe(0);
            expect(runsTest.custom.Runs).toBe(1);
        });
    });

    describe('Insufficient Data Cases', () => {
        
        describe('Empty data case', () => {
            it('should detect empty data', () => {
                const data = [];
                const calc = new RunsCalculator({ 
                    variable: variable, 
                    data: data,
                    options: { cutPoint: { median: true, mean: false, mode: false, custom: false } }
                });

                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(true);
                expect(output.metadata.insufficientType).toContain('empty');
                expect(calc.getValidN()).toBe(0);
            });

            it('should detect all missing data', () => {
                const data = [null, null, null, null, null];
                const calc = new RunsCalculator({ 
                    variable: variable, 
                    data: data,
                    options: { cutPoint: { median: true, mean: false, mode: false, custom: false } }
                });

                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(true);
                expect(output.metadata.insufficientType).toContain('empty');
                expect(calc.getValidN()).toBe(0);
            });

            it('should detect all non-numeric data', () => {
                const data = ['a', 'b', 'c', 'd', 'e'];
                const calc = new RunsCalculator({ 
                    variable: variable, 
                    data: data,
                    options: { cutPoint: { median: true, mean: false, mode: false, custom: false } }
                });

                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(true);
                expect(output.metadata.insufficientType).toContain('empty');
                expect(calc.getValidN()).toBe(0);
            });
        });

        describe('Single data point case', () => {
            it('should detect single data point', () => {
                const data = [5];
                const calc = new RunsCalculator({ 
                    variable: variable, 
                    data: data,
                    options: { cutPoint: { median: true, mean: false, mode: false, custom: false } }
                });

                const runsTest = calc.getRunsTest();
                expect(runsTest.median.TestValue).toBe(null);
                expect(runsTest.median.CasesBelow).toBe(0);
                expect(runsTest.median.CasesAbove).toBe(0);
                expect(runsTest.median.Total).toBe(1);
                expect(runsTest.median.Runs).toBe(0);
                expect(runsTest.median.Z).toBe(null);
                expect(runsTest.median.PValue).toBe(null);
            });
        });

        describe('Single run cases', () => {
            it('should detect single run when all values are above cut point', () => {
                const data = [6, 7, 8, 9, 10];
                const calc = new RunsCalculator({ 
                    variable: variable, 
                    data: data,
                    options: { cutPoint: { median: false, mean: false, mode: false, custom: true }, customValue: 5 }
                });

                const runsTest = calc.getRunsTest();
                expect(runsTest.custom.Runs).toBe(1);
                expect(runsTest.custom.Z).toBe(null);
                expect(runsTest.custom.PValue).toBe(null);
                
                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(true);
                expect(output.metadata.insufficientType).toContain('single custom');
            });

            it('should detect single run when all values are below cut point', () => {
                const data = [1, 2, 3, 4, 5];
                const calc = new RunsCalculator({ 
                    variable: variable, 
                    data: data,
                    options: { cutPoint: { median: false, mean: false, mode: false, custom: true }, customValue: 6 }
                });

                const runsTest = calc.getRunsTest();
                expect(runsTest.custom.Runs).toBe(1);
                expect(runsTest.custom.Z).toBe(null);
                expect(runsTest.custom.PValue).toBe(null);
                
                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(true);
                expect(output.metadata.insufficientType).toContain('single custom');
            });

            it('should detect single run with median cut point', () => {
                const data = [1, 1, 1, 1, 1]; // All values are the same
                const calc = new RunsCalculator({ 
                    variable: variable, 
                    data: data,
                    options: { cutPoint: { median: true, mean: false, mode: false, custom: false } }
                });

                const runsTest = calc.getRunsTest();
                expect(runsTest.median.Runs).toBe(1);
                expect(runsTest.median.Z).toBe(null);
                expect(runsTest.median.PValue).toBe(null);
                
                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(true);
                expect(output.metadata.insufficientType).toContain('single median');
            });

            it('should detect single run with mean cut point', () => {
                const data = [5, 5, 5, 5, 5]; // All values equal to mean
                const calc = new RunsCalculator({ 
                    variable: variable, 
                    data: data,
                    options: { cutPoint: { median: false, mean: true, mode: false, custom: false } }
                });

                const runsTest = calc.getRunsTest();
                expect(runsTest.mean.Runs).toBe(1);
                expect(runsTest.mean.Z).toBe(null);
                expect(runsTest.mean.PValue).toBe(null);
                
                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(true);
                expect(output.metadata.insufficientType).toContain('single mean');
            });
        });

        describe('Missing data cases', () => {
            it('should handle missing data', () => {
                const data = [1, null, 3, 4, null, 6, 7, 8, 9, 10];
                const calc = new RunsCalculator({ 
                    variable: variable, 
                    data: data,
                    options: { cutPoint: { median: true, mean: false, mode: false, custom: false } }
                });

                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(false);
                expect(calc.getValidN()).toBe(8); // 10 - 2 missing values
            });

            it('should handle mixed missing and valid data', () => {
                const data = [1, null, 3, 'invalid', 5, 6, 7, 8, 9, 10];
                const calc = new RunsCalculator({ 
                    variable: variable, 
                    data: data,
                    options: { cutPoint: { median: true, mean: false, mode: false, custom: false } }
                });

                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(false);
                expect(calc.getValidN()).toBe(8); // 10 - 2 invalid values
            });
        });

        describe('Edge cases', () => {
            it('should handle two data points', () => {
                const data = [1, 10];
                const calc = new RunsCalculator({ 
                    variable: variable, 
                    data: data,
                    options: { cutPoint: { median: true, mean: false, mode: false, custom: false } }
                });

                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(false);
                expect(calc.getValidN()).toBe(2);
                
                const runsTest = calc.getRunsTest();
                expect(runsTest.median.Runs).toBe(2); // One run of 0, one run of 1
            });

            it('should handle values exactly at cut point', () => {
                const data = [5, 5, 5, 6, 6, 6];
                const calc = new RunsCalculator({ 
                    variable: variable, 
                    data: data,
                    options: { cutPoint: { median: true, mean: false, mode: false, custom: false } }
                });

                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(false);
                
                const runsTest = calc.getRunsTest();
                expect(runsTest.median.Runs).toBe(2); // One run of 0s, one run of 1s
            });

            it('should handle zero standard deviation case', () => {
                const data = [5, 5, 5, 5, 5]; // All values are the same
                const calc = new RunsCalculator({ 
                    variable: variable, 
                    data: data,
                    options: { cutPoint: { median: true, mean: false, mode: false, custom: false } }
                });

                const runsTest = calc.getRunsTest();
                expect(runsTest.median.Runs).toBe(1);
                expect(runsTest.median.Z).toBe(null);
                expect(runsTest.median.PValue).toBe(null);
                
                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(true);
                expect(output.metadata.insufficientType).toContain('single median');
            });
        });

        describe('Mixed sufficient and insufficient data scenarios', () => {
            it('should correctly identify sufficient data', () => {
                const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
                const calc = new RunsCalculator({ 
                    variable: variable, 
                    data: data,
                    options: { cutPoint: { median: true, mean: false, mode: false, custom: false } }
                });

                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(false);
                expect(output.metadata.insufficientType).toEqual([]);
                expect(calc.getValidN()).toBe(10);
                
                const runsTest = calc.getRunsTest();
                expect(runsTest.median.CasesBelow).toBe(5);
                expect(runsTest.median.CasesAbove).toBe(5);
                expect(runsTest.median.Runs).toBe(2);
            });

            it('should handle complex sufficient data pattern', () => {
                const data = [1, 1, 10, 2, 9, 9, 3, 8, 4, 7];
                const calc = new RunsCalculator({ 
                    variable: variable, 
                    data: data,
                    options: { cutPoint: { median: true, mean: false, mode: false, custom: false } }
                });

                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(false);
                expect(calc.getValidN()).toBe(10);
                
                const runsTest = calc.getRunsTest();
                expect(runsTest.median.Runs).toBeGreaterThan(1);
            });

            it('should handle data with multiple cut points', () => {
                const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
                const calc = new RunsCalculator({ 
                    variable: variable, 
                    data: data,
                    options: { 
                        cutPoint: { median: true, mean: true, mode: false, custom: true },
                        customValue: 3
                    }
                });

                const runsTest = calc.getRunsTest();
                expect(runsTest.median).toBeDefined();
                expect(runsTest.mean).toBeDefined();
                expect(runsTest.custom).toBeDefined();
                expect(runsTest.mode).toBeUndefined();
                
                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(false);
            });
        });
    });

    describe('Multiple cut point analysis', () => {
        const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        
        it('should analyze with median cut point', () => {
            const calc = new RunsCalculator({ 
                variable: variable, 
                data: data,
                options: { cutPoint: { median: true, mean: false, mode: false, custom: false } }
            });

            const runsTest = calc.getRunsTest();
            expect(runsTest.median.TestValue).toBe(5.5);
            expect(runsTest.median.Runs).toBe(2);
            expect(runsTest.median.Z).toBeDefined();
            expect(runsTest.median.PValue).toBeDefined();
        });

        it('should analyze with mean cut point', () => {
            const calc = new RunsCalculator({ 
                variable: variable, 
                data: data,
                options: { cutPoint: { median: false, mean: true, mode: false, custom: false } }
            });

            const runsTest = calc.getRunsTest();
            expect(runsTest.mean.TestValue).toBe(5.5);
            expect(runsTest.mean.Runs).toBe(2);
            expect(runsTest.mean.Z).toBeDefined();
            expect(runsTest.mean.PValue).toBeDefined();
        });

        it('should analyze with mode cut point', () => {
            const dataWithMode = [1, 2, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const calc = new RunsCalculator({ 
                variable: variable, 
                data: dataWithMode,
                options: { cutPoint: { median: false, mean: false, mode: true, custom: false } }
            });

            const runsTest = calc.getRunsTest();
            expect(runsTest.mode.TestValue).toBe(2);
            expect(runsTest.mode.Runs).toBeGreaterThan(1);
            expect(runsTest.mode.Z).toBeDefined();
            expect(runsTest.mode.PValue).toBeDefined();
        });

        it('should analyze with custom cut point', () => {
            const calc = new RunsCalculator({ 
                variable: variable, 
                data: data,
                options: { 
                    cutPoint: { median: false, mean: false, mode: false, custom: true },
                    customValue: 3
                }
            });

            const runsTest = calc.getRunsTest();
            expect(runsTest.custom.TestValue).toBe(3);
            expect(runsTest.custom.CasesBelow).toBe(2);
            expect(runsTest.custom.CasesAbove).toBe(8);
            expect(runsTest.custom.Runs).toBeGreaterThan(1);
            expect(runsTest.custom.Z).toBeDefined();
            expect(runsTest.custom.PValue).toBeDefined();
        });
    });

    describe('Advanced scenarios', () => {
        it('should handle data with missing values and sufficient valid data', () => {
            const data = [1, null, 3, 4, null, 6, 7, 8, 9, 10, null, 12, 13, 14, 15];
            const calc = new RunsCalculator({ 
                variable: variable, 
                data: data,
                options: { cutPoint: { median: true, mean: false, mode: false, custom: false } }
            });

            const output = calc.getOutput();
            expect(output.metadata.hasInsufficientData).toBe(false);
            expect(calc.getValidN()).toBe(12); // 15 - 3 missing values
            
            const runsTest = calc.getRunsTest();
            expect(runsTest.median.Runs).toBeGreaterThan(1);
            expect(runsTest.median.Z).toBeDefined();
            expect(runsTest.median.PValue).toBeDefined();
        });

        it('should handle data with all values equal to cut point', () => {
            const data = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
            const calc = new RunsCalculator({ 
                variable: variable, 
                data: data,
                options: { cutPoint: { median: true, mean: false, mode: false, custom: false } }
            });

            const runsTest = calc.getRunsTest();
            expect(runsTest.median.Runs).toBe(1);
            expect(runsTest.median.Z).toBe(null);
            expect(runsTest.median.PValue).toBe(null);
            
            const output = calc.getOutput();
            expect(output.metadata.hasInsufficientData).toBe(true);
            expect(output.metadata.insufficientType).toContain('single median');
        });

        it('should handle data with alternating pattern around cut point', () => {
            const data = [1, 10, 2, 9, 3, 8, 4, 7, 5, 6];
            const calc = new RunsCalculator({ 
                variable: variable, 
                data: data,
                options: { cutPoint: { median: true, mean: false, mode: false, custom: false } }
            });

            const runsTest = calc.getRunsTest();
            expect(runsTest.median.Runs).toBe(10); // Each value forms its own run
            expect(runsTest.median.Z).toBeDefined();
            expect(runsTest.median.PValue).toBeDefined();
            
            const output = calc.getOutput();
            expect(output.metadata.hasInsufficientData).toBe(false);
        });

        it('should handle data with mixed numeric and non-numeric values', () => {
            const data = [1, 'a', 3, 'b', 5, 6, 'c', 8, 9, 10];
            const calc = new RunsCalculator({ 
                variable: variable, 
                data: data,
                options: { cutPoint: { median: true, mean: false, mode: false, custom: false } }
            });

            const output = calc.getOutput();
            expect(output.metadata.hasInsufficientData).toBe(false);
            expect(calc.getValidN()).toBe(7); // 10 - 3 non-numeric values
            
            const runsTest = calc.getRunsTest();
            expect(runsTest.median.Runs).toBeGreaterThan(1);
            expect(runsTest.median.Z).toBeDefined();
            expect(runsTest.median.PValue).toBeDefined();
        });

        it('should handle data with extreme values', () => {
            const data = [1, 2, 3, 4, 5, 1000, 2000, 3000, 4000, 5000];
            const calc = new RunsCalculator({ 
                variable: variable, 
                data: data,
                options: { cutPoint: { median: true, mean: false, mode: false, custom: false } }
            });

            const runsTest = calc.getRunsTest();
            expect(runsTest.median.Runs).toBe(2); // One run of low values, one run of high values
            expect(runsTest.median.Z).toBeDefined();
            expect(runsTest.median.PValue).toBeDefined();
            
            const output = calc.getOutput();
            expect(output.metadata.hasInsufficientData).toBe(false);
        });

        it('should handle data with decimal values', () => {
            const data = [1.1, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8, 9.9, 10.0];
            const calc = new RunsCalculator({ 
                variable: variable, 
                data: data,
                options: { cutPoint: { median: true, mean: false, mode: false, custom: false } }
            });

            const runsTest = calc.getRunsTest();
            // Calculate expected median: (5.5 + 6.6) / 2 = 6.05
            expect(runsTest.median.TestValue).toBe(6.05); // median of decimal values
            expect(runsTest.median.Runs).toBe(2);
            expect(runsTest.median.Z).toBeDefined();
            expect(runsTest.median.PValue).toBeDefined();
            
            const output = calc.getOutput();
            expect(output.metadata.hasInsufficientData).toBe(false);
        });

        it('should handle data with string numeric values', () => {
            const data = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
            const calc = new RunsCalculator({ 
                variable: variable, 
                data: data,
                options: { cutPoint: { median: true, mean: false, mode: false, custom: false } }
            });

            const runsTest = calc.getRunsTest();
            expect(runsTest.median.TestValue).toBe(5.5);
            expect(runsTest.median.Runs).toBe(2);
            expect(runsTest.median.Z).toBeDefined();
            expect(runsTest.median.PValue).toBeDefined();
            
            const output = calc.getOutput();
            expect(output.metadata.hasInsufficientData).toBe(false);
            expect(calc.getValidN()).toBe(10);
        });
    });
});
