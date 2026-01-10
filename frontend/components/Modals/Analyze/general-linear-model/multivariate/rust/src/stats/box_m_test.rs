use std::collections::HashMap;
use nalgebra::DMatrix;

use crate::models::{
    config::MultivariateConfig,
    data::AnalysisData,
    result::BoxTest,
};

use super::core::{
    extract_dependent_value,
    get_factor_combinations,
    matrix_determinant,
    chi_square_cdf,
    matches_combination,
    calculate_f_significance,
    from_dmatrix,
};

/// Calculate Box's M test for homogeneity of covariance matrices
///
/// Box's M Test tests the null hypothesis that the observed
/// covariance matrices of the dependent variables are equal across groups.
pub fn calculate_box_test(
    data: &AnalysisData,
    config: &MultivariateConfig
) -> Result<BoxTest, String> {
    // Step 1: Verify we have the necessary data
    if config.main.dep_var.is_none() || config.main.dep_var.as_ref().unwrap().is_empty() {
        return Err("No dependent variables specified for Box's M test".to_string());
    }

    if config.main.fix_factor.is_none() || config.main.fix_factor.as_ref().unwrap().is_empty() {
        return Err("No factors specified for Box's M test".to_string());
    }

    let dependent_vars = config.main.dep_var.as_ref().unwrap();
    let factors = config.main.fix_factor.as_ref().unwrap();

    // Step 2: Get all factor combinations to identify groups
    let combinations = get_factor_combinations(data, config)?;
    if combinations.is_empty() {
        return Err("No factor combinations found for Box's M test".to_string());
    }

    // Step 3: Calculate covariance matrices for each group
    let mut group_covariance_matrices: Vec<
        (HashMap<String, String>, DMatrix<f64>, usize)
    > = Vec::new();
    let mut total_n = 0;

    for combo in &combinations {
        let mut group_data: Vec<Vec<f64>> = Vec::new();

        // Collect all data points for this group
        for records in &data.dependent_data {
            for record in records {
                if matches_combination(record, combo, data, config) {
                    let mut values = Vec::new();
                    let mut has_missing = false;

                    for dep_var in dependent_vars {
                        if let Some(value) = extract_dependent_value(record, dep_var) {
                            values.push(value);
                        } else {
                            has_missing = true;
                            break;
                        }
                    }

                    if !has_missing && values.len() == dependent_vars.len() {
                        group_data.push(values);
                    }
                }
            }
        }

        // Need at least n > p (number of variables) for a valid covariance matrix
        if group_data.len() > dependent_vars.len() {
            let n = group_data.len();
            total_n += n;

            // Calculate covariance matrix for this group
            let cov_matrix = calculate_covariance_matrix(&group_data);
            group_covariance_matrices.push((combo.clone(), cov_matrix, n));
        }
    }

    if group_covariance_matrices.is_empty() {
        return Err("Insufficient data in groups for Box's M test".to_string());
    }

    // Step 4: Calculate the pooled covariance matrix
    let p = dependent_vars.len(); // Number of variables
    let mut pooled_cov_matrix = DMatrix::zeros(p, p);
    let mut total_df = 0;

    for (_, cov_matrix, n) in &group_covariance_matrices {
        let df = n - 1;
        total_df += df;
        pooled_cov_matrix += cov_matrix.clone() * (df as f64);
    }

    pooled_cov_matrix /= total_df as f64;

    // Step 5: Calculate Box's M statistic
    let mut box_m = 0.0;
    let mut ln_det_pooled = 0.0;

    // Try to get determinant of pooled matrix
    match matrix_determinant(&from_dmatrix(&pooled_cov_matrix)) {
        Ok(det) => {
            if det <= 0.0 {
                return Err("Pooled covariance matrix is singular".to_string());
            }
            ln_det_pooled = det.ln();
        }
        Err(e) => {
            return Err(format!("Error calculating determinant: {}", e));
        }
    }

    for (_, cov_matrix, n) in &group_covariance_matrices {
        let df = n - 1;

        match matrix_determinant(&from_dmatrix(cov_matrix)) {
            Ok(det) => {
                if det <= 0.0 {
                    return Err("Group covariance matrix is singular".to_string());
                }
                box_m += (df as f64) * (det.ln() - ln_det_pooled);
            }
            Err(e) => {
                return Err(format!("Error calculating determinant: {}", e));
            }
        }
    }

    box_m = -box_m;

    // Step 6: Calculate F approximation
    let g = group_covariance_matrices.len(); // Number of groups

    // Calculate C
    let mut sum_reciprocal = 0.0;
    for (_, _, n) in &group_covariance_matrices {
        let df = n - 1;
        sum_reciprocal += 1.0 / (df as f64);
    }

    let c1 =
        (2.0 * (p as f64).powi(2) + 3.0 * (p as f64) - 1.0) /
        (6.0 * ((p as f64) + 1.0) * ((g as f64) - 1.0));
    let c2 = (1.0 - c1) * sum_reciprocal - 1.0 / (total_df as f64);

    let f_statistic;
    let df1;
    let df2;

    if c2 > 0.0 {
        // Use F approximation
        let f_multiplier = ((g as f64) - 1.0) * ((p as f64) + 1.0) * ((p as f64) / 2.0);
        f_statistic = (box_m * (1.0 - c1 - c2 / box_m)) / f_multiplier;
        df1 = (p * (p + 1) * (g - 1)) / 2;
        df2 = ((df1 as f64) * (1.0 - c1 - c2 / box_m)).ceil() as f64;
    } else {
        // Use chi-square approximation
        f_statistic = box_m / c1;
        df1 = (p * (p + 1) * (g - 1)) / 2;
        df2 = 0.0; // Not used for chi-square
    }

    // Step 7: Calculate significance
    let significance = if df2 > 0.0 {
        calculate_f_significance(df1, df2 as usize, f_statistic)
    } else {
        // Chi-square approximation
        1.0 - chi_square_cdf(f_statistic, df1 as f64)
    };

    // Create the result
    Ok(BoxTest {
        box_m,
        f: f_statistic,
        df1,
        df2,
        significance,
        design: Some(format!("Box's M Test of Equality of Covariance Matrices")),
        description: Some(
            format!(
                "Tests the null hypothesis that the observed covariance matrices of the dependent variables are equal across groups."
            )
        ),
    })
}

/// Calculate covariance matrix from raw data
fn calculate_covariance_matrix(data: &[Vec<f64>]) -> DMatrix<f64> {
    let n = data.len();
    let p = if data.is_empty() { 0 } else { data[0].len() };

    if n <= 1 || p == 0 {
        return DMatrix::zeros(p, p);
    }

    // Calculate means
    let mut means = vec![0.0; p];
    for row in data {
        for (j, val) in row.iter().enumerate() {
            means[j] += val;
        }
    }
    for mean in &mut means {
        *mean /= n as f64;
    }

    // Calculate covariance matrix
    let mut cov_matrix = DMatrix::zeros(p, p);
    for row in data {
        for i in 0..p {
            for j in 0..p {
                cov_matrix[(i, j)] += (row[i] - means[i]) * (row[j] - means[j]);
            }
        }
    }

    // Divide by n-1 for unbiased estimate
    cov_matrix /= (n - 1) as f64;

    cov_matrix
}
