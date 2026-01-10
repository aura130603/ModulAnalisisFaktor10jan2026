use std::collections::HashMap;

use crate::models::{
    config::MCAConfig,
    data::{ AnalysisData, DataValue },
    result::ObjectPointsLabeled,
};

use super::core::{
    calculate_category_points,
    calculate_discrimination_measures,
    calculate_object_scores,
    collect_valid_categories,
    get_all_variables,
    parse_variable_weight,
};

/// Create object plots for MCA visualization
pub fn create_object_plots(
    data: &AnalysisData,
    config: &MCAConfig
) -> Result<HashMap<String, ObjectPointsLabeled>, String> {
    // Get analysis variables - parse "variable (weight)" format
    let var_names_weights: Vec<(String, f64)> = match &config.main.analysis_vars {
        Some(vars) if !vars.is_empty() => {
            vars.iter()
                .map(|v| parse_variable_weight(v))
                .collect()
        }
        _ => {
            get_all_variables(data)
                .iter()
                .map(|v| (v.clone(), 1.0))
                .collect()
        }
    };

    // Extract variable names
    let var_names: Vec<String> = var_names_weights
        .iter()
        .map(|(var, _)| var.clone())
        .collect();

    // Use the first dataset for analysis
    if data.analysis_data.is_empty() || data.analysis_data[0].is_empty() {
        return Err("No data available for analysis".to_string());
    }

    let dataset = &data.analysis_data[0];
    let p_dims = config.main.dimensions as usize;

    // Get object scores
    let object_scores_result = calculate_object_scores(data, config)?;

    // Prepare result
    let mut result = HashMap::new();

    // Create basic object plot
    if config.object_plots.object_points {
        let case_numbers = object_scores_result.case_numbers.clone();
        let dimensions = object_scores_result.dimensions.clone();
        let dimension_labels = dimensions.clone();

        // Use case numbers as labels
        let category_labels: Vec<String> = case_numbers
            .iter()
            .map(|num| num.to_string())
            .collect();

        // Copy scores
        let mut dimension_coordinates = HashMap::new();

        for dim in &dimensions {
            if let Some(scores) = object_scores_result.scores.get(dim) {
                dimension_coordinates.insert(dim.clone(), scores.clone());
            }
        }

        result.insert("object_points".to_string(), ObjectPointsLabeled {
            dimension_labels,
            case_numbers,
            category_labels,
            dimension_coordinates,
        });
    }

    // Create object plots labeled by variables if requested
    if config.object_plots.label_obj_label_by_var {
        if let Some(label_vars) = &config.object_plots.label_obj_selected_vars {
            let label_var_names: Vec<String> = label_vars
                .iter()
                .map(|v| parse_variable_weight(v).0)
                .collect();

            for label_var in label_var_names {
                // Get categories for this variable
                let categories = collect_valid_categories(dataset, &label_var);

                // Create category labels
                let mut category_labels = Vec::new();

                for (idx, case_num) in object_scores_result.case_numbers.iter().enumerate() {
                    let case_idx = (*case_num - 1) as usize;
                    if case_idx < dataset.len() {
                        if let Some(value) = dataset[case_idx].values.get(&label_var) {
                            let label = match value {
                                DataValue::Number(num) => num.to_string(),
                                DataValue::Text(text) => text.clone(),
                                DataValue::Boolean(b) => b.to_string(),
                                DataValue::Null => "Null".to_string(),
                            };
                            category_labels.push(label);
                        } else {
                            category_labels.push("Missing".to_string());
                        }
                    } else {
                        category_labels.push("Missing".to_string());
                    }
                }

                // Copy the rest from object scores
                let case_numbers = object_scores_result.case_numbers.clone();
                let dimensions = object_scores_result.dimensions.clone();
                let dimension_labels = dimensions.clone();

                let mut dimension_coordinates = HashMap::new();

                for dim in &dimensions {
                    if let Some(scores) = object_scores_result.scores.get(dim) {
                        dimension_coordinates.insert(dim.clone(), scores.clone());
                    }
                }

                // Add this plot to results
                result.insert(format!("object_points_{}", label_var), ObjectPointsLabeled {
                    dimension_labels,
                    case_numbers,
                    category_labels,
                    dimension_coordinates,
                });
            }
        }
    }

    // Create biplot if requested
    if config.object_plots.biplot {
        // Get variables to include in biplot
        let biplot_vars = if config.object_plots.bt_include_all_vars {
            var_names.clone()
        } else if config.object_plots.bt_include_selected_vars {
            match &config.object_plots.bt_selected_vars {
                Some(vars) if !vars.is_empty() => {
                    vars.iter()
                        .map(|v| parse_variable_weight(v).0)
                        .collect()
                }
                _ => var_names.clone(),
            }
        } else {
            var_names.clone()
        };

        // Get category points for these variables
        let category_points = calculate_category_points(data, config)?;

        // For each variable, create a biplot
        for var_name in &biplot_vars {
            if
                let (Some(categories), Some(coordinates)) = (
                    category_points.categories.get(var_name),
                    category_points.dimension_coordinates.get(var_name),
                )
            {
                // Combine object scores with category centroids
                let case_numbers = object_scores_result.case_numbers.clone();
                let dimensions = object_scores_result.dimensions.clone();
                let dimension_labels = dimensions.clone();

                // Use category labels for this plot
                let category_labels = categories.clone();

                // Need to restructure coordinates to match ObjectPointsLabeled format
                let mut dimension_coordinates = HashMap::new();

                for dim in &dimensions {
                    if let Some(dim_coords) = coordinates.get(dim) {
                        dimension_coordinates.insert(dim.clone(), dim_coords.clone());
                    }
                }

                // Add this biplot to results
                result.insert(format!("biplot_{}", var_name), ObjectPointsLabeled {
                    dimension_labels,
                    case_numbers: (1..=categories.len() as i32).collect(),
                    category_labels,
                    dimension_coordinates,
                });
            }
        }
    }

    Ok(result)
}

/// Create variable plots for MCA visualization
pub fn create_variable_plots(data: &AnalysisData, config: &MCAConfig) -> Result<(), String> {
    // This function prepares data for plotting, but the actual plot creation
    // would typically be handled by the frontend or visualization library

    // Check what types of plots are requested
    let category_plots_requested =
        config.variable_plots.cat_plots_var.is_some() &&
        !config.variable_plots.cat_plots_var.as_ref().unwrap().is_empty();

    let joint_category_plots_requested =
        config.variable_plots.joint_cat_plots_var.is_some() &&
        !config.variable_plots.joint_cat_plots_var.as_ref().unwrap().is_empty();

    let transformation_plots_requested =
        config.variable_plots.trans_plots_var.is_some() &&
        !config.variable_plots.trans_plots_var.as_ref().unwrap().is_empty();

    let discrimination_plots_requested =
        config.variable_plots.disc_measures_var.is_some() &&
        !config.variable_plots.disc_measures_var.as_ref().unwrap().is_empty();

    // If no plots are requested, return early
    if
        !category_plots_requested &&
        !joint_category_plots_requested &&
        !transformation_plots_requested &&
        !discrimination_plots_requested
    {
        return Ok(());
    }

    // Prepare data for requested plots

    // For category plots, we need category points
    if category_plots_requested || joint_category_plots_requested {
        let mut cat_vars = Vec::new();

        if category_plots_requested {
            // Parse variable name from "variable (weight)" format
            cat_vars.extend(
                config.variable_plots.cat_plots_var
                    .as_ref()
                    .unwrap()
                    .iter()
                    .map(|v| parse_variable_weight(v).0)
                    .collect::<Vec<String>>()
            );
        }

        if joint_category_plots_requested {
            // Parse variable name from "variable (weight)" format
            cat_vars.extend(
                config.variable_plots.joint_cat_plots_var
                    .as_ref()
                    .unwrap()
                    .iter()
                    .map(|v| parse_variable_weight(v).0)
                    .collect::<Vec<String>>()
            );
        }

        // Get category points for these variables
        let category_points = calculate_category_points(data, config)?;

        // The data is now prepared and can be passed to a plotting library
        // For this Rust implementation, we'll just return success
    }

    // For transformation plots, we need original and transformed values
    if transformation_plots_requested {
        // Get variables for transformation plots
        let trans_vars: Vec<String> = config.variable_plots.trans_plots_var
            .as_ref()
            .unwrap()
            .iter()
            .map(|v| parse_variable_weight(v).0)
            .collect();

        // Calculate transformed values (would be used in actual plot implementation)
        let object_scores = calculate_object_scores(data, config)?;

        // The data is now prepared and can be passed to a plotting library
    }

    // For discrimination measure plots, we need discrimination measures
    if discrimination_plots_requested {
        // Parse variable name from "variable (weight)" format
        let disc_vars: Vec<String> = config.variable_plots.disc_measures_var
            .as_ref()
            .unwrap()
            .iter()
            .map(|v| parse_variable_weight(v).0)
            .collect();

        // Calculate discrimination measures
        let discrimination_measures = calculate_discrimination_measures(data, config)?;

        // The data is now prepared and can be passed to a plotting library
    }

    Ok(())
}
