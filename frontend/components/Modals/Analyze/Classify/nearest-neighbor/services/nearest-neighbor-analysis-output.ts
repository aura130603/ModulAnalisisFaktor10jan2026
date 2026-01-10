// nearest-neighbor-analysis-output.ts
import {KNNFinalResultType} from "@/components/Modals/Analyze/Classify/nearest-neighbor/types/nearest-neighbor-worker";
import {Table} from "@/types/Table";
import {useResultStore} from "@/stores/useResultStore";

export async function resultNearestNeighbor({
    formattedResult,
}: KNNFinalResultType) {
    try {
        const { addLog, addAnalytic, addStatistic } = useResultStore.getState();

        const findTable = (key: string) => {
            const foundTable = formattedResult.tables.find(
                (table: Table) => table.key === key
            );
            return foundTable ? JSON.stringify({ tables: [foundTable] }) : null;
        };

        const nearestNeighborAnalysisResult = async () => {
            /*
             * 🎉 Title Result 🎉
             * */
            const titleMessage = "Nearest Neighbor Analysis";
            const logId = await addLog({ log: titleMessage });
            const analyticId = await addAnalytic(logId, {
                title: `Nearest Neighbor Analysis Result`,
                note: "",
            });

            /*
             * 📊 Case Processing Summary Result 📊
             * */
            const caseProcessingSummary = findTable("case_processing_summary");
            if (caseProcessingSummary) {
                const caseProcessingSummaryId = await addAnalytic(logId, {
                    title: `Case Processing Summary`,
                    note: "",
                });

                await addStatistic(caseProcessingSummaryId, {
                    title: `Case Processing Summary`,
                    description: `Case Processing Summary`,
                    output_data: caseProcessingSummary,
                    components: `Case Processing Summary`,
                });
            }

            /*
             * ⚙️ System Settings Result ⚙️
             * */
            const systemSettings = findTable("system_settings");
            if (systemSettings) {
                const systemSettingsId = await addAnalytic(logId, {
                    title: `System Settings`,
                    note: "",
                });

                await addStatistic(systemSettingsId, {
                    title: `System Settings`,
                    description: `System Settings`,
                    output_data: systemSettings,
                    components: `System Settings`,
                });
            }

            /*
             * 📈 Predictor Importance Result 📈
             * */
            const predictorImportance = findTable("predictor_importance");
            if (predictorImportance) {
                const predictorImportanceId = await addAnalytic(logId, {
                    title: `Predictor Importance`,
                    note: "",
                });

                await addStatistic(predictorImportanceId, {
                    title: `Predictor Importance`,
                    description: `Predictor Importance`,
                    output_data: predictorImportance,
                    components: `Predictor Importance`,
                });
            }

            /*
             * 🔍 Classification Table Result 🔍
             * */
            const classificationTable = findTable("classification_table");
            if (classificationTable) {
                const classificationTableId = await addAnalytic(logId, {
                    title: `Classification Table`,
                    note: "",
                });

                await addStatistic(classificationTableId, {
                    title: `Classification Table`,
                    description: `Classification Table`,
                    output_data: classificationTable,
                    components: `Classification Table`,
                });
            }

            /*
             * ❌ Error Summary Result ❌
             * */
            const errorSummary = findTable("error_summary");
            if (errorSummary) {
                const errorSummaryId = await addAnalytic(logId, {
                    title: `Error Summary`,
                    note: "",
                });

                await addStatistic(errorSummaryId, {
                    title: `Error Summary`,
                    description: `Error Summary`,
                    output_data: errorSummary,
                    components: `Error Summary`,
                });
            }

            /*
             * 🔬 Predictor Space Result 🔬
             * */
            const predictorSpace = findTable("predictor_space");
            if (predictorSpace) {
                const predictorSpaceId = await addAnalytic(logId, {
                    title: `Predictor Space`,
                    note: "",
                });

                await addStatistic(predictorSpaceId, {
                    title: `Predictor Space`,
                    description: `Predictor Space`,
                    output_data: predictorSpace,
                    components: `Predictor Space`,
                });
            }

            /*
             * 👥 Nearest Neighbors Result 👥
             * */
            const nearestNeighbors = findTable("nearest_neighbors");
            if (nearestNeighbors) {
                const nearestNeighborsId = await addAnalytic(logId, {
                    title: `k Nearest Neighbors and Distances`,
                    note: "",
                });

                await addStatistic(nearestNeighborsId, {
                    title: `k Nearest Neighbors and Distances`,
                    description: `k Nearest Neighbors and Distances`,
                    output_data: nearestNeighbors,
                    components: `k Nearest Neighbors and Distances`,
                });
            }

            /*
             * 📊 Peers Chart Data Result 📊
             * */
            const peersChart = findTable("peers_chart");
            if (peersChart) {
                const peersChartId = await addAnalytic(logId, {
                    title: `Peers Chart Data`,
                    note: "",
                });

                await addStatistic(peersChartId, {
                    title: `Peers Chart Data`,
                    description: `Peers Chart Data`,
                    output_data: peersChart,
                    components: `Peers Chart Data`,
                });
            }

            /*
             * 🗺️ Quadrant Map Data Result 🗺️
             * */
            const quadrantMap = findTable("quadrant_map");
            if (quadrantMap) {
                const quadrantMapId = await addAnalytic(logId, {
                    title: `Quadrant Map Data`,
                    note: "",
                });

                await addStatistic(quadrantMapId, {
                    title: `Quadrant Map Data`,
                    description: `Quadrant Map Data`,
                    output_data: quadrantMap,
                    components: `Quadrant Map Data`,
                });
            }
        };

        await nearestNeighborAnalysisResult();
    } catch (e) {
        console.error(e);
    }
}
