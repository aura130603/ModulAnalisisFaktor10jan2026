use std::collections::HashMap;

use crate::models::{ config::ROCCurveConfig, data::AnalysisData, result::RocCoordinate };

use super::core::{ calculate_confusion_matrix, extract_values, generate_cutoffs };

pub fn calculate_roc_coordinates(
    data: &AnalysisData,
    config: &ROCCurveConfig
) -> Result<HashMap<String, Vec<RocCoordinate>>, String> {
    if config.main.test_target_variable.is_none() {
        return Err("Test target variables are not specified".to_string());
    }
    let test_target_vars = config.main.test_target_variable.as_ref().unwrap();

    if test_target_vars.is_empty() {
        return Err("No test target variables specified".to_string());
    }

    let mut coordinates_map: HashMap<String, Vec<RocCoordinate>> = HashMap::new();

    for test_var in test_target_vars {
        let var_coordinates = calculate_roc_coordinates_for_variable(data, config, test_var)?;
        coordinates_map.insert(test_var.clone(), var_coordinates);
    }

    Ok(coordinates_map)
}

pub fn calculate_roc_coordinates_for_variable(
    data: &AnalysisData,
    config: &ROCCurveConfig,
    test_var: &str
) -> Result<Vec<RocCoordinate>, String> {
    let (positive_values, negative_values) = extract_values(data, config, test_var)?;
    calculate_roc_coordinates_from_values(&positive_values, &negative_values, config)
}

pub fn calculate_roc_coordinates_from_values(
    positive_values: &[f64],
    negative_values: &[f64],
    config: &ROCCurveConfig
) -> Result<Vec<RocCoordinate>, String> {
    let cutoffs = generate_cutoffs(positive_values, negative_values);
    let mut coordinates = Vec::new();

    for cutoff in cutoffs {
        let (tp, fn_count, tn, fp) = calculate_confusion_matrix(
            positive_values,
            negative_values,
            cutoff,
            config
        );

        let sensitivity = if tp + fn_count > 0 {
            (tp as f64) / ((tp + fn_count) as f64)
        } else {
            0.0
        };
        let specificity = if tn + fp > 0 { (tn as f64) / ((tn + fp) as f64) } else { 0.0 };

        coordinates.push(RocCoordinate {
            positive_if_greater_than: cutoff,
            sensitivity,
            one_minus_specificity: 1.0 - specificity,
        });
    }

    Ok(coordinates)
}
