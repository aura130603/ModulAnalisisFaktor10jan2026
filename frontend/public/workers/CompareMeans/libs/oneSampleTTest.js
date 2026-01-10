/**
 * @file /libs/oneSampleTTest.js
 * @class OneSampleTTestCalculator
 * @description
 * Kelas untuk melakukan analisis One-Sample T-Test.
 * Menghitung statistik deskriptif dan hasil uji t-test.
 */
import stdlibstatsBaseDistsTQuantile from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-t-quantile@0.2.2/+esm'
import stdlibstatsBaseDistsTCdf from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-t-cdf@0.2.2/+esm'
import { checkIsMissing, isNumeric } from './utils.js';

class OneSampleTTestCalculator {
    /**
     * @param {object} params - Parameter untuk analisis.
     * @param {object} params.variable - Objek definisi variabel.
     * @param {Array<any>} params.data - Array data untuk variabel ini.
     * @param {object} params.options - Opsi tambahan dari main thread.
     */
    constructor({ variable1, data1, options = {} }) {
        console.log('OneSampleTTestCalculator constructor');
        this.variable1 = variable1;
        this.data1 = data1;
        this.options = options;
        this.initialized = false;
        
        // Ekstrak opsi dari options
        this.testValue = options.testValue !== undefined ? options.testValue : 0;
        this.confidenceLevel = (options.confidenceLevel !== undefined && options.confidenceLevel !== null)
            ? options.confidenceLevel
            : 0.95;
        this.estimateEffectSize = options.estimateEffectSize || false;
        
        // Properti yang akan dihitung
        this.validData = [];
        this.N = 0;
        
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

        // Filter data yang valid
        this.validData = this.data1
            .filter(value => !checkIsMissing(value, this.variable1.missing, isNumericType) && isNumeric(value))
            .map(value => parseFloat(value));
        
        // Hitung Total N
        this.N = this.validData.length;

        this.initialized = true;
    }
    
    getN() { this.#initialize(); return this.data1.length; }
    getValidN() { this.#initialize(); return this.N; }
    
    /**
     * Menghitung mean dari array
     * @param {Array<number>} arr - Array nilai
     * @returns {number} Mean
     */
    #mean(arr) {
        if (!arr || arr.length === 0) return null;
        return arr.reduce((sum, x) => sum + x, 0) / this.N;
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
     * Mendapatkan statistik sampel tunggal
     * @returns {object} Statistik sampel tunggal
     */
    getOneSampleStatistics() {
        if (this.memo.sampleStats) return this.memo.sampleStats;
        
        this.#initialize();
        
        const meanValue = this.#mean(this.validData);
        const stdDevValue = this.#stdDev(this.validData, meanValue);
        const stdErrMean = this.#stdError(stdDevValue, this.N);
        
        const result = {
            N: this.N,
            Mean: meanValue,
            StdDev: stdDevValue,
            SEMean: stdErrMean
        };
        
        this.memo.sampleStats = result;
        return result;
    }
    
    /**
     * Melakukan t-test untuk sampel tunggal
     * @returns {object} Hasil t-test
     */
    #tTest() {
        if (this.memo.tTest) return this.memo.tTest;
        
        this.#initialize();
        
        const stats = this.getOneSampleStatistics();
        const meanValue = stats.Mean;
        const stdErrMean = stats.SEMean;
        
        // Skip if we can't calculate standard error
        if (this.N <= 1 || stdErrMean === 0) {
            return {
                t: null,
                df: null,
                sig: null,
                meanDifference: null,
                lower: null,
                upper: null
            };
        }
        
        const meanDiff = meanValue - this.testValue;
        const t = meanDiff / stdErrMean;
        const df = this.N - 1;
        
        // Calculate p-value and confidence intervals
        let sig, lower, upper;
        try {
            const alpha = 1 - this.confidenceLevel;
            const tCritical = stdlibstatsBaseDistsTQuantile(1 - alpha/2, df);
            sig = 2 * (1 - stdlibstatsBaseDistsTCdf(Math.abs(t), df));
            lower = meanDiff - tCritical * stdErrMean;
            upper = meanDiff + tCritical * stdErrMean;
        } catch (err) {
            console.error(`Error calculating t-test statistics:`, err);
            sig = null;
            lower = null;
            upper = null;
        }
        
        const result = {
            t,
            df,
            sig,
            meanDifference: meanDiff,
            lower,
            upper
        };
        
        this.memo.tTest = result;
        return result;
    }
    
    /**
     * Mendapatkan hasil uji one-sample t-test
     * @returns {object} Hasil uji one-sample t-test
     */
    getOneSampleTest() {  
        if (this.memo.testResults) return this.memo.testResults;
        
        this.#initialize();
        
        const tTestResult = this.#tTest();
        
        const result = {
            T: tTestResult.t,
            DF: tTestResult.df,
            PValue: tTestResult.sig,
            MeanDifference: tTestResult.meanDifference,
            Lower: tTestResult.lower,
            Upper: tTestResult.upper
        };
        
        this.memo.testResults = result;
        return result;
    }

    /**
     * Mengambil semua hasil statistik.
     * @returns {Object} Objek hasil yang berisi statistik sampel dan hasil uji.
     */
    getOutput() {
        this.#initialize();
        
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
        if ((oneSampleStatistics.StdDev === null || oneSampleStatistics.StdDev === undefined || oneSampleStatistics.StdDev === 0) && this.validData.length > 1) {
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
}

globalThis.OneSampleTTestCalculator = OneSampleTTestCalculator;
export default OneSampleTTestCalculator;