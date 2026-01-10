// importScripts('../utils/utils.js'); // Commented out for tests - utils.js loaded separately

function roundToDecimals(number, decimals) {
    if (typeof number !== 'number' || isNaN(number) || !isFinite(number)) return number;
    return parseFloat(number.toFixed(decimals));
}

// Helper constants and functions for type/measurement handling
const SPSS_DATE_TYPES = new Set([
    'DATE', 'ADATE', 'EDATE', 'SDATE', 'JDATE', 'QYR', 'MOYR', 'WKYR', 'DATETIME', 'TIME', 'DTIME'
]);

function getCoreType(variable) {
    const t = variable && variable.type;
    if (t === 'STRING') return 'string';
    if (SPSS_DATE_TYPES.has(t)) return 'date';
    return 'numeric';
}

function getEffectiveMeasure(variable) {
    const m = (variable && variable.measure) ? variable.measure : 'unknown';
    if (m !== 'unknown') return m;
    const core = getCoreType(variable);
    // Unknown mapping rules:
    // - numeric -> scale
    // - string  -> nominal
    // - date    -> scale
    if (core === 'string') return 'nominal';
    return 'scale';
}

// Coerce raw value to numeric according to the variable core type
function toNumeric(value, coreType) {
    if (value === null || value === undefined || value === '') return null;
    // If it's a dd-mm-yyyy string, always convert to SPSS seconds
    if (typeof value === 'string' && isDateString(value)) {
        const secs = dateStringToSpssSeconds(value);
        return (typeof secs === 'number' && isFinite(secs)) ? secs : null;
    }
    // If already a finite number, use it as-is (covers date already-in-seconds too)
    if (typeof value === 'number' && isFinite(value)) return value;
    // Fallback numeric coercion for other strings
    const num = Number(value);
    return (typeof num === 'number' && isFinite(num)) ? num : null;
}

class DescriptiveCalculator {
    
    constructor({ variable, data, weights = null, options = {} }) {
        this.variable = variable;
        this.data = data;
        this.weights = weights;
        this.options = options || {}; 
        this.initialized = false;
        
        this.W = 0;
        this.W2 = 0;
        this.M1 = 0;
        this.M2 = 0;
        this.M3 = 0;
        this.M4 = 0;
        this.S = 0;
        this.min = Infinity;
        this.max = -Infinity;
        this.N = 0; 
        
        this.memo = {};
    }

    
    #initialize() {
        if (this.initialized) return;
        const effMeasure = getEffectiveMeasure(this.variable);
        const coreType = getCoreType(this.variable);
        const isScale = effMeasure === 'scale';
        
        this.W = 0;
        this.S = 0;
        this.N = 0;
        this.min = Infinity;
        this.max = -Infinity;
        
        const validData = [];

        for (let i = 0; i < this.data.length; i++) {
            const value = this.data[i];
            const weight = this.weights ? (this.weights[i] ?? 1) : 1;
            if (typeof weight !== 'number' || weight <= 0) {
                continue;
            }
            // Only initialize for scale-like variables. Others won't call initialize-based stats.
            if (!isScale) {
                continue;
            }
            // Coerce to numeric (including date strings -> SPSS seconds)
            const x = toNumeric(value, coreType);
            if (x === null || checkIsMissing(x, this.variable.missing, true)) {
                continue;
            }
            const w = weight;

            this.W += w;
            this.S += x * w;
            this.N++;
            this.min = Math.min(this.min, x);
            this.max = Math.max(this.max, x);
            validData.push({ value: x, weight: w });
        }

        if (this.W > 0) {
            this.M1 = this.S / this.W; 
        } else {
            this.M1 = null;
        }


        this.M2 = 0;
        this.M3 = 0;
        this.M4 = 0;
        this.W2 = 0;

        if (this.M1 !== null) {
            for (const item of validData) {
                const delta = item.value - this.M1;
                this.M2 += item.weight * Math.pow(delta, 2);
                this.M3 += item.weight * Math.pow(delta, 3);
                this.M4 += item.weight * Math.pow(delta, 4);
                this.W2 += item.weight * item.weight;
            }
        }
        
        this.initialized = true;
    }
    
    getN() { this.#initialize(); return this.data.length; }
    getValidN() { this.#initialize(); return this.W; } 
    getSum() { this.#initialize(); return this.N > 0 ? this.S : null; }
    getMean() { this.#initialize(); return this.N > 0 ? this.M1 : null; }
    getMin() { this.#initialize(); return this.N > 0 ? this.min : null; }
    getMax() { this.#initialize(); return this.N > 0 ? this.max : null; }
    getRange() { this.#initialize(); return this.N > 0 ? this.max - this.min : null; }

    getVariance() {
        if (this.memo.variance) return this.memo.variance;
        this.#initialize();
        if (this.W <= 1) return null;
        
        const denominator = this.W - 1;
        if (denominator <= 0) return null;

        this.memo.variance = this.M2 / denominator;
        return this.memo.variance;
    }

    getStdDev() {
        if (this.memo.stdDev) return this.memo.stdDev;
        const variance = this.getVariance();
        this.memo.stdDev = variance !== null ? Math.sqrt(variance) : null;
        return this.memo.stdDev;
    }

    getStdErrOfMean() {
        if (this.memo.seMean) return this.memo.seMean;
        const stdDev = this.getStdDev();
        this.#initialize();
        if (stdDev === null || this.W <= 0) return null;
        this.memo.seMean = stdDev / Math.sqrt(this.W);
        return this.memo.seMean;
    }

    getSkewness() {
        if (this.memo.skewness) return this.memo.skewness;
        const variance = this.getVariance();
        this.#initialize();
        if (variance === null || variance === 0 || this.W < 3) return null;
        
        const n = this.W;
        const numerator = (n * this.M3);
        const denominator = ((n - 1) * (n - 2) * Math.pow(this.getStdDev(), 3));

        if (denominator === 0) return null;

        const g1 = numerator / denominator;
        this.memo.skewness = g1;
        return g1;
    }

    getSEofSkewness() {
        this.#initialize();
        const n = this.W;
        if (n < 3) return null;
        return Math.sqrt((6 * n * (n - 1)) / ((n - 2) * (n + 1) * (n + 3)));
    }

    getKurtosis() {
        if (this.memo.kurtosis) return this.memo.kurtosis;
        const variance = this.getVariance();
        this.#initialize();
        if (variance === null || variance === 0 || this.W < 4) return null;

        const W = this.W;
        const W2 = this.W2;
        const M2 = this.M2;
        const M4 = this.M4;
        const S = this.getStdDev();

        // Adjusted to align with SPSS-style bias-corrected excess kurtosis
        // g2 numerator uses W * (W + 1) * M4 (previously had an extra W factor)
        const term1 = (W + 1) * W * M4;
        const term2 = 3 * M2 * M2 * (W - 1);
        const numerator = term1 - term2;

        const term3 = (W - 1) * (W - 2) * (W - 3);
        const denominator = term3 * Math.pow(S, 4);

        if (denominator === 0) return null;

        const g2 = numerator / denominator;
        this.memo.kurtosis = g2;
        return g2;
    }

    getSEofKurtosis() {
        this.#initialize();
        const W = this.W;
        if (W < 4) return null;
        const seSkew = this.getSEofSkewness();
        if (seSkew === null) return null;

        const numerator = 4 * (W * W - 1) * seSkew * seSkew;
        const denominator = (W - 3) * (W + 5);

        if (denominator === 0) return null;

        return Math.sqrt(numerator / denominator);
    }

    #getDistribution() {
        if (this.memo.distribution) return this.memo.distribution;

        const weightedValues = new Map();
        let totalWeight = 0;
        let validN = 0;
        const effMeasure = getEffectiveMeasure(this.variable);
        const coreType = getCoreType(this.variable);
        const isNumericMeasure = (effMeasure === 'scale' || effMeasure === 'ordinal');

        for (let i = 0; i < this.data.length; i++) {
            const value = this.data[i];
            const weight = this.weights ? (this.weights[i] ?? 1) : 1;
            if (typeof weight !== 'number' || weight <= 0) continue;
            let processedValue;
            if (isNumericMeasure) {
                const x = toNumeric(value, coreType);
                if (x === null || checkIsMissing(x, this.variable.missing, true)) continue;
                processedValue = x;
            } else {
                if (value === null || value === undefined) continue;
                const s = String(value).trim();
                if (s === '' || checkIsMissing(s, this.variable.missing, false)) continue;
                processedValue = s;
            }

            weightedValues.set(processedValue, (weightedValues.get(processedValue) || 0) + weight);
            totalWeight += weight;
            validN++;
        }

        const sortedKeys = isNumericMeasure
            ? Array.from(weightedValues.keys()).sort((a, b) => a - b)
            : Array.from(weightedValues.keys()).sort();

        const y = sortedKeys;
        const c = y.map(val => weightedValues.get(val));
        const cc = c.reduce((acc, val) => {
            acc.push((acc.length > 0 ? acc[acc.length - 1] : 0) + val);
            return acc;
        }, []);

        const distribution = { y, c, cc, W: totalWeight, N: validN };
        this.memo.distribution = distribution;
        return distribution;
    }

    #getMode() {
        if (this.memo.mode) return this.memo.mode;
        const { y, c } = this.#getDistribution();
        if (y.length === 0) return { mode: null, freq: 0 };

        const maxFreq = Math.max(...c);
        const modes = y.filter((_, index) => c[index] === maxFreq);
        this.memo.mode = { mode: modes, freq: maxFreq };
        return this.memo.mode;
    }

    #getPercentile(p) {
        const { y, c, cc, W } = this.#getDistribution();
        if (W === 0) return null;

        const tp = (W + 1) * p / 100;
        const i = cc.findIndex(cumulativeWeight => cumulativeWeight >= tp);

        if (i === -1) return y[y.length - 1];
        if (i === 0) return y[0];

        const x1 = y[i - 1];
        const x2 = y[i];
        const cc1 = cc[i - 1];

        if (!isFinite(x1) || !isFinite(x2)) return x2; // Handle non-numeric interpolation

        const weight = (tp - cc1);
        return (1 - weight) * x1 + weight * x2;
    }

    #getNominalStats() {
        const { W } = this.#getDistribution();
        const { mode } = this.#getMode();
        return {
            stats: {
                N: this.data.length,
                Valid: W,
                Missing: this.data.length - W,
                Mode: mode,
            },
            zScores: null,
        };
    }

    #getOrdinalStats() {
        const { W } = this.#getDistribution();
        const { mode } = this.#getMode();
        const p25 = this.#getPercentile(25);
        const p75 = this.#getPercentile(75);
        const median = this.#getPercentile(50);
        const iqr = (p75 !== null && p25 !== null) ? (p75 - p25) : null;
        return {
            stats: {
                N: this.data.length,
                Valid: W,
                Missing: this.data.length - W,
                Mode: mode,
                Median: median,
                '25th Percentile': p25,
                '75th Percentile': p75,
                IQR: iqr,
                Percentiles: { '25': p25, '75': p75 },
            },
            zScores: null,
        };
    }

    #getScaleStats() {
        this.#initialize();
        const p25 = this.#getPercentile(25);
        const p75 = this.#getPercentile(75);
        const median = this.#getPercentile(50);
        const iqr = (p75 !== null && p25 !== null) ? (p75 - p25) : null;
        const stats = {
            N: this.data.length,
            Valid: this.W,
            Missing: this.data.length - this.W,
            Mean: this.getMean(),
            Sum: this.getSum(),
            StdDev: this.getStdDev(),
            Variance: this.getVariance(),
            SEMean: this.getStdErrOfMean(),
            Minimum: this.getMin(),
            Maximum: this.getMax(),
            Range: this.getRange(),
            IQR: iqr,
            Skewness: this.getSkewness(),
            SESkewness: this.getSEofSkewness(),
            Kurtosis: this.getKurtosis(),
            SEKurtosis: this.getSEofKurtosis(),
            Median: median,
            '25th Percentile': p25,
            '75th Percentile': p75,
            Percentiles: { '25': p25, '75': p75 },
        };

        const shouldSaveZScores = this.options.saveStandardized && stats.StdDev && stats.StdDev > 0;
        let zScores = null;

        if (shouldSaveZScores) {
            const coreType = getCoreType(this.variable);
            zScores = this.data.map(value => {
                const x = toNumeric(value, coreType);
                if (x === null || checkIsMissing(x, this.variable.missing, true)) {
                    return "";
                }
                return (x - stats.Mean) / stats.StdDev;
            });
        }

        return {
            variable: this.variable,
            stats: stats,
            zScores: zScores,
        };
    }

    getStatistics() {
        const eff = getEffectiveMeasure(this.variable);
        switch (eff) {
            case 'nominal':
                return this.#getNominalStats();
            case 'ordinal':
                return this.#getOrdinalStats();
            case 'scale':
                return this.#getScaleStats();
            default:
                throw new Error(`Unknown measurement level: ${eff}`);
        }
    }
}

if (typeof self !== 'undefined' && typeof self.importScripts === 'function') {
    if (typeof checkIsMissing === 'undefined') {
        importScripts('../utils/utils.js');
    }
}

if (typeof self !== 'undefined') {
    self.DescriptiveCalculator = DescriptiveCalculator;
}

// Ensure helper functions are accessible globally in non-worker test environments
// where scripts are evaluated via Function wrappers.
if (typeof globalThis !== 'undefined') {
    // Attach helpers so other libs (e.g., frequency.js) can detect and use them
    globalThis.getCoreType = typeof getCoreType === 'function' ? getCoreType : globalThis.getCoreType;
    globalThis.getEffectiveMeasure = typeof getEffectiveMeasure === 'function' ? getEffectiveMeasure : globalThis.getEffectiveMeasure;
    globalThis.toNumeric = typeof toNumeric === 'function' ? toNumeric : globalThis.toNumeric;
}