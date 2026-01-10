import { formatDisplayNumber, formatSig } from "@/hooks/useFormatter";
import { ResultJson, Row, Table } from "@/types/Table";

export function formatPart1(data: any, resultJson: ResultJson) {
    // 1. Between-Subjects Factors table
    if (data.between_subjects_factors) {
        const table: Table = {
            key: "between_subjects_factors",
            title: "Between-Subjects Factors",
            columnHeaders: [
                { header: "", key: "factor" },
                { header: "", key: "value" },
                { header: "N", key: "n" },
            ],
            rows: [],
            note: data.between_subjects_factors[0]?.note,
            interpretation: data.between_subjects_factors[0]?.interpretation,
        };

        // Process each factor
        if (Array.isArray(data.between_subjects_factors)) {
            data.between_subjects_factors.forEach((factorGroup: any) => {
                const factorName = factorGroup.name;
                if (factorGroup.factors && Array.isArray(factorGroup.factors)) {
                    factorGroup.factors.forEach(
                        (factor: any, index: number) => {
                            table.rows.push({
                                rowHeader: [],
                                factor: index === 0 ? factorName : "",
                                value: factor.name,
                                n: String(factor.value),
                            });
                        }
                    );
                }
            });
        }

        resultJson.tables.push(table);
    }

    // 2. Descriptive Statistics table
    if (data.descriptive_statistics) {
        Object.values(data.descriptive_statistics).forEach((stat: any) => {
            const factorKeys = stat.factor_names.map((name: string) =>
                name.toLowerCase().replace(/\s+/g, "_")
            );
            const factorHeaders = stat.factor_names.map(
                (name: string, i: number) => ({
                    header: name.charAt(0).toUpperCase() + name.slice(1),
                    key: factorKeys[i],
                })
            );

            const table: Table = {
                key: "descriptive_statistics",
                title: `Descriptive Statistics`,
                columnHeaders: [
                    ...factorHeaders,
                    { header: "Mean", key: "mean" },
                    { header: "Std. Deviation", key: "std_deviation" },
                    { header: "N", key: "n" },
                ],
                rows: [],
                note: stat.note,
                interpretation: stat.interpretation,
            };

            const allRows: Row[] = [];

            function addRows(groups: any[], path: { [key: string]: string }) {
                groups.forEach((group) => {
                    const newPath: { [key: string]: string } = {
                        ...path,
                        [group.factor_name]: group.factor_value,
                    };

                    const isLeafNode =
                        !group.subgroups || group.subgroups.length === 0;

                    if (isLeafNode) {
                        const row: { [key: string]: any } = { rowHeader: [] };
                        const factorValues = Object.fromEntries(
                            stat.factor_names.map((name: string) => [
                                name.toLowerCase().replace(/\s+/g, "_"),
                                newPath[name],
                            ])
                        );
                        Object.assign(row, factorValues);

                        row.mean = formatDisplayNumber(group.stats.mean);
                        const stdDev = group.stats.std_deviation;
                        row.std_deviation =
                            stdDev === null || isNaN(stdDev)
                                ? "."
                                : formatDisplayNumber(stdDev);
                        row.n = group.stats.n;
                        allRows.push(row as Row);
                    } else {
                        addRows(group.subgroups, newPath);
                    }
                });
            }

            if (stat.groups) {
                addRows(stat.groups, {});
            }

            const processedRows: Row[] = [];
            const lastFactorValues: (string | null)[] = new Array(
                stat.factor_names.length
            ).fill(null);

            allRows.forEach((row) => {
                const newRow: any = { ...row };
                for (let i = 0; i < stat.factor_names.length; i++) {
                    const key = factorKeys[i];
                    if (newRow[key] === lastFactorValues[i]) {
                        newRow[key] = "";
                    } else {
                        lastFactorValues[i] = newRow[key] as string;
                        for (let j = i + 1; j < stat.factor_names.length; j++) {
                            lastFactorValues[j] = null;
                        }
                    }
                }
                processedRows.push(newRow);
            });

            table.rows = processedRows;
            resultJson.tables.push(table);
        });
    }

    // 3. Levene's Test table
    if (data.levene_test && data.levene_test.length > 0) {
        const firstTest = data.levene_test[0];
        const isSimpleLevene =
            firstTest &&
            firstTest.entries &&
            firstTest.entries.length === 1 &&
            firstTest.entries[0].function === "Levene";

        if (isSimpleLevene) {
            data.levene_test.forEach((test: any) => {
                const entry = test.entries[0];
                const table: any = {
                    key: `levene_test_${test.dependent_variable.replace(
                        /\s+/g,
                        "_"
                    )}`,
                    title: "Levene's Test of Equality of Error Variances",
                    subtitle: `Dependent Variable: ${test.dependent_variable}`,
                    columnHeaders: [
                        { header: "", key: "dependent_variable" },
                        { header: "F", key: "f" },
                        { header: "df1", key: "df1" },
                        { header: "df2", key: "df2" },
                        { header: "Sig.", key: "sig" },
                    ],
                    rows: [
                        {
                            rowHeader: [],
                            f: formatDisplayNumber(entry.levene_statistic),
                            df1: entry.df1,
                            df2: formatDisplayNumber(entry.df2),
                            sig: formatDisplayNumber(entry.significance),
                        },
                    ],
                    note: test.note,
                    interpretation: test.interpretation,
                };

                const nullColumns = {
                    f: null,
                    df1: null,
                    df2: null,
                    sig: null,
                };

                table.rows.push({
                    rowHeader: [
                        "Tests the null hypothesis that the error variance of the dependent variable is equal across groups.",
                    ],
                    ...nullColumns,
                });

                if (test.design) {
                    table.rows.push({
                        rowHeader: [`a. Design: ${test.design}`],
                        ...nullColumns,
                    });
                }

                resultJson.tables.push(table);
            });
        } else {
            const table: Table = {
                key: "levene_test",
                title: "Levene's Test of Equality of Error Variances",
                columnHeaders: [
                    { header: "", key: "dependent_variable" },
                    { header: "", key: "based_on" },
                    { header: "Levene Statistic", key: "levene_statistic" },
                    { header: "df1", key: "df1" },
                    { header: "df2", key: "df2" },
                    { header: "Sig.", key: "sig" },
                ],
                rows: [],
                note: data.levene_test[0]?.note,
                interpretation: data.levene_test[0]?.interpretation,
            };

            data.levene_test.forEach((test: any) => {
                if (test.entries && test.entries.length > 0) {
                    test.entries.forEach((entry: any, entryIndex: number) => {
                        table.rows.push({
                            rowHeader: [],
                            dependent_variable:
                                entryIndex === 0 ? test.dependent_variable : "",
                            based_on: entry.function,
                            levene_statistic: formatDisplayNumber(
                                entry.levene_statistic
                            ),
                            df1: entry.df1,
                            df2: formatDisplayNumber(entry.df2),
                            sig: formatDisplayNumber(entry.significance),
                        });
                    });
                }
            });

            const nullColumns = {
                levene_statistic: null,
                df1: null,
                df2: null,
                sig: null,
            };

            table.rows.push({
                rowHeader: [
                    "Tests the null hypothesis that the error variance of the dependent variable is equal across groups.",
                ],
                ...nullColumns,
            });

            const firstTest = data.levene_test[0];
            if (firstTest) {
                table.rows.push({
                    rowHeader: [
                        `a. Dependent variable: ${firstTest.dependent_variable}`,
                    ],
                    ...nullColumns,
                });
            }
            if (firstTest && firstTest.design) {
                table.rows.push({
                    rowHeader: [`b. Design: ${firstTest.design}`],
                    ...nullColumns,
                });
            }

            resultJson.tables.push(table);
        }
    }

    // 3.5 Heteroscedasticity Tests
    if (data.heteroscedasticity_tests) {
        const tests = data.heteroscedasticity_tests;

        // Breusch-Pagan Test
        if (tests.breusch_pagan) {
            const testData = tests.breusch_pagan;
            let depVarName = "Unknown";
            let designString = "";
            if (testData.note && Array.isArray(testData.note)) {
                testData.note.forEach((note: string) => {
                    if (note.startsWith("Dependent Variable:")) {
                        depVarName = note.replace("Dependent Variable:", "");
                    } else if (note.startsWith("Design:")) {
                        designString = note.replace("Design:", "");
                    }
                });
            }

            const table: Table = {
                key: "hetero_breusch_pagan",
                title: "Breusch-Pagan Test for Heteroskedasticity",
                columnHeaders: [
                    { header: "", key: "dependent_variable" },
                    { header: "Chi-Square", key: "statistic" },
                    { header: "df", key: "df" },
                    { header: "Sig.", key: "sig" },
                ],
                rows: [],
                note: testData.note,
                interpretation: testData.interpretation,
            };

            table.rows.push({
                rowHeader: [],
                statistic: formatDisplayNumber(testData.statistic),
                df: testData.df,
                sig: formatSig(testData.p_value),
            });

            const nullColumns = { statistic: null, df: null, sig: null };
            table.rows.push({
                rowHeader: [`a. Dependent variable: ${depVarName}`],
                ...nullColumns,
            });
            table.rows.push({
                rowHeader: [
                    "b. Tests the null hypothesis that the variance of the errors does not depend on the values of the independent variables.",
                ],
                ...nullColumns,
            });
            table.rows.push({
                rowHeader: [`c. Predicted values from design: ${designString}`],
                ...nullColumns,
            });

            resultJson.tables.push(table);
        }

        // Modified Breusch-Pagan Test
        if (tests.modified_breusch_pagan) {
            const testData = tests.modified_breusch_pagan;
            let depVarName = "Unknown";
            let designString = "";
            if (testData.note && Array.isArray(testData.note)) {
                testData.note.forEach((note: string) => {
                    if (note.startsWith("Dependent Variable:")) {
                        depVarName = note.replace("Dependent Variable:", "");
                    } else if (note.startsWith("Design:")) {
                        designString = note.replace("Design:", "");
                    }
                });
            }

            const table: Table = {
                key: "hetero_modified_breusch_pagan",
                title: "Modified Breusch-Pagan Test for Heteroskedasticity",
                columnHeaders: [
                    { header: "", key: "dependent_variable" },
                    { header: "Chi-Square", key: "statistic" },
                    { header: "df", key: "df" },
                    { header: "Sig.", key: "sig" },
                ],
                rows: [],
                note: testData.note,
                interpretation: testData.interpretation,
            };

            table.rows.push({
                rowHeader: [],
                statistic: formatDisplayNumber(testData.statistic),
                df: testData.df,
                sig: formatSig(testData.p_value),
            });

            const nullColumns = { statistic: null, df: null, sig: null };
            table.rows.push({
                rowHeader: [`a. Dependent variable: ${depVarName}`],
                ...nullColumns,
            });
            table.rows.push({
                rowHeader: [
                    "b. Tests the null hypothesis that the variance of the errors does not depend on the values of the independent variables.",
                ],
                ...nullColumns,
            });
            table.rows.push({
                rowHeader: [`c. Predicted values from design: ${designString}`],
                ...nullColumns,
            });

            resultJson.tables.push(table);
        }

        // White Test
        if (tests.white) {
            const testData = tests.white;
            let depVarName = "Unknown";
            let designString = "";
            if (testData.note && Array.isArray(testData.note)) {
                testData.note.forEach((note: string) => {
                    if (note.startsWith("Dependent Variable:")) {
                        depVarName = note.replace("Dependent Variable:", "");
                    } else if (note.startsWith("Design:")) {
                        designString = note.replace("Design:", "");
                    }
                });
            }

            const table: Table = {
                key: "hetero_white",
                title: "White Test for Heteroskedasticity",
                columnHeaders: [
                    { header: "", key: "dependent_variable" },
                    { header: "Chi-Square", key: "statistic" },
                    { header: "df", key: "df" },
                    { header: "Sig.", key: "sig" },
                ],
                rows: [],
                note: testData.note,
                interpretation: testData.interpretation,
            };

            table.rows.push({
                rowHeader: [],
                statistic: formatDisplayNumber(testData.statistic),
                df: testData.df,
                sig: formatSig(testData.p_value),
            });

            const nullColumns = { statistic: null, df: null, sig: null };
            table.rows.push({
                rowHeader: [`a. Dependent variable: ${depVarName}`],
                ...nullColumns,
            });
            table.rows.push({
                rowHeader: [
                    "b. Tests the null hypothesis that the variance of the errors does not depend on the values of the independent variables.",
                ],
                ...nullColumns,
            });
            table.rows.push({
                rowHeader: [`c. Design: ${designString}`],
                ...nullColumns,
            });

            resultJson.tables.push(table);
        }

        // F Test
        if (tests.f_test) {
            const testData = tests.f_test;
            let depVarName = "Unknown";
            let designString = "";
            if (testData.note && Array.isArray(testData.note)) {
                testData.note.forEach((note: string) => {
                    if (note.startsWith("Dependent Variable:")) {
                        depVarName = note.replace("Dependent Variable:", "");
                    } else if (note.startsWith("Design:")) {
                        designString = note.replace("Design:", "");
                    }
                });
            }

            const table: Table = {
                key: "hetero_f_test",
                title: "F Test for Heteroskedasticity",
                columnHeaders: [
                    { header: "", key: "dependent_variable" },
                    { header: "F", key: "statistic" },
                    { header: "df1", key: "df1" },
                    { header: "df2", key: "df2" },
                    { header: "Sig.", key: "sig" },
                ],
                rows: [],
                note: testData.note,
                interpretation: testData.interpretation,
            };

            table.rows.push({
                rowHeader: [],
                statistic: formatDisplayNumber(testData.statistic),
                df1: testData.df1,
                df2: testData.df2,
                sig: formatSig(testData.p_value),
            });

            const nullColumns = {
                statistic: null,
                df1: null,
                df2: null,
                sig: null,
            };
            table.rows.push({
                rowHeader: [`a. Dependent variable: ${depVarName}`],
                ...nullColumns,
            });
            table.rows.push({
                rowHeader: [
                    "b. Tests the null hypothesis that the variance of the errors does not depend on the values of the independent variables.",
                ],
                ...nullColumns,
            });
            table.rows.push({
                rowHeader: [`c. Predicted values from design: ${designString}`],
                ...nullColumns,
            });

            resultJson.tables.push(table);
        }
    }

    // 4. Tests of Between-Subjects Effects table
    if (data.tests_of_between_subjects_effects) {
        const effects = data.tests_of_between_subjects_effects;

        // Parse notes to get metadata
        let sigLevel = 0.05;
        let ssMethodString = "TypeIII"; // Default
        if (effects.note && typeof effects.note === "string") {
            const notesArray = effects.note.split("\n");
            notesArray.forEach((note: string) => {
                if (note.startsWith("Computed using alpha = ")) {
                    sigLevel =
                        parseFloat(
                            note.replace("Computed using alpha = ", "")
                        ) || 0.05;
                }
                if (note.startsWith("Sum of Squares Method: ")) {
                    ssMethodString = note.replace(
                        "Sum of Squares Method: ",
                        ""
                    );
                }
            });
        }

        const ssTypeMap: { [key: string]: string } = {
            TypeI: "I",
            TypeII: "II",
            TypeIII: "III",
            TypeIV: "IV",
        };
        const ssType = ssTypeMap[ssMethodString] || "III";
        const sumOfSquaresHeader = `Type ${ssType} Sum of Squares`;

        if (effects.sources && Array.isArray(effects.sources)) {
            // Check for optional columns
            const hasPartialEta = effects.sources.some((s: any) => {
                const value = s.effect?.partial_eta_squared;
                return value != null && !isNaN(value);
            });
            const hasNoncent = effects.sources.some((s: any) => {
                const value = s.effect?.noncent_parameter;
                return value != null && !isNaN(value);
            });
            const hasPower = effects.sources.some((s: any) => {
                const value = s.effect?.observed_power;
                return value != null && !isNaN(value);
            });

            const columnHeaders: any[] = [
                { header: "Source" },
                {
                    header: sumOfSquaresHeader,
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

            const table: Table = {
                key: "tests_of_between_subjects_effects",
                title: `Tests of Between-Subjects Effects`,
                columnHeaders: columnHeaders,
                rows: [],
                note: effects.note,
                interpretation: effects.interpretation,
            };

            effects.sources.forEach((source: any) => {
                const sourceName = source.name;
                const effectData = source.effect;

                if (!effectData) return;

                const sumOfSquares = formatDisplayNumber(
                    effectData.sum_of_squares
                );
                const row: Row = {
                    rowHeader: [
                        sourceName === "Corrected Model" &&
                        sumOfSquares !== null
                            ? `${sourceName}`
                            : sourceName,
                    ],
                    sum_of_squares: sumOfSquares,
                    df: effectData.df,
                    mean_square: formatDisplayNumber(effectData.mean_square),
                    f: formatDisplayNumber(effectData.f_value),
                    sig: formatSig(effectData.significance),
                };

                if (hasPartialEta) {
                    row.partial_eta_squared = formatDisplayNumber(
                        effectData.partial_eta_squared
                    );
                }
                if (hasNoncent) {
                    row.noncent_parameter = formatDisplayNumber(
                        effectData.noncent_parameter
                    );
                }
                if (hasPower) {
                    row.observed_power = formatDisplayNumber(
                        effectData.observed_power
                    );
                }

                table.rows.push(row);
            });

            resultJson.tables.push(table);
        }
    }

    // 5. Parameter Estimates table
    if (data.parameter_estimates && data.parameter_estimates.estimates) {
        const estimates = data.parameter_estimates;
        let depVarName = "";
        const notes: string[] = [];
        let redundantNoteLetter: string | null = null;
        let alphaNoteLetter: string | null = null;
        let sigLevel = 0.05; // Default

        if (estimates.note && typeof estimates.note === "string") {
            const notesArray = estimates.note.split("\n");
            notesArray.forEach((note: string) => {
                if (note.startsWith("Dependent Variable:")) {
                    depVarName = note.replace("Dependent Variable:", "");
                } else if (note.startsWith("Computed using alpha:")) {
                    sigLevel = parseFloat(
                        note.replace("Computed using alpha:", "")
                    );
                } else {
                    notes.push(note);
                    if (note.includes("redundant")) {
                        redundantNoteLetter = note.charAt(0);
                    }
                    if (note.includes("Computed using alpha")) {
                        alphaNoteLetter = note.charAt(0);
                    }
                }
            });
        }

        // Check for optional columns
        const hasPartialEta = estimates.estimates.some((e: any) => {
            const value = e.partial_eta_squared;
            return value != null && !isNaN(value);
        });
        const hasNoncent = estimates.estimates.some((e: any) => {
            const value = e.noncent_parameter;
            return value != null && !isNaN(value);
        });
        const hasPower = estimates.estimates.some((e: any) => {
            const value = e.observed_power;
            return value != null && !isNaN(value);
        });

        const columnHeaders: any[] = [
            { header: "Parameter" },
            { header: "B", key: "b" },
            { header: "Std. Error", key: "std_error" },
            { header: "t", key: "t" },
            { header: "Sig.", key: "sig" },
            {
                header: "95% Confidence Interval",
                key: "confidence_interval",
                children: [
                    { header: "Lower Bound", key: "lower_bound" },
                    { header: "Upper Bound", key: "upper_bound" },
                ],
            },
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
                header: `Observed Power`,
                key: "observed_power",
            });
        }

        const table: Table = {
            key: "parameter_estimates",
            title: `Parameter Estimates`,
            columnHeaders: columnHeaders,
            rows: [],
            note: estimates.note,
            interpretation: estimates.interpretation,
        };

        const redundantRowValues: any = {
            std_error: ".",
            t: ".",
            sig: ".",
            lower_bound: ".",
            upper_bound: ".",
        };
        if (hasPartialEta) redundantRowValues.partial_eta_squared = ".";
        if (hasNoncent) redundantRowValues.noncent_parameter = ".";
        if (hasPower) redundantRowValues.observed_power = ".";

        estimates.estimates.forEach((estimate: any) => {
            if (estimate.is_redundant) {
                table.rows.push({
                    rowHeader: [estimate.parameter],
                    b: `0ᵃ`,
                    ...redundantRowValues,
                });
            } else {
                const row: Row = {
                    rowHeader: [estimate.parameter],
                    b: formatDisplayNumber(estimate.b),
                    std_error: formatDisplayNumber(estimate.std_error),
                    t: formatDisplayNumber(estimate.t_value),
                    sig: formatSig(estimate.significance),
                    lower_bound: formatDisplayNumber(
                        estimate.confidence_interval?.lower_bound
                    ),
                    upper_bound: formatDisplayNumber(
                        estimate.confidence_interval?.upper_bound
                    ),
                };

                if (hasPartialEta) {
                    row.partial_eta_squared = formatDisplayNumber(
                        estimate.partial_eta_squared
                    );
                }
                if (hasNoncent) {
                    row.noncent_parameter = formatDisplayNumber(
                        estimate.noncent_parameter
                    );
                }
                if (hasPower) {
                    row.observed_power = formatDisplayNumber(
                        estimate.observed_power
                    );
                }
                table.rows.push(row);
            }
        });

        const nullColumnsForNotes: any = {
            b: null,
            std_error: null,
            t: null,
            sig: null,
            lower_bound: null,
            upper_bound: null,
        };
        if (hasPartialEta) nullColumnsForNotes.partial_eta_squared = null;
        if (hasNoncent) nullColumnsForNotes.noncent_parameter = null;
        if (hasPower) nullColumnsForNotes.observed_power = null;

        notes
            .filter(
                (note) =>
                    !note.startsWith("Observed Power") &&
                    !note.startsWith("Degrees of freedom")
            )
            .forEach((note) => {
                table.rows.push({
                    rowHeader: [note],
                    ...nullColumnsForNotes,
                });
            });

        resultJson.tables.push(table);
    }
}
