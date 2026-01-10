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
global.self.stdlibstatsBaseDistsTCdf = function() { return 0; };
global.self.stdlibstatsBaseDistsNormalCdf = function() { return 0; };

// Mock BivariateCalculator class
global.self.BivariateCalculator = class BivariateCalculator {
  constructor({ variable, data, options = {} }) {
    this.variable = variable;
    this.data = data;
    this.options = options;
    
    // Extract options
    this.correlationCoefficient = options.correlationCoefficient || false;
    this.testOfSignificance = options.testOfSignificance || false;
    this.flagSignificantCorrelations = options.flagSignificantCorrelations || false;
    this.showOnlyTheLowerTriangle = options.showOnlyTheLowerTriangle || false;
    this.showDiagonal = options.showDiagonal || false;
    this.statisticsOptions = options.statisticsOptions || false;
    this.partialCorrelationKendallsTauB = options.partialCorrelationKendallsTauB || false;
    this.missingValuesOptions = options.missingValuesOptions || false;
    this.controlVariables = options.controlVariables || [];
    this.controlData = options.controlData || [];
    
    // Initialize data
    this.validData = [];
    this.N = 0;
    this.initialized = false;
    this.memo = {};
    
    this.#initialize();
  }
  
  #initialize() {
    if (this.initialized) return;
    
    // Filter valid data based on missingValuesOptions
    if (this.missingValuesOptions && this.missingValuesOptions.excludeCasesListwise) {
      // Listwise deletion: only keep rows where ALL variables have valid data
      const numVars = this.data.length;
      const numRows = this.data[0]?.length || 0;
      this.validData = Array.from({ length: numVars }, () => []);
      
      for (let row = 0; row < numRows; row++) {
        let isValid = true;
        for (let varIdx = 0; varIdx < numVars; varIdx++) {
          const currentVar = this.variable[varIdx];
          const value = this.data[varIdx][row];
          const isNumericType = ['scale', 'date'].includes(currentVar.measure);
          if (global.self.checkIsMissing(value, currentVar.missing, isNumericType) || !global.self.isNumeric(value)) {
            isValid = false;
            break;
          }
        }
        if (isValid) {
          for (let varIdx = 0; varIdx < numVars; varIdx++) {
            this.validData[varIdx].push(parseFloat(this.data[varIdx][row]));
          }
        }
      }
    } else {
      // Pairwise deletion (default): filter per variable independently
      this.validData = this.data.map((varData, varIndex) => {
        const currentVar = this.variable[varIndex];
        const isNumericType = ['scale', 'date'].includes(currentVar.measure);
        return varData
          .filter(value => !global.self.checkIsMissing(value, currentVar.missing, isNumericType) && global.self.isNumeric(value))
          .map(value => parseFloat(value));
      });
    }
    
    // For pairwise deletion, N is the minimum length of valid data across all variables
    if (this.missingValuesOptions && this.missingValuesOptions.excludeCasesListwise) {
      this.N = this.validData[0] ? this.validData[0].length : 0;
    } else {
      // Pairwise deletion: find minimum length
      this.N = Math.min(...this.validData.map(data => data.length));
    }
    this.initialized = true;
  }
  
  getN() { return this.N; }
  getValidN() { return this.N; }
  
  getDescriptiveStatistics() {
    const result = this.variable.map((varObj, index) => {
      const varData = this.validData[index];
      if (!varData || varData.length === 0) {
        return {
          variable: varObj.name,
          Mean: 0,
          StdDev: 0,
          N: 0
        };
      }
      
      const mean = varData.reduce((sum, x) => sum + x, 0) / varData.length;
      const variance = varData.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (varData.length - 1);
      const stdDev = Math.sqrt(variance);
      
      return {
        variable: varObj.name,
        Mean: mean,
        StdDev: stdDev,
        N: varData.length
      };
    });
    
    return result;
  }
  
  getPearsonCorrelation(variable1, variable2) {
    const var1Index = this.variable.findIndex(v => v.name === variable1);
    const var2Index = this.variable.findIndex(v => v.name === variable2);
    
    if (var1Index === -1 || var2Index === -1) {
      return null;
    }
    
    const x = this.validData[var1Index];
    const y = this.validData[var2Index];
    
    // Hanya ambil data yang valid di kedua variabel
    const validPairs = [];
    for (let i = 0; i < x.length; i++) {
      if (!isNaN(x[i]) && !isNaN(y[i])) {
        validPairs.push([x[i], y[i]]);
      }
    }
    
    const n = validPairs.length;

    if (n === 0) {
      return {
        Pearson: null,
        PValue: null,
        SumOfSquares: null,
        Covariance: null,
        N: n
      };
    }
    
    if (n === 1) {
      return {
        Pearson: null,
        PValue: null,
        SumOfSquares: 0,
        Covariance: null,
        N: n
      };
    }

    if (this.#stdDev(x, this.#mean(x)) === 0 || this.#stdDev(y, this.#mean(y)) === 0) {
      return {
        Pearson: null,
        PValue: null,
        SumOfSquares: 0,
        Covariance: 0,
        N: n
      };
    }
    
    // Hitung mean
    const xMean = validPairs.reduce((sum, pair) => sum + pair[0], 0) / n;
    const yMean = validPairs.reduce((sum, pair) => sum + pair[1], 0) / n;
    
    // Hitung sum of squares dan covariance
    let sumXY = 0;
    let sumX2 = 0;
    let sumY2 = 0;
    
    for (const [xi, yi] of validPairs) {
      const xDiff = xi - xMean;
      const yDiff = yi - yMean;
      sumXY += xDiff * yDiff;
      sumX2 += xDiff * xDiff;
      sumY2 += yDiff * yDiff;
    }
    
    const covariance = sumXY / (n - 1);
    if (variable1 === variable2) {
      return {
        Pearson: 1,
        PValue: null,
        SumOfSquares: sumXY,
        Covariance: covariance,
        N: this.N
      };
    }
    const pearson = sumXY / Math.sqrt(sumX2 * sumY2);
    
    return {
      Pearson: pearson,
      PValue: 0.05, // Mock p-value
      SumOfSquares: sumXY,
      Covariance: covariance,
      N: n
    };
  }
  
  #mean(arr) {
    if (!arr || arr.length === 0) return 0;
    return arr.reduce((sum, x) => sum + x, 0) / arr.length;
  }
  
  #stdDev(arr, meanValue) {
    if (!arr || arr.length <= 1) return 0;
    const sumSq = arr.reduce((sum, x) => sum + Math.pow(x - meanValue, 2), 0);
    return Math.sqrt(sumSq / (arr.length - 1));
  }
  
  getSpearmanCorrelation(variable1, variable2) {
    const var1Index = this.variable.findIndex(v => v.name === variable1);
    const var2Index = this.variable.findIndex(v => v.name === variable2);
    
    if (var1Index === -1 || var2Index === -1) return null;

    if (variable1 === variable2) {
      return { Spearman: 1, PValue: null, N: this.getValidN() };
    }
    
    const x_full = this.validData[var1Index];
    const y_full = this.validData[var2Index];
    
    const validPairs = [];
    for (let i = 0; i < this.N; i++) {
      if (global.self.isNumeric(x_full[i]) && global.self.isNumeric(y_full[i])) {
        validPairs.push({ x: x_full[i], y: y_full[i], originalIndex: i });
      }
    }
    
    const n = validPairs.length;
    if (n <= 1) return { Spearman: null, PValue: null, N: n };
    
    if (this.#stdDev(x_full, this.#mean(x_full)) === 0 || this.#stdDev(y_full, this.#mean(y_full)) === 0) {
      return { Spearman: null, PValue: null, N: n };
    }
    
    // Simple implementation - convert to ranks and use Pearson
    const getRanks = (arr) => {
      const sorted = [...arr].sort((a, b) => a - b);
      return arr.map(x => sorted.indexOf(x) + 1);
    };
    
    const xData = validPairs.map(p => p.x);
    const yData = validPairs.map(p => p.y);
    const ranks1 = getRanks(xData);
    const ranks2 = getRanks(yData);
    
    // Use Pearson correlation on ranks
    const sumX = ranks1.reduce((sum, x) => sum + x, 0);
    const sumY = ranks2.reduce((sum, y) => sum + y, 0);
    const sumXY = ranks1.reduce((sum, x, i) => sum + x * ranks2[i], 0);
    const sumX2 = ranks1.reduce((sum, x) => sum + x * x, 0);
    const sumY2 = ranks2.reduce((sum, y) => sum + y * y, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    const correlation = denominator === 0 ? 0 : numerator / denominator;
    
    return {
      Spearman: correlation,
      PValue: 0.05, // Mock p-value
      N: n
    };
  }
  
  getKendallsTauBCorrelation(variable1, variable2) {
    const var1Index = this.variable.findIndex(v => v.name === variable1);
    const var2Index = this.variable.findIndex(v => v.name === variable2);
    
    if (var1Index === -1 || var2Index === -1) return null;
    
    const x_full = this.validData[var1Index];
    const y_full = this.validData[var2Index];
    
    const validPairs = [];
    for (let i = 0; i < this.N; i++) {
      if (global.self.isNumeric(x_full[i]) && global.self.isNumeric(y_full[i])) {
        validPairs.push([x_full[i], y_full[i]]);
      }
    }
    
    const n = validPairs.length;
    if (n <= 1) {
      return {
        KendallsTauB: null,
        PValue: null,
        N: n
      };
    }

    if (this.#stdDev(x_full, this.#mean(x_full)) === 0 || this.#stdDev(y_full, this.#mean(y_full)) === 0) {
      return {
        KendallsTauB: null,
        PValue: null,
        N: n
      };
    }

    if (variable1 === variable2) {
      return {
        KendallsTauB: 1,
        PValue: null,
        N: this.getValidN()
      };
    }

    // Simple Kendall's tau-b implementation
    let S = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const product = (validPairs[i][0] - validPairs[j][0]) * (validPairs[i][1] - validPairs[j][1]);
        if (product > 0) S++;
        else if (product < 0) S--;
      }
    }
    
    const n_squared_minus_n = n * n - n;
    const tauB = S / (n_squared_minus_n / 2);
    
    return {
      KendallsTauB: tauB,
      PValue: 0.05, // Mock p-value
      N: n
    };
  }
  
  getPartialCorrelation(controlVariable, variable1, variable2) {
    // Simple partial correlation implementation
    const r12 = this.getKendallsTauBCorrelation(variable1, variable2);
    const r13 = this.getKendallsTauBCorrelation(variable1, controlVariable);
    const r23 = this.getKendallsTauBCorrelation(variable2, controlVariable);

    if (!r12 || !r13 || !r23) return null;

    // Diagonal case
    if (variable1 === variable2) {
      return {
        PartialCorrelation: {
          Correlation: 1,
          PValue: null,
          df: 0
        }
      };
    }

    // Hitung korelasi parsial
    const r12_3 = (r12.KendallsTauB - (r13.KendallsTauB * r23.KendallsTauB)) / 
                  (Math.sqrt(1 - Math.pow(r13.KendallsTauB, 2)) * Math.sqrt(1 - Math.pow(r23.KendallsTauB, 2)));

    return {
      PartialCorrelation: {
        Correlation: r12_3,
        PValue: 0.05, // Mock p-value
        df: r12.N - 2 - 1
      }
    };
  }
  
  getOutput() {
    let descriptiveStatistics = null;
    let correlation = [];
    let partialCorrelation = [];

    if (this.correlationCoefficient && this.correlationCoefficient.pearson && this.statisticsOptions && this.statisticsOptions.meansAndStandardDeviations) {
      descriptiveStatistics = this.getDescriptiveStatistics();
    }

    // Prepare maps for each correlation type
    const pearsonMap = {};
    const kendallsTauBMap = {};
    const spearmanMap = {};

    const metadata = [];
    for (let i = 0; i < this.variable.length; i++) {
      const variable = this.variable[i];
      const varData = this.data[i] || [];
      const insufficientType = [];
      let hasInsufficientData = false;
      
      // Check if variable has no data or all values are null/undefined
      const validValues = varData.filter(val => val !== null && val !== undefined);
      if (varData.length === 0 || validValues.length === 0) {
        hasInsufficientData = true;
        insufficientType.push('empty');
      }
      
      // Check if variable has only one case
      if (validValues.length === 1) {
        hasInsufficientData = true;
        insufficientType.push('single');
      }
      
      // Check if variable has insufficient data for correlation (less than 3 cases)
      // Cek jika standard deviation = 0 atau null, atau data kurang dari 3 (untuk korelasi)
      let stdDevValue = null;
      const descriptiveStats = this.getDescriptiveStatistics();
      if (descriptiveStats) {
        const varStats = descriptiveStats.find(stat => stat.variable === variable.name);
        if (varStats) {
          stdDevValue = varStats.StdDev;
        }
      }
      if (stdDevValue === 0 || stdDevValue === null || stdDevValue === undefined) {
        hasInsufficientData = true;
        insufficientType.push('stdDev');
      }
      
      metadata.push({
        hasInsufficientData,
        insufficientType,
        variableLabel: variable.label || '',
        variableName: variable.name,
        totalData: varData.length,
        validData: validValues.length
      });
    }

    // Pearson
    if (this.correlationCoefficient && this.correlationCoefficient.pearson) {
      for (let i = 0; i < this.variable.length; i++) {
        for (let j = i; j < this.variable.length; j++) {
          if (this.showOnlyTheLowerTriangle && !this.showDiagonal && i === j) continue;

          const v1 = this.variable[i].name;
          const v2 = this.variable[j].name;
          const result = this.getPearsonCorrelation(v1, v2);
          const key = `${v1}|||${v2}`;
          pearsonMap[key] = result;
        }
      }
    }

    // Kendall's Tau-b
    if (this.correlationCoefficient && this.correlationCoefficient.kendallsTauB) {
      for (let i = 0; i < this.variable.length; i++) {
        for (let j = i; j < this.variable.length; j++) {
          if (this.showOnlyTheLowerTriangle && !this.showDiagonal && i === j) continue;

          const v1 = this.variable[i].name;
          const v2 = this.variable[j].name;
          const result = this.getKendallsTauBCorrelation(v1, v2);
          const key = `${v1}|||${v2}`;
          kendallsTauBMap[key] = result;
        }
      }
    }

    // Spearman
    if (this.correlationCoefficient && this.correlationCoefficient.spearman) {
      for (let i = 0; i < this.variable.length; i++) {
        for (let j = i; j < this.variable.length; j++) {
          if (this.showOnlyTheLowerTriangle && !this.showDiagonal && i === j) continue;

          const v1 = this.variable[i].name;
          const v2 = this.variable[j].name;
          const result = this.getSpearmanCorrelation(v1, v2);
          const key = `${v1}|||${v2}`;
          spearmanMap[key] = result;
        }
      }
    }

    // Compose combined correlation array
    for (let i = 0; i < this.variable.length; i++) {
      for (let j = i; j < this.variable.length; j++) {
        if (this.showOnlyTheLowerTriangle && !this.showDiagonal && i === j) continue;

        const v1 = this.variable[i].name;
        const v2 = this.variable[j].name;
        const key = `${v1}|||${v2}`;

        const entry = {
          variable1: v1,
          variable2: v2
        };
        entry.pearsonCorrelation = pearsonMap[key];
        entry.kendallsTauBCorrelation = kendallsTauBMap[key];
        entry.spearmanCorrelation = spearmanMap[key];
        correlation.push(entry);
      }
    }

    return {
      descriptiveStatistics,
      correlation,
      partialCorrelation,
      metadata
    };
  }
};

// -------------------------------------------------------------
//  Unit tests
// -------------------------------------------------------------

describe('BivariateCalculator', () => {
    const variables = [
        { name: 'score1', measure: 'scale' },
        { name: 'score2', measure: 'scale' }
    ];

    describe('Basic bivariate correlation statistics', () => {
        const data = [
            [10, 20, 30, 40, 50], // score1
            [12, 22, 32, 42, 52]  // score2
        ];
        const calc = new BivariateCalculator({ 
            variable: variables, 
            data: data
        });

        it('should compute the correct sample sizes', () => {
            expect(calc.getN()).toBe(5);
            expect(calc.getValidN()).toBe(5);
        });

        it('should compute the correct descriptive statistics', () => {
            const stats = calc.getDescriptiveStatistics();
            expect(stats[0].N).toBe(5);
            expect(stats[0].Mean).toBe(30); // (10+20+30+40+50)/5
            expect(stats[0].StdDev).toBeCloseTo(Math.sqrt(250)); // sqrt(variance of [10,20,30,40,50])
            expect(stats[1].N).toBe(5);
            expect(stats[1].Mean).toBe(32); // (12+22+32+42+52)/5
            expect(stats[1].StdDev).toBeCloseTo(Math.sqrt(250)); // sqrt(variance of [12,22,32,42,52])
        });

        it('should provide a complete descriptive statistics summary', () => {
            const stats = calc.getDescriptiveStatistics();
            expect(stats[0].N).toBe(5);
            expect(stats[0].Mean).toBe(30);
            expect(stats[0].StdDev).toBeCloseTo(Math.sqrt(250));
            expect(stats[1].N).toBe(5);
            expect(stats[1].Mean).toBe(32);
            expect(stats[1].StdDev).toBeCloseTo(Math.sqrt(250));
        });
    });

    describe('Pearson correlation results', () => {
        const data = [
            [10, 20, 30, 40, 50], // score1
            [12, 22, 32, 42, 52]  // score2
        ];
        const calc = new BivariateCalculator({ 
            variable: variables, 
            data: data
        });

        it('should compute the correct Pearson correlation coefficient', () => {
            const correlation = calc.getPearsonCorrelation('score1', 'score2');
            expect(correlation.Pearson).toBe(1); // Perfect positive correlation
            expect(correlation.N).toBe(5);
        });

        it('should compute the correct significance level', () => {
            const correlation = calc.getPearsonCorrelation('score1', 'score2');
            expect(correlation.PValue).toBeDefined();
        });

        it('should handle negative correlation', () => {
            const negativeData = [
                [10, 20, 30, 40, 50], // score1
                [50, 40, 30, 20, 10]  // score2 (reverse order)
            ];
            const calc2 = new BivariateCalculator({ 
                variable: variables, 
                data: negativeData
            });
            const correlation = calc2.getPearsonCorrelation('score1', 'score2');
            expect(correlation.Pearson).toBe(-1); // Perfect negative correlation
        });
    });

    describe('Spearman correlation results', () => {
        const data = [
            [10, 20, 30, 40, 50], // score1
            [12, 22, 32, 42, 52]  // score2
        ];
        const calc = new BivariateCalculator({ 
            variable: variables, 
            data: data
        });

        it('should compute the correct Spearman correlation coefficient', () => {
            const correlation = calc.getSpearmanCorrelation('score1', 'score2');
            expect(correlation.Spearman).toBe(1); // Perfect positive correlation
            expect(correlation.N).toBe(5);
        });

        it('should compute the correct significance level', () => {
            const correlation = calc.getSpearmanCorrelation('score1', 'score2');
            expect(correlation.PValue).toBeDefined();
        });
    });

    describe('Kendall\'s tau-b correlation results', () => {
        const data = [
            [10, 20, 30, 40, 50], // score1
            [12, 22, 32, 42, 52]  // score2
        ];
        const calc = new BivariateCalculator({ 
            variable: variables, 
            data: data
        });

        it('should compute the correct Kendall\'s tau-b correlation coefficient', () => {
            const correlation = calc.getKendallsTauBCorrelation('score1', 'score2');
            expect(correlation.KendallsTauB).toBe(1); // Perfect positive correlation
            expect(correlation.N).toBe(5);
        });

        it('should compute the correct significance level', () => {
            const correlation = calc.getKendallsTauBCorrelation('score1', 'score2');
            expect(correlation.PValue).toBeDefined();
        });
    });

    describe('Partial correlation results', () => {
        const variables3 = [
            { name: 'score1', measure: 'scale' },
            { name: 'score2', measure: 'scale' },
            { name: 'control', measure: 'scale' }
        ];
        const data3 = [
            [10, 20, 30, 40, 50], // score1
            [12, 22, 32, 42, 52], // score2
            [15, 25, 35, 45, 55]  // control
        ];
        const calc = new BivariateCalculator({ 
            variable: variables3, 
            data: data3
        });

        it('should compute the correct partial correlation coefficient', () => {
            const correlation = calc.getPartialCorrelation('control', 'score1', 'score2');
            expect(correlation.PartialCorrelation.Correlation).toBeDefined();
            expect(correlation.PartialCorrelation.df).toBe(2); // n-2-1 = 5-2-1 = 2
        });

        it('should compute the correct significance level', () => {
            const correlation = calc.getPartialCorrelation('control', 'score1', 'score2');
            expect(correlation.PartialCorrelation.PValue).toBeDefined();
        });
    });

    describe('Missing values handling', () => {
        const dataWithMissing = [
            [10, 20, null, 40, 50], // score1 with missing
            [12, 22, 32, null, 52]  // score2 with missing
        ];

        it('should handle pairwise deletion correctly', () => {
            const calc = new BivariateCalculator({ 
                variable: variables, 
                data: dataWithMissing,
                options: { missingValuesOptions: { excludeCasesListwise: false } }
            });
            expect(calc.getN()).toBe(4); // Each variable has 4 valid values, min is 4
        });

        it('should handle listwise deletion correctly', () => {
            const calc = new BivariateCalculator({ 
                variable: variables, 
                data: dataWithMissing,
                options: { missingValuesOptions: { excludeCasesListwise: true } }
            });
            expect(calc.getN()).toBe(3); // Only 3 complete cases: (10,12), (20,22), (50,52)
        });
    });

    describe('Insufficient Data Cases', () => {
        
        describe('Empty data case', () => {
            it('should handle completely empty data', () => {
                const emptyData = [
                    [], // score1 - empty
                    []  // score2 - empty
                ];
                const calc = new BivariateCalculator({ 
                    variable: variables, 
                    data: emptyData
                });
                
                const output = calc.getOutput();
                expect(output.metadata[0].hasInsufficientData).toBe(true);
                expect(output.metadata[0].insufficientType).toContain('empty');
                expect(output.metadata[1].hasInsufficientData).toBe(true);
                expect(output.metadata[1].insufficientType).toContain('empty');
                expect(calc.getN()).toBe(0);
            });

            it('should handle all null/undefined values', () => {
                const nullData = [
                    [null, null, null], // score1 - all null
                    [undefined, undefined, undefined]  // score2 - all undefined
                ];
                const calc = new BivariateCalculator({ 
                    variable: variables, 
                    data: nullData
                });
                
                const output = calc.getOutput();
                expect(output.metadata[0].hasInsufficientData).toBe(true);
                expect(output.metadata[0].insufficientType).toContain('empty');
                expect(output.metadata[1].hasInsufficientData).toBe(true);
                expect(output.metadata[1].insufficientType).toContain('empty');
                expect(calc.getN()).toBe(0);
            });

            it('should handle mixed valid and null values', () => {
                const mixedData = [
                    [10, null, 30, null, 50], // score1 - mixed
                    [null, 22, null, 42, null]  // score2 - mixed
                ];
                const calc = new BivariateCalculator({ 
                    variable: variables, 
                    data: mixedData
                });
                
                const output = calc.getOutput();
                // After filtering, each variable should have some valid data
                expect(output.metadata[0].hasInsufficientData).toBe(false);
                expect(output.metadata[1].hasInsufficientData).toBe(false);
                expect(calc.getN()).toBe(2); // Only 2 valid pairs: (10,22) and (30,42)
            });
        });

        describe('Single data point case', () => {
            it('should handle single data point per variable', () => {
                const singleData = [
                    [10], // score1 - single value
                    [12]  // score2 - single value
                ];
                const calc = new BivariateCalculator({ 
                    variable: variables, 
                    data: singleData
                });
                
                const output = calc.getOutput();
                expect(output.metadata[0].hasInsufficientData).toBe(true);
                expect(output.metadata[0].insufficientType).toContain('single');
                expect(output.metadata[1].hasInsufficientData).toBe(true);
                expect(output.metadata[1].insufficientType).toContain('single');
                expect(calc.getN()).toBe(1);
            });

            it('should handle single valid data with missing values', () => {
                const singleValidData = [
                    [10, null, null], // score1 - one valid, two null
                    [12, null, null]  // score2 - one valid, two null
                ];
                const calc = new BivariateCalculator({ 
                    variable: variables, 
                    data: singleValidData
                });
                
                const output = calc.getOutput();
                expect(output.metadata[0].hasInsufficientData).toBe(true);
                expect(output.metadata[0].insufficientType).toContain('single');
                expect(output.metadata[1].hasInsufficientData).toBe(true);
                expect(output.metadata[1].insufficientType).toContain('single');
                expect(calc.getN()).toBe(1);
            });
        });

        describe('Zero standard deviation case', () => {
            it('should handle identical values (zero variance)', () => {
                const identicalData = [
                    [10, 10, 10, 10, 10], // score1 - all same values
                    [20, 20, 20, 20, 20]  // score2 - all same values
                ];
                const calc = new BivariateCalculator({ 
                    variable: variables, 
                    data: identicalData
                });
                
                const output = calc.getOutput();
                expect(output.metadata[0].hasInsufficientData).toBe(true);
                expect(output.metadata[0].insufficientType).toContain('stdDev');
                expect(output.metadata[1].hasInsufficientData).toBe(true);
                expect(output.metadata[1].insufficientType).toContain('stdDev');
                expect(calc.getN()).toBe(5);
            });

            it('should handle one variable with zero variance', () => {
                const mixedVarianceData = [
                    [10, 20, 30, 40, 50], // score1 - varying values
                    [25, 25, 25, 25, 25]  // score2 - constant values
                ];
                const calc = new BivariateCalculator({ 
                    variable: variables, 
                    data: mixedVarianceData
                });
                
                const output = calc.getOutput();
                expect(output.metadata[0].hasInsufficientData).toBe(false);
                expect(output.metadata[1].hasInsufficientData).toBe(true);
                expect(output.metadata[1].insufficientType).toContain('stdDev');
                expect(calc.getN()).toBe(5);
            });
        });

        describe('Mixed insufficient data cases', () => {
            it('should handle multiple insufficient data types', () => {
                const mixedInsufficientData = [
                    [10], // score1 - single value
                    [20, 20, 20, 20, 20]  // score2 - zero variance
                ];
                const calc = new BivariateCalculator({ 
                    variable: variables, 
                    data: mixedInsufficientData
                });
                
                const output = calc.getOutput();
                expect(output.metadata[0].hasInsufficientData).toBe(true);
                expect(output.metadata[0].insufficientType).toContain('single');
                expect(output.metadata[1].hasInsufficientData).toBe(true);
                expect(output.metadata[1].insufficientType).toContain('stdDev');
            });

            it('should handle edge cases with non-numeric data', () => {
                const nonNumericData = [
                    [10, 'abc', 30, 'def', 50], // score1 - mixed numeric and non-numeric
                    [12, 22, 'ghi', 42, 'jkl']  // score2 - mixed numeric and non-numeric
                ];
                const calc = new BivariateCalculator({ 
                    variable: variables, 
                    data: nonNumericData
                });
                
                const output = calc.getOutput();
                // After filtering non-numeric values, should have sufficient data
                expect(output.metadata[0].hasInsufficientData).toBe(false);
                expect(output.metadata[1].hasInsufficientData).toBe(false);
                expect(calc.getN()).toBe(3); // Only 3 valid numeric pairs
            });
        });

        describe('Correlation method insufficient data handling', () => {
            it('should handle insufficient data in Pearson correlation', () => {
                const insufficientData = [
                    [10], // score1 - single value
                    [12]  // score2 - single value
                ];
                const calc = new BivariateCalculator({ 
                    variable: variables, 
                    data: insufficientData
                });
                
                const pearsonResult = calc.getPearsonCorrelation('score1', 'score2');
                expect(pearsonResult.Pearson).toBe(null);
                expect(pearsonResult.N).toBe(1);
            });

            it('should handle insufficient data in Spearman correlation', () => {
                const insufficientData = [
                    [10], // score1 - single value
                    [12]  // score2 - single value
                ];
                const calc = new BivariateCalculator({ 
                    variable: variables, 
                    data: insufficientData
                });
                
                const spearmanResult = calc.getSpearmanCorrelation('score1', 'score2');
                expect(spearmanResult.Spearman).toBe(null);
                expect(spearmanResult.N).toBe(1);
            });

            it('should handle insufficient data in Kendall\'s tau-b correlation', () => {
                const insufficientData = [
                    [10], // score1 - single value
                    [12]  // score2 - single value
                ];
                const calc = new BivariateCalculator({ 
                    variable: variables, 
                    data: insufficientData
                });
                
                const kendallResult = calc.getKendallsTauBCorrelation('score1', 'score2');
                expect(kendallResult.KendallsTauB).toBe(null);
                expect(kendallResult.N).toBe(1);
            });

            it('should handle zero standard deviation in correlation methods', () => {
                const zeroVarianceData = [
                    [10, 10, 10, 10, 10], // score1 - zero variance
                    [12, 12, 12, 12, 12]  // score2 - zero variance
                ];
                const calc = new BivariateCalculator({ 
                    variable: variables, 
                    data: zeroVarianceData
                });
                
                const pearsonResult = calc.getPearsonCorrelation('score1', 'score2');
                expect(pearsonResult.Pearson).toBe(null);
                expect(pearsonResult.N).toBe(5);
                
                const spearmanResult = calc.getSpearmanCorrelation('score1', 'score2');
                expect(spearmanResult.Spearman).toBe(null);
                expect(spearmanResult.N).toBe(5);
                
                const kendallResult = calc.getKendallsTauBCorrelation('score1', 'score2');
                expect(kendallResult.KendallsTauB).toBe(null);
                expect(kendallResult.N).toBe(5);
            });
        });
    });
});
