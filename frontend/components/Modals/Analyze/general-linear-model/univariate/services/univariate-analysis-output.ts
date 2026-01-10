import { UnivariateFinalResultType } from "@/components/Modals/Analyze/general-linear-model/univariate/types/univariate-worker";
import { ColumnHeader, Table } from "@/types/Table";
import { useResultStore } from "@/stores/useResultStore";
import { UnivariateType } from "@/components/Modals/Analyze/general-linear-model/univariate/types/univariate";
import { Variable } from "@/types/Variable";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";

export async function resultUnivariateAnalysis({
    formattedResult,
    configData,
    variables,
}: UnivariateFinalResultType) {
    try {
        const { addLog, addAnalytic, addStatistic } = useResultStore.getState();

        const findTable = (key: string): Table | undefined => {
            return formattedResult.tables.find(
                (table: Table) => table.key === key
            );
        };

        const univariateAnalysisResult = async () => {
            /*
             * 🎉 Title Result 🎉
             * */
            const titleMessage = "Univariate Analysis";
            const logId = await addLog({ log: titleMessage });
            await addAnalytic(logId, {
                title: `Univariate Analysis Result`,
                note: "",
            });

            /*
             * 👥 Between-Subjects Factors Result 👥
             * */
            const betweenSubjectsFactors = findTable(
                "between_subjects_factors"
            );
            if (betweenSubjectsFactors) {
                const analyticId = await addAnalytic(logId, {
                    title: betweenSubjectsFactors.title,
                    note: betweenSubjectsFactors.note || "",
                });
                await addStatistic(analyticId, {
                    title: betweenSubjectsFactors.title,
                    description:
                        betweenSubjectsFactors.interpretation ||
                        betweenSubjectsFactors.title,
                    output_data: JSON.stringify({
                        tables: [betweenSubjectsFactors],
                    }),
                    components: betweenSubjectsFactors.title,
                });
            }

            /*
             * 📊 Descriptive Statistics Result 📊
             * */
            const descriptiveStatistics = findTable("descriptive_statistics");
            if (descriptiveStatistics) {
                const analyticId = await addAnalytic(logId, {
                    title: descriptiveStatistics.title,
                    note: descriptiveStatistics.note || "",
                });
                await addStatistic(analyticId, {
                    title: descriptiveStatistics.title,
                    description:
                        descriptiveStatistics.interpretation ||
                        descriptiveStatistics.title,
                    output_data: JSON.stringify({
                        tables: [descriptiveStatistics],
                    }),
                    components: descriptiveStatistics.title,
                });
            }

            /*
             * ⚖️ Levene's Test Result ⚖️
             * */
            const leveneTables = formattedResult.tables.filter((table: Table) =>
                table.key.startsWith("levene_test")
            );
            for (const table of leveneTables) {
                const analyticId = await addAnalytic(logId, {
                    title: table.title,
                    note: table.note || "",
                });
                await addStatistic(analyticId, {
                    title: table.title,
                    description: table.interpretation || table.title,
                    output_data: JSON.stringify({ tables: [table] }),
                    components: table.title,
                });
            }

            /*
             * 🔬 Heteroscedasticity Tests Result 🔬
             * */
            const heteroTables = formattedResult.tables.filter((table: Table) =>
                table.key.startsWith("hetero_")
            );
            for (const table of heteroTables) {
                const analyticId = await addAnalytic(logId, {
                    title: table.title,
                    note: table.note || "",
                });
                await addStatistic(analyticId, {
                    title: table.title,
                    description: table.interpretation || table.title,
                    output_data: JSON.stringify({ tables: [table] }),
                    components: table.title,
                });
            }

            /*
             * 🧪 Tests of Between-Subjects Effects Result 🧪
             * */
            const testsOfBetweenSubjectsEffects = findTable(
                "tests_of_between_subjects_effects"
            );
            if (testsOfBetweenSubjectsEffects) {
                const analyticId = await addAnalytic(logId, {
                    title: testsOfBetweenSubjectsEffects.title,
                    note: testsOfBetweenSubjectsEffects.note || "",
                });
                await addStatistic(analyticId, {
                    title: testsOfBetweenSubjectsEffects.title,
                    description:
                        testsOfBetweenSubjectsEffects.interpretation ||
                        testsOfBetweenSubjectsEffects.title,
                    output_data: JSON.stringify({
                        tables: [testsOfBetweenSubjectsEffects],
                    }),
                    components: testsOfBetweenSubjectsEffects.title,
                });
            }

            /*
             * 📏 Parameter Estimates Result 📏
             * */
            const parameterEstimates = findTable("parameter_estimates");
            if (parameterEstimates) {
                const analyticId = await addAnalytic(logId, {
                    title: parameterEstimates.title,
                    note: parameterEstimates.note || "",
                });
                await addStatistic(analyticId, {
                    title: parameterEstimates.title,
                    description:
                        parameterEstimates.interpretation ||
                        parameterEstimates.title,
                    output_data: JSON.stringify({
                        tables: [parameterEstimates],
                    }),
                    components: parameterEstimates.title,
                });
            }

            /*
             * 🛡️ Robust Parameter Estimates Result 🛡️
             * */
            const robustParameterEstimates = findTable(
                "robust_parameter_estimates"
            );
            if (robustParameterEstimates) {
                const analyticId = await addAnalytic(logId, {
                    title: robustParameterEstimates.title,
                    note: robustParameterEstimates.note || "",
                });
                await addStatistic(analyticId, {
                    title: robustParameterEstimates.title,
                    description: robustParameterEstimates.interpretation || "",
                    output_data: JSON.stringify({
                        tables: [robustParameterEstimates],
                    }),
                    components: robustParameterEstimates.title,
                });
            }

            /*
             * 🧮 General Estimable Function Result 🧮
             * */
            const generalEstimableFunction = findTable(
                "general_estimable_function"
            );
            if (generalEstimableFunction) {
                const analyticId = await addAnalytic(logId, {
                    title: generalEstimableFunction.title,
                    note: generalEstimableFunction.note || "",
                });
                await addStatistic(analyticId, {
                    title: generalEstimableFunction.title,
                    description:
                        generalEstimableFunction.interpretation ||
                        generalEstimableFunction.title,
                    output_data: JSON.stringify({
                        tables: [generalEstimableFunction],
                    }),
                    components: generalEstimableFunction.title,
                });
            }

            /*
             * 📝 Hypothesis L-Matrix Result 📝
             */
            const lMatrixTables = formattedResult.tables.filter(
                (table: Table) => table.key.startsWith("hypothesis_matrix_")
            );
            for (const table of lMatrixTables) {
                const analyticId = await addAnalytic(logId, {
                    title: table.title,
                    note: table.note || "",
                });
                await addStatistic(analyticId, {
                    title: table.title,
                    description: table.interpretation || table.title,
                    output_data: JSON.stringify({ tables: [table] }),
                    components: table.title,
                });
            }

            /*
             * 🔬 Custom Hypothesis Tests Result 🔬
             */
            const customHypothesisTables = formattedResult.tables.filter(
                (table: Table) =>
                    table.key === "custom_hypothesis_tests_index" ||
                    table.key.startsWith("contrast_coefficients_") ||
                    table.key.startsWith("custom_contrast_results_k_matrix_") ||
                    table.key.startsWith("custom_test_results_")
            );

            for (const table of customHypothesisTables) {
                const analyticId = await addAnalytic(logId, {
                    title: table.title,
                    note: table.note || "",
                });
                await addStatistic(analyticId, {
                    title: table.title,
                    description: table.interpretation || table.title,
                    output_data: JSON.stringify({ tables: [table] }),
                    components: table.title,
                });
            }

            /*
             * 📊 Contrast Coefficients Result 📊
             * */
            const contrastCoefficients = findTable("contrast_coefficients");
            if (contrastCoefficients) {
                const analyticId = await addAnalytic(logId, {
                    title: contrastCoefficients.title,
                    note: contrastCoefficients.note || "",
                });
                await addStatistic(analyticId, {
                    title: contrastCoefficients.title,
                    description:
                        contrastCoefficients.interpretation ||
                        contrastCoefficients.title,
                    output_data: JSON.stringify({
                        tables: [contrastCoefficients],
                    }),
                    components: contrastCoefficients.title,
                });
            }

            /*
             * 🧪 Lack of Fit Tests Result 🧪
             * */
            const lackOfFitTests = findTable("lack_of_fit_tests");
            if (lackOfFitTests) {
                const analyticId = await addAnalytic(logId, {
                    title: lackOfFitTests.title,
                    note: lackOfFitTests.note || "",
                });
                await addStatistic(analyticId, {
                    title: lackOfFitTests.title,
                    description:
                        lackOfFitTests.interpretation || lackOfFitTests.title,
                    output_data: JSON.stringify({ tables: [lackOfFitTests] }),
                    components: lackOfFitTests.title,
                });
            }

            /*
             * 📈 Spread vs. Level Plots Result 📈
             * */
            const spreadVsLevelPlots = findTable("spread_vs_level_plots");
            if (spreadVsLevelPlots) {
                const analyticId = await addAnalytic(logId, {
                    title: spreadVsLevelPlots.title,
                    note: spreadVsLevelPlots.note || "",
                });
                await addStatistic(analyticId, {
                    title: spreadVsLevelPlots.title,
                    description:
                        spreadVsLevelPlots.interpretation ||
                        spreadVsLevelPlots.title,
                    output_data: JSON.stringify({
                        tables: [spreadVsLevelPlots],
                    }),
                    components: spreadVsLevelPlots.title,
                });
            }

            /*
             * 🧐 Post Hoc Tests Result 🧐
             * */
            const multipleComparisonsTable = findTable("multiple_comparisons");
            if (multipleComparisonsTable) {
                const analyticId = await addAnalytic(logId, {
                    title: multipleComparisonsTable.title,
                    note: multipleComparisonsTable.note || "",
                });
                await addStatistic(analyticId, {
                    title: multipleComparisonsTable.title,
                    description:
                        multipleComparisonsTable.interpretation ||
                        multipleComparisonsTable.title,
                    output_data: JSON.stringify({
                        tables: [multipleComparisonsTable],
                    }),
                    components: multipleComparisonsTable.title,
                });
            }

            const homogeneousSubsetsTable = findTable("homogeneous_subsets");
            if (homogeneousSubsetsTable) {
                const analyticId = await addAnalytic(logId, {
                    title: homogeneousSubsetsTable.title,
                    note: homogeneousSubsetsTable.note || "",
                });
                await addStatistic(analyticId, {
                    title: homogeneousSubsetsTable.title,
                    description:
                        homogeneousSubsetsTable.interpretation ||
                        homogeneousSubsetsTable.title,
                    output_data: JSON.stringify({
                        tables: [homogeneousSubsetsTable],
                    }),
                    components: homogeneousSubsetsTable.title,
                });
            }

            /*
             * 📊 Estimated Marginal Means Result 📊
             * */
            const emmeansTables = formattedResult.tables.filter(
                (table: Table) => table.key.startsWith("emmeans_")
            );

            for (const table of emmeansTables) {
                const analyticId = await addAnalytic(logId, {
                    title: table.title,
                    note: table.note || "",
                });
                await addStatistic(analyticId, {
                    title: table.title,
                    description: table.interpretation || table.title,
                    output_data: JSON.stringify({ tables: [table] }),
                    components: table.title,
                });
            }

            /*
             * 📈 Plots Result ��
             * */
            const plotTables = formattedResult.tables.filter((table: Table) =>
                table.key.startsWith("plot_")
            );
            for (const table of plotTables) {
                const analyticId = await addAnalytic(logId, {
                    title: table.title,
                    note: table.note || "",
                });
                await addStatistic(analyticId, {
                    title: table.title,
                    description: table.interpretation || table.title,
                    output_data: JSON.stringify({ tables: [table] }),
                    components: table.title,
                });
            }

            /*
             * ❗ Error Table Result ❗
             * */
            const errorTable = findTable("error_table");
            if (errorTable) {
                const analyticId = await addAnalytic(logId, {
                    title: errorTable.title,
                    note: errorTable.note || "",
                });
                await addStatistic(analyticId, {
                    title: errorTable.title,
                    description:
                        errorTable.interpretation ||
                        "Errors logs from the analysis.",
                    output_data: JSON.stringify({ tables: [errorTable] }),
                    components: "Errors Logs",
                });
            }

            /*
             * 💾 Saved Variables Result 💾
             * */

            const savedVariablesTable = findTable("saved_variables_table");

            if (
                savedVariablesTable &&
                savedVariablesTable.rows &&
                savedVariablesTable.rows.length > 0
            ) {
                await saveUnivariateResults(
                    savedVariablesTable,
                    configData,
                    variables
                );
            }
        };

        await univariateAnalysisResult();
    } catch (e) {
        console.error(e);
    }
}

async function saveUnivariateResults(
    savedVariablesTable: Table,
    configData: UnivariateType,
    variables: Variable[]
) {
    const { addVariable } = useVariableStore.getState();
    const { updateCells } = useDataStore.getState();

    const savedData: { [key: string]: (string | null)[] } = {};
    const columnKeys = savedVariablesTable.columnHeaders
        .map((h: ColumnHeader) => h.key)
        .filter((k): k is string => !!k && k !== "case");

    for (const key of columnKeys) {
        savedData[key] = savedVariablesTable.rows!.map(
            (row: any) => (row[key] as string) ?? null
        );
    }

    let nextColumnIndex = variables.length;

    const generateUniqueName = (prefix: string) => {
        let idx = 1;
        let name = `${prefix}_${idx}`;
        const existingNames = [...variables.map((v) => v.name)];
        while (existingNames.includes(name)) {
            idx++;
            name = `${prefix}_${idx}`;
        }
        existingNames.push(name);
        return name;
    };

    const varDefs: {
        [key: string]: {
            dataKey: string;
            prefix: string;
            label: string;
            decimals: number;
        };
    } = {
        UnstandardizedPre: {
            dataKey: "predicted_values",
            prefix: "PRED",
            label: "Unstandardized predicted values",
            decimals: 3,
        },
        WeightedPre: {
            dataKey: "weighted_predicted_values",
            prefix: "WPRED",
            label: "Weighted unstandardized predicted values",
            decimals: 3,
        },
        UnstandardizedRes: {
            dataKey: "residuals",
            prefix: "RESID",
            label: "Unstandardized residuals",
            decimals: 3,
        },
        WeightedRes: {
            dataKey: "weighted_residuals",
            prefix: "WRESID",
            label: "Weighted unstandardized residuals",
            decimals: 3,
        },
        DeletedRes: {
            dataKey: "deleted_residuals",
            prefix: "DRESID",
            label: "Deleted residuals",
            decimals: 3,
        },
        StandardizedRes: {
            dataKey: "standardized_residuals",
            prefix: "ZRESID",
            label: "Standardized residuals",
            decimals: 3,
        },
        StudentizedRes: {
            dataKey: "studentized_residuals",
            prefix: "SRESID",
            label: "Studentized residuals",
            decimals: 3,
        },
        StdStatistics: {
            dataKey: "standard_errors",
            prefix: "SEPRED",
            label: "Standard errors of predicted value",
            decimals: 3,
        },
        CooksD: {
            dataKey: "cook_distances",
            prefix: "COOK",
            label: "Cook's distances",
            decimals: 3,
        },
        Leverage: {
            dataKey: "leverages",
            prefix: "LEVER",
            label: "Uncentered leverage values",
            decimals: 3,
        },
    };

    for (const confKey in varDefs) {
        if (configData.save && (configData.save as any)[confKey]) {
            const def = (varDefs as any)[confKey];
            const values = savedData[def.dataKey];

            if (values && values.length > 0) {
                const varName = generateUniqueName(def.prefix);
                const newVariable: Partial<Variable> = {
                    name: varName,
                    columnIndex: nextColumnIndex,
                    type: "NUMERIC",
                    label: def.label,
                    values: [],
                    missing: null,
                    measure: "scale",
                    width: 8,
                    decimals: def.decimals,
                    columns: 200,
                    align: "right",
                };

                await addVariable(newVariable);

                const updates = values.map((value: any, rowIndex: number) => ({
                    row: rowIndex,
                    col: nextColumnIndex,
                    value: String(value),
                }));

                if (updates.length > 0) {
                    await updateCells(updates);
                }
                nextColumnIndex++;
            }
        }
    }
}
