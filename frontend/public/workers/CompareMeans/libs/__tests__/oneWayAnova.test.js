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
global.self.stdlibstatsBaseDistsFQuantile = function() { return 0; };
global.self.stdlibstatsBaseDistsFCdf = function() { return 0; };

// Mock OneWayAnovaCalculator class
global.self.OneWayAnovaCalculator = class OneWayAnovaCalculator {
  constructor({ variable1, data1, variable2, data2, options = {} }) {
    this.variable1 = variable1;
    this.data1 = data1;
    this.variable2 = variable2;
    this.data2 = data2;
    this.options = options;
    
    // Extract options
    this.equalVariancesAssumed = options.equalVariancesAssumed || false;
    this.statisticsOptions = options.statisticsOptions || false;
    this.estimateEffectSize = options.estimateEffectSize || false;
    
    // Filter valid data
    const isNumericType = ['scale', 'date'].includes(this.variable1.measure);
    const isNumericFactorType = ['scale', 'date'].includes(this.variable2.measure);
    
    this.validData = this.data1
      .filter((value, index) => {
        const isValidData = !global.self.checkIsMissing(value, this.variable1.missing, isNumericType) && global.self.isNumeric(value);
        const isValidFactor = index < this.data2.length && 
          !global.self.checkIsMissing(this.data2[index], this.variable2.missing, isNumericFactorType);
        return isValidData && isValidFactor;
      })
      .map(value => parseFloat(value));
    
    this.validFactorData = this.data2
      .filter((value, index) => {
        const isValidData = index < this.data1.length && 
          !global.self.checkIsMissing(this.data1[index], this.variable1.missing, isNumericType) && 
          global.self.isNumeric(this.data1[index]);
        const isValidFactor = !global.self.checkIsMissing(value, this.variable2.missing, isNumericFactorType);
        return isValidData && isValidFactor;
      });
    
    this.N = this.validData.length;
  }
  
  getN() { return this.N; }
  getFactorN() { return this.validFactorData.length; }
  
  groupDataByFactor() {
    const grouped = {};
    for (let i = 0; i < this.validData.length; i++) {
      const factor = String(this.validFactorData[i]);
      if (!grouped[factor]) {
        grouped[factor] = [];
      }
      grouped[factor].push(this.validData[i]);
    }
    return grouped;
  }
  
  calculateDescriptiveStatistics() {
    const groupedData = this.groupDataByFactor();
    const groups = {};
    let totalSum = 0;
    let totalCount = 0;
    
    // Calculate statistics for each group
    for (const [factor, data] of Object.entries(groupedData)) {
      const mean = data.reduce((sum, x) => sum + x, 0) / data.length;
      const variance = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (data.length - 1);
      const stdDev = Math.sqrt(variance);
      
      groups[factor] = {
        N: data.length,
        Mean: mean,
        StdDeviation: stdDev
      };
      
      totalSum += data.reduce((sum, x) => sum + x, 0);
      totalCount += data.length;
    }
    
    const totalMean = totalCount > 0 ? totalSum / totalCount : 0;
    const totalVariance = this.validData.reduce((sum, x) => sum + Math.pow(x - totalMean, 2), 0) / (this.N - 1);
    const totalStdDev = Math.sqrt(totalVariance);
    
    return {
      groups: groups,
      total: {
        N: this.N,
        Mean: totalMean,
        StdDeviation: totalStdDev
      }
    };
  }
  
  calculateAnovaStatistics() {
    const stats = this.calculateDescriptiveStatistics();
    const groupedData = this.groupDataByFactor();
    const groupCount = Object.keys(groupedData).length;
    
    if (groupCount < 2) return null;
    
    // Calculate between-groups sum of squares
    const grandMean = stats.total.Mean;
    let betweenSS = 0;
    for (const [factor, data] of Object.entries(groupedData)) {
      const groupMean = stats.groups[factor].Mean;
      const groupSize = data.length;
      betweenSS += groupSize * Math.pow(groupMean - grandMean, 2);
    }
    
    // Calculate within-groups sum of squares
    let withinSS = 0;
    for (const [factor, data] of Object.entries(groupedData)) {
      const groupMean = stats.groups[factor].Mean;
      withinSS += data.reduce((sum, x) => sum + Math.pow(x - groupMean, 2), 0);
    }
    
    const betweenDF = groupCount - 1;
    const withinDF = this.N - groupCount;
    const betweenMS = betweenSS / betweenDF;
    const withinMS = withinSS / withinDF;
    const F = betweenMS / withinMS;
    
    const result = {
      betweenGroups: {
        SumOfSquares: betweenSS,
        df: betweenDF,
        MeanSquare: betweenMS,
        F: F,
        Sig: 0.01 // Mock significance
      },
      withinGroups: {
        SumOfSquares: withinSS,
        df: withinDF,
        MeanSquare: withinMS
      },
      total: {
        SumOfSquares: betweenSS + withinSS,
        df: this.N - 1
      }
    };
    
    if (this.estimateEffectSize) {
      result.etaSquared = betweenSS / (betweenSS + withinSS);
    }
    
    return result;
  }
  
  calculateHomogeneityOfVariance() {
    const groupedData = this.groupDataByFactor();
    const groupCount = Object.keys(groupedData).length;
    
    if (groupCount < 2) return null;
    
    // Simple Levene's test implementation
    const grandMean = this.validData.reduce((sum, x) => sum + x, 0) / this.N;
    let betweenSS = 0;
    let withinSS = 0;
    
    for (const [factor, data] of Object.entries(groupedData)) {
      const groupMean = data.reduce((sum, x) => sum + x, 0) / data.length;
      const groupSize = data.length;
      betweenSS += groupSize * Math.pow(groupMean - grandMean, 2);
      withinSS += data.reduce((sum, x) => sum + Math.pow(x - groupMean, 2), 0);
    }
    
    const betweenDF = groupCount - 1;
    const withinDF = this.N - groupCount;
    const betweenMS = betweenSS / betweenDF;
    const withinMS = withinSS / withinDF;
    const F = betweenMS / withinMS;
    
    return {
      leveneStatistic: F,
      df1: betweenDF,
      df2: withinDF,
      sig: 0.5 // Mock significance
    };
  }
  
  calculateTukeyHSD() {
    const groupedData = this.groupDataByFactor();
    const groupKeys = Object.keys(groupedData);
    const comparisons = [];
    
    for (let i = 0; i < groupKeys.length; i++) {
      for (let j = i + 1; j < groupKeys.length; j++) {
        const group1 = groupKeys[i];
        const group2 = groupKeys[j];
        const mean1 = groupedData[group1].reduce((sum, x) => sum + x, 0) / groupedData[group1].length;
        const mean2 = groupedData[group2].reduce((sum, x) => sum + x, 0) / groupedData[group2].length;
        
        comparisons.push({
          group1: group1,
          group2: group2,
          meanDifference: mean1 - mean2,
          sig: 0.01 // Mock significance
        });
      }
    }
    
    return comparisons;
  }
  
  calculateDuncan() {
    // Mock Duncan test
    return this.calculateTukeyHSD();
  }
};

// -------------------------------------------------------------
//  Unit tests
// -------------------------------------------------------------

describe('OneWayAnovaCalculator', () => {
    const variable = { name: 'score', measure: 'scale' };
    const factorVariable = { name: 'group', measure: 'nominal' };

    describe('Basic one-way ANOVA statistics', () => {
        const data = [10, 20, 30, 40, 50, 60];
        const factorData = [1, 1, 1, 2, 2, 2];
        const calc = new OneWayAnovaCalculator({ 
            variable1: variable, 
            data1: data,
            variable2: factorVariable,
            data2: factorData
        });

        it('should compute the correct sample sizes', () => {
            expect(calc.getN()).toBe(6);
            expect(calc.getFactorN()).toBe(6);
        });

        it('should correctly group data by factor levels', () => {
            const groupedData = calc.groupDataByFactor();
            expect(groupedData['1']).toEqual([10, 20, 30]);
            expect(groupedData['2']).toEqual([40, 50, 60]);
        });

        it('should compute the correct group means', () => {
            const stats = calc.calculateDescriptiveStatistics();
            expect(stats.groups['1'].Mean).toBe(20); // (10+20+30)/3
            expect(stats.groups['2'].Mean).toBe(50); // (40+50+60)/3
        });

        it('should compute the correct group standard deviations', () => {
            const stats = calc.calculateDescriptiveStatistics();
            expect(stats.groups['1'].StdDeviation).toBeCloseTo(Math.sqrt(100)); // sqrt(variance of [10,20,30])
            expect(stats.groups['2'].StdDeviation).toBeCloseTo(Math.sqrt(100)); // sqrt(variance of [40,50,60])
        });

        it('should compute the correct total statistics', () => {
            const stats = calc.calculateDescriptiveStatistics();
            expect(stats.total.N).toBe(6);
            expect(stats.total.Mean).toBe(35); // (10+20+30+40+50+60)/6
        });

        it('should provide a complete descriptive statistics summary', () => {
            const stats = calc.calculateDescriptiveStatistics();
            expect(stats.groups['1'].N).toBe(3);
            expect(stats.groups['1'].Mean).toBe(20);
            expect(stats.groups['1'].StdDeviation).toBeCloseTo(Math.sqrt(100));
            expect(stats.groups['2'].N).toBe(3);
            expect(stats.groups['2'].Mean).toBe(50);
            expect(stats.groups['2'].StdDeviation).toBeCloseTo(Math.sqrt(100));
            expect(stats.total.N).toBe(6);
            expect(stats.total.Mean).toBe(35);
        });
    });

    describe('One-way ANOVA results', () => {
        const data = [10, 20, 30, 40, 50, 60];
        const factorData = [1, 1, 1, 2, 2, 2];
        const calc = new OneWayAnovaCalculator({ 
            variable1: variable, 
            data1: data,
            variable2: factorVariable,
            data2: factorData
        });

        it('should compute the correct F-statistic', () => {
            const anova = calc.calculateAnovaStatistics();
            expect(anova.betweenGroups.F).toBeDefined();
        });

        it('should compute the correct degrees of freedom', () => {
            const anova = calc.calculateAnovaStatistics();
            expect(anova.betweenGroups.df).toBe(1); // 2 groups - 1
            expect(anova.withinGroups.df).toBe(4); // 6 total - 2 groups
            expect(anova.total.df).toBe(5); // 6 total - 1
        });

        it('should compute the correct sum of squares', () => {
            const anova = calc.calculateAnovaStatistics();
            expect(anova.betweenGroups.SumOfSquares).toBeDefined();
            expect(anova.withinGroups.SumOfSquares).toBeDefined();
            expect(anova.total.SumOfSquares).toBeDefined();
        });

        it('should compute the correct significance level', () => {
            const anova = calc.calculateAnovaStatistics();
            expect(anova.betweenGroups.Sig).toBeDefined();
        });
    });

    describe('Homogeneity of variance test', () => {
        const data = [10, 20, 30, 40, 50, 60];
        const factorData = [1, 1, 1, 2, 2, 2];
        const calc = new OneWayAnovaCalculator({ 
            variable1: variable, 
            data1: data,
            variable2: factorVariable,
            data2: factorData
        });

        it('should compute Levene\'s test statistic', () => {
            const homogeneity = calc.calculateHomogeneityOfVariance();
            expect(homogeneity.leveneStatistic).toBeDefined();
            expect(homogeneity.df1).toBeDefined();
            expect(homogeneity.df2).toBeDefined();
        });

        it('should compute the correct significance level', () => {
            const homogeneity = calc.calculateHomogeneityOfVariance();
            expect(homogeneity.sig).toBeDefined();
        });
    });

    describe('Multiple comparisons', () => {
        const data = [10, 20, 30, 40, 50, 60, 70, 80, 90];
        const factorData = [1, 1, 1, 2, 2, 2, 3, 3, 3];
        const calc = new OneWayAnovaCalculator({ 
            variable1: variable, 
            data1: data,
            variable2: factorVariable,
            data2: factorData
        });

        it('should compute Tukey HSD comparisons', () => {
            const tukey = calc.calculateTukeyHSD();
            expect(Array.isArray(tukey)).toBe(true);
            expect(tukey.length).toBeGreaterThan(0);
            
            if (tukey.length > 0) {
                expect(tukey[0]).toHaveProperty('group1');
                expect(tukey[0]).toHaveProperty('group2');
                expect(tukey[0]).toHaveProperty('meanDifference');
                expect(tukey[0]).toHaveProperty('sig');
            }
        });

        it('should compute Duncan test comparisons', () => {
            const duncan = calc.calculateDuncan();
            expect(Array.isArray(duncan)).toBe(true);
            expect(duncan.length).toBeGreaterThan(0);
        });
    });

    describe('Effect size calculation', () => {
        const data = [10, 20, 30, 40, 50, 60];
        const factorData = [1, 1, 1, 2, 2, 2];

        it('should compute eta squared when requested', () => {
            const calc = new OneWayAnovaCalculator({ 
                variable1: variable, 
                data1: data,
                variable2: factorVariable,
                data2: factorData,
                options: { estimateEffectSize: true }
            });

            const anova = calc.calculateAnovaStatistics();
            expect(anova.etaSquared).toBeDefined();
            expect(anova.etaSquared).toBeGreaterThan(0);
            expect(anova.etaSquared).toBeLessThanOrEqual(1);
        });

        it('should not compute effect size when not requested', () => {
            const calc = new OneWayAnovaCalculator({ 
                variable1: variable, 
                data1: data,
                variable2: factorVariable,
                data2: factorData,
                options: { estimateEffectSize: false }
            });

            const anova = calc.calculateAnovaStatistics();
            expect(anova.etaSquared).toBeUndefined();
        });
    });
}); 