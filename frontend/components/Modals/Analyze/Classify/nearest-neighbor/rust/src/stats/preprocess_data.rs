use std::collections::{ HashSet, HashMap };

use crate::models::{ config::KnnConfig, data::{ AnalysisData, DataValue, KnnData } };

use super::common::{ normalize_features, split_training_holdout };

pub fn preprocess_knn_data(data: &AnalysisData, config: &KnnConfig) -> Result<KnnData, String> {
    // Extract feature variables - use itertools for more functional approach
    let features = match &config.main.feature_var {
        Some(vars) => vars.clone(),
        None => {
            // Auto-detect numeric features from features_data
            if data.features_data.is_empty() {
                return Err("No features data provided".to_string());
            }

            // Collect unique feature names with numeric values
            let mut feature_set = HashSet::new();
            for dataset in &data.features_data {
                for record in dataset {
                    for (key, value) in &record.values {
                        if matches!(value, DataValue::Number(_)) {
                            feature_set.insert(key.clone());
                        }
                    }
                }
            }
            feature_set.into_iter().collect()
        }
    };

    if features.is_empty() {
        return Err("No valid features found".to_string());
    }

    // Get dependent variable
    let dep_var = config.main.dep_var.clone();

    // Get number of cases - use maximum length across all datasets
    let num_cases = data.features_data
        .iter()
        .map(|ds| ds.len())
        .chain(data.target_data.iter().map(|ds| ds.len()))
        .max()
        .unwrap_or(0);

    if num_cases == 0 {
        return Err("No cases found in data".to_string());
    }

    // Create data matrix and extract target values
    let mut data_matrix = Vec::with_capacity(num_cases);
    let mut target_values = Vec::with_capacity(num_cases);
    let mut case_identifiers = Vec::with_capacity(num_cases);

    // Get case identifier variable
    let case_ident_var = &config.main.case_iden_var;

    // Process each case
    for case_idx in 0..num_cases {
        // Extract feature values for current case
        let row = extract_feature_values(
            case_idx,
            &features,
            data,
            config.options.exclude || !config.options.include
        );

        // Skip this case if not all features were processed
        if row.len() != features.len() {
            continue;
        }

        // Get target value if a dependent variable is specified
        let target_value = match &dep_var {
            Some(dep_var_name) => extract_target_value(case_idx, dep_var_name, data),
            None => DataValue::Null,
        };

        // Get case identifier
        let case_id = extract_case_identifier(case_idx, case_ident_var, data);

        // Add the case to the data matrix
        data_matrix.push(row);
        target_values.push(target_value);
        case_identifiers.push(case_id);
    }

    if data_matrix.is_empty() {
        return Err("No valid data records after preprocessing".to_string());
    }

    // Normalize features if needed
    if config.main.norm_covar {
        normalize_features(&mut data_matrix);
    }

    // Split into training and holdout sets based on partition configuration
    let (training_indices, holdout_indices) = if config.partition.use_variable {
        // Use variable-based partitioning if specified
        if let Some(ref partition_var) = config.partition.partitioning_variable {
            split_by_partition_variable(data, partition_var, data_matrix.len())?
        } else {
            // Fall back to random partitioning if no variable specified
            split_training_holdout(
                data_matrix.len(),
                config.partition.training_number,
                config.partition.set_seed,
                config.partition.seed
            )
        }
    } else if config.partition.use_randomly {
        // Use random partitioning
        split_training_holdout(
            data_matrix.len(),
            config.partition.training_number,
            config.partition.set_seed,
            config.partition.seed
        )
    } else {
        // Default behavior - use all data for training
        let indices: Vec<usize> = (0..data_matrix.len()).collect();
        (indices, Vec::new())
    };

    // Identify focal cases
    let focal_indices = identify_focal_cases(
        &case_identifiers,
        data,
        &config.main.focal_case_iden_var
    );

    Ok(KnnData {
        features,
        data_matrix,
        target_values,
        case_identifiers,
        training_indices,
        holdout_indices,
        focal_indices,
    })
}

/// Helper function to extract feature values for a case
fn extract_feature_values(
    case_idx: usize,
    features: &[String],
    data: &AnalysisData,
    exclude_incomplete: bool
) -> Vec<f64> {
    let mut row = Vec::with_capacity(features.len());

    // Process each feature
    for var in features {
        let mut var_value: Option<f64> = None;

        // Look in features_data first
        for dataset in &data.features_data {
            if case_idx < dataset.len() {
                if let Some(DataValue::Number(val)) = dataset[case_idx].values.get(var) {
                    var_value = Some(*val);
                    break;
                }
            }
        }

        // Then check target_data if not found
        if var_value.is_none() {
            for dataset in &data.target_data {
                if case_idx < dataset.len() {
                    if let Some(DataValue::Number(val)) = dataset[case_idx].values.get(var) {
                        var_value = Some(*val);
                        break;
                    }
                }
            }
        }

        // Handle missing values
        match var_value {
            Some(val) => row.push(val),
            None => {
                if exclude_incomplete {
                    // Early return with incomplete row to be filtered out
                    return Vec::new();
                }
                row.push(0.0); // Default value for missing data
            }
        }
    }

    row
}

/// Helper function to extract target value for a case
fn extract_target_value(case_idx: usize, dep_var_name: &str, data: &AnalysisData) -> DataValue {
    for dataset in &data.target_data {
        if case_idx < dataset.len() {
            if let Some(val) = dataset[case_idx].values.get(dep_var_name) {
                return val.clone();
            }
        }
    }

    DataValue::Null
}

/// Helper function to extract case identifier
fn extract_case_identifier(
    case_idx: usize,
    case_ident_var: &Option<String>,
    data: &AnalysisData
) -> i32 {
    // Default to case index + 1 if no identifier is found
    let default_id = (case_idx + 1) as i32;

    if let Some(id_var) = case_ident_var {
        // Try features_data first
        for dataset in &data.features_data {
            if case_idx < dataset.len() {
                if let Some(DataValue::Number(id)) = dataset[case_idx].values.get(id_var) {
                    return *id as i32;
                }
            }
        }

        // Then try target_data
        for dataset in &data.target_data {
            if case_idx < dataset.len() {
                if let Some(DataValue::Number(id)) = dataset[case_idx].values.get(id_var) {
                    return *id as i32;
                }
            }
        }
    }

    default_id
}

/// Helper function to identify focal cases
fn identify_focal_cases(
    case_identifiers: &[i32],
    data: &AnalysisData,
    focal_var: &Option<String>
) -> Vec<usize> {
    let mut focal_indices = Vec::new();

    if let Some(focal_var) = focal_var {
        // Create lookup map for faster case identifier matching
        let case_id_map: HashMap<i32, usize> = case_identifiers
            .iter()
            .enumerate()
            .map(|(idx, &id)| (id, idx))
            .collect();

        // Find matching focal cases
        for dataset in &data.focal_case_data {
            for record in dataset {
                if let Some(DataValue::Number(id)) = record.values.get(focal_var) {
                    let case_id = *id as i32;
                    if let Some(&idx) = case_id_map.get(&case_id) {
                        focal_indices.push(idx);
                    }
                }
            }
        }
    }

    // Default to first case if no focal cases found
    if focal_indices.is_empty() && !case_identifiers.is_empty() {
        focal_indices.push(0);
    }

    focal_indices
}

/// Helper function to split data by a partition variable
fn split_by_partition_variable(
    data: &AnalysisData,
    partition_var: &str,
    num_cases: usize
) -> Result<(Vec<usize>, Vec<usize>), String> {
    let mut training_indices = Vec::new();
    let mut holdout_indices = Vec::new();

    // Create a map of case index to partition value
    let mut partition_values = vec![0; num_cases];
    let mut found_partition = false;

    // Look for partition variable in features_data
    for dataset in &data.features_data {
        for (case_idx, record) in dataset.iter().enumerate() {
            if case_idx >= num_cases {
                continue;
            }

            if let Some(DataValue::Number(val)) = record.values.get(partition_var) {
                partition_values[case_idx] = if *val > 0.0 { 1 } else { 0 };
                found_partition = true;
            }
        }
    }

    // Look for partition variable in target_data if not found
    if !found_partition {
        for dataset in &data.target_data {
            for (case_idx, record) in dataset.iter().enumerate() {
                if case_idx >= num_cases {
                    continue;
                }

                if let Some(DataValue::Number(val)) = record.values.get(partition_var) {
                    partition_values[case_idx] = if *val > 0.0 { 1 } else { 0 };
                    found_partition = true;
                }
            }
        }
    }

    if !found_partition {
        return Err(format!("Partition variable '{}' not found in data", partition_var));
    }

    // Assign indices based on partition values
    for i in 0..num_cases {
        if partition_values[i] > 0 {
            training_indices.push(i);
        } else {
            holdout_indices.push(i);
        }
    }

    // If no training or holdout cases, return an error
    if training_indices.is_empty() {
        return Err("No training cases found using partition variable".to_string());
    }

    Ok((training_indices, holdout_indices))
}

/// Helper function to split data for cross-validation
pub fn split_for_cross_validation(
    data: &AnalysisData,
    config: &KnnConfig,
    num_cases: usize
) -> Result<Vec<usize>, String> {
    if config.partition.v_fold_use_partitioning_var {
        // Use variable-based fold assignment
        if let Some(ref fold_var) = config.partition.v_fold_partitioning_variable {
            extract_fold_values(data, fold_var, num_cases)
        } else {
            Err("No cross-validation fold variable specified".to_string())
        }
    } else if config.partition.v_fold_use_randomly {
        // Use random fold assignment
        let num_folds = config.partition.num_partition.max(2) as usize;
        let mut folds = Vec::with_capacity(num_cases);

        let mut rng = if config.partition.set_seed {
            use rand::SeedableRng;
            use rand_mt::Mt64;

            match config.partition.seed {
                Some(seed) => Mt64::new(seed as u64),
                None => Mt64::new_unseeded(),
            }
        } else {
            use rand_mt::Mt64;
            Mt64::new_unseeded()
        };

        // Assign random folds
        for i in 0..num_cases {
            let fold = (rng.next_u64() % (num_folds as u64)) as usize;
            folds.push(fold);
        }

        Ok(folds)
    } else {
        // Default to 10-fold cross-validation
        let num_folds = 10;
        let mut folds = Vec::with_capacity(num_cases);

        for i in 0..num_cases {
            let fold = i % num_folds;
            folds.push(fold);
        }

        Ok(folds)
    }
}

/// Helper function to extract fold values from data
fn extract_fold_values(
    data: &AnalysisData,
    fold_var: &str,
    num_cases: usize
) -> Result<Vec<usize>, String> {
    let mut fold_values = vec![0; num_cases];
    let mut found_fold = false;

    // Look for fold variable in features_data
    for dataset in &data.features_data {
        for (case_idx, record) in dataset.iter().enumerate() {
            if case_idx >= num_cases {
                continue;
            }

            if let Some(DataValue::Number(val)) = record.values.get(fold_var) {
                fold_values[case_idx] = *val as usize;
                found_fold = true;
            }
        }
    }

    // Look for fold variable in target_data if not found
    if !found_fold {
        for dataset in &data.target_data {
            for (case_idx, record) in dataset.iter().enumerate() {
                if case_idx >= num_cases {
                    continue;
                }

                if let Some(DataValue::Number(val)) = record.values.get(fold_var) {
                    fold_values[case_idx] = *val as usize;
                    found_fold = true;
                }
            }
        }
    }

    if !found_fold {
        return Err(format!("Cross-validation fold variable '{}' not found in data", fold_var));
    }

    Ok(fold_values)
}
