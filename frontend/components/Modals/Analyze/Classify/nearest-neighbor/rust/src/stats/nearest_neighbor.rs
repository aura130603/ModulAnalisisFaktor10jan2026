use std::collections::HashSet;

use crate::models::{
    config::KnnConfig,
    data::AnalysisData,
    result::{ NearestNeighbors, NeighborDetail, FocalNeighborSet },
};

use super::core::{
    calculate_feature_weights,
    determine_k_value,
    find_k_nearest_neighbors,
    perform_cross_validation,
    preprocess_knn_data,
};

/// Calculates nearest neighbors for the whole dataset
pub fn calculate_nearest_neighbors(
    data: &AnalysisData,
    config: &KnnConfig
) -> Result<NearestNeighbors, String> {
    // Preprocess data
    let knn_data = preprocess_knn_data(data, config)?;

    // Get focal case info
    let focal_indices = if
        !knn_data.focal_indices.is_empty() &&
        config.main.focal_case_iden_var.is_some()
    {
        // If focal_case_iden_var is provided, use the focal indices from knn_data
        knn_data.focal_indices.clone()
    } else {
        // Otherwise, use all indices (not just training indices)
        let mut all_indices = Vec::new();
        for i in 0..knn_data.data_matrix.len() {
            all_indices.push(i);
        }
        all_indices
    };

    if focal_indices.is_empty() {
        return Err("No focal cases found".to_string());
    }

    // Determine k value - use auto-selection if specified
    let k = if config.neighbors.auto_selection && !config.neighbors.specify {
        perform_cross_validation(&knn_data, config)?
    } else {
        determine_k_value(config)
    };

    let use_euclidean = config.neighbors.metric_eucli;

    // Get feature weights if enabled
    let weights = calculate_feature_weights(&knn_data, config);

    // Combine training and holdout indices for finding neighbors
    let mut all_candidate_indices = Vec::new();
    all_candidate_indices.extend_from_slice(&knn_data.training_indices);
    all_candidate_indices.extend_from_slice(&knn_data.holdout_indices);
    all_candidate_indices.sort();
    all_candidate_indices.dedup();

    // Process each focal point and find their neighbors
    let focal_neighbor_sets = focal_indices
        .iter()
        .map(|&focal_idx| {
            let focal_record = knn_data.case_identifiers[focal_idx];

            // Filter out any index that has the same case identifier as the focal record
            let candidate_indices: Vec<usize> = all_candidate_indices
                .iter()
                .filter(|&&idx| knn_data.case_identifiers[idx] != focal_record)
                .copied()
                .collect();

            // Find k nearest neighbors to this focal case
            let neighbors = find_k_nearest_neighbors(
                &knn_data.data_matrix[focal_idx],
                &knn_data.data_matrix,
                &candidate_indices,
                k,
                use_euclidean,
                weights.as_deref()
            );

            // Create neighbor details
            let mut neighbor_details = Vec::with_capacity(neighbors.len());
            let mut distances = Vec::with_capacity(neighbors.len());

            for (idx, distance) in neighbors {
                let neighbor_id = knn_data.case_identifiers[idx];
                neighbor_details.push(NeighborDetail {
                    id: neighbor_id,
                    distance,
                });
                distances.push(distance);
            }

            // Return this focal point and its neighbors
            FocalNeighborSet {
                focal_record,
                neighbors: neighbor_details,
                distances,
            }
        })
        .collect();

    Ok(NearestNeighbors {
        focal_neighbor_sets,
    })
}
