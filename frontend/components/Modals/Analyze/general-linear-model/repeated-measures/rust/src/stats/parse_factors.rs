use std::collections::HashMap;
use regex::Regex;

use crate::models::{
    config::RepeatedMeasuresConfig,
    data::AnalysisData,
    result::{ WithinSubjectFactor, WithinSubjectsFactors },
};

/// Parse within-subject factor string in format "variable_(level1,level2,...,measure_name)"
pub fn parse_within_subject_factors(
    data: &AnalysisData,
    config: &RepeatedMeasuresConfig
) -> Result<WithinSubjectsFactors, String> {
    // Initialize measures map
    let mut measures: HashMap<String, Vec<WithinSubjectFactor>> = HashMap::new();

    // Create regex for parsing variable format
    let var_pattern = Regex::new(r"(\w+)_\((\d+(?:,\d+)*),(\w+)\)").map_err(|e| e.to_string())?;

    // Get the variable definitions
    let var_defs = &data.subject_data_defs[0];

    // Process each variable
    for var_def in var_defs {
        let var_name = &var_def.name;

        if let Some(captures) = var_pattern.captures(var_name) {
            let factor_name = captures.get(1).unwrap().as_str().to_string();
            let level_str = captures.get(2).unwrap().as_str();
            let measure_name = captures.get(3).unwrap().as_str().to_string();

            // Parse levels
            let levels: Vec<u32> = level_str
                .split(',')
                .filter_map(|s| s.parse::<u32>().ok())
                .collect();

            // Create factor values map
            let mut factor_values = HashMap::new();
            if let Some(def_factors) = &config.model.def_factors {
                // Parse factor names and levels from config
                let factor_names: Vec<&str> = def_factors
                    .split(';')
                    .map(|s| s.trim())
                    .collect();

                // Assign factor values based on levels and names
                for (i, &level) in levels.iter().enumerate() {
                    if i < factor_names.len() {
                        factor_values.insert(factor_names[i].to_string(), level.to_string());
                    } else {
                        factor_values.insert(format!("Factor{}", i + 1), level.to_string());
                    }
                }
            } else {
                // Default naming if no config provided
                for (i, &level) in levels.iter().enumerate() {
                    factor_values.insert(format!("Level{}", i + 1), level.to_string());
                }
            }

            // Create the within subject factor
            let factor = WithinSubjectFactor {
                factor_values,
                dependent_variable: var_name.clone(),
            };

            // Add to measures map
            measures.entry(factor_name).or_insert_with(Vec::new).push(factor);
        }
    }

    Ok(WithinSubjectsFactors { measures })
}
