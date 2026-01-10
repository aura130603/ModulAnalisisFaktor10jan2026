use std::collections::HashMap;

use crate::models::{
    config::RepeatedMeasuresConfig,
    data::AnalysisData,
    result::ResidualMatrix,
};

use super::common::{
    build_design_matrix_and_response,
    calculate_mean,
    extract_dependent_value,
    get_factor_levels,
    matrix_determinant,
    matrix_inverse,
    matrix_multiply,
    matrix_transpose,
    data_value_to_string,
};

/// Calculate the residual SSCP matrix
/// The residual SSCP matrix is the matrix of the sum of squares and cross-products of the residuals
pub fn calculate_residual_matrix(
    data: &AnalysisData,
    config: &RepeatedMeasuresConfig
) -> Result<ResidualMatrix, String> {
    // Get the list of dependent variables
    let dependent_vars = config.main.sub_var.as_ref().unwrap();

    // Get the list of factors (if any)
    let factors = config.main.factors_var.as_ref().map_or(Vec::new(), |f| f.clone());

    // Extract values for all dependent variables and organize by record
    let mut all_values: Vec<HashMap<usize, f64>> = Vec::new();
    let n_dep_vars = dependent_vars.len();

    // Total number of records (to allocate arrays)
    let mut total_records = 0;
    for records in &data.subject_data {
        total_records += records.len();
    }

    // Initialize vectors to store values for each dependent variable
    for _ in 0..n_dep_vars {
        all_values.push(HashMap::new());
    }

    // Extract values for each dependent variable
    let mut record_idx = 0;
    for records in &data.subject_data {
        for record in records {
            for (i, dep_var) in dependent_vars.iter().enumerate() {
                if let Some(value) = extract_dependent_value(record, dep_var) {
                    all_values[i].insert(record_idx, value);
                }
            }
            record_idx += 1;
        }
    }

    // Build the design matrix for each dependent variable
    let mut design_matrices = Vec::new();
    let mut y_vectors = Vec::new();

    for dep_var in dependent_vars {
        match build_design_matrix_and_response(data, config, dep_var) {
            Ok((x_matrix, y_vector)) => {
                design_matrices.push(x_matrix);
                y_vectors.push(y_vector);
            }
            Err(e) => {
                return Err(format!("Failed to build design matrix: {}", e));
            }
        }
    }

    // Calculate model parameters and residuals for each dependent variable
    let mut residuals = Vec::new();

    for (i, (x_matrix, y_vector)) in design_matrices.iter().zip(y_vectors.iter()).enumerate() {
        // Calculate X'X
        let x_transpose = matrix_transpose(x_matrix);
        let xtx = match matrix_multiply(&x_transpose, x_matrix) {
            Ok(result) => result,
            Err(e) => {
                return Err(format!("Error computing X'X: {}", e));
            }
        };

        // Calculate (X'X)^-1
        let xtx_inv = match matrix_inverse(&xtx) {
            Ok(result) => result,
            Err(e) => {
                return Err(format!("Error inverting X'X: {}", e));
            }
        };

        // Calculate X'y
        let mut xty = vec![0.0; x_transpose.len()];
        for (i, x_row) in x_transpose.iter().enumerate() {
            for (j, &x_val) in x_row.iter().enumerate() {
                if j < y_vector.len() {
                    xty[i] += x_val * y_vector[j];
                }
            }
        }

        // Calculate beta = (X'X)^-1 X'y
        let mut beta = vec![0.0; xtx_inv.len()];
        for (i, xtx_row) in xtx_inv.iter().enumerate() {
            for (j, &xtx_val) in xtx_row.iter().enumerate() {
                if j < xty.len() {
                    beta[i] += xtx_val * xty[j];
                }
            }
        }

        // Calculate predicted values y_hat = X*beta
        let mut y_hat = vec![0.0; x_matrix.len()];
        for (i, x_row) in x_matrix.iter().enumerate() {
            for (j, &x_val) in x_row.iter().enumerate() {
                if j < beta.len() {
                    y_hat[i] += x_val * beta[j];
                }
            }
        }

        // Calculate residuals e = y - y_hat
        let mut residual = HashMap::new();
        for i in 0..y_vector.len() {
            residual.insert(i, y_vector[i] - y_hat[i]);
        }

        residuals.push(residual);
    }

    // Calculate the residual SSCP matrix
    let mut residual_sscp = HashMap::new();

    for (i, var1) in dependent_vars.iter().enumerate() {
        let mut row_values = HashMap::new();

        for (j, var2) in dependent_vars.iter().enumerate() {
            // Calculate the SSCP value: sum of product of residuals
            let mut sscp_value = 0.0;

            // Only process records that have values for both dependent variables
            for record_idx in 0..total_records {
                if
                    let (Some(&res1), Some(&res2)) = (
                        residuals[i].get(&record_idx),
                        residuals[j].get(&record_idx),
                    )
                {
                    sscp_value += res1 * res2;
                }
            }

            row_values.insert(var2.clone(), sscp_value);
        }

        residual_sscp.insert(var1.clone(), row_values);
    }

    // Calculate the degrees of freedom
    let n_obs = residuals[0].len();

    // Rank of the design matrix (number of parameters)
    let rank = design_matrices[0][0].len();

    let df = n_obs - rank;

    // Return the residual SSCP matrix
    Ok(ResidualMatrix {
        matrix_type: "Residual SSCP".to_string(),
        values: residual_sscp,
        description: Some(format!("Degrees of freedom: {}", df)),
    })
}

/// Calculate residual covariance matrix from the residual SSCP matrix
pub fn calculate_residual_covariance(
    residual_sscp: &ResidualMatrix,
    df: usize
) -> Result<ResidualMatrix, String> {
    let mut residual_cov = HashMap::new();

    for (var1, row_map) in &residual_sscp.values {
        let mut cov_row = HashMap::new();

        for (var2, &sscp_value) in row_map {
            let cov_value = sscp_value / (df as f64);
            cov_row.insert(var2.clone(), cov_value);
        }

        residual_cov.insert(var1.clone(), cov_row);
    }

    Ok(ResidualMatrix {
        matrix_type: "Residual Covariance".to_string(),
        values: residual_cov,
        description: Some(format!("Residual Covariance Matrix (SSCP/df), df = {}", df)),
    })
}

/// Calculate residual correlation matrix from the residual covariance matrix
pub fn calculate_residual_correlation(
    residual_cov: &ResidualMatrix
) -> Result<ResidualMatrix, String> {
    let mut residual_corr = HashMap::new();

    // Extract diagonal elements (variances) from covariance matrix
    let mut variances = HashMap::new();
    for (var, row_map) in &residual_cov.values {
        if let Some(&variance) = row_map.get(var) {
            variances.insert(var.clone(), variance);
        }
    }

    for (var1, row_map) in &residual_cov.values {
        let mut corr_row = HashMap::new();

        for (var2, &cov_value) in row_map {
            if let (Some(&var1_var), Some(&var2_var)) = (variances.get(var1), variances.get(var2)) {
                let denominator = (var1_var * var2_var).sqrt();
                let corr_value = if denominator > 1e-10 {
                    cov_value / denominator
                } else {
                    if var1 == var2 { 1.0 } else { 0.0 }
                };

                corr_row.insert(var2.clone(), corr_value);
            } else {
                // If no variance found, set correlation to 0 (or 1 for diagonal)
                corr_row.insert(var2.clone(), if var1 == var2 { 1.0 } else { 0.0 });
            }
        }

        residual_corr.insert(var1.clone(), corr_row);
    }

    Ok(ResidualMatrix {
        matrix_type: "Residual Correlation".to_string(),
        values: residual_corr,
        description: Some("Standardized Residual Correlation Matrix".to_string()),
    })
}

/// Calculate Bartlett's test of sphericity for the residual covariance matrix
pub fn calculate_bartlett_sphericity_test(
    residual_cov: &ResidualMatrix,
    df: usize
) -> Result<f64, String> {
    // Get the dimension of the covariance matrix (number of dependent variables)
    let p = residual_cov.values.len();

    if p <= 1 {
        return Err("Bartlett's test requires at least 2 dependent variables".to_string());
    }

    // Calculate determinant of the covariance matrix
    let mut cov_matrix = vec![vec![0.0; p]; p];
    let var_names: Vec<String> = residual_cov.values.keys().cloned().collect();

    for (i, var1) in var_names.iter().enumerate() {
        if let Some(row) = residual_cov.values.get(var1) {
            for (j, var2) in var_names.iter().enumerate() {
                if let Some(&value) = row.get(var2) {
                    cov_matrix[i][j] = value;
                }
            }
        }
    }

    let det = match matrix_determinant(&cov_matrix) {
        Ok(d) => d,
        Err(e) => {
            return Err(format!("Error calculating determinant: {}", e));
        }
    };

    // Calculate trace of the covariance matrix
    let mut trace = 0.0;
    for i in 0..p {
        trace += cov_matrix[i][i];
    }

    // Calculate Bartlett's test statistic
    let n = df + p; // Number of observations

    if det <= 0.0 || trace <= 0.0 {
        return Err("Invalid covariance matrix for Bartlett's test".to_string());
    }

    let w = det.powf((n as f64) / 2.0) / (trace / (p as f64)).powf(((n * p) as f64) / 2.0);

    // Calculate chi-square approximation
    let chi_square = -(n as f64) * w.ln();

    Ok(chi_square)
}
