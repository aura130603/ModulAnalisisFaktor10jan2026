import * as Comlink from 'comlink';

/**
 * Menghitung nilai agregasi berdasarkan fungsi yang ditentukan
 *
 * @param {string} aggFunction - Fungsi agregasi yang akan digunakan
 * @param {Array<string|number|null>} values - Nilai-nilai yang akan diagregasi
 * @param {Object} options - Opsi tambahan (percentageValue, percentageLow, percentageHigh)
 * @returns {number|string|null} Hasil agregasi
 */
const calculateAggregateValue = (
    aggFunction,
    values,
    options = {}
) => {
    // Filter out null values and convert to numeric if needed
    const numericValues = values
        .filter(v => v !== null && v !== "")
        .map(v => typeof v === 'number' ? v : Number(v))
        .filter(v => !isNaN(v));

    try {
        switch (aggFunction) {
            case "MEAN":
                // Mean across cases
                return numericValues.length > 0
                    ? numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
                    : null;

            case "SUM":
                // Sum across cases
                return numericValues.length > 0
                    ? numericValues.reduce((sum, val) => sum + val, 0)
                    : null;

            case "MEDIAN":
                // Median across cases
                if (numericValues.length > 0) {
                    const sortedValues = [...numericValues].sort((a, b) => a - b);
                    const mid = Math.floor(sortedValues.length / 2);
                    return sortedValues.length % 2 === 0
                        ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
                        : sortedValues[mid];
                }
                return null;

            case "STDDEV":
                // Standard deviation across cases
                if (numericValues.length > 1) {
                    const mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
                    const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (numericValues.length - 1); // Using n-1 for sample standard deviation
                    return Math.sqrt(variance);
                }
                return null;

            case "MIN":
                // Minimum value across cases
                return numericValues.length > 0 ? Math.min(...numericValues) : null;

            case "MAX":
                // Maximum value across cases
                return numericValues.length > 0 ? Math.max(...numericValues) : null;

            case "FIRST":
                // First nonmissing observed value in break group
                return values.find(v => v !== null && v !== "") ?? null;

            case "LAST":
                // Last nonmissing observed value in break group
                return [...values].reverse().find(v => v !== null && v !== "") ?? null;

            case "N":
                // Weighted number of cases in break group
                return values.filter(v => v !== null && v !== "").length;

            case "NU":
                // Unweighted number of cases in break group
                return values.length;

            case "NMISS":
                // Weighted number of missing cases
                return values.filter(v => v === null || v === "").length;

            case "NUMISS":
                // Unweighted number of missing cases (this is actually equal to NU - N)
                return values.filter(v => v === null || v === "").length;

            case "PGT":
                // Percentage of cases greater than the specified value
                if (numericValues.length > 0 && options?.percentageValue) {
                    const threshold = parseFloat(options.percentageValue);
                    const count = numericValues.filter(val => val > threshold).length;
                    return (count / numericValues.length) * 100;
                }
                return null;

            case "PLT":
                // Percentage of cases less than the specified value
                if (numericValues.length > 0 && options?.percentageValue) {
                    const threshold = parseFloat(options.percentageValue);
                    const count = numericValues.filter(val => val < threshold).length;
                    return (count / numericValues.length) * 100;
                }
                return null;

            case "PIN":
                // Percentage of cases between value1 and value2, inclusive
                if (numericValues.length > 0 && options?.percentageLow && options?.percentageHigh) {
                    const low = parseFloat(options.percentageLow);
                    const high = parseFloat(options.percentageHigh);
                    const count = numericValues.filter(val => val >= low && val <= high).length;
                    return (count / numericValues.length) * 100;
                }
                return null;

            case "POUT":
                // Percentage of cases not between value1 and value2
                if (numericValues.length > 0 && options?.percentageLow && options?.percentageHigh) {
                    const low = parseFloat(options.percentageLow);
                    const high = parseFloat(options.percentageHigh);
                    const count = numericValues.filter(val => val < low || val > high).length;
                    return (count / numericValues.length) * 100;
                }
                return null;

            case "FGT":
                // Fraction of cases greater than the specified value
                if (numericValues.length > 0 && options?.percentageValue) {
                    const threshold = parseFloat(options.percentageValue);
                    const count = numericValues.filter(val => val > threshold).length;
                    return count / numericValues.length;
                }
                return null;

            case "FLT":
                // Fraction of cases less than the specified value
                if (numericValues.length > 0 && options?.percentageValue) {
                    const threshold = parseFloat(options.percentageValue);
                    const count = numericValues.filter(val => val < threshold).length;
                    return count / numericValues.length;
                }
                return null;

            case "FIN":
                // Fraction of cases between value1 and value2, inclusive
                if (numericValues.length > 0 && options?.percentageLow && options?.percentageHigh) {
                    const low = parseFloat(options.percentageLow);
                    const high = parseFloat(options.percentageHigh);
                    const count = numericValues.filter(val => val >= low && val <= high).length;
                    return count / numericValues.length;
                }
                return null;

            case "FOUT":
                // Fraction of cases not between value1 and value2
                if (numericValues.length > 0 && options?.percentageLow && options?.percentageHigh) {
                    const low = parseFloat(options.percentageLow);
                    const high = parseFloat(options.percentageHigh);
                    const count = numericValues.filter(val => val < low || val > high).length;
                    return count / numericValues.length;
                }
                return null;

            case "COUNT":
                // Count of cases (similar to N but could be used differently)
                return values.filter(v => v !== null && v !== "").length;

            default:
                console.log(`Unrecognized function: ${aggFunction}`);
                return null;
        }
    } catch (error) {
        console.error(`Error calculating ${aggFunction}:`, error);
        return null;
    }
};

// API yang akan diekspos ke main thread
const aggregateWorker = {
    /**
     * Melakukan aggregasi data berdasarkan parameter-parameter yang diberikan
     *
     * @param {Array<Array<string|number>>} data - Data matrix dari dataStore
     * @param {Array<number>} breakColumnIndices - Kolom index dari break variables
     * @param {Array<Object>} aggregatedVariables - Variabel-variabel yang akan diagregasi dengan konfigurasinya
     * @returns {Object} Hasil agregasi dan statistik
     */
    async aggregateData(data, breakColumnIndices, aggregatedVariables) {
        try {
            // Waktu mulai untuk tracking performa
            const startTime = performance.now();

            // 1. Kelompokkan data berdasarkan nilai pada break variables
            const groups = {};
            data.forEach((row, rowIndex) => {
                const key = breakColumnIndices
                    .map(colIndex => row[colIndex])
                    .join("|");

                if (!groups[key]) {
                    groups[key] = [];
                }
                groups[key].push({ rowIndex, row });
            });

            // 2. Siapkan hasil agregasi
            const aggregatedData = new Array(data.length).fill(null).map(() => []);
            const bulkUpdates = [];

            // 3. Lakukan agregasi untuk setiap variabel yang didefinisikan
            for (let varIndex = 0; varIndex < aggregatedVariables.length; varIndex++) {
                const aggVar = aggregatedVariables[varIndex];
                const baseColumnIndex = aggVar.baseVarColumnIndex;
                const calcFunction = aggVar.calculationFunction || aggVar.function;

                // Inisialisasi array nilai agregasi sebanyak baris data
                const aggregatedValues = new Array(data.length).fill(null);

                // 4. Proses setiap kelompok data
                for (const groupKey in groups) {
                    const groupRows = groups[groupKey];

                    // Ambil nilai-nilai dari kolom sumber untuk variabel yang sedang diagregasi
                    const values = groupRows.map(item => item.row[baseColumnIndex]);

                    // Hitung nilai agregasi menggunakan fungsi yang sesuai - sekarang fungsi ini sudah ada di dalam worker
                    const aggregatedValue = calculateAggregateValue(
                        calcFunction,
                        values,
                        {
                            percentageValue: aggVar.percentageValue,
                            percentageLow: aggVar.percentageLow,
                            percentageHigh: aggVar.percentageHigh
                        }
                    );

                    // Simpan nilai agregasi ke setiap baris dalam kelompok
                    groupRows.forEach(item => {
                        aggregatedValues[item.rowIndex] = aggregatedValue;

                        // Karena updateCells tidak menerima null, gunakan string kosong sebagai pengganti
                        bulkUpdates.push({
                            row: item.rowIndex,
                            col: varIndex,  // Kolom relatif terhadap hasil agregasi
                            value: aggregatedValue ?? ""
                        });
                    });
                }

                // Simpan hasil agregasi variabel ini
                for (let i = 0; i < aggregatedValues.length; i++) {
                    aggregatedData[i][varIndex] = aggregatedValues[i];
                }
            }

            // 5. Hitung variabel metadata berdasarkan hasil agregasi
            const variableMetadata = aggregatedVariables.map((aggVar, varIndex) => {
                // Dapatkan nilai non-kosong untuk kolom ini
                const columnValues = aggregatedData.map(row => row[varIndex]).filter(v => v !== null && v !== "");

                // Periksa apakah semua nilai adalah numerik
                const allNumeric = columnValues.every(v => typeof v === "number" || (!isNaN(Number(v)) && v !== ""));

                // Tentukan tipe dan metadata lainnya
                const computedType = allNumeric ? "NUMERIC" : "STRING";
                let width = 8;
                let decimals = 2;

                if (!allNumeric) {
                    // Hitung lebar maksimum untuk tipe string
                    const maxWidth = columnValues.reduce((max, d) => {
                        const str = String(d);
                        return Math.max(max, str.length);
                    }, 0);
                    width = maxWidth || width;
                }

                return {
                    name: aggVar.name,
                    type: computedType,
                    width,
                    decimals,
                    label: aggVar.label || ""
                };
            });

            // Waktu akhir untuk tracking performa
            const endTime = performance.now();

            // 6. Return hasil
            return {
                aggregatedData,
                variableMetadata,
                bulkUpdates,
                groupCount: Object.keys(groups).length,
                timeTaken: endTime - startTime
            };
        } catch (error) {
            console.error("Error in aggregateData worker:", error);
            throw new Error(`Aggregate worker error: ${error.message}`);
        }
    },

    /**
     * Melakukan validasi nilai agregasi untuk memastikan tipe data yang diharapkan
     * @param {Array<any>} aggregatedValues - Nilai-nilai hasil agregasi
     * @param {string} expectedType - Tipe data yang diharapkan (NUMERIC/STRING)
     * @returns {Object} Hasil validasi
     */
    async validateAggregationResults(aggregatedValues, expectedType) {
        const invalidValues = [];

        if (expectedType === "NUMERIC") {
            // Validasi nilai numerik
            aggregatedValues.forEach((value, index) => {
                if (value !== null && value !== "" && isNaN(Number(value))) {
                    invalidValues.push({ index, value });
                }
            });
        }

        return {
            isValid: invalidValues.length === 0,
            invalidValues
        };
    }
};

// Expose API ke main thread
Comlink.expose(aggregateWorker);