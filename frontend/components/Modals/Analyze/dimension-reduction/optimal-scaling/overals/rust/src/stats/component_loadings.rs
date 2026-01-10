use std::collections::HashMap;

use crate::models::{
    config::OVERALSAnalysisConfig,
    data::{ AnalysisData, DataValue },
    result::{ ComponentLoadings, Dimensions, ScalingLevel, Variable },
};

use super::core::{
    calculate_correlation,
    determine_scaling_level,
    get_set_defs,
    run_overals_algorithm,
};

/// Calculate component loadings for OVERALS analysis
/// Calculate component loadings for OVERALS analysis
pub fn calculate_component_loadings(
    data: &AnalysisData,
    config: &OVERALSAnalysisConfig
) -> Result<ComponentLoadings, String> {
    // Run OVERALS algorithm
    let result = run_overals_algorithm(data, config)?;

    // Prepare result structure
    let mut set = HashMap::new();
    let mut loadings = HashMap::new();

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

            // Add variable to results
            let var_key = format!("Set{}_Var{}", set_idx + 1, var_idx + 1);
            set.insert(var_key.clone(), Variable {
                variable_name: var_def.name.clone(),
            });

            // Calculate loadings (correlations between quantified variables and object scores)
            let mut var_loadings = vec![0.0; result.dimensions];
            let var_name = &var_def.name;

            // Create quantified variable values
            let mut quant_values = vec![vec![0.0; result.dimensions]; result.object_scores.len()];

            for (case_idx, record) in var_data.iter().enumerate() {
                if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                    let cat_val = *num as usize;

                    match determine_scaling_level(var_def, config) {
                        ScalingLevel::Multiple => {
                            // For multiple nominal, loadings are direct correlations
                            if
                                let Some(&quant) = result.category_quantifications.get(
                                    &(set_idx, var_idx, cat_val)
                                )
                            {
                                for dim in 0..result.dimensions {
                                    quant_values[case_idx][dim] = quant;
                                }
                            }
                        }
                        _ => {
                            // For single variables, use weights
                            if
                                let Some(&quant) = result.category_quantifications.get(
                                    &(set_idx, var_idx, cat_val)
                                )
                            {
                                if
                                    let Some(weights) = result.variable_weights.get(
                                        &(set_idx, var_idx)
                                    )
                                {
                                    for dim in 0..result.dimensions {
                                        quant_values[case_idx][dim] = quant * weights[dim];
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Calculate correlation between quantified variable and object scores for each dimension
            for dim in 0..result.dimensions {
                let quant_dim_values: Vec<f64> = quant_values
                    .iter()
                    .map(|qv| qv[dim])
                    .collect();
                let obj_dim_scores: Vec<f64> = result.object_scores
                    .iter()
                    .map(|os| os[dim])
                    .collect();

                var_loadings[dim] = calculate_correlation(&quant_dim_values, &obj_dim_scores);
            }

            loadings.insert(var_key, Dimensions {
                dimensions: var_loadings,
            });
        }
    }

    Ok(ComponentLoadings {
        set,
        loadings,
    })
}
