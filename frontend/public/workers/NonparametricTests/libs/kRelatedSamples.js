/**
 * @file /libs/kRelatedSamples.js
 * @class KRelatedSamplesCalculator
 * @description
 * Kelas untuk melakukan analisis uji nonparametrik k sampel terkait.
 * Mendukung Friedman Test, Kendall's W, dan Cochran's Q Test.
 */
import stdlibstatsBaseDistsChisquareCdf from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-chisquare-cdf@0.2.2/+esm'
import { checkIsMissing, isNumeric } from './utils.js';

class KRelatedSamplesCalculator {
    /**
     * @param {object} params - Parameter untuk analisis.
     * @param {Array<object>} params.batchVariable - Array objek definisi variabel.
     * @param {Array<Array<any>>} params.data - Array data untuk setiap variabel.
     * @param {Array<any>} params.batchData - Array data gabungan untuk semua variabel.
     * @param {object} params.options - Opsi tambahan dari main thread.
     */
    constructor({variable, batchVariable, data, batchData, options = {} }) {
        console.log('KRelatedSamplesCalculator constructor');
        this.variable = variable;
        this.batchVariable = batchVariable;
        this.data = data;
        this.batchData = batchData;
        this.options = options;
        this.initialized = false;

        // Ekstrak opsi dari options
        this.testType = options.testType || { friedman: true, kendallsW: false, cochransQ: false };
        this.k = options.k;

        // Properti yang akan dihitung
        this.validData = [];
        this.N = 0;

        this.hasInsufficientDataEmpty = false;
        this.hasInsufficientDataSingle = false;

        /** @private */
        this.memo = {};
    }

    #initialize() {
        if (this.initialized) return;

        // Untuk k-related samples, kita perlu data yang terstruktur dalam format baris (subjek) dan kolom (kondisi)
        // Kita akan membuat matrix data dari data yang diterima
        const dataMatrix = [];
        
        // Pastikan semua array data memiliki panjang yang sama
        const minLength = Math.min(...this.data.map(arr => arr.length));
        
        // Untuk setiap baris data
        for (let i = 0; i < minLength; i++) {
            const row = [];
            let hasInvalidValue = false;
            
            // Untuk setiap variabel (kolom)
            for (let j = 0; j < this.data.length; j++) {
                const value = this.data[j][i];
                
                // Cek apakah nilai valid
                if (checkIsMissing(value, null, true) || !isNumeric(value)) {
                    hasInvalidValue = true;
                    break;
                }
                
                row.push(parseFloat(value));
            }
            
            // Hanya tambahkan baris jika semua nilai valid
            if (!hasInvalidValue) {
                dataMatrix.push(row);
            }
        }
        
        this.dataMatrix = dataMatrix;
        this.N = dataMatrix.length; // Jumlah subjek/kasus

        if (this.N < 1) {
            this.hasInsufficientDataEmpty = true;
        }
        if (this.N === 1) {
            this.hasInsufficientDataSingle = true;
        }

        this.initialized = true;
    }

    getN() { this.#initialize(); return this.N; }
    getK() { this.#initialize(); return this.k; }

    /**
     * Menghitung ranks untuk semua data
     * @returns {Object} Hasil perhitungan ranks
     */
    getRanks() {
        if (this.memo.ranks) return this.memo.ranks;
        this.#initialize();
        
        if (this.N === 0 || !this.dataMatrix || this.dataMatrix.length === 0) {
            return {
                variable: this.variable, // Gunakan variabel pertama sebagai referensi
                groups: [],
                n: 0,
                k: this.k
            };
        }

        // Hitung ranks untuk setiap baris
        const ranksMatrix = [];
        for (let i = 0; i < this.dataMatrix.length; i++) {
            const row = this.dataMatrix[i];
            const ranks = this.#computeRanksForRow(row);
            ranksMatrix.push(ranks);
        }
        
        // Hitung sum ranks dan mean ranks untuk setiap kondisi
        const sumRanks = new Array(this.k).fill(0);
        for (let i = 0; i < ranksMatrix.length; i++) {
            for (let j = 0; j < this.k; j++) {
                sumRanks[j] += ranksMatrix[i][j];
            }
        }
        
        const meanRanks = sumRanks.map(sum => sum / ranksMatrix.length);
        
        // Buat output dengan label kondisi
        const groups = [];
        
        // Tambahkan data untuk setiap variabel
        for (let i = 0; i < this.k; i++) {
            groups.push({
                value: i + 1,
                label: this.batchVariable[i].label || this.batchVariable[i].name,
                N: this.N,
                meanRank: meanRanks[i],
                sumRanks: sumRanks[i]
            });
        }
        
        const result = {
            variable: this.variable, // Gunakan variabel pertama sebagai referensi
            groups,
            n: this.N,
            k: this.k,
            ranksMatrix,
            sumRanks,
            meanRanks
        };

        this.memo.ranks = result;
        return result;
    }

    /**
     * Menghitung ranks untuk satu baris data
     * @param {Array<number>} row - Baris data
     * @returns {Array<number>} Array ranks
     */
    #computeRanksForRow(row) {
        // Buat array dengan pasangan nilai dan indeks asli
        const valueIndexPairs = row.map((value, index) => ({ value, index }));
        
        // Urutkan berdasarkan nilai
        valueIndexPairs.sort((a, b) => a.value - b.value);
        
        // Hitung ranks dengan penanganan ties
        const ranks = new Array(row.length).fill(0);
        let i = 0;
        while (i < valueIndexPairs.length) {
            const currentValue = valueIndexPairs[i].value;
            let j = i;
            
            // Cari semua nilai yang sama (ties)
            while (j < valueIndexPairs.length && valueIndexPairs[j].value === currentValue) {
                j++;
            }
            
            // Hitung rata-rata rank untuk ties
            const avgRank = (i + j + 1) / 2; // +1 karena rank dimulai dari 1
            
            // Tetapkan rank ke semua nilai yang sama
            for (let k = i; k < j; k++) {
                ranks[valueIndexPairs[k].index] = avgRank;
            }
            
            i = j;
        }
        
        return ranks;
    }

    /**
     * Menghitung statistik Friedman
     * @returns {Object} Hasil perhitungan statistik Friedman
     */
    getTestStatisticsFriedman() {
        if (this.memo.friedman) return this.memo.friedman;
        this.#initialize();
        
        // Validasi input
        if (this.N === 0 || this.k <= 1) {
            const result = {
                variable: this.variable, // Gunakan variabel pertama sebagai referensi
                TestType: "Friedman",
                N: 0,
                TestValue: 0,
                PValue: 1,
                df: 0
            };
            this.memo.friedman = result;
            return result;
        }
        
        // Dapatkan data ranks
        const ranksData = this.getRanks();
        const n = ranksData.n; // Jumlah subjek
        const k = ranksData.k; // Jumlah kondisi
        const sumRanks = ranksData.sumRanks;
        const ranksMatrix = ranksData.ranksMatrix;
        
        // Hitung tie correction
        let tieSum = 0;
        for (let i = 0; i < ranksMatrix.length; i++) {
            // Hitung tie groups dalam baris
            const tieGroups = this.#findTieGroups(ranksMatrix[i]);
            tieGroups.forEach(count => {
                tieSum += (Math.pow(count, 3) - count);
            });
        }
        
        // Hitung Friedman chi-square
        let sumSq = 0;
        for (let j = 0; j < k; j++) {
            sumSq += Math.pow(sumRanks[j], 2);
        }
        
        // Formula Friedman: Chi-square = [12 / (n*k*(k+1))] * sum(Rj^2) - 3*n*(k+1)
        const numerator = (12 / (n * k * (k + 1))) * sumSq - 3 * n * (k + 1);
        
        // Koreksi untuk ties
        const denominator = 1 - (tieSum / (n * k * (Math.pow(k, 2) - 1)));
        
        const chiSquare = numerator / denominator;
        const df = k - 1;
        const pValue = 1 - stdlibstatsBaseDistsChisquareCdf(chiSquare, df);
        
        const result = {
            variable: this.variable, // Gunakan variabel pertama sebagai referensi
            TestType: "Friedman",
            N: n,
            TestValue: chiSquare,
            PValue: pValue,
            df: df
        };

        this.memo.friedman = result;
        return result;
    }

    /**
     * Menghitung statistik Kendall's W
     * @returns {Object} Hasil perhitungan statistik Kendall's W
     */
    getTestStatisticsKendallsW() {
        if (this.memo.kendallsW) return this.memo.kendallsW;
        this.#initialize();
        
        // Validasi input
        if (this.N === 0 || this.k <= 1) {
            const result = {
                variable: this.variable, // Gunakan variabel pertama sebagai referensi
                TestType: "Kendall's W",
                N: 0,
                W: 0,
                TestValue: 0,
                PValue: 1,
                df: 0
            };
            this.memo.kendallsW = result;
            return result;
        }
        
        // Dapatkan data Friedman untuk menggunakan hasil perhitungannya
        const friedman = this.getTestStatisticsFriedman();
        const n = this.getRanks().n; // Jumlah subjek
        const k = this.getRanks().k; // Jumlah kondisi
        
        // Kendall's W = Friedman / (n*(k-1))
        const W = friedman.TestValue / (n * (k - 1));
        
        // Chi-square = n*(k-1)*W (sama dengan statistik Friedman)
        const chiSquare = friedman.TestValue;
        const df = k - 1;
        const pValue = friedman.PValue;
        
        const result = {
            variable: this.variable, // Gunakan variabel pertama sebagai referensi
            TestType: "Kendall's W",
            N: n,
            W: W,
            TestValue: chiSquare,
            PValue: pValue,
            df: df
        };
        
        this.memo.kendallsW = result;
        return result;
    }

    /**
     * Menghitung statistik Cochran's Q
     * @returns {Object} Hasil perhitungan statistik Cochran's Q
     */
    getTestStatisticsCochransQ() {
        if (this.memo.cochransQ) return this.memo.cochransQ;
        this.#initialize();
        
        // Validasi input
        if (this.N === 0 || this.k <= 1) {
            const result = {
                variable: this.variable, // Gunakan variabel pertama sebagai referensi
                TestType: "Cochran's Q",
                N: 0,
                TestValue: 0,
                PValue: 1,
                df: 0
            };
            this.memo.cochransQ = result;
            return result;
        }
        
        // Untuk Cochran's Q, data harus biner (0/1)
        // Kita akan mengkonversi data menjadi biner berdasarkan median
        
        // Buat matrix biner dari data asli
        const binaryMatrix = [];
        for (let i = 0; i < this.dataMatrix.length; i++) {
            const row = [];
            for (let j = 0; j < this.k; j++) {
                // Konversi ke biner (0/1) berdasarkan nilai median atau threshold lain
                row.push(this.dataMatrix[i][j] > 0 ? 1 : 0);
            }
            binaryMatrix.push(row);
        }
        
        // Hitung jumlah 1 untuk setiap kolom (Cj)
        const colSums = new Array(this.k).fill(0);
        for (let i = 0; i < binaryMatrix.length; i++) {
            for (let j = 0; j < this.k; j++) {
                colSums[j] += binaryMatrix[i][j];
            }
        }
        
        // Hitung jumlah 1 untuk setiap baris (Ri)
        const rowSums = binaryMatrix.map(row => row.reduce((sum, val) => sum + val, 0));
        
        // Hitung total 1 (T)
        const totalSum = colSums.reduce((sum, val) => sum + val, 0);
        
        // Hitung Cochran's Q
        // Q = (k-1) * [k * sum(Cj^2) - T^2] / [k*T - sum(Ri^2)]
        let sumColSqr = 0;
        for (let j = 0; j < this.k; j++) {
            sumColSqr += Math.pow(colSums[j], 2);
        }
        
        let sumRowSqr = 0;
        for (let i = 0; i < this.N; i++) {
            sumRowSqr += Math.pow(rowSums[i], 2);
        }
        
        const numerator = this.k * sumColSqr - Math.pow(totalSum, 2);
        const denominator = this.k * totalSum - sumRowSqr;
        
        const Q = (this.k - 1) * numerator / denominator;
        const df = this.k - 1;
        const pValue = 1 - stdlibstatsBaseDistsChisquareCdf(Q, df);
        
        const result = {
            variable: this.variable, // Gunakan variabel pertama sebagai referensi
            TestType: "Cochran's Q",
            N: this.N,
            TestValue: Q,
            PValue: pValue,
            df: df
        };
        
        this.memo.cochransQ = result;
        return result;
    }

    /**
     * Menemukan kelompok tie dalam array
     * @param {Array<number>} arr - Array nilai
     * @returns {Array<number>} Array jumlah tie untuk setiap kelompok
     */
    #findTieGroups(arr) {
        const valueCount = {};
        
        // Hitung frekuensi setiap nilai
        arr.forEach(val => {
            valueCount[val] = (valueCount[val] || 0) + 1;
        });
        
        // Ambil hanya kelompok dengan count > 1 (tie groups)
        return Object.values(valueCount).filter(count => count > 1);
    }

    /**
     * Dapatkan hasil tes statistik berdasarkan jenis tes yang dipilih
     * @returns {Object} Hasil tes statistik
     */
    getTestStatistics() {
        if (this.testType.friedman) {
            return this.getTestStatisticsFriedman();
        }
        if (this.testType.kendallsW) {
            return this.getTestStatisticsKendallsW();
        }
        if (this.testType.cochransQ) {
            return this.getTestStatisticsCochransQ();
        }
        
        // Default ke Friedman jika tidak ada tes yang dipilih
        return this.getTestStatisticsFriedman();
    }

    /**
     * Dapatkan semua hasil analisis
     * @returns {Object} Semua hasil analisis
     */
    getOutput() {
        let ranks = null;
        let testStatistics = null;
        let frequencies = null;
        
        if (this.testType.friedman || this.testType.kendallsW) {
            const rawRanks = this.getRanks();
            if (rawRanks && rawRanks.groups) {
                ranks = {
                    variable: rawRanks.variable,
                    groups: rawRanks.groups.map(g => ({
                        label: g.label,
                        meanRank: g.meanRank
                    }))
                };
            }
        }
        
        if (this.testType.cochransQ) {
            frequencies = {
                variable: this.variable,
                groups: Array.from({ length: this.k }, (_, i) => ({
                    label: this.batchVariable[i].label || this.batchVariable[i].name,
                    count: 0 // Placeholder untuk jumlah
                }))
            };
        }
        
        testStatistics = this.getTestStatistics();
        
        return {
            ranks,
            frequencies,
            testStatistics,
            metadata: {
                hasInsufficientDataEmpty: this.hasInsufficientDataEmpty,
                hasInsufficientDataSingle: this.hasInsufficientDataSingle
            }
        };
    }
}

globalThis.KRelatedSamplesCalculator = KRelatedSamplesCalculator;
export default KRelatedSamplesCalculator;