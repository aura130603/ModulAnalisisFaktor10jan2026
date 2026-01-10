use std::collections::HashMap;

use crate::models::{
    result::{ CanonicalFunctions, CasewiseStatistics, HighestGroupStatistics },
    AnalysisData,
    DiscriminantConfig,
};

use super::core::{
    calculate_canonical_functions,
    calculate_eigen_statistics,
    calculate_prior_probabilities,
    extract_analyzed_dataset,
    extract_case_values,
    extract_record_groups,
};

/// Calculate detailed statistics for each case
///
/// This function computes detailed statistics for each case, including
/// actual group, predicted group, probabilities, and discriminant scores.
///
/// # Parameters
/// * `data` - The analysis data
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// A CasewiseStatistics object with detailed results for each case
pub fn calculate_casewise_statistics(
    data: &AnalysisData,
    config: &DiscriminantConfig
) -> Result<CasewiseStatistics, String> {
    web_sys::console::log_1(&"Executing calculate_casewise_statistics".into());

    // Check if casewise results are requested
    if !config.classify.case {
        return Err("Casewise statistics not requested in configuration".to_string());
    }

    // Extract analyzed dataset
    let dataset = extract_analyzed_dataset(data, config)?;
    let independent_variables = &config.main.independent_variables;

    // Extract record groups mapping
    let record_groups = extract_record_groups(data, &config.main.grouping_variable);

    // Calculate discriminant functions and get eigenvalues
    let canonical_functions = calculate_canonical_functions(data, config)?;
    let eigen_stats = calculate_eigen_statistics(data, config)?;
    let num_functions = eigen_stats.eigenvalue.len();

    // Initialize result structures
    let mut case_number = Vec::new();
    let mut actual_group = Vec::new();
    let mut predicted_group = Vec::new();

    // Highest group statistics
    let mut highest_p_value = Vec::new();
    let mut highest_df = Vec::new();
    let mut highest_p_g_equals_d = Vec::new();
    let mut highest_squared_mahalanobis_distance = Vec::new();
    let mut highest_group = Vec::new();

    // Second highest group statistics
    let mut second_p_value = Vec::new();
    let mut second_df = Vec::new();
    let mut second_p_g_equals_d = Vec::new();
    let mut second_squared_mahalanobis_distance = Vec::new();
    let mut second_group = Vec::new();

    // Discriminant scores
    let mut discriminant_scores: HashMap<String, Vec<f64>> = (1..=num_functions)
        .map(|i| (format!("Function {}", i), Vec::new()))
        .collect();

    // Calculate prior probabilities using the existing function
    let prior_probs = calculate_prior_probabilities(data, config)?;

    // Limit processing to requested number of cases if specified
    let limit = if config.classify.limit {
        config.classify.limit_value.unwrap_or(i32::MAX) as usize
    } else {
        usize::MAX
    };

    // Process each case
    let mut case_idx = 0;
    let mut processed_cases = 0;

    for group_idx in 0..data.group_data.len() {
        for (case_i, case) in data.group_data[group_idx].iter().enumerate() {
            // Check if we've reached the limit
            if processed_cases >= limit {
                break;
            }

            case_idx += 1;

            // Get actual group
            let actual_group_name = match record_groups.get(&(group_idx * 1000 + case_i)) {
                Some(name) if dataset.group_labels.contains(name) => name.clone(),
                _ => {
                    continue;
                } // Skip cases without valid group
            };

            // Extract case values
            let case_values = extract_case_values(case, independent_variables);
            if case_values.len() != independent_variables.len() {
                continue;
            }

            // Calculate discriminant scores
            let disc_scores = calculate_discriminant_scores(
                &case_values,
                &canonical_functions,
                independent_variables,
                num_functions
            );

            // Store discriminant scores
            for (func_idx, score) in disc_scores.iter().enumerate() {
                if
                    let Some(scores) = discriminant_scores.get_mut(
                        &format!("Function {}", func_idx + 1)
                    )
                {
                    scores.push(*score);
                }
            }

            // Calculate probabilities and Mahalanobis distances for each group
            let mut group_probs = Vec::new();
            let mut group_distances = Vec::new();

            for (group_idx, group_name) in dataset.group_labels.iter().enumerate() {
                // Get group centroid
                let centroid = disc_scores
                    .iter()
                    .enumerate()
                    .map(|(i, _)| {
                        canonical_functions.function_at_centroids
                            .get(group_name)
                            .map_or(0.0, |c| *c.get(i).unwrap_or(&0.0))
                    })
                    .collect::<Vec<f64>>();

                // Calculate squared Mahalanobis distance
                let mut d2 = 0.0;
                for i in 0..disc_scores.len() {
                    d2 += (disc_scores[i] - centroid[i]).powi(2);
                }

                group_distances.push((group_idx, d2));

                // Calculate posterior probability using priors from prior_probabilities.rs
                let prior = if group_idx < prior_probs.prior_probabilities.len() {
                    prior_probs.prior_probabilities[group_idx]
                } else {
                    1.0 / (dataset.num_groups as f64)
                };

                let log_prior = prior.ln();
                let log_prob = log_prior - 0.5 * d2;
                group_probs.push((group_idx, log_prob));
            }

            // Sort by probability (descending)
            group_probs.sort_by(|(_, a), (_, b)|
                b.partial_cmp(a).unwrap_or(std::cmp::Ordering::Equal)
            );

            // Normalize probabilities
            let max_log_prob = group_probs[0].1;
            let mut sum_exp = 0.0;

            for (_, log_prob) in &mut group_probs {
                *log_prob = (*log_prob - max_log_prob).exp();
                sum_exp += *log_prob;
            }

            if sum_exp > 0.0 {
                for (_, prob) in &mut group_probs {
                    *prob /= sum_exp;
                }
            }

            // Get highest and second highest groups
            let highest = &group_probs[0];
            let second = if group_probs.len() > 1 { &group_probs[1] } else { highest };

            // Find corresponding distances
            let highest_dist = group_distances
                .iter()
                .find(|(idx, _)| *idx == highest.0)
                .unwrap().1;
            let second_dist = group_distances
                .iter()
                .find(|(idx, _)| *idx == second.0)
                .unwrap().1;

            // Add case information
            case_number.push(case_idx);
            actual_group.push(actual_group_name);
            predicted_group.push(dataset.group_labels[highest.0].clone());

            // Highest group statistics
            highest_p_value.push(highest_dist);
            highest_df.push(num_functions);
            highest_p_g_equals_d.push(highest.1);
            highest_squared_mahalanobis_distance.push(highest_dist);
            highest_group.push(dataset.group_labels[highest.0].clone());

            // Second highest group statistics
            second_p_value.push(second_dist);
            second_df.push(num_functions);
            second_p_g_equals_d.push(second.1);
            second_squared_mahalanobis_distance.push(second_dist);
            second_group.push(dataset.group_labels[second.0].clone());

            processed_cases += 1;
        }

        if processed_cases >= limit {
            break;
        }
    }

    Ok(CasewiseStatistics {
        case_number,
        actual_group,
        predicted_group,
        highest_group: HighestGroupStatistics {
            p_value: highest_p_value,
            df: highest_df,
            p_g_equals_d: highest_p_g_equals_d,
            squared_mahalanobis_distance: highest_squared_mahalanobis_distance,
            group: highest_group,
        },
        second_highest_group: HighestGroupStatistics {
            p_value: second_p_value,
            df: second_df,
            p_g_equals_d: second_p_g_equals_d,
            squared_mahalanobis_distance: second_squared_mahalanobis_distance,
            group: second_group,
        },
        discriminant_scores,
    })
}

/// Calculate discriminant scores for a case
///
/// Helper function to calculate discriminant scores for a case.
///
/// # Parameters
/// * `case_values` - Values of the independent variables for the case
/// * `canonical_functions` - Canonical discriminant functions
/// * `variables` - Names of the independent variables
/// * `num_functions` - Number of discriminant functions
///
/// # Returns
/// A vector of discriminant scores for the case
fn calculate_discriminant_scores(
    case_values: &[f64],
    canonical_functions: &CanonicalFunctions,
    variables: &[String],
    num_functions: usize
) -> Vec<f64> {
    // Initialize scores
    let mut discriminant_scores = vec![0.0; num_functions];

    // Calculate function values
    for (var_idx, var_name) in variables.iter().enumerate() {
        if let Some(coefs) = canonical_functions.coefficients.get(var_name) {
            for func_idx in 0..num_functions {
                if func_idx < coefs.len() && var_idx < case_values.len() {
                    discriminant_scores[func_idx] += case_values[var_idx] * coefs[func_idx];
                }
            }
        }
    }

    // Add constants
    if let Some(constants) = canonical_functions.coefficients.get("(Constant)") {
        for func_idx in 0..num_functions.min(constants.len()) {
            discriminant_scores[func_idx] += constants[func_idx];
        }
    }

    discriminant_scores
}
