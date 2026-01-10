use std::collections::HashMap;

use crate::models::{ result::PriorProbabilities, AnalysisData, DiscriminantConfig };

use super::core::extract_analyzed_dataset;

/// Calculate prior probabilities for discriminant analysis
///
/// This function calculates prior probabilities for groups,
/// either based on equal probabilities or group sizes.
///
/// # Parameters
/// * `data` - The analysis data
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// A PriorProbabilities object with prior probabilities for each group
pub fn calculate_prior_probabilities(
    data: &AnalysisData,
    config: &DiscriminantConfig
) -> Result<PriorProbabilities, String> {
    web_sys::console::log_1(&"Executing calculate_prior_probabilities".into());

    // Extract analyzed dataset
    let dataset = extract_analyzed_dataset(data, config)?;

    let num_groups = dataset.group_labels.len();
    let mut groups = Vec::with_capacity(num_groups);
    let mut prior_probabilities = Vec::with_capacity(num_groups);
    let mut cases_used = HashMap::new();

    // Count cases in each group
    let mut total_cases = 0;
    let mut group_sizes = Vec::with_capacity(num_groups);

    for (i, group) in dataset.group_labels.iter().enumerate() {
        let group_size = dataset.group_data
            .get(dataset.group_data.keys().next().unwrap_or(&String::new()))
            .and_then(|g| g.get(group))
            .map_or(0, |v| v.len());

        total_cases += group_size;
        group_sizes.push(group_size);
        groups.push(i + 1); // 1-based group indices
    }

    // Calculate prior probabilities
    if config.classify.all_group_equal {
        // Equal priors
        for _ in 0..num_groups {
            prior_probabilities.push(1.0 / (num_groups as f64));
        }
    } else if config.classify.group_size {
        // Priors based on group sizes
        if total_cases > 0 {
            for size in &group_sizes {
                prior_probabilities.push((*size as f64) / (total_cases as f64));
            }
        } else {
            // Fallback to equal priors if no cases
            for _ in 0..num_groups {
                prior_probabilities.push(1.0 / (num_groups as f64));
            }
        }
    } else {
        // Default to equal priors
        for _ in 0..num_groups {
            prior_probabilities.push(1.0 / (num_groups as f64));
        }
    }

    // Populate cases_used
    cases_used.insert("Numbers".to_string(), group_sizes);

    Ok(PriorProbabilities {
        groups,
        prior_probabilities,
        cases_used,
        total: total_cases as f64,
    })
}
