// discriminant-analysis-output.ts
import {DiscriminantFinalResultType} from "@/components/Modals/Analyze/Classify/discriminant/types/discriminant-worker";
import {Table} from "@/types/Table";
import {useResultStore} from "@/stores/useResultStore";

export async function resultDiscriminant({
    formattedResult,
}: DiscriminantFinalResultType) {
    try {
        const { addLog, addAnalytic, addStatistic } = useResultStore.getState();

        const findTable = (key: string) => {
            const foundTable = formattedResult.tables.find(
                (table: Table) => table.key === key
            );
            return foundTable ? JSON.stringify({ tables: [foundTable] }) : null;
        };

        const discriminantAnalysisResult = async () => {
            /*
             * 🎉 Title Result 🎉
             * */
            const titleMessage = "Discriminant Analysis";
            const logId = await addLog({ log: titleMessage });
            const analyticId = await addAnalytic(logId, {
                title: `Discriminant Analysis Result`,
                note: "",
            });

            /*
             * 📊 Analysis Case Processing Summary Result 📊
             * */
            const processingsSummary = findTable("processing_summary");
            if (processingsSummary) {
                const processingSummaryId = await addAnalytic(logId, {
                    title: `Analysis Case Processing Summary`,
                    note: "",
                });

                await addStatistic(processingSummaryId, {
                    title: `Analysis Case Processing Summary`,
                    description: `Analysis Case Processing Summary`,
                    output_data: processingsSummary,
                    components: `Analysis Case Processing Summary`,
                });
            }

            /*
             * 📈 Classification Processing Summary Result 📈
             * */
            const classificationProcessingSummary = findTable(
                "classification_processing_summary"
            );
            if (classificationProcessingSummary) {
                const classificationProcessingSummaryId = await addAnalytic(
                    logId,
                    {
                        title: `Classification Processing Summary`,
                        note: "",
                    }
                );

                await addStatistic(classificationProcessingSummaryId, {
                    title: `Classification Processing Summary`,
                    description: `Classification Processing Summary`,
                    output_data: classificationProcessingSummary,
                    components: `Classification Processing Summary`,
                });
            }

            /*
             * 📊 Group Statistics Result 📊
             * */
            const groupStatistics = findTable("group_statistics");
            if (groupStatistics) {
                const groupStatisticsId = await addAnalytic(logId, {
                    title: `Group Statistics`,
                    note: "",
                });

                await addStatistic(groupStatisticsId, {
                    title: `Group Statistics`,
                    description: `Group Statistics`,
                    output_data: groupStatistics,
                    components: `Group Statistics`,
                });
            }

            /*
             * 📈 Tests of Equality of Group Means Result 📈
             * */
            const equalityTests = findTable("equality_tests");
            if (equalityTests) {
                const equalityTestsId = await addAnalytic(logId, {
                    title: `Tests of Equality of Group Means`,
                    note: "",
                });

                await addStatistic(equalityTestsId, {
                    title: `Tests of Equality of Group Means`,
                    description: `Tests of Equality of Group Means`,
                    output_data: equalityTests,
                    components: `Tests of Equality of Group Means`,
                });
            }

            /*
             * 🔍 Pooled Within-Groups Matrices Result 🔍
             * */
            const pooledWithinGroupsMatrices = findTable(
                "pooled_within_groups_matrices"
            );
            if (pooledWithinGroupsMatrices) {
                const pooledWithinGroupsMatricesId = await addAnalytic(logId, {
                    title: `Pooled Within-Groups Matrices`,
                    note: "",
                });

                await addStatistic(pooledWithinGroupsMatricesId, {
                    title: `Pooled Within-Groups Matrices`,
                    description: `Pooled Within-Groups Matrices`,
                    output_data: pooledWithinGroupsMatrices,
                    components: `Pooled Within-Groups Matrices`,
                });
            }

            /*
             * 📊 Covariance Matrices Result 📊
             * */
            const covarianceMatrices = findTable("covariance_matrices");
            if (covarianceMatrices) {
                const covarianceMatricesId = await addAnalytic(logId, {
                    title: `Covariance Matrices`,
                    note: "",
                });

                await addStatistic(covarianceMatricesId, {
                    title: `Covariance Matrices`,
                    description: `Covariance Matrices`,
                    output_data: covarianceMatrices,
                    components: `Covariance Matrices`,
                });
            }

            /*
             * 📈 Log Determinants Result 📈
             * */
            const logDeterminants = findTable("log_determinants");
            if (logDeterminants) {
                const logDeterminantsId = await addAnalytic(logId, {
                    title: `Log Determinants`,
                    note: "",
                });

                await addStatistic(logDeterminantsId, {
                    title: `Log Determinants`,
                    description: `Log Determinants`,
                    output_data: logDeterminants,
                    components: `Log Determinants`,
                });
            }

            /*
             * 🔍 Box's M Test Results 🔍
             * */
            const boxMTest = findTable("box_m_test");
            if (boxMTest) {
                const boxMTestId = await addAnalytic(logId, {
                    title: `Box's M Test Results`,
                    note: "",
                });

                await addStatistic(boxMTestId, {
                    title: `Box's M Test Results`,
                    description: `Box's M Test Results`,
                    output_data: boxMTest,
                    components: `Box's M Test Results`,
                });
            }

            /*
             * 📊 Prior Probabilities for Groups Result 📊
             * */
            const priorProbabilities = findTable("prior_probabilities");
            if (priorProbabilities) {
                const priorProbabilitiesId = await addAnalytic(logId, {
                    title: `Prior Probabilities for Groups`,
                    note: "",
                });

                await addStatistic(priorProbabilitiesId, {
                    title: `Prior Probabilities for Groups`,
                    description: `Prior Probabilities for Groups`,
                    output_data: priorProbabilities,
                    components: `Prior Probabilities for Groups`,
                });
            }

            /*
             * 📈 Classification Function Coefficients Result 📈
             * */
            const classificationFunctionCoefficients = findTable(
                "classification_function_coefficients"
            );
            if (classificationFunctionCoefficients) {
                const classificationFunctionCoefficientsId = await addAnalytic(
                    logId,
                    {
                        title: `Classification Function Coefficients`,
                        note: "",
                    }
                );

                await addStatistic(classificationFunctionCoefficientsId, {
                    title: `Classification Function Coefficients`,
                    description: `Classification Function Coefficients`,
                    output_data: classificationFunctionCoefficients,
                    components: `Classification Function Coefficients`,
                });
            }

            /*
             * 🧩 Canonical Discriminant Function Coefficients Result 🧩
             * */
            const canonicalDiscriminantFunctionCoefficients = findTable(
                "canonical_discriminant_function_coefficients"
            );
            if (canonicalDiscriminantFunctionCoefficients) {
                const canonicalDiscriminantFunctionCoefficientsId =
                    await addAnalytic(logId, {
                        title: `Canonical Discriminant Function Coefficients`,
                        note: "",
                    });

                await addStatistic(
                    canonicalDiscriminantFunctionCoefficientsId,
                    {
                        title: `Canonical Discriminant Function Coefficients`,
                        description: `Canonical Discriminant Function Coefficients`,
                        output_data: canonicalDiscriminantFunctionCoefficients,
                        components: `Canonical Discriminant Function Coefficients`,
                    }
                );
            }

            /*
             * 🔄 Standardized Canonical Discriminant Function Coefficients Result 🔄
             * */
            const standardizedCoefficients = findTable(
                "standardized_coefficients"
            );
            if (standardizedCoefficients) {
                const standardizedCoefficientsId = await addAnalytic(logId, {
                    title: `Standardized Canonical Discriminant Function Coefficients`,
                    note: "",
                });

                await addStatistic(standardizedCoefficientsId, {
                    title: `Standardized Canonical Discriminant Function Coefficients`,
                    description: `Standardized Canonical Discriminant Function Coefficients`,
                    output_data: standardizedCoefficients,
                    components: `Standardized Canonical Discriminant Function Coefficients`,
                });
            }

            /*
             * 📊 Functions at Group Centroids Result 📊
             * */
            const functionsAtGroupCentroids = findTable(
                "functions_at_group_centroids"
            );
            if (functionsAtGroupCentroids) {
                const functionsAtGroupCentroidsId = await addAnalytic(logId, {
                    title: `Functions at Group Centroids`,
                    note: "",
                });

                await addStatistic(functionsAtGroupCentroidsId, {
                    title: `Functions at Group Centroids`,
                    description: `Functions at Group Centroids`,
                    output_data: functionsAtGroupCentroids,
                    components: `Functions at Group Centroids`,
                });
            }

            /*
             * 📈 Structure Matrix Result 📈
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
             * 🔍 Stepwise Statistics Result 🔍
             * */
            const stepwiseStatistics = findTable("stepwise_statistics");
            if (stepwiseStatistics) {
                const stepwiseStatisticsId = await addAnalytic(logId, {
                    title: `Stepwise Statistics`,
                    note: "",
                });

                await addStatistic(stepwiseStatisticsId, {
                    title: `Stepwise Statistics`,
                    description: `Stepwise Statistics`,
                    output_data: stepwiseStatistics,
                    components: `Stepwise Statistics`,
                });
            }

            /*
             * 📊 Variables in the Analysis Result 📊
             * */
            const variablesInAnalysis = findTable("variables_in_analysis");
            if (variablesInAnalysis) {
                const variablesInAnalysisId = await addAnalytic(logId, {
                    title: `Variables in the Analysis`,
                    note: "",
                });

                await addStatistic(variablesInAnalysisId, {
                    title: `Variables in the Analysis`,
                    description: `Variables in the Analysis`,
                    output_data: variablesInAnalysis,
                    components: `Variables in the Analysis`,
                });
            }

            /*
             * 📈 Variables Not in the Analysis Result 📈
             * */
            const variablesNotInAnalysis = findTable(
                "variables_not_in_analysis"
            );
            if (variablesNotInAnalysis) {
                const variablesNotInAnalysisId = await addAnalytic(logId, {
                    title: `Variables Not in the Analysis`,
                    note: "",
                });

                await addStatistic(variablesNotInAnalysisId, {
                    title: `Variables Not in the Analysis`,
                    description: `Variables Not in the Analysis`,
                    output_data: variablesNotInAnalysis,
                    components: `Variables Not in the Analysis`,
                });
            }

            /*
             * 🔍 Wilks' Lambda Test Result 🔍
             * */
            const wilksLambdaTest = findTable("wilks_lambda_test");
            if (wilksLambdaTest) {
                const wilksLambdaTestId = await addAnalytic(logId, {
                    title: `Wilks' Lambda Test`,
                    note: "",
                });

                await addStatistic(wilksLambdaTestId, {
                    title: `Wilks' Lambda Test`,
                    description: `Wilks' Lambda Test`,
                    output_data: wilksLambdaTest,
                    components: `Wilks' Lambda Test`,
                });
            }

            /*
             * 📊 Eigenvalues Result 📊
             * */
            const eigenvalues = findTable("eigenvalues");
            if (eigenvalues) {
                const eigenvaluesId = await addAnalytic(logId, {
                    title: `Eigenvalues`,
                    note: "",
                });

                await addStatistic(eigenvaluesId, {
                    title: `Eigenvalues`,
                    description: `Eigenvalues`,
                    output_data: eigenvalues,
                    components: `Eigenvalues`,
                });
            }

            /*
             * 🔄 Casewise Statistics Result 🔄
             * */
            const casewiseStatistics = findTable("casewise_statistics");
            if (casewiseStatistics) {
                const casewiseStatisticsId = await addAnalytic(logId, {
                    title: `Casewise Statistics`,
                    note: "",
                });

                await addStatistic(casewiseStatisticsId, {
                    title: `Casewise Statistics`,
                    description: `Casewise Statistics`,
                    output_data: casewiseStatistics,
                    components: `Casewise Statistics`,
                });
            }

            /*
             * 📈 Classification Results 📈
             * */
            const classificationResults = findTable("classification_results");
            if (classificationResults) {
                const classificationResultsId = await addAnalytic(logId, {
                    title: `Classification Results`,
                    note: "",
                });

                await addStatistic(classificationResultsId, {
                    title: `Classification Results`,
                    description: `Classification Results`,
                    output_data: classificationResults,
                    components: `Classification Results`,
                });
            }
        };

        await discriminantAnalysisResult();
    } catch (e) {
        console.error(e);
    }
}
