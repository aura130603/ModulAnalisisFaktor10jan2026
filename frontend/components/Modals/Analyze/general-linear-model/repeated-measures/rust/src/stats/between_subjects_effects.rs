use nalgebra::{ DMatrix, DVector };
use statrs::distribution::{ FisherSnedecor, ContinuousCDF };
use std::collections::HashMap;

use crate::models::{
    config::RepeatedMeasuresConfig,
    data::{ AnalysisData, DataValue },
    result::{ TestEffectEntry, TestsBetweenSubjectsEffects },
};

use super::core::{ calculate_observed_power, parse_within_subject_factors };

/// Calculate tests of between-subjects effects
fn calculate_between_subjects_effects(
    data: &AnalysisData,
    config: &RepeatedMeasuresConfig
) -> Result<TestsBetweenSubjectsEffects, String> {
    let mut effects = HashMap::new();
    let mut r_squared = HashMap::new();
    let mut adjusted_r_squared = HashMap::new();

    // Get within-subjects factors
    let within_factors = parse_within_subject_factors(data, config)?;

    // Check if we have between-subjects factors
    let between_factors = if let Some(factors) = &config.model.bet_sub_var {
        factors
    } else {
        // No between-subjects factors, just intercept
        let mut intercept_effects = HashMap::new();

        // Process each dependent variable
        for (factor_name, factors) in &within_factors.measures {
            let var_names: Vec<String> = factors
                .iter()
                .map(|f| f.dependent_variable.clone())
                .collect();

            // We'll average across all variables for this factor
            for var_name in &var_names {
                let mut effect_entries = HashMap::new();

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

                // Calculate intercept (grand mean) statistics
                let n = values.len();
                let mean = values.iter().sum::<f64>() / (n as f64);

                let ss_total = values
                    .iter()
                    .map(|&val| (val - mean).powi(2))
                    .sum::<f64>();

                let ss_intercept = (n as f64) * mean.powi(2);
                let ss_error = ss_total;

                let df_intercept = 1;
                let df_error = n - 1;

                let ms_intercept = ss_intercept / (df_intercept as f64);
                let ms_error = ss_error / (df_error as f64);

                let f_value = ms_intercept / ms_error;

                // Calculate significance (p-value)
                let f_dist = FisherSnedecor::new(df_intercept as f64, df_error as f64).map_err(|e|
                    e.to_string()
                )?;
                let significance = 1.0 - f_dist.cdf(f_value);

                // Calculate effect size
                let partial_eta_squared = ss_intercept / (ss_intercept + ss_error);

                // Calculate noncentrality parameter
                let noncent_parameter = ss_intercept / ms_error;

                // Calculate observed power
                let observed_power = calculate_observed_power(
                    f_value,
                    df_intercept as f64,
                    df_error as f64,
                    0.05
                );

                // Create effect entry for intercept
                let intercept_entry = TestEffectEntry {
                    sum_of_squares: ss_intercept,
                    df: df_intercept,
                    mean_square: ms_intercept,
                    f_value,
                    significance,
                    partial_eta_squared,
                    noncent_parameter,
                    observed_power,
                };

                effect_entries.insert("Intercept".to_string(), intercept_entry);

                // Create effect entry for error
                let error_entry = TestEffectEntry {
                    sum_of_squares: ss_error,
                    df: df_error,
                    mean_square: ms_error,
                    f_value: 0.0,
                    significance: 1.0,
                    partial_eta_squared: 0.0,
                    noncent_parameter: 0.0,
                    observed_power: 0.0,
                };

                effect_entries.insert("Error".to_string(), error_entry);

                // Add to effects
                intercept_effects.insert(var_name.clone(), effect_entries);

                // Calculate R-squared and adjusted R-squared
                // For intercept-only model, R-squared is 0
                r_squared.insert(var_name.clone(), 0.0);
                adjusted_r_squared.insert(var_name.clone(), 0.0);
            }
        }

        return Ok(TestsBetweenSubjectsEffects {
            effects: intercept_effects,
            r_squared,
            adjusted_r_squared,
        });
    };

    // If we have between-subjects factors
    for (factor_name, factors) in &within_factors.measures {
        let var_names: Vec<String> = factors
            .iter()
            .map(|f| f.dependent_variable.clone())
            .collect();

        // Process each dependent variable
        for var_name in &var_names {
            let mut effect_entries = HashMap::new();

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

            // Calculate sums of squares
            let y_mean = y.sum() / (n as f64);
            let ss_total = y
                .iter()
                .map(|&val| (val - y_mean).powi(2))
                .sum::<f64>();
            let ss_model = y_hat
                .iter()
                .map(|&val| (val - y_mean).powi(2))
                .sum::<f64>();
            let ss_error = residuals.norm_squared();

            // Calculate degrees of freedom
            let df_model = p;
            let df_error = n - p - 1;
            let df_total = n - 1;

            // Calculate mean squares
            let ms_model = ss_model / (df_model as f64);
            let ms_error = ss_error / (df_error as f64);

            // Calculate F value
            let f_value = ms_model / ms_error;

            // Calculate significance (p-value)
            let f_dist = FisherSnedecor::new(df_model as f64, df_error as f64).map_err(|e|
                e.to_string()
            )?;
            let significance = 1.0 - f_dist.cdf(f_value);

            // Calculate effect size
            let partial_eta_squared = ss_model / (ss_model + ss_error);

            // Calculate noncentrality parameter
            let noncent_parameter = ss_model / ms_error;

            // Calculate observed power
            let observed_power = calculate_observed_power(
                f_value,
                df_model as f64,
                df_error as f64,
                0.05
            );

            // Create effect entry for model
            let model_entry = TestEffectEntry {
                sum_of_squares: ss_model,
                df: df_model,
                mean_square: ms_model,
                f_value,
                significance,
                partial_eta_squared,
                noncent_parameter,
                observed_power,
            };

            effect_entries.insert("Model".to_string(), model_entry);

            // Create effect entry for error
            let error_entry = TestEffectEntry {
                sum_of_squares: ss_error,
                df: df_error,
                mean_square: ms_error,
                f_value: 0.0,
                significance: 1.0,
                partial_eta_squared: 0.0,
                noncent_parameter: 0.0,
                observed_power: 0.0,
            };

            effect_entries.insert("Error".to_string(), error_entry);

            // Add to effects
            effects.insert(var_name.clone(), effect_entries);

            // Calculate R-squared and adjusted R-squared
            let r2 = ss_model / ss_total;
            let adj_r2 = 1.0 - ss_error / (df_error as f64) / (ss_total / (df_total as f64));

            r_squared.insert(var_name.clone(), r2);
            adjusted_r_squared.insert(var_name.clone(), adj_r2);
        }
    }

    Ok(TestsBetweenSubjectsEffects {
        effects,
        r_squared,
        adjusted_r_squared,
    })
}
