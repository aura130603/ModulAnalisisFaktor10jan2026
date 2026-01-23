// perbaikan 17/1/2026

use std::collections::HashMap;
use nalgebra::DMatrix;
use super::matrix::calculate_raw_variances;
use super::core::{ calculate_matrix, extract_data_matrix, extract_factors, rotate_factors };
use crate::models::{
    config::{FactorAnalysisConfig,ExtractionMethod,},
    data::AnalysisData,
    result::{
        Communalities,
        ComponentCorrelationMatrix,
        ComponentMatrix,
        ComponentScoreCoefficientMatrix,
        ComponentScoreCovarianceMatrix,
        ComponentTransformationMatrix,
        PatternMatrix,
        ReproducedCorrelations,
        ReproducedCovariances,
        RotatedComponentMatrix,
        RotationResult,
        ScreePlot,
        StructureMatrix,
        TotalVarianceComponent,
        TotalVarianceExplained,
        TotalVarianceBlock,
    },
};

// // =========================================================================
// // 1. Communalities
// // =========================================================================
// pub fn calculate_communalities(
//     data: &AnalysisData,
//     config: &FactorAnalysisConfig
// ) -> Result<Communalities, String> {

//     let (data_matrix, var_names) = extract_data_matrix(data, config)?;
//     let is_covariance_extraction = config.extraction.covariance;

//     let matrix_type = if is_covariance_extraction {
//         "covariance"
//     } else if config.extraction.correlation {
//         "correlation"
//     } else {
//         "correlation" 
//     };

//     let matrix_for_extraction = calculate_matrix(&data_matrix, matrix_type)?; 
//     let extraction_result = extract_factors(&matrix_for_extraction, config, &var_names)?;

//     // --- PERBAIKAN LOGIKA SUPPRESS (MENYEMBUNYIKAN KOLOM EXTRACTION) ---
//     // SPSS menyembunyikan kolom extraction pada ML jika terjadi "Heywood Case" (Communalities >= 1.0)
//     // atau jika solusi tidak valid.

//     // Tambahkan ExtractionMethod::PrincipalAxisFactoring ke dalam logika suppress.
//     // Kita suppress jika terjadi Heywood Case (nilai >= 0.9999) atau gagal konvergensi (nilai 0).
//     // Pada gambar Anda, VAR5 bernilai 1.1712, jadi kondisi c >= 0.9999 akan bernilai TRUE.
//     // Tambahkan pengecekan .is_nan() dan .is_infinite()
//     let suppress_extraction = match config.extraction.method {
//         ExtractionMethod::GeneralizedLeastSquares | ExtractionMethod::MaximumLikelihood | ExtractionMethod::PrincipalAxisFactoring => {
//             extraction_result.communalities.iter().any(|&c| {
//                 c.is_nan() ||           // Cek jika nilainya NaN (Not a Number)
//                 c.is_infinite() ||      // Cek jika nilainya Infinity
//                 c >= 0.9999 ||          // Cek Heywood Case
//                 c.abs() < 1e-6          // Cek jika nilai 0 (gagal ekstraksi)
//             })
//         },
//         _ => false 
//     };

//     // --- LOGIKA NILAI INITIAL ---
//     let initial_values: Vec<f64> = match config.extraction.method {
//         ExtractionMethod::PrincipalComponents => vec![1.0; var_names.len()],
//         _ => {
//             let corr_matrix = calculate_matrix(&data_matrix, "correlation")?;
//             match corr_matrix.try_inverse() {
//                 Some(inv) => {
//                     (0..var_names.len())
//                         .map(|i| {
//                             let smc = 1.0 - 1.0 / inv[(i, i)];
//                             if smc < 0.0 { 0.0 } else { smc }
//                         })
//                         .collect()
//                 },
//                 None => vec![1.0; var_names.len()] 
//             }
//         }
//     };

//     let mut raw_initial = HashMap::new();
//     let mut rescaled_initial = HashMap::new();
//     let mut extraction = HashMap::new();

//     let raw_variances = calculate_raw_variances(&data_matrix)?; 
    
//     for (i, var_name) in var_names.iter().enumerate() {
//         // Raw Initial
//         raw_initial.insert(var_name.clone(), raw_variances[i]);

//         // Rescaled Initial
//         if i < initial_values.len() {
//              rescaled_initial.insert(var_name.clone(), initial_values[i]);
//         } else {
//              rescaled_initial.insert(var_name.clone(), 1.0);
//         }

//         // Extraction Communality
//         // Hanya masukkan ke HashMap jika TIDAK di-suppress.
//         // Jika suppress == true, Map ini akan kosong.
//         if !suppress_extraction {
//             if i < extraction_result.communalities.len() {
//                 extraction.insert(var_name.clone(), extraction_result.communalities[i]);
//             }
//         }
//     }

//     Ok(Communalities {
//         raw_initial,
//         rescaled_initial,
//         extraction, // Map ini kosong jika ML bermasalah/Heywood case
//         variable_order: var_names,
//         extraction_matrix_type: matrix_type.to_string(),
//     })
// }


// =========================================================================
// 1. Communalities
// =========================================================================
pub fn calculate_communalities(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<Communalities, String> {

    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    let is_covariance_extraction = config.extraction.covariance;

    let matrix_type = if is_covariance_extraction {
        "covariance"
    } else if config.extraction.correlation {
        "correlation"
    } else {
        "correlation" 
    };

    // 1. Lakukan Ekstraksi Faktor
    let matrix_for_extraction = calculate_matrix(&data_matrix, matrix_type)?; 
    let extraction_result = extract_factors(&matrix_for_extraction, config, &var_names)?;

    // --- LOGIKA SUPPRESS (MENYEMBUNYIKAN KOLOM EXTRACTION) ---
    // Suppress jika terjadi Heywood Case (>= 0.9999), NaN, Infinite, atau gagal (0.0)
    // Berlaku untuk metode iteratif (PAF, ML, GLS)
    let suppress_extraction = match config.extraction.method {
        ExtractionMethod::GeneralizedLeastSquares | ExtractionMethod::MaximumLikelihood | ExtractionMethod::PrincipalAxisFactoring => {
            extraction_result.communalities.iter().any(|&c| {
                c.is_nan() ||           // Cek NaN
                c.is_infinite() ||      // Cek Infinity
                c >= 0.9999 ||          // Cek Heywood Case
                c.abs() < 1e-6          // Cek Gagal/Zero
            })
        },
        _ => false 
    };

    // --- PERSIAPAN DATA INITIAL ---
    
    // A. Hitung Varians Murni (Raw Variances) dari data
    // Digunakan untuk kolom "Raw Initial" pada PCA atau sebagai pengali pada PAF Covariance
    let raw_variances = calculate_raw_variances(&data_matrix)?; 

    // B. Hitung Squared Multiple Correlations (SMC)
    // Ini selalu dihitung dari matriks KORELASI, tidak peduli metode ekstraksinya apa.
    // SMC = 1 - (1 / R_ii_inverse)
    let corr_matrix = calculate_matrix(&data_matrix, "correlation")?;
    let smc_values: Vec<f64> = match corr_matrix.try_inverse() {
        Some(inv) => {
            (0..var_names.len())
                .map(|i| {
                    let r_ii = inv[(i, i)];
                    // Pastikan tidak negatif dan valid
                    if r_ii > 0.0 { (1.0 - 1.0 / r_ii).max(0.0) } else { 0.0 }
                })
                .collect()
        },
        None => vec![0.0; var_names.len()] // Jika singular, SMC dianggap 0 atau handling lain (SPSS biasanya kosong/error)
    };

    let mut raw_initial = HashMap::new();
    let mut rescaled_initial = HashMap::new();
    let mut extraction = HashMap::new();

    for (i, var_name) in var_names.iter().enumerate() {
        
        // --- LOGIKA PENGISIAN INITIAL VALUES (MATCH SPSS) ---
        match config.extraction.method {
            ExtractionMethod::PrincipalComponents => {
                // KASUS PCA:
                // Rescaled Initial: Selalu 1.0
                // Raw Initial: Varians (jika Covariance) atau 1.0 (jika Correlation)
                rescaled_initial.insert(var_name.clone(), 1.0);
                
                if is_covariance_extraction {
                    raw_initial.insert(var_name.clone(), raw_variances[i]);
                } else {
                    raw_initial.insert(var_name.clone(), 1.0);
                }
            },
            _ => {
                // KASUS FACTOR ANALYSIS (PAF, ML, ULS, dll):
                // Rescaled Initial: Nilai SMC
                let smc = if i < smc_values.len() { smc_values[i] } else { 0.0 };
                rescaled_initial.insert(var_name.clone(), smc);

                // Raw Initial:
                if is_covariance_extraction {
                    // PENTING: Untuk Covariance, Initial = SMC * Variance
                    // Ini yang memperbaiki selisih angka Anda dengan SPSS
                    let raw_val = smc * raw_variances[i];
                    raw_initial.insert(var_name.clone(), raw_val);
                } else {
                    // Untuk Correlation, Initial = SMC
                    raw_initial.insert(var_name.clone(), smc);
                }
            }
        }

        // --- PENGISIAN EXTRACTION VALUES ---
        // Masukkan hanya jika tidak di-suppress (Heywood case aman)
        if !suppress_extraction {
            if i < extraction_result.communalities.len() {
                extraction.insert(var_name.clone(), extraction_result.communalities[i]);
            }
        }
    }

    Ok(Communalities {
        raw_initial,
        rescaled_initial,
        extraction, // Map ini kosong jika Heywood case terjadi pada metode iteratif
        variable_order: var_names,
        extraction_matrix_type: matrix_type.to_string(),
    })
}


// =========================================================================
// 2. Total Variance Explained (Fixed: Using matches! macro)
// =========================================================================

// Helper closure
fn create_components(eigenvalues: &[f64], total_variance: f64) -> Vec<TotalVarianceComponent> {
    let mut components = Vec::new();
    let mut cumulative = 0.0;
    
    for &eig in eigenvalues {
        let percent = if total_variance > 0.0 { (eig / total_variance) * 100.0 } else { 0.0 };
        cumulative += percent;
        
        components.push(TotalVarianceComponent {
            total: eig,
            percent_of_variance: percent,
            cumulative_percent: cumulative,
        });
    }
    components
}

pub fn calculate_total_variance_explained(
    initial_eigenvalues: &[f64],    
    extraction_eigenvalues: &[f64], 
    total_variance: f64,
    _n_variables: usize,
    matrix_type: &str,
    suppress_extraction: bool,
) -> TotalVarianceExplained {

    match matrix_type {
        "correlation" => {
            let initial = create_components(initial_eigenvalues, total_variance);
            
            let (extraction, rotation) = if suppress_extraction {
                (Vec::new(), None) // Kosongkan jika ML error
            } else {
                let ext = create_components(extraction_eigenvalues, total_variance);
                (ext.clone(), Some(ext)) 
            };

            TotalVarianceExplained {
                blocks: vec![
                    TotalVarianceBlock {
                        label: "Component".to_string(),
                        initial,
                        extraction,
                        rotation,
                    }
                ],
                extraction_matrix_type: "correlation".to_string(),
            }
        }

        "covariance" => {
            let raw_initial = create_components(initial_eigenvalues, total_variance);
            
            let raw_extraction = if suppress_extraction {
                Vec::new() // Kosongkan
            } else {
                create_components(extraction_eigenvalues, total_variance)
            };

            let rescaled_initial = raw_initial.clone();
            let rescaled_extraction = raw_extraction.clone();

            TotalVarianceExplained {
                blocks: vec![
                    TotalVarianceBlock {
                        label: "Raw".to_string(),
                        initial: raw_initial,
                        extraction: raw_extraction,
                        rotation: None,
                    },
                    TotalVarianceBlock {
                        label: "Rescaled".to_string(),
                        initial: rescaled_initial,
                        extraction: rescaled_extraction,
                        rotation: None,
                    },
                ],
                extraction_matrix_type: "covariance".to_string(),
            }
        }

        _ => panic!("Unknown matrix type"),
    }
}

pub fn calculate_total_variance_explained_from_data(
    data: &AnalysisData,
    config: &FactorAnalysisConfig,
) -> Result<TotalVarianceExplained, String> {

    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    let n_variables = var_names.len();

    let is_covariance = config.extraction.covariance;
    let matrix_type = if is_covariance { "covariance" } else { "correlation" };

    let matrix = calculate_matrix(&data_matrix, matrix_type)?;

    // STEP A: HITUNG INITIAL EIGENVALUES
    let eigen_decomp = matrix.clone().symmetric_eigen();
    let mut initial_eigenvalues: Vec<f64> = eigen_decomp.eigenvalues.data.as_vec().clone();
    initial_eigenvalues.sort_by(|a, b| b.partial_cmp(a).unwrap_or(std::cmp::Ordering::Equal));

    // STEP B: HITUNG EXTRACTION EIGENVALUES
    let extraction_result = extract_factors(&matrix, config, &var_names)?;

    let suppress_extraction = match config.extraction.method {
        ExtractionMethod::GeneralizedLeastSquares | ExtractionMethod::MaximumLikelihood | ExtractionMethod::PrincipalAxisFactoring => {
            extraction_result.communalities.iter().any(|&c| {
                c.is_nan() ||           // Cek NaN
                c.is_infinite() ||      // Cek Infinite
                c >= 0.9999 ||          // Cek Heywood Case
                c.abs() < 1e-6          // Cek 0
            })
        },
        _ => false
    };

    let k = extraction_result.n_factors;
    let limit = std::cmp::min(k, extraction_result.eigenvalues.len());
    let extraction_eigenvalues = extraction_result.eigenvalues[0..limit].to_vec();

    // Hitung Total Variance
    let total_variance: f64 = if is_covariance {
        initial_eigenvalues.iter().sum()
    } else {
        n_variables as f64
    };

    Ok(calculate_total_variance_explained(
        &initial_eigenvalues,
        &extraction_eigenvalues,
        total_variance,
        n_variables,
        matrix_type,
        suppress_extraction, 
    ))
}

// =========================================================================
// 3. FUNGSI LAINNYA (Original Code - Tidak Ada Perubahan)
// =========================================================================

pub fn calculate_component_matrix(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<ComponentMatrix, String> {

    let (data_matrix, var_names) = extract_data_matrix(data, config)?;

    let matrix_type = if config.extraction.covariance {
        "covariance"
    } else {
        "correlation"
    };

    let matrix = calculate_matrix(&data_matrix, matrix_type)?;
    let extraction_result = extract_factors(&matrix, config, &var_names)?;

    let mut loadings = extraction_result.loadings.clone();
    let (n_rows, n_cols) = loadings.shape();

    for col in 0..n_cols {
        let mut sum_cubes = 0.0;
        for row in 0..n_rows {
            sum_cubes += loadings[(row, col)].powi(3);
        }
        if sum_cubes < 0.0 {
            for row in 0..n_rows {
                loadings[(row, col)] *= -1.0;
            }
        }
    }

    let mut components = HashMap::new();
    for (i, var_name) in var_names.iter().enumerate() {
        let mut row = Vec::with_capacity(n_cols);
        for j in 0..n_cols {
            row.push(loadings[(i, j)]);
        }
        components.insert(var_name.clone(), row);
    }

    Ok(ComponentMatrix {
        components,
        variable_order: var_names,
    })
}

pub fn calculate_reproduced_correlations(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<ReproducedCorrelations, String> {
    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    let corr_matrix = calculate_matrix(&data_matrix, "correlation")?;
    let extraction_result = extract_factors(&corr_matrix, config, &var_names)?;

    let k = extraction_result.n_factors;
    let mut reproduced_correlation = HashMap::new();
    let mut residual = HashMap::new();

    let loadings = &extraction_result.loadings;
    let loadings_k = if k < loadings.ncols() {
        loadings.columns(0, k).into_owned()
    } else {
        loadings.clone()
    };

    let reproduced_matrix = &loadings_k * loadings_k.transpose();

    for (i, var_name) in var_names.iter().enumerate() {
        let mut var_reproduced = HashMap::new();
        let mut var_residual = HashMap::new();

        for (j, other_var) in var_names.iter().enumerate() {
            let repro_corr = if i < reproduced_matrix.nrows() && j < reproduced_matrix.ncols() {
                reproduced_matrix[(i, j)]
            } else { 0.0 };
            var_reproduced.insert(other_var.clone(), repro_corr);

            let orig_corr = if i < corr_matrix.nrows() && j < corr_matrix.ncols() {
                corr_matrix[(i, j)]
            } else {
                if i == j { 1.0 } else { 0.0 }
            };

            let residual_corr = orig_corr - repro_corr;
            var_residual.insert(other_var.clone(), residual_corr);
        }
        reproduced_correlation.insert(var_name.clone(), var_reproduced);
        residual.insert(var_name.clone(), var_residual);
    }

    Ok(ReproducedCorrelations {
        reproduced_correlation,
        residual,
        variable_order: var_names,
    })
}

// pub fn calculate_reproduced_covariances(
//     data: &AnalysisData,
//     config: &FactorAnalysisConfig
// ) -> Result<ReproducedCovariances, String> {
//     let (data_matrix, var_names) = extract_data_matrix(data, config)?;
//     let cov_matrix = calculate_matrix(&data_matrix, "covariance")?;
//     let extraction_result = extract_factors(&cov_matrix, config, &var_names)?;

//     let k = extraction_result.n_factors;
//     let mut reproduced_covariance = HashMap::new();
//     let mut residual = HashMap::new();

//     let loadings = &extraction_result.loadings;
//     let loadings_k = if k < loadings.ncols() {
//         loadings.columns(0, k).into_owned()
//     } else {
//         loadings.clone()
//     };

//     let reproduced_matrix = &loadings_k * loadings_k.transpose();

//     for (i, var_name) in var_names.iter().enumerate() {
//         let mut var_reproduced = HashMap::new();
//         let mut var_residual = HashMap::new();

//         for (j, other_var) in var_names.iter().enumerate() {
//             let repro_cov = if i < reproduced_matrix.nrows() && j < reproduced_matrix.ncols() {
//                 reproduced_matrix[(i, j)]
//             } else { 0.0 };
//             var_reproduced.insert(other_var.clone(), repro_cov);

//             let orig_cov = if i < cov_matrix.nrows() && j < cov_matrix.ncols() {
//                 cov_matrix[(i, j)]
//             } else { 0.0 };

//             let residual_cov = orig_cov - repro_cov;
//             var_residual.insert(other_var.clone(), residual_cov);
//         }
//         reproduced_covariance.insert(var_name.clone(), var_reproduced);
//         residual.insert(var_name.clone(), var_residual);
//     }

//     Ok(ReproducedCovariances {
//         reproduced_covariance,
//         residual,
//         variable_order: var_names,
//     })
// }


// file: src/stats/report.rs

pub fn calculate_reproduced_covariances(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<ReproducedCovariances, String> {
    
    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    
    // 1. Ambil Matriks Kovarians (Observed)
    // Pastikan kita selalu mengambil 'covariance' untuk variabel 'orig_cov'
    let cov_matrix = calculate_matrix(&data_matrix, "covariance")?;
    
    // 2. Ekstraksi Faktor
    // extract_factors akan menangani logika internal (konversi ke korelasi lalu balik lagi jika perlu)
    let extraction_result = extract_factors(&cov_matrix, config, &var_names)?;

    let k = extraction_result.n_factors;
    let loadings = &extraction_result.loadings;
    
    // Ambil k kolom pertama (Loadings aktif)
    let loadings_k = if k < loadings.ncols() {
        loadings.columns(0, k).into_owned()
    } else {
        loadings.clone()
    };

    // 3. Hitung Reproduced Matrix = L * L'
    // Hasil dari L*L' ini adalah matriks kovarians yang direproduksi (karena L sudah dalam skala Raw)
    let reproduced_matrix = &loadings_k * loadings_k.transpose();

    let mut reproduced_covariance = HashMap::new();
    let mut residual = HashMap::new();

    for (i, var_name) in var_names.iter().enumerate() {
        let mut var_reproduced = HashMap::new();
        let mut var_residual = HashMap::new();

        for (j, other_var) in var_names.iter().enumerate() {
            // Nilai Reproduced
            let repro_val = if i < reproduced_matrix.nrows() && j < reproduced_matrix.ncols() {
                reproduced_matrix[(i, j)]
            } else { 0.0 };
            var_reproduced.insert(other_var.clone(), repro_val);

            // Nilai Observed
            let orig_val = if i < cov_matrix.nrows() && j < cov_matrix.ncols() {
                cov_matrix[(i, j)]
            } else { 0.0 };

            // Nilai Residual = Observed - Reproduced
            let residual_val = orig_val - repro_val;
            var_residual.insert(other_var.clone(), residual_val);
        }
        reproduced_covariance.insert(var_name.clone(), var_reproduced);
        residual.insert(var_name.clone(), var_residual);
    }

    Ok(ReproducedCovariances {
        reproduced_covariance,
        residual,
        variable_order: var_names,
    })
}

pub fn calculate_scree_plot(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<ScreePlot, String> {
    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    let matrix_type = if config.extraction.covariance { "covariance" } else { "correlation" };
    let matrix = calculate_matrix(&data_matrix, matrix_type)?;
    let extraction_result = extract_factors(&matrix, config, &var_names)?;

    let n_variables = var_names.len();
    let mut eigenvalues = extraction_result.eigenvalues.clone();
    eigenvalues.resize(n_variables, 0.0);
    let mut component_numbers = Vec::with_capacity(n_variables);
    for i in 0..n_variables {
        component_numbers.push(i + 1);
    }

    Ok(ScreePlot {
        eigenvalues,
        component_numbers,
    })
}


// =========================================================================
// HELPER: Alignment Check (Memastikan arah skor sesuai loading)
// =========================================================================
fn align_coefficients_direction(
    coefficients: &mut DMatrix<f64>, 
    pattern_matrix: &DMatrix<f64>
) {
    let (n_rows, n_cols) = coefficients.shape();
    for j in 0..n_cols {
        let mut dot_prod = 0.0;
        // Hitung korelasi arah antara Loading dan Coefficient
        for i in 0..n_rows {
            dot_prod += pattern_matrix[(i, j)] * coefficients[(i, j)];
        }
        
        // Jika arah berlawanan, balik tanda coefficient
        if dot_prod < 0.0 {
            for i in 0..n_rows {
                coefficients[(i, j)] *= -1.0;
            }
        }
    }
}

// =========================================================================
// HELPER: Robust Sqrt (Mencegah Crash pada nilai negatif kecil)
// =========================================================================
pub fn symmetric_matrix_sqrt_robust(matrix: &DMatrix<f64>) -> Option<DMatrix<f64>> {
    let n = matrix.nrows();
    if n != matrix.ncols() { return None; }
    
    let eigen = matrix.clone().symmetric_eigen();
    let mut d_sqrt = DMatrix::zeros(n, n);
    
    for i in 0..n {
        let val = eigen.eigenvalues[i];
        if val < -1e-5 {
            return None; // Error jika matriks benar-benar negatif
        } else {
            d_sqrt[(i, i)] = val.max(0.0).sqrt(); // Toleransi noise negatif
        }
    }
    Some(eigen.eigenvectors.clone() * d_sqrt * eigen.eigenvectors.transpose())
}

// Wrapper agar fungsi lama tetap ada tapi menggunakan logika robust yang baru
pub fn symmetric_matrix_sqrt(matrix: &DMatrix<f64>) -> Option<DMatrix<f64>> {
    symmetric_matrix_sqrt_robust(matrix)
}

// =========================================================================
// FUNGSI UTAMA: Calculate Score Coefficients
// =========================================================================
pub fn calculate_component_score_coefficient_matrix(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<ComponentScoreCoefficientMatrix, String> {
    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    
    // 1. Matriks Korelasi (R)
    let r_matrix = calculate_matrix(&data_matrix, "correlation")?;
    
    let extraction_result = extract_factors(&r_matrix, config, &var_names)?;
    let rotation_result = rotate_factors(&extraction_result, config)?;
    
    // Pattern Matrix (Loadings)
    let mut pattern_matrix = rotation_result.rotated_loadings.clone();
    let (n_rows_load, n_cols_load) = pattern_matrix.shape();
    
    // 2. Initial Sign Flipping (Standar SPSS pada Loading)
    for col in 0..n_cols_load {
        let mut sum_cubes = 0.0;
        for row in 0..n_rows_load {
            sum_cubes += pattern_matrix[(row, col)].powi(3);
        }
        if sum_cubes < 0.0 {
            for row in 0..n_rows_load {
                pattern_matrix[(row, col)] *= -1.0;
            }
        }
    }

    let n_rows = pattern_matrix.nrows();
    let n_cols = pattern_matrix.ncols();
    let mut coefficients = DMatrix::zeros(n_rows, n_cols);

    // Persiapan Matriks Uniqueness (U^-2) - Hanya dipakai Bartlett
    let mut u_inv_squared = DMatrix::zeros(n_rows, n_rows);
    for i in 0..n_rows {
        let h2 = if i < extraction_result.communalities.len() {
            extraction_result.communalities[i]
        } else { 0.0 };
        let u2 = (1.0 - h2).max(1e-9); 
        u_inv_squared[(i, i)] = 1.0 / u2;
    }

    // -----------------------------------------------------------
    // LOGIKA UTAMA SKOR FAKTOR
    // -----------------------------------------------------------

    // A. Hitung Regression Coefficients (Base untuk Regression & Anderson)
    // Rumus: B_reg = R^-1 * S
    let mut regression_coeffs = DMatrix::zeros(n_rows, n_cols);
    let inv_r = r_matrix.clone().try_inverse();

    if config.scores.regression || config.scores.anderson {
        let r_inverse = inv_r.clone().ok_or("Could not invert correlation matrix.")?;
        
        // Structure Matrix (S)
        let structure_matrix = if let Some(phi) = &rotation_result.factor_correlations {
            &pattern_matrix * phi
        } else {
            pattern_matrix.clone()
        };
        
        regression_coeffs = r_inverse * structure_matrix;
    }

    if config.scores.regression {
        // --- METODE 1: REGRESSION ---
        coefficients = regression_coeffs;

    } else if config.scores.bartlett {
        // --- METODE 2: BARTLETT ---
        // W = U^-2 * P * (P' * U^-2 * P)^-1
        let p = &pattern_matrix;
        let p_t = p.transpose();
        
        let term_inner = &p_t * &u_inv_squared * p;
        let term_inner_inv = term_inner.try_inverse()
            .ok_or("Could not invert matrix for Bartlett Scores.")?;
            
        coefficients = &u_inv_squared * p * term_inner_inv;

    } else if config.scores.anderson {
        // --- METODE 3: ANDERSON-RUBIN (PERBAIKAN FINAL) ---
        // Gunakan "Orthonormalized Regression Scores".
        // Ini bekerja sempurna untuk PCA (dimana Bartlett gagal) DAN ULS.
        // Formula: W = B_reg * (B_reg' * R * B_reg)^(-1/2)
        
        let b = &regression_coeffs; // Gunakan koefisien regresi yang sudah dihitung di atas
        
        // Hitung Kovarians antar skor regresi: G = B' * R * B
        let g_matrix = b.transpose() * &r_matrix * b;

        // Hitung G^(-1/2) untuk menghilangkan korelasi
        let g_sqrt = symmetric_matrix_sqrt_robust(&g_matrix)
            .ok_or("Failed Anderson-Rubin sqrt. Matrix G unstable.")?;
            
        let g_sqrt_inv = g_sqrt.try_inverse()
            .ok_or("Failed Anderson-Rubin inversion.")?;

        // Hasil Akhir
        coefficients = b * g_sqrt_inv;
    }

    // --- STEP AKHIR: ALIGNMENT CHECK ---
    // Memastikan tanda (+/-) sama dengan SPSS
    align_coefficients_direction(&mut coefficients, &pattern_matrix);

    // --- Formatting Output ---
    let mut result = ComponentScoreCoefficientMatrix {
        components: HashMap::new(),
        variable_order: var_names.clone(),
    };
    for (i, var_name) in var_names.iter().enumerate() {
        if i < coefficients.nrows() {
            let mut row = Vec::with_capacity(n_cols);
            for j in 0..n_cols {
                row.push(coefficients[(i, j)]);
            }
            result.components.insert(var_name.clone(), row);
        }
    }
    result.variable_order = var_names;
    Ok(result)
}


pub fn calculate_component_score_covariance_matrix(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<ComponentScoreCovarianceMatrix, String> {
    
    // 1. Dapatkan Matriks Korelasi (R)
    let (data_matrix, _var_names) = extract_data_matrix(data, config)?;
    let corr_matrix = calculate_matrix(&data_matrix, "correlation")?;

    // 2. Dapatkan Matriks Koefisien Skor (W)
    // PENTING: Kita panggil fungsi yang SUDAH DIPERBAIKI sebelumnya.
    // Ini menjamin logika Regression/Anderson/Bartlett dan Sign Alignment-nya sama persis.
    let coeff_result = calculate_component_score_coefficient_matrix(data, config)?;
    
    // Konversi HashMap hasil coeff_result kembali ke DMatrix untuk perhitungan
    let n_vars = corr_matrix.nrows();
    // Hitung jumlah faktor (dari elemen pertama hashmap)
    let n_factors = coeff_result.components.values().next().map(|v| v.len()).unwrap_or(0);
    
    if n_factors == 0 {
        return Err("No factors found for covariance calculation".to_string());
    }

    // Susun matriks W (Coefficients) sesuai urutan variabel matriks korelasi
    let mut w_matrix = DMatrix::zeros(n_vars, n_factors);
    // coeff_result.variable_order harus sama urutannya dengan data_matrix
    // Kita asumsikan urutan var_names di extract_data_matrix sama dengan di coeff_result
    for (row_idx, var_name) in coeff_result.variable_order.iter().enumerate() {
        if let Some(vals) = coeff_result.components.get(var_name) {
            for (col_idx, &val) in vals.iter().enumerate() {
                if col_idx < n_factors {
                    w_matrix[(row_idx, col_idx)] = val;
                }
            }
        }
    }

    // 3. Hitung Covariance Matrix
    // RUMUS BENAR: Cov = W' * R * W
    let covariance_matrix = w_matrix.transpose() * &corr_matrix * &w_matrix;

    // 4. Format Output ke Struct JSON
    let mut output_components = Vec::new();
    let n_out_rows = covariance_matrix.nrows();
    let n_out_cols = covariance_matrix.ncols();

    for i in 0..n_out_rows {
        let mut row = Vec::new();
        for j in 0..n_out_cols {
            row.push(covariance_matrix[(i, j)]);
        }
        output_components.push(row);
    }

    Ok(ComponentScoreCovarianceMatrix {
        components: output_components,
    })
}







pub fn calculate_factor_scores(
    data: &AnalysisData,
    config: &FactorAnalysisConfig,
    coefficients_matrix: &ComponentScoreCoefficientMatrix,
) -> Result<HashMap<String, Vec<f64>>, String> {
    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    let n_rows = data_matrix.nrows();
    let n_cols = data_matrix.ncols();
    let mut z_matrix = DMatrix::zeros(n_rows, n_cols);
    for j in 0..n_cols {
        let col = data_matrix.column(j);
        let sum: f64 = col.sum();
        let mean = sum / n_rows as f64;
        let mut sum_sq_diff = 0.0;
        for i in 0..n_rows {
            sum_sq_diff += (col[i] - mean).powi(2);
        }
        let std_dev = (sum_sq_diff / (n_rows as f64 - 1.0)).sqrt();
        let divisor = if std_dev == 0.0 { 1.0 } else { std_dev };
        for i in 0..n_rows {
            z_matrix[(i, j)] = (col[i] - mean) / divisor;
        }
    }

    let n_factors = coefficients_matrix.components.values().next().map(|v| v.len()).unwrap_or(0);
    if n_factors == 0 {
        return Err("No factors found in coefficient matrix".to_string());
    }

    let mut coeff_mat = DMatrix::zeros(n_cols, n_factors);
    for (row_idx, var_name) in var_names.iter().enumerate() {
        if let Some(coeffs) = coefficients_matrix.components.get(var_name) {
            for (col_idx, &val) in coeffs.iter().enumerate() {
                if col_idx < n_factors {
                    coeff_mat[(row_idx, col_idx)] = val;
                }
            }
        }
    }

    let scores_matrix = z_matrix * coeff_mat;
    let mut result_scores = HashMap::new();
    for factor_idx in 0..n_factors {
        let factor_name = format!("FAC{}_1", factor_idx + 1);
        let mut factor_values = Vec::with_capacity(n_rows);
        for row_idx in 0..n_rows {
            factor_values.push(scores_matrix[(row_idx, factor_idx)]);
        }
        result_scores.insert(factor_name, factor_values);
    }
    Ok(result_scores)
}

// pub fn symmetric_matrix_sqrt(matrix: &DMatrix<f64>) -> Option<DMatrix<f64>> {
//     let n = matrix.nrows();
//     if n != matrix.ncols() { return None; }
//     let eigen = matrix.clone().symmetric_eigen();
//     let mut d_sqrt = DMatrix::zeros(n, n);
//     for i in 0..n {
//         if eigen.eigenvalues[i] < 0.0 { return None; }
//         d_sqrt[(i, i)] = eigen.eigenvalues[i].sqrt();
//     }
//     Some(eigen.eigenvectors.clone() * d_sqrt * eigen.eigenvectors.transpose())
// }

pub fn create_rotated_component_matrix(
    rotation_result: &RotationResult,
    var_names: &[String]
) -> RotatedComponentMatrix {
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
    RotatedComponentMatrix {
        components,
        variable_order: var_names.to_vec(),
    }
}

pub fn create_component_transformation_matrix(
    rotation_result: &RotationResult
) -> ComponentTransformationMatrix {
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
    ComponentTransformationMatrix { components }
}

pub fn create_pattern_matrix(
    rotation_result: &RotationResult,
    var_names: &[String]
) -> PatternMatrix {
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
    PatternMatrix {
        components,
        variable_order: var_names.to_vec(),
    }
}

pub fn create_structure_matrix(
    rotation_result: &RotationResult,
    var_names: &[String]
) -> StructureMatrix {
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
    StructureMatrix {
        components,
        variable_order: var_names.to_vec(),
    }
}

pub fn create_component_correlation_matrix(
    rotation_result: &RotationResult
) -> ComponentCorrelationMatrix {
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
    ComponentCorrelationMatrix { correlations }
}