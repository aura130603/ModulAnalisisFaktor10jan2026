use std::collections::HashMap;
use statrs::distribution::{ ContinuousCDF, FisherSnedecor };

use crate::models::{
    config::MultivariateConfig,
    data::{ AnalysisData, DataValue },
    result::{ LeveneTest, LeveneResult },
};

use super::core::{
    calculate_mean,
    extract_dependent_value,
    get_factor_combinations,
    matches_combination,
};

/// Calculate median of a list of values
fn calculate_median(values: &[f64]) -> f64 {
    if values.is_empty() {
        return 0.0;
    }

    let mut sorted_values = values.to_vec();
    sorted_values.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

    let n = sorted_values.len();
    if n % 2 == 0 {
        // Even number of elements, take average of middle two
        (sorted_values[n / 2 - 1] + sorted_values[n / 2]) / 2.0
    } else {
        // Odd number of elements, take middle one
        sorted_values[n / 2]
    }
}

/// Calculate trimmed mean (removing 5% from both extremes)
fn calculate_trimmed_mean(values: &[f64]) -> f64 {
    if values.is_empty() {
        return 0.0;
    }

    let mut sorted_values = values.to_vec();
    sorted_values.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

    let n = sorted_values.len();

    // Calculate how many elements to trim (5% from each end)
    let trim_count = ((n as f64) * 0.05).floor() as usize;

    // If too few elements for trimming, return regular mean
    if trim_count == 0 || n <= trim_count * 2 {
        return calculate_mean(values);
    }

    // Calculate mean of the remaining elements
    let sum: f64 = sorted_values[trim_count..n - trim_count].iter().sum();
    let count = n - trim_count * 2;

    sum / (count as f64)
}

/// Calculate Levene's Test for homogeneity of variances
/// This tests whether the error variance of the dependent variables is equal across groups
pub fn calculate_levene_test(
    data: &AnalysisData,
    config: &MultivariateConfig
) -> Result<Vec<LeveneTest>, String> {
    // Check if homogeneity test is requested
    if !config.options.homogen_test {
        return Err("Levene's test not requested in configuration".to_string());
    }

    let mut result = Vec::new();

    // Get dependent variables
    let dependent_vars = match &config.main.dep_var {
        Some(dep_vars) => dep_vars.clone(),
        None => {
            // If no specific dependent variables are provided, use all from the data
            data.dependent_data_defs
                .iter()
                .flat_map(|defs| defs.iter().map(|def| def.name.clone()))
                .collect::<Vec<String>>()
        }
    };

    if dependent_vars.is_empty() {
        return Err("No dependent variables found for Levene's test".to_string());
    }

    // Build design string
    let mut design_string = if config.model.intercept {
        "Intercept".to_string()
    } else {
        "".to_string()
    };

    // Add covariates to design string
    if let Some(covariates) = &config.main.covar {
        if !covariates.is_empty() {
            if !design_string.is_empty() {
                design_string.push_str(" + ");
            }
            design_string.push_str(&covariates.join(" + "));
        }
    }

    // Add factors to design string
    if let Some(factors) = &config.main.fix_factor {
        if !factors.is_empty() {
            if !design_string.is_empty() {
                design_string.push_str(" + ");
            }
            design_string.push_str(&factors.join(" + "));
        }
    }

    // Get between-subjects factors combinations
    let combinations = get_factor_combinations(data, config)?;

    // If we have no combinations but still have dependent variables, we might need to run
    // Levene's test across the entire dataset without grouping
    if combinations.is_empty() {
        return Ok(result); // No combinations means no groups to test homogeneity between
    }

    for dep_var in dependent_vars {
        // Collect values by group for Levene's test
        let mut group_values: HashMap<String, Vec<f64>> = HashMap::new();

        if let Some(factors) = &config.main.fix_factor {
            // If we have factors, group by factor combinations
            if !factors.is_empty() {
                for combo in &combinations {
                    let group_key = combo
                        .iter()
                        .map(|(f, v)| format!("{}={}", f, v))
                        .collect::<Vec<String>>()
                        .join(", ");

                    let mut values = Vec::new();
                    for records in &data.dependent_data {
                        for record in records {
                            if matches_combination(record, combo, data, config) {
                                if let Some(value) = extract_dependent_value(record, &dep_var) {
                                    values.push(value);
                                }
                            }
                        }
                    }

                    if !values.is_empty() {
                        group_values.insert(group_key, values);
                    }
                }
            }
        }

        // Skip if insufficient groups for analysis
        if group_values.len() < 2 {
            continue; // Need at least 2 groups to test homogeneity of variance
        }

        // Calculate various statistics for each group
        let mut group_means = HashMap::new();
        let mut group_medians = HashMap::new();
        let mut group_trimmed_means = HashMap::new();

        for (group, values) in &group_values {
            group_means.insert(group.clone(), calculate_mean(values));
            group_medians.insert(group.clone(), calculate_median(values));
            group_trimmed_means.insert(group.clone(), calculate_trimmed_mean(values));
        }

        // Arrays to hold the four types of Levene test results
        let mut levene_results = Vec::new();

        // Common data structure preparation
        let mut all_abs_deviations = [Vec::new(), Vec::new(), Vec::new(), Vec::new()];
        let mut all_group_indices = [Vec::new(), Vec::new(), Vec::new(), Vec::new()];
        let mut group_keys = Vec::new();

        for (idx, (group, values)) in group_values.iter().enumerate() {
            // Get the various centers for this group
            let group_mean = group_means[group];
            let group_median = group_medians[group];
            let group_trimmed_mean = group_trimmed_means[group];

            for value in values {
                // Calculate absolute deviations from different centers
                all_abs_deviations[0].push((*value - group_mean).abs()); // Based on Mean
                all_abs_deviations[1].push((*value - group_median).abs()); // Based on Median
                all_abs_deviations[2].push((*value - group_median).abs()); // Based on Median (for adjusted df)
                all_abs_deviations[3].push((*value - group_trimmed_mean).abs()); // Based on trimmed mean

                // Store group indices for all tests
                for i in 0..4 {
                    all_group_indices[i].push(idx);
                }
            }
            group_keys.push(group.clone());
        }

        // Calculate all four Levene's test variants
        let test_names = [
            "Based on Mean",
            "Based on Median",
            "Based on Median and with adjusted df",
            "Based on trimmed mean",
        ];

        for test_idx in 0..4 {
            let abs_deviations = &all_abs_deviations[test_idx];
            let group_indices = &all_group_indices[test_idx];

            // Calculate Levene's statistic (ANOVA on absolute deviations)
            let n_total = abs_deviations.len();
            let k = group_values.len();

            // Calculate group means of absolute deviations
            let mut group_abs_means = vec![0.0; k];
            let mut group_counts = vec![0; k];

            for i in 0..abs_deviations.len() {
                let group_idx = group_indices[i];
                group_abs_means[group_idx] += abs_deviations[i];
                group_counts[group_idx] += 1;
            }

            for i in 0..k {
                if group_counts[i] > 0 {
                    group_abs_means[i] /= group_counts[i] as f64;
                }
            }

            // Calculate overall mean of absolute deviations
            let overall_abs_mean = calculate_mean(abs_deviations);

            // Calculate between-groups sum of squares
            let mut ss_between = 0.0;
            for i in 0..k {
                ss_between +=
                    (group_counts[i] as f64) * (group_abs_means[i] - overall_abs_mean).powi(2);
            }

            // Calculate within-groups sum of squares
            let mut ss_within = 0.0;
            for i in 0..abs_deviations.len() {
                let group_idx = group_indices[i];
                ss_within += (abs_deviations[i] - group_abs_means[group_idx]).powi(2);
            }

            // Calculate degrees of freedom
            let df1 = k - 1;
            let df2 = if test_idx == 2 {
                // For "Based on Median and with adjusted df", use modified df2
                // This calculation is based on adjusting df to account for the median estimation
                let mut adjusted_df2 = 0;
                for count in group_counts.iter() {
                    if *count > 1 {
                        adjusted_df2 += count - 1;
                    }
                }
                adjusted_df2
            } else {
                n_total - k
            };

            // Calculate mean squares
            let ms_between = ss_between / (df1 as f64);
            let ms_within = ss_within / (df2 as f64);

            // Calculate F-statistic
            let f_statistic = ms_between / ms_within;

            // Calculate significance (p-value)
            let f_dist = FisherSnedecor::new(df1 as f64, df2 as f64).unwrap();
            let significance = 1.0 - f_dist.cdf(f_statistic);

            levene_results.push(LeveneResult {
                levene_statistic: f_statistic,
                df1,
                df2,
                significance,
                function: None,
                design: Some(format!("Design: {}", design_string)),
                test_basis: Some(test_names[test_idx].to_string()),
            });
        }

        result.push(LeveneTest {
            dependent_variable: dep_var.clone(),
            levene: levene_results,
        });
    }

    if result.is_empty() {
        return Err("Could not calculate Levene's test for any dependent variable".to_string());
    }

    Ok(result)
}
