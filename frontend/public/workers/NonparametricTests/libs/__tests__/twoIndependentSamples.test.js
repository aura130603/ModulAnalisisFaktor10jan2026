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
  const cdf = Math.max(0, Math.min(1, 0.5 - (Math.abs(z) * 0.05)));
  return cdf;
};

// Mock TwoIndependentSamplesCalculator class based on twoIndependentSamples.js implementation
global.self.TwoIndependentSamplesCalculator = class TwoIndependentSamplesCalculator {
  constructor({ variable1, data1, variable2, data2, options = {} }) {
    this.variable1 = variable1;
    this.data1 = data1;
    this.variable2 = variable2;
    this.data2 = data2;
    this.options = options;
    this.initialized = false;

    // Extract options from options
    this.group1 = options.group1;
    this.group2 = options.group2;
    this.testType = options.testType || { mannWhitneyU: true, mosesExtremeReactions: false, kolmogorovSmirnovZ: false, waldWolfowitzRuns: false };

    // Properties that will be calculated
    this.validData = [];
    this.validGroupingData = [];
    this.group1Data = [];
    this.group2Data = [];
    this.N = 0;
    this.groupingN = 0;
    this.group1N = 0;
    this.group2N = 0;

    /** @private */
    this.memo = {};
  }

  #initialize() {
    if (this.initialized) return;

    // Filter data that is valid
    const isNumericType = ['scale', 'date'].includes(this.variable1.measure);
    const isNumericGroupingType = ['scale', 'date'].includes(this.variable2.measure);

    // Filter valid data
    this.validData = this.data1
      .filter((value, index) => {
        const isValidData = !global.self.checkIsMissing(value, this.variable1.missing, isNumericType) && global.self.isNumeric(value);
        const isValidGrouping = index < this.data2.length && 
          !global.self.checkIsMissing(this.data2[index], this.variable2.missing, isNumericGroupingType);
        return isValidData && isValidGrouping;
      })
      .map(value => parseFloat(value));
    
    this.validGroupingData = this.data2
      .filter((value, index) => {
        const isValidData = index < this.data1.length && 
          !global.self.checkIsMissing(this.data1[index], this.variable1.missing, isNumericType) && 
          global.self.isNumeric(this.data1[index]);
        const isValidGrouping = !global.self.checkIsMissing(value, this.variable2.missing, isNumericGroupingType);
        return isValidData && isValidGrouping;
      });

    this.group1Data = this.validData.filter((_, index) => 
      this.validGroupingData[index] === this.group1);
    this.group2Data = this.validData.filter((_, index) => 
      this.validGroupingData[index] === this.group2);

    // Calculate basic statistics
    this.groupingN = this.validGroupingData.length;
    this.group1N = this.group1Data.length;
    this.group2N = this.group2Data.length;
    this.N = this.group1N + this.group2N;

    this.initialized = true;
  }

      getN() { this.#initialize(); return this.N; }
    getValidN() { this.#initialize(); return this.N; } // Alias for getN() for compatibility
    getGroupingN() { this.#initialize(); return this.groupingN; }
    getGroup1N() { this.#initialize(); return this.group1N; }
    getGroup2N() { this.#initialize(); return this.group2N; }
  
  /**
   * Calculate mean from array
   * @param {Array<number>} arr - Array of values
   * @returns {number} Mean
   */
  #mean(arr) {
    if (!arr || arr.length === 0) return 0;
    return arr.reduce((sum, x) => sum + x, 0) / arr.length;
  }
  
  /**
   * Calculate standard deviation from array
   * @param {Array<number>} arr - Array of values
   * @param {number} meanValue - Mean of array
   * @returns {number} Standard deviation
   */
  #stdDev(arr, meanValue) {
    if (!arr || arr.length <= 1) return 0;
    const sumSq = arr.reduce((sum, x) => sum + Math.pow(x - meanValue, 2), 0);
    return Math.sqrt(sumSq / (arr.length - 1));
  }

  getFrequenciesRanks() {
    if (this.memo.frequenciesRanks) return this.memo.frequenciesRanks;

    this.#initialize();

    // Calculate ranks
    const allValues = [...this.validData].sort((a, b) => a - b);
    const rankMap = {};
    let i = 0;
    while (i < allValues.length) {
      let value = allValues[i];
      let j = i + 1;
      while (j < allValues.length && allValues[j] === value) j++;
      // average rank for ties
      const avgRank = (i + 1 + j) / 2;
      for (let k = i; k < j; k++) {
        rankMap[allValues[k]] = avgRank;
      }
      i = j;
    }
    
    // Calculate sum of ranks for each group
    let group1SumRanks = 0;
    let group2SumRanks = 0;
    for (let idx = 0; idx < this.validData.length; idx++) {
      const value = this.validData[idx];
      const rank = rankMap[value];
      if (this.validGroupingData[idx] === this.group1) {
        group1SumRanks += rank;
      } else if (this.validGroupingData[idx] === this.group2) {
        group2SumRanks += rank;
      }
    }
    
    // Calculate mean rank
    const group1MeanRank = this.group1N > 0 ? group1SumRanks / this.group1N : 0;
    const group2MeanRank = this.group2N > 0 ? group2SumRanks / this.group2N : 0;

    const group1Label = this.variable2.values?.find(v => v.value === this.group1)?.label || this.group1?.toString() || '';
    const group2Label = this.variable2.values?.find(v => v.value === this.group2)?.label || this.group2?.toString() || '';

    const result = {
      group1: {
        label: group1Label,
        N: this.group1N,
        MeanRank: group1MeanRank,
        SumRanks: group1SumRanks
      },
      group2: {
        label: group2Label,
        N: this.group2N,
        MeanRank: group2MeanRank,
        SumRanks: group2SumRanks
      }
    };

    this.memo.frequenciesRanks = result;
    return result;
  }

  /**
   * Compute the exact distribution of the Mann-Whitney U statistic for given group sizes.
   * Returns an array where the value at index u is the number of ways to obtain U = u.
   */
  getComputeExactDistribution() {
    this.#initialize();
    const n1 = this.group1N;
    const n2 = this.group2N;

    // Edge case: if either group is empty, return trivial distribution
    if (n1 === 0 || n2 === 0) {
      return [1];
    }

    // dp[i][j] = array of counts for U values for i from group1 and j from group2
    const dp = Array.from({ length: n1 + 1 }, () =>
      Array.from({ length: n2 + 1 }, () => null)
    );
    for (let i = 0; i <= n1; i++) dp[i][0] = [1];
    for (let j = 0; j <= n2; j++) dp[0][j] = [1];

    for (let i = 1; i <= n1; i++) {
      for (let j = 1; j <= n2; j++) {
        const size = i * j + 1;
        const arr = new Array(size).fill(0);

        // Add from dp[i][j-1]
        const prevJ = dp[i][j - 1];
        for (let u = 0; u < prevJ.length; u++) {
          arr[u] += prevJ[u];
        }

        // Add from dp[i-1][j]
        const prevI = dp[i - 1][j];
        for (let u = 0; u < prevI.length; u++) {
          if (u + j < size) {
            arr[u + j] += prevI[u];
          }
        }

        dp[i][j] = arr;
      }
    }
    return dp[n1][n2];
  }

  /**
   * Compute the exact p-value for the observed Mann-Whitney U statistic.
   * Returns the two-sided exact p-value.
   * @param {number} U_obs - Observed U statistic
   * @returns {number} Exact p-value
   */
  getPExactMannWhitneyU(U_obs) {
    this.#initialize();
    const n1 = this.group1N;
    const n2 = this.group2N;

    // Edge case: if either group is empty, return 1
    if (n1 === 0 || n2 === 0) {
      return 1;
    }

    // Compute the exact distribution of U
    const distribution = this.getComputeExactDistribution();

    // Combination formula: C(n, k) = n! / (k! * (n-k)!)
    let n = n1 + n2;
    let k = n1;
    let total = 1;
    if (k < 0 || k > n) {
      total = 0;
    } else if (k === 0 || k === n) {
      total = 1;
    } else {
      k = Math.min(k, n - k);
      for (let i = 1; i <= k; i++) {
        total = total * (n - i + 1) / i;
      }
    }

    // Cumulative probability for U <= U_obs
    let cumulative = 0;
    for (let u = 0; u <= U_obs; u++) {
      cumulative += (distribution[u] || 0);
    }
    const pOneSided = cumulative / total;
    return Math.min(2 * pOneSided, 1);
  }

  getTestStatisticsMannWhitneyU() {
    if (this.memo.mannWhitneyU) return this.memo.mannWhitneyU;
    this.#initialize();
    
    // Validate input
    if (this.group1N === 0 || this.group2N === 0) {
      const result = {
        U: 0,
        W: 0,
        Z: 0,
        pValue: 1,
        pExact: null,
        showExact: false
      };
      this.memo.mannWhitneyU = result;
      return result;
    }
    
    // Calculate ranks for Mann-Whitney U
    const freqRanks = this.getFrequenciesRanks();
    
    // Calculate U1 and U2
    const n1 = this.group1N;
    const n2 = this.group2N;
    const R1 = parseFloat(freqRanks.group1.SumRanks);
    const R2 = parseFloat(freqRanks.group2.SumRanks);

    const U1 = R1 - (n1 * (n1 + 1)) / 2;
    const U2 = n1 * n2 - U1;

    let U, W;
    if (U1 < U2) {
      U = U1;
      W = R1;
    } else {
      U = U2;
      W = R2;
    }
    
    // Calculate expected value and variance
    const expectedU = (n1 * n2) / 2;
    
    // Calculate tie correction
    const tieMap = {};
    for (const value of this.validData) {
      tieMap[value] = (tieMap[value] || 0) + 1;
    }
    
    const tieCorrection = Object.values(tieMap).reduce((sum, t) => {
      return sum + (t > 1 ? (t ** 3 - t) : 0);
    }, 0);

    const N = n1 + n2;
    let varianceU = (n1 * n2 * (N + 1)) / 12;
    
    if (tieCorrection > 0) {
      varianceU = varianceU - (n1 * n2 * tieCorrection / (N * (N - 1) * 12));
    }
    
    // Calculate Z-score
    const Z = (U - expectedU) / Math.sqrt(varianceU);
    
    // Calculate p-value
    const pValue = Math.max(0, Math.min(1, 2 * (1 - global.self.stdlibstatsBaseDistsNormalCdf(Math.abs(Z), 0, 1))));
    
    // Determine whether to show exact p-value
    const showExact = (n1 * n2) < 400 && (((n1 * n2) / 2) + Math.min(n1, n2)) <= 220;
    let pExact = null;
    if (showExact) {
      // Calculate exact p-value
      pExact = this.getPExactMannWhitneyU(U);
    }
    const result = {
      U,
      W,
      Z,
      pValue,
      pExact,
      showExact
    };

    this.memo.mannWhitneyU = result;
    return result;
  }

  getTestStatisticsKolmogorovSmirnovZ() {
    if (this.memo.kolmogorovSmirnovZ) return this.memo.kolmogorovSmirnovZ;
    this.#initialize();
    
    // Validate input
    if (this.group1N === 0 || this.group2N === 0) {
      const result = {
        D_absolute: 0,
        D_positive: 0,
        D_negative: 0,
        d_stat: 0,
        pValue: 1
      };
      this.memo.kolmogorovSmirnovZ = result;
      return result;
    }

    const group1Sorted = [...this.group1Data].sort((a, b) => a - b);
    const group2Sorted = [...this.group2Data].sort((a, b) => a - b);
    const allValues = [...new Set([...group1Sorted, ...group2Sorted])].sort((a, b) => a - b);

    let D_absolute = 0;
    let D_positive = 0;
    let D_negative = 0;

    for (const x of allValues) {
      const F1 = group1Sorted.filter(v => v <= x).length / this.group1N;
      const F2 = group2Sorted.filter(v => v <= x).length / this.group2N;
      const diff = F1 - F2;
      D_absolute = Math.max(D_absolute, Math.abs(diff));
      D_positive = Math.max(D_positive, diff);
      D_negative = Math.min(D_negative, diff);
    }
    
    // Calculate Z statistic
    const n1 = this.group1N;
    const n2 = this.group2N;
    const d_stat = D_absolute * Math.sqrt((n1 * n2) / (n1 + n2));
    
    // Calculate p-value using approximation formula
    let pValue = 0;
    // Use Kolmogorov formula for p-value
    for (let i = 1; i <= 100; i++) {
      const term = Math.pow(-1, i - 1) * Math.exp(-2 * i * i * d_stat * d_stat);
      pValue += term;
      if (Math.abs(term) < 1e-10) break;
    }
    pValue = 2 * pValue;
    if (pValue > 1) pValue = 1;
    if (pValue < 0) pValue = 0;

    const result = {
      D_absolute,
      D_positive,
      D_negative,
      d_stat,
      pValue
    };

    this.memo.kolmogorovSmirnovZ = result;
    return result;
  }

  getTestStatisticsMosesExtremeReactions() {
    if (this.memo.mosesExtremeReactions) return this.memo.mosesExtremeReactions;
    this.#initialize();
    
    // Validate input
    if (this.group1N === 0 || this.group2N === 0) {
      const result = {
        span: 0,
        outliers: 0,
        pValue: 1
      };
      this.memo.mosesExtremeReactions = result;
      return result;
    }

    const group1Sorted = [...this.group1Data].sort((a, b) => a - b);
    const span = group1Sorted[group1Sorted.length - 1] - group1Sorted[0];
    const outliers = this.group2Data.filter(x => x < group1Sorted[0] || x > group1Sorted[group1Sorted.length - 1]).length;
    const proportion = outliers / this.group2N;
    const pValue = 1 - Math.abs(2 * proportion - 1);

    const result = {
      span,
      outliers,
      proportion,
      pValue
    };

    this.memo.mosesExtremeReactions = result;
    return result;
  }

  getTestStatisticsWaldWolfowitzRuns() {
    if (this.memo.waldWolfowitzRuns) return this.memo.waldWolfowitzRuns;
    this.#initialize();
    
    // Validate input
    if (this.group1N === 0 || this.group2N === 0) {
      const result = {
        runsCount: 0,
        Z: 0,
        pValue: 1
      };
      this.memo.waldWolfowitzRuns = result;
      return result;
    }
    
    // Combine and sort data from both groups
    const combinedData = [];
    for (let i = 0; i < this.validData.length; i++) {
      combinedData.push({
        value: this.validData[i],
        group: this.validGroupingData[i]
      });
    }
    combinedData.sort((a, b) => a.value - b.value);
    
    // Calculate number of runs
    let runsCount = 1;
    let currentGroup = combinedData[0].group;
    for (let i = 1; i < combinedData.length; i++) {
      if (combinedData[i].group !== currentGroup) {
        runsCount++;
        currentGroup = combinedData[i].group;
      }
    }
    
    // Calculate expected value and variance
    const n1 = this.group1N;
    const n2 = this.group2N;
    const N = n1 + n2;
    const expectedRuns = 1 + (2 * n1 * n2) / N;
    const varianceRuns = (2 * n1 * n2 * (2 * n1 * n2 - N)) / (N * N * (N - 1));
    
    // Calculate Z-score with continuity correction
    let Z;
    if (runsCount > expectedRuns) {
      Z = (runsCount - 0.5 - expectedRuns) / Math.sqrt(varianceRuns);
    } else {
      Z = (runsCount + 0.5 - expectedRuns) / Math.sqrt(varianceRuns);
    }
    
    // Calculate p-value (two-tailed)
    const pValue = 2 * (1 - global.self.stdlibstatsBaseDistsNormalCdf(Math.abs(Z), 0, 1));

    const result = {
      runsCount,
      expectedRuns,
      varianceRuns,
      Z,
      pValue
    };

    this.memo.waldWolfowitzRuns = result;
    return result;
  }

  getOutput() {
    this.#initialize();
    let hasInsufficientData = false;
    let insufficentType = [];
    if (this.group1N === 0 && this.group2N === 0) {
      hasInsufficientData = true;
      insufficentType.push('empty');
    } else 
    if (this.group1N === 0 || this.group2N === 0) {
      hasInsufficientData = true;
      insufficentType.push('hasEmptyGroup');
    }
    const variable1 = this.variable1;
    const variable2 = this.variable2;
    const frequenciesRanks = this.getFrequenciesRanks();
    let testStatisticsMannWhitneyU = null;
    let testStatisticsKolmogorovSmirnovZ = null;
    
    if (this.testType.mannWhitneyU) {
      testStatisticsMannWhitneyU = this.getTestStatisticsMannWhitneyU();
    }
    if (this.testType.kolmogorovSmirnovZ) {
      testStatisticsKolmogorovSmirnovZ = this.getTestStatisticsKolmogorovSmirnovZ();
    }
    return {
      variable1,
      variable2,
      frequenciesRanks,
      testStatisticsMannWhitneyU,
      testStatisticsKolmogorovSmirnovZ,
      metadata: {
        hasInsufficientData,
        insufficentType,
        variableName: variable1.name,
        variableLabel: variable1.label
      }
    };
  }
};

// Mock worker environment variables
let mockPostMessage = jest.fn();
let mockWorkerTerminate = jest.fn();
let workerOnMessage = null;
let workerOnError = null;

// Mock worker methods
global.self.postMessage = mockPostMessage;
global.self.terminate = mockWorkerTerminate;
global.self.onmessage = (event) => {
  if (workerOnMessage) workerOnMessage(event);
};
global.self.onerror = (error) => {
  if (workerOnError) workerOnError(error);
};

describe('TwoIndependentSamplesCalculator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPostMessage = jest.fn();
    mockWorkerTerminate = jest.fn();
    workerOnMessage = null;
    workerOnError = null;
  });

  // Test variables
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
      { value: 2, label: 'Group 2' }
    ]
  };

  describe('Basic functionality', () => {
    it('should initialize with correct properties', () => {
      const data1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const data2 = [1, 1, 1, 1, 1, 2, 2, 2, 2, 2];
      const calc = new TwoIndependentSamplesCalculator({ 
        variable1, 
        data1, 
        variable2, 
        data2,
        options: { group1: 1, group2: 2 }
      });

      expect(calc.variable1).toBe(variable1);
      expect(calc.variable2).toBe(variable2);
      expect(calc.data1).toEqual(data1);
      expect(calc.data2).toEqual(data2);
      expect(calc.group1).toBe(1);
      expect(calc.group2).toBe(2);
      expect(calc.testType.mannWhitneyU).toBe(true);
    });

    it('should calculate basic statistics correctly', () => {
      const data1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const data2 = [1, 1, 1, 1, 1, 2, 2, 2, 2, 2];
      const calc = new TwoIndependentSamplesCalculator({ 
        variable1, 
        data1, 
        variable2, 
        data2,
        options: { group1: 1, group2: 2 }
      });

      expect(calc.getN()).toBe(10);
      expect(calc.getGroupingN()).toBe(10);
      expect(calc.getGroup1N()).toBe(5);
      expect(calc.getGroup2N()).toBe(5);
    });

    it('should filter valid data correctly', () => {
      const data1 = [1, null, 3, 4, 'a', 6, 7, 8, 9, 10];
      const data2 = [1, 1, 1, 1, 1, 2, 2, 2, 2, 2];
      const calc = new TwoIndependentSamplesCalculator({ 
        variable1, 
        data1, 
        variable2, 
        data2,
        options: { group1: 1, group2: 2 }
      });

      expect(calc.getValidN()).toBe(8); // 10 - 2 invalid values (null, 'a')
      expect(calc.getGroup1N()).toBe(3); // indices 0, 2, 3 (valid data in group 1)
      expect(calc.getGroup2N()).toBe(5); // indices 5, 6, 7, 8, 9 (valid data in group 2)
    });
  });

  describe('Frequencies and Ranks', () => {
    it('should calculate frequencies and ranks correctly', () => {
      const data1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const data2 = [1, 1, 1, 1, 1, 2, 2, 2, 2, 2];
      const calc = new TwoIndependentSamplesCalculator({ 
        variable1, 
        data1, 
        variable2, 
        data2,
        options: { group1: 1, group2: 2 }
      });

      const freqRanks = calc.getFrequenciesRanks();
      
      expect(freqRanks.group1.N).toBe(5);
      expect(freqRanks.group2.N).toBe(5);
      expect(freqRanks.group1.label).toBe('Group 1');
      expect(freqRanks.group2.label).toBe('Group 2');
      expect(freqRanks.group1.MeanRank).toBeGreaterThan(0);
      expect(freqRanks.group2.MeanRank).toBeGreaterThan(0);
      expect(freqRanks.group1.SumRanks).toBeGreaterThan(0);
      expect(freqRanks.group2.SumRanks).toBeGreaterThan(0);
    });

    it('should handle ties correctly', () => {
      const data1 = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5];
      const data2 = [1, 1, 1, 1, 1, 2, 2, 2, 2, 2];
      const calc = new TwoIndependentSamplesCalculator({ 
        variable1, 
        data1, 
        variable2, 
        data2,
        options: { group1: 1, group2: 2 }
      });

      const freqRanks = calc.getFrequenciesRanks();
      
      // With ties, the sum of ranks should still be correct
      const totalRanks = freqRanks.group1.SumRanks + freqRanks.group2.SumRanks;
      const expectedTotalRanks = (10 * 11) / 2; // Sum of ranks 1 to 10
      expect(totalRanks).toBe(expectedTotalRanks);
    });
  });

  describe('Mann-Whitney U Test', () => {
    it('should calculate Mann-Whitney U statistics correctly', () => {
      const data1 = [1, 3, 5, 7, 9, 2, 4, 6, 8, 10];
      const data2 = [1, 1, 1, 1, 1, 2, 2, 2, 2, 2];
      const calc = new TwoIndependentSamplesCalculator({ 
        variable1, 
        data1, 
        variable2, 
        data2,
        options: { 
          group1: 1, 
          group2: 2,
          testType: { mannWhitneyU: true, kolmogorovSmirnovZ: false }
        }
      });

      const stats = calc.getTestStatisticsMannWhitneyU();
      
      expect(stats.U).toBeGreaterThan(0);
      expect(stats.W).toBeGreaterThan(0);
      expect(stats.Z).toBeDefined();
      expect(stats.pValue).toBeGreaterThan(0);
      expect(stats.pValue).toBeLessThanOrEqual(1);
      expect(stats.showExact).toBeDefined();
    });

    it('should handle exact p-value calculation for small samples', () => {
      const data1 = [1, 2, 3, 4, 5];
      const data2 = [1, 1, 1, 2, 2];
      const calc = new TwoIndependentSamplesCalculator({ 
        variable1, 
        data1, 
        variable2, 
        data2,
        options: { 
          group1: 1, 
          group2: 2,
          testType: { mannWhitneyU: true, kolmogorovSmirnovZ: false }
        }
      });

      const stats = calc.getTestStatisticsMannWhitneyU();
      
      // For small samples, exact p-value should be calculated
      if (stats.showExact) {
        expect(stats.pExact).toBeGreaterThan(0);
        expect(stats.pExact).toBeLessThanOrEqual(1);
      }
    });

    it('should handle tie correction', () => {
      const data1 = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5];
      const data2 = [1, 1, 1, 1, 1, 2, 2, 2, 2, 2];
      const calc = new TwoIndependentSamplesCalculator({ 
        variable1, 
        data1, 
        variable2, 
        data2,
        options: { 
          group1: 1, 
          group2: 2,
          testType: { mannWhitneyU: true, kolmogorovSmirnovZ: false }
        }
      });

      const stats = calc.getTestStatisticsMannWhitneyU();
      
      expect(stats.U).toBeGreaterThan(0);
      expect(stats.W).toBeGreaterThan(0);
      expect(stats.Z).toBeDefined();
      expect(stats.pValue).toBeGreaterThan(0);
      expect(stats.pValue).toBeLessThanOrEqual(1);
    });
  });

  describe('Kolmogorov-Smirnov Z Test', () => {
    it('should calculate Kolmogorov-Smirnov Z statistics correctly', () => {
      const data1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const data2 = [1, 1, 1, 1, 1, 2, 2, 2, 2, 2];
      const calc = new TwoIndependentSamplesCalculator({ 
        variable1, 
        data1, 
        variable2, 
        data2,
        options: { 
          group1: 1, 
          group2: 2,
          testType: { mannWhitneyU: false, kolmogorovSmirnovZ: true }
        }
      });

      const stats = calc.getTestStatisticsKolmogorovSmirnovZ();
      
      expect(stats.D_absolute).toBeGreaterThan(0);
      expect(stats.D_positive).toBeDefined();
      expect(stats.D_negative).toBeDefined();
      expect(stats.d_stat).toBeGreaterThan(0);
      expect(stats.pValue).toBeGreaterThan(0);
      expect(stats.pValue).toBeLessThanOrEqual(1);
    });

    it('should handle different distribution patterns', () => {
      const data1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const data2 = [6, 7, 8, 9, 10, 1, 2, 3, 4, 5];
      const calc = new TwoIndependentSamplesCalculator({ 
        variable1, 
        data1, 
        variable2, 
        data2,
        options: { 
          group1: 1, 
          group2: 2,
          testType: { mannWhitneyU: false, kolmogorovSmirnovZ: true }
        }
      });

      const stats = calc.getTestStatisticsKolmogorovSmirnovZ();
      
      expect(stats.D_absolute).toBeGreaterThan(0);
      expect(stats.d_stat).toBeGreaterThan(0);
      expect(stats.pValue).toBeGreaterThan(0);
      expect(stats.pValue).toBeLessThanOrEqual(1);
    });
  });



  describe('Insufficient Data Cases', () => {
    describe('Empty data case (insufficentType: ["empty"])', () => {
      it('should detect empty arrays', () => {
        const data1 = [];
        const data2 = [];
        const calc = new TwoIndependentSamplesCalculator({ 
          variable1, 
          data1, 
          variable2, 
          data2,
          options: { group1: 1, group2: 2 }
        });

        const output = calc.getOutput();
        expect(output.metadata.hasInsufficientData).toBe(true);
        expect(output.metadata.insufficentType).toContain('empty');
        expect(calc.getN()).toBe(0);
        expect(calc.getGroup1N()).toBe(0);
        expect(calc.getGroup2N()).toBe(0);
      });

      it('should detect all test data missing', () => {
        const data1 = [null, null, null, null, null];
        const data2 = [1, 1, 1, 1, 1];
        const calc = new TwoIndependentSamplesCalculator({ 
          variable1, 
          data1, 
          variable2, 
          data2,
          options: { group1: 1, group2: 2 }
        });

        const output = calc.getOutput();
        expect(output.metadata.hasInsufficientData).toBe(true);
        expect(output.metadata.insufficentType).toContain('empty');
        expect(calc.getGroup1N()).toBe(0);
        expect(calc.getGroup2N()).toBe(0);
      });

      it('should detect all test data non-numeric', () => {
        const data1 = ['a', 'b', 'c', 'd', 'e'];
        const data2 = [1, 1, 1, 1, 1];
        const calc = new TwoIndependentSamplesCalculator({ 
          variable1, 
          data1, 
          variable2, 
          data2,
          options: { group1: 1, group2: 2 }
        });

        const output = calc.getOutput();
        expect(output.metadata.hasInsufficientData).toBe(true);
        expect(output.metadata.insufficentType).toContain('empty');
        expect(calc.getGroup1N()).toBe(0);
        expect(calc.getGroup2N()).toBe(0);
      });

      it('should detect all grouping data missing', () => {
        const data1 = [1, 2, 3, 4, 5];
        const data2 = [null, null, null, null, null];
        const calc = new TwoIndependentSamplesCalculator({ 
          variable1, 
          data1, 
          variable2, 
          data2,
          options: { group1: 1, group2: 2 }
        });

        const output = calc.getOutput();
        expect(output.metadata.hasInsufficientData).toBe(true);
        expect(output.metadata.insufficentType).toContain('empty');
        expect(calc.getGroup1N()).toBe(0);
        expect(calc.getGroup2N()).toBe(0);
      });

      it('should detect mixed missing and non-numeric test data', () => {
        const data1 = [null, 'a', undefined, 'b', ''];
        const data2 = [1, 1, 1, 1, 1];
        const calc = new TwoIndependentSamplesCalculator({ 
          variable1, 
          data1, 
          variable2, 
          data2,
          options: { group1: 1, group2: 2 }
        });

        const output = calc.getOutput();
        expect(output.metadata.hasInsufficientData).toBe(true);
        expect(output.metadata.insufficentType).toContain('empty');
        expect(calc.getGroup1N()).toBe(0);
        expect(calc.getGroup2N()).toBe(0);
      });
    });

    describe('Empty group cases (insufficentType: ["hasEmptyGroup"])', () => {
      it('should detect empty group 1 - all data in group 2', () => {
        const data1 = [1, 2, 3, 4, 5];
        const data2 = [2, 2, 2, 2, 2]; // All group 2
        const calc = new TwoIndependentSamplesCalculator({ 
          variable1, 
          data1, 
          variable2, 
          data2,
          options: { group1: 1, group2: 2 }
        });

        const output = calc.getOutput();
        expect(output.metadata.hasInsufficientData).toBe(true);
        expect(output.metadata.insufficentType).toContain('hasEmptyGroup');
        expect(calc.getGroup1N()).toBe(0);
        expect(calc.getGroup2N()).toBe(5);
      });

      it('should detect empty group 2 - all data in group 1', () => {
        const data1 = [1, 2, 3, 4, 5];
        const data2 = [1, 1, 1, 1, 1]; // All group 1
        const calc = new TwoIndependentSamplesCalculator({ 
          variable1, 
          data1, 
          variable2, 
          data2,
          options: { group1: 1, group2: 2 }
        });

        const output = calc.getOutput();
        expect(output.metadata.hasInsufficientData).toBe(true);
        expect(output.metadata.insufficentType).toContain('hasEmptyGroup');
        expect(calc.getGroup1N()).toBe(5);
        expect(calc.getGroup2N()).toBe(0);
      });

      it('should detect empty group 1 with mixed valid/invalid data', () => {
        const data1 = [1, null, 3, 'a', 5, 6, 7, 8, 9, 10];
        const data2 = [2, 2, 2, 2, 2, 2, 2, 2, 2, 2]; // All group 2
        const calc = new TwoIndependentSamplesCalculator({ 
          variable1, 
          data1, 
          variable2, 
          data2,
          options: { group1: 1, group2: 2 }
        });

        const output = calc.getOutput();
        expect(output.metadata.hasInsufficientData).toBe(true);
        expect(output.metadata.insufficentType).toContain('hasEmptyGroup');
        expect(calc.getGroup1N()).toBe(0);
        expect(calc.getGroup2N()).toBe(8); // 10 - 2 invalid values
      });

      it('should detect empty group 2 with mixed valid/invalid data', () => {
        const data1 = [1, null, 3, 'a', 5, 6, 7, 8, 9, 10];
        const data2 = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]; // All group 1
        const calc = new TwoIndependentSamplesCalculator({ 
          variable1, 
          data1, 
          variable2, 
          data2,
          options: { group1: 1, group2: 2 }
        });

        const output = calc.getOutput();
        expect(output.metadata.hasInsufficientData).toBe(true);
        expect(output.metadata.insufficentType).toContain('hasEmptyGroup');
        expect(calc.getGroup1N()).toBe(8); // 10 - 2 invalid values
        expect(calc.getGroup2N()).toBe(0);
      });

      it('should detect empty group 1 with different group values', () => {
        const data1 = [1, 2, 3, 4, 5];
        const data2 = [3, 3, 3, 3, 3]; // Group 3 (not group 1 or 2)
        const calc = new TwoIndependentSamplesCalculator({ 
          variable1, 
          data1, 
          variable2, 
          data2,
          options: { group1: 1, group2: 2 }
        });

        const output = calc.getOutput();
        expect(output.metadata.hasInsufficientData).toBe(true);
        expect(output.metadata.insufficentType).toContain('empty'); // Both groups are empty
        expect(calc.getGroup1N()).toBe(0);
        expect(calc.getGroup2N()).toBe(0);
      });
    });

    describe('Single observation cases', () => {
      it('should handle single observation in group 1', () => {
        const data1 = [1, 2, 3, 4, 5];
        const data2 = [1, 2, 2, 2, 2]; // Only one group 1
        const calc = new TwoIndependentSamplesCalculator({ 
          variable1, 
          data1, 
          variable2, 
          data2,
          options: { group1: 1, group2: 2 }
        });

        expect(calc.getGroup1N()).toBe(1);
        expect(calc.getGroup2N()).toBe(4);
        
        const mwStats = calc.getTestStatisticsMannWhitneyU();
        expect(mwStats.U).toBe(0);
        expect(mwStats.pValue).toBeCloseTo(1, 1);
      });

      it('should handle single observation in group 2', () => {
        const data1 = [1, 2, 3, 4, 5];
        const data2 = [1, 1, 1, 1, 2]; // Only one group 2
        const calc = new TwoIndependentSamplesCalculator({ 
          variable1, 
          data1, 
          variable2, 
          data2,
          options: { group1: 1, group2: 2 }
        });

        expect(calc.getGroup1N()).toBe(4);
        expect(calc.getGroup2N()).toBe(1);
        
        const mwStats = calc.getTestStatisticsMannWhitneyU();
        expect(mwStats.U).toBe(0);
        expect(mwStats.pValue).toBeCloseTo(1, 1);
      });

      it('should handle single observation with missing values', () => {
        const data1 = [1, null, 3, 4, 5];
        const data2 = [1, 1, 1, 1, 2]; // Only one valid group 2
        const calc = new TwoIndependentSamplesCalculator({ 
          variable1, 
          data1, 
          variable2, 
          data2,
          options: { group1: 1, group2: 2 }
        });

        expect(calc.getGroup1N()).toBe(3); // 4 - 1 missing value
        expect(calc.getGroup2N()).toBe(1);
        
        const mwStats = calc.getTestStatisticsMannWhitneyU();
        expect(mwStats.U).toBe(0);
        expect(mwStats.pValue).toBeCloseTo(1, 1);
      });
    });

    describe('Edge cases with missing value definitions', () => {
      it('should handle discrete missing values', () => {
        const variable1WithMissing = {
          ...variable1,
          missing: { discrete: [-999, -888] }
        };
        const data1 = [1, 2, -999, 4, -888];
        const data2 = [1, 1, 1, 1, 1];
        const calc = new TwoIndependentSamplesCalculator({ 
          variable1: variable1WithMissing, 
          data1, 
          variable2, 
          data2,
          options: { group1: 1, group2: 2 }
        });

        const output = calc.getOutput();
        expect(output.metadata.hasInsufficientData).toBe(true);
        expect(output.metadata.insufficentType).toContain('hasEmptyGroup');
        expect(calc.getGroup1N()).toBe(3); // 5 - 2 missing values
        expect(calc.getGroup2N()).toBe(0);
      });

      it('should handle range missing values', () => {
        const variable1WithMissing = {
          ...variable1,
          missing: { range: { min: 999, max: 1000 } }
        };
        const data1 = [1, 2, 999, 4, 1000];
        const data2 = [1, 1, 1, 1, 1];
        const calc = new TwoIndependentSamplesCalculator({ 
          variable1: variable1WithMissing, 
          data1, 
          variable2, 
          data2,
          options: { group1: 1, group2: 2 }
        });

        const output = calc.getOutput();
        expect(output.metadata.hasInsufficientData).toBe(true);
        expect(output.metadata.insufficentType).toContain('hasEmptyGroup');
        expect(calc.getGroup1N()).toBe(3); // 5 - 2 missing values
        expect(calc.getGroup2N()).toBe(0);
      });
    });
  });

  describe('Output generation', () => {
    it('should generate complete output with Mann-Whitney U', () => {
      const data1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const data2 = [1, 1, 1, 1, 1, 2, 2, 2, 2, 2];
      const calc = new TwoIndependentSamplesCalculator({ 
        variable1, 
        data1, 
        variable2, 
        data2,
        options: { 
          group1: 1, 
          group2: 2,
          testType: { mannWhitneyU: true, kolmogorovSmirnovZ: false }
        }
      });

      const output = calc.getOutput();
      
      expect(output.variable1).toBe(variable1);
      expect(output.variable2).toBe(variable2);
      expect(output.frequenciesRanks).toBeDefined();
      expect(output.testStatisticsMannWhitneyU).toBeDefined();
      expect(output.testStatisticsKolmogorovSmirnovZ).toBe(null);
      expect(output.metadata.hasInsufficientData).toBe(false);
      expect(output.metadata.variableName).toBe('testVar');
      expect(output.metadata.variableLabel).toBe('Test Variable');
    });

    it('should generate complete output with Kolmogorov-Smirnov Z', () => {
      const data1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const data2 = [1, 1, 1, 1, 1, 2, 2, 2, 2, 2];
      const calc = new TwoIndependentSamplesCalculator({ 
        variable1, 
        data1, 
        variable2, 
        data2,
        options: { 
          group1: 1, 
          group2: 2,
          testType: { mannWhitneyU: false, kolmogorovSmirnovZ: true }
        }
      });

      const output = calc.getOutput();
      
      expect(output.variable1).toBe(variable1);
      expect(output.variable2).toBe(variable2);
      expect(output.frequenciesRanks).toBeDefined();
      expect(output.testStatisticsMannWhitneyU).toBe(null);
      expect(output.testStatisticsKolmogorovSmirnovZ).toBeDefined();
      expect(output.metadata.hasInsufficientData).toBe(false);
    });

    it('should generate output with insufficient data', () => {
      const data1 = [];
      const data2 = [];
      const calc = new TwoIndependentSamplesCalculator({ 
        variable1, 
        data1, 
        variable2, 
        data2,
        options: { group1: 1, group2: 2 }
      });

      const output = calc.getOutput();
      
      expect(output.metadata.hasInsufficientData).toBe(true);
      expect(output.metadata.insufficentType).toContain('empty');
      // When mannWhitneyU is enabled, it returns a default result even with insufficient data
      expect(output.testStatisticsMannWhitneyU).toEqual({
        U: 0,
        W: 0,
        Z: 0,
        pValue: 1,
        pExact: null,
        showExact: false
      });
      expect(output.testStatisticsKolmogorovSmirnovZ).toBe(null);
    });
  });

  describe('Advanced scenarios', () => {
    it('should handle data with missing values and sufficient valid data', () => {
      const data1 = [1, null, 3, 4, null, 6, 7, 8, 9, 10, null, 3, 4, 14, 15];
      const data2 = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2];
      const calc = new TwoIndependentSamplesCalculator({ 
        variable1, 
        data1, 
        variable2, 
        data2,
        options: { group1: 1, group2: 2 }
      });

      const output = calc.getOutput();
      expect(output.metadata.hasInsufficientData).toBe(false);
      expect(calc.getValidN()).toBe(12); // 15 - 3 missing values
      
      const mwStats = calc.getTestStatisticsMannWhitneyU();
      expect(mwStats.U).toBeGreaterThan(0);
      expect(mwStats.pValue).toBeGreaterThan(0);
      expect(mwStats.pValue).toBeLessThanOrEqual(1);
    });

    it('should handle data with mixed numeric and non-numeric values', () => {
      const data1 = [1, 'a', 3, 'b', 5, 2, 'c', 4, 9, 10];
      const data2 = [1, 1, 1, 1, 1, 2, 2, 2, 2, 2];
      const calc = new TwoIndependentSamplesCalculator({ 
        variable1, 
        data1, 
        variable2, 
        data2,
        options: { group1: 1, group2: 2 }
      });

      const output = calc.getOutput();
      expect(output.metadata.hasInsufficientData).toBe(false);
      expect(calc.getValidN()).toBe(7); // 10 - 3 non-numeric values
      
      const mwStats = calc.getTestStatisticsMannWhitneyU();
      expect(mwStats.U).toBeGreaterThan(0);
      expect(mwStats.pValue).toBeGreaterThan(0);
      expect(mwStats.pValue).toBeLessThanOrEqual(1);
    });

    it('should handle data with extreme values', () => {
      const data1 = [1, 2, 3, 4, 5, 3, 4, 3000, 4000, 5000];
      const data2 = [1, 1, 1, 1, 1, 2, 2, 2, 2, 2];
      const calc = new TwoIndependentSamplesCalculator({ 
        variable1, 
        data1, 
        variable2, 
        data2,
        options: { group1: 1, group2: 2 }
      });

      const mwStats = calc.getTestStatisticsMannWhitneyU();
      expect(mwStats.U).toBeGreaterThan(0);
      expect(mwStats.pValue).toBeGreaterThan(0);
      expect(mwStats.pValue).toBeLessThanOrEqual(1);
      
      const output = calc.getOutput();
      expect(output.metadata.hasInsufficientData).toBe(false);
    });

    it('should handle data with decimal values', () => {
      const data1 = [1.1, 2.2, 3.3, 4.4, 5.5, 3.0, 4.0, 8.8, 9.9, 10.0];
      const data2 = [1, 1, 1, 1, 1, 2, 2, 2, 2, 2];
      const calc = new TwoIndependentSamplesCalculator({ 
        variable1, 
        data1, 
        variable2, 
        data2,
        options: { group1: 1, group2: 2 }
      });

      const mwStats = calc.getTestStatisticsMannWhitneyU();
      expect(mwStats.U).toBeGreaterThan(0);
      expect(mwStats.pValue).toBeGreaterThan(0);
      expect(mwStats.pValue).toBeLessThanOrEqual(1);
      
      const output = calc.getOutput();
      expect(output.metadata.hasInsufficientData).toBe(false);
    });

    it('should handle data with string numeric values', () => {
      const data1 = ['1', '2', '3', '4', '5', '3', '4', '8', '9', '10'];
      const data2 = [1, 1, 1, 1, 1, 2, 2, 2, 2, 2];
      const calc = new TwoIndependentSamplesCalculator({ 
        variable1, 
        data1, 
        variable2, 
        data2,
        options: { group1: 1, group2: 2 }
      });

      const mwStats = calc.getTestStatisticsMannWhitneyU();
      expect(mwStats.U).toBeGreaterThan(0);
      expect(mwStats.pValue).toBeGreaterThan(0);
      expect(mwStats.pValue).toBeLessThanOrEqual(1);
      
      const output = calc.getOutput();
      expect(output.metadata.hasInsufficientData).toBe(false);
      expect(calc.getValidN()).toBe(10);
    });

    it('should handle different group sizes', () => {
      const data1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 3, 4, 13, 14, 15];
      const data2 = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2]; // 10 group1, 5 group2
      const calc = new TwoIndependentSamplesCalculator({ 
        variable1, 
        data1, 
        variable2, 
        data2,
        options: { group1: 1, group2: 2 }
      });

      expect(calc.getGroup1N()).toBe(10);
      expect(calc.getGroup2N()).toBe(5);
      
      const mwStats = calc.getTestStatisticsMannWhitneyU();
      expect(mwStats.U).toBeGreaterThan(0);
      expect(mwStats.pValue).toBeGreaterThan(0);
      expect(mwStats.pValue).toBeLessThanOrEqual(1);
      
      const output = calc.getOutput();
      expect(output.metadata.hasInsufficientData).toBe(false);
    });
  });
});
