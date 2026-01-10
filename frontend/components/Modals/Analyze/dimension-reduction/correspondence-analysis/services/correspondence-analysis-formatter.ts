// correspondence-analysis-formatter.ts
import {formatDisplayNumber} from "@/hooks/useFormatter";
import {ResultJson, Row, Table} from "@/types/Table";

export function transformCorrespondenceResult(
    data: any,
    rowVariable: string = "Row",
    colVariable: string = "Column"
): ResultJson {
    const resultJson: ResultJson = {
        tables: [],
    };

    // 1. Correspondence Table
    if (data.correspondence_table) {
        const table: Table = {
            key: "correspondence_table",
            title: "Correspondence Table",
            columnHeaders: [
                { header: rowVariable, key: "var" },
                ...Array.from(
                    { length: data.correspondence_table.data[0]?.length || 0 },
                    (_, i) => ({
                        header: (i + 1).toString(),
                        key: `col_${i + 1}`,
                    })
                ),
                { header: "Active Margin", key: "active_margin" },
            ],
            rows: [],
        };

        if (data.correspondence_table.data.length) {
            for (let i = 0; i < data.correspondence_table.data.length; i++) {
                const rowData: any = {
                    rowHeader: [(i + 1).toString()],
                    ...Object.fromEntries(
                        data.correspondence_table.data[i].map((val: number, j: number) => [
                            `col_${j + 1}`,
                            formatDisplayNumber(val),
                        ])
                    ),
                    active_margin: formatDisplayNumber(
                        data.correspondence_table.active_margin[i]
                    ),
                };
                table.rows.push(rowData);
            }

            // Add Active Margin row
            if (data.correspondence_table.active_margin_col) {
                const marginRow: any = {
                    rowHeader: ["Active Margin"],
                    ...Object.fromEntries(
                        data.correspondence_table.active_margin_col.map(
                            (val: number, j: number) => [
                                `col_${j + 1}`,
                                formatDisplayNumber(val),
                            ]
                        )
                    ),
                    active_margin: formatDisplayNumber(
                        data.correspondence_table.active_margin_col.reduce(
                            (a: number, b: number) => a + b,
                            0
                        )
                    ),
                };
                table.rows.push(marginRow);
            }
        }

        resultJson.tables.push(table);
    }

    // 2. Row Profiles
    if (data.row_profiles) {
        const table: Table = {
            key: "row_profiles",
            title: "Row Profiles",
            columnHeaders: [
                { header: rowVariable, key: "var" },
                ...Array.from(
                    { length: data.row_profiles.data[0]?.length || 0 },
                    (_, i) => ({
                        header: (i + 1).toString(),
                        key: `col_${i + 1}`,
                    })
                ),
                { header: "Active Margin", key: "active_margin" },
            ],
            rows: [],
        };

        if (data.row_profiles.data.length) {
            for (let i = 0; i < data.row_profiles.data.length; i++) {
                const rowData: any = {
                    rowHeader: [(i + 1).toString()],
                    ...Object.fromEntries(
                        data.row_profiles.data[i].map((val: number, j: number) => [
                            `col_${j + 1}`,
                            formatDisplayNumber(val),
                        ])
                    ),
                    active_margin: formatDisplayNumber(1.0),
                };
                table.rows.push(rowData);
            }

            // Add Mass row if available
            if (data.row_profiles.mass) {
                const massRow: any = {
                    rowHeader: ["Mass"],
                    ...Object.fromEntries(
                        data.row_profiles.mass.map((val: number, j: number) => [
                            `col_${j + 1}`,
                            formatDisplayNumber(val),
                        ])
                    ),
                    active_margin: formatDisplayNumber(
                        data.row_profiles.mass.reduce((a: number, b: number) => a + b, 0)
                    ),
                };
                table.rows.push(massRow);
            }
        }

        resultJson.tables.push(table);
    }

    // 3. Column Profiles
    if (data.column_profiles) {
        const table: Table = {
            key: "column_profiles",
            title: "Column Profiles",
            columnHeaders: [
                { header: rowVariable, key: "var" },
                ...Array.from(
                    { length: data.column_profiles.data[0]?.length || 0 },
                    (_, i) => ({
                        header: (i + 1).toString(),
                        key: `col_${i + 1}`,
                    })
                ),
                { header: "Mass", key: "mass" },
            ],
            rows: [],
        };

        if (data.column_profiles.data.length) {
            for (let i = 0; i < data.column_profiles.data.length; i++) {
                const rowData: any = {
                    rowHeader: [(i + 1).toString()],
                    ...Object.fromEntries(
                        data.column_profiles.data[i].map((val: number, j: number) => [
                            `col_${j + 1}`,
                            formatDisplayNumber(val),
                        ])
                    ),
                    mass:
                        data.column_profiles.mass &&
                        i < data.column_profiles.mass.length
                            ? formatDisplayNumber(data.column_profiles.mass[i])
                            : null,
                };
                table.rows.push(rowData);
            }

            // Add Active Margin row
            const marginRow: any = {
                rowHeader: ["Active Margin"],
                ...Object.fromEntries(
                    Array.from(
                        { length: data.column_profiles.data[0]?.length || 0 },
                        (_, j) => [`col_${j + 1}`, formatDisplayNumber(1.0)]
                    )
                ),
                mass: formatDisplayNumber(
                    (data.column_profiles.mass || []).reduce((a: number, b: number) => a + b, 0)
                ),
            };
            table.rows.push(marginRow);
        }

        resultJson.tables.push(table);
    }

    // 4. Summary
    if (data.summary) {
        const table: Table = {
            key: "summary",
            title: "Summary",
            columnHeaders: [
                { header: "Dimension", key: "dimension" },
                { header: "Singular Value", key: "singular_value" },
                { header: "Inertia", key: "inertia" },
                { header: "Chi Square", key: "chi_square" },
                { header: "Sig.", key: "sig" },
                {
                    header: "Proportion of Inertia",
                    key: "proportion",
                    children: [
                        { header: "Accounted for", key: "accounted_for" },
                        { header: "Cumulative", key: "cumulative" },
                    ],
                },
                {
                    header: "Confidence Singular Value",
                    key: "confidence",
                    children: [
                        { header: "Standard Deviation", key: "std_dev" },
                        { header: "Correlation 2", key: "correlation_2" },
                    ],
                },
            ],
            rows: [],
        };

        const dimensions = data.summary.singular_values.length;
        for (let i = 0; i < dimensions; i++) {
            const rowData: any = {
                rowHeader: [(i + 1).toString()],
                singular_value: formatDisplayNumber(
                    data.summary.singular_values[i]
                ),
                inertia: formatDisplayNumber(data.summary.inertia[i]),
                chi_square:
                    i === dimensions - 1
                        ? formatDisplayNumber(data.summary.chi_square[0])
                        : null,
                sig:
                    i === dimensions - 1
                        ? formatDisplayNumber(data.summary.significance[0])
                        : null,
                accounted_for: formatDisplayNumber(
                    data.summary.proportion_of_inertia.accounted_for[i]
                ),
                cumulative: formatDisplayNumber(
                    data.summary.proportion_of_inertia.cumulative[i]
                ),
                std_dev: formatDisplayNumber(
                    (data.confidence_row_points?.standard_deviation || [])[
                        i
                    ]?.[0]
                ),
                correlation_2:
                    i === 0
                        ? formatDisplayNumber(
                              (data.confidence_row_points?.correlation || [])[0]
                          )
                        : null,
            };
            table.rows.push(rowData);
        }

        // Add Total row
        if (dimensions > 0) {
            const totalRow: any = {
                rowHeader: ["Total"],
                inertia: formatDisplayNumber(
                    data.summary.inertia.reduce((a: number, b: number) => a + b, 0)
                ),
                chi_square: formatDisplayNumber(data.summary.chi_square[0]),
                sig: formatDisplayNumber(data.summary.significance[0]),
                accounted_for: formatDisplayNumber(1.0),
                cumulative: formatDisplayNumber(1.0),
            };
            table.rows.push(totalRow);
        }

        resultJson.tables.push(table);
    }

    // 5. Row Points Analysis
    if (data.row_points) {
        const table: Table = {
            key: "row_points",
            title: "Overview Row Points",
            columnHeaders: [
                { header: rowVariable, key: "var" },
                { header: "Mass", key: "mass" },
                {
                    header: "Score in Dimension",
                    key: "score",
                    children: [
                        { header: "1", key: "dim1" },
                        { header: "2", key: "dim2" },
                    ],
                },
                { header: "Inertia", key: "inertia" },
                {
                    header: "Contribution",
                    key: "contribution",
                    children: [
                        {
                            header: "Of Point to Inertia of Dimension",
                            key: "point_to_dim",
                            children: [
                                { header: "1", key: "point_to_dim1" },
                                { header: "2", key: "point_to_dim2" },
                            ],
                        },
                        {
                            header: "Of Dimension to Inertia of Point",
                            key: "dim_to_point",
                            children: [
                                { header: "1", key: "dim1_to_point" },
                                { header: "2", key: "dim2_to_point" },
                            ],
                        },
                    ],
                },
                { header: "Total", key: "total" },
            ],
            rows: [],
        };

        for (let i = 0; i < data.row_points.mass.length; i++) {
            const rowData: any = {
                rowHeader: [(i + 1).toString()],
                mass: formatDisplayNumber(data.row_points.mass[i]),
                dim1: formatDisplayNumber(
                    data.row_points.scores[i]
                        ? data.row_points.scores[i][0]
                        : null
                ),
                dim2: formatDisplayNumber(
                    data.row_points.scores[i]
                        ? data.row_points.scores[i][1]
                        : null
                ),
                inertia: formatDisplayNumber(data.row_points.inertia[i]),
                point_to_dim1: formatDisplayNumber(
                    data.row_points.contributions.of_point_to_inertia[i]
                        ? data.row_points.contributions.of_point_to_inertia[
                              i
                          ][0]
                        : null
                ),
                point_to_dim2: formatDisplayNumber(
                    data.row_points.contributions.of_point_to_inertia[i]
                        ? data.row_points.contributions.of_point_to_inertia[
                              i
                          ][1]
                        : null
                ),
                dim1_to_point: formatDisplayNumber(
                    data.row_points.contributions.of_dimension_to_inertia[i]
                        ? data.row_points.contributions.of_dimension_to_inertia[
                              i
                          ][0]
                        : null
                ),
                dim2_to_point: formatDisplayNumber(
                    data.row_points.contributions.of_dimension_to_inertia[i]
                        ? data.row_points.contributions.of_dimension_to_inertia[
                              i
                          ][1]
                        : null
                ),
                total: formatDisplayNumber(
                    data.row_points.contributions.of_dimension_to_inertia[i]
                        ? data.row_points.contributions.of_dimension_to_inertia[
                              i
                          ][0] +
                              data.row_points.contributions
                                  .of_dimension_to_inertia[i][1]
                        : null
                ),
            };
            table.rows.push(rowData);
        }

        // Add Active Total row
        const totalInertiaRow = data.row_points.inertia.reduce((a: number, b: number) => a + b, 0);
        const totalRowForRows: any = {
            rowHeader: ["Active Total"],
            mass: formatDisplayNumber(1.0),
            inertia: formatDisplayNumber(totalInertiaRow),
            point_to_dim1: formatDisplayNumber(1.0),
            point_to_dim2: formatDisplayNumber(1.0),
        };
        table.rows.push(totalRowForRows);

        resultJson.tables.push(table);
    }

    // 6. Column Points Analysis
    if (data.column_points) {
        const table: Table = {
            key: "column_points",
            title: "Overview Column Points",
            columnHeaders: [
                { header: colVariable, key: "var" },
                { header: "Mass", key: "mass" },
                {
                    header: "Score in Dimension",
                    key: "score",
                    children: [
                        { header: "1", key: "dim1" },
                        { header: "2", key: "dim2" },
                    ],
                },
                { header: "Inertia", key: "inertia" },
                {
                    header: "Contribution",
                    key: "contribution",
                    children: [
                        {
                            header: "Of Point to Inertia of Dimension",
                            key: "point_to_dim",
                            children: [
                                { header: "1", key: "point_to_dim1" },
                                { header: "2", key: "point_to_dim2" },
                            ],
                        },
                        {
                            header: "Of Dimension to Inertia of Point",
                            key: "dim_to_point",
                            children: [
                                { header: "1", key: "dim1_to_point" },
                                { header: "2", key: "dim2_to_point" },
                            ],
                        },
                    ],
                },
                { header: "Total", key: "total" },
            ],
            rows: [],
        };

        for (let i = 0; i < data.column_points.mass.length; i++) {
            const rowData: any = {
                rowHeader: [(i + 1).toString()],
                mass: formatDisplayNumber(data.column_points.mass[i]),
                dim1: formatDisplayNumber(
                    data.column_points.scores[i]
                        ? data.column_points.scores[i][0]
                        : null
                ),
                dim2: formatDisplayNumber(
                    data.column_points.scores[i]
                        ? data.column_points.scores[i][1]
                        : null
                ),
                inertia: formatDisplayNumber(data.column_points.inertia[i]),
                point_to_dim1: formatDisplayNumber(
                    data.column_points.contributions.of_point_to_inertia[i]
                        ? data.column_points.contributions.of_point_to_inertia[
                              i
                          ][0]
                        : null
                ),
                point_to_dim2: formatDisplayNumber(
                    data.column_points.contributions.of_point_to_inertia[i]
                        ? data.column_points.contributions.of_point_to_inertia[
                              i
                          ][1]
                        : null
                ),
                dim1_to_point: formatDisplayNumber(
                    data.column_points.contributions.of_dimension_to_inertia[i]
                        ? data.column_points.contributions
                              .of_dimension_to_inertia[i][0]
                        : null
                ),
                dim2_to_point: formatDisplayNumber(
                    data.column_points.contributions.of_dimension_to_inertia[i]
                        ? data.column_points.contributions
                              .of_dimension_to_inertia[i][1]
                        : null
                ),
                total: formatDisplayNumber(
                    data.column_points.contributions.of_dimension_to_inertia[i]
                        ? data.column_points.contributions
                              .of_dimension_to_inertia[i][0] +
                              data.column_points.contributions
                                  .of_dimension_to_inertia[i][1]
                        : null
                ),
            };
            table.rows.push(rowData);
        }

        // Add Active Total row
        const totalInertiaCol = data.column_points.inertia.reduce(
            (a: number, b: number) => a + b,
            0
        );
        const totalRowForCols: any = {
            rowHeader: ["Active Total"],
            mass: formatDisplayNumber(1.0),
            inertia: formatDisplayNumber(totalInertiaCol),
            point_to_dim1: formatDisplayNumber(1.0),
            point_to_dim2: formatDisplayNumber(1.0),
        };
        table.rows.push(totalRowForCols);

        resultJson.tables.push(table);
    }

    // 7. Confidence Row Points
    if (data.confidence_row_points) {
        const table: Table = {
            key: "confidence_row_points",
            title: "Confidence Row Points",
            columnHeaders: [
                { header: rowVariable, key: "var" },
                {
                    header: "Standard Deviation in Dimension",
                    key: "std_dev",
                    children: [
                        { header: "1", key: "std_dev_1" },
                        { header: "2", key: "std_dev_2" },
                    ],
                },
                { header: "Correlation 1-2", key: "corr_1_2" },
            ],
            rows: [],
        };

        for (
            let i = 0;
            i < data.confidence_row_points.standard_deviation.length;
            i++
        ) {
            const rowData: any = {
                rowHeader: [(i + 1).toString()],
                std_dev_1: formatDisplayNumber(
                    data.confidence_row_points.standard_deviation[i]
                        ? data.confidence_row_points.standard_deviation[i][0]
                        : null
                ),
                std_dev_2: formatDisplayNumber(
                    data.confidence_row_points.standard_deviation[i]
                        ? data.confidence_row_points.standard_deviation[i][1]
                        : null
                ),
                corr_1_2: formatDisplayNumber(
                    data.confidence_row_points.correlation[i]
                ),
            };
            table.rows.push(rowData);
        }

        resultJson.tables.push(table);
    }

    // 8. Confidence Column Points
    if (data.confidence_column_points) {
        const table: Table = {
            key: "confidence_column_points",
            title: "Confidence Column Points",
            columnHeaders: [
                { header: colVariable, key: "var" },
                {
                    header: "Standard Deviation in Dimension",
                    key: "std_dev",
                    children: [
                        { header: "1", key: "std_dev_1" },
                        { header: "2", key: "std_dev_2" },
                    ],
                },
                { header: "Correlation 1-2", key: "corr_1_2" },
            ],
            rows: [],
        };

        for (
            let i = 0;
            i < data.confidence_column_points.standard_deviation.length;
            i++
        ) {
            const rowData: any = {
                rowHeader: [(i + 1).toString()],
                std_dev_1: formatDisplayNumber(
                    data.confidence_column_points.standard_deviation[i]
                        ? data.confidence_column_points.standard_deviation[i][0]
                        : null
                ),
                std_dev_2: formatDisplayNumber(
                    data.confidence_column_points.standard_deviation[i]
                        ? data.confidence_column_points.standard_deviation[i][1]
                        : null
                ),
                corr_1_2: formatDisplayNumber(
                    data.confidence_column_points.correlation[i]
                ),
            };
            table.rows.push(rowData);
        }

        resultJson.tables.push(table);
    }

    return resultJson;
}
