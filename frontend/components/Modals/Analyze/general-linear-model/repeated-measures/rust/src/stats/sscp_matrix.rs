use std::collections::HashMap;

use crate::models::{
    config::{ RepeatedMeasuresConfig, SumOfSquaresMethod },
    data::AnalysisData,
    result::SSCPMatrix,
};

use super::common::{
    build_design_matrix_and_response,
    calculate_mean,
    extract_dependent_value,
    matrix_multiply,
    matrix_transpose,
    matrix_inverse,
    data_value_to_string,
};

/// Calculate SSCP (Sum of Squares and Cross Products) matrix for the model
pub fn calculate_sscp_matrix(
    data: &AnalysisData,
    config: &RepeatedMeasuresConfig
) -> Result<SSCPMatrix, String> {
    // Get the list of dependent variables
    let dependent_vars = config.main.sub_var.as_ref().unwrap();

    // Calculate Lack of Fit and Pure Error SSCP matrices
    let (lack_of_fit_sscp, pure_error_sscp) = calculate_lack_of_fit_and_pure_error(data, config)?;

    // Initialize the categories HashMap
    let mut categories = HashMap::new();

    // Add Lack of Fit category
    categories.insert("Lack of Fit".to_string(), lack_of_fit_sscp);

    // Add Pure Error category
    categories.insert("Pure Error".to_string(), pure_error_sscp);

    // Return the SSCP matrix
    Ok(SSCPMatrix {
        matrix_type: "Sums of Squares and Cross-products".to_string(),
        categories,
    })
}

/// Calculate Lack of Fit and Pure Error SSCP matrices
fn calculate_lack_of_fit_and_pure_error(
    data: &AnalysisData,
    config: &RepeatedMeasuresConfig
) -> Result<
    (HashMap<String, HashMap<String, f64>>, HashMap<String, HashMap<String, f64>>),
    String
> {
    // Check if there are any dependent variables
    if config.main.sub_var.is_none() || config.main.sub_var.as_ref().unwrap().is_empty() {
        return Err("No dependent variables specified".to_string());
    }

    // Get the list of dependent variables
    let dependent_vars = config.main.sub_var.as_ref().unwrap();

    // Build design matrices and calculate residuals for each dependent variable
    let mut design_matrices = Vec::new();
    let mut response_vectors = Vec::new();
    let mut unique_x_combinations = HashMap::new();

    for (idx, dep_var) in dependent_vars.iter().enumerate() {
        match build_design_matrix_and_response(data, config, dep_var) {
            Ok((x_matrix, y_vector)) => {
                // For each row in the design matrix, create a key to identify unique predictor combinations
                for (i, x_row) in x_matrix.iter().enumerate() {
                    let key = format!("{:?}", x_row); // Use string representation of the row as a key
                    if !unique_x_combinations.contains_key(&key) {
                        unique_x_combinations.insert(key.clone(), Vec::new());
                    }
                    unique_x_combinations.get_mut(&key).unwrap().push((i, idx));
                }

                design_matrices.push(x_matrix);
                response_vectors.push(y_vector);
            }
            Err(e) => {
                return Err(format!("Failed to build design matrix for {}: {}", dep_var, e));
            }
        }
    }

    // Calculate parameters and fitted values for each dependent variable
    let mut fitted_values = Vec::new();
    let mut residuals = Vec::new();

    for (i, (x_matrix, y_vector)) in design_matrices
        .iter()
        .zip(response_vectors.iter())
        .enumerate() {
        if x_matrix.is_empty() || y_vector.is_empty() {
            fitted_values.push(Vec::new());
            residuals.push(Vec::new());
            continue;
        }

        // Calculate X'X
        let x_transpose = matrix_transpose(x_matrix);
        let xtx = match matrix_multiply(&x_transpose, x_matrix) {
            Ok(result) => result,
            Err(e) => {
                return Err(format!("Error computing X'X: {}", e));
            }
        };

        // Calculate (X'X)^-1
        let xtx_inv = match matrix_inverse(&xtx) {
            Ok(result) => result,
            Err(e) => {
                return Err(format!("Error computing (X'X)^-1: {}", e));
            }
        };

        // Calculate X'y
        let mut xty = vec![0.0; x_transpose.len()];
        for (i, x_row) in x_transpose.iter().enumerate() {
            for (j, &x_val) in x_row.iter().enumerate() {
                if j < y_vector.len() {
                    xty[i] += x_val * y_vector[j];
                }
            }
        }

        // Calculate beta = (X'X)^-1 X'y
        let mut beta = vec![0.0; xtx_inv.len()];
        for (i, xtx_row) in xtx_inv.iter().enumerate() {
            for (j, &xtx_val) in xtx_row.iter().enumerate() {
                if j < xty.len() {
                    beta[i] += xtx_val * xty[j];
                }
            }
        }

        // Calculate fitted values y_hat = X*beta
        let mut y_hat = vec![0.0; x_matrix.len()];
        for (i, x_row) in x_matrix.iter().enumerate() {
            for (j, &x_val) in x_row.iter().enumerate() {
                if j < beta.len() {
                    y_hat[i] += x_val * beta[j];
                }
            }
        }

        // Calculate residuals e = y - y_hat
        let mut e = vec![0.0; y_vector.len()];
        for i in 0..y_vector.len() {
            e[i] = y_vector[i] - y_hat[i];
        }

        fitted_values.push(y_hat);
        residuals.push(e);
    }

    // Calculate Lack of Fit and Pure Error SSCP
    let mut lack_of_fit_sscp = HashMap::new();
    let mut pure_error_sscp = HashMap::new();

    // Initialize SSCP matrices for each pair of dependent variables
    for dep_var1 in dependent_vars {
        let mut lof_row = HashMap::new();
        let mut pe_row = HashMap::new();

        for dep_var2 in dependent_vars {
            lof_row.insert(dep_var2.clone(), 0.0);
            pe_row.insert(dep_var2.clone(), 0.0);
        }

        lack_of_fit_sscp.insert(dep_var1.clone(), lof_row);
        pure_error_sscp.insert(dep_var1.clone(), pe_row);
    }

    // Calculate the group means for each unique predictor combination
    let mut group_means = HashMap::new();
    for (key, indices) in &unique_x_combinations {
        let mut group_means_row = Vec::new();
        for _ in 0..dependent_vars.len() {
            group_means_row.push(0.0);
        }

        // Count the observations in this group
        let mut counts = vec![0; dependent_vars.len()];

        // Calculate sum of y values for each dependent variable in this group
        for &(row_idx, dep_idx) in indices {
            if row_idx < response_vectors[dep_idx].len() {
                group_means_row[dep_idx] += response_vectors[dep_idx][row_idx];
                counts[dep_idx] += 1;
            }
        }

        // Calculate means
        for dep_idx in 0..dependent_vars.len() {
            if counts[dep_idx] > 0 {
                group_means_row[dep_idx] /= counts[dep_idx] as f64;
            }
        }

        group_means.insert(key.clone(), (group_means_row, counts));
    }

    // Calculate Pure Error SSCP: sum of (y_ij - ȳ_i)^2 across all groups
    // and Lack of Fit SSCP: sum of n_i(ȳ_i - ŷ_i)^2 across all groups
    for (key, indices) in &unique_x_combinations {
        if let Some((means, counts)) = group_means.get(key) {
            for i in 0..dependent_vars.len() {
                for j in 0..dependent_vars.len() {
                    let dep_var1 = &dependent_vars[i];
                    let dep_var2 = &dependent_vars[j];

                    // Pure Error calculation
                    let mut pe_sum = 0.0;
                    for &(row_idx, dep_idx) in indices {
                        if dep_idx == i && row_idx < response_vectors[i].len() {
                            let y_val1 = response_vectors[i][row_idx];

                            if dep_idx == j && row_idx < response_vectors[j].len() {
                                let y_val2 = response_vectors[j][row_idx];
                                pe_sum += (y_val1 - means[i]) * (y_val2 - means[j]);
                            } else if
                                let Some(val2_indices) = indices.iter().find(|&&(_, d)| d == j)
                            {
                                let (row2_idx, _) = *val2_indices;
                                if row2_idx < response_vectors[j].len() {
                                    let y_val2 = response_vectors[j][row2_idx];
                                    pe_sum += (y_val1 - means[i]) * (y_val2 - means[j]);
                                }
                            }
                        }
                    }

                    // Accumulate Pure Error SSCP
                    if let Some(pe_row) = pure_error_sscp.get_mut(dep_var1) {
                        if let Some(pe_value) = pe_row.get_mut(dep_var2) {
                            *pe_value += pe_sum;
                        }
                    }

                    // Lack of Fit calculation
                    if counts[i] > 0 && counts[j] > 0 {
                        // Calculate average fitted value for this group
                        let mut fitted_sum_i = 0.0;
                        let mut fitted_sum_j = 0.0;
                        let mut fitted_count_i = 0;
                        let mut fitted_count_j = 0;

                        for &(row_idx, dep_idx) in indices {
                            if dep_idx == i && row_idx < fitted_values[i].len() {
                                fitted_sum_i += fitted_values[i][row_idx];
                                fitted_count_i += 1;
                            }
                            if dep_idx == j && row_idx < fitted_values[j].len() {
                                fitted_sum_j += fitted_values[j][row_idx];
                                fitted_count_j += 1;
                            }
                        }

                        if fitted_count_i > 0 && fitted_count_j > 0 {
                            let avg_fitted_i = fitted_sum_i / (fitted_count_i as f64);
                            let avg_fitted_j = fitted_sum_j / (fitted_count_j as f64);

                            // n_i * (ȳ_i - ŷ_i) * (ȳ_j - ŷ_j)
                            let lof_value =
                                (counts[i] as f64) *
                                (means[i] - avg_fitted_i) *
                                (means[j] - avg_fitted_j);

                            // Accumulate Lack of Fit SSCP
                            if let Some(lof_row) = lack_of_fit_sscp.get_mut(dep_var1) {
                                if let Some(lof_val) = lof_row.get_mut(dep_var2) {
                                    *lof_val += lof_value;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    Ok((lack_of_fit_sscp, pure_error_sscp))
}

/// Calculate hypothesis SSCP matrix for a specific effect
pub fn calculate_hypothesis_sscp(
    data: &AnalysisData,
    config: &RepeatedMeasuresConfig,
    effect: &str
) -> Result<HashMap<String, HashMap<String, f64>>, String> {
    // Get the list of dependent variables
    let dependent_vars = config.main.sub_var.as_ref().unwrap();

    // Initialize hypothesis SSCP matrix
    let mut hypothesis_sscp = HashMap::new();
    for dep_var1 in dependent_vars {
        let mut row_values = HashMap::new();
        for dep_var2 in dependent_vars {
            row_values.insert(dep_var2.clone(), 0.0);
        }
        hypothesis_sscp.insert(dep_var1.clone(), row_values);
    }

    // Parse effects to identify which terms to include in full model and reduced model
    let mut model_effects = vec![effect.to_string()];
    if let Some(factors) = &config.main.factors_var {
        for factor in factors {
            if factor != effect {
                model_effects.push(factor.clone());
            }
        }
    }

    // Build design matrices and response vectors for each dependent variable
    let mut full_design_matrices = Vec::new();
    let mut full_response_vectors = Vec::new();
    let mut reduced_design_matrices = Vec::new();

    for dep_var in dependent_vars {
        // Build full model design matrix (including the effect)
        match build_design_matrix_and_response(data, config, dep_var) {
            Ok((x_matrix, y_vector)) => {
                full_design_matrices.push(x_matrix.clone());
                full_response_vectors.push(y_vector.clone());

                // Build reduced model design matrix based on sum of squares type
                let reduced_x_matrix = match config.model.sum_of_square_method {
                    SumOfSquaresMethod::TypeI => {
                        // Type I: Each term is adjusted only for terms that precede it
                        build_type_i_reduced_design_matrix(&x_matrix, effect, &model_effects)?
                    }
                    SumOfSquaresMethod::TypeII => {
                        // Type II: Term is adjusted for all "appropriate" effects
                        build_type_ii_reduced_design_matrix(&x_matrix, effect, &model_effects)?
                    }
                    SumOfSquaresMethod::TypeIII => {
                        // Type III: Term is adjusted for all effects not containing it
                        // and orthogonal to effects containing it
                        build_type_iii_reduced_design_matrix(&x_matrix, effect, &model_effects)?
                    }
                    SumOfSquaresMethod::TypeIV => {
                        // Type IV: Similar to Type III but handles missing cells differently
                        build_type_iv_reduced_design_matrix(&x_matrix, effect, &model_effects)?
                    }
                };

                reduced_design_matrices.push(reduced_x_matrix);
            }
            Err(e) => {
                return Err(format!("Failed to build design matrix for {}: {}", dep_var, e));
            }
        }
    }

    // Calculate parameters for full model
    let mut full_parameters = Vec::new();
    let mut full_fitted_values = Vec::new();

    for (i, (x_matrix, y_vector)) in full_design_matrices
        .iter()
        .zip(full_response_vectors.iter())
        .enumerate() {
        // Calculate X'X
        let x_transpose = matrix_transpose(x_matrix);
        let xtx = match matrix_multiply(&x_transpose, x_matrix) {
            Ok(result) => result,
            Err(e) => {
                return Err(format!("Error computing X'X for full model: {}", e));
            }
        };

        // Calculate (X'X)^-1
        let xtx_inv = match matrix_inverse(&xtx) {
            Ok(result) => result,
            Err(e) => {
                return Err(format!("Error computing (X'X)^-1 for full model: {}", e));
            }
        };

        // Calculate X'y
        let mut xty = vec![0.0; x_transpose.len()];
        for (i, x_row) in x_transpose.iter().enumerate() {
            for (j, &x_val) in x_row.iter().enumerate() {
                if j < y_vector.len() {
                    xty[i] += x_val * y_vector[j];
                }
            }
        }

        // Calculate beta = (X'X)^-1 X'y
        let mut beta = vec![0.0; xtx_inv.len()];
        for (i, xtx_row) in xtx_inv.iter().enumerate() {
            for (j, &xtx_val) in xtx_row.iter().enumerate() {
                if j < xty.len() {
                    beta[i] += xtx_val * xty[j];
                }
            }
        }
        full_parameters.push(beta);

        // Calculate fitted values for full model
        let mut y_hat = vec![0.0; x_matrix.len()];
        for (i, x_row) in x_matrix.iter().enumerate() {
            for (j, &x_val) in x_row.iter().enumerate() {
                if j < full_parameters[i].len() {
                    y_hat[i] += x_val * full_parameters[i][j];
                }
            }
        }
        full_fitted_values.push(y_hat);
    }

    // Calculate parameters for reduced model
    let mut reduced_fitted_values = Vec::new();

    for (i, (x_matrix, y_vector)) in reduced_design_matrices
        .iter()
        .zip(full_response_vectors.iter())
        .enumerate() {
        // Calculate X'X
        let x_transpose = matrix_transpose(x_matrix);
        let xtx = match matrix_multiply(&x_transpose, x_matrix) {
            Ok(result) => result,
            Err(e) => {
                return Err(format!("Error computing X'X for reduced model: {}", e));
            }
        };

        // Calculate (X'X)^-1
        let xtx_inv = match matrix_inverse(&xtx) {
            Ok(result) => result,
            Err(e) => {
                return Err(format!("Error computing (X'X)^-1 for reduced model: {}", e));
            }
        };

        // Calculate X'y
        let mut xty = vec![0.0; x_transpose.len()];
        for (i, x_row) in x_transpose.iter().enumerate() {
            for (j, &x_val) in x_row.iter().enumerate() {
                if j < y_vector.len() {
                    xty[i] += x_val * y_vector[j];
                }
            }
        }

        // Calculate beta = (X'X)^-1 X'y
        let mut beta = vec![0.0; xtx_inv.len()];
        for (i, xtx_row) in xtx_inv.iter().enumerate() {
            for (j, &xtx_val) in xtx_row.iter().enumerate() {
                if j < xty.len() {
                    beta[i] += xtx_val * xty[j];
                }
            }
        }

        // Calculate fitted values for reduced model
        let mut y_hat = vec![0.0; x_matrix.len()];
        for (i, x_row) in x_matrix.iter().enumerate() {
            for (j, &x_val) in x_row.iter().enumerate() {
                if j < beta.len() {
                    y_hat[i] += x_val * beta[j];
                }
            }
        }
        reduced_fitted_values.push(y_hat);
    }

    // Calculate hypothesis SSCP as difference between models
    for (i, dep_var1) in dependent_vars.iter().enumerate() {
        for (j, dep_var2) in dependent_vars.iter().enumerate() {
            let min_len = std::cmp::min(
                full_fitted_values[i].len(),
                std::cmp::min(
                    full_fitted_values[j].len(),
                    std::cmp::min(reduced_fitted_values[i].len(), reduced_fitted_values[j].len())
                )
            );

            let mut sscp_value = 0.0;
            for k in 0..min_len {
                let diff_i = full_fitted_values[i][k] - reduced_fitted_values[i][k];
                let diff_j = full_fitted_values[j][k] - reduced_fitted_values[j][k];
                sscp_value += diff_i * diff_j;
            }

            // Update hypothesis SSCP
            if let Some(row) = hypothesis_sscp.get_mut(dep_var1) {
                if let Some(value) = row.get_mut(dep_var2) {
                    *value = sscp_value;
                }
            }
        }
    }

    Ok(hypothesis_sscp)
}

/// Helper function to build a Type I (Sequential) reduced design matrix
/// For Type I, we remove the effect's columns and all columns of effects that come after it
fn build_type_i_reduced_design_matrix(
    full_matrix: &[Vec<f64>],
    effect: &str,
    model_effects: &[String]
) -> Result<Vec<Vec<f64>>, String> {
    if full_matrix.is_empty() {
        return Ok(Vec::new());
    }

    // Find position of the effect in model_effects list
    let effect_pos = match model_effects.iter().position(|e| e == effect) {
        Some(pos) => pos,
        None => {
            return Err(format!("Effect '{}' not found in model effects", effect));
        }
    };

    // Determine which columns to keep (those corresponding to effects before this one)
    let mut columns_to_keep = Vec::new();

    // Always keep intercept if present (assumed to be first column)
    if !full_matrix[0].is_empty() {
        columns_to_keep.push(0);
    }

    // For each column in design matrix, determine if it belongs to an effect before the current one
    // This is a simplified approach and would need to be refined based on actual column mapping
    let effects_before = &model_effects[0..effect_pos];

    // Simplified: assume each effect has a fixed number of columns
    // In reality, would need to map columns to effects properly
    let cols_per_effect = (full_matrix[0].len() - 1) / model_effects.len();

    for i in 0..effects_before.len() {
        let start_col = 1 + i * cols_per_effect;
        for j in 0..cols_per_effect {
            columns_to_keep.push(start_col + j);
        }
    }

    // Create reduced design matrix with only selected columns
    let mut reduced_matrix = Vec::new();
    for row in full_matrix {
        let mut new_row = Vec::new();
        for &col_idx in &columns_to_keep {
            if col_idx < row.len() {
                new_row.push(row[col_idx]);
            }
        }
        reduced_matrix.push(new_row);
    }

    Ok(reduced_matrix)
}

/// Helper function to build a Type II reduced design matrix
/// For Type II, we remove columns of the effect and any interactions that contain it
fn build_type_ii_reduced_design_matrix(
    full_matrix: &[Vec<f64>],
    effect: &str,
    model_effects: &[String]
) -> Result<Vec<Vec<f64>>, String> {
    if full_matrix.is_empty() {
        return Ok(Vec::new());
    }

    // Identify effects that contain the current effect (interactions)
    let containing_effects: Vec<&String> = model_effects
        .iter()
        .filter(|e| e.contains(effect) && e != &effect)
        .collect();

    // Determine which columns to keep (all except the effect and its interactions)
    let mut columns_to_keep = Vec::new();

    // Always keep intercept if present
    columns_to_keep.push(0);

    // Similar to Type I, but need to exclude column for the effect itself
    // and any columns for interactions containing the effect
    let cols_per_effect = (full_matrix[0].len() - 1) / model_effects.len();

    for (i, e) in model_effects.iter().enumerate() {
        if e != effect && !containing_effects.contains(&&e) {
            let start_col = 1 + i * cols_per_effect;
            for j in 0..cols_per_effect {
                columns_to_keep.push(start_col + j);
            }
        }
    }

    // Create reduced design matrix with only selected columns
    let mut reduced_matrix = Vec::new();
    for row in full_matrix {
        let mut new_row = Vec::new();
        for &col_idx in &columns_to_keep {
            if col_idx < row.len() {
                new_row.push(row[col_idx]);
            }
        }
        reduced_matrix.push(new_row);
    }

    Ok(reduced_matrix)
}

/// Helper function to build a Type III reduced design matrix
/// For Type III, we need to build a matrix that is orthogonal to the effect
fn build_type_iii_reduced_design_matrix(
    full_matrix: &[Vec<f64>],
    effect: &str,
    model_effects: &[String]
) -> Result<Vec<Vec<f64>>, String> {
    if full_matrix.is_empty() {
        return Ok(Vec::new());
    }

    // For Type III, the approach is more complex as we need to ensure orthogonality
    // For a simplified implementation, we can remove the effect's columns
    // and then orthogonalize the resulting matrix

    // First, identify which columns correspond to the effect
    let effect_pos = match model_effects.iter().position(|e| e == effect) {
        Some(pos) => pos,
        None => {
            return Err(format!("Effect '{}' not found in model effects", effect));
        }
    };

    let cols_per_effect = (full_matrix[0].len() - 1) / model_effects.len();
    let effect_start_col = 1 + effect_pos * cols_per_effect;
    let effect_end_col = effect_start_col + cols_per_effect;

    // Create a reduced matrix without the effect's columns
    let mut reduced_matrix = Vec::new();
    for row in full_matrix {
        let mut new_row = Vec::new();
        for (j, &val) in row.iter().enumerate() {
            if j < effect_start_col || j >= effect_end_col {
                new_row.push(val);
            }
        }
        reduced_matrix.push(new_row);
    }

    // In a real implementation, we would need to ensure orthogonality of the reduced design
    // with respect to the effect, using techniques like QR decomposition or projections
    // This is a simplified implementation

    Ok(reduced_matrix)
}

/// Helper function to build a Type IV reduced design matrix
/// Similar to Type III but handles missing cells differently
fn build_type_iv_reduced_design_matrix(
    full_matrix: &[Vec<f64>],
    effect: &str,
    model_effects: &[String]
) -> Result<Vec<Vec<f64>>, String> {
    // For Type IV, the implementation is similar to Type III
    // but with special handling for missing cells
    // For this simplified implementation, we'll use the same approach as Type III

    build_type_iii_reduced_design_matrix(full_matrix, effect, model_effects)
}

/// Calculate the error SSCP matrix
pub fn calculate_error_sscp(
    data: &AnalysisData,
    config: &RepeatedMeasuresConfig
) -> Result<HashMap<String, HashMap<String, f64>>, String> {
    // Get the list of dependent variables
    let dependent_vars = config.main.sub_var.as_ref().unwrap();

    // Build design matrices and calculate residuals for each dependent variable
    let mut design_matrices = Vec::new();
    let mut response_vectors = Vec::new();

    for dep_var in dependent_vars {
        match build_design_matrix_and_response(data, config, dep_var) {
            Ok((x_matrix, y_vector)) => {
                design_matrices.push(x_matrix);
                response_vectors.push(y_vector);
            }
            Err(e) => {
                return Err(format!("Failed to build design matrix for {}: {}", dep_var, e));
            }
        }
    }

    // Calculate parameters and residuals for each dependent variable
    let mut residuals = Vec::new();

    for (x_matrix, y_vector) in design_matrices.iter().zip(response_vectors.iter()) {
        if x_matrix.is_empty() || y_vector.is_empty() {
            residuals.push(Vec::new());
            continue;
        }

        // Calculate X'X
        let x_transpose = matrix_transpose(x_matrix);
        let xtx = match matrix_multiply(&x_transpose, x_matrix) {
            Ok(result) => result,
            Err(e) => {
                return Err(format!("Error computing X'X: {}", e));
            }
        };

        // Calculate (X'X)^-1
        let xtx_inv = match matrix_inverse(&xtx) {
            Ok(result) => result,
            Err(e) => {
                return Err(format!("Error computing (X'X)^-1: {}", e));
            }
        };

        // Calculate X'y
        let mut xty = vec![0.0; x_transpose.len()];
        for (i, x_row) in x_transpose.iter().enumerate() {
            for (j, &x_val) in x_row.iter().enumerate() {
                if j < y_vector.len() {
                    xty[i] += x_val * y_vector[j];
                }
            }
        }

        // Calculate beta = (X'X)^-1 X'y
        let mut beta = vec![0.0; xtx_inv.len()];
        for (i, xtx_row) in xtx_inv.iter().enumerate() {
            for (j, &xtx_val) in xtx_row.iter().enumerate() {
                if j < xty.len() {
                    beta[i] += xtx_val * xty[j];
                }
            }
        }

        // Calculate fitted values y_hat = X*beta
        let mut y_hat = vec![0.0; x_matrix.len()];
        for (i, x_row) in x_matrix.iter().enumerate() {
            for (j, &x_val) in x_row.iter().enumerate() {
                if j < beta.len() {
                    y_hat[i] += x_val * beta[j];
                }
            }
        }

        // Calculate residuals e = y - y_hat
        let mut e = vec![0.0; y_vector.len()];
        for i in 0..y_vector.len() {
            e[i] = y_vector[i] - y_hat[i];
        }

        residuals.push(e);
    }

    // Calculate Error SSCP
    let mut error_sscp = HashMap::new();

    for (i, dep_var1) in dependent_vars.iter().enumerate() {
        let mut row_values = HashMap::new();

        for (j, dep_var2) in dependent_vars.iter().enumerate() {
            // Calculate the SSCP value: sum of residual products
            let mut sscp_value = 0.0;

            let min_len = std::cmp::min(residuals[i].len(), residuals[j].len());
            for k in 0..min_len {
                sscp_value += residuals[i][k] * residuals[j][k];
            }

            row_values.insert(dep_var2.clone(), sscp_value);
        }

        error_sscp.insert(dep_var1.clone(), row_values);
    }

    Ok(error_sscp)
}
