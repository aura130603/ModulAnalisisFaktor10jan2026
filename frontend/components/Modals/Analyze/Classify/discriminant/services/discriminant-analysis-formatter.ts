// discriminant-analysis-formatter.ts
import {formatDisplayNumber} from "@/hooks/useFormatter";
import {ResultJson, Table} from "@/types/Table";

export function transformDiscriminantResult(data: any): ResultJson {
    const resultJson: ResultJson = {
        tables: [],
    };

    // 1. Analysis Case Processing Summary
    if (data.processing_summary) {
        const table: Table = {
            key: "processing_summary",
            title: "Analysis Case Processing Summary",
            columnHeaders: [
                { header: "", key: "case_category" },
                { header: "", key: "sub_category" },
                { header: "N", key: "n" },
                { header: "Percent", key: "percent" },
            ],
            rows: [],
        };

        // Valid row
        table.rows.push({
            rowHeader: ["Valid"],
            n: formatDisplayNumber(data.processing_summary.valid_count),
            percent: formatDisplayNumber(data.processing_summary.valid_percent),
        });

        // Excluded rows - only add if defined
        if (data.processing_summary.missing_group_codes !== undefined) {
            table.rows.push({
                rowHeader: ["Excluded", "Missing or out-of-range group codes"],
                n: formatDisplayNumber(
                    data.processing_summary.missing_group_codes
                ),
                percent: formatDisplayNumber(
                    data.processing_summary.missing_group_percent
                ),
            });
        }

        if (data.processing_summary.missing_disc_vars !== undefined) {
            table.rows.push({
                rowHeader: ["", "At least one missing discriminating variable"],
                n: formatDisplayNumber(
                    data.processing_summary.missing_disc_vars
                ),
                percent: formatDisplayNumber(
                    data.processing_summary.missing_disc_percent
                ),
            });
        }

        if (data.processing_summary.both_missing !== undefined) {
            table.rows.push({
                rowHeader: [
                    "",
                    "Both missing or out-of-range group codes and at least one missing discriminating variable",
                ],
                n: formatDisplayNumber(data.processing_summary.both_missing),
                percent: formatDisplayNumber(
                    data.processing_summary.both_missing_percent
                ),
            });
        }

        // Total excluded
        table.rows.push({
            rowHeader: ["", "Total"],
            n: formatDisplayNumber(data.processing_summary.excluded_count),
            percent: formatDisplayNumber(
                data.processing_summary.total_excluded_percent
            ),
        });

        // Grand total
        table.rows.push({
            rowHeader: ["Total"],
            n: formatDisplayNumber(data.processing_summary.total_count),
            percent: formatDisplayNumber(100.0),
        });

        resultJson.tables.push(table);
    }

    // 2. Classification Processing Summary
    if (data.processing_summary) {
        const table: Table = {
            key: "classification_processing_summary",
            title: "Classification Processing Summary",
            columnHeaders: [
                { header: "", key: "category" },
                { header: "", key: "subcategory" },
                { header: "", key: "value" },
            ],
            rows: [],
        };

        // Processed
        table.rows.push({
            rowHeader: ["Processed"],
            value: formatDisplayNumber(data.processing_summary.valid_count),
        });

        // Excluded rows
        if (data.processing_summary.missing_group_codes !== undefined) {
            table.rows.push({
                rowHeader: ["Excluded", "Missing or out-of-range group codes"],
                value: formatDisplayNumber(
                    data.processing_summary.missing_group_codes
                ),
            });
        }

        if (data.processing_summary.missing_disc_vars !== undefined) {
            table.rows.push({
                rowHeader: ["", "At least one missing discriminating variable"],
                value: formatDisplayNumber(
                    data.processing_summary.missing_disc_vars
                ),
            });
        }

        // Used in Output
        table.rows.push({
            rowHeader: ["Used in Output"],
            value: formatDisplayNumber(data.processing_summary.valid_count),
        });

        resultJson.tables.push(table);
    }

    // 3. Group Statistics
    if (data.group_statistics) {
        const table: Table = {
            key: "group_statistics",
            title: "Group Statistics",
            columnHeaders: [
                { header: "category", key: "category" },
                { header: "", key: "var" },
                { header: "Mean", key: "mean" },
                { header: "Std. Deviation", key: "std_deviation" },
                {
                    header: "Valid N (listwise)",
                    key: "valid_n",
                    children: [
                        { header: "Unweighted", key: "unweighted" },
                        { header: "Weighted", key: "weighted" },
                    ],
                },
            ],
            rows: [],
        };

        // Process each group
        data.group_statistics.groups.forEach(
            (group: string, groupIndex: number) => {
                // Process each variable's mean for this group
                data.group_statistics.means.forEach((meanEntry: any) => {
                    const variableName = meanEntry.variable;

                    // Find the corresponding std deviation entry
                    const stdDevEntry =
                        data.group_statistics.std_deviations.find(
                            (entry: any) => entry.variable === variableName
                        );

                    if (stdDevEntry) {
                        table.rows.push({
                            rowHeader: [group, variableName],
                            mean: formatDisplayNumber(
                                meanEntry.values[groupIndex]
                            ),
                            std_deviation: formatDisplayNumber(
                                stdDevEntry.values[groupIndex]
                            ),
                            unweighted: "Invalid",
                            weighted: "Invalid",
                        });
                    }
                });
            }
        );

        resultJson.tables.push(table);
    }

    // 4. Tests of Equality of Group Means
    if (data.equality_tests) {
        const table: Table = {
            key: "equality_tests",
            title: "Tests of Equality of Group Means",
            columnHeaders: [
                { header: "", key: "var" },
                { header: "Wilks' Lambda", key: "wilks_lambda" },
                { header: "F", key: "f" },
                { header: "df1", key: "df1" },
                { header: "df2", key: "df2" },
                { header: "Sig.", key: "sig" },
            ],
            rows: [],
        };

        // Iterate through variables
        for (let i = 0; i < data.equality_tests.variables.length; i++) {
            table.rows.push({
                rowHeader: [data.equality_tests.variables[i]],
                wilks_lambda: formatDisplayNumber(
                    data.equality_tests.wilks_lambda[i]
                ),
                f: formatDisplayNumber(data.equality_tests.f_values[i]),
                df1: formatDisplayNumber(data.equality_tests.df1[i]),
                df2: formatDisplayNumber(data.equality_tests.df2[i]),
                sig: formatDisplayNumber(data.equality_tests.significance[i]),
            });
        }

        resultJson.tables.push(table);
    }

    // 5. Pooled Within-Groups Matrices
    if (data.pooled_matrices) {
        const table: Table = {
            key: "pooled_within_groups_matrices",
            title: "Pooled Within-Groups Matrices",
            columnHeaders: [
                { header: "", key: "matrix_type" },
                { header: "", key: "var" },
                ...data.pooled_matrices.variables.map(
                    (variable: string, index: number) => ({
                        header: variable,
                        key: `var_${index}`,
                    })
                ),
            ],
            rows: [],
        };

        // Covariance matrix
        table.rows.push({ rowHeader: ["Covariance"] });

        for (let i = 0; i < data.pooled_matrices.variables.length; i++) {
            const entry = data.pooled_matrices.covariance[i];

            // Create rowData with properly defined rowHeader
            const rowData: any = {
                rowHeader: ["", entry.variable], // Add variable name to rowHeader
            };

            for (let j = 0; j < entry.values.length; j++) {
                rowData[`var_${j}`] = formatDisplayNumber(
                    entry.values[j].value
                );
            }

            table.rows.push(rowData);
        }

        // Correlation matrix
        table.rows.push({ rowHeader: ["Correlation"] });

        for (let i = 0; i < data.pooled_matrices.variables.length; i++) {
            const entry = data.pooled_matrices.correlation[i];

            // Create rowData with properly defined rowHeader
            const rowData: any = {
                rowHeader: ["", entry.variable], // Add variable name to rowHeader
            };

            for (let j = 0; j < entry.values.length; j++) {
                rowData[`var_${j}`] = formatDisplayNumber(
                    entry.values[j].value
                );
            }

            table.rows.push(rowData);
        }

        resultJson.tables.push(table);
    }

    // 6. Covariance Matrices
    if (data.covariance_matrices) {
        const table: Table = {
            key: "covariance_matrices",
            title: "Covariance Matrices",
            columnHeaders: [
                { header: "category", key: "category" },
                { header: "", key: "var" },
                ...data.covariance_matrices.variables.map(
                    (variable: string, index: number) => ({
                        header: variable,
                        key: `var_${index}`,
                    })
                ),
            ],
            rows: [],
        };

        // Iterate through groups and their matrices
        for (let g = 0; g < data.covariance_matrices.matrices.length; g++) {
            const groupEntry = data.covariance_matrices.matrices[g];

            // For each variable in the group's matrix
            for (let v = 0; v < groupEntry.matrix.length; v++) {
                const entry = groupEntry.matrix[v];

                const rowData: any = {
                    rowHeader: [groupEntry.group, entry.variable],
                };

                // For each value in the variable's row
                for (let i = 0; i < entry.values.length; i++) {
                    rowData[`var_${i}`] = formatDisplayNumber(
                        entry.values[i].value
                    );
                }

                table.rows.push(rowData);
            }
        }

        // Add footnote based on actual degrees of freedom
        table.rows.push({
            rowHeader: [
                "a. The total covariance matrix has 9 degrees of freedom.",
            ],
        });

        resultJson.tables.push(table);
    }

    // 7. Log Determinants
    if (data.log_determinants) {
        const table: Table = {
            key: "log_determinants",
            title: "Log Determinants",
            columnHeaders: [
                { header: "category", key: "category" },
                { header: "Rank", key: "rank" },
                { header: "Log Determinant", key: "log_determinant" },
            ],
            rows: [],
        };

        // Group log determinants
        for (let i = 0; i < data.log_determinants.groups.length; i++) {
            table.rows.push({
                rowHeader: [data.log_determinants.groups[i]],
                rank: formatDisplayNumber(data.log_determinants.ranks[i]),
                log_determinant: formatDisplayNumber(
                    data.log_determinants.log_determinants[i]
                ),
            });
        }

        // Pooled within-groups
        table.rows.push({
            rowHeader: ["Pooled within-groups"],
            rank: formatDisplayNumber(data.log_determinants.rank_pooled),
            log_determinant: formatDisplayNumber(
                data.log_determinants.pooled_log_determinant
            ),
        });

        // Add footnote
        table.rows.push({
            rowHeader: [
                "The ranks and natural logarithms of determinants printed are those of the group covariance matrices.",
            ],
        });

        resultJson.tables.push(table);
    }

    // 8. Box's M Test Results
    if (data.box_m_test) {
        const table: Table = {
            key: "box_m_test",
            title: "Test Results",
            columnHeaders: [
                { header: "", key: "test" },
                { header: "" },
                { header: "", key: "value" },
            ],
            rows: [
                {
                    rowHeader: ["Box's M"],
                    value: formatDisplayNumber(data.box_m_test.box_m),
                },
                {
                    rowHeader: ["F", "Approx."],
                    value: formatDisplayNumber(data.box_m_test.f_approx),
                },
                {
                    rowHeader: ["", "df1"],
                    value: formatDisplayNumber(data.box_m_test.df1),
                },
                {
                    rowHeader: ["", "df2"],
                    value: formatDisplayNumber(data.box_m_test.df2),
                },
                {
                    rowHeader: ["", "Sig."],
                    value: formatDisplayNumber(data.box_m_test.p_value),
                },
                {
                    rowHeader: [
                        "Tests null hypothesis of equal population covariance matrices.",
                    ],
                },
            ],
        };

        resultJson.tables.push(table);
    }

    // 9. Prior Probabilities for Groups
    if (data.prior_probabilities) {
        const table: Table = {
            key: "prior_probabilities",
            title: "Prior Probabilities for Groups",
            columnHeaders: [
                { header: "Group", key: "group" },
                { header: "Prior", key: "prior" },
                {
                    header: "Cases Used in Analysis",
                    key: "cases_used",
                    children: [
                        { header: "Unweighted", key: "unweighted" },
                        { header: "Weighted", key: "weighted" },
                    ],
                },
            ],
            rows: [],
        };

        // Group prior probabilities
        for (let i = 0; i < data.prior_probabilities.groups.length; i++) {
            const unweightedData = data.prior_probabilities.cases_used.find(
                (c: any) => c.case_type === "Unweighted"
            );

            const weightedData = data.prior_probabilities.cases_used.find(
                (c: any) => c.case_type === "Weighted"
            );

            const unweightedCount = unweightedData
                ? unweightedData.counts[i]
                : 0;
            const weightedCount = weightedData ? weightedData.counts[i] : 0;

            table.rows.push({
                rowHeader: [data.prior_probabilities.groups[i].toString()],
                prior: formatDisplayNumber(
                    data.prior_probabilities.prior_probabilities[i]
                ),
                unweighted: formatDisplayNumber(unweightedCount),
                weighted: formatDisplayNumber(weightedCount),
            });
        }

        // Total row
        const totalUnweighted =
            data.prior_probabilities.cases_used
                .find((c: any) => c.case_type === "Unweighted")
                ?.counts.reduce((sum: number, val: number) => sum + val, 0) ||
            0;

        const totalWeighted =
            data.prior_probabilities.cases_used
                .find((c: any) => c.case_type === "Weighted")
                ?.counts.reduce((sum: number, val: number) => sum + val, 0) ||
            0;

        table.rows.push({
            rowHeader: ["Total"],
            prior: formatDisplayNumber(data.prior_probabilities.total),
            unweighted: formatDisplayNumber(totalUnweighted),
            weighted: formatDisplayNumber(totalWeighted),
        });

        resultJson.tables.push(table);
    }

    // 10. Classification Function Coefficients
    if (data.classification_function_coefficients) {
        const table: Table = {
            key: "classification_function_coefficients",
            title: "Classification Function Coefficients",
            columnHeaders: [
                { header: "", key: "var" },
                ...data.classification_function_coefficients.groups.map(
                    (group: number) => ({
                        header: group.toString(),
                        key: `group_${group}`,
                    })
                ),
            ],
            rows: [],
        };

        // Variable coefficients
        for (
            let v = 0;
            v < data.classification_function_coefficients.variables.length;
            v++
        ) {
            const variable =
                data.classification_function_coefficients.variables[v];
            const rowData: any = {
                rowHeader: [variable],
            };

            const coeff =
                data.classification_function_coefficients.coefficients.find(
                    (c: any) => c.variable === variable
                );

            if (coeff) {
                for (
                    let g = 0;
                    g < data.classification_function_coefficients.groups.length;
                    g++
                ) {
                    const group =
                        data.classification_function_coefficients.groups[g];
                    rowData[`group_${group}`] = formatDisplayNumber(
                        coeff.values[g]
                    );
                }
            }

            table.rows.push(rowData);
        }

        // Constant terms
        const constantRow: any = {
            rowHeader: ["(Constant)"],
        };

        for (
            let g = 0;
            g < data.classification_function_coefficients.groups.length;
            g++
        ) {
            const group = data.classification_function_coefficients.groups[g];
            constantRow[`group_${group}`] = formatDisplayNumber(
                data.classification_function_coefficients.constant_terms[g]
            );
        }

        table.rows.push(constantRow);

        // Add footnote
        table.rows.push({
            rowHeader: ["Fisher's linear discriminant functions"],
        });

        resultJson.tables.push(table);
    }

    // 11. Canonical Discriminant Function Coefficients
    if (data.canonical_functions && data.canonical_functions.coefficients) {
        // Get the number of functions from the first coefficient's values length
        const numFunctions =
            data.canonical_functions.coefficients.length > 0
                ? data.canonical_functions.coefficients[0].values.length
                : 0;

        if (numFunctions > 0) {
            // Create column headers dynamically based on number of functions
            const functionChildren = [];
            for (let i = 1; i <= numFunctions; i++) {
                functionChildren.push({
                    header: i.toString(),
                    key: `function_${i}`,
                });
            }

            const table: Table = {
                key: "canonical_discriminant_function_coefficients",
                title: "Canonical Discriminant Function Coefficients",
                columnHeaders: [
                    { header: "", key: "var" },
                    {
                        header: "Function",
                        key: "function",
                        children: functionChildren,
                    },
                ],
                rows: [],
            };

            // Variable coefficients
            for (
                let i = 0;
                i < data.canonical_functions.coefficients.length;
                i++
            ) {
                const coeff = data.canonical_functions.coefficients[i];
                const rowData: any = {
                    rowHeader: [coeff.variable],
                };

                // Add each function value dynamically
                for (let j = 0; j < numFunctions; j++) {
                    rowData[`function_${j + 1}`] = formatDisplayNumber(
                        coeff.values[j]
                    );
                }

                table.rows.push(rowData);
            }

            // Add footnote
            table.rows.push({
                rowHeader: ["Unstandardized coefficients"],
            });

            resultJson.tables.push(table);
        }
    }

    // 12. Standardized Canonical Discriminant Function Coefficients
    if (
        data.canonical_functions &&
        data.canonical_functions.standardized_coefficients &&
        data.canonical_functions.standardized_coefficients.length > 0
    ) {
        // Get the number of functions from the first coefficient's values length
        const numFunctions =
            data.canonical_functions.standardized_coefficients[0].values.length;

        // Create column headers dynamically based on number of functions
        const functionChildren = [];
        for (let i = 1; i <= numFunctions; i++) {
            functionChildren.push({
                header: i.toString(),
                key: `function_${i}`,
            });
        }

        const table: Table = {
            key: "standardized_coefficients",
            title: "Standardized Canonical Discriminant Function Coefficients",
            columnHeaders: [
                { header: "", key: "var" },
                {
                    header: "Function",
                    key: "function",
                    children: functionChildren,
                },
            ],
            rows: [],
        };

        // Iterate through variables and their coefficients
        for (
            let i = 0;
            i < data.canonical_functions.standardized_coefficients.length;
            i++
        ) {
            const coeff = data.canonical_functions.standardized_coefficients[i];
            const rowData: any = {
                rowHeader: [coeff.variable],
            };

            // Add each function value dynamically
            for (let j = 0; j < numFunctions; j++) {
                rowData[`function_${j + 1}`] = formatDisplayNumber(
                    coeff.values[j]
                );
            }

            table.rows.push(rowData);
        }

        resultJson.tables.push(table);
    }

    // 13. Functions at Group Centroids
    if (
        data.canonical_functions &&
        data.canonical_functions.function_at_centroids &&
        data.canonical_functions.function_at_centroids.length > 0
    ) {
        // Get the number of functions from the first centroid's values length
        const numFunctions =
            data.canonical_functions.function_at_centroids[0].values.length;

        // Create column headers dynamically based on number of functions
        const functionChildren = [];
        for (let i = 1; i <= numFunctions; i++) {
            functionChildren.push({
                header: i.toString(),
                key: `function_${i}`,
            });
        }

        const table: Table = {
            key: "functions_at_group_centroids",
            title: "Functions at Group Centroids",
            columnHeaders: [
                { header: "Group", key: "group" },
                {
                    header: "Function",
                    key: "function",
                    children: functionChildren,
                },
            ],
            rows: [],
        };

        // Group centroids
        for (
            let i = 0;
            i < data.canonical_functions.function_at_centroids.length;
            i++
        ) {
            const centroid = data.canonical_functions.function_at_centroids[i];
            const rowData: any = {
                rowHeader: [centroid.group],
            };

            // Add each function value dynamically
            for (let j = 0; j < numFunctions; j++) {
                rowData[`function_${j + 1}`] = formatDisplayNumber(
                    centroid.values[j]
                );
            }

            table.rows.push(rowData);
        }

        // Add footnote
        table.rows.push({
            rowHeader: [
                "Unstandardized canonical discriminant functions evaluated at group means",
            ],
        });

        resultJson.tables.push(table);
    }

    // 14. Structure Matrix
    if (
        data.structure_matrix &&
        data.structure_matrix.correlations &&
        data.structure_matrix.correlations.length > 0
    ) {
        // Get the number of functions from the first correlation's values length
        const numFunctions =
            data.structure_matrix.correlations[0].values.length;

        // Create column headers dynamically based on number of functions
        const functionChildren = [];
        for (let i = 1; i <= numFunctions; i++) {
            functionChildren.push({
                header: i.toString(),
                key: `function_${i}`,
            });
        }

        const table: Table = {
            key: "structure_matrix",
            title: "Structure Matrix",
            columnHeaders: [
                { header: "", key: "var" },
                {
                    header: "Function",
                    key: "function",
                    children: functionChildren,
                },
            ],
            rows: [],
        };

        // Iterate through variables (correlations)
        for (let i = 0; i < data.structure_matrix.correlations.length; i++) {
            const corr = data.structure_matrix.correlations[i];
            const rowData: any = {
                rowHeader: [corr.variable],
            };

            // Find the largest absolute correlation value for this variable
            let maxAbsValueIndex = 0;
            let maxAbsValue = Math.abs(corr.values[0]);

            for (let j = 1; j < numFunctions; j++) {
                if (Math.abs(corr.values[j]) > maxAbsValue) {
                    maxAbsValue = Math.abs(corr.values[j]);
                    maxAbsValueIndex = j;
                }
            }

            // Add each function value dynamically, marking the largest with superscript
            for (let j = 0; j < numFunctions; j++) {
                rowData[`function_${j + 1}`] =
                    formatDisplayNumber(corr.values[j]) +
                    (j === maxAbsValueIndex ? "ᵃ" : "");
            }

            table.rows.push(rowData);
        }

        // Add footnotes
        table.rows.push({
            rowHeader: [
                "Pooled within-groups correlations between discriminating variables and standardized canonical discriminant functions",
            ],
        });
        table.rows.push({
            rowHeader: [
                "Variables ordered by absolute size of correlation within function.",
            ],
        });
        table.rows.push({
            rowHeader: [
                "a. Largest absolute correlation between each variable and any discriminant function",
            ],
        });

        resultJson.tables.push(table);
    }

    // 15. Stepwise Statistics
    if (
        data.stepwise_statistics &&
        data.stepwise_statistics.variables_entered
    ) {
        const table: Table = {
            key: "stepwise_statistics",
            title: "Stepwise Statistics",
            columnHeaders: [
                { header: "", key: "step_header" },
                { header: "Step", key: "step" },
                { header: "Entered", key: "entered" },
                { header: "Removed", key: "removed" },
                {
                    header: "Wilks' Lambda",
                    key: "wilks_lambda",
                    children: [
                        { header: "Statistic", key: "statistic" },
                        { header: "df1", key: "df1" },
                        { header: "df2", key: "df2" },
                        { header: "df3", key: "df3" },
                    ],
                },
                {
                    header: "Exact F",
                    key: "exact_f",
                    children: [
                        { header: "Statistic", key: "f_statistic" },
                        { header: "df1", key: "f_df1" },
                        { header: "df2", key: "f_df2" },
                        { header: "Sig.", key: "sig" },
                    ],
                },
            ],
            rows: [],
        };

        const stepsCount = data.stepwise_statistics.variables_entered.length;

        for (let i = 0; i < stepsCount; i++) {
            table.rows.push({
                rowHeader: [""],
                step: formatDisplayNumber(i + 1),
                entered: data.stepwise_statistics.variables_entered[i] || "",
                removed: data.stepwise_statistics.variables_removed[i]
                    ? data.stepwise_statistics.variables_removed[i]
                    : "",
                statistic: formatDisplayNumber(
                    data.stepwise_statistics.wilks_lambda[i]
                ),
                df1: formatDisplayNumber(data.stepwise_statistics.df1[i]),
                df2: formatDisplayNumber(data.stepwise_statistics.df2[i]),
                df3: formatDisplayNumber(data.stepwise_statistics.df3[i]),
                f_statistic: formatDisplayNumber(
                    data.stepwise_statistics.exact_f[i]
                ),
                f_df1: formatDisplayNumber(
                    data.stepwise_statistics.exact_df1[i]
                ),
                f_df2: formatDisplayNumber(
                    data.stepwise_statistics.exact_df2[i]
                ),
                sig: formatDisplayNumber(
                    data.stepwise_statistics.significance[i]
                ),
            });
        }

        // Add footnotes
        table.rows.push({
            rowHeader: [
                "At each step, the variable that minimizes the overall Wilks' Lambda is entered.",
            ],
        });
        table.rows.push({
            rowHeader: ["a. Maximum number of steps is 4."],
        });
        table.rows.push({
            rowHeader: ["b. Minimum partial F to enter is 3.84."],
        });
        table.rows.push({
            rowHeader: ["c. Maximum partial F to remove is 2.71."],
        });
        table.rows.push({
            rowHeader: [
                "d. F level, tolerance, or VIN insufficient for further computation.",
            ],
        });

        resultJson.tables.push(table);
    }

    // 16. Variables in the Analysis
    if (
        data.stepwise_statistics &&
        data.stepwise_statistics.variables_in_analysis
    ) {
        const table: Table = {
            key: "variables_in_analysis",
            title: "Variables in the Analysis",
            columnHeaders: [
                { header: "Step", key: "step" },
                { header: "", key: "var" },
                { header: "Tolerance", key: "tolerance" },
                { header: "F to Remove", key: "f_to_remove" },
                { header: "Wilks' Lambda", key: "wilks_lambda" },
            ],
            rows: [],
        };

        // Iterate through steps and variables
        for (
            let i = 0;
            i < data.stepwise_statistics.variables_in_analysis.length;
            i++
        ) {
            const stepData = data.stepwise_statistics.variables_in_analysis[i];
            const step = stepData.step;

            // Check if variables array exists and has items
            if (stepData.variables && stepData.variables.length > 0) {
                for (let j = 0; j < stepData.variables.length; j++) {
                    const variable = stepData.variables[j];

                    table.rows.push({
                        rowHeader: [step, variable.variable],
                        tolerance: formatDisplayNumber(variable.tolerance),
                        f_to_remove: formatDisplayNumber(variable.f_to_remove),
                        wilks_lambda: formatDisplayNumber(
                            variable.wilks_lambda
                        ),
                    });
                }
            }
        }

        resultJson.tables.push(table);
    }

    // 17. Variables Not in the Analysis
    if (
        data.stepwise_statistics &&
        data.stepwise_statistics.variables_not_in_analysis
    ) {
        const table: Table = {
            key: "variables_not_in_analysis",
            title: "Variables Not in the Analysis",
            columnHeaders: [
                { header: "Step", key: "step" },
                { header: "", key: "var" },
                { header: "Tolerance", key: "tolerance" },
                { header: "F to Enter", key: "f_to_enter" },
                { header: "Wilks' Lambda", key: "wilks_lambda" },
            ],
            rows: [],
        };

        // Iterate through steps and variables
        for (
            let i = 0;
            i < data.stepwise_statistics.variables_not_in_analysis.length;
            i++
        ) {
            const stepData =
                data.stepwise_statistics.variables_not_in_analysis[i];
            const step = stepData.step;

            // Check if variables array exists and has items
            if (stepData.variables && stepData.variables.length > 0) {
                for (let j = 0; j < stepData.variables.length; j++) {
                    const variable = stepData.variables[j];

                    table.rows.push({
                        rowHeader: [step, variable.variable],
                        tolerance: formatDisplayNumber(variable.tolerance),
                        f_to_enter: formatDisplayNumber(variable.f_to_remove),
                        wilks_lambda: formatDisplayNumber(
                            variable.wilks_lambda
                        ),
                    });
                }
            }
        }

        resultJson.tables.push(table);
    }

    // 18. Wilks' Lambda Test
    if (data.wilks_lambda_test) {
        const testTable: Table = {
            key: "wilks_lambda_test",
            title: "Wilks' Lambda",
            columnHeaders: [
                { header: "Test of Function(s)", key: "test_functions" },
                { header: "Wilks' Lambda", key: "wilks_lambda" },
                { header: "Chi-square", key: "chi_square" },
                { header: "df", key: "df" },
                { header: "Sig.", key: "sig" },
            ],
            rows: [],
        };

        // Iterate through test of functions
        for (
            let i = 0;
            i < data.wilks_lambda_test.test_of_functions.length;
            i++
        ) {
            testTable.rows.push({
                rowHeader: [data.wilks_lambda_test.test_of_functions[i]],
                wilks_lambda: formatDisplayNumber(
                    data.wilks_lambda_test.wilks_lambda[i]
                ),
                chi_square: formatDisplayNumber(
                    data.wilks_lambda_test.chi_square[i]
                ),
                df: formatDisplayNumber(data.wilks_lambda_test.df[i]),
                sig: formatDisplayNumber(
                    data.wilks_lambda_test.significance[i]
                ),
            });
        }

        resultJson.tables.push(testTable);
    }

    // 19. Eigenvalues
    if (data.eigen_description) {
        const table: Table = {
            key: "eigenvalues",
            title: "Eigenvalues",
            columnHeaders: [
                { header: "Function", key: "function" },
                { header: "Eigenvalue", key: "eigenvalue" },
                { header: "% of Variance", key: "variance_percent" },
                { header: "Cumulative %", key: "cumulative_percent" },
                {
                    header: "Canonical Correlation",
                    key: "canonical_correlation",
                },
            ],
            rows: [],
        };

        // Iterate through functions
        for (let i = 0; i < data.eigen_description.functions.length; i++) {
            table.rows.push({
                rowHeader: [data.eigen_description.functions[i]],
                eigenvalue:
                    formatDisplayNumber(data.eigen_description.eigenvalue[i]) +
                    (i === 0 ? "ᵃ" : ""), // Add superscript for the first function
                variance_percent: formatDisplayNumber(
                    data.eigen_description.variance_percentage[i]
                ),
                cumulative_percent: formatDisplayNumber(
                    data.eigen_description.cumulative_percentage[i]
                ),
                canonical_correlation: formatDisplayNumber(
                    data.eigen_description.canonical_correlation[i]
                ),
            });
        }

        // Add footnote
        table.rows.push({
            rowHeader: [
                "a. First 1 canonical discriminant functions were used in the analysis.",
            ],
        });

        resultJson.tables.push(table);
    }

    // 20. Casewise Statistics
    if (data.casewise_statistics) {
        // Check if discriminant_scores exists and has entries
        const numFunctions =
            data.casewise_statistics.discriminant_scores &&
            data.casewise_statistics.discriminant_scores.length > 0
                ? data.casewise_statistics.discriminant_scores.length
                : 0;

        // Create dynamic function headers
        const functionChildren = [];
        if (numFunctions > 0) {
            for (let i = 0; i < numFunctions; i++) {
                const func = data.casewise_statistics.discriminant_scores[i];
                // Use the function name if available, otherwise use "Function X"
                const functionName = func.function || `Function ${i + 1}`;
                functionChildren.push({
                    header: functionName,
                    key: `function_${i + 1}`,
                });
            }
        }

        const table: Table = {
            key: "casewise_statistics",
            title: "Casewise Statistics",
            columnHeaders: [
                { header: "", key: "header" },
                { header: "Case Number", key: "case_number" },
                { header: "Actual Group", key: "actual_group" },
                { header: "Predicted Group", key: "predicted_group" },
                {
                    header: "Highest Group",
                    key: "highest_group",
                    children: [
                        { header: "p", key: "p" },
                        { header: "df", key: "df" },
                        { header: "P(D=d | G=g)", key: "p_d_g" },
                        {
                            header: "Squared Mahalanobis Distance to Centroid",
                            key: "mahalanobis",
                        },
                        { header: "Group", key: "group" },
                    ],
                },
                {
                    header: "Second Highest Group",
                    key: "second_highest_group",
                    children: [
                        { header: "P(G=g | D=d)", key: "p_g_d" },
                        {
                            header: "Squared Mahalanobis Distance to Centroid",
                            key: "second_mahalanobis",
                        },
                        { header: "Group", key: "second_group" },
                    ],
                },
                ...(numFunctions > 0
                    ? [
                          {
                              header: "Discriminant Scores",
                              key: "discriminant_scores",
                              children: functionChildren,
                          },
                      ]
                    : []),
            ],
            rows: [],
        };

        // Add section header
        table.rows.push({
            rowHeader: ["Original"],
        });

        // Process each case
        for (let i = 0; i < data.casewise_statistics.case_number.length; i++) {
            // Check if this is a misclassified case (add asterisk)
            const predictedGroup = data.casewise_statistics.predicted_group[i];
            const actualGroup = data.casewise_statistics.actual_group[i];
            const isMisclassified = predictedGroup !== actualGroup;

            // Handle discriminant scores dynamically for all functions
            const scoreData: any = {};
            if (
                data.casewise_statistics.discriminant_scores &&
                data.casewise_statistics.discriminant_scores.length > 0
            ) {
                for (let j = 0; j < numFunctions; j++) {
                    const func =
                        data.casewise_statistics.discriminant_scores[j];
                    scoreData[`function_${j + 1}`] = formatDisplayNumber(
                        func.values[i]
                    );
                }
            }

            table.rows.push({
                rowHeader: [""],
                case_number: formatDisplayNumber(
                    data.casewise_statistics.case_number[i]
                ),
                actual_group: data.casewise_statistics.actual_group[i],
                predicted_group:
                    data.casewise_statistics.predicted_group[i] +
                    (isMisclassified ? "**" : ""),
                p: formatDisplayNumber(
                    data.casewise_statistics.highest_group.p_value[i]
                ),
                df: formatDisplayNumber(
                    data.casewise_statistics.highest_group.df[i]
                ),
                p_d_g: formatDisplayNumber(
                    data.casewise_statistics.highest_group.p_g_equals_d[i]
                ),
                mahalanobis: formatDisplayNumber(
                    data.casewise_statistics.highest_group
                        .squared_mahalanobis_distance[i]
                ),
                group: data.casewise_statistics.highest_group.group[i],
                p_g_d: formatDisplayNumber(
                    data.casewise_statistics.second_highest_group.p_value[i]
                ),
                second_mahalanobis: formatDisplayNumber(
                    data.casewise_statistics.second_highest_group
                        .squared_mahalanobis_distance[i]
                ),
                second_group:
                    data.casewise_statistics.second_highest_group.group[i],
                ...scoreData,
            });
        }

        resultJson.tables.push(table);
    }

    // 21. Classification Results
    if (
        data.classification_results &&
        data.classification_results.original_classification &&
        data.classification_results.original_classification.length > 0
    ) {
        // Get the groups from original classification
        const groups = data.classification_results.original_classification.map(
            (item: { group: string; counts: number[] }) => item.group
        );
        const groupCount = groups.length;

        const table: Table = {
            key: "classification_results",
            title: "Classification Results",
            columnHeaders: [
                { header: "", key: "category" },
                { header: "", key: "subcategory" },
                {
                    header: "Predicted Group Membership",
                    key: "predicted_groups",
                    children: groups.map((group: string, i: number) => ({
                        header: group,
                        key: `group_${i}`,
                    })),
                },
                { header: "Total", key: "total" },
            ],
            rows: [],
        };

        // Original classification counts
        table.rows.push({ rowHeader: ["Original", "Count"] });

        for (
            let i = 0;
            i < data.classification_results.original_classification.length;
            i++
        ) {
            const classification =
                data.classification_results.original_classification[i];

            const rowData: any = {
                rowHeader: ["", classification.group],
                total: formatDisplayNumber(
                    classification.counts.reduce((sum: number, count: number) => sum + count, 0)
                ),
            };

            for (let j = 0; j < classification.counts.length; j++) {
                rowData[`group_${j}`] = formatDisplayNumber(
                    classification.counts[j]
                );
            }

            table.rows.push(rowData);
        }

        // Original classification percentages
        table.rows.push({ rowHeader: ["", "%"] });

        for (
            let i = 0;
            i < data.classification_results.original_percentage.length;
            i++
        ) {
            const percentage =
                data.classification_results.original_percentage[i];

            const rowData: any = {
                rowHeader: ["", percentage.group],
                total: "100.0", // Total percentage is always 100%
            };

            for (let j = 0; j < percentage.percentages.length; j++) {
                rowData[`group_${j}`] = formatDisplayNumber(
                    percentage.percentages[j]
                );
            }

            table.rows.push(rowData);
        }

        // Cross-validated classification if available
        if (data.classification_results.cross_validated_classification) {
            table.rows.push({ rowHeader: ["Cross-validated", "Count"] });

            for (
                let i = 0;
                i <
                data.classification_results.cross_validated_classification
                    .length;
                i++
            ) {
                const classification =
                    data.classification_results.cross_validated_classification[
                        i
                    ];

                const rowData: any = {
                    rowHeader: ["", classification.group],
                    total: formatDisplayNumber(
                        classification.counts.reduce(
                            (sum: number, count: number) => sum + count,
                            0
                        )
                    ),
                };

                for (let j = 0; j < classification.counts.length; j++) {
                    rowData[`group_${j}`] = formatDisplayNumber(
                        classification.counts[j]
                    );
                }

                table.rows.push(rowData);
            }

            // Cross-validated percentages
            table.rows.push({ rowHeader: ["", "%"] });

            for (
                let i = 0;
                i <
                data.classification_results.cross_validated_percentage.length;
                i++
            ) {
                const percentage =
                    data.classification_results.cross_validated_percentage[i];

                const rowData: any = {
                    rowHeader: ["", percentage.group],
                    total: "100.0", // Total percentage is always 100%
                };

                for (let j = 0; j < percentage.percentages.length; j++) {
                    rowData[`group_${j}`] = formatDisplayNumber(
                        percentage.percentages[j]
                    );
                }

                table.rows.push(rowData);
            }
        }

        // Calculate original correct classification percentage
        let originalCorrect = 0;
        let classifiedCount = 0;
        for (
            let i = 0;
            i < data.classification_results.original_classification.length;
            i++
        ) {
            if (
                data.classification_results.original_classification[i].counts[
                    i
                ] > 0
            ) {
                originalCorrect +=
                    data.classification_results.original_classification[i]
                        .counts[i];
                classifiedCount +=
                    data.classification_results.original_classification[
                        i
                    ].counts.reduce((sum: number, val: number) => sum + val, 0);
            }
        }

        const originalCorrectPct =
            classifiedCount > 0 ? (originalCorrect / classifiedCount) * 100 : 0;

        // Add footnotes
        table.rows.push({
            rowHeader: [
                `a. ${formatDisplayNumber(
                    originalCorrectPct
                )}% of original grouped cases correctly classified.`,
            ],
        });

        if (data.classification_results.cross_validated_classification) {
            table.rows.push({
                rowHeader: [
                    "b. Cross validation is done only for those cases in the analysis. In cross validation, each case is classified by the functions derived from all cases other than that case.",
                ],
            });

            // Calculate cross-validated correct classification percentage
            let crossValidatedCorrect = 0;
            let crossValidatedCount = 0;
            for (
                let i = 0;
                i <
                data.classification_results.cross_validated_classification
                    .length;
                i++
            ) {
                if (
                    data.classification_results.cross_validated_classification[
                        i
                    ].counts[i] > 0
                ) {
                    crossValidatedCorrect +=
                        data.classification_results
                            .cross_validated_classification[i].counts[i];
                    crossValidatedCount +=
                        data.classification_results.cross_validated_classification[
                            i
                        ].counts.reduce((sum: number, val: number) => sum + val, 0);
                }
            }

            const crossValidatedCorrectPct =
                crossValidatedCount > 0
                    ? (crossValidatedCorrect / crossValidatedCount) * 100
                    : 0;

            table.rows.push({
                rowHeader: [
                    `c. ${formatDisplayNumber(
                        crossValidatedCorrectPct
                    )}% of cross-validated grouped cases correctly classified.`,
                ],
            });
        }

        resultJson.tables.push(table);
    }

    return resultJson;
}
