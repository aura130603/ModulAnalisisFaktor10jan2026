use nalgebra::DMatrix;
use rand_mt::Mt64;
use std::cmp::Ordering;
use std::collections::HashMap;

use crate::models::{ config::KnnConfig, data::{ DataValue, KnnData } };

/// Normalizes features using adjusted normalization to range [-1, 1]
/// Uses nalgebra for more efficient matrix operations
pub fn normalize_features(data_matrix: &mut Vec<Vec<f64>>) {
    if data_matrix.is_empty() {
        return;
    }

    let n_rows = data_matrix.len();
    let n_features = data_matrix[0].len();

    // Create DMatrix for more efficient calculations
    let mut matrix = DMatrix::zeros(n_rows, n_features);
    for i in 0..n_rows {
        for j in 0..n_features {
            if j < data_matrix[i].len() {
                matrix[(i, j)] = data_matrix[i][j];
            }
        }
    }

    // Perform column-wise min/max calculations
    for j in 0..n_features {
        let col = matrix.column(j);
        let min_val = col.min();
        let max_val = col.max();

        // Skip normalization if no range
        if (max_val - min_val).abs() < f64::EPSILON {
            continue;
        }

        // Apply normalization formula: [2*(x-min)/(max-min)]-1
        for i in 0..n_rows {
            if j < data_matrix[i].len() {
                data_matrix[i][j] =
                    (2.0 * (data_matrix[i][j] - min_val)) / (max_val - min_val) - 1.0;
            }
        }
    }
}

/// Splits data into training and holdout sets
pub fn split_training_holdout(
    total_cases: usize,
    training_percent: i32,
    use_seed: bool,
    seed: Option<i64>
) -> (Vec<usize>, Vec<usize>) {
    let training_size = (
        ((total_cases as f64) * (training_percent as f64)) /
        100.0
    ).round() as usize;

    // Create indices
    let mut indices: Vec<usize> = (0..total_cases).collect();

    // Shuffle indices if random assignment
    if use_seed {
        let mut rng = match seed {
            Some(s) => Mt64::new(s as u64),
            None => Mt64::new(rand::random::<u64>()),
        };

        // Fisher-Yates shuffle
        for i in (1..indices.len()).rev() {
            let j = (rng.next_u64() % ((i + 1) as u64)) as usize;
            indices.swap(i, j);
        }
    }

    // Split into training and holdout
    let (training_indices, holdout_indices) = indices.split_at(training_size);
    (training_indices.to_vec(), holdout_indices.to_vec())
}

/// Calculates distance between two points using specified metric
/// Returns a single function for calculating distances instead of two separate functions
pub fn calculate_distance(
    point1: &[f64],
    point2: &[f64],
    use_euclidean: bool,
    feature_weights: Option<&[f64]>
) -> f64 {
    let min_len = point1.len().min(point2.len());

    if use_euclidean {
        // Euclidean distance
        let sum_squared = (0..min_len)
            .map(|i| {
                let diff = point1[i] - point2[i];
                let weight = feature_weights.and_then(|w| w.get(i).copied()).unwrap_or(1.0);
                weight * diff * diff
            })
            .sum::<f64>();

        sum_squared.sqrt()
    } else {
        // Manhattan distance
        (0..min_len)
            .map(|i| {
                let diff = (point1[i] - point2[i]).abs();
                let weight = feature_weights.and_then(|w| w.get(i).copied()).unwrap_or(1.0);
                weight * diff
            })
            .sum()
    }
}

/// Finds k nearest neighbors for a query point
pub fn find_k_nearest_neighbors(
    query_point: &[f64],
    data_matrix: &[Vec<f64>],
    indices: &[usize],
    k: usize,
    use_euclidean: bool,
    feature_weights: Option<&[f64]>
) -> Vec<(usize, f64)> {
    // Calculate distances from query point to all points in the dataset
    let mut distances: Vec<(usize, f64)> = indices
        .iter()
        .filter_map(|&idx| {
            if idx < data_matrix.len() {
                let distance = calculate_distance(
                    query_point,
                    &data_matrix[idx],
                    use_euclidean,
                    feature_weights
                );
                Some((idx, distance))
            } else {
                None
            }
        })
        .collect();

    // Sort by distance - use partial_cmp with a fallback for NaN values
    distances.sort_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(Ordering::Equal));

    // Return k nearest
    distances.into_iter().take(k).collect()
}

/// Calculate error rate for KNN model
pub fn calculate_knn_error(
    knn_data: &KnnData,
    k: usize,
    use_euclidean: bool,
    excluded_features: Option<&[usize]>,
    weights: Option<&[f64]>,
    use_median: bool // Added parameter to replace config.neighbors.predictions_median
) -> Result<f64, String> {
    // Check if we have target values - required for error calculation
    if
        knn_data.target_values.is_empty() ||
        knn_data.target_values.iter().all(|v| matches!(v, DataValue::Null))
    {
        return Err("Target values are required for error calculation".to_string());
    }

    // Determine if target is categorical
    let target_is_categorical = knn_data.target_values
        .iter()
        .all(|v| { matches!(v, DataValue::Text(_) | DataValue::Boolean(_)) });

    // Create category mapping if categorical
    let mut category_map = HashMap::new();

    if target_is_categorical {
        for value in &knn_data.target_values {
            let category = match value {
                DataValue::Text(s) => s.clone(),
                DataValue::Boolean(b) => b.to_string(),
                _ => {
                    continue;
                }
            };

            category_map
                .clone()
                .entry(category)
                .or_insert_with(|| category_map.len());
        }
    }

    let n_categories = category_map.len();
    let mut total_error = 0.0;
    let mut total_cases = 0;

    // Prepare data matrix with excluded features
    let modified_data = prepare_data_with_excluded_features(
        &knn_data.data_matrix,
        excluded_features
    );

    // Cross-validation approach for error calculation
    for (idx, point) in knn_data.data_matrix.iter().enumerate() {
        // Skip if not in training set
        if !knn_data.training_indices.contains(&idx) {
            continue;
        }

        // Prepare point with excluded features
        let modified_point = prepare_point_with_excluded_features(point, excluded_features);

        // Find k nearest neighbors excluding self
        let train_indices: Vec<usize> = knn_data.training_indices
            .iter()
            .filter(|&&i| i != idx)
            .copied()
            .collect();

        let neighbors = find_k_nearest_neighbors(
            &modified_point,
            &modified_data,
            &train_indices,
            k,
            use_euclidean,
            weights
        );

        // Calculate error based on target type
        if target_is_categorical {
            // Classification case
            total_error += calculate_classification_error(
                idx,
                &neighbors,
                &knn_data.target_values,
                &category_map,
                n_categories
            );
        } else {
            // Regression case
            total_error += calculate_regression_error(
                idx,
                &neighbors,
                &knn_data.target_values,
                use_median
            );
        }

        total_cases += 1;
    }

    // Calculate error rate or mean squared error
    if total_cases > 0 {
        Ok(total_error / (total_cases as f64))
    } else {
        Ok(0.0)
    }
}

/// Helper function to prepare data with excluded features
fn prepare_data_with_excluded_features(
    data_matrix: &[Vec<f64>],
    excluded_features: Option<&[usize]>
) -> Vec<Vec<f64>> {
    data_matrix
        .iter()
        .map(|row| prepare_point_with_excluded_features(row, excluded_features))
        .collect()
}

/// Helper function to prepare a point with excluded features
fn prepare_point_with_excluded_features(
    point: &[f64],
    excluded_features: Option<&[usize]>
) -> Vec<f64> {
    match excluded_features {
        Some(excluded) =>
            point
                .iter()
                .enumerate()
                .filter_map(|(j, &val)| if excluded.contains(&j) { None } else { Some(val) })
                .collect(),
        None => point.to_vec(),
    }
}

/// Helper function to calculate classification error
fn calculate_classification_error(
    idx: usize,
    neighbors: &[(usize, f64)],
    target_values: &[DataValue],
    category_map: &HashMap<String, usize>,
    n_categories: usize
) -> f64 {
    // Get actual category
    let actual_value = &target_values[idx];
    let actual_cat = match actual_value {
        DataValue::Text(s) => category_map.get(s),
        DataValue::Boolean(b) => category_map.get(&b.to_string()),
        _ => {
            return 0.0;
        }
    };

    if let Some(&actual_cat_idx) = actual_cat {
        // Predict category by majority vote
        let mut vote_counts = vec![0; n_categories];

        for &(neighbor_idx, _) in neighbors {
            let neighbor_value = &target_values[neighbor_idx];
            let neighbor_cat = match neighbor_value {
                DataValue::Text(s) => category_map.get(s),
                DataValue::Boolean(b) => category_map.get(&b.to_string()),
                _ => {
                    continue;
                }
            };

            if let Some(&cat_idx) = neighbor_cat {
                vote_counts[cat_idx] += 1;
            }
        }

        // Find predicted category (max votes)
        if
            let Some((predicted_cat, _)) = vote_counts
                .iter()
                .enumerate()
                .max_by_key(|&(_, count)| count)
        {
            // Return 1.0 for error, 0.0 for correct
            if predicted_cat != actual_cat_idx {
                1.0
            } else {
                0.0
            }
        } else {
            0.0
        }
    } else {
        0.0
    }
}

/// Helper function to calculate regression error
fn calculate_regression_error(
    idx: usize,
    neighbors: &[(usize, f64)],
    target_values: &[DataValue],
    use_median: bool
) -> f64 {
    // Get actual value
    let actual_value = match &target_values[idx] {
        DataValue::Number(n) => *n,
        _ => {
            return 0.0;
        }
    };

    // Get numeric values from neighbors
    let values: Vec<f64> = neighbors
        .iter()
        .filter_map(|&(neighbor_idx, _)| {
            match target_values[neighbor_idx] {
                DataValue::Number(val) => Some(val),
                _ => None,
            }
        })
        .collect();

    if values.is_empty() {
        return 0.0;
    }

    let predicted = if use_median {
        // For median prediction
        let mut sorted_values = values.clone();
        sorted_values.sort_by(|a, b| a.partial_cmp(b).unwrap_or(Ordering::Equal));

        let n = sorted_values.len();
        if n % 2 == 1 {
            // Odd number - return middle value
            sorted_values[n / 2]
        } else {
            // Even number - return average of two middle values
            (sorted_values[n / 2 - 1] + sorted_values[n / 2]) / 2.0
        }
    } else {
        // For mean prediction
        values.iter().sum::<f64>() / (values.len() as f64)
    };

    // Return squared error
    (actual_value - predicted).powi(2)
}

// Retained for backwards compatibility
pub fn calculate_euclidean_distance(
    point1: &[f64],
    point2: &[f64],
    feature_weights: Option<&[f64]>
) -> f64 {
    calculate_distance(point1, point2, true, feature_weights)
}

// Retained for backwards compatibility
pub fn calculate_manhattan_distance(
    point1: &[f64],
    point2: &[f64],
    feature_weights: Option<&[f64]>
) -> f64 {
    calculate_distance(point1, point2, false, feature_weights)
}

/// Determine optimal k value based on config
pub fn determine_k_value(config: &KnnConfig) -> usize {
    if config.neighbors.specify {
        config.neighbors.specify_k as usize
    } else if config.neighbors.auto_selection {
        // For auto-selection, use cross-validation to find optimal k
        // between min_k and max_k. For now, just use min_k as default.
        let min_k = config.neighbors.min_k.max(1) as usize;
        let max_k = config.neighbors.max_k.max(min_k as i32) as usize;

        // In a real implementation, this would perform cross-validation
        // to determine the optimal k between min_k and max_k
        min_k
    } else {
        3
    }
}

/// Calculate feature weights based on importance if weighting is enabled
pub fn calculate_feature_weights(knn_data: &KnnData, config: &KnnConfig) -> Option<Vec<f64>> {
    if !config.neighbors.weight {
        return None;
    }

    // Calculate importance for each feature
    let n_features = knn_data.features.len();
    let mut feature_weights = vec![1.0; n_features];

    // In a full implementation, this would calculate actual feature importance
    // For now, we use equal weights
    let weight_sum: f64 = feature_weights.iter().sum();
    if weight_sum > 0.0 {
        for w in &mut feature_weights {
            *w /= weight_sum;
        }
    }

    Some(feature_weights)
}

/// Calculate predictions for neighbor-based model
pub fn calculate_predictions(
    neighbors: &[(usize, f64)],
    target_values: &[DataValue],
    config: &KnnConfig
) -> DataValue {
    // For categorical target, use majority vote
    let first_value = neighbors.first().and_then(|&(idx, _)| target_values.get(idx));
    if let Some(DataValue::Text(_)) = first_value {
        return calculate_categorical_prediction(neighbors, target_values);
    } else if let Some(DataValue::Boolean(_)) = first_value {
        return calculate_categorical_prediction(neighbors, target_values);
    } else if let Some(DataValue::Number(_)) = first_value {
        // For numeric target, use mean or median based on config
        if config.neighbors.predictions_median {
            return calculate_median_prediction(neighbors, target_values);
        } else {
            // Default to mean if predictions_mean is true or not specified
            return calculate_mean_prediction(neighbors, target_values);
        }
    }

    DataValue::Null
}

/// Calculate prediction for categorical target (majority vote)
fn calculate_categorical_prediction(
    neighbors: &[(usize, f64)],
    target_values: &[DataValue]
) -> DataValue {
    let mut votes: std::collections::HashMap<String, usize> = std::collections::HashMap::new();

    // Count votes for each category
    for &(idx, _) in neighbors {
        if idx >= target_values.len() {
            continue;
        }

        let key = match &target_values[idx] {
            DataValue::Text(s) => s.clone(),
            DataValue::Boolean(b) => b.to_string(),
            _ => {
                continue;
            }
        };

        *votes.entry(key).or_insert(0) += 1;
    }

    // Find category with most votes
    if let Some((key, _)) = votes.into_iter().max_by_key(|&(_, count)| count) {
        if key.to_lowercase() == "true" || key == "1" {
            DataValue::Boolean(true)
        } else if key.to_lowercase() == "false" || key == "0" {
            DataValue::Boolean(false)
        } else {
            DataValue::Text(key)
        }
    } else {
        DataValue::Null
    }
}

/// Calculate mean prediction for numeric target
fn calculate_mean_prediction(neighbors: &[(usize, f64)], target_values: &[DataValue]) -> DataValue {
    let mut sum = 0.0;
    let mut count = 0;

    for &(idx, _) in neighbors {
        if idx >= target_values.len() {
            continue;
        }

        if let DataValue::Number(val) = target_values[idx] {
            sum += val;
            count += 1;
        }
    }

    if count > 0 {
        DataValue::Number(sum / (count as f64))
    } else {
        DataValue::Null
    }
}

/// Calculate median prediction for numeric target
fn calculate_median_prediction(
    neighbors: &[(usize, f64)],
    target_values: &[DataValue]
) -> DataValue {
    // Extract numeric values
    let mut values: Vec<f64> = neighbors
        .iter()
        .filter_map(|&(idx, _)| {
            if idx < target_values.len() {
                match target_values[idx] {
                    DataValue::Number(val) => Some(val),
                    _ => None,
                }
            } else {
                None
            }
        })
        .collect();

    if values.is_empty() {
        return DataValue::Null;
    }

    // Sort values
    values.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

    // Calculate median based on whether we have an odd or even number of values
    let n = values.len();
    if n % 2 == 1 {
        // Odd number - return middle value
        DataValue::Number(values[n / 2])
    } else {
        // Even number - return average of two middle values
        DataValue::Number((values[n / 2 - 1] + values[n / 2]) / 2.0)
    }
}

/// Perform forward selection to select the best features
pub fn perform_forward_selection(
    knn_data: &KnnData,
    config: &KnnConfig
) -> Result<Vec<usize>, String> {
    if !config.features.perform_selection {
        // If feature selection is not requested, return all feature indices
        return Ok((0..knn_data.features.len()).collect());
    }

    // Start with forced entry variables
    let mut selected_features = Vec::new();
    let mut remaining_features: Vec<usize> = (0..knn_data.features.len()).collect();

    // Initialize with forced features if specified
    if let Some(ref forced_vars) = config.features.forced_entry_var {
        for var_name in forced_vars {
            if let Some(idx) = knn_data.features.iter().position(|f| f == var_name) {
                selected_features.push(idx);
                // Remove from remaining features
                if let Some(pos) = remaining_features.iter().position(|&i| i == idx) {
                    remaining_features.remove(pos);
                }
            }
        }
    }

    // Get the number of forced features
    let forced_features = selected_features.len();

    // Determine how many additional features to select
    let max_to_select = match config.features.max_to_select {
        Some(max) => max as usize,
        None => {
            // Auto-calculate based on documentation formula:
            // J_add = max(min(20, P^0) - J_forced, 0)
            let max_features = (20).min(knn_data.features.len());
            if max_features > forced_features {
                max_features - forced_features
            } else {
                0
            }
        }
    };

    // If no more features to add, return the forced features
    if max_to_select == 0 || remaining_features.is_empty() {
        return Ok(selected_features);
    }

    // Determine k value for evaluation
    let k = determine_k_value(config);
    let use_euclidean = config.neighbors.metric_eucli;
    let use_median = config.neighbors.predictions_median;

    // Calculate baseline error with current selected features
    let baseline_error = if selected_features.is_empty() {
        // No features yet, use a placeholder high error value
        1.0
    } else {
        // Calculate error with currently selected features
        calculate_knn_error(knn_data, k, use_euclidean, None, None, use_median)?
    };

    let min_change = config.features.min_change;
    let mut previous_error = baseline_error;

    // Forward selection loop
    for _ in 0..max_to_select {
        let mut best_feature = None;
        let mut best_error = f64::MAX;

        // Try each remaining feature
        for &feature_idx in &remaining_features {
            // Create temporary feature set with this new feature
            let mut temp_features = selected_features.clone();
            temp_features.push(feature_idx);

            // Calculate error with this feature added
            let error = calculate_knn_error(
                knn_data,
                k,
                use_euclidean,
                Some(&temp_features),
                None,
                use_median
            )?;

            // Update best feature if this one is better
            if error < best_error {
                best_error = error;
                best_feature = Some(feature_idx);
            }
        }

        // If we found a feature to add
        if let Some(feature) = best_feature {
            // Calculate error ratio for stopping criterion
            let error_ratio = if previous_error > 0.0 {
                (previous_error - best_error) / previous_error
            } else {
                0.0
            };

            // Check stopping criteria
            if best_error == 0.0 {
                // Perfect prediction, no need to add more features
                selected_features.push(feature);
                break;
            } else if best_error >= previous_error {
                // Error increased or stayed the same
                if error_ratio.abs() <= min_change {
                    // Change too small, stop
                    break;
                }
            } else if error_ratio > 0.0 && error_ratio <= min_change {
                // Error decreased but change too small, add this feature and stop
                selected_features.push(feature);
                break;
            } else if error_ratio < 0.0 && error_ratio.abs() > 2.0 * min_change {
                // Error increased significantly, stop without adding this feature
                break;
            }

            // Add the feature and update for next iteration
            selected_features.push(feature);
            previous_error = best_error;

            // Remove the selected feature from remaining features
            if let Some(pos) = remaining_features.iter().position(|&i| i == feature) {
                remaining_features.remove(pos);
            }

            // Check if we've run out of features
            if remaining_features.is_empty() {
                break;
            }
        } else {
            // No feature improved the model
            break;
        }
    }

    Ok(selected_features)
}

/// Perform cross-validation to determine the optimal k value
pub fn perform_cross_validation(knn_data: &KnnData, config: &KnnConfig) -> Result<usize, String> {
    let min_k = config.neighbors.min_k.max(1) as usize;
    let max_k = config.neighbors.max_k.max(min_k as i32) as usize;
    let use_euclidean = config.neighbors.metric_eucli;
    let use_median = config.neighbors.predictions_median;

    // Default to min_k if the range is invalid
    if min_k >= max_k {
        return Ok(min_k);
    }

    // Number of folds for cross-validation
    let num_folds = config.partition.num_partition.max(2) as usize;

    // Create folds - either use existing partitioning or create random folds
    let folds = if config.partition.v_fold_use_partitioning_var {
        // In a real implementation, this would use the specified partitioning variable
        // For now, create random folds
        create_random_folds(knn_data.training_indices.len(), num_folds)
    } else {
        create_random_folds(knn_data.training_indices.len(), num_folds)
    };

    // Evaluate each k value
    let mut best_k = min_k;
    let mut min_error = f64::MAX;

    for k in min_k..=max_k {
        let mut total_error = 0.0;

        // Perform cross-validation
        for fold in 0..num_folds {
            // Create training and validation sets for this fold
            let validation_indices: Vec<usize> = folds
                .iter()
                .enumerate()
                .filter_map(|(idx, &fold_num)| {
                    if fold_num == fold { Some(knn_data.training_indices[idx]) } else { None }
                })
                .collect();

            let training_indices: Vec<usize> = folds
                .iter()
                .enumerate()
                .filter_map(|(idx, &fold_num)| {
                    if fold_num != fold { Some(knn_data.training_indices[idx]) } else { None }
                })
                .collect();

            // Calculate error for this fold
            let fold_error = calculate_fold_error(
                knn_data,
                &training_indices,
                &validation_indices,
                k,
                use_euclidean,
                use_median
            )?;

            total_error += fold_error;
        }

        // Calculate average error across folds
        let avg_error = total_error / (num_folds as f64);

        // Update best k if this one is better
        if avg_error < min_error {
            min_error = avg_error;
            best_k = k;
        }
    }

    Ok(best_k)
}

/// Create random folds for cross-validation
fn create_random_folds(n_samples: usize, n_folds: usize) -> Vec<usize> {
    let mut folds = Vec::with_capacity(n_samples);
    for i in 0..n_samples {
        folds.push(i % n_folds);
    }

    // Shuffle the folds
    use rand::seq::SliceRandom;
    let mut rng = rand::thread_rng();
    folds.shuffle(&mut rng);

    folds
}

/// Calculate error for a validation fold in cross-validation
fn calculate_fold_error(
    knn_data: &KnnData,
    training_indices: &[usize],
    validation_indices: &[usize],
    k: usize,
    use_euclidean: bool,
    use_median: bool
) -> Result<f64, String> {
    let mut total_error = 0.0;
    let mut count = 0;

    // Whether target is categorical
    let target_is_categorical = knn_data.target_values
        .iter()
        .all(|v| { matches!(v, DataValue::Text(_) | DataValue::Boolean(_)) });

    // For each validation sample
    for &idx in validation_indices {
        // Find k nearest neighbors in training set
        let neighbors = find_k_nearest_neighbors(
            &knn_data.data_matrix[idx],
            &knn_data.data_matrix,
            training_indices,
            k,
            use_euclidean,
            None
        );

        // Calculate error based on target type
        if target_is_categorical {
            // For categorical target, check if prediction is correct
            let actual = &knn_data.target_values[idx];
            let predicted = calculate_categorical_prediction(&neighbors, &knn_data.target_values);

            // Add 1.0 for error, 0.0 for correct
            // Use structural comparison since DataValue might not implement PartialEq properly
            match (actual, &predicted) {
                (DataValue::Text(a), DataValue::Text(p)) => {
                    if a != p {
                        total_error += 1.0;
                    }
                }
                (DataValue::Boolean(a), DataValue::Boolean(p)) => {
                    if a != p {
                        total_error += 1.0;
                    }
                }
                _ => {
                    total_error += 1.0;
                } // Different types means error
            }
        } else {
            // For numeric target, calculate squared error
            if let DataValue::Number(actual) = knn_data.target_values[idx] {
                let prediction_fn = if use_median {
                    calculate_median_prediction
                } else {
                    calculate_mean_prediction
                };

                let predicted = if
                    let DataValue::Number(val) = prediction_fn(&neighbors, &knn_data.target_values)
                {
                    val
                } else {
                    0.0
                };

                // Add squared error
                total_error += (actual - predicted).powi(2);
            }
        }

        count += 1;
    }

    // Return average error
    if count > 0 {
        Ok(total_error / (count as f64))
    } else {
        Ok(0.0)
    }
}
