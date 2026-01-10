/**
 * @file /libs/runs.js
 * @class RunsCalculator
 * @description
 * Kelas untuk melakukan analisis Runs Test.
 * Menghitung hasil uji runs.
 */
import stdlibstatsBaseDistsNormalCdf from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-normal-cdf@0.2.2/+esm';
import { checkIsMissing, isNumeric } from './utils.js';

class RunsCalculator {
    /**
     * @param {object} params - Parameter untuk analisis.
     * @param {object} params.variable - Objek definisi variabel.
     * @param {Array<any>} params.data - Array data untuk variabel ini.
     * @param {object} params.options - Opsi tambahan dari main thread.
     */
    constructor({ variable, data, options = {} }) {
        console.log('RunsCalculator constructor');
        this.variable = variable;
        this.data = data;
        this.options = options;
        this.initialized = false;
        
        // Ekstrak opsi dari options
        this.cutPoint = options.cutPoint || { median: true, mean: false, mode: false, custom: false };
        this.customValue = options.customValue !== undefined ? options.customValue : 0;
        this.displayStatistics = options.displayStatistics || { descriptive: false, quartiles: false };
        
        // Properti yang akan dihitung
        this.validData = [];
        this.N = 0;

        this.hasInsufficientData = false;
        this.insufficientType = [];
        
        /** @private */
        this.memo = {};
    }
    
    /**
     * @private
     * Memproses data untuk analisis
     */
    #initialize() {
        if (this.initialized) return;

        const isNumericType = ['scale', 'date'].includes(this.variable.measure);

        // Filter data yang valid
        this.validData = this.data
            .filter(value => !checkIsMissing(value, this.variable.missing, isNumericType) && isNumeric(value))
            .map(value => parseFloat(value));
        
        // Hitung Total N
        this.N = this.validData.length;
        if (this.N === 0) {
            this.hasInsufficientData = true;
            this.insufficientType.push('empty');
        }

        this.initialized = true;
    }
    
    getN() { this.#initialize(); return this.data.length; }
    getValidN() { this.#initialize(); return this.N; }
    
    /**
     * Menghitung mean dari array
     * @returns {number} Mean
     */
    #getMean() {
        if (this.memo.mean !== undefined) return this.memo.mean;
        
        this.#initialize();
        
        if (this.N === 0) return null;
        
        const sum = this.validData.reduce((acc, val) => acc + val, 0);
        const mean = sum / this.N;
        
        this.memo.mean = mean;
        return mean;
    }
    
    /**
     * Menghitung median dari array
     * @returns {number} Median
     */
    #getMedian() {
        if (this.memo.median !== undefined) return this.memo.median;
        
        this.#initialize();
        
        if (this.N === 0) return null;
        
        const sorted = [...this.validData].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        const median = sorted.length % 2 === 0 ? 
            (sorted[mid - 1] + sorted[mid]) / 2 : 
            sorted[mid];
        
        this.memo.median = median;
        return median;
    }
    
    /**
     * Menghitung mode dari array
     * @returns {number} Mode
     */
    #getMode() {
        if (this.memo.mode !== undefined) return this.memo.mode;
        
        this.#initialize();
        
        if (this.N === 0) return null;
        
        const frequency = {};
        this.validData.forEach(value => {
            frequency[value] = (frequency[value] || 0) + 1;
        });
        
        // Cari nilai dengan frekuensi tertinggi
        let maxFrequency = 0;
        let modeValue = this.validData[0]; // nilai default
        
        Object.entries(frequency).forEach(([value, freq]) => {
            if (freq > maxFrequency) {
                maxFrequency = freq;
                modeValue = parseFloat(value);
            }
        });
        
        this.memo.mode = modeValue;
        return modeValue;
    }
    
    /**
     * Menghitung statistik runs test dengan test value tertentu
     * @param {number|string} testValueType - Tipe test value (median, mean, mode) atau nilai custom
     * @returns {object} Hasil statistik runs test
     */
    #getRunsTestStats(testValueType) {
        const key = `runsTest_${testValueType}`;
        if (this.memo[key]) return this.memo[key];
        
        this.#initialize();
        
        if (this.N <= 1) {
            return {
                TestValue: null,
                CasesBelow: 0,
                CasesAbove: 0,
                Total: this.N,
                Runs: 0,
                Z: null,
                PValue: null
            };
        }
        
        // Tentukan test value berdasarkan testValueType
        let testValue;
        if (testValueType === 'median') {
            testValue = this.#getMedian();
        } else if (testValueType === 'mode') {
            testValue = this.#getMode();
        } else if (testValueType === 'mean') {
            testValue = this.#getMean();
        } else if (typeof testValueType === 'number') {
            testValue = testValueType;
        } else {
            testValue = 0; // default
        }

        // Klasifikasikan data: hitung jumlah kasus < testValue dan >= testValue
        const casesBelow = this.validData.filter(x => x < testValue).length;
        const casesAbove = this.validData.filter(x => x >= testValue).length;

        // Hitung jumlah runs (perubahan kategori)
        let runs = 1; // minimal ada 1 run
        for (let i = 1; i < this.N; i++) {
            if ((this.validData[i] < testValue) !== (this.validData[i - 1] < testValue)) {
                runs++;
            }
        }
        if (runs === 1) {
            this.hasInsufficientData = true;
            if (typeof testValueType === 'number') {
                this.insufficientType.push(`single custom`);
            } else {
                this.insufficientType.push(`single ${testValueType}`);
            }
            return {
                TestValue: testValue,
                CasesBelow: casesBelow,
                CasesAbove: casesAbove,
                Total: this.N,
                Runs: runs,
                Z: null,
                PValue: null
            };
        }

        // Hitung ekspektasi (mean) jumlah runs dan standar deviasi
        const mu_R = 1 + (2 * casesBelow * casesAbove) / this.N;
        const sigma_R = Math.sqrt((2 * casesBelow * casesAbove * (2 * casesBelow * casesAbove - this.N)) / 
                                (this.N * this.N * (this.N - 1)));

        // Terapkan koreksi kontinuitas untuk nilai runs
        let runsCorrected = runs;
        if (runs < mu_R) {
            runsCorrected = runs + 0.5;
        } else if (runs > mu_R) {
            runsCorrected = runs - 0.5;
        }

        // Hitung nilai Z
        let Z = null;
        let PValue = null;
        
        if (sigma_R > 0) {
            Z = (runsCorrected - mu_R) / sigma_R;
            // Hitung p-value 2-tailed menggunakan stdlibstatsBaseDistsNormalCdf
            PValue = 2 * (1 - stdlibstatsBaseDistsNormalCdf(Math.abs(Z), 0, 1));
        }

        const result = {
            TestValue: testValue,    // nilai test value berdasarkan testValueType
            CasesBelow: casesBelow,   // jumlah data dengan nilai < testValue
            CasesAbove: casesAbove,   // jumlah data dengan nilai >= testValue
            Total: this.N, // total kasus/data
            Runs: runs,         // jumlah runs yang teramati
            Z: Z,            // nilai statistik Z (setelah koreksi kontinuitas)
            PValue: PValue        // p-value (2-tailed)
        };
        
        this.memo[key] = result;
        return result;
    }
    
    /**
     * Mendapatkan hasil runs test untuk semua cut points yang dipilih
     * @returns {object} Hasil runs test
     */
    getRunsTest() {
        if (this.memo.runsTest) return this.memo.runsTest;
        
        this.#initialize();
        
        const results = {};
        
        try {
            if (this.cutPoint.median) {
                results.median = this.#getRunsTestStats('median');
            }
            
            if (this.cutPoint.mean) {
                results.mean = this.#getRunsTestStats('mean');
            }
            
            if (this.cutPoint.mode) {
                results.mode = this.#getRunsTestStats('mode');
            }
            
            if (this.cutPoint.custom) {
                results.custom = this.#getRunsTestStats(this.customValue);
            }
        } catch (error) {
            console.error("Error in getRunsTest:", error);
        }
        
        this.memo.runsTest = {
            ...results
        };
        
        return {
            ...results
        };
    }
    
    /**
     * Mengambil semua hasil statistik.
     * @returns {Object} Objek hasil yang berisi hasil uji runs.
     */
    getOutput() {
        this.#initialize();
        
        
        const variable1 = this.variable;
        const runsTest = this.getRunsTest();

        return {
            variable1,
            runsTest,
            metadata: {
                hasInsufficientData: this.hasInsufficientData,
                insufficientType: this.insufficientType,
                variableName: this.variable.name,
                variableLabel: this.variable.label
            }
        };
    }
}

globalThis.RunsCalculator = RunsCalculator;
export default RunsCalculator;
