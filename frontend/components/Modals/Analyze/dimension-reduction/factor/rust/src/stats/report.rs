// perbaikan bisa 15/1/2026
// perbaikan bisa (9/1/2026)

use crate::stats::matrix::{calculate_mean, calculate_std_dev}; // Asumsi ada helper ini, atau hitung manual
use std::collections::HashMap;
use nalgebra::{DMatrix, SymmetricEigen,};
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
        TotalVarianceBlock, // TAMBAHAn untuk total variance explained (covariance)
    },
};



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

    let matrix_for_extraction = calculate_matrix(&data_matrix, matrix_type)?; 
    let extraction_result = extract_factors(&matrix_for_extraction, config, &var_names)?;

    // --- LOGIKA BARU UNTUK NILAI INITIAL ---
    // Jika PCA: Initial = 1.0
    // Jika ULS/PAF/ML/Alpha/Image: Initial = SMC (Squared Multiple Correlation)
    let initial_values: Vec<f64> = match config.extraction.method {
        ExtractionMethod::PrincipalComponents => vec![1.0; var_names.len()],
        _ => {
            // Hitung SMC dari Correlation Matrix
            // Walaupun user pilih Covariance, SMC tetap dihitung based on correlation matrix untuk nilai "Rescaled/Initial"
            let corr_matrix = calculate_matrix(&data_matrix, "correlation")?;
            match corr_matrix.try_inverse() {
                Some(inv) => {
                    (0..var_names.len())
                        .map(|i| {
                            let smc = 1.0 - 1.0 / inv[(i, i)];
                            // Hindari nilai negatif kecil akibat presisi floating point
                            if smc < 0.0 { 0.0 } else { smc }
                        })
                        .collect()
                },
                None => vec![1.0; var_names.len()] // Fallback jika matriks singular, misal ke max correlation atau 1.0
            }
        }
    };
    // ----------------------------------------

    let mut raw_initial = HashMap::new();
    let mut rescaled_initial = HashMap::new();
    let mut extraction = HashMap::new();

    // Hitung Raw Initial Variances (Varians Mentah)
    let raw_variances = calculate_raw_variances(&data_matrix)?; 
    
    for (i, var_name) in var_names.iter().enumerate() {

        // Raw Initial: Varians Mentah (Untuk Covariance Analysis)
        raw_initial.insert(var_name.clone(), raw_variances[i]);

        // Rescaled Initial: Gunakan nilai SMC yang sudah dihitung di atas
        // Jika PCA = 1.0, Jika ULS = SMC. Ini akan cocok dengan SPSS.
        if i < initial_values.len() {
             rescaled_initial.insert(var_name.clone(), initial_values[i]);
        } else {
             rescaled_initial.insert(var_name.clone(), 1.0);
        }

        // Extraction Communality
        if i < extraction_result.communalities.len() {
            extraction.insert(var_name.clone(), extraction_result.communalities[i]);
        }
    }

    Ok(Communalities {
        raw_initial,
        rescaled_initial,
        extraction,
        variable_order: var_names,
        extraction_matrix_type: matrix_type.to_string(),
    })
}


pub fn calculate_total_variance_explained(
    initial_eigenvalues: &[f64],    // Input baru: Full Eigenvalues (N)
    extraction_eigenvalues: &[f64], // Input baru: Extracted Eigenvalues (k)
    total_variance: f64,
    n_variables: usize,
    matrix_type: &str,
) -> TotalVarianceExplained {

    // Helper closure untuk membuat komponen variance
    let create_components = |eigenvalues: &[f64]| -> Vec<TotalVarianceComponent> {
        let mut components = Vec::new();
        let mut cumulative = 0.0;
        
        for &eig in eigenvalues {
            let percent = (eig / total_variance) * 100.0;
            cumulative += percent;
            
            components.push(TotalVarianceComponent {
                total: eig,
                percent_of_variance: percent,
                cumulative_percent: cumulative,
            });
        }
        components
    };

    match matrix_type {
        "correlation" => {
            // 1. Initial: Gunakan full initial_eigenvalues (N baris)
            let initial = create_components(initial_eigenvalues);
            
            // 2. Extraction: Gunakan extraction_eigenvalues (k baris)
            let extraction = create_components(extraction_eigenvalues);

            // 3. Rotation: (Saat ini placeholder, idealnya diisi setelah rotasi dilakukan)
            // Karena fungsi ini dipanggil sebelum rotasi di function.rs, kita set None atau copy extraction
            let rotation = Some(extraction.clone()); 

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
            // === RAW ===
            // Initial Raw
            let raw_initial = create_components(initial_eigenvalues);
            // Extraction Raw
            let raw_extraction = create_components(extraction_eigenvalues);

            // === RESCALED ===
            // Untuk Covariance analysis di SPSS:
            // "Initial eigenvalues are the same across the raw and rescaled solution"
            // Jadi kita gunakan nilai eigenvalues yang sama, persentasenya pun sama.
            
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
                        rotation: None, // Rotation biasanya hanya ditampilkan untuk Raw atau satu section saja
                    },
                ],
                extraction_matrix_type: "covariance".to_string(),
            }
        }

        _ => panic!("Unknown matrix type"),
    }
}

// pub fn calculate_total_variance_explained_from_data(
//     data: &AnalysisData,
//     config: &FactorAnalysisConfig,
// ) -> Result<TotalVarianceExplained, String> {

//     // 1. Ekstrak data mentah dan nama variabel
//     let (data_matrix, var_names) = extract_data_matrix(data, config)?;
//     let n_variables = var_names.len();

//     // 2. Tentukan tipe matriks (Covariance atau Correlation)
//     let is_covariance = config.extraction.covariance;
//     let matrix_type = if is_covariance {
//         "covariance"
//     } else {
//         "correlation"
//     };

//     // 3. Hitung Matriks untuk Analisis (R atau S)
//     let matrix = calculate_matrix(&data_matrix, matrix_type)?;

//     // =========================================================================
//     // PERBAIKAN UTAMA: PISAHKAN PERHITUNGAN INITIAL VS EXTRACTION
//     // =========================================================================

//     // A. HITUNG INITIAL EIGENVALUES (SELALU N BARIS)
//     // Ini merepresentasikan varians awal sebelum faktor direduksi.
//     // Kita lakukan dekomposisi eigen penuh pada matriks input.
//     let eigen_decomp = matrix.clone().symmetric_eigen();
//     let mut initial_eigenvalues: Vec<f64> = eigen_decomp.eigenvalues.data.as_vec().clone();
    
//     // Urutkan descending (terbesar ke terkecil)
//     initial_eigenvalues.sort_by(|a, b| b.partial_cmp(a).unwrap_or(std::cmp::Ordering::Equal));


//     // B. HITUNG EXTRACTION EIGENVALUES (K BARIS)
//     // Ini diambil dari hasil ekstraksi (PCA/ULS/PAF) yang mungkin sudah dipotong (truncated)
//     let extraction_result = extract_factors(&matrix, config, &var_names)?;
//     let extraction_eigenvalues = extraction_result.eigenvalues; // Ini panjangnya = n_factors (k)


//     // 4. Hitung Total Variance yang Valid (Denominator)
//     let total_variance: f64 = if is_covariance {
//         // Untuk Covariance: Total variance adalah jumlah semua INITIAL eigenvalues
//         initial_eigenvalues.iter().sum()
//     } else {
//         // Untuk Correlation: Total variance = jumlah variabel
//         n_variables as f64
//     };

//     // 5. Generate Struktur Laporan
//     // Kita kirim dua vektor berbeda: initial (panjang N) dan extraction (panjang k)
//     Ok(calculate_total_variance_explained(
//         &initial_eigenvalues,
//         &extraction_eigenvalues,
//         total_variance,
//         n_variables,
//         matrix_type,
//     ))
// }


pub fn calculate_total_variance_explained_from_data(
    data: &AnalysisData,
    config: &FactorAnalysisConfig,
) -> Result<TotalVarianceExplained, String> {

    // 1. Ekstrak data mentah dan nama variabel
    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    let n_variables = var_names.len();

    // 2. Tentukan tipe matriks (Covariance atau Correlation)
    let is_covariance = config.extraction.covariance;
    let matrix_type = if is_covariance {
        "covariance"
    } else {
        "correlation"
    };

    // 3. Hitung Matriks (R atau S)
    let matrix = calculate_matrix(&data_matrix, matrix_type)?;

    // =====================================================
    // STEP A: HITUNG INITIAL EIGENVALUES (SELALU FULL N)
    // =====================================================
    // Kita hitung eigen decomposition manual dari matriks korelasi/kovariansi awal
    // agar selalu mendapatkan N eigenvalues untuk kolom "Initial Eigenvalues".
    let eigen_decomp = matrix.clone().symmetric_eigen();
    let mut initial_eigenvalues: Vec<f64> = eigen_decomp.eigenvalues.data.as_vec().clone();
    
    // Urutkan dari terbesar ke terkecil (Descending)
    initial_eigenvalues.sort_by(|a, b| b.partial_cmp(a).unwrap_or(std::cmp::Ordering::Equal));


    // =====================================================
    // STEP B: HITUNG EXTRACTION EIGENVALUES (FILTERED)
    // =====================================================
    let extraction_result = extract_factors(&matrix, config, &var_names)?;

    // PERBAIKAN DI SINI:
    // PCA menghasilkan eigenvalues sebanyak variabel (misal 8).
    // Tapi kita hanya ingin menampilkan di kolom "Extraction" sebanyak faktor yang valid (n_factors).
    // extraction_result.n_factors adalah jumlah faktor yang lolos kriteria (misal Eigenvalue > 1).
    
    let k = extraction_result.n_factors;
    
    // Safety check: Pastikan k tidak melebihi panjang vektor yang tersedia
    let limit = std::cmp::min(k, extraction_result.eigenvalues.len());
    
    // Ambil hanya 'limit' pertama untuk kolom Extraction
    let extraction_eigenvalues = extraction_result.eigenvalues[0..limit].to_vec();


    // 4. Hitung Total Variance (Denominator)
    let total_variance: f64 = if is_covariance {
        // Untuk Covariance: Total variance adalah jumlah semua INITIAL eigenvalues
        initial_eigenvalues.iter().sum()
    } else {
        // Untuk Correlation: Total variance sama dengan jumlah variabel
        n_variables as f64
    };

    // 5. Generate Struktur Laporan
    Ok(calculate_total_variance_explained(
        &initial_eigenvalues,    // Tampilkan Semua (Kiri)
        &extraction_eigenvalues, // Tampilkan yang Diekstrak Saja (Tengah)
        total_variance,
        n_variables,
        matrix_type,
    ))
}


// perbaikan 16/1/2026

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

    // =====================================================
    // SPSS-compatible sign stabilization (ONLY ONCE)
    // =====================================================
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
    // =====================================================

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

    let n_vars = var_names.len();
    let k = extraction_result.n_factors;
    let mut reproduced_correlation = HashMap::new();
    let mut residual = HashMap::new();

    // Calculate reproduced correlation matrix using only k extracted components
    let loadings = &extraction_result.loadings;

    // Ensure we only use the first k columns (k extracted components)
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
            // Reproduced correlation
            let repro_corr = if i < reproduced_matrix.nrows() && j < reproduced_matrix.ncols() {
                reproduced_matrix[(i, j)]
            } else {
                0.0
            };
            var_reproduced.insert(other_var.clone(), repro_corr);

            // Residual (original - reproduced)
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

pub fn calculate_reproduced_covariances(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<ReproducedCovariances, String> {
    // ALGORITHM UNTUK REPRODUCED COVARIANCE:
    // STEP 1: Mean centering (dilakukan di extract_data_matrix)
    // STEP 2: Covariance matrix Sigma = (Xcᵀ Xc) / (n - 1)
    // STEP 3: Eigen decomposition Sigma = Q Λ Qᵀ, sort Λ descending
    // STEP 4: RAW loadings (tanpa rescaling): L[i][j] = sqrt(Λ[j]) * Q[i][j]
    // STEP 5: Reproduced covariance: Sigma_reproduced = L_k × L_k^T (using only k components)
    // STEP 6: Residual: Sigma_residual = Sigma - Sigma_reproduced

    let (data_matrix, var_names) = extract_data_matrix(data, config)?;

    // STEP 2: Calculate covariance matrix (NOT correlation, NOT standardized)
    let cov_matrix = calculate_matrix(&data_matrix, "covariance")?;

    // STEP 3-4: Extract factors from covariance matrix to get RAW loadings
    // Penting: extract_factors akan melakukan eigen decomposition pada cov_matrix
    // dan mengembalikan loadings yang dihitung sebagai: L[i][j] = sqrt(Λ[j]) * Q[i][j]
    let extraction_result = extract_factors(&cov_matrix, config, &var_names)?;

    let n_vars = var_names.len();
    let k = extraction_result.n_factors;
    let mut reproduced_covariance = HashMap::new();
    let mut residual = HashMap::new();

    // STEP 5: Calculate reproduced covariance matrix using RAW loadings
    // Reproduced = L_k × L_k^T (using only k components, not all p components)
    let loadings = &extraction_result.loadings;

    // Ensure we only use the first k columns (k extracted components)
    let loadings_k = if k < loadings.ncols() {
        loadings.columns(0, k).into_owned()
    } else {
        loadings.clone()
    };

    // Reproduced covariance: L_k × L_k^T
    let reproduced_matrix = &loadings_k * loadings_k.transpose();

    // Build result matrices
    for (i, var_name) in var_names.iter().enumerate() {
        let mut var_reproduced = HashMap::new();
        let mut var_residual = HashMap::new();

        for (j, other_var) in var_names.iter().enumerate() {
            // Reproduced covariance: L_k × L_k^T
            let repro_cov = if i < reproduced_matrix.nrows() && j < reproduced_matrix.ncols() {
                reproduced_matrix[(i, j)]
            } else {
                0.0
            };
            var_reproduced.insert(other_var.clone(), repro_cov);

            // STEP 6: Residual = observed covariance − reproduced covariance
            let orig_cov = if i < cov_matrix.nrows() && j < cov_matrix.ncols() {
                cov_matrix[(i, j)]
            } else {
                0.0
            };

            let residual_cov = orig_cov - repro_cov;
            var_residual.insert(other_var.clone(), residual_cov);
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

    // Determine matrix type based on config (covariance vs correlation)
    let matrix_type = if config.extraction.covariance {
        "covariance"
    } else if config.extraction.correlation {
        "correlation"
    } else {
        "correlation" // Default to correlation if neither is explicitly set
    };

    let matrix = calculate_matrix(&data_matrix, matrix_type)?;
    let extraction_result = extract_factors(&matrix, config, &var_names)?;

    let n_variables = var_names.len();

    // Ensure we have eigenvalues for all variables
    let mut eigenvalues = extraction_result.eigenvalues.clone();

    // Pad with zeros if needed
    eigenvalues.resize(n_variables, 0.0);

    // Create component numbers
    let mut component_numbers = Vec::with_capacity(n_variables);
    for i in 0..n_variables {
        component_numbers.push(i + 1);
    }

    Ok(ScreePlot {
        eigenvalues,
        component_numbers,
    })
}

//  perbaikan 16/1/2026

pub fn calculate_component_score_coefficient_matrix(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<ComponentScoreCoefficientMatrix, String> {

    // 1. Persiapan Data & Matriks Korelasi
    let (data_matrix, var_names) = extract_data_matrix(data, config)?;

    let matrix_type = if config.extraction.covariance {
        "covariance"
    } else {
        "correlation"
    };

    let matrix = calculate_matrix(&data_matrix, matrix_type)?;
    
    // 2. Ekstraksi Faktor (Initial Loadings)
    let extraction_result = extract_factors(&matrix, config, &var_names)?;

    // 3. ROTASI FAKTOR (PENTING!)
    // Skor faktor harus dihitung berdasarkan loadings yang SUDAH DIROTASI.
    // Jika user memilih "None", fungsi ini akan mengembalikan loading awal (unrotated).
    let rotation_result = rotate_factors(&extraction_result, config)?;
    let mut loadings = rotation_result.rotated_loadings.clone();
    
    // =====================================================
    // 4. SIGN REFLECTION (SUM OF CUBES) - SPSS COMPATIBILITY
    // =====================================================
    // Memastikan tanda +/- skor konsisten dengan tabel "Component Matrix" di layar.
    let (n_rows_load, n_cols_load) = loadings.shape();

    for col in 0..n_cols_load {
        let mut sum_cubes = 0.0;
        for row in 0..n_rows_load {
            sum_cubes += loadings[(row, col)].powi(3);
        }

        // Jika dominasi arah negatif, balik tanda seluruh kolom
        if sum_cubes < 0.0 {
            for row in 0..n_rows_load {
                loadings[(row, col)] *= -1.0;
            }
        }
    }
    // =====================================================

    // 5. Persiapan Perhitungan Koefisien
    let loadings_t = loadings.transpose();
    let n_rows = loadings.nrows();
    let n_cols = loadings.ncols();
    let mut coefficients = DMatrix::zeros(n_rows, n_cols);

    // ==========================
    // METODE REGRESSION (SPSS)
    // ==========================
    if config.scores.regression {
        
        // --- OPTIMISASI KHUSUS UNTUK UNROTATED PCA ---
        // Jika rotasi = None (dan metode PCA), SPSS tidak melakukan invers matriks korelasi.
        // SPSS menggunakan rumus: Koefisien = Loading / Eigenvalue
        // Ini menghilangkan error presisi akibat invers matriks.
        
        // Cek apakah rotasi dimatikan (sesuaikan logika enum ini dengan struct config Anda)
        // Misal: config.rotation.method == RotationMethod::None
        // Di sini saya asumsikan pengecekan sederhana: Loading hasil rotasi == Loading awal
        let is_unrotated = loadings.shape() == extraction_result.loadings.shape() 
                           && loadings == extraction_result.loadings; // Atau cek config langsung

        if is_unrotated {
            // RUMUS PINTAS (EXACT PCA SCORES)
            // B[i,j] = L[i,j] / Variance[j]
            for col in 0..n_cols {
                let mut col_variance = 0.0;
                // Hitung varians (eigenvalue) dari loading yang sudah ada
                for row in 0..n_rows {
                    col_variance += loadings[(row, col)].powi(2);
                }

                // Hindari pembagian nol
                if col_variance < 1e-9 { col_variance = 1.0; }

                for row in 0..n_rows {
                    coefficients[(row, col)] = loadings[(row, col)] / col_variance;
                }
            }
        } else {
            // RUMUS STANDAR (ROTATED SOLUTION)
            // B = R^-1 * L
            let inv_r = matrix
                .try_inverse()
                .ok_or("Could not invert correlation matrix")?;

            coefficients = inv_r * loadings;
        }
    }

    // ==========================
    // METODE BARTLETT (SPSS)
    // ==========================
    // Rumus: B = U^-2 * L * (L' * U^-2 * L)^-1
    else if config.scores.bartlett {
        let mut u_inv_squared = DMatrix::zeros(n_rows, n_rows);

        for i in 0..n_rows {
            // Safety check array bounds
            let h2 = if i < extraction_result.communalities.len() {
                extraction_result.communalities[i]
            } else {
                0.0
            };
            
            // U^2 = 1 - h^2 (Uniqueness)
            let u2 = (1.0 - h2).max(0.001);
            u_inv_squared[(i, i)] = 1.0 / u2;
        }

        let ata = &loadings_t * &u_inv_squared * &loadings;

        let ata_inv = ata
            .try_inverse()
            .ok_or("Could not invert Bartlett matrix (ATA)")?;

        // Urutan Perkalian yang Benar: (p x p) * (p x k) * (k x k)
        coefficients = u_inv_squared * loadings * ata_inv;
    }

    // ==========================
    // METODE ANDERSON–RUBIN
    // ==========================
    // Rumus: B = U^-2 * L * (L' * U^-2 * L)^(-1/2)
    else if config.scores.anderson {
        let mut u_inv_squared = DMatrix::zeros(n_rows, n_rows);

        for i in 0..n_rows {
            let h2 = if i < extraction_result.communalities.len() {
                extraction_result.communalities[i]
            } else {
                0.0 
            };
            let u2 = (1.0 - h2).max(0.001);
            u_inv_squared[(i, i)] = 1.0 / u2;
        }

        let ata = &loadings_t * &u_inv_squared * &loadings;

        let ata_sqrt = symmetric_matrix_sqrt(&ata)
            .ok_or("Failed Anderson–Rubin sqrt")?;

        let ata_sqrt_inv = ata_sqrt
            .try_inverse()
            .ok_or("Failed Anderson–Rubin inversion")?;

        coefficients = u_inv_squared * loadings * ata_sqrt_inv;
    }

    // ==========================
    // BUILD OUTPUT
    // ==========================
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
    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    let corr_matrix = calculate_matrix(&data_matrix, "correlation")?;
    let extraction_result = extract_factors(&corr_matrix, config, &var_names)?;

    // Calculate score covariance matrix directly
    let loadings = &extraction_result.loadings;
    let n_rows = loadings.nrows();
    let n_cols = loadings.ncols();

    let mut component_score_covariance_matrix = ComponentScoreCovarianceMatrix {
        components: vec![vec![0.0; n_cols]; n_cols],
    };

    if config.scores.anderson {
        // Anderson-Rubin method produces uncorrelated scores (identity covariance matrix)
        for i in 0..n_cols {
            for j in 0..n_cols {
                component_score_covariance_matrix.components[i][j] = if i == j { 1.0 } else { 0.0 };
            }
        }
    } else if config.scores.bartlett {
        // Bartlett method: (A'U^(-2)A)^(-1)
        let mut u_inv_squared = DMatrix::zeros(n_rows, n_rows);
        for i in 0..n_rows {
            let h_squared = if i < extraction_result.communalities.len() {
                extraction_result.communalities[i]
            } else {
                0.0
            };

            let u_squared = (1.0 - h_squared).max(0.001);
            u_inv_squared[(i, i)] = 1.0 / u_squared;
        }

        let a_transpose_u_inv_squared_a = loadings.transpose() * u_inv_squared * loadings;

        match a_transpose_u_inv_squared_a.try_inverse() {
            Some(cov_matrix) => {
                for i in 0..n_cols {
                    for j in 0..n_cols {
                        component_score_covariance_matrix.components[i][j] = cov_matrix[(i, j)];
                    }
                }
            }
            None => {
                // Fall back to identity matrix
                for i in 0..n_cols {
                    for j in 0..n_cols {
                        component_score_covariance_matrix.components[i][j] = if i == j {
                            1.0
                        } else {
                            0.0
                        };
                    }
                }
            }
        }
    } else {
        // Regression method: (B'R^(-1)B)
        // First calculate coefficients
        let mut coefficients = DMatrix::zeros(n_rows, n_cols);

        match corr_matrix.clone().try_inverse() {
            Some(r_inv) => {
                coefficients = r_inv.clone() * loadings;
                let cov_matrix = coefficients.transpose() * r_inv * coefficients;
                for i in 0..n_cols {
                    for j in 0..n_cols {
                        component_score_covariance_matrix.components[i][j] = cov_matrix[(i, j)];
                    }
                }
            }
            None => {
                // Fall back to identity matrix
                for i in 0..n_cols {
                    for j in 0..n_cols {
                        component_score_covariance_matrix.components[i][j] = if i == j {
                            1.0
                        } else {
                            0.0
                        };
                    }
                }
            }
        }
    }

    Ok(component_score_covariance_matrix)
}

// FUNGSI BARU: Menghitung nilai skor aktual untuk setiap baris data
pub fn calculate_factor_scores(
    data: &AnalysisData,
    config: &FactorAnalysisConfig,
    coefficients_matrix: &ComponentScoreCoefficientMatrix, // Hasil dari fungsi calculate_component_score_coefficient_matrix
) -> Result<HashMap<String, Vec<f64>>, String> {
    
    // 1. Ambil data mentah
    let (data_matrix, var_names) = extract_data_matrix(data, config)?;
    let n_rows = data_matrix.nrows();
    let n_cols = data_matrix.ncols(); // Jumlah variabel input
    
    // 2. Standarisasi Data (Z-Score) -> Rumus: (X - Mean) / SD
    // Karena Factor Score Coefficients biasanya berbasis data terstandarisasi
    let mut z_matrix = DMatrix::zeros(n_rows, n_cols);
    
    for j in 0..n_cols {
        let col = data_matrix.column(j);
        let sum: f64 = col.sum();
        let mean = sum / n_rows as f64;
        
        // Hitung SD (Sample)
        let mut sum_sq_diff = 0.0;
        for i in 0..n_rows {
            sum_sq_diff += (col[i] - mean).powi(2);
        }
        let std_dev = (sum_sq_diff / (n_rows as f64 - 1.0)).sqrt();
        
        // Hindari pembagian dengan nol
        let divisor = if std_dev == 0.0 { 1.0 } else { std_dev };
        
        for i in 0..n_rows {
            z_matrix[(i, j)] = (col[i] - mean) / divisor;
        }
    }

    // 3. Konversi Coefficients HashMap kembali ke DMatrix untuk perkalian
    // coefficients_matrix.components berisi: VarName -> [Coeff_Comp1, Coeff_Comp2, ...]
    let n_factors = coefficients_matrix.components.values().next().map(|v| v.len()).unwrap_or(0);
    
    if n_factors == 0 {
        return Err("No factors found in coefficient matrix".to_string());
    }

    let mut coeff_mat = DMatrix::zeros(n_cols, n_factors);
    
    // Pastikan urutan variabel sesuai dengan z_matrix (var_names)
    for (row_idx, var_name) in var_names.iter().enumerate() {
        if let Some(coeffs) = coefficients_matrix.components.get(var_name) {
            for (col_idx, &val) in coeffs.iter().enumerate() {
                if col_idx < n_factors {
                    coeff_mat[(row_idx, col_idx)] = val;
                }
            }
        }
    }

    // 4. Hitung Factor Scores: F = Z * B
    // (N x P) * (P x K) = (N x K)
    let scores_matrix = z_matrix * coeff_mat;

    // 5. Format Output: Nama Kolom (FAC1_1, FAC2_1) -> Vector Nilai
    let mut result_scores = HashMap::new();
    
    for factor_idx in 0..n_factors {
        // Nama variabel ala SPSS: FAC1_1, FAC2_1, dst.
        let factor_name = format!("FAC{}_1", factor_idx + 1);
        let mut factor_values = Vec::with_capacity(n_rows);
        
        for row_idx in 0..n_rows {
            factor_values.push(scores_matrix[(row_idx, factor_idx)]);
        }
        
        result_scores.insert(factor_name, factor_values);
    }

    Ok(result_scores)
}

// Helper function to calculate the symmetric square root of a matrix
pub fn symmetric_matrix_sqrt(matrix: &DMatrix<f64>) -> Option<DMatrix<f64>> {
    let n = matrix.nrows();
    if n != matrix.ncols() {
        return None;
    }

    // Perform eigenvalue decomposition
    let eigen = matrix.clone().symmetric_eigen();

    // Create diagonal matrix of sqrt of eigenvalues
    let mut d_sqrt = DMatrix::zeros(n, n);
    for i in 0..n {
        if eigen.eigenvalues[i] < 0.0 {
            // Matrix is not positive definite
            return None;
        }
        d_sqrt[(i, i)] = eigen.eigenvalues[i].sqrt();
    }

    // Compute Q * D^(1/2) * Q'
    Some(eigen.eigenvectors.clone() * d_sqrt * eigen.eigenvectors.transpose())
}

// Create rotated component matrix
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

// Create component transformation matrix
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

    ComponentTransformationMatrix {
        components,
    }
}

// Create pattern matrix for oblique rotations
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

// Create structure matrix for oblique rotations
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

// Create component correlation matrix for oblique rotations
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

    ComponentCorrelationMatrix {
        correlations,
    }
}