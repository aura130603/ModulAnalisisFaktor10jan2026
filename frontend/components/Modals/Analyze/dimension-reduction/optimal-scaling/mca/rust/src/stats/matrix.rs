use nalgebra::{ DMatrix, DVector, SVD };

use crate::models::{ config::MCAConfig, data::{ DataRecord, DataValue } };

use super::core::{ collect_valid_categories, is_missing };

/// Calculate the indicator matrix for MCA
pub fn calculate_indicator_matrix(
    dataset: &[DataRecord],
    variables: &[String],
    config: &MCAConfig
) -> Result<(Vec<DMatrix<f64>>, Vec<Vec<DataValue>>), String> {
    let mut indicator_matrices = Vec::new();
    let mut categories_per_var = Vec::new();

    for var_name in variables {
        // Collect all valid categories for the variable
        let categories = collect_valid_categories(dataset, var_name);
        if categories.is_empty() {
            return Err(format!("No valid categories found for variable: {}", var_name));
        }

        // Create indicator matrix for this variable
        let n_rows = dataset.len();
        let n_cols = categories.len();
        let mut indicator = DMatrix::zeros(n_rows, n_cols);

        for (row_idx, record) in dataset.iter().enumerate() {
            if let Some(value) = record.values.get(var_name) {
                if !is_missing(value) {
                    // Find category index
                    if
                        let Some(col_idx) = categories.iter().position(|cat| {
                            match (cat, value) {
                                (DataValue::Number(a), DataValue::Number(b)) =>
                                    (a - b).abs() < 1e-10,
                                (DataValue::Text(a), DataValue::Text(b)) => a == b,
                                (DataValue::Boolean(a), DataValue::Boolean(b)) => a == b,
                                _ => false,
                            }
                        })
                    {
                        // Set indicator to 1 for the matching category
                        indicator[(row_idx, col_idx)] = 1.0;
                    }
                }
            }
        }

        indicator_matrices.push(indicator);
        categories_per_var.push(categories);
    }

    Ok((indicator_matrices, categories_per_var))
}

/// Calculate the Burt matrix (cross-tabulation of all variables)
pub fn calculate_burt_matrix(
    indicator_matrices: &[DMatrix<f64>],
    var_weights: &[f64]
) -> DMatrix<f64> {
    // Calculate total number of columns
    let total_cols: usize = indicator_matrices
        .iter()
        .map(|m| m.ncols())
        .sum();

    // Initialize Burt matrix
    let mut burt = DMatrix::zeros(total_cols, total_cols);

    // Calculate cross-products
    let mut row_start = 0;
    for (i, g_i) in indicator_matrices.iter().enumerate() {
        let weight_i = var_weights[i];
        let cols_i = g_i.ncols();

        let mut col_start = 0;
        for (j, g_j) in indicator_matrices.iter().enumerate() {
            let weight_j = var_weights[j];
            let cols_j = g_j.ncols();

            // Calculate weighted cross-product
            let cross_product = (weight_i * weight_j).sqrt() * (g_i.transpose() * g_j);

            // Copy to appropriate part of Burt matrix
            for r in 0..cols_i {
                for c in 0..cols_j {
                    burt[(row_start + r, col_start + c)] = cross_product[(r, c)];
                }
            }

            col_start += cols_j;
        }

        row_start += cols_i;
    }

    burt
}

/// Update category quantifications based on object scores
pub fn update_category_quantifications(
    indicator: &DMatrix<f64>,
    object_scores: &DMatrix<f64>,
    weight: f64
) -> DMatrix<f64> {
    // Calculate D_j^-1 * G_j' * X
    // Where D_j is diagonal matrix with category frequencies
    // G_j is the indicator matrix
    // X is the object scores matrix

    let category_freqs = indicator.transpose() * DVector::from_element(indicator.nrows(), 1.0);
    let weighted_scores = indicator.transpose() * object_scores;

    // Create diagonal matrix D_j^-1
    let mut d_inv = DMatrix::zeros(category_freqs.len(), category_freqs.len());
    for i in 0..category_freqs.len() {
        if category_freqs[i] > 0.0 {
            d_inv[(i, i)] = 1.0 / category_freqs[i];
        }
    }

    // Calculate quantifications
    d_inv * weighted_scores
}

/// Center and orthonormalize a matrix using SVD
pub fn center_and_orthonormalize_matrix(matrix: &DMatrix<f64>) -> (DMatrix<f64>, Vec<f64>) {
    let n_rows = matrix.nrows();

    // Center the matrix
    let mut centered = matrix.clone();

    for j in 0..matrix.ncols() {
        let col_mean = matrix.column(j).sum() / (n_rows as f64);

        for i in 0..n_rows {
            centered[(i, j)] -= col_mean;
        }
    }

    // Perform SVD
    let svd = SVD::new(centered.clone(), true, true);

    // Get eigenvectors and eigenvalues
    let u = svd.u.unwrap();
    let singular_values = svd.singular_values;

    // Extract eigenvalues
    let eigenvalues: Vec<f64> = singular_values
        .iter()
        .map(|s| (s * s) / (n_rows as f64))
        .collect();

    // Orthonormalize using the left singular vectors
    let orthonormalized = u * DMatrix::from_diagonal(&singular_values);

    (orthonormalized, eigenvalues)
}
