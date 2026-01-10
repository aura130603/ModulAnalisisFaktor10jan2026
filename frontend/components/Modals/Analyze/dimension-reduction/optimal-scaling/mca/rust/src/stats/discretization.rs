use std::collections::HashMap;

use crate::models::{ config::MCAConfig, data::{ AnalysisData, DataValue } };

use super::core::{
    get_all_variables,
    normal_quantile,
    parse_discretization_setting,
    parse_variable_weight,
};

/// Applies discretization to variables according to the configuration
pub fn apply_discretization(
    data: &AnalysisData,
    config: &MCAConfig
) -> Result<AnalysisData, String> {
    // Get variables to discretize with their settings
    let discretization_settings: Vec<(String, String, Option<u8>, Option<bool>)> = match
        &config.discretize.variables_list
    {
        Some(vars) if !vars.is_empty() => {
            vars.iter()
                .map(|v| parse_discretization_setting(v))
                .collect()
        }
        _ => {
            // If no variables specified, apply default discretization to all analysis variables
            match &config.main.analysis_vars {
                Some(vars) => {
                    vars.iter()
                        .map(|v| {
                            let (var_name, _) = parse_variable_weight(v);
                            (var_name, "Unspecified".to_string(), None, None)
                        })
                        .collect()
                }
                None => {
                    get_all_variables(data)
                        .iter()
                        .map(|v| (v.clone(), "Unspecified".to_string(), None, None))
                        .collect()
                }
            }
        }
    };

    if discretization_settings.is_empty() {
        return Ok(data.clone());
    }

    // Create a copy of the data for discretization
    let mut discretized_data = data.clone();

    // For each dataset, discretize the specified variables
    for dataset_idx in 0..discretized_data.analysis_data.len() {
        let dataset = &mut discretized_data.analysis_data[dataset_idx];

        for (var_name, method, value_opt, distribution_opt) in &discretization_settings {
            // Collect all values for the variable
            let mut values = Vec::new();
            let mut indices = Vec::new();

            for (idx, record) in dataset.iter().enumerate() {
                if let Some(value) = record.values.get(var_name) {
                    match value {
                        DataValue::Number(num) => {
                            values.push(*num);
                            indices.push(idx);
                        }
                        DataValue::Text(text) => {
                            if let Ok(num) = text.parse::<f64>() {
                                values.push(num);
                                indices.push(idx);
                            }
                        }
                        _ => {}
                    }
                }
            }

            if values.is_empty() {
                continue;
            }

            // Apply discretization based on method
            match method.as_str() {
                "Grouping" => {
                    if let Some(n_cats) = value_opt {
                        let n_cats = *n_cats as usize;

                        // Sort values
                        values.sort_by(|a, b| a.partial_cmp(b).unwrap());

                        // Determine boundaries for each category
                        let mut boundaries = Vec::new();

                        if let Some(is_normal) = distribution_opt {
                            if !is_normal {
                                // Uniform distribution
                                // Uniform distribution - equal number of cases per category
                                let n_values = values.len();
                                let target_per_cat = (
                                    (n_values as f64) / (n_cats as f64)
                                ).ceil() as usize;

                                for i in 1..n_cats {
                                    let idx = i * target_per_cat;
                                    if idx < values.len() {
                                        boundaries.push(values[idx]);
                                    }
                                }
                            } else {
                                // Normal distribution
                                // Normal distribution - equal intervals transformed to match normal distribution
                                let min_val = *values.first().unwrap();
                                let max_val = *values.last().unwrap();
                                let range = max_val - min_val;

                                // Use normal distribution quantiles (simplified)
                                for i in 1..n_cats {
                                    let quantile = (i as f64) / (n_cats as f64);
                                    // Approximating normal quantile
                                    let z_score = normal_quantile(quantile);
                                    let boundary = min_val + ((z_score + 3.0) * range) / 6.0; // Map z-scores [-3,3] to range
                                    boundaries.push(boundary);
                                }
                            }
                        } else {
                            // If no distribution specified, use Equal Intervals
                            let min_val = *values.first().unwrap();
                            let max_val = *values.last().unwrap();
                            let interval_size = (max_val - min_val) / (n_cats as f64);

                            for i in 1..n_cats {
                                boundaries.push(min_val + (i as f64) * interval_size);
                            }
                        }

                        // Discretize values
                        for record in dataset.iter_mut() {
                            if let Some(value) = record.values.get_mut(var_name) {
                                let num = match value {
                                    DataValue::Number(num) => *num,
                                    DataValue::Text(text) => {
                                        if let Ok(num) = text.parse::<f64>() {
                                            num
                                        } else {
                                            continue;
                                        }
                                    }
                                    _ => {
                                        continue;
                                    }
                                };

                                // Find category
                                let mut category = 1;
                                for (i, boundary) in boundaries.iter().enumerate() {
                                    if num < *boundary {
                                        category = i + 1;
                                        break;
                                    }
                                    category = n_cats;
                                }

                                *value = DataValue::Number(category as f64);
                            }
                        }
                    }
                }
                "Ranking" => {
                    // Create pairs of (value, original_index)
                    let mut value_with_index: Vec<(f64, usize)> = values
                        .iter()
                        .enumerate()
                        .map(|(i, &val)| (val, indices[i]))
                        .collect();

                    // Sort by value
                    value_with_index.sort_by(|a, b|
                        a.0.partial_cmp(&b.0).unwrap_or(std::cmp::Ordering::Equal)
                    );

                    // Assign ranks (1-based), handling ties by averaging
                    let mut i = 0;
                    while i < value_with_index.len() {
                        let current_value = value_with_index[i].0;
                        let start_idx = i;

                        // Find all items with the same value (ties)
                        while i < value_with_index.len() && value_with_index[i].0 == current_value {
                            i += 1;
                        }

                        // Calculate rank as average position (1-based)
                        let avg_rank = ((start_idx + 1 + i) as f64) / 2.0;

                        // Assign rank to all tied values
                        for j in start_idx..i {
                            let record_idx = value_with_index[j].1;
                            if let Some(value) = dataset[record_idx].values.get_mut(var_name) {
                                *value = DataValue::Number(avg_rank);
                            }
                        }
                    }
                }
                "Multiplying" => {
                    // Calculate mean and std dev
                    let n = values.len();
                    let mean = values.iter().sum::<f64>() / (n as f64);

                    let variance =
                        values
                            .iter()
                            .map(|x| (*x - mean).powi(2))
                            .sum::<f64>() / (n as f64);

                    let std_dev = variance.sqrt();

                    // Find the minimum z-score to determine offset
                    let min_z = if std_dev > 0.0 {
                        values
                            .iter()
                            .map(|x| (*x - mean) / std_dev)
                            .fold(f64::INFINITY, |a, b| a.min(b))
                    } else {
                        0.0
                    };

                    let offset = if min_z < 0.0 { -min_z * 10.0 + 1.0 } else { 1.0 };

                    // Discretize values
                    for record in dataset.iter_mut() {
                        if let Some(value) = record.values.get_mut(var_name) {
                            let num = match value {
                                DataValue::Number(num) => *num,
                                DataValue::Text(text) => {
                                    if let Ok(num) = text.parse::<f64>() {
                                        num
                                    } else {
                                        continue;
                                    }
                                }
                                _ => {
                                    continue;
                                }
                            };

                            // Standardize, multiply by 10, round, add offset
                            let z_score = if std_dev > 0.0 { (num - mean) / std_dev } else { 0.0 };
                            let discretized = (z_score * 10.0).round() + offset;

                            *value = DataValue::Number(discretized);
                        }
                    }
                }
                "Unspecified" | _ => {
                    // Default behavior: group into 7 categories with normal distribution
                    let n_cats = (7).min(values.len());

                    // Sort values
                    values.sort_by(|a, b| a.partial_cmp(b).unwrap());

                    // Determine boundaries for each category (normal distribution)
                    let min_val = *values.first().unwrap();
                    let max_val = *values.last().unwrap();
                    let range = max_val - min_val;

                    let mut boundaries = Vec::new();
                    for i in 1..n_cats {
                        let quantile = (i as f64) / (n_cats as f64);
                        let z_score = normal_quantile(quantile);
                        let boundary = min_val + ((z_score + 3.0) * range) / 6.0;
                        boundaries.push(boundary);
                    }

                    // Discretize values
                    for record in dataset.iter_mut() {
                        if let Some(value) = record.values.get_mut(var_name) {
                            let num = match value {
                                DataValue::Number(num) => *num,
                                DataValue::Text(text) => {
                                    if let Ok(num) = text.parse::<f64>() {
                                        num
                                    } else {
                                        continue;
                                    }
                                }
                                _ => {
                                    continue;
                                }
                            };

                            // Find category
                            let mut category = 1;
                            for (i, boundary) in boundaries.iter().enumerate() {
                                if num < *boundary {
                                    category = i + 1;
                                    break;
                                }
                                category = n_cats;
                            }

                            *value = DataValue::Number(category as f64);
                        }
                    }
                }
            }
        }
    }

    Ok(discretized_data)
}
