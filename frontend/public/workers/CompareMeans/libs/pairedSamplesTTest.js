/**
 * @file /libs/pairedSamplesTTest.js
 * @class PairedSamplesTTestCalculator
 * @description
 * Class for performing paired samples t-test analysis.
 * Compares means between two related variables.
 */
import stdlibstatsBaseDistsTCdf from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-t-cdf@0.2.2/+esm'
import stdlibstatsBaseDistsTQuantile from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-t-quantile@0.2.2/+esm'
import { checkIsMissing, isNumeric } from './utils.js';

class PairedSamplesTTestCalculator {
    /**
     * @param {object} params - Parameters for the analysis.
     * @param {object} params.variable1 - First variable definition.
     * @param {Array<any>} params.data1 - Data array for the first variable.
     * @param {object} params.variable2 - Second variable definition.
     * @param {Array<any>} params.data2 - Data array for the second variable.
     * @param {object} params.options - Additional options from the main thread.
     */
    constructor({ pair, variable1, data1, variable2, data2, options = {} }) {
        console.log('PairedSamplesTTestCalculator constructor');
        this.pair = pair;
        this.variable1 = variable1;
        this.data1 = data1;
        this.variable2 = variable2;
        this.data2 = data2;
        this.options = options;
        this.initialized = false;

        // Extract options
        this.calculateStandardizer = options.calculateStandardizer || { standardDeviation: true };
        this.estimateEffectSize = options.estimateEffectSize || false;

        // Properties to be calculated
        this.validData1 = [];
        this.validData2 = [];
        this.pairedData = [];
        this.N = 0;

        /** @private */
        this.memo = {};
    }

    #initialize() {
        if (this.initialized) return;

        // Filter valid data
        const isNumericType1 = ['scale', 'date'].includes(this.variable1.measure);
        const isNumericType2 = ['scale', 'date'].includes(this.variable2.measure);

        // Create arrays with indices for tracking pairs
        const indexedData1 = this.data1.map((value, index) => ({
            value: !checkIsMissing(value, this.variable1.missing, isNumericType1) && isNumeric(value) ? 
                   parseFloat(value) : null,
            originalIndex: index
        })).filter(item => item.value !== null);

        const indexedData2 = this.data2.map((value, index) => ({
            value: !checkIsMissing(value, this.variable2.missing, isNumericType2) && isNumeric(value) ? 
                   parseFloat(value) : null,
            originalIndex: index
        })).filter(item => item.value !== null);

        // Match pairs based on originalIndex
        this.pairedData = [];
        for (const item1 of indexedData1) {
            const matchingItem2 = indexedData2.find(item2 => item2.originalIndex === item1.originalIndex);
            if (matchingItem2) {
                this.pairedData.push({
                    value1: item1.value,
                    value2: matchingItem2.value,
                    originalIndex: item1.originalIndex,
                    difference: item1.value - matchingItem2.value
                });
            }
        }

        // Extract values for easier access
        this.validData1 = this.pairedData.map(pair => pair.value1);
        this.validData2 = this.pairedData.map(pair => pair.value2);
        this.differences = this.pairedData.map(pair => pair.difference);
        
        // Calculate basic statistics
        this.N = this.pairedData.length;

        this.initialized = true;
    }

    getN() { this.#initialize(); return this.N; }

    /**
     * Calculate mean of an array
     * @param {Array<number>} arr - Array of values
     * @returns {number} Mean
     */
    #mean(arr) {
        if (!arr || arr.length === 0) return 0;
        return arr.reduce((sum, x) => sum + x, 0) / arr.length;
    }
    
    /**
     * Calculate standard deviation of an array
     * @param {Array<number>} arr - Array of values
     * @param {number} meanValue - Mean of the array
     * @returns {number} Standard deviation
     */
    #stdDev(arr, meanValue) {
        if (!arr || arr.length <= 1) return 0;
        const sumSq = arr.reduce((sum, x) => sum + Math.pow(x - meanValue, 2), 0);
        return Math.sqrt(sumSq / (arr.length - 1));
    }

    /**
     * Calculate standard error
     * @param {number} sd - Standard deviation
     * @param {number} n - Sample size
     * @returns {number} Standard error
     */
    #stdError(sd, n) {
        return sd / Math.sqrt(n);
    }

    /**
     * Calculate variance of an array
     * @param {Array<number>} arr - Array of values
     * @param {number} meanValue - Mean of the array
     * @returns {number} Variance
     */
    #variance(arr, meanValue) {
        if (!arr || arr.length <= 1) return 0;
        const sumSq = arr.reduce((sum, x) => sum + Math.pow(x - meanValue, 2), 0);
        return sumSq / (arr.length - 1);
    }

    #meanDiff() {
        return this.#mean(this.differences);
    }

    #stdDevDiff() {
        return this.#stdDev(this.differences, this.#meanDiff());
    }

    /**
     * Calculate covariance between two arrays
     * @param {Array<number>} arr1 - First array
     * @param {Array<number>} arr2 - Second array
     * @param {number} mean1 - Mean of first array
     * @param {number} mean2 - Mean of second array
     * @returns {number} Covariance
     */
    #covariance(arr1, arr2, mean1, mean2) {
        if (!arr1 || !arr2 || arr1.length !== arr2.length || arr1.length <= 1) return 0;
        let sum = 0;
        for (let i = 0; i < arr1.length; i++) {
            sum += (arr1[i] - mean1) * (arr2[i] - mean2);
        }
        return sum / (arr1.length - 1);
    }

    /**
     * Calculate correlation coefficient between two arrays
     * @param {Array<number>} arr1 - First array
     * @param {Array<number>} arr2 - Second array
     * @returns {number} Correlation coefficient
     */
    #correlation(arr1, arr2) {
        const mean1 = this.#mean(arr1);
        const mean2 = this.#mean(arr2);
        const numerator = this.#covariance(arr1, arr2, mean1, mean2) * (arr1.length - 1);
        const denominator = Math.sqrt(
            arr1.reduce((sum, x) => sum + Math.pow(x - mean1, 2), 0) * 
            arr2.reduce((sum, x) => sum + Math.pow(x - mean2, 2), 0)
        );
        return numerator / denominator;
    }

    getStatistics() {
        if (this.memo.statistics) return this.memo.statistics;
        this.#initialize();

        // Validate input
        if (this.N === 0) {
            const result = {
                group1: {
                    label: this.variable1.label || this.variable1.name,
                    N: 0,
                    Mean: 0,
                    StdDev: 0,
                    SEMean: 0
                },
                group2: {
                    label: this.variable2.label || this.variable2.name,
                    N: 0,
                    Mean: 0,
                    StdDev: 0,
                    SEMean: 0
                }
            };
            this.memo.statistics = result;
            return result;
        }
        

        // Calculate statistics for each variable
        const mean1 = this.#mean(this.validData1);
        const mean2 = this.#mean(this.validData2);

        if (this.N <= 1) {
            const result = {
                group1: {
                    label: this.variable1.label || this.variable1.name,
                    N: this.N,
                    Mean: mean1,
                    StdDev: 0,
                    SEMean: 0
                },
                group2: {
                    label: this.variable2.label || this.variable2.name,
                    N: this.N,
                    Mean: mean2,
                    StdDev: 0,
                    SEMean: 0
                }
            };
            this.memo.statistics = result;
            return result;
        }
        const stdDev1 = this.#stdDev(this.validData1, mean1);
        const stdErr1 = this.#stdError(stdDev1, this.N);
        const stdDev2 = this.#stdDev(this.validData2, mean2);
        const stdErr2 = this.#stdError(stdDev2, this.N);

        const result = {
            group1: {
                label: this.variable1.label || this.variable1.name,
                N: this.N,
                Mean: mean1,
                StdDev: stdDev1,
                SEMean: stdErr1
            },
            group2: {
                label: this.variable2.label || this.variable2.name,
                N: this.N,
                Mean: mean2,
                StdDev: stdDev2,
                SEMean: stdErr2
            },
        };

        this.memo.statistics = result;
        return result;
    }

    getCorrelations() {
        if (this.memo.correlations) return this.memo.correlations;
        this.#initialize();

        const group1Label = this.variable1.label || this.variable1.name;
        const group2Label = this.variable2.label || this.variable2.name;
        const label = `${group1Label} - ${group2Label}`;

        // Validate input
        if (this.N === 0) {
            const result = {
                correlationLabel: label,
                N: 0,
                Correlation: 0,
                correlationPValue: 1
            };
            this.memo.correlations = result;
            return result;
        }

        // Calculate correlation
        const correlation = this.#correlation(this.validData1, this.validData2);
        
        // Calculate t-value for correlation significance
        const t = correlation * Math.sqrt((this.N - 2) / (1 - Math.pow(correlation, 2)));
        const df = this.N - 2;
        const pValue = 2 * (1 - stdlibstatsBaseDistsTCdf(Math.abs(t), df)); // Two-tailed p-value

        const result = {
            correlationLabel: label,
            N: this.N,
            Correlation: correlation,
            correlationPValue: pValue
        };

        this.memo.correlations = result;
        return result;
    }

    getTestResults() {
        if (this.memo.testResults) return this.memo.testResults;
        this.#initialize();

        const group1Label = this.variable1.label || this.variable1.name;
        const group2Label = this.variable2.label || this.variable2.name;
        const label = `${group1Label} - ${group2Label}`;

        // Validate input
        if (this.N === 0) {
            const result = {
                label: label,
                N: 0,
                Mean: 0,
                StdDev: 0,
                SEMean: 0,
                LowerCI: 0,
                UpperCI: 0,
                t: 0,
                df: 0,
                pValue: 1
            };
            this.memo.testResults = result;
            return result;
        }

        // Calculate mean difference
        const meanDiff = this.#mean(this.differences);
        
        // Calculate standard deviation of differences
        const stdDevDiff = this.#stdDev(this.differences, meanDiff);
        
        // Calculate standard error of differences
        const stdErrDiff = this.#stdError(stdDevDiff, this.N);
        
        // Calculate t-value
        const t = meanDiff / stdErrDiff;
        
        // Degrees of freedom
        const df = this.N - 1;
        
        // Calculate p-value (two-tailed)
        const pValue = 2 * (1 - stdlibstatsBaseDistsTCdf(Math.abs(t), df));
        
        // Calculate confidence interval (95%)
        const tCritical = stdlibstatsBaseDistsTQuantile(0.975, df); // 95% CI
        const ciLower = meanDiff - (tCritical * stdErrDiff);
        const ciUpper = meanDiff + (tCritical * stdErrDiff);

        // Calculate effect size (Cohen's d) if requested
        let effectSize = null;
        if (this.estimateEffectSize) {
            // Cohen's d = mean difference / standardizer
            let standardizer;
            
            if (this.calculateStandardizer.standardDeviation) {
                standardizer = stdDevDiff;
            } else if (this.calculateStandardizer.correctedStandardDeviation) {
                // Corrected for correlation between measures
                const correlation = this.getCorrelations().correlation;
                const pooledStdDev = Math.sqrt((Math.pow(this.#stdDev(this.validData1, this.#mean(this.validData1)), 2) + 
                                              Math.pow(this.#stdDev(this.validData2, this.#mean(this.validData2)), 2)) / 2);
                standardizer = pooledStdDev * Math.sqrt(2 * (1 - correlation));
            } else if (this.calculateStandardizer.averageOfVariances) {
                // Average of standard deviations
                standardizer = (this.#stdDev(this.validData1, this.#mean(this.validData1)) + 
                               this.#stdDev(this.validData2, this.#mean(this.validData2))) / 2;
            }
            
            effectSize = meanDiff / standardizer;
        }

        const result = {
            label: label,
            Mean: meanDiff,
            StdDev: stdDevDiff,
            SEMean: stdErrDiff,
            LowerCI: ciLower,
            UpperCI: ciUpper,
            t, df, pValue
        };

        this.memo.testResults = result;
        return result;
    }

    getOutput() {
        this.#initialize();

        let hasInsufficientData = false;
        let insufficientType = [];

        if (this.pairedData.length === 0) {
            hasInsufficientData = true;
            insufficientType.push('empty');
        }

        if (this.pairedData.length === 1) {
            hasInsufficientData = true;
            insufficientType.push('single');
        }

        const pairedSamplesStatistics = this.getStatistics();
        const stdDevDiff = this.#stdDevDiff();
        if (stdDevDiff === 0 && this.pairedData.length > 1) {
            hasInsufficientData = true;
            insufficientType.push('stdDev');
        }

        const pairedSamplesCorrelation = this.getCorrelations();
        const pairedSamplesTest = this.getTestResults();

        return {
            variable1: this.variable1,
            variable2: this.variable2,
            pairedSamplesStatistics,
            pairedSamplesCorrelation,
            pairedSamplesTest,
            metadata: {
                pair: this.pair,
                hasInsufficientData,
                insufficientType,
                variable1Label: this.variable1.label,
                variable1Name: this.variable1.name,
                variable2Label: this.variable2.label,
                variable2Name: this.variable2.name
            }
        };
    }
}

globalThis.PairedSamplesTTestCalculator = PairedSamplesTTestCalculator;
export default PairedSamplesTTestCalculator;
