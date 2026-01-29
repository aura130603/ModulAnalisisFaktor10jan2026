//  perbaikan bisa (9/1/2026)
//  REVISI: Mengelompokkan semua output dalam satu blok "Factor Analysis" (28/1/2026)
//  REVISI: Menambahkan SPSS-style syntax log untuk Factor Analysis (29/1/2026)

import {FactorFinalResultType} from "@/components/Modals/Analyze/dimension-reduction/factor/types/factor-worker";
import {Table} from "@/types/Table";
import {useResultStore} from "@/stores/useResultStore";
import {useDataStore, ColumnData} from "@/stores/useDataStore";
import {useVariableStore} from "@/stores/useVariableStore";
import {generateFactorAnalysisLog} from "./factor-log-generator";

export async function resultFactorAnalysis({
    formattedResult,
    configData,
}: FactorFinalResultType) {
    try {
        const { addLog, addAnalytic, addStatistic } = useResultStore.getState();

        const findTable = (key: string) => {
            const foundTable = formattedResult.tables.find(
                (table: Table) => table.key === key
            );
            return foundTable ? JSON.stringify({ tables: [foundTable] }) : null;
        };


        const findRawTable = (key: string): Table | null => {
    const table = formattedResult.tables.find(
        (table: Table) => table.key === key
    );

    if (!table) {
        console.warn(`[FactorAnalysis] Table '${key}' not found`);
        return null;
    }

    return table;
};


        const factorAnalysisResult = async () => {
            /*
             *  Create Log and Single Analytic Group for Factor Analysis
             *  Semua output akan dikelompokkan dalam satu blok "Factor Analysis"
             *  Generate SPSS-style syntax log berdasarkan konfigurasi yang dipilih user
             * */
            const logMessage = generateFactorAnalysisLog(configData);
            console.log("[Factor Analysis] Generated SPSS-style log:", logMessage);
            const logId = await addLog({ log: logMessage });
            
            // Satu analyticId untuk semua statistik output (seperti Linear Regression)
            const analyticId = await addAnalytic(logId, {
                title: `Factor Analysis`,
                note: "",
            });

            /*
             *  Descriptive Statistics Result 
             * */
            const descriptiveStatistics = findTable("descriptive_statistics");
            if (descriptiveStatistics) {
                await addStatistic(analyticId, {
                    title: `Descriptive Statistics`,
                    description: `Descriptive Statistics`,
                    output_data: descriptiveStatistics,
                    components: `Descriptive Statistics`,
                });
            }

            /*
             *  Correlation Matrix Result 
             * */
            const correlationMatrix = findTable("correlation_matrix");
            if (correlationMatrix) {
                await addStatistic(analyticId, {
                    title: `Correlation Matrix`,
                    description: `Correlation Matrix`,
                    output_data: correlationMatrix,
                    components: `Correlation Matrix`,
                });
            }

            /*
             *  Inverse Correlation Matrix Result 
             * */
            const inverseCorrelationMatrix = findTable(
                "inverse_correlation_matrix"
            );
            if (inverseCorrelationMatrix) {
                await addStatistic(analyticId, {
                    title: `Inverse of Correlation Matrix`,
                    description: `Inverse of Correlation Matrix`,
                    output_data: inverseCorrelationMatrix,
                    components: `Inverse of Correlation Matrix`,
                });
            }

            /*
             *  Covariance Matrix Result 
             * */
            const covarianceMatrix = findTable("covariance_matrix");
            if (covarianceMatrix) {
                await addStatistic(analyticId, {
                    title: `Covariance Matrix`,
                    description: `Covariance Matrix`,
                    output_data: covarianceMatrix,
                    components: `Covariance Matrix`,
                });
            }

            /*
             *  Inverse Covariance Matrix Result 
             * */
            const inverseCovarianceMatrix = findTable(
                "inverse_covariance_matrix"
            );
            if (inverseCovarianceMatrix) {
                await addStatistic(analyticId, {
                    title: `Inverse of Covariance Matrix`,
                    description: `Inverse of Covariance Matrix`,
                    output_data: inverseCovarianceMatrix,
                    components: `Inverse of Covariance Matrix`,
                });
            }

            /*
             *  KMO and Bartlett's Test Result 
             * */
            const kmoBartlettsTest = findTable("kmo_bartletts_test");
            if (kmoBartlettsTest) {
                await addStatistic(analyticId, {
                    title: `KMO and Bartlett's Test`,
                    description: `KMO and Bartlett's Test`,
                    output_data: kmoBartlettsTest,
                    components: `KMO and Bartlett's Test`,
                });
            }

            /*
             *  Anti-image Matrices Result 
             * */
            const antiImageMatrices = findTable("anti_image_matrices");
            if (antiImageMatrices) {
                await addStatistic(analyticId, {
                    title: `Anti-image Matrices`,
                    description: `Anti-image Matrices`,
                    output_data: antiImageMatrices,
                    components: `Anti-image Matrices`,
                });
            }

            /*
             *  Communalities Result 
             * */
            const communalities = findTable("communalities");
            if (communalities) {
                await addStatistic(analyticId, {
                    title: `Communalities`,
                    description: `Communalities`,
                    output_data: communalities,
                    components: `Communalities`,
                });
            }

            /*
             *  Total Variance Explained Result 
             * */
            const totalVarianceExplained = findTable("total_variance_explained");
            console.log("Looking for Total Variance Explained table...", "Found:", totalVarianceExplained);

            if (totalVarianceExplained) {
                console.log("Total Variance Explained table found and processing...");
                await addStatistic(analyticId, {
                    title: `Total Variance Explained`,
                    description: `Total Variance Explained`,
                    output_data: totalVarianceExplained,
                    components: `Total Variance Explained`,
                });
                console.log("Total Variance Explained table saved to result store.");
            } else {
                console.warn("Total Variance Explained table not found in formatted results!");
            }


            /*
             * 🧩 Component Matrix Result 🧩
             * */
            const componentMatrix = findTable("component_matrix");
            const componentMatrixRaw = findRawTable("component_matrix");
            if (componentMatrix && componentMatrixRaw) {
                const tableTitle = componentMatrixRaw.title;
                await addStatistic(analyticId, {
                    title: tableTitle,
                    description: tableTitle,
                    output_data: componentMatrix,
                    components: tableTitle,
                });
            }

            /*
             * 🔄 Reproduced Correlations Result 🔄
             * */
            const reproducedCorrelations = findTable("reproduced_correlations");
            if (reproducedCorrelations) {
                await addStatistic(analyticId, {
                    title: `Reproduced Correlations`,
                    description: `Reproduced Correlations`,
                    output_data: reproducedCorrelations,
                    components: `Reproduced Correlations`,
                });
            }

            /*
             * 🔄 Reproduced Covariances Result 🔄
             * */
            const reproducedCovariances = findTable("reproduced_covariances");
            if (reproducedCovariances) {
                await addStatistic(analyticId, {
                    title: `Reproduced Covariances`,
                    description: `Reproduced Covariances`,
                    output_data: reproducedCovariances,
                    components: `Reproduced Covariances`,
                });
            }

            /*
             * 🔄 Rotated Component Matrix Result 🔄
             * */
            const rotatedComponentMatrix = findTable(
                "rotated_component_matrix"
            );
            const rotatedComponentMatrixRaw = findRawTable(
                "rotated_component_matrix"
            );
            if (rotatedComponentMatrix && rotatedComponentMatrixRaw) {
                const tableTitle = rotatedComponentMatrixRaw.title;
                await addStatistic(analyticId, {
                    title: tableTitle,
                    description: tableTitle,
                    output_data: rotatedComponentMatrix,
                    components: tableTitle,
                });
            }

            /*
             * 🔄 Component Transformation Matrix Result 🔄
             * */
            const componentTransformationMatrix = findTable(
                "component_transformation_matrix"
            );
            const componentTransformationMatrixRaw = findRawTable(
                "component_transformation_matrix"
            );
            if (componentTransformationMatrix && componentTransformationMatrixRaw) {
                const tableTitle = componentTransformationMatrixRaw.title;
                await addStatistic(analyticId, {
                    title: tableTitle,
                    description: tableTitle,
                    output_data: componentTransformationMatrix,
                    components: tableTitle,
                });
            }

            /*
             * 🔄 Pattern Matrix Result 🔄
             * */
            const patternMatrix = findTable("pattern_matrix");
            if (patternMatrix) {
                await addStatistic(analyticId, {
                    title: `Pattern Matrix`,
                    description: `Pattern Matrix`,
                    output_data: patternMatrix,
                    components: `Pattern Matrix`,
                });
            }

            /*
             * 🔄 Structure Matrix Result 🔄
             * */
            const structureMatrix = findTable("structure_matrix");
            if (structureMatrix) {
                await addStatistic(analyticId, {
                    title: `Structure Matrix`,
                    description: `Structure Matrix`,
                    output_data: structureMatrix,
                    components: `Structure Matrix`,
                });
            }

            /*
             * 🔄 Component Correlation Matrix Result 🔄
             * */
            const componentCorrelationMatrix = findTable(
                "component_correlation_matrix"
            );
            const componentCorrelationMatrixRaw = findRawTable(
                "component_correlation_matrix"
            );
            if (componentCorrelationMatrix && componentCorrelationMatrixRaw) {
                const tableTitle = componentCorrelationMatrixRaw.title;
                await addStatistic(analyticId, {
                    title: tableTitle,
                    description: tableTitle,
                    output_data: componentCorrelationMatrix,
                    components: tableTitle,
                });
            }

            /*
             * 📊 Component Score Coefficient Matrix Result 📊
             * */
            const componentScoreCoefficientMatrix = findTable(
                "component_score_coefficient_matrix"
            );
            const componentScoreCoefficientMatrixRaw = findRawTable(
                "component_score_coefficient_matrix"
            );
            if (componentScoreCoefficientMatrix && componentScoreCoefficientMatrixRaw) {
                const tableTitle = componentScoreCoefficientMatrixRaw.title;
                await addStatistic(analyticId, {
                    title: tableTitle,
                    description: tableTitle,
                    output_data: componentScoreCoefficientMatrix,
                    components: tableTitle,
                });
            }

            /*
             * 📈 Component Score Covariance Matrix Result 📈
             * */
            const componentScoreCovarianceMatrix = findTable(
                "component_score_covariance_matrix"
            );
            const componentScoreCovarianceMatrixRaw = findRawTable(
                "component_score_covariance_matrix"
            );
            if (componentScoreCovarianceMatrix && componentScoreCovarianceMatrixRaw) {
                const tableTitle = componentScoreCovarianceMatrixRaw.title;
                await addStatistic(analyticId, {
                    title: tableTitle,
                    description: tableTitle,
                    output_data: componentScoreCovarianceMatrix,
                    components: tableTitle,
                });
            }

            /*
             * 📐 Loading Plot Logic 📐
             */
            // Ambil data dari Rust (sesuai struct baru)
            const loadingPlotDataRaw = (formattedResult as any).loadingPlotChart;

            if (loadingPlotDataRaw) {
                // Kita simpan data mentah saja (JSON), karena komponen React yang akan mengolahnya
                const chartPayload = {
                    type: "PLOTLY_LOADING_PLOT", // Penanda untuk Frontend merender komponen yg benar
                    data: loadingPlotDataRaw
                };

                await addStatistic(analyticId, {
                    title: `Loading Plot`,
                    description: `Factor Loadings (${loadingPlotDataRaw.axis_labels.length} Components)`,
                    // Simpan JSON mentah ini ke database/state
                    output_data: JSON.stringify(chartPayload),
                    components: "LoadingPlot", 
                });
            }


            /*
             * 📉 Scree Plot Chart 📉
             * Menampilkan Diagram Scree Plot
             * */
            // Mengakses properti tambahan yang kita buat di formatter
            const chartData = (formattedResult as any).screePlotChart;
            
            if (chartData) {
                await addStatistic(analyticId, {
                    title: `Scree Plot`,
                    description: `Eigenvalues vs Component Number`,
                    output_data: JSON.stringify(chartData),
                    components: "ScreePlot", 
                });
            }


            /*
             * 📋 Scree Plot Data Table📋
             * Menampilkan data tabel di bawah chart
             * */
            const screePlotTable = findTable("scree_plot");
            if (screePlotTable) {
                await addStatistic(analyticId, {
                    title: `Scree Plot Data`,
                    description: `Table of Eigenvalues`,
                    output_data: screePlotTable,
                    components: `Scree Plot Data`, // Menggunakan renderer Tabel default
                });
            }
        };

        await factorAnalysisResult();

        /*
         * 📊 Save Factor Scores as Variables (Save as Variables Logic) 📊
         * */
        if (configData.scores.SaveVar && formattedResult.factorScores && formattedResult.factorScores.length > 0) {
            try {
                console.log("Injecting factor scores into data grid...", formattedResult.factorScores);

                // Get stores
                const dataStore = useDataStore.getState();
                const variableStore = useVariableStore.getState();

                // Convert factor scores to ColumnData format
                const columnDataList: ColumnData[] = formattedResult.factorScores.map((score: any) => ({
                    variable_name: score.variable_name,
                    values: score.values,
                }));

                // Step 1: Inject data values into the grid
                const { startColumnIndex, endColumnIndex } = await dataStore.addVariableColumns(columnDataList);

                // Step 2: Register variable metadata WITHOUT manipulating the data structure
                // This prevents column shifting and ensures proper header/data alignment
                if (startColumnIndex >= 0 && endColumnIndex >= 0) {
                    const newVariablesData = columnDataList.map((column, index) => ({
                        columnIndex: startColumnIndex + index,
                        name: column.variable_name,
                        type: 'NUMERIC' as const,
                        width: 8,
                        decimals: 2,
                        label: `Factor Score: ${column.variable_name}`,
                        values: [],
                        missing: null,
                        columns: 8,
                        align: 'right' as const,
                        measure: 'scale' as const,
                        role: 'input' as const,
                    }));

                    // Use registerVariableMetadata instead of addVariables to avoid column shifting
                    // registerVariableMetadata only updates the metadata, preserving the data structure
                    await variableStore.registerVariableMetadata(newVariablesData);

                    console.log(`Successfully added ${newVariablesData.length} factor score columns to the data grid with proper headers`);
                }
            } catch (error) {
                console.error("Failed to inject factor scores into data grid:", error);
            }
        }
    } catch (e) {
        console.error(e);
    }
}
