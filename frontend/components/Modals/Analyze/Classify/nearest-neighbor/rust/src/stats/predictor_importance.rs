use std::collections::HashMap;

use crate::models::{ config::KnnConfig, data::AnalysisData, result::PredictorImportance };

use super::core::{ calculate_knn_error, determine_k_value, preprocess_knn_data };

pub fn calculate_predictor_importance(
    data: &AnalysisData,
    config: &KnnConfig
) -> Result<PredictorImportance, String> {
    // Check if we have a target variable - required for predictor importance
    let dep_var = config.main.dep_var
        .as_ref()
        .ok_or_else(||
            "A target variable is required for calculating predictor importance".to_string()
        )?;

    // Preprocess data
    let knn_data = preprocess_knn_data(data, config)?;

    // Determine k value
    let k = determine_k_value(config);
    let use_euclidean = config.neighbors.metric_eucli;

    // Calculate baseline error with all features
    let baseline_error = calculate_knn_error(
        &knn_data,
        k,
        use_euclidean,
        None,
        None,
        config.neighbors.predictions_median
    )?;

    // Calculate error when each feature is removed
    let mut importance_values = Vec::with_capacity(knn_data.features.len());
    let n_features = knn_data.features.len();

    for feature_idx in 0..n_features {
        // Create a list of indices to exclude this feature
        let excluded_features = vec![feature_idx];

        // Calculate error without this feature
        let feature_error = calculate_knn_error(
            &knn_data,
            k,
            use_euclidean,
            Some(&excluded_features),
            None,
            config.neighbors.predictions_median
        )?;

        // Calculate importance according to the formula:
        // FI(p) = e(p) + 1/m
        // where e(p) is the error ratio when feature p is removed,
        // and m is the number of features
        let error_ratio = if baseline_error > 0.0 { feature_error / baseline_error } else { 1.0 };

        let importance = error_ratio + 1.0 / (n_features as f64);
        importance_values.push((knn_data.features[feature_idx].clone(), importance));
    }

    // Normalize importance values
    let sum: f64 = importance_values
        .iter()
        .map(|(_, v)| *v)
        .sum();

    let mut predictors = HashMap::new();
    if sum > 0.0 {
        for (name, value) in importance_values {
            predictors.insert(name, value / sum);
        }
    } else {
        // Equal importance if sum is zero
        let equal_importance = 1.0 / (n_features as f64);
        for name in knn_data.features.iter() {
            predictors.insert(name.clone(), equal_importance);
        }
    }

    Ok(PredictorImportance {
        predictors,
        target: dep_var.clone(),
    })
}
