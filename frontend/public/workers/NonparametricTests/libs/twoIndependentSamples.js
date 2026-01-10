/**
 * @file /libs/twoIndependentSamples.js
 * @class TwoIndependentSamplesCalculator
 * @description
 * Kelas untuk melakukan analisis uji nonparametrik dua sampel independen.
 * Mendukung Mann-Whitney U, Kolmogorov-Smirnov Z, Moses Extreme Reactions, dan Wald-Wolfowitz Runs.
 */
import stdlibstatsBaseDistsNormalCdf from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-normal-cdf@0.2.2/+esm'
import { checkIsMissing, isNumeric } from './utils.js';

class TwoIndependentSamplesCalculator {
    /**
     * @param {object} params - Parameter untuk analisis.
     * @param {object} params.variable - Objek definisi variabel.
     * @param {Array<any>} params.data - Array data untuk variabel ini.
     * @param {object} params.groupingVariable - Objek definisi variabel.
     * @param {Array<any>} params.groupingData - Array data untuk variabel ini.
     * @param {object} params.options - Opsi tambahan dari main thread.
     */
    constructor({ variable1, data1, variable2, data2, options = {} }) {
        console.log('TwoIndependentSamplesCalculator constructor');
        this.variable1 = variable1;
        this.data1 = data1;
        this.variable2 = variable2;
        this.data2 = data2;
        this.options = options;
        this.initialized = false;

        // Ekstrak opsi dari options
        this.group1 = options.group1;
        this.group2 = options.group2;
        this.testType = options.testType || { mannWhitneyU: true, mosesExtremeReactions: false, kolmogorovSmirnovZ: false, waldWolfowitzRuns: false };

        // Properti yang akan dihitung
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

        // Filter data yang valid
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

        this.group1Data = this.validData.filter((_, index) => 
            this.validGroupingData[index] === this.group1);
        this.group2Data = this.validData.filter((_, index) => 
            this.validGroupingData[index] === this.group2);

        // Hitung statistik dasar
        this.groupingN = this.validGroupingData.length;
        this.group1N = this.group1Data.length;
        this.group2N = this.group2Data.length;
        this.N = this.group1N + this.group2N;

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
        if (!arr || arr.length === 0) return 0;
        return arr.reduce((sum, x) => sum + x, 0) / arr.length;
    }
    
    /**
     * Menghitung standard deviation dari array
     * @param {Array<number>} arr - Array nilai
     * @param {number} meanValue - Mean dari array
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

        // Hitung ranks
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
        
        // Hitung sum of ranks untuk setiap kelompok
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
        
        // Hitung mean rank
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
     * @param {string} side - "one-sided" or "two-sided" (default: "two-sided")
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

        // Rumus kombinasi: C(n, k) = n! / (k! * (n-k)!)
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
        
        // Validasi input
        if (this.group1N === 0 || this.group2N === 0) {
            const result = {
                U: 0,
                W: 0,
                Z: 0,
                pValue: 1
            };
            this.memo.mannWhitneyU = result;
            return result;
        }
        
        // Menghitung ranks untuk Mann-Whitney U
        const freqRanks = this.getFrequenciesRanks();
        
        // Hitung U1 dan U2
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
        
        // Hitung expected value dan variance
        const expectedU = (n1 * n2) / 2;
        
        // Hitung tie correction
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
        
        // Hitung Z-score
        const Z = (U - expectedU) / Math.sqrt(varianceU);
        
        // Hitung p-value
        const pValue = 2 * (1 - stdlibstatsBaseDistsNormalCdf(Math.abs(Z), 0, 1));
        
        
        // Tentukan apakah akan menampilkan p-value eksak
        const showExact = (n1 * n2) < 400 && (((n1 * n2) / 2) + Math.min(n1, n2)) <= 220;
        let pExact = null;
        if (showExact) {
            // Hitung p-value eksak
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
        
        // Validasi input
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
        
        // Hitung statistik Z
        const n1 = this.group1N;
        const n2 = this.group2N;
        const d_stat = D_absolute * Math.sqrt((n1 * n2) / (n1 + n2));
        
        // Hitung p-value menggunakan formula aproksimasi
        let pValue = 0;
        // Gunakan formula Kolmogorov untuk p-value
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
        
        // Validasi input
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
        
        // Validasi input
        if (this.group1N === 0 || this.group2N === 0) {
            const result = {
                runsCount: 0,
                Z: 0,
                pValue: 1
            };
            this.memo.waldWolfowitzRuns = result;
            return result;
        }
        
        // Gabungkan dan urutkan data kedua kelompok
        const combinedData = [];
        for (let i = 0; i < this.validData.length; i++) {
            combinedData.push({
                value: this.validData[i],
                group: this.validGroupingData[i]
            });
        }
        combinedData.sort((a, b) => a.value - b.value);
        
        // Hitung jumlah runs
        let runsCount = 1;
        let currentGroup = combinedData[0].group;
        for (let i = 1; i < combinedData.length; i++) {
            if (combinedData[i].group !== currentGroup) {
                runsCount++;
                currentGroup = combinedData[i].group;
            }
        }
        
        // Hitung expected value dan variance
        const n1 = this.group1N;
        const n2 = this.group2N;
        const N = n1 + n2;
        const expectedRuns = 1 + (2 * n1 * n2) / N;
        const varianceRuns = (2 * n1 * n2 * (2 * n1 * n2 - N)) / (N * N * (N - 1));
        
        // Hitung Z-score dengan koreksi kontinuitas
        let Z;
        if (runsCount > expectedRuns) {
            Z = (runsCount - 0.5 - expectedRuns) / Math.sqrt(varianceRuns);
        } else {
            Z = (runsCount + 0.5 - expectedRuns) / Math.sqrt(varianceRuns);
        }
        
        // Hitung p-value (two-tailed)
        const pValue = 2 * (1 - stdlibstatsBaseDistsNormalCdf(Math.abs(Z), 0, 1));

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
        // let testStatisticsMosesExtremeReactions = null;
        // let testStatisticsWaldWolfowitzRuns = null;
        
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
}

globalThis.TwoIndependentSamplesCalculator = TwoIndependentSamplesCalculator;
export default TwoIndependentSamplesCalculator;