use std::collections::HashMap;

use nalgebra::DMatrix;

use crate::models::{ result::LogDeterminants, AnalysisData, DiscriminantConfig };

use super::core::{
    calculate_covariance,
    calculate_pooled_within_matrix,
    calculate_rank_and_log_det,
    extract_analyzed_dataset,
};

/// Calculate log determinants of covariance matrices
///
/// This function calculates the logarithm of determinants for each group's
/// covariance matrix and the pooled covariance matrix as required for Box's M test.
///
/// Box's M test uses these log determinants to test the homogeneity of
/// covariance matrices across groups, which is an assumption in discriminant analysis.
///
/// # Parameters
/// * `data` - The analysis data
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// A LogDeterminants object with log determinants for each group and pooled matrix
pub fn calculate_log_determinants(
    data: &AnalysisData,
    config: &DiscriminantConfig
) -> Result<LogDeterminants, String> {
    web_sys::console::log_1(&"Executing calculate_log_determinants".into());

    // Extract analyzed dataset
    let dataset = extract_analyzed_dataset(data, config)?;
    let variables = &config.main.independent_variables;

    let mut groups = Vec::new();
    let mut ranks = Vec::new();
    let mut log_determinants = Vec::new();

    // Process each group
    for group in &dataset.group_labels {
        // Create a single-group subset for analysis
        let single_group_vars: Vec<String> = vec![group.clone()];

        // Get variables values for this group
        let mut group_data = HashMap::new();
        for var in variables {
            if let Some(group_values) = dataset.group_data.get(var).and_then(|g| g.get(group)) {
                if group_values.len() > 1 {
                    // We only need values for one group to construct its covariance matrix
                    let mut var_data = HashMap::new();
                    var_data.insert(group.clone(), group_values.clone());
                    group_data.insert(var.clone(), var_data);
                }
            }
        }

        let group_size = dataset.group_data
            .get(&variables[0])
            .and_then(|g| g.get(group))
            .map_or(0, |v| v.len());

        if group_size <= 1 {
            continue; // Skip groups with insufficient data
        }

        // Build covariance matrix for this group
        let mut cov_matrix = DMatrix::zeros(variables.len(), variables.len());

        for (i, var_i) in variables.iter().enumerate() {
            for (j, var_j) in variables.iter().enumerate() {
                if
                    let (Some(values_i), Some(values_j)) = (
                        dataset.group_data.get(var_i).and_then(|g| g.get(group)),
                        dataset.group_data.get(var_j).and_then(|g| g.get(group)),
                    )
                {
                    if values_i.len() > 1 && values_i.len() == values_j.len() {
                        let mean_i = dataset.group_means[group][var_i];
                        let mean_j = dataset.group_means[group][var_j];

                        let cov = calculate_covariance(
                            values_i,
                            values_j,
                            Some(mean_i),
                            Some(mean_j)
                        );

                        cov_matrix[(i, j)] = cov;
                    }
                }
            }
        }

        // Calculate rank and log determinant
        let (rank, log_det) = calculate_rank_and_log_det(&cov_matrix);

        groups.push(group.clone());
        ranks.push(rank);
        log_determinants.push(log_det);
    }

    // Calculate pooled within-groups covariance matrix
    let pooled_cov = calculate_pooled_within_matrix(&dataset, variables);

    // Calculate rank and log determinant of pooled matrix
    let (rank_pooled, pooled_log_det) = calculate_rank_and_log_det(&pooled_cov);

    // Add explanatory note based on Box's M documentation
    let note =
        "Note: Log determinants are used in Box's M test to evaluate the homogeneity of covariance matrices. \
                The test compares individual group determinants with the pooled determinant.".to_string();

    Ok(LogDeterminants {
        groups,
        ranks,
        log_determinants,
        rank_pooled,
        pooled_log_determinant: pooled_log_det,
        note,
    })
}
