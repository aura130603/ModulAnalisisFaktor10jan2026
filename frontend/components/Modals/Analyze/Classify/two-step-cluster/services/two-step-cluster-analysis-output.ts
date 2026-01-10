// two-step-cluster-analysis-output.ts
import {
    TwoStepClusterFinalResultType
} from "@/components/Modals/Analyze/Classify/two-step-cluster/types/two-step-cluste-worker";
import {Table} from "@/types/Table";
import {useResultStore} from "@/stores/useResultStore";

export async function resultTwoStepCluster({
    formattedResult,
}: TwoStepClusterFinalResultType) {
    try {
        const { addLog, addAnalytic, addStatistic } = useResultStore.getState();

        const findTable = (key: string) => {
            const foundTable = formattedResult.tables.find(
                (table: Table) => table.key === key
            );
            return foundTable ? JSON.stringify({ tables: [foundTable] }) : null;
        };

        const twoStepClusterResult = async () => {
            /*
             * 🎉 Title Result 🎉
             * */
            const titleMessage = "Two-Step Cluster Analysis";
            const logId = await addLog({ log: titleMessage });
            const analyticId = await addAnalytic(logId, {
                title: `Two-Step Cluster Analysis Result`,
                note: "",
            });

            /*
             * 📊 Model Summary Result 📊
             * */
            const modelSummary = findTable("model_summary");
            if (modelSummary) {
                const modelSummaryId = await addAnalytic(logId, {
                    title: `Model Summary`,
                    note: "",
                });

                await addStatistic(modelSummaryId, {
                    title: `Model Summary`,
                    description: `Model Summary for Two-Step Cluster Analysis`,
                    output_data: modelSummary,
                    components: `Model Summary`,
                });
            }

            /*
             * 📈 Cluster Profiles Result 📈
             * */
            const clusterProfilesCentroids = findTable(
                "cluster_profiles_centroids"
            );
            if (clusterProfilesCentroids) {
                const clusterProfilesId = await addAnalytic(logId, {
                    title: `Cluster Profiles`,
                    note: "",
                });

                await addStatistic(clusterProfilesId, {
                    title: `Cluster Profiles - Centroids`,
                    description: `Cluster Profiles - Centroids for Two-Step Cluster Analysis`,
                    output_data: clusterProfilesCentroids,
                    components: `Cluster Profiles - Centroids`,
                });
            }

            /*
             * 📊 Auto-Clustering Result 📊
             * */
            const autoClustering = findTable("auto_clustering");
            if (autoClustering) {
                const autoClusteringId = await addAnalytic(logId, {
                    title: `Auto-Clustering`,
                    note: "",
                });

                await addStatistic(autoClusteringId, {
                    title: `Auto-Clustering`,
                    description: `Auto-Clustering Statistics`,
                    output_data: autoClustering,
                    components: `Auto-Clustering`,
                });
            }

            /*
             * 📊 Cluster Distribution Result 📊
             * */
            const clusterDistribution = findTable("cluster_distribution");
            if (clusterDistribution) {
                const clusterDistributionId = await addAnalytic(logId, {
                    title: `Cluster Distribution`,
                    note: "",
                });

                await addStatistic(clusterDistributionId, {
                    title: `Cluster Distribution`,
                    description: `Cluster Distribution Statistics`,
                    output_data: clusterDistribution,
                    components: `Cluster Distribution`,
                });
            }

            /*
             * 📋 Clusters Result 📋
             * */
            const clusters = findTable("clusters");
            if (clusters) {
                const clustersId = await addAnalytic(logId, {
                    title: `Clusters`,
                    note: "",
                });

                await addStatistic(clustersId, {
                    title: `Clusters`,
                    description: `Clusters Information and Details`,
                    output_data: clusters,
                    components: `Clusters`,
                });
            }

            /*
             * 📊 Predictor Importance Result 📊
             * */
            const predictorImportance = findTable("predictor_importance");
            if (predictorImportance) {
                const predictorImportanceId = await addAnalytic(logId, {
                    title: `Predictor Importance`,
                    note: "",
                });

                await addStatistic(predictorImportanceId, {
                    title: `Predictor Importance`,
                    description: `Predictor Importance for Clustering Variables`,
                    output_data: predictorImportance,
                    components: `Predictor Importance`,
                });
            }

            /*
             * 📏 Cluster Sizes Result 📏
             * */
            const clusterSizes = findTable("cluster_sizes");
            if (clusterSizes) {
                const clusterSizesId = await addAnalytic(logId, {
                    title: `Cluster Sizes`,
                    note: "",
                });

                await addStatistic(clusterSizesId, {
                    title: `Cluster Sizes`,
                    description: `Cluster Sizes Summary`,
                    output_data: clusterSizes,
                    components: `Cluster Sizes`,
                });
            }

            /*
             * 📊 Cell Distribution Results 📊
             * */
            const cellDistributionTables = formattedResult.tables.filter(
                (table: Table) => table.key.startsWith("cell_distribution_")
            );

            if (cellDistributionTables.length > 0) {
                const cellDistributionId = await addAnalytic(logId, {
                    title: `Cell Distribution`,
                    note: "",
                });

                for (const cellDistTable of cellDistributionTables) {
                    const variableName = cellDistTable.title.replace(
                        "Cell Distribution: ",
                        ""
                    );

                    await addStatistic(cellDistributionId, {
                        title: `Cell Distribution: ${variableName}`,
                        description: `Cell Distribution for Variable: ${variableName}`,
                        output_data: JSON.stringify({
                            tables: [cellDistTable],
                        }),
                        components: `Cell Distribution: ${variableName}`,
                    });
                }
            }
        };

        await twoStepClusterResult();
    } catch (e) {
        console.error(e);
    }
}
