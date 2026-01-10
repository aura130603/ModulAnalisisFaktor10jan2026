// roc-analysis-output.ts
import {RocAnalysisFinalResultType} from "@/components/Modals/Analyze/Classify/roc-analysis/types/roc-analysis-worker";
import {Table} from "@/types/Table";
import {useResultStore} from "@/stores/useResultStore";

export async function resultROCAnalysis({
    formattedResult,
}: RocAnalysisFinalResultType) {
    try {
        const { addLog, addAnalytic, addStatistic } = useResultStore.getState();

        const findTable = (key: string) => {
            const foundTable = formattedResult.tables.find(
                (table: Table) => table.key === key
            );
            return foundTable ? JSON.stringify({ tables: [foundTable] }) : null;
        };

        const rocAnalysisResult = async () => {
            /*
             * 🎉 Title Result 🎉
             * */
            const titleMessage = "ROC Analysis";
            const logId = await addLog({ log: titleMessage });
            const analyticId = await addAnalytic(logId, {
                title: `ROC Analysis Result`,
                note: "",
            });

            /*
             * 📊 Case Processing Summary Result 📊
             * */
            const caseProcessingSummary = findTable("case_processing_summary");
            if (caseProcessingSummary) {
                const caseProcessingId = await addAnalytic(logId, {
                    title: `Case Processing Summary`,
                    note: "",
                });

                await addStatistic(caseProcessingId, {
                    title: `Case Processing Summary`,
                    description: `ROC Analysis Case Processing Summary`,
                    output_data: caseProcessingSummary,
                    components: `Case Processing Summary`,
                });
            }

            /*
             * 📈 Area Under the ROC Curve Results 📈
             * */
            for (const table of formattedResult.tables) {
                if (table.key.startsWith("area_under_roc_curve_")) {
                    const variable = table.key.replace(
                        "area_under_roc_curve_",
                        ""
                    );
                    const areaUnderROCCurve = findTable(table.key);

                    if (areaUnderROCCurve) {
                        const rocCurveAreaId = await addAnalytic(logId, {
                            title: `Area Under the ROC Curve - ${variable}`,
                            note: "",
                        });

                        await addStatistic(rocCurveAreaId, {
                            title: `Area Under the ROC Curve`,
                            description: `Area Under the ROC Curve for ${variable}`,
                            output_data: areaUnderROCCurve,
                            components: `Area Under the ROC Curve`,
                        });
                    }
                }
            }

            /*
             * 📊 Classifier Evaluation Metrics Results 📊
             * */
            for (const table of formattedResult.tables) {
                if (table.key.startsWith("classifier_evaluation_metrics_")) {
                    const variable = table.key.replace(
                        "classifier_evaluation_metrics_",
                        ""
                    );
                    const classifierMetrics = findTable(table.key);

                    if (classifierMetrics) {
                        const classifierMetricsId = await addAnalytic(logId, {
                            title: `Classifier Evaluation Metrics - ${variable}`,
                            note: "",
                        });

                        await addStatistic(classifierMetricsId, {
                            title: `Classifier Evaluation Metrics`,
                            description: `Classifier Evaluation Metrics for ${variable}`,
                            output_data: classifierMetrics,
                            components: `Classifier Evaluation Metrics`,
                        });
                    }
                }
            }

            /*
             * 📈 Coordinates of the ROC Curve Results 📈
             * */
            for (const table of formattedResult.tables) {
                if (table.key.startsWith("coordinates_roc_")) {
                    const variable = table.key.replace("coordinates_roc_", "");
                    const rocCoordinates = findTable(table.key);

                    if (rocCoordinates) {
                        const rocCoordinatesId = await addAnalytic(logId, {
                            title: `ROC Curve Coordinates - ${variable}`,
                            note: "",
                        });

                        await addStatistic(rocCoordinatesId, {
                            title: `Coordinates of the ROC Curve`,
                            description: `ROC Curve Coordinates for ${variable}`,
                            output_data: rocCoordinates,
                            components: `Coordinates of the ROC Curve`,
                        });
                    }
                }
            }

            /*
             * 📊 Coordinates of the Precision-Recall Curve Results 📊
             * */
            for (const table of formattedResult.tables) {
                if (table.key.startsWith("coordinates_precision_recall_")) {
                    const variable = table.key.replace(
                        "coordinates_precision_recall_",
                        ""
                    );
                    const precisionRecallCoordinates = findTable(table.key);

                    if (precisionRecallCoordinates) {
                        const precisionRecallId = await addAnalytic(logId, {
                            title: `Precision-Recall Curve - ${variable}`,
                            note: "",
                        });

                        await addStatistic(precisionRecallId, {
                            title: `Coordinates of the Precision-Recall Curve`,
                            description: `Precision-Recall Curve Coordinates for ${variable}`,
                            output_data: precisionRecallCoordinates,
                            components: `Coordinates of the Precision-Recall Curve`,
                        });
                    }
                }
            }

            /*
             * 🎯 Overall Model Quality Results 🎯
             * */
            for (const table of formattedResult.tables) {
                if (table.key.startsWith("overall_model_quality_")) {
                    const variable = table.key.replace(
                        "overall_model_quality_",
                        ""
                    );
                    const modelQuality = findTable(table.key);

                    if (modelQuality) {
                        const modelQualityId = await addAnalytic(logId, {
                            title: `Overall Model Quality - ${variable}`,
                            note: "",
                        });

                        await addStatistic(modelQualityId, {
                            title: `Overall Model Quality`,
                            description: `Model Quality Assessment for ${variable}`,
                            output_data: modelQuality,
                            components: `Overall Model Quality`,
                        });
                    }
                }
            }
        };

        await rocAnalysisResult();
    } catch (e) {
        console.error(e);
    }
}
