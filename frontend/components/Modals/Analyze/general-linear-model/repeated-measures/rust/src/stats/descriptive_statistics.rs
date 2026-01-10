use statrs::statistics::{ Data, Statistics };
use std::collections::HashMap;

use crate::models::{
    config::RepeatedMeasuresConfig,
    data::{ AnalysisData, DataValue },
    result::{ DescriptiveStatistics, StatGroup, StatsEntry },
};

use super::core::parse_within_subject_factors;

/// Calculate descriptive statistics for repeated measures data
fn calculate_descriptive_statistics(
    data: &AnalysisData,
    config: &RepeatedMeasuresConfig
) -> Result<HashMap<String, DescriptiveStatistics>, String> {
    let mut descriptive_stats = HashMap::new();

    // Create within-subjects factors structure if needed
    let within_factors = parse_within_subject_factors(data, config)?;

    // Process each dependent variable (measure)
    for (factor_name, factors) in &within_factors.measures {
        for factor in factors {
            let var_name = &factor.dependent_variable;

            // Initialize statistics structure
            let mut stats = DescriptiveStatistics {
                dependent_variable: var_name.clone(),
                groups: Vec::new(),
            };

            // Group factors and extract data for this variable
            for factor_level_name in factor.factor_values.keys() {
                let factor_level_value = factor.factor_values.get(factor_level_name).unwrap();

                // Extract data values for this variable and factor level
                let mut values = Vec::new();
                for record_group in &data.subject_data {
                    for record in record_group {
                        if let Some(data_value) = record.values.get(var_name) {
                            match data_value {
                                DataValue::Number(val) => values.push(*val),
                                _ => {
                                    continue;
                                }
                            }
                        }
                    }
                }

                // Calculate statistics using statrs
                if !values.is_empty() {
                    let data_obj = Data::new(&values);

                    let stats_entry = StatsEntry {
                        mean: data_obj.mean(),
                        std_deviation: data_obj.std_dev(),
                        n: values.len(),
                    };

                    // Create factor group
                    let group = StatGroup {
                        factor_name: factor_level_name.clone(),
                        factor_value: factor_level_value.clone(),
                        stats: stats_entry,
                        subgroups: None, // Would be populated for between-subjects factors
                    };

                    stats.groups.push(group);
                }
            }

            // Add between-subjects factors if any
            if let Some(between_factors) = &config.model.bet_sub_var {
                add_between_subjects_groups(&mut stats, data, between_factors)?;
            }

            descriptive_stats.insert(var_name.clone(), stats);
        }
    }

    Ok(descriptive_stats)
}

/// Helper function to add between-subjects factor groups
fn add_between_subjects_groups(
    stats: &mut DescriptiveStatistics,
    data: &AnalysisData,
    between_factors: &[String]
) -> Result<(), String> {
    // For each existing group, add subgroups based on between-subjects factors
    let mut updated_groups = Vec::new();

    for group in &stats.groups {
        let mut group_with_subgroups = group.clone();
        let mut subgroups = Vec::new();

        // Process each between-subjects factor
        for factor_name in between_factors {
            // Get factor levels from data
            let factor_levels = extract_factor_levels(data, factor_name)?;

            // Create subgroups for each level
            for level in &factor_levels {
                // Extract data for this variable, factor level, and between-subjects level
                let mut values = Vec::new();
                for record_group in &data.factors_data {
                    for record in record_group {
                        // Filter by the between-subjects factor
                        if let Some(factor_value) = record.values.get(factor_name) {
                            if
                                matches!(factor_value, DataValue::Text(val) if val == level) ||
                                matches!(factor_value, DataValue::Number(val) if val.to_string() == *level)
                            {
                                // Get the corresponding subject data
                                if
                                    let Some(data_value) = record.values.get(
                                        &stats.dependent_variable
                                    )
                                {
                                    match data_value {
                                        DataValue::Number(val) => values.push(*val),
                                        _ => {
                                            continue;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Calculate statistics using statrs
                if !values.is_empty() {
                    let data_obj = Data::new(&values);

                    let stats_entry = StatsEntry {
                        mean: data_obj.mean(),
                        std_deviation: data_obj.std_dev(),
                        n: values.len(),
                    };

                    // Create subgroup
                    let subgroup = StatGroup {
                        factor_name: factor_name.clone(),
                        factor_value: level.clone(),
                        stats: stats_entry,
                        subgroups: None,
                    };

                    subgroups.push(subgroup);
                }
            }
        }

        if !subgroups.is_empty() {
            group_with_subgroups.subgroups = Some(subgroups);
        }

        updated_groups.push(group_with_subgroups);
    }

    stats.groups = updated_groups;
    Ok(())
}

/// Extract unique factor levels from data
fn extract_factor_levels(data: &AnalysisData, factor_name: &str) -> Result<Vec<String>, String> {
    let mut levels = Vec::new();

    for record_group in &data.factors_data {
        for record in record_group {
            if let Some(value) = record.values.get(factor_name) {
                let level = match value {
                    DataValue::Number(val) => val.to_string(),
                    DataValue::Text(val) => val.clone(),
                    DataValue::Boolean(val) => val.to_string(),
                    DataValue::Null => {
                        continue;
                    }
                };

                if !levels.contains(&level) {
                    levels.push(level);
                }
            }
        }
    }

    Ok(levels)
}
