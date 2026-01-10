// clustering-formatter.ts
import {ensureEnoughHeaders, formatDisplayNumber} from "@/hooks/useFormatter";
import {ResultJson, Table} from "@/types/Table";

// Define interfaces for Centroid structure
interface CentroidData {
    mean: number;
    std_deviation: number;
}

interface Centroid {
    variable: string;
    data: CentroidData;
}

// Interface for Auto-Clustering point
interface AutoClusteringPoint {
    number_of_clusters: number;
    bayesian_criterion: number;
    bic_change?: number; // Optional since it's null for the first row
    ratio_of_bic_changes?: number; // Optional
    ratio_of_distance_measures: number;
}

// Interface for Cluster Distribution cluster
interface ClusterDistributionCluster {
    n: number;
    percent_of_combined: number;
    percent_of_total: number;
}

// Interface for Cluster Input
interface ClusterInput {
    variable: string;
    importance: number;
    value: number;
}

// Interface for Cluster
interface Cluster {
    label?: string; // Optional
    description?: string; // Optional
    size: number;
    inputs: ClusterInput[];
}

// Interface for Cluster Size Data
interface ClusterSizeData {
    cluster_number: number | string;
    percent_values1: number;
    // Add other properties if known from data structure
}

// Interface for Frequency Data Point in Cell Distribution
interface FrequencyPoint {
    x_value: number;
    frequency: number;
}

// Interface for Cell Distribution
interface CellDistribution {
    variable: string;
    distribution: {
        frequency_data: FrequencyPoint[];
    };
}

export function transformClusteringResult(data: any): ResultJson {
    const resultJson: ResultJson = {
        tables: [],
    };

    // 1. Model Summary
    if (data.model_summary) {
        const ms = data.model_summary;
        const table: Table = {
            key: "model_summary",
            title: "Model Summary",
            columnHeaders: [
                { header: "Algorithm" },
                { header: "Inputs" },
                { header: "Clusters" },
                { header: "Silhouette" },
                { header: "Quality" },
            ],
            rows: [
                {
                    rowHeader: [],
                    Algorithm: ms.algorithm,
                    Inputs: ms.inputs,
                    Clusters: ms.clusters,
                    Silhouette: formatDisplayNumber(ms.silhouette),
                    Quality: ms.quality,
                },
            ],
        };

        resultJson.tables.push(ensureEnoughHeaders(table));
    }

    // 2. Cluster Profiles - Centroids
    if (data.cluster_profiles) {
        const cp = data.cluster_profiles;

        // Group centroids by base variable name (without _cluster suffix)
        const variableGroups = new Map<string, Array<any>>();

        cp.centroids.forEach((centroid: Centroid) => {
            const variableName = centroid.variable;
            // Check if the variable has a _cluster suffix
            const match = variableName.match(/^([^_]+)(?:_cluster(\d+))?$/);

            if (match) {
                const baseVariable = match[1]; // Base variable name
                const clusterNum = match[2]; // Cluster number or undefined
                const group = variableGroups.get(baseVariable);

                if (!group) {
                    variableGroups.set(baseVariable, []);
                }

                // Use push on the retrieved or newly created array
                variableGroups.get(baseVariable)?.push({
                    variable: variableName,
                    clusterNum: clusterNum ? parseInt(clusterNum) : null,
                    data: centroid.data,
                });
            }
        });

        // Filter out base variables that have actual data
        const baseVariables = Array.from(variableGroups.keys()).filter(
            (key) => {
                const group = variableGroups.get(key);
                return group?.some((item) => item.clusterNum === null);
            }
        );

        // Create headers
        const columnHeaders = [{ header: "Cluster" }];

        // Add column headers for each base variable
        baseVariables.forEach((variable) => {
            columnHeaders.push({ header: `${variable}\nMean` });
            columnHeaders.push({ header: `${variable}\nStd. Deviation` });
        });

        const table: Table = {
            key: "cluster_profiles_centroids",
            title: "Cluster Profiles\nCentroids",
            columnHeaders,
            rows: [],
        };

        // Determine the number of clusters
        const numClusters = data.cluster_distribution?.clusters?.length || 0;

        // Add rows for each cluster
        for (let i = 0; i < numClusters; i++) {
            const clusterNum = i + 1;
            const rowData: any = {
                rowHeader: [clusterNum.toString()],
            };

            // Add data for each variable
            baseVariables.forEach((baseVariable) => {
                const group = variableGroups.get(baseVariable);
                const clusterData = group?.find(
                    (item) => item.clusterNum === clusterNum
                );

                if (clusterData) {
                    rowData[`${baseVariable}\nMean`] = formatDisplayNumber(
                        clusterData.data.mean
                    );
                    rowData[`${baseVariable}\nStd. Deviation`] =
                        formatDisplayNumber(clusterData.data.std_deviation);
                } else {
                    rowData[`${baseVariable}\nMean`] = null;
                    rowData[`${baseVariable}\nStd. Deviation`] = null;
                }
            });

            table.rows.push(rowData);
        }

        // Add "Combined" row
        const combinedRow: any = {
            rowHeader: ["Combined"],
        };

        baseVariables.forEach((baseVariable) => {
            // Get the combined data (without cluster suffix)
            const group = variableGroups.get(baseVariable);
            const combinedData = group?.find((item) => item.clusterNum === null);

            if (combinedData) {
                combinedRow[`${baseVariable}\nMean`] = formatDisplayNumber(
                    combinedData.data.mean
                );
                combinedRow[`${baseVariable}\nStd. Deviation`] =
                    formatDisplayNumber(combinedData.data.std_deviation);
            } else {
                combinedRow[`${baseVariable}\nMean`] = null;
                combinedRow[`${baseVariable}\nStd. Deviation`] = null;
            }
        });

        table.rows.push(combinedRow);

        resultJson.tables.push(ensureEnoughHeaders(table));
    }

    // 3. Auto-Clustering
    if (data.auto_clustering) {
        const ac = data.auto_clustering;
        const table: Table = {
            key: "auto_clustering",
            title: "Auto-Clustering",
            columnHeaders: [
                { header: "Number of Clusters" },
                { header: "Schwarz's Bayesian Criterion (BIC)" },
                { header: "BIC Change" },
                { header: "Ratio of BIC Changes" },
                { header: "Ratio of Distance Measures" },
            ],
            rows: [],
        };

        ac.cluster_analysis.forEach(
            (point: AutoClusteringPoint, index: number) => {
                const row: any = {
                    rowHeader: [],
                    "Number of Clusters": point.number_of_clusters,
                    "Schwarz's Bayesian Criterion (BIC)": formatDisplayNumber(
                        point.bayesian_criterion
                    ),
                };

                // Add BIC Change (null for the first row)
                if (index > 0 && point.bic_change !== undefined) {
                    row["BIC Change"] = formatDisplayNumber(point.bic_change);
                } else {
                    row["BIC Change"] = null;
                }

                // Add Ratio of BIC Changes (null for the first row)
                if (index > 0 && point.ratio_of_bic_changes !== undefined) {
                    row["Ratio of BIC Changes"] = formatDisplayNumber(
                        point.ratio_of_bic_changes
                    );
                } else {
                    row["Ratio of BIC Changes"] = null;
                }

                // Add Ratio of Distance Measures
                row["Ratio of Distance Measures"] = formatDisplayNumber(
                    point.ratio_of_distance_measures
                );

                table.rows.push(row);
            }
        );

        // Add footnotes
        table.rows.push({
            rowHeader: [
                "a. The changes are from the previous number of clusters in the table.",
            ],
            "Number of Clusters": null,
            "Schwarz's Bayesian Criterion (BIC)": null,
            "BIC Change": null,
            "Ratio of BIC Changes": null,
            "Ratio of Distance Measures": null,
        });

        table.rows.push({
            rowHeader: [
                "b. The ratios of changes are relative to the change for the two cluster solution.",
            ],
            "Number of Clusters": null,
            "Schwarz's Bayesian Criterion (BIC)": null,
            "BIC Change": null,
            "Ratio of BIC Changes": null,
            "Ratio of Distance Measures": null,
        });

        table.rows.push({
            rowHeader: [
                "c. The ratios of distance measures are based on the current number of clusters against the previous number of clusters.",
            ],
            "Number of Clusters": null,
            "Schwarz's Bayesian Criterion (BIC)": null,
            "BIC Change": null,
            "Ratio of BIC Changes": null,
            "Ratio of Distance Measures": null,
        });

        resultJson.tables.push(ensureEnoughHeaders(table));
    }

    // 4. Cluster Distribution
    if (data.cluster_distribution) {
        const cd = data.cluster_distribution;
        const table: Table = {
            key: "cluster_distribution",
            title: "Cluster Distribution",
            columnHeaders: [
                { header: "Cluster" },
                { header: "N" },
                { header: "% of Combined" },
                { header: "% of Total" },
            ],
            rows: [],
        };

        // Add rows for each cluster
        cd.clusters.forEach((cluster: ClusterDistributionCluster, index: number) => {
            table.rows.push({
                rowHeader: [(index + 1).toString()], // Use index + 1 for cluster number
                N: cluster.n,
                "% of Combined": formatDisplayNumber(
                    cluster.percent_of_combined
                ),
                "% of Total": formatDisplayNumber(cluster.percent_of_total),
            });
        });

        // Add Combined/Total row
        table.rows.push({
            rowHeader: ["Combined"],
            N: cd.total.n,
            "% of Combined": formatDisplayNumber(cd.total.percent_of_combined),
            "% of Total": formatDisplayNumber(cd.total.percent_of_total),
        });

        // Add Total for display purposes
        table.rows.push({
            rowHeader: ["Total"],
            N: cd.total.n,
            "% of Combined": formatDisplayNumber(100.0),
            "% of Total": formatDisplayNumber(100.0),
        });

        resultJson.tables.push(ensureEnoughHeaders(table));
    }

    // 5. Clusters
    if (data.clusters) {
        const clusters: Cluster[] = data.clusters;

        // Create input variables list
        const inputVariables =
            clusters.length > 0
                ? clusters[0].inputs.map((input: ClusterInput) => input.variable)
                : [];

        const table: Table = {
            key: "clusters",
            title: "Clusters",
            columnHeaders: [
                { header: "Cluster" },
                { header: "" },
                ...Array.from({ length: clusters.length }, (_, i) => ({
                    header: (i + 1).toString(),
                })),
            ],
            rows: [],
        };

        // Label row
        table.rows.push({
            rowHeader: ["Label"],
            ...Object.fromEntries(
                clusters.map((cluster: Cluster, i: number) => [
                    (i + 1).toString(),
                    cluster.label || null,
                ])
            ),
        });

        // Description row
        table.rows.push({
            rowHeader: ["Description"],
            ...Object.fromEntries(
                clusters.map((cluster: Cluster, i: number) => [
                    (i + 1).toString(),
                    cluster.description || null,
                ])
            ),
        });

        // Size row
        table.rows.push({
            rowHeader: ["Size"],
            ...Object.fromEntries(
                clusters.map((cluster: Cluster, i: number) => [
                    (i + 1).toString(),
                    `${formatDisplayNumber(cluster.size)}%`,
                ])
            ),
        });

        // Inputs rows (one for each input variable)
        inputVariables.forEach((variable) => {
            const rowData: any = {
                rowHeader: ["Inputs", variable],
            };

            // Add value for each cluster
            clusters.forEach((cluster: Cluster, i: number) => {
                const input = cluster.inputs.find(
                    (input) => input.variable === variable
                );
                // Safely access value only if input is found
                rowData[(i + 1).toString()] = input
                    ? formatDisplayNumber(input.value) 
                    : null;
            });

            table.rows.push(rowData);
        });

        resultJson.tables.push(ensureEnoughHeaders(table));
    }

    // 6. Predictor Importance
    if (data.predictor_importance) {
        const pi = data.predictor_importance;
        const table: Table = {
            key: "predictor_importance",
            title: "Predictor Importance",
            columnHeaders: [{ header: "Variable" }, { header: "Importance" }],
            rows: [],
        };

        // Sort predictors by importance (descending)
        const sortedPredictors = [...pi.predictors].sort(
            (a: ClusterInput, b: ClusterInput) => b.importance - a.importance // Assuming predictors are ClusterInput type
        );

        // Add rows for each predictor
        sortedPredictors.forEach((predictor: ClusterInput) => {
            table.rows.push({
                rowHeader: [predictor.variable],
                Importance: formatDisplayNumber(predictor.importance),
            });
        });

        resultJson.tables.push(ensureEnoughHeaders(table));
    }

    // 7. Cluster Sizes
    if (data.cluster_sizes) {
        const cs = data.cluster_sizes;
        const table: Table = {
            key: "cluster_sizes",
            title: "Cluster Sizes",
            columnHeaders: [{ header: "Statistic" }, { header: "Value" }],
            rows: [],
        };

        // Add smallest cluster size
        const smallestCluster = cs.clusters.reduce(
            (min: ClusterSizeData, current: ClusterSizeData) =>
                current.percent_values1 < min.percent_values1 ? current : min,
            cs.clusters[0]
        );

        table.rows.push({
            rowHeader: ["Size of Smallest Cluster"],
            Value: `${smallestCluster.cluster_number} (${formatDisplayNumber(
                smallestCluster.percent_values1
            )}%)`,
        });

        // Add largest cluster size
        const largestCluster = cs.clusters.reduce(
            (max: ClusterSizeData, current: ClusterSizeData) =>
                current.percent_values1 > max.percent_values1 ? current : max,
            cs.clusters[0]
        );

        table.rows.push({
            rowHeader: ["Size of Largest Cluster"],
            Value: `${largestCluster.cluster_number} (${formatDisplayNumber(
                largestCluster.percent_values1
            )}%)`,
        });

        // Add ratio of sizes
        const ratio =
            largestCluster.percent_values1 / smallestCluster.percent_values1;
        table.rows.push({
            rowHeader: ["Ratio of Sizes: Largest Cluster to Smallest Cluster"],
            Value: formatDisplayNumber(ratio),
        });

        resultJson.tables.push(ensureEnoughHeaders(table));
    }

    // 8. Cell Distribution
    if (data.cell_distribution) {
        data.cell_distribution.forEach((cellDist: CellDistribution, index: number) => {
            const variable = cellDist.variable;
            const distribution = cellDist.distribution;

            const table: Table = {
                key: `cell_distribution_${index}`,
                title: `Cell Distribution: ${variable}`,
                columnHeaders: [{ header: "X Value" }, { header: "Frequency" }],
                rows: distribution.frequency_data.map((point: FrequencyPoint) => ({
                    rowHeader: [],
                    "X Value": formatDisplayNumber(point.x_value),
                    Frequency: formatDisplayNumber(point.frequency),
                })),
            };

            resultJson.tables.push(ensureEnoughHeaders(table));
        });
    }

    return resultJson;
}
