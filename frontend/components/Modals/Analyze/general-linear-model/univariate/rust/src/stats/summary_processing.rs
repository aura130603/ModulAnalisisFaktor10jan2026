use std::collections::{ BTreeMap, HashMap };

use crate::models::{ config::UnivariateConfig, data::AnalysisData, result::BetweenSubjectFactors };

use super::core::*;

pub fn basic_processing_summary(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<HashMap<String, BetweenSubjectFactors>, String> {
    let mut result = HashMap::new();

    if let Some(fix_factors) = &config.main.fix_factor {
        if !fix_factors.is_empty() {
            let mut factor_counts: HashMap<String, BTreeMap<String, usize>> = HashMap::new();

            for factor_name in fix_factors {
                let levels = get_factor_levels(data, factor_name)?;
                let level_counts = levels
                    .into_iter()
                    .map(|level| (level, 0))
                    .collect();
                factor_counts.insert(factor_name.clone(), level_counts);
            }

            for data_records in &data.fix_factor_data {
                for record in data_records {
                    for (factor_name, value) in &record.values {
                        if let Some(counts) = factor_counts.get_mut(factor_name) {
                            let level = data_value_to_string(value);
                            *counts.entry(level).or_insert(0) += 1;
                        }
                    }
                }
            }

            for (factor_name, sorted_counts) in factor_counts {
                result.insert(factor_name, BetweenSubjectFactors {
                    factors: sorted_counts,
                    note: None,
                    interpretation: Some(
                        "This table shows the frequency count (N) for each level of the between-subjects factors. It indicates how many subjects or observations fall into each category.".to_string()
                    ),
                });
            }
        }
    }

    if let Some(random_factors) = &config.main.rand_factor {
        if let Some(random_factor_data) = &data.random_factor_data {
            if !random_factors.is_empty() {
                let mut factor_counts: HashMap<String, BTreeMap<String, usize>> = HashMap::new();

                for factor_name in random_factors {
                    let levels = get_factor_levels(data, factor_name)?;
                    let level_counts = levels
                        .into_iter()
                        .map(|level| (level, 0))
                        .collect();
                    factor_counts.insert(factor_name.clone(), level_counts);
                }

                for data_records in random_factor_data {
                    for record in data_records {
                        for (factor_name, value) in &record.values {
                            if let Some(counts) = factor_counts.get_mut(factor_name) {
                                let level = data_value_to_string(value);
                                *counts.entry(level).or_insert(0) += 1;
                            }
                        }
                    }
                }

                for (factor_name, sorted_counts) in factor_counts {
                    let key = format!("{} (Random)", factor_name);
                    result.insert(key, BetweenSubjectFactors {
                        factors: sorted_counts,
                        note: None,
                        interpretation: Some(
                            "This table shows the frequency count (N) for each level of the between-subjects factors. It indicates how many subjects or observations fall into each category.".to_string()
                        ),
                    });
                }
            }
        }
    }

    Ok(result)
}
