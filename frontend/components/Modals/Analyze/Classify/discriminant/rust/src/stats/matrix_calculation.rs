//! Matrix calculations for discriminant analysis.
//!
//! This module implements the matrix operations needed for discriminant analysis,
//! including between-groups and within-groups matrices, Mahalanobis distances,
//! and statistical metrics derived from these matrices.

use std::collections::HashMap;

use nalgebra::{ DMatrix, DVector };
use rayon::prelude::*;

use crate::{
    models::{ result::{ CovarianceMatrices, PooledMatrices }, AnalysisData, DiscriminantConfig },
    stats::core::{ calculate_covariance, AnalyzedDataset, EPSILON },
};

use super::core::extract_analyzed_dataset;

/// Calculate between-groups and within-groups matrices
///
/// These are fundamental matrices for discriminant analysis:
/// - Between-groups: represents variation between group means
/// - Within-groups: represents pooled variation within groups
///
/// # Parameters
/// * `dataset` - The analyzed dataset containing group data and means
/// * `variables` - The variables to include in the matrices
///
/// # Returns
/// A tuple containing (between-groups matrix, within-groups matrix)
pub fn calculate_between_within_matrices(
    dataset: &AnalyzedDataset,
    variables: &[String]
) -> (DMatrix<f64>, DMatrix<f64>) {
    let p = variables.len();

    // Initialize matrices
    let mut between_matrix = DMatrix::zeros(p, p);
    let mut within_matrix = DMatrix::zeros(p, p);

    // Calculate between-groups matrix
    for (i, var_i) in variables.iter().enumerate() {
        for (j, var_j) in variables.iter().enumerate() {
            let overall_mean_i = *dataset.overall_means.get(var_i).unwrap_or(&0.0);
            let overall_mean_j = *dataset.overall_means.get(var_j).unwrap_or(&0.0);

            let mut sum = 0.0;

            for group_label in &dataset.group_labels {
                if
                    let (Some(values_i), Some(mean_i), Some(mean_j)) = (
                        dataset.group_data.get(var_i).and_then(|g| g.get(group_label)),
                        dataset.group_means.get(group_label).and_then(|m| m.get(var_i)),
                        dataset.group_means.get(group_label).and_then(|m| m.get(var_j)),
                    )
                {
                    let n_g = values_i.len() as f64;
                    if n_g > 0.0 {
                        sum += n_g * (mean_i - overall_mean_i) * (mean_j - overall_mean_j);
                    }
                }
            }

            between_matrix[(i, j)] = sum;
        }
    }

    // Calculate within-groups matrix - parallel across group pairs
    let mut total_df = 0;

    let group_contributions: Vec<(DMatrix<f64>, usize)> = dataset.group_labels
        .par_iter()
        .filter_map(|group_label| {
            // For each group, calculate contribution to within-groups matrix
            let mut group_within = DMatrix::zeros(p, p);

            // Check if group has data
            let n = dataset.group_data
                .get(&variables[0])
                .and_then(|g| g.get(group_label))
                .map_or(0, |v| v.len());

            if n <= 1 {
                return None;
            }

            let df = n - 1;

            // Calculate group covariance matrix
            for (i, var_i) in variables.iter().enumerate() {
                for (j, var_j) in variables.iter().enumerate() {
                    if
                        let (Some(values_i), Some(values_j)) = (
                            dataset.group_data.get(var_i).and_then(|g| g.get(group_label)),
                            dataset.group_data.get(var_j).and_then(|g| g.get(group_label)),
                        )
                    {
                        if values_i.len() > 1 && values_i.len() == values_j.len() {
                            let mean_i = dataset.group_means[group_label][var_i];
                            let mean_j = dataset.group_means[group_label][var_j];

                            // Calculate covariance
                            let cov = calculate_covariance(
                                values_i,
                                values_j,
                                Some(mean_i),
                                Some(mean_j)
                            );

                            group_within[(i, j)] = (df as f64) * cov;
                        }
                    }
                }
            }

            Some((group_within, df))
        })
        .collect();

    // Combine group contributions
    for (group_within, df) in group_contributions {
        within_matrix += &group_within;
        total_df += df;
    }

    if total_df > 0 {
        within_matrix /= total_df as f64;
    }

    (between_matrix, within_matrix)
}

/// Calculate pooled within-groups covariance matrix
///
/// This function computes the pooled within-groups covariance matrix,
/// which is used in discriminant analysis for classification and testing.
///
/// The matrix is calculated as:
/// W = Σ(nᵢ-1)Sᵢ / (n-g)
///
/// # Parameters
/// * `dataset` - The analyzed dataset
/// * `variables` - The variables to include in the matrix
///
/// # Returns
/// The pooled within-groups covariance matrix
pub fn calculate_pooled_within_matrix(
    dataset: &AnalyzedDataset,
    variables: &[String]
) -> DMatrix<f64> {
    let num_vars = variables.len();
    let mut pooled_within = DMatrix::zeros(num_vars, num_vars);
    let mut total_df = 0;

    // Process each group in parallel
    let group_contributions: Vec<(DMatrix<f64>, usize)> = dataset.group_labels
        .par_iter()
        .filter_map(|group_label| {
            // For each group, calculate contribution to pooled within matrix
            let mut group_within = DMatrix::zeros(num_vars, num_vars);

            // Check if group has data
            let n = dataset.group_data
                .get(&variables[0])
                .and_then(|g| g.get(group_label))
                .map_or(0, |v| v.len());

            if n <= 1 {
                return None;
            }

            let df = n - 1;

            // Calculate group covariance matrix
            for (i, var_i) in variables.iter().enumerate() {
                for (j, var_j) in variables.iter().enumerate() {
                    if
                        let (Some(values_i), Some(values_j)) = (
                            dataset.group_data.get(var_i).and_then(|g| g.get(group_label)),
                            dataset.group_data.get(var_j).and_then(|g| g.get(group_label)),
                        )
                    {
                        if values_i.len() > 1 && values_i.len() == values_j.len() {
                            let mean_i = dataset.group_means[group_label][var_i];
                            let mean_j = dataset.group_means[group_label][var_j];

                            // Calculate covariance
                            let cov = calculate_covariance(
                                values_i,
                                values_j,
                                Some(mean_i),
                                Some(mean_j)
                            );

                            group_within[(i, j)] = (df as f64) * cov;
                        }
                    }
                }
            }

            Some((group_within, df))
        })
        .collect();

    // Combine group contributions
    for (group_within, df) in group_contributions {
        pooled_within += &group_within;
        total_df += df;
    }

    // Normalize by total degrees of freedom
    if total_df > 0 {
        pooled_within /= total_df as f64;
    }

    // Add small regularization for numerical stability
    for i in 0..num_vars {
        pooled_within[(i, i)] += EPSILON;
    }

    pooled_within
}

/// Calculate pooled within-groups covariance and correlation matrices
///
/// This function computes both the pooled within-groups covariance matrix and
/// the corresponding correlation matrix for discriminant analysis.
///
/// # Parameters
/// * `data` - The analysis data
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// A PooledMatrices object with covariance and correlation matrices
pub fn calculate_pooled_matrices(
    data: &AnalysisData,
    config: &DiscriminantConfig
) -> Result<PooledMatrices, String> {
    web_sys::console::log_1(&"Executing calculate_pooled_matrices".into());

    // Extract analyzed dataset
    let dataset = extract_analyzed_dataset(data, config)?;
    let variables = &config.main.independent_variables;

    // Calculate pooled within-groups covariance matrix
    let pooled_cov_matrix = calculate_pooled_within_matrix(&dataset, variables);

    // Convert covariance matrix to HashMap format
    let mut covariance = HashMap::new();
    let mut correlation = HashMap::new();

    for (i, var_i) in variables.iter().enumerate() {
        let mut cov_row = HashMap::new();
        let mut corr_row = HashMap::new();

        for (j, var_j) in variables.iter().enumerate() {
            // Store covariance value
            cov_row.insert(var_j.clone(), pooled_cov_matrix[(i, j)]);

            // Calculate correlation value
            let var_i_std = pooled_cov_matrix[(i, i)].sqrt();
            let var_j_std = pooled_cov_matrix[(j, j)].sqrt();

            let corr_value = if var_i_std > EPSILON && var_j_std > EPSILON {
                pooled_cov_matrix[(i, j)] / (var_i_std * var_j_std)
            } else {
                0.0
            };

            corr_row.insert(var_j.clone(), corr_value);
        }

        covariance.insert(var_i.clone(), cov_row);
        correlation.insert(var_i.clone(), corr_row);
    }

    // Calculate degrees of freedom for the pooled matrix
    // For pooled covariance matrix, df = total_cases - num_groups
    let total_df = dataset.total_cases - dataset.num_groups;
    let note_df = format!("a. The covariance matrix has {} degrees of freedom.", total_df);

    Ok(PooledMatrices {
        variables: variables.clone(),
        covariance,
        correlation,
        note_df,
    })
}

/// Calculate covariance matrices for each group
///
/// This function computes the covariance matrix for each group separately
/// in the discriminant analysis.
///
/// # Parameters
/// * `data` - The analysis data
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// A CovarianceMatrices object with covariance matrices for each group
pub fn calculate_covariance_matrices(
    data: &AnalysisData,
    config: &DiscriminantConfig
) -> Result<CovarianceMatrices, String> {
    web_sys::console::log_1(&"Executing calculate_covariance_matrices".into());

    // Extract analyzed dataset
    let dataset = extract_analyzed_dataset(data, config)?;
    let variables = &config.main.independent_variables;

    // Initialize collection for all matrices
    let mut matrices = HashMap::new();

    // Group degrees of freedom (not used for total covariance calculation)
    let mut group_dfs = 0;

    // Calculate covariance matrix for each group in parallel
    let group_matrices: Vec<
        (String, HashMap<String, HashMap<String, f64>>, usize)
    > = dataset.group_labels
        .par_iter()
        .filter_map(|group| {
            // Check if this group has enough data
            let group_size = dataset.group_data
                .get(&variables[0])
                .and_then(|g| g.get(group))
                .map_or(0, |v| v.len());

            if group_size <= 1 {
                return None; // Skip groups with insufficient data
            }

            // Calculate degrees of freedom for this group
            let df = group_size - 1;

            // Create covariance matrix for this group
            let mut group_matrix = HashMap::new();

            for (i, var_i) in variables.iter().enumerate() {
                let mut row = HashMap::new();

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

                            row.insert(var_j.clone(), cov);
                        } else {
                            row.insert(var_j.clone(), 0.0);
                        }
                    } else {
                        row.insert(var_j.clone(), 0.0);
                    }
                }

                group_matrix.insert(var_i.clone(), row);
            }

            Some((group.clone(), group_matrix, df))
        })
        .collect();

    // Combine results
    for (group, matrix, df) in group_matrices {
        matrices.insert(group, matrix);
        group_dfs += df;
    }

    // For total covariance matrix, df = total_cases - 1
    // This is greater than the pooled df because we're using all the data
    // without separating by groups
    let df = dataset.total_cases - 1;

    // Create note for degrees of freedom
    let note_df = format!("a. The total covariance matrix has {} degrees of freedom.", df);

    Ok(CovarianceMatrices {
        groups: dataset.group_labels.clone(),
        variables: variables.clone(),
        matrices,
        note_df,
    })
}

/// Calculate total unexplained variation between groups
///
/// This measures how well the discriminant functions separate the groups.
/// Lower values indicate better separation.
pub fn calculate_total_unexplained_variation(
    dataset: &AnalyzedDataset,
    variables: &[String]
) -> f64 {
    if variables.is_empty() {
        return 1.0; // Maximum unexplained variation
    }

    // Use simpler approach for parallel computation
    let mut unexplained_values = Vec::new();

    for (i, group_i) in dataset.group_labels.iter().enumerate() {
        let values: Vec<f64> = dataset.group_labels[i + 1..]
            .par_iter()
            .map(|group_j| {
                // Calculate Mahalanobis distance between these groups
                let d2 = calculate_group_mahalanobis_distance(dataset, group_i, group_j, variables);

                // Dixon's formula for unexplained variation
                4.0 / (4.0 + d2)
            })
            .collect();
        unexplained_values.extend(values);
    }

    // Sum the pairwise values
    unexplained_values.iter().sum()
}

/// Calculate minimum Mahalanobis distance between any two groups
///
/// Mahalanobis distance accounts for correlations in the data and
/// is scale-invariant, making it useful for multivariate analysis.
pub fn calculate_min_mahalanobis_distance(dataset: &AnalyzedDataset, variables: &[String]) -> f64 {
    if variables.is_empty() || dataset.group_labels.len() < 2 {
        return 0.0;
    }

    // Use simpler approach for parallel computation
    let mut distances = Vec::new();

    for (i, group_i) in dataset.group_labels.iter().enumerate() {
        let group_distances: Vec<f64> = dataset.group_labels[i + 1..]
            .par_iter()
            .map(|group_j| {
                calculate_group_mahalanobis_distance(dataset, group_i, group_j, variables)
            })
            .collect();
        distances.extend(group_distances);
    }

    // Find minimum distance
    if distances.is_empty() {
        0.0
    } else {
        distances.into_iter().fold(f64::MAX, |min_val, val| min_val.min(val))
    }
}

/// Calculate minimum F ratio between any two groups
///
/// The F ratio is a statistical measure based on Mahalanobis distance
/// that accounts for sample size and dimensionality.
pub fn calculate_min_f_ratio(dataset: &AnalyzedDataset, variables: &[String]) -> f64 {
    if variables.is_empty() || dataset.group_labels.len() < 2 {
        return 0.0;
    }

    // Use parallel processing for efficiency
    let mut f_ratios = Vec::new();

    for (i, group_i) in dataset.group_labels.iter().enumerate() {
        let group_f_ratios: Vec<f64> = dataset.group_labels[i + 1..]
            .par_iter()
            .map(|group_j| {
                // Calculate Mahalanobis distance
                let d2 = calculate_group_mahalanobis_distance(dataset, group_i, group_j, variables);

                // Get group sizes
                let n_i = dataset.group_data
                    .get(&variables[0])
                    .and_then(|g| g.get(group_i))
                    .map_or(0, |v| v.len());

                let n_j = dataset.group_data
                    .get(&variables[0])
                    .and_then(|g| g.get(group_j))
                    .map_or(0, |v| v.len());

                if n_i > 0 && n_j > 0 {
                    let p = variables.len() as f64;
                    let n = dataset.total_cases as f64;
                    let g = dataset.num_groups as f64;

                    // Convert to F ratio
                    (d2 * (n - g - p + 1.0) * ((n_i * n_j) as f64)) /
                        (p * (n - g) * ((n_i + n_j) as f64))
                } else {
                    0.0
                }
            })
            .collect();
        f_ratios.extend(group_f_ratios);
    }

    // Find minimum F ratio
    if f_ratios.is_empty() {
        0.0
    } else {
        f_ratios.into_iter().fold(f64::MAX, |min_val, val| min_val.min(val))
    }
}

/// Helper function to calculate Mahalanobis distance between two groups
fn calculate_group_mahalanobis_distance(
    dataset: &AnalyzedDataset,
    group_i: &str,
    group_j: &str,
    variables: &[String]
) -> f64 {
    // Extract means for both groups as vectors
    let mut mean_diff = DVector::zeros(variables.len());

    for (idx, var) in variables.iter().enumerate() {
        let mean_i = dataset.group_means
            .get(group_i)
            .and_then(|m| m.get(var))
            .copied()
            .unwrap_or(0.0);
        let mean_j = dataset.group_means
            .get(group_j)
            .and_then(|m| m.get(var))
            .copied()
            .unwrap_or(0.0);
        mean_diff[idx] = mean_i - mean_j;
    }

    // Build pooled covariance matrix
    let mut pooled_cov = DMatrix::zeros(variables.len(), variables.len());
    let mut total_df = 0;

    for group_label in [group_i, group_j] {
        let n_g = dataset.group_data
            .get(&variables[0])
            .and_then(|g| g.get(group_label))
            .map_or(0, |v| v.len());

        if n_g <= 1 {
            continue;
        }

        let df = n_g - 1;
        total_df += df;

        // Calculate covariance contribution for this group
        for (i, var_i) in variables.iter().enumerate() {
            for (j, var_j) in variables.iter().enumerate() {
                if
                    let (Some(values_i), Some(values_j)) = (
                        dataset.group_data.get(var_i).and_then(|g| g.get(group_label)),
                        dataset.group_data.get(var_j).and_then(|g| g.get(group_label)),
                    )
                {
                    if values_i.len() == values_j.len() && values_i.len() > 1 {
                        let mean_i = dataset.group_means[group_label][var_i];
                        let mean_j = dataset.group_means[group_label][var_j];

                        // Calculate covariance
                        let cov = calculate_covariance(
                            values_i,
                            values_j,
                            Some(mean_i),
                            Some(mean_j)
                        );

                        pooled_cov[(i, j)] += (df as f64) * cov;
                    }
                }
            }
        }
    }

    // Normalize pooled covariance
    if total_df > 0 {
        pooled_cov /= total_df as f64;
    } else {
        // If no valid covariance, return a simple Euclidean distance
        return mean_diff.norm_squared();
    }

    // Add small regularization for numerical stability
    for i in 0..variables.len() {
        pooled_cov[(i, i)] += EPSILON;
    }

    // Calculate Mahalanobis distance
    match pooled_cov.try_inverse() {
        Some(inv_cov) => (mean_diff.transpose() * (inv_cov * mean_diff))[0],
        None => mean_diff.norm_squared(), // Fallback to Euclidean distance
    }
}

/// Calculate Rao's V statistic
///
/// Rao's V (Lawley-Hotelling Trace) is a multivariate test statistic
/// that measures the separation between group means.
pub fn calculate_raos_v(dataset: &AnalyzedDataset, variables: &[String]) -> f64 {
    if variables.is_empty() {
        return 0.0;
    }

    // Calculate between-groups and within-groups matrices
    let (between_mat, within_mat) = calculate_between_within_matrices(dataset, variables);

    // Try to invert within-groups matrix
    match within_mat.clone().try_inverse() {
        Some(w_inv) => {
            // Calculate Rao's V = trace(W^-1 * B)
            let product = w_inv * between_mat;
            (0..variables.len()).map(|i| product[(i, i)]).sum()
        }
        None => {
            // If matrix is singular, use trace of between-groups matrix
            (0..variables.len()).map(|i| between_mat[(i, i)]).sum()
        }
    }
}
