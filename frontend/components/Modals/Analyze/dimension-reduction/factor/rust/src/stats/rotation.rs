// // perbaikan BISA 

// use std::collections::HashMap;
// use nalgebra::{DMatrix, SVD};
// use crate::models::{
//     config::FactorAnalysisConfig,
//     data::AnalysisData,
//     result::{
//         ComponentTransformationMatrix,
//         ExtractionResult,
//         RotatedComponentMatrix,
//         RotationResult,
//     },
// };

// use super::core::{ calculate_matrix, extract_data_matrix, extract_factors };

// // Rotate factors using specified method
// pub fn rotate_factors(
//     extraction_result: &ExtractionResult,
//     config: &FactorAnalysisConfig
// ) -> Result<RotationResult, String> {
//     if config.rotation.none {
//         // No rotation, return original loadings
//         return Ok(RotationResult {
//             rotated_loadings: extraction_result.loadings.clone(),
//             transformation_matrix: DMatrix::identity(
//                 extraction_result.n_factors,
//                 extraction_result.n_factors
//             ),
//             factor_correlations: None,
//         });
//     }

//     if config.rotation.varimax {
//         rotate_varimax(extraction_result, config)
//     } else if config.rotation.quartimax {
//         rotate_quartimax(extraction_result, config)
//     } else if config.rotation.equimax {
//         rotate_equimax(extraction_result, config)
//     } else if config.rotation.oblimin {
//         rotate_oblimin(extraction_result, config)
//     } else if config.rotation.promax {
//         rotate_promax(extraction_result, config)
//     } else {
//         // Default to varimax
//         rotate_varimax(extraction_result, config)
//     }
// }





// // Varimax rotation (SPSS-compatible)
// pub fn rotate_varimax(
//     extraction_result: &ExtractionResult,
//     config: &FactorAnalysisConfig
// ) -> Result<RotationResult, String> {

//     // COPY data loadings agar bisa kita modifikasi (Pre-processing)
//     let mut processed_loadings = extraction_result.loadings.clone();
//     let n_rows = processed_loadings.nrows(); 
//     let n_cols = processed_loadings.ncols(); 

//     // =========================================================
//     // 0. PRE-PROCESS: Standardize Unrotated Signs (SPSS Fix)
//     // =========================================================
//     // SPSS memastikan jumlah loading per kolom pada UNROTATED matrix
//     // selalu positif. Jika negatif, balik tandanya.
//     // Ini memperbaiki tanda pada "Component Transformation Matrix".
//     for j in 0..n_cols {
//         let mut col_sum = 0.0;
//         for i in 0..n_rows {
//             col_sum += processed_loadings[(i, j)];
//         }
        
//         if col_sum < 0.0 {
//             for i in 0..n_rows {
//                 processed_loadings[(i, j)] *= -1.0;
//             }
//         }
//     }

//     // Gunakan processed_loadings sebagai basis perhitungan selanjutnya
//     let loadings = &processed_loadings;

//     // =========================================================
//     // 1. Kaiser normalization
//     // =========================================================
//     let mut h = vec![0.0; n_rows];
//     let mut normalized_loadings = loadings.clone();

//     for i in 0..n_rows {
//         let mut ss = 0.0;
//         for j in 0..n_cols {
//             ss += loadings[(i, j)] * loadings[(i, j)];
//         }
//         h[i] = ss.sqrt().max(1e-12); // avoid divide by zero
//         for j in 0..n_cols {
//             normalized_loadings[(i, j)] /= h[i];
//         }
//     }

//     // =========================================================
//     // 2. Initialize rotation matrix
//     // =========================================================
//     let mut transformation_matrix = DMatrix::<f64>::identity(n_cols, n_cols);

//     let max_iterations = config.rotation.max_iter as usize;
//     let tol = 1e-6;
//     let mut prev_singular_sum = 0.0;

//     // =========================================================
//     // 3. Iterative global varimax optimization (SVD)
//     // =========================================================
//     for _ in 0..max_iterations {

//         // Λ = L * R
//         let lambda = &normalized_loadings * &transformation_matrix;

//         // Compute varimax gradient
//         let mut tmp = DMatrix::<f64>::zeros(n_rows, n_cols);

//         for j in 0..n_cols {
//             let mut mean_sq = 0.0;
//             for i in 0..n_rows {
//                 mean_sq += lambda[(i, j)].powi(2);
//             }
//             mean_sq /= n_rows as f64;

//             for i in 0..n_rows {
//                 tmp[(i, j)] =
//                     lambda[(i, j)].powi(3) - lambda[(i, j)] * mean_sq;
//             }
//         }

//         // Core matrix
//         let m = normalized_loadings.transpose() * tmp;

//         // SVD step (KEY: same as SPSS)
//         let svd = SVD::new(m, true, true);
//         let u = svd.u.ok_or("SVD failed")?;
//         let v_t = svd.v_t.ok_or("SVD failed")?;

//         transformation_matrix = &u * &v_t;

//         // Convergence check
//         let singular_sum: f64 = svd.singular_values.iter().sum();
//         if (singular_sum - prev_singular_sum).abs() < tol {
//             break;
//         }
//         prev_singular_sum = singular_sum;
//     }

//     // =========================================================
//     // 4. Apply rotation & de-normalize
//     // =========================================================
//     let mut rotated_loadings = &normalized_loadings * &transformation_matrix;

//     // De-normalize (Kaiser)
//     for i in 0..n_rows {
//         for j in 0..n_cols {
//             rotated_loadings[(i, j)] *= h[i];
//         }
//     }

//     // =========================================================
//     // 5. SPSS-style sign reflection (Fix Rotated Columns)
//     // =========================================================
//     for j in 0..n_cols {
//         let mut sum = 0.0;
//         for i in 0..n_rows {
//             sum += rotated_loadings[(i, j)];
//         }
//         if sum < 0.0 {
//             for i in 0..n_rows {
//                 rotated_loadings[(i, j)] *= -1.0;
//             }
//             for i in 0..n_cols {
//                 transformation_matrix[(i, j)] *= -1.0;
//             }
//         }
//     }

//     // =========================================================
//     // 6. SORT COMPONENTS BY VARIANCE (SPSS STYLE)
//     // =========================================================
    
//     // 1. Hitung Variance (SSL) untuk setiap kolom
//     let mut col_variances: Vec<(usize, f64)> = (0..n_cols)
//         .map(|j| {
//             let mut ssl = 0.0;
//             for i in 0..n_rows {
//                 ssl += rotated_loadings[(i, j)].powi(2);
//             }
//             (j, ssl)
//         })
//         .collect();

//     // 2. Urutkan Descending berdasarkan SSL
//     col_variances.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());

//     // 3. Buat Matrix baru yang sudah terurut
//     let mut sorted_loadings = DMatrix::<f64>::zeros(n_rows, n_cols);
//     let mut sorted_transform = DMatrix::<f64>::zeros(n_cols, n_cols);

//     for (new_col_idx, (old_col_idx, _)) in col_variances.iter().enumerate() {
//         // Pindahkan kolom loadings
//         for i in 0..n_rows {
//             sorted_loadings[(i, new_col_idx)] = rotated_loadings[(i, *old_col_idx)];
//         }
//         // Pindahkan kolom transformation matrix
//         for i in 0..n_cols {
//             sorted_transform[(i, new_col_idx)] = transformation_matrix[(i, *old_col_idx)];
//         }
//     }

//     Ok(RotationResult {
//         rotated_loadings: sorted_loadings,
//         transformation_matrix: sorted_transform,
//         factor_correlations: None, // orthogonal
//     })
// }


// // Quartimax rotation (SPSS-compatible)
// // TIMPA SELURUH FUNGSI INI
// pub fn rotate_quartimax(
//     extraction_result: &ExtractionResult,
//     config: &FactorAnalysisConfig
// ) -> Result<RotationResult, String> {

//     // COPY data loadings agar bisa kita modifikasi (Pre-processing)
//     let mut processed_loadings = extraction_result.loadings.clone();
//     let n_rows = processed_loadings.nrows(); 
//     let n_cols = processed_loadings.ncols(); 

//     // =========================================================
//     // 0. PRE-PROCESS: Standardize Unrotated Signs (SPSS Fix)
//     // =========================================================
//     // Pastikan jumlah loading per kolom pada UNROTATED matrix positif.
//     // Ini penting agar Component Transformation Matrix konsisten dengan SPSS.
//     for j in 0..n_cols {
//         let mut col_sum = 0.0;
//         for i in 0..n_rows {
//             col_sum += processed_loadings[(i, j)];
//         }
        
//         if col_sum < 0.0 {
//             for i in 0..n_rows {
//                 processed_loadings[(i, j)] *= -1.0;
//             }
//         }
//     }

//     // Gunakan processed_loadings sebagai basis perhitungan selanjutnya
//     let loadings = &processed_loadings;

//     // =========================================================
//     // 1. Kaiser normalization (SPSS default)
//     // =========================================================
//     let mut h = vec![0.0; n_rows];
//     let mut normalized_loadings = loadings.clone();

//     for i in 0..n_rows {
//         let mut ss = 0.0;
//         for j in 0..n_cols {
//             ss += loadings[(i, j)] * loadings[(i, j)];
//         }
//         h[i] = ss.sqrt().max(1e-12);
//         for j in 0..n_cols {
//             normalized_loadings[(i, j)] /= h[i];
//         }
//     }

//     // =========================================================
//     // 2. Initialize rotation matrix
//     // =========================================================
//     let mut transformation_matrix = DMatrix::<f64>::identity(n_cols, n_cols);

//     let max_iterations = config.rotation.max_iter as usize;
//     let tol = 1e-6;
//     let mut prev_singular_sum = 0.0;

//     // =========================================================
//     // 3. Global Quartimax optimization (γ = 0)
//     // =========================================================
//     for _ in 0..max_iterations {

//         let lambda = &normalized_loadings * &transformation_matrix;

//         // Quartimax gradient: 4 * Λ^3 (constant ignored)
//         let mut tmp = DMatrix::<f64>::zeros(n_rows, n_cols);
//         for i in 0..n_rows {
//             for j in 0..n_cols {
//                 tmp[(i, j)] = lambda[(i, j)].powi(3);
//             }
//         }

//         let m = normalized_loadings.transpose() * tmp;

//         let svd = SVD::new(m, true, true);
//         let u = svd.u.ok_or_else(|| "SVD failed".to_string())?;
//         let v_t = svd.v_t.ok_or_else(|| "SVD failed".to_string())?;

//         transformation_matrix = &u * &v_t;

//         let singular_sum: f64 = svd.singular_values.iter().sum();
//         if (singular_sum - prev_singular_sum).abs() < tol {
//             break;
//         }
//         prev_singular_sum = singular_sum;
//     }

//     // =========================================================
//     // 4. Apply rotation to normalized loadings
//     // =========================================================
//     let mut rotated_loadings = &normalized_loadings * &transformation_matrix;

//     // De-normalize (Kaiser)
//     for i in 0..n_rows {
//         for j in 0..n_cols {
//             rotated_loadings[(i, j)] *= h[i];
//         }
//     }

//     // =========================================================
//     // 5. SPSS-style sign reflection
//     // =========================================================
//     for j in 0..n_cols {
//         let mut sum = 0.0;
//         for i in 0..n_rows {
//             sum += rotated_loadings[(i, j)];
//         }
//         if sum < 0.0 {
//             for i in 0..n_rows {
//                 rotated_loadings[(i, j)] *= -1.0;
//             }
//             for i in 0..n_cols {
//                 transformation_matrix[(i, j)] *= -1.0;
//             }
//         }
//     }

//     // =========================================================
//     // 6. SORT COMPONENTS BY VARIANCE (SPSS STYLE)
//     // =========================================================
    
//     // 1. Hitung Variance (SSL) untuk setiap kolom
//     let mut col_variances: Vec<(usize, f64)> = (0..n_cols)
//         .map(|j| {
//             let mut ssl = 0.0;
//             for i in 0..n_rows {
//                 ssl += rotated_loadings[(i, j)].powi(2);
//             }
//             (j, ssl)
//         })
//         .collect();

//     // 2. Urutkan Descending berdasarkan SSL
//     col_variances.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());

//     // 3. Buat Matrix baru yang sudah terurut
//     let mut sorted_loadings = DMatrix::<f64>::zeros(n_rows, n_cols);
//     let mut sorted_transform = DMatrix::<f64>::zeros(n_cols, n_cols);

//     for (new_col_idx, (old_col_idx, _)) in col_variances.iter().enumerate() {
//         // Pindahkan kolom loadings
//         for i in 0..n_rows {
//             sorted_loadings[(i, new_col_idx)] = rotated_loadings[(i, *old_col_idx)];
//         }
//         // Pindahkan kolom transformation matrix
//         for i in 0..n_cols {
//             sorted_transform[(i, new_col_idx)] = transformation_matrix[(i, *old_col_idx)];
//         }
//     }

//     Ok(RotationResult {
//         rotated_loadings: sorted_loadings,
//         transformation_matrix: sorted_transform,
//         factor_correlations: None,
//     })
// }




// // =========================================================
// // Equamax rotation (SPSS-compatible, FINAL & VERIFIED)
// // RULE:
// // - k == 2  → Equamax == Varimax (SPSS behavior)
// // - k >= 3  → Orthomax γ = p / (2k)
// // =========================================================

// pub fn rotate_equimax(
//     extraction_result: &ExtractionResult,
//     config: &FactorAnalysisConfig
// ) -> Result<RotationResult, String> {

//     let loadings = &extraction_result.loadings;
//     let n_rows = loadings.nrows(); // p
//     let n_cols = loadings.ncols(); // k

//     // =========================================================
//     // SPSS SPECIAL CASE
//     // =========================================================
//     if n_cols == 2 {
//         return rotate_varimax(extraction_result, config);
//     }

//     // =========================================================
//     // 1. Kaiser normalization
//     // =========================================================
//     let mut h = vec![0.0; n_rows];
//     let mut normalized = loadings.clone();


//     for i in 0..n_rows {
//         let mut ss = 0.0;
//         for j in 0..n_cols {
//             ss += loadings[(i, j)].powi(2);
//         }

//         h[i] = ss.sqrt().max(1e-12);
//         for j in 0..n_cols {
//             normalized[(i, j)] /= h[i];
//         }
//     }

//     // =========================================================
//     // 2. Init rotation matrix
//     // =======================================================
//     let mut t = DMatrix::<f64>::identity(n_cols, n_cols);

//     let max_iter = config.rotation.max_iter as usize;
//     let tol = 1e-6;
//     let mut prev_obj = 0.0;
//     let gamma = n_rows as f64 / (2.0 * n_cols as f64);

//     // =========================================================
//     // 3. Orthomax Equamax iteration
//     // =========================================================
//     for _ in 0..max_iter {
//         let lambda = &normalized * &t;

//         // Λ³
//         let mut lambda3 = DMatrix::<f64>::zeros(n_rows, n_cols);

//         for i in 0..n_rows {
//             for j in 0..n_cols {
//                 lambda3[(i, j)] = lambda[(i, j)].powi(3);
//             }
//         }

//         // column norms
//         let mut col_norms = vec![0.0; n_cols];
//         for j in 0..n_cols {
//             for i in 0..n_rows {
//                 col_norms[j] += lambda[(i, j)].powi(2);
//             }
//         }

//         // correction
//         let mut correction = DMatrix::<f64>::zeros(n_rows, n_cols);
//         for i in 0..n_rows {
//             for j in 0..n_cols {
//                 correction[(i, j)] =
//                     gamma * lambda[(i, j)] * col_norms[j] / n_rows as f64;
//             }
//         }

//         let g = lambda3 - correction;
//         let m = normalized.transpose() * g;

//         let svd = SVD::new(m, true, true);
//         let u = svd.u.ok_or("SVD failed")?;
//         let v_t = svd.v_t.ok_or("SVD failed")?;
//         t = &u * &v_t;

//         // =====================================================
//         // SPSS-style objective (SAFE, NO OWNERSHIP ISSUE)
//         // =====================================================
//         let mut obj = 0.0;
//         for j in 0..n_cols {
//             let mut s2 = 0.0;
//             let mut s4 = 0.0;

//             for i in 0..n_rows {
//                 let v = lambda[(i, j)];
//                 s2 += v * v;
//                 s4 += v.powi(4);
//             }
//             obj += s4 - gamma * (s2 * s2) / n_rows as f64
//         }

//         if (obj - prev_obj).abs() < tol {
//             break;
//         }
//         prev_obj = obj;
//     }


//     // =========================================================
//     // 4. Apply rotation & de-normalize
//     // =========================================================
//     let mut rotated = &normalized * &t;
//     for i in 0..n_rows {
//         for j in 0..n_cols {
//             rotated[(i, j)] *= h[i];
//         }
//     }

//     // ========================================================
//     // 5. SPSS sign reflection
//     // =========================================================
//     for j in 0..n_cols {
//         let mut sum = 0.0;
//         for i in 0..n_rows {
//             sum += rotated[(i, j)];
//         }

//         if sum < 0.0 {
//             for i in 0..n_rows {
//                 rotated[(i, j)] *= -1.0;
//             }
//             for i in 0..n_cols {
//                 t[(i, j)] *= -1.0;
//             }
//         }
//     }

//     Ok(RotationResult {
//         rotated_loadings: rotated,
//         transformation_matrix: t,
//         factor_correlations: None,
//     })
// }



// // pub fn rotate_oblimin(
// //     extraction_result: &ExtractionResult,
// //     config: &FactorAnalysisConfig
// // ) -> Result<RotationResult, String> {
// //     let unrotated_loadings = &extraction_result.loadings;
// //     let n_rows = unrotated_loadings.nrows();
// //     let n_cols = unrotated_loadings.ncols();
// //     let delta = config.rotation.delta;

// //     // 1. Kaiser Normalization
// //     let mut h = vec![0.0; n_rows];
// //     let mut a = unrotated_loadings.clone();
// //     for i in 0..n_rows {
// //         let ss: f64 = (0..n_cols).map(|j| unrotated_loadings[(i, j)].powi(2)).sum();
// //         h[i] = ss.sqrt().max(1e-12);
// //         for j in 0..n_cols {
// //             a[(i, j)] /= h[i];
// //         }
// //     }

// //     // 2. Initialize T
// //     let mut t = DMatrix::<f64>::identity(n_cols, n_cols);
// //     let mut t_inv = DMatrix::<f64>::identity(n_cols, n_cols);
    
// //     let max_iter = config.rotation.max_iter as usize;
// //     let tol = 1e-7;
    
// //     for _ in 0..max_iter {
// //         let t_old = t.clone();
        
// //         // Pattern Matrix: L = A * (T^-1)'
// //         let t_inv_trans = t_inv.transpose();
// //         let l = &a * &t_inv_trans; // Gunakan & agar tidak move

// //         // Calculate Gradient G
// //         let mut g = DMatrix::<f64>::zeros(n_rows, n_cols);
// //         for j in 0..n_cols {
// //             let l_j_sq_sum: f64 = (0..n_rows).map(|i| l[(i, j)].powi(2)).sum();
// //             for i in 0..n_rows {
// //                 let term1 = l[(i, j)].powi(3);
// //                 let term2 = (delta / n_rows as f64) * l[(i, j)] * l_j_sq_sum;
// //                 g[(i, j)] = term1 - term2;
// //             }
// //         }

// //         // FIX ERROR DISINI: Gunakan referensi (&) untuk semua operasi
// //         // Grad = -A' * G * T_inv_trans * T_inv_trans'
// //         let grad_t = -(&a.transpose() * &g * &t_inv_trans * t_inv_trans.transpose());
        
// //         // Update T
// //         t = &t - (0.5 * grad_t);
        
// //         // Normalize T columns
// //         for j in 0..n_cols {
// //             let col_norm = t.column(j).norm();
// //             for i in 0..n_cols { t[(i, j)] /= col_norm; }
// //         }

// //         t_inv = match t.clone().try_inverse() {
// //             Some(inv) => inv,
// //             None => break,
// //         };

// //         if (&t - &t_old).map(|v| v.abs()).sum() < tol { break; }
// //     }

// //     // 3. Final Pattern Matrix
// //     let mut pattern = &a * t_inv.transpose();
// //     for i in 0..n_rows {
// //         for j in 0..n_cols { pattern[(i, j)] *= h[i]; }
// //     }

// //     // 4. Factor Correlation Matrix (Phi = T' * T)
// //     let phi = t.transpose() * &t;

// //     Ok(RotationResult {
// //         rotated_loadings: pattern,
// //         transformation_matrix: t,
// //         factor_correlations: Some(phi),
// //     })
// // }





























// // PERBAIKAN 2

// // =========================================================
// // Direct Oblimin Rotation (With Varimax Warm Start)
// // =========================================================
// pub fn rotate_oblimin(
//     extraction_result: &ExtractionResult,
//     config: &FactorAnalysisConfig
// ) -> Result<RotationResult, String> {
    
//     // ---------------------------------------------------------
//     // STEP 1: VARIMAX WARM START (RAHASIA SPSS MATCHING)
//     // ---------------------------------------------------------
//     // Kita jalankan Varimax terlebih dahulu untuk mendapatkan posisi awal 
//     // yang mendekati solusi optimal. Ini mencegah terjebak di local minima.
//     // Pastikan fungsi rotate_varimax sudah benar (karena Anda bilang sudah match SPSS).
    
//     let varimax_result = rotate_varimax(extraction_result, config)?;
//     let start_t = varimax_result.transformation_matrix; // Kita pakai T dari Varimax

//     // Ambil data dasar
//     let unrotated_loadings = &extraction_result.loadings;
//     let n_rows = unrotated_loadings.nrows();
//     let n_cols = unrotated_loadings.ncols();
    
//     // Parameter Gamma/Delta (SPSS Default delta=0)
//     let gamma = config.rotation.delta; 

//     // ---------------------------------------------------------
//     // STEP 2: KAISER NORMALIZATION
//     // ---------------------------------------------------------
//     let mut h = vec![0.0; n_rows];
//     let mut a_mat = unrotated_loadings.clone(); // A = Normalized Loadings
    
//     for i in 0..n_rows {
//         let mut ss = 0.0;
//         for j in 0..n_cols {
//             ss += unrotated_loadings[(i, j)].powi(2);
//         }
//         h[i] = ss.sqrt().max(1e-12); 
//         for j in 0..n_cols {
//             a_mat[(i, j)] /= h[i];
//         }
//     }

//     // ---------------------------------------------------------
//     // STEP 3: INITIALIZATION (MENGGUNAKAN HASIL VARIMAX)
//     // ---------------------------------------------------------
//     // Disini perbedaannya. Jangan mulai dari Identity.
//     // Mulai dari Varimax T.
//     let mut t_mat = start_t; 

//     // Setup Iterasi
//     let max_iter = config.rotation.max_iter as usize;
//     let tol = 1e-5;
//     let mut alpha = 1.0; // Initial step size

//     // ---------------------------------------------------------
//     // STEP 4: OBLIMIN GRADIENT OPTIMIZATION
//     // ---------------------------------------------------------
    
//     // Pre-allocate matrix N untuk Oblimin weight
//     // N_jm = 1 (j!=m), 0 (j=m) minus gamma/p
//     let mut n_matrix = DMatrix::<f64>::zeros(n_cols, n_cols);
//     for j in 0..n_cols {
//         for m in 0..n_cols {
//             if j != m { n_matrix[(j, m)] = 1.0; }
//             n_matrix[(j, m)] -= gamma / n_rows as f64;
//         }
//     }

//     let mut current_obj = oblimin_criterion_gpa(&(&a_mat * &t_mat), &n_matrix);

//     for _iter in 0..max_iter {
//         // L = A * T
//         let l_mat = &a_mat * &t_mat;

//         // --- Gradient Calculation (Standard GPA) ---
//         // Rumus Gradient Oblimin Standard (sesuai GPArotation R package / Jennrich)
//         // dQ = L * (L^2 . N)
//         // G  = A' * dQ
        
//         let mut l_sq = DMatrix::<f64>::zeros(n_rows, n_cols);
//         for i in 0..n_rows {
//             for j in 0..n_cols { l_sq[(i, j)] = l_mat[(i, j)].powi(2); }
//         }
        
//         // Element-wise multiplication implicit in calculation logic
//         // Gradient Matrix Q
//         let l2_n = &l_sq * &n_matrix;
//         let mut dq = DMatrix::<f64>::zeros(n_rows, n_cols);
//         for i in 0..n_rows {
//             for j in 0..n_cols {
//                 dq[(i, j)] = l_mat[(i, j)] * l2_n[(i, j)];
//             }
//         }
        
//         // Gradient G
//         let g_mat = a_mat.transpose() * &dq;

//         // --- Gradient Projection ---
//         // P = G - T * diag(inv(T) * G)
//         // Untuk Oblique rotation, kita proyeksikan gradient agar T tetap valid
//         let t_inv = t_mat.clone().try_inverse().unwrap_or_else(|| DMatrix::identity(n_cols, n_cols));
//         let x_mat = &t_inv * &g_mat; 
        
//         let mut x_diag = DMatrix::<f64>::zeros(n_cols, n_cols);
//         for i in 0..n_cols { x_diag[(i, i)] = x_mat[(i, i)]; }

//         let gp = &g_mat - &t_mat * &x_diag;

//         // Check Convergence
//         let max_grad = gp.iter().map(|x| x.abs()).fold(0.0, f64::max);
//         if max_grad < tol { break; }

//         // --- Line Search ---
//         let mut best_t = t_mat.clone();
//         let mut found = false;
//         let mut step = alpha;

//         for _s in 0..10 {
//             let mut t_new = &t_mat - step * &gp;
            
//             // Constraint: Kolom T harus memiliki panjang normal di ruang invers
//             // diag(inv(T'T)) = 1
//             let tt = t_new.transpose() * &t_new;
//             if let Some(inv_tt) = tt.try_inverse() {
//                  let mut scale_diag = DMatrix::<f64>::zeros(n_cols, n_cols);
//                  for k in 0..n_cols {
//                      if inv_tt[(k,k)] > 0.0 {
//                         scale_diag[(k,k)] = inv_tt[(k,k)].sqrt();
//                      } else {
//                         scale_diag[(k,k)] = 1.0;
//                      }
//                  }
//                  t_new = t_new * scale_diag;
//             }

//             let l_new = &a_mat * &t_new;
//             let obj_new = oblimin_criterion_gpa(&l_new, &n_matrix);

//             if obj_new < current_obj {
//                 current_obj = obj_new;
//                 best_t = t_new;
//                 found = true;
//                 step *= 1.2; 
//                 break;
//             }
//             step *= 0.5;
//         }

//         t_mat = best_t;
//         alpha = step;
//         if !found && alpha < 1e-7 { break; }
//     }

//     // ---------------------------------------------------------
//     // STEP 5: DE-NORMALIZATION
//     // ---------------------------------------------------------
//     let l_final = &a_mat * &t_mat;
//     let mut pattern = DMatrix::<f64>::zeros(n_rows, n_cols);
//     for i in 0..n_rows {
//         for j in 0..n_cols {
//             pattern[(i, j)] = l_final[(i, j)] * h[i];
//         }
//     }

//     // ---------------------------------------------------------
//     // STEP 6: SIGN REFLECTION (SPSS COMPATIBILITY)
//     // ---------------------------------------------------------
//     for j in 0..n_cols {
//         let mut col_sum = 0.0;
//         for i in 0..n_rows {
//             // SPSS ULS method usually looks at raw sum or sum of cubes.
//             // Kita gunakan raw sum.
//             col_sum += pattern[(i, j)];
//         }

//         if col_sum < 0.0 {
//             // Flip Pattern Column
//             for i in 0..n_rows { pattern[(i, j)] *= -1.0; }
//             // Flip T Column (Agar korelasi ikut terbalik)
//             for k in 0..n_cols { t_mat[(k, j)] *= -1.0; }
//         }
//     }

//     // ---------------------------------------------------------
//     // STEP 7: CALCULATE PHI & SORTING
//     // ---------------------------------------------------------
//     let tt = t_mat.transpose() * &t_mat;
//     let phi = tt.try_inverse().unwrap_or_else(|| DMatrix::identity(n_cols, n_cols));

//     // Sorting by Variance (SSL)
//     let mut col_stats: Vec<(usize, f64)> = (0..n_cols)
//         .map(|j| {
//             let ssl: f64 = (0..n_rows).map(|i| pattern[(i, j)].powi(2)).sum();
//             (j, ssl)
//         })
//         .collect();

//     col_stats.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
//     let new_indices: Vec<usize> = col_stats.iter().map(|x| x.0).collect();

//     // Reordering Matrices
//     let mut sorted_pattern = DMatrix::<f64>::zeros(n_rows, n_cols);
//     let mut sorted_t = DMatrix::<f64>::zeros(n_cols, n_cols);
    
//     for (new_idx, &old_idx) in new_indices.iter().enumerate() {
//         for i in 0..n_rows { sorted_pattern[(i, new_idx)] = pattern[(i, old_idx)]; }
//         for i in 0..n_cols { sorted_t[(i, new_idx)] = t_mat[(i, old_idx)]; }
//     }

//     // Reorder Correlation Matrix (Symmetric)
//     let mut sorted_phi = DMatrix::<f64>::zeros(n_cols, n_cols);
//     for (new_row, &old_row) in new_indices.iter().enumerate() {
//         for (new_col, &old_col) in new_indices.iter().enumerate() {
//             sorted_phi[(new_row, new_col)] = phi[(old_row, old_col)];
//         }
//     }

//     Ok(RotationResult {
//         rotated_loadings: sorted_pattern,
//         transformation_matrix: sorted_t,
//         factor_correlations: Some(sorted_phi),
//     })
// }

// // Helper untuk GPA Oblimin Criterion (Tetap sama, pastikan ada di file)
// fn oblimin_criterion_gpa(l_mat: &DMatrix<f64>, n_matrix: &DMatrix<f64>) -> f64 {
//     let n_rows = l_mat.nrows();
//     let n_cols = l_mat.ncols();
//     let mut l_sq = DMatrix::<f64>::zeros(n_rows, n_cols);
//     for i in 0..n_rows {
//         for j in 0..n_cols {
//             l_sq[(i, j)] = l_mat[(i, j)].powi(2);
//         }
//     }
//     let l2_n = &l_sq * n_matrix;
//     let mut sum = 0.0;
//     for i in 0..n_rows {
//         for j in 0..n_cols {
//             sum += l_sq[(i, j)] * l2_n[(i, j)];
//         }
//     }
//     sum / 4.0
// }


































// // // Promax rotation - starts with varimax and then relaxes orthogonality
// // pub fn rotate_promax(
// //     extraction_result: &ExtractionResult,
// //     config: &FactorAnalysisConfig
// // ) -> Result<RotationResult, String> {
// //     // First perform a varimax rotation
// //     let varimax_result = rotate_varimax(extraction_result, config)?;
// //     let loadings = &varimax_result.rotated_loadings;
// //     let n_rows = loadings.nrows();
// //     let n_cols = loadings.ncols();

// //     // Get kappa parameter (default is 4)
// //     let kappa = config.rotation.kappa as f64;

// //     // Create target matrix P by raising varimax loadings to power of kappa
// //     let mut target_matrix = DMatrix::zeros(n_rows, n_cols);
// //     for i in 0..n_rows {
// //         for j in 0..n_cols {
// //             // Get absolute value of loading
// //             let abs_loading = loadings[(i, j)].abs();

// //             // Preserve sign when raising to power of kappa
// //             let sign = if loadings[(i, j)] >= 0.0 { 1.0 } else { -1.0 };

// //             // Apply promax power transformation
// //             target_matrix[(i, j)] =
// //                 (sign * abs_loading.powf(kappa + 1.0)) /
// //                 (loadings[(i, j)].powi(2) / (n_rows as f64)).sqrt();
// //         }
// //     }

// //     // Normalize target matrix by column
// //     for j in 0..n_cols {
// //         let mut sum_squared = 0.0;
// //         for i in 0..n_rows {
// //             sum_squared += target_matrix[(i, j)].powi(2);
// //         }

// //         let norm = sum_squared.sqrt();
// //         if norm > 1e-10 {
// //             for i in 0..n_rows {
// //                 target_matrix[(i, j)] /= norm;
// //             }
// //         }
// //     }

// //     // Calculate transformation matrix L: L = (A'A)^(-1) A'P where A is the varimax loadings
// //     let a_transpose_a = loadings.transpose() * loadings;
// //     let a_transpose_a_inv = match a_transpose_a.try_inverse() {
// //         Some(inv) => inv,
// //         None => {
// //             return Err("Could not invert A'A matrix for Promax rotation".to_string());
// //         }
// //     };

// //     let a_transpose_p = loadings.transpose() * target_matrix;
// //     let transformation_matrix = a_transpose_a_inv * a_transpose_p;

// //     // Normalize the transformation matrix by column
// //     let mut normalized_transformation = DMatrix::zeros(n_cols, n_cols);
// //     for j in 0..n_cols {
// //         // Calculate the column norm
// //         let mut sum_squared = 0.0;
// //         for i in 0..n_cols {
// //             sum_squared += transformation_matrix[(i, j)].powi(2);
// //         }

// //         let norm = sum_squared.sqrt();
// //         if norm > 1e-10 {
// //             for i in 0..n_cols {
// //                 normalized_transformation[(i, j)] = transformation_matrix[(i, j)] / norm;
// //             }
// //         }
// //     }

// //     // Calculate factor correlations: R_ff = C (Q'Q)^(-1) C'
// //     // where Q is the normalized transformation matrix and C is a diagonal matrix

// //     // Calculate Q'Q
// //     let q_transpose_q = normalized_transformation.transpose() * normalized_transformation.clone();

// //     // Calculate (Q'Q)^(-1)
// //     let q_transpose_q_inv = match q_transpose_q.try_inverse() {
// //         Some(inv) => inv,
// //         None => {
// //             // If inversion fails, return identity
// //             DMatrix::identity(n_cols, n_cols)
// //         }
// //     };

// //     // Create diagonal matrix C with sqrt of diagonal elements of (Q'Q)^(-1)
// //     let mut c_matrix = DMatrix::zeros(n_cols, n_cols);
// //     for i in 0..n_cols {
// //         c_matrix[(i, i)] = q_transpose_q_inv[(i, i)].sqrt();
// //     }

// //     // Factor correlations: R_ff = C (Q'Q)^(-1) C'
// //     let factor_correlations = &c_matrix * &q_transpose_q_inv * c_matrix.transpose();

// //     // Calculate rotated loadings: X * Q * C^(-1)
// //     let mut c_inv = DMatrix::zeros(n_cols, n_cols);
// //     for i in 0..n_cols {
// //         if c_matrix[(i, i)] > 1e-10 {
// //             c_inv[(i, i)] = 1.0 / c_matrix[(i, i)];
// //         } else {
// //             c_inv[(i, i)] = 1.0;
// //         }
// //     }

// //     let rotated_loadings = loadings * normalized_transformation.clone() * c_inv;

// //     // Rearrange factors in descending order of variance explained
// //     let mut factor_variances = vec![0.0; n_cols];
// //     for j in 0..n_cols {
// //         for i in 0..n_rows {
// //             factor_variances[j] += rotated_loadings[(i, j)].powi(2);
// //         }
// //     }

// //     let mut indices: Vec<usize> = (0..n_cols).collect();
// //     indices.sort_by(|&i, &j|
// //         factor_variances[j].partial_cmp(&factor_variances[i]).unwrap_or(std::cmp::Ordering::Equal)
// //     );

// //     let mut sorted_loadings = DMatrix::zeros(n_rows, n_cols);
// //     let mut sorted_transform = DMatrix::zeros(n_cols, n_cols);
// //     let mut sorted_correlations = DMatrix::zeros(n_cols, n_cols);

// //     for (new_j, &old_j) in indices.iter().enumerate() {
// //         for i in 0..n_rows {
// //             sorted_loadings[(i, new_j)] = rotated_loadings[(i, old_j)];
// //         }

// //         for i in 0..n_cols {
// //             sorted_transform[(i, new_j)] = normalized_transformation[(i, old_j)];

// //             // Rearrange factor correlations
// //             for k in 0..n_cols {
// //                 sorted_correlations[(new_j, indices[k])] = factor_correlations[(old_j, k)];
// //                 sorted_correlations[(indices[k], new_j)] = factor_correlations[(k, old_j)];
// //             }
// //         }
// //     }

// //     Ok(RotationResult {
// //         rotated_loadings: sorted_loadings,
// //         transformation_matrix: sorted_transform,
// //         factor_correlations: Some(sorted_correlations),
// //     })
// // }




















// // =========================================================
// // Promax Rotation (SPSS-Compatible with SVD Solver)
// // =========================================================
// pub fn rotate_promax(
//     extraction_result: &ExtractionResult,
//     config: &FactorAnalysisConfig
// ) -> Result<RotationResult, String> {
    
//     // 1. Jalankan Varimax (Warm Start)
//     let varimax_result = rotate_varimax(extraction_result, config)?;
//     let varimax_loadings = &varimax_result.rotated_loadings;
    
//     let n_rows = varimax_loadings.nrows();
//     let n_cols = varimax_loadings.ncols();
    
//     // PENTING: SPSS Hardcoded Kappa = 4 untuk Promax standar.
//     // Jika config user berbeda, hasilnya akan beda. Kita paksa default 4 jika tidak diset spesifik.
//     let kappa = if config.rotation.kappa > 0 { config.rotation.kappa as f64 } else { 4.0 };

//     // 2. Kaiser Normalization (Re-normalize Varimax Loadings)
//     let mut h = vec![0.0; n_rows];
//     let mut a_norm = varimax_loadings.clone(); 

//     for i in 0..n_rows {
//         let mut ss = 0.0;
//         for j in 0..n_cols {
//             ss += varimax_loadings[(i, j)].powi(2);
//         }
//         h[i] = ss.sqrt().max(1e-12);
//         for j in 0..n_cols {
//             a_norm[(i, j)] /= h[i];
//         }
//     }

//     // 3. Konstruksi Target Matrix (P)
//     //    Rumus: P = |A|^(k+1) / A  =>  |A|^k * sign(A)
//     let mut p_mat = DMatrix::<f64>::zeros(n_rows, n_cols);
//     for i in 0..n_rows {
//         for j in 0..n_cols {
//             let val = a_norm[(i, j)];
//             p_mat[(i, j)] = val.abs().powf(kappa) * val.signum();
//         }
//     }

//     // 4. Hitung Transformasi Procrustes MENGGUNAKAN SVD (SOLUSI PRESISI)
//     //    Alih-alih (A'A)^-1 * A'P, kita selesaikan sistem linear: A * T = P
//     //    Ini meminimalkan error kuadrat terkecil ||AT - P||^2 dengan presisi numerik tinggi.
    
//     let svd = SVD::new(a_norm.clone(), true, true);
//     // solve menduga T dari A * T = P. Menggunakan SVD Pseudo-inverse.
//     let mut t_mat = svd.solve(&p_mat, 1e-12).map_err(|_| "SVD Solve failed in Promax")?;

//     // 5. Normalisasi T (Hendrickson-White Method)
//     //    Kita ingin diagonal(Inv(T'T)) = 1.
    
//     let tt = t_mat.transpose() * &t_mat;
//     let tt_inv = tt.clone().try_inverse().unwrap_or_else(|| DMatrix::identity(n_cols, n_cols));

//     // D = diag(sqrt(diagonal(TT_inv)))
//     let mut d_diag = DMatrix::<f64>::zeros(n_cols, n_cols);
//     for j in 0..n_cols {
//         let val = tt_inv[(j, j)];
//         // Pastikan tidak NaN/Negatif (safety)
//         d_diag[(j, j)] = if val > 0.0 { val.sqrt() } else { 1.0 };
//     }

//     // T_final = T_raw * D
//     t_mat = &t_mat * &d_diag;

//     // 6. Hitung Pattern, Correlation, dan Structure
//     let pattern_norm = &a_norm * &t_mat;

//     // Recalculate Phi based on normalized T
//     let tt_final = t_mat.transpose() * &t_mat;
//     let mut phi = tt_final.try_inverse().unwrap_or_else(|| DMatrix::identity(n_cols, n_cols));

//     // Force diagonal phi to exactly 1.0 (menghindari floating point error 0.99999)
//     for i in 0..n_cols {
//         phi[(i, i)] = 1.0;
//     }

//     // 7. De-normalize Pattern Matrix
//     let mut pattern = pattern_norm.clone();
//     for i in 0..n_rows {
//         for j in 0..n_cols {
//             pattern[(i, j)] *= h[i];
//         }
//     }

//     // 8. Sign Reflection (SPSS Compatibility)
//     //    Refleksi Pattern Matrix -> Refleksi T -> Refleksi Phi
//     for j in 0..n_cols {
//         let mut col_sum = 0.0;
//         for i in 0..n_rows {
//             col_sum += pattern[(i, j)];
//         }

//         if col_sum < 0.0 {
//             // Flip Pattern Column
//             for i in 0..n_rows { pattern[(i, j)] *= -1.0; }
//             // Flip T Column
//             for i in 0..n_cols { t_mat[(i, j)] *= -1.0; }
//             // Flip Phi (Correlation) off-diagonals
//             for k in 0..n_cols {
//                 if k != j {
//                     phi[(j, k)] *= -1.0;
//                     phi[(k, j)] *= -1.0;
//                 }
//             }
//         }
//     }

//     // 9. Sorting Components (Variance-based)
//     let mut col_stats: Vec<(usize, f64)> = (0..n_cols)
//         .map(|j| {
//             let ssl: f64 = (0..n_rows).map(|i| pattern[(i, j)].powi(2)).sum();
//             (j, ssl)
//         })
//         .collect();

//     col_stats.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
//     let new_indices: Vec<usize> = col_stats.iter().map(|x| x.0).collect();

//     // Reconstruct Sorted Matrices
//     let mut sorted_pattern = DMatrix::<f64>::zeros(n_rows, n_cols);
//     let mut sorted_t = DMatrix::<f64>::zeros(n_cols, n_cols);
//     let mut sorted_phi = DMatrix::<f64>::zeros(n_cols, n_cols);

//     for (new_col, &old_col) in new_indices.iter().enumerate() {
//         // Copy Pattern & T Cols
//         for i in 0..n_rows { sorted_pattern[(i, new_col)] = pattern[(i, old_col)]; }
//         for i in 0..n_cols { sorted_t[(i, new_col)] = t_mat[(i, old_col)]; }
        
//         // Copy Phi (Symmetric Reordering)
//         for (new_row, &old_row) in new_indices.iter().enumerate() {
//             sorted_phi[(new_row, new_col)] = phi[(old_row, old_col)];
//         }
//     }

//     Ok(RotationResult {
//         rotated_loadings: sorted_pattern,
//         transformation_matrix: sorted_t,
//         factor_correlations: Some(sorted_phi),
//     })
// }












// pub fn calculate_rotated_component_matrix(
//     data: &AnalysisData,
//     config: &FactorAnalysisConfig
// ) -> Result<RotatedComponentMatrix, String> {
//     let (data_matrix, var_names) = extract_data_matrix(data, config)?;
//     let corr_matrix = calculate_matrix(&data_matrix, "correlation")?;
//     let extraction_result = extract_factors(&corr_matrix, config, &var_names)?;
//     let rotation_result = rotate_factors(&extraction_result, config)?;

//     let mut components = HashMap::new();
//     let rotated_loadings = &rotation_result.rotated_loadings;
//     let n_rows = rotated_loadings.nrows();
//     let n_cols = rotated_loadings.ncols();

//     for (i, var_name) in var_names.iter().enumerate() {
//         if i < n_rows {
//             let mut loadings = Vec::with_capacity(n_cols);

//             for j in 0..n_cols {
//                 loadings.push(rotated_loadings[(i, j)]);
//             }

//             components.insert(var_name.clone(), loadings);
//         }
//     }

//     Ok(RotatedComponentMatrix {
//         components,
//         variable_order: var_names,
//     })
// }

// pub fn calculate_component_transformation_matrix(
//     data: &AnalysisData,
//     config: &FactorAnalysisConfig
// ) -> Result<ComponentTransformationMatrix, String> {
//     let (data_matrix, var_names) = extract_data_matrix(data, config)?;
//     let corr_matrix = calculate_matrix(&data_matrix, "correlation")?;
//     let extraction_result = extract_factors(&corr_matrix, config, &var_names)?;
//     let rotation_result = rotate_factors(&extraction_result, config)?;

//     // Create component transformation matrix directly
//     let transformation_matrix = &rotation_result.transformation_matrix;
//     let n_rows = transformation_matrix.nrows();
//     let n_cols = transformation_matrix.ncols();

//     let mut components = Vec::with_capacity(n_rows);

//     for i in 0..n_rows {
//         let mut row = Vec::with_capacity(n_cols);

//         for j in 0..n_cols {
//             row.push(transformation_matrix[(i, j)]);
//         }

//         components.push(row);
//     }

//     Ok(ComponentTransformationMatrix { components })
// }

// use crate::models::result::{PatternMatrix, StructureMatrix, ComponentCorrelationMatrix};

// pub fn calculate_pattern_matrix(
//     data: &AnalysisData,
//     config: &FactorAnalysisConfig
// ) -> Result<PatternMatrix, String> {
//     let (data_matrix, var_names) = extract_data_matrix(data, config)?;
//     let corr_matrix = calculate_matrix(&data_matrix, "correlation")?;
//     let extraction_result = extract_factors(&corr_matrix, config, &var_names)?;
//     let rotation_result = rotate_factors(&extraction_result, config)?;

//     let mut components = HashMap::new();
//     let pattern_loadings = &rotation_result.rotated_loadings;
//     let n_rows = pattern_loadings.nrows();
//     let n_cols = pattern_loadings.ncols();

//     for (i, var_name) in var_names.iter().enumerate() {
//         if i < n_rows {
//             let mut loadings = Vec::with_capacity(n_cols);

//             for j in 0..n_cols {
//                 loadings.push(pattern_loadings[(i, j)]);
//             }

//             components.insert(var_name.clone(), loadings);
//         }
//     }

//     Ok(PatternMatrix {
//         components,
//         variable_order: var_names,
//     })
// }

// pub fn calculate_structure_matrix(
//     data: &AnalysisData,
//     config: &FactorAnalysisConfig
// ) -> Result<StructureMatrix, String> {
//     let (data_matrix, var_names) = extract_data_matrix(data, config)?;
//     let corr_matrix = calculate_matrix(&data_matrix, "correlation")?;
//     let extraction_result = extract_factors(&corr_matrix, config, &var_names)?;
//     let rotation_result = rotate_factors(&extraction_result, config)?;

//     let pattern_loadings = &rotation_result.rotated_loadings;
//     let n_rows = pattern_loadings.nrows();
//     let n_cols = pattern_loadings.ncols();

//     let mut structure_loadings = pattern_loadings.clone();

//     if let Some(factor_correlations) = &rotation_result.factor_correlations {
//         structure_loadings = pattern_loadings * factor_correlations;
//     }

//     let mut components = HashMap::new();

//     for (i, var_name) in var_names.iter().enumerate() {
//         if i < n_rows {
//             let mut loadings = Vec::with_capacity(n_cols);

//             for j in 0..n_cols {
//                 loadings.push(structure_loadings[(i, j)]);
//             }

//             components.insert(var_name.clone(), loadings);
//         }
//     }

//     Ok(StructureMatrix {
//         components,
//         variable_order: var_names,
//     })
// }

// pub fn calculate_component_correlation_matrix(
//     data: &AnalysisData,
//     config: &FactorAnalysisConfig
// ) -> Result<ComponentCorrelationMatrix, String> {
//     let (data_matrix, var_names) = extract_data_matrix(data, config)?;
//     let corr_matrix = calculate_matrix(&data_matrix, "correlation")?;
//     let extraction_result = extract_factors(&corr_matrix, config, &var_names)?;
//     let rotation_result = rotate_factors(&extraction_result, config)?;

//     let mut correlations = Vec::new();

//     if let Some(factor_corrs) = &rotation_result.factor_correlations {
//         let n_cols = factor_corrs.ncols();

//         for i in 0..n_cols {
//             let mut row = Vec::with_capacity(n_cols);

//             for j in 0..n_cols {
//                 row.push(factor_corrs[(i, j)]);
//             }

//             correlations.push(row);
//         }
//     }

//     Ok(ComponentCorrelationMatrix {
//         correlations,
//     })
// }



































































































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



// pub fn rotate_oblimin(
//     extraction_result: &ExtractionResult,
//     config: &FactorAnalysisConfig
// ) -> Result<RotationResult, String> {
//     let unrotated_loadings = &extraction_result.loadings;
//     let n_rows = unrotated_loadings.nrows();
//     let n_cols = unrotated_loadings.ncols();
//     let delta = config.rotation.delta;

//     // 1. Kaiser Normalization
//     let mut h = vec![0.0; n_rows];
//     let mut a = unrotated_loadings.clone();
//     for i in 0..n_rows {
//         let ss: f64 = (0..n_cols).map(|j| unrotated_loadings[(i, j)].powi(2)).sum();
//         h[i] = ss.sqrt().max(1e-12);
//         for j in 0..n_cols {
//             a[(i, j)] /= h[i];
//         }
//     }

//     // 2. Initialize T
//     let mut t = DMatrix::<f64>::identity(n_cols, n_cols);
//     let mut t_inv = DMatrix::<f64>::identity(n_cols, n_cols);
    
//     let max_iter = config.rotation.max_iter as usize;
//     let tol = 1e-7;
    
//     for _ in 0..max_iter {
//         let t_old = t.clone();
        
//         // Pattern Matrix: L = A * (T^-1)'
//         let t_inv_trans = t_inv.transpose();
//         let l = &a * &t_inv_trans; // Gunakan & agar tidak move

//         // Calculate Gradient G
//         let mut g = DMatrix::<f64>::zeros(n_rows, n_cols);
//         for j in 0..n_cols {
//             let l_j_sq_sum: f64 = (0..n_rows).map(|i| l[(i, j)].powi(2)).sum();
//             for i in 0..n_rows {
//                 let term1 = l[(i, j)].powi(3);
//                 let term2 = (delta / n_rows as f64) * l[(i, j)] * l_j_sq_sum;
//                 g[(i, j)] = term1 - term2;
//             }
//         }

//         // FIX ERROR DISINI: Gunakan referensi (&) untuk semua operasi
//         // Grad = -A' * G * T_inv_trans * T_inv_trans'
//         let grad_t = -(&a.transpose() * &g * &t_inv_trans * t_inv_trans.transpose());
        
//         // Update T
//         t = &t - (0.5 * grad_t);
        
//         // Normalize T columns
//         for j in 0..n_cols {
//             let col_norm = t.column(j).norm();
//             for i in 0..n_cols { t[(i, j)] /= col_norm; }
//         }

//         t_inv = match t.clone().try_inverse() {
//             Some(inv) => inv,
//             None => break,
//         };

//         if (&t - &t_old).map(|v| v.abs()).sum() < tol { break; }
//     }

//     // 3. Final Pattern Matrix
//     let mut pattern = &a * t_inv.transpose();
//     for i in 0..n_rows {
//         for j in 0..n_cols { pattern[(i, j)] *= h[i]; }
//     }

//     // 4. Factor Correlation Matrix (Phi = T' * T)
//     let phi = t.transpose() * &t;

//     Ok(RotationResult {
//         rotated_loadings: pattern,
//         transformation_matrix: t,
//         factor_correlations: Some(phi),
//     })
// }





























// PERBAIKAN 2

// =========================================================
// Direct Oblimin Rotation (With Varimax Warm Start)
// =========================================================
pub fn rotate_oblimin(
    extraction_result: &ExtractionResult,
    config: &FactorAnalysisConfig
) -> Result<RotationResult, String> {
    
    // ---------------------------------------------------------
    // STEP 1: VARIMAX WARM START (RAHASIA SPSS MATCHING)
    // ---------------------------------------------------------
    // Kita jalankan Varimax terlebih dahulu untuk mendapatkan posisi awal 
    // yang mendekati solusi optimal. Ini mencegah terjebak di local minima.
    // Pastikan fungsi rotate_varimax sudah benar (karena Anda bilang sudah match SPSS).
    
    let varimax_result = rotate_varimax(extraction_result, config)?;
    let start_t = varimax_result.transformation_matrix; // Kita pakai T dari Varimax

    // Ambil data dasar
    let unrotated_loadings = &extraction_result.loadings;
    let n_rows = unrotated_loadings.nrows();
    let n_cols = unrotated_loadings.ncols();
    
    // Parameter Gamma/Delta (SPSS Default delta=0)
    let gamma = config.rotation.delta; 

    // ---------------------------------------------------------
    // STEP 2: KAISER NORMALIZATION
    // ---------------------------------------------------------
    let mut h = vec![0.0; n_rows];
    let mut a_mat = unrotated_loadings.clone(); // A = Normalized Loadings
    
    for i in 0..n_rows {
        let mut ss = 0.0;
        for j in 0..n_cols {
            ss += unrotated_loadings[(i, j)].powi(2);
        }
        h[i] = ss.sqrt().max(1e-12); 
        for j in 0..n_cols {
            a_mat[(i, j)] /= h[i];
        }
    }

    // ---------------------------------------------------------
    // STEP 3: INITIALIZATION (MENGGUNAKAN HASIL VARIMAX)
    // ---------------------------------------------------------
    // Disini perbedaannya. Jangan mulai dari Identity.
    // Mulai dari Varimax T.
    let mut t_mat = start_t; 

    // Setup Iterasi
    let max_iter = config.rotation.max_iter as usize;
    let tol = 1e-5;
    let mut alpha = 1.0; // Initial step size

    // ---------------------------------------------------------
    // STEP 4: OBLIMIN GRADIENT OPTIMIZATION
    // ---------------------------------------------------------
    
    // Pre-allocate matrix N untuk Oblimin weight
    // N_jm = 1 (j!=m), 0 (j=m) minus gamma/p
    let mut n_matrix = DMatrix::<f64>::zeros(n_cols, n_cols);
    for j in 0..n_cols {
        for m in 0..n_cols {
            if j != m { n_matrix[(j, m)] = 1.0; }
            n_matrix[(j, m)] -= gamma / n_rows as f64;
        }
    }

    let mut current_obj = oblimin_criterion_gpa(&(&a_mat * &t_mat), &n_matrix);

    for _iter in 0..max_iter {
        // L = A * T
        let l_mat = &a_mat * &t_mat;

        // --- Gradient Calculation (Standard GPA) ---
        // Rumus Gradient Oblimin Standard (sesuai GPArotation R package / Jennrich)
        // dQ = L * (L^2 . N)
        // G  = A' * dQ
        
        let mut l_sq = DMatrix::<f64>::zeros(n_rows, n_cols);
        for i in 0..n_rows {
            for j in 0..n_cols { l_sq[(i, j)] = l_mat[(i, j)].powi(2); }
        }
        
        // Element-wise multiplication implicit in calculation logic
        // Gradient Matrix Q
        let l2_n = &l_sq * &n_matrix;
        let mut dq = DMatrix::<f64>::zeros(n_rows, n_cols);
        for i in 0..n_rows {
            for j in 0..n_cols {
                dq[(i, j)] = l_mat[(i, j)] * l2_n[(i, j)];
            }
        }
        
        // Gradient G
        let g_mat = a_mat.transpose() * &dq;

        // --- Gradient Projection ---
        // P = G - T * diag(inv(T) * G)
        // Untuk Oblique rotation, kita proyeksikan gradient agar T tetap valid
        let t_inv = t_mat.clone().try_inverse().unwrap_or_else(|| DMatrix::identity(n_cols, n_cols));
        let x_mat = &t_inv * &g_mat; 
        
        let mut x_diag = DMatrix::<f64>::zeros(n_cols, n_cols);
        for i in 0..n_cols { x_diag[(i, i)] = x_mat[(i, i)]; }

        let gp = &g_mat - &t_mat * &x_diag;

        // Check Convergence
        let max_grad = gp.iter().map(|x| x.abs()).fold(0.0, f64::max);
        if max_grad < tol { break; }

        // --- Line Search ---
        let mut best_t = t_mat.clone();
        let mut found = false;
        let mut step = alpha;

        for _s in 0..10 {
            let mut t_new = &t_mat - step * &gp;
            
            // Constraint: Kolom T harus memiliki panjang normal di ruang invers
            // diag(inv(T'T)) = 1
            let tt = t_new.transpose() * &t_new;
            if let Some(inv_tt) = tt.try_inverse() {
                 let mut scale_diag = DMatrix::<f64>::zeros(n_cols, n_cols);
                 for k in 0..n_cols {
                     if inv_tt[(k,k)] > 0.0 {
                        scale_diag[(k,k)] = inv_tt[(k,k)].sqrt();
                     } else {
                        scale_diag[(k,k)] = 1.0;
                     }
                 }
                 t_new = t_new * scale_diag;
            }

            let l_new = &a_mat * &t_new;
            let obj_new = oblimin_criterion_gpa(&l_new, &n_matrix);

            if obj_new < current_obj {
                current_obj = obj_new;
                best_t = t_new;
                found = true;
                step *= 1.2; 
                break;
            }
            step *= 0.5;
        }

        t_mat = best_t;
        alpha = step;
        if !found && alpha < 1e-7 { break; }
    }

    // ---------------------------------------------------------
    // STEP 5: DE-NORMALIZATION
    // ---------------------------------------------------------
    let l_final = &a_mat * &t_mat;
    let mut pattern = DMatrix::<f64>::zeros(n_rows, n_cols);
    for i in 0..n_rows {
        for j in 0..n_cols {
            pattern[(i, j)] = l_final[(i, j)] * h[i];
        }
    }

    // ---------------------------------------------------------
    // STEP 6: SIGN REFLECTION (SPSS COMPATIBILITY)
    // ---------------------------------------------------------
    for j in 0..n_cols {
        let mut col_sum = 0.0;
        for i in 0..n_rows {
            // SPSS ULS method usually looks at raw sum or sum of cubes.
            // Kita gunakan raw sum.
            col_sum += pattern[(i, j)];
        }

        if col_sum < 0.0 {
            // Flip Pattern Column
            for i in 0..n_rows { pattern[(i, j)] *= -1.0; }
            // Flip T Column (Agar korelasi ikut terbalik)
            for k in 0..n_cols { t_mat[(k, j)] *= -1.0; }
        }
    }

    // ---------------------------------------------------------
    // STEP 7: CALCULATE PHI & SORTING
    // ---------------------------------------------------------
    let tt = t_mat.transpose() * &t_mat;
    let phi = tt.try_inverse().unwrap_or_else(|| DMatrix::identity(n_cols, n_cols));

    // Sorting by Variance (SSL)
    let mut col_stats: Vec<(usize, f64)> = (0..n_cols)
        .map(|j| {
            let ssl: f64 = (0..n_rows).map(|i| pattern[(i, j)].powi(2)).sum();
            (j, ssl)
        })
        .collect();

    col_stats.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
    let new_indices: Vec<usize> = col_stats.iter().map(|x| x.0).collect();

    // Reordering Matrices
    let mut sorted_pattern = DMatrix::<f64>::zeros(n_rows, n_cols);
    let mut sorted_t = DMatrix::<f64>::zeros(n_cols, n_cols);
    
    for (new_idx, &old_idx) in new_indices.iter().enumerate() {
        for i in 0..n_rows { sorted_pattern[(i, new_idx)] = pattern[(i, old_idx)]; }
        for i in 0..n_cols { sorted_t[(i, new_idx)] = t_mat[(i, old_idx)]; }
    }

    // Reorder Correlation Matrix (Symmetric)
    let mut sorted_phi = DMatrix::<f64>::zeros(n_cols, n_cols);
    for (new_row, &old_row) in new_indices.iter().enumerate() {
        for (new_col, &old_col) in new_indices.iter().enumerate() {
            sorted_phi[(new_row, new_col)] = phi[(old_row, old_col)];
        }
    }

    Ok(RotationResult {
        rotated_loadings: sorted_pattern,
        transformation_matrix: sorted_t,
        factor_correlations: Some(sorted_phi),
    })
}

// Helper untuk GPA Oblimin Criterion (Tetap sama, pastikan ada di file)
fn oblimin_criterion_gpa(l_mat: &DMatrix<f64>, n_matrix: &DMatrix<f64>) -> f64 {
    let n_rows = l_mat.nrows();
    let n_cols = l_mat.ncols();
    let mut l_sq = DMatrix::<f64>::zeros(n_rows, n_cols);
    for i in 0..n_rows {
        for j in 0..n_cols {
            l_sq[(i, j)] = l_mat[(i, j)].powi(2);
        }
    }
    let l2_n = &l_sq * n_matrix;
    let mut sum = 0.0;
    for i in 0..n_rows {
        for j in 0..n_cols {
            sum += l_sq[(i, j)] * l2_n[(i, j)];
        }
    }
    sum / 4.0
}


































// // Promax rotation - starts with varimax and then relaxes orthogonality
// pub fn rotate_promax(
//     extraction_result: &ExtractionResult,
//     config: &FactorAnalysisConfig
// ) -> Result<RotationResult, String> {
//     // First perform a varimax rotation
//     let varimax_result = rotate_varimax(extraction_result, config)?;
//     let loadings = &varimax_result.rotated_loadings;
//     let n_rows = loadings.nrows();
//     let n_cols = loadings.ncols();

//     // Get kappa parameter (default is 4)
//     let kappa = config.rotation.kappa as f64;

//     // Create target matrix P by raising varimax loadings to power of kappa
//     let mut target_matrix = DMatrix::zeros(n_rows, n_cols);
//     for i in 0..n_rows {
//         for j in 0..n_cols {
//             // Get absolute value of loading
//             let abs_loading = loadings[(i, j)].abs();

//             // Preserve sign when raising to power of kappa
//             let sign = if loadings[(i, j)] >= 0.0 { 1.0 } else { -1.0 };

//             // Apply promax power transformation
//             target_matrix[(i, j)] =
//                 (sign * abs_loading.powf(kappa + 1.0)) /
//                 (loadings[(i, j)].powi(2) / (n_rows as f64)).sqrt();
//         }
//     }

//     // Normalize target matrix by column
//     for j in 0..n_cols {
//         let mut sum_squared = 0.0;
//         for i in 0..n_rows {
//             sum_squared += target_matrix[(i, j)].powi(2);
//         }

//         let norm = sum_squared.sqrt();
//         if norm > 1e-10 {
//             for i in 0..n_rows {
//                 target_matrix[(i, j)] /= norm;
//             }
//         }
//     }

//     // Calculate transformation matrix L: L = (A'A)^(-1) A'P where A is the varimax loadings
//     let a_transpose_a = loadings.transpose() * loadings;
//     let a_transpose_a_inv = match a_transpose_a.try_inverse() {
//         Some(inv) => inv,
//         None => {
//             return Err("Could not invert A'A matrix for Promax rotation".to_string());
//         }
//     };

//     let a_transpose_p = loadings.transpose() * target_matrix;
//     let transformation_matrix = a_transpose_a_inv * a_transpose_p;

//     // Normalize the transformation matrix by column
//     let mut normalized_transformation = DMatrix::zeros(n_cols, n_cols);
//     for j in 0..n_cols {
//         // Calculate the column norm
//         let mut sum_squared = 0.0;
//         for i in 0..n_cols {
//             sum_squared += transformation_matrix[(i, j)].powi(2);
//         }

//         let norm = sum_squared.sqrt();
//         if norm > 1e-10 {
//             for i in 0..n_cols {
//                 normalized_transformation[(i, j)] = transformation_matrix[(i, j)] / norm;
//             }
//         }
//     }

//     // Calculate factor correlations: R_ff = C (Q'Q)^(-1) C'
//     // where Q is the normalized transformation matrix and C is a diagonal matrix

//     // Calculate Q'Q
//     let q_transpose_q = normalized_transformation.transpose() * normalized_transformation.clone();

//     // Calculate (Q'Q)^(-1)
//     let q_transpose_q_inv = match q_transpose_q.try_inverse() {
//         Some(inv) => inv,
//         None => {
//             // If inversion fails, return identity
//             DMatrix::identity(n_cols, n_cols)
//         }
//     };

//     // Create diagonal matrix C with sqrt of diagonal elements of (Q'Q)^(-1)
//     let mut c_matrix = DMatrix::zeros(n_cols, n_cols);
//     for i in 0..n_cols {
//         c_matrix[(i, i)] = q_transpose_q_inv[(i, i)].sqrt();
//     }

//     // Factor correlations: R_ff = C (Q'Q)^(-1) C'
//     let factor_correlations = &c_matrix * &q_transpose_q_inv * c_matrix.transpose();

//     // Calculate rotated loadings: X * Q * C^(-1)
//     let mut c_inv = DMatrix::zeros(n_cols, n_cols);
//     for i in 0..n_cols {
//         if c_matrix[(i, i)] > 1e-10 {
//             c_inv[(i, i)] = 1.0 / c_matrix[(i, i)];
//         } else {
//             c_inv[(i, i)] = 1.0;
//         }
//     }

//     let rotated_loadings = loadings * normalized_transformation.clone() * c_inv;

//     // Rearrange factors in descending order of variance explained
//     let mut factor_variances = vec![0.0; n_cols];
//     for j in 0..n_cols {
//         for i in 0..n_rows {
//             factor_variances[j] += rotated_loadings[(i, j)].powi(2);
//         }
//     }

//     let mut indices: Vec<usize> = (0..n_cols).collect();
//     indices.sort_by(|&i, &j|
//         factor_variances[j].partial_cmp(&factor_variances[i]).unwrap_or(std::cmp::Ordering::Equal)
//     );

//     let mut sorted_loadings = DMatrix::zeros(n_rows, n_cols);
//     let mut sorted_transform = DMatrix::zeros(n_cols, n_cols);
//     let mut sorted_correlations = DMatrix::zeros(n_cols, n_cols);

//     for (new_j, &old_j) in indices.iter().enumerate() {
//         for i in 0..n_rows {
//             sorted_loadings[(i, new_j)] = rotated_loadings[(i, old_j)];
//         }

//         for i in 0..n_cols {
//             sorted_transform[(i, new_j)] = normalized_transformation[(i, old_j)];

//             // Rearrange factor correlations
//             for k in 0..n_cols {
//                 sorted_correlations[(new_j, indices[k])] = factor_correlations[(old_j, k)];
//                 sorted_correlations[(indices[k], new_j)] = factor_correlations[(k, old_j)];
//             }
//         }
//     }

//     Ok(RotationResult {
//         rotated_loadings: sorted_loadings,
//         transformation_matrix: sorted_transform,
//         factor_correlations: Some(sorted_correlations),
//     })
// }




















pub fn rotate_promax(
    extraction_result: &ExtractionResult,
    config: &FactorAnalysisConfig
) -> Result<RotationResult, String> {
    
    // 1. Get Varimax Result (Must be strict!)
    let varimax_result = rotate_varimax(extraction_result, config)?;
    let varimax_loadings = &varimax_result.rotated_loadings; // Ini sudah de-normalized
    
    let n_rows = varimax_loadings.nrows();
    let n_cols = varimax_loadings.ncols();
    let kappa = config.rotation.kappa.max(1) as f64; 

    // 2. Re-apply Kaiser Normalization (Konsisten dengan Varimax)
    //    Kita hitung 'h' dari varimax_loadings. Karena rotasi orthogonal,
    //    SS per baris tidak berubah dari data asli.
    let mut h = vec![0.0; n_rows];
    let mut a_norm = varimax_loadings.clone(); 

    for i in 0..n_rows {
        let mut ss = 0.0;
        for j in 0..n_cols {
            ss += varimax_loadings[(i, j)].powi(2);
        }
        h[i] = ss.sqrt().max(1e-12);
        for j in 0..n_cols {
            a_norm[(i, j)] /= h[i];
        }
    }

    // 3. Construct Target Matrix (P)
    //    SPSS: P_ij = |A_ij|^k * sign(A_ij)
    let mut p_mat = DMatrix::<f64>::zeros(n_rows, n_cols);
    for i in 0..n_rows {
        for j in 0..n_cols {
            let val = a_norm[(i, j)];
            p_mat[(i, j)] = val.abs().powf(kappa) * val.signum();
        }
    }

    // 4. Solve for Transformation T:  A * T = P
    //    Kita gunakan SVD Solver untuk stabilitas maksimal pada ULS data.
    let svd = SVD::new(a_norm.clone(), true, true);
    // Menggunakan epsilon kecil untuk threshold singular values
    let mut t_mat = svd.solve(&p_mat, 1e-12).map_err(|_| "SVD Solve failed in Promax")?;

    // 5. Normalize T (Hendrickson-White)
    //    Agar diagonal (Inv(T'T)) bernilai 1.
    let tt = t_mat.transpose() * &t_mat;
    let tt_inv = tt.try_inverse().unwrap_or_else(|| DMatrix::identity(n_cols, n_cols));

    let mut d_diag = DMatrix::<f64>::zeros(n_cols, n_cols);
    for j in 0..n_cols {
        let val = tt_inv[(j, j)];
        d_diag[(j, j)] = if val > 0.0 { val.sqrt() } else { 1.0 };
    }

    // T_final = T * D
    t_mat = &t_mat * &d_diag;

    // 6. Calculate Matrices
    let mut phi = (t_mat.transpose() * &t_mat).try_inverse().unwrap_or_else(|| DMatrix::identity(n_cols, n_cols));
    
    // Force diagonal exactly 1.0
    for i in 0..n_cols { phi[(i, i)] = 1.0; }

    // Pattern = A_norm * T
    let pattern_norm = &a_norm * &t_mat;
    
    // De-normalize Pattern
    let mut pattern = pattern_norm.clone();
    for i in 0..n_rows {
        for j in 0..n_cols {
            pattern[(i, j)] *= h[i];
        }
    }

    // 7. SPSS Sign Reflection
    //    Reflect Pattern -> Reflect T -> Reflect Phi (Row & Col)
    for j in 0..n_cols {
        let mut col_sum = 0.0;
        for i in 0..n_rows { col_sum += pattern[(i, j)]; }

        if col_sum < 0.0 {
            for i in 0..n_rows { pattern[(i, j)] *= -1.0; }
            for i in 0..n_cols { t_mat[(i, j)] *= -1.0; }
            // Flip correlations for this factor
            for k in 0..n_cols {
                if k != j {
                    phi[(j, k)] *= -1.0;
                    phi[(k, j)] *= -1.0;
                }
            }
        }
    }

    // 8. Sorting
    let mut col_stats: Vec<(usize, f64)> = (0..n_cols)
        .map(|j| {
            let ssl = (0..n_rows).map(|i| pattern[(i, j)].powi(2)).sum();
            (j, ssl)
        }).collect();
    
    col_stats.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
    let new_indices: Vec<usize> = col_stats.iter().map(|x| x.0).collect();

    let mut sorted_pattern = DMatrix::<f64>::zeros(n_rows, n_cols);
    let mut sorted_t = DMatrix::<f64>::zeros(n_cols, n_cols);
    let mut sorted_phi = DMatrix::<f64>::zeros(n_cols, n_cols);

    for (new_col, &old_col) in new_indices.iter().enumerate() {
        for i in 0..n_rows { sorted_pattern[(i, new_col)] = pattern[(i, old_col)]; }
        for i in 0..n_cols { sorted_t[(i, new_col)] = t_mat[(i, old_col)]; }
        for (new_row, &old_row) in new_indices.iter().enumerate() {
            sorted_phi[(new_row, new_col)] = phi[(old_row, old_col)];
        }
    }

    Ok(RotationResult {
        rotated_loadings: sorted_pattern,
        transformation_matrix: sorted_t,
        factor_correlations: Some(sorted_phi),
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