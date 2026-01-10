/**
 * @file /libs/chiSquare.js
 * @class ChiSquareCalculator
 * @description
 * Kelas untuk melakukan analisis Chi-Square Test.
 * Menghitung statistik deskriptif dan hasil uji chi-square.
 */
import stdlibstatsBaseDistsChisquareCdf from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-chisquare-cdf@0.2.2/+esm'
import { checkIsMissing, isNumeric } from './utils.js';

class ChiSquareCalculator {
    /**
     * @param {object} params - Parameter untuk analisis.
     * @param {object} params.variable1 - Objek definisi variabel.
     * @param {Array<any>} params.data1 - Array data untuk variabel ini.
     * @param {object} params.options - Opsi tambahan dari main thread.
     */
    constructor({ variable1, data1, options = {} }) {
        console.log('ChiSquareCalculator constructor');
        this.variable1 = variable1;
        this.data1 = data1;
        this.options = options;
        this.initialized = false;
        
        // Ekstrak opsi dari options
        this.expectedRange = options.expectedRange || { getFromData: true, useSpecifiedRange: false };
        this.rangeValue = options.rangeValue || { lowerValue: null, upperValue: null };
        this.expectedValue = options.expectedValue || { allCategoriesEqual: true, values: false, inputValue: null };
        this.expectedValueList = options.expectedValueList || [];
        this.displayStatistics = options.displayStatistics || { descriptive: false, quartiles: false };
        
        // Properti yang akan dihitung
        this.validData = [];
        this.observedN = {};
        this.N = 0;
        this.countCategories = 0;
        
        /** @private */
        this.memo = {};
    }
    
    /**
     * @private
     * Memproses data untuk analisis
     */
    #initialize() {
        if (this.initialized) return;

        // For Chi-Square test, we need to treat all numeric data as valid
        // The measure type doesn't matter for frequency analysis
        const isNumericType = true;
        this.validData = this.data1
            .filter(value => {
                // Skip null/undefined values
                if (value === null || value === undefined) {
                    return false;
                }
                // Check if it's missing according to variable definition
                if (checkIsMissing(value, this.variable1.missing, isNumericType)) {
                    return false;
                }
                // Check if it's numeric
                if (!isNumeric(value)) {
                    return false;
                }
                return true;
            });
        
        console.log('ChiSquareCalculator: Valid data after filtering:', this.validData);
        
        // Terapkan filter range jika diperlukan
        if (this.expectedRange.useSpecifiedRange && 
            this.rangeValue.lowerValue !== null && 
            this.rangeValue.upperValue !== null) {
            this.validData = this.validData
                .map(value => Math.floor(value))
                .filter(value => value >= this.rangeValue.lowerValue && value <= this.rangeValue.upperValue);
            this.countCategories = this.rangeValue.upperValue - this.rangeValue.lowerValue + 1;
        }
        
        // Hitung Observed N
        this.validData.forEach(value => {
            this.observedN[value] = (this.observedN[value] || 0) + 1;
        });

        // Hitung Total N dari Observed N
        this.N = this.validData.length;

        // Hitung jumlah kategori jika belum dihitung
        if (!this.countCategories) {
            this.countCategories = Object.keys(this.observedN).length;
        }

        // Handle edge case: if no valid data, ensure countCategories is at least 0
        if (this.N === 0) {
            this.countCategories = 0;
        }

        this.initialized = true;
    }
    
    getN() { this.#initialize(); return this.data1.length; }
    getValidN() { this.#initialize(); return this.N; }
    getCountCategories() { this.#initialize(); return this.countCategories; }
    
    /**
     * Menghitung frekuensi yang diharapkan berdasarkan opsi
     * @returns {number|Array<number>} Frekuensi yang diharapkan
     */
    getExpectedN() {
        if (this.memo.expectedN) return this.memo.expectedN;
        
        this.#initialize();
        let expectedN;
        
        // Handle edge case: no valid data
        if (this.N === 0 || this.countCategories === 0) {
            this.memo.expectedN = 0;
            return 0;
        }
        
        if (this.expectedValue.values) {
            if (this.expectedValueList.length !== this.countCategories) {
                return null;
            }
            const totalExpected = this.expectedValueList.reduce((a, b) => a + b, 0);
            expectedN = this.expectedValueList.map(value => (value / totalExpected) * this.N);
        } else {
            expectedN = this.N / this.countCategories;
        }
        
        this.memo.expectedN = expectedN;
        return this.memo.expectedN;
    }

    getCategoryList() {
        if (this.memo.categoryList) return this.memo.categoryList;
        
        this.#initialize();
        let categoryList;
        
        // Handle edge case: no valid data
        if (this.N === 0 || this.countCategories === 0) {
            this.memo.categoryList = [];
            return [];
        }
        
        if (this.expectedRange.useSpecifiedRange && 
            this.rangeValue.lowerValue !== null && 
            this.rangeValue.upperValue !== null) {
            categoryList = Array.from(
                { length: this.countCategories }, 
                (_, i) => this.rangeValue.lowerValue + i
            );
        } else {
            categoryList = Object.keys(this.observedN).map(Number).sort((a, b) => a - b);
        }
        
        this.memo.categoryList = categoryList;
        return categoryList;
    }
    
    getResidual() { 
        this.#initialize();
        
        // Handle edge case: no valid data
        if (this.N === 0 || this.countCategories === 0) {
            return [];
        }
        
        const expectedN = this.getExpectedN();
        const categoryList = this.getCategoryList();
        
        const residual = categoryList.map((value, index) => {
            const observed = this.observedN[value] || 0;
            const expected = Array.isArray(expectedN) ? expectedN[index] : expectedN;
            return observed - expected;
        });
        
        return residual;
    }
    
    /**
     * Menghitung nilai chi-square
     * @returns {number} Nilai chi-square
     */
    getChiSquareValue() {
        if (this.memo.chiSquare) return this.memo.chiSquare;
        
        this.#initialize();
        const expectedN = this.getExpectedN();
        const categoryList = this.getCategoryList();
        let chiSum = 0;
        
        if (Array.isArray(expectedN)) {
            categoryList.forEach((category, index) => {
                const obs = this.observedN[category] || 0;
                const exp = expectedN[index];
                if (exp > 0) {
                    const diff = obs - exp;
                    chiSum += (diff * diff) / exp;
                }
            });
        } else {
            Object.values(this.observedN).forEach(obs => {
                const exp = expectedN;
                if (exp > 0) {
                    const diff = obs - exp;
                    chiSum += (diff * diff) / exp;
                }
            });

            if (this.expectedRange.useSpecifiedRange && 
                this.rangeValue.lowerValue !== null && 
                this.rangeValue.upperValue !== null) {
                const missingCategories = this.countCategories - Object.keys(this.observedN).length;
                if (missingCategories > 0 && expectedN > 0) {
                    chiSum += expectedN * missingCategories; // (0-expectedN)²/expectedN * missingCategories
                }
            }
        }
        
        this.memo.chiSquare = chiSum;
        return chiSum;
    }
    
    /**
     * Menghitung derajat kebebasan
     * @returns {number} Derajat kebebasan
     */
    getDegreesOfFreedom() {
        if (this.memo.df) return this.memo.df;
        
        this.#initialize();
        let df;
        
        if (this.expectedRange.useSpecifiedRange && 
            this.rangeValue.lowerValue !== null && 
            this.rangeValue.upperValue !== null) {
            df = this.rangeValue.upperValue - this.rangeValue.lowerValue;
        } else {
            df = this.countCategories - 1;
        }
        
        this.memo.df = df;
        return df;
    }
    
    /**
     * Menghitung p-value
     * @returns {number} P-value
     */
    getPValue() {
        if (this.memo.pValue) return this.memo.pValue;
        
        const chiValue = this.getChiSquareValue();
        const df = this.getDegreesOfFreedom();
        
        let pValue = null;
        try {
            pValue = 1 - stdlibstatsBaseDistsChisquareCdf(chiValue, df);
        } catch (e) {
            console.error("Error calculating Chi-square p-value:", e);
        }
        
        this.memo.pValue = pValue;
        return pValue;
    }
    
    /**
     * Mendapatkan hasil frekuensi
     * @returns {object} Hasil frekuensi
     */
    getFrequencies() {
        this.#initialize();

        // Handle edge case: no valid data
        if (this.N === 0 || this.countCategories === 0) {
            return {
                categoryList: [],
                observedN: [],
                expectedN: [],
                residual: [],
                N: 0
            };
        }

        const expectedN = this.getExpectedN();
        const residual = this.getResidual();
        const categoryList = this.getCategoryList();
        
        let observedNList = [];
        let expectedNList = [];

        categoryList.forEach((value, index) => {
            const observed = this.observedN[value] || 0;
            const expected = Array.isArray(expectedN) ? expectedN[index] : expectedN;
            observedNList.push(observed);
            expectedNList.push(expected);
        });

        return {
            categoryList,
            observedN: observedNList,
            expectedN: expectedNList,
            residual,
            N: this.N
        };
    }
    
    /**
     * Mendapatkan hasil uji chi-square
     * @returns {object} Hasil uji chi-square
     */
    getTestStatistics() {  
        this.#initialize();
        if (this.countCategories <= 1) {
            return {
                ChiSquare: null,
                DF: null,
                PValue: null
            };
        }
        const chiSquare = this.getChiSquareValue();
        const df = this.getDegreesOfFreedom();
        const pValue = this.getPValue();

        return {
            ChiSquare: chiSquare,
            DF: df,
            PValue: pValue
        };
    }
    
    /**
     * Mengambil semua hasil statistik.
     * @returns {Object} Objek hasil yang berisi statistik dan hasil uji.
     */
    getOutput() {
        this.#initialize();
        let hasInsufficientData = false;
        let insufficientType = [];
        if (this.validData.length === 0) {
            hasInsufficientData = true;
            insufficientType.push('empty');
        }
        if (this.countCategories <= 1) {
            hasInsufficientData = true;
            insufficientType.push('single');
        }
        const frequencies = this.getFrequencies();
        const testStatistics = this.getTestStatistics();

        return {
            variable1: this.variable1,
            frequencies,
            testStatistics,
            metadata: {
                hasInsufficientData,
                insufficientType,
                variableLabel: this.variable1.label || '',
                variableName: this.variable1.name,
            }
        };
    }
}

globalThis.ChiSquareCalculator = ChiSquareCalculator;
export default ChiSquareCalculator;