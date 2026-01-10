use serde::{ Deserialize, Serialize };
use std::collections::HashMap;

use crate::{
    models::{
        result::{
            PairwiseComparison,
            StepwiseNote,
            StepwiseStatistics,
            VariableInAnalysis,
            VariableNotInAnalysis,
        },
        AnalysisData,
        DiscriminantConfig,
    },
    stats::core::{
        calculate_p_value_from_f,
        calculate_univariate_f,
        extract_analyzed_dataset,
        AnalyzedDataset,
    },
};

use super::core::{
    analyze_variables_in_model,
    analyze_variables_not_in_model,
    calculate_overall_wilks_lambda,
    determine_method_type,
    filter_dataset,
    find_best_variable_to_enter,
    find_worst_variable_to_remove,
    generate_pairwise_comparisons,
};

/// Method type enum for different stepwise methods
#[derive(Copy, Clone, Debug, PartialEq)]
pub enum MethodType {
    Wilks,
    Unexplained,
    Mahalanobis,
    FRatio,
    Raos,
}

/// Helper struct to store step data
#[derive(Debug, Serialize, Deserialize, Clone)]
struct StepData {
    variable_entered: Option<String>,
    variable_removed: Option<String>,
    wilks_lambda: f64,
    f_value: f64,
    df1: i32,
    df2: i32,
    df3: i32,
    exact_f: f64,
    exact_df1: i32,
    exact_df2: i32,
    significance: f64,
    variables_in_analysis: Vec<VariableInAnalysis>,
    variables_not_in_analysis: Vec<VariableNotInAnalysis>,
    pairwise_comparisons: HashMap<String, Vec<PairwiseComparison>>,
}

/// Calculate statistics for stepwise discriminant analysis
///
/// This function performs stepwise variable selection and calculates
/// associated statistics for discriminant analysis.
///
/// # Parameters
/// * `data` - The analysis data
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// A StepwiseStatistics object with variable selection results
pub fn calculate_stepwise_statistics(
    data: &AnalysisData,
    config: &DiscriminantConfig
) -> Result<StepwiseStatistics, String> {
    // Check if stepwise analysis is requested
    if !config.main.stepwise {
        let err = "Stepwise analysis not requested".to_string();
        return Err(err);
    }

    // Get variables and extract analyzed dataset
    let variables = &config.main.independent_variables;

    let dataset = match extract_analyzed_dataset(data, config) {
        Ok(ds) => { ds }
        Err(e) => {
            return Err(e);
        }
    };

    if dataset.num_groups < 2 {
        let err = format!(
            "Not enough valid groups for analysis: found {} groups",
            dataset.num_groups
        );
        return Err(err);
    }

    // Perform stepwise analysis
    let steps_data = if config.method.f_value || config.method.f_probability {
        match perform_stepwise_analysis(&dataset, variables, config) {
            Ok(data) => { data }
            Err(e) => {
                return Err(e);
            }
        }
    } else {
        vec![create_initial_step(&dataset, variables, config)]
    };

    // Convert step data to output format
    match convert_steps_to_output(steps_data, config) {
        Ok(result) => { Ok(result) }
        Err(e) => { Err(e) }
    }
}

/// Perform stepwise analysis
///
/// This function performs the stepwise variable selection procedure,
/// iteratively adding or removing variables based on the specified method.
///
/// # Parameters
/// * `dataset` - The analyzed dataset
/// * `variables` - Variables to consider for selection
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// A vector of StepData containing results for each step
fn perform_stepwise_analysis(
    dataset: &AnalyzedDataset,
    variables: &Vec<String>,
    config: &DiscriminantConfig
) -> Result<Vec<StepData>, String> {
    // Initialize variables for stepwise analysis
    let mut current_variables: Vec<String> = Vec::new();
    let mut remaining_variables: Vec<String> = variables.clone();
    let mut steps_data: Vec<StepData> = Vec::new();

    // Add initial step
    let initial_step = create_initial_step(dataset, variables, config);
    steps_data.push(initial_step.clone());

    // Determine which method to use
    let method_type = determine_method_type(config);

    // Maximum number of steps (at most all variables × 2)
    let max_steps = variables.len() * 2; // Account for both additions and removals

    // Perform stepwise selection
    let mut step = 0;
    while step < max_steps {
        // Safety check - ensure we don't get stuck in an infinite loop
        if current_variables.len() > variables.len() {
            break;
        }

        // Process one step of variable selection
        let step_result = match
            process_selection_step(
                dataset,
                &mut current_variables,
                &mut remaining_variables,
                step,
                method_type,
                config
            )
        {
            Ok(result) => result,
            Err(e) => {
                return Err(e);
            }
        };

        // If no changes made, break
        if !step_result.changes_made {
            break;
        }

        // Add step data
        steps_data.extend(step_result.step_data);

        // If all variables are in the model, break
        if remaining_variables.is_empty() {
            break;
        }

        step += 1;
    }

    Ok(steps_data)
}

/// Result of a single selection step
#[derive(Debug, Serialize, Deserialize, Clone)]
struct StepResult {
    changes_made: bool,
    step_data: Vec<StepData>,
}

/// Process one step of variable selection
///
/// This function either adds a variable to the model or removes one,
/// depending on the statistical criteria.
///
/// # Parameters
/// * `dataset` - The analyzed dataset
/// * `current_variables` - Variables currently in the model
/// * `remaining_variables` - Variables not yet in the model
/// * `step` - Current step number
/// * `method_type` - The method to use for variable selection
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// A StepResult with changes made and step data
fn process_selection_step(
    dataset: &AnalyzedDataset,
    current_variables: &mut Vec<String>,
    remaining_variables: &mut Vec<String>,
    step: usize,
    method_type: MethodType,
    config: &DiscriminantConfig
) -> Result<StepResult, String> {
    let mut steps_data = Vec::new();
    let mut changes_made = false;

    // Find best variable to enter
    let (best_var_to_enter, best_stats) = find_best_variable_to_enter(
        remaining_variables,
        dataset,
        current_variables,
        method_type,
        config
    );

    // Check if we should enter this variable
    let should_enter = should_enter_variable(
        &best_var_to_enter,
        &best_stats,
        dataset.num_groups,
        dataset.total_cases,
        current_variables.len(),
        config
    );

    // If no variable meets entry criteria, return
    if !should_enter || best_var_to_enter.is_none() {
        return Ok(StepResult {
            changes_made: false,
            step_data: steps_data,
        });
    }

    // Add variable to model
    if let Some(var_name) = best_var_to_enter {
        // Only add if not already in the model (safeguard against duplicates)
        if !current_variables.contains(&var_name) {
            current_variables.push(var_name.clone());
            remaining_variables.retain(|v| v != &var_name);
            changes_made = true;

            // Add step data for variable entry
            let step_data = create_step_data(
                dataset,
                current_variables,
                remaining_variables,
                Some(var_name.clone()),
                None,
                (step as i32) + 1,
                method_type,
                config
            );

            steps_data.push(step_data);

            // Check for variable removal if needed
            if step > 0 && current_variables.len() > 1 {
                let removal_result = match
                    process_variable_removal(
                        dataset,
                        current_variables,
                        remaining_variables,
                        step,
                        method_type,
                        config
                    )
                {
                    Ok(result) => result,
                    Err(e) => {
                        return Err(e);
                    }
                };

                if removal_result.changes_made {
                    steps_data.extend(removal_result.step_data);
                }
            }
        }
    }

    Ok(StepResult {
        changes_made,
        step_data: steps_data,
    })
}

/// Process variable removal
///
/// This function checks if any variables should be removed from the model
/// based on the statistical criteria.
///
/// # Parameters
/// * `dataset` - The analyzed dataset
/// * `current_variables` - Variables currently in the model
/// * `remaining_variables` - Variables not yet in the model
/// * `step` - Current step number
/// * `method_type` - The method to use for variable selection
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// A StepResult with changes made and step data
fn process_variable_removal(
    dataset: &AnalyzedDataset,
    current_variables: &mut Vec<String>,
    remaining_variables: &mut Vec<String>,
    step: usize,
    method_type: MethodType,
    config: &DiscriminantConfig
) -> Result<StepResult, String> {
    let mut steps_data = Vec::new();
    let mut changes_made = false;
    let mut removal_attempts = 0;
    let max_removal_attempts = current_variables.len(); // Limit removal attempts to prevent infinite loop
    let mut step_complete = false;

    while !step_complete && removal_attempts < max_removal_attempts {
        removal_attempts += 1;

        // Find worst variable to remove
        let (worst_var_to_remove, worst_stats) = find_worst_variable_to_remove(
            current_variables,
            dataset,
            method_type,
            config
        );

        // Check if we should remove this variable
        let should_remove = should_remove_variable(
            &worst_var_to_remove,
            &worst_stats,
            dataset.num_groups,
            dataset.total_cases,
            current_variables.len(),
            config
        );

        // If no variable meets removal criteria, break
        if !should_remove || worst_var_to_remove.is_none() {
            step_complete = true;
            continue;
        }

        // Remove variable from model
        if let Some(var_name) = worst_var_to_remove {
            // Only remove if actually in the model
            if current_variables.contains(&var_name) {
                current_variables.retain(|v| v != &var_name);
                if !remaining_variables.contains(&var_name) {
                    remaining_variables.push(var_name.clone());
                }
                changes_made = true;

                // Add step data for variable removal
                let step_data = create_step_data(
                    dataset,
                    current_variables,
                    remaining_variables,
                    None,
                    Some(var_name.clone()),
                    (step as i32) + 1,
                    method_type,
                    config
                );

                steps_data.push(step_data);
            }
        }
    }

    Ok(StepResult {
        changes_made,
        step_data: steps_data,
    })
}

/// Determine if a variable should be entered into the model
///
/// # Parameters
/// * `var_opt` - Optional variable name
/// * `stats` - Statistics for the variable
/// * `num_groups` - Number of groups
/// * `total_cases` - Total number of cases
/// * `num_current_vars` - Number of variables currently in the model
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// Boolean indicating whether the variable should be entered
fn should_enter_variable(
    var_opt: &Option<String>,
    stats: &VariableNotInAnalysis,
    num_groups: usize,
    total_cases: usize,
    num_current_vars: usize,
    config: &DiscriminantConfig
) -> bool {
    if var_opt.is_none() {
        return false;
    }

    let result = if config.method.f_value {
        // Use direct F value comparison
        stats.f_to_enter >= config.method.f_entry
    } else if config.method.f_probability {
        // Calculate p-value and compare with probability threshold
        let p_value = calculate_p_value_from_f(
            stats.f_to_enter,
            (num_groups - 1) as f64,
            (total_cases - num_groups) as f64
        );
        p_value <= config.method.p_entry
    } else {
        false
    };

    result
}

/// Determine if a variable should be removed from the model
///
/// # Parameters
/// * `var_opt` - Optional variable name
/// * `stats` - Statistics for the variable
/// * `num_groups` - Number of groups
/// * `total_cases` - Total number of cases
/// * `num_current_vars` - Number of variables currently in the model
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// Boolean indicating whether the variable should be removed
fn should_remove_variable(
    var_opt: &Option<String>,
    stats: &VariableInAnalysis,
    num_groups: usize,
    total_cases: usize,
    num_current_vars: usize,
    config: &DiscriminantConfig
) -> bool {
    if var_opt.is_none() {
        return false;
    }

    let result = if config.method.f_value {
        // Use direct F value comparison for removal
        // For removal, the F value must be LESS THAN OR EQUAL TO the threshold
        stats.f_to_remove <= config.method.f_removal
    } else if config.method.f_probability {
        // Calculate p-value and compare with probability threshold
        // For removal, the p-value must be GREATER THAN OR EQUAL TO the threshold
        let p_value = calculate_p_value_from_f(
            stats.f_to_remove,
            (num_groups - 1) as f64,
            (total_cases - num_groups) as f64
        );
        p_value >= config.method.p_removal
    } else {
        false
    };

    result
}

/// Create data for the initial step (no variables in the model)
///
/// # Parameters
/// * `dataset` - The analyzed dataset
/// * `variables` - Variables to consider
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// StepData for the initial step
fn create_initial_step(
    dataset: &AnalyzedDataset,
    variables: &[String],
    config: &DiscriminantConfig
) -> StepData {
    let initial_variables_not_in = analyze_variables_not_in_model(variables, dataset, &[], config);

    StepData {
        variable_entered: None,
        variable_removed: None,
        wilks_lambda: 1.0, // No discrimination initially
        f_value: 0.0,
        df1: 0,
        df2: 1, // df2 selalu 1
        df3: (dataset.total_cases - dataset.num_groups) as i32, // df3 adalah total_cases - num_groups
        exact_f: 0.0,
        exact_df1: 0,
        exact_df2: (dataset.total_cases - dataset.num_groups) as i32, // Sesuaikan dengan df3
        significance: 1.0,
        variables_in_analysis: Vec::new(),
        variables_not_in_analysis: initial_variables_not_in,
        pairwise_comparisons: HashMap::new(),
    }
}

/// Create data for a step in the stepwise procedure
///
/// # Parameters
/// * `dataset` - The analyzed dataset
/// * `current_variables` - Variables currently in the model
/// * `remaining_variables` - Variables not yet in the model
/// * `variable_entered` - Variable that was entered in this step
/// * `variable_removed` - Variable that was removed in this step
/// * `step` - Step number
/// * `method_type` - The method being used
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// StepData for the current step
fn create_step_data(
    dataset: &AnalyzedDataset,
    current_variables: &[String],
    remaining_variables: &[String],
    variable_entered: Option<String>,
    variable_removed: Option<String>,
    step: i32,
    method_type: MethodType,
    config: &DiscriminantConfig
) -> StepData {
    // Analyze variables in and out of the model
    let vars_in_analysis = analyze_variables_in_model(
        current_variables,
        dataset,
        method_type,
        config
    );

    let vars_not_in_analysis = analyze_variables_not_in_model(
        remaining_variables,
        dataset,
        current_variables,
        config
    );

    // Hitung derajat kebebasan
    let df1 = current_variables.len() as i32; // Jumlah variabel dalam model
    let df2 = 1; // Selalu 1 berdasarkan output di gambar
    let df3 = (dataset.total_cases - dataset.num_groups) as i32;

    let var = variable_entered.clone().or(variable_removed.clone()).unwrap_or_default();
    web_sys::console::log_1(&format!("Variable entered/removed: {:?}", var).into());
    let mut combined_vars = Vec::new();

    // Only push `var` if it's not empty
    if !var.is_empty() {
        combined_vars.push(var.clone());
        combined_vars.extend(remaining_variables.iter().cloned());
    }
    web_sys::console::log_1(&format!("Cureent vars: {:?}", current_variables).into());
    web_sys::console::log_1(&format!("Other vars: {:?}", combined_vars).into());
    web_sys::console::log_1(&format!("Remaining vars: {:?}", remaining_variables).into());

    // `other_vars` sekarang berisi semua kecuali last
    let new_dataset = filter_dataset(&dataset, &combined_vars);
    web_sys::console::log_1(&format!("dataset: {:?}", dataset).into());
    web_sys::console::log_1(&format!("New dataset: {:?}", new_dataset).into());
    let (f_value, wilks_lambda) = calculate_univariate_f(&var, &new_dataset);

    // Untuk exact F, df1 adalah jumlah variabel dalam model
    let exact_f = f_value;
    let exact_df1 = df1;

    // exact_df2 berkurang seiring bertambahnya variabel (df3 - df1 + 1)
    let exact_df2 = df3 - df1 + 1;

    // Hitung signifikansi menggunakan calculate_p_value_from_f
    let significance = calculate_p_value_from_f(exact_f, exact_df1 as f64, exact_df2 as f64);

    // Generate pairwise comparisons if requested
    let pairwise_comparisons = if config.method.pairwise {
        generate_pairwise_comparisons(dataset, current_variables, step)
    } else {
        HashMap::new()
    };

    web_sys::console::log_1(&format!("Step {}: Wilks' Lambda: {}", step, wilks_lambda).into());
    web_sys::console::log_1(&format!("Step {}: F-value: {}", step, f_value).into());
    web_sys::console::log_1(&format!("Step {}: Significance: {}", step, significance).into());
    web_sys::console::log_1(&format!("Step {}: Exact F: {}", step, exact_f).into());
    web_sys::console::log_1(&format!("Step {}: Exact df1: {}", step, exact_df1).into());
    web_sys::console::log_1(&format!("Step {}: Exact df2: {}", step, exact_df2).into());
    web_sys::console::log_1(&format!("Step {}: df3: {}", step, df3).into());
    web_sys::console::log_1(&format!("Step {}: df1: {}", step, df1).into());
    web_sys::console::log_1(&format!("Step {}: df2: {}", step, df2).into());

    StepData {
        variable_entered,
        variable_removed,
        wilks_lambda,
        f_value,
        df1,
        df2,
        df3,
        exact_f,
        exact_df1,
        exact_df2,
        significance,
        variables_in_analysis: vars_in_analysis,
        variables_not_in_analysis: vars_not_in_analysis,
        pairwise_comparisons,
    }
}

/// Convert internal step data to the output format
///
/// # Parameters
/// * `steps_data` - Vector of StepData
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// A StepwiseStatistics object for output
fn convert_steps_to_output(
    steps_data: Vec<StepData>,
    config: &DiscriminantConfig
) -> Result<StepwiseStatistics, String> {
    let mut result = StepwiseStatistics {
        variables_entered: Vec::new(),
        variables_removed: Vec::new(),
        wilks_lambda: Vec::new(),
        f_values: Vec::new(),
        df1: Vec::new(),
        df2: Vec::new(),
        df3: Vec::new(),
        exact_f: Vec::new(),
        exact_df1: Vec::new(),
        exact_df2: Vec::new(),
        significance: Vec::new(),
        variables_in_analysis: HashMap::new(),
        variables_not_in_analysis: HashMap::new(),
        pairwise_comparisons: HashMap::new(),
        note: create_stepwise_note(config),
    };

    // Extract data from step data
    for (step_idx, step) in steps_data.iter().enumerate() {
        // Add variables entered/removed
        result.variables_entered.push(step.variable_entered.clone().unwrap_or_default());
        result.variables_removed.push(step.variable_removed.clone());

        // Add statistical values
        result.wilks_lambda.push(step.wilks_lambda);
        result.f_values.push(step.f_value);
        result.df1.push(step.df1);
        result.df2.push(step.df2);
        result.df3.push(step.df3);
        result.exact_f.push(step.exact_f);
        result.exact_df1.push(step.exact_df1);
        result.exact_df2.push(step.exact_df2);
        result.significance.push(step.significance);

        // Add variables in analysis by step
        result.variables_in_analysis.insert(
            (step_idx + 1).to_string(),
            step.variables_in_analysis.clone()
        );

        // Add variables not in analysis by step
        result.variables_not_in_analysis.insert(
            step_idx.to_string(),
            step.variables_not_in_analysis.clone()
        );

        // Add pairwise comparisons if available
        if !step.pairwise_comparisons.is_empty() {
            result.pairwise_comparisons.insert(
                (step_idx + 1).to_string(),
                step.pairwise_comparisons.clone()
            );
        }
    }

    Ok(result)
}

/// Create a StepwiseNote with configuration information
///
/// # Parameters
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// A StepwiseNote object with method details
fn create_stepwise_note(config: &DiscriminantConfig) -> StepwiseNote {
    let max_steps = config.main.independent_variables.len() * 2;

    // Choose the appropriate message based on whether we're using F-values or p-values
    let (entry_msg, removal_msg) = if config.method.f_value {
        (
            format!("b. Minimum partial F to enter is {}.", config.method.f_entry),
            format!("c. Maximum partial F to remove is {}.", config.method.f_removal),
        )
    } else if config.method.f_probability {
        (
            format!("b. Maximum probability of F to enter is {}.", config.method.p_entry),
            format!("c. Minimum probability of F to remove is {}.", config.method.p_removal),
        )
    } else {
        (
            format!("b. Minimum partial F to enter is {}.", config.method.f_entry),
            format!("c. Maximum partial F to remove is {}.", config.method.f_removal),
        )
    };

    StepwiseNote {
        max_steps: format!("a. Maximum number of steps is {}.", max_steps),
        min_f_to_enter: entry_msg,
        max_f_to_remove: removal_msg,
        note: "d. F level, tolerance, or VIN insufficient for further computation.".to_string(),
    }
}
