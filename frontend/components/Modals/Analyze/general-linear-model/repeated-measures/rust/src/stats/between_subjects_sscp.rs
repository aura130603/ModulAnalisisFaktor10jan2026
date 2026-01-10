use std::collections::HashMap;

use crate::models::{
    config::RepeatedMeasuresConfig,
    data::AnalysisData,
    result::{ BetweenSubjectsSSCP, BetweenSSCPMatrix },
};

use super::common::{
    build_design_matrix_and_response,
    extract_dependent_value,
    get_factor_combinations,
    get_factor_levels,
    generate_interaction_terms,
    matrix_multiply,
    matrix_transpose,
    parse_interaction_term,
    data_value_to_string,
};

/// Calculate the between-subjects SSCP matrices for all effects
pub fn calculate_between_subjects_sscp(
    data: &AnalysisData,
    config: &RepeatedMeasuresConfig
) -> Result<BetweenSubjectsSSCP, String> {
    // Initialize the matrices HashMap
    let mut matrices = HashMap::new();

    // Get the list of dependent variables
    let dependent_vars = config.main.sub_var.as_ref().unwrap();

    // Get the list of factors (if any)
    let factors = config.main.factors_var.as_ref().map_or(Vec::new(), |f| f.clone());

    // Extract all values for each dependent variable
    let mut all_dep_values: Vec<Vec<f64>> = Vec::new();
    let mut all_records: Vec<Vec<usize>> = Vec::new(); // Track record indices for each dependent var

    for sub_var in dependent_vars {
        let mut values = Vec::new();
        let mut record_indices = Vec::new();
        let mut record_idx = 0;

        for records in &data.subject_data {
            for record in records {
                if let Some(value) = extract_dependent_value(record, sub_var) {
                    values.push(value);
                    record_indices.push(record_idx);
                }
                record_idx += 1;
            }
        }

        all_dep_values.push(values);
        all_records.push(record_indices);
    }

    // Calculate hypothesis and error SSCP matrices for each effect

    // 1. First, calculate the Hypothesis SSCP matrix for the intercept (Model)
    let mut model_sscp = HashMap::new();

    // Calculate means for each dependent variable
    let mut grand_means = Vec::new();
    for values in &all_dep_values {
        let mean = if !values.is_empty() {
            values.iter().sum::<f64>() / (values.len() as f64)
        } else {
            0.0
        };
        grand_means.push(mean);
    }

    // Calculate hypothesis SSCP matrix for intercept (Model)
    let n = all_dep_values[0].len() as f64; // Assuming same number of values for all dep vars

    for (i, var1) in dependent_vars.iter().enumerate() {
        let mut row_values = HashMap::new();
        for (j, var2) in dependent_vars.iter().enumerate() {
            let sscp_h = n * grand_means[i] * grand_means[j];
            row_values.insert(var2.clone(), sscp_h);
        }
        model_sscp.insert(var1.clone(), row_values);
    }

    // Add intercept/model SSCP matrix
    matrices.insert("Intercept".to_string(), BetweenSSCPMatrix { values: model_sscp });

    // 2. Calculate SSCP matrices for each main effect
    for factor in &factors {
        let mut factor_sscp = HashMap::new();

        // Get levels for this factor
        let levels = get_factor_levels(data, factor)?;

        // Calculate means for each level and dependent variable
        let mut level_means: Vec<Vec<f64>> = Vec::new();
        let mut level_counts: Vec<usize> = Vec::new();

        for level in &levels {
            let mut level_values: Vec<Vec<f64>> = vec![Vec::new(); dependent_vars.len()];

            // Get values for each dependent variable for this level
            for (dep_idx, sub_var) in dependent_vars.iter().enumerate() {
                // Get all records with this factor level
                for rec_idx in &all_records[dep_idx] {
                    let mut found_level = false;

                    // Search in factors_var_data for this factor's value
                    for factors_var_group in &data.factors_data {
                        for fix_record in factors_var_group {
                            if let Some(value) = fix_record.values.get(factor) {
                                let factor_level = data_value_to_string(value);
                                if &factor_level == level {
                                    found_level = true;
                                    if *rec_idx < all_dep_values[dep_idx].len() {
                                        level_values[dep_idx].push(
                                            all_dep_values[dep_idx][*rec_idx]
                                        );
                                    }
                                    break;
                                }
                            }
                        }
                        if found_level {
                            break;
                        }
                    }
                }
            }

            // Calculate means for this level
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

            // Use the count from the first dependent variable (should be the same for all)
            level_counts.push(level_values[0].len());
        }

        // Calculate hypothesis SSCP for this factor
        for (i, var1) in dependent_vars.iter().enumerate() {
            let mut row_values = HashMap::new();
            for (j, var2) in dependent_vars.iter().enumerate() {
                let mut sscp_h = 0.0;

                // Sum over all levels
                for k in 0..levels.len() {
                    // For each level, add (mean_level - mean_total)^2 * n_level
                    sscp_h +=
                        (level_means[k][i] - grand_means[i]) *
                        (level_means[k][j] - grand_means[j]) *
                        (level_counts[k] as f64);
                }

                row_values.insert(var2.clone(), sscp_h);
            }
            factor_sscp.insert(var1.clone(), row_values);
        }

        // Add this factor's SSCP matrix
        matrices.insert(factor.clone(), BetweenSSCPMatrix { values: factor_sscp });
    }

    // 3. Calculate SSCP matrices for interaction effects
    if factors.len() > 1 {
        let interaction_terms = generate_interaction_terms(&factors);

        for interaction_term in &interaction_terms {
            let mut interaction_sscp = HashMap::new();
            let factor_names = parse_interaction_term(interaction_term);

            // Get levels for each factor in this interaction
            let mut factor_levels = Vec::new();
            for factor in &factor_names {
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

            generate_level_combinations(
                &factor_levels,
                &mut current_combo,
                0,
                &mut level_combinations
            );

            // Calculate means for each combination of levels
            let mut combo_means: Vec<Vec<f64>> = Vec::new();
            let mut combo_counts: Vec<usize> = Vec::new();

            for combo in &level_combinations {
                let mut combo_values: Vec<Vec<f64>> = vec![Vec::new(); dependent_vars.len()];

                // Get values for each dependent variable for this combination
                for (dep_idx, sub_var) in dependent_vars.iter().enumerate() {
                    // Get all records that match this combination
                    for rec_idx in &all_records[dep_idx] {
                        let mut all_factors_match = true;

                        // Check if all factors in this record match the current combination
                        for (factor, level) in combo {
                            let mut factor_match = false;

                            // Search in factors_var_data for this factor's value
                            for factors_var_group in &data.factors_data {
                                for fix_record in factors_var_group {
                                    if let Some(value) = fix_record.values.get(factor) {
                                        let factor_level = data_value_to_string(value);
                                        if &factor_level == level {
                                            factor_match = true;
                                            break;
                                        }
                                    }
                                }
                                if factor_match {
                                    break;
                                }
                            }

                            if !factor_match {
                                all_factors_match = false;
                                break;
                            }
                        }

                        if all_factors_match && *rec_idx < all_dep_values[dep_idx].len() {
                            combo_values[dep_idx].push(all_dep_values[dep_idx][*rec_idx]);
                        }
                    }
                }

                // Calculate means for this combination
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
                combo_counts.push(combo_values[0].len());
            }

            // Calculate individual factor means for Type III SS
            let mut factor_means: HashMap<String, Vec<(String, Vec<f64>, usize)>> = HashMap::new();

            for factor in &factor_names {
                let levels = get_factor_levels(data, factor)?;
                let mut level_data = Vec::new();

                for level in &levels {
                    let mut level_values: Vec<Vec<f64>> = vec![Vec::new(); dependent_vars.len()];

                    // Get values for each dependent variable for this level
                    for (dep_idx, sub_var) in dependent_vars.iter().enumerate() {
                        for rec_idx in &all_records[dep_idx] {
                            let mut found_level = false;

                            // Search in factors_var_data for this factor's value
                            for factors_var_group in &data.factors_data {
                                for fix_record in factors_var_group {
                                    if let Some(value) = fix_record.values.get(factor) {
                                        let factor_level = data_value_to_string(value);
                                        if &factor_level == level {
                                            found_level = true;
                                            if *rec_idx < all_dep_values[dep_idx].len() {
                                                level_values[dep_idx].push(
                                                    all_dep_values[dep_idx][*rec_idx]
                                                );
                                            }
                                            break;
                                        }
                                    }
                                }
                                if found_level {
                                    break;
                                }
                            }
                        }
                    }

                    // Calculate means for this level
                    let mut means = Vec::new();
                    for values in &level_values {
                        let mean = if !values.is_empty() {
                            values.iter().sum::<f64>() / (values.len() as f64)
                        } else {
                            0.0
                        };
                        means.push(mean);
                    }

                    level_data.push((level.clone(), means, level_values[0].len()));
                }

                factor_means.insert(factor.clone(), level_data);
            }

            // Calculate Type III SS for interaction
            // This is the deviation from additivity of main effects
            for (i, var1) in dependent_vars.iter().enumerate() {
                let mut row_values = HashMap::new();
                for (j, var2) in dependent_vars.iter().enumerate() {
                    let mut sscp_h = 0.0;

                    // Sum over all combinations
                    for (combo_idx, combo) in level_combinations.iter().enumerate() {
                        // Get expected mean based on main effects (additivity)
                        let mut expected_mean_i = grand_means[i];
                        let mut expected_mean_j = grand_means[j];

                        // Add factor effects
                        for (factor, level) in combo {
                            if let Some(levels) = factor_means.get(factor) {
                                if
                                    let Some(level_data) = levels
                                        .iter()
                                        .find(|(lvl, _, _)| lvl == level)
                                {
                                    expected_mean_i += level_data.1[i] - grand_means[i];
                                    expected_mean_j += level_data.1[j] - grand_means[j];
                                }
                            }
                        }

                        // Subtract interaction effect
                        if combo_idx < combo_means.len() && combo_idx < combo_counts.len() {
                            let observed_mean_i = combo_means[combo_idx][i];
                            let observed_mean_j = combo_means[combo_idx][j];
                            let count = combo_counts[combo_idx] as f64;

                            sscp_h +=
                                (observed_mean_i - expected_mean_i) *
                                (observed_mean_j - expected_mean_j) *
                                count;
                        }
                    }

                    row_values.insert(var2.clone(), sscp_h);
                }
                interaction_sscp.insert(var1.clone(), row_values);
            }

            // Add this interaction's SSCP matrix
            matrices.insert(interaction_term.clone(), BetweenSSCPMatrix {
                values: interaction_sscp,
            });
        }
    }

    // 4. Create a "Model" SSCP matrix (sum of all effects)
    let mut model_combined_sscp = HashMap::new();

    for (i, var1) in dependent_vars.iter().enumerate() {
        let mut row_values = HashMap::new();
        for (j, var2) in dependent_vars.iter().enumerate() {
            let mut total_sscp = 0.0;

            // Sum over all effect matrices (excluding error)
            for (effect, matrix) in &matrices {
                if effect != "Error" {
                    if let Some(row) = matrix.values.get(var1) {
                        if let Some(&value) = row.get(var2) {
                            total_sscp += value;
                        }
                    }
                }
            }

            row_values.insert(var2.clone(), total_sscp);
        }
        model_combined_sscp.insert(var1.clone(), row_values);
    }

    matrices.insert("Model".to_string(), BetweenSSCPMatrix { values: model_combined_sscp });

    // 5. Calculate Error SSCP matrix
    let mut error_sscp = HashMap::new();

    for (i, var1) in dependent_vars.iter().enumerate() {
        let mut row_values = HashMap::new();
        for (j, var2) in dependent_vars.iter().enumerate() {
            let mut total_sscp_e = 0.0;

            // For each record, calculate the residual
            for rec_idx in 0..all_records[0].len() {
                if rec_idx < all_dep_values[i].len() && rec_idx < all_dep_values[j].len() {
                    // Find the factor combination for this record
                    let mut record_factor_levels = HashMap::new();

                    for factor in &factors {
                        let mut factor_level = None;

                        // Look for this factor's value in factors_var_data
                        for factors_var_group in &data.factors_data {
                            for fix_record in factors_var_group {
                                if let Some(value) = fix_record.values.get(factor) {
                                    factor_level = Some(data_value_to_string(value));
                                    break;
                                }
                            }
                            if factor_level.is_some() {
                                break;
                            }
                        }

                        if let Some(level) = factor_level {
                            record_factor_levels.insert(factor.clone(), level);
                        }
                    }

                    // Calculate predicted value based on model
                    let mut predicted_i = grand_means[i];
                    let mut predicted_j = grand_means[j];

                    // Add factor effects
                    for (factor, level) in &record_factor_levels {
                        if let Some(matrix) = matrices.get(factor) {
                            if let Some(factor_row) = matrix.values.get(var1) {
                                if !factor_row.is_empty() {
                                    // Use average factor effect if level not found
                                    let factor_effect =
                                        factor_row.values().sum::<f64>() /
                                        (factor_row.len() as f64);
                                    predicted_i += factor_effect;
                                }
                            }

                            if let Some(factor_row) = matrix.values.get(var2) {
                                if !factor_row.is_empty() {
                                    let factor_effect =
                                        factor_row.values().sum::<f64>() /
                                        (factor_row.len() as f64);
                                    predicted_j += factor_effect;
                                }
                            }
                        }
                    }

                    // Add interaction effects
                    for (effect, matrix) in &matrices {
                        if effect.contains('*') {
                            let interaction_factors = parse_interaction_term(effect);
                            let mut all_factors_present = true;

                            for factor in &interaction_factors {
                                if !record_factor_levels.contains_key(factor) {
                                    all_factors_present = false;
                                    break;
                                }
                            }

                            if all_factors_present {
                                if let Some(effect_row) = matrix.values.get(var1) {
                                    if !effect_row.is_empty() {
                                        let interaction_effect =
                                            effect_row.values().sum::<f64>() /
                                            (effect_row.len() as f64);
                                        predicted_i += interaction_effect;
                                    }
                                }

                                if let Some(effect_row) = matrix.values.get(var2) {
                                    if !effect_row.is_empty() {
                                        let interaction_effect =
                                            effect_row.values().sum::<f64>() /
                                            (effect_row.len() as f64);
                                        predicted_j += interaction_effect;
                                    }
                                }
                            }
                        }
                    }

                    // Calculate residual product
                    let residual_i = all_dep_values[i][rec_idx] - predicted_i;
                    let residual_j = all_dep_values[j][rec_idx] - predicted_j;

                    total_sscp_e += residual_i * residual_j;
                }
            }

            row_values.insert(var2.clone(), total_sscp_e);
        }
        error_sscp.insert(var1.clone(), row_values);
    }

    matrices.insert("Error".to_string(), BetweenSSCPMatrix { values: error_sscp });

    // Return the between-subjects SSCP with all calculated matrices
    Ok(BetweenSubjectsSSCP {
        matrices,
        based_on: Some("Type III sum of squares".to_string()),
    })
}
