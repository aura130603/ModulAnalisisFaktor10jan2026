// roc-analysis-formatter.ts
import {ensureEnoughHeaders, formatDisplayNumber} from "@/hooks/useFormatter";
import {ResultJson, Table} from "@/types/Table";

export function transformROCAnalysisResult(data: any): ResultJson {
    const resultJson: ResultJson = {
        tables: [],
    };

    // 1. Case Processing Summary
    if (data.case_processing_summary) {
        const cps = data.case_processing_summary;
        const table: Table = {
            key: "case_processing_summary",
            title: "Case Processing Summary",
            columnHeaders: [
                { header: "category" },
                { header: "Valid N (listwise)" },
            ],
            rows: [],
        };

        table.rows.push({
            rowHeader: ["Positive\u00B9"],
            "Valid N (listwise)": formatDisplayNumber(cps.positive),
        });

        table.rows.push({
            rowHeader: ["Negative"],
            "Valid N (listwise)": formatDisplayNumber(cps.negative),
        });

        table.rows.push({
            rowHeader: ["Missing"],
            "Valid N (listwise)": formatDisplayNumber(cps.missing),
        });

        table.rows.push({
            rowHeader: ["Total"],
            "Valid N (listwise)": formatDisplayNumber(cps.total),
        });

        table.rows.push({
            rowHeader: [
                "Larger values of the test result variable(s) indicate stronger evidence for a positive actual state.",
            ],
            "Valid N (listwise)": null,
        });

        table.rows.push({
            rowHeader: ["a. The positive actual state is 1."],
            "Valid N (listwise)": null,
        });

        resultJson.tables.push(ensureEnoughHeaders(table));
    }

    // 2. Area Under the ROC Curve
    if (data.area_under_roc_curve) {
        data.area_under_roc_curve.forEach((item: any) => {
            const variable = item.variable;
            const auc = item.data;

            const table: Table = {
                key: `area_under_roc_curve_${variable}`,
                title: "Area Under the ROC Curve",
                columnHeaders: [
                    { header: "Test Result Variable(s)" },
                    { header: "Area" },
                    { header: "Std. Error\u1D43" },
                    { header: "Asymptotic Sig.\u1D47" },
                    { header: "Asymptotic 95% Confidence Interval" },
                    { header: "Lower Bound" },
                    { header: "Upper Bound" },
                ],
                rows: [],
            };

            table.rows.push({
                rowHeader: [variable],
                Area: formatDisplayNumber(auc.area),
                "Std. Error\u1D43": formatDisplayNumber(auc.std_error),
                "Asymptotic Sig.\u1D47": formatDisplayNumber(
                    auc.asymptotic_sig
                ),
                "Lower Bound": formatDisplayNumber(
                    auc.asymptotic_95_confidence_interval.lower_bound
                ),
                "Upper Bound": formatDisplayNumber(
                    auc.asymptotic_95_confidence_interval.upper_bound
                ),
            });

            table.rows.push({
                rowHeader: [
                    `The test result variable(s): ${variable} has at least one tie between the positive actual state group and the negative actual state group. Statistics may be biased.`,
                ],
                Area: null,
                "Std. Error\u1D43": null,
                "Asymptotic Sig.\u1D47": null,
                "Lower Bound": null,
                "Upper Bound": null,
            });

            table.rows.push({
                rowHeader: ["a. Under the nonparametric assumption"],
                Area: null,
                "Std. Error\u1D43": null,
                "Asymptotic Sig.\u1D47": null,
                "Lower Bound": null,
                "Upper Bound": null,
            });

            table.rows.push({
                rowHeader: ["b. Null hypothesis: true area = 0.5"],
                Area: null,
                "Std. Error\u1D43": null,
                "Asymptotic Sig.\u1D47": null,
                "Lower Bound": null,
                "Upper Bound": null,
            });

            resultJson.tables.push(ensureEnoughHeaders(table));
        });
    }

    // 3. Classifier Evaluation Metrics
    if (data.classifier_evaluation_metrics) {
        data.classifier_evaluation_metrics.forEach((item: any) => {
            const variable = item.variable;
            const metrics = item.metrics;

            const table: Table = {
                key: `classifier_evaluation_metrics_${variable}`,
                title: "Classifier Evaluation Metrics",
                columnHeaders: [
                    { header: "Test Result Variable(s)" },
                    { header: "Gini Index" },
                    { header: "K-S Statistics" },
                    { header: "Max K-S\u1D43" },
                    { header: "Cutoff\u1D47" },
                ],
                rows: [],
            };

            table.rows.push({
                rowHeader: [variable],
                "Gini Index": formatDisplayNumber(metrics.gini_index),
                "Max K-S\u1D43": formatDisplayNumber(metrics.max_k_s),
                "Cutoff\u1D47": formatDisplayNumber(metrics.cutoff),
            });

            table.rows.push({
                rowHeader: ["a. The maximum Kolmogorov-Smirnov (K-S) metric."],
                "Gini Index": null,
                "Max K-S\u1D43": null,
                "Cutoff\u1D47": null,
            });

            table.rows.push({
                rowHeader: [
                    "b. In case of multiple cutoff values associated with Max K-S, the largest one is reported.",
                ],
                "Gini Index": null,
                "Max K-S\u1D43": null,
                "Cutoff\u1D47": null,
            });

            resultJson.tables.push(ensureEnoughHeaders(table));
        });
    }

    // 4. Coordinates of the ROC Curve
    if (data.coordinates_roc) {
        data.coordinates_roc.forEach((item: any) => {
            const variable = item.variable;
            const coords = item.coordinates;

            const table: Table = {
                key: `coordinates_roc_${variable}`,
                title: "Coordinates of the ROC Curve",
                columnHeaders: [
                    { header: "Test Result Variable(s)" },
                    { header: "Positive if Greater Than or Equal To\u1D43" },
                    { header: "Sensitivity" },
                    { header: "1 - Specificity" },
                ],
                rows: [],
            };

            coords.forEach((coord: any) => {
                table.rows.push({
                    rowHeader: [variable],
                    "Positive if Greater Than or Equal To\u1D43":
                        formatDisplayNumber(coord.positive_if_greater_than),
                    Sensitivity: formatDisplayNumber(coord.sensitivity),
                    "1 - Specificity": formatDisplayNumber(
                        coord.one_minus_specificity
                    ),
                });
            });

            table.rows.push({
                rowHeader: [
                    "The test result variable(s): " +
                        variable +
                        " has at least one tie between the positive actual state group and the negative actual state group.",
                ],
                "Positive if Greater Than or Equal To\u1D43": null,
                Sensitivity: null,
                "1 - Specificity": null,
            });

            table.rows.push({
                rowHeader: [
                    "a. The smallest cutoff value is the minimum observed test value minus 1, and the largest cutoff value is the maximum observed test value plus 1. All the other cutoff values are the averages of two consecutive ordered observed test values.",
                ],
                "Positive if Greater Than or Equal To\u1D43": null,
                Sensitivity: null,
                "1 - Specificity": null,
            });

            resultJson.tables.push(ensureEnoughHeaders(table));
        });
    }

    // 5. Coordinates of the Precision-Recall Curve
    if (data.coordinates_precision_recall) {
        data.coordinates_precision_recall.forEach((item: any) => {
            const variable = item.variable;
            const coords = item.coordinates;

            const table: Table = {
                key: `coordinates_precision_recall_${variable}`,
                title: "Coordinates of the Precision-Recall Curve",
                columnHeaders: [
                    { header: "Test Result Variable(s)" },
                    { header: "Positive if Greater Than or Equal To\u1D43" },
                    { header: "Precision" },
                    { header: "Recall" },
                ],
                rows: [],
            };

            coords.forEach((coord: any) => {
                table.rows.push({
                    rowHeader: [variable],
                    "Positive if Greater Than or Equal To\u1D43":
                        formatDisplayNumber(coord.positive_if_greater_than),
                    Precision: formatDisplayNumber(coord.precision),
                    Recall: formatDisplayNumber(coord.recall),
                });
            });

            table.rows.push({
                rowHeader: [
                    "The test result variable(s): " +
                        variable +
                        " has at least one tie between the positive actual state group and the negative actual state group.",
                ],
                "Positive if Greater Than or Equal To\u1D43": null,
                Precision: null,
                Recall: null,
            });

            table.rows.push({
                rowHeader: [
                    "a. The smallest cutoff value is the minimum observed test value minus 1, and the largest cutoff value is the maximum observed test value plus 1. All the other cutoff values are the averages of two consecutive ordered observed test values.",
                ],
                "Positive if Greater Than or Equal To\u1D43": null,
                Precision: null,
                Recall: null,
            });

            resultJson.tables.push(ensureEnoughHeaders(table));
        });
    }

    // 6. Overall Model Quality
    if (data.overall_model_quality) {
        data.overall_model_quality.forEach((item: any) => {
            const variable = item.variable;
            const quality = item.quality;

            const table: Table = {
                key: `overall_model_quality_${variable}`,
                title: "Overall Model Quality",
                columnHeaders: [
                    { header: "Variable" },
                    { header: "Quality Score" },
                ],
                rows: [],
            };

            table.rows.push({
                rowHeader: [variable],
                "Quality Score": formatDisplayNumber(quality),
            });

            table.rows.push({
                rowHeader: ["A good model has a value above 0.5"],
                "Quality Score": null,
            });

            table.rows.push({
                rowHeader: [
                    "A value less than 0.5 indicates the model is no better than random prediction",
                ],
                "Quality Score": null,
            });

            table.rows.push({
                rowHeader: [
                    'Note: Use caution in interpreting this chart since it only reflects a general measure of overall model quality. The model quality can be considered "good" even if the correct prediction rate for positive responses does not meet the specified minimum probability. Use the classification table to examine correct prediction rates.',
                ],
                "Quality Score": null,
            });

            resultJson.tables.push(ensureEnoughHeaders(table));
        });
    }

    return resultJson;
}
