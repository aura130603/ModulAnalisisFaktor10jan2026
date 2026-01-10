use std::collections::HashMap;

use crate::models::{
    config::OVERALSAnalysisConfig,
    data::{ AnalysisData, DataRecord, DataValue, VariableDefinition },
    result::{ IterationStep, OVERALSResult, ScalingLevel },
};

use super::core::{
    determine_scaling_level,
    initialize_object_scores,
    initialize_weights_and_quantifications,
    update_multiple_nominal_quantifications,
    update_numeric_quantifications,
    update_ordinal_quantifications,
    update_single_nominal_quantifications,
};

// Helper function to get variable definition from 3D structure
pub fn get_var_def<'a>(
    data: &'a AnalysisData,
    set_idx: usize,
    var_idx: usize
) -> Result<&'a VariableDefinition, String> {
    // Check if set_idx is valid
    if set_idx >= data.set_target_data_defs.len() {
        return Err(format!("Invalid set index: {}", set_idx));
    }

    // Access the variable definition through the nested structure
    if
        let Some(var_def) = data.set_target_data_defs[set_idx]
            .iter()
            .flat_map(|group| group.iter())
            .nth(var_idx)
    {
        Ok(var_def)
    } else {
        Err(format!("Variable index {} not found in set {}", var_idx, set_idx))
    }
}

// Helper function to get all variable definitions in a set (flattened)
pub fn get_set_defs<'a>(data: &'a AnalysisData, set_idx: usize) -> Vec<&'a VariableDefinition> {
    if set_idx >= data.set_target_data_defs.len() {
        return Vec::new();
    }

    data.set_target_data_defs[set_idx]
        .iter()
        .flat_map(|group| group.iter())
        .collect()
}

/// Main function to run the OVERALS algorithm
pub fn run_overals_algorithm(
    data: &AnalysisData,
    config: &OVERALSAnalysisConfig
) -> Result<OVERALSResult, String> {
    // Get dimensions from configuration
    let dimensions = config.main.dimensions.unwrap_or(2) as usize;
    let max_iterations = config.options.max_iter.unwrap_or(100) as usize;
    let convergence_criterion = config.options.conv.unwrap_or(0.00001);
    let use_random_init = config.options.use_randconf;

    // Count number of cases
    let num_cases = data.set_target_data
        .first()
        .and_then(|set| set.first())
        .map_or(0, |var| var.len());

    if num_cases == 0 {
        return Err("No cases found in data".to_string());
    }

    // Initialize object scores
    let mut object_scores = initialize_object_scores(dimensions, num_cases, use_random_init);
    web_sys::console::log_1(&format!("Initial object scores: {:?}", object_scores).into());

    // Center and normalize object scores
    center_and_normalize_scores(&mut object_scores);

    // Discover categories for each variable
    let category_values = discover_categories(data);
    web_sys::console::log_1(&format!("Category values: {:?}", category_values).into());

    // Initialize category quantifications and variable weights
    let (mut variable_weights, mut category_quantifications) =
        initialize_weights_and_quantifications(&category_values, dimensions);

    // Iteration history
    let mut iteration_history = Vec::new();
    let mut current_loss = f64::MAX;

    // Calculate initial loss
    let initial_loss = calculate_loss(
        &object_scores,
        &object_scores,
        &category_quantifications,
        &variable_weights,
        data,
        dimensions
    );

    // Add initial step to history
    iteration_history.push(IterationStep {
        loss: initial_loss,
        fit: (dimensions as f64) - initial_loss,
        difference_from_previous: 0.0,
    });

    current_loss = initial_loss;

    // Main iteration loop
    for _ in 1..=max_iterations {
        // Create a copy of object scores for current iteration
        let current_object_scores = object_scores.clone();

        // Loop through sets and variables
        for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
            for (var_idx, var_data) in set_data.iter().enumerate() {
                // Get variable definition from the new 3D structure
                let var_def = get_var_def(data, set_idx, var_idx)?;
                let var_name = &var_def.name;
                let scaling_level = determine_scaling_level(var_def, config);

                // Eliminate contributions of other variables
                let v_kj = calculate_other_variables_contribution(
                    set_idx,
                    var_idx,
                    set_data,
                    data,
                    &category_quantifications,
                    &variable_weights,
                    num_cases,
                    dimensions
                );

                // Update category quantifications
                match scaling_level {
                    ScalingLevel::Multiple => {
                        update_multiple_nominal_quantifications(
                            set_idx,
                            var_idx,
                            var_name,
                            var_data,
                            &object_scores,
                            &v_kj,
                            &mut category_quantifications,
                            &category_values
                        );
                    }
                    ScalingLevel::Single => {
                        update_single_nominal_quantifications(
                            set_idx,
                            var_idx,
                            var_name,
                            var_data,
                            &object_scores,
                            &v_kj,
                            &mut category_quantifications,
                            &mut variable_weights,
                            &category_values
                        );
                    }
                    ScalingLevel::Ordinal => {
                        update_ordinal_quantifications(
                            set_idx,
                            var_idx,
                            var_name,
                            var_data,
                            &object_scores,
                            &v_kj,
                            &mut category_quantifications,
                            &mut variable_weights,
                            &category_values
                        );
                    }
                    ScalingLevel::Discrete => {
                        update_numeric_quantifications(
                            set_idx,
                            var_idx,
                            &category_values,
                            &mut category_quantifications
                        );
                    }
                }
            }
        }

        // Update object scores
        let mut new_object_scores = vec![vec![0.0; dimensions]; num_cases];
        update_object_scores(
            data,
            &category_quantifications,
            &variable_weights,
            &mut new_object_scores,
            dimensions
        );

        // Orthonormalization
        center_and_normalize_scores(&mut new_object_scores);

        // Calculate loss for this iteration
        let new_loss = calculate_loss(
            &current_object_scores,
            &new_object_scores,
            &category_quantifications,
            &variable_weights,
            data,
            dimensions
        );

        let fit = (dimensions as f64) - new_loss;
        let diff = current_loss - new_loss;

        iteration_history.push(IterationStep {
            loss: new_loss,
            fit,
            difference_from_previous: diff,
        });

        // Check convergence
        if diff < convergence_criterion {
            break;
        }

        // Update for next iteration
        object_scores = new_object_scores;
        current_loss = new_loss;
    }

    // Return results
    Ok(OVERALSResult {
        object_scores,
        category_quantifications,
        variable_weights,
        category_values,
        iteration_history,
        final_loss: current_loss,
        dimensions,
    })
}

/// Discover categories for each variable
pub fn discover_categories(data: &AnalysisData) -> HashMap<(usize, usize), Vec<usize>> {
    let mut category_values = HashMap::new();

    for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
        for (var_idx, var_data) in set_data.iter().enumerate() {
            // Get variable definition from the 3D structure
            if let Ok(var_def) = get_var_def(data, set_idx, var_idx) {
                let var_name = &var_def.name;
                let mut categories = Vec::new();

                for record in var_data {
                    if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                        if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                            let cat_val = *num as usize;
                            if !categories.contains(&cat_val) {
                                categories.push(cat_val);
                            }
                        }
                    }
                }

                categories.sort();
                category_values.insert((set_idx, var_idx), categories);
            }
        }
    }

    category_values
}

/// Calculate contribution of other variables in a set
pub fn calculate_other_variables_contribution(
    set_idx: usize,
    var_idx: usize,
    set_data: &[Vec<DataRecord>],
    data: &AnalysisData,
    category_quantifications: &HashMap<(usize, usize, usize), f64>,
    variable_weights: &HashMap<(usize, usize), Vec<f64>>,
    num_cases: usize,
    dimensions: usize
) -> Vec<Vec<f64>> {
    let mut v_kj = vec![vec![0.0; dimensions]; num_cases];

    for (other_var_idx, other_var_data) in set_data.iter().enumerate() {
        if other_var_idx == var_idx {
            continue;
        }

        // Get the variable definition using the helper function
        if let Ok(other_var_def) = get_var_def(data, set_idx, other_var_idx) {
            let other_var_name = &other_var_def.name;

            // Add contribution of other variable
            for (case_idx, record) in other_var_data.iter().enumerate() {
                if let Some(DataValue::Number(num)) = record.values.get(other_var_name) {
                    if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                        let cat_val = *num as usize;
                        if
                            let Some(quant) = category_quantifications.get(
                                &(set_idx, other_var_idx, cat_val)
                            )
                        {
                            if let Some(weights) = variable_weights.get(&(set_idx, other_var_idx)) {
                                for dim in 0..dimensions {
                                    v_kj[case_idx][dim] += quant * weights[dim];
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    v_kj
}

/// Update object scores
pub fn update_object_scores(
    data: &AnalysisData,
    category_quantifications: &HashMap<(usize, usize, usize), f64>,
    variable_weights: &HashMap<(usize, usize), Vec<f64>>,
    new_object_scores: &mut [Vec<f64>],
    dimensions: usize
) {
    for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
        for (var_idx, var_data) in set_data.iter().enumerate() {
            // Get variable definition using helper function
            if let Ok(var_def) = get_var_def(data, set_idx, var_idx) {
                let var_name = &var_def.name;

                for (case_idx, record) in var_data.iter().enumerate() {
                    if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                        if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                            let cat_val = *num as usize;
                            if
                                let Some(quant) = category_quantifications.get(
                                    &(set_idx, var_idx, cat_val)
                                )
                            {
                                if let Some(weights) = variable_weights.get(&(set_idx, var_idx)) {
                                    for dim in 0..dimensions {
                                        new_object_scores[case_idx][dim] += quant * weights[dim];
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

/// Center and normalize object scores (optimized)
pub fn center_and_normalize_scores(scores: &mut [Vec<f64>]) {
    if scores.is_empty() {
        return;
    }

    let dimensions = scores[0].len();
    let num_cases = scores.len();

    // Center (mean = 0)
    for dim in 0..dimensions {
        let mean =
            scores
                .iter()
                .map(|s| s[dim])
                .sum::<f64>() / (num_cases as f64);
        for score in scores.iter_mut() {
            score[dim] -= mean;
        }
    }

    // Normalize (standard deviation = 1)
    for dim in 0..dimensions {
        let sum_sq = scores
            .iter()
            .map(|s| s[dim].powi(2))
            .sum::<f64>();
        let std_dev = (sum_sq / (num_cases as f64)).sqrt();

        if std_dev > 1e-10 {
            for score in scores.iter_mut() {
                score[dim] /= std_dev;
            }
        }
    }

    // Orthogonalize dimensions (Gram-Schmidt process)
    for dim1 in 0..dimensions {
        for dim2 in 0..dim1 {
            let dot_product = scores
                .iter()
                .map(|s| s[dim1] * s[dim2])
                .sum::<f64>();

            for score in scores.iter_mut() {
                score[dim1] -= dot_product * score[dim2];
            }
        }

        // Normalize again after orthogonalization
        let sum_sq = scores
            .iter()
            .map(|s| s[dim1].powi(2))
            .sum::<f64>();
        let norm = (sum_sq / (num_cases as f64)).sqrt();

        if norm > 1e-10 {
            for score in scores.iter_mut() {
                score[dim1] /= norm;
            }
        }
    }
}

/// Calculate loss for current iteration
pub fn calculate_loss(
    old_scores: &[Vec<f64>],
    _new_scores: &[Vec<f64>],
    category_quantifications: &HashMap<(usize, usize, usize), f64>,
    variable_weights: &HashMap<(usize, usize), Vec<f64>>,
    data: &AnalysisData,
    dimensions: usize
) -> f64 {
    let num_cases = old_scores.len();
    let num_sets = data.set_target_data.len();
    let mut total_loss = 0.0;

    // Calculate loss for each set
    for (set_idx, set_data) in data.set_target_data.iter().enumerate() {
        let mut set_loss = 0.0;

        for case_idx in 0..num_cases {
            let mut expected = vec![0.0; dimensions];

            // Calculate expected value based on quantifications and weights
            for (var_idx, var_data) in set_data.iter().enumerate() {
                if case_idx < var_data.len() {
                    // Get variable definition using helper function
                    if let Ok(var_def) = get_var_def(data, set_idx, var_idx) {
                        let record = &var_data[case_idx];
                        let var_name = &var_def.name;

                        if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                            if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                                let cat_val = *num as usize;
                                if
                                    let Some(&quant) = category_quantifications.get(
                                        &(set_idx, var_idx, cat_val)
                                    )
                                {
                                    if
                                        let Some(weights) = variable_weights.get(
                                            &(set_idx, var_idx)
                                        )
                                    {
                                        for dim in 0..dimensions {
                                            expected[dim] += quant * weights[dim];
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Calculate squared difference between expected and actual
            for dim in 0..dimensions {
                if case_idx < old_scores.len() {
                    set_loss += (old_scores[case_idx][dim] - expected[dim]).powi(2);
                }
            }
        }

        total_loss += set_loss;
    }

    // Average loss across sets
    total_loss / (num_sets as f64)
}

/// Calculate Pearson correlation coefficient (using statrs)
pub fn calculate_correlation(x: &[f64], y: &[f64]) -> f64 {
    if x.len() != y.len() || x.is_empty() {
        return 0.0;
    }

    let n = x.len() as f64;
    let mean_x = x.iter().sum::<f64>() / n;
    let mean_y = y.iter().sum::<f64>() / n;

    let (cov, var_x, var_y) = x
        .iter()
        .zip(y.iter())
        .fold((0.0, 0.0, 0.0), |acc, (&xi, &yi)| {
            let dx = xi - mean_x;
            let dy = yi - mean_y;
            (acc.0 + dx * dy, acc.1 + dx * dx, acc.2 + dy * dy)
        });

    if var_x > 0.0 && var_y > 0.0 {
        cov / (var_x.sqrt() * var_y.sqrt())
    } else {
        0.0
    }
}
