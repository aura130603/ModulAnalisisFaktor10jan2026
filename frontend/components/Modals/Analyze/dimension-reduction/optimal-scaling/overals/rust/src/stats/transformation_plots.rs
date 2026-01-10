use std::collections::HashMap;

use crate::models::{
    config::OVERALSAnalysisConfig,
    data::AnalysisData,
    result::{ TransformationPlots, TransformationPoint },
};

use super::core::{ get_var_def, run_overals_algorithm };

/// Generate transformation plots data for OVERALS analysis
pub fn generate_transformation_plots(
    data: &AnalysisData,
    config: &OVERALSAnalysisConfig
) -> Result<TransformationPlots, String> {
    // Run OVERALS algorithm
    let result = run_overals_algorithm(data, config)?;

    // Prepare result structure
    let mut transformations = HashMap::new();

    // Process each set
    for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
        // Process each variable in the set
        for (var_idx, _) in set_data.iter().enumerate() {
            if let Ok(var_def) = get_var_def(data, set_idx, var_idx) {
                // Get categories for this variable
                if let Some(categories) = result.category_values.get(&(set_idx, var_idx)) {
                    // Skip if no categories
                    if categories.is_empty() {
                        continue;
                    }

                    // Create transformation points
                    let mut points = Vec::new();

                    for &cat_val in categories {
                        if
                            let Some(&quant) = result.category_quantifications.get(
                                &(set_idx, var_idx, cat_val)
                            )
                        {
                            points.push(TransformationPoint {
                                category: cat_val,
                                quantification: quant,
                            });
                        }
                    }

                    // Add to results if points exist
                    if !points.is_empty() {
                        transformations.insert(var_def.name.clone(), points);
                    }
                }
            }
        }
    }

    Ok(TransformationPlots { transformations })
}
