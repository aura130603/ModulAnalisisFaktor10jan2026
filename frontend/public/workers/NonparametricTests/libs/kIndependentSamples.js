/**
 * @file /libs/kIndependentSamples.js
 * @class KIndependentSamplesCalculator
 * @description
 * Kelas untuk melakukan analisis uji nonparametrik k sampel independen.
 * Mendukung Kruskal-Wallis H, Median Test, dan Jonckheere-Terpstra Test.
 */
import stdlibstatsBaseDistsChisquareCdf from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-chisquare-cdf@0.2.2/+esm'
import stdlibstatsBaseDistsNormalCdf from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-normal-cdf@0.2.2/+esm'
import { checkIsMissing, isNumeric } from './utils.js';

class KIndependentSamplesCalculator {
    /**
     * @param {object} params - Parameter untuk analisis.
     * @param {object} params.variable - Objek definisi variabel.
     * @param {Array<any>} params.data - Array data untuk variabel ini.
     * @param {object} params.groupingVariable - Objek definisi variabel.
     * @param {Array<any>} params.groupingData - Array data untuk variabel ini.
     * @param {object} params.options - Opsi tambahan dari main thread.
     */
    constructor({ variable1, data1, variable2, data2, options = {} }) {
        console.log('KIndependentSamplesCalculator constructor');
        this.variable1 = variable1;
        this.data1 = data1;
        this.variable2 = variable2;
        this.data2 = data2;
        this.options = options;
        this.initialized = false;

        // Ekstrak opsi dari options
        this.testType = options.testType || { kruskalWallisH: true, median: false, jonckheereTerpstra: false };
        this.minimum = options.minimum || null;
        this.maximum = options.maximum || null;

        // Properti yang akan dihitung
        this.validData = [];
        this.validGroupingData = [];
        this.groupedData = {};
        this.N = 0;
        this.groupingN = 0;
        this.uniqueGroups = [];
        this.groupCounts = {};
        this.hasInsufficientData = false;
        this.insufficientType = [];

        /** @private */
        this.memo = {};
    }

    #initialize() {
        if (this.initialized) return;

        // Filter data yang valid
        const isNumericType = ['scale', 'date'].includes(this.variable1.measure);
        const isNumericGroupingType = ['scale', 'date'].includes(this.variable2.measure);

        // Filter data yang valid dan hanya untuk grup dalam rentang minimum-maximum
        this.validData = this.data1
            .filter((value, index) => {
                const isValidData = !checkIsMissing(value, this.variable1.missing, isNumericType) && isNumeric(value);
                const isValidGrouping = index < this.data2.length && 
                    !checkIsMissing(this.data2[index], this.variable2.missing, isNumericGroupingType);
                
                // Cek apakah nilai grup dalam rentang yang ditentukan
                const groupValue = parseFloat(this.data2[index]);
                const isInRange = !this.minimum || !this.maximum || 
                    (groupValue >= this.minimum && groupValue <= this.maximum);
                
                return isValidData && isValidGrouping && isInRange;
            })
            .map(value => parseFloat(value));
        
        this.validGroupingData = this.data2
            .filter((value, index) => {
                const isValidData = index < this.data1.length && 
                    !checkIsMissing(this.data1[index], this.variable1.missing, isNumericType) && 
                    isNumeric(this.data1[index]);
                const isValidGrouping = !checkIsMissing(value, this.variable2.missing, isNumericGroupingType);
                
                // Cek apakah nilai grup dalam rentang yang ditentukan
                const groupValue = parseFloat(value);
                const isInRange = !this.minimum || !this.maximum || 
                    (groupValue >= this.minimum && groupValue <= this.maximum);
                
                return isValidData && isValidGrouping && isInRange;
            })
            .map(value => parseFloat(value));

        // Kelompokkan data berdasarkan nilai grup
        this.uniqueGroups = [...new Set(this.validGroupingData)].sort((a, b) => a - b);
        this.uniqueGroups.forEach(group => {
            this.groupedData[group] = [];
            this.groupCounts[group] = 0;
        });

        // Pisahkan data ke dalam grup masing-masing
        for (let i = 0; i < this.validData.length; i++) {
            const group = this.validGroupingData[i];
            this.groupedData[group].push(this.validData[i]);
            this.groupCounts[group]++;
        }

        // Periksa apakah hanya ada satu grup yang panjangnya tidak nol
        const nonEmptyGroups = Object.values(this.groupedData).filter(arr => arr.length > 0);
        if (nonEmptyGroups.length === 1) {
            this.hasInsufficientData = true;
            this.insufficientType.push('single');
        }
        // Jika tidak ada grup unik yang ditemukan (artinya data grup kosong), tandai data sebagai tidak cukup
        if (this.validData.length === 0) {
            this.hasInsufficientData = true;
            this.insufficientType.push('empty');
        }
        // Hitung statistik dasar
        this.groupingN = this.validGroupingData.length;
        this.N = this.validData.length;

        this.initialized = true;
    }

    getN() { this.#initialize(); return this.N; }
    getGroupingN() { this.#initialize(); return this.groupingN; }
    getUniqueGroups() { this.#initialize(); return this.uniqueGroups; }
    
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

    /**
     * Menghitung ranks untuk semua data
     * @returns {Object} Hasil perhitungan ranks
     */
    getRanks() {
        if (this.memo.ranks) return this.memo.ranks;
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
        
        // Hitung sum of ranks dan mean rank untuk setiap kelompok
        const groupRanks = {};
        this.uniqueGroups.forEach(group => {
            groupRanks[group] = {
                sumRanks: 0,
                meanRank: 0,
                N: this.groupCounts[group]
            };
        });

        // Assign ranks ke setiap nilai data
        for (let i = 0; i < this.validData.length; i++) {
            const value = this.validData[i];
            const group = this.validGroupingData[i];
            const rank = rankMap[value];
            groupRanks[group].sumRanks += rank;
        }

        // Hitung mean rank untuk setiap kelompok
        this.uniqueGroups.forEach(group => {
            if (groupRanks[group].N > 0) {
                groupRanks[group].meanRank = groupRanks[group].sumRanks / groupRanks[group].N;
            }
        });

        // Buat output dengan label grup
        const result = {
            groups: this.uniqueGroups.map(group => {
                const label = this.variable2.values?.find(v => v.value === group)?.label || group.toString();
                return {
                    value: group,
                    label,
                    N: groupRanks[group].N,
                    meanRank: groupRanks[group].meanRank,
                    sumRanks: groupRanks[group].sumRanks
                };
            })
        };
        result.groups.push({
            value: "Total",
            label: "Total",
            N: this.N,
            meanRank: null,
            sumRanks: null
        });

        this.memo.ranks = result;
        return result;
    }

    /**
     * Menghitung statistik Kruskal-Wallis H
     * @returns {Object} Hasil perhitungan statistik Kruskal-Wallis H
     */
    getTestStatisticsKruskalWallisH() {
        if (this.memo.kruskalWallisH) return this.memo.kruskalWallisH;
        this.#initialize();
        
        // Validasi input
        if (this.N === 0 || this.uniqueGroups.length <= 1) {
            const result = {
                H: 0,
                df: 0,
                pValue: 1
            };
            this.memo.kruskalWallisH = result;
            return result;
        }
        
        // Dapatkan ranks untuk semua data
        const ranks = this.getRanks();
        
        // Hitung H statistic
        let sumSquaredRanksOverN = 0;
        ranks.groups.forEach(group => {
            sumSquaredRanksOverN += Math.pow(group.sumRanks, 2) / group.N;
        });
        
        // Hitung tie correction
        const tieMap = {};
        for (const value of this.validData) {
            tieMap[value] = (tieMap[value] || 0) + 1;
        }
        
        const tieCorrection = Object.values(tieMap).reduce((sum, t) => {
            return sum + (t > 1 ? (Math.pow(t, 3) - t) : 0);
        }, 0);
        
        // Hitung H statistic dengan formula:
        // H = [12 / (N*(N+1))] * Σ(R_i^2/n_i) - 3(N+1)
        let H = (12 / (this.N * (this.N + 1))) * sumSquaredRanksOverN - 3 * (this.N + 1);
        
        // Terapkan koreksi untuk ties
        if (tieCorrection > 0) {
            const denominator = 1 - (tieCorrection / (Math.pow(this.N, 3) - this.N));
            H = H / denominator;
        }
        
        // Degrees of freedom = jumlah kelompok - 1
        const df = this.uniqueGroups.length - 1;
        
        // Hitung p-value menggunakan distribusi chi-square
        const pValue = 1 - stdlibstatsBaseDistsChisquareCdf(H, df);

        const result = {
            H,
            df,
            pValue
        };

        this.memo.kruskalWallisH = result;
        return result;
    }

    // /**
    //  * Menghitung statistik Median Test
    //  * @returns {Object} Hasil perhitungan statistik Median Test
    //  */
    // getTestStatisticsMedian() {
    //     if (this.memo.medianTest) return this.memo.medianTest;
    //     this.#initialize();
        
    //     // Validasi input
    //     if (this.N === 0 || this.uniqueGroups.length <= 1) {
    //         const result = {
    //             variable1: this.variable1,
    //             chi2: 0,
    //             df: 0,
    //             pValue: 1
    //         };
    //         this.memo.medianTest = result;
    //         return result;
    //     }
        
    //     // Hitung median dari semua data
    //     const sortedData = [...this.validData].sort((a, b) => a - b);
    //     const median = sortedData.length % 2 === 0
    //         ? (sortedData[sortedData.length / 2 - 1] + sortedData[sortedData.length / 2]) / 2
    //         : sortedData[Math.floor(sortedData.length / 2)];
        
    //     // Buat tabel kontingensi 2xk (> median dan <= median untuk setiap grup)
    //     const contingencyTable = {};
    //     this.uniqueGroups.forEach(group => {
    //         contingencyTable[group] = {
    //             aboveMedian: 0,
    //             belowOrEqualMedian: 0
    //         };
    //     });
        
    //     // Isi tabel kontingensi
    //     for (let i = 0; i < this.validData.length; i++) {
    //         const value = this.validData[i];
    //         const group = this.validGroupingData[i];
            
    //         if (value > median) {
    //             contingencyTable[group].aboveMedian++;
    //         } else {
    //             contingencyTable[group].belowOrEqualMedian++;
    //         }
    //     }
        
    //     // Hitung chi-square
    //     let chi2 = 0;
    //     let totalAboveMedian = 0;
    //     let totalBelowOrEqualMedian = 0;
        
    //     this.uniqueGroups.forEach(group => {
    //         totalAboveMedian += contingencyTable[group].aboveMedian;
    //         totalBelowOrEqualMedian += contingencyTable[group].belowOrEqualMedian;
    //     });
        
    //     this.uniqueGroups.forEach(group => {
    //         const aboveMedian = contingencyTable[group].aboveMedian;
    //         const belowOrEqualMedian = contingencyTable[group].belowOrEqualMedian;
    //         const rowTotal = aboveMedian + belowOrEqualMedian;
            
    //         const expectedAboveMedian = rowTotal * totalAboveMedian / this.N;
    //         const expectedBelowOrEqualMedian = rowTotal * totalBelowOrEqualMedian / this.N;
            
    //         if (expectedAboveMedian > 0) {
    //             chi2 += Math.pow(aboveMedian - expectedAboveMedian, 2) / expectedAboveMedian;
    //         }
            
    //         if (expectedBelowOrEqualMedian > 0) {
    //             chi2 += Math.pow(belowOrEqualMedian - expectedBelowOrEqualMedian, 2) / expectedBelowOrEqualMedian;
    //         }
    //     });
        
    //     // Degrees of freedom = jumlah kelompok - 1
    //     const df = this.uniqueGroups.length - 1;
        
    //     // Hitung p-value menggunakan distribusi chi-square
    //     const pValue = 1 - stdlibstatsBaseDistsChisquareCdf(chi2, df);
        
    //     const result = {
    //         variable1: this.variable1,
    //         chi2,
    //         df,
    //         pValue,
    //         median
    //     };
        
    //     this.memo.medianTest = result;
    //     return result;
    // }

    // /**
    //  * Menghitung statistik Jonckheere-Terpstra Test
    //  * @returns {Object} Hasil perhitungan statistik Jonckheere-Terpstra Test
    //  */
    // getJonckheereTerpstraTest() {
    //     if (this.memo.jonckheereTerpstra) return this.memo.jonckheereTerpstra;
    //     this.#initialize();
        
    //     // Validasi input
    //     if (this.N === 0 || this.uniqueGroups.length <= 1) {
    //         const result = {
    //             variable1: this.variable1,
    //             JT: 0,
    //             Z: 0,
    //             pValue: 1
    //         };
    //         this.memo.jonckheereTerpstra = result;
    //         return result;
    //     }
        
    //     // Hitung statistik Jonckheere-Terpstra
    //     let JT = 0;
        
    //     // Untuk setiap pasangan kelompok (i < j), hitung Mann-Whitney U
    //     for (let i = 0; i < this.uniqueGroups.length - 1; i++) {
    //         const group1 = this.uniqueGroups[i];
    //         const data1 = this.groupedData[group1];
            
    //         for (let j = i + 1; j < this.uniqueGroups.length; j++) {
    //             const group2 = this.uniqueGroups[j];
    //             const data2 = this.groupedData[group2];
                
    //             // Hitung Mann-Whitney U untuk pasangan grup ini
    //             let U = 0;
    //             for (let a = 0; a < data1.length; a++) {
    //                 for (let b = 0; b < data2.length; b++) {
    //                     if (data1[a] < data2[b]) {
    //                         U++;
    //                     }
    //                 }
    //             }
                
    //             JT += U;
    //         }
    //     }
        
    //     // Hitung expected value dan variance
    //     let expectedJT = 0;
    //     let varianceJT = 0;
        
    //     // Expected value: E(JT) = N^2/4 - Σ(n_i^2)/4
    //     expectedJT = Math.pow(this.N, 2) / 4;
    //     this.uniqueGroups.forEach(group => {
    //         expectedJT -= Math.pow(this.groupCounts[group], 2) / 4;
    //     });
        
    //     // Variance: Var(JT) = [N^2(2N+3) - Σ(n_i^2(2n_i+3))]/72
    //     varianceJT = Math.pow(this.N, 2) * (2 * this.N + 3) / 72;
    //     this.uniqueGroups.forEach(group => {
    //         varianceJT -= Math.pow(this.groupCounts[group], 2) * (2 * this.groupCounts[group] + 3) / 72;
    //     });
        
    //     // Koreksi untuk ties
    //     const tieMap = {};
    //     for (const value of this.validData) {
    //         tieMap[value] = (tieMap[value] || 0) + 1;
    //     }
        
    //     let tieTerm = 0;
    //     Object.values(tieMap).forEach(t => {
    //         if (t > 1) {
    //             tieTerm += t * (t - 1) * (2 * t + 5);
    //         }
    //     });
        
    //     varianceJT -= tieTerm / (36 * this.N * (this.N - 1));
        
    //     // Hitung Z-score
    //     const Z = (JT - expectedJT) / Math.sqrt(varianceJT);
        
    //     // Hitung p-value (two-tailed)
    //     const pValue = 2 * (1 - stdlibstatsBaseDistsNormalCdf(Math.abs(Z), 0, 1));
        
    //     const result = {
    //         variable1: this.variable1,
    //         JT,
    //         expectedJT,
    //         varianceJT,
    //         Z,
    //         pValue
    //     };
        
    //     this.memo.jonckheereTerpstra = result;
    //     return result;
    // }

    getOutput() {
        let ranks = null;
        let testStatisticsKruskalWallisH = null;
        // let frequencies = null
        // let testStatisticsMedian = null;
        // let jonckheereTerpstraTest = null;
        
        if (this.testType.kruskalWallisH) {
            ranks = this.getRanks();
            testStatisticsKruskalWallisH = this.getTestStatisticsKruskalWallisH();
        }
        // if (this.testType.median) {
        //     frequencies = this.getFrequencies();
        //     testStatisticsMedian = this.getTestStatisticsMedian();
        // }
        // if (this.testType.jonckheereTerpstra) {
        //     jonckheereTerpstraTest = this.getJonckheereTerpstraTest();
        // }

        return {
            variable1: this.variable1,
            ranks,
            testStatisticsKruskalWallisH,
            metadata: {
                hasInsufficientData: this.hasInsufficientData,
                insufficientType: this.insufficientType,
                variableName: this.variable1.name,
                variableLabel: this.variable1.label
            }
            // frequencies,
            // testStatisticsMedian,
            // jonckheereTerpstraTest
        };
    }
}

globalThis.KIndependentSamplesCalculator = KIndependentSamplesCalculator;
export default KIndependentSamplesCalculator;