use std::collections::HashMap;

use crate::models::{
    config::{ MultivariateConfig, SumOfSquaresMethod },
    data::AnalysisData,
    result::{ TestEffectEntry, TestsBetweenSubjectsEffects },
};

use super::core::{
    build_design_matrix_and_response,
    calculate_f_significance,
    calculate_mean,
    calculate_observed_power,
    generate_interaction_terms,
    get_factor_levels,
    parse_interaction_term,
    to_dmatrix,
    to_dvector,
};

/// Calculate tests of between-subjects effects (ANOVA)
pub fn calculate_tests_between_subjects_effects(
    data: &AnalysisData,
    config: &MultivariateConfig
) -> Result<TestsBetweenSubjectsEffects, String> {
    let mut effects = HashMap::new();
    let mut r_squared = HashMap::new();
    let mut adjusted_r_squared = HashMap::new();

    // Get dependent variables
    let dependent_vars = data.dependent_data_defs
        .iter()
        .flat_map(|defs| defs.iter().map(|def| def.name.clone()))
        .collect::<Vec<String>>();

    // Prepare design matrix (X) and dependent variable vectors (Y)
    for dep_var in &dependent_vars {
        let mut effect_results: HashMap<String, TestEffectEntry> = HashMap::new();

        // Build design matrix and response vector
        let (x_matrix, y_vector) = build_design_matrix_and_response(data, config, dep_var)?;

        // Calculate total sum of squares
        let mean_y = calculate_mean(&y_vector);
        let ss_total = y_vector
            .iter()
            .map(|y| (y - mean_y).powi(2))
            .sum::<f64>();

        // Fit the model
        let x_mat = to_dmatrix(&x_matrix);
        let y_vec = to_dvector(&y_vector);

        let x_transpose_x = &x_mat.transpose() * &x_mat;
        let x_transpose_y = &x_mat.transpose() * &y_vec;

        // Get parameter estimates (beta coefficients)
        let beta = match x_transpose_x.try_inverse() {
            Some(inv) => inv * x_transpose_y,
            None => {
                return Err(
                    "Could not invert X'X matrix - possibly due to multicollinearity".to_string()
                );
            }
        };

        // Calculate fitted values and residuals
        let y_hat = &x_mat * &beta;
        let residuals = &y_vec - &y_hat;

        // Calculate error sum of squares (SSE)
        let ss_error = residuals
            .iter()
            .map(|r| r.powi(2))
            .sum::<f64>();

        // Calculate model (regression) sum of squares
        let ss_model = ss_total - ss_error;

        // Calculate degrees of freedom
        let n = y_vector.len();
        let p = x_matrix[0].len(); // Number of parameters (including intercept)
        let df_model = p - 1;
        let df_error = n - p;
        let df_total = n - 1;

        // Calculate mean squares
        let ms_model = ss_model / (df_model as f64);
        let ms_error = ss_error / (df_error as f64);

        // Calculate F-statistic
        let f_value = ms_model / ms_error;
        let significance = calculate_f_significance(df_model, df_error, f_value);

        // Calculate effect size (partial eta squared)
        let partial_eta_squared = ss_model / (ss_model + ss_error);

        // Calculate noncentrality parameter and observed power
        let noncent_parameter = ss_model / ms_error;
        let observed_power = calculate_observed_power(df_model, df_error, f_value, 0.05);

        // Add "Corrected Model" effect
        effect_results.insert("Corrected Model".to_string(), TestEffectEntry {
            sum_of_squares: ss_model,
            df: df_model,
            mean_square: ms_model,
            f_value,
            significance,
            partial_eta_squared,
            noncent_parameter,
            observed_power,
        });

        // Add "Intercept" effect if included
        if config.model.intercept {
            // Calculate intercept statistics
            let intercept_ss = (n as f64) * mean_y.powi(2);
            let intercept_df = 1;
            let intercept_ms = intercept_ss;
            let intercept_f = intercept_ms / ms_error;
            let intercept_sig = calculate_f_significance(intercept_df, df_error, intercept_f);
            let intercept_eta = intercept_ss / (intercept_ss + ss_error);
            let intercept_noncent = intercept_ss / ms_error;
            let intercept_power = calculate_observed_power(
                intercept_df,
                df_error,
                intercept_f,
                0.05
            );

            effect_results.insert("Intercept".to_string(), TestEffectEntry {
                sum_of_squares: intercept_ss,
                df: intercept_df,
                mean_square: intercept_ms,
                f_value: intercept_f,
                significance: intercept_sig,
                partial_eta_squared: intercept_eta,
                noncent_parameter: intercept_noncent,
                observed_power: intercept_power,
            });
        }

        // Add "Error" effect
        effect_results.insert("Error".to_string(), TestEffectEntry {
            sum_of_squares: ss_error,
            df: df_error,
            mean_square: ms_error,
            f_value: 0.0, // Not applicable for Error
            significance: 0.0, // Not applicable for Error
            partial_eta_squared: 0.0, // Not applicable for Error
            noncent_parameter: 0.0, // Not applicable for Error
            observed_power: 0.0, // Not applicable for Error
        });

        // Add "Corrected Total" effect
        effect_results.insert("Corrected Total".to_string(), TestEffectEntry {
            sum_of_squares: ss_total,
            df: df_total,
            mean_square: 0.0, // Not applicable for Total
            f_value: 0.0, // Not applicable for Total
            significance: 0.0, // Not applicable for Total
            partial_eta_squared: 0.0, // Not applicable for Total
            noncent_parameter: 0.0, // Not applicable for Total
            observed_power: 0.0, // Not applicable for Total
        });

        // If there are factors, calculate Type I, II, III, or IV SS for each
        if let Some(factors) = &config.main.fix_factor {
            for factor in factors {
                // This would be a more complex calculation based on the SS type
                // For simplicity, we're using a placeholder approach here
                // In a real implementation, you'd need to compute the appropriate SS based on the model
                let factor_cols = get_factor_columns(&x_matrix, factor, data, config)?;
                let factor_df = factor_cols.len() - 1; // Degrees of freedom for the factor

                if factor_df > 0 {
                    // Calculate factor SS based on the SS type
                    let factor_ss = match config.model.sum_of_square_method {
                        SumOfSquaresMethod::TypeI => {
                            // Type I SS (sequential)
                            calculate_type_i_ss(&x_matrix, &y_vector, &factor_cols, data, config)?
                        }
                        SumOfSquaresMethod::TypeII => {
                            // Type II SS
                            calculate_type_ii_ss(
                                &x_matrix,
                                &y_vector,
                                factor,
                                &factor_cols,
                                data,
                                config
                            )?
                        }
                        SumOfSquaresMethod::TypeIII => {
                            // Type III SS (default)
                            calculate_type_iii_ss(
                                &x_matrix,
                                &y_vector,
                                factor,
                                &factor_cols,
                                data,
                                config
                            )?
                        }
                        SumOfSquaresMethod::TypeIV => {
                            // Type IV SS
                            calculate_type_iv_ss(
                                &x_matrix,
                                &y_vector,
                                factor,
                                &factor_cols,
                                data,
                                config
                            )?
                        }
                    };

                    let factor_ms = factor_ss / (factor_df as f64);
                    let factor_f = factor_ms / ms_error;
                    let factor_sig = calculate_f_significance(factor_df, df_error, factor_f);
                    let factor_eta = factor_ss / (factor_ss + ss_error);
                    let factor_noncent = factor_ss / ms_error;
                    let factor_power = calculate_observed_power(
                        factor_df,
                        df_error,
                        factor_f,
                        0.05
                    );

                    effect_results.insert(factor.clone(), TestEffectEntry {
                        sum_of_squares: factor_ss,
                        df: factor_df,
                        mean_square: factor_ms,
                        f_value: factor_f,
                        significance: factor_sig,
                        partial_eta_squared: factor_eta,
                        noncent_parameter: factor_noncent,
                        observed_power: factor_power,
                    });
                }
            }

            // Calculate interaction effects if there are multiple factors
            if factors.len() > 1 {
                let interaction_terms = generate_interaction_terms(factors);

                for term in &interaction_terms {
                    // Determine columns for this interaction
                    let interaction_cols = get_interaction_columns(&x_matrix, term, data, config)?;
                    let interaction_df = interaction_cols.len() - 1;

                    if interaction_df > 0 {
                        // Calculate interaction SS based on the SS type
                        let interaction_ss = match config.model.sum_of_square_method {
                            SumOfSquaresMethod::TypeI => {
                                // Type I SS (sequential)
                                calculate_type_i_ss(
                                    &x_matrix,
                                    &y_vector,
                                    &interaction_cols,
                                    data,
                                    config
                                )?
                            }
                            SumOfSquaresMethod::TypeII => {
                                // Type II SS
                                calculate_type_ii_ss(
                                    &x_matrix,
                                    &y_vector,
                                    term,
                                    &interaction_cols,
                                    data,
                                    config
                                )?
                            }
                            SumOfSquaresMethod::TypeIII => {
                                // Type III SS (default)
                                calculate_type_iii_ss(
                                    &x_matrix,
                                    &y_vector,
                                    term,
                                    &interaction_cols,
                                    data,
                                    config
                                )?
                            }
                            SumOfSquaresMethod::TypeIV => {
                                // Type IV SS
                                calculate_type_iv_ss(
                                    &x_matrix,
                                    &y_vector,
                                    term,
                                    &interaction_cols,
                                    data,
                                    config
                                )?
                            }
                        };

                        let interaction_ms = interaction_ss / (interaction_df as f64);
                        let interaction_f = interaction_ms / ms_error;
                        let interaction_sig = calculate_f_significance(
                            interaction_df,
                            df_error,
                            interaction_f
                        );
                        let interaction_eta = interaction_ss / (interaction_ss + ss_error);
                        let interaction_noncent = interaction_ss / ms_error;
                        let interaction_power = calculate_observed_power(
                            interaction_df,
                            df_error,
                            interaction_f,
                            0.05
                        );

                        effect_results.insert(term.clone(), TestEffectEntry {
                            sum_of_squares: interaction_ss,
                            df: interaction_df,
                            mean_square: interaction_ms,
                            f_value: interaction_f,
                            significance: interaction_sig,
                            partial_eta_squared: interaction_eta,
                            noncent_parameter: interaction_noncent,
                            observed_power: interaction_power,
                        });
                    }
                }
            }
        }

        // Calculate R-squared and adjusted R-squared
        let r2 = 1.0 - ss_error / ss_total;
        let adj_r2 = 1.0 - ss_error / (df_error as f64) / (ss_total / (df_total as f64));

        // Store results for this dependent variable
        effects.insert(dep_var.clone(), effect_results);
        r_squared.insert(dep_var.clone(), r2);
        adjusted_r_squared.insert(dep_var.clone(), adj_r2);
    }

    Ok(TestsBetweenSubjectsEffects {
        effects,
        r_squared,
        adjusted_r_squared,
    })
}

/// Helper functions for different types of Sum of Squares
pub fn calculate_type_i_ss(
    x_matrix: &Vec<Vec<f64>>,
    y_vector: &Vec<f64>,
    factor_cols: &Vec<usize>,
    _data: &AnalysisData,
    _config: &MultivariateConfig
) -> Result<f64, String> {
    // Type I SS (sequential) calculation
    // Simplified implementation - compute SS by fitting models with and without the factor
    let n = y_vector.len();
    let full_model_ss = fit_model_and_get_ss(&x_matrix, &y_vector)?;

    // Create reduced model without the factor columns
    let mut reduced_x = Vec::new();
    for row in x_matrix {
        let mut new_row = Vec::new();
        for (j, val) in row.iter().enumerate() {
            if !factor_cols.contains(&j) {
                new_row.push(*val);
            }
        }
        reduced_x.push(new_row);
    }

    let reduced_model_ss = fit_model_and_get_ss(&reduced_x, &y_vector)?;

    // Type I SS is the difference between full and reduced model SS
    Ok(reduced_model_ss - full_model_ss)
}

pub fn calculate_type_ii_ss(
    x_matrix: &Vec<Vec<f64>>,
    y_vector: &Vec<f64>,
    factor: &str,
    factor_cols: &Vec<usize>,
    data: &AnalysisData,
    config: &MultivariateConfig
) -> Result<f64, String> {
    // Type II SS calculation
    // Adjusted for all other appropriate effects

    // Get all other main effects
    let mut other_effects = Vec::new();
    if let Some(factors) = &config.main.fix_factor {
        for other_factor in factors {
            if other_factor != factor {
                other_effects.push(other_factor.clone());
            }
        }
    }

    // Create a model with all main effects except the current factor
    let mut reduced_x = Vec::new();
    for row in x_matrix {
        let mut new_row = Vec::new();
        for (j, val) in row.iter().enumerate() {
            if !factor_cols.contains(&j) {
                new_row.push(*val);
            }
        }
        reduced_x.push(new_row);
    }

    let full_model_ss = fit_model_and_get_ss(&x_matrix, &y_vector)?;
    let reduced_model_ss = fit_model_and_get_ss(&reduced_x, &y_vector)?;

    // Type II SS is the difference between full and reduced model SS
    Ok(reduced_model_ss - full_model_ss)
}

pub fn calculate_type_iii_ss(
    x_matrix: &Vec<Vec<f64>>,
    y_vector: &Vec<f64>,
    effect: &str,
    effect_cols: &Vec<usize>,
    _data: &AnalysisData,
    _config: &MultivariateConfig
) -> Result<f64, String> {
    // Type III SS calculation
    // Adjusted for all other effects and orthogonal to any effects that contain it

    // Full model
    let full_model_ss = fit_model_and_get_ss(&x_matrix, &y_vector)?;

    // Create reduced model without the effect columns
    let mut reduced_x = Vec::new();
    for row in x_matrix {
        let mut new_row = Vec::new();
        for (j, val) in row.iter().enumerate() {
            if !effect_cols.contains(&j) {
                new_row.push(*val);
            }
        }
        reduced_x.push(new_row);
    }

    let reduced_model_ss = fit_model_and_get_ss(&reduced_x, &y_vector)?;

    // Type III SS is the difference between full and reduced model SS
    Ok(reduced_model_ss - full_model_ss)
}

pub fn calculate_type_iv_ss(
    x_matrix: &Vec<Vec<f64>>,
    y_vector: &Vec<f64>,
    effect: &str,
    effect_cols: &Vec<usize>,
    data: &AnalysisData,
    config: &MultivariateConfig
) -> Result<f64, String> {
    // Type IV SS calculation - similar to Type III but adjusted for empty cells
    // This is a simplification - actual Type IV calculation requires more complex logic

    // For this simplified implementation, we'll use the Type III calculation
    calculate_type_iii_ss(x_matrix, y_vector, effect, effect_cols, data, config)
}

/// Helper function to fit model and get error sum of squares
pub fn fit_model_and_get_ss(x_matrix: &Vec<Vec<f64>>, y_vector: &Vec<f64>) -> Result<f64, String> {
    let x_mat = to_dmatrix(x_matrix);
    let y_vec = to_dvector(y_vector);

    let x_transpose_x = &x_mat.transpose() * &x_mat;
    let x_transpose_y = &x_mat.transpose() * &y_vec;

    // Get parameter estimates (beta coefficients)
    let beta = match x_transpose_x.try_inverse() {
        Some(inv) => inv * x_transpose_y,
        None => {
            return Err(
                "Could not invert X'X matrix - possibly due to multicollinearity".to_string()
            );
        }
    };

    // Calculate fitted values and residuals
    let y_hat = &x_mat * &beta;
    let residuals = &y_vec - &y_hat;

    // Calculate error sum of squares (SSE)
    let ss_error = residuals
        .iter()
        .map(|r| r.powi(2))
        .sum::<f64>();

    Ok(ss_error)
}

/// Helper function to get columns corresponding to a factor
pub fn get_factor_columns(
    x_matrix: &Vec<Vec<f64>>,
    factor: &str,
    data: &AnalysisData,
    config: &MultivariateConfig
) -> Result<Vec<usize>, String> {
    let mut factor_cols = Vec::new();

    // Start column index after intercept if present
    let mut col_start = if config.model.intercept { 1 } else { 0 };

    if let Some(factors) = &config.main.fix_factor {
        for f in factors {
            if let Ok(levels) = get_factor_levels(data, f) {
                let num_dummies = levels.len() - 1; // One less dummy than levels

                if f == factor {
                    // These are the columns for our target factor
                    for i in 0..num_dummies {
                        factor_cols.push(col_start + i);
                    }
                }

                col_start += num_dummies;
            }
        }
    }

    // Skip covariates
    if let Some(covariates) = &config.main.covar {
        col_start += covariates.len();
    }

    // If no columns found, this could mean it's an interaction term
    if factor_cols.is_empty() && factor.contains('*') {
        factor_cols = get_interaction_columns(x_matrix, factor, data, config)?;
    }

    Ok(factor_cols)
}

/// Helper function to get columns corresponding to an interaction term
pub fn get_interaction_columns(
    x_matrix: &Vec<Vec<f64>>,
    interaction_term: &str,
    data: &AnalysisData,
    config: &MultivariateConfig
) -> Result<Vec<usize>, String> {
    // For simplicity, return a subset of columns based on a heuristic
    // In a real implementation, this would need to be more sophisticated
    let mut interaction_cols = Vec::new();

    // Start after all main effects
    let mut col_start = 0;

    // Skip intercept if present
    if config.model.intercept {
        col_start += 1;
    }

    // Skip main effect columns
    if let Some(factors) = &config.main.fix_factor {
        for f in factors {
            if let Ok(levels) = get_factor_levels(data, f) {
                col_start += levels.len() - 1;
            }
        }
    }

    // Skip covariates
    if let Some(covariates) = &config.main.covar {
        col_start += covariates.len();
    }

    // Now we should be at the interaction columns
    // This is a simplified approach - in reality you'd need to know the exact design matrix structure
    let interaction_factors = parse_interaction_term(interaction_term);
    let num_factors = interaction_factors.len();

    // Assume 3 columns per 2-way interaction, 7 columns per 3-way interaction, etc.
    // This is just a placeholder logic - real implementation would depend on actual design matrix construction
    let estimated_cols = match num_factors {
        2 => 3,
        3 => 7,
        _ => 15,
    };

    // Find columns for this specific interaction
    if let Some(factors) = &config.main.fix_factor {
        if factors.len() > 1 {
            let interaction_terms = generate_interaction_terms(factors);
            let pos = interaction_terms.iter().position(|t| t == interaction_term);

            if let Some(idx) = pos {
                let interaction_start = col_start + idx * estimated_cols;
                for i in 0..estimated_cols {
                    if interaction_start + i < x_matrix[0].len() {
                        interaction_cols.push(interaction_start + i);
                    }
                }
            }
        }
    }

    Ok(interaction_cols)
}
