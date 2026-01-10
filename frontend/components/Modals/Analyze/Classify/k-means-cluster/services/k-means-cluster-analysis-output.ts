import { KMeansClusterFinalResultType } from "@/components/Modals/Analyze/Classify/k-means-cluster/types/k-means-cluster-worker";
import { Table } from "@/types/Table";
import { Variable } from "@/types/Variable";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useResultStore } from "@/stores/useResultStore";

export async function resultKMeans({
    formattedResult,
    configData,
    variables,
}: KMeansClusterFinalResultType) {
    try {
        const { addLog, addAnalytic, addStatistic } = useResultStore.getState();

        const findTable = (key: string): Table | undefined => {
            return formattedResult.tables.find(
                (table: Table) => table.key === key
            );
        };

        const kMeansClusterAnalysisResult = async () => {
            /*
             * 🎉 Title Result 🎉
             * */
            const titleMessage = "K-Means Cluster Analysis";
            const logId = await addLog({ log: titleMessage });
            const analyticId = await addAnalytic(logId, {
                title: `K-Means Cluster Analysis Result`,
                note: "",
            });

            /*
             * 📊 Initial Cluster Centers Result 📊
             * */
            const initialClusterCentersTable = findTable(
                "initial_cluster_centers"
            );
            if (initialClusterCentersTable) {
                const initialClusterCentersId = await addAnalytic(logId, {
                    title: initialClusterCentersTable.title,
                    note: initialClusterCentersTable.note || "",
                });

                await addStatistic(initialClusterCentersId, {
                    title: initialClusterCentersTable.title,
                    description:
                        initialClusterCentersTable.interpretation ||
                        `Initial Cluster Centers`,
                    output_data: JSON.stringify({
                        tables: [initialClusterCentersTable],
                    }),
                    components: `Initial Cluster Centers`,
                });
            }

            /*
             * 📈 Iteration History Result 📈
             * */
            const iterationHistoryTable = findTable("iteration_history");
            if (iterationHistoryTable) {
                const iterationHistoryId = await addAnalytic(logId, {
                    title: iterationHistoryTable.title,
                    note: iterationHistoryTable.note || "",
                });

                await addStatistic(iterationHistoryId, {
                    title: iterationHistoryTable.title,
                    description:
                        iterationHistoryTable.interpretation ||
                        `Iteration History`,
                    output_data: JSON.stringify({
                        tables: [iterationHistoryTable],
                    }),
                    components: `Iteration History`,
                });
            }

            /*
             * 👥 Cluster Membership Result 👥
             * */
            const clusterMembershipTable = findTable("cluster_membership");
            if (clusterMembershipTable) {
                const clusterMembershipId = await addAnalytic(logId, {
                    title: clusterMembershipTable.title,
                    note: clusterMembershipTable.note || "",
                });

                await addStatistic(clusterMembershipId, {
                    title: clusterMembershipTable.title,
                    description:
                        clusterMembershipTable.interpretation ||
                        `Cluster Membership`,
                    output_data: JSON.stringify({
                        tables: [clusterMembershipTable],
                    }),
                    components: `Cluster Membership`,
                });

                // Save Cluster Membership and Distance as variables if enabled
                if (
                    configData.save.ClusterMembership ||
                    configData.save.DistanceClusterCenter
                ) {
                    await saveClusterResults(
                        formattedResult,
                        configData,
                        variables
                    );
                }
            }

            /*
             * 📊 Final Cluster Centers Result 📊
             * */
            const finalClusterCentersTable = findTable("final_cluster_centers");
            if (finalClusterCentersTable) {
                const finalClusterCentersId = await addAnalytic(logId, {
                    title: finalClusterCentersTable.title,
                    note: finalClusterCentersTable.note || "",
                });

                await addStatistic(finalClusterCentersId, {
                    title: finalClusterCentersTable.title,
                    description:
                        finalClusterCentersTable.interpretation ||
                        `Final Cluster Centers`,
                    output_data: JSON.stringify({
                        tables: [finalClusterCentersTable],
                    }),
                    components: `Final Cluster Centers`,
                });
            }

            /*
             * 📏 Distances between Final Cluster Centers Result 📏
             * */
            const distancesBetweenCentersTable = findTable(
                "distances_between_centers"
            );
            if (distancesBetweenCentersTable) {
                const distancesBetweenCentersId = await addAnalytic(logId, {
                    title: distancesBetweenCentersTable.title,
                    note: distancesBetweenCentersTable.note || "",
                });

                await addStatistic(distancesBetweenCentersId, {
                    title: distancesBetweenCentersTable.title,
                    description:
                        distancesBetweenCentersTable.interpretation ||
                        `Distances between Final Cluster Centers`,
                    output_data: JSON.stringify({
                        tables: [distancesBetweenCentersTable],
                    }),
                    components: `Distances between Final Cluster Centers`,
                });
            }

            /*
             * 📊 ANOVA Table Result 📊
             * */
            const anovaTable = findTable("anova");
            if (anovaTable) {
                const anovaTableId = await addAnalytic(logId, {
                    title: anovaTable.title,
                    note: anovaTable.note || "",
                });

                await addStatistic(anovaTableId, {
                    title: anovaTable.title,
                    description: anovaTable.interpretation || `ANOVA Table`,
                    output_data: JSON.stringify({ tables: [anovaTable] }),
                    components: `ANOVA Table`,
                });
            }

            /*
             * 📈 Number of Cases in each Cluster Result 📈
             * */
            const numberOfCasesTable = findTable("number_of_cases");
            if (numberOfCasesTable) {
                const numberOfCasesId = await addAnalytic(logId, {
                    title: numberOfCasesTable.title,
                    note: numberOfCasesTable.note || "",
                });

                await addStatistic(numberOfCasesId, {
                    title: numberOfCasesTable.title,
                    description:
                        numberOfCasesTable.interpretation ||
                        `Number of Cases in each Cluster`,
                    output_data: JSON.stringify({
                        tables: [numberOfCasesTable],
                    }),
                    components: `Number of Cases in each Cluster`,
                });
            }

            /*
             * ❗ Error Table Result ❗
             * */
            const errorTable = findTable("error_table");
            if (errorTable) {
                const errorTableId = await addAnalytic(logId, {
                    title: errorTable.title,
                    note: errorTable.note || "",
                });

                await addStatistic(errorTableId, {
                    title: errorTable.title,
                    description:
                        errorTable.interpretation ||
                        "Errors logs from the analysis.",
                    output_data: JSON.stringify({ tables: [errorTable] }),
                    components: "Errors Logs",
                });
            }

            /*
             * 📊 Cluster Plot Result 📊
             * */
            if (formattedResult.charts && formattedResult.charts.length > 0) {
                for (const chart of formattedResult.charts) {
                    const chartId = await addAnalytic(logId, {
                        title: chart.chartMetadata.title,
                        note: chart.chartMetadata.notes || "",
                    });

                    await addStatistic(chartId, {
                        title: chart.chartMetadata.title,
                        description: chart.chartMetadata.description || "",
                        output_data: JSON.stringify({ charts: [chart] }),
                        components: chart.chartType,
                    });
                }
            }
        };

        await kMeansClusterAnalysisResult();
    } catch (e) {
        console.error(e);
    }
}

/**
 * Save cluster membership and distance from cluster center as new variables
 */
async function saveClusterResults(
    formattedResult: any,
    configData: any,
    variables: Variable[]
) {
    const { addVariable } = useVariableStore.getState();
    const { updateCells } = useDataStore.getState();

    // Find the cluster membership table
    const clusterMembershipTable = formattedResult.tables.find(
        (table: Table) => table.key === "cluster_membership"
    );

    if (
        !clusterMembershipTable ||
        !clusterMembershipTable.rows ||
        clusterMembershipTable.rows.length === 0
    ) {
        console.error("No cluster membership data found for saving variables");
        return;
    }

    // Get next column index
    let nextColumnIndex = variables.length;

    // Generate unique variable names
    const generateUniqueName = (prefix: string) => {
        let idx = 1;
        let name = `${prefix}_${idx}`;
        while (variables.some((v) => v.name === name)) {
            idx++;
            name = `${prefix}_${idx}`;
        }
        return name;
    };

    // Extract cluster membership values and distance values
    const clusterValues: string[] = [];
    const distanceValues: string[] = [];

    clusterMembershipTable.rows.forEach((row: any) => {
        if (row.cluster) {
            clusterValues.push(row.cluster.toString());
        }
        if (row.distance) {
            distanceValues.push(row.distance.toString());
        }
    });

    // Save cluster membership as a new variable
    if (configData.save.ClusterMembership && clusterValues.length > 0) {
        const clusterVarName = generateUniqueName("CM");

        const newClusterVariable: Partial<Variable> = {
            name: clusterVarName,
            columnIndex: nextColumnIndex,
            type: "NUMERIC",
            label: "Cluster Membership",
            values: [],
            missing: null,
            measure: "nominal",
            width: 8,
            decimals: 0,
            columns: 200,
            align: "right",
        };

        await addVariable(newClusterVariable);

        // Create updates for cluster values
        const clusterUpdates = clusterValues.map((value, rowIndex) => ({
            row: rowIndex,
            col: nextColumnIndex,
            value: value,
        }));

        if (clusterUpdates.length > 0) {
            await updateCells(clusterUpdates);
        }

        nextColumnIndex++;
    }

    // Save distance from cluster center as a new variable
    if (configData.save.DistanceClusterCenter && distanceValues.length > 0) {
        const distanceVarName = generateUniqueName("CD");

        const newDistanceVariable: Partial<Variable> = {
            name: distanceVarName,
            columnIndex: nextColumnIndex,
            type: "NUMERIC",
            label: "Distance from Cluster Center",
            values: [],
            missing: null,
            measure: "scale",
            width: 8,
            decimals: 3,
            columns: 200,
            align: "right",
        };

        await addVariable(newDistanceVariable);

        // Create updates for distance values
        const distanceUpdates = distanceValues.map((value, rowIndex) => ({
            row: rowIndex,
            col: nextColumnIndex,
            value: value,
        }));

        if (distanceUpdates.length > 0) {
            await updateCells(distanceUpdates);
        }
    }
}
