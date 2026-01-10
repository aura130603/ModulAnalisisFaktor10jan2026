/**
 * @file /libs/bivariate.js
 * @class BivariateCalculator
 * @description
 * Kelas untuk melakukan analisis Bivariate.
 * Menghitung statistik deskriptif dan hasil uji t-test.
 */
import stdlibstatsBaseDistsTCdf from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-t-cdf@0.2.2/+esm'
import stdlibstatsBaseDistsNormalCdf from 'https://cdn.jsdelivr.net/npm/@stdlib/stats-base-dists-normal-cdf@0.2.2/+esm'
import { checkIsMissing, isNumeric } from './utils.js';

class BivariateCalculator {
    /**
     * @param {object} params - Parameter untuk analisis.
     * @param {object} params.variable - Objek definisi variabel.
     * @param {Array<any>} params.data - Array data untuk variabel ini.
     * @param {object} params.options - Opsi tambahan dari main thread.
     */
    constructor({ variable, data, options = {} }) {
        console.log('BivariateCalculator constructor');
        this.variable = variable;
        this.data = data;
        this.options = options;
        this.initialized = false;
        
        // Ekstrak opsi dari options
        this.correlationCoefficient = options.correlationCoefficient || false;
        this.testOfSignificance = options.testOfSignificance || false;
        this.flagSignificantCorrelations = options.flagSignificantCorrelations || false;
        this.showOnlyTheLowerTriangle = options.showOnlyTheLowerTriangle || false;
        this.showDiagonal = options.showDiagonal || false;
        this.statisticsOptions = options.statisticsOptions || false;
        this.partialCorrelationKendallsTauB = options.partialCorrelationKendallsTauB || false;
        this.missingValuesOptions = options.missingValuesOptions || false;
        this.controlVariables = options.controlVariables || [];
        this.controlData = options.controlData || [];

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

        // Filter data yang valid, tergantung missingValuesOptions
        if (
            this.missingValuesOptions &&
            this.missingValuesOptions.excludeCasesListwise
        ) {
            // Listwise deletion: hanya baris di mana semua variabel valid
            // Gabungkan semua variabel menjadi array baris
            const numVars = this.data.length;
            const numRows = this.data[0]?.length || 0;
            this.validData = Array.from({ length: numVars }, () => []);
            for (let row = 0; row < numRows; row++) {
                let isValid = true;
                for (let varIdx = 0; varIdx < numVars; varIdx++) {
                    const currentVar = this.variable[varIdx];
                    const value = this.data[varIdx][row];
                    const isNumericType = ['scale', 'date'].includes(currentVar.measure);
                    if (
                        checkIsMissing(value, currentVar.missing, isNumericType) ||
                        !isNumeric(value)
                    ) {
                        isValid = false;
                        break;
                    }
                }
                if (isValid) {
                    for (let varIdx = 0; varIdx < numVars; varIdx++) {
                        this.validData[varIdx].push(parseFloat(this.data[varIdx][row]));
                    }
                }
            }
        } else {
            // Pairwise deletion (default): filter per variabel
            this.validData = this.data.map((varData, varIndex) => {
                const currentVar = this.variable[varIndex];
                const isNumericType = ['scale', 'date'].includes(currentVar.measure);
                return varData
                    .filter(
                        (value) =>
                            !checkIsMissing(value, currentVar.missing, isNumericType) &&
                            isNumeric(value)
                    )
                    .map((value) => parseFloat(value));
            });
        }

        // Hitung Total N
        this.N = this.validData[0] ? this.validData[0].length : 0;

        this.initialized = true;
    }
    
    getN() { this.#initialize(); return this.N; }
    getValidN() { this.#initialize(); return this.N; }
    
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
    
    getDescriptiveStatistics() {
        if (this.memo.descriptiveStats) return this.memo.descriptiveStats;
        
        this.#initialize();

        const result = this.variable.map((varObj, index) => {
            const varData = this.validData[index];
            const meanValue = this.#mean(varData);
            const stdDevValue = this.#stdDev(varData, meanValue);
            
            return {
                variable: varObj.name,
                Mean: meanValue,
                StdDev: stdDevValue,
                N: varData.length
            };
        });
        
        this.memo.descriptiveStats = result;
        return result;
    }
    
    /**
     * Mendapatkan hasil korelasi pearson
     * @returns {object} Hasil korelasi pearson
     */
    getPearsonCorrelation(variable1, variable2) {  
        if (this.memo[`pearson_${variable1}_${variable2}`]) return this.memo[`pearson_${variable1}_${variable2}`];
        
        this.#initialize();

        const var1Index = this.variable.findIndex(v => v.name === variable1);
        const var2Index = this.variable.findIndex(v => v.name === variable2);
        
        if (var1Index === -1 || var2Index === -1) {
            return null;
        }


        
        const x = this.validData[var1Index];
        const y = this.validData[var2Index];
        
        // Hanya ambil data yang valid di kedua variabel
        const validPairs = [];
        for (let i = 0; i < x.length; i++) {
            if (!isNaN(x[i]) && !isNaN(y[i])) {
                validPairs.push([x[i], y[i]]);
            }
        }
        
        const n = validPairs.length;

        if (n === 0) {
            return {
                Pearson: null,
                PValue: null,
                SumOfSquares: null,
                Covariance: null,
                N: n
            };
        }
        
        if (n === 1) {
            return {
                Pearson: null,
                PValue: null,
                SumOfSquares: 0,
                Covariance: null,
                N: n
            };
        }

        if (this.#stdDev(x, this.#mean(x)) === 0 || this.#stdDev(y, this.#mean(y)) === 0) {
            return {
                Pearson: null,
                PValue: null,
                SumOfSquares: 0,
                Covariance: 0,
                N: n
            };
        }
        
        // Hitung mean
        const xMean = validPairs.reduce((sum, pair) => sum + pair[0], 0) / n;
        const yMean = validPairs.reduce((sum, pair) => sum + pair[1], 0) / n;
        
        // Hitung sum of squares dan covariance
        let sumXY = 0;
        let sumX2 = 0;
        let sumY2 = 0;
        
        for (const [xi, yi] of validPairs) {
            const xDiff = xi - xMean;
            const yDiff = yi - yMean;
            sumXY += xDiff * yDiff;
            sumX2 += xDiff * xDiff;
            sumY2 += yDiff * yDiff;
        }
        
        const covariance = sumXY / (n - 1);
        if (variable1 === variable2) {
            return {
                Pearson: 1,
                PValue: null,
                SumOfSquares: sumXY,
                Covariance: covariance,
                N: this.N
            };
        }
        const pearson = sumXY / Math.sqrt(sumX2 * sumY2);
        
        // Hitung p-value
        let tStat = pearson * Math.sqrt((n - 2) / (1 - pearson * pearson));
        let pValue;
        const df = n - 2;
        if (isNaN(tStat) || !isFinite(tStat)) {
            pValue = null;
        } else {
            const cdf = stdlibstatsBaseDistsTCdf(Math.abs(tStat), df);
            if (this.testOfSignificance.oneTailed) {
                // one-tailed: p = 1 - CDF(|t|)
                pValue = 1 - cdf;
            } else {
                // two-tailed: p = 2 * (1 - CDF(|t|))
                pValue = 2 * (1 - cdf);
            }
            if (pValue > 1) pValue = 1;
        }
        
        const result = {
            Pearson: pearson,
            PValue: pValue,
            SumOfSquares: sumXY,
            Covariance: covariance,
            N: n
        };
        
        this.memo[`pearson_${variable1}_${variable2}`] = result;
        return result;
    }

    /**
     * @private
     * Menghitung faktor koreksi untuk ties dalam sebuah array data.
     * Sesuai dengan formula yang dijelaskan dalam dokumen algoritma SPSS.
     * @param {Array<number>} arr - Array data.
     * @returns {object} Objek berisi faktor koreksi: { tau, tau_prime, tau_double_prime, ST }
     * tau: Σ(t² - t)
     * tau_prime: Σ((t² - t)(t - 2))
     * tau_double_prime: Σ((t² - t)(2t + 5))
     * ST: Σ(t³ - t)
     */
    _calculateTieCorrectionFactors(arr) {
        const counts = {};
        for (const value of arr) {
            counts[value] = (counts[value] || 0) + 1;
        }

        let tau = 0;
        let tau_prime = 0;
        let tau_double_prime = 0;
        let ST = 0;

        for (const count in counts) {
            const t = parseInt(counts[count], 10);
            if (t > 1) {
                const t2_minus_t = t * t - t; // t² - t
                const t3_minus_t = t * t * t - t; // t³ - t

                tau += t2_minus_t;
                tau_prime += t2_minus_t * (t - 2);
                tau_double_prime += t2_minus_t * (2 * t + 5);
                ST += t3_minus_t;
            }
        }
        return { tau, tau_prime, tau_double_prime, ST };
    }
    
    /**
     * Mendapatkan hasil korelasi Kendall's Tau-b menggunakan algoritma SPSS.
     * Rumus ini menggunakan formula varians yang akurat untuk uji signifikansi.
     * @returns {object} Hasil korelasi Kendall's Tau-b
     */
    getKendallsTauBCorrelation(variable1, variable2) {  
        if (this.memo[`kendall_${variable1}_${variable2}`]) return this.memo[`kendall_${variable1}_${variable2}`];
        
        this.#initialize();

        const var1Index = this.variable.findIndex(v => v.name === variable1);
        const var2Index = this.variable.findIndex(v => v.name === variable2);
        
        if (var1Index === -1 || var2Index === -1) return null;
        
        const x_full = this.validData[var1Index];
        const y_full = this.validData[var2Index];
        
        const validPairs = [];
        for (let i = 0; i < this.N; i++) {
            if (isNumeric(x_full[i]) && isNumeric(y_full[i])) {
                validPairs.push([x_full[i], y_full[i]]);
            }
        }
        
        const n = validPairs.length;
        if (n <= 1) {
            return {
                KendallsTauB: null,
                PValue: null,
                N: n
            };
        }

        if (this.#stdDev(x_full, this.#mean(x_full)) === 0 || this.#stdDev(y_full, this.#mean(y_full)) === 0) {
            return {
                KendallsTauB: null,
                PValue: null,
                N: n
            };
        }

        if (variable1 === variable2) {
            return {
                KendallsTauB: 1,
                PValue: null,
                N: this.getValidN()
            };
        }

        // 1. Hitung S (jumlah pasangan konkordan - diskordan)
        let S = 0;
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const product = (validPairs[i][0] - validPairs[j][0]) * (validPairs[i][1] - validPairs[j][1]);
                if (product > 0) S++;
                else if (product < 0) S--;
            }
        }
        
        // 2. Hitung faktor koreksi tie untuk kedua variabel
        const xData = validPairs.map(p => p[0]);
        const yData = validPairs.map(p => p[1]);
        const xTies = this._calculateTieCorrectionFactors(xData);
        const yTies = this._calculateTieCorrectionFactors(yData);

        // 3. Hitung Kendall's Tau-b
        const n_squared_minus_n = n * n - n;
        const denominator_x = (n_squared_minus_n - xTies.tau) / 2;
        const denominator_y = (n_squared_minus_n - yTies.tau) / 2;
        const denominator = Math.sqrt(denominator_x) * Math.sqrt(denominator_y);

        let tauB = (denominator === 0) ? null : S / denominator;

        // 4. Hitung varians (d) dan p-value menggunakan formula SPSS
        let pValue = null;
        if (tauB !== null) {
            const K = n_squared_minus_n;
            if (K > 0 && n > 2) {
                const term1 = (1 / 18) * (K * (2 * n + 5) - xTies.tau_double_prime - yTies.tau_double_prime);
                const term2 = (xTies.tau_prime * yTies.tau_prime) / (9 * K * (n - 2));
                const term3 = (xTies.tau * yTies.tau) / (2 * K);
                const variance_d = term1 + term2 + term3;

                if (variance_d > 0) {
                    const z = S / Math.sqrt(variance_d);
                    const cdf = stdlibstatsBaseDistsNormalCdf(Math.abs(z), 0, 1);
                    pValue = this.testOfSignificance.oneTailed ? (1 - cdf) : (2 * (1 - cdf));
                    if (pValue > 1) pValue = 1;
                }
            }
        }
        
        const result = { KendallsTauB: tauB, PValue: pValue, N: n };
        this.memo[`kendall_${variable1}_${variable2}`] = result;
        return result;
    }

    /**
     * Mendapatkan hasil korelasi Spearman menggunakan algoritma SPSS.
     * Rumus ini secara akurat menangani data dengan nilai yang sama (ties).
     * @returns {object} Hasil korelasi Spearman
     */
    getSpearmanCorrelation(variable1, variable2) {  
        if (this.memo[`spearman_${variable1}_${variable2}`]) return this.memo[`spearman_${variable1}_${variable2}`];
        
        this.#initialize();

        const var1Index = this.variable.findIndex(v => v.name === variable1);
        const var2Index = this.variable.findIndex(v => v.name === variable2);
        
        if (var1Index === -1 || var2Index === -1) return null;

        if (variable1 === variable2) {
            return { Spearman: 1, PValue: null, N: this.getValidN() };
        }
        
        const x_full = this.validData[var1Index];
        const y_full = this.validData[var2Index];
        
        const validPairs = [];
        for (let i = 0; i < this.N; i++) {
            if (isNumeric(x_full[i]) && isNumeric(y_full[i])) {
                validPairs.push({ x: x_full[i], y: y_full[i], originalIndex: i });
            }
        }
        
        const n = validPairs.length;
        if (n <= 1) return { Spearman: null, PValue: null, N: n };
        
        // 1. Hitung ranks untuk x dan y dengan penanganan ties (average rank)
        const getRanks = (data, key) => {
            const sorted = [...data].sort((a, b) => a[key] - b[key]);
            const ranks = new Array(n);
            let i = 0;
            while (i < n) {
                let j = i;
                while (j < n - 1 && sorted[j][key] === sorted[j + 1][key]) {
                    j++;
                }
                const avgRank = (i + 1 + j + 1) / 2;
                for (let k = i; k <= j; k++) {
                    const originalIdx = data.findIndex(p => p.originalIndex === sorted[k].originalIndex);
                    ranks[originalIdx] = avgRank;
                }
                i = j + 1;
            }
            return ranks;
        };

        const xRanks = getRanks(validPairs, 'x');
        const yRanks = getRanks(validPairs, 'y');

        // 2. Hitung jumlah kuadrat selisih (d_i²)
        let sumD2 = 0;
        for (let i = 0; i < n; i++) {
            const d = xRanks[i] - yRanks[i];
            sumD2 += d * d;
        }
        
        // 3. Hitung faktor koreksi tie (STx, STy)
        const xData = validPairs.map(p => p.x);
        const yData = validPairs.map(p => p.y);
        const { ST: STx } = this._calculateTieCorrectionFactors(xData);
        const { ST: STy } = this._calculateTieCorrectionFactors(yData);

        // 4. Hitung Tx dan Ty
        const n_cubed_minus_n = n * n * n - n;
        const Tx = (n_cubed_minus_n - STx) / 12;
        const Ty = (n_cubed_minus_n - STy) / 12;
        
        // 5. Hitung Spearman's Rho (ρs) menggunakan formula SPSS
        let spearman = null;
        if (Tx > 0 && Ty > 0) {
            spearman = (Tx + Ty - sumD2) / (2 * Math.sqrt(Tx * Ty));
        } else if (Tx === 0 && Ty === 0) {
            // Jika tidak ada variasi peringkat di kedua variabel, korelasi bisa dianggap sempurna
            spearman = 1.0;
        }
        
        // 6. Hitung p-value
        let pValue = null;
        if (spearman !== null && Math.abs(spearman) < 1) {
            const df = n - 2;
            if (df > 0) {
                const tStat = spearman * Math.sqrt(df / (1 - spearman * spearman));
                if (isFinite(tStat)) {
                    const cdf = stdlibstatsBaseDistsTCdf(Math.abs(tStat), df);
                    pValue = this.testOfSignificance.oneTailed ? (1 - cdf) : (2 * (1 - cdf));
                    if (pValue > 1) pValue = 1;
                }
            }
        } else if (Math.abs(spearman) === 1) {
            pValue = 0.0; // Korelasi sempurna
        }

        const result = { Spearman: spearman, PValue: pValue, N: n };
        this.memo[`spearman_${variable1}_${variable2}`] = result;
        return result;
    }

    /**
     * Menghitung korelasi parsial berdasarkan korelasi Kendall's Tau-b
     * @param {string} controlVariable - Variabel kontrol
     * @param {string} variable1 - Variabel pertama
     * @param {string} variable2 - Variabel kedua
     * @returns {object} Hasil korelasi parsial
     */
    getPartialCorrelation(controlVariable, variable1, variable2) {
        const key = `partial_${controlVariable}_${variable1}_${variable2}`;
        if (this.memo[key]) return this.memo[key];

        // Hitung korelasi antar variabel
        const r12 = this.getKendallsTauBCorrelation(variable1, variable2);
        const r13 = this.getKendallsTauBCorrelation(variable1, controlVariable);
        const r23 = this.getKendallsTauBCorrelation(variable2, controlVariable);

        if (!r12 || !r13 || !r23) return null;

        // Diagonal case
        if (variable1 === variable2) {
            return {
                PartialCorrelation: {
                    Correlation: 1,
                    PValue: null,
                    df: 0
                }
            };
        }

        // Hitung korelasi parsial
        const r12_3 = (r12.KendallsTauB - (r13.KendallsTauB * r23.KendallsTauB)) / 
                      (Math.sqrt(1 - Math.pow(r13.KendallsTauB, 2)) * Math.sqrt(1 - Math.pow(r23.KendallsTauB, 2)));

        // Hitung p-value untuk korelasi parsial
        const n = r12.N;
        const df = n - 2 - 1; // Degrees of freedom: n - 2 - number of control variables
        
        let pValue = null;
        if (!isNaN(r12_3) && isFinite(r12_3) && df > 0) {
            const tStat = r12_3 * Math.sqrt(df / (1 - r12_3 * r12_3));
            if (isFinite(tStat)) {
                const cdf = stdlibstatsBaseDistsTCdf(Math.abs(tStat), df);
                pValue = this.testOfSignificance.oneTailed ? (1 - cdf) : (2 * (1 - cdf));
                if (pValue > 1) pValue = 1;
            }
        }

        const result = {
            PartialCorrelation: {
                Correlation: r12_3,
                PValue: pValue,
                df: df
            }
        };

        this.memo[key] = result;
        return result;
    }

    /**
     * @private
     * Validates correlation matrix and N values for partial correlation
     * @param {Array} correlationData - The correlation data to validate
     * @returns {object} Validation results
     */
    #validateMatrix(correlationData) {
        const invalidCorrelations = [];
        const invalidNs = [];
        let hasInvalidCorrelations = false;
        let hasInvalidNs = false;

        // Check all correlation values
        for (const corr of correlationData || []) {
            // Check Pearson correlations
            if (corr.pearsonCorrelation && corr.pearsonCorrelation.Pearson !== null) {
                const value = corr.pearsonCorrelation.Pearson;
                if (value < -1 || value > 1) {
                    invalidCorrelations.push({
                        variable1: corr.variable1,
                        variable2: corr.variable2,
                        value: value
                    });
                    hasInvalidCorrelations = true;
                }
            }

            // Check Kendall's Tau-b correlations
            if (corr.kendallsTauBCorrelation && corr.kendallsTauBCorrelation.KendallsTauB !== null) {
                const value = corr.kendallsTauBCorrelation.KendallsTauB;
                if (value < -1 || value > 1) {
                    invalidCorrelations.push({
                        variable1: corr.variable1,
                        variable2: corr.variable2,
                        value: value
                    });
                    hasInvalidCorrelations = true;
                }
            }

            // Check Spearman correlations
            if (corr.spearmanCorrelation && corr.spearmanCorrelation.Spearman !== null) {
                const value = corr.spearmanCorrelation.Spearman;
                if (value < -1 || value > 1) {
                    invalidCorrelations.push({
                        variable1: corr.variable1,
                        variable2: corr.variable2,
                        value: value
                    });
                    hasInvalidCorrelations = true;
                }
            }

            // Check N values
            if (corr.pearsonCorrelation && corr.pearsonCorrelation.N !== null) {
                const n = corr.pearsonCorrelation.N;
                if (n < 1) {
                    invalidNs.push({
                        variable1: corr.variable1,
                        variable2: corr.variable2,
                        value: n
                    });
                    hasInvalidNs = true;
                }
            }

            if (corr.kendallsTauBCorrelation && corr.kendallsTauBCorrelation.N !== null) {
                const n = corr.kendallsTauBCorrelation.N;
                if (n < 1) {
                    invalidNs.push({
                        variable1: corr.variable1,
                        variable2: corr.variable2,
                        value: n
                    });
                    hasInvalidNs = true;
                }
            }

            if (corr.spearmanCorrelation && corr.spearmanCorrelation.N !== null) {
                const n = corr.spearmanCorrelation.N;
                if (n < 1) {
                    invalidNs.push({
                        variable1: corr.variable1,
                        variable2: corr.variable2,
                        value: n
                    });
                    hasInvalidNs = true;
                }
            }
        }

        return {
            hasInvalidCorrelations,
            hasInvalidNs,
            invalidCorrelations,
            invalidNs
        };
    }

    /**
     * Mengambil semua hasil statistik.
     * @returns {Object} Objek hasil yang berisi statistik sampel dan hasil uji.
     */
    getOutput() {
        let descriptiveStatistics = null;
        let correlation = [];
        let partialCorrelation = [];

        if (this.correlationCoefficient.pearson && this.statisticsOptions.meansAndStandardDeviations) {
            descriptiveStatistics = this.getDescriptiveStatistics();
        }

        // Prepare maps for each correlation type
        const pearsonMap = {};
        const kendallsTauBMap = {};
        const spearmanMap = {};

        const metadata = [];
        for (let i = 0; i < this.variable.length; i++) {
            const variable = this.variable[i];
            const varData = this.data[i] || [];
            const insufficientType = [];
            let hasInsufficientData = false;
            
            // Check if variable has no data or all values are null/undefined
            const validValues = varData.filter(val => val !== null && val !== undefined);
            if (varData.length === 0 || validValues.length === 0) {
                hasInsufficientData = true;
                insufficientType.push('empty');
            }
            
            // Check if variable has only one case
            if (varData.length === 1 || validValues.length === 1) {
                hasInsufficientData = true;
                insufficientType.push('single');
            }
            
            // Check if variable has insufficient data for correlation (less than 3 cases)
            // Cek jika standard deviation = 0 atau null, atau data kurang dari 3 (untuk korelasi)
            let stdDevValue = null;
            const descriptiveStats = this.getDescriptiveStatistics();
            if (descriptiveStats) {
                const varStats = descriptiveStats.find(stat => stat.variable === variable.name);
                if (varStats) {
                    stdDevValue = varStats.StdDev;
                }
            }
            if (stdDevValue === 0 || stdDevValue === null || stdDevValue === undefined) {
                hasInsufficientData = true;
                insufficientType.push('stdDev');
            }
            
            metadata.push({
                hasInsufficientData,
                insufficientType,
                variableLabel: variable.label || '',
                variableName: variable.name,
                totalData: varData.length,
                validData: validValues.length
            });
        }

        // Pearson
        if (this.correlationCoefficient.pearson) {
            for (let i = 0; i < this.variable.length; i++) {
                for (let j = i; j < this.variable.length; j++) {
                    if (this.showOnlyTheLowerTriangle && !this.showDiagonal && i === j) continue;

                    const v1 = this.variable[i].name;
                    const v2 = this.variable[j].name;
                    const result = this.getPearsonCorrelation(v1, v2);
                    const key = `${v1}|||${v2}`;
                    pearsonMap[key] = result;
                }
            }
        }

        // Kendall's Tau-b
        if (this.correlationCoefficient.kendallsTauB) {
            for (let i = 0; i < this.variable.length; i++) {
                for (let j = i; j < this.variable.length; j++) {
                    if (this.showOnlyTheLowerTriangle && !this.showDiagonal && i === j) continue;

                    const v1 = this.variable[i].name;
                    const v2 = this.variable[j].name;
                    const result = this.getKendallsTauBCorrelation(v1, v2);
                    const key = `${v1}|||${v2}`;
                    kendallsTauBMap[key] = result;
                }
            }
        }

        // Spearman
        if (this.correlationCoefficient.spearman) {
            for (let i = 0; i < this.variable.length; i++) {
                for (let j = i; j < this.variable.length; j++) {
                    if (this.showOnlyTheLowerTriangle && !this.showDiagonal && i === j) continue;

                    const v1 = this.variable[i].name;
                    const v2 = this.variable[j].name;
                    const result = this.getSpearmanCorrelation(v1, v2);
                    const key = `${v1}|||${v2}`;
                    spearmanMap[key] = result;
                }
            }
        }

        // Partial Correlation
        if (this.correlationCoefficient.kendallsTauB && this.partialCorrelationKendallsTauB && this.missingValuesOptions.excludeCasesListwise && this.variable.length > 2) {
            // Untuk setiap variabel sebagai controlVar, lakukan partial correlation pada kombinasi dua variabel lain
            // Misal: var1, var2, var3 -> controlVar: var1, pair: var2-var3; controlVar: var2, pair: var1-var3; dst.
            const allVars = this.variable.map(v => v.name);
            // Jika controlVariables diberikan, gunakan itu, jika tidak, gunakan semua variabel
            const controlVars = (this.controlVariables && this.controlVariables.length > 0)
                ? this.controlVariables.map(v => v.name)
                : allVars;

            for (const controlVar of controlVars) {
                // Ambil variabel lain selain controlVar
                const otherVars = allVars.filter(v => v !== controlVar);
                // Untuk semua pasangan unik dari otherVars
                for (let i = 0; i < otherVars.length; i++) {
                    for (let j = i + 1; j < otherVars.length; j++) {
                        const v1 = otherVars[i];
                        const v2 = otherVars[j];
                        const result = this.getPartialCorrelation(controlVar, v1, v2);
                        if (result) {
                            partialCorrelation.push({
                                controlVariable: controlVar,
                                variable1: v1,
                                variable2: v2,
                                partialCorrelation: result.PartialCorrelation
                            });
                        }
                    }
                }
            }
        }

        // Compose combined correlation array
        for (let i = 0; i < this.variable.length; i++) {
            for (let j = i; j < this.variable.length; j++) {
                if (this.showOnlyTheLowerTriangle && !this.showDiagonal && i === j) continue;

                const v1 = this.variable[i].name;
                const v2 = this.variable[j].name;
                const key = `${v1}|||${v2}`;

                const entry = {
                    variable1: v1,
                    variable2: v2
                };
                entry.pearsonCorrelation = pearsonMap[key];
                entry.kendallsTauBCorrelation = kendallsTauBMap[key];
                entry.spearmanCorrelation = spearmanMap[key];
                correlation.push(entry);
            }
        }

        // Validate matrix for partial correlation - now with the populated correlation data
        const matrixValidation = this.#validateMatrix(correlation);

        return {
            descriptiveStatistics,
            correlation,
            partialCorrelation,
            matrixValidation,
            metadata
        };
    }
}

globalThis.BivariateCalculator = BivariateCalculator;
export default BivariateCalculator;