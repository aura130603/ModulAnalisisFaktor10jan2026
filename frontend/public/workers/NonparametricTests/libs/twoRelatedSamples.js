/**
 * @file /libs/twoRelatedSamples.js
 * @class TwoRelatedSamplesCalculator
 * @description
 * Kelas untuk melakukan analisis uji nonparametrik dua sampel berhubungan (paired).
 * Mendukung Wilcoxon Signed Ranks Test dan Sign Test.
 */
import stdlibstatsBaseDistsNormalCdf from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-normal-cdf@0.2.2/+esm';
import stdlibstatsBaseDistsBinomialCdf from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-binomial-cdf@0.2.2/+esm';
import { checkIsMissing, isNumeric } from './utils.js';

class TwoRelatedSamplesCalculator {
    /**
     * @param {object} params - Parameter untuk analisis.
     * @param {object} params.variable1 - Objek definisi variabel pertama.
     * @param {Array<any>} params.data1 - Array data untuk variabel pertama.
     * @param {object} params.variable2 - Objek definisi variabel kedua.
     * @param {Array<any>} params.data2 - Array data untuk variabel kedua.
     * @param {object} params.options - Opsi tambahan dari main thread.
     */
    constructor({ variable1, data1, variable2, data2, options = {} }) {
        console.log('TwoRelatedSamplesCalculator constructor');
        this.variable1 = variable1;
        this.data1 = data1;
        this.variable2 = variable2;
        this.data2 = data2;
        this.options = options;
        this.initialized = false;

        // Ekstrak opsi dari options
        this.testType = options.testType || { wilcoxon: true, sign: false };
        // this.displayStatistics = options.displayStatistics || { descriptive: false, quartiles: false };

        // Properti yang akan dihitung
        this.validData1 = [];
        this.validData2 = [];
        this.N = 0;

        this.hasInsufficientData = false;
        this.insufficientType = [];

        /** @private */
        this.memo = {};
    }

    #initialize() {
        if (this.initialized) return;

        // Filter data yang valid
        const isNumericType1 = ['scale', 'date'].includes(this.variable1.measure);
        const isNumericType2 = ['scale', 'date'].includes(this.variable2.measure);

        // Create paired valid data arrays
        let pairs = [];
        for (let i = 0; i < Math.min(this.data1.length, this.data2.length); i++) {
            const value1 = this.data1[i];
            const value2 = this.data2[i];
            
            // Check if both values are valid
            const isValid1 = !checkIsMissing(value1, this.variable1.missing, isNumericType1) && isNumeric(value1);
            const isValid2 = !checkIsMissing(value2, this.variable2.missing, isNumericType2) && isNumeric(value2);
            
            if (isValid1 && isValid2) {
                pairs.push({
                    value1: parseFloat(value1),
                    value2: parseFloat(value2)
                });
            }
        }
        
        this.validData1 = pairs.map(p => p.value1);
        this.validData2 = pairs.map(p => p.value2);
        this.N = this.validData1.length;

        if (this.N < 1) {
            this.hasInsufficientData = true;
            this.insufficientType.push('empty');
        }
        // If there are no differences between pairs (i.e., all value1 == value2), mark as insufficient data
        if (this.N > 0 && this.validData1.every((v, i) => v === this.validData2[i])) {
            this.hasInsufficientData = true;
            this.insufficientType.push('no_difference');
        }

        this.initialized = true;
    }

    getN() { this.#initialize(); return this.N; }

    getRanksFrequencies() {
        if (this.memo.ranksFrequencies) return this.memo.ranksFrequencies;
        
        this.#initialize();
        
        if (!this.testType.wilcoxon) {
            this.memo.ranksFrequencies = null;
            return null;
        }
        
        // Compute differences and ranks
        const differences = this.validData1.map((val, idx) => {
            const diff = this.validData2[idx] - val;
            return {
                diff: diff,
                absDiff: Math.abs(diff),
                sign: diff > 0 ? 1 : (diff < 0 ? -1 : 0)
            };
        });
        
        // Separate ties (diff = 0)
        const ties = differences.filter(p => p.sign === 0).length;
        const nonTies = differences.filter(p => p.sign !== 0);
        
        // Sort by absolute difference
        nonTies.sort((a, b) => a.absDiff - b.absDiff);
        
        // Assign ranks with handling for ties
        let i = 0;
        while (i < nonTies.length) {
            let start = i;
            let sumRanks = 0;
            let count = 0;
            const currentVal = nonTies[i].absDiff;
            
            // Collect rows with same absDiff
            while (i < nonTies.length && nonTies[i].absDiff === currentVal) {
                sumRanks += (i + 1); // 1-based rank
                count++;
                i++;
            }
            
            // Average rank for ties
            const avgRank = sumRanks / count;
            for (let j = start; j < start + count; j++) {
                nonTies[j].rank = avgRank;
            }
        }
        
        // Group for sum of ranks
        const positivePairs = nonTies.filter(p => p.sign === 1);
        const negativePairs = nonTies.filter(p => p.sign === -1);
        
        const nPos = positivePairs.length;
        const nNeg = negativePairs.length;
        const sumPosRanks = positivePairs.reduce((acc, p) => acc + p.rank, 0);
        const sumNegRanks = negativePairs.reduce((acc, p) => acc + p.rank, 0);
        const meanPosRank = nPos > 0 ? sumPosRanks / nPos : 0;
        const meanNegRank = nNeg > 0 ? sumNegRanks / nNeg : 0;
        
        const result = {
            negative: {
                N: nNeg,
                MeanRank: meanNegRank,
                SumOfRanks: sumNegRanks
            },
            positive: {
                N: nPos,
                MeanRank: meanPosRank,
                SumOfRanks: sumPosRanks
            },
            ties: {
                N: ties
            },
            total: {
                N: this.N
            }
        };
        
        this.memo.ranksFrequencies = result;
        return result;
    }

    getTestStatisticsWilcoxon() {
        if (this.memo.wilcoxonTest) return this.memo.wilcoxonTest;
        
        this.#initialize();
        
        if (!this.testType.wilcoxon) {
            this.memo.wilcoxonTest = null;
            return null;
        }
        
        // Perbaikan: getRanksFrequencies sekarang mengembalikan struktur yang lebih lengkap
        const ranks = this.getRanksFrequencies();
        if (!ranks) return null;
        
        // Ambil nilai-nilai yang diperlukan dari hasil getRanksFrequencies
        const nPos = ranks.positive?.N ?? 0;
        const nNeg = ranks.negative?.N ?? 0;
        const sumPosRanks = ranks.positive?.SumOfRanks ?? 0;
        const sumNegRanks = ranks.negative?.SumOfRanks ?? 0;
        const n = nPos + nNeg;
        
        // Jika tidak ada perbedaan, uji tidak dapat dilakukan
        if (n === 0) {
            const result = {
                zValue: 0,
                pValue: 1,
                message: "No differences between pairs, test cannot be performed."
            };
            this.memo.wilcoxonTest = result;
            return result;
        }
        
        // Pilih T sebagai jumlah rank terkecil antara positif dan negatif
        const T = Math.min(sumPosRanks, sumNegRanks);
        
        // Hitung expected value dan standard deviation
        const expectedT = n * (n + 1) / 4;
        
        // Hitung SD dengan koreksi ties
        const nFloat = n;
        let baseVar = nFloat * (nFloat + 1) * (2 * nFloat + 1) / 24;
        
        // Koreksi ties: hitung dari absDiff pada pasangan yang valid
        const differences = [];
        for (let i = 0; i < this.validData1.length; i++) {
            const diff = this.validData2[i] - this.validData1[i];
            if (diff !== 0) {
                differences.push(Math.abs(diff));
            }
        }
        // Hitung grup ties
        const tieGroups = {};
        differences.forEach(absDiff => {
            tieGroups[absDiff] = (tieGroups[absDiff] || 0) + 1;
        });
        
        let tieCorrection = 0;
        for (const key in tieGroups) {
            const t = tieGroups[key];
            if (t > 1) {
                tieCorrection += t * (t * t - 1);
            }
        }
        tieCorrection /= 48;
        
        const sdT = Math.sqrt(baseVar - tieCorrection);
        
        // Hitung Z value dengan continuity correction
        let zValue = 0;
        if (T < expectedT) {
            zValue = (T + 0.5 - expectedT) / sdT;
        } else {
            zValue = (T - 0.5 - expectedT) / sdT;
        }
        
        // Hitung p-value (dua sisi)
        let pValue = 2 * (1 - stdlibstatsBaseDistsNormalCdf(Math.abs(zValue), 0, 1));
        
        // Pastikan p-value di antara 0 dan 1
        if (pValue > 1) pValue = 1;
        if (pValue < 0) pValue = 0;
        
        const result = {
            zValue: zValue,
            pValue: pValue
        };
        
        this.memo.wilcoxonTest = result;
        return result;
    }

    getTestStatisticsSign() {
        if (this.memo.signTest) return this.memo.signTest;
        
        this.#initialize();
        
        if (!this.testType.sign) {
            this.memo.signTest = null;
            return null;
        }
        
        const frequencies = this.getRanksFrequencies();
        if (!frequencies) return null;
        
        // Ambil nilai-nilai dari hasil getRanksFrequencies
        const nPos = frequencies.positive?.N ?? 0;
        const nNeg = frequencies.negative?.N ?? 0;
        
        // Calculate effective n (without ties)
        const n = nPos + nNeg;
        
        let pValue = 0;
        let zValue = 0;
        
        if (n === 0) {
            pValue = 1;
        } else if (0 < n && n <= 25) {
            // Use exact binomial test for small samples
            const pLeft = stdlibstatsBaseDistsBinomialCdf(nPos, n, 0.5);
            const pRight = 1 - stdlibstatsBaseDistsBinomialCdf(nPos - 1, n, 0.5);
            pValue = 2 * Math.min(pLeft, pRight);
        } else {
            // Use normal approximation for larger samples
            const diffCount = nPos - nNeg;
            const diff = Math.max(nPos, nNeg) - 0.5 * n - 0.5;
            const denom = Math.sqrt(n) / 2;
            zValue = (diffCount <= 0 ? 1 : -1) * (diff / denom);
            
            // p-value two-sided
            const pOneSide = 1 - stdlibstatsBaseDistsNormalCdf(Math.abs(zValue), 0, 1);
            pValue = 2 * pOneSide;
        }
        
        // Ensure p-value is between 0 and 1
        if (pValue > 1) pValue = 1;
        if (pValue < 0) pValue = 0;
        
        const result = {
            n: n,
            zValue: zValue,
            pValue: pValue
        };
        
        this.memo.signTest = result;
        return result;
    }

    getOutput() {
        const ranksFrequencies = this.getRanksFrequencies();
        let testStatisticsWilcoxon = null;
        let testStatisticsSign = null;
        
        if (this.testType.wilcoxon) {
            testStatisticsWilcoxon = this.getTestStatisticsWilcoxon();
        }
        if (this.testType.sign) {
            testStatisticsSign = this.getTestStatisticsSign();
        }
        
        return {
            variable1: this.variable1,
            variable2: this.variable2,
            ranksFrequencies,
            testStatisticsWilcoxon,
            testStatisticsSign,
            metadata: {
                hasInsufficientData: this.hasInsufficientData,
                insufficientType: this.insufficientType,
                variable1Label: this.variable1.label,
                variable2Label: this.variable2.label,
                variable1Name: this.variable1.name,
                variable2Name: this.variable2.name,
            }
        };
    }
}

globalThis.TwoRelatedSamplesCalculator = TwoRelatedSamplesCalculator;
export default TwoRelatedSamplesCalculator;
