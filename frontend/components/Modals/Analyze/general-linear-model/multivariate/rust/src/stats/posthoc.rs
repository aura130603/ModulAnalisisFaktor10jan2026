use std::collections::HashMap;

use crate::models::{
    config::MultivariateConfig,
    data::AnalysisData,
    result::{ ConfidenceInterval, PostHocTest },
};

use super::core::{
    calculate_mean,
    calculate_t_critical,
    calculate_t_significance,
    calculate_variance,
    get_factor_levels,
    get_level_values,
};

/// Calculate post-hoc tests
pub fn calculate_posthoc_tests(
    data: &AnalysisData,
    config: &MultivariateConfig
) -> Result<HashMap<String, Vec<PostHocTest>>, String> {
    let mut result = HashMap::new();

    // Get dependent variables
    let dependent_vars = data.dependent_data_defs
        .iter()
        .flat_map(|defs| defs.iter().map(|def| def.name.clone()))
        .collect::<Vec<String>>();

    // Check if posthoc tests are requested
    if let Some(factor_list) = &config.posthoc.src_list {
        if factor_list.is_empty() {
            return Err("No factors specified for post-hoc tests.".to_string());
        }

        for dep_var in &dependent_vars {
            let mut tests = Vec::new();

            for factor in factor_list {
                if let Ok(levels) = get_factor_levels(data, factor) {
                    // For each factor, perform pairwise comparisons between levels
                    for i in 0..levels.len() {
                        for j in i + 1..levels.len() {
                            let level_i = &levels[i];
                            let level_j = &levels[j];

                            // Get values for each level
                            let values_i = get_level_values(data, factor, level_i, dep_var)?;
                            let values_j = get_level_values(data, factor, level_j, dep_var)?;

                            if !values_i.is_empty() && !values_j.is_empty() {
                                // Calculate means
                                let mean_i = calculate_mean(&values_i);
                                let mean_j = calculate_mean(&values_j);
                                let mean_diff = mean_i - mean_j;

                                // Calculate pooled standard deviation
                                let n_i = values_i.len();
                                let n_j = values_j.len();
                                let var_i = calculate_variance(&values_i, Some(mean_i));
                                let var_j = calculate_variance(&values_j, Some(mean_j));

                                let pooled_var =
                                    (((n_i - 1) as f64) * var_i + ((n_j - 1) as f64) * var_j) /
                                    ((n_i + n_j - 2) as f64);
                                let std_error = (
                                    pooled_var *
                                    (1.0 / (n_i as f64) + 1.0 / (n_j as f64))
                                ).sqrt();

                                // Calculate t-statistic and significance
                                let df = n_i + n_j - 2;
                                let t_value = mean_diff / std_error;
                                let mut significance = calculate_t_significance(df, t_value);

                                // Apply multiple comparison correction based on selected method
                                if config.posthoc.bonfe {
                                    // Bonferroni correction
                                    let total_comparisons = (levels.len() * (levels.len() - 1)) / 2;
                                    significance =
                                        significance.min(1.0) * (total_comparisons as f64);
                                } else if config.posthoc.sidak {
                                    // Sidak correction
                                    let total_comparisons = (levels.len() * (levels.len() - 1)) / 2;
                                    significance =
                                        1.0 -
                                        (1.0 - significance)
                                            .min(1.0)
                                            .powf(total_comparisons as f64);
                                }

                                // Calculate confidence interval (default 95%)
                                let alpha = 0.05;
                                let mut t_critical = calculate_t_critical(df, alpha / 2.0);

                                // Adjust critical value for multiple comparisons if needed
                                if config.posthoc.bonfe {
                                    let total_comparisons = (levels.len() * (levels.len() - 1)) / 2;
                                    t_critical = calculate_t_critical(
                                        df,
                                        alpha / (2.0 * (total_comparisons as f64))
                                    );
                                } else if config.posthoc.sidak {
                                    let total_comparisons = (levels.len() * (levels.len() - 1)) / 2;
                                    t_critical = calculate_t_critical(
                                        df,
                                        1.0 -
                                            (1.0 - alpha / 2.0).powf(
                                                1.0 / (total_comparisons as f64)
                                            )
                                    );
                                }

                                let ci_lower = mean_diff - t_critical * std_error;
                                let ci_upper = mean_diff + t_critical * std_error;

                                // Determine which posthoc test was used
                                let test_type = if config.posthoc.bonfe {
                                    "Bonferroni"
                                } else if config.posthoc.sidak {
                                    "Sidak"
                                } else if config.posthoc.scheffe {
                                    "Scheffe"
                                } else if config.posthoc.lsd {
                                    "LSD"
                                } else {
                                    "Pairwise Comparison"
                                };

                                tests.push(PostHocTest {
                                    dependent_variable: dep_var.clone(),
                                    test_type: test_type.to_string(),
                                    factor_name: factor.clone(),
                                    i_level: level_i.clone(),
                                    j_level: level_j.clone(),
                                    mean_difference: mean_diff,
                                    std_error,
                                    significance,
                                    confidence_interval: ConfidenceInterval {
                                        lower_bound: ci_lower,
                                        upper_bound: ci_upper,
                                    },
                                });
                            }
                        }
                    }
                }
            }

            if !tests.is_empty() {
                result.insert(dep_var.clone(), tests);
            }
        }
    }

    if result.is_empty() {
        Err("No post-hoc tests were performed.".to_string())
    } else {
        Ok(result)
    }
}
