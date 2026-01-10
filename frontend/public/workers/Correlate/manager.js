/**
 * @file manager.js
 * @description
 * Entry point (controller) utama untuk semua web worker
 * Correlate. Menerima pesan dari main thread, mendelegasikan
 * tugas ke kalkulator yang sesuai (Bivariate, NonparametricTests),
 * dan mengirimkan hasilnya kembali.
 * 
 * Arsitektur ini memungkinkan penambahan analisis baru dengan mudah
 * tanpa mengubah logika perutean pesan utama.
 */

// Muat semua pustaka kalkulator dan utilitas
import './libs/utils.js';
import './libs/bivariate.js';

// Definisikan global calculator map
const calculators = {
    bivariate: BivariateCalculator,
};

/**
 * Menangani pesan masuk dari main thread.
 * @param {MessageEvent} event - Event pesan yang diterima.
 */
onmessage = (event) => {
    const { analysisType, variable, data, options } = event.data;
    let variableName;
    
    // --- Start of Debugging ---
    console.log(`[Worker] Received analysis request: ${analysisType}`);
    // console.log('[Worker] Received variable:', JSON.parse(JSON.stringify(variable)));
    console.log('[Worker] Received variable:', JSON.stringify(variable));
    // console.log('[Worker] Received data (first 5 rows):', data ? data.slice(0, 5) : 'No data');
    console.log('[Worker] Received data:', JSON.stringify(data));
    console.log('[Worker] Received options:', JSON.parse(JSON.stringify(options || {})));
    // --- End of Debugging ---

    try {
        let results = {};
        const CalculatorClass = calculators[analysisType];
        if (!CalculatorClass) {
            throw new Error(`Tipe analisis tidak valid: ${analysisType}`);
        }

        let calculator;

        if (analysisType === 'bivariate') {
            variableName = 'bivariate';
            calculator = new CalculatorClass({ 
                variable, 
                data, 
                options 
            });

            console.log('[Worker] Descriptive Statistics Results:', JSON.stringify(calculator.getOutput().descriptiveStatistics));
            console.log('[Worker] Correlation Results:', JSON.stringify(calculator.getOutput().correlation));
            console.log('[Worker] Partial Correlation Results:', JSON.stringify(calculator.getOutput().partialCorrelation));
            console.log('[Worker] Matrix Validation Results:', JSON.stringify(calculator.getOutput().matrixValidation));
            console.log('[Worker] Metadata:', JSON.stringify(calculator.getOutput().metadata));
            results = calculator.getOutput();
        } else {
            calculator = new CalculatorClass({ 
                variable, 
                data, 
                options 
            });
        }
        console.log('[Worker] Calculator instance created:', JSON.stringify(calculator));
        console.log('[Worker] Results:', JSON.stringify(results));

        console.log('[Worker] Final results:', JSON.stringify(results));
        postMessage({
            status: 'success',
            variableName: variableName || 'unknown',
            results: results,
        });
    } catch (error) {
        console.error(`[Worker] Error dalam worker untuk variabel ${variable?.name || 'unknown'}:`, error);
        postMessage({
            status: 'error',
            variableName: variableName || 'unknown',
            error: error.message,
        });
    }
};