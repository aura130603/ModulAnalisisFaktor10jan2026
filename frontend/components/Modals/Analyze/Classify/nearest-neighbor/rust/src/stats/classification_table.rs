// classification_table.rs
use std::collections::HashMap;

use crate::models::{
    config::KnnConfig,
    data::{ AnalysisData, DataValue },
    result::{ ClassificationPartition, ClassificationTable },
};

use super::core::{ determine_k_value, find_k_nearest_neighbors, preprocess_knn_data };

pub fn calculate_classification_table(
    data: &AnalysisData,
    config: &KnnConfig
) -> Result<ClassificationTable, String> {
    // Check if we have a target variable - required for classification
    if config.main.dep_var.is_none() {
        return Err("A target variable is required for classification table".to_string());
    }

    // Preprocess data
    let knn_data = preprocess_knn_data(data, config)?;

    // Determine k value
    let k = determine_k_value(config);

    // Create mapping of categorical target values to numeric indices
    let (category_map, categories) = create_category_mapping(&knn_data.target_values);
    let n_categories = categories.len();

    // Use Euclidean or Manhattan distance
    let use_euclidean = config.neighbors.metric_eucli;

    // Calculate confusion matrices and missing values
    let (train_confusion, train_correct, train_total, train_missing) = calculate_confusion_matrix(
        &knn_data,
        &category_map,
        n_categories,
        k,
        use_euclidean,
        true
    );

    let (holdout_confusion, holdout_correct, holdout_total, holdout_missing) =
        calculate_confusion_matrix(&knn_data, &category_map, n_categories, k, use_euclidean, false);

    // Extract classification statistics
    let (train_observed, train_predicted) = extract_marginals(&train_confusion, n_categories);
    let (holdout_observed, holdout_predicted) = extract_marginals(&holdout_confusion, n_categories);

    // Calculate overall percentages (distribution of predicted categories)
    let train_overall_percent = calculate_overall_percent(&train_predicted, train_total);
    let holdout_overall_percent = calculate_overall_percent(&holdout_predicted, holdout_total);

    // Calculate accuracy percentages by category
    let train_percent_correct = calculate_percent_correct_by_category(
        &train_confusion,
        &train_observed
    );
    let holdout_percent_correct = calculate_percent_correct_by_category(
        &holdout_confusion,
        &holdout_observed
    );

    // Calculate overall accuracy percentages
    let train_overall_accuracy = calculate_percent_correct(train_correct, train_total);
    let holdout_overall_accuracy = calculate_percent_correct(holdout_correct, holdout_total);

    Ok(ClassificationTable {
        training: ClassificationPartition {
            observed: train_observed,
            predicted: train_predicted,
            missing: train_missing,
            overall_percent: train_overall_percent,
            percent_correct: train_percent_correct,
        },
        holdout: ClassificationPartition {
            observed: holdout_observed,
            predicted: holdout_predicted,
            missing: holdout_missing,
            overall_percent: holdout_overall_percent,
            percent_correct: holdout_percent_correct,
        },
    })
}

/// Create a mapping from categorical values to numeric indices
fn create_category_mapping(target_values: &[DataValue]) -> (HashMap<String, usize>, Vec<String>) {
    let mut category_map = HashMap::new();
    let mut categories = Vec::new();

    for value in target_values {
        let category = match value {
            DataValue::Text(s) => s.clone(),
            DataValue::Boolean(b) => b.to_string(),
            DataValue::Number(n) => n.to_string(),
            _ => {
                // Handle other types as needed
                continue;
            }
        };

        if !category_map.contains_key(&category) {
            let idx = category_map.len();
            category_map.insert(category.clone(), idx);
            categories.push(category);
        }
    }

    (category_map, categories)
}

/// Calculate confusion matrix for either training or holdout set
fn calculate_confusion_matrix(
    knn_data: &crate::models::data::KnnData,
    category_map: &HashMap<String, usize>,
    n_categories: usize,
    k: usize,
    use_euclidean: bool,
    is_training: bool
) -> (Vec<Vec<usize>>, usize, usize, Vec<usize>) {
    let mut confusion = vec![vec![0; n_categories]; n_categories];
    let mut correct = 0;
    let mut total = 0;
    let mut missing = vec![0; n_categories];

    // Select indices to process based on set type
    let indices_to_process = if is_training {
        &knn_data.training_indices
    } else {
        &knn_data.holdout_indices
    };

    for &idx in indices_to_process {
        // Get actual category
        let actual_value = &knn_data.target_values[idx];
        let actual_cat = match actual_value {
            DataValue::Text(s) => category_map.get(s),
            DataValue::Boolean(b) => category_map.get(&b.to_string()),
            DataValue::Number(n) => category_map.get(&n.to_string()),
            _ => {
                // Consider this as missing value
                if !is_training {
                    // Track missing values in holdout set
                    let neighbors = find_k_nearest_neighbors(
                        &knn_data.data_matrix[idx],
                        &knn_data.data_matrix,
                        &knn_data.training_indices,
                        k,
                        use_euclidean,
                        None
                    );

                    let predicted_cat = predict_category(
                        &neighbors,
                        &knn_data.target_values,
                        category_map,
                        n_categories
                    );

                    missing[predicted_cat] += 1;
                }
                continue;
            }
        };

        if actual_cat.is_none() {
            continue;
        }

        // Find neighbors - depends on whether this is training or holdout
        let neighbors = if is_training {
            // For training, find neighbors excluding self
            let train_indices: Vec<usize> = knn_data.training_indices
                .iter()
                .filter(|&&i| i != idx)
                .copied()
                .collect();

            find_k_nearest_neighbors(
                &knn_data.data_matrix[idx],
                &knn_data.data_matrix,
                &train_indices,
                k,
                use_euclidean,
                None
            )
        } else {
            // For holdout, find neighbors from training set
            find_k_nearest_neighbors(
                &knn_data.data_matrix[idx],
                &knn_data.data_matrix,
                &knn_data.training_indices,
                k,
                use_euclidean,
                None
            )
        };

        // Predict category by majority vote
        let predicted_cat = predict_category(
            &neighbors,
            &knn_data.target_values,
            category_map,
            n_categories
        );

        // Update confusion matrix
        let &actual_idx = actual_cat.unwrap();
        confusion[actual_idx][predicted_cat] += 1;

        // Track correct predictions
        if actual_idx == predicted_cat {
            correct += 1;
        }

        total += 1;
    }

    (confusion, correct, total, missing)
}

/// Predict category using majority vote from neighbors
fn predict_category(
    neighbors: &[(usize, f64)],
    target_values: &[DataValue],
    category_map: &HashMap<String, usize>,
    n_categories: usize
) -> usize {
    let mut vote_counts = vec![0; n_categories];

    for &(neighbor_idx, _) in neighbors {
        let neighbor_value = &target_values[neighbor_idx];
        let neighbor_cat = match neighbor_value {
            DataValue::Text(s) => category_map.get(s),
            DataValue::Boolean(b) => category_map.get(&b.to_string()),
            DataValue::Number(n) => category_map.get(&n.to_string()),
            _ => {
                continue;
            }
        };

        if let Some(&cat_idx) = neighbor_cat {
            vote_counts[cat_idx] += 1;
        }
    }

    // Find predicted category (max votes)
    vote_counts
        .iter()
        .enumerate()
        .max_by_key(|&(_, count)| count)
        .map(|(idx, _)| idx)
        .unwrap_or(0)
}

/// Extract row and column sums from confusion matrix
fn extract_marginals(confusion: &[Vec<usize>], n_categories: usize) -> (Vec<usize>, Vec<usize>) {
    let mut observed = Vec::with_capacity(n_categories);
    let mut predicted = Vec::with_capacity(n_categories);

    for i in 0..n_categories {
        let row_sum: usize = confusion[i].iter().sum();
        observed.push(row_sum);
    }

    for j in 0..n_categories {
        let col_sum: usize = (0..n_categories).map(|i| confusion[i][j]).sum();
        predicted.push(col_sum);
    }

    (observed, predicted)
}

/// Calculate overall percent distribution for each category
fn calculate_overall_percent(predicted: &[usize], total: usize) -> Vec<f64> {
    if total > 0 {
        predicted
            .iter()
            .map(|&count| (100.0 * (count as f64)) / (total as f64))
            .collect()
    } else {
        vec![0.0; predicted.len()]
    }
}

/// Calculate percent correct for each category
fn calculate_percent_correct_by_category(confusion: &[Vec<usize>], observed: &[usize]) -> Vec<f64> {
    observed
        .iter()
        .enumerate()
        .map(|(i, &obs_count)| {
            if obs_count > 0 {
                (100.0 * (confusion[i][i] as f64)) / (obs_count as f64)
            } else {
                0.0
            }
        })
        .collect()
}

/// Calculate overall percent correct
fn calculate_percent_correct(correct: usize, total: usize) -> f64 {
    if total > 0 { (100.0 * (correct as f64)) / (total as f64) } else { 0.0 }
}
