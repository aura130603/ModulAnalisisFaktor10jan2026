// -------------------------------------------------------------
//  Bootstrap a faux Web-Worker global environment
// -------------------------------------------------------------
global.self = global;

// Mock the utility functions that would be imported
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

global.self.isNumeric = function(value) {
  if (typeof value === 'number' && !isNaN(value)) return true;
  if (typeof value === 'string' && value.trim() !== '') {
    return !isNaN(parseFloat(value));
  }
  return false;
};

// Mock stdlib functions
global.self.stdlibstatsBaseDistsChisquareCdf = function() { return 0.5; };

// Mock ChiSquareCalculator class
global.self.ChiSquareCalculator = class ChiSquareCalculator {
  constructor({ variable1, data1, options = {} }) {
    this.variable1 = variable1;
    this.data1 = data1;
    this.options = options;
    this.initialized = false;
    
    // Extract options
    this.expectedRange = options.expectedRange || { getFromData: true, useSpecifiedRange: false };
    this.rangeValue = options.rangeValue || { lowerValue: null, upperValue: null };
    this.expectedValue = options.expectedValue || { allCategoriesEqual: true, values: false, inputValue: null };
    this.expectedValueList = options.expectedValueList || [];
    this.displayStatistics = options.displayStatistics || { descriptive: false, quartiles: false };
    
    // Properties that will be calculated
    this.validData = [];
    this.observedN = {};
    this.N = 0;
    this.countCategories = 0;
    
    this.memo = {};
    
    this.#initialize();
  }
  
  #initialize() {
    if (this.initialized) return;

    const isNumericType = true;
    this.validData = this.data1
      .filter(value => {
        if (value === null || value === undefined) {
          return false;
        }
        if (global.self.checkIsMissing(value, this.variable1.missing, isNumericType)) {
          return false;
        }
        if (!global.self.isNumeric(value)) {
          return false;
        }
        return true;
      });
    
    // Apply range filter if needed
    if (this.expectedRange.useSpecifiedRange && 
      this.rangeValue.lowerValue !== null && 
      this.rangeValue.upperValue !== null) {
      this.validData = this.validData
        .map(value => Math.floor(value))
        .filter(value => value >= this.rangeValue.lowerValue && value <= this.rangeValue.upperValue);
      this.countCategories = this.rangeValue.upperValue - this.rangeValue.lowerValue + 1;
    }
    
    // Calculate Observed N
    this.validData.forEach(value => {
      this.observedN[value] = (this.observedN[value] || 0) + 1;
    });

    this.N = this.validData.length;

    if (!this.countCategories) {
      this.countCategories = Object.keys(this.observedN).length;
    }

    if (this.N === 0) {
      this.countCategories = 0;
    }

    this.initialized = true;
  }
  
  getN() { return this.data1.length; }
  getValidN() { return this.N; }
  getCountCategories() { return this.countCategories; }
  
  getExpectedN() {
    if (this.memo.expectedN) return this.memo.expectedN;
    
    if (this.N === 0 || this.countCategories === 0) {
      this.memo.expectedN = 0;
      return 0;
    }
    
    let expectedN;
    if (this.expectedValue.values) {
      if (this.expectedValueList.length !== this.countCategories) {
        return null;
      }
      const totalExpected = this.expectedValueList.reduce((a, b) => a + b, 0);
      expectedN = this.expectedValueList.map(value => (value / totalExpected) * this.N);
    } else {
      expectedN = this.N / this.countCategories;
    }
    
    this.memo.expectedN = expectedN;
    return this.memo.expectedN;
  }

  getCategoryList() {
    if (this.memo.categoryList) return this.memo.categoryList;
    
    if (this.N === 0 || this.countCategories === 0) {
      this.memo.categoryList = [];
      return [];
    }
    
    let categoryList;
    if (this.expectedRange.useSpecifiedRange && 
      this.rangeValue.lowerValue !== null && 
      this.rangeValue.upperValue !== null) {
      categoryList = Array.from(
        { length: this.countCategories }, 
        (_, i) => this.rangeValue.lowerValue + i
      );
    } else {
      categoryList = Object.keys(this.observedN).map(Number).sort((a, b) => a - b);
    }
    
    this.memo.categoryList = categoryList;
    return categoryList;
  }
  
  getResidual() { 
    if (this.N === 0 || this.countCategories === 0) {
      return [];
    }
    
    const expectedN = this.getExpectedN();
    const categoryList = this.getCategoryList();
    
    const residual = categoryList.map((value, index) => {
      const observed = this.observedN[value] || 0;
      const expected = Array.isArray(expectedN) ? expectedN[index] : expectedN;
      return observed - expected;
    });
    
    return residual;
  }
  
  getChiSquareValue() {
    if (this.memo.chiSquare) return this.memo.chiSquare;
    
    const expectedN = this.getExpectedN();
    const categoryList = this.getCategoryList();
    let chiSum = 0;
    
    if (Array.isArray(expectedN)) {
      categoryList.forEach((category, index) => {
        const obs = this.observedN[category] || 0;
        const exp = expectedN[index];
        if (exp > 0) {
          const diff = obs - exp;
          chiSum += (diff * diff) / exp;
        }
      });
    } else {
      Object.values(this.observedN).forEach(obs => {
        const exp = expectedN;
        if (exp > 0) {
          const diff = obs - exp;
          chiSum += (diff * diff) / exp;
        }
      });

      if (this.expectedRange.useSpecifiedRange && 
        this.rangeValue.lowerValue !== null && 
        this.rangeValue.upperValue !== null) {
        const missingCategories = this.countCategories - Object.keys(this.observedN).length;
        if (missingCategories > 0 && expectedN > 0) {
          chiSum += expectedN * missingCategories;
        }
      }
    }
    
    this.memo.chiSquare = chiSum;
    return chiSum;
  }
  
  getDegreesOfFreedom() {
    if (this.memo.df) return this.memo.df;
    
    let df;
    if (this.expectedRange.useSpecifiedRange && 
      this.rangeValue.lowerValue !== null && 
      this.rangeValue.upperValue !== null) {
      df = this.rangeValue.upperValue - this.rangeValue.lowerValue;
    } else {
      df = this.countCategories - 1;
    }
    
    this.memo.df = df;
    return df;
  }
  
  getPValue() {
    if (this.memo.pValue) return this.memo.pValue;
    
    const chiValue = this.getChiSquareValue();
    const df = this.getDegreesOfFreedom();
    
    let pValue = null;
    try {
      pValue = 1 - global.self.stdlibstatsBaseDistsChisquareCdf(chiValue, df);
    } catch (e) {
      console.error("Error calculating Chi-square p-value:", e);
    }
    
    this.memo.pValue = pValue;
    return pValue;
  }
  
  getFrequencies() {
    if (this.N === 0 || this.countCategories === 0) {
      return {
        categoryList: [],
        observedN: [],
        expectedN: [],
        residual: [],
        N: 0
      };
    }

    const expectedN = this.getExpectedN();
    const residual = this.getResidual();
    const categoryList = this.getCategoryList();
    
    let observedNList = [];
    let expectedNList = [];

    categoryList.forEach((value, index) => {
      const observed = this.observedN[value] || 0;
      const expected = Array.isArray(expectedN) ? expectedN[index] : expectedN;
      observedNList.push(observed);
      expectedNList.push(expected);
    });

    return {
      categoryList,
      observedN: observedNList,
      expectedN: expectedNList,
      residual,
      N: this.N
    };
  }
  
  getTestStatistics() {  
    if (this.countCategories <= 1) {
      return {
        ChiSquare: null,
        DF: null,
        PValue: null
      };
    }
    const chiSquare = this.getChiSquareValue();
    const df = this.getDegreesOfFreedom();
    const pValue = this.getPValue();

    return {
      ChiSquare: chiSquare,
      DF: df,
      PValue: pValue
    };
  }
  
  getOutput() {
    let hasInsufficientData = false;
    let insufficientType = [];
    if (this.validData.length === 0) {
      hasInsufficientData = true;
      insufficientType.push('empty');
    }
    if (this.countCategories <= 1) {
      hasInsufficientData = true;
      insufficientType.push('single');
    }
    const frequencies = this.getFrequencies();
    const testStatistics = this.getTestStatistics();

    return {
      variable1: this.variable1,
      frequencies,
      testStatistics,
      metadata: {
        hasInsufficientData,
        insufficientType,
        variableLabel: this.variable1.label || '',
        variableName: this.variable1.name,
      }
    };
  }
};

// -------------------------------------------------------------
//  Unit tests
// -------------------------------------------------------------

describe('ChiSquareCalculator', () => {
    const variable = {
        name: 'testVar',
        label: 'Test Variable',
        measure: 'scale',
        missing: {}
    };

    describe('Basic Chi-Square Test Statistics', () => {
        const data = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4];
        const calc = new ChiSquareCalculator({ 
            variable1: variable, 
            data1: data
        });

        it('should compute the correct sample sizes', () => {
            expect(calc.getN()).toBe(10);
            expect(calc.getValidN()).toBe(10);
        });

        it('should compute the correct number of categories', () => {
            expect(calc.getCountCategories()).toBe(4);
        });

        it('should compute the correct expected frequencies', () => {
            const expectedN = calc.getExpectedN();
            expect(expectedN).toBe(2.5); // 10 data points / 4 categories
        });

        it('should compute the correct category list', () => {
            const categoryList = calc.getCategoryList();
            expect(categoryList).toEqual([1, 2, 3, 4]);
        });

        it('should compute the correct observed frequencies', () => {
            const frequencies = calc.getFrequencies();
            expect(frequencies.observedN).toEqual([1, 2, 3, 4]);
            expect(frequencies.categoryList).toEqual([1, 2, 3, 4]);
        });

        it('should compute the correct test statistics', () => {
            const stats = calc.getTestStatistics();
            expect(stats.ChiSquare).toBeGreaterThan(0);
            expect(stats.DF).toBe(3); // 4 categories - 1
            expect(stats.PValue).toBeDefined();
        });
    });
    
    describe('Chi-Square Test with Custom Expected Values', () => {
            const data = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4];
        const calc = new ChiSquareCalculator({ 
            variable1: variable, 
            data1: data,
            options: {
                expectedValue: { values: true, allCategoriesEqual: false },
                expectedValueList: [1, 2, 3, 4]
            }
        });

        it('should use custom expected values', () => {
            const expectedN = calc.getExpectedN();
            expect(expectedN).toEqual([1, 2, 3, 4]);
        });

        it('should compute correct residuals with custom expected values', () => {
            const residual = calc.getResidual();
            expect(residual).toEqual([0, 0, 0, 0]); // observed - expected = [1-1, 2-2, 3-3, 4-4]
        });
    });
    
    describe('Chi-Square Test with Range Specification', () => {
        const data = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 6];
        const calc = new ChiSquareCalculator({ 
            variable1: variable, 
            data1: data,
            options: {
                expectedRange: { useSpecifiedRange: true },
                rangeValue: { lowerValue: 2, upperValue: 4 }
            }
        });

        it('should filter data based on specified range', () => {
            expect(calc.getValidN()).toBe(9); // Only values 2, 3, 4
            expect(calc.getCountCategories()).toBe(3); // 3 categories: 2, 3, 4
        });

        it('should compute correct degrees of freedom for range', () => {
            const stats = calc.getTestStatistics();
            expect(stats.DF).toBe(2); // 3 categories - 1
        });
    });
    
    describe('Insufficient Data Cases', () => {
        
        describe('Empty data case', () => {
            it('should handle completely empty data', () => {
                const emptyData = [];
                const calc = new ChiSquareCalculator({ 
                    variable1: variable, 
                    data1: emptyData
                });
                
                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(true);
                expect(output.metadata.insufficientType).toContain('empty');
                expect(output.metadata.insufficientType).toContain('single');
                expect(calc.getValidN()).toBe(0);
                expect(calc.getCountCategories()).toBe(0);
            });

            it('should handle all null/undefined values', () => {
                const nullData = [null, null, null, null];
                const calc = new ChiSquareCalculator({ 
                    variable1: variable, 
                    data1: nullData
                });
                
                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(true);
                expect(output.metadata.insufficientType).toContain('empty');
                expect(output.metadata.insufficientType).toContain('single');
                expect(calc.getValidN()).toBe(0);
                expect(calc.getCountCategories()).toBe(0);
            });

            it('should handle all missing values', () => {
                const missingData = [-99, -99, -99, -99];
                const variableWithMissing = {
                    ...variable,
                    missing: { discrete: [-99] }
                };
                const calc = new ChiSquareCalculator({ 
                    variable1: variableWithMissing, 
                    data1: missingData
                });
                
                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(true);
                expect(output.metadata.insufficientType).toContain('empty');
                expect(output.metadata.insufficientType).toContain('single');
                expect(calc.getValidN()).toBe(0);
                expect(calc.getCountCategories()).toBe(0);
            });

            it('should handle all non-numeric values', () => {
                const nonNumericData = ['abc', 'def', 'ghi', 'jkl'];
                const calc = new ChiSquareCalculator({ 
                    variable1: variable, 
                    data1: nonNumericData
                });
                
                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(true);
                expect(output.metadata.insufficientType).toContain('empty');
                expect(output.metadata.insufficientType).toContain('single');
                expect(calc.getValidN()).toBe(0);
                expect(calc.getCountCategories()).toBe(0);
            });

            it('should handle mixed valid and invalid data', () => {
                const mixedData = [1, null, 2, undefined, 3, 'abc', 4, -99];
                const variableWithMissing = {
                    ...variable,
                    missing: { discrete: [-99] }
                };
                const calc = new ChiSquareCalculator({ 
                    variable1: variableWithMissing, 
                    data1: mixedData
                });
                
                const output = calc.getOutput();
                // After filtering, should have sufficient data
                expect(output.metadata.hasInsufficientData).toBe(false);
                expect(calc.getValidN()).toBe(4);
                expect(calc.getCountCategories()).toBe(4);
            });
        });

        describe('Single category case', () => {
            it('should handle single category data', () => {
                const singleCategoryData = [5, 5, 5, 5, 5, 5];
                const calc = new ChiSquareCalculator({ 
                    variable1: variable, 
                    data1: singleCategoryData
                });
                
                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(true);
                expect(output.metadata.insufficientType).toContain('single');
                expect(calc.getValidN()).toBe(6);
                expect(calc.getCountCategories()).toBe(1);
            });

            it('should handle single category after filtering', () => {
                const dataWithMissing = [5, null, 5, undefined, 5, 'abc', 5];
                const calc = new ChiSquareCalculator({ 
                    variable1: variable, 
                    data1: dataWithMissing
                });
                
                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(true);
                expect(output.metadata.insufficientType).toContain('single');
                expect(calc.getValidN()).toBe(4);
                expect(calc.getCountCategories()).toBe(1);
            });

            it('should handle range with single category', () => {
                const data = [1, 2, 3, 4, 5, 6];
                const calc = new ChiSquareCalculator({ 
                    variable1: variable, 
                    data1: data,
                    options: {
                        expectedRange: { useSpecifiedRange: true },
                        rangeValue: { lowerValue: 5, upperValue: 5 }
                    }
                });
                
                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(true);
                expect(output.metadata.insufficientType).toContain('single');
                expect(calc.getCountCategories()).toBe(1);
            });
        });

                 describe('Edge cases with range specification', () => {
             it('should handle empty range', () => {
                 const data = [1, 2, 3, 4, 5];
                 const calc = new ChiSquareCalculator({ 
                     variable1: variable, 
                     data1: data,
                     options: {
                         expectedRange: { useSpecifiedRange: true },
                         rangeValue: { lowerValue: 10, upperValue: 15 }
                     }
                 });
                 
                 const output = calc.getOutput();
                 expect(output.metadata.hasInsufficientData).toBe(true);
                 expect(output.metadata.insufficientType).toContain('empty');
                 expect(calc.getValidN()).toBe(0);
                 expect(calc.getCountCategories()).toBe(0); // When no valid data, countCategories is set to 0
             });

             it('should handle range with no data in range', () => {
                 const data = [1, 2, 3, 4, 5];
                 const calc = new ChiSquareCalculator({ 
                     variable1: variable, 
                     data1: data,
                     options: {
                         expectedRange: { useSpecifiedRange: true },
                         rangeValue: { lowerValue: 6, upperValue: 10 }
                     }
                 });
                 
                 const output = calc.getOutput();
                 expect(output.metadata.hasInsufficientData).toBe(true);
                 expect(output.metadata.insufficientType).toContain('empty');
                 expect(calc.getValidN()).toBe(0);
                 expect(calc.getCountCategories()).toBe(0); // When no valid data, countCategories is set to 0
             });
         });

        describe('Mixed insufficient data cases', () => {
            it('should handle multiple insufficient data types', () => {
                const data = [5]; // Single value
                const calc = new ChiSquareCalculator({ 
                    variable1: variable, 
                    data1: data
                });
                
                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(true);
                expect(output.metadata.insufficientType).toContain('single');
                expect(calc.getValidN()).toBe(1);
                expect(calc.getCountCategories()).toBe(1);
            });

            it('should handle edge cases with decimal values', () => {
                const data = [1.5, 1.5, 1.5, 1.5, 1.5];
                const calc = new ChiSquareCalculator({ 
                    variable1: variable, 
                    data1: data
                });
                
                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(true);
                expect(output.metadata.insufficientType).toContain('single');
                expect(calc.getValidN()).toBe(5);
                expect(calc.getCountCategories()).toBe(1);
            });
        });

        describe('Sufficient data cases', () => {
            it('should handle sufficient data with multiple categories', () => {
                const data = [1, 1, 2, 2, 3, 3, 4, 4];
                const calc = new ChiSquareCalculator({ 
                    variable1: variable, 
                    data1: data
                });
                
                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(false);
                expect(calc.getValidN()).toBe(8);
                expect(calc.getCountCategories()).toBe(4);
            });

            it('should handle sufficient data with range specification', () => {
                const data = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 6];
                const calc = new ChiSquareCalculator({ 
                    variable1: variable, 
                    data1: data,
                    options: {
                        expectedRange: { useSpecifiedRange: true },
                        rangeValue: { lowerValue: 2, upperValue: 4 }
                    }
                });
                
                const output = calc.getOutput();
                expect(output.metadata.hasInsufficientData).toBe(false);
                expect(calc.getValidN()).toBe(9);
                expect(calc.getCountCategories()).toBe(3);
            });
        });

        describe('Test statistics with insufficient data', () => {
            it('should return null test statistics for insufficient data', () => {
                const data = [5, 5, 5, 5]; // Single category
                const calc = new ChiSquareCalculator({ 
                    variable1: variable, 
                    data1: data
                });
                
                const stats = calc.getTestStatistics();
                expect(stats.ChiSquare).toBe(null);
                expect(stats.DF).toBe(null);
                expect(stats.PValue).toBe(null);
            });

            it('should return empty frequencies for insufficient data', () => {
                const data = []; // Empty data
                const calc = new ChiSquareCalculator({ 
                    variable1: variable, 
                    data1: data
                });
                
                const frequencies = calc.getFrequencies();
                expect(frequencies.categoryList).toEqual([]);
                expect(frequencies.observedN).toEqual([]);
                expect(frequencies.expectedN).toEqual([]);
                expect(frequencies.residual).toEqual([]);
                expect(frequencies.N).toBe(0);
            });
        });
    });
}); 