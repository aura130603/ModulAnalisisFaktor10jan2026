use std::collections::HashMap;

use crate::models::{
    config::OVERALSAnalysisConfig,
    data::{ AnalysisData, DataValue },
    result::{ FitDimensions, FitMeasures, ScalingLevel, Variable },
};

use super::core::{ determine_scaling_level, get_set_defs, run_overals_algorithm };

/// Calculate fit measures for OVERALS analysis
/// Calculate fit measures for OVERALS analysis
pub fn calculate_fit_measures(
    data: &AnalysisData,
    config: &OVERALSAnalysisConfig
) -> Result<FitMeasures, String> {
    // Run OVERALS algorithm
    let result = run_overals_algorithm(data, config)?;

    // Prepare result structure
    let mut set = HashMap::new();
    let mut multiple_fit = HashMap::new();
    let mut single_fit = HashMap::new();
    let mut single_loss = HashMap::new();

    // Process each set
    for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
        // Get all variable definitions for this set (flattened)
        let set_defs = get_set_defs(data, set_idx);

        // Process each variable in the set
        for (var_idx, var_data) in set_data.iter().enumerate() {
            if var_idx >= set_defs.len() {
                continue; // Skip if variable definition not found
            }

            let var_def = set_defs[var_idx];
            let var_name = &var_def.name;

            // Add variable to results
            let var_key = format!("Set{}_Var{}", set_idx + 1, var_idx + 1);
            set.insert(var_key.clone(), Variable {
                variable_name: var_def.name.clone(),
            });

            // Calculate multiple fit (for all scaling levels)
            let mut multi_fit_dims = vec![0.0; result.dimensions];
            let scaling_level = determine_scaling_level(var_def, config);

            // Create indicator matrix and category-case mapping
            let mut category_cases: HashMap<usize, Vec<usize>> = HashMap::new();

            for (case_idx, record) in var_data.iter().enumerate() {
                if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                    let cat_val = *num as usize;
                    category_cases.entry(cat_val).or_insert_with(Vec::new).push(case_idx);
                }
            }

            // Calculate multiple fit
            for dim in 0..result.dimensions {
                let mut dim_fit = 0.0;
                let mut total_cases = 0;

                for (cat_val, cases) in &category_cases {
                    if
                        let Some(&quant) = result.category_quantifications.get(
                            &(set_idx, var_idx, *cat_val)
                        )
                    {
                        let n_cases = cases.len();

                        // For multiple fit, use variance explained by category quantifications
                        let mut sum_sq = 0.0;
                        for &case_idx in cases {
                            if case_idx < result.object_scores.len() {
                                sum_sq += (quant - result.object_scores[case_idx][dim]).powi(2);
                            }
                        }

                        dim_fit += 1.0 - sum_sq / (n_cases as f64);
                        total_cases += n_cases;
                    }
                }

                // Normalize by number of cases
                if total_cases > 0 {
                    multi_fit_dims[dim] = dim_fit / (total_cases as f64);
                }
            }

            // Calculate single fit (for non-multiple scaling levels)
            let mut sing_fit_dims = vec![0.0; result.dimensions];

            if !matches!(scaling_level, ScalingLevel::Multiple) {
                for dim in 0..result.dimensions {
                    let mut dim_fit = 0.0;
                    let mut total_cases = 0;

                    for (cat_val, cases) in &category_cases {
                        if
                            let Some(&quant) = result.category_quantifications.get(
                                &(set_idx, var_idx, *cat_val)
                            )
                        {
                            if let Some(weights) = result.variable_weights.get(&(set_idx, var_idx)) {
                                let n_cases = cases.len();

                                // For single fit, use variance explained by single-rank approximation
                                let mut sum_sq = 0.0;
                                for &case_idx in cases {
                                    if case_idx < result.object_scores.len() {
                                        sum_sq += (
                                            quant * weights[dim] -
                                            result.object_scores[case_idx][dim]
                                        ).powi(2);
                                    }
                                }

                                dim_fit += 1.0 - sum_sq / (n_cases as f64);
                                total_cases += n_cases;
                            }
                        }
                    }

                    // Normalize by number of cases
                    if total_cases > 0 {
                        sing_fit_dims[dim] = dim_fit / (total_cases as f64);
                    }
                }
            } else {
                // For multiple nominal, single fit is the same as multiple fit
                sing_fit_dims = multi_fit_dims.clone();
            }

            // Calculate single loss (multiple_fit - single_fit)
            let mut loss_dims = vec![0.0; result.dimensions];
            for dim in 0..result.dimensions {
                loss_dims[dim] = multi_fit_dims[dim] - sing_fit_dims[dim];
            }

            // Calculate sums
            let multi_fit_sum = multi_fit_dims.iter().sum();
            let sing_fit_sum = sing_fit_dims.iter().sum();
            let loss_sum = loss_dims.iter().sum();

            // Add to results
            multiple_fit.insert(var_key.clone(), FitDimensions {
                dimension: multi_fit_dims,
                sum: multi_fit_sum,
            });

            single_fit.insert(var_key.clone(), FitDimensions {
                dimension: sing_fit_dims,
                sum: sing_fit_sum,
            });

            single_loss.insert(var_key.clone(), FitDimensions {
                dimension: loss_dims,
                sum: loss_sum,
            });
        }
    }

    Ok(FitMeasures {
        set,
        multiple_fit,
        single_fit,
        single_loss,
    })
}
