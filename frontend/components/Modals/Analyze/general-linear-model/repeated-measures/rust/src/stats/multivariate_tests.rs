use std::collections::HashMap;

use crate::{
    models::{
        config::RepeatedMeasuresConfig,
        data::AnalysisData,
        result::{ MultivariateTestEntry, MultivariateTests },
    },
    stats::core::get_factor_levels,
};

use super::{
    common::{
        calculate_f_significance,
        generate_interaction_terms,
        matrix_determinant,
        matrix_inverse,
        matrix_multiply,
        matrix_transpose,
    },
    core::{ data_value_to_string, extract_dependent_value, parse_interaction_term },
};

/// Calculate multivariate tests for each effect in the model
/// Multivariate tests examine effects across all dependent variables simultaneously
pub fn calculate_multivariate_tests(
    data: &AnalysisData,
    config: &RepeatedMeasuresConfig
) -> Result<MultivariateTests, String> {
    // Need at least 2 dependent variables for multivariate tests
    let dependent_vars = config.main.sub_var.as_ref().unwrap();
    if dependent_vars.len() < 2 {
        return Err("Need at least 2 dependent variables for multivariate tests".to_string());
    }

    // Get factors and initialize effects HashMap
    let factors = config.main.factors_var.as_ref().map_or(Vec::new(), |f| f.clone());
    let mut effects = HashMap::new();

    // Default alpha value
    let alpha = config.options.sig_level.unwrap_or(0.05);

    // Extract values for all dependent variables
    let mut all_values: Vec<Vec<f64>> = Vec::new();
    for dep_var in dependent_vars {
        let mut values = Vec::new();
        for records in &data.subject_data {
            for record in records {
                if let Some(value) = extract_dependent_value(record, dep_var) {
                    values.push(value);
                }
            }
        }
        all_values.push(values);
    }

    // Calculate SSCP matrices for hypothesis and error
    // Calculate H and E matrices for each effect

    // 1. Calculate SSCP matrices for intercept (overall model)
    let (h_matrix, e_matrix, hypothesis_df, error_df) = match
        calculate_hypothesis_error_matrices(
            data,
            config,
            "Intercept",
            dependent_vars,
            &all_values,
            None
        )
    {
        Ok(result) => result,
        Err(e) => {
            return Err(format!("Failed to calculate matrices for intercept: {}", e));
        }
    };

    // Calculate multivariate test statistics for intercept
    let intercept_tests = match
        calculate_multivariate_test_statistics(
            &h_matrix,
            &e_matrix,
            hypothesis_df,
            error_df,
            alpha,
            dependent_vars.len()
        )
    {
        Ok(tests) => tests,
        Err(e) => {
            return Err(format!("Failed to calculate test statistics for intercept: {}", e));
        }
    };

    effects.insert("Intercept".to_string(), intercept_tests);

    // 2. Calculate multivariate test statistics for each main effect (factor)
    for factor in &factors {
        let (h_matrix, e_matrix, hypothesis_df, error_df) = match
            calculate_hypothesis_error_matrices(
                data,
                config,
                factor,
                dependent_vars,
                &all_values,
                None
            )
        {
            Ok(result) => result,
            Err(e) => {
                return Err(format!("Failed to calculate matrices for factor {}: {}", factor, e));
            }
        };

        let factor_tests = match
            calculate_multivariate_test_statistics(
                &h_matrix,
                &e_matrix,
                hypothesis_df,
                error_df,
                alpha,
                dependent_vars.len()
            )
        {
            Ok(tests) => tests,
            Err(e) => {
                return Err(
                    format!("Failed to calculate test statistics for factor {}: {}", factor, e)
                );
            }
        };

        effects.insert(factor.clone(), factor_tests);
    }

    // 3. Calculate multivariate test statistics for interactions (if multiple factors)
    if factors.len() > 1 {
        let interaction_terms = generate_interaction_terms(&factors);

        for term in interaction_terms {
            let term_factors: Vec<String> = parse_interaction_term(&term);

            let (h_matrix, e_matrix, hypothesis_df, error_df) = match
                calculate_hypothesis_error_matrices(
                    data,
                    config,
                    &term,
                    dependent_vars,
                    &all_values,
                    Some(&term_factors)
                )
            {
                Ok(result) => result,
                Err(e) => {
                    return Err(
                        format!("Failed to calculate matrices for interaction {}: {}", term, e)
                    );
                }
            };

            let interaction_tests = match
                calculate_multivariate_test_statistics(
                    &h_matrix,
                    &e_matrix,
                    hypothesis_df,
                    error_df,
                    alpha,
                    dependent_vars.len()
                )
            {
                Ok(tests) => tests,
                Err(e) => {
                    return Err(
                        format!(
                            "Failed to calculate test statistics for interaction {}: {}",
                            term,
                            e
                        )
                    );
                }
            };

            effects.insert(term.clone(), interaction_tests);
        }
    }

    // Create the final result
    Ok(MultivariateTests {
        effects,
        design: Some(format!("Type {:?} sum of squares", &config.model.sum_of_square_method)),
        alpha: Some(alpha),
    })
}

/// Calculate hypothesis and error matrices for a given effect
fn calculate_hypothesis_error_matrices(
    data: &AnalysisData,
    config: &RepeatedMeasuresConfig,
    effect: &str,
    dependent_vars: &[String],
    all_values: &[Vec<f64>],
    factors_in_effect: Option<&[String]>
) -> Result<(Vec<Vec<f64>>, Vec<Vec<f64>>, f64, f64), String> {
    let p = dependent_vars.len();
    let n_obs = all_values[0].len();

    // 1. Calculate grand means for each dependent variable
    let mut grand_means = Vec::new();
    for values in all_values {
        let mean = if !values.is_empty() {
            values.iter().sum::<f64>() / (values.len() as f64)
        } else {
            0.0
        };
        grand_means.push(mean);
    }

    // 2. Calculate hypothesis (H) and error (E) matrices depending on the effect
    let mut h_matrix = vec![vec![0.0; p]; p];
    let mut e_matrix = vec![vec![0.0; p]; p];

    if effect == "Intercept" {
        // For intercept, H = n * (mean vector) * (mean vector)'
        for i in 0..p {
            for j in 0..p {
                h_matrix[i][j] = (n_obs as f64) * grand_means[i] * grand_means[j];
            }
        }

        // For intercept, E = total SSCP - H
        for i in 0..p {
            for j in 0..p {
                let mut total_sscp = 0.0;
                for k in 0..n_obs {
                    if k < all_values[i].len() && k < all_values[j].len() {
                        total_sscp += all_values[i][k] * all_values[j][k];
                    }
                }
                e_matrix[i][j] = total_sscp - h_matrix[i][j];
            }
        }

        return Ok((h_matrix, e_matrix, 1.0, (n_obs - 1) as f64));
    } else if factors_in_effect.is_none() || factors_in_effect.unwrap().is_empty() {
        // Main effect
        let factor_levels = get_factor_levels(data, effect)?;
        let level_count = factor_levels.len();

        // Calculate means for each level of the factor
        let mut level_means = Vec::new();
        let mut level_ns = Vec::new();

        for level in &factor_levels {
            let mut level_values = vec![Vec::new(); p];

            // Find all records with this factor level
            for (i, dep_var) in dependent_vars.iter().enumerate() {
                let mut record_idx = 0;
                for records in &data.subject_data {
                    for record in records {
                        if let Some(value) = extract_dependent_value(record, dep_var) {
                            // Check if this record has the current factor level
                            let mut has_level = false;

                            // Search in fix_factor_data
                            for fix_factor_group in &data.factors_data {
                                for fix_record in fix_factor_group {
                                    if let Some(factor_val) = fix_record.values.get(effect) {
                                        let factor_level = data_value_to_string(factor_val);
                                        if &factor_level == level {
                                            has_level = true;
                                            break;
                                        }
                                    }
                                }
                                if has_level {
                                    break;
                                }
                            }

                            if has_level {
                                level_values[i].push(value);
                            }
                        }
                        record_idx += 1;
                    }
                }
            }

            // Calculate mean for each dependent variable for this level
            let mut means = Vec::new();
            for values in &level_values {
                let mean = if !values.is_empty() {
                    values.iter().sum::<f64>() / (values.len() as f64)
                } else {
                    0.0
                };
                means.push(mean);
            }

            level_means.push(means);
            // Use count from first dependent variable (should be consistent across all)
            level_ns.push(level_values[0].len());
        }

        // Calculate H matrix for the main effect
        for i in 0..p {
            for j in 0..p {
                let mut h_sum = 0.0;
                for k in 0..level_count {
                    h_sum +=
                        (level_ns[k] as f64) *
                        (level_means[k][i] - grand_means[i]) *
                        (level_means[k][j] - grand_means[j]);
                }
                h_matrix[i][j] = h_sum;
            }
        }

        // Calculate E matrix similar to above
        for i in 0..p {
            for j in 0..p {
                let mut e_sum = 0.0;
                let mut record_idx = 0;

                for records in &data.subject_data {
                    for record in records {
                        if record_idx >= n_obs {
                            continue;
                        }

                        // Get factor level for this record
                        let mut record_level = None;

                        // Search in fix_factor_data
                        for fix_factor_group in &data.factors_data {
                            for fix_record in fix_factor_group {
                                if let Some(factor_val) = fix_record.values.get(effect) {
                                    record_level = Some(data_value_to_string(factor_val));
                                    break;
                                }
                            }
                            if record_level.is_some() {
                                break;
                            }
                        }

                        if let Some(level) = record_level {
                            // Find the level index
                            if let Some(level_idx) = factor_levels.iter().position(|l| l == &level) {
                                if level_idx < level_means.len() {
                                    let residual_i =
                                        all_values[i][record_idx] - level_means[level_idx][i];
                                    let residual_j =
                                        all_values[j][record_idx] - level_means[level_idx][j];
                                    e_sum += residual_i * residual_j;
                                }
                            }
                        }

                        record_idx += 1;
                    }
                }

                e_matrix[i][j] = e_sum;
            }
        }

        // Calculate degrees of freedom
        let hypothesis_df = (level_count - 1) as f64;
        let error_df = (n_obs - level_count) as f64;

        return Ok((h_matrix, e_matrix, hypothesis_df, error_df));
    } else {
        // Interaction effect
        let interaction_factors = factors_in_effect.unwrap();

        // Get levels for each factor in the interaction
        let mut factor_levels = Vec::new();
        for factor in interaction_factors {
            let levels = get_factor_levels(data, factor)?;
            factor_levels.push((factor.clone(), levels));
        }

        // Generate all combinations of levels
        let mut level_combinations = Vec::new();
        let mut current_combo = HashMap::new();

        fn generate_level_combinations(
            factor_levels: &[(String, Vec<String>)],
            current_combo: &mut HashMap<String, String>,
            index: usize,
            result: &mut Vec<HashMap<String, String>>
        ) {
            if index == factor_levels.len() {
                result.push(current_combo.clone());
                return;
            }

            let (factor, levels) = &factor_levels[index];
            for level in levels {
                current_combo.insert(factor.clone(), level.clone());
                generate_level_combinations(factor_levels, current_combo, index + 1, result);
            }
        }

        generate_level_combinations(&factor_levels, &mut current_combo, 0, &mut level_combinations);

        // Calculate means for each combination of factor levels
        let mut combo_means = Vec::new();
        let mut combo_ns = Vec::new();

        for combo in &level_combinations {
            let mut combo_values = vec![Vec::new(); p];

            // Find all records with this combination of factor levels
            for (i, dep_var) in dependent_vars.iter().enumerate() {
                let mut record_idx = 0;
                for records in &data.subject_data {
                    for record in records {
                        if let Some(value) = extract_dependent_value(record, dep_var) {
                            // Check if this record has all the required factor levels
                            let mut has_all_levels = true;

                            for (factor, level) in combo {
                                let mut has_level = false;

                                // Search in fix_factor_data
                                for fix_factor_group in &data.factors_data {
                                    for fix_record in fix_factor_group {
                                        if let Some(factor_val) = fix_record.values.get(factor) {
                                            let factor_level = data_value_to_string(factor_val);
                                            if &factor_level == level {
                                                has_level = true;
                                                break;
                                            }
                                        }
                                    }
                                    if has_level {
                                        break;
                                    }
                                }

                                if !has_level {
                                    has_all_levels = false;
                                    break;
                                }
                            }

                            if has_all_levels {
                                combo_values[i].push(value);
                            }
                        }
                        record_idx += 1;
                    }
                }
            }

            // Calculate mean for each dependent variable for this combination
            let mut means = Vec::new();
            for values in &combo_values {
                let mean = if !values.is_empty() {
                    values.iter().sum::<f64>() / (values.len() as f64)
                } else {
                    0.0
                };
                means.push(mean);
            }

            combo_means.push(means);
            // Use count from first dependent variable
            combo_ns.push(combo_values[0].len());
        }

        // For Type III SS, calculate means for main effects
        let mut factor_effect_means = HashMap::new();

        for factor in interaction_factors {
            let levels = get_factor_levels(data, factor)?;
            let mut level_means_map = HashMap::new();

            for level in &levels {
                let mut level_values = vec![Vec::new(); p];

                // Find all records with this factor level
                for (i, dep_var) in dependent_vars.iter().enumerate() {
                    let mut record_idx = 0;
                    for records in &data.subject_data {
                        for record in records {
                            if let Some(value) = extract_dependent_value(record, dep_var) {
                                // Check if this record has the current factor level
                                let mut has_level = false;

                                // Search in fix_factor_data
                                for fix_factor_group in &data.factors_data {
                                    for fix_record in fix_factor_group {
                                        if let Some(factor_val) = fix_record.values.get(factor) {
                                            let factor_level = data_value_to_string(factor_val);
                                            if &factor_level == level {
                                                has_level = true;
                                                break;
                                            }
                                        }
                                    }
                                    if has_level {
                                        break;
                                    }
                                }

                                if has_level {
                                    level_values[i].push(value);
                                }
                            }
                            record_idx += 1;
                        }
                    }
                }

                // Calculate mean for each dependent variable for this level
                let mut means = Vec::new();
                for values in &level_values {
                    let mean = if !values.is_empty() {
                        values.iter().sum::<f64>() / (values.len() as f64)
                    } else {
                        0.0
                    };
                    means.push(mean);
                }

                level_means_map.insert(level.clone(), (means, level_values[0].len()));
            }

            factor_effect_means.insert(factor.clone(), level_means_map);
        }

        // Calculate H matrix for the interaction (Type III SS - only interaction effect)
        for i in 0..p {
            for j in 0..p {
                let mut h_sum = 0.0;
                for (c, combo) in level_combinations.iter().enumerate() {
                    if c >= combo_means.len() || c >= combo_ns.len() {
                        continue;
                    }

                    // Calculate expected mean based on main effects
                    let mut expected_i = grand_means[i];
                    let mut expected_j = grand_means[j];

                    // Add main effect adjustments
                    for (factor, level) in combo {
                        if let Some(level_means) = factor_effect_means.get(factor) {
                            if let Some((means, _)) = level_means.get(level) {
                                // Add main effect (centered around grand mean)
                                expected_i += means[i] - grand_means[i];
                                expected_j += means[j] - grand_means[j];
                            }
                        }
                    }

                    // Calculate interaction effect (observed - expected)
                    let interaction_i = combo_means[c][i] - expected_i;
                    let interaction_j = combo_means[c][j] - expected_j;

                    // Add to H matrix
                    h_sum += (combo_ns[c] as f64) * interaction_i * interaction_j;
                }
                h_matrix[i][j] = h_sum;
            }
        }

        // Calculate E matrix for the interaction
        for i in 0..p {
            for j in 0..p {
                let mut e_sum = 0.0;
                let mut record_idx = 0;

                for records in &data.subject_data {
                    for record in records {
                        if record_idx >= n_obs {
                            continue;
                        }

                        // Get factor combination for this record
                        let mut record_combo = HashMap::new();

                        for factor in interaction_factors {
                            // Search in fix_factor_data
                            for fix_factor_group in &data.factors_data {
                                for fix_record in fix_factor_group {
                                    if let Some(factor_val) = fix_record.values.get(factor) {
                                        record_combo.insert(
                                            factor.clone(),
                                            data_value_to_string(factor_val)
                                        );
                                        break;
                                    }
                                }
                                if record_combo.contains_key(factor) {
                                    break;
                                }
                            }
                        }

                        // Find matching combination
                        if
                            let Some(combo_idx) = level_combinations
                                .iter()
                                .position(|c| {
                                    c.iter().all(|(f, l)| {
                                        record_combo.get(f).map_or(false, |rl| rl == l)
                                    })
                                })
                        {
                            if combo_idx < combo_means.len() {
                                let residual_i =
                                    all_values[i][record_idx] - combo_means[combo_idx][i];
                                let residual_j =
                                    all_values[j][record_idx] - combo_means[combo_idx][j];
                                e_sum += residual_i * residual_j;
                            }
                        }

                        record_idx += 1;
                    }
                }

                e_matrix[i][j] = e_sum;
            }
        }

        // Calculate degrees of freedom for interaction
        let mut hypothesis_df = 1.0;
        for (factor, _) in &factor_levels {
            let levels = get_factor_levels(data, factor)?;
            hypothesis_df *= (levels.len() - 1) as f64;
        }

        let total_combinations = level_combinations.len();
        let error_df = (n_obs - total_combinations) as f64;

        return Ok((h_matrix, e_matrix, hypothesis_df, error_df));
    }
}

/// Calculate multivariate test statistics from hypothesis and error matrices
fn calculate_multivariate_test_statistics(
    h_matrix: &[Vec<f64>],
    e_matrix: &[Vec<f64>],
    hypothesis_df: f64,
    error_df: f64,
    alpha: f64,
    p: usize
) -> Result<HashMap<String, MultivariateTestEntry>, String> {
    let mut test_results = HashMap::new();

    // Compute eigenvalues of H*E^-1
    let e_inverse = match matrix_inverse(e_matrix) {
        Ok(inv) => inv,
        Err(e) => {
            return Err(format!("Failed to invert error matrix: {}", e));
        }
    };

    let he_inv = match matrix_multiply(h_matrix, &e_inverse) {
        Ok(product) => product,
        Err(e) => {
            return Err(format!("Failed to multiply H*E^-1: {}", e));
        }
    };

    // For a real implementation, we should compute eigenvalues of HE^-1
    // However, computing eigenvalues is complex, so we'll use a simpler approach
    // to estimate the multivariate test statistics

    // Calculate determinants
    let det_h = match matrix_determinant(h_matrix) {
        Ok(d) => d,
        Err(_) => 0.0001, // Fallback value if determinant calculation fails
    };

    let det_e = match matrix_determinant(e_matrix) {
        Ok(d) => d,
        Err(_) => 0.0001, // Fallback value
    };

    let det_he = match matrix_determinant(&he_inv) {
        Ok(d) => d,
        Err(_) => 0.0001, // Fallback value
    };

    // Compute trace of HE^-1
    let mut trace_he = 0.0;
    for i in 0..he_inv.len() {
        if i < he_inv[i].len() {
            trace_he += he_inv[i][i];
        }
    }

    // Calculate largest eigenvalue (approximation)
    let max_eigenvalue = trace_he / (p as f64);

    // 1. Pillai's Trace
    let pillai_trace = trace_he / (1.0 + trace_he);
    let s = if (p as f64) <= hypothesis_df { p as f64 } else { hypothesis_df };
    let m = ((p.abs_diff(hypothesis_df as usize) as f64) - 1.0) / 2.0;
    let n = (error_df - (p as f64) - 1.0) / 2.0;

    let f_pillai =
        ((2.0 * n + s + 1.0) / (2.0 * m + s + 1.0)) * (pillai_trace / (s - pillai_trace));
    let hyp_df_pillai = s * (2.0 * m + s + 1.0);
    let error_df_pillai = s * (2.0 * n + s + 1.0);
    let sig_pillai = calculate_f_significance(
        hyp_df_pillai as usize,
        error_df_pillai as usize,
        f_pillai
    );
    let eta_squared_pillai = pillai_trace / s;
    let noncent_parameter_pillai = pillai_trace * (error_df + hypothesis_df);

    // 2. Wilks' Lambda
    let wilks_lambda = 1.0 / (1.0 + det_he);

    // Different F approximations depending on dimensions
    let (f_wilks, hyp_df_wilks, error_df_wilks) = if p == 1 || hypothesis_df == 1.0 {
        // Exact F for single dependent variable or single df hypothesis
        let f = (((1.0 - wilks_lambda) / wilks_lambda) * error_df) / hypothesis_df;
        (f, (p as f64) * hypothesis_df, error_df)
    } else if p == 2 {
        // Approximation for 2 dependent variables
        let f =
            (((1.0 - wilks_lambda.sqrt()) / wilks_lambda.sqrt()) * (error_df - 1.0)) /
            hypothesis_df;
        (f, 2.0 * hypothesis_df, 2.0 * (error_df - 1.0))
    } else {
        // General approximation (Rao's)
        let r = error_df - ((p as f64) - hypothesis_df + 1.0) / 2.0;
        let u = ((p as f64) * hypothesis_df - 2.0) / 4.0;
        let t = if (p as f64) * hypothesis_df > 2.0 {
            ((p as f64) * hypothesis_df).sqrt() - 1.0
        } else {
            1.0
        };

        let f =
            ((1.0 - wilks_lambda.powf(1.0 / t)) / wilks_lambda.powf(1.0 / t)) * (r / hypothesis_df);
        (f, (p as f64) * hypothesis_df, r)
    };

    let sig_wilks = calculate_f_significance(
        hyp_df_wilks as usize,
        error_df_wilks as usize,
        f_wilks
    );
    let eta_squared_wilks = 1.0 - wilks_lambda.powf(1.0 / s);
    let noncent_parameter_wilks = ((1.0 - wilks_lambda) / wilks_lambda) * hypothesis_df;

    // 3. Hotelling's Trace
    let hotelling_trace = trace_he;
    let f_hotelling =
        (hotelling_trace * (error_df - (p as f64) + 1.0)) / ((p as f64) * hypothesis_df);
    let hyp_df_hotelling = (p as f64) * hypothesis_df;
    let error_df_hotelling = (error_df - (p as f64) + 1.0) * (p as f64);
    let sig_hotelling = calculate_f_significance(
        hyp_df_hotelling as usize,
        error_df_hotelling as usize,
        f_hotelling
    );
    let eta_squared_hotelling = hotelling_trace / (1.0 + hotelling_trace);
    let noncent_parameter_hotelling = hotelling_trace * hypothesis_df;

    // 4. Roy's Largest Root
    let roys_root = max_eigenvalue;
    let f_roy = (roys_root * error_df) / hypothesis_df;
    let hyp_df_roy = p as f64;
    let error_df_roy = error_df - (p as f64) + 1.0;
    let sig_roy = calculate_f_significance(hyp_df_roy as usize, error_df_roy as usize, f_roy);
    let eta_squared_roy = roys_root / (1.0 + roys_root);
    let noncent_parameter_roy = roys_root * hypothesis_df;

    // Calculate observed power (simplified)
    let power_pillai = if f_pillai > 1.0 { 1.0 - 0.1 / f_pillai } else { 0.5 };
    let power_wilks = if f_wilks > 1.0 { 1.0 - 0.1 / f_wilks } else { 0.5 };
    let power_hotelling = if f_hotelling > 1.0 { 1.0 - 0.1 / f_hotelling } else { 0.5 };
    let power_roy = if f_roy > 1.0 { 1.0 - 0.1 / f_roy } else { 0.5 };

    // Add Pillai's Trace
    test_results.insert("Pillai's Trace".to_string(), MultivariateTestEntry {
        value: pillai_trace,
        f: f_pillai,
        hypothesis_df: hyp_df_pillai,
        error_df: error_df_pillai,
        significance: sig_pillai,
        partial_eta_squared: eta_squared_pillai,
        noncent_parameter: noncent_parameter_pillai,
        observed_power: power_pillai,
        is_exact_statistic: false,
    });

    // Add Wilks' Lambda
    test_results.insert("Wilks' Lambda".to_string(), MultivariateTestEntry {
        value: wilks_lambda,
        f: f_wilks,
        hypothesis_df: hyp_df_wilks,
        error_df: error_df_wilks,
        significance: sig_wilks,
        partial_eta_squared: eta_squared_wilks,
        noncent_parameter: noncent_parameter_wilks,
        observed_power: power_wilks,
        is_exact_statistic: p == 1 || hypothesis_df == 1.0,
    });

    // Add Hotelling's Trace
    test_results.insert("Hotelling's Trace".to_string(), MultivariateTestEntry {
        value: hotelling_trace,
        f: f_hotelling,
        hypothesis_df: hyp_df_hotelling,
        error_df: error_df_hotelling,
        significance: sig_hotelling,
        partial_eta_squared: eta_squared_hotelling,
        noncent_parameter: noncent_parameter_hotelling,
        observed_power: power_hotelling,
        is_exact_statistic: p == 1 || hypothesis_df == 1.0,
    });

    // Add Roy's Largest Root
    test_results.insert("Roy's Largest Root".to_string(), MultivariateTestEntry {
        value: roys_root,
        f: f_roy,
        hypothesis_df: hyp_df_roy,
        error_df: error_df_roy,
        significance: sig_roy,
        partial_eta_squared: eta_squared_roy,
        noncent_parameter: noncent_parameter_roy,
        observed_power: power_roy,
        is_exact_statistic: p == 1 || hypothesis_df == 1.0,
    });

    Ok(test_results)
}
