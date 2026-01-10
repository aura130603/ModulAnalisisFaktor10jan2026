import { formatDisplayNumber } from "@/hooks/useFormatter";
import { ResultJson, Table } from "@/types/Table";

export function transformKMeansResult(
    data: any,
    errors: string[] = []
): ResultJson {
    const resultJson: ResultJson = {
        tables: [],
        charts: [],
    };

    // 1. Initial Cluster Centers
    if (data.initial_centers) {
        const table: Table = {
            key: "initial_cluster_centers",
            title: "Initial Cluster Centers",
            columnHeaders: [
                { header: "", key: "var" },
                {
                    header: "Cluster",
                    key: "cluster",
                    children: Array.from(
                        {
                            length:
                                data.initial_centers.centers[0]?.values
                                    .length || 0,
                        },
                        (_, i) => ({
                            header: (i + 1).toString(),
                            key: `cluster_${i + 1}`,
                        })
                    ),
                },
            ],
            rows: [],
            note: data.initial_centers.note,
            interpretation: data.initial_centers.interpretation,
        };

        // Fill data rows
        data.initial_centers.centers
            .sort((a: any, b: any) => a.variable.localeCompare(b.variable))
            .forEach((center: any) => {
                const rowData: any = {
                    rowHeader: [center.variable],
                };

                center.values.forEach((value: number, index: number) => {
                    rowData[`cluster_${index + 1}`] =
                        formatDisplayNumber(value);
                });

                table.rows.push(rowData);
            });

        resultJson.tables.push(table);
    }

    // 2. Iteration History
    if (data.iteration_history) {
        const table: Table = {
            key: "iteration_history",
            title: "Iteration Historyᵃ",
            columnHeaders: [
                { header: "Iteration", key: "iteration" },
                {
                    header: "Change in Cluster Centers",
                    key: "change",
                    children: Array.from(
                        {
                            length:
                                data.iteration_history.iterations[0]?.changes
                                    .length || 0,
                        },
                        (_, i) => ({
                            header: (i + 1).toString(),
                            key: `change_${i + 1}`,
                        })
                    ),
                },
            ],
            rows: [],
            note: data.iteration_history.note,
            interpretation: data.iteration_history.interpretation,
        };

        // Fill data rows
        data.iteration_history.iterations.forEach((iteration: any) => {
            const rowData: any = {
                rowHeader: [iteration.iteration.toString()],
            };

            iteration.changes.forEach((change: any, index: number) => {
                rowData[`change_${index + 1}`] = formatDisplayNumber(
                    change.change
                );
            });

            table.rows.push(rowData);
        });

        // Add footnote about convergence
        if (data.iteration_history.convergence_note) {
            table.rows.push({
                rowHeader: [`a. ${data.iteration_history.convergence_note}`],
            });
        }

        resultJson.tables.push(table);
    }

    // 3. Cluster Membership
    if (data.cluster_membership && data.cluster_membership.data) {
        const membershipData = data.cluster_membership.data;

        // Check if any case has a name
        const hasCaseNames = membershipData.some(
            (membership: any) =>
                membership.case_name && membership.case_name.trim() !== ""
        );

        // Create column headers based on whether we have case names
        const columnHeaders = [
            { header: "Case Number", key: "case_number" },
            ...(hasCaseNames
                ? [{ header: "Case Name", key: "case_name" }]
                : []),
            { header: "Cluster", key: "cluster" },
            { header: "Distance", key: "distance" },
        ];

        const table: Table = {
            key: "cluster_membership",
            title: "Cluster Membership",
            columnHeaders,
            rows: [],
            note: data.cluster_membership.note,
            interpretation: data.cluster_membership.interpretation,
        };

        // Fill data rows
        membershipData.forEach((membership: any) => {
            const rowData: any = {
                rowHeader: [membership.case_number.toString()],
                cluster: membership.cluster.toString(),
                distance: formatDisplayNumber(membership.distance),
            };

            // Only add case_name if we're displaying that column
            if (hasCaseNames) {
                rowData.case_name = membership.case_name || "";
            }

            table.rows.push(rowData);
        });

        resultJson.tables.push(table);
    }

    // 4. Final Cluster Centers
    if (data.final_cluster_centers) {
        const table: Table = {
            key: "final_cluster_centers",
            title: "Final Cluster Centers",
            columnHeaders: [
                { header: "", key: "var" },
                {
                    header: "Cluster",
                    key: "cluster",
                    children: Array.from(
                        {
                            length:
                                data.final_cluster_centers.centers[0]?.values
                                    .length || 0,
                        },
                        (_, i) => ({
                            header: (i + 1).toString(),
                            key: `cluster_${i + 1}`,
                        })
                    ),
                },
            ],
            rows: [],
            note: data.final_cluster_centers.note,
            interpretation: data.final_cluster_centers.interpretation,
        };

        // Fill data rows
        data.final_cluster_centers.centers
            .sort((a: any, b: any) => a.variable.localeCompare(b.variable))
            .forEach((center: any) => {
                const rowData: any = {
                    rowHeader: [center.variable],
                };

                center.values.forEach((value: number, index: number) => {
                    rowData[`cluster_${index + 1}`] =
                        formatDisplayNumber(value);
                });

                table.rows.push(rowData);
            });

        resultJson.tables.push(table);
    }

    // 5. Distances between Final Cluster Centers
    if (data.distances_between_centers) {
        const numClusters = data.distances_between_centers.distances.length;

        const table: Table = {
            key: "distances_between_centers",
            title: "Distances between Final Cluster Centers",
            columnHeaders: [
                { header: "Cluster", key: "cluster" },
                ...Array.from({ length: numClusters }, (_, i) => ({
                    header: (i + 1).toString(),
                    key: `cluster_${i + 1}`,
                })),
            ],
            rows: [],
            note: data.distances_between_centers.note,
            interpretation: data.distances_between_centers.interpretation,
        };

        // Fill data rows
        data.distances_between_centers.distances.forEach(
            (distances: number[], rowIndex: number) => {
                const rowData: any = {
                    rowHeader: [(rowIndex + 1).toString()],
                };

                distances.forEach((distance: number, colIndex: number) => {
                    rowData[`cluster_${colIndex + 1}`] =
                        formatDisplayNumber(distance);
                });

                table.rows.push(rowData);
            }
        );

        resultJson.tables.push(table);
    }

    // 6. ANOVA Table
    if (data.anova) {
        const table: Table = {
            key: "anova",
            title: "ANOVA",
            columnHeaders: [
                { header: "", key: "var" },
                {
                    header: "Cluster",
                    key: "cluster",
                    children: [
                        { header: "Mean Square", key: "mean_square" },
                        { header: "df", key: "df" },
                    ],
                },
                {
                    header: "Error",
                    key: "error",
                    children: [
                        { header: "Mean Square", key: "error_mean_square" },
                        { header: "df", key: "error_df" },
                    ],
                },
                { header: "F", key: "f" },
                { header: "Sig.", key: "significance" },
            ],
            rows: [],
            note: data.anova.note,
            interpretation: data.anova.interpretation,
        };

        // Fill data rows
        data.anova.clusters
            .sort((a: any, b: any) => a.variable.localeCompare(b.variable))
            .forEach((cluster: any) => {
                table.rows.push({
                    rowHeader: [cluster.variable],
                    mean_square: formatDisplayNumber(cluster.mean_square),
                    df: formatDisplayNumber(cluster.df),
                    error_mean_square: formatDisplayNumber(
                        cluster.error_mean_square
                    ),
                    error_df: formatDisplayNumber(cluster.error_df),
                    f: formatDisplayNumber(cluster.f),
                    significance: formatDisplayNumber(cluster.significance),
                });
            });

        // Add ANOVA footnote
        table.rows.push({
            rowHeader: [
                "The F tests should be used only for descriptive purposes because the clusters have been chosen to maximize the differences among cases in different clusters. The observed significance levels are not corrected for this and thus cannot be interpreted as tests of the hypothesis that the cluster means are equal.",
            ],
        });

        resultJson.tables.push(table);
    }

    // 7. Number of Cases in each Cluster
    if (data.cases_count) {
        const table: Table = {
            key: "number_of_cases",
            title: "Number of Cases in each Cluster",
            columnHeaders: [
                { header: "", key: "label" },
                { header: "", key: "cluster" },
                { header: "", key: "total" },
            ],
            rows: [],
            note: data.cases_count.note,
            interpretation: data.cases_count.interpretation,
        };

        data.cases_count.clusters.forEach((cluster: any, index: number) => {
            table.rows.push({
                rowHeader:
                    index === 0
                        ? ["Cluster", cluster.cluster]
                        : ["", cluster.cluster],
                total: formatDisplayNumber(cluster.count),
            });
        });

        if (data.cases_count.valid >= 0) {
            table.rows.push({
                rowHeader: ["Valid"],
                total: formatDisplayNumber(data.cases_count.valid),
            });
        }

        // Add missing row if there are any missing cases
        if (data.cases_count.missing >= 0) {
            table.rows.push({
                rowHeader: ["Missing"],
                total: formatDisplayNumber(data.cases_count.missing),
            });
        }

        resultJson.tables.push(table);
    }

    if (data.cluster_plot) {
        const plot = data.cluster_plot;
        const chartData = plot.x.map((xVal: number, i: number) => ({
            x: xVal,
            y: plot.y[i],
            category: plot.cluster_center[i]
                ? `Center ${plot.cluster[i]}`
                : `Cluster ${plot.cluster[i]}`,
            label: plot.cluster_label[i],
        }));

        const chart = {
            chartType: "Grouped Scatter Plot",
            chartMetadata: {
                axisInfo: {
                    x: plot.x_label,
                    y: plot.y_label,
                    category: "Cluster",
                },
                description: plot.interpretation,
                notes: `Scatter plot of ${plot.y_label} vs ${plot.x_label}, grouped by cluster.`,
                title: "Cluster Plot",
                subtitle: `${plot.y_label} vs ${plot.x_label}`,
            },
            chartData: chartData,
            chartConfig: {
                width: 600,
                height: 400,
                useAxis: true,
                useLegend: true,
                axisLabels: {
                    x: plot.x_label,
                    y: plot.y_label,
                },
            },
        };

        if (!resultJson.charts) {
            resultJson.charts = [];
        }
        resultJson.charts.push(chart);
    }

    if (errors && errors.length > 0) {
        if (errors.length === 1 && errors[0] === "No errors occurred.") {
            const table: Table = {
                key: "error_table",
                title: "Errors Logs",
                columnHeaders: [{ header: "Message", key: "message" }],
                rows: [
                    {
                        rowHeader: [],
                        message: "No errors occurred.",
                    },
                ],
            };
            resultJson.tables.push(table);
        } else {
            const table: Table = {
                key: "error_table",
                title: "Errors Logs",
                columnHeaders: [
                    { header: "Context", key: "context" },
                    { header: "Message", key: "message" },
                ],
                rows: [],
            };

            let currentContext = "";
            let isFirstRowForContext = true;

            const errorLines =
                errors[0] === "Error Summary:" ? errors.slice(1) : errors;

            errorLines.forEach((line: string) => {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith("Context: ")) {
                    currentContext = trimmedLine
                        .replace("Context: ", "")
                        .trim();
                    isFirstRowForContext = true;
                } else if (trimmedLine) {
                    const message = trimmedLine.replace(/^\d+\.\s*/, "");
                    table.rows.push({
                        rowHeader: [],
                        context: isFirstRowForContext ? currentContext : "",
                        message: message,
                    });
                    isFirstRowForContext = false;
                }
            });

            resultJson.tables.push(table);
        }
    }

    return resultJson;
}
