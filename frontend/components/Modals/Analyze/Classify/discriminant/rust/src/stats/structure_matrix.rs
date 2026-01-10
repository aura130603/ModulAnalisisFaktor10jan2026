use std::collections::HashMap;

use crate::models::{ result::StructureMatrix, AnalysisData, DiscriminantConfig };

use super::core::{
    calculate_canonical_functions,
    calculate_correlation,
    calculate_eigen_statistics,
    extract_analyzed_dataset,
    extract_case_values,
};

/// Calculate structure matrix for discriminant functions
///
/// This function calculates the pooled within-groups correlations between
/// each original variable and each discriminant function.
///
/// # Parameters
/// * `data` - The analysis data
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// A StructureMatrix object with correlations between variables and functions
pub fn calculate_structure_matrix(
    data: &AnalysisData,
    config: &DiscriminantConfig
) -> Result<StructureMatrix, String> {
    web_sys::console::log_1(&"Executing calculate_structure_matrix".into());

    // Extract analyzed dataset
    let dataset = extract_analyzed_dataset(data, config)?;
    let variables = &config.main.independent_variables;

    // Calculate discriminant functions and get eigenvalues
    let canonical_functions = calculate_canonical_functions(data, config)?;
    let eigen_stats = calculate_eigen_statistics(data, config)?;

    // Number of functions
    let num_functions = eigen_stats.eigenvalue.len();

    // Initialize structure matrix
    let mut correlations = HashMap::new();

    // Calculate and store discriminant scores for each case
    let mut all_function_scores: Vec<Vec<f64>> = vec![Vec::new(); num_functions];
    let mut all_variable_values: HashMap<String, Vec<f64>> = variables
        .iter()
        .map(|var| (var.clone(), Vec::new()))
        .collect();

    // Calculate function scores for all cases
    for group_data in &data.group_data {
        for case in group_data {
            // Extract case values for independent variables
            let case_values = extract_case_values(case, variables);
            if case_values.len() != variables.len() {
                continue;
            }

            // Calculate discriminant scores for this case
            let discriminant_scores = variables
                .iter()
                .enumerate()
                .fold(vec![0.0; num_functions], |mut scores, (var_idx, var_name)| {
                    if let Some(coefs) = canonical_functions.coefficients.get(var_name) {
                        for func_idx in 0..num_functions {
                            if func_idx < coefs.len() && var_idx < case_values.len() {
                                scores[func_idx] += case_values[var_idx] * coefs[func_idx];
                            }
                        }
                    }
                    scores
                });

            // Add constants
            let mut final_scores = discriminant_scores.clone();
            if let Some(constants) = canonical_functions.coefficients.get("(Constant)") {
                for func_idx in 0..num_functions.min(constants.len()) {
                    final_scores[func_idx] += constants[func_idx];
                }
            }

            // Store function scores and variable values
            for func_idx in 0..num_functions {
                all_function_scores[func_idx].push(final_scores[func_idx]);
            }

            for (var_idx, var_name) in variables.iter().enumerate() {
                if var_idx < case_values.len() {
                    all_variable_values.get_mut(var_name).unwrap().push(case_values[var_idx]);
                }
            }
        }
    }

    // Calculate correlations between each variable and each function
    for var_name in variables {
        let var_values = all_variable_values.get(var_name).unwrap();
        let mut var_correlations = Vec::with_capacity(num_functions);

        for func_idx in 0..num_functions {
            let func_scores = &all_function_scores[func_idx];

            // Ensure we have enough data
            if var_values.len() == func_scores.len() && !var_values.is_empty() {
                let correlation = calculate_correlation(var_values, func_scores);
                var_correlations.push(correlation);
            } else {
                var_correlations.push(0.0);
            }
        }

        correlations.insert(var_name.clone(), var_correlations);
    }

    // Create function names (Function 1, Function 2, etc.)
    let functions: Vec<String> = (1..=num_functions).map(|i| format!("Function {}", i)).collect();

    Ok(StructureMatrix {
        variables: variables.clone(),
        correlations,
    })
}
