use nalgebra::{ DMatrix, DVector };
use statrs::distribution::{ StudentsT, ContinuousCDF };
use std::collections::HashMap;

use crate::models::{
    config::RepeatedMeasuresConfig,
    data::{ AnalysisData, DataValue },
    result::{
        ConfidenceInterval,
        ParameterEstimateEntry,
        ParameterEstimates,
        WithinSubjectsFactors,
    },
};

use super::core::parse_within_subject_factors;

/// Calculate parameter estimates
fn calculate_parameter_estimates(
    data: &AnalysisData,
    config: &RepeatedMeasuresConfig
) -> Result<ParameterEstimates, String> {
    let mut estimates = HashMap::new();

    // Get within-subjects factors
    let within_factors = parse_within_subject_factors(data, config)?;

    // Check if we have between-subjects factors
    let between_factors = if let Some(factors) = &config.model.bet_sub_var {
        factors
    } else {
        // No between-subjects factors, just intercept
        return calculate_intercept_only_parameters(data, &within_factors);
    };

    // Process each dependent variable
    for (factor_name, factors) in &within_factors.measures {
        let var_names: Vec<String> = factors
            .iter()
            .map(|f| f.dependent_variable.clone())
            .collect();

        for var_name in &var_names {
            let mut parameter_estimates = Vec::new();

            // Extract data and factor values
            let mut data_values = Vec::new();
            let mut factor_groups = Vec::new();

            for (i, record_group) in data.subject_data.iter().enumerate() {
                let mut has_value = false;
                let mut value = 0.0;

                // Get the dependent variable value
                for record in record_group {
                    if let Some(data_value) = record.values.get(var_name) {
                        match data_value {
                            DataValue::Number(val) => {
                                value = *val;
                                has_value = true;
                                break;
                            }
                            _ => {
                                continue;
                            }
                        }
                    }
                }

                if !has_value {
                    continue;
                }

                // Get the between-subjects factors
                let mut group_values = Vec::new();

                if i < data.factors_data.len() {
                    for record in &data.factors_data[i] {
                        for factor in between_factors {
                            if let Some(factor_value) = record.values.get(factor) {
                                match factor_value {
                                    DataValue::Number(val) => group_values.push(*val),
                                    DataValue::Text(val) => {
                                        if let Ok(num) = val.parse::<f64>() {
                                            group_values.push(num);
                                        } else {
                                            // Categorical value - use a numeric code
                                            group_values.push(0.0); // Simplified for this example
                                        }
                                    }
                                    _ => group_values.push(0.0),
                                }
                            } else {
                                group_values.push(0.0); // Missing factor value
                            }
                        }
                    }
                }

                if !group_values.is_empty() {
                    data_values.push(value);
                    factor_groups.push(group_values);
                }
            }

            if data_values.is_empty() || factor_groups.is_empty() {
                continue;
            }

            // Convert to matrices for analysis
            let n = data_values.len();
            let p = if factor_groups[0].is_empty() { 1 } else { factor_groups[0].len() };

            let y = DVector::from_iterator(n, data_values.iter().cloned());
            let mut X = DMatrix::zeros(n, p + 1); // +1 for intercept

            // Set intercept column
            for i in 0..n {
                X[(i, 0)] = 1.0;
            }

            // Set factor columns
            for i in 0..n {
                for j in 0..p {
                    if j < factor_groups[i].len() {
                        X[(i, j + 1)] = factor_groups[i][j];
                    }
                }
            }

            // Calculate (X'X)^-1 X'y for parameter estimates
            let xtx = X.transpose() * &X;
            let xtx_inv = match xtx.try_inverse() {
                Some(inv) => inv,
                None => {
                    // Singular matrix - fallback to intercept only
                    continue;
                }
            };

            let beta = xtx_inv * X.transpose() * y;

            // Calculate fitted values and residuals
            let y_hat = X * beta;
            let residuals = y - y_hat;

            // Calculate standard errors
            let df_error = n - p - 1;
            let mse = residuals.norm_squared() / (df_error as f64);

            let std_errors = (0..p + 1).map(|i| (xtx_inv[(i, i)] * mse).sqrt()).collect::<Vec<_>>();

            // Calculate t values
            let t_values = (0..p + 1).map(|i| beta[i] / std_errors[i]).collect::<Vec<_>>();

            // Calculate p-values
            let t_dist = StudentsT::new(0.0, 1.0, df_error as f64).map_err(|e| e.to_string())?;
            let p_values = t_values
                .iter()
                .map(|&t| 2.0 * (1.0 - t_dist.cdf(t.abs())))
                .collect::<Vec<_>>();

            // Calculate confidence intervals (95%)
            let t_critical = t_dist.inverse_cdf(0.975);

            // Parameter names
            let param_names = std::iter
                ::once("Intercept".to_string())
                .chain(between_factors.iter().cloned())
                .collect::<Vec<_>>();

            // Create parameter estimates
            for i in 0..param_names.len() {
                if i >= beta.len() {
                    break;
                }

                // Calculate confidence interval
                let margin = t_critical * std_errors[i];
                let ci = ConfidenceInterval {
                    lower_bound: beta[i] - margin,
                    upper_bound: beta[i] + margin,
                };

                // Calculate partial eta squared
                let partial_eta_squared =
                    t_values[i].powi(2) / (t_values[i].powi(2) + (df_error as f64));

                // Calculate noncentrality parameter
                let noncent_parameter = t_values[i].abs();

                // Calculate observed power
                let observed_power = calculate_t_test_power(
                    noncent_parameter,
                    df_error as f64,
                    0.05
                );

                // Create parameter estimate entry
                let param_entry = ParameterEstimateEntry {
                    parameter: param_names[i].clone(),
                    b: beta[i],
                    std_error: std_errors[i],
                    t_value: t_values[i],
                    significance: p_values[i],
                    confidence_interval: ci,
                    partial_eta_squared: Some(partial_eta_squared),
                    noncent_parameter: Some(noncent_parameter),
                    observed_power: Some(observed_power),
                };

                parameter_estimates.push(param_entry);
            }

            estimates.insert(var_name.clone(), parameter_estimates);
        }
    }

    Ok(ParameterEstimates { estimates })
}

/// Calculate intercept-only parameter estimates
fn calculate_intercept_only_parameters(
    data: &AnalysisData,
    within_factors: &WithinSubjectsFactors
) -> Result<ParameterEstimates, String> {
    let mut estimates = HashMap::new();

    // Process each dependent variable
    for (factor_name, factors) in &within_factors.measures {
        let var_names: Vec<String> = factors
            .iter()
            .map(|f| f.dependent_variable.clone())
            .collect();

        for var_name in &var_names {
            // Extract data values
            let mut values = Vec::new();
            for record_group in &data.subject_data {
                for record in record_group {
                    if let Some(data_value) = record.values.get(var_name) {
                        match data_value {
                            DataValue::Number(val) => values.push(*val),
                            _ => {
                                continue;
                            }
                        }
                    }
                }
            }

            if values.is_empty() {
                continue;
            }

            // Calculate intercept statistics
            let n = values.len();
            let mean = values.iter().sum::<f64>() / (n as f64);

            let ss_residual = values
                .iter()
                .map(|&val| (val - mean).powi(2))
                .sum::<f64>();

            let df_error = n - 1;
            let mse = ss_residual / (df_error as f64);
            let std_error = (mse / (n as f64)).sqrt();

            let t_value = mean / std_error;

            // Calculate p-value
            let t_dist = StudentsT::new(0.0, 1.0, df_error as f64).map_err(|e| e.to_string())?;
            let p_value = 2.0 * (1.0 - t_dist.cdf(t_value.abs()));

            // Calculate confidence interval (95%)
            let t_critical = t_dist.inverse_cdf(0.975);
            let margin = t_critical * std_error;

            let ci = ConfidenceInterval {
                lower_bound: mean - margin,
                upper_bound: mean + margin,
            };

            // Calculate partial eta squared
            let partial_eta_squared = t_value.powi(2) / (t_value.powi(2) + (df_error as f64));

            // Calculate noncentrality parameter
            let noncent_parameter = t_value.abs();

            // Calculate observed power
            let observed_power = calculate_t_test_power(noncent_parameter, df_error as f64, 0.05);

            // Create parameter estimate entry
            let param_entry = ParameterEstimateEntry {
                parameter: "Intercept".to_string(),
                b: mean,
                std_error,
                t_value,
                significance: p_value,
                confidence_interval: ci,
                partial_eta_squared: Some(partial_eta_squared),
                noncent_parameter: Some(noncent_parameter),
                observed_power: Some(observed_power),
            };

            estimates.insert(var_name.clone(), vec![param_entry]);
        }
    }

    Ok(ParameterEstimates { estimates })
}

/// Calculate power for t-test
fn calculate_t_test_power(ncp: f64, df: f64, alpha: f64) -> f64 {
    // Approximation of t-test power
    let t_critical = t_critical_value(df, alpha / 2.0);

    // Calculate power using normal approximation
    1.0 - normal_cdf((t_critical - ncp) / (1.0 + ncp.powi(2) / (2.0 * df)).sqrt())
}

/// Calculate t critical value
fn t_critical_value(df: f64, alpha: f64) -> f64 {
    // Approximation of t critical value
    let z = normal_quantile(1.0 - alpha);
    z * (1.0 + z.powi(2) / (4.0 * df))
}
