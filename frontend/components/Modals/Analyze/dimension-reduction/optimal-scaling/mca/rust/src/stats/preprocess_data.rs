use crate::models::{
    config::MCAConfig,
    data::{ AnalysisData, DataValue },
    result::ProcessingSummary,
};

use super::core::{ get_all_variables, parse_variable_weight };

/// Generates a processing summary for the MCA analysis
pub fn processing_summary(
    data: &AnalysisData,
    config: &MCAConfig
) -> Result<ProcessingSummary, String> {
    let mut total_cases = 0;
    let mut valid_cases = 0;
    let mut excluded_cases = 0;
    let mut active_cases_with_missing = 0;
    let mut supplementary_cases = 0;

    // Count total cases across all datasets
    for dataset in &data.analysis_data {
        total_cases += dataset.len();
    }

    if total_cases == 0 {
        return Err("No cases found in the data".to_string());
    }

    // Get analysis variables - parse "variable (weight)" format
    let var_names = match &config.main.analysis_vars {
        Some(vars) if !vars.is_empty() => {
            vars.iter()
                .map(|v| parse_variable_weight(v).0)
                .collect()
        }
        _ => get_all_variables(data),
    };

    // Count valid cases and cases with missing values
    for dataset in &data.analysis_data {
        for record in dataset {
            let mut is_valid = true;
            let mut has_missing = false;

            for var_name in &var_names {
                match record.values.get(var_name) {
                    Some(DataValue::Number(val)) if *val >= 1.0 => {} // Valid numeric value
                    Some(DataValue::Text(_)) => {} // Valid text value (will be discretized)
                    _ => {
                        has_missing = true;
                        if config.missing.exclude_objects {
                            is_valid = false;
                            break;
                        }
                    }
                }
            }

            if is_valid {
                valid_cases += 1;
                if has_missing {
                    active_cases_with_missing += 1;
                }
            } else {
                excluded_cases += 1;
            }
        }
    }

    // Count supplementary cases if configured
    if config.options.range_of_cases {
        if let (Some(first), Some(last)) = (config.options.first, config.options.last) {
            supplementary_cases = (last - first + 1) as usize;
            supplementary_cases = supplementary_cases.min(valid_cases); // Cap to valid cases
        }
    } else if config.options.single_case {
        if config.options.single_case_value.is_some() {
            supplementary_cases = 1;
        }
    }

    let cases_used_in_analysis = valid_cases - supplementary_cases;

    // Calculate percentages
    let valid_percent = if total_cases > 0 {
        Some(((valid_cases as f64) * 100.0) / (total_cases as f64))
    } else {
        None
    };

    let total_excluded_percent = if total_cases > 0 {
        Some(((excluded_cases as f64) * 100.0) / (total_cases as f64))
    } else {
        None
    };

    Ok(ProcessingSummary {
        valid_cases,
        excluded_cases,
        total_cases,
        valid_percent,
        missing_group_codes: None,
        missing_group_percent: None,
        missing_disc_vars: None,
        missing_disc_percent: None,
        both_missing: None,
        both_missing_percent: None,
        total_excluded_percent,
        active_cases_with_missing: Some(active_cases_with_missing),
        supplementary_cases: Some(supplementary_cases),
        cases_used_in_analysis: Some(cases_used_in_analysis),
    })
}

/// Filters valid cases from the data based on the configuration
pub fn filter_valid_cases(data: &AnalysisData, config: &MCAConfig) -> Result<AnalysisData, String> {
    // Get analysis variables - parse "variable (weight)" format
    let var_names = match &config.main.analysis_vars {
        Some(vars) if !vars.is_empty() => {
            vars.iter()
                .map(|v| parse_variable_weight(v).0)
                .collect()
        }
        _ => get_all_variables(data),
    };

    // Filter analysis data
    let mut filtered_analysis_data = Vec::new();

    for dataset in &data.analysis_data {
        let mut filtered_dataset = Vec::new();

        for record in dataset {
            let mut is_valid = true;

            for var_name in &var_names {
                match record.values.get(var_name) {
                    Some(DataValue::Number(val)) if *val >= 1.0 => {} // Valid numeric value
                    Some(DataValue::Text(_)) => {} // Valid text (will be discretized)
                    _ => {
                        if config.missing.exclude_objects {
                            is_valid = false;
                            break;
                        }
                    }
                }
            }

            if is_valid {
                filtered_dataset.push(record.clone());
            }
        }

        filtered_analysis_data.push(filtered_dataset);
    }

    // Filter supplementary data if available
    let mut filtered_supplement_data = Vec::new();

    if let Some(supp_vars) = &config.main.supple_vars {
        let supp_var_names: Vec<String> = supp_vars
            .iter()
            .map(|v| parse_variable_weight(v).0)
            .collect();

        for dataset in &data.supplement_data {
            let mut filtered_dataset = Vec::new();

            for record in dataset {
                let mut is_valid = true;

                for var_name in &supp_var_names {
                    match record.values.get(var_name) {
                        Some(DataValue::Number(val)) if *val >= 1.0 => {} // Valid numeric value
                        Some(DataValue::Text(_)) => {} // Valid text (will be discretized)
                        _ => {
                            if config.missing.exclude_objects {
                                is_valid = false;
                                break;
                            }
                        }
                    }
                }

                if is_valid {
                    filtered_dataset.push(record.clone());
                }
            }

            filtered_supplement_data.push(filtered_dataset);
        }
    } else {
        filtered_supplement_data = data.supplement_data.clone();
    }

    // Filter labeling data if available
    let filtered_labeling_data = if let Some(lab_data) = &data.labeling_data {
        let mut filtered_lab_data = Vec::new();

        if let Some(lab_vars) = &config.main.labeling_vars {
            let lab_var_names: Vec<String> = lab_vars
                .iter()
                .map(|v| parse_variable_weight(v).0)
                .collect();

            for dataset in lab_data {
                let mut filtered_dataset = Vec::new();

                for record in dataset {
                    let mut is_valid = true;

                    for var_name in &lab_var_names {
                        match record.values.get(var_name) {
                            Some(DataValue::Number(val)) if *val >= 1.0 => {} // Valid numeric value
                            Some(DataValue::Text(_)) => {} // Valid text (will be discretized)
                            _ => {
                                if config.missing.exclude_objects {
                                    is_valid = false;
                                    break;
                                }
                            }
                        }
                    }

                    if is_valid {
                        filtered_dataset.push(record.clone());
                    }
                }

                filtered_lab_data.push(filtered_dataset);
            }

            Some(filtered_lab_data)
        } else {
            data.labeling_data.clone()
        }
    } else {
        None
    };

    Ok(AnalysisData {
        analysis_data: filtered_analysis_data,
        supplement_data: filtered_supplement_data,
        labeling_data: filtered_labeling_data,
        analysis_data_defs: data.analysis_data_defs.clone(),
        supplement_data_defs: data.supplement_data_defs.clone(),
        labeling_data_defs: data.labeling_data_defs.clone(),
    })
}
