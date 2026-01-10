use nalgebra::DMatrix;
use statrs::distribution::ContinuousCDF;
use rayon::prelude::*;

use crate::models::{ result::BoxMTest, AnalysisData, DiscriminantConfig };

use super::core::{
    AnalyzedDataset,
    extract_analyzed_dataset,
    calculate_log_determinant,
    calculate_covariance,
    EPSILON,
};

/// Calculates Box's M test for homogeneity of covariance matrices.
///
/// Box's M test is used to test the null hypothesis:
/// H₀: Σ₁ = Σ₂ = ... = Σₖ
///
/// Where Σᵢ is the covariance matrix for the ith group.
/// For moderate to small sample sizes, an F approximation is used to
/// compute the significance level as per Box (1949).
///
/// The Box's M statistic is calculated as:
/// M = (n-g)log|S| - Σ(nᵢ-1)log|Sᵢ|
///
/// Where:
/// - S is the pooled within-groups covariance matrix
/// - Sᵢ is the covariance matrix for group i
/// - n is the total sample size
/// - g is the number of groups
/// - nᵢ is the size of group i
///
/// # Parameters
/// * `data` - The analysis data
/// * `config` - The discriminant analysis configuration
///
/// # Returns
/// A BoxMTest structure containing test statistics and p-value
pub fn calculate_box_m_test(
    data: &AnalysisData,
    config: &DiscriminantConfig
) -> Result<BoxMTest, String> {
    web_sys::console::log_1(&"Executing calculate_box_m_test".into());

    // Extract analyzed dataset
    let dataset = match extract_analyzed_dataset(data, config) {
        Ok(ds) => ds,
        Err(e) => {
            return Err(format!("Failed to extract dataset for Box's M test: {}", e));
        }
    };

    let independent_variables = &config.main.independent_variables;

    // Compute per-group covariance matrices and log determinants
    let (group_covs, group_log_dets, group_sizes) = compute_group_covariances(
        &dataset,
        independent_variables
    )?;

    if group_covs.is_empty() {
        return Err("No valid groups for Box's M test".to_string());
    }

    let p = independent_variables.len(); // Number of variables
    let k = group_covs.len(); // Number of groups
    let total_sample_size: usize = group_sizes.iter().sum();

    // Compute pooled covariance matrix
    let pooled_cov_matrix = compute_pooled_covariance_matrix(&group_covs, &group_sizes);
    let pooled_log_det = calculate_log_determinant(&pooled_cov_matrix);

    // Compute Box's M statistic: M = (n-g)log|S| - Σ(nᵢ-1)log|Sᵢ|
    let mut box_m = ((total_sample_size - k) as f64) * pooled_log_det;
    for (i, log_det) in group_log_dets.iter().enumerate() {
        box_m -= ((group_sizes[i] - 1) as f64) * log_det;
    }

    // Compute correction factors ρ and τ (named c1 and c2 in code)
    let c1 = compute_c1_factor(p, k, &group_sizes, total_sample_size); // ρ calculation
    let c2 = compute_c2_factor(p, k, &group_sizes, total_sample_size); // τ calculation

    // Compute F approximation
    let v1 = ((p * (p + 1) * (k - 1)) as f64) / 2.0; // f₁ = (g-1)p(p+1)/2

    // Calculate f₂ = (f₁+2)/(|ρ-τ/ρ|)
    let v2 = compute_df2(c1, c2, v1);

    // γM where γ = (1-ρ-f₂/f₁)/f₁
    let b = compute_b_factor(c1, c2, v1, v2);
    let f_approx = if b > EPSILON && box_m > EPSILON {
        if c2 > c1 * c1 { box_m / b } else { (v2 * box_m) / (v1 * (b - box_m)) }
    } else {
        0.0
    };

    // P-value calculation: 1 - CDF.F(F_approx, df1, df2)
    let p_value = if f_approx.is_finite() { compute_p_value(f_approx, v1, v2) } else { 1.0 };

    // Add explanatory note based on Box's M documentation
    let note = "Note: Tests null hypothesis of equal population covariance matrices.".to_string();

    Ok(BoxMTest {
        box_m,
        f_approx,
        df1: v1,
        df2: v2,
        p_value,
        note,
    })
}

/// Computes group covariance matrices, their log determinants, and group sizes.
///
/// This function calculates the covariance matrix for each group with sufficient data,
/// along with the natural logarithm of the determinant of each covariance matrix.
///
/// # Parameters
/// * `dataset` - The analyzed dataset
/// * `variables` - The variables to include in the covariance matrices
///
/// # Returns
/// A tuple containing (covariance matrices, log determinants, group sizes)
fn compute_group_covariances(
    dataset: &AnalyzedDataset,
    variables: &[String]
) -> Result<(Vec<DMatrix<f64>>, Vec<f64>, Vec<usize>), String> {
    let mut group_covs = Vec::new();
    let mut group_log_dets = Vec::new();
    let mut group_sizes = Vec::new();

    // Process each group in parallel
    let results: Vec<Option<(DMatrix<f64>, f64, usize)>> = dataset.group_labels
        .par_iter()
        .map(|group| {
            // Check if group has enough data for covariance calculation
            let mut valid_values = true;
            for var in variables {
                if let Some(values) = dataset.group_data.get(var).and_then(|g| g.get(group)) {
                    if values.len() <= 1 {
                        valid_values = false;
                        break;
                    }
                } else {
                    valid_values = false;
                    break;
                }
            }

            if !valid_values {
                return None;
            }

            // Get group size
            let group_size = dataset.group_data
                .get(variables.first().unwrap_or(&String::new()))
                .and_then(|v| v.get(group))
                .map_or(0, |v| v.len());

            if group_size <= 1 {
                return None;
            }

            // Compute covariance matrix
            match compute_group_covariance_matrix(dataset, group, variables) {
                Ok(cov_matrix) => {
                    let log_det = calculate_log_determinant(&cov_matrix);
                    Some((cov_matrix, log_det, group_size))
                }
                Err(_) => None,
            }
        })
        .collect();

    // Collect valid results
    for result in results {
        if let Some((cov, log_det, size)) = result {
            group_covs.push(cov);
            group_log_dets.push(log_det);
            group_sizes.push(size);
        }
    }

    Ok((group_covs, group_log_dets, group_sizes))
}

/// Computes the covariance matrix for a specific group.
///
/// # Parameters
/// * `dataset` - The analyzed dataset
/// * `group` - The group label
/// * `variables` - The variables to include in the covariance matrix
///
/// # Returns
/// The covariance matrix for the specified group
fn compute_group_covariance_matrix(
    dataset: &AnalyzedDataset,
    group: &str,
    variables: &[String]
) -> Result<DMatrix<f64>, String> {
    let num_vars = variables.len();

    // Check if we have enough data
    let first_var = variables.first().ok_or_else(|| "No variables provided".to_string())?;
    let num_cases = dataset.group_data
        .get(first_var)
        .and_then(|g| g.get(group))
        .map_or(0, |v| v.len());

    if num_cases <= 1 {
        return Err("Group too small for covariance computation".to_string());
    }

    // Compute covariance matrix
    let mut cov_matrix = DMatrix::zeros(num_vars, num_vars);

    for (var1_idx, var1) in variables.iter().enumerate() {
        for (var2_idx, var2) in variables.iter().enumerate() {
            if
                let (Some(values1), Some(values2)) = (
                    dataset.group_data.get(var1).and_then(|g| g.get(group)),
                    dataset.group_data.get(var2).and_then(|g| g.get(group)),
                )
            {
                if !values1.is_empty() && !values2.is_empty() {
                    let mean1 = dataset.group_means
                        .get(group)
                        .and_then(|m| m.get(var1))
                        .unwrap_or(&0.0);
                    let mean2 = dataset.group_means
                        .get(group)
                        .and_then(|m| m.get(var2))
                        .unwrap_or(&0.0);

                    let cov = calculate_covariance(values1, values2, Some(*mean1), Some(*mean2));
                    cov_matrix[(var1_idx, var2_idx)] = cov;
                }
            }
        }
    }

    // Add small regularization for numerical stability
    for i in 0..num_vars {
        cov_matrix[(i, i)] += EPSILON;
    }

    Ok(cov_matrix)
}

/// Computes the pooled covariance matrix across all groups.
///
/// The pooled matrix is calculated as:
/// S = Σ(nᵢ-1)Sᵢ / (n-g)
///
/// Where:
/// - nᵢ is the size of group i
/// - Sᵢ is the covariance matrix for group i
/// - n is the total sample size
/// - g is the number of groups
///
/// # Parameters
/// * `group_covs` - Individual group covariance matrices
/// * `group_sizes` - Sizes of each group
///
/// # Returns
/// The pooled covariance matrix
fn compute_pooled_covariance_matrix(
    group_covs: &[DMatrix<f64>],
    group_sizes: &[usize]
) -> DMatrix<f64> {
    if group_covs.is_empty() {
        return DMatrix::zeros(0, 0);
    }

    let p = group_covs[0].nrows();
    let mut pooled_cov = DMatrix::zeros(p, p);
    let mut total_df = 0;

    for (cov, &size) in group_covs.iter().zip(group_sizes) {
        let df = size - 1;
        total_df += df;
        pooled_cov += cov * (df as f64);
    }

    if total_df > 0 {
        pooled_cov /= total_df as f64;
    }

    // Add small regularization for numerical stability
    for i in 0..p {
        pooled_cov[(i, i)] += EPSILON;
    }

    pooled_cov
}

/// Computes the c1 (rho) correction factor for Box's M test.
///
/// ρ = 1 - (2p²+3p-1)/(6(p+1)(g-1)) * [Σ1/(nᵢ-1) - 1/(n-g)]
///
/// # Parameters
/// * `p` - Number of variables
/// * `k` - Number of groups
/// * `group_sizes` - Sizes of each group
/// * `total_sample_size` - Total sample size
///
/// # Returns
/// The c1 (rho) correction factor
fn compute_c1_factor(p: usize, k: usize, group_sizes: &[usize], total_sample_size: usize) -> f64 {
    let p_f64 = p as f64;
    let k_f64 = k as f64;

    // Calculate sum for group sizes
    let mut sum1 = 0.0;
    for &size in group_sizes {
        if size > 1 {
            sum1 += 1.0 / ((size - 1) as f64);
        }
    }

    let n_minus_g = (total_sample_size - k) as f64;
    if n_minus_g > EPSILON {
        sum1 -= 1.0 / n_minus_g;
    }

    let numerator = (2.0 * p_f64.powi(2) + 3.0 * p_f64 - 1.0) * sum1;
    let denominator = 6.0 * (p_f64 + 1.0) * (k_f64 - 1.0);

    if denominator > EPSILON {
        1.0 - numerator / denominator
    } else {
        1.0
    }
}

/// Computes the c2 (tau) correction factor for Box's M test.
///
/// τ = (p-1)(p+2)/(6(g-1)) * [Σ1/(nᵢ-1)² - 1/(n-g)²]
///
/// # Parameters
/// * `p` - Number of variables
/// * `k` - Number of groups
/// * `group_sizes` - Sizes of each group
/// * `total_sample_size` - Total sample size
///
/// # Returns
/// The c2 (tau) correction factor
fn compute_c2_factor(p: usize, k: usize, group_sizes: &[usize], total_sample_size: usize) -> f64 {
    let p_f64 = p as f64;
    let k_f64 = k as f64;

    // Calculate sum for squared inverses of group degrees of freedom
    let mut sum2 = 0.0;
    for &size in group_sizes {
        if size > 1 {
            sum2 += 1.0 / ((size - 1) as f64).powi(2);
        }
    }

    let n_minus_g = (total_sample_size - k) as f64;
    if n_minus_g > EPSILON {
        sum2 -= 1.0 / n_minus_g.powi(2);
    }

    ((p_f64 - 1.0) * (p_f64 + 2.0) * sum2) / (6.0 * (k_f64 - 1.0))
}

/// Computes the b-factor for F approximation.
///
/// b = f₁/(1-ρ-f₁/f₂)  if e₂ > e₁²
/// b = f₂/(1-ρ-2/f₂)  if e₂ < e₁²
///
/// # Parameters
/// * `c1` - The c1 (rho) correction factor
/// * `c2` - The c2 (tau) correction factor
/// * `v1` - The first degrees of freedom
/// * `v2` - The second degrees of freedom
///
/// # Returns
/// The b-factor
fn compute_b_factor(c1: f64, c2: f64, v1: f64, v2: f64) -> f64 {
    if c2 > c1 * c1 { v1 / (1.0 - c1 - v1 / v2) } else { v2 / (1.0 - c1 - 2.0 / v2) }
}

/// Computes the second degrees of freedom (df2) for F approximation.
///
/// f₂ = (f₁+2)/(|ρ-τ/ρ|)
///
/// # Parameters
/// * `c1` - The c1 (rho) correction factor
/// * `c2` - The c2 (tau) correction factor
/// * `df1` - The first degrees of freedom
///
/// # Returns
/// The second degrees of freedom (df2)
fn compute_df2(c1: f64, c2: f64, df1: f64) -> f64 {
    let denominator = if c1 > EPSILON { (c1 - c2 / c1).abs() } else { c2.abs() };

    if denominator > EPSILON {
        (df1 + 2.0) / denominator
    } else {
        df1 * 2.0 // Fallback if denominator is too small
    }
}

/// Computes the p-value from the F distribution.
///
/// P-value = 1 - F_CDF(f_approx, df1, df2)
///
/// # Parameters
/// * `f_approx` - The F approximation value
/// * `df1` - The first degrees of freedom
/// * `df2` - The second degrees of freedom
///
/// # Returns
/// The p-value
fn compute_p_value(f_approx: f64, df1: f64, df2: f64) -> f64 {
    if f_approx <= 0.0 || df1 <= 0.0 || df2 <= 0.0 {
        return 1.0;
    }

    match statrs::distribution::FisherSnedecor::new(df1, df2) {
        Ok(dist) => dist.sf(f_approx).max(0.0).min(1.0),
        Err(_) => 1.0,
    }
}
