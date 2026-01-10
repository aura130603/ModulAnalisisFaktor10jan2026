/**
 * @file /libs/descriptiveStatistics.js
 * @class DescriptiveStatisticsCalculator
 * @description
 * Kelas untuk menghitung statistik deskriptif.
 * Menghitung berbagai statistik deskriptif seperti mean, std deviation, dll.
 */
import { checkIsMissing, isNumeric } from './utils.js';

class DescriptiveStatisticsCalculator {
    /**
     * @param {object} params - Parameter untuk analisis.
     * @param {object} params.variable1 - Objek definisi variabel pertama.
     * @param {Array<any>} params.data1 - Array data untuk variabel pertama.
     * @param {object} params.variable2 - Objek definisi variabel kedua (optional, untuk paired).
     * @param {Array<any>} params.data2 - Array data untuk variabel kedua (optional, untuk paired).
     * @param {object} params.options - Opsi tambahan dari main thread.
     */
    constructor({ variable1, variable2, data1, data2, options = {} }) {
        this.variable1 = variable1;
        this.variable2 = variable2;
        this.data1 = data1;
        this.data2 = data2;

        this.options = options;
        this.initialized = false;

        // Ekstrak opsi dari options
        this.displayStatistics = options.displayStatistics || { descriptive: false, quartiles: false };
        
        // Properti yang akan dihitung
        this.validData = [];
        this.validData1 = [];
        this.validData2 = [];
        this.N = 0;
        this.N1 = 0;
        this.N2 = 0;
        
        /** @private */
        this.memo = {};
    }
    
    
    /**
     * @private
     * Memproses data untuk analisis
     */
    #initialize() {
        if (this.initialized) return;

        // Untuk single variable atau variable1
        if (this.variable1 && this.data1) {
            const isNumericType1 = ['scale', 'date'].includes(this.variable1.measure);
            this.validData1 = this.data1
                .filter(value => !checkIsMissing(value, this.variable1.missing, isNumericType1) && isNumeric(value))
                .map(value => parseFloat(value));
            this.N1 = this.validData1.length;
        }

        // Untuk paired variables (variable2)
        if (this.variable2 && this.data2) {
            const isNumericType2 = ['scale', 'date'].includes(this.variable2.measure);
            this.validData2 = this.data2
                .filter(value => !checkIsMissing(value, this.variable2.missing, isNumericType2) && isNumeric(value))
                .map(value => parseFloat(value));
            this.N2 = this.validData2.length;
        }

        this.initialized = true;
    }
    
    /**
     * Menghitung mean dari data
     * @param {string} [which] - '1' untuk data1, '2' untuk data2, undefined untuk data utama
     * @returns {number|null} Mean
     */
    getMean(which) {
        this.#initialize();
        let arr, N, key;
        if (which === '1') {
            arr = this.validData1;
            N = this.N1;
            key = 'mean1';
        } else if (which === '2') {
            arr = this.validData2;
            N = this.N2;
            key = 'mean2';
        }
        if (this.memo[key] !== undefined) return this.memo[key];
        if (!arr || N === 0) return null;
        const sum = arr.reduce((acc, val) => acc + val, 0);
        const mean = sum / N;
        this.memo[key] = mean;
        return mean;
    }
    
    /**
     * Menghitung standard deviation dari data
     * @param {string} [which] - '1' untuk data1, '2' untuk data2, undefined untuk data utama
     * @returns {number|null} Standard deviation
     */
    getStdDev(which) {
        this.#initialize();
        let arr, N, key;
        if (which === '1') {
            arr = this.validData1;
            N = this.N1;
            key = 'stdDev1';
        } else if (which === '2') {
            arr = this.validData2;
            N = this.N2;
            key = 'stdDev2';
        }
        if (this.memo[key] !== undefined) return this.memo[key];
        if (!arr || N <= 1) return null;
        const mean = this.getMean(which);
        const sumSq = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
        const stdDev = Math.sqrt(sumSq / (N - 1));
        this.memo[key] = stdDev;
        return stdDev;
    }
    
    /**
     * Menghitung standard error mean
     * @param {string} [which] - '1' untuk data1, '2' untuk data2, undefined untuk data utama
     * @returns {number|null} Standard error mean
     */
    getSEMean(which) {
        this.#initialize();
        let arr, N, key;
        if (which === '1') {
            arr = this.validData1;
            N = this.N1;
            key = 'seMean1';
        } else if (which === '2') {
            arr = this.validData2;
            N = this.N2;
            key = 'seMean2';
        }
        if (this.memo[key] !== undefined) return this.memo[key];
        if (!arr || N === 0) return null;
        const stdDev = this.getStdDev(which);
        if (stdDev === null) return null;
        const seMean = stdDev / Math.sqrt(N);
        this.memo[key] = seMean;
        return seMean;
    }
    
    /**
     * Menghitung nilai minimum dari data
     * @param {string} [which] - '1' untuk data1, '2' untuk data2, undefined untuk data utama
     * @returns {number|null} Nilai minimum
     */
    getMin(which) {
        this.#initialize();
        let arr, N, key;
        if (which === '1') {
            arr = this.validData1;
            N = this.N1;
            key = 'min1';
        } else if (which === '2') {
            arr = this.validData2;
            N = this.N2;
            key = 'min2';
        }
        if (this.memo[key] !== undefined) return this.memo[key];
        if (!arr || N === 0) return null;
        const min = Math.min(...arr);
        this.memo[key] = min;
        return min;
    }
    
    /**
     * Menghitung nilai maximum dari data
     * @param {string} [which] - '1' untuk data1, '2' untuk data2, undefined untuk data utama
     * @returns {number|null} Nilai maximum
     */
    getMax(which) {
        this.#initialize();
        let arr, N, key;
        if (which === '1') {
            arr = this.validData1;
            N = this.N1;
            key = 'max1';
        } else if (which === '2') {
            arr = this.validData2;
            N = this.N2;
            key = 'max2';
        }
        if (this.memo[key] !== undefined) return this.memo[key];
        if (!arr || N === 0) return null;
        const max = Math.max(...arr);
        this.memo[key] = max;
        return max;
    }
    
    /**
     * Menghitung percentile tertentu dari data
     * @param {number} percentile - Percentile yang ingin dihitung (0-100)
     * @param {string} [which] - '1' untuk data1, '2' untuk data2, undefined untuk data utama
     * @returns {number|null} Nilai percentile
     */
    getPercentile(percentile, which) {
        this.#initialize();
        let arr, N, key;
        if (which === '1') {
            arr = this.validData1;
            N = this.N1;
            key = `percentile1_${percentile}`;
        } else if (which === '2') {
            arr = this.validData2;
            N = this.N2;
            key = `percentile2_${percentile}`;
        }
        if (this.memo[key] !== undefined) return this.memo[key];
        if (!arr || N === 0) return null;
        const sorted = [...arr].sort((a, b) => a - b);
        // Tukey's method (linear interpolation between closest ranks)
        const pos = (percentile / 100) * (sorted.length - 1);
        const lower = Math.floor(pos);
        const upper = Math.ceil(pos);
        if (lower === upper) {
            this.memo[key] = sorted[lower];
            return sorted[lower];
        }
        const weight = pos - lower;
        const result = sorted[lower] * (1 - weight) + sorted[upper] * weight;
        this.memo[key] = result;
        return result;
    }
    
    /**
     * Mendapatkan semua statistik deskriptif
     * @returns {object} Objek berisi semua statistik deskriptif
     */
    getDescriptiveStatistics() {
        this.#initialize();
        const result = {};
        
        // Untuk single variable atau variable1
        if (this.variable1 && this.data1) {
            result.variable1 = this.variable1;
            result.N1 = this.N1;
            result.Mean1 = this.getMean('1');
            result.StdDev1 = this.getStdDev('1');
            result.Min1 = this.getMin('1');
            result.Max1 = this.getMax('1');
            result.Percentile25_1 = this.getPercentile(25, '1');
            result.Percentile50_1 = this.getPercentile(50, '1');
            result.Percentile75_1 = this.getPercentile(75, '1');
        }
        
        // Jika paired variables tersedia, tambahkan statistiknya juga
        if (this.variable2 && this.data2) {
            result.variable2 = this.variable2;
            result.N2 = this.N2;
            result.Mean2 = this.getMean('2');
            result.StdDev2 = this.getStdDev('2');
            result.Min2 = this.getMin('2');
            result.Max2 = this.getMax('2');
            result.Percentile25_2 = this.getPercentile(25, '2');
            result.Percentile50_2 = this.getPercentile(50, '2');
            result.Percentile75_2 = this.getPercentile(75, '2');
        }
        return result;
    }
    
    /**
     * Mengambil semua hasil statistik.
     * @returns {Object} Objek hasil yang berisi statistik deskriptif.
     */
    getOutput() {
        const descriptiveStatistics = this.getDescriptiveStatistics();
        return {
            descriptiveStatistics
        };
    }
}

// Export the calculator class for ES modules
globalThis.DescriptiveStatisticsCalculator = DescriptiveStatisticsCalculator;
export default DescriptiveStatisticsCalculator;