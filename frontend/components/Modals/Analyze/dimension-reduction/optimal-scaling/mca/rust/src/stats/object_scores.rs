use std::collections::HashMap;

use nalgebra::DMatrix;
use rand::Rng;

use crate::models::{
    config::{ MCAConfig, NormalizationMethod },
    data::AnalysisData,
    result::{ ObjectContributions, ObjectScores },
};

use super::core::{
    calculate_indicator_matrix,
    calculate_iteration_history,
    calculate_model_summary,
    center_and_orthonormalize_matrix,
    get_all_variables,
    parse_variable_weight,
    update_category_quantifications,
};

/// Calculate object scores
pub fn calculate_object_scores(
    data: &AnalysisData,
    config: &MCAConfig
) -> Result<ObjectScores, String> {
    // Get analysis variables - parse "variable (weight)" format
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

    // Extract variable names
    let var_names: Vec<String> = var_names_weights
        .iter()
        .map(|(var, _)| var.clone())
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

    // Get object scores (can reuse from iteration history calculation)
    let (object_scores, eigenvalues) = if
        let Ok(history) = calculate_iteration_history(data, config)
    {
        // Re-compute final scores
        let mut rng = rand::thread_rng();
        let mut initial_scores = DMatrix::zeros(n_cases, p_dims);

        for i in 0..n_cases {
            for j in 0..p_dims {
                initial_scores[(i, j)] = rng.gen_range(-1.0..1.0);
            }
        }

        // Perform iterations to get final scores
        let max_iterations = config.options.maximum_iterations as usize;
        let mut scores = initial_scores;

        for _ in 0..max_iterations {
            // Update category quantifications
            let mut quantifications = Vec::new();

            for (i, indicator) in indicator_matrices.iter().enumerate() {
                let quant = update_category_quantifications(indicator, &scores, 1.0);
                quantifications.push(quant);
            }

            // Update object scores
            let mut new_scores = DMatrix::zeros(n_cases, p_dims);

            for (i, indicator) in indicator_matrices.iter().enumerate() {
                let contrib = indicator * &quantifications[i];
                new_scores += contrib;
            }

            // Orthonormalize
            let result = center_and_orthonormalize_matrix(&new_scores);
            scores = result.0;
        }

        // Get eigenvalues from model summary if available
        let eigen_vec = if let Ok(summary) = calculate_model_summary(data, config) {
            summary.variance_accounted_eigenvalue
        } else {
            Vec::new()
        };

        (scores, eigen_vec)
    } else {
        // If no iteration history, perform quick computation
        let mut rng = rand::thread_rng();
        let mut initial_scores = DMatrix::zeros(n_cases, p_dims);

        for i in 0..n_cases {
            for j in 0..p_dims {
                initial_scores[(i, j)] = rng.gen_range(-1.0..1.0);
            }
        }

        center_and_orthonormalize_matrix(&initial_scores)
    };

    // Normalize scores based on normalization method
    let normalized_scores = match config.options.normalization_method {
        NormalizationMethod::VariablePrincipal => object_scores,
        NormalizationMethod::ObjectPrincipal => object_scores, // Already centered on objects
        NormalizationMethod::Symmetrical => {
            // Sqrt of eigenvalues for symmetrical normalization
            let mut symmetrical = object_scores.clone();
            if !eigenvalues.is_empty() {
                for j in 0..p_dims {
                    if j < eigenvalues.len() {
                        let factor = eigenvalues[j].sqrt();
                        for i in 0..n_cases {
                            symmetrical[(i, j)] *= factor;
                        }
                    }
                }
            }
            symmetrical
        }
        NormalizationMethod::Independent => object_scores,
        NormalizationMethod::Custom => {
            if let Some(custom_value) = config.options.norm_custom_value {
                let mut custom = object_scores.clone();
                if !eigenvalues.is_empty() {
                    for j in 0..p_dims {
                        if j < eigenvalues.len() {
                            let factor = eigenvalues[j].powf((1.0 + custom_value) / 4.0);
                            for i in 0..n_cases {
                                custom[(i, j)] *= factor;
                            }
                        }
                    }
                }
                custom
            } else {
                object_scores
            }
        }
    };

    // Create dimension labels
    let dimensions: Vec<String> = (1..=p_dims).map(|i| i.to_string()).collect();

    // Create case numbers
    let case_numbers: Vec<i32> = (1..=n_cases).map(|i| i as i32).collect();

    // Organize scores by dimension
    let mut scores_by_dim = HashMap::new();

    for dim in 0..p_dims {
        let dim_name = &dimensions[dim];
        let mut dim_scores = Vec::new();

        for i in 0..n_cases {
            dim_scores.push(normalized_scores[(i, dim)]);
        }

        scores_by_dim.insert(dim_name.clone(), dim_scores);
    }

    Ok(ObjectScores {
        case_numbers,
        dimensions,
        scores: scores_by_dim,
    })
}

/// Calculate object contributions
pub fn calculate_object_contributions(
    data: &AnalysisData,
    config: &MCAConfig
) -> Result<ObjectContributions, String> {
    // Get analysis variables - parse "variable (weight)" format
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

    // Extract variable names
    let var_names: Vec<String> = var_names_weights
        .iter()
        .map(|(var, _)| var.clone())
        .collect();

    // Use the first dataset for analysis
    if data.analysis_data.is_empty() || data.analysis_data[0].is_empty() {
        return Err("No data available for analysis".to_string());
    }

    let dataset = &data.analysis_data[0];
    let n_cases = dataset.len();
    let p_dims = config.main.dimensions as usize;

    // Get object scores
    let object_scores_result = calculate_object_scores(data, config)?;
    let model_summary = calculate_model_summary(data, config)?;

    // Create object score matrix
    let mut scores_matrix = DMatrix::zeros(n_cases, p_dims);

    for dim in 0..p_dims {
        let dim_name = &object_scores_result.dimensions[dim];
        if let Some(scores) = object_scores_result.scores.get(dim_name) {
            for i in 0..n_cases {
                if i < scores.len() {
                    scores_matrix[(i, dim)] = scores[i];
                }
            }
        }
    }

    // Calculate mass (equal for all objects in basic MCA)
    let mass: Vec<f64> = vec![1.0 / n_cases as f64; n_cases];

    // Calculate inertia
    let mut inertia = Vec::new();

    for i in 0..n_cases {
        let mut obj_inertia = 0.0;

        for dim in 0..p_dims {
            let score = scores_matrix[(i, dim)];
            obj_inertia += score * score * mass[i];
        }

        inertia.push(obj_inertia);
    }

    // Contributions of point to inertia of dimension
    let mut point_to_inertia = HashMap::new();

    for dim in 0..p_dims {
        let dim_name = format!("Dimension {}", dim + 1);
        let mut contributions = Vec::new();

        let eigenvalue = model_summary.variance_accounted_eigenvalue[dim];

        for i in 0..n_cases {
            let score = scores_matrix[(i, dim)];
            let contrib = (mass[i] * score * score) / eigenvalue;
            contributions.push(contrib);
        }

        point_to_inertia.insert(dim_name, contributions);
    }

    // Contributions of dimension to inertia of point
    let mut dim_to_inertia_point = HashMap::new();

    for dim in 0..p_dims {
        let dim_name = format!("Dimension {}", dim + 1);
        let mut contributions = Vec::new();

        for i in 0..n_cases {
            let score = scores_matrix[(i, dim)];
            let contrib = if inertia[i] > 0.0 {
                (mass[i] * score * score) / inertia[i]
            } else {
                0.0
            };
            contributions.push(contrib);
        }

        dim_to_inertia_point.insert(dim_name, contributions);
    }

    // Calculate total contributions
    let mut total_to_inertia_point = Vec::new();

    for i in 0..n_cases {
        let mut total = 0.0;

        for dim in 0..p_dims {
            let dim_name = format!("Dimension {}", dim + 1);
            if let Some(contribs) = dim_to_inertia_point.get(&dim_name) {
                if i < contribs.len() {
                    total += contribs[i];
                }
            }
        }

        total_to_inertia_point.push(total);
    }

    Ok(ObjectContributions {
        case_numbers: object_scores_result.case_numbers,
        mass,
        inertia,
        point_to_inertia,
        dim_to_inertia_point,
        total_to_inertia_point,
    })
}
