import { formatDisplayNumber, formatSig } from "@/hooks/useFormatter";
import { ResultJson, Row, Table } from "@/types/Table";

export function formatPart3(
    data: any,
    resultJson: ResultJson,
    errors: string[]
) {
    // 11. EM Means
    if (data.emmeans) {
        const emmeans = data.emmeans;
        const depVarName =
            (data.tests_of_between_subjects_effects &&
                data.tests_of_between_subjects_effects.dependent_variable) ||
            (data.descriptive_statistics &&
                Object.values(data.descriptive_statistics).length > 0 &&
                (Object.values(data.descriptive_statistics)[0] as any)
                    .dependent_variable) ||
            "";

        emmeans.parameter_names.forEach((paramName: string, index: number) => {
            const estimates = emmeans.em_estimates?.[index];
            const contrastCoeffs = emmeans.contrast_coefficients?.[index];

            // 11.1 Estimates Table
            if (
                estimates &&
                Array.isArray(estimates.entries) &&
                estimates.entries.length > 0 &&
                estimates.entries[0].levels.length > 0
            ) {
                const isOverall = paramName === "(OVERALL)";
                let factorNames: string[] = [];
                if (!isOverall) {
                    factorNames = estimates.entries[0].levels[0]
                        .split(", ")
                        .map((p: string) => p.split("=")[0]);
                }

                const columnHeaders: any[] = [
                    ...factorNames.map((f) => ({ header: f, key: f })),
                    { header: "Mean", key: "mean" },
                    { header: "Std. Error", key: "std_error" },
                    {
                        header: "95% Confidence Interval",
                        key: "ci",
                        children: [
                            { header: "Lower Bound", key: "lower_bound" },
                            { header: "Upper Bound", key: "upper_bound" },
                        ],
                    },
                ];

                if (isOverall) {
                    columnHeaders.unshift({
                        header: "",
                        key: "grand_mean_label",
                    });
                }

                const table: any = {
                    key: `emmeans_estimates_${paramName.replace(/\W/g, "_")}`,
                    title: isOverall ? `Grand Mean` : `Estimates`,
                    subtitle: `Dependent Variable: ${depVarName}`,
                    columnHeaders,
                    rows: [],
                    note: estimates.note,
                    interpretation: estimates.interpretation,
                };

                if (!isOverall) {
                    table.title = `Estimates: ${paramName}`;
                }

                estimates.entries.forEach((entry: any) => {
                    entry.levels.forEach((levelString: string, i: number) => {
                        const row: Row = { rowHeader: [] };
                        if (isOverall) {
                            row.grand_mean_label = "";
                        } else {
                            const levelParts = levelString.split(", ");
                            const levelMap = new Map(
                                levelParts
                                    .map((p: string) => p.split("="))
                                    .filter((p) => p.length === 2) as [
                                    string,
                                    string
                                ][]
                            );
                            factorNames.forEach((fn) => {
                                row[fn] = levelMap.get(fn) || "";
                            });
                        }

                        row.mean = formatDisplayNumber(entry.mean[i]);
                        row.std_error = formatDisplayNumber(
                            entry.standard_error[i]
                        );
                        row.lower_bound = formatDisplayNumber(
                            entry.confidence_interval[i]?.lower_bound
                        );
                        row.upper_bound = formatDisplayNumber(
                            entry.confidence_interval[i]?.upper_bound
                        );
                        table.rows.push(row);
                    });
                });

                if (factorNames.length > 1) {
                    const processedRows: Row[] = [];
                    const lastFactorValues = new Array(factorNames.length).fill(
                        null
                    );
                    table.rows.forEach((row: Row) => {
                        const newRow = { ...row };
                        for (let i = 0; i < factorNames.length; i++) {
                            const key = factorNames[i];
                            if (newRow[key] === lastFactorValues[i]) {
                                newRow[key] = "";
                            } else {
                                lastFactorValues[i] = newRow[key] as string;
                                for (
                                    let j = i + 1;
                                    j < factorNames.length;
                                    j++
                                ) {
                                    lastFactorValues[j] = null;
                                }
                            }
                        }
                        processedRows.push(newRow);
                    });
                    table.rows = processedRows;
                }

                resultJson.tables.push(table);
            }

            // 11.3 Pairwise Comparisons
            if (emmeans.pairwise_comparisons) {
                emmeans.pairwise_comparisons
                    .filter((comparison: any) => {
                        const notes = comparison.note || "";
                        const factorMatch = notes.match(
                            /Pairwise comparisons for (.*?)\./
                        );
                        const factorName = factorMatch
                            ? factorMatch[1]
                            : "Unknown";
                        return factorName === paramName;
                    })
                    .forEach((comparison: any) => {
                        if (
                            !comparison.entries ||
                            comparison.entries.length === 0
                        )
                            return;

                        const notes = comparison.note || "";
                        const factorName = paramName;
                        const adjMatch = notes.match(
                            /Adjustment for multiple comparisons: (.*?)\./
                        );
                        const adjMethod = adjMatch ? adjMatch[1] : "None";

                        const table: any = {
                            key: `emmeans_pairwise_${factorName}`,
                            title: `Pairwise Comparisons: ${factorName}`,
                            subtitle: `Dependent Variable: ${depVarName}`,
                            columnHeaders: [
                                {
                                    header: "",
                                },
                                {
                                    header: `(I) ${factorName}`,
                                    key: "i_level",
                                },
                                {
                                    header: `(J) ${factorName}`,
                                    key: "j_level",
                                },
                                {
                                    header: "Mean Difference (I-J)",
                                    key: "mean_diff",
                                },
                                { header: "Std. Error", key: "std_error" },
                                { header: "Sig.", key: "sig" },
                                {
                                    header: `95% Confidence Interval for Difference`,
                                    key: "ci",
                                    children: [
                                        {
                                            header: "Lower Bound",
                                            key: "lower_bound",
                                        },
                                        {
                                            header: "Upper Bound",
                                            key: "upper_bound",
                                        },
                                    ],
                                },
                            ],
                            rows: [],
                            note: comparison.note,
                            interpretation: comparison.interpretation,
                        };

                        const groupedRows: { [key: string]: Row[] } = {};
                        comparison.entries.forEach((entry: any) => {
                            const iLevel = entry.parameter[0]?.split("=")[1];
                            if (!groupedRows[iLevel]) {
                                groupedRows[iLevel] = [];
                            }
                            groupedRows[iLevel].push({
                                rowHeader: [],
                                i_level: iLevel,
                                j_level: entry.parameter[1]?.split("=")[1],
                                mean_diff: formatDisplayNumber(
                                    entry.mean_difference[0]
                                ),
                                std_error: formatDisplayNumber(
                                    entry.standard_error[0]
                                ),
                                sig: formatDisplayNumber(entry.significance[0]),
                                lower_bound: formatDisplayNumber(
                                    entry.confidence_interval[0]?.lower_bound
                                ),
                                upper_bound: formatDisplayNumber(
                                    entry.confidence_interval[0]?.upper_bound
                                ),
                            });
                        });

                        Object.keys(groupedRows)
                            .sort()
                            .forEach((key) => {
                                groupedRows[key].forEach((row, rowIndex) => {
                                    if (rowIndex > 0) {
                                        row.i_level = "";
                                    }
                                    table.rows.push(row);
                                });
                            });

                        const nullNoteCols = {
                            j_level: null,
                            mean_diff: null,
                            std_error: null,
                            sig: null,
                            lower_bound: null,
                            upper_bound: null,
                        };
                        table.rows.push({
                            rowHeader: ["Based on estimated marginal means"],
                            ...nullNoteCols,
                        });
                        table.rows.push({
                            rowHeader: [
                                `Adjustment for multiple comparisons: ${adjMethod}.`,
                            ],
                            ...nullNoteCols,
                        });

                        resultJson.tables.push(table);
                    });
            }

            // 11.4 Univariate Tests
            if (emmeans.univariate_tests) {
                emmeans.univariate_tests
                    .filter(
                        (test: any) => test.entries?.[0]?.source === paramName
                    )
                    .forEach((test: any) => {
                        const factorName = test.entries[0]?.source || "Unknown";

                        // Check for optional columns
                        const hasPartialEta = test.entries.some((e: any) => {
                            const value = e.partial_eta_squared;
                            return value != null && !isNaN(value);
                        });
                        const hasNoncent = test.entries.some((e: any) => {
                            const value = e.noncent_parameter;
                            return value != null && !isNaN(value);
                        });
                        const hasPower = test.entries.some((e: any) => {
                            const value = e.observed_power;
                            return value != null && !isNaN(value);
                        });

                        const columnHeaders: any[] = [
                            { header: "", key: "source" },
                            {
                                header: "Sum of Squares",
                                key: "sum_of_squares",
                            },
                            { header: "df", key: "df" },
                            { header: "Mean Square", key: "mean_square" },
                            { header: "F", key: "f" },
                            { header: "Sig.", key: "sig" },
                        ];

                        if (hasPartialEta) {
                            columnHeaders.push({
                                header: "Partial Eta Squared",
                                key: "partial_eta_squared",
                            });
                        }
                        if (hasNoncent) {
                            columnHeaders.push({
                                header: "Noncent. Parameter",
                                key: "noncent_parameter",
                            });
                        }
                        if (hasPower) {
                            columnHeaders.push({
                                header: "Observed Power",
                                key: "observed_power",
                            });
                        }

                        const table: any = {
                            key: `emmeans_univariate_${factorName.replace(
                                /\W/g,
                                "_"
                            )}`,
                            title: `Univariate Tests`,
                            subtitle: `Dependent Variable: ${depVarName}`,
                            columnHeaders: columnHeaders,
                            rows: [],
                            note: test.note,
                            interpretation: test.interpretation,
                        };

                        const notesArray = Array.isArray(test.notes)
                            ? test.notes
                            : typeof test.note === "string"
                            ? test.note.split("\n")
                            : [];

                        const sigLevelMatch = notesArray.find((n: string) =>
                            n.includes("alpha =")
                        );

                        const sigLevel = sigLevelMatch
                            ? sigLevelMatch.split("=")[1].trim()
                            : "0.05";

                        test.entries.forEach((entry: any) => {
                            const row: Row = {
                                rowHeader: [entry.source],
                                sum_of_squares: formatDisplayNumber(
                                    entry.sum_of_squares
                                ),
                                df: entry.df,
                                mean_square: formatDisplayNumber(
                                    entry.mean_square
                                ),
                                f: formatDisplayNumber(entry.f_value),
                                sig: formatDisplayNumber(entry.significance),
                            };

                            if (hasPartialEta) {
                                row.partial_eta_squared = formatDisplayNumber(
                                    entry.partial_eta_squared
                                );
                            }
                            if (hasNoncent) {
                                row.noncent_parameter = formatDisplayNumber(
                                    entry.noncent_parameter
                                );
                            }
                            if (hasPower) {
                                row.observed_power = formatDisplayNumber(
                                    entry.observed_power
                                );
                            }
                            table.rows.push(row);
                        });

                        const nullNoteCols: any = {
                            sum_of_squares: null,
                            df: null,
                            mean_square: null,
                            f: null,
                            sig: null,
                        };

                        if (hasPartialEta) {
                            nullNoteCols.partial_eta_squared = null;
                        }
                        if (hasNoncent) {
                            nullNoteCols.noncent_parameter = null;
                        }
                        if (hasPower) {
                            nullNoteCols.observed_power = null;
                        }

                        const effectNote = notesArray.find((n: string) =>
                            n.startsWith("The F tests")
                        );
                        if (effectNote) {
                            table.rows.push({
                                rowHeader: [effectNote],
                                ...nullNoteCols,
                            });
                        }
                        table.rows.push({
                            rowHeader: [`Computed using alpha = ${sigLevel}`],
                            ...nullNoteCols,
                        });

                        resultJson.tables.push(table);
                    });
            }

            // 11.2 Contrast Coefficients Table
            if (
                contrastCoeffs &&
                Array.isArray(contrastCoeffs.l_label) &&
                Array.isArray(contrastCoeffs.parameter) &&
                Array.isArray(contrastCoeffs.l_matrix)
            ) {
                const isOverall = paramName === "(OVERALL)";
                const title = isOverall
                    ? "Contrast Coefficients (L' Matrix): Grand Mean"
                    : `Contrast Coefficients (L' Matrix): ${paramName}`;

                const lMatrixHeaders: any[] = [
                    { header: "Parameter", key: "parameter" },
                ];

                const factorNames = isOverall ? [] : paramName.split("*");

                if (isOverall) {
                    lMatrixHeaders.push({ header: "Grand Mean", key: "l0" });
                } else if (factorNames.length === 1) {
                    lMatrixHeaders.push({
                        header: paramName,
                        key: `${paramName}_group`,
                        children: contrastCoeffs.l_label.map(
                            (label: string, i: number) => ({
                                header: label.split("=")[1] || `L${i + 1}`,
                                key: `l${i}`,
                            })
                        ),
                    });
                } else {
                    const childrenHeaders: any[] = contrastCoeffs.l_label.map(
                        (label: string, i: number) => {
                            const parts = label
                                .replace("EMM: ", "")
                                .split(", ");
                            const headerParts = parts.map(
                                (p) => p.split("=")[1]
                            );
                            return {
                                header: headerParts.join(" "),
                                key: `l${i}`,
                            };
                        }
                    );

                    const topLevelFactors = paramName.split("*");
                    const groupedHeaders: any = {};
                    topLevelFactors.forEach((factor) => {
                        groupedHeaders[factor] = [];
                    });

                    lMatrixHeaders.push(...childrenHeaders);
                }

                const lMatrixTable: Table = {
                    key: `emmeans_contrast_coefficients_${paramName.replace(
                        /\W/g,
                        "_"
                    )}`,
                    title: title,
                    columnHeaders: lMatrixHeaders,
                    rows: [],
                    note: contrastCoeffs.note,
                    interpretation: contrastCoeffs.interpretation,
                };

                contrastCoeffs.parameter.forEach(
                    (param: string, paramIndex: number) => {
                        const row: Row = { rowHeader: [], parameter: param };
                        contrastCoeffs.l_matrix.forEach(
                            (l_row: number[], l_index: number) => {
                                row[`l${l_index}`] = formatDisplayNumber(
                                    l_row[paramIndex]
                                );
                            }
                        );
                        lMatrixTable.rows.push(row);
                    }
                );

                resultJson.tables.push(lMatrixTable);
            }
        });
    }

    // 12. Plots (data for visualization)
    if (data.plots) {
        Object.entries(data.plots).forEach(
            ([plotName, plotData]: [string, any]) => {
                // Only process if we have series and points
                if (plotData && plotData.series && plotData.series.length > 0) {
                    const table: Table = {
                        key: `plot_${plotName
                            .toLowerCase()
                            .replace(/\s+/g, "_")}`,
                        title: plotData.title || `Plot - ${plotName}`,
                        columnHeaders: [
                            { header: plotData.x_label || "X", key: "x" },
                            { header: plotData.y_label || "Y", key: "y" },
                            { header: "Series", key: "series" },
                            { header: "Label", key: "label" },
                        ],
                        rows: [],
                        note: plotData.note,
                        interpretation: plotData.interpretation,
                    };

                    // Process each series and its points
                    plotData.series.forEach((series: any) => {
                        if (
                            series &&
                            series.points &&
                            series.points.length > 0
                        ) {
                            series.points.forEach((point: any) => {
                                if (point) {
                                    table.rows.push({
                                        rowHeader: [],
                                        x: formatDisplayNumber(point.x),
                                        y: formatDisplayNumber(point.y),
                                        series: series.name || "",
                                        label: point.label || "",
                                    });
                                }
                            });
                        }
                    });

                    resultJson.tables.push(table);
                }
            }
        );
    }

    // 13. Saved Variables
    if (data.saved_variables) {
        const vars = data.saved_variables;
        const varKeys = Object.keys(vars).filter(
            (key) => Array.isArray(vars[key]) && vars[key].length > 0
        );

        if (varKeys.length > 0) {
            const nameMapping: { [key: string]: string } = {
                predicted_values: "PRED",
                weighted_predicted_values: "WPRED",
                residuals: "RESID",
                weighted_residuals: "WRESID",
                deleted_residuals: "DRESID",
                standardized_residuals: "ZRESID",
                studentized_residuals: "SRESID",
                standard_errors: "SEPRED",
                cook_distances: "COOK",
                leverages: "LEVER",
            };

            const columnHeaders: any[] = [
                { header: "Case Number", key: "case" },
            ];
            varKeys.forEach((key) => {
                columnHeaders.push({
                    header: nameMapping[key] || key,
                    key: key,
                });
            });

            const table: Table = {
                key: "saved_variables_table",
                title: "Case Diagnostics",
                columnHeaders: columnHeaders,
                rows: [],
                note: data.saved_variables.note,
                interpretation: data.saved_variables.interpretation,
            };

            const numRows = vars[varKeys[0]].length;
            for (let i = 0; i < numRows; i++) {
                const row: Row = { rowHeader: [], case: String(i + 1) };
                varKeys.forEach((key) => {
                    const value = vars[key][i];
                    row[key] =
                        value !== null ? formatDisplayNumber(value) : ".";
                });
                table.rows.push(row);
            }

            resultJson.tables.push(table);
        }
    }

    // 14. Custom Hypothesis Tests
    if (data.contrast_coefficients) {
        const custom_tests = data.contrast_coefficients;

        // 14.1 Custom Hypothesis Tests Index table
        if (custom_tests.information && custom_tests.information.length > 0) {
            const table: Table = {
                key: "custom_hypothesis_tests_index",
                title: "Custom Hypothesis Tests Index",
                columnHeaders: [
                    { header: "", key: "index" },
                    { header: "", key: "matrix_type" },
                    { header: "", key: "description" },
                ],
                rows: [],
                note: custom_tests.note,
                interpretation: custom_tests.interpretation,
            };

            custom_tests.information.forEach((info: any, index: number) => {
                table.rows.push({
                    rowHeader: [],
                    index: String(index + 1),
                    matrix_type: "Contrast Coefficients (L' Matrix)",
                    description: info.contrast_name,
                });
                table.rows.push({
                    rowHeader: [],
                    index: "",
                    matrix_type: "Transformation Coefficients (M Matrix)",
                    description: info.transformation_coef,
                });
                table.rows.push({
                    rowHeader: [],
                    index: "",
                    matrix_type: "Contrast Results (K Matrix)",
                    description: info.contrast_result,
                });
            });

            resultJson.tables.push(table);
        }

        const depVarName =
            (data.tests_of_between_subjects_effects &&
                data.tests_of_between_subjects_effects.dependent_variable) ||
            (data.descriptive_statistics &&
                Object.values(data.descriptive_statistics).length > 0 &&
                (Object.values(data.descriptive_statistics)[0] as any)
                    .dependent_variable) ||
            "";

        // Loop through each custom test
        custom_tests.factor_names?.forEach(
            (_factorName: string, index: number) => {
                const info = custom_tests.information?.[index];
                const test_result = custom_tests.contrast_test_result?.[index];
                const contrast_k_result = custom_tests.contrast_result?.[index];
                const contrast_def =
                    custom_tests.contrast_coefficients?.[index];

                // 14.4 Contrast Coefficients (L' Matrix)
                if (contrast_def && info) {
                    const contrastHeaders = contrast_def.l_label.map(
                        (_label: string, i: number) => ({
                            header:
                                contrast_k_result?.parameter[i] || `L${i + 1}`,
                            key: `l${i + 1}`,
                        })
                    );

                    const table: Table = {
                        key: `contrast_coefficients_${index}`,
                        title: "Contrast Coefficients (L' Matrix)",
                        columnHeaders: [
                            { header: "Parameter", key: "parameter" },
                            {
                                header: info.contrast_name,
                                key: "contrast_group",
                                children: contrastHeaders,
                            },
                        ],
                        rows: [],
                        note: contrast_def.note,
                        interpretation: contrast_def.interpretation,
                    };

                    contrast_def.parameter.forEach(
                        (param: string, paramIndex: number) => {
                            const row: Row = {
                                rowHeader: [param],
                                parameter: param,
                            };
                            contrast_def.l_label.forEach(
                                (_label: string, contrastIndex: number) => {
                                    row[`l${contrastIndex + 1}`] =
                                        formatDisplayNumber(
                                            contrast_def.l_matrix[
                                                contrastIndex
                                            ]?.[paramIndex]
                                        );
                                }
                            );
                            table.rows.push(row);
                        }
                    );

                    const nullColumnsForNotes = Object.fromEntries(
                        table.columnHeaders
                            .filter((h) => h.key !== "parameter")
                            .map((h) => [h.key, null])
                    );

                    if (contrast_def.l_label.length > 1) {
                        contrast_def.l_label.forEach((_l: any, i: number) => {
                            nullColumnsForNotes[`l${i + 1}`] = null;
                        });
                    }

                    table.rows.push({
                        rowHeader: [
                            "The default display of this matrix is the transpose of the corresponding L matrix.",
                        ],
                        ...nullColumnsForNotes,
                    });

                    resultJson.tables.push(table);
                }

                // 14.3 Contrast Results (K Matrix)
                if (contrast_k_result && info) {
                    const table: Table = {
                        key: `custom_contrast_results_k_matrix_${index}`,
                        title: "Contrast Results (K Matrix)",
                        columnHeaders: [
                            {
                                header:
                                    info.contrast_name.split(" for ")[1] ||
                                    info.contrast_name,
                                key: "param_group",
                            },
                            { header: "", key: "stat" },
                            { header: "", key: "sub_stat" },
                            {
                                header: `Dependent Variable: ${depVarName}`,
                                key: "value",
                            },
                        ],
                        rows: [],
                        note: contrast_k_result.note,
                        interpretation: contrast_k_result.interpretation,
                    };

                    contrast_k_result.parameter.forEach(
                        (paramName: string, paramIndex: number) => {
                            const resultData =
                                contrast_k_result.contrast_result[paramIndex];
                            if (resultData) {
                                table.rows.push(
                                    {
                                        rowHeader: [],
                                        param_group: paramName,
                                        stat: "Contrast Estimate",
                                        sub_stat: "",
                                        value: formatDisplayNumber(
                                            resultData.contrast_estimate
                                        ),
                                    },
                                    {
                                        rowHeader: [],
                                        param_group: "",
                                        stat: "Hypothesized Value",
                                        sub_stat: "",
                                        value: resultData.hypothesized_value,
                                    },
                                    {
                                        rowHeader: [],
                                        param_group: "",
                                        stat: "Difference (Estimate - Hypothesized)",
                                        sub_stat: "",
                                        value: formatDisplayNumber(
                                            resultData.difference
                                        ),
                                    },
                                    {
                                        rowHeader: [],
                                        param_group: "",
                                        stat: "Std. Error",
                                        sub_stat: "",
                                        value: formatDisplayNumber(
                                            resultData.standard_error
                                        ),
                                    },
                                    {
                                        rowHeader: [],
                                        param_group: "",
                                        stat: "Sig.",
                                        sub_stat: "",
                                        value: formatDisplayNumber(
                                            resultData.significance
                                        ),
                                    },
                                    {
                                        rowHeader: [],
                                        param_group: "",
                                        stat: "95% Confidence Interval for Difference",
                                        sub_stat: "Lower Bound",
                                        value: formatDisplayNumber(
                                            resultData.confidence_interval
                                                ?.lower_bound
                                        ),
                                    },
                                    {
                                        rowHeader: [],
                                        param_group: "",
                                        stat: "",
                                        sub_stat: "Upper Bound",
                                        value: formatDisplayNumber(
                                            resultData.confidence_interval
                                                ?.upper_bound
                                        ),
                                    }
                                );
                            }
                        }
                    );
                    resultJson.tables.push(table);
                }

                // 14.2 Test Results table
                if (test_result) {
                    const allEffects = test_result.contrast_result || [];

                    const hasPartialEta = allEffects.some(
                        (e: any) =>
                            e.partial_eta_squared != null &&
                            !isNaN(e.partial_eta_squared)
                    );
                    const hasNoncent = allEffects.some(
                        (e: any) =>
                            e.noncent_parameter != null &&
                            !isNaN(e.noncent_parameter)
                    );
                    const hasPower = allEffects.some(
                        (e: any) =>
                            e.observed_power != null && !isNaN(e.observed_power)
                    );

                    const columnHeaders: any[] = [
                        { header: "Source", key: "source" },
                        { header: "Sum of Squares", key: "sum_of_squares" },
                        { header: "df", key: "df" },
                        { header: "Mean Square", key: "mean_square" },
                        { header: "F", key: "f" },
                        { header: "Sig.", key: "sig" },
                    ];

                    if (hasPartialEta) {
                        columnHeaders.push({
                            header: "Partial Eta Squared",
                            key: "partial_eta_squared",
                        });
                    }
                    if (hasNoncent) {
                        columnHeaders.push({
                            header: "Noncent. Parameter",
                            key: "noncent_parameter",
                        });
                    }
                    if (hasPower) {
                        columnHeaders.push({
                            header: "Observed Power",
                            key: "observed_power",
                        });
                    }

                    const table: any = {
                        key: `custom_test_results_${index}`,
                        title: "Test Results",
                        subtitle: `Dependent Variable: ${depVarName}`,
                        columnHeaders: columnHeaders,
                        rows: [],
                        note: test_result.note,
                        interpretation: test_result.interpretation,
                    };

                    test_result.contrast_result.forEach((res: any) => {
                        const row: Row = {
                            rowHeader: [],
                            source: res.source,
                            sum_of_squares: formatDisplayNumber(
                                res.sum_of_squares
                            ),
                            df: res.df,
                            mean_square: formatDisplayNumber(res.mean_square),
                            f: formatDisplayNumber(res.f_value),
                            sig: formatDisplayNumber(res.significance),
                        };

                        if (hasPartialEta) {
                            row.partial_eta_squared = formatDisplayNumber(
                                res.partial_eta_squared
                            );
                        }
                        if (hasNoncent) {
                            row.noncent_parameter = formatDisplayNumber(
                                res.noncent_parameter
                            );
                        }
                        if (hasPower) {
                            row.observed_power = formatDisplayNumber(
                                res.observed_power
                            );
                        }
                        table.rows.push(row);
                    });
                    resultJson.tables.push(table);
                }
            }
        );
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
}
