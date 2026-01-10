use std::collections::HashMap;

use crate::models::{
    config::MultivariateConfig,
    data::AnalysisData,
    result::{ DescriptiveStatistics, StatGroup, StatsEntry },
};

use super::core::{
    calculate_mean,
    calculate_std_deviation,
    data_value_to_string,
    extract_dependent_value,
    get_factor_combinations,
    get_factor_levels,
};

/// Calculate descriptive statistics
pub fn calculate_descriptive_statistics(
    data: &AnalysisData,
    config: &MultivariateConfig
) -> Result<HashMap<String, DescriptiveStatistics>, String> {
    let mut result = HashMap::new();

    // Get dependent variables
    let dependent_vars = data.dependent_data_defs
        .iter()
        .flat_map(|defs| defs.iter().map(|def| def.name.clone()))
        .collect::<Vec<String>>();

    for dep_var in dependent_vars {
        let mut descriptive_stats = DescriptiveStatistics {
            dependent_variable: dep_var.clone(),
            groups: Vec::new(),
        };

        // Get factor combinations
        if let Ok(combinations) = get_factor_combinations(data, config) {
            // If we have factor combinations, process them
            if !combinations.is_empty() && combinations[0].is_empty() {
                // No factors - create overall statistics
                let mut all_values = Vec::new();
                for records in &data.dependent_data {
                    for record in records {
                        if let Some(value) = extract_dependent_value(record, &dep_var) {
                            all_values.push(value);
                        }
                    }
                }

                if !all_values.is_empty() {
                    let mean = calculate_mean(&all_values);
                    let std_dev = calculate_std_deviation(&all_values, Some(mean));

                    descriptive_stats.groups.push(StatGroup {
                        factor_name: "Overall".to_string(),
                        factor_value: "".to_string(),
                        stats: StatsEntry {
                            mean,
                            std_deviation: std_dev,
                            n: all_values.len(),
                        },
                        subgroups: None,
                    });
                }
            } else {
                // Has factors - calculate stats for each factor level
                if let Some(factors) = &config.main.fix_factor {
                    for factor in factors {
                        if let Ok(levels) = get_factor_levels(data, factor) {
                            for level in levels {
                                let mut values = Vec::new();

                                // Get values for this factor level
                                for records in &data.dependent_data {
                                    for record in records {
                                        if let Some(factor_value) = record.values.get(factor) {
                                            if data_value_to_string(factor_value) == level {
                                                if
                                                    let Some(value) = extract_dependent_value(
                                                        record,
                                                        &dep_var
                                                    )
                                                {
                                                    values.push(value);
                                                }
                                            }
                                        }
                                    }
                                }

                                if !values.is_empty() {
                                    let mean = calculate_mean(&values);
                                    let std_dev = calculate_std_deviation(&values, Some(mean));

                                    // Create subgroups based on other factors if needed
                                    let subgroups = if factors.len() > 1 {
                                        Some(Vec::new()) // Would be filled with nested factor level groups
                                    } else {
                                        None
                                    };

                                    descriptive_stats.groups.push(StatGroup {
                                        factor_name: factor.clone(),
                                        factor_value: level,
                                        stats: StatsEntry {
                                            mean,
                                            std_deviation: std_dev,
                                            n: values.len(),
                                        },
                                        subgroups,
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }

        result.insert(dep_var, descriptive_stats);
    }

    Ok(result)
}
