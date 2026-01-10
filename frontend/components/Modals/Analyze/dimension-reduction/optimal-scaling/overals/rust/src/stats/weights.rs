use std::collections::HashMap;

use crate::models::{
    config::OVERALSAnalysisConfig,
    data::AnalysisData,
    result::{ Dimensions, ScalingLevel, Variable, Weights },
};

use super::core::{ determine_scaling_level, get_var_def, run_overals_algorithm };

/// Calculate weights for OVERALS analysis
pub fn calculate_weights(
    data: &AnalysisData,
    config: &OVERALSAnalysisConfig
) -> Result<Weights, String> {
    // Run the OVERALS algorithm
    let result = run_overals_algorithm(data, config)?;

    // Prepare result structure
    let mut set = HashMap::new();
    let mut weights_result = HashMap::new();

    // Process each set
    for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
        // Process each variable in the set
        for (var_idx, _) in set_data.iter().enumerate() {
            if let Ok(var_def) = get_var_def(data, set_idx, var_idx) {
                // Skip multiple nominal variables as per the documentation
                let scaling_level = determine_scaling_level(var_def, config);
                if matches!(scaling_level, ScalingLevel::Multiple) {
                    continue;
                }

                // Create entry in results
                let var_key = format!("Set{}_Var{}", set_idx + 1, var_idx + 1);
                set.insert(var_key.clone(), Variable {
                    variable_name: var_def.name.clone(),
                });

                // Get weights from algorithm results
                if let Some(weights) = result.variable_weights.get(&(set_idx, var_idx)) {
                    weights_result.insert(var_key, Dimensions {
                        dimensions: weights.clone(),
                    });
                }
            }
        }
    }

    Ok(Weights {
        set,
        weights: weights_result,
    })
}
