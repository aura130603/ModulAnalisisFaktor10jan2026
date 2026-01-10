use nalgebra::DMatrix;
use rand::Rng;

use crate::models::{ config::MCAConfig, data::AnalysisData, result::IterationHistory };

use super::core::{
    calculate_indicator_matrix,
    center_and_orthonormalize_matrix,
    get_all_variables,
    parse_variable_weight,
    update_category_quantifications,
};

/// Calculate iteration history for MCA
pub fn calculate_iteration_history(
    data: &AnalysisData,
    config: &MCAConfig
) -> Result<IterationHistory, String> {
    // Get analysis variables and their weights
    let var_names_weights: Vec<(String, f64)> = match &config.main.analysis_vars {
        Some(vars) if !vars.is_empty() => {
            vars.iter()
                .map(|v| parse_variable_weight(v))
                .collect()
        }
        _ => {
            get_all_variables(data)
                .iter()
                .map(|v| (v.clone(), 1.0))
                .collect()
        }
    };

    // Separate variable names and weights
    let var_names: Vec<String> = var_names_weights
        .iter()
        .map(|(var, _)| var.clone())
        .collect();
    let var_weights: Vec<f64> = var_names_weights
        .iter()
        .map(|(_, weight)| *weight)
        .collect();

    // Use the first dataset for analysis
    if data.analysis_data.is_empty() || data.analysis_data[0].is_empty() {
        return Err("No data available for analysis".to_string());
    }

    let dataset = &data.analysis_data[0];
    let n_cases = dataset.len();
    let p_dims = config.main.dimensions as usize;

    // Calculate indicator matrices
    let (indicator_matrices, categories_per_var) = calculate_indicator_matrix(
        dataset,
        &var_names,
        config
    )?;

    // Initialize random object scores if needed
    let mut object_scores = DMatrix::zeros(n_cases, p_dims);
    let mut rng = rand::thread_rng();
    for i in 0..n_cases {
        for j in 0..p_dims {
            object_scores[(i, j)] = rng.gen_range(-1.0..1.0);
        }
    }

    // Orthonormalize initial object scores
    let (centered_scores, _) = center_and_orthonormalize_matrix(&object_scores);
    object_scores = centered_scores;

    // Initialize variables for iteration history
    let mut iteration_number = Vec::new();
    let mut variance_accounted_total = Vec::new();
    let mut variance_accounted_increase = Vec::new();
    let mut loss = Vec::new();

    // Set up parameters for iterations
    let max_iterations = config.options.maximum_iterations as usize;
    let convergence_criterion = config.options.convergence;
    let mut iter = 0;
    let mut prev_vaf = 0.0;
    let mut vaf;
    let mut vaf_increase;
    let mut current_loss;

    // Iterative algorithm
    while iter < max_iterations {
        iter += 1;

        // Update category quantifications for each variable
        let mut quantifications = Vec::new();

        for (i, indicator) in indicator_matrices.iter().enumerate() {
            // Calculate optimal category quantifications
            let category_quant = update_category_quantifications(
                indicator,
                &object_scores,
                var_weights[i]
            );
            quantifications.push(category_quant);
        }

        // Update object scores
        let mut new_scores = DMatrix::zeros(n_cases, p_dims);

        for (i, indicator) in indicator_matrices.iter().enumerate() {
            let contrib = indicator * &quantifications[i] * var_weights[i];
            new_scores += contrib;
        }

        // Center and orthonormalize the new scores
        let (orthogonal_scores, eigenvalues) = center_and_orthonormalize_matrix(&new_scores);
        object_scores = orthogonal_scores;

        // Calculate variance accounted for
        vaf = eigenvalues.iter().sum::<f64>() / var_weights.iter().sum::<f64>();
        vaf_increase = vaf - prev_vaf;
        current_loss = var_weights.iter().sum::<f64>() - vaf;

        // Record iteration history
        iteration_number.push(iter as i32);
        variance_accounted_total.push(vaf);
        variance_accounted_increase.push(vaf_increase);
        loss.push(current_loss);

        // Check convergence
        if vaf_increase.abs() < convergence_criterion && iter > 1 {
            break;
        }

        prev_vaf = vaf;
    }

    // Note for stopping condition
    let note = if iter < max_iterations {
        Some(
            "The iteration process stopped because the convergence test value was reached.".to_string()
        )
    } else {
        Some(
            "The iteration process stopped because the maximum number of iterations was reached.".to_string()
        )
    };

    Ok(IterationHistory {
        iteration_number,
        variance_accounted_total,
        variance_accounted_increase,
        loss,
        note,
    })
}
