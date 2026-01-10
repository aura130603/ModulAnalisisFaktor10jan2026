use std::collections::HashMap;
use statrs::distribution::{ ContinuousCDF, FisherSnedecor, StudentsT, ChiSquared };
use crate::models::{
    config::MultivariateConfig,
    data::AnalysisData,
    result::{ HomogeneousSubsets, HomogeneousSubsetGroup },
};
use super::core::{
    extract_dependent_value,
    data_value_to_string,
    get_factor_levels,
    get_level_values,
    calculate_mean,
    calculate_std_deviation,
    calculate_t_significance,
    calculate_f_significance,
    calculate_t_critical,
};

pub fn calculate_homogeneous_subsets(
    data: &AnalysisData,
    config: &MultivariateConfig
) -> Result<HashMap<String, HashMap<String, HomogeneousSubsets>>, String> {
    let mut result = HashMap::new();

    // Extract dependent variables from config
    let dependent_vars = match &config.main.dep_var {
        Some(vars) if !vars.is_empty() => vars,
        _ => {
            return Err("No dependent variables defined in the model".to_string());
        }
    };

    // Extract factors from config
    let factors = match &config.main.fix_factor {
        Some(factors) if !factors.is_empty() => factors,
        _ => {
            return Err("No factors defined in the model".to_string());
        }
    };

    // Process each combination of dependent variable and factor
    for dependent_var in dependent_vars {
        let mut factor_results = HashMap::new();

        for factor in factors {
            // Calculate necessary statistics
            let (mse, df_error) = match calculate_mean_square_error(data, config, dependent_var) {
                Ok(result) => result,
                Err(_) => {
                    continue;
                } // Skip this combination if error occurs
            };

            // Calculate factor levels and their means
            let factor_levels = match get_factor_levels(data, factor) {
                Ok(levels) => levels,
                Err(_) => {
                    continue;
                } // Skip this combination if error occurs
            };

            let mut level_means: Vec<(String, f64, usize)> = Vec::new();
            for level in &factor_levels {
                let values = match get_level_values(data, factor, level, dependent_var) {
                    Ok(v) => v,
                    Err(_) => {
                        continue;
                    } // Skip this level if error occurs
                };

                let n = values.len();
                if n > 0 {
                    let mean = calculate_mean(&values);
                    level_means.push((level.clone(), mean, n));
                }
            }

            // Sort level means from smallest to largest
            level_means.sort_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(std::cmp::Ordering::Equal));

            // Calculate harmonic mean of sample sizes (needed for some tests)
            let harmonic_mean = calculate_harmonic_mean(&level_means);
            let alpha = config.options.sig_level.unwrap_or(0.05);

            // Generate homogeneous subsets for each requested test
            if config.posthoc.tu {
                // Tukey HSD
                if
                    let Ok(subsets) = calculate_tukey_hsd_subsets(
                        factor,
                        &level_means,
                        mse,
                        df_error,
                        harmonic_mean,
                        alpha
                    )
                {
                    // Use the combination of dependent variable and factor as the key
                    let key = format!("{}_{}", dependent_var, factor);
                    factor_results.insert(key, subsets);
                }
            }

            if config.posthoc.snk {
                // Student-Newman-Keuls
                if
                    let Ok(subsets) = calculate_snk_subsets(
                        factor,
                        &level_means,
                        mse,
                        df_error,
                        harmonic_mean,
                        alpha
                    )
                {
                    let key = format!("{}_{}_SNK", dependent_var, factor);
                    factor_results.insert(key, subsets);
                }
            }

            if config.posthoc.dun {
                // Duncan
                if
                    let Ok(subsets) = calculate_duncan_subsets(
                        factor,
                        &level_means,
                        mse,
                        df_error,
                        harmonic_mean,
                        alpha
                    )
                {
                    let key = format!("{}_{}_Duncan", dependent_var, factor);
                    factor_results.insert(key, subsets);
                }
            }

            if config.posthoc.regwf {
                // Ryan-Einot-Gabriel-Welsch F
                if
                    let Ok(subsets) = calculate_regwf_subsets(
                        factor,
                        &level_means,
                        mse,
                        df_error,
                        harmonic_mean,
                        alpha
                    )
                {
                    let key = format!("{}_{}_R-E-G-W F", dependent_var, factor);
                    factor_results.insert(key, subsets);
                }
            }

            if config.posthoc.regwq {
                // Ryan-Einot-Gabriel-Welsch Q
                if
                    let Ok(subsets) = calculate_regwq_subsets(
                        factor,
                        &level_means,
                        mse,
                        df_error,
                        harmonic_mean,
                        alpha
                    )
                {
                    let key = format!("{}_{}_R-E-G-W Q", dependent_var, factor);
                    factor_results.insert(key, subsets);
                }
            }

            if config.posthoc.tub {
                // Tukey b
                if
                    let Ok(subsets) = calculate_tukey_b_subsets(
                        factor,
                        &level_means,
                        mse,
                        df_error,
                        harmonic_mean,
                        alpha
                    )
                {
                    let key = format!("{}_{}_Tukey b", dependent_var, factor);
                    factor_results.insert(key, subsets);
                }
            }

            if config.posthoc.waller {
                // Waller-Duncan
                let error_ratio = config.posthoc.error_ratio.unwrap_or(100) as f64;
                if
                    let Ok(subsets) = calculate_waller_duncan_subsets(
                        factor,
                        &level_means,
                        mse,
                        df_error,
                        harmonic_mean,
                        error_ratio,
                        alpha
                    )
                {
                    let key = format!("{}_{}_Waller-Duncan", dependent_var, factor);
                    factor_results.insert(key, subsets);
                }
            }
        }

        if !factor_results.is_empty() {
            result.insert(dependent_var.clone(), factor_results);
        }
    }

    if result.is_empty() {
        Err(
            "Failed to calculate homogeneous subsets for any variable-factor combination".to_string()
        )
    } else {
        Ok(result)
    }
}

/// Calculate the mean square error from the data
fn calculate_mean_square_error(
    data: &AnalysisData,
    config: &MultivariateConfig,
    dependent_var: &str
) -> Result<(f64, usize), String> {
    // Get the factor list
    let factors = match &config.main.fix_factor {
        Some(f) => f.clone(),
        None => {
            return Err("No factors defined in the model".to_string());
        }
    };

    // Calculate total sum of squares
    let all_values: Vec<f64> = data.dependent_data
        .iter()
        .flat_map(|records| {
            records.iter().filter_map(|record| { extract_dependent_value(record, dependent_var) })
        })
        .collect();

    if all_values.is_empty() {
        return Err("No valid data found for dependent variable".to_string());
    }

    let grand_mean = calculate_mean(&all_values);
    let total_ss: f64 = all_values
        .iter()
        .map(|v| (v - grand_mean).powi(2))
        .sum();

    // Calculate between-groups sum of squares
    let mut between_ss = 0.0;
    let mut df_factors_total = 0;

    for factor in &factors {
        let levels = get_factor_levels(data, factor)?;
        if levels.is_empty() {
            continue;
        }

        let factor_df = levels.len() - 1;
        df_factors_total += factor_df;

        let mut factor_ss = 0.0;
        for level in &levels {
            let level_values = get_level_values(data, factor, level, dependent_var)?;
            let n = level_values.len();
            if n > 0 {
                let level_mean = calculate_mean(&level_values);
                factor_ss += (n as f64) * (level_mean - grand_mean).powi(2);
            }
        }

        between_ss += factor_ss;
    }

    // Calculate within-groups (error) sum of squares
    let error_ss = total_ss - between_ss;

    // Calculate degrees of freedom
    let df_total = all_values.len() - 1;
    let df_error = df_total - df_factors_total;

    if df_error <= 0 {
        return Err("Insufficient degrees of freedom for error term".to_string());
    }

    // Calculate mean square error
    let mse = error_ss / (df_error as f64);

    Ok((mse, df_error))
}

/// Calculate the harmonic mean of sample sizes
fn calculate_harmonic_mean(level_means: &[(String, f64, usize)]) -> f64 {
    let sum_reciprocals: f64 = level_means
        .iter()
        .map(|(_, _, n)| 1.0 / (*n as f64))
        .sum();

    if sum_reciprocals == 0.0 {
        return 0.0;
    }

    (level_means.len() as f64) / sum_reciprocals
}

/// Calculate Tukey HSD homogeneous subsets
fn calculate_tukey_hsd_subsets(
    factor: &str,
    level_means: &[(String, f64, usize)],
    mse: f64,
    df_error: usize,
    harmonic_mean: f64,
    alpha: f64
) -> Result<HomogeneousSubsets, String> {
    if level_means.is_empty() {
        return Err("No valid level means available".to_string());
    }

    // Get the critical value from Studentized Range distribution
    // For Tukey HSD, we use the Studentized Range q distribution
    // Since statrs doesn't have a direct implementation, we'll approximate it
    // q_(alpha, k, df) where k is the number of means
    let k = level_means.len();
    let q_critical = approximate_studentized_range(alpha, k, df_error);

    // Calculate the minimum significant difference
    let msd = q_critical * (mse / harmonic_mean).sqrt();

    // Create subsets using the range test approach
    let subsets = create_homogeneous_subsets(level_means, msd);

    // Format the results
    let mut groups = Vec::new();
    for (i, (level, mean, n)) in level_means.iter().enumerate() {
        let mut group = HomogeneousSubsetGroup {
            factor_name: factor.to_string(),
            factor_value: level.clone(),
            n: *n,
            subsets: HashMap::new(),
            significance: None,
        };

        // Determine which subsets this level belongs to
        for (subset_idx, subset) in subsets.iter().enumerate() {
            if subset.contains(&i) {
                group.subsets.insert(subset_idx + 1, *mean);
            }
        }

        groups.push(group);
    }

    // Calculate significance values for each subset
    let significances = calculate_subset_significances(&subsets, level_means, mse, df_error);

    // Create the final HomogeneousSubsets structure
    let result = HomogeneousSubsets {
        test_name: "Tukey HSD".to_string(),
        groups,
        error_term: "Mean Square(Error)".to_string(),
        error_value: mse,
        uses_harmonic_mean: true,
        harmonic_mean_sample_size: Some(harmonic_mean),
        notes: vec![
            "Uses Harmonic Mean Sample Size = ".to_string() + &format!("{:.3}", harmonic_mean),
            "The group sizes are unequal. The harmonic mean of the group sizes is used. Type I error levels are not guaranteed.".to_string(),
            "Alpha = ".to_string() + &format!("{:.2}", alpha)
        ],
        alpha,
    };

    Ok(result)
}

/// Calculate Student-Newman-Keuls homogeneous subsets
fn calculate_snk_subsets(
    factor: &str,
    level_means: &[(String, f64, usize)],
    mse: f64,
    df_error: usize,
    harmonic_mean: f64,
    alpha: f64
) -> Result<HomogeneousSubsets, String> {
    if level_means.is_empty() {
        return Err("No valid level means available".to_string());
    }

    // SNK uses different critical values based on the range (p) between means
    let k = level_means.len();
    let mut range_msds = Vec::new();

    // Calculate critical values for each range
    for p in 2..=k {
        let q_critical = approximate_studentized_range(alpha, p, df_error);
        let msd = q_critical * (mse / harmonic_mean).sqrt();
        range_msds.push(msd);
    }

    // Create subsets using the SNK step-down procedure
    let subsets = create_snk_subsets(level_means, &range_msds, mse, harmonic_mean);

    // Format the results similar to Tukey HSD
    let mut groups = Vec::new();
    for (i, (level, mean, n)) in level_means.iter().enumerate() {
        let mut group = HomogeneousSubsetGroup {
            factor_name: factor.to_string(),
            factor_value: level.clone(),
            n: *n,
            subsets: HashMap::new(),
            significance: None,
        };

        // Determine which subsets this level belongs to
        for (subset_idx, subset) in subsets.iter().enumerate() {
            if subset.contains(&i) {
                group.subsets.insert(subset_idx + 1, *mean);
            }
        }

        groups.push(group);
    }

    // Calculate significance values for each subset
    let significances = calculate_subset_significances(&subsets, level_means, mse, df_error);

    // Create the final HomogeneousSubsets structure
    let result = HomogeneousSubsets {
        test_name: "Student-Newman-Keuls".to_string(),
        groups,
        error_term: "Mean Square(Error)".to_string(),
        error_value: mse,
        uses_harmonic_mean: true,
        harmonic_mean_sample_size: Some(harmonic_mean),
        notes: vec![
            "Uses Harmonic Mean Sample Size = ".to_string() + &format!("{:.3}", harmonic_mean),
            "The group sizes are unequal. The harmonic mean of the group sizes is used. Type I error levels are not guaranteed.".to_string(),
            "Alpha = ".to_string() + &format!("{:.2}", alpha)
        ],
        alpha,
    };

    Ok(result)
}

/// Calculate Duncan's homogeneous subsets
fn calculate_duncan_subsets(
    factor: &str,
    level_means: &[(String, f64, usize)],
    mse: f64,
    df_error: usize,
    harmonic_mean: f64,
    alpha: f64
) -> Result<HomogeneousSubsets, String> {
    if level_means.is_empty() {
        return Err("No valid level means available".to_string());
    }

    // Duncan's test uses a different protection level for different ranges
    let k = level_means.len();
    let mut range_msds = Vec::new();

    // Calculate critical values for each range
    for p in 2..=k {
        // Duncan's protection level: 1 - (1 - alpha)^(p-1)
        let protection_level = 1.0 - (1.0 - alpha).powf((p - 1) as f64);
        let q_critical = approximate_studentized_range(protection_level, p, df_error);
        let msd = q_critical * (mse / harmonic_mean).sqrt();
        range_msds.push(msd);
    }

    // Create subsets using Duncan's procedure
    let subsets = create_snk_subsets(level_means, &range_msds, mse, harmonic_mean);

    // Format the results similar to previous tests
    let mut groups = Vec::new();
    for (i, (level, mean, n)) in level_means.iter().enumerate() {
        let mut group = HomogeneousSubsetGroup {
            factor_name: factor.to_string(),
            factor_value: level.clone(),
            n: *n,
            subsets: HashMap::new(),
            significance: None,
        };

        // Determine which subsets this level belongs to
        for (subset_idx, subset) in subsets.iter().enumerate() {
            if subset.contains(&i) {
                group.subsets.insert(subset_idx + 1, *mean);
            }
        }

        groups.push(group);
    }

    // Calculate significance values for each subset
    let significances = calculate_subset_significances(&subsets, level_means, mse, df_error);

    // Create the final HomogeneousSubsets structure
    let result = HomogeneousSubsets {
        test_name: "Duncan".to_string(),
        groups,
        error_term: "Mean Square(Error)".to_string(),
        error_value: mse,
        uses_harmonic_mean: true,
        harmonic_mean_sample_size: Some(harmonic_mean),
        notes: vec![
            "Uses Harmonic Mean Sample Size = ".to_string() + &format!("{:.3}", harmonic_mean),
            "The group sizes are unequal. The harmonic mean of the group sizes is used. Type I error levels are not guaranteed.".to_string(),
            "Alpha = ".to_string() + &format!("{:.2}", alpha)
        ],
        alpha,
    };

    Ok(result)
}

/// Calculate Ryan-Einot-Gabriel-Welsch F subsets
fn calculate_regwf_subsets(
    factor: &str,
    level_means: &[(String, f64, usize)],
    mse: f64,
    df_error: usize,
    harmonic_mean: f64,
    alpha: f64
) -> Result<HomogeneousSubsets, String> {
    if level_means.is_empty() {
        return Err("No valid level means available".to_string());
    }

    // REGW F uses F distribution with different alpha levels
    let k = level_means.len();
    let mut range_msds = Vec::new();

    // Calculate critical values for each range
    for p in 2..=k {
        // REGW F uses a modified alpha based on the range
        let modified_alpha = alpha / (p as f64);

        // Critical F value
        let f_critical = f_critical_value(modified_alpha, p - 1, df_error);

        // Convert to a studentized range equivalent
        let q_equivalent = ((p as f64) * f_critical).sqrt();
        let msd = q_equivalent * (mse / harmonic_mean).sqrt();
        range_msds.push(msd);
    }

    // Create subsets using the REGW step-down procedure
    let subsets = create_snk_subsets(level_means, &range_msds, mse, harmonic_mean);

    // Format the results
    let mut groups = Vec::new();
    for (i, (level, mean, n)) in level_means.iter().enumerate() {
        let mut group = HomogeneousSubsetGroup {
            factor_name: factor.to_string(),
            factor_value: level.clone(),
            n: *n,
            subsets: HashMap::new(),
            significance: None,
        };

        // Determine which subsets this level belongs to
        for (subset_idx, subset) in subsets.iter().enumerate() {
            if subset.contains(&i) {
                group.subsets.insert(subset_idx + 1, *mean);
            }
        }

        groups.push(group);
    }

    // Calculate significance values for each subset
    let significances = calculate_subset_significances(&subsets, level_means, mse, df_error);

    // Create the final HomogeneousSubsets structure
    let result = HomogeneousSubsets {
        test_name: "R-E-G-W F".to_string(),
        groups,
        error_term: "Mean Square(Error)".to_string(),
        error_value: mse,
        uses_harmonic_mean: true,
        harmonic_mean_sample_size: Some(harmonic_mean),
        notes: vec![
            "Uses Harmonic Mean Sample Size = ".to_string() + &format!("{:.3}", harmonic_mean),
            "The group sizes are unequal. The harmonic mean of the group sizes is used. Type I error levels are not guaranteed.".to_string(),
            "Alpha = ".to_string() + &format!("{:.2}", alpha)
        ],
        alpha,
    };

    Ok(result)
}

/// Calculate Ryan-Einot-Gabriel-Welsch Q subsets
fn calculate_regwq_subsets(
    factor: &str,
    level_means: &[(String, f64, usize)],
    mse: f64,
    df_error: usize,
    harmonic_mean: f64,
    alpha: f64
) -> Result<HomogeneousSubsets, String> {
    if level_means.is_empty() {
        return Err("No valid level means available".to_string());
    }

    // REGW Q uses studentized range with different alpha levels
    let k = level_means.len();
    let mut range_msds = Vec::new();

    // Calculate critical values for each range
    for p in 2..=k {
        // REGW Q uses a modified alpha based on the range
        let modified_alpha = if p == k { alpha } else { alpha / (2.0 - (p as f64) / (k as f64)) };

        let q_critical = approximate_studentized_range(modified_alpha, p, df_error);
        let msd = q_critical * (mse / harmonic_mean).sqrt();
        range_msds.push(msd);
    }

    // Create subsets using the REGW step-down procedure
    let subsets = create_snk_subsets(level_means, &range_msds, mse, harmonic_mean);

    // Format the results
    let mut groups = Vec::new();
    for (i, (level, mean, n)) in level_means.iter().enumerate() {
        let mut group = HomogeneousSubsetGroup {
            factor_name: factor.to_string(),
            factor_value: level.clone(),
            n: *n,
            subsets: HashMap::new(),
            significance: None,
        };

        // Determine which subsets this level belongs to
        for (subset_idx, subset) in subsets.iter().enumerate() {
            if subset.contains(&i) {
                group.subsets.insert(subset_idx + 1, *mean);
            }
        }

        groups.push(group);
    }

    // Calculate significance values for each subset
    let significances = calculate_subset_significances(&subsets, level_means, mse, df_error);

    // Create the final HomogeneousSubsets structure
    let result = HomogeneousSubsets {
        test_name: "R-E-G-W Q".to_string(),
        groups,
        error_term: "Mean Square(Error)".to_string(),
        error_value: mse,
        uses_harmonic_mean: true,
        harmonic_mean_sample_size: Some(harmonic_mean),
        notes: vec![
            "Uses Harmonic Mean Sample Size = ".to_string() + &format!("{:.3}", harmonic_mean),
            "The group sizes are unequal. The harmonic mean of the group sizes is used. Type I error levels are not guaranteed.".to_string(),
            "Alpha = ".to_string() + &format!("{:.2}", alpha)
        ],
        alpha,
    };

    Ok(result)
}

/// Calculate Tukey's b homogeneous subsets
fn calculate_tukey_b_subsets(
    factor: &str,
    level_means: &[(String, f64, usize)],
    mse: f64,
    df_error: usize,
    harmonic_mean: f64,
    alpha: f64
) -> Result<HomogeneousSubsets, String> {
    if level_means.is_empty() {
        return Err("No valid level means available".to_string());
    }

    // Tukey's b is similar to SNK but uses Tukey's critical values
    let k = level_means.len();
    let mut range_msds = Vec::new();

    // Calculate critical values for each range
    for p in 2..=k {
        // Tukey's b uses the same critical value for all ranges (from the studentized range)
        let q_critical = approximate_studentized_range(alpha, k, df_error);
        let msd = q_critical * (mse / harmonic_mean).sqrt();
        range_msds.push(msd);
    }

    // Create subsets using the SNK step-down procedure
    let subsets = create_snk_subsets(level_means, &range_msds, mse, harmonic_mean);

    // Format the results
    let mut groups = Vec::new();
    for (i, (level, mean, n)) in level_means.iter().enumerate() {
        let mut group = HomogeneousSubsetGroup {
            factor_name: factor.to_string(),
            factor_value: level.clone(),
            n: *n,
            subsets: HashMap::new(),
            significance: None,
        };

        // Determine which subsets this level belongs to
        for (subset_idx, subset) in subsets.iter().enumerate() {
            if subset.contains(&i) {
                group.subsets.insert(subset_idx + 1, *mean);
            }
        }

        groups.push(group);
    }

    // Calculate significance values for each subset
    let significances = calculate_subset_significances(&subsets, level_means, mse, df_error);

    // Create the final HomogeneousSubsets structure
    let result = HomogeneousSubsets {
        test_name: "Tukey's b".to_string(),
        groups,
        error_term: "Mean Square(Error)".to_string(),
        error_value: mse,
        uses_harmonic_mean: true,
        harmonic_mean_sample_size: Some(harmonic_mean),
        notes: vec![
            "Uses Harmonic Mean Sample Size = ".to_string() + &format!("{:.3}", harmonic_mean),
            "The group sizes are unequal. The harmonic mean of the group sizes is used. Type I error levels are not guaranteed.".to_string(),
            "Alpha = ".to_string() + &format!("{:.2}", alpha)
        ],
        alpha,
    };

    Ok(result)
}

/// Calculate Waller-Duncan homogeneous subsets
fn calculate_waller_duncan_subsets(
    factor: &str,
    level_means: &[(String, f64, usize)],
    mse: f64,
    df_error: usize,
    harmonic_mean: f64,
    error_ratio: f64,
    alpha: f64
) -> Result<HomogeneousSubsets, String> {
    if level_means.is_empty() {
        return Err("No valid level means available".to_string());
    }

    // Waller-Duncan uses a Bayesian approach with k-ratio
    let k = level_means.len();

    // Calculate the critical value for Waller-Duncan
    // This requires the F distribution and error ratio (k-ratio)
    let f_value = f_critical_value(alpha / 2.0, 1, df_error);
    let waller_k = error_ratio * f_value.sqrt();

    // Convert to minimum significant difference
    let msd = waller_k * ((2.0 * mse) / harmonic_mean).sqrt();

    // Create subsets using the range test approach
    let subsets = create_homogeneous_subsets(level_means, msd);

    // Format the results
    let mut groups = Vec::new();
    for (i, (level, mean, n)) in level_means.iter().enumerate() {
        let mut group = HomogeneousSubsetGroup {
            factor_name: factor.to_string(),
            factor_value: level.clone(),
            n: *n,
            subsets: HashMap::new(),
            significance: None,
        };

        // Determine which subsets this level belongs to
        for (subset_idx, subset) in subsets.iter().enumerate() {
            if subset.contains(&i) {
                group.subsets.insert(subset_idx + 1, *mean);
            }
        }

        groups.push(group);
    }

    // Calculate significance values for each subset
    let significances = calculate_subset_significances(&subsets, level_means, mse, df_error);

    // Create the final HomogeneousSubsets structure
    let result = HomogeneousSubsets {
        test_name: "Waller-Duncan".to_string(),
        groups,
        error_term: "Mean Square(Error)".to_string(),
        error_value: mse,
        uses_harmonic_mean: true,
        harmonic_mean_sample_size: Some(harmonic_mean),
        notes: vec![
            "Uses Harmonic Mean Sample Size = ".to_string() + &format!("{:.3}", harmonic_mean),
            "The group sizes are unequal. The harmonic mean of the group sizes is used. Type I error levels are not guaranteed.".to_string(),
            "Error Ratio = Type I/Type II Error Ratio = ".to_string() +
                &format!("{:.1}", error_ratio)
        ],
        alpha,
    };

    Ok(result)
}

/// Approximate the studentized range critical value
/// This is a complex distribution not directly available in statrs
fn approximate_studentized_range(alpha: f64, k: usize, df: usize) -> f64 {
    // Use an approximation based on the relationship between
    // studentized range (q) and the t-distribution
    let p = 1.0 - alpha;

    // For k=2, q-distribution is related to t-distribution by q = t * sqrt(2)
    if k == 2 {
        return calculate_t_critical(df, alpha / 2.0) * (2.0_f64).sqrt();
    }

    // For k>2, we use an approximation based on Bonferroni
    // This is not exact, but provides a reasonable approximation
    // TODO: Implement a more accurate approximation method
    let bonferroni_alpha = alpha / (((k * (k - 1)) / 2) as f64);
    let t_crit = calculate_t_critical(df, bonferroni_alpha / 2.0);

    // Scale factor for approximating q from t
    let scale = 1.0 + 0.2 * ((k as f64) - 2.0).sqrt();

    t_crit * scale
}

/// Get critical F value for a given alpha and degrees of freedom
fn f_critical_value(alpha: f64, df1: usize, df2: usize) -> f64 {
    let p = 1.0 - alpha;

    // Try to use statrs if available
    match FisherSnedecor::new(df1 as f64, df2 as f64) {
        Ok(dist) => {
            // Use bisection method to approximate the critical value
            let mut low = 0.0;
            let mut high = 100.0;
            let tol = 1e-6;

            for _ in 0..50 {
                let mid = (low + high) / 2.0;
                match dist.cdf(mid) {
                    cdf => {
                        if (cdf - p).abs() < tol {
                            return mid;
                        }

                        if cdf < p {
                            low = mid;
                        } else {
                            high = mid;
                        }
                    }
                    _ => {
                        break;
                    }
                }
            }

            // Return an approximate value if the algorithm didn't converge
            (low + high) / 2.0
        }
        Err(_) => {
            // Fallback approximation when statrs fails
            match (df1, df2) {
                (1, _) if df2 >= 10 => {
                    // For df1=1, df2>=10, F is approximately t^2
                    let t_crit = calculate_t_critical(df2, alpha);
                    t_crit * t_crit
                }
                _ => {
                    // General approximation using chi-square relationship
                    // F_{alpha,df1,df2} ≈ (df2/df1) * (chi^2_{alpha,df1}/df2 / (1 - chi^2_{1-alpha,df2}/df1))
                    let chi2_alpha_df1 = chi2_critical_value(alpha, df1);
                    let chi2_1_alpha_df2 = chi2_critical_value(1.0 - alpha, df2);

                    (((df2 as f64) / (df1 as f64)) * (chi2_alpha_df1 / (df2 as f64))) /
                        (1.0 - chi2_1_alpha_df2 / (df1 as f64))
                }
            }
        }
    }
}

/// Get critical chi-square value for a given alpha and degrees of freedom
fn chi2_critical_value(alpha: f64, df: usize) -> f64 {
    let p = 1.0 - alpha;

    // Try to use statrs if available
    match ChiSquared::new(df as f64) {
        Ok(dist) => {
            // Use bisection method to approximate the critical value
            let mut low = 0.0;
            let mut high = 100.0;
            let tol = 1e-6;

            for _ in 0..50 {
                let mid = (low + high) / 2.0;
                match dist.cdf(mid) {
                    cdf => {
                        if (cdf - p).abs() < tol {
                            return mid;
                        }

                        if cdf < p {
                            low = mid;
                        } else {
                            high = mid;
                        }
                    }
                    _ => {
                        break;
                    }
                }
            }

            // Return an approximate value if the algorithm didn't converge
            (low + high) / 2.0
        }
        Err(_) => {
            // Fallback approximation when statrs fails
            // Use a normal approximation for large df
            if df > 30 {
                let z = calculate_z_critical(alpha);
                (df as f64) *
                    (1.0 - 2.0 / (9.0 * (df as f64)) + z * (2.0 / (9.0 * (df as f64))).sqrt()).powi(
                        3
                    )
            } else {
                // Rough approximation for smaller df
                (df as f64) + 2.0 * (alpha.ln() / -2.0).sqrt()
            }
        }
    }
}

/// Calculate Z critical value for a given alpha
fn calculate_z_critical(alpha: f64) -> f64 {
    // Approximation using polynomial method for standard normal distribution
    // This is an alternative to using the Normal distribution which might not be available

    let p = 1.0 - alpha;

    if p <= 0.0 || p >= 1.0 {
        return 0.0;
    }

    let q = if p > 0.5 { 1.0 - p } else { p };

    // Coefficients for the approximation
    let a = [2.515517, 0.802853, 0.010328];
    let b = [1.0, 1.432788, 0.189269, 0.001308];

    // Calculate t
    let t = (-2.0 * q.ln()).sqrt();

    // Calculate z using the polynomial approximation
    let z =
        t -
        (a[0] + a[1] * t + a[2] * t.powi(2)) /
            (b[0] + b[1] * t + b[2] * t.powi(2) + b[3] * t.powi(3));

    if p > 0.5 {
        -z
    } else {
        z
    }
}

/// Create homogeneous subsets using a range test approach
fn create_homogeneous_subsets(level_means: &[(String, f64, usize)], msd: f64) -> Vec<Vec<usize>> {
    let k = level_means.len();

    // Initialize with each group in its own subset
    let mut subsets = Vec::new();
    let mut current_subset = Vec::new();

    // Start with the first mean
    current_subset.push(0);

    // Compare each mean with the previous ones
    for i in 1..k {
        let current_mean = level_means[i].1;

        // Check if current mean can be included in the current subset
        let can_join = current_subset.iter().all(|&j| {
            let mean_diff = (current_mean - level_means[j].1).abs();
            mean_diff <= msd
        });

        if can_join {
            // Add to current subset
            current_subset.push(i);
        } else {
            // Start a new subset
            if !current_subset.is_empty() {
                subsets.push(current_subset);
            }
            current_subset = vec![i];
        }
    }

    // Add the last subset if not empty
    if !current_subset.is_empty() {
        subsets.push(current_subset);
    }

    // Optimization: merge overlapping subsets
    let mut optimized_subsets: Vec<Vec<usize>> = Vec::new();
    for i in 0..subsets.len() {
        let mut merged = false;

        // Try to merge with existing optimized subsets
        for opt_subset in &mut optimized_subsets {
            // Check if they share any elements
            let has_common = subsets[i].iter().any(|&item| opt_subset.contains(&item));

            if has_common {
                // Merge the subsets
                for &item in &subsets[i] {
                    if !opt_subset.contains(&item) {
                        opt_subset.push(item);
                    }
                }
                merged = true;
                break;
            }
        }

        if !merged {
            // Add as a new subset
            optimized_subsets.push(subsets[i].clone());
        }
    }

    optimized_subsets
}

/// Create homogeneous subsets using the SNK step-down procedure
fn create_snk_subsets(
    level_means: &[(String, f64, usize)],
    range_msds: &[f64],
    mse: f64,
    harmonic_mean: f64
) -> Vec<Vec<usize>> {
    let k = level_means.len();

    // Initialize connectivity matrix (which means are not significantly different)
    let mut connected = vec![vec![false; k]; k];

    // Fill connectivity matrix
    for i in 0..k {
        connected[i][i] = true; // A mean is always connected to itself

        for j in i + 1..k {
            let diff = (level_means[j].1 - level_means[i].1).abs();
            let range = j - i + 1;

            // Get the appropriate critical difference for this range
            let critical_diff = if range <= range_msds.len() {
                range_msds[range - 2] // Range 2 is at index 0
            } else {
                // Use the largest range if beyond the calculated ranges
                *range_msds.last().unwrap_or(&0.0)
            };

            if diff <= critical_diff {
                connected[i][j] = true;
                connected[j][i] = true;
            }
        }
    }

    // Find connected components (subsets) using depth-first search
    let mut visited = vec![false; k];
    let mut subsets = Vec::new();

    for i in 0..k {
        if !visited[i] {
            let mut subset = Vec::new();
            let mut stack = vec![i];

            while let Some(node) = stack.pop() {
                if !visited[node] {
                    visited[node] = true;
                    subset.push(node);

                    // Add connected nodes to the stack
                    for j in 0..k {
                        if connected[node][j] && !visited[j] {
                            stack.push(j);
                        }
                    }
                }
            }

            subset.sort(); // Sort for consistency
            subsets.push(subset);
        }
    }

    subsets
}

/// Calculate significance values for subsets
fn calculate_subset_significances(
    subsets: &[Vec<usize>],
    level_means: &[(String, f64, usize)],
    mse: f64,
    df_error: usize
) -> Vec<f64> {
    let mut significances = Vec::new();

    for subset in subsets {
        if subset.len() <= 1 {
            // A subset with one element has no variability to test
            significances.push(1.0);
            continue;
        }

        // Calculate the variance within this subset
        let subset_means: Vec<f64> = subset
            .iter()
            .map(|&idx| level_means[idx].1)
            .collect();

        let subset_mean = calculate_mean(&subset_means);
        let subset_variance =
            subset_means
                .iter()
                .map(|&mean| (mean - subset_mean).powi(2))
                .sum::<f64>() / ((subset_means.len() - 1) as f64);

        // Calculate F-ratio
        let f_ratio = subset_variance / mse;

        // Calculate significance
        let significance = calculate_f_significance(subset.len() - 1, df_error, f_ratio);
        significances.push(significance);
    }

    significances
}
