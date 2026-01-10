use std::collections::HashMap;

use crate::models::{
    config::MultivariateConfig,
    data::AnalysisData,
    result::BetweenSubjectFactors,
};

use super::core::{ data_value_to_string, get_factor_levels };

/// Calculate basic processing summary
pub fn basic_processing_summary(
    data: &AnalysisData,
    config: &MultivariateConfig
) -> Result<HashMap<String, BetweenSubjectFactors>, String> {
    let mut result = HashMap::new();

    // Process between-subjects factors
    if let Some(factors) = &config.main.fix_factor {
        for factor in factors {
            if let Ok(levels) = get_factor_levels(data, factor) {
                let mut factor_summary = BetweenSubjectFactors {
                    value_counts: HashMap::new(),
                    n: None,
                };

                // Count occurrences of each level
                for level in &levels {
                    let count = data.fix_factor_data
                        .iter()
                        .flat_map(|records| records.iter())
                        .filter(|record| {
                            record.values
                                .get(factor)
                                .map(|v| data_value_to_string(v) == *level)
                                .unwrap_or(false)
                        })
                        .count();

                    factor_summary.value_counts.insert(level.clone(), count);
                }

                // Set total count
                let total_count = factor_summary.value_counts.values().sum();
                factor_summary.n = Some(total_count);

                result.insert(factor.clone(), factor_summary);
            }
        }
    }

    Ok(result)
}
