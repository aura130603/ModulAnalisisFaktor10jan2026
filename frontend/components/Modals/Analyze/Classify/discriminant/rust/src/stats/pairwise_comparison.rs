//! Pairwise comparisons between groups for discriminant analysis.
//!
//! This module implements functions to generate pairwise comparisons
//! between groups and calculate Mahalanobis distances.

use std::collections::HashMap;
use rayon::prelude::*;

use crate::{
    models::result::PairwiseComparison,
    stats::core::{ calculate_p_value_from_f, AnalyzedDataset },
};

/// Generate pairwise comparisons between groups
///
/// This function calculates F values and significance levels for
/// all pairs of groups, based on the Mahalanobis distance between them.
///
/// # Parameters
/// * `dataset` - The analyzed dataset
/// * `variables` - Variables to use in the comparisons
/// * `step` - Current step in the stepwise procedure
///
/// # Returns
/// A HashMap mapping group names to vectors of pairwise comparisons
pub fn generate_pairwise_comparisons(
    dataset: &AnalyzedDataset,
    variables: &[String],
    step: i32
) -> HashMap<String, Vec<PairwiseComparison>> {
    if variables.is_empty() {
        return HashMap::new();
    }

    // Use parallel processing for group comparisons
    let results: HashMap<String, Vec<PairwiseComparison>> = dataset.group_labels
        .par_iter()
        .map(|group_i| {
            let group_comparisons = dataset.group_labels
                .iter()
                .filter(|&group_j| group_i != group_j)
                .filter_map(|group_j| {
                    // Calculate Mahalanobis distance between groups
                    let d2 = calculate_mahalanobis_distance(dataset, group_i, group_j, variables);

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

                        let f_value =
                            (d2 * (n - g - p + 1.0) * ((n_i * n_j) as f64)) /
                            (p * (n - g) * ((n_i + n_j) as f64));

                        // Calculate significance
                        let p_value = calculate_p_value_from_f(f_value, p, n - g - p + 1.0);

                        Some(PairwiseComparison {
                            step,
                            group_name: group_j.clone(),
                            f_value,
                            significance: p_value,
                        })
                    } else {
                        None
                    }
                })
                .collect::<Vec<_>>();

            (group_i.clone(), group_comparisons)
        })
        .filter(|(_, comparisons)| !comparisons.is_empty())
        .collect();

    results
}

/// Calculate Mahalanobis distance between two specific groups
///
/// The Mahalanobis distance accounts for the correlation between variables
/// and is scale-invariant. It measures the separation between group means.
///
/// # Parameters
/// * `dataset` - The analyzed dataset
/// * `group_i` - First group name
/// * `group_j` - Second group name
/// * `variables` - Variables to use in the calculation
///
/// # Returns
/// The squared Mahalanobis distance between the groups
pub fn calculate_mahalanobis_distance(
    dataset: &AnalyzedDataset,
    group_i: &str,
    group_j: &str,
    variables: &[String]
) -> f64 {
    // Optimized version for specific group pairs
    use nalgebra::{ DVector, DMatrix };
    use crate::stats::core::{ calculate_covariance, EPSILON };

    // Extract means for both groups
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

    // Calculate pooled covariance matrix for these two groups
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

    // Try to invert the matrix using nalgebra
    match pooled_cov.try_inverse() {
        Some(inv_cov) => {
            // Calculate Mahalanobis distance squared
            let d2 = (mean_diff.transpose() * (inv_cov * mean_diff))[0];
            d2
        }
        None => {
            // If matrix is singular, use a simplified approach
            let d2 = mean_diff.norm_squared();
            d2
        }
    }
}
