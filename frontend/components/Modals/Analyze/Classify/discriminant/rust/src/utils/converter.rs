use wasm_bindgen::JsValue;
use serde::Serialize;

use crate::models::result::{
    DiscriminantResult,
    ProcessingSummary,
    EqualityTests,
    BoxMTest,
    LogDeterminants,
    EigenDescription,
    WilksLambdaTest,
    VariableInAnalysis,
    VariableNotInAnalysis,
    PairwiseComparison,
    HighestGroupStatistics,
    GroupHistogram,
};

// Konversi dari String error ke JsValue untuk interaksi WASM
pub fn string_to_js_error(error: String) -> JsValue {
    JsValue::from_str(&error)
}

pub fn format_result(result: &Option<DiscriminantResult>) -> Result<JsValue, JsValue> {
    match result {
        Some(result) => {
            let formatted = FormatResult::from_analysis_result(result);
            Ok(serde_wasm_bindgen::to_value(&formatted).unwrap())
        }
        None => Err(JsValue::from_str("No discriminant analysis results available")),
    }
}

#[derive(Serialize)]
struct FormatResult {
    processing_summary: Option<ProcessingSummary>,
    group_statistics: Option<FormattedGroupStatistics>,
    equality_tests: Option<EqualityTests>,
    canonical_functions: Option<FormattedCanonicalFunctions>,
    structure_matrix: Option<FormattedStructureMatrix>,
    classification_results: Option<FormattedClassificationResults>,
    box_m_test: Option<BoxMTest>,
    pooled_matrices: Option<FormattedPooledMatrices>,
    covariance_matrices: Option<FormattedCovarianceMatrices>,
    log_determinants: Option<LogDeterminants>,
    eigen_description: Option<EigenDescription>,
    stepwise_statistics: Option<FormattedStepwiseStatistics>,
    wilks_lambda_test: Option<WilksLambdaTest>,
    casewise_statistics: Option<FormattedCasewiseStatistics>,
    prior_probabilities: Option<FormattedPriorProbabilities>,
    classification_function_coefficients: Option<FormattedClassificationFunctionCoefficients>,
    discriminant_histograms: Option<FormattedDiscriminantHistograms>,
}

#[derive(Serialize)]
struct FormattedGroupStatistics {
    groups: Vec<String>,
    variables: Vec<String>,
    means: Vec<GroupValue>,
    std_deviations: Vec<GroupValue>,
}

#[derive(Serialize)]
struct GroupValue {
    variable: String,
    values: Vec<f64>,
}

#[derive(Serialize)]
struct FormattedCanonicalFunctions {
    coefficients: Vec<FunctionValue>,
    standardized_coefficients: Vec<FunctionValue>,
    function_at_centroids: Vec<GroupCentroid>,
}

#[derive(Serialize)]
struct FunctionValue {
    variable: String,
    values: Vec<f64>,
}

#[derive(Serialize)]
struct GroupCentroid {
    group: String,
    values: Vec<f64>,
}

#[derive(Serialize)]
struct FormattedStructureMatrix {
    variables: Vec<String>,
    correlations: Vec<FunctionValue>,
}

#[derive(Serialize)]
struct FormattedClassificationResults {
    original_classification: Vec<GroupClassification>,
    cross_validated_classification: Option<Vec<GroupClassification>>,
    original_percentage: Vec<GroupPercentage>,
    cross_validated_percentage: Option<Vec<GroupPercentage>>,
}

#[derive(Serialize)]
struct GroupClassification {
    group: String,
    counts: Vec<i32>,
}

#[derive(Serialize)]
struct GroupPercentage {
    group: String,
    percentages: Vec<f64>,
}

#[derive(Serialize)]
struct FormattedPooledMatrices {
    variables: Vec<String>,
    covariance: Vec<MatrixEntry>,
    correlation: Vec<MatrixEntry>,
}

#[derive(Serialize)]
struct MatrixEntry {
    variable: String,
    values: Vec<ValueEntry>,
}

#[derive(Serialize)]
struct ValueEntry {
    variable: String,
    value: f64,
}

#[derive(Serialize)]
struct FormattedCovarianceMatrices {
    groups: Vec<String>,
    variables: Vec<String>,
    matrices: Vec<GroupMatrixEntry>,
}

#[derive(Serialize)]
struct GroupMatrixEntry {
    group: String,
    matrix: Vec<MatrixEntry>,
}

#[derive(Serialize)]
struct FormattedStepwiseStatistics {
    variables_entered: Vec<String>,
    variables_removed: Vec<Option<String>>,
    wilks_lambda: Vec<f64>,
    f_values: Vec<f64>,
    df1: Vec<i32>,
    df2: Vec<i32>,
    df3: Vec<i32>,
    exact_f: Vec<f64>,
    exact_df1: Vec<i32>,
    exact_df2: Vec<i32>,
    significance: Vec<f64>,
    variables_in_analysis: Vec<StepVariables>,
    variables_not_in_analysis: Vec<StepVariables>,
    pairwise_comparisons: Vec<GroupPairComparison>,
}

#[derive(Serialize)]
struct StepVariables {
    step: String,
    variables: Vec<VariableInAnalysis>,
}

#[derive(Serialize)]
struct StepNotInVariables {
    step: String,
    variables: Vec<VariableNotInAnalysis>,
}

#[derive(Serialize)]
struct GroupPairComparison {
    step: String,
    group1: String,
    group2: String,
    comparisons: Vec<PairwiseComparison>,
}

#[derive(Serialize)]
struct FormattedCasewiseStatistics {
    case_number: Vec<usize>,
    actual_group: Vec<String>,
    predicted_group: Vec<String>,
    highest_group: HighestGroupStatistics,
    second_highest_group: HighestGroupStatistics,
    discriminant_scores: Vec<ScoreValue>,
}

#[derive(Serialize)]
struct ScoreValue {
    function: String,
    values: Vec<f64>,
}

#[derive(Serialize)]
struct FormattedPriorProbabilities {
    groups: Vec<usize>,
    prior_probabilities: Vec<f64>,
    cases_used: Vec<GroupCases>,
    total: f64,
}

#[derive(Serialize)]
struct GroupCases {
    case_type: String,
    counts: Vec<usize>,
}

#[derive(Serialize)]
struct FormattedClassificationFunctionCoefficients {
    groups: Vec<usize>,
    variables: Vec<String>,
    coefficients: Vec<GroupCoefficient>,
    constant_terms: Vec<f64>,
}

#[derive(Serialize)]
struct GroupCoefficient {
    variable: String,
    values: Vec<f64>,
}

#[derive(Serialize)]
struct FormattedDiscriminantHistograms {
    functions: Vec<String>,
    groups: Vec<String>,
    histograms: Vec<HistogramEntry>,
}

#[derive(Serialize)]
struct HistogramEntry {
    function: String,
    group: String,
    histogram: GroupHistogram,
}

impl FormatResult {
    fn from_analysis_result(result: &DiscriminantResult) -> Self {
        // Transform GroupStatistics
        let group_statistics = result.group_statistics.as_ref().map(|stats| {
            let means = stats.variables
                .iter()
                .enumerate()
                .map(|(i, var)| {
                    let values = stats.groups
                        .iter()
                        .map(|group| { stats.means.get(var).unwrap_or(&vec![0.0])[i] })
                        .collect();

                    GroupValue {
                        variable: var.clone(),
                        values,
                    }
                })
                .collect();

            let std_deviations = stats.variables
                .iter()
                .enumerate()
                .map(|(i, var)| {
                    let values = stats.groups
                        .iter()
                        .map(|group| { stats.std_deviations.get(var).unwrap_or(&vec![0.0])[i] })
                        .collect();

                    GroupValue {
                        variable: var.clone(),
                        values,
                    }
                })
                .collect();

            FormattedGroupStatistics {
                groups: stats.groups.clone(),
                variables: stats.variables.clone(),
                means,
                std_deviations,
            }
        });

        // Transform CanonicalFunctions
        let canonical_functions = result.canonical_functions.as_ref().map(|funcs| {
            let coefficients = funcs.coefficients
                .iter()
                .map(|(var, values)| {
                    FunctionValue {
                        variable: var.clone(),
                        values: values.clone(),
                    }
                })
                .collect();

            let standardized_coefficients = funcs.standardized_coefficients
                .iter()
                .map(|(var, values)| {
                    FunctionValue {
                        variable: var.clone(),
                        values: values.clone(),
                    }
                })
                .collect();

            let function_at_centroids = funcs.function_at_centroids
                .iter()
                .map(|(group, values)| {
                    GroupCentroid {
                        group: group.clone(),
                        values: values.clone(),
                    }
                })
                .collect();

            FormattedCanonicalFunctions {
                coefficients,
                standardized_coefficients,
                function_at_centroids,
            }
        });

        // Transform StructureMatrix
        let structure_matrix = result.structure_matrix.as_ref().map(|matrix| {
            let correlations = matrix.correlations
                .iter()
                .map(|(var, values)| {
                    FunctionValue {
                        variable: var.clone(),
                        values: values.clone(),
                    }
                })
                .collect();

            FormattedStructureMatrix {
                variables: matrix.variables.clone(),
                correlations,
            }
        });

        // Transform ClassificationResults
        let classification_results = result.classification_results.as_ref().map(|results| {
            let original_classification = results.original_classification
                .iter()
                .map(|(group, counts)| {
                    GroupClassification {
                        group: group.clone(),
                        counts: counts.clone(),
                    }
                })
                .collect();

            let cross_validated_classification = results.cross_validated_classification
                .as_ref()
                .map(|cross_val| {
                    cross_val
                        .iter()
                        .map(|(group, counts)| {
                            GroupClassification {
                                group: group.clone(),
                                counts: counts.clone(),
                            }
                        })
                        .collect()
                });

            let original_percentage = results.original_percentage
                .iter()
                .map(|(group, percentages)| {
                    GroupPercentage {
                        group: group.clone(),
                        percentages: percentages.clone(),
                    }
                })
                .collect();

            let cross_validated_percentage = results.cross_validated_percentage
                .as_ref()
                .map(|cross_val| {
                    cross_val
                        .iter()
                        .map(|(group, percentages)| {
                            GroupPercentage {
                                group: group.clone(),
                                percentages: percentages.clone(),
                            }
                        })
                        .collect()
                });

            FormattedClassificationResults {
                original_classification,
                cross_validated_classification,
                original_percentage,
                cross_validated_percentage,
            }
        });

        // Transform PooledMatrices
        let pooled_matrices = result.pooled_matrices.as_ref().map(|matrices| {
            let covariance = matrices.variables
                .iter()
                .map(|var| {
                    let values = matrices.variables
                        .iter()
                        .map(|other_var| {
                            let value = matrices.covariance
                                .get(var)
                                .and_then(|row| row.get(other_var))
                                .cloned()
                                .unwrap_or(0.0);

                            ValueEntry {
                                variable: other_var.clone(),
                                value,
                            }
                        })
                        .collect();

                    MatrixEntry {
                        variable: var.clone(),
                        values,
                    }
                })
                .collect();

            let correlation = matrices.variables
                .iter()
                .map(|var| {
                    let values = matrices.variables
                        .iter()
                        .map(|other_var| {
                            let value = matrices.correlation
                                .get(var)
                                .and_then(|row| row.get(other_var))
                                .cloned()
                                .unwrap_or(0.0);

                            ValueEntry {
                                variable: other_var.clone(),
                                value,
                            }
                        })
                        .collect();

                    MatrixEntry {
                        variable: var.clone(),
                        values,
                    }
                })
                .collect();

            FormattedPooledMatrices {
                variables: matrices.variables.clone(),
                covariance,
                correlation,
            }
        });

        // Transform CovarianceMatrices
        let covariance_matrices = result.covariance_matrices.as_ref().map(|matrices| {
            let matrices_entries = matrices.groups
                .iter()
                .map(|group| {
                    let matrix = matrices.variables
                        .iter()
                        .map(|var| {
                            let values = matrices.variables
                                .iter()
                                .map(|other_var| {
                                    let value = matrices.matrices
                                        .get(group)
                                        .and_then(|group_matrix| group_matrix.get(var))
                                        .and_then(|row| row.get(other_var))
                                        .cloned()
                                        .unwrap_or(0.0);

                                    ValueEntry {
                                        variable: other_var.clone(),
                                        value,
                                    }
                                })
                                .collect();

                            MatrixEntry {
                                variable: var.clone(),
                                values,
                            }
                        })
                        .collect();

                    GroupMatrixEntry {
                        group: group.clone(),
                        matrix,
                    }
                })
                .collect();

            FormattedCovarianceMatrices {
                groups: matrices.groups.clone(),
                variables: matrices.variables.clone(),
                matrices: matrices_entries,
            }
        });

        // Transform StepwiseStatistics
        let stepwise_statistics = result.stepwise_statistics.as_ref().map(|stats| {
            let variables_in_analysis = stats.variables_in_analysis
                .iter()
                .map(|(step, vars)| {
                    StepVariables {
                        step: step.clone(),
                        variables: vars.clone(),
                    }
                })
                .collect();

            let variables_not_in_analysis = stats.variables_not_in_analysis
                .iter()
                .map(|(step, vars)| {
                    StepVariables {
                        step: step.clone(),
                        variables: vars
                            .iter()
                            .map(|v| {
                                // Convert VariableNotInAnalysis to VariableInAnalysis for simplicity
                                // This is just a placeholder, you might need actual conversion logic
                                VariableInAnalysis {
                                    variable: v.variable.clone(),
                                    tolerance: v.tolerance,
                                    f_to_remove: v.f_to_enter,
                                    wilks_lambda: v.wilks_lambda,
                                }
                            })
                            .collect(),
                    }
                })
                .collect();

            let pairwise_comparisons = stats.pairwise_comparisons
                .iter()
                .flat_map(|(step, group_comps)| {
                    group_comps
                        .iter()
                        .map(|(group1, comps)| {
                            GroupPairComparison {
                                step: step.clone(),
                                group1: group1.clone(),
                                group2: "".to_string(), // Would need actual group2 info
                                comparisons: comps.clone(),
                            }
                        })
                        .collect::<Vec<GroupPairComparison>>()
                })
                .collect();

            FormattedStepwiseStatistics {
                variables_entered: stats.variables_entered.clone(),
                variables_removed: stats.variables_removed.clone(),
                wilks_lambda: stats.wilks_lambda.clone(),
                f_values: stats.f_values.clone(),
                df1: stats.df1.clone(),
                df2: stats.df2.clone(),
                df3: stats.df3.clone(),
                exact_f: stats.exact_f.clone(),
                exact_df1: stats.exact_df1.clone(),
                exact_df2: stats.exact_df2.clone(),
                significance: stats.significance.clone(),
                variables_in_analysis,
                variables_not_in_analysis,
                pairwise_comparisons,
            }
        });

        // Transform CasewiseStatistics
        let casewise_statistics = result.casewise_statistics.as_ref().map(|stats| {
            let discriminant_scores = stats.discriminant_scores
                .iter()
                .map(|(func, values)| {
                    ScoreValue {
                        function: func.clone(),
                        values: values.clone(),
                    }
                })
                .collect();

            FormattedCasewiseStatistics {
                case_number: stats.case_number.clone(),
                actual_group: stats.actual_group.clone(),
                predicted_group: stats.predicted_group.clone(),
                highest_group: stats.highest_group.clone(),
                second_highest_group: stats.second_highest_group.clone(),
                discriminant_scores,
            }
        });

        // Transform PriorProbabilities
        let prior_probabilities = result.prior_probabilities.as_ref().map(|probs| {
            let cases_used = probs.cases_used
                .iter()
                .map(|(case_type, counts)| {
                    GroupCases {
                        case_type: case_type.clone(),
                        counts: counts.clone(),
                    }
                })
                .collect();

            FormattedPriorProbabilities {
                groups: probs.groups.clone(),
                prior_probabilities: probs.prior_probabilities.clone(),
                cases_used,
                total: probs.total,
            }
        });

        // Transform ClassificationFunctionCoefficients
        let classification_function_coefficients = result.classification_function_coefficients
            .as_ref()
            .map(|coeffs| {
                let coefficients = coeffs.variables
                    .iter()
                    .map(|var| {
                        let values = coeffs.coefficients.get(var).cloned().unwrap_or_default();

                        GroupCoefficient {
                            variable: var.clone(),
                            values,
                        }
                    })
                    .collect();

                FormattedClassificationFunctionCoefficients {
                    groups: coeffs.groups.clone(),
                    variables: coeffs.variables.clone(),
                    coefficients,
                    constant_terms: coeffs.constant_terms.clone(),
                }
            });

        // Transform DiscriminantHistograms
        let discriminant_histograms = result.discriminant_histograms.as_ref().map(|hists| {
            let histograms = hists.functions
                .iter()
                .flat_map(|func| {
                    hists.groups
                        .iter()
                        .filter_map(|group| {
                            // Hanya lanjutkan jika histogram ditemukan untuk func ini
                            if let Some(histogram) = hists.histograms.get(func) {
                                Some(HistogramEntry {
                                    function: func.clone(),
                                    group: group.clone(),
                                    histogram: histogram.clone(),
                                })
                            } else {
                                None
                            }
                        })
                        .collect::<Vec<HistogramEntry>>()
                })
                .collect();

            FormattedDiscriminantHistograms {
                functions: hists.functions.clone(),
                groups: hists.groups.clone(),
                histograms,
            }
        });

        FormatResult {
            processing_summary: Some(result.processing_summary.clone()),
            group_statistics,
            equality_tests: result.equality_tests.clone(),
            canonical_functions,
            structure_matrix,
            classification_results,
            box_m_test: result.box_m_test.clone(),
            pooled_matrices,
            covariance_matrices,
            log_determinants: result.log_determinants.clone(),
            eigen_description: result.eigen_description.clone(),
            stepwise_statistics,
            wilks_lambda_test: result.wilks_lambda_test.clone(),
            casewise_statistics,
            prior_probabilities,
            classification_function_coefficients,
            discriminant_histograms,
        }
    }
}
