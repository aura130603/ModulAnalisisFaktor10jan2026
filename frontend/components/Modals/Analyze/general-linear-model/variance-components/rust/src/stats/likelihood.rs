use std::collections::HashMap;
use std::f64;
use nalgebra::{ DMatrix, DVector, SymmetricEigen };

use crate::models::{
    config::VarianceCompsConfig,
    data::AnalysisData,
    result::{ ComponentCovariation, ConvergenceInfo, IterationHistoryEntry },
};

use super::core::{
    create_design_and_response,
    create_effect_matrices,
    from_vec,
    is_nonnegative_definite,
    matrix_to_hashmap,
    solve_linear_system,
    trace,
    vec_to_vector,
    convert_to_correlation_matrix,
};

/// Inisialisasi rasio varians untuk metode ML/REML
pub fn initialize_variance_ratios(
    data: &AnalysisData,
    config: &VarianceCompsConfig
) -> Result<Vec<f64>, String> {
    let random_factors = match &config.main.rand_factor {
        Some(factors) => factors,
        None => {
            return Err("No random factors specified".to_string());
        }
    };

    let (design_matrix, y) = create_design_and_response(data, config)?;
    let (x_matrices, _) = create_effect_matrices(data, config)?;

    let mut variance_ratios = Vec::with_capacity(random_factors.len());

    // Untuk setiap efek acak, hitung beta_i = (Xi'Xi)^-1 Xi'y
    for i in 0..random_factors.len() {
        if i + 1 < x_matrices.len() {
            // +1 karena x_matrices[0] adalah X0
            let xi = &x_matrices[i + 1];
            let y_vec = vec_to_vector(&y);

            let xi_t_xi = xi.transpose() * xi;
            let xi_t_y = xi.transpose() * &y_vec;

            let beta_i = match xi_t_xi.try_inverse() {
                Some(inv) => inv * xi_t_y,
                None => {
                    // Fallback jika matriks singular
                    variance_ratios.push(0.5); // Default value
                    continue;
                }
            };

            // Hitung varians dari elemen-elemen beta_i
            let m_i = beta_i.len();
            if m_i >= 2 {
                let mean = beta_i.iter().sum::<f64>() / (m_i as f64);
                let variance =
                    beta_i
                        .iter()
                        .map(|&b| (b - mean).powi(2))
                        .sum::<f64>() / ((m_i - 1) as f64);

                variance_ratios.push(if variance > 0.0 { variance } else { 0.5 });
            } else {
                variance_ratios.push(0.5); // Default jika tidak cukup elemen
            }
        } else {
            variance_ratios.push(0.5); // Default jika tidak ada matriks desain
        }
    }

    Ok(variance_ratios)
}

/// Inisialisasi residual varians untuk metode ML/REML
pub fn initialize_residual_variance(
    data: &AnalysisData,
    config: &VarianceCompsConfig
) -> Result<f64, String> {
    let (design_matrix, y) = create_design_and_response(data, config)?;
    let x = from_vec(&design_matrix)?;
    let y_vec = vec_to_vector(&y);

    // Hitung r = y - X(X'X)^-1X'y
    let xt_x = x.transpose() * &x;
    let xt_y = x.transpose() * &y_vec;

    let beta = match xt_x.try_inverse() {
        Some(inv) => inv * xt_y,
        None => {
            return Err("X'X is not invertible".to_string());
        }
    };

    let fitted = x * beta;
    let residual = &y_vec - fitted;
    let residual_variance = (residual.transpose() * residual)[0] / (y.len() as f64);

    if residual_variance > 0.0 {
        Ok(residual_variance)
    } else {
        // Jika negatif atau nol, gunakan nilai fallback
        Ok(1.0e-8)
    }
}

// ML-specific functions
/// Calculate log-likelihood for ML method
pub fn calculate_ml_log_likelihood(
    design_matrix: &DMatrix<f64>,
    y: &DVector<f64>,
    variance_ratios: &[f64],
    residual_variance: f64,
    x_matrices: &[DMatrix<f64>],
    v_matrices: &[DMatrix<f64>]
) -> Result<f64, String> {
    let n = y.len();

    // Bentuk matriks V = ∑γᵢ²Vᵢ + I
    let mut v = DMatrix::identity(n, n);
    for (i, &gamma_i_squared) in variance_ratios.iter().enumerate() {
        if i < v_matrices.len() {
            v += gamma_i_squared * &v_matrices[i];
        }
    }

    // Hitung 1/2*log|V|
    let v_det = match v.determinant() {
        d if d > 0.0 => d,
        _ => {
            return Err("V matrix is singular".to_string());
        }
    };
    let log_det_v = v_det.ln();

    // Hitung β₀ = (X₀'V⁻¹X₀)⁻¹X₀'V⁻¹y
    let x0 = &x_matrices[0];
    let v_inv = match v.try_inverse() {
        Some(inv) => inv,
        None => {
            return Err("V matrix is not invertible".to_string());
        }
    };

    let x0_v_inv = x0.transpose() * &v_inv;
    let x0_v_inv_x0 = x0_v_inv.clone() * x0;
    let x0_v_inv_y = x0_v_inv * y;

    let beta0 = match x0_v_inv_x0.try_inverse() {
        Some(inv) => inv * x0_v_inv_y,
        None => {
            return Err("X₀'V⁻¹X₀ is not invertible".to_string());
        }
    };

    // Hitung r = y - X₀β₀
    let r = y.clone() - x0 * beta0;

    // Hitung (y-X₀β₀)'V⁻¹(y-X₀β₀)
    let quad_form = r.transpose() * &v_inv * &r;

    // Log-likelihood
    let log_likelihood =
        (-(n as f64) / 2.0) * (2.0 * std::f64::consts::PI).ln() -
        ((n as f64) / 2.0) * residual_variance.ln() -
        0.5 * log_det_v -
        (0.5 / residual_variance) * quad_form[0];

    Ok(log_likelihood)
}

/// Calculate gradient and Hessian for ML method
pub fn calculate_ml_gradient_hessian(
    design_matrix: &DMatrix<f64>,
    y: &DVector<f64>,
    variance_ratios: &[f64],
    residual_variance: f64,
    x_matrices: &[DMatrix<f64>],
    v_matrices: &[DMatrix<f64>]
) -> Result<(DVector<f64>, DMatrix<f64>, DMatrix<f64>), String> {
    let n = y.len();
    let k = variance_ratios.len();

    // Bentuk matriks V = ∑γᵢ²Vᵢ + I
    let mut v = DMatrix::identity(n, n);
    for (i, &gamma_i_squared) in variance_ratios.iter().enumerate() {
        if i < v_matrices.len() {
            v += gamma_i_squared * &v_matrices[i];
        }
    }

    // Hitung V⁻¹
    let v_inv = match v.try_inverse() {
        Some(inv) => inv,
        None => {
            return Err("V matrix is not invertible".to_string());
        }
    };

    // Hitung β₀ = (X₀'V⁻¹X₀)⁻¹X₀'V⁻¹y
    let x0 = &x_matrices[0];
    let x0_v_inv = x0.transpose() * &v_inv;
    let x0_v_inv_x0 = x0_v_inv.clone() * x0;
    let x0_v_inv_y = x0_v_inv.clone() * y;

    let beta0 = match x0_v_inv_x0.clone().try_inverse() {
        Some(inv) => inv * x0_v_inv_y,
        None => {
            return Err("X₀'V⁻¹X₀ is not invertible".to_string());
        }
    };

    // Hitung r = y - X₀β₀
    let r = y.clone() - x0 * beta0;

    // Untuk menyederhanakan, buat P = V⁻¹ - V⁻¹X₀(X₀'V⁻¹X₀)⁻¹X₀'V⁻¹
    let x0_v_inv_x0_inv = match x0_v_inv_x0.try_inverse() {
        Some(inv) => inv,
        None => {
            return Err("X₀'V⁻¹X₀ is not invertible".to_string());
        }
    };

    let p = &v_inv - &v_inv * x0 * x0_v_inv_x0_inv * x0_v_inv;

    // Gradient vector untuk γᵢ² dan σₑ²
    let mut gradient = DVector::zeros(k + 1);

    // Untuk setiap γᵢ²
    for i in 0..k {
        // ∂l/∂γᵢ² = 1/(2σₑ²)r'V⁻¹VᵢV⁻¹r - 1/2tr(V⁻¹Vᵢ)
        let v_inv_vi_v_inv = &v_inv * &v_matrices[i] * &v_inv;
        let quad = r.transpose() * &v_inv_vi_v_inv * &r;
        let tr = trace(&(&v_inv * &v_matrices[i]));

        gradient[i] = (0.5 / residual_variance) * quad[0] - 0.5 * tr;
    }

    // Untuk σₑ²
    // ∂l/∂σₑ² = 1/(2σₑ⁴)r'V⁻¹r - n/(2σₑ²)
    let quad = r.transpose() * &v_inv * &r;
    gradient[k] =
        (0.5 / (residual_variance * residual_variance)) * quad[0] -
        (n as f64) / (2.0 * residual_variance);

    // Hessian matrix
    let mut hessian = DMatrix::zeros(k + 1, k + 1);

    // For γᵢ² and γⱼ²
    for i in 0..k {
        for j in 0..k {
            // ∂²l/∂γᵢ²∂γⱼ² = 1/2tr(V⁻¹VᵢV⁻¹Vⱼ) - 1/σₑ²r'V⁻¹VᵢV⁻¹VⱼV⁻¹r
            let v_inv_vi = &v_inv * &v_matrices[i];
            let v_inv_vj = &v_inv * &v_matrices[j];
            let tr = trace(&(v_inv_vi * v_inv_vj));

            let quad =
                r.transpose() * &v_inv * &v_matrices[i] * &v_inv * &v_matrices[j] * &v_inv * &r;

            hessian[(i, j)] = 0.5 * tr - (1.0 / residual_variance) * quad[0];
        }
    }

    // For γᵢ² and σₑ²
    for i in 0..k {
        // ∂²l/∂γᵢ²∂σₑ² = -1/(2σₑ⁴)r'V⁻¹VᵢV⁻¹r
        let quad = r.transpose() * &v_inv * &v_matrices[i] * &v_inv * &r;
        let val = (-0.5 / (residual_variance * residual_variance)) * quad[0];

        hessian[(i, k)] = val;
        hessian[(k, i)] = val; // Symmetric
    }

    // For σₑ² and σₑ²
    // ∂²l/∂(σₑ²)² = n/(2σₑ⁴) - 1/σₑ⁶r'V⁻¹r
    let quad = r.transpose() * &v_inv * &r;
    hessian[(k, k)] =
        (n as f64) / (2.0 * residual_variance * residual_variance) -
        (1.0 / (residual_variance * residual_variance * residual_variance)) * quad[0];

    // Fisher Information Matrix
    let mut fisher_info = DMatrix::zeros(k + 1, k + 1);

    // For γᵢ² and γⱼ²
    for i in 0..k {
        for j in 0..k {
            // E[∂²l/∂γᵢ²∂γⱼ²] = -1/2tr(V⁻¹VᵢV⁻¹Vⱼ)
            let tr = trace(&(&v_inv * &v_matrices[i] * &v_inv * &v_matrices[j]));
            fisher_info[(i, j)] = -0.5 * tr;
        }
    }

    // For γᵢ² and σₑ²
    for i in 0..k {
        // E[∂²l/∂γᵢ²∂σₑ²] = -1/(2σₑ⁴)tr(V⁻¹Vᵢ)
        let tr = trace(&(&v_inv * &v_matrices[i]));
        let val = (-0.5 / (residual_variance * residual_variance)) * tr;

        fisher_info[(i, k)] = val;
        fisher_info[(k, i)] = val; // Symmetric
    }

    // For σₑ² and σₑ²
    // E[∂²l/∂(σₑ²)²] = -n/(2σₑ⁴)
    fisher_info[(k, k)] = -(n as f64) / (2.0 * residual_variance * residual_variance);

    // Negate matrices for optimization
    let gradient = -gradient;
    let hessian = -hessian;
    let fisher_info = -fisher_info;

    Ok((gradient, hessian, fisher_info))
}

/// Calculate covariance matrix for ML method
pub fn calculate_ml_covariance_matrix(
    design_matrix: &DMatrix<f64>,
    y: &DVector<f64>,
    variance_ratios: &[f64],
    residual_variance: f64,
    x_matrices: &[DMatrix<f64>],
    v_matrices: &[DMatrix<f64>],
    random_factors: &[String]
) -> Result<HashMap<String, HashMap<String, f64>>, String> {
    let k = variance_ratios.len();

    // Get fisher information matrix
    let (_, _, fisher_info) = calculate_ml_gradient_hessian(
        design_matrix,
        y,
        variance_ratios,
        residual_variance,
        x_matrices,
        v_matrices
    )?;

    // Invers Fisher Information Matrix gives asymptotic covariance
    let cov_matrix = match fisher_info.clone().try_inverse() {
        Some(inv) => inv,
        None => {
            return Err("Fisher Information Matrix is not invertible".to_string());
        }
    };

    // Transform matrix to θ = [σ₁², σ₂², ..., σₑ²]
    // σᵢ² = γᵢ² * σₑ²
    // Jacobian matrix J = [σₑ²I₍ₖ₎ γ; 0 1]
    let mut j = DMatrix::zeros(k + 1, k + 1);

    // Fill diagonal with σₑ²
    for i in 0..k {
        j[(i, i)] = residual_variance;
        j[(i, k)] = variance_ratios[i]; // γᵢ column
    }
    j[(k, k)] = 1.0; // Last element

    // cov(θ) = J cov(γ,σₑ²) J'
    let transformed_cov = &j * &cov_matrix * j.transpose();

    // Create component names
    let mut component_names = Vec::with_capacity(k + 1);
    for factor in random_factors {
        component_names.push(format!("Var({})", factor));
    }
    component_names.push("Var(Error)".to_string());

    // Convert to HashMap
    Ok(matrix_to_hashmap(&transformed_cov, &component_names))
}

// REML-specific functions
/// Calculate log-likelihood for REML method
pub fn calculate_reml_log_likelihood(
    design_matrix: &DMatrix<f64>,
    y: &DVector<f64>,
    variance_ratios: &[f64],
    residual_variance: f64,
    x_matrices: &[DMatrix<f64>],
    v_matrices: &[DMatrix<f64>]
) -> Result<f64, String> {
    let n = y.len();
    let x0 = &x_matrices[0];
    // Fix: Add tolerance parameter to rank
    let tolerance = 1.0e-10; // Typical tolerance for numerical stability
    let r = x0.rank(tolerance) as f64; // Convert to f64 immediately

    // Bentuk matriks V = ∑γᵢ²Vᵢ + I
    let mut v = DMatrix::identity(n, n);
    for (i, &gamma_i_squared) in variance_ratios.iter().enumerate() {
        if i < v_matrices.len() {
            v += gamma_i_squared * &v_matrices[i];
        }
    }

    // Hitung 1/2*log|V|
    let v_det = match v.determinant() {
        d if d > 0.0 => d,
        _ => {
            return Err("V matrix is singular".to_string());
        }
    };
    let log_det_v = v_det.ln();

    // Hitung V⁻¹
    let v_inv = match v.try_inverse() {
        Some(inv) => inv,
        None => {
            return Err("V matrix is not invertible".to_string());
        }
    };

    // Hitung X₀'V⁻¹X₀
    let x0_v_inv_x0 = x0.transpose() * &v_inv * x0;
    let x0_v_inv_x0_det = match x0_v_inv_x0.determinant() {
        d if d > 0.0 => d,
        _ => {
            return Err("X₀'V⁻¹X₀ matrix is singular".to_string());
        }
    };
    let log_det_x0_v_inv_x0 = x0_v_inv_x0_det.ln();

    // Hitung R = V⁻¹ - V⁻¹X₀(X₀'V⁻¹X₀)⁻¹X₀'V⁻¹
    let x0_v_inv_x0_inv = match x0_v_inv_x0.try_inverse() {
        Some(inv) => inv,
        None => {
            return Err("X₀'V⁻¹X₀ is not invertible".to_string());
        }
    };

    let r_matrix = &v_inv - &v_inv * x0 * x0_v_inv_x0_inv * x0.transpose() * &v_inv;

    // Hitung y'Ry
    let quad_form = y.transpose() * &r_matrix * y;

    // Log-likelihood
    let log_likelihood =
        (-((n as f64) - r) / 2.0) * (2.0 * std::f64::consts::PI).ln() -
        (((n as f64) - r) / 2.0) * residual_variance.ln() -
        0.5 * log_det_v -
        0.5 * log_det_x0_v_inv_x0 -
        (0.5 / residual_variance) * quad_form[0];

    Ok(log_likelihood)
}

/// Calculate gradient and Hessian for REML method
pub fn calculate_reml_gradient_hessian(
    design_matrix: &DMatrix<f64>,
    y: &DVector<f64>,
    variance_ratios: &[f64],
    residual_variance: f64,
    x_matrices: &[DMatrix<f64>],
    v_matrices: &[DMatrix<f64>]
) -> Result<(DVector<f64>, DMatrix<f64>, DMatrix<f64>), String> {
    let n = y.len();
    let k = variance_ratios.len();
    let x0 = &x_matrices[0];

    // Fix: Add tolerance parameter to rank
    let tolerance = 1.0e-10; // Typical tolerance for numerical stability
    let r = x0.rank(tolerance) as f64; // Convert to f64 immediately

    // Bentuk matriks V = ∑γᵢ²Vᵢ + I
    let mut v = DMatrix::identity(n, n);
    for (i, &gamma_i_squared) in variance_ratios.iter().enumerate() {
        if i < v_matrices.len() {
            v += gamma_i_squared * &v_matrices[i];
        }
    }

    // Hitung V⁻¹
    let v_inv = match v.try_inverse() {
        Some(inv) => inv,
        None => {
            return Err("V matrix is not invertible".to_string());
        }
    };

    // Hitung R = V⁻¹ - V⁻¹X₀(X₀'V⁻¹X₀)⁻¹X₀'V⁻¹
    let x0_v_inv = x0.transpose() * &v_inv;
    let x0_v_inv_x0 = x0_v_inv.clone() * x0;
    let x0_v_inv_x0_inv = match x0_v_inv_x0.try_inverse() {
        Some(inv) => inv,
        None => {
            return Err("X₀'V⁻¹X₀ is not invertible".to_string());
        }
    };

    let r_matrix = &v_inv - &v_inv * x0 * x0_v_inv_x0_inv.clone() * x0_v_inv;

    // Gradient vector untuk γᵢ² dan σₑ²
    let mut gradient = DVector::zeros(k + 1);

    // Untuk setiap γᵢ²
    for i in 0..k {
        // ∂l/∂γᵢ² = 1/(2σₑ²)y'RVᵢRy - 1/2tr(X₀'V⁻¹X₀)⁻¹(X₀'V⁻¹VᵢV⁻¹X₀)) - 1/2tr(RVᵢ)
        let r_vi = &r_matrix * &v_matrices[i];
        let quad = y.transpose() * &r_vi * &r_matrix * y;

        let x0_v_inv_vi_v_inv_x0 = x0.transpose() * &v_inv * &v_matrices[i] * &v_inv * x0;
        let tr1 = trace(&(x0_v_inv_x0_inv.clone() * x0_v_inv_vi_v_inv_x0));

        let tr2 = trace(&r_vi);

        gradient[i] = (0.5 / residual_variance) * quad[0] - 0.5 * tr1 - 0.5 * tr2;
    }

    // Untuk σₑ²
    // ∂l/∂σₑ² = 1/(2σₑ⁴)y'Ry - (n-r)/(2σₑ²)
    let quad = y.transpose() * &r_matrix * y;
    gradient[k] =
        (0.5 / (residual_variance * residual_variance)) * quad[0] -
        ((n as f64) - r) / (2.0 * residual_variance);

    // Hessian matrix
    let mut hessian = DMatrix::zeros(k + 1, k + 1);

    // For γᵢ² and γⱼ²
    for i in 0..k {
        for j in 0..k {
            // ∂²l/∂γᵢ²∂γⱼ² = simplified to: - 1/σₑ²y'RVᵢRVⱼRy + 1/2tr(RVᵢRVⱼ)
            let r_vi = &r_matrix * &v_matrices[i];
            let r_vj = &r_matrix * &v_matrices[j];

            let quad = y.transpose() * &r_vi * &r_vj * &r_matrix * y;
            let tr = trace(&(&r_vi * &r_vj));

            hessian[(i, j)] = (-1.0 / residual_variance) * quad[0] + 0.5 * tr;
        }
    }

    // For γᵢ² and σₑ²
    for i in 0..k {
        // ∂²l/∂γᵢ²∂σₑ² = -1/(2σₑ⁴)y'RVᵢRy
        let r_vi_r = &r_matrix * &v_matrices[i] * &r_matrix;
        let quad = y.transpose() * &r_vi_r * y;
        let val = (-0.5 / (residual_variance * residual_variance)) * quad[0];

        hessian[(i, k)] = val;
        hessian[(k, i)] = val; // Symmetric
    }

    // For σₑ² and σₑ²
    // ∂²l/∂(σₑ²)² = (n-r)/(2σₑ⁴) - 1/σₑ⁶y'Ry
    let quad = y.transpose() * &r_matrix * y;
    hessian[(k, k)] =
        ((n as f64) - r) / (2.0 * residual_variance * residual_variance) -
        (1.0 / (residual_variance * residual_variance * residual_variance)) * quad[0];

    // Fisher Information Matrix
    let mut fisher_info = DMatrix::zeros(k + 1, k + 1);

    // For γᵢ² and γⱼ²
    for i in 0..k {
        for j in 0..k {
            // E[∂²l/∂γᵢ²∂γⱼ²] = -1/2tr(RVᵢRVⱼ)
            let r_vi_r_vj = &r_matrix * &v_matrices[i] * &r_matrix * &v_matrices[j];
            let tr = trace(&r_vi_r_vj);
            fisher_info[(i, j)] = -0.5 * tr;
        }
    }

    // For γᵢ² and σₑ²
    for i in 0..k {
        // E[∂²l/∂γᵢ²∂σₑ²] = -1/(2σₑ⁴)tr(RVᵢ)
        let tr = trace(&(&r_matrix * &v_matrices[i]));
        let val = (-0.5 / (residual_variance * residual_variance)) * tr;

        fisher_info[(i, k)] = val;
        fisher_info[(k, i)] = val; // Symmetric
    }

    // For σₑ² and σₑ²
    // E[∂²l/∂(σₑ²)²] = -(n-r)/(2σₑ⁴)
    fisher_info[(k, k)] = -((n as f64) - r) / (2.0 * residual_variance * residual_variance);

    // Negate matrices for optimization
    let gradient = -gradient;
    let hessian = -hessian;
    let fisher_info = -fisher_info;

    Ok((gradient, hessian, fisher_info))
}

/// Calculate covariance matrix for REML method
pub fn calculate_reml_covariance_matrix(
    design_matrix: &DMatrix<f64>,
    y: &DVector<f64>,
    variance_ratios: &[f64],
    residual_variance: f64,
    x_matrices: &[DMatrix<f64>],
    v_matrices: &[DMatrix<f64>],
    random_factors: &[String]
) -> Result<HashMap<String, HashMap<String, f64>>, String> {
    let k = variance_ratios.len();

    // Get fisher information matrix
    let (_, _, fisher_info) = calculate_reml_gradient_hessian(
        design_matrix,
        y,
        variance_ratios,
        residual_variance,
        x_matrices,
        v_matrices
    )?;

    // Invers Fisher Information Matrix is the asymptotic covariance
    let cov_matrix = match fisher_info.clone().try_inverse() {
        Some(inv) => inv,
        None => {
            return Err("Fisher Information Matrix is not invertible".to_string());
        }
    };

    // Transform to θ = [σ₁², σ₂², ..., σₑ²]
    // σᵢ² = γᵢ² * σₑ²
    // Jacobian matrix J = [σₑ²I₍ₖ₎ γ; 0 1]
    let mut j = DMatrix::zeros(k + 1, k + 1);

    // Fill diagonal with σₑ²
    for i in 0..k {
        j[(i, i)] = residual_variance;
        j[(i, k)] = variance_ratios[i]; // γᵢ column
    }
    j[(k, k)] = 1.0; // Last element

    // cov(θ) = J cov(γ,σₑ²) J'
    let transformed_cov = &j * &cov_matrix * j.transpose();

    // Create component names
    let mut component_names = Vec::with_capacity(k + 1);
    for factor in random_factors {
        component_names.push(format!("Var({})", factor));
    }
    component_names.push("Var(Error)".to_string());

    // Convert to HashMap
    Ok(matrix_to_hashmap(&transformed_cov, &component_names))
}

/// Generic likelihood estimation implementation
pub fn likelihood_estimation(
    data: &AnalysisData,
    config: &VarianceCompsConfig,
    method_type: &str
) -> Result<(HashMap<String, f64>, ConvergenceInfo, ComponentCovariation), String> {
    // Validasi input
    let dep_var = match &config.main.dep_var {
        Some(var) => var,
        None => {
            return Err("No dependent variable specified".to_string());
        }
    };

    let random_factors = match &config.main.rand_factor {
        Some(factors) => factors,
        None => {
            return Err("No random factors specified".to_string());
        }
    };

    // Get design matrices
    let (design_matrix, y) = create_design_and_response(data, config)?;
    let design_mat = from_vec(&design_matrix)?;
    let y_vec = vec_to_vector(&y);

    let (x_matrices, v_matrices) = create_effect_matrices(data, config)?;

    // Set initial values
    let mut variance_ratios = initialize_variance_ratios(data, config)?;
    let mut residual_variance = initialize_residual_variance(data, config)?;

    // Define parameters
    let max_iter = config.options.max_iter.unwrap_or(50);
    let converge_criterion = config.options.convergence_method
        .as_ref()
        .and_then(|s| s.parse::<f64>().ok())
        .unwrap_or(1.0e-8);

    // Initialize iteration history
    let mut iteration_history = Vec::new();
    let mut converged = false;
    let mut iterations = 0;

    // Choose log-likelihood functions based on method
    let calculate_log_likelihood = match method_type {
        "ML" => calculate_ml_log_likelihood,
        "REML" => calculate_reml_log_likelihood,
        _ => {
            return Err(format!("Unknown method type: {}", method_type));
        }
    };

    let calculate_gradient_hessian = match method_type {
        "ML" => calculate_ml_gradient_hessian,
        "REML" => calculate_reml_gradient_hessian,
        _ => {
            return Err(format!("Unknown method type: {}", method_type));
        }
    };

    // Initial log-likelihood
    let mut log_likelihood = calculate_log_likelihood(
        &design_mat,
        &y_vec,
        &variance_ratios,
        residual_variance,
        &x_matrices,
        &v_matrices
    )?;

    // Store initial values in iteration history
    let mut initial_components = HashMap::new();
    for (i, factor) in random_factors.iter().enumerate() {
        initial_components.insert(
            format!("Var({})", factor),
            variance_ratios[i] * residual_variance
        );
    }
    initial_components.insert("Var(Error)".to_string(), residual_variance);

    iteration_history.push(IterationHistoryEntry {
        iteration: 0,
        log_likelihood: Some(log_likelihood),
        variance_components: initial_components,
    });

    // Iteration process
    for iter in 1..=max_iter {
        iterations = iter as usize;

        // Calculate gradient and Hessian
        let (gradient, hessian, fisher_info) = calculate_gradient_hessian(
            &design_mat,
            &y_vec,
            &variance_ratios,
            residual_variance,
            &x_matrices,
            &v_matrices
        )?;

        // Determine step type (Newton-Raphson or Fisher Scoring)
        let step_type = if iter == 1 {
            "Fisher" // First iteration always Fisher
        } else if is_nonnegative_definite(&hessian) && log_likelihood <= 1.0 {
            "Newton"
        } else {
            "Fisher"
        };

        // Calculate step
        let delta = if step_type == "Newton" {
            solve_linear_system(&hessian, &gradient)?
        } else {
            solve_linear_system(&fisher_info, &gradient)?
        };

        // Apply step-halving if needed
        let mut step_size = 1.0;
        let mut updated_ratios = Vec::new();
        let mut updated_var = 0.0;

        for _ in 0..10 {
            // Maximum 10 halvings
            // Update parameters
            updated_ratios = variance_ratios
                .iter()
                .enumerate()
                .map(|(i, &r)| r + step_size * delta[i])
                .collect();

            updated_var = residual_variance + step_size * delta[delta.len() - 1];

            // Check for negative variance estimates
            let has_negative = updated_ratios.iter().any(|&r| r < 0.0) || updated_var <= 0.0;

            if !has_negative {
                // Calculate new log-likelihood
                let new_log_likelihood = calculate_log_likelihood(
                    &design_mat,
                    &y_vec,
                    &updated_ratios,
                    updated_var,
                    &x_matrices,
                    &v_matrices
                )?;

                if new_log_likelihood > log_likelihood {
                    // Accept step
                    log_likelihood = new_log_likelihood;
                    break;
                }
            }

            // Half the step size
            step_size /= 2.0;

            if step_size < 1.0e-10 {
                break; // Step size too small, stop halving
            }
        }

        // Set negative variance estimates to zero
        for r in &mut updated_ratios {
            if *r < 0.0 {
                *r = 0.0;
            }
        }

        if updated_var <= 0.0 {
            updated_var = 1.0e-8; // Small positive value
        }

        // Update parameters
        variance_ratios = updated_ratios;
        residual_variance = updated_var;

        // Store in iteration history
        let mut components = HashMap::new();
        for (i, factor) in random_factors.iter().enumerate() {
            components.insert(format!("Var({})", factor), variance_ratios[i] * residual_variance);
        }
        components.insert("Var(Error)".to_string(), residual_variance);

        iteration_history.push(IterationHistoryEntry {
            iteration: iter as usize,
            log_likelihood: Some(log_likelihood),
            variance_components: components,
        });

        // Check for convergence
        let param_change: f64 = variance_ratios
            .iter()
            .enumerate()
            .map(|(i, &r)| {
                let prev_r = if iter > 1 {
                    iteration_history[(iter - 1) as usize].variance_components
                        .get(&format!("Var({})", random_factors[i]))
                        .cloned()
                        .unwrap_or(0.0)
                } else {
                    0.0
                };
                let curr_r = r * residual_variance;
                (curr_r - prev_r).abs() / f64::max(1.0, prev_r.abs())
            })
            .sum::<f64>();

        let prev_error = if iter > 1 {
            iteration_history[(iter - 1) as usize].variance_components
                .get("Var(Error)")
                .cloned()
                .unwrap_or(0.0)
        } else {
            0.0
        };

        let error_change = (residual_variance - prev_error).abs() / f64::max(1.0, prev_error.abs());
        let total_param_change = param_change + error_change;

        let llik_change = if iter > 1 {
            let prev_llik = iteration_history[(iter - 1) as usize].log_likelihood.unwrap_or(0.0);
            (log_likelihood - prev_llik).abs() / f64::max(1.0, prev_llik.abs())
        } else {
            f64::MAX
        };

        if total_param_change < converge_criterion && llik_change < converge_criterion {
            converged = true;
            break;
        }
    }

    // Calculate final variance components
    let mut variance_components = HashMap::new();
    for (i, factor) in random_factors.iter().enumerate() {
        variance_components.insert(
            format!("Var({})", factor),
            variance_ratios[i] * residual_variance
        );
    }
    variance_components.insert("Var(Error)".to_string(), residual_variance);

    // Calculate asymptotic covariance matrix
    let calculate_covariance_matrix = match method_type {
        "ML" => calculate_ml_covariance_matrix,
        "REML" => calculate_reml_covariance_matrix,
        _ => {
            return Err(format!("Unknown method type: {}", method_type));
        }
    };

    let covariance_matrix = calculate_covariance_matrix(
        &design_mat,
        &y_vec,
        &variance_ratios,
        residual_variance,
        &x_matrices,
        &v_matrices,
        random_factors
    )?;

    // Convert to correlation matrix if needed
    let correlation_matrix = convert_to_correlation_matrix(&covariance_matrix);

    // Choose which matrix to return based on config
    let matrix_type = if config.save.cor_matrix { "correlation" } else { "covariance" };
    let matrix = if matrix_type == "correlation" { correlation_matrix } else { covariance_matrix };

    // Create convergence info
    let convergence_info = ConvergenceInfo {
        iterations: Some(iterations),
        convergence_criterion: Some(converge_criterion),
        convergence_achieved: Some(converged),
        iteration_history: if config.options.iteration_history {
            Some(iteration_history)
        } else {
            None
        },
    };

    // Create component covariation
    let component_covariation = ComponentCovariation {
        matrix_type: matrix_type.to_string(),
        matrix,
    };

    Ok((variance_components, convergence_info, component_covariation))
}
