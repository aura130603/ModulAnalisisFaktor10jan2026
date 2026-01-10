use std::collections::HashMap;

use nalgebra::{ DMatrix, SVD };

use crate::models::{ config::MCAConfig, data::AnalysisData, result::CorrelationsMatrix };

use super::core::{
    calculate_correlation,
    calculate_indicator_matrix,
    calculate_model_summary,
    calculate_object_scores,
    get_all_variables,
    parse_variable_weight,
    update_category_quantifications,
};

/// Calculate correlations of original variables
pub fn calculate_original_correlations(
    data: &AnalysisData,
    config: &MCAConfig
) -> Result<CorrelationsMatrix, String> {
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

    // Create correlation matrix
    let mut correlations: HashMap<String, HashMap<String, f64>> = HashMap::new();
    let mut eigenvalues = Vec::new();

    // For each pair of variables, calculate Pearson correlation
    for (i, var1) in var_names.iter().enumerate() {
        let mut var1_corrs: HashMap<String, f64> = HashMap::new();

        for (j, var2) in var_names.iter().enumerate() {
            let correlation = calculate_correlation(dataset, var1, var2, false)?;
            var1_corrs.insert(var2.clone(), correlation);
        }

        correlations.insert(var1.clone(), var1_corrs);
    }

    // Extract correlation matrix as nalgebra matrix for eigenvalue calculation
    let n_vars = var_names.len();
    let mut corr_matrix = DMatrix::zeros(n_vars, n_vars);

    for i in 0..n_vars {
        for j in 0..n_vars {
            let corr = correlations
                .get(&var_names[i])
                .and_then(|row| row.get(&var_names[j]))
                .cloned()
                .unwrap_or(0.0);
            corr_matrix[(i, j)] = corr;
        }
    }

    // Calculate eigenvalues
    let svd = SVD::new(corr_matrix, false, false);
    for &s in svd.singular_values.iter() {
        eigenvalues.push(s * s);
    }

    // Sort eigenvalues in descending order
    eigenvalues.sort_by(|a, b| b.partial_cmp(a).unwrap());

    // Create dimension labels
    let dimensions: Vec<String> = (1..=n_vars).map(|i| i.to_string()).collect();

    Ok(CorrelationsMatrix {
        variables: var_names.clone(),
        dimensions,
        eigenvalues,
        correlations,
    })
}

/// Calculate correlations of transformed variables
pub fn calculate_transformed_correlations(
    data: &AnalysisData,
    config: &MCAConfig
) -> Result<CorrelationsMatrix, String> {
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

    // Calculate indicator matrices
    let (indicator_matrices, _) = calculate_indicator_matrix(dataset, &var_names, config)?;

    // Get object scores
    let model_summary = calculate_model_summary(data, config)?;
    let object_scores = calculate_object_scores(data, config)?;

    // Create a matrix from object scores
    let n_cases = dataset.len();
    let mut scores_matrix = DMatrix::zeros(n_cases, p_dims);

    for dim in 0..p_dims {
        let dim_name = &object_scores.dimensions[dim];
        if let Some(scores) = object_scores.scores.get(dim_name) {
            for (i, score) in scores.iter().enumerate() {
                if i < n_cases {
                    scores_matrix[(i, dim)] = *score;
                }
            }
        }
    }

    // Create correlations data structure
    let mut correlations: HashMap<String, HashMap<String, f64>> = HashMap::new();
    let mut eigenvalues: Vec<f64> = Vec::new();

    // Get eigenvalues from model summary
    for dim in 0..p_dims {
        eigenvalues.push(model_summary.variance_accounted_eigenvalue[dim]);
    }

    // For each variable
    for (i, var1) in var_names.iter().enumerate() {
        // Initialize correlation map for this variable
        let mut var1_corrs: HashMap<String, f64> = HashMap::new();

        for (j, var2) in var_names.iter().enumerate() {
            // Calculate correlation between transformed variables
            let indicator1 = &indicator_matrices[i];
            let indicator2 = &indicator_matrices[j];

            // Get quantifications for the first dimension
            // (typically correlations focus on first dimension)
            let dim = 0; // Use first dimension for correlation calculation
            let quant1 = update_category_quantifications(indicator1, &scores_matrix, 1.0)
                .column(dim)
                .into_owned();
            let quant2 = update_category_quantifications(indicator2, &scores_matrix, 1.0)
                .column(dim)
                .into_owned();

            // Calculate transformed values
            let trans1 = indicator1 * quant1;
            let trans2 = indicator2 * quant2;

            // Calculate correlation
            let mean1 = trans1.sum() / (n_cases as f64);
            let mean2 = trans2.sum() / (n_cases as f64);

            let mut cov = 0.0;
            let mut var1_sum = 0.0;
            let mut var2_sum = 0.0;

            for k in 0..n_cases {
                let diff1 = trans1[k] - mean1;
                let diff2 = trans2[k] - mean2;
                cov += diff1 * diff2;
                var1_sum += diff1 * diff1;
                var2_sum += diff2 * diff2;
            }

            let correlation = if var1_sum > 0.0 && var2_sum > 0.0 {
                cov / (var1_sum.sqrt() * var2_sum.sqrt())
            } else {
                0.0
            };

            // Store correlation in the inner HashMap
            var1_corrs.insert(var2.clone(), correlation);
        }

        // Store the inner HashMap in the outer HashMap
        correlations.insert(var1.clone(), var1_corrs);
    }

    // Create dimension labels
    let dimensions: Vec<String> = (1..=p_dims).map(|i| i.to_string()).collect();

    Ok(CorrelationsMatrix {
        variables: var_names.clone(),
        dimensions,
        eigenvalues,
        correlations,
    })
}
