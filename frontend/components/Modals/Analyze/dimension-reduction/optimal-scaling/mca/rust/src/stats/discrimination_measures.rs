use std::collections::HashMap;

use nalgebra::{ DMatrix, DVector };

use crate::models::{ config::MCAConfig, data::AnalysisData, result::DiscriminationMeasures };

use super::core::{
    calculate_correlation_vectors,
    calculate_indicator_matrix,
    calculate_model_summary,
    calculate_object_scores,
    get_all_variables,
    parse_variable_weight,
    update_category_quantifications,
};

/// Calculate discrimination measures for the variables
pub fn calculate_discrimination_measures(
    data: &AnalysisData,
    config: &MCAConfig
) -> Result<DiscriminationMeasures, String> {
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
    let p_dims = config.main.dimensions as usize;

    // Get object scores
    let object_scores_result = calculate_object_scores(data, config)?;
    let model_summary = calculate_model_summary(data, config)?;

    // Create indicator matrices
    let (indicator_matrices, _) = calculate_indicator_matrix(dataset, &var_names, config)?;

    // Create scores matrix
    let n_cases = dataset.len();
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

    // Calculate discrimination measures for each variable and dimension
    let mut measures = HashMap::new();
    let mut active_total = vec![0.0; p_dims];

    for (var_idx, var_name) in var_names.iter().enumerate() {
        let mut var_measures = Vec::new();

        // For each dimension
        for dim in 0..p_dims {
            let scores_dim = scores_matrix.column(dim);

            // Convert column view to owned DVector to match expected type
            let scores_dim_owned = DVector::from_iterator(n_cases, scores_dim.iter().cloned());

            // Calculate category quantifications
            let indicator = &indicator_matrices[var_idx];
            let quant = update_category_quantifications(indicator, &scores_matrix, 1.0);
            let quant_dim = quant.column(dim);

            // Calculate discrimination measure (variance of transformed variable)
            let transformed = indicator * quant_dim;
            let mean = transformed.sum() / (n_cases as f64);

            let mut variance = 0.0;
            for i in 0..n_cases {
                variance += (transformed[i] - mean).powi(2);
            }
            variance /= n_cases as f64;

            // Alternatively, discrimination measure is squared correlation
            // Now with compatible types
            let correlation = calculate_correlation_vectors(&scores_dim_owned, &transformed)?;
            let discrimination = correlation * correlation;

            var_measures.push(discrimination);
            active_total[dim] += discrimination;
        }

        measures.insert(var_name.clone(), var_measures);
    }

    // Calculate mean discrimination per variable
    let mut mean_vec = Vec::new();

    for var_name in &var_names {
        if let Some(var_measures) = measures.get(var_name) {
            let mean = var_measures.iter().sum::<f64>() / (p_dims as f64);
            mean_vec.push(mean);
        }
    }

    // Calculate percentage of variance
    let percentage_of_variance = active_total
        .iter()
        .map(|&total| (total / (var_names.len() as f64)) * 100.0)
        .collect();

    // Create dimension labels
    let dimensions: Vec<String> = (1..=p_dims).map(|i| i.to_string()).collect();

    Ok(DiscriminationMeasures {
        variables: var_names,
        dimensions,
        mean: Some(mean_vec),
        measures,
        active_total,
        percentage_of_variance,
    })
}
