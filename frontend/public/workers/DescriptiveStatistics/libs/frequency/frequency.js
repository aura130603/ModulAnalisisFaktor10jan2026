// Dynamically load utility and descriptive scripts if running as a worker,
// but not when testing in a Node.js environment.
if (typeof self !== 'undefined' && typeof self.importScripts === 'function') {
    // Load dependencies only if they haven't been loaded yet.
    if (typeof isNumeric === 'undefined') {
        importScripts('../utils/utils.js');
    }
    if (typeof DescriptiveCalculator === 'undefined') {
        importScripts('./descriptive.js');
    }
}

class FrequencyCalculator {
    constructor({ variable, data, weights = null, caseNumbers = null, options = {} }) {
        this.variable = variable;
        this.data = data;
        this.weights = weights;
        this.caseNumbers = caseNumbers;
        this.options = options || {};

        // Use effective measurement and core type (from descriptive.js helpers)
        // - effective measure maps 'unknown' based on type: numeric/date -> scale, string -> nominal
        // - numeric-like measures: scale and ordinal (treated numerically for distribution/percentiles)
        this.effMeasure = typeof getEffectiveMeasure === 'function' ? getEffectiveMeasure(this.variable) : (this.variable.measure || 'unknown');
        this.coreType = typeof getCoreType === 'function' ? getCoreType(this.variable) : 'numeric';
        this.isNumeric = this.effMeasure === 'scale' || this.effMeasure === 'ordinal';
        this.memo = {};

        if (this.isNumeric) {
            this.descCalc = new DescriptiveCalculator({ variable, data, weights, options });
        }
    }

    #getDistribution() {
        if (this.memo.distribution) return this.memo.distribution;

        const weightedValues = new Map();
        let validWeight = 0;        // Sum of weights for valid (non-missing) cases
        let totalWeightAll = 0;     // Sum of weights for all cases with valid weight (> 0), including missing
        let validN = 0;             // Count of valid cases (unweighted)

        for (let i = 0; i < this.data.length; i++) {
            const raw = this.data[i];
            const weight = this.weights ? (this.weights[i] ?? 1) : 1;
            if (typeof weight !== 'number' || !isFinite(weight) || weight <= 0) {
                continue; // Ignore non-positive or invalid weights entirely
            }

            // T (total) denominator includes all cases with valid weight
            totalWeightAll += weight;

            let processedValue;
            if (this.isNumeric) {
                // Numeric-like: coerce to number; support dd-mm-yyyy -> SPSS seconds
                if (typeof raw === 'string' && isDateString(raw)) {
                    processedValue = dateStringToSpssSeconds(raw);
                } else if (isNumeric(raw)) {
                    processedValue = parseFloat(raw);
                } else {
                    continue; // Skip non-numeric for numeric-like variables
                }
                if (processedValue === null || checkIsMissing(processedValue, this.variable.missing, true)) {
                    continue;
                }
            } else {
                // Nominal/string-like: keep as trimmed string
                if (raw === null || raw === undefined) continue;
                const s = String(raw).trim();
                if (s === '' || checkIsMissing(s, this.variable.missing, false)) continue;
                processedValue = s;
            }

            weightedValues.set(processedValue, (weightedValues.get(processedValue) || 0) + weight);
            validWeight += weight;
            validN++;
        }

        if (weightedValues.size === 0) {
            // Return an empty distribution with computed total weight so that callers
            // can still build summaries (avoids null handling and worker errors)
            const distribution = { y: [], c: [], cc: [], W: 0, N: 0, T: totalWeightAll };
            this.memo.distribution = distribution;
            return distribution;
        }

        const sortedUniqueValues = this.isNumeric
            ? Array.from(weightedValues.keys()).sort((a, b) => a - b)
            : Array.from(weightedValues.keys()).sort();

        const y = sortedUniqueValues;
        const c = y.map(val => weightedValues.get(val));
        const cc = c.reduce((acc, val) => {
            acc.push((acc.length > 0 ? acc[acc.length - 1] : 0) + val);
            return acc;
        }, []);

        const distribution = { y, c, cc, W: validWeight, N: validN, T: totalWeightAll };
        this.memo.distribution = distribution;
        return distribution;
    }

    getMode() {
        if (this.memo.mode) return this.memo.mode;

        const distribution = this.#getDistribution();
        if (!distribution) {
            this.memo.mode = null;
            return null;
        }

        const { y, c } = distribution;
        const maxFreq = Math.max(...c);
        let modes = y.filter((_, index) => c[index] === maxFreq);

        // If core type is date, convert numeric seconds back to dd-mm-yyyy for display
        if (this.coreType === 'date') {
            modes = modes.map(value => spssSecondsToDateString(value) || value);
        }

        this.memo.mode = modes;
        return this.memo.mode;
    }

    getExtremeValues(extremeCount = 5) {
        if (!this.isNumeric) return null;

        const entries = [];
        for (let i = 0; i < this.data.length; i++) {
            const val = this.data[i];
            const weight = this.weights ? (this.weights[i] ?? 1) : 1;
            if (!isNumeric(val) || typeof weight !== 'number' || weight <= 0) continue;

            const caseNumber = this.caseNumbers && this.caseNumbers[i] ? this.caseNumbers[i] : i + 1;
            entries.push({ caseNumber, value: parseFloat(val) });
        }

        if (entries.length === 0) return null;

        const q1 = this.getPercentile(25, 'waverage');
        const q3 = this.getPercentile(75, 'waverage');
        if (q1 === null || q3 === null) return null;
        const iqr = q3 - q1;

        if (iqr === 0) {
            const sortedAsc = [...entries].sort((a, b) => a.value - b.value);
            const sortedDesc = [...entries].sort((a, b) => b.value - a.value);
            return buildExtremeValueObject(sortedAsc, sortedDesc, extremeCount);
        }

        const step = 1.5 * iqr;
        const lowerInner = q1 - step;
        const upperInner = q3 + step;
        const lowerOuter = q1 - (2 * step);
        const upperOuter = q3 + (2 * step);

        const isHighExtreme = (v) => v > upperOuter;
        const isLowExtreme = (v) => v < lowerOuter;
        const isHighOutlier = (v) => v > upperInner && v <= upperOuter;
        const isLowOutlier = (v) => v < lowerInner && v >= lowerOuter;

        const sortedAsc = [...entries].sort((a, b) => a.value - b.value);
        const sortedDesc = [...entries].sort((a, b) => b.value - a.value);

        function pickCandidates(source, predicate) {
            const arr = [];
            for (const item of source) {
                if (predicate(item.value)) {
                    arr.push(item);
                    if (arr.length === extremeCount) break;
                }
            }
            return arr;
        }

        let highest = pickCandidates(sortedDesc, isHighExtreme);
        if (highest.length < extremeCount) {
            const additional = pickCandidates(sortedDesc, isHighOutlier);
            highest.push(...additional.slice(0, extremeCount - highest.length));
        }

        let lowest = pickCandidates(sortedAsc, isLowExtreme);
        if (lowest.length < extremeCount) {
            const additional = pickCandidates(sortedAsc, isLowOutlier);
            lowest.push(...additional.slice(0, extremeCount - lowest.length));
        }

        const fillByValue = (list, source) => {
            const existingCaseNumbers = new Set(list.map(item => item.caseNumber));
            if (list.length >= extremeCount) return list;

            for (const item of source) {
                if (!existingCaseNumbers.has(item.caseNumber)) {
                    list.push(item);
                    if (list.length === extremeCount) break;
                }
            }
            return list;
        };

        lowest = fillByValue(lowest, sortedAsc);
        highest = fillByValue(highest, sortedDesc);

        const checkPartial = (sourceArray, fullSorted, direction) => {
            if (sourceArray.length === 0) return;
            const lastIncluded = sourceArray[sourceArray.length - 1];
            const lastValue = lastIncluded.value;
            const indexInFull = fullSorted.findIndex(e => e.caseNumber === lastIncluded.caseNumber);
            const nextIndex = indexInFull + 1;
            if (nextIndex < fullSorted.length && fullSorted[nextIndex].value === lastValue) {
                lastIncluded.isPartial = true;
            }
        };

        checkPartial(lowest, sortedAsc, 'lowest');
        checkPartial(highest, sortedDesc, 'highest');

        const isOutlier = (v) => (v < lowerInner && v >= lowerOuter) || (v > upperInner && v <= upperOuter);
        const isExtreme = (v) => v < lowerOuter || v > upperOuter;

        const tagType = (arr) => arr.map(item => ({ ...item, type: isExtreme(item.value) ? 'extreme' : (isOutlier(item.value) ? 'outlier' : 'normal') }));

        return {
            highest: tagType(highest),
            lowest: tagType(lowest),
            isTruncated: extremeCount > entries.length,
            fences: {
                lowerInner,
                upperInner,
                lowerOuter,
                upperOuter,
            },
        };

        function buildExtremeValueObject(sortedAsc, sortedDesc, count) {
            const lo = sortedAsc.slice(0, count);
            const hi = sortedDesc.slice(0, count);
            return {
                highest: hi,
                lowest: lo,
                isTruncated: count > entries.length
            };
        }
    }

    getStatistics() {
        if (this.memo.statistics) return this.memo.statistics;

        const distribution = this.#getDistribution();
        if (!distribution) return null;

        const { y, c, cc, W, N, T } = distribution;

        const totalDenom = (typeof T === 'number' && T > 0) ? T : W; // fallback
        const frequencyTable = y.map((value, index) => {
            const freq = c[index];
            const percent = totalDenom > 0 ? (freq / totalDenom) * 100 : 0;
            const validPercent = W > 0 ? (freq / W) * 100 : 0;
            const cumulativePercent = W > 0 ? (cc[index] / W) * 100 : 0;
            let displayValue = value;
            if (this.coreType === 'date' && typeof value === 'number') {
                displayValue = spssSecondsToDateString(value) || value;
            }
            return {
                value: displayValue,
                frequency: freq,
                percent: percent,
                validPercent: validPercent,
                cumulativePercent: cumulativePercent,
            };
        });

        // Summary uses weighted totals for consistency with row frequencies
        const totalWeighted = typeof T === 'number' ? T : W;
        const missingWeighted = totalWeighted - W;

        // Build statistics based on effective measurement level
        let stats = {};

        switch (this.effMeasure) {
            case 'scale':
            case 'ordinal': {
                if (this.descCalc && typeof this.descCalc.getStatistics === 'function') {
                    const descStats = this.descCalc.getStatistics();
                    if (descStats && descStats.stats) {
                        stats = { ...descStats.stats };
                    }
                }
                break;
            }
            case 'nominal':
            default: {
                // Minimal stats for nominal (use weighted totals)
                stats = {
                    N: W,
                    Missing: missingWeighted,
                };
                break;
            }
        }

        // Align N and Missing with weighted totals for all measures
        stats.N = W;
        stats.Missing = missingWeighted;

        // Always set Mode from our method (ensures date modes are formatted as dd-mm-yyyy)
        stats.Mode = this.getMode();

        const results = {
            summary: {
                valid: W,
                missing: missingWeighted,
                total: totalWeighted,
            },
            stats,
            frequencyTable,
        };

        this.memo.statistics = results;
        return results;
    }

    getPercentile(p, method) {
        if (!this.isNumeric) return null; 
        const sortedData = this.#getDistribution();
        if (!sortedData) return null;

        const { y, c, cc, W } = sortedData;

        const methodKey = (method || 'waverage').toLowerCase();

        switch (methodKey) {
            case 'tukeyhinges': { // Tukey's Hinges for quartiles only (25, 50, 75)
                if (W === 0) return null;
                const target = Math.round(p);
                if (target !== 25 && target !== 50 && target !== 75) {
                    // Fallback for non-quartiles
                    return this.getPercentile(p, 'waverage');
                }

                // Build expanded positions using rounded weights approximation
                // to derive Tukey hinges positions.
                const positions = [];
                let Wapprox = 0;
                for (let i = 0; i < y.length; i++) {
                    const count = Math.max(1, Math.round(c[i]));
                    for (let k = 0; k < count; k++) positions.push(y[i]);
                    Wapprox += count;
                }
                if (Wapprox === 0) return null;

                const depthMedian = (Wapprox + 1) / 2;
                const depthHinge = (Math.floor(depthMedian) + 1) / 2;
                const lowerIndex = Math.max(1, Math.round(depthHinge));
                const upperIndex = Wapprox - lowerIndex + 1;

                const Q1 = positions[lowerIndex - 1];
                const Q3 = positions[upperIndex - 1];
                let Q2;
                if (Wapprox % 2 === 1) {
                    Q2 = positions[(Wapprox + 1) / 2 - 1];
                } else {
                    const a = positions[Wapprox / 2 - 1];
                    const b = positions[Wapprox / 2];
                    Q2 = (isFinite(a) && isFinite(b)) ? (a + b) / 2 : b;
                }

                if (target === 25) return Q1;
                if (target === 50) return Q2;
                return Q3; // 75
            }
            case 'waverage': { // Weighted Average (SPSS Definition 1)
                if (W === 0) return null;

                const tc1 = W * p / 100;
                
                if (tc1 <= 0) return y[0];
                if (tc1 >= W) return y[y.length - 1];
                
                let k1 = -1;
                for (let i = 0; i < cc.length; i++) {
                    if (cc[i] >= tc1) {
                        k1 = i;
                        break;
                    }
                }
                
                if (k1 === -1) return y[y.length - 1];
                
                const cc_prev = k1 > 0 ? cc[k1 - 1] : 0;
                const w_k = c[k1];
                const y_prev = k1 > 0 ? y[k1 - 1] : y[0];
                const y_k = y[k1];

                if (w_k === 0) return y_k; // Avoid division by zero

                const g = (tc1 - cc_prev) / w_k;
                return (1 - g) * y_prev + g * y_k;
            }
            case 'haverage': { // HAVERAGE / AFREQUENCIES (SPSS classic)
                if (W === 0) return null;

                const r = (W + 1) * p / 100; // target order position in expanded data

                if (r <= 1) return y[0];
                if (r >= W) return y[y.length - 1];

                const lowerPos = Math.floor(r);
                const upperPos = Math.ceil(r);

                let cumulative = 0;
                let lowerValue;
                let upperValue;

                for (let i = 0; i < y.length; i++) {
                    cumulative += c[i];
                    if (lowerValue === undefined && cumulative >= lowerPos) {
                        lowerValue = y[i];
                    }
                    if (cumulative >= upperPos) {
                        upperValue = y[i];
                        break;
                    }
                }

                // Safety fallbacks
                if (lowerValue === undefined) lowerValue = y[0];
                if (upperValue === undefined) upperValue = y[y.length - 1];

                const frac = r - lowerPos; // fractional part in [0,1)
                if (!isFinite(lowerValue) || !isFinite(upperValue)) return upperValue;
                return (1 - frac) * lowerValue + frac * upperValue;
            }
            default:
                return null;
        }
    }
}

if (typeof self !== 'undefined') {
    self.FrequencyCalculator = FrequencyCalculator;
}