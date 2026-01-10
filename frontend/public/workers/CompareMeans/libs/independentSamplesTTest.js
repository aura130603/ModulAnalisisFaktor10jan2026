/**
 * @file /libs/independentSamplesTTest.js
 * @class IndependentSamplesTTestCalculator
 * @description
 * Kelas untuk melakukan analisis Independent Samples T-Test.
 * Menghitung statistik deskriptif dan hasil uji independent samples t-test.
 */
import stdlibstatsBaseDistsTCdf from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-t-cdf@0.2.2/+esm'
import stdlibstatsBaseDistsTQuantile from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-t-quantile@0.2.2/+esm'
import stdlibstatsBaseDistsFCdf from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-f-cdf@0.2.2/+esm'
import { checkIsMissing, isNumeric } from './utils.js';

class IndependentSamplesTTestCalculator {
    /**
     * @param {object} params - Parameter untuk analisis.
     * @param {object} params.variable - Objek definisi variabel.
     * @param {Array<any>} params.data - Array data untuk variabel ini.
     * @param {object} params.groupingVariable - Objek definisi variabel pengelompokan.
     * @param {Array<any>} params.groupingData - Array data untuk variabel pengelompokan.
     * @param {object} params.options - Opsi tambahan dari main thread.
     */
    constructor({ variable1, data1, variable2, data2, options = {} }) {
        console.log('IndependentSamplesTTestCalculator constructor');
        this.variable1 = variable1;
        this.data1 = data1;
        this.variable2 = variable2;
        this.data2 = data2;
        this.options = options;
        this.initialized = false;
        
        // Ekstrak opsi dari options
        this.defineGroups = options.defineGroups || { useSpecifiedValues: true };
        this.group1 = options.group1 || 0;
        this.group2 = options.group2 || 0;
        this.cutPointValue = options.cutPointValue || 0;
        this.estimateEffectSize = options.estimateEffectSize || false;
        
        // Properti yang akan dihitung
        this.validData = [];
        this.validGroupingData = [];
        this.group1Data = [];
        this.group2Data = [];
        this.N = 0;
        this.groupingN = 0;
        
        /** @private */
        this.memo = {};
    }
    
    /**
     * @private
     * Memproses data untuk analisis
     */
    #initialize() {
        if (this.initialized) return;

        const isNumericType = ['scale', 'date'].includes(this.variable1.measure);
        const isNumericGroupingType = ['scale', 'date'].includes(this.variable2.measure);

        // Filter data yang valid
        this.validData = this.data1
            .filter((value, index) => {
                const isValidData = !checkIsMissing(value, this.variable1.missing, isNumericType) && isNumeric(value);
                const isValidGrouping = index < this.data2.length && 
                    !checkIsMissing(this.data2[index], this.variable2.missing, isNumericGroupingType);
                return isValidData && isValidGrouping;
            })
            .map(value => parseFloat(value));
        
        this.validGroupingData = this.data2
            .filter((value, index) => {
                const isValidData = index < this.data1.length && 
                    !checkIsMissing(this.data1[index], this.variable1.missing, isNumericType) && 
                    isNumeric(this.data1[index]);
                const isValidGrouping = !checkIsMissing(value, this.variable2.missing, isNumericGroupingType);
                return isValidData && isValidGrouping;
            });
        
        // Separate data into two groups based on grouping variable
        if (this.defineGroups.useSpecifiedValues) {
            this.group1Data = this.validData.filter((_, index) => 
                this.validGroupingData[index] === this.group1);
            this.group2Data = this.validData.filter((_, index) => 
                this.validGroupingData[index] === this.group2);
        } else if (this.defineGroups.cutPoint) {
            this.group1Data = this.validData.filter((_, index) => 
                parseFloat(this.validGroupingData[index]) >= this.cutPointValue);
            this.group2Data = this.validData.filter((_, index) => 
                parseFloat(this.validGroupingData[index]) < this.cutPointValue);
        }
        
        // Hitung Total N
        this.N = this.validData.length;
        this.groupingN = this.validGroupingData.length;
        this.group1N = this.group1Data.length;
        this.group2N = this.group2Data.length;

        this.initialized = true;
    }
    
    getN() { this.#initialize(); return this.N; }
    getGroupingN() { this.#initialize(); return this.groupingN; }
    getGroup1N() { this.#initialize(); return this.group1N; }
    getGroup2N() { this.#initialize(); return this.group2N; }
    
    /**
     * Menghitung mean dari array
     * @param {Array<number>} arr - Array nilai
     * @returns {number} Mean
     */
    #mean(arr) {
        if (!arr || arr.length === 0) return null;
        return arr.reduce((sum, x) => sum + x, 0) / arr.length;
    }
    
    /**
     * Menghitung standard deviation dari array
     * @param {Array<number>} arr - Array nilai
     * @param {number} meanValue - Mean dari array
     * @returns {number} Standard deviation
     */
    #stdDev(arr, meanValue) {
        if (!arr || arr.length <= 1) return null;
        const sumSq = arr.reduce((sum, x) => sum + Math.pow(x - meanValue, 2), 0);
        return Math.sqrt(sumSq / (arr.length - 1));
    }
    
    /**
     * Menghitung standard error dari mean
     * @param {number} stdDev - Standard deviation
     * @param {number} n - Jumlah sampel
     * @returns {number} Standard error mean
     */
    #stdError(stdDev, n) {
        if (n <= 1) return null;
        return stdDev / Math.sqrt(n);
    }
    
    /**
     * Melakukan Levene's Test untuk kesamaan varians
     * @returns {object} Hasil Levene's Test
     */
    #leveneTest() {
        if (this.memo.levene) return this.memo.levene;
        
        this.#initialize();
        
        // Calculate X̄k (mean of each group)
        const mean1 = this.#mean(this.group1Data);
        const mean2 = this.#mean(this.group2Data);
        
        // Calculate Zki = |Xki - X̄k| (absolute deviations from group means)
        const Z1 = this.group1Data.map(x => Math.abs(x - mean1));
        const Z2 = this.group2Data.map(x => Math.abs(x - mean2));
        
        // Calculate weights (assuming equal weights wki = 1)
        const w1 = Array(Z1.length).fill(1);
        const w2 = Array(Z2.length).fill(1);
        
        // Calculate Wk (sum of weights for each group)
        const W1 = w1.reduce((sum, w) => sum + w, 0);
        const W2 = w2.reduce((sum, w) => sum + w, 0);
        
        // Calculate Z̄k (weighted mean of absolute deviations for each group)
        const Z1_bar = Z1.reduce((sum, z, i) => sum + w1[i] * z, 0) / W1;
        const Z2_bar = Z2.reduce((sum, z, i) => sum + w2[i] * z, 0) / W2;
        
        // Calculate Z̄ (overall weighted mean of absolute deviations)
        const Z_bar = (W1 * Z1_bar + W2 * Z2_bar) / (W1 + W2);
        
        // Calculate numerator: (W-2)∑Wk(Z̄k - Z̄)²
        const W = W1 + W2;
        const numerator = (W - 2) * (
            W1 * Math.pow(Z1_bar - Z_bar, 2) +
            W2 * Math.pow(Z2_bar - Z_bar, 2)
        );
        
        // Calculate denominator: ∑∑wki(Zki - Z̄k)²
        const denominator = 
            Z1.reduce((sum, z, i) => sum + w1[i] * Math.pow(z - Z1_bar, 2), 0) +
            Z2.reduce((sum, z, i) => sum + w2[i] * Math.pow(z - Z2_bar, 2), 0);
        
        // Calculate Levene statistic (L)
        const L = numerator / denominator;
        
        // Calculate degrees of freedom
        const df1 = 1; // k - 1 where k is number of groups (2-1 = 1)
        const df2 = W - 2; // N - k where N is total sample size and k is number of groups
        
        // Calculate significance using F-distribution
        const Sig = 1 - stdlibstatsBaseDistsFCdf(L, df1, df2);
        
        const result = { 
            F: L,
            df1: df1,
            df2: df2,
            Sig: Sig 
        };
        
        this.memo.levene = result;
        return result;
    }
    
    /**
     * Melakukan t-test dengan asumsi varians sama
     * @returns {object} Hasil t-test
     */
    #tTestEqualVariance() {
        if (this.memo.tTestEqual) return this.memo.tTestEqual;
        
        this.#initialize();
        
        const mean1 = this.#mean(this.group1Data);
        const mean2 = this.#mean(this.group2Data);
        const var1 = Math.pow(this.#stdDev(this.group1Data, mean1), 2);
        const var2 = Math.pow(this.#stdDev(this.group2Data, mean2), 2);
        
        const n1 = this.group1Data.length;
        const n2 = this.group2Data.length;
        const df = n1 + n2 - 2;
        
        const pooledVar = ((n1 - 1) * var1 + (n2 - 1) * var2) / df;
        const stdErrorDifference = Math.sqrt(pooledVar * (1/n1 + 1/n2));
        let t = null;
        if (stdErrorDifference !== 0) {
            t = (mean1 - mean2) / stdErrorDifference;
        }
        
        let sig = null;
        if (stdErrorDifference !== 0) {
            sig = 2 * (1 - stdlibstatsBaseDistsTCdf(Math.abs(t), df));
        }
        
        // Calculate confidence intervals
        const tCritical = stdlibstatsBaseDistsTQuantile(0.975, df);
        const meanDiff = mean1 - mean2;
        const lower = meanDiff - tCritical * stdErrorDifference;
        const upper = meanDiff + tCritical * stdErrorDifference;
        
        const result = { 
            t, 
            df, 
            stdErrorDifference, 
            sig,
            meanDifference: meanDiff,
            lower,
            upper
        };
        
        this.memo.tTestEqual = result;
        return result;
    }
    
    /**
     * Melakukan t-test dengan asumsi varians tidak sama
     * @returns {object} Hasil t-test
     */
    #tTestUnequalVariance() {
        if (this.memo.tTestUnequal) return this.memo.tTestUnequal;
        
        this.#initialize();
        
        const mean1 = this.#mean(this.group1Data);
        const mean2 = this.#mean(this.group2Data);
        const var1 = Math.pow(this.#stdDev(this.group1Data, mean1), 2);
        const var2 = Math.pow(this.#stdDev(this.group2Data, mean2), 2);
        
        const n1 = this.group1Data.length;
        const n2 = this.group2Data.length;
        
        const se1 = var1 / n1;
        const se2 = var2 / n2;
        const stdErrorDifference = Math.sqrt(se1 + se2);
        
        const t = (mean1 - mean2) / stdErrorDifference;
        const df = Math.pow(se1 + se2, 2) / (Math.pow(se1, 2)/(n1-1) + Math.pow(se2, 2)/(n2-1));
        
        const sig = 2 * (1 - stdlibstatsBaseDistsTCdf(Math.abs(t), df));
        
        // Calculate confidence intervals
        const tCritical = stdlibstatsBaseDistsTQuantile(0.975, df);
        const meanDiff = mean1 - mean2;
        const lower = meanDiff - tCritical * stdErrorDifference;
        const upper = meanDiff + tCritical * stdErrorDifference;
        
        const result = { 
            t, 
            df, 
            stdErrorDifference, 
            sig,
            meanDifference: meanDiff,
            lower,
            upper
        };
        
        this.memo.tTestUnequal = result;
        return result;
    }
    
    /**
     * Mendapatkan statistik grup
     * @returns {object} Statistik grup
     */
    getGroupStatistics() {
        if (this.memo.groupStats) return this.memo.groupStats;
        
        this.#initialize();
        
        // Group 1 statistics
        const group1Mean = this.#mean(this.group1Data);
        const group1StdDev = this.#stdDev(this.group1Data, group1Mean);
        const group1StdErrMean = this.#stdError(group1StdDev, this.group1N);
        
        // Group 2 statistics
        const group2Mean = this.#mean(this.group2Data);
        const group2StdDev = this.#stdDev(this.group2Data, group2Mean);
        const group2StdErrMean = this.#stdError(group2StdDev, this.group2N);
        
        // Get group labels
        let group1Label, group2Label;
        
        if (this.defineGroups.useSpecifiedValues) {
            const values = this.variable2.values || [];
            group1Label = values.find(v => v.value === this.group1)?.label || this.group1;
            group2Label = values.find(v => v.value === this.group2)?.label || this.group2;
        } else if (this.defineGroups.cutPoint) {
            group1Label = `>= ${this.cutPointValue}`;
            group2Label = `< ${this.cutPointValue}`;
        }
        
        const result = {
            variable2: this.variable2,
            group1: {
                label: group1Label,
                N: this.group1N,
                Mean: group1Mean,
                StdDev: group1StdDev,
                SEMean: group1StdErrMean
            },
            group2: {
                label: group2Label,
                N: this.group2N,
                Mean: group2Mean,
                StdDev: group2StdDev,
                SEMean: group2StdErrMean
            }
        };
        
        this.memo.groupStats = result;
        return result;
    }
    
    /**
     * Mendapatkan hasil uji independent samples t-test
     * @returns {object} Hasil uji independent samples t-test
     */
    getIndependentSamplesTest() {  
        if (this.memo.testResults) return this.memo.testResults;
        
        this.#initialize();
        
        const levene = this.#leveneTest();
        const equalVarTest = this.#tTestEqualVariance();
        const unequalVarTest = this.#tTestUnequalVariance();
        
        const result = {
            levene: {
                F: levene.F,
                Sig: levene.Sig
            },
            equalVariances: {
                t: equalVarTest.t,
                df: equalVarTest.df,
                sig: equalVarTest.sig,
                meanDifference: equalVarTest.meanDifference,
                stdErrorDifference: equalVarTest.stdErrorDifference,
                confidenceInterval: {
                    lower: equalVarTest.lower,
                    upper: equalVarTest.upper
                }
            },
            unequalVariances: {
                t: unequalVarTest.t,
                df: unequalVarTest.df,
                sig: unequalVarTest.sig,
                meanDifference: unequalVarTest.meanDifference,
                stdErrorDifference: unequalVarTest.stdErrorDifference,
                confidenceInterval: {
                    lower: unequalVarTest.lower,
                    upper: unequalVarTest.upper
                }
            }
        };
        
        this.memo.testResults = result;
        return result;
    }

    /**
     * Mengambil semua hasil statistik.
     * @returns {Object} Objek hasil yang berisi statistik grup dan hasil uji.
     */
    getOutput() {
        this.#initialize();

        let hasInsufficientData = false;
        let insufficientType = [];

        if (this.group1N === 0 || this.group2N === 0) {
            hasInsufficientData = true;
            insufficientType.push('empty');
        }
        const groupStatistics = this.getGroupStatistics();
        if (groupStatistics.group1.StdDev === 0 && groupStatistics.group2.StdDev === 0) {
            hasInsufficientData = true;
            insufficientType.push('stdDev');
        }
        const independentSamplesTest = this.getIndependentSamplesTest();
        
        return {
            variable1: this.variable1,
            groupStatistics,
            independentSamplesTest,
            metadata: {
                hasInsufficientData,
                insufficientType,
                variableName: this.variable1.name,
                variableLabel: this.variable1.label
            }
        };
    }
}

globalThis.IndependentSamplesTTestCalculator = IndependentSamplesTTestCalculator;
export default IndependentSamplesTTestCalculator;