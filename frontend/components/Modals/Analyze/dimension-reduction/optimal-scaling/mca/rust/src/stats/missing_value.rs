use rand::Rng;

use crate::models::{ config::MCAConfig, data::{ AnalysisData, DataRecord, DataValue } };

use super::core::{
    calculate_mode,
    collect_valid_categories,
    find_max_category,
    is_missing,
    parse_missing_value_strategy,
};

/// Handles missing values according to the configuration
pub fn handle_missing_values(
    data: &AnalysisData,
    config: &MCAConfig
) -> Result<AnalysisData, String> {
    // Create a copy of the data
    let mut processed_data = data.clone();

    // Check for "ExcludeObjects" in analysis_variables
    let exclude_objects = match &config.missing.analysis_variables {
        Some(vars) => vars.iter().any(|v| v == "ExcludeObjects"),
        None => false,
    };

    // Get analysis variables with missing strategy
    let missing_strategies = match &config.missing.analysis_variables {
        Some(vars) if !vars.is_empty() => {
            vars.iter()
                .filter(|v| *v != "ExcludeObjects")
                .map(|v| parse_missing_value_strategy(v))
                .collect::<Vec<(String, String)>>()
        }
        _ => Vec::new(),
    };

    if missing_strategies.is_empty() && !exclude_objects {
        return Ok(processed_data);
    }

    // Process each dataset
    for dataset_idx in 0..processed_data.analysis_data.len() {
        let dataset = &mut processed_data.analysis_data[dataset_idx];

        // Process each variable with its specific missing strategy
        for (var_name, strategy) in &missing_strategies {
            match strategy.as_str() {
                "Exclude-Mode" => {
                    // Passive treatment - mark for post-processing
                    // (In MCA this means objects with missing values don't contribute to the solution for this variable)
                    continue;
                }
                "Exclude-Extra" => {
                    // Passive treatment with extra category for missing
                    continue;
                }
                "Exclude-Random" => {
                    // Passive treatment with random imputation
                    continue;
                }
                "Impute-Mode" => {
                    // Active treatment - impute missing values with mode
                    let mode = calculate_mode(dataset, var_name);

                    for record in dataset.iter_mut() {
                        if let Some(value) = record.values.get(var_name) {
                            if is_missing(value) {
                                if let Some(mode_val) = mode.clone() {
                                    record.values.insert(var_name.clone(), mode_val);
                                }
                            }
                        }
                    }
                }
                "Impute-Extra" => {
                    // Active treatment - impute missing values with extra category
                    // Find max category and add 1
                    let max_cat = find_max_category(dataset, var_name);
                    let extra_cat = max_cat + 1.0;

                    for record in dataset.iter_mut() {
                        if let Some(value) = record.values.get(var_name) {
                            if is_missing(value) {
                                record.values.insert(
                                    var_name.clone(),
                                    DataValue::Number(extra_cat)
                                );
                            }
                        }
                    }
                }
                "Impute-Random" => {
                    // Active treatment - impute missing values with random category
                    let categories = collect_valid_categories(dataset, var_name);
                    if !categories.is_empty() {
                        let mut rng = rand::thread_rng();

                        for record in dataset.iter_mut() {
                            if let Some(value) = record.values.get(var_name) {
                                if is_missing(value) {
                                    let random_idx = rng.gen_range(0..categories.len());
                                    record.values.insert(
                                        var_name.clone(),
                                        categories[random_idx].clone()
                                    );
                                }
                            }
                        }
                    }
                }
                _ => {
                    // Default to passive treatment if strategy not recognized
                    continue;
                }
            }
        }
    }

    // If listwise deletion (ExcludeObjects) is required, remove records with any missing values
    if exclude_objects {
        let var_names: Vec<String> = missing_strategies
            .iter()
            .map(|(var, _)| var.clone())
            .collect();

        for dataset_idx in 0..processed_data.analysis_data.len() {
            let dataset = &mut processed_data.analysis_data[dataset_idx];

            // Filter records
            let filtered_records: Vec<DataRecord> = dataset
                .iter()
                .filter(|record| {
                    // Check if the record has missing values in any of the analysis variables
                    !var_names.iter().any(|var_name| {
                        match record.values.get(var_name) {
                            Some(value) => is_missing(value),
                            None => true, // Missing variable counts as missing value
                        }
                    })
                })
                .cloned()
                .collect();

            *dataset = filtered_records;
        }
    }

    Ok(processed_data)
}
