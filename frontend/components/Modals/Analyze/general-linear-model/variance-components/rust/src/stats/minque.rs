// minque.rs
use std::collections::HashMap;
use nalgebra::{ DMatrix, DVector };

use crate::models::{ config::VarianceCompsConfig, data::AnalysisData };

use super::core::{
    from_vec,
    solve_linear_system,
    ssq,
    trace,
    vec_to_vector,
    create_design_and_response,
    create_effect_matrices,
};

/// Estimasi komponen varians menggunakan metode MINQUE
pub fn minque_estimation(
    data: &AnalysisData,
    config: &VarianceCompsConfig
) -> Result<HashMap<String, f64>, String> {
    // Validasi input
    let random_factors = match &config.main.rand_factor {
        Some(factors) => factors,
        None => {
            return Err("No random factors specified".to_string());
        }
    };

    // Dapatkan data dan matriks desain
    let (design_matrix, y) = create_design_and_response(data, config)?;
    let y_vec = vec_to_vector(&y);
    let x0 = from_vec(&design_matrix)?;

    let mut variance_components = HashMap::new();

    if config.options.uniform {
        // MINQUE(1) - unit weights untuk efek acak dan residual
        let (x_matrices, v_matrices) = create_effect_matrices(data, config)?;
        let (s_matrix, q_vector) = calculate_minque1_sq(
            data,
            config,
            &x_matrices,
            &v_matrices,
            &y_vec
        )?;

        let s_mat = from_vec(&s_matrix)?;
        let q_vec = vec_to_vector(&q_vector);

        let variance_estimates = solve_linear_system(&s_mat, &q_vec)?;

        // Simpan hasil estimasi ke HashMap
        for (i, factor) in random_factors.iter().enumerate() {
            variance_components.insert(format!("Var({})", factor), variance_estimates[i]);
        }

        // Varians error adalah komponen terakhir
        variance_components.insert(
            "Var(Error)".to_string(),
            variance_estimates[variance_estimates.len() - 1]
        );
    } else {
        // MINQUE(0) - zero weights untuk efek acak, unit weight untuk residual
        let (s_matrix, q_vector) = calculate_minque0_sq(data, config, &design_matrix, &y_vec)?;

        let s_mat = from_vec(&s_matrix)?;
        let q_vec = vec_to_vector(&q_vector);

        let variance_estimates = solve_linear_system(&s_mat, &q_vec)?;

        // Simpan hasil estimasi ke HashMap
        for (i, factor) in random_factors.iter().enumerate() {
            variance_components.insert(format!("Var({})", factor), if variance_estimates[i] > 0.0 {
                variance_estimates[i]
            } else {
                0.0
            });
        }

        // Varians error adalah komponen terakhir
        variance_components.insert("Var(Error)".to_string(), if
            variance_estimates[variance_estimates.len() - 1] > 0.0
        {
            variance_estimates[variance_estimates.len() - 1]
        } else {
            1.0e-8 // Nilai kecil positif sebagai fallback
        });
    }

    Ok(variance_components)
}

/// Hitung matriks S dan vektor q untuk MINQUE(0)
pub fn calculate_minque0_sq(
    data: &AnalysisData,
    config: &VarianceCompsConfig,
    design_matrix: &[Vec<f64>],
    y: &DVector<f64>
) -> Result<(Vec<Vec<f64>>, Vec<f64>), String> {
    let random_factors = match &config.main.rand_factor {
        Some(factors) => factors,
        None => {
            return Err("No random factors specified".to_string());
        }
    };

    let k = random_factors.len();
    let n = y.len();

    // Langkah 1: Bentuk matriks simetris
    let x0 = from_vec(design_matrix)?;

    // Dapatkan matriks Xi untuk efek acak
    let (x_matrices, _) = create_effect_matrices(data, config)?;
    let mut xi_matrices = Vec::with_capacity(k);

    // Konversi setiap Xi ke format nalgebra
    for i in 0..k {
        if i + 1 < x_matrices.len() {
            // +1 karena x_matrices[0] adalah X0
            xi_matrices.push(&x_matrices[i + 1]);
        } else {
            return Err(format!("Missing design matrix for random effect {}", i));
        }
    }

    // Hitung R = I - X0(X0'X0)^-1X0'
    let xt_x = x0.transpose() * &x0;
    let r = if let Some(xt_x_inv) = xt_x.clone().try_inverse() {
        let p = x0.clone() * xt_x_inv * x0.transpose();
        DMatrix::identity(n, n) - p
    } else {
        return Err("X'X is not invertible".to_string());
    };

    // Langkah 2: Bentuk S dan q
    let mut s = vec![vec![0.0; k + 1]; k + 1];
    let mut q = vec![0.0; k + 1];

    // Hitung elemen S
    for i in 0..k {
        for j in 0..k {
            // s_ij = SSQ(Xi'RXj)
            let xi_r_xj = xi_matrices[i].transpose() * &r * xi_matrices[j];
            s[i][j] = ssq(&xi_r_xj);
        }

        // s_i,k+1 = trace(Xi'RXi)
        let xi_r_xi = xi_matrices[i].transpose() * &r * xi_matrices[i];
        s[i][k] = trace(&xi_r_xi);
        s[k][i] = s[i][k]; // Symmetric
    }

    // s_k+1,k+1 = n - rank(X0)
    s[k][k] = (n - xt_x.rank(1e-10)) as f64;

    // Hitung elemen q
    for i in 0..k {
        // q_i = SSQ(Xi'Ry)
        let xi_r_y = xi_matrices[i].transpose() * &r * y;
        q[i] = ssq(&DMatrix::from_columns(&[xi_r_y]));
    }

    // q_k+1 = y'Ry
    q[k] = (y.transpose() * &r * y)[0];

    Ok((s, q))
}

/// Hitung matriks S dan vektor q untuk MINQUE(1)
pub fn calculate_minque1_sq(
    data: &AnalysisData,
    config: &VarianceCompsConfig,
    x_matrices: &[DMatrix<f64>],
    v_matrices: &[DMatrix<f64>],
    y: &DVector<f64>
) -> Result<(Vec<Vec<f64>>, Vec<f64>), String> {
    let random_factors = match &config.main.rand_factor {
        Some(factors) => factors,
        None => {
            return Err("No random factors specified".to_string());
        }
    };

    let k = random_factors.len();
    let n = y.len();

    if x_matrices.len() < k + 1 {
        return Err("Insufficient design matrices provided".to_string());
    }

    // Langkah 1: Bangun matriks V = ∑γi²Vi + I
    let mut v = DMatrix::identity(n, n);
    for i in 0..k {
        v += &v_matrices[i]; // Asumsi γi² = 1 untuk MINQUE(1)
    }

    // Langkah 2: Hitung R = V⁻¹ - V⁻¹X₀(X₀'V⁻¹X₀)⁻¹X₀'V⁻¹
    let x0 = &x_matrices[0];
    let v_inv = match v.try_inverse() {
        Some(inv) => inv,
        None => {
            return Err("V matrix is not invertible".to_string());
        }
    };

    let x0_v_inv = x0.transpose() * &v_inv;
    let x0_v_inv_x0 = x0_v_inv.clone() * x0;
    let x0_v_inv_x0_inv = match x0_v_inv_x0.try_inverse() {
        Some(inv) => inv,
        None => {
            return Err("X₀'V⁻¹X₀ is not invertible".to_string());
        }
    };

    let r: DMatrix<f64> = &v_inv - &v_inv * x0 * x0_v_inv_x0_inv * x0_v_inv;

    // Langkah 3: Bentuk S dan q
    let mut s = vec![vec![0.0; k + 1]; k + 1];
    let mut q = vec![0.0; k + 1];

    for i in 0..k {
        let xi = &x_matrices[i + 1];

        for j in 0..k {
            let xj = &x_matrices[j + 1];

            // Karena RVR = R, SSQ(Xi'RXj) = trace(Xj'RXi) - ∑ᵏₗ₌₁ SSQ(Xj'RXl)
            let xj_r_xi = xj.transpose() * &r * xi;
            s[i][j] = trace(&xj_r_xi);

            // SSQ(Xj'RXl) terms akan ditambahkan kemudian
        }

        // Hitung Xi'Ry
        let xi_r_y = xi.transpose() * &r * y;
        q[i] = (y.transpose() * &r * xi * xi_r_y)[0];
    }

    // Lengkapi S dengan menghitung SSQ terms
    for j in 0..k {
        for i in 0..k {
            for l in 0..k {
                let xj = &x_matrices[j + 1];
                let xl = &x_matrices[l + 1];
                let xj_r_xl = xj.transpose() * &r * xl;
                s[i][j] -= ssq(&xj_r_xl);
            }
        }
    }

    // Hitung elemen s[i,k] dan s[k,i]
    for i in 0..k {
        s[i][k] = trace(&(&x_matrices[i + 1].transpose() * &r));
        s[k][i] = s[i][k];
    }

    // Hitung s[k,k]
    s[k][k] = (n - x0.ncols()) as f64;
    for j in 0..k {
        s[k][k] -= trace(&(&x_matrices[j + 1].transpose() * &r * &x_matrices[j + 1]));
        for l in 0..k {
            let xj = &x_matrices[j + 1];
            let xl = &x_matrices[l + 1];
            let xj_r_xl = xj.transpose() * &r * xl;
            s[k][k] -= ssq(&xj_r_xl);
        }
    }

    // Hitung q[k]
    q[k] = (y.transpose() * &r * y)[0];
    for j in 0..k {
        let xj = &x_matrices[j + 1];
        let xj_r_y = xj.transpose() * &r * y;
        q[k] -= ssq(&DMatrix::from_columns(&[xj_r_y]));
    }

    Ok((s, q))
}
