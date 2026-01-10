use nalgebra::DMatrix;

use crate::models::{
    config::RepeatedMeasuresConfig,
    data::AnalysisData,
    result::BartlettTest,
};

use super::core::{ extract_dependent_value, matrix_determinant, chi_square_cdf, from_dmatrix };

pub fn calculate_bartlett_test(
    data: &AnalysisData,
    config: &RepeatedMeasuresConfig
) -> Result<BartlettTest, String> {
    // Step 1: Verify we have the necessary data
    if config.main.factors_var.is_none() || config.main.factors_var.as_ref().unwrap().len() < 2 {
        return Err("At least two dependent variables are required for Bartlett's test".to_string());
    }

    let factor_vars = config.main.factors_var.as_ref().unwrap();

    // Step 2: Extract data for the dependent variables
    let mut raw_data: Vec<Vec<f64>> = Vec::new();

    for records in &data.factors_data {
        for record in records {
            let mut values = Vec::new();
            let mut has_missing = false;

            for factors_var in factor_vars {
                if let Some(value) = extract_dependent_value(record, factors_var) {
                    values.push(value);
                } else {
                    has_missing = true;
                    break;
                }
            }

            if !has_missing && values.len() == factor_vars.len() {
                raw_data.push(values);
            }
        }
    }

    let n = raw_data.len();
    let p = factor_vars.len();

    if n <= p {
        return Err(format!("Insufficient data (n={}) for Bartlett's test with {} variables", n, p));
    }

    // Step 3: Calculate the covariance matrix
    let cov_matrix = calculate_covariance_matrix(&raw_data);

    // Step 4: Calculate the correlation matrix
    let cor_matrix = covariance_to_correlation(&cov_matrix);

    // Step 5: Calculate Bartlett's test statistic
    match matrix_determinant(&from_dmatrix(&cor_matrix)) {
        Ok(det) => {
            if det <= 0.0 {
                return Err("Correlation matrix is singular".to_string());
            }

            // Calculate the test statistic
            // χ² = -(n-1-(2p+5)/6) * ln(det(R))
            let correction = (n as f64) - 1.0 - (2.0 * (p as f64) + 5.0) / 6.0;
            let chi_square = -correction * det.ln();

            // Degrees of freedom = p(p-1)/2
            let df = (p * (p - 1)) / 2;

            // Calculate significance
            let significance = 1.0 - chi_square_cdf(chi_square, df as f64);

            // Calculate likelihood ratio
            let likelihood_ratio = det;

            // Create the result
            Ok(BartlettTest {
                likelihood_ratio,
                approx_chi_square: chi_square,
                df,
                significance,
                description: Some(
                    format!(
                        "Tests the null hypothesis that the correlation matrix is an identity matrix."
                    )
                ),
                design: Some(format!("Bartlett's Test of Sphericity")),
            })
        }
        Err(e) => Err(format!("Error calculating determinant: {}", e)),
    }
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

/// Convert a covariance matrix to a correlation matrix
fn covariance_to_correlation(cov_matrix: &DMatrix<f64>) -> DMatrix<f64> {
    let p = cov_matrix.nrows();
    let mut cor_matrix = DMatrix::zeros(p, p);

    // Extract standard deviations from the diagonal
    let mut std_devs = Vec::with_capacity(p);
    for i in 0..p {
        std_devs.push(cov_matrix[(i, i)].sqrt());
    }

    // Calculate correlation coefficients
    for i in 0..p {
        for j in 0..p {
            if std_devs[i] > 0.0 && std_devs[j] > 0.0 {
                cor_matrix[(i, j)] = cov_matrix[(i, j)] / (std_devs[i] * std_devs[j]);
            } else {
                // Handle zero variance
                cor_matrix[(i, j)] = if i == j { 1.0 } else { 0.0 };
            }
        }
    }

    cor_matrix
}

/// Additional function to handle the residual SSCP matrix for Bartlett's test
///
/// This is an alternative implementation of Bartlett's test that uses the
/// residual sums of squares and cross-products matrix instead of the raw data.
pub fn calculate_bartlett_test_from_residual(
    residual_sscp: &DMatrix<f64>,
    n: usize,
    r_x: usize
) -> Result<BartlettTest, String> {
    let p = residual_sscp.nrows();

    if p < 2 {
        return Err("At least two variables are required for Bartlett's test".to_string());
    }

    if n <= r_x {
        return Err("Insufficient degrees of freedom for residual".to_string());
    }

    // Convert SSCP to correlation matrix
    let mut cov_matrix = residual_sscp.clone();
    cov_matrix /= (n - r_x) as f64;
    let cor_matrix = covariance_to_correlation(&cov_matrix);

    // Calculate the test statistic
    match matrix_determinant(&from_dmatrix(&cor_matrix)) {
        Ok(det) => {
            if det <= 0.0 {
                return Err("Correlation matrix is singular".to_string());
            }

            // Calculate correction factor
            let rho =
                1.0 -
                (2.0 * (p as f64).powi(2) + (p as f64) + 2.0) /
                    (6.0 * (p as f64) * ((n - r_x) as f64));

            // Calculate omega2
            let omega2 =
                (((p as f64) + 2.0) *
                    ((p as f64) - 1.0) *
                    ((p as f64) - 2.0) *
                    (2.0 * (p as f64).powi(3) +
                        6.0 * (p as f64).powi(2) +
                        3.0 * (p as f64) +
                        2.0)) /
                (288.0 * (p as f64).powi(2) * ((n - r_x) as f64).powi(2) * rho.powi(2));

            // Calculate test statistic
            let w =
                det.powf(((n - r_x) as f64) / 2.0) /
                (cov_matrix.trace() / (p as f64)).powf((((n - r_x) * p) as f64) / 2.0);

            let chi_square = -rho * ((n - r_x) as f64) * w.ln();

            // Degrees of freedom = p(p+1)/2 - 1
            let df = (p * (p + 1)) / 2 - 1;

            // Calculate significance with correction
            let significance_raw = 1.0 - chi_square_cdf(chi_square, df as f64);
            let significance_corrected =
                significance_raw -
                omega2 *
                    (chi_square_cdf(chi_square, (df + 4) as f64) -
                        chi_square_cdf(chi_square, df as f64));

            let significance = significance_corrected.max(0.0); // Ensure non-negative

            // Create the result
            Ok(BartlettTest {
                likelihood_ratio: w,
                approx_chi_square: chi_square,
                df,
                significance,
                description: Some(
                    format!(
                        "Tests the null hypothesis that the residual covariance matrix is proportional to an identity matrix."
                    )
                ),
                design: Some(format!("Bartlett's Test of Sphericity for Residual Matrix")),
            })
        }
        Err(e) => Err(format!("Error calculating determinant: {}", e)),
    }
}
