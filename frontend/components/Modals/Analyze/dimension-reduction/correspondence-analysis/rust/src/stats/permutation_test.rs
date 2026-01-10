use rand::seq::SliceRandom;
use rand::thread_rng;

use crate::models::{ config::CorrespondenceAnalysisConfig, data::AnalysisData };

use super::core::{ calculate_analysis_summary, create_correspondence_table };

pub fn perform_permutation_test(
    data: &AnalysisData,
    config: &CorrespondenceAnalysisConfig
) -> Result<Vec<f64>, String> {
    // Get original summary to compare against
    let original_summary = calculate_analysis_summary(data, config)?;
    let original_singular_values = original_summary.singular_values;

    // Get original correspondence table
    let original_table = create_correspondence_table(data, config)?;

    // Number of permutations from config
    let max_permutations = config.statistics.max_permutations as usize;
    if max_permutations <= 0 {
        return Err("Number of permutations must be positive".to_string());
    }

    // Create vectors to store permuted singular values
    let mut permuted_singular_values: Vec<Vec<f64>> =
        vec![vec![0.0; max_permutations]; original_singular_values.len()];

    // Perform permutations
    for perm_idx in 0..max_permutations {
        // Create a permuted copy of the data
        let mut permuted_data = data.clone();

        // Permute the data (shuffle values while maintaining marginal distributions)
        permute_data(&mut permuted_data)?;

        // Calculate analysis on permuted data
        match calculate_analysis_summary(&permuted_data, config) {
            Ok(perm_summary) => {
                // Store singular values
                for (i, &sv) in perm_summary.singular_values.iter().enumerate() {
                    if i < original_singular_values.len() {
                        permuted_singular_values[i][perm_idx] = sv;
                    }
                }
            }
            Err(_) => {
                // Skip failed permutation and try again
                continue;
            }
        }
    }

    // Calculate p-values for each dimension
    // P-value is proportion of permuted values >= original value
    let mut p_values = vec![0.0; original_singular_values.len()];

    for (i, &original_sv) in original_singular_values.iter().enumerate() {
        let mut count = 0;
        for &permuted_sv in &permuted_singular_values[i] {
            if permuted_sv >= original_sv {
                count += 1;
            }
        }

        p_values[i] = (count as f64) / (max_permutations as f64);
    }

    Ok(p_values)
}

// Function to permute the data while maintaining marginal distributions
fn permute_data(data: &mut AnalysisData) -> Result<(), String> {
    let mut rng = thread_rng();

    // For each row dataset, shuffle the variable values independently
    for dataset in &mut data.row_data {
        if dataset.is_empty() {
            continue;
        }

        // Identify all unique variable names in the dataset
        let mut variable_names = Vec::new();
        if let Some(first_record) = dataset.first() {
            variable_names = first_record.values.keys().cloned().collect();
        }

        // For each variable, shuffle its values across all records
        for var_name in variable_names {
            // Extract all values for this variable
            let mut values = Vec::new();
            for record in dataset.iter() {
                if let Some(value) = record.values.get(&var_name) {
                    values.push(value.clone());
                }
            }

            // Shuffle the values
            values.shuffle(&mut rng);

            // Reassign the shuffled values to records
            for (i, record) in dataset.iter_mut().enumerate() {
                if i < values.len() && record.values.contains_key(&var_name) {
                    record.values.insert(var_name.clone(), values[i].clone());
                }
            }
        }
    }

    // Similarly for column data
    for dataset in &mut data.col_data {
        if dataset.is_empty() {
            continue;
        }

        // Identify all unique variable names in the dataset
        let mut variable_names = Vec::new();
        if let Some(first_record) = dataset.first() {
            variable_names = first_record.values.keys().cloned().collect();
        }

        // For each variable, shuffle its values across all records
        for var_name in variable_names {
            // Extract all values for this variable
            let mut values = Vec::new();
            for record in dataset.iter() {
                if let Some(value) = record.values.get(&var_name) {
                    values.push(value.clone());
                }
            }

            // Shuffle the values
            values.shuffle(&mut rng);

            // Reassign the shuffled values to records
            for (i, record) in dataset.iter_mut().enumerate() {
                if i < values.len() && record.values.contains_key(&var_name) {
                    record.values.insert(var_name.clone(), values[i].clone());
                }
            }
        }
    }

    Ok(())
}
