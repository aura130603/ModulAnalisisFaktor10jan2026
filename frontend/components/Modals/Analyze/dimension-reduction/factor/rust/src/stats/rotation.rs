// perbaikan BISA 

use std::collections::HashMap;
use nalgebra::{DMatrix, SVD};
use crate::models::{
    config::FactorAnalysisConfig,
    data::AnalysisData,
    result::{
        ComponentTransformationMatrix,
        ExtractionResult,
        RotatedComponentMatrix,
        RotationResult,
    },
};

use super::core::{ calculate_matrix, extract_data_matrix, extract_factors };

// Rotate factors using specified method
pub fn rotate_factors(
    extraction_result: &ExtractionResult,
    config: &FactorAnalysisConfig
) -> Result<RotationResult, String> {
    if config.rotation.none {
        // No rotation, return original loadings
        return Ok(RotationResult {
            rotated_loadings: extraction_result.loadings.clone(),
            transformation_matrix: DMatrix::identity(
                extraction_result.n_factors,
                extraction_result.n_factors
            ),
            factor_correlations: None,
        });
    }

    if config.rotation.varimax {
        rotate_varimax(extraction_result, config)
    } else if config.rotation.quartimax {
        rotate_quartimax(extraction_result, config)
    } else if config.rotation.equimax {
        rotate_equimax(extraction_result, config)
    } else if config.rotation.oblimin {
        rotate_oblimin(extraction_result, config)
    } else if config.rotation.promax {
        rotate_promax(extraction_result, config)
    } else {
        // Default to varimax
        rotate_varimax(extraction_result, config)
    }
}


// Varimax rotation (SPSS-compatible)
pub fn rotate_varimax(
    extraction_result: &ExtractionResult,
    config: &FactorAnalysisConfig
) -> Result<RotationResult, String> {

    // COPY data loadings agar bisa kita modifikasi (Pre-processing)
    let mut processed_loadings = extraction_result.loadings.clone();
    let n_rows = processed_loadings.nrows(); 
    let n_cols = processed_loadings.ncols(); 

    // =========================================================
    // 0. PRE-PROCESS: Standardize Unrotated Signs (SPSS Fix)
    // =========================================================
    // SPSS memastikan jumlah loading per kolom pada UNROTATED matrix
    // selalu positif. Jika negatif, balik tandanya.
    // Ini memperbaiki tanda pada "Component Transformation Matrix".
    for j in 0..n_cols {
        let mut col_sum = 0.0;
        for i in 0..n_rows {
            col_sum += processed_loadings[(i, j)];
        }
        
        if col_sum < 0.0 {
            for i in 0..n_rows {
                processed_loadings[(i, j)] *= -1.0;
            }
        }
    }

    // Gunakan processed_loadings sebagai basis perhitungan selanjutnya
    let loadings = &processed_loadings;

    // =========================================================
    // 1. Kaiser normalization
    // =========================================================
    let mut h = vec![0.0; n_rows];
    let mut normalized_loadings = loadings.clone();

    for i in 0..n_rows {
        let mut ss = 0.0;
        for j in 0..n_cols {
            ss += loadings[(i, j)] * loadings[(i, j)];
        }
        h[i] = ss.sqrt().max(1e-12); // avoid divide by zero
        for j in 0..n_cols {
            normalized_loadings[(i, j)] /= h[i];
        }
    }

    // =========================================================
    // 2. Initialize rotation matrix
    // =========================================================
    let mut transformation_matrix = DMatrix::<f64>::identity(n_cols, n_cols);

    let max_iterations = config.rotation.max_iter as usize;
    let tol = 1e-6;
    let mut prev_singular_sum = 0.0;

    // =========================================================
    // 3. Iterative global varimax optimization (SVD)
    // =========================================================
    for _ in 0..max_iterations {

        // Λ = L * R
        let lambda = &normalized_loadings * &transformation_matrix;

        // Compute varimax gradient
        let mut tmp = DMatrix::<f64>::zeros(n_rows, n_cols);

        for j in 0..n_cols {
            let mut mean_sq = 0.0;
            for i in 0..n_rows {
                mean_sq += lambda[(i, j)].powi(2);
            }
            mean_sq /= n_rows as f64;

            for i in 0..n_rows {
                tmp[(i, j)] =
                    lambda[(i, j)].powi(3) - lambda[(i, j)] * mean_sq;
            }
        }

        // Core matrix
        let m = normalized_loadings.transpose() * tmp;

        // SVD step (KEY: same as SPSS)
        let svd = SVD::new(m, true, true);
        let u = svd.u.ok_or("SVD failed")?;
        let v_t = svd.v_t.ok_or("SVD failed")?;

        transformation_matrix = &u * &v_t;

        // Convergence check
        let singular_sum: f64 = svd.singular_values.iter().sum();
        if (singular_sum - prev_singular_sum).abs() < tol {
            break;
        }
        prev_singular_sum = singular_sum;
    }

    // =========================================================
    // 4. Apply rotation & de-normalize
    // =========================================================
    let mut rotated_loadings = &normalized_loadings * &transformation_matrix;

    // De-normalize (Kaiser)
    for i in 0..n_rows {
        for j in 0..n_cols {
            rotated_loadings[(i, j)] *= h[i];
        }
    }

    // =========================================================
    // 5. SPSS-style sign reflection (Fix Rotated Columns)
    // =========================================================
    for j in 0..n_cols {
        let mut sum = 0.0;
        for i in 0..n_rows {
            sum += rotated_loadings[(i, j)];
        }
        if sum < 0.0 {
            for i in 0..n_rows {
                rotated_loadings[(i, j)] *= -1.0;
            }
            for i in 0..n_cols {
                transformation_matrix[(i, j)] *= -1.0;
            }
        }
    }

    // =========================================================
    // 6. SORT COMPONENTS BY VARIANCE (SPSS STYLE)
    // =========================================================
    
    // 1. Hitung Variance (SSL) untuk setiap kolom
    let mut col_variances: Vec<(usize, f64)> = (0..n_cols)
        .map(|j| {
            let mut ssl = 0.0;
            for i in 0..n_rows {
                ssl += rotated_loadings[(i, j)].powi(2);
            }
            (j, ssl)
        })
        .collect();

    // 2. Urutkan Descending berdasarkan SSL
    col_variances.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());

    // 3. Buat Matrix baru yang sudah terurut
    let mut sorted_loadings = DMatrix::<f64>::zeros(n_rows, n_cols);
    let mut sorted_transform = DMatrix::<f64>::zeros(n_cols, n_cols);

    for (new_col_idx, (old_col_idx, _)) in col_variances.iter().enumerate() {
        // Pindahkan kolom loadings
        for i in 0..n_rows {
            sorted_loadings[(i, new_col_idx)] = rotated_loadings[(i, *old_col_idx)];
        }
        // Pindahkan kolom transformation matrix
        for i in 0..n_cols {
            sorted_transform[(i, new_col_idx)] = transformation_matrix[(i, *old_col_idx)];
        }
    }

    Ok(RotationResult {
        rotated_loadings: sorted_loadings,
        transformation_matrix: sorted_transform,
        factor_correlations: None, // orthogonal
    })
}


// Quartimax rotation (SPSS-compatible)
// TIMPA SELURUH FUNGSI INI
pub fn rotate_quartimax(
    extraction_result: &ExtractionResult,
    config: &FactorAnalysisConfig
) -> Result<RotationResult, String> {

    // COPY data loadings agar bisa kita modifikasi (Pre-processing)
    let mut processed_loadings = extraction_result.loadings.clone();
    let n_rows = processed_loadings.nrows(); 
    let n_cols = processed_loadings.ncols(); 

    // =========================================================
    // 0. PRE-PROCESS: Standardize Unrotated Signs (SPSS Fix)
    // =========================================================
    // Pastikan jumlah loading per kolom pada UNROTATED matrix positif.
    // Ini penting agar Component Transformation Matrix konsisten dengan SPSS.
    for j in 0..n_cols {
        let mut col_sum = 0.0;
        for i in 0..n_rows {
            col_sum += processed_loadings[(i, j)];
        }
        
        if col_sum < 0.0 {
            for i in 0..n_rows {
                processed_loadings[(i, j)] *= -1.0;
            }
        }
    }

    // Gunakan processed_loadings sebagai basis perhitungan selanjutnya
    let loadings = &processed_loadings;

    // =========================================================
    // 1. Kaiser normalization (SPSS default)
    // =========================================================
    let mut h = vec![0.0; n_rows];
    let mut normalized_loadings = loadings.clone();

    for i in 0..n_rows {
        let mut ss = 0.0;
        for j in 0..n_cols {
            ss += loadings[(i, j)] * loadings[(i, j)];
        }
        h[i] = ss.sqrt().max(1e-12);
        for j in 0..n_cols {
            normalized_loadings[(i, j)] /= h[i];
        }
    }

    // =========================================================
    // 2. Initialize rotation matrix
    // =========================================================
    let mut transformation_matrix = DMatrix::<f64>::identity(n_cols, n_cols);

    let max_iterations = config.rotation.max_iter as usize;
    let tol = 1e-6;
    let mut prev_singular_sum = 0.0;

    // =========================================================
    // 3. Global Quartimax optimization (γ = 0)
    // =========================================================
    for _ in 0..max_iterations {

        let lambda = &normalized_loadings * &transformation_matrix;

        // Quartimax gradient: 4 * Λ^3 (constant ignored)
        let mut tmp = DMatrix::<f64>::zeros(n_rows, n_cols);
        for i in 0..n_rows {
            for j in 0..n_cols {
                tmp[(i, j)] = lambda[(i, j)].powi(3);
            }
        }

        let m = normalized_loadings.transpose() * tmp;

        let svd = SVD::new(m, true, true);
        let u = svd.u.ok_or_else(|| "SVD failed".to_string())?;
        let v_t = svd.v_t.ok_or_else(|| "SVD failed".to_string())?;

        transformation_matrix = &u * &v_t;

        let singular_sum: f64 = svd.singular_values.iter().sum();
        if (singular_sum - prev_singular_sum).abs() < tol {
            break;
        }
        prev_singular_sum = singular_sum;
    }

    // =========================================================
    // 4. Apply rotation to normalized loadings
    // =========================================================
    let mut rotated_loadings = &normalized_loadings * &transformation_matrix;

    // De-normalize (Kaiser)
    for i in 0..n_rows {
        for j in 0..n_cols {
            rotated_loadings[(i, j)] *= h[i];
        }
    }

    // =========================================================
    // 5. SPSS-style sign reflection
    // =========================================================
    for j in 0..n_cols {
        let mut sum = 0.0;
        for i in 0..n_rows {
            sum += rotated_loadings[(i, j)];
        }
        if sum < 0.0 {
            for i in 0..n_rows {
                rotated_loadings[(i, j)] *= -1.0;
            }
            for i in 0..n_cols {
                transformation_matrix[(i, j)] *= -1.0;
            }
        }
    }

    // =========================================================
    // 6. SORT COMPONENTS BY VARIANCE (SPSS STYLE)
    // =========================================================
    
    // 1. Hitung Variance (SSL) untuk setiap kolom
    let mut col_variances: Vec<(usize, f64)> = (0..n_cols)
        .map(|j| {
            let mut ssl = 0.0;
            for i in 0..n_rows {
                ssl += rotated_loadings[(i, j)].powi(2);
            }
            (j, ssl)
        })
        .collect();

    // 2. Urutkan Descending berdasarkan SSL
    col_variances.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());

    // 3. Buat Matrix baru yang sudah terurut
    let mut sorted_loadings = DMatrix::<f64>::zeros(n_rows, n_cols);
    let mut sorted_transform = DMatrix::<f64>::zeros(n_cols, n_cols);

    for (new_col_idx, (old_col_idx, _)) in col_variances.iter().enumerate() {
        // Pindahkan kolom loadings
        for i in 0..n_rows {
            sorted_loadings[(i, new_col_idx)] = rotated_loadings[(i, *old_col_idx)];
        }
        // Pindahkan kolom transformation matrix
        for i in 0..n_cols {
            sorted_transform[(i, new_col_idx)] = transformation_matrix[(i, *old_col_idx)];
        }
    }

    Ok(RotationResult {
        rotated_loadings: sorted_loadings,
        transformation_matrix: sorted_transform,
        factor_correlations: None,
    })
}




// =========================================================
// Equamax rotation (SPSS-compatible, FINAL & VERIFIED)
// RULE:
// - k == 2  → Equamax == Varimax (SPSS behavior)
// - k >= 3  → Orthomax γ = p / (2k)
// =========================================================

pub fn rotate_equimax(
    extraction_result: &ExtractionResult,
    config: &FactorAnalysisConfig
) -> Result<RotationResult, String> {

    let loadings = &extraction_result.loadings;
    let n_rows = loadings.nrows(); // p
    let n_cols = loadings.ncols(); // k

    // =========================================================
    // SPSS SPECIAL CASE
    // =========================================================
    if n_cols == 2 {
        return rotate_varimax(extraction_result, config);
    }

    // =========================================================
    // 1. Kaiser normalization
    // =========================================================
    let mut h = vec![0.0; n_rows];
    let mut normalized = loadings.clone();


    for i in 0..n_rows {
        let mut ss = 0.0;
        for j in 0..n_cols {
            ss += loadings[(i, j)].powi(2);
        }

        h[i] = ss.sqrt().max(1e-12);
        for j in 0..n_cols {
            normalized[(i, j)] /= h[i];
        }
    }

    // =========================================================
    // 2. Init rotation matrix
    // =======================================================
    let mut t = DMatrix::<f64>::identity(n_cols, n_cols);

    let max_iter = config.rotation.max_iter as usize;
    let tol = 1e-6;
    let mut prev_obj = 0.0;
    let gamma = n_rows as f64 / (2.0 * n_cols as f64);

    // =========================================================
    // 3. Orthomax Equamax iteration
    // =========================================================
    for _ in 0..max_iter {
        let lambda = &normalized * &t;

        // Λ³
        let mut lambda3 = DMatrix::<f64>::zeros(n_rows, n_cols);

        for i in 0..n_rows {
            for j in 0..n_cols {
                lambda3[(i, j)] = lambda[(i, j)].powi(3);
            }
        }

        // column norms
        let mut col_norms = vec![0.0; n_cols];
        for j in 0..n_cols {
            for i in 0..n_rows {
                col_norms[j] += lambda[(i, j)].powi(2);
            }
        }

        // correction
        let mut correction = DMatrix::<f64>::zeros(n_rows, n_cols);
        for i in 0..n_rows {
            for j in 0..n_cols {
                correction[(i, j)] =
                    gamma * lambda[(i, j)] * col_norms[j] / n_rows as f64;
            }
        }

        let g = lambda3 - correction;
        let m = normalized.transpose() * g;

        let svd = SVD::new(m, true, true);
        let u = svd.u.ok_or("SVD failed")?;
        let v_t = svd.v_t.ok_or("SVD failed")?;
        t = &u * &v_t;

        // =====================================================
        // SPSS-style objective (SAFE, NO OWNERSHIP ISSUE)
        // =====================================================
        let mut obj = 0.0;
        for j in 0..n_cols {
            let mut s2 = 0.0;
            let mut s4 = 0.0;

            for i in 0..n_rows {
                let v = lambda[(i, j)];
                s2 += v * v;
                s4 += v.powi(4);
            }
            obj += s4 - gamma * (s2 * s2) / n_rows as f64
        }

        if (obj - prev_obj).abs() < tol {
            break;
        }
        prev_obj = obj;
    }


    // =========================================================
    // 4. Apply rotation & de-normalize
    // =========================================================
    let mut rotated = &normalized * &t;
    for i in 0..n_rows {
        for j in 0..n_cols {
            rotated[(i, j)] *= h[i];
        }
    }

    // ========================================================
    // 5. SPSS sign reflection
    // =========================================================
    for j in 0..n_cols {
        let mut sum = 0.0;
        for i in 0..n_rows {
            sum += rotated[(i, j)];
        }

        if sum < 0.0 {
            for i in 0..n_rows {
                rotated[(i, j)] *= -1.0;
            }
            for i in 0..n_cols {
                t[(i, j)] *= -1.0;
            }
        }
    }

    Ok(RotationResult {
        rotated_loadings: rotated,
        transformation_matrix: t,
        factor_correlations: None,
    })
}



pub fn rotate_oblimin(
    extraction_result: &ExtractionResult,
    config: &FactorAnalysisConfig
) -> Result<RotationResult, String> {
    let unrotated_loadings = &extraction_result.loadings;
    let n_rows = unrotated_loadings.nrows();
    let n_cols = unrotated_loadings.ncols();
    let delta = config.rotation.delta;

    // 1. Kaiser Normalization
    let mut h = vec![0.0; n_rows];
    let mut a = unrotated_loadings.clone();
    for i in 0..n_rows {
        let ss: f64 = (0..n_cols).map(|j| unrotated_loadings[(i, j)].powi(2)).sum();
        h[i] = ss.sqrt().max(1e-12);
        for j in 0..n_cols {
            a[(i, j)] /= h[i];
        }
    }

    // 2. Initialize T
    let mut t = DMatrix::<f64>::identity(n_cols, n_cols);
    let mut t_inv = DMatrix::<f64>::identity(n_cols, n_cols);
    
    let max_iter = config.rotation.max_iter as usize;
    let tol = 1e-7;
    
    for _ in 0..max_iter {
        let t_old = t.clone();
        
        // Pattern Matrix: L = A * (T^-1)'
        let t_inv_trans = t_inv.transpose();
        let l = &a * &t_inv_trans; // Gunakan & agar tidak move

        // Calculate Gradient G
        let mut g = DMatrix::<f64>::zeros(n_rows, n_cols);
        for j in 0..n_cols {
            let l_j_sq_sum: f64 = (0..n_rows).map(|i| l[(i, j)].powi(2)).sum();
            for i in 0..n_rows {
                let term1 = l[(i, j)].powi(3);
                let term2 = (delta / n_rows as f64) * l[(i, j)] * l_j_sq_sum;
                g[(i, j)] = term1 - term2;
            }
        }

        // FIX ERROR DISINI: Gunakan referensi (&) untuk semua operasi
        // Grad = -A' * G * T_inv_trans * T_inv_trans'
        let grad_t = -(&a.transpose() * &g * &t_inv_trans * t_inv_trans.transpose());
        
        // Update T
        t = &t - (0.5 * grad_t);
        
        // Normalize T columns
        for j in 0..n_cols {
            let col_norm = t.column(j).norm();
            for i in 0..n_cols { t[(i, j)] /= col_norm; }
        }

        t_inv = match t.clone().try_inverse() {
            Some(inv) => inv,
            None => break,
        };

        if (&t - &t_old).map(|v| v.abs()).sum() < tol { break; }
    }

    // 3. Final Pattern Matrix
    let mut pattern = &a * t_inv.transpose();
    for i in 0..n_rows {
        for j in 0..n_cols { pattern[(i, j)] *= h[i]; }
    }

    // 4. Factor Correlation Matrix (Phi = T' * T)
    let phi = t.transpose() * &t;

    Ok(RotationResult {
        rotated_loadings: pattern,
        transformation_matrix: t,
        factor_correlations: Some(phi),
    })
}

// Promax rotation - starts with varimax and then relaxes orthogonality
pub fn rotate_promax(
    extraction_result: &ExtractionResult,
    config: &FactorAnalysisConfig
) -> Result<RotationResult, String> {
    // First perform a varimax rotation
    let varimax_result = rotate_varimax(extraction_result, config)?;
    let loadings = &varimax_result.rotated_loadings;
    let n_rows = loadings.nrows();
    let n_cols = loadings.ncols();

    // Get kappa parameter (default is 4)
    let kappa = config.rotation.kappa as f64;

    // Create target matrix P by raising varimax loadings to power of kappa
    let mut target_matrix = DMatrix::zeros(n_rows, n_cols);
    for i in 0..n_rows {
        for j in 0..n_cols {
            // Get absolute value of loading
            let abs_loading = loadings[(i, j)].abs();

            // Preserve sign when raising to power of kappa
            let sign = if loadings[(i, j)] >= 0.0 { 1.0 } else { -1.0 };

            // Apply promax power transformation
            target_matrix[(i, j)] =
                (sign * abs_loading.powf(kappa + 1.0)) /
                (loadings[(i, j)].powi(2) / (n_rows as f64)).sqrt();
        }
    }

    // Normalize target matrix by column
    for j in 0..n_cols {
        let mut sum_squared = 0.0;
        for i in 0..n_rows {
            sum_squared += target_matrix[(i, j)].powi(2);
        }

        let norm = sum_squared.sqrt();
        if norm > 1e-10 {
            for i in 0..n_rows {
                target_matrix[(i, j)] /= norm;
            }
        }
    }

    // Calculate transformation matrix L: L = (A'A)^(-1) A'P where A is the varimax loadings
    let a_transpose_a = loadings.transpose() * loadings;
    let a_transpose_a_inv = match a_transpose_a.try_inverse() {
        Some(inv) => inv,
        None => {
            return Err("Could not invert A'A matrix for Promax rotation".to_string());
        }
    };

    let a_transpose_p = loadings.transpose() * target_matrix;
    let transformation_matrix = a_transpose_a_inv * a_transpose_p;

    // Normalize the transformation matrix by column
    let mut normalized_transformation = DMatrix::zeros(n_cols, n_cols);
    for j in 0..n_cols {
        // Calculate the column norm
        let mut sum_squared = 0.0;
        for i in 0..n_cols {
            sum_squared += transformation_matrix[(i, j)].powi(2);
        }

        let norm = sum_squared.sqrt();
        if norm > 1e-10 {
            for i in 0..n_cols {
                normalized_transformation[(i, j)] = transformation_matrix[(i, j)] / norm;
            }
        }
    }

    // Calculate factor correlations: R_ff = C (Q'Q)^(-1) C'
    // where Q is the normalized transformation matrix and C is a diagonal matrix

    // Calculate Q'Q
    let q_transpose_q = normalized_transformation.transpose() * normalized_transformation.clone();

    // Calculate (Q'Q)^(-1)
    let q_transpose_q_inv = match q_transpose_q.try_inverse() {
        Some(inv) => inv,
        None => {
            // If inversion fails, return identity
            DMatrix::identity(n_cols, n_cols)
        }
    };

    // Create diagonal matrix C with sqrt of diagonal elements of (Q'Q)^(-1)
    let mut c_matrix = DMatrix::zeros(n_cols, n_cols);
    for i in 0..n_cols {
        c_matrix[(i, i)] = q_transpose_q_inv[(i, i)].sqrt();
    }

    // Factor correlations: R_ff = C (Q'Q)^(-1) C'
    let factor_correlations = &c_matrix * &q_transpose_q_inv * c_matrix.transpose();

    // Calculate rotated loadings: X * Q * C^(-1)
    let mut c_inv = DMatrix::zeros(n_cols, n_cols);
    for i in 0..n_cols {
        if c_matrix[(i, i)] > 1e-10 {
            c_inv[(i, i)] = 1.0 / c_matrix[(i, i)];
        } else {
            c_inv[(i, i)] = 1.0;
        }
    }

    let rotated_loadings = loadings * normalized_transformation.clone() * c_inv;

    // Rearrange factors in descending order of variance explained
    let mut factor_variances = vec![0.0; n_cols];
    for j in 0..n_cols {
        for i in 0..n_rows {
            factor_variances[j] += rotated_loadings[(i, j)].powi(2);
        }
    }

    let mut indices: Vec<usize> = (0..n_cols).collect();
    indices.sort_by(|&i, &j|
        factor_variances[j].partial_cmp(&factor_variances[i]).unwrap_or(std::cmp::Ordering::Equal)
    );

    let mut sorted_loadings = DMatrix::zeros(n_rows, n_cols);
    let mut sorted_transform = DMatrix::zeros(n_cols, n_cols);
    let mut sorted_correlations = DMatrix::zeros(n_cols, n_cols);

    for (new_j, &old_j) in indices.iter().enumerate() {
        for i in 0..n_rows {
            sorted_loadings[(i, new_j)] = rotated_loadings[(i, old_j)];
        }

        for i in 0..n_cols {
            sorted_transform[(i, new_j)] = normalized_transformation[(i, old_j)];

            // Rearrange factor correlations
            for k in 0..n_cols {
                sorted_correlations[(new_j, indices[k])] = factor_correlations[(old_j, k)];
                sorted_correlations[(indices[k], new_j)] = factor_correlations[(k, old_j)];
            }
        }
    }

    Ok(RotationResult {
        rotated_loadings: sorted_loadings,
        transformation_matrix: sorted_transform,
        factor_correlations: Some(sorted_correlations),
    })
}

pub fn calculate_rotated_component_matrix(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<RotatedComponentMatrix, String> {
    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    let corr_matrix = calculate_matrix(&data_matrix, "correlation")?;
    let extraction_result = extract_factors(&corr_matrix, config, &var_names)?;
    let rotation_result = rotate_factors(&extraction_result, config)?;

    let mut components = HashMap::new();
    let rotated_loadings = &rotation_result.rotated_loadings;
    let n_rows = rotated_loadings.nrows();
    let n_cols = rotated_loadings.ncols();

    for (i, var_name) in var_names.iter().enumerate() {
        if i < n_rows {
            let mut loadings = Vec::with_capacity(n_cols);

            for j in 0..n_cols {
                loadings.push(rotated_loadings[(i, j)]);
            }

            components.insert(var_name.clone(), loadings);
        }
    }

    Ok(RotatedComponentMatrix {
        components,
        variable_order: var_names,
    })
}

pub fn calculate_component_transformation_matrix(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<ComponentTransformationMatrix, String> {
    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    let corr_matrix = calculate_matrix(&data_matrix, "correlation")?;
    let extraction_result = extract_factors(&corr_matrix, config, &var_names)?;
    let rotation_result = rotate_factors(&extraction_result, config)?;

    // Create component transformation matrix directly
    let transformation_matrix = &rotation_result.transformation_matrix;
    let n_rows = transformation_matrix.nrows();
    let n_cols = transformation_matrix.ncols();

    let mut components = Vec::with_capacity(n_rows);

    for i in 0..n_rows {
        let mut row = Vec::with_capacity(n_cols);

        for j in 0..n_cols {
            row.push(transformation_matrix[(i, j)]);
        }

        components.push(row);
    }

    Ok(ComponentTransformationMatrix { components })
}

use crate::models::result::{PatternMatrix, StructureMatrix, ComponentCorrelationMatrix};

pub fn calculate_pattern_matrix(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<PatternMatrix, String> {
    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    let corr_matrix = calculate_matrix(&data_matrix, "correlation")?;
    let extraction_result = extract_factors(&corr_matrix, config, &var_names)?;
    let rotation_result = rotate_factors(&extraction_result, config)?;

    let mut components = HashMap::new();
    let pattern_loadings = &rotation_result.rotated_loadings;
    let n_rows = pattern_loadings.nrows();
    let n_cols = pattern_loadings.ncols();

    for (i, var_name) in var_names.iter().enumerate() {
        if i < n_rows {
            let mut loadings = Vec::with_capacity(n_cols);

            for j in 0..n_cols {
                loadings.push(pattern_loadings[(i, j)]);
            }

            components.insert(var_name.clone(), loadings);
        }
    }

    Ok(PatternMatrix {
        components,
        variable_order: var_names,
    })
}

pub fn calculate_structure_matrix(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<StructureMatrix, String> {
    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    let corr_matrix = calculate_matrix(&data_matrix, "correlation")?;
    let extraction_result = extract_factors(&corr_matrix, config, &var_names)?;
    let rotation_result = rotate_factors(&extraction_result, config)?;

    let pattern_loadings = &rotation_result.rotated_loadings;
    let n_rows = pattern_loadings.nrows();
    let n_cols = pattern_loadings.ncols();

    let mut structure_loadings = pattern_loadings.clone();

    if let Some(factor_correlations) = &rotation_result.factor_correlations {
        structure_loadings = pattern_loadings * factor_correlations;
    }

    let mut components = HashMap::new();

    for (i, var_name) in var_names.iter().enumerate() {
        if i < n_rows {
            let mut loadings = Vec::with_capacity(n_cols);

            for j in 0..n_cols {
                loadings.push(structure_loadings[(i, j)]);
            }

            components.insert(var_name.clone(), loadings);
        }
    }

    Ok(StructureMatrix {
        components,
        variable_order: var_names,
    })
}

pub fn calculate_component_correlation_matrix(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<ComponentCorrelationMatrix, String> {
    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    let corr_matrix = calculate_matrix(&data_matrix, "correlation")?;
    let extraction_result = extract_factors(&corr_matrix, config, &var_names)?;
    let rotation_result = rotate_factors(&extraction_result, config)?;

    let mut correlations = Vec::new();

    if let Some(factor_corrs) = &rotation_result.factor_correlations {
        let n_cols = factor_corrs.ncols();

        for i in 0..n_cols {
            let mut row = Vec::with_capacity(n_cols);

            for j in 0..n_cols {
                row.push(factor_corrs[(i, j)]);
            }

            correlations.push(row);
        }
    }

    Ok(ComponentCorrelationMatrix {
        correlations,
    })
}














