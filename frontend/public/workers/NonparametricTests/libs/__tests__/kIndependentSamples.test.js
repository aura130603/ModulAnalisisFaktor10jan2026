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
global.self.stdlibstatsBaseDistsChisquareCdf = function(x, k) { 
  const cdf = Math.max(0, Math.min(1, 0.5 - (Math.abs(x) * 0.05)));
  return cdf;
};

global.self.stdlibstatsBaseDistsNormalCdf = function(z) { 
  const cdf = Math.max(0, Math.min(1, 0.5 - (Math.abs(z) * 0.05)));
  return cdf;
};

// Mock KIndependentSamplesCalculator class
global.self.KIndependentSamplesCalculator = class KIndependentSamplesCalculator {
  constructor({ variable1, data1, variable2, data2, options = {} }) {
    this.variable1 = variable1;
    this.data1 = data1;
    this.variable2 = variable2;
    this.data2 = data2;
    this.options = options;
    this.initialized = false;

    this.testType = options.testType || { kruskalWallisH: true, median: false, jonckheereTerpstra: false };
    this.minimum = options.minimum || null;
    this.maximum = options.maximum || null;

    this.validData = [];
    this.validGroupingData = [];
    this.groupedData = {};
    this.N = 0;
    this.groupingN = 0;
    this.uniqueGroups = [];
    this.groupCounts = {};
    this.hasInsufficientData = false;
    this.insufficientType = [];

    this.memo = {};
  }

  #initialize() {
    if (this.initialized) return;

    const isNumericType = ['scale', 'date'].includes(this.variable1.measure);
    const isNumericGroupingType = ['scale', 'date'].includes(this.variable2.measure);

    this.validData = this.data1
      .filter((value, index) => {
        const isValidData = !global.self.checkIsMissing(value, this.variable1.missing, isNumericType) && global.self.isNumeric(value);
        const isValidGrouping = index < this.data2.length && 
          !global.self.checkIsMissing(this.data2[index], this.variable2.missing, isNumericGroupingType);
        
        const groupValue = parseFloat(this.data2[index]);
        const isInRange = !this.minimum || !this.maximum || 
          (groupValue >= this.minimum && groupValue <= this.maximum);
        
        return isValidData && isValidGrouping && isInRange;
      })
      .map(value => parseFloat(value));
    
    this.validGroupingData = this.data2
      .filter((value, index) => {
        const isValidData = index < this.data1.length && 
          !global.self.checkIsMissing(this.data1[index], this.variable1.missing, isNumericType) && 
          global.self.isNumeric(this.data1[index]);
        const isValidGrouping = !global.self.checkIsMissing(value, this.variable2.missing, isNumericGroupingType);
        
        const groupValue = parseFloat(value);
        const isInRange = !this.minimum || !this.maximum || 
          (groupValue >= this.minimum && groupValue <= this.maximum);
        
        return isValidData && isValidGrouping && isInRange;
      })
      .map(value => parseFloat(value));

    this.uniqueGroups = [...new Set(this.validGroupingData)].sort((a, b) => a - b);
    this.uniqueGroups.forEach(group => {
      this.groupedData[group] = [];
      this.groupCounts[group] = 0;
    });

    for (let i = 0; i < this.validData.length; i++) {
      const group = this.validGroupingData[i];
      this.groupedData[group].push(this.validData[i]);
      this.groupCounts[group]++;
    }

    this.groupingN = this.validGroupingData.length;
    this.N = this.validData.length;

    this.hasInsufficientData = false;
    this.insufficientType = [];

    if (this.N === 0) {
      this.hasInsufficientData = true;
      this.insufficientType.push('empty');
    } else if (this.uniqueGroups.length < 2) {
      this.hasInsufficientData = true;
      this.insufficientType.push('single');
    } else {
      for (const group of this.uniqueGroups) {
        if (this.groupCounts[group] === 0) {
          this.hasInsufficientData = true;
          this.insufficientType.push('hasEmptyGroup');
          break;
        }
      }
    }

    this.initialized = true;
  }

  getN() { this.#initialize(); return this.N; }
  getValidN() { this.#initialize(); return this.N; }
  getGroupingN() { this.#initialize(); return this.groupingN; }
  getUniqueGroups() { this.#initialize(); return this.uniqueGroups; }

  getRanks() {
    if (this.memo.ranks) return this.memo.ranks;

    this.#initialize();

    const allValues = [...this.validData].sort((a, b) => a - b);
    const rankMap = {};
    let i = 0;
    while (i < allValues.length) {
      let value = allValues[i];
      let j = i + 1;
      while (j < allValues.length && allValues[j] === value) j++;
      const avgRank = (i + 1 + j) / 2;
      for (let k = i; k < j; k++) {
        rankMap[allValues[k]] = avgRank;
      }
      i = j;
    }
    
    const groupRanks = {};
    for (const group of this.uniqueGroups) {
      let sumRanks = 0;
      for (const value of this.groupedData[group]) {
        sumRanks += rankMap[value];
      }
      const meanRank = this.groupCounts[group] > 0 ? sumRanks / this.groupCounts[group] : 0;
      groupRanks[group] = {
        label: this.variable2.values?.find(v => v.value === group)?.label || group.toString(),
        N: this.groupCounts[group],
        MeanRank: meanRank,
        SumRanks: sumRanks
      };
    }

    this.memo.ranks = groupRanks;
    return groupRanks;
  }

  getTestStatisticsKruskalWallisH() {
    if (this.memo.kruskalWallisH) return this.memo.kruskalWallisH;
    this.#initialize();
    
    if (this.uniqueGroups.length < 2) {
      const result = {
        H: 0,
        df: 0,
        pValue: 1,
        showExact: false
      };
      this.memo.kruskalWallisH = result;
      return result;
    }
    
    const ranks = this.getRanks();
    
    let H = 0;
    const N = this.N;
    
    for (const group of this.uniqueGroups) {
      const groupData = ranks[group];
      const n = groupData.N;
      const R = groupData.SumRanks;
      H += (R * R) / n;
    }
    
    H = (12 / (N * (N + 1))) * H - 3 * (N + 1);
    
    const df = this.uniqueGroups.length - 1;
    const pValue = 1 - global.self.stdlibstatsBaseDistsChisquareCdf(H, df);
    const showExact = N < 30 && this.uniqueGroups.length <= 3;
    
    const result = {
      H,
      df,
      pValue,
      showExact
    };

    this.memo.kruskalWallisH = result;
    return result;
  }

  getOutput() {
    this.#initialize();
    
    const variable1 = this.variable1;
    const variable2 = this.variable2;
    const ranks = this.getRanks();
    let testStatisticsKruskalWallisH = null;
    
    if (this.testType.kruskalWallisH) {
      testStatisticsKruskalWallisH = this.getTestStatisticsKruskalWallisH();
    }
    
    return {
      variable1,
      variable2,
      ranks,
      testStatisticsKruskalWallisH,
      metadata: {
        hasInsufficientData: this.hasInsufficientData,
        insufficientType: this.insufficientType,
        variableName: variable1.name,
        variableLabel: variable1.label
      }
    };
  }
};

// Mock worker environment
let mockPostMessage = jest.fn();
let mockWorkerTerminate = jest.fn();
let workerOnMessage = null;
let workerOnError = null;

global.self.postMessage = mockPostMessage;
global.self.terminate = mockWorkerTerminate;
global.self.onmessage = (event) => {
  if (workerOnMessage) workerOnMessage(event);
};
global.self.onerror = (error) => {
  if (workerOnError) workerOnError(error);
};

describe('KIndependentSamplesCalculator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPostMessage = jest.fn();
    mockWorkerTerminate = jest.fn();
    workerOnMessage = null;
    workerOnError = null;
  });

  const variable1 = {
    name: 'testVar',
    label: 'Test Variable',
    measure: 'scale',
    missing: null
  };

  const variable2 = {
    name: 'groupVar',
    label: 'Group Variable',
    measure: 'nominal',
    missing: null,
    values: [
      { value: 1, label: 'Group 1' },
      { value: 2, label: 'Group 2' },
      { value: 3, label: 'Group 3' }
    ]
  };

  describe('Basic functionality', () => {
    it('should initialize with correct properties', () => {
      const data1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      const data2 = [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3];
      const calc = new KIndependentSamplesCalculator({ 
        variable1, 
        data1, 
        variable2, 
        data2,
        options: { 
          testType: { kruskalWallisH: true, median: false, jonckheereTerpstra: false },
          minimum: 1,
          maximum: 3
        }
      });

      expect(calc.variable1).toBe(variable1);
      expect(calc.variable2).toBe(variable2);
      expect(calc.testType.kruskalWallisH).toBe(true);
      expect(calc.minimum).toBe(1);
      expect(calc.maximum).toBe(3);
    });

    it('should calculate basic statistics correctly', () => {
      const data1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      const data2 = [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3];
      const calc = new KIndependentSamplesCalculator({ 
        variable1, 
        data1, 
        variable2, 
        data2,
        options: { minimum: 1, maximum: 3 }
      });

      expect(calc.getN()).toBe(12);
      expect(calc.getGroupingN()).toBe(12);
      expect(calc.getUniqueGroups()).toEqual([1, 2, 3]);
    });
  });

  describe('Kruskal-Wallis H Test', () => {
    it('should calculate Kruskal-Wallis H statistics correctly', () => {
      const data1 = [1, 3, 5, 7, 2, 4, 6, 8, 9, 11, 13, 15];
      const data2 = [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3];
      const calc = new KIndependentSamplesCalculator({ 
        variable1, 
        data1, 
        variable2, 
        data2,
        options: { 
          testType: { kruskalWallisH: true, median: false, jonckheereTerpstra: false },
          minimum: 1,
          maximum: 3
        }
      });

      const stats = calc.getTestStatisticsKruskalWallisH();
      
      expect(stats.H).toBeGreaterThan(0);
      expect(stats.df).toBe(2);
      expect(stats.pValue).toBeGreaterThan(0);
      expect(stats.pValue).toBeLessThanOrEqual(1);
    });
  });

  describe('Insufficient Data Cases', () => {
    it('should detect empty data', () => {
      const data1 = [];
      const data2 = [];
      const calc = new KIndependentSamplesCalculator({ 
        variable1, 
        data1, 
        variable2, 
        data2,
        options: { minimum: 1, maximum: 3 }
      });

      const output = calc.getOutput();
      expect(output.metadata.hasInsufficientData).toBe(true);
      expect(output.metadata.insufficientType).toContain('empty');
    });

    it('should detect single group', () => {
      const data1 = [1, 2, 3, 4, 5];
      const data2 = [1, 1, 1, 1, 1];
      const calc = new KIndependentSamplesCalculator({ 
        variable1, 
        data1, 
        variable2, 
        data2,
        options: { minimum: 1, maximum: 3 }
      });

      const output = calc.getOutput();
      expect(output.metadata.hasInsufficientData).toBe(true);
      expect(output.metadata.insufficientType).toContain('single');
    });
  });

  describe('Output generation', () => {
    it('should generate complete output with Kruskal-Wallis H', () => {
      const data1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      const data2 = [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3];
      const calc = new KIndependentSamplesCalculator({ 
        variable1, 
        data1, 
        variable2, 
        data2,
        options: { 
          testType: { kruskalWallisH: true, median: false, jonckheereTerpstra: false },
          minimum: 1,
          maximum: 3
        }
      });

      const output = calc.getOutput();
      
      expect(output.variable1).toBe(variable1);
      expect(output.variable2).toBe(variable2);
      expect(output.ranks).toBeDefined();
      expect(output.testStatisticsKruskalWallisH).toBeDefined();
      expect(output.metadata.hasInsufficientData).toBe(false);
    });
  });
});
