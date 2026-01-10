/**
 * @file manager.js
 * @description
 * Entry point (controller) utama untuk semua web worker
 * Compare Means. Menerima pesan dari main thread, mendelegasikan
 * tugas ke kalkulator yang sesuai (OneSampleTTest, IndependentSamplesTTest, PairedSamplesTTest, OneWayAnova, EffectSize),
 * dan mengirimkan hasilnya kembali.
 * 
 * Arsitektur ini memungkinkan penambahan analisis baru dengan mudah
 * tanpa mengubah logika perutean pesan utama.
 */

// Muat semua pustaka kalkulator dan utilitas
import './libs/utils.js';
import './libs/oneSampleTTest.js';
import './libs/independentSamplesTTest.js';
import './libs/pairedSamplesTTest.js';
import './libs/oneWayAnova.js';
// import './libs/effectSize.js';

// Definisikan global calculator map
const calculators = {
    oneSampleTTest: OneSampleTTestCalculator,
    independentSamplesTTest: IndependentSamplesTTestCalculator,
    pairedSamplesTTest: PairedSamplesTTestCalculator,
    oneWayAnova: OneWayAnovaCalculator,
    // effectSize: EffectSizeCalculator,
};

/**
 * Menangani pesan masuk dari main thread.
 * @param {MessageEvent} event - Event pesan yang diterima.
 */
onmessage = (event) => {
    const { analysisType, pair, variable1, variable2, data1, data2, options } = event.data;
    
    // --- Start of Debugging ---
    console.log(`[Worker] Received analysis request: ${analysisType}`);
    console.log('[Worker] Received variable1:', JSON.parse(JSON.stringify(variable1)));
    console.log('[Worker] Received data1 (first 5 rows):', data1 ? data1.slice(0, 5) : 'No data');
    if (variable2 && data2) {
        console.log('[Worker] Received variable2:', JSON.parse(JSON.stringify(variable2)));
        console.log('[Worker] Received data2 (first 5 rows):', data2 ? data2.slice(0, 5) : 'No data');
    }
    console.log('[Worker] Received options:', JSON.parse(JSON.stringify(options || {})));
    // --- End of Debugging ---

    try {
        let results = {};
        analysisType.forEach(type => {
            const CalculatorClass = calculators[type];
            if (!CalculatorClass) {
                throw new Error(`Tipe analisis tidak valid: ${type}`);
            }

            let calculator;

            if (type === 'oneSampleTTest') {
                calculator = new CalculatorClass({ 
                    variable1, 
                    data1, 
                    options 
                });

                // console.log('[Worker] Calculator instance created:', JSON.stringify(calculator));
                console.log('[Worker] Variable1:', JSON.stringify(calculator.getOutput().variable1));
                console.log('[Worker] One Sample Statistics Results:', JSON.stringify(calculator.getOutput().oneSampleStatistics));
                console.log('[Worker] One Sample Test Results:', JSON.stringify(calculator.getOutput().oneSampleTest));
                results.variable1 = calculator.getOutput().variable1;
                results.oneSampleStatistics = calculator.getOutput().oneSampleStatistics;
                results.oneSampleTest = calculator.getOutput().oneSampleTest;
                results.metadata = calculator.getOutput().metadata;
            } else if (type === 'independentSamplesTTest') {
                calculator = new CalculatorClass({ 
                    variable1,
                    data1,
                    variable2,
                    data2,
                    options
                });

                // console.log('[Worker] Calculator instance created:', JSON.stringify(calculator));
                console.log('[Worker] Variable1:', JSON.stringify(calculator.getOutput().variable1));
                console.log('[Worker] Group Statistics Results:', JSON.stringify(calculator.getOutput().groupStatistics));
                console.log('[Worker] Independent Samples Test Results:', JSON.stringify(calculator.getOutput().independentSamplesTest));
                results.variable1 = calculator.getOutput().variable1;
                results.groupStatistics = calculator.getOutput().groupStatistics;
                results.independentSamplesTest = calculator.getOutput().independentSamplesTest;
                results.metadata = calculator.getOutput().metadata;
            } else if (type === 'pairedSamplesTTest') {
                calculator = new CalculatorClass({ 
                    pair,
                    variable1, 
                    variable2,
                    data1, 
                    data2, 
                    options 
                });

                // console.log('[Worker] Calculator instance created:', JSON.stringify(calculator));
                console.log('[Worker] Variable1:', JSON.stringify(calculator.getOutput().variable1));
                console.log('[Worker] Variable2:', JSON.stringify(calculator.getOutput().variable2));
                console.log('[Worker] Paired Samples Statistics Results:', JSON.stringify(calculator.getOutput().pairedSamplesStatistics));
                console.log('[Worker] Paired Samples Correlation Results:', JSON.stringify(calculator.getOutput().pairedSamplesCorrelation));
                console.log('[Worker] Paired Samples Test Results:', JSON.stringify(calculator.getOutput().pairedSamplesTest));
                console.log('[Worker] Metadata:', JSON.stringify(calculator.getOutput().metadata));
                results.variable1 = calculator.getOutput().variable1;
                results.variable2 = calculator.getOutput().variable2;
                results.pairedSamplesStatistics = calculator.getOutput().pairedSamplesStatistics;
                results.pairedSamplesCorrelation = calculator.getOutput().pairedSamplesCorrelation;
                results.pairedSamplesTest = calculator.getOutput().pairedSamplesTest;
                results.metadata = calculator.getOutput().metadata;
            } else if (type === 'oneWayAnova') {
                calculator = new CalculatorClass({ 
                    variable1, 
                    data1, 
                    variable2,
                    data2,
                    options 
                });

                console.log('[Worker] Variable1:', JSON.stringify(calculator.getOutput().variable1));
                // console.log('[Worker] One Way ANOVA Results:', JSON.stringify(calculator.getOutput().oneWayAnova));
                // console.log('[Worker] One Way ANOVA Descriptives Results:', JSON.stringify(calculator.getOutput().descriptives));
                // console.log('[Worker] One Way ANOVA Homogeneity of Variance Results:', JSON.stringify(calculator.getOutput().homogeneityOfVariances));
                // console.log('[Worker] One Way ANOVA Multiple Comparisons Results:', JSON.stringify(calculator.getOutput().multipleComparisons));
                // console.log('[Worker] One Way ANOVA Homogeneous Subsets Results:', JSON.stringify(calculator.getOutput().homogeneousSubsets));
                console.log('[Worker] One Way ANOVA Metadata:', JSON.stringify(calculator.getOutput().metadata));
                results.variable1 = calculator.getOutput().variable1;
                results.oneWayAnova = calculator.getOutput().oneWayAnova;
                results.descriptives = calculator.getOutput().descriptives;
                results.homogeneityOfVariances = calculator.getOutput().homogeneityOfVariances;
                results.multipleComparisons = calculator.getOutput().multipleComparisons;
                results.homogeneousSubsets = calculator.getOutput().homogeneousSubsets;
                results.metadata = calculator.getOutput().metadata;
            } else if (type === 'effectSize') {
                calculator = new CalculatorClass({ 
                    variable1, 
                    data1, 
                    options 
                });
            } else {
                calculator = new CalculatorClass({ 
                    variable1, 
                    data1, 
                    options 
                });
            }
            // console.log('[Worker] Calculator instance created:', JSON.stringify(calculator));
            console.log('[Worker] Results:', JSON.stringify(results));
        });

        console.log('[Worker] Final results:', JSON.stringify(results));
        if (analysisType.includes('pairedSamplesTTest')) {
            postMessage({
                status: 'success',
                variableName: `${variable1.label || variable1.name}-${variable2.label || variable2.name}` || 'unknown',
                results: results,
            });
        } else {
            postMessage({
                status: 'success',
                variableName: variable1.name || 'unknown',
                results: results,
            });
        }
    } catch (error) {
        console.error(`[Worker] Error dalam worker untuk variabel ${variable1?.name || 'unknown'}:`, error);
        if (analysisType.includes('pairedSamplesTTest')) {
        postMessage({
                status: 'error',
                variableName: `${variable1.label || variable1.name}-${variable2.label || variable2.name}` || 'unknown',
                error: error.message,
            });
        } else {
            postMessage({
                status: 'error',
                variableName: variable1.name || 'unknown',
                error: error.message,
            });
        }
    }
};