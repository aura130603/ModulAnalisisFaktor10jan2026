if (typeof self !== 'undefined' && typeof self.importScripts === 'function') {
    if (typeof isNumeric === 'undefined') { 
        importScripts('../utils/utils.js');
    }
}

class CrosstabsCalculator {
    constructor({ variable, data, weights, options }) {
        if (!variable || !variable.row || !variable.col) {
            throw new Error("Definisi variabel baris dan kolom diperlukan.");
        }
        this.rowVar = variable.row;
        this.colVar = variable.col;
        this.data = data;
        this.weights = weights;
        this.options = options || {};

        this.initialized = false;
        this.memo = {};

        this.table = []; 
        this.rowTotals = []; 
        this.colTotals = []; 
        this.rowCategories = []; 
        this.colCategories = []; 
        this.W = 0; 
        this.validWeight = 0; 
        this.missingWeight = 0; 
        this.R = 0; 
        this.C = 0;

        // Periksa apakah data baris atau kolom mengandung tanggal dd-mm-yyyy
        const rowData = this.data.map(d => d[this.rowVar.name]);
        const colData = this.data.map(d => d[this.colVar.name]);
        
        this.isRowDateData = rowData.some(value => 
            typeof value === 'string' && isDateString(value)
        );
        this.isColDateData = colData.some(value => 
            typeof value === 'string' && isDateString(value)
        );
    }

    #initialize() {
        if (this.initialized) return;

        const rowData = this.data.map(d => d[this.rowVar.name]);
        const colData = this.data.map(d => d[this.colVar.name]);

        const rowCatSet = new Set();
        const colCatSet = new Set();
        
        for (let i = 0; i < this.data.length; i++) {
            const rawWeight = this.weights ? (this.weights[i] ?? 1) : 1;
            const weight = this.#adjustCaseWeight(rawWeight);
            if (typeof weight !== 'number' || weight <= 0) continue;

            // Konversi data tanggal ke SPSS seconds jika diperlukan
            let processedRowValue = rowData[i];
            let processedColValue = colData[i];
            
            if (this.isRowDateData && typeof rowData[i] === 'string' && isDateString(rowData[i])) {
                processedRowValue = dateStringToSpssSeconds(rowData[i]);
            }
            if (this.isColDateData && typeof colData[i] === 'string' && isDateString(colData[i])) {
                processedColValue = dateStringToSpssSeconds(colData[i]);
            }

            const isRowMissing = checkIsMissing(processedRowValue, this.rowVar.missing, isNumeric(processedRowValue));
            const isColMissing = checkIsMissing(processedColValue, this.colVar.missing, isNumeric(processedColValue));

            if (!isRowMissing && !isColMissing) {
                rowCatSet.add(processedRowValue);
                colCatSet.add(processedColValue);
                this.validWeight += weight;
            } else {
                this.missingWeight += weight;
            }
        }
        
        const sortValues = (arr) => {
            return Array.from(arr).sort((a, b) => {
                const aNum = (typeof a === 'number') ? a : (isNumeric(a) ? Number(a) : NaN);
                const bNum = (typeof b === 'number') ? b : (isNumeric(b) ? Number(b) : NaN);
                if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
                return String(a).localeCompare(String(b), undefined, { numeric: true });
            });
        };
        this.rowCategories = sortValues(rowCatSet);
        this.colCategories = sortValues(colCatSet);
        this.R = this.rowCategories.length;
        this.C = this.colCategories.length;
        
        this.table = Array(this.R).fill(0).map(() => Array(this.C).fill(0));
        this.rowTotals = Array(this.R).fill(0);
        this.colTotals = Array(this.C).fill(0);

        for (let i = 0; i < this.data.length; i++) {
            const rawWeight = this.weights ? (this.weights[i] ?? 1) : 1;
            const weight = this.#adjustCaseWeight(rawWeight);
            
            // Konversi data tanggal ke SPSS seconds jika diperlukan
            let processedRowValue = rowData[i];
            let processedColValue = colData[i];
            
            if (this.isRowDateData && typeof rowData[i] === 'string' && isDateString(rowData[i])) {
                processedRowValue = dateStringToSpssSeconds(rowData[i]);
            }
            if (this.isColDateData && typeof colData[i] === 'string' && isDateString(colData[i])) {
                processedColValue = dateStringToSpssSeconds(colData[i]);
            }
            
            const isRowMissing = checkIsMissing(processedRowValue, this.rowVar.missing, isNumeric(processedRowValue));
            const isColMissing = checkIsMissing(processedColValue, this.colVar.missing, isNumeric(processedColValue));

            if (isRowMissing || isColMissing || typeof weight !== 'number' || weight <= 0) continue;

            const rowIndex = this.rowCategories.indexOf(processedRowValue);
            const colIndex = this.colCategories.indexOf(processedColValue);

            if (rowIndex > -1 && colIndex > -1) {
                this.table[rowIndex][colIndex] += weight;
                this.rowTotals[rowIndex] += weight;
                this.colTotals[colIndex] += weight;
                this.W += weight; 
            }
        }

        // Terapkan penyesuaian bobot non-integer pada level sel jika dipilih
        const nonInt = (this.options && this.options.nonintegerWeights) || 'noAdjustment';
        if (nonInt === 'roundCell' || nonInt === 'truncateCell') {
            const adjustFn = nonInt === 'roundCell' ? Math.round : (x) => (x < 0 ? Math.ceil(x) : Math.trunc(x));
            const newTable = this.table.map(row => row.map(v => adjustFn(v)));
            // Hitung ulang total baris, kolom, dan grand total dari tabel yang telah disesuaikan
            const newRowTotals = newTable.map(row => row.reduce((a, b) => a + b, 0));
            const newColTotals = Array(this.C).fill(0);
            for (let j = 0; j < this.C; j++) {
                let s = 0;
                for (let iR = 0; iR < this.R; iR++) s += newTable[iR][j];
                newColTotals[j] = s;
            }
            const newW = newRowTotals.reduce((a, b) => a + b, 0);

            this.table = newTable;
            this.rowTotals = newRowTotals;
            this.colTotals = newColTotals;
            this.W = newW;
            this.validWeight = newW;
        }

        this.initialized = true;
    }

    #adjustCaseWeight(weight) {
        const nonInt = (this.options && this.options.nonintegerWeights) || 'noAdjustment';
        if (nonInt === 'roundCase') return Math.round(weight);
        if (nonInt === 'truncateCase') return (weight < 0 ? Math.ceil(weight) : Math.trunc(weight));
        return weight;
    }
    
    _getExpectedCount(i, j) {
        this.#initialize();
        if (this.W === 0) return null;
        const expected = (this.rowTotals[i] * this.colTotals[j]) / this.W;
        return toSPSSFixed(expected, 1);
    }
    

    
    getStatistics() {
        this.#initialize();
        const cellStats = Array(this.R).fill(0).map(() => Array(this.C).fill(0));
        for (let i = 0; i < this.R; i++) {
            for (let j = 0; j < this.C; j++) {
                const f_ij = this.table[i][j];

                // 1) Expected count – keep both exact (for computation) and rounded (for display)
                const expectedExact = (this.rowTotals[i] * this.colTotals[j]) / this.W;
                const expectedRounded = toSPSSFixed(expectedExact, 1);

                // 2) Residuals based on the *exact* expected count (matches SPSS behaviour)
                const residual = toSPSSFixed(f_ij - expectedExact, 1);

                let standardizedResidual = null;
                let adjustedResidual = null;

                if (expectedExact && expectedExact > 0) {
                    const unroundedStandardized = (f_ij - expectedExact) / Math.sqrt(expectedExact);
                    standardizedResidual = toSPSSFixed(unroundedStandardized, 3);

                    if (this.W > 0) {
                        const rowProp = this.rowTotals[i] / this.W;
                        const colProp = this.colTotals[j] / this.W;
                        const denom = Math.sqrt(expectedExact * (1 - rowProp) * (1 - colProp));
                        if (denom !== 0) {
                            const unroundedAdjusted = (f_ij - expectedExact) / denom;
                            adjustedResidual = toSPSSFixed(unroundedAdjusted, 3);
                        }
                    }
                }

                cellStats[i][j] = {
                    count: f_ij,
                    expected: expectedRounded,      // display value (1-decimal rounded)
                    residual,                       // unstandardized residual (1-dec)
                    standardizedResidual,           // 3-dec
                    adjustedResidual,               // 3-dec
                    rowPercent: this.rowTotals[i] > 0 ? 100 * (f_ij / this.rowTotals[i]) : 0,
                    colPercent: this.colTotals[j] > 0 ? 100 * (f_ij / this.colTotals[j]) : 0,
                    totalPercent: this.W > 0 ? 100 * (f_ij / this.W) : 0,
                };
            }
        }

        // Konversi kembali kategori ke format tanggal jika diperlukan
        const displayRowCategories = this.isRowDateData 
            ? this.rowCategories.map(value => {
                if (typeof value === 'number') {
                    const dateString = spssSecondsToDateString(value);
                    return dateString || value;
                }
                return value;
            })
            : this.rowCategories;
            
        const displayColCategories = this.isColDateData 
            ? this.colCategories.map(value => {
                if (typeof value === 'number') {
                    const dateString = spssSecondsToDateString(value);
                    return dateString || value;
                }
                return value;
            })
            : this.colCategories;

        return {
            summary: {
                rows: this.R,
                cols: this.C,
                totalCases: this.W, 
                valid: this.validWeight,
                missing: this.missingWeight,
                rowCategories: displayRowCategories,
                colCategories: displayColCategories,
                rowTotals: this.rowTotals,
                colTotals: this.colTotals,
            },
            contingencyTable: this.table,
            cellStatistics: cellStats,
        };
    }

    getPearsonChiSquare() {
        this.#initialize();
        const df = (this.R > 1 && this.C > 1) ? (this.R - 1) * (this.C - 1) : 0;
        if (this.W === 0 || df === 0) {
            return { value: 0, df };
        }
        let chi = 0;
        for (let i = 0; i < this.R; i++) {
            for (let j = 0; j < this.C; j++) {
                const expected = (this.rowTotals[i] * this.colTotals[j]) / this.W;
                if (expected > 0) {
                    const diff = this.table[i][j] - expected;
                    chi += (diff * diff) / expected;
                }
            }
        }
        return { value: chi, df };
    }
}

self.CrosstabsCalculator = CrosstabsCalculator;