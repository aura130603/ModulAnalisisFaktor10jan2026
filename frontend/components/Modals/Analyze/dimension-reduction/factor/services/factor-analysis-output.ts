//  perbaikan bisa (9/1/2026)

import {FactorFinalResultType} from "@/components/Modals/Analyze/dimension-reduction/factor/types/factor-worker";
import {Table} from "@/types/Table";
import {useResultStore} from "@/stores/useResultStore";

export async function resultFactorAnalysis({
    formattedResult,
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
             *  Title Result
             * */
            const titleMessage = "Factor Analysis";
            const logId = await addLog({ log: titleMessage });
            const analyticId = await addAnalytic(logId, {
                title: `Factor Analysis Result`,
                note: "",
            });

            /*
             *  Descriptive Statistics Result 
             * */
            const descriptiveStatistics = findTable("descriptive_statistics");
            if (descriptiveStatistics) {
                const descriptiveStatsId = await addAnalytic(logId, {
                    title: `Descriptive Statistics`,
                    note: "",
                });

                await addStatistic(descriptiveStatsId, {
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
                const correlationMatrixId = await addAnalytic(logId, {
                    title: `Correlation Matrix`,
                    note: "",
                });

                await addStatistic(correlationMatrixId, {
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
                const inverseCorrelationMatrixId = await addAnalytic(logId, {
                    title: `Inverse of Correlation Matrix`,
                    note: "",
                });

                await addStatistic(inverseCorrelationMatrixId, {
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
                const covarianceMatrixId = await addAnalytic(logId, {
                    title: `Covariance Matrix`,
                    note: "",
                });

                await addStatistic(covarianceMatrixId, {
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
                const inverseCovarianceMatrixId = await addAnalytic(logId, {
                    title: `Inverse of Covariance Matrix`,
                    note: "",
                });

                await addStatistic(inverseCovarianceMatrixId, {
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
                const kmoBartlettsTestId = await addAnalytic(logId, {
                    title: `KMO and Bartlett's Test`,
                    note: "",
                });

                await addStatistic(kmoBartlettsTestId, {
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
                const antiImageMatricesId = await addAnalytic(logId, {
                    title: `Anti-image Matrices`,
                    note: "",
                });

                await addStatistic(antiImageMatricesId, {
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
                const communalitiesId = await addAnalytic(logId, {
                    title: `Communalities`,
                    note: "",
                });

                await addStatistic(communalitiesId, {
                    title: `Communalities`,
                    description: `Communalities`,
                    output_data: communalities,
                    components: `Communalities`,
                });
            }

            const totalVarianceExplained = findTable(
    "total_variance_explained"
);
console.log("Looking for Total Variance Explained table...", "Found:", totalVarianceExplained);

if (totalVarianceExplained) {
    console.log("Total Variance Explained table found and processing...");
    const totalVarianceExplainedId = await addAnalytic(logId, {
        title: `Total Variance Explained`,
        note: "",
    });

    await addStatistic(totalVarianceExplainedId, {
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
            if (componentMatrix) {
                const componentMatrixId = await addAnalytic(logId, {
                    title: `Component Matrix`,
                    note: "",
                });

                await addStatistic(componentMatrixId, {
                    title: `Component Matrix`,
                    description: `Component Matrix`,
                    output_data: componentMatrix,
                    components: `Component Matrix`,
                });
            }

            /*
             * 🔄 Reproduced Correlations Result 🔄
             * */
            const reproducedCorrelations = findTable("reproduced_correlations");
            if (reproducedCorrelations) {
                const reproducedCorrelationsId = await addAnalytic(logId, {
                    title: `Reproduced Correlations`,
                    note: "",
                });

                await addStatistic(reproducedCorrelationsId, {
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
                const reproducedCovariancesId = await addAnalytic(logId, {
                    title: `Reproduced Covariances`,
                    note: "",
                });

                await addStatistic(reproducedCovariancesId, {
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
            if (rotatedComponentMatrix) {
                const rotatedComponentMatrixId = await addAnalytic(logId, {
                    title: `Rotated Component Matrix`,
                    note: "",
                });

                await addStatistic(rotatedComponentMatrixId, {
                    title: `Rotated Component Matrix`,
                    description: `Rotated Component Matrix`,
                    output_data: rotatedComponentMatrix,
                    components: `Rotated Component Matrix`,
                });
            }

            /*
             * 🔄 Component Transformation Matrix Result 🔄
             * */
            const componentTransformationMatrix = findTable(
                "component_transformation_matrix"
            );
            if (componentTransformationMatrix) {
                const componentTransformationMatrixId = await addAnalytic(
                    logId,
                    {
                        title: `Component Transformation Matrix`,
                        note: "",
                    }
                );

                await addStatistic(componentTransformationMatrixId, {
                    title: `Component Transformation Matrix`,
                    description: `Component Transformation Matrix`,
                    output_data: componentTransformationMatrix,
                    components: `Component Transformation Matrix`,
                });
            }

            /*
             * 🔄 Pattern Matrix Result 🔄
             * */
            const patternMatrix = findTable("pattern_matrix");
            if (patternMatrix) {
                const patternMatrixId = await addAnalytic(logId, {
                    title: `Pattern Matrix`,
                    note: "",
                });

                await addStatistic(patternMatrixId, {
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
                const structureMatrixId = await addAnalytic(logId, {
                    title: `Structure Matrix`,
                    note: "",
                });

                await addStatistic(structureMatrixId, {
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
            if (componentCorrelationMatrix) {
                const componentCorrelationMatrixId = await addAnalytic(
                    logId,
                    {
                        title: `Component Correlation Matrix`,
                        note: "",
                    }
                );

                await addStatistic(componentCorrelationMatrixId, {
                    title: `Component Correlation Matrix`,
                    description: `Component Correlation Matrix`,
                    output_data: componentCorrelationMatrix,
                    components: `Component Correlation Matrix`,
                });
            }

            /*
             * 📊 Component Score Coefficient Matrix Result 📊
             * */
            const componentScoreCoefficientMatrix = findTable(
                "component_score_coefficient_matrix"
            );
            if (componentScoreCoefficientMatrix) {
                const componentScoreCoefficientMatrixId = await addAnalytic(
                    logId,
                    {
                        title: `Component Score Coefficient Matrix`,
                        note: "",
                    }
                );

                await addStatistic(componentScoreCoefficientMatrixId, {
                    title: `Component Score Coefficient Matrix`,
                    description: `Component Score Coefficient Matrix`,
                    output_data: componentScoreCoefficientMatrix,
                    components: `Component Score Coefficient Matrix`,
                });
            }

            

            /*
             * 📈 Component Score Covariance Matrix Result 📈
             * */
            const componentScoreCovarianceMatrix = findTable(
                "component_score_covariance_matrix"
            );
            if (componentScoreCovarianceMatrix) {
                const componentScoreCovarianceMatrixId = await addAnalytic(
                    logId,
                    {
                        title: `Component Score Covariance Matrix`,
                        note: "",
                    }
                );

                await addStatistic(componentScoreCovarianceMatrixId, {
                    title: `Component Score Covariance Matrix`,
                    description: `Component Score Covariance Matrix`,
                    output_data: componentScoreCovarianceMatrix,
                    components: `Component Score Covariance Matrix`,
                });
            }




/*
 * 📐 Loading Plot Logic 📐
 */
// Ambil data dari Rust (sesuai struct baru)
const loadingPlotDataRaw = (formattedResult as any).loadingPlotChart;

if (loadingPlotDataRaw) {
    const loadingPlotId = await addAnalytic(logId, {
        title: `Loading Plot`,
        note: "Interactive Plotly Visualization",
    });

    // Kita simpan data mentah saja (JSON), karena komponen React yang akan mengolahnya
    const chartPayload = {
        type: "PLOTLY_LOADING_PLOT", // Penanda untuk Frontend merender komponen yg benar
        data: loadingPlotDataRaw
    };

    await addStatistic(loadingPlotId, {
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
                // Buat container analitik baru khusus untuk plot (opsional, bisa digabung)
                const screeChartId = await addAnalytic(logId, {
                    title: `Scree Plot`,
                    note: "",
                });

                await addStatistic(screeChartId, {
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
                const screePlotId = await addAnalytic(logId, {
                    title: `Scree Plot Data Table`,
                    note: "",
                });

                await addStatistic(screePlotId, {
                    title: `Scree Plot Data`,
                    description: `Table of Eigenvalues`,
                    output_data: screePlotTable,
                    components: `Scree Plot Data`, // Menggunakan renderer Tabel default
                });
            }
        };

        await factorAnalysisResult();
    } catch (e) {
        console.error(e);
    }
}
