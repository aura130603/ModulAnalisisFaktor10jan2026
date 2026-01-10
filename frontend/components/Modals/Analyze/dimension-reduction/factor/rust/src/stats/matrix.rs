use std::collections::HashMap;
use nalgebra::{ DMatrix, DVector };
use statrs::distribution::{StudentsT, ContinuousCDF}; // ini untuk p-value (significant value)s
use crate::models::{
    config::FactorAnalysisConfig,
    data::AnalysisData,
    result::{
        AntiImageMatrices,
        CorrelationMatrix,
        CovarianceMatrix,
        DescriptiveStatistic,
        InverseCorrelationMatrix,
        InverseCovarianceMatrix,
    },
};

use super::core::{ extract_data_matrix, incomplete_beta };

pub fn calculate_matrix(
    data_matrix: &DMatrix<f64>,
    matrix_type: &str
) -> Result<DMatrix<f64>, String> {
    let n_rows = data_matrix.nrows();
    let n_cols = data_matrix.ncols();

    if n_rows < 2 {
        return Err("Not enough data to calculate matrix".to_string());
    }

    // Calculate column means
    let mut means = DVector::zeros(n_cols);
    for j in 0..n_cols {
        let mut sum = 0.0;
        for i in 0..n_rows {
            sum += data_matrix[(i, j)];
        }
        means[j] = sum / (n_rows as f64);
    }

    // Calculate matrix
    let mut result = DMatrix::zeros(n_cols, n_cols);

    if matrix_type == "correlation" {
        // Implement Pearson correlation formula:
        // r = sum((x_i - mean_x) * (y_i - mean_y)) / sqrt(sum((x_i - mean_x)^2) * sum((y_i - mean_y)^2))
        for i in 0..n_cols {
            for j in 0..n_cols {
                let mut sum_xy = 0.0;
                let mut sum_x2 = 0.0;
                let mut sum_y2 = 0.0;

                for k in 0..n_rows {
                    let dx = data_matrix[(k, i)] - means[i];
                    let dy = data_matrix[(k, j)] - means[j];

                    sum_xy += dx * dy;
                    sum_x2 += dx * dx;
                    sum_y2 += dy * dy;
                }

                let denominator = (sum_x2 * sum_y2).sqrt();

                if denominator > 0.0 {
                    result[(i, j)] = sum_xy / denominator;
                } else {
                    // If denominator is 0 (no variation), correlation is undefined
                    result[(i, j)] = if i == j { 1.0 } else { 0.0 };
                }
            }
        }
    } else {
        // Covariance matrix: cov = sum((x_i - mean_x) * (y_i - mean_y)) / (n - 1)
        for i in 0..n_cols {
            for j in 0..n_cols {
                let mut sum_product = 0.0;
                for k in 0..n_rows {
                    sum_product += (data_matrix[(k, i)] - means[i]) * (data_matrix[(k, j)] - means[j]);
                }
                result[(i, j)] = sum_product / ((n_rows - 1) as f64);
            }
        }
    }

    Ok(result)
}

// Calculate descriptive statistics
pub fn calculate_descriptive_statistics(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<Vec<DescriptiveStatistic>, String> {
    let (data_matrix, var_names) = extract_data_matrix(data, config)?;

    let n_rows = data_matrix.nrows();
    let n_cols = data_matrix.ncols();
    let mut stats = Vec::with_capacity(n_cols);

    for j in 0..n_cols {
        let mut sum = 0.0;
        let mut sum_sq = 0.0;

        for i in 0..n_rows {
            let val = data_matrix[(i, j)];
            sum += val;
            sum_sq += val.powi(2);
        }

        let mean = sum / (n_rows as f64);
        let variance = (sum_sq - sum.powi(2) / (n_rows as f64)) / ((n_rows - 1) as f64);
        let std_dev = variance.sqrt();

        stats.push(DescriptiveStatistic {
            variable: var_names[j].clone(),
            mean,
            std_deviation: std_dev,
            analysis_n: n_rows,
        });
    }

    Ok(stats)
}

// Independent correlation matrix functions
pub fn calculate_correlation_matrix(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<CorrelationMatrix, String> {
    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    let matrix = calculate_matrix(&data_matrix, "correlation")?;

    let n_vars = var_names.len();
    if matrix.nrows() != n_vars || matrix.ncols() != n_vars {
        return Err(
            format!(
                "Matrix dimensions {}x{} don't match variable count {}",
                matrix.nrows(),
                matrix.ncols(),
                n_vars
            )
        );
    }

    let mut correlations = HashMap::new();
    let mut sig_values = HashMap::new();

    for i in 0..n_vars {
        let var_name = &var_names[i];
        let mut var_correlations = HashMap::new();
        let mut var_sig_values = HashMap::new();

        for j in 0..n_vars {
            let other_var = &var_names[j];
            var_correlations.insert(other_var.clone(), matrix[(i, j)]);

            // Calculate significance (p-value) only if requested
            if config.descriptives.significance_lvl {
                let p_value = if i == j {
                    0.0
                } else {
                    // Calculate p-value using Pearson correlation significance test
                    let n = data_matrix.nrows() as f64;
                    let r = matrix[(i, j)];

                    // Clamp r to avoid division by zero
                    let r_clamped = r.max(-0.99999).min(0.99999);

                    // Calculate t-statistic: t = r * sqrt(n-2) / sqrt(1-r^2)
                    let numerator = r_clamped * ((n - 2.0).sqrt());
                    let denominator = (1.0 - r_clamped * r_clamped).sqrt();
                    let t_stat = numerator / denominator;

                    // Calculate 2-tailed p-value using t distribution with df = n-2
                    // incomplete_beta gives CDF: P(T <= |t|)
                    // We need: P(T > |t|) = 1 - CDF(|t|)
                    // let df = n - 2.0;
                    // let abs_t = t_stat.abs();
                    // let x = df / (df + abs_t * abs_t);
                    // let cdf = incomplete_beta(0.5 * df, 0.5, x);  // P(T <= |t|)
                    // let p_two_tailed = 2.0 * (1.0 - cdf);          // P(T > |t|) two-tailed

                    let df = n - 2.0;
                    let t_dist = StudentsT::new(0.0, 1.0, df).unwrap();
                    // 1-tailed p-value (same formula SPSS uses for "Sig. (1-tailed)")
                    let p_one_tailed = 1.0 - t_dist.cdf(t_stat.abs());


                    // Convert to 1-tailed p-value: P_1-tailed = P_2-tailed / 2
                    p_one_tailed 
                };

                var_sig_values.insert(other_var.clone(), p_value);
            }
        }

        correlations.insert(var_name.clone(), var_correlations);
        sig_values.insert(var_name.clone(), var_sig_values);
    }

    Ok(CorrelationMatrix {
        correlations,
        sig_values,
        variable_order: var_names,
    })
}

pub fn calculate_covariance_matrix(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<CovarianceMatrix, String> {
    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    let matrix = calculate_matrix(&data_matrix, "covariance")?;

    let n_vars = var_names.len();
    if matrix.nrows() != n_vars || matrix.ncols() != n_vars {
        return Err(
            format!(
                "Matrix dimensions {}x{} don't match variable count {}",
                matrix.nrows(),
                matrix.ncols(),
                n_vars
            )
        );
    }

    let mut covariances = HashMap::new();

    for i in 0..n_vars {
        let var_name = &var_names[i];
        let mut var_covariances = HashMap::new();

        for j in 0..n_vars {
            let other_var = &var_names[j];
            var_covariances.insert(other_var.clone(), matrix[(i, j)]);
        }

        covariances.insert(var_name.clone(), var_covariances);
    }

    let determinant = matrix.determinant();

    Ok(CovarianceMatrix {
        covariances,
        variable_order: var_names,
        determinant,
    })
}

pub fn calculate_inverse_correlation_matrix(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<InverseCorrelationMatrix, String> {
    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    let corr_matrix = calculate_matrix(&data_matrix, "correlation")?;

    let inverse = match corr_matrix.try_inverse() {
        Some(inv) => inv,
        None => {
            return Err("Could not invert correlation matrix".to_string());
        }
    };

    let n_vars = var_names.len();
    let mut inverse_correlations = HashMap::new();

    for i in 0..n_vars {
        let var_name = &var_names[i];
        let mut var_inverse = HashMap::new();

        for j in 0..n_vars {
            let other_var = &var_names[j];
            var_inverse.insert(other_var.clone(), inverse[(i, j)]);
        }

        inverse_correlations.insert(var_name.clone(), var_inverse);
    }

    Ok(InverseCorrelationMatrix {
        inverse_correlations,
        variable_order: var_names,
    })
}

pub fn calculate_inverse_covariance_matrix(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<InverseCovarianceMatrix, String> {
    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    let cov_matrix = calculate_matrix(&data_matrix, "covariance")?;

    let determinant = cov_matrix.determinant();

    let inverse = match cov_matrix.try_inverse() {
        Some(inv) => inv,
        None => {
            return Err("Could not invert covariance matrix".to_string());
        }
    };

    let n_vars = var_names.len();
    let mut inverse_covariances = HashMap::new();

    for i in 0..n_vars {
        let var_name = &var_names[i];
        let mut var_inverse = HashMap::new();

        for j in 0..n_vars {
            let other_var = &var_names[j];
            var_inverse.insert(other_var.clone(), inverse[(i, j)]);
        }

        inverse_covariances.insert(var_name.clone(), var_inverse);
    }

    Ok(InverseCovarianceMatrix {
        inverse_covariances,
        variable_order: var_names,
        determinant,
    })
}

// Fungsi utilitas untuk menghitung rata-rata kolom
fn calculate_mean(data: &DMatrix<f64>, col_index: usize) -> f64 {
    let n_rows = data.nrows();
    let sum: f64 = (0..n_rows)
        .map(|r| data[(r, col_index)])
        .sum();
    sum / (n_rows as f64)
}

/// Menghitung varians mentah (sampel) untuk setiap variabel (kolom) dalam matriks data.
pub fn calculate_raw_variances(data_matrix: &DMatrix<f64>) -> Result<Vec<f64>, String> {
    let n_rows = data_matrix.nrows();
    let n_cols = data_matrix.ncols();

    if n_rows <= 1 {
        return Err("Data tidak cukup untuk menghitung varians. Diperlukan minimal 2 observasi.".to_string());
    }

    let mut variances = Vec::with_capacity(n_cols);
    let sample_divisor = n_rows as f64 - 1.0;

    for c in 0..n_cols {
        let mean = calculate_mean(data_matrix, c);

        let sum_of_squares: f64 = (0..n_rows)
            .map(|r| {
                let diff = data_matrix[(r, c)] - mean;
                diff.powi(2)
            })
            .sum();

        let variance = sum_of_squares / sample_divisor;
        variances.push(variance);
    }

    Ok(variances)
}

pub fn calculate_anti_image_matrices(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<AntiImageMatrices, String> {
    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    let corr_matrix = calculate_matrix(&data_matrix, "correlation")?;

    let inverse = match corr_matrix.try_inverse() {
        Some(inv) => inv,
        None => {
            return Err("Could not invert correlation matrix".to_string());
        }
    };

    let n_vars = var_names.len();
    let mut anti_image_covariance = HashMap::new();
    let mut anti_image_correlation = HashMap::new();

    for i in 0..n_vars {
        let var_name = &var_names[i];
        let mut var_cov = HashMap::new();
        let mut var_corr = HashMap::new();

        for j in 0..n_vars {
            let other_var = &var_names[j];

            // Anti-image covariance: -partial covariances (negative of off-diagonal elements of inverse)
            let cov_value = if i == j {
                1.0 / inverse[(i, j)]
            } else {
                inverse[(i, j)] / (inverse[(i, i)] * inverse[(j, j)])
            };

            var_cov.insert(other_var.clone(), cov_value);

            // Anti-image correlation: partial correlations with sign reversed
            let corr_value = if i == j {
                1.0
            } else {
               inverse[(i, j)] / (inverse[(i, i)] * inverse[(j, j)]).sqrt()
            };

            var_corr.insert(other_var.clone(), corr_value);
        }

        anti_image_covariance.insert(var_name.clone(), var_cov);
        anti_image_correlation.insert(var_name.clone(), var_corr);
    }

    Ok(AntiImageMatrices {
        anti_image_covariance,
        anti_image_correlation,
        variable_order: var_names,
    })
}
