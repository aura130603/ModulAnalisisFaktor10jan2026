use std::collections::HashMap;

use crate::models::{
    config::RepeatedMeasuresConfig,
    data::{ AnalysisData, DataValue },
    result::{ ConfidenceInterval, EstimatedMarginalMean },
};

use super::core::{
    build_design_matrix_and_response,
    calculate_mean,
    calculate_t_critical,
    get_factor_levels,
    to_dmatrix,
    to_dvector,
};

/// Calculate estimated marginal means (EMMEANS)
pub fn calculate_emmeans(
    data: &AnalysisData,
    config: &RepeatedMeasuresConfig
) -> Result<HashMap<String, Vec<EstimatedMarginalMean>>, String> {
    let mut result = HashMap::new();

    // Get dependent variables
    let dependent_vars = data.subject_data_defs
        .iter()
        .flat_map(|defs| defs.iter().map(|def| def.name.clone()))
        .collect::<Vec<String>>();

    // Check if EMMEANS are requested
    if let Some(target_list) = &config.emmeans.target_list {
        if target_list.is_empty() {
            return Err("Target list for EMMEANS is empty".to_string());
        }

        let target_factors = config.emmeans.target_list.as_ref().unwrap();

        for dep_var in &dependent_vars {
            let mut means = Vec::new();

            // Fit the model for this dependent variable
            let (x_matrix, y_vector) = build_design_matrix_and_response(data, config, dep_var)?;

            // Get parameter estimates
            let x_mat = to_dmatrix(&x_matrix);
            let y_vec = to_dvector(&y_vector);

            let x_transpose_x = &x_mat.transpose() * &x_mat;
            let x_transpose_y = &x_mat.transpose() * &y_vec;

            let beta = match x_transpose_x.clone().try_inverse() {
                Some(inv) => inv * x_transpose_y,
                None => {
                    return Err(
                        "Could not invert X'X matrix - possibly due to multicollinearity".to_string()
                    );
                }
            };

            // Calculate variance-covariance matrix for parameter estimates
            let n = y_vector.len();
            let p = x_matrix[0].len();
            let df_error = n - p;

            let residuals = &y_vec - &x_mat * &beta;
            let ss_error = residuals
                .iter()
                .map(|r| r.powi(2))
                .sum::<f64>();
            let ms_error = ss_error / (df_error as f64);

            let var_cov_matrix = x_transpose_x.clone().try_inverse().unwrap() * ms_error;

            // For each target factor, calculate EMMs
            for factor in target_factors {
                if let Ok(levels) = get_factor_levels(data, factor) {
                    for level in &levels {
                        // Create design point (L vector) for this factor level
                        let mut l_vector = vec![0.0; p];

                        // Set the appropriate factor level column to 1
                        // This is a simplified approach - a real implementation would
                        // construct the proper L matrix based on the model parameterization
                        if let Some(factors) = &config.main.factors_var {
                            let mut col_idx = 0;

                            for f in factors {
                                if f == factor {
                                    if let Ok(f_levels) = get_factor_levels(data, f) {
                                        let level_idx = f_levels.iter().position(|l| l == level);

                                        if let Some(idx) = level_idx {
                                            // If not the reference level, set column to 1
                                            if idx < f_levels.len() - 1 {
                                                l_vector[col_idx + idx] = 1.0;
                                            } else {
                                                // If reference level, set all columns to 0
                                                // (already done by default initialization)
                                            }
                                        }
                                    }
                                } else {
                                    // For other factors, use their means
                                    if let Ok(f_levels) = get_factor_levels(data, f) {
                                        // Skip columns for other factors
                                        col_idx += f_levels.len() - 1;
                                    }
                                }
                            }
                        }

                        // Set covariate values to their means if present
                        if let Some(covariates) = &config.main.covariates {
                            let mut col_idx = 0;

                            // Skip factor columns
                            if let Some(factors) = &config.main.factors_var {
                                for f in factors {
                                    if let Ok(levels) = get_factor_levels(data, f) {
                                        col_idx += levels.len() - 1;
                                    }
                                }
                            }

                            // Set covariates to their means
                            for covar in covariates {
                                let mut covar_values = Vec::new();

                                for records in &data.subject_data {
                                    for record in records {
                                        if let Some(value) = record.values.get(covar) {
                                            if let DataValue::Number(num) = value {
                                                covar_values.push(*num);
                                            }
                                        }
                                    }
                                }

                                if !covar_values.is_empty() {
                                    let covar_mean = calculate_mean(&covar_values);
                                    l_vector[col_idx] = covar_mean;
                                }

                                col_idx += 1;
                            }
                        }

                        // Calculate estimated marginal mean: l'β
                        let l_vec = to_dvector(&l_vector);
                        let mean = l_vec.dot(&beta);

                        // Calculate standard error: sqrt(l'Var(β)l)
                        let variance_scalar = (l_vec.transpose() * var_cov_matrix.clone() * l_vec)
                            .get(0)
                            .copied()
                            .unwrap_or(0.0);
                        let std_error = variance_scalar.sqrt();

                        // Calculate confidence interval
                        let alpha = 0.05;
                        let t_critical = calculate_t_critical(df_error, alpha / 2.0);
                        let ci_lower = mean - t_critical * std_error;
                        let ci_upper = mean + t_critical * std_error;

                        means.push(EstimatedMarginalMean {
                            dependent_variable: dep_var.clone(),
                            factor_name: factor.to_string(),
                            factor_value: level.clone(),
                            mean,
                            std_error,
                            confidence_interval: ConfidenceInterval {
                                lower_bound: ci_lower,
                                upper_bound: ci_upper,
                            },
                        });
                    }
                }
            }

            if !means.is_empty() {
                result.insert(dep_var.clone(), means);
            }
        }
    }

    if result.is_empty() {
        Err("No EMMEANS calculated - check your model and data".to_string())
    } else {
        Ok(result)
    }
}
