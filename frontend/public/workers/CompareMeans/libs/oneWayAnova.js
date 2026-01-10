/**
 * @file oneWayAnova.js
 * @description
 * Calculator for One-Way ANOVA analysis.
 * Calculates ANOVA statistics, descriptive statistics, homogeneity of variance,
 * multiple comparisons (Tukey HSD, Duncan), and homogeneous subsets.
 */
import stdlibstatsBaseDistsStudentizedRangeCdf from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-studentized-range-cdf@0.2.2/+esm'
import stdlibstatsBaseDistsStudentizedRangeQuantile from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-studentized-range-quantile@0.2.1/+esm'
import stdlibstatsBaseDistsTQuantile from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-t-quantile@0.2.2/+esm'
import stdlibstatsBaseDistsFCdf from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-f-cdf@0.2.2/+esm';
import stdlibstatsBaseDistsNormalCdf from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-normal-cdf@0.2.2/+esm'
import { checkIsMissing, isNumeric } from './utils.js';

/**
 * Helper function to calculate total statistics
 * @param {Array} stats Array of descriptive statistics
 * @returns {Object} Total statistics
 */
export function calculateTotalStats(stats) {

}

class OneWayAnovaCalculator {
    /**
     * Constructor for OneWayAnovaCalculator
     * @param {Object} params - Parameters for calculation
     * @param {Object} params.variable - Variable object for analysis
     * @param {Array} params.data - Data array for the variable
     * @param {Object} params.factorVariable - Factor variable object
     * @param {Array} params.factorData - Data array for the factor variable
     * @param {Object} params.options - Analysis options
     */
    constructor({ variable1, data1, variable2, data2, options }) {
        console.log('OneWayAnovaCalculator constructor');
        this.variable1 = variable1;
        this.data1 = data1;
        this.variable2 = variable2;
        this.data2 = data2;
        this.options = options || {};
        this.initialized = false;

        // Ekstrak opsi dari options
        this.equalVariancesAssumed = options.equalVariancesAssumed || false;
        this.statisticsOptions = options.statisticsOptions || false;
        this.estimateEffectSize = options.estimateEffectSize || false;

        // Properti yang akan dihitung
        this.validData = [];
        this.validFactorData = [];
        this.N = 0;
        this.factorN = 0;
        
        /** @private */
        this.memo = {};
    }

    /**
     * @private
     * Memproses data untuk analisis
     */
    #initialize() {
        if (this.initialized) return;

        // Filter data yang valid
        const isNumericType = ['scale', 'date'].includes(this.variable1.measure);
        const isNumericFactorType = ['scale', 'date'].includes(this.variable2.measure);

        // Filter data yang valid dan hanya untuk grup1 atau grup2
        this.validData = this.data1
            .filter((value, index) => {
                const isValidData = !checkIsMissing(value, this.variable1.missing, isNumericType) && isNumeric(value);
                const isValidFactor = index < this.data2.length && 
                    !checkIsMissing(this.data2[index], this.variable2.missing, isNumericFactorType);
                return isValidData && isValidFactor;
            })
            .map(value => parseFloat(value));
        this.validFactorData = this.data2
            .filter((value, index) => {
                const isValidData = index < this.data1.length && 
                    !checkIsMissing(this.data1[index], this.variable1.missing, isNumericType) && isNumeric(this.data1[index]);
                const isValidFactor = !checkIsMissing(value, this.variable2.missing, isNumericFactorType) && isNumeric(value);
                return isValidData && isValidFactor;
            });
        // Hitung statistik dasar
        this.factorN = this.validFactorData.length;
        this.N = this.validData.length;

        this.initialized = true;
    }

    getN() { this.#initialize(); return this.N; }
    getFactorN() { this.#initialize(); return this.factorN; }
    
    
    /**
     * Group data by factor levels
     * @returns {Object} Object with factor levels as keys and arrays of data as values
     */
    groupDataByFactor() {
        if (this.memo.groupedData) return this.memo.groupedData;
        
        this.#initialize();
        
        // Check for insufficient data
        if (this.validData.length === 0 || this.validFactorData.length === 0) {
            this.memo.groupedData = {};
            return {};
        }
        
        const groupedData = {};
        const uniqueFactors = [...new Set(this.validFactorData)];
        uniqueFactors.sort((a, b) => a - b);
        
        // Check if we have at least 2 groups
        if (uniqueFactors.length < 2) {
            this.memo.groupedData = {};
            return {};
        }
        
        const factorLabels = {};
        if (Array.isArray(this.variable2.values)) {
            this.variable2.values.forEach(item => {
                factorLabels[item.value] = item.label;
            });
        } else {
            uniqueFactors.forEach((factor, index) => {
                factorLabels[factor] = `Group ${index + 1}`;
            });
        }
        
        uniqueFactors.forEach(factor => {
            const label = factorLabels[factor] || `Group ${factor}`;
            groupedData[label] = [];
            
            for (let i = 0; i < this.validFactorData.length; i++) {
                if (this.validFactorData[i] === factor && this.validData[i] !== null && this.validData[i] !== undefined) {
                    groupedData[label].push(parseFloat(this.validData[i]));
                }
            }
        });
        
        this.memo.groupedData = groupedData;
        return groupedData;
    }
    
    /**
     * Calculate ANOVA statistics
     * @returns {Object} ANOVA statistics results
     */
    calculateAnovaStatistics() {
        if (this.memo.anovaStats) return this.memo.anovaStats;
        
        const groupedData = this.groupDataByFactor();
        
        // Check for insufficient data
        if (Object.keys(groupedData).length < 2) {
            this.memo.anovaStats = {};
            return {};
        }
        
        // Calculate group means and overall mean
        const groupMeans = {};
        const groupCounts = {};
        let totalSum = 0;
        let totalCount = 0;
        
        Object.entries(groupedData).forEach(([group, values]) => {
            const sum = values.reduce((acc, val) => acc + val, 0);
            const count = values.length;
            
            groupMeans[group] = sum / count;
            groupCounts[group] = count;
            
            totalSum += sum;
            totalCount += count;
        });
        
        const overallMean = totalSum / totalCount;
        
        // Calculate sum of squares
        let betweenGroupsSS = 0;
        let withinGroupsSS = 0;
        
        Object.entries(groupedData).forEach(([group, values]) => {
            const groupMean = groupMeans[group];
            const groupCount = groupCounts[group];
            
            // Between groups sum of squares
            betweenGroupsSS += groupCount * Math.pow(groupMean - overallMean, 2);
            
            // Within groups sum of squares
            values.forEach(value => {
                withinGroupsSS += Math.pow(value - groupMean, 2);
            });
        });
        
        const totalSS = betweenGroupsSS + withinGroupsSS;
        
        // Calculate degrees of freedom
        const betweenGroupsDF = Object.keys(groupedData).length - 1;
        const withinGroupsDF = totalCount - Object.keys(groupedData).length;
        const totalDF = totalCount - 1;
        
        // Calculate mean squares
        const betweenGroupsMS = betweenGroupsSS / betweenGroupsDF;
        const withinGroupsMS = withinGroupsSS / withinGroupsDF;
        
        // Calculate F-statistic
        const fStatistic = betweenGroupsMS / withinGroupsMS;
        
        // Calculate p-value using F-distribution
        const pValue = 1 - stdlibstatsBaseDistsFCdf(fStatistic, betweenGroupsDF, withinGroupsDF);
        
        // Store results
        const result = {
            SumOfSquares: betweenGroupsSS,
            df: betweenGroupsDF,
            MeanSquare: betweenGroupsMS,
            F: fStatistic,
            Sig: pValue,
            withinGroupsSumOfSquares: withinGroupsSS,
            withinGroupsDf: withinGroupsDF,
            withinGroupsMeanSquare: withinGroupsMS,
            totalSumOfSquares: totalSS,
            totalDf: totalDF
        };
        
        this.memo.anovaStats = result;
        return result;
    }
    
    /**
     * Calculate descriptive statistics
     * @returns {Array} Array of descriptive statistics results
     */
    calculateDescriptiveStatistics() {
        if (this.memo.descriptiveStats) return this.memo.descriptiveStats;

        const groupedData = this.groupDataByFactor();
        
        // Check for insufficient data
        if (Object.keys(groupedData).length < 2) {
            this.memo.descriptiveStats = [];
            return [];
        }
        
        const stats = [];

        // Hitung statistik deskriptif per grup
        Object.entries(groupedData).forEach(([group, values]) => {
            const n = values.length;
            const mean = n > 0 ? values.reduce((acc, val) => acc + val, 0) / n : NaN;

            // Standar deviasi
            let stdDeviation = NaN;
            if (n > 1) {
                const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n - 1);
                stdDeviation = Math.sqrt(variance);
            }

            // Standar error
            const stdError = n > 0 ? stdDeviation / Math.sqrt(n) : NaN;

            // 95% confidence interval (pakai z=1.96, cukup untuk n besar)
            const tValue = stdlibstatsBaseDistsTQuantile(0.975, n - 1);
            const marginOfError = tValue * stdError;
            const lowerBound = mean - marginOfError;
            const upperBound = mean + marginOfError;

            // Minimum dan maksimum
            const minimum = n > 0 ? Math.min(...values) : NaN;
            const maximum = n > 0 ? Math.max(...values) : NaN;

            stats.push({
                factor: group,
                N: n,
                Mean: mean,
                StdDeviation: stdDeviation,
                StdError: stdError,
                LowerBound: lowerBound,
                UpperBound: upperBound,
                Minimum: minimum,
                Maximum: maximum
            });
        });

        // Hitung total untuk setiap variable
        if (stats.length > 0) {
            // Gabungkan semua nilai dari semua grup
            const groupedData = this.groupDataByFactor();
            let allValues = [];
            Object.values(groupedData).forEach(values => {
                allValues = allValues.concat(values);
            });

            const totalN = allValues.length;
            const totalMean = totalN > 0
                ? allValues.reduce((sum, val) => sum + val, 0) / totalN
                : NaN;

            // Total sum of squared deviations
            let totalSumSquaredDeviations = 0;
            if (totalN > 1) {
                totalSumSquaredDeviations = allValues.reduce((acc, val) => acc + Math.pow(val - totalMean, 2), 0);
            }

            const totalStdDeviation = totalN > 1 ? Math.sqrt(totalSumSquaredDeviations / (totalN - 1)) : NaN;
            const totalStdError = totalN > 0 ? totalStdDeviation / Math.sqrt(totalN) : NaN;
            const tCritical = stdlibstatsBaseDistsTQuantile(0.975, totalN - 1);
            const totalLowerBound = totalMean - (tCritical * totalStdError);
            const totalUpperBound = totalMean + (tCritical * totalStdError);
            const totalMinimum = totalN > 0 ? Math.min(...allValues) : NaN;
            const totalMaximum = totalN > 0 ? Math.max(...allValues) : NaN;

            stats.push({
                factor: "Total",
                N: totalN,
                Mean: totalMean,
                StdDeviation: totalStdDeviation,
                StdError: totalStdError,
                LowerBound: totalLowerBound,
                UpperBound: totalUpperBound,
                Minimum: totalMinimum,
                Maximum: totalMaximum
            });
        }

        this.memo.descriptiveStats = stats;
        return stats;
    }
    
    /**
     * Calculate homogeneity of variance tests
     * @returns {Array} Array of homogeneity of variance test results
     */
    calculateHomogeneityOfVariance() {
        if (this.memo.homogeneityStats) return this.memo.homogeneityStats;
        
        const groupedData = this.groupDataByFactor();
        
        // Check for insufficient data
        if (Object.keys(groupedData).length < 2) {
            this.memo.homogeneityStats = [];
            return [];
        }
        
        const results = [];
        
        // Convert grouped data to arrays for Levene's test
        const groups = Object.values(groupedData);
        const groupNames = Object.keys(groupedData);
        
        // Calculate Levene's test based on mean
        const leveneBasedOnMean = this.calculateLeveneTest(groups, 'mean');
        results.push({
            type: 'Based on Mean',
            LeveneStatistic: leveneBasedOnMean.statistic,
            df1: leveneBasedOnMean.df1,
            df2: leveneBasedOnMean.df2,
            Sig: leveneBasedOnMean.pValue
        });
        
        // Calculate Levene's test based on median
        const leveneBasedOnMedian = this.calculateLeveneTest(groups, 'median');
        results.push({
            type: 'Based on Median',
            LeveneStatistic: leveneBasedOnMedian.statistic,
            df1: leveneBasedOnMedian.df1,
            df2: leveneBasedOnMedian.df2,
            Sig: leveneBasedOnMedian.pValue
        });
        
        // Calculate Levene's test based on median with adjusted df
        const leveneBasedOnMedianAdjusted = this.calculateLeveneTest(groups, 'median', true);
        results.push({
            type: 'Based on Median and with adjusted df',
            LeveneStatistic: leveneBasedOnMedianAdjusted.statistic,
            df1: leveneBasedOnMedianAdjusted.df1,
            df2: leveneBasedOnMedianAdjusted.df2,
            Sig: leveneBasedOnMedianAdjusted.pValue
        });
        
        // Calculate Levene's test based on trimmed mean
        const leveneBasedOnTrimmedMean = this.calculateLeveneTest(groups, 'trimmedMean');
        results.push({
            type: 'Based on trimmed mean',
            LeveneStatistic: leveneBasedOnTrimmedMean.statistic,
            df1: leveneBasedOnTrimmedMean.df1,
            df2: leveneBasedOnTrimmedMean.df2,
            Sig: leveneBasedOnTrimmedMean.pValue
        });
        
        this.memo.homogeneityStats = results;
        return results;
    }
    
    /**
     * Calculate Levene's test for homogeneity of variances
     * @param {Array<Array<number>>} groups - Array of arrays containing data for each group
     * @param {string} method - Method for calculating deviations ('mean', 'median', 'trimmedMean')
     * @param {boolean} adjustedDf - If true, calculates adjusted df2 using Welch-Satterthwaite formula.
     * @returns {Object} Levene's test results
     */
    calculateLeveneTest(groups, method = 'mean', adjustedDf = false) {
        const k = groups.length; // Number of groups
        const N = groups.reduce((acc, group) => acc + group.length, 0); // Total sample size
        
        // Step 1: Hitung deviasi absolut dari titik pusat (mean, median, dll)
        // Ini menghasilkan nilai z_il^(b)
        const deviations = groups.map(group => {
            let centralTendency;
            
            if (method === 'mean') {
                centralTendency = group.reduce((acc, val) => acc + val, 0) / group.length;
            } else if (method === 'median') {
                const sorted = [...group].sort((a, b) => a - b);
                const mid = Math.floor(sorted.length / 2);
                centralTendency = sorted.length % 2 === 0 
                    ? (sorted[mid - 1] + sorted[mid]) / 2 
                    : sorted[mid];
            } else if (method === 'trimmedMean') {
                const sorted = [...group].sort((a, b) => a - b);
                const trimAmount = Math.floor(group.length * 0.05);
                const trimmed = sorted.slice(trimAmount, sorted.length - trimAmount);
                centralTendency = trimmed.length > 0 ? trimmed.reduce((acc, val) => acc + val, 0) / trimmed.length : 0;
            }
            
            return group.map(val => Math.abs(val - centralTendency));
        });
        
        // Langkah-langkah untuk ANOVA pada deviasi
        const groupMeansOfDeviations = deviations.map(group => 
            group.reduce((acc, val) => acc + val, 0) / group.length
        );
        const overallMeanOfDeviations = deviations.flat().reduce((acc, val) => acc + val, 0) / N;

        const betweenSS = groups.reduce((acc, group, i) => 
            acc + group.length * Math.pow(groupMeansOfDeviations[i] - overallMeanOfDeviations, 2), 0
        );
        const withinSS = deviations.reduce((acc, group, i) => 
            acc + group.reduce((sum, val) => sum + Math.pow(val - groupMeansOfDeviations[i], 2), 0), 0
        );
        
        // Inisialisasi derajat kebebasan
        const df1 = k - 1;
        let df2 = N - k;
        
        if (adjustedDf) {
            // Implementasi rumus v = (∑u_i)^2 / ∑(u_i^2/v_i)

            // Hitung u_i (jumlah kuadrat deviasi dalam grup) untuk setiap grup
            // u_i = ∑(z_il - z̄_i)^2
            const u_values = deviations.map((groupDevs, i) => {
                const meanOfDevs = groupMeansOfDeviations[i]; // Ini adalah z̄_i^(b)
                return groupDevs.reduce((sum, dev) => sum + Math.pow(dev - meanOfDevs, 2), 0);
            });

            // Hitung v_i (derajat kebebasan grup) untuk setiap grup
            // v_i = w_i - 1
            const v_values = groups.map(group => group.length - 1);

            // Hitung pembilang dari v: (∑u_i)^2
            const sum_u = u_values.reduce((acc, u) => acc + u, 0);
            const numerator_v = Math.pow(sum_u, 2);

            // Hitung penyebut dari v: ∑(u_i^2 / v_i)
            const denominator_v = u_values.reduce((acc, u, i) => {
                const v_i = v_values[i];
                if (v_i > 0) {
                    return acc + (Math.pow(u, 2) / v_i);
                }
                return acc;
            }, 0);
            
            // Hitung v (df2 yang disesuaikan)
            if (denominator_v > 0) {
                df2 = numerator_v / denominator_v;
            }
        }
        // --- MODIFIKASI SELESAI ---
        
        // Hitung Levene's Statistic (W)
        const leveneStatistic = ((N-k)/(k-1)) * (betweenSS / withinSS);
        
        // Hitung p-value (Sig.)
        const pValue = 1 - stdlibstatsBaseDistsFCdf(leveneStatistic, df1, df2);
        
        return {
            statistic: leveneStatistic,
            df1,
            df2,
            pValue
        };
    }

    /**
     * Calculate Tukey HSD post hoc test
     * @returns {Array} Array of multiple comparisons results
     */
    calculateTukeyHSD() {
        if (this.memo.tukeyHSDResults) return this.memo.tukeyHSDResults;
        
        const groupedData = this.groupDataByFactor();
        // console.log('groupedData', JSON.stringify(groupedData));
        const groups = Object.entries(groupedData);
        // console.log('groups', JSON.stringify(groups));
        const n_groups = groups.length;
        const results = [];

        // Check for insufficient data
        if (n_groups < 2) {
            this.memo.tukeyHSDResults = [];
            return [];
        }

        // Calculate group means and sizes
        const groupMeans = {};
        const groupSizes = {};
        
        groups.forEach(([name, values]) => {
            groupMeans[name] = values.reduce((acc, val) => acc + val, 0) / values.length;
            groupSizes[name] = values.length;
        });

        // console.log('groupMeans', JSON.stringify(groupMeans));
        // console.log('groupSizes', JSON.stringify(groupSizes));
        
        // Calculate MSE (Mean Square Error) from ANOVA results
        const anovaResults = this.calculateAnovaStatistics();
        const MSE = anovaResults.withinGroupsMeanSquare;
        const df = anovaResults.withinGroupsDf;

        // Calculate all pairwise comparisons in both directions
        for (let i = 0; i < n_groups; i++) {
            const [group1Name] = groups[i];

            for (let j = 0; j < n_groups; j++) {
                const [group2Name] = groups[j];

                // Skip self-comparisons
                if (i !== j) {
                    // Calculate mean difference
                    const meanDifference = groupMeans[group1Name] - groupMeans[group2Name];

                    // Standard Error for Tukey HSD
                    const n1 = groupSizes[group1Name];
                    const n2 = groupSizes[group2Name];
                    const stdError = Math.sqrt(MSE * ((1 / n1) + (1 / n2)));

                    // Calculate q statistic
                    const q = Math.abs(meanDifference) / (stdError / Math.sqrt(2));

                    // Calculate p-value using studentized range distribution
                    const pValue = 1 - stdlibstatsBaseDistsStudentizedRangeCdf(q, n_groups, df);

                    // Calculate confidence interval using studentized range quantile
                    // For Tukey HSD, we use the critical value from the studentized range distribution
                    // but we need to divide by sqrt(2) to get the correct confidence interval
                    const criticalQ = stdlibstatsBaseDistsStudentizedRangeQuantile(0.95, n_groups, df);
                    const marginOfError = (criticalQ / Math.sqrt(2)) * stdError;
                    const lowerBound = meanDifference - marginOfError;
                    const upperBound = meanDifference + marginOfError;

                    results.push({
                        method: 'Tukey HSD',
                        factor1: group1Name,
                        factor2: group2Name,
                        meanDifference,
                        stdError,
                        Sig: pValue,
                        lowerBound,
                        upperBound
                    });
                }
            }
        }
        
        this.memo.tukeyHSDResults = results;
        return results;
    }
    
    /**
     * Calculate Duncan post hoc test
     * @returns {Array} Array of Duncan test results
     */
    calculateDuncan() {
        if (this.memo.duncanResults) return this.memo.duncanResults;
        
        // Duncan calculation is simplified here - in a real implementation
        // you would need the full Duncan test calculation
        const groupedData = this.groupDataByFactor();
        
        // Check for insufficient data
        if (Object.keys(groupedData).length < 2) {
            this.memo.duncanResults = [];
            return [];
        }

        // For now, we'll just calculate homogeneous subsets for Duncan
        const subsets = this.calculateHomogeneousSubsets(groupedData, 'Duncan');
        
        this.memo.duncanResults = subsets;
        return subsets;
    }

    /**
     * Calculate homogeneous subsets using the step-down range test procedure.
     * @param {Object} groupedData - Data grouped by factor levels
     * @param {string} method - Method name ('Tukey HSD' or 'Duncan')
     * @returns {Object} Object containing output and maximalSubsets
     */
    calculateHomogeneousSubsets(groupedData, method) {
        const key = `homogeneousSubsets_${method}`;
        if (this.memo[key]) return this.memo[key];

        if (!groupedData) {
            groupedData = this.groupDataByFactor();
        }

        // Check for insufficient data
        if (Object.keys(groupedData).length < 2) {
            this.memo[key] = { output: [], subsetCount: 0 };
            return { output: [], subsetCount: 0 };
        }

        const groups = Object.entries(groupedData);
        const k = groups.length;

        // Get ANOVA results
        const anovaResults = this.calculateAnovaStatistics();
        const MSE = anovaResults.withinGroupsMeanSquare;
        const df = anovaResults.withinGroupsDf;

        // Create an array of group stats and sort by mean
        const groupStats = groups.map(([name, values]) => ({
            name: name,
            mean: values.reduce((acc, val) => acc + val, 0) / values.length,
            n: values.length
        }));
        groupStats.sort((a, b) => a.mean - b.mean);

        const totalHarmonicMeanN = k / groupStats.reduce((acc, g) => acc + (1 / g.n), 0);
        const stdError = Math.sqrt(MSE / totalHarmonicMeanN);

        // --- STEP-DOWN PROCEDURE TO FIND SUBSETS ---
        const maximalSubsets = [];
        for (let i = 0; i < k; i++) {
            // Loop dari i ke k-1 untuk mencari subset terbesar yang dimulai dari i
            for (let j = k - 1; j >= i; j--) {
                const p = j - i + 1; // Jumlah grup dalam rentang saat ini
                if (p < 2) {
                    // Jika hanya ada satu grup, otomatis masuk subset tunggal jika tidak ada di subset lain
                    // Penanganan ini dilakukan di akhir untuk grup yang tersisa
                    continue;
                }
                
                const minMean = groupStats[i].mean;
                const maxMean = groupStats[j].mean;

                let criticalValue;
                if (method === 'Tukey HSD') {
                    // Tukey's HSD menggunakan rentang k untuk semua perbandingan
                    criticalValue = stdlibstatsBaseDistsStudentizedRangeQuantile(0.95, k, df);
                } else if (method === 'Duncan') {
                    // Duncan's Multiple Range Test menggunakan alpha yang disesuaikan untuk setiap rentang p
                    // α' = 1 - (1 - α)^(p-1). Disederhanakan menjadi Math.pow(0.95, p-1) untuk probabilitas
                    const alpha_p = 1 - Math.pow(0.95, p - 1);
                    criticalValue = stdlibstatsBaseDistsStudentizedRangeQuantile(1-alpha_p, p, df);
                } else {
                    // Default ke Tukey jika metode tidak dikenali
                    criticalValue = stdlibstatsBaseDistsStudentizedRangeQuantile(0.95, k, df);
                }
                
                const criticalRange = criticalValue * stdError;
                
                // Cek jika selisih nyata <= batas toleransi kritis
                if ((maxMean - minMean) <= criticalRange) {
                    // Jika ya, maka grup dari i sampai j adalah subset homogen.
                    const newSubset = groupStats.slice(i, j + 1).map(g => g.name);
                    maximalSubsets.push(newSubset);
                    
                    // Pindahkan i ke j+1 untuk memulai pencarian subset baru
                    // Ini adalah bagian kunci dari algoritma step-down yang efisien
                    i = j; 
                    break; // Keluar dari loop j, lanjut ke iterasi i berikutnya
                }
            }
        }

        // Jika terdapat variable (group) yang tidak ada di subset manapun, masukkan sebagai subset tunggal dan tetap menjaga urutan mean
        // Dapat terjadi jika group sangat berbeda sendiri (outlier) sehingga tidak masuk subset manapun
        const allGroupNames = groupStats.map(g => g.name);
        const groupedInSubsets = new Set();
        maximalSubsets.forEach(subset => {
            subset.forEach(name => groupedInSubsets.add(name));
        });
        const notInAnySubset = allGroupNames.filter(name => !groupedInSubsets.has(name));
        if (notInAnySubset.length > 0) {
            // Untuk setiap group yang tidak ada di subset manapun, tambahkan sebagai subset tunggal
            // dan urutkan penambahannya sesuai urutan mean
            notInAnySubset
                .map(name => ({
                    name,
                    mean: groupStats.find(g => g.name === name).mean
                }))
                .sort((a, b) => a.mean - b.mean)
                .forEach(({ name }) => {
                    maximalSubsets.push([name]);
                });
        }
        // console.log('maximalSubsets', JSON.stringify(maximalSubsets));


        // --- FORMATTING THE OUTPUT ---
        const output = [];
        const allGroupData = Object.fromEntries(groupStats.map(g => [g.name, { N: g.n, Mean: g.mean }]));

        for (const groupName of Object.keys(allGroupData)) {
            const resultRow = { method, factor: groupName, N: allGroupData[groupName].N };
            maximalSubsets.forEach((subset, i) => {
                if (subset.includes(groupName)) {
                    resultRow[`subset${i + 1}`] = allGroupData[groupName].Mean;
                }
            });
            output.push(resultRow);
        }

        // --- CALCULATE SIGNIFICANCE FOR EACH SUBSET ---
        const sigRow = { method, factor: 'Sig.' };
        maximalSubsets.forEach((subset, i) => {
            if (subset.length <= 1) {
                sigRow[`subset${i + 1}`] = 1.0;
            } else {
                const subsetGroups = subset.map(name => groupStats.find(g => g.name === name));
                const r = subsetGroups.length;
                const minMean = Math.min(...subsetGroups.map(g => g.mean));
                const maxMean = Math.max(...subsetGroups.map(g => g.mean));
                const stdError = Math.sqrt(MSE / totalHarmonicMeanN);
                const q_stat = (maxMean - minMean) / stdError;

                // p-value calculation for the range
                const rangeSizeForPValue = (method === 'Duncan') ? r : k;
                sigRow[`subset${i + 1}`] = 1 - stdlibstatsBaseDistsStudentizedRangeCdf(q_stat, rangeSizeForPValue, df);
            }
        });
        output.push(sigRow);

        // Final sorting to ensure consistent output order
        output.sort((a, b) => {
            if (a.factor === 'Sig.') return 1;
            if (b.factor === 'Sig.') return -1;
            return allGroupData[a.factor].Mean - allGroupData[b.factor].Mean;
        });

        this.memo[key] = { output, subsetCount: maximalSubsets.length };
        return { output, subsetCount: maximalSubsets.length };
    }
    
    /**
     * Get the output results
     * @returns {Object} Analysis results
     */
    getOutput() {
        this.#initialize();
        if (this.memo.finalOutput) return this.memo.finalOutput;
        
        // Perbaikan: cek groupedData sebagai objek, bukan array, dan gunakan Object.keys untuk menghitung jumlah grup
        // Penjelasan:
        // groupedData menyimpan data yang telah dikelompokkan berdasarkan faktor (misal: grup perlakuan).
        // hasInsufficientData adalah variabel boolean yang bernilai true jika:
        //   - Tidak ada data valid pada variabel utama (this.validData)
        //   - Tidak ada data valid pada variabel faktor (this.validFactorData)
        //   - Tidak ada grup yang terbentuk dari proses pengelompokan (groupedData)
        // Jika salah satu kondisi di atas terpenuhi, maka analisis tidak dapat dilakukan.
        // oneWayAnova menyimpan hasil perhitungan statistik ANOVA satu arah.

        const groupedData = this.groupDataByFactor();
        
        // Check for insufficient data with specific types
        const insufficientType = [];
        let hasInsufficientData = false;
        



        // Check if there are fewer than two groups
        if (Object.keys(groupedData).length < 2) {
            hasInsufficientData = true;
            insufficientType.push('fewerThanTwoGroups');
        } else
        // Check if there are fewer than three groups
        if (Object.keys(groupedData).length < 3) {
            hasInsufficientData = true;
            insufficientType.push('fewerThanThreeGroups');
        }

        // Check if at least one group has fewer than two cases
        let hasGroupWithFewerThanTwoCases = false;
        Object.values(groupedData).forEach(groupData => {
            if (groupData.length < 2) {
                hasGroupWithFewerThanTwoCases = true;
            }
        });
        if (hasGroupWithFewerThanTwoCases) {
            hasInsufficientData = true;
            insufficientType.push('groupWithFewerThanTwoCases');
        }
        
        // Check if all absolute deviations are constant within each cell
        let allDeviationsConstant = true;
        Object.values(groupedData).forEach(groupData => {
            if (groupData.length > 1) {
                const mean = groupData.reduce((acc, val) => acc + val, 0) / groupData.length;
                const deviations = groupData.map(val => Math.abs(val - mean));
                const firstDeviation = deviations[0];
                const allSame = deviations.every(dev => Math.abs(dev - firstDeviation) < 1e-10);
                if (!allSame) {
                    allDeviationsConstant = false;
                }
            }
        });
        if (allDeviationsConstant && Object.keys(groupedData).length > 0) {
            hasInsufficientData = true;
            insufficientType.push('allDeviationsConstant');
        }
        
        // Also check for no valid data
        if (this.validData.length === 0 || this.validFactorData.length === 0) {
            hasInsufficientData = true;
            insufficientType.push('noValidData');
        }
        
        const oneWayAnova = this.calculateAnovaStatistics();

        let descriptives = [];
        if (this.statisticsOptions && this.statisticsOptions.descriptive) {
            descriptives = this.calculateDescriptiveStatistics();
        }
        
        let homogeneityOfVariances = [];
        if (this.statisticsOptions && this.statisticsOptions.homogeneityOfVariance) {
            homogeneityOfVariances = this.calculateHomogeneityOfVariance();
        }
        
        let multipleComparisons = [];
        let homogeneousSubsets = [];
        if (this.equalVariancesAssumed && this.equalVariancesAssumed.tukey) {
            multipleComparisons = this.calculateTukeyHSD();
            
            const tukeySubsets = this.calculateHomogeneousSubsets(null, 'Tukey HSD');
            homogeneousSubsets.push({
                method: 'Tukey HSD',
                ...tukeySubsets
            });
        }

        if (this.equalVariancesAssumed && this.equalVariancesAssumed.duncan) {
            const duncanSubsets = this.calculateHomogeneousSubsets(null, 'Duncan');
            homogeneousSubsets.push({
                method: 'Duncan',
                ...duncanSubsets
            });
        }
        
        const result = {
            variable1: this.variable1,
            oneWayAnova,
            descriptives: this.statisticsOptions && this.statisticsOptions.descriptive ? descriptives : [],
            homogeneityOfVariances: this.statisticsOptions && this.statisticsOptions.homogeneityOfVariance ? homogeneityOfVariances : [],
            multipleComparisons: this.equalVariancesAssumed && this.equalVariancesAssumed.tukey ? multipleComparisons : [],
            homogeneousSubsets,
            metadata: {
                hasInsufficientData,
                insufficientType,
                variable1Label: this.variable1.label,
                variable2Label: this.variable2.label,
                variable1Name: this.variable1.name,
                variable2Name: this.variable2.name
            }
        };
        
        this.memo.finalOutput = result;
        return result;
    }
}

// Export the calculator class
globalThis.OneWayAnovaCalculator = OneWayAnovaCalculator;
export default OneWayAnovaCalculator; 