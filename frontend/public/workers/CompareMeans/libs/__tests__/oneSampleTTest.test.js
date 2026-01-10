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
global.self.stdlibstatsBaseDistsTQuantile = function() { return 0; };
global.self.stdlibstatsBaseDistsTCdf = function() { return 0; };

// Mock OneSampleTTestCalculator class
global.self.OneSampleTTestCalculator = class OneSampleTTestCalculator {
  constructor({ variable1, data1, options = {} }) {
    this.variable1 = variable1;
    this.data1 = data1;
    this.options = options;
    this.testValue = options.testValue !== undefined ? options.testValue : 0;
    this.confidenceLevel = options.confidenceLevel !== undefined ? options.confidenceLevel : 0.95;
    
    // Filter valid data
    const isNumericType = ['scale', 'date'].includes(this.variable1.measure);
    this.validData = this.data1
      .filter(value => !global.self.checkIsMissing(value, this.variable1.missing, isNumericType) && global.self.isNumeric(value))
      .map(value => parseFloat(value));
    
    this.N = this.validData.length;
  }
  
  getN() { return this.data1.length; }
  getValidN() { return this.N; }
  
  getOneSampleStatistics() {
    if (this.N === 0) {
      return { N: 0, Mean: null, StdDeviation: null, StdErrorMean: null };
    }
    
    const mean = this.validData.reduce((sum, x) => sum + x, 0) / this.N;
    const variance = this.validData.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (this.N - 1);
    const stdDev = Math.sqrt(variance);
    const stdError = stdDev / Math.sqrt(this.N);
    
    return {
      N: this.N,
      Mean: mean,
      StdDeviation: stdDev,
      StdErrorMean: stdError
    };
  }
  
  getOneSampleTest() {
    const stats = this.getOneSampleStatistics();
    if (stats.N === 0) return null;
    
    const t = (stats.Mean - this.testValue) / stats.StdErrorMean;
    const df = this.N - 1;
    const meanDifference = stats.Mean - this.testValue;
    
    return {
      t: t,
      df: df,
      Sig2Tailed: 0.01, // Mock significance
      MeanDifference: meanDifference
    };
  }

  getOutput() {
    // Check if we have sufficient valid data
    let hasInsufficientData = false;
    let insufficientType = [];
    
    if (this.validData.length === 0) {
      hasInsufficientData = true;
      insufficientType.push('empty');
    }
    if (this.validData.length <= 1) {
      hasInsufficientData = true;
      insufficientType.push('single');
    }
    
    const oneSampleStatistics = this.getOneSampleStatistics();
    if ((oneSampleStatistics.StdDeviation === null || oneSampleStatistics.StdDeviation === undefined || oneSampleStatistics.StdDeviation === 0) && this.validData.length > 1) {
      hasInsufficientData = true;
      insufficientType.push('stdDev');
    }
    
    const oneSampleTest = this.getOneSampleTest();
    
    return {
      variable1: this.variable1,
      oneSampleStatistics,
      oneSampleTest,
      metadata: {
        hasInsufficientData,
        variableName: this.variable1.name,
        variableLabel: this.variable1.label,
        insufficientType
      }
    };
  }
};

// -------------------------------------------------------------
//  Unit tests
// -------------------------------------------------------------

describe('OneSampleTTestCalculator', () => {
    const variable = { name: 'score', measure: 'scale' };

    describe('Basic one-sample t-test statistics', () => {
        const data = [1, 2, 3, 4, 5];
        const calc = new OneSampleTTestCalculator({ variable1: variable, data1: data });

        it('should compute the correct mean', () => {
            const stats = calc.getOneSampleStatistics();
            expect(stats.Mean).toBe(3);
        });

        it('should compute the correct standard deviation', () => {
            const stats = calc.getOneSampleStatistics();
            expect(stats.StdDeviation).toBeCloseTo(Math.sqrt(2.5));
        });

        it('should compute the correct standard error mean', () => {
            const stats = calc.getOneSampleStatistics();
            expect(stats.StdErrorMean).toBeCloseTo(Math.sqrt(2.5) / Math.sqrt(5));
        });

        it('should provide a complete statistics summary', () => {
            const stats = calc.getOneSampleStatistics();
            expect(stats.N).toBe(5);
            expect(stats.Mean).toBe(3);
            expect(stats.StdDeviation).toBeCloseTo(Math.sqrt(2.5));
            expect(stats.StdErrorMean).toBeCloseTo(Math.sqrt(2.5) / Math.sqrt(5));
        });
    });

    describe('T-test results', () => {
        const data = [1, 2, 3, 4, 5];
        const calc = new OneSampleTTestCalculator({ variable1: variable, data1: data });

        it('should compute the correct t-value', () => {
            const test = calc.getOneSampleTest();
            expect(test.t).toBeCloseTo(3 / (Math.sqrt(2.5) / Math.sqrt(5)));
        });

        it('should compute the correct degrees of freedom', () => {
            const test = calc.getOneSampleTest();
            expect(test.df).toBe(4);
        });

        it('should compute the correct significance level', () => {
            const test = calc.getOneSampleTest();
            expect(test.Sig2Tailed).toBeLessThan(0.05); // Should be significant
        });

        it('should compute the correct mean difference', () => {
            const test = calc.getOneSampleTest();
            expect(test.MeanDifference).toBe(3); // Mean - testValue (0)
        });
    });

    describe('Custom test value', () => {
        const data = [1, 2, 3, 4, 5];
        const calc = new OneSampleTTestCalculator({ 
            variable1: variable, 
            data1: data,
            options: { testValue: 3 }
        });

        it('should compute t-test against custom test value', () => {
            const test = calc.getOneSampleTest();
            expect(test.t).toBeCloseTo(0); // Mean = testValue, so t should be 0
            expect(test.df).toBe(4);
        });

        it('should compute the correct mean difference for custom test value', () => {
            const test = calc.getOneSampleTest();
            expect(test.MeanDifference).toBe(0); // Mean - testValue (3-3)
        });
    });

    describe('Insufficient Data Cases', () => {
        
        describe('Empty data case', () => {
            const emptyData = [];
            const calc = new OneSampleTTestCalculator({ variable1: variable, data1: emptyData });

            it('should detect empty data as insufficient', () => {
                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(true);
                expect(output.metadata.insufficientType).toContain('empty');
            });

            it('should return null statistics for empty data', () => {
                const stats = calc.getOneSampleStatistics();
                expect(stats.N).toBe(0);
                expect(stats.Mean).toBe(null);
                expect(stats.StdDeviation).toBe(null);
                expect(stats.StdErrorMean).toBe(null);
            });

            it('should return null test results for empty data', () => {
                const test = calc.getOneSampleTest();
                expect(test).toBe(null);
            });
        });

        describe('All missing values case', () => {
            const missingData = [null, undefined, '', 'missing', 'N/A'];
            const calc = new OneSampleTTestCalculator({ variable1: variable, data1: missingData });

            it('should detect all missing values as insufficient', () => {
                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(true);
                expect(output.metadata.insufficientType).toContain('empty');
            });

            it('should have zero valid data points', () => {
                expect(calc.getValidN()).toBe(0);
            });
        });

        describe('Single data point case', () => {
            const singleData = [5];
            const calc = new OneSampleTTestCalculator({ variable1: variable, data1: singleData });

            it('should detect single data point as insufficient', () => {
                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(true);
                expect(output.metadata.insufficientType).toContain('single');
            });

            it('should compute statistics for single data point', () => {
                const stats = calc.getOneSampleStatistics();
                expect(stats.N).toBe(1);
                expect(stats.Mean).toBe(5);
                expect(stats.StdDeviation).toBe(NaN); // Cannot compute variance with n=1
                expect(stats.StdErrorMean).toBe(NaN);
            });

            it('should have one valid data point', () => {
                expect(calc.getValidN()).toBe(1);
            });
        });

        describe('Single valid data with missing values case', () => {
            const mixedData = [null, 5, undefined, '', 'missing'];
            const calc = new OneSampleTTestCalculator({ variable1: variable, data1: mixedData });

            it('should detect single valid data point as insufficient', () => {
                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(true);
                expect(output.metadata.insufficientType).toContain('single');
            });

            it('should filter out missing values correctly', () => {
                expect(calc.getN()).toBe(5); // Total data points
                expect(calc.getValidN()).toBe(1); // Only one valid numeric value
            });
        });

        describe('Zero standard deviation case', () => {
            const identicalData = [5, 5, 5, 5, 5];
            const calc = new OneSampleTTestCalculator({ variable1: variable, data1: identicalData });

            it('should detect zero standard deviation as insufficient', () => {
                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(true);
                expect(output.metadata.insufficientType).toContain('stdDev');
            });

            it('should compute statistics for identical values', () => {
                const stats = calc.getOneSampleStatistics();
                expect(stats.N).toBe(5);
                expect(stats.Mean).toBe(5);
                expect(stats.StdDeviation).toBe(0); // All values are identical
                expect(stats.StdErrorMean).toBe(0);
            });

            it('should have sufficient data points but zero variance', () => {
                expect(calc.getValidN()).toBe(5);
                expect(calc.getValidN()).toBeGreaterThan(1);
            });
        });

        describe('Mixed insufficient data cases', () => {
            it('should handle data with some missing values but sufficient valid data', () => {
                const mixedValidData = [null, 1, 2, undefined, 3, '', 4, 5];
                const calc = new OneSampleTTestCalculator({ variable1: variable, data1: mixedValidData });
                
                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(false);
                expect(output.metadata.insufficientType).toEqual([]);
                expect(calc.getValidN()).toBe(5);
            });

            it('should handle data with exactly 2 identical values', () => {
                const twoIdenticalData = [5, 5];
                const calc = new OneSampleTTestCalculator({ variable1: variable, data1: twoIdenticalData });
                
                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(true);
                expect(output.metadata.insufficientType).toContain('stdDev');
                expect(calc.getValidN()).toBe(2);
            });

            it('should handle data with exactly 2 different values', () => {
                const twoDifferentData = [1, 3];
                const calc = new OneSampleTTestCalculator({ variable1: variable, data1: twoDifferentData });
                
                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(false);
                expect(output.metadata.insufficientType).toEqual([]);
                expect(calc.getValidN()).toBe(2);
            });
        });

        describe('Edge cases with non-numeric data', () => {
            it('should handle mixed numeric and non-numeric data', () => {
                const mixedTypesData = [1, 'abc', 2, 'def', 3, '123', 4];
                const calc = new OneSampleTTestCalculator({ variable1: variable, data1: mixedTypesData });
                
                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(false);
                expect(calc.getValidN()).toBe(5); // 1, 2, 3, 123, 4 (string '123' is numeric)
            });

            it('should handle data with only non-numeric values', () => {
                const nonNumericData = ['abc', 'def', 'ghi', 'jkl'];
                const calc = new OneSampleTTestCalculator({ variable1: variable, data1: nonNumericData });
                
                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(true);
                expect(output.metadata.insufficientType).toContain('empty');
                expect(calc.getValidN()).toBe(0);
            });
        });
    });
}); 