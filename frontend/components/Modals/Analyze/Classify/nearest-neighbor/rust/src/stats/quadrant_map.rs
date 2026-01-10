use std::collections::{ HashMap, HashSet };

use crate::models::{
    config::KnnConfig,
    data::AnalysisData,
    result::{ NeighborDetail, QuadrantMap, FocalNeighborSet },
};

use super::core::{ calculate_feature_weights, find_k_nearest_neighbors, preprocess_knn_data };

// Calculate quadrant map
pub fn calculate_quadrant_map(
    data: &AnalysisData,
    config: &KnnConfig
) -> Result<QuadrantMap, String> {
    // Preprocess data for quadrant map
    let knn_data = preprocess_knn_data(data, config)?;

    // Determine k value
    let k = if config.neighbors.specify {
        config.neighbors.specify_k as usize
    } else if config.neighbors.auto_selection {
        config.neighbors.min_k as usize
    } else {
        3 // Default k value
    };

    // Determine focal indices based on focal_case_iden_var
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

    let use_euclidean = config.neighbors.metric_eucli;
    let weights = calculate_feature_weights(&knn_data, config);
    let mut focal_neighbor_sets = Vec::new();

    // Combine training and holdout indices for finding neighbors
    let mut all_candidate_indices = Vec::new();
    all_candidate_indices.extend_from_slice(&knn_data.training_indices);
    all_candidate_indices.extend_from_slice(&knn_data.holdout_indices);
    all_candidate_indices.sort();
    all_candidate_indices.dedup();

    // Process each focal point
    for &focal_idx in &focal_indices {
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
        let mut neighbor_details = Vec::new();
        let mut distances = Vec::new();

        for (idx, distance) in neighbors {
            let neighbor_id = knn_data.case_identifiers[idx];
            neighbor_details.push(NeighborDetail {
                id: neighbor_id,
                distance,
            });
            distances.push(distance);
        }

        // Add this focal point and its neighbors to the collection
        focal_neighbor_sets.push(FocalNeighborSet {
            focal_record,
            neighbors: neighbor_details,
            distances,
        });
    }

    // Create feature map
    let mut features = HashMap::new();

    // Process each feature
    for feature in &knn_data.features {
        features.insert(feature.clone(), Vec::new());
    }

    // Add target variable if available
    if let Some(dep_var) = &config.main.dep_var {
        features.insert(dep_var.clone(), Vec::new());
    }

    Ok(QuadrantMap {
        focal_neighbor_sets,
        features,
    })
}
