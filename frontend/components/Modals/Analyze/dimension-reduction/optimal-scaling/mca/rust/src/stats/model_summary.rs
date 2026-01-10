use nalgebra::DMatrix;
use rand::Rng;

use crate::models::{
    config::MCAConfig,
    data::AnalysisData,
    result::{ MeanRow, ModelSummary, TotalRow },
};

use super::core::{
    calculate_indicator_matrix,
    calculate_iteration_history,
    center_and_orthonormalize_matrix,
    get_all_variables,
    parse_variable_weight,
    update_category_quantifications,
};

/// Calculate model summary for MCA
pub fn calculate_model_summary(
    data: &AnalysisData,
    config: &MCAConfig
) -> Result<ModelSummary, String> {
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
    let (indicator_matrices, _) = calculate_indicator_matrix(dataset, &var_names, config)?;

    // Get object scores (can reuse from iteration history if available)
    let object_scores = if let Ok(history) = calculate_iteration_history(data, config) {
        // Recompute the final object scores
        let mut rng = rand::thread_rng();
        let mut initial_scores = DMatrix::zeros(n_cases, p_dims);

        for i in 0..n_cases {
            for j in 0..p_dims {
                initial_scores[(i, j)] = rng.gen_range(-1.0..1.0);
            }
        }

        // Perform iterations to get final object scores
        let max_iterations = config.options.maximum_iterations as usize;
        let mut object_scores = initial_scores;

        for _ in 0..max_iterations {
            // Update category quantifications
            let mut quantifications = Vec::new();

            for (i, indicator) in indicator_matrices.iter().enumerate() {
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

            // Center and orthonormalize
            let (orthogonal_scores, _) = center_and_orthonormalize_matrix(&new_scores);
            object_scores = orthogonal_scores;
        }

        object_scores
    } else {
        // If no iteration history, perform quick computation
        let mut rng = rand::thread_rng();
        let mut initial_scores = DMatrix::zeros(n_cases, p_dims);

        for i in 0..n_cases {
            for j in 0..p_dims {
                initial_scores[(i, j)] = rng.gen_range(-1.0..1.0);
            }
        }

        let (centered_scores, _) = center_and_orthonormalize_matrix(&initial_scores);
        centered_scores
    };

    // Calculate Cronbach's alpha and eigenvalues
    let mut cronbachs_alpha = Vec::new();
    let mut eigenvalues = Vec::new();
    let mut inertia = Vec::new();
    let mut variance_percentage = Vec::new();

    // Calculate discrimination measures per dimension
    let mut discrimination_sums = Vec::new();

    for dim in 0..p_dims {
        let mut dim_sums = Vec::new();

        for (i, indicator) in indicator_matrices.iter().enumerate() {
            let scores_dim = object_scores.column(dim);
            let projected = indicator * indicator.transpose() * scores_dim;

            // Calculate discrimination measure (correlation squared)
            let scores_norm = scores_dim.norm_squared();
            let projected_norm = projected.norm_squared();
            let dot_product = scores_dim.dot(&projected);

            if scores_norm > 0.0 && projected_norm > 0.0 {
                let correlation = dot_product / (scores_norm.sqrt() * projected_norm.sqrt());
                let discrimination = correlation * correlation * var_weights[i];
                dim_sums.push(discrimination);
            } else {
                dim_sums.push(0.0);
            }
        }

        // Sum of discrimination measures equals eigenvalue
        let eigenvalue = dim_sums.iter().sum::<f64>();
        eigenvalues.push(eigenvalue);

        // Calculate inertia (eigenvalue / sum of weights)
        let weights_sum = var_weights.iter().sum::<f64>();
        let dim_inertia = eigenvalue / weights_sum;
        inertia.push(dim_inertia);

        // Calculate percentage of variance
        let total_categories: usize = indicator_matrices
            .iter()
            .map(|m| m.ncols())
            .sum();
        let max_variance = (total_categories as f64) - (var_names.len() as f64);
        let percentage = (eigenvalue / max_variance) * 100.0;
        variance_percentage.push(percentage);

        // Calculate Cronbach's alpha
        let alpha = if eigenvalue > 0.0 && weights_sum > 1.0 {
            (weights_sum * (eigenvalue - 1.0)) / (eigenvalue * (weights_sum - 1.0))
        } else {
            0.0
        };
        cronbachs_alpha.push(alpha);

        discrimination_sums.push(dim_sums);
    }

    // Create dimension labels
    let dimensions: Vec<String> = (1..=p_dims).map(|i| i.to_string()).collect();

    // Calculate total and mean values
    let total_eigenvalue: f64 = eigenvalues.iter().sum();
    let total_inertia: f64 = inertia.iter().sum();
    let total_percentage: f64 = variance_percentage.iter().sum();

    let mean_eigenvalue = total_eigenvalue / (p_dims as f64);
    let mean_inertia = total_inertia / (p_dims as f64);
    let mean_percentage = total_percentage / (p_dims as f64);

    // Calculate mean Cronbach's Alpha
    let mean_alpha = if mean_eigenvalue > 0.0 {
        let weights_sum = var_weights.iter().sum::<f64>();
        if weights_sum > 1.0 {
            (weights_sum * (mean_eigenvalue - 1.0)) / (mean_eigenvalue * (weights_sum - 1.0))
        } else {
            0.0
        }
    } else {
        0.0
    };

    // Create total and mean rows
    let total = TotalRow {
        cronbachs_alpha: None,
        eigenvalue: total_eigenvalue,
        inertia: total_inertia,
        percentage: total_percentage,
    };

    let mean = MeanRow {
        cronbachs_alpha: mean_alpha,
        eigenvalue: mean_eigenvalue,
        inertia: mean_inertia,
        percentage: mean_percentage,
        note: Some("Mean Cronbach's Alpha is based on the mean Eigenvalue.".to_string()),
    };

    Ok(ModelSummary {
        dimension: dimensions,
        cronbachs_alpha,
        variance_accounted_eigenvalue: eigenvalues,
        variance_accounted_inertia: inertia,
        variance_accounted_percentage: variance_percentage,
        total: Some(total),
        mean: Some(mean),
        note: None,
    })
}
