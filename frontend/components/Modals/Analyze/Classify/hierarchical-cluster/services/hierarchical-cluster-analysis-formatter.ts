// hierarchical-clustering-formatter.ts
import {formatDisplayNumber} from "@/hooks/useFormatter";
import {ResultJson, Table} from "@/types/Table";

export function transformHierClusResult(data: any): ResultJson {
    const resultJson: ResultJson = {
        tables: [],
    };

    // 1. Case Processing Summary
    if (data.case_processing_summary) {
        const table: Table = {
            key: "case_processing_summary",
            title: "Case Processing Summary",
            columnHeaders: [
                {
                    header: "Cases",
                    key: "cases",
                    children: [
                        {
                            header: "Valid",
                            key: "valid",
                            children: [
                                { header: "N", key: "valid_n" },
                                { header: "Percent", key: "valid_percent" },
                            ],
                        },
                        {
                            header: "Missing",
                            key: "missing",
                            children: [
                                { header: "N", key: "missing_n" },
                                { header: "Percent", key: "missing_percent" },
                            ],
                        },
                        {
                            header: "Total",
                            key: "total",
                            children: [
                                { header: "N", key: "total_n" },
                                { header: "Percent", key: "total_percent" },
                            ],
                        },
                    ],
                },
            ],
            rows: [
                {
                    rowHeader: [""],
                    valid_n: formatDisplayNumber(
                        data.case_processing_summary.valid_cases
                    ),
                    valid_percent: formatDisplayNumber(
                        data.case_processing_summary.valid_percent
                    ),
                    missing_n: formatDisplayNumber(
                        data.case_processing_summary.missing_cases
                    ),
                    missing_percent: formatDisplayNumber(
                        data.case_processing_summary.missing_percent
                    ),
                    total_n: formatDisplayNumber(
                        data.case_processing_summary.total_cases
                    ),
                    total_percent: formatDisplayNumber(
                        data.case_processing_summary.total_percent
                    ),
                },
            ],
        };

        // Add footnote for the clustering method
        if (data.executed_functions && data.executed_functions.length > 0) {
            const method = data.executed_functions.find((fn: string) =>
                fn.includes("Linkage")
            );
            if (method) {
                table.rows.push({
                    rowHeader: [`a. ${method}`],
                });
            }
        }

        resultJson.tables.push(table);
    }

    // 2. Proximity Matrix
    if (
        data.proximity_matrix &&
        data.proximity_matrix.distances &&
        data.proximity_matrix.distances.length > 0
    ) {
        // Extract unique case names to build header while preserving original order
        const caseNames: string[] = [];
        data.proximity_matrix.distances.forEach((entry: any) => {
            if (!caseNames.includes(entry.case1)) {
                caseNames.push(entry.case1);
            }
            if (!caseNames.includes(entry.case2)) {
                caseNames.push(entry.case2);
            }
        });

        const uniqueCases = caseNames; // No sorting, preserve original order

        const table: Table = {
            key: "proximity_matrix",
            title: "Proximity Matrix",
            columnHeaders: [
                { header: "Case", key: "case" },
                ...uniqueCases.map((caseName) => ({
                    header: caseName, // Removed the index prefix
                    key: `case_${caseName}`, // Using case name as key instead of index
                })),
            ],
            rows: [],
        };

        // Add subtitle description
        table.rows.push({
            rowHeader: ["This is a dissimilarity matrix"],
        });

        // Build distance matrix
        uniqueCases.forEach((caseName) => {
            const rowData: any = {
                rowHeader: [caseName], // Removed the index prefix
            };

            uniqueCases.forEach((otherCase) => {
                // Find the appropriate distance entry
                let distanceValue: number | null = null;

                if (caseName === otherCase) {
                    distanceValue = 0; // diagonal is always 0
                } else {
                    // Search for this pair in the distances array
                    const entry = data.proximity_matrix.distances.find(
                        (d: any) =>
                            (d.case1 === caseName && d.case2 === otherCase) ||
                            (d.case1 === otherCase && d.case2 === caseName)
                    );

                    if (entry) {
                        distanceValue = entry.distance;
                    }
                }

                rowData[`case_${otherCase}`] = // Using case name instead of index
                    distanceValue !== null
                        ? formatDisplayNumber(distanceValue)
                        : null;
            });

            table.rows.push(rowData);
        });

        resultJson.tables.push(table);
    }

    // 3. Agglomeration Schedule
    if (data.agglomeration_schedule && data.agglomeration_schedule.stages) {
        const table: Table = {
            key: "agglomeration_schedule",
            title: "Agglomeration Schedule",
            columnHeaders: [
                { header: "Stage", key: "stage" },
                {
                    header: "Cluster Combined",
                    key: "cluster_combined",
                    children: [
                        { header: "Cluster 1", key: "cluster1" },
                        { header: "Cluster 2", key: "cluster2" },
                    ],
                },
                { header: "Coefficients", key: "coefficients" },
                {
                    header: "Stage Cluster First Appears",
                    key: "first_appears",
                    children: [
                        { header: "Cluster 1", key: "first_appears1" },
                        { header: "Cluster 2", key: "first_appears2" },
                    ],
                },
                { header: "Next Stage", key: "next_stage" },
            ],
            rows: [],
        };

        data.agglomeration_schedule.stages.forEach((stage: any) => {
            table.rows.push({
                rowHeader: [formatDisplayNumber(stage.stage)],
                cluster1: formatDisplayNumber(stage.cluster1),
                cluster2: formatDisplayNumber(stage.cluster2),
                coefficients: formatDisplayNumber(stage.coefficient),
                first_appears1: formatDisplayNumber(stage.first_appears1),
                first_appears2: formatDisplayNumber(stage.first_appears2),
                next_stage: formatDisplayNumber(stage.next_stage),
            });
        });

        resultJson.tables.push(table);
    }

    // 4. Cluster Memberships
    if (data.cluster_memberships && data.cluster_memberships.length > 0) {
        // Sort by number of clusters ascending
        const sortedMemberships = [...data.cluster_memberships].sort(
            (a, b) => a.num_clusters - b.num_clusters
        );

        const table: Table = {
            key: "cluster_memberships",
            title: "Cluster Membership",
            columnHeaders: [
                { header: "Case", key: "case" },
                ...sortedMemberships.map((membership) => ({
                    header: `${membership.num_clusters} Clusters`,
                    key: `clusters_${membership.num_clusters}`,
                })),
            ],
            rows: [],
        };

        // Determine maximum number of cases
        const maxCases = Math.max(
            ...sortedMemberships.map((m) => m.case_assignments.length)
        );

        // Fill in cluster assignments for each case
        for (let caseIndex = 0; caseIndex < maxCases; caseIndex++) {
            const rowData: any = {
                rowHeader: [`Case ${caseIndex + 1}`],
            };

            sortedMemberships.forEach((membership) => {
                if (caseIndex < membership.case_assignments.length) {
                    rowData[`clusters_${membership.num_clusters}`] =
                        formatDisplayNumber(
                            membership.case_assignments[caseIndex].cluster
                        );
                }
            });

            table.rows.push(rowData);
        }

        resultJson.tables.push(table);
    }

    // 5. Icicle Plot data (if available, for reference)
    if (data.icicle_plot) {
        const table: Table = {
            key: "icicle_plot_data",
            title: "Icicle Plot Data",
            columnHeaders: [
                { header: "Cluster", key: "cluster" },
                { header: "Number of Clusters", key: "num_clusters" },
            ],
            rows: [],
        };

        if (data.icicle_plot.clusters && data.icicle_plot.num_clusters) {
            for (let i = 0; i < data.icicle_plot.clusters.length; i++) {
                table.rows.push({
                    rowHeader: [data.icicle_plot.clusters[i]],
                    num_clusters: formatDisplayNumber(
                        data.icicle_plot.num_clusters[i]
                    ),
                });
            }
        }

        resultJson.tables.push(table);
    }

    // 6. Dendrogram data (if available)
    if (data.dendrogram && data.dendrogram.nodes) {
        const table: Table = {
            key: "dendrogram_data",
            title: "Dendrogram Data",
            columnHeaders: [
                { header: "Case", key: "case" },
                { header: "Linkage Distance", key: "linkage_distance" },
            ],
            rows: [],
        };

        data.dendrogram.nodes.forEach((node: any) => {
            table.rows.push({
                rowHeader: [node.case],
                linkage_distance: formatDisplayNumber(node.linkage_distance),
            });
        });

        resultJson.tables.push(table);
    }

    return resultJson;
}
