use std::collections::HashMap;

use crate::models::{
    config::OVERALSAnalysisConfig,
    data::{ AnalysisData, DataValue },
    result::{ CentroidCategory, CentroidsResult, Coordinates, ScalingLevel },
};

use super::core::{ determine_scaling_level, get_set_defs, run_overals_algorithm };

/// Calculate centroids for OVERALS analysis
pub fn calculate_centroids(
    data: &AnalysisData,
    config: &OVERALSAnalysisConfig
) -> Result<Vec<CentroidsResult>, String> {
    // Run OVERALS algorithm
    let result = run_overals_algorithm(data, config)?;

    let mut centroids_results = Vec::new();

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

            let mut centroid_result = CentroidsResult {
                set: format!("Set {}", set_idx + 1),
                variable_name: var_def.name.clone(),
                centroids: HashMap::new(),
            };

            // Count categories and track which objects belong to each category
            let mut category_objects: HashMap<String, Vec<usize>> = HashMap::new();
            let mut category_counts: HashMap<String, usize> = HashMap::new();

            for (obj_idx, record) in var_data.iter().enumerate() {
                if let Some(DataValue::Number(num)) = record.values.get(&var_def.name) {
                    if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                        let category = num.to_string();
                        category_objects.entry(category.clone()).or_default().push(obj_idx);
                        *category_counts.entry(category).or_default() += 1;
                    }
                }
            }

            // Calculate centroids for each category
            for (category, objects) in &category_objects {
                if !objects.is_empty() {
                    let mut category_centroids = vec![0.0; result.dimensions];

                    // Average object scores for this category
                    for &obj_idx in objects {
                        for dim in 0..result.dimensions {
                            if obj_idx < result.object_scores.len() {
                                category_centroids[dim] += result.object_scores[obj_idx][dim];
                            }
                        }
                    }

                    // Normalize
                    let num_objects = objects.len() as f64;
                    for dim in 0..result.dimensions {
                        category_centroids[dim] /= num_objects;
                    }

                    // Calculate projected centroids
                    let scaling_level = determine_scaling_level(var_def, config);
                    let mut projected_centroids = vec![0.0; result.dimensions];

                    match scaling_level {
                        ScalingLevel::Single | ScalingLevel::Ordinal | ScalingLevel::Discrete => {
                            if let Some(weights) = result.variable_weights.get(&(set_idx, var_idx)) {
                                let cat_val = category.parse::<usize>().unwrap_or(0);

                                if
                                    let Some(&quant) = result.category_quantifications.get(
                                        &(set_idx, var_idx, cat_val)
                                    )
                                {
                                    for dim in 0..result.dimensions {
                                        projected_centroids[dim] = quant * weights[dim];
                                    }
                                }
                            }
                        }
                        ScalingLevel::Multiple => {
                            // For multiple nominal, projected centroids equal category centroids
                            projected_centroids = category_centroids.clone();
                        }
                    }

                    centroid_result.centroids.insert(
                        category.clone(),
                        vec![CentroidCategory {
                            marginal_frequency: *category_counts.get(category).unwrap_or(&0),
                            projected_centroids: Coordinates {
                                dimension: projected_centroids,
                            },
                            category_centroids: Coordinates {
                                dimension: category_centroids,
                            },
                        }]
                    );
                }
            }

            centroids_results.push(centroid_result);
        }
    }

    Ok(centroids_results)
}
