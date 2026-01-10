use std::collections::HashMap;

use crate::models::{
    config::MultivariateConfig,
    data::AnalysisData,
    result::{ ConfidenceInterval, ParameterEstimateEntry, ParameterEstimates },
};

use super::core::{
    build_design_matrix_and_response,
    calculate_observed_power_t,
    calculate_t_critical,
    calculate_t_significance,
    generate_interaction_terms,
    get_factor_levels,
    parse_interaction_term,
    to_dmatrix,
    to_dvector,
};

/// Calculate parameter estimates
pub fn calculate_parameter_estimates(
    data: &AnalysisData,
    config: &MultivariateConfig
) -> Result<ParameterEstimates, String> {
    let mut estimates = HashMap::new();

    // Get dependent variables
    let dependent_vars = data.dependent_data_defs
        .iter()
        .flat_map(|defs| defs.iter().map(|def| def.name.clone()))
        .collect::<Vec<String>>();

    for dep_var in &dependent_vars {
        let (x_matrix, y_vector) = build_design_matrix_and_response(data, config, dep_var)?;

        // Fit the model
        let x_mat = to_dmatrix(&x_matrix);
        let y_vec = to_dvector(&y_vector);

        let x_transpose_x = &x_mat.transpose() * &x_mat;
        let x_transpose_y = &x_mat.transpose() * &y_vec;

        // Get parameter estimates (beta coefficients)
        let beta = match x_transpose_x.clone().try_inverse() {
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

        // Calculate degrees of freedom
        let n = y_vector.len();
        let p = x_matrix[0].len(); // Number of parameters
        let df_error = n - p;

        // Calculate residual mean square (error variance estimate)
        let ms_error = ss_error / (df_error as f64);

        // Get the inverse of X'X for standard errors
        let xtx_inv = match x_transpose_x.try_inverse() {
            Some(inv) => inv,
            None => {
                return Err("Could not invert X'X matrix for standard errors".to_string());
            }
        };

        // Generate parameter names based on the model
        let param_names = generate_parameter_names(data, config)?;

        // Calculate parameter estimates and statistics
        let mut param_estimates = Vec::new();

        for (i, param_name) in param_names.iter().enumerate() {
            let b_value = beta[i];
            let std_error = (ms_error * xtx_inv[(i, i)]).sqrt();
            let t_value = b_value / std_error;
            let significance = calculate_t_significance(df_error, t_value);

            // Calculate confidence interval (default 95%)
            let alpha = 0.05;
            let t_critical = calculate_t_critical(df_error, alpha / 2.0);
            let ci_lower = b_value - t_critical * std_error;
            let ci_upper = b_value + t_critical * std_error;

            // Calculate partial eta squared
            let partial_eta_squared = t_value.powi(2) / (t_value.powi(2) + (df_error as f64));

            // Calculate noncentrality parameter and observed power
            let noncent_parameter = t_value.abs();
            let observed_power = calculate_observed_power_t(df_error, t_value, alpha);

            param_estimates.push(ParameterEstimateEntry {
                parameter: param_name.clone(),
                b: b_value,
                std_error,
                t_value,
                significance,
                confidence_interval: ConfidenceInterval {
                    lower_bound: ci_lower,
                    upper_bound: ci_upper,
                },
                partial_eta_squared: Some(partial_eta_squared),
                noncent_parameter: Some(noncent_parameter),
                observed_power: Some(observed_power),
            });
        }

        estimates.insert(dep_var.clone(), param_estimates);
    }

    Ok(ParameterEstimates { estimates })
}

/// Helper function to generate parameter names
pub fn generate_parameter_names(
    data: &AnalysisData,
    config: &MultivariateConfig
) -> Result<Vec<String>, String> {
    let mut param_names = Vec::new();

    // Add intercept if included in the model
    if config.model.intercept {
        param_names.push("Intercept".to_string());
    }

    // Add factor parameters
    if let Some(factors) = &config.main.fix_factor {
        for factor in factors {
            if let Ok(levels) = get_factor_levels(data, factor) {
                // Create names for each level (except reference level)
                for level in &levels[0..levels.len() - 1] {
                    param_names.push(format!("[{}={}]", factor, level));
                }
            }
        }
    }

    // Add covariate parameters
    if let Some(covariates) = &config.main.covar {
        for covar in covariates {
            param_names.push(covar.clone());
        }
    }

    // Add interaction terms
    if let Some(factors) = &config.main.fix_factor {
        if factors.len() > 1 {
            let interaction_terms = generate_interaction_terms(factors);
            for term in &interaction_terms {
                let factors = parse_interaction_term(term);
                let mut interaction_levels = Vec::new();

                // For each factor in the interaction, get its levels
                for factor in &factors {
                    if let Ok(levels) = get_factor_levels(data, factor) {
                        // For simplicity, use the first non-reference level
                        if !levels.is_empty() {
                            interaction_levels.push(format!("[{}={}]", factor, levels[0]));
                        }
                    }
                }

                // Create the interaction parameter name
                if !interaction_levels.is_empty() {
                    param_names.push(interaction_levels.join(" * "));
                }
            }
        }
    }

    Ok(param_names)
}
