use std::collections::HashMap;

use crate::models::{
    config::OVERALSAnalysisConfig,
    data::{ AnalysisData, DataRecord, DataValue, VariableDefinition, VariableMeasure },
    result::{ CaseProcessingSummary, ScalingLevel, VariableInfo },
};

use super::core::{ get_set_defs, get_var_def };

/// Prepare data for OVERALS analysis by filtering out invalid cases
/// Prepare data for OVERALS analysis by filtering out invalid cases
pub fn prepare_data(
    data: &AnalysisData,
    _config: &OVERALSAnalysisConfig
) -> Result<AnalysisData, String> {
    // Create a copy of the original data
    let mut prepared_data = data.clone();

    // Get the number of cases
    let num_cases = data.set_target_data
        .first()
        .and_then(|set| set.first())
        .map_or(0, |var| var.len());

    if num_cases == 0 {
        return Err("No cases found in data".to_string());
    }

    // Keep track of valid cases for each set
    let mut valid_cases_per_set = Vec::with_capacity(data.set_target_data.len());

    // Process each set
    for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
        let mut valid_cases = vec![true; num_cases];

        // Check each variable in this set
        for (var_idx, var_data) in set_data.iter().enumerate() {
            // Get variable definition using helper function
            if let Ok(var_def) = get_var_def(data, set_idx, var_idx) {
                let var_name = &var_def.name;

                // Check each case for this variable
                for (case_idx, record) in var_data.iter().enumerate() {
                    if let Some(value) = record.values.get(var_name) {
                        match value {
                            DataValue::Number(num) => {
                                // OVERALS requires positive integers
                                if *num <= 0.0 || (*num - num.floor()).abs() > 1e-10 {
                                    valid_cases[case_idx] = false;
                                }
                            }
                            // Non-numeric values are considered invalid
                            _ => {
                                valid_cases[case_idx] = false;
                            }
                        }
                    } else {
                        // Variable not found in record
                        valid_cases[case_idx] = false;
                    }
                }
            } else {
                // Variable definition not found - mark all cases as invalid for this variable
                for case_idx in 0..num_cases {
                    valid_cases[case_idx] = false;
                }
            }
        }

        valid_cases_per_set.push(valid_cases);
    }

    // Apply listwise deletion per set
    for (set_idx, set_data) in prepared_data.set_target_data.iter_mut().enumerate() {
        if let Some(valid_cases) = valid_cases_per_set.get(set_idx) {
            for var_data in set_data.iter_mut() {
                // Keep only valid cases
                *var_data = var_data
                    .iter()
                    .enumerate()
                    .filter_map(|(idx, record)| {
                        if valid_cases[idx] { Some(record.clone()) } else { None }
                    })
                    .collect();
            }
        }
    }

    Ok(prepared_data)
}

pub fn calculate_case_processing_summary(
    data: &AnalysisData,
    _config: &OVERALSAnalysisConfig
) -> Result<CaseProcessingSummary, String> {
    let total_cases = data.set_target_data
        .first()
        .and_then(|set| set.first())
        .map_or(0, |var| var.len());
    web_sys::console::log_1(&format!("Total Cases: {}", total_cases).into());

    if total_cases == 0 {
        return Err("No cases found in data".to_string());
    }

    // Log data structure information
    web_sys::console::log_1(&format!("Number of sets: {}", data.set_target_data.len()).into());
    web_sys::console::log_1(
        &format!("Number of set defs: {}", data.set_target_data_defs.len()).into()
    );

    // In OVERALS, a case is excluded if any variable in a set has missing data (listwise deletion per set)
    let mut excluded_cases = Vec::new();

    for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
        web_sys::console::log_1(&format!("Processing set {}", set_idx).into());

        // Check if set_idx is valid for set_target_data_defs
        if set_idx >= data.set_target_data_defs.len() {
            web_sys::console::log_1(
                &"Error: set_idx out of bounds for set_target_data_defs".into()
            );
            return Err(
                format!(
                    "Set index {} is out of bounds for set_target_data_defs (len: {})",
                    set_idx,
                    data.set_target_data_defs.len()
                )
            );
        }

        // Get flattened variable definitions for this set
        let set_defs = get_set_defs(data, set_idx);
        web_sys::console::log_1(
            &format!("Set {} has {} variables", set_idx, set_data.len()).into()
        );

        for case_idx in 0..total_cases {
            // Skip already excluded cases for efficiency
            if excluded_cases.contains(&case_idx) {
                continue;
            }

            let mut case_valid = true;

            // Check each variable in this set for this case
            for (var_idx, var_data) in set_data.iter().enumerate() {
                // Check if var_idx is valid for set_defs
                if var_idx >= set_defs.len() {
                    web_sys::console::log_1(
                        &format!(
                            "Error: var_idx {} out of bounds for set_defs (len: {})",
                            var_idx,
                            set_defs.len()
                        ).into()
                    );
                    case_valid = false;
                    break;
                }

                if case_idx >= var_data.len() {
                    // Case index out of bounds
                    case_valid = false;
                    break;
                }

                let record = &var_data[case_idx];
                let var_name = &set_defs[var_idx].name;

                // Check if this variable has a valid value for this case
                match record.values.get(var_name) {
                    Some(DataValue::Number(n)) if *n > 0.0 && (*n - n.floor()).abs() <= 1e-10 => {
                        // Value is valid, continue checking
                    }
                    _ => {
                        // Value is missing or invalid
                        case_valid = false;
                        break;
                    }
                }
            }

            if !case_valid && !excluded_cases.contains(&case_idx) {
                excluded_cases.push(case_idx);
            }
        }
    }

    // Break up the excluded cases logging to avoid complex debug formatting
    web_sys::console::log_1(&format!("Number of excluded cases: {}", excluded_cases.len()).into());

    // Log first few excluded cases if any exist
    if !excluded_cases.is_empty() {
        let sample = excluded_cases
            .iter()
            .take(5)
            .map(|&i| i.to_string())
            .collect::<Vec<_>>()
            .join(", ");
        web_sys::console::log_1(&format!("Sample excluded cases: {}", sample).into());
    }

    let cases_used = total_cases - excluded_cases.len();
    web_sys::console::log_1(&format!("Cases used: {}", cases_used).into());

    Ok(CaseProcessingSummary {
        cases_used_in_analysis: cases_used,
        total_cases,
    })
}

/// Process variables information for OVERALS analysis
pub fn process_variables(
    data: &AnalysisData,
    config: &OVERALSAnalysisConfig
) -> Result<Vec<VariableInfo>, String> {
    let mut result = Vec::new();

    // Process each set
    for (set_idx, set_groups) in data.set_target_data_defs.iter().enumerate() {
        let mut var_info = VariableInfo {
            set: format!("Set {}", set_idx + 1),
            variable_name: Vec::new(),
            num_categories: Vec::new(),
            optimal_scaling_level: Vec::new(),
        };

        // Process each group in the set
        for group_defs in set_groups {
            // Process each variable in the group
            for var_def in group_defs {
                var_info.variable_name.push(var_def.name.clone());

                // Count categories by analyzing data
                let categories = count_categories_for_var(data, set_idx, &var_def.name);
                var_info.num_categories.push(categories.len());

                // Determine optimal scaling level
                let scaling_level = determine_scaling_level(var_def, config);
                var_info.optimal_scaling_level.push(scaling_level);
            }
        }

        result.push(var_info);
    }

    Ok(result)
}

/// Count unique categories for a variable
pub fn count_categories(var_data: &[Vec<DataRecord>], var_name: &str) -> HashMap<String, bool> {
    let mut categories = HashMap::new();

    for records in var_data {
        for record in records {
            if let Some(value) = record.values.get(var_name) {
                match value {
                    DataValue::Number(num) => {
                        // In OVERALS, data must be positive integers
                        if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                            categories.insert(num.to_string(), true);
                        }
                    }
                    DataValue::Text(text) => {
                        if let Ok(num) = text.parse::<f64>() {
                            if num > 0.0 && (num - num.floor()).abs() < 1e-10 {
                                categories.insert(text.clone(), true);
                            }
                        }
                    }
                    _ => {}
                }
            }
        }
    }

    categories
}

fn count_categories_for_var(
    data: &AnalysisData,
    set_idx: usize,
    var_name: &str
) -> HashMap<String, bool> {
    let mut categories = HashMap::new();

    if let Some(set_data) = data.set_target_data.get(set_idx) {
        for var_data in set_data {
            for record in var_data {
                if let Some(value) = record.values.get(var_name) {
                    match value {
                        DataValue::Number(num) => {
                            if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                                categories.insert(num.to_string(), true);
                            }
                        }
                        DataValue::Text(text) => {
                            if let Ok(num) = text.parse::<f64>() {
                                if num > 0.0 && (num - num.floor()).abs() < 1e-10 {
                                    categories.insert(text.clone(), true);
                                }
                            }
                        }
                        _ => {}
                    }
                }
            }
        }
    }

    categories
}

/// Parse the scaling level and range from a variable name pattern
pub fn parse_variable_scaling_info(
    var_pattern: &str
) -> Result<(String, ScalingLevel, usize, usize), String> {
    // Split variable name and scaling info
    let parts: Vec<&str> = var_pattern.split('(').collect();
    if parts.len() != 2 {
        return Err(format!("Invalid variable pattern: '{}'", var_pattern));
    }

    let var_name = parts[0].trim().to_string();
    let scaling_info = parts[1].trim().trim_end_matches(')');
    let mut all_parts: Vec<&str> = scaling_info.split_whitespace().collect();

    if all_parts.len() < 3 {
        return Err(format!("Invalid scaling info format: '{}'", scaling_info));
    }

    // Pop max and min from the end
    let max_str = all_parts.pop().unwrap();
    let min_str = all_parts.pop().unwrap();

    // Remaining is scaling level
    let scaling_level_str = all_parts.join(" ").to_lowercase();

    let scaling_level = match scaling_level_str.as_str() {
        "ordinal" => ScalingLevel::Ordinal,
        "single nominal" => ScalingLevel::Single,
        "multiple nominal" => ScalingLevel::Multiple,
        "discrete numeric" => ScalingLevel::Discrete,
        _ => {
            return Err(format!("Unknown scaling level: '{}'", scaling_level_str));
        }
    };

    // Parse min and max
    let min = min_str
        .parse::<usize>()
        .map_err(|_| format!("Invalid minimum value: '{}'", min_str))?;
    let max = max_str
        .parse::<usize>()
        .map_err(|_| format!("Invalid maximum value: '{}'", max_str))?;

    Ok((var_name, scaling_level, min, max))
}

/// Determine the scaling level for a variable
pub fn determine_scaling_level(
    var_def: &VariableDefinition,
    config: &OVERALSAnalysisConfig
) -> ScalingLevel {
    // Look for the variable in the SetTargetVariable configuration
    if let Some(sets) = &config.main.set_target_variable {
        for set in sets {
            for var_pattern in set {
                if
                    let Ok((var_name, scaling_level, _, _)) =
                        parse_variable_scaling_info(var_pattern)
                {
                    if var_name == var_def.name {
                        return scaling_level;
                    }
                }
            }
        }
    }

    // Fallback to measure type if not found in config
    match var_def.measure {
        VariableMeasure::Nominal => ScalingLevel::Single,
        VariableMeasure::Ordinal => ScalingLevel::Ordinal,
        VariableMeasure::Scale => ScalingLevel::Discrete,
        _ => ScalingLevel::Ordinal, // Default
    }
}
