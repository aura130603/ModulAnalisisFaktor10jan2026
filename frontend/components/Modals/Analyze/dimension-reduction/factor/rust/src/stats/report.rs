// // perbaikan bisa (9/1/2026)


// use std::collections::HashMap;
// use nalgebra::DMatrix;
// use super::matrix::calculate_raw_variances;
// use crate::models::{
//     config::FactorAnalysisConfig,
//     data::AnalysisData,
//     result::{
//         Communalities,
//         ComponentCorrelationMatrix,
//         ComponentMatrix,
//         ComponentScoreCoefficientMatrix,
//         ComponentScoreCovarianceMatrix,
//         ComponentTransformationMatrix,
//         PatternMatrix,
//         ReproducedCorrelations,
//         ReproducedCovariances,
//         RotatedComponentMatrix,
//         RotationResult,
//         ScreePlot,
//         StructureMatrix,
//         TotalVarianceComponent,
//         TotalVarianceExplained,
//         TotalVarianceBlock, // TAMBAHAn untuk total variance explained (covariance)
//     },
// };

// use super::core::{ calculate_matrix, extract_data_matrix, extract_factors, rotate_factors };

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
//     // Default jika tidak ada yang dipilih (misalnya, default ke korelasi)
//         "correlation" 
//     };

//     let matrix_for_extraction = calculate_matrix(&data_matrix, matrix_type)?; 
//     let extraction_result = extract_factors(&matrix_for_extraction, config, &var_names)?;

//     // Properti baru
//     let mut raw_initial = HashMap::new();
//     let mut rescaled_initial = HashMap::new();
//     let mut extraction = HashMap::new();

//     // 1. Hitung Raw Initial Variances (Varians Mentah)
//     let raw_variances = calculate_raw_variances(&data_matrix)?; 
//     for (i, var_name) in var_names.iter().enumerate() {

//         // Raw Initial: Selalu diisi dengan Varians Mentah, terlepas dari Extraction Method
//         raw_initial.insert(var_name.clone(), raw_variances[i]);

//         // Rescaled Initial: Selalu 1.0
//         rescaled_initial.insert(var_name.clone(), 1.0);

//         // Extraction Communality
//         if i < extraction_result.communalities.len() {
//             extraction.insert(var_name.clone(), extraction_result.communalities[i]);
//         }
//     }

//     Ok(Communalities {
//         raw_initial,
//         rescaled_initial,
//         extraction, // Tambahkan juga extraction communalities
//         variable_order: var_names,
//         extraction_matrix_type: matrix_type.to_string(),
//     })

// }


// pub fn calculate_total_variance_explained(
//     eigenvalues: &[f64],
//     total_variance: f64,
//     n_variables: usize,
//     matrix_type: &str,
// ) -> TotalVarianceExplained {

//     match matrix_type {
//         "correlation" => {
//             let mut initial = Vec::new();
//             let mut extraction = Vec::new();
//             let mut rotation = Vec::new();

//             let mut cumulative = 0.0;

//             for &eig in eigenvalues {
//                 let percent = (eig / n_variables as f64) * 100.0;
//                 cumulative += percent;

//                 let component = TotalVarianceComponent {
//                     total: eig,
//                     percent_of_variance: percent,
//                     cumulative_percent: cumulative,
//                 };

//                 initial.push(component.clone());
//                 extraction.push(component.clone());
//                 rotation.push(component);
//             }

//             TotalVarianceExplained {
//                 blocks: vec![
//                     TotalVarianceBlock {
//                         label: "Component".to_string(),
//                         initial,
//                         extraction,
//                         rotation: Some(rotation),
//                     }
//                 ],
//                 extraction_matrix_type: "correlation".to_string(),
//             }
//         }

//         "covariance" => {
//             let mut raw_initial = Vec::new();
//             let mut raw_extraction = Vec::new();

//             let mut rescaled_initial = Vec::new();
//             let mut rescaled_extraction = Vec::new();

//             let mut cumulative_raw = 0.0;
//             let mut cumulative_rescaled = 0.0;

//             for &eig in eigenvalues {
//                 // RAW
//                 let percent_raw = (eig / total_variance) * 100.0;
//                 cumulative_raw += percent_raw;

//                 raw_initial.push(TotalVarianceComponent {
//                     total: eig,
//                     percent_of_variance: percent_raw,
//                     cumulative_percent: cumulative_raw,
//                 });

//                 raw_extraction.push(TotalVarianceComponent {
//                     total: eig,
//                     percent_of_variance: percent_raw,
//                     cumulative_percent: cumulative_raw,
//                 });

//                 // RESCALED
//                 let rescaled = eig / total_variance * n_variables as f64;
//                 let percent_rescaled = (rescaled / n_variables as f64) * 100.0;
//                 cumulative_rescaled += percent_rescaled;

//                 rescaled_initial.push(TotalVarianceComponent {
//                     total: rescaled,
//                     percent_of_variance: percent_rescaled,
//                     cumulative_percent: cumulative_rescaled,
//                 });

//                 rescaled_extraction.push(TotalVarianceComponent {
//                     total: rescaled,
//                     percent_of_variance: percent_rescaled,
//                     cumulative_percent: cumulative_rescaled,
//                 });
//             }

//             TotalVarianceExplained {
//                 blocks: vec![
//                     TotalVarianceBlock {
//                         label: "Raw".to_string(),
//                         initial: raw_initial,
//                         extraction: raw_extraction,
//                         rotation: None,
//                     },
//                     TotalVarianceBlock {
//                         label: "Rescaled".to_string(),
//                         initial: rescaled_initial,
//                         extraction: rescaled_extraction.clone(),
//                         rotation: Some(rescaled_extraction),
//                     },
//                 ],
//                 extraction_matrix_type: "covariance".to_string(),
//             }
//         }

//         _ => panic!("Unknown matrix type"),
//     }
// }

// pub fn calculate_total_variance_explained_from_data(
//     data: &AnalysisData,
//     config: &FactorAnalysisConfig,
// ) -> Result<TotalVarianceExplained, String> {

//     // Ambil eigenvalues dari hasil ekstraksi
//     let eigenvalues = data
//         .eigenvalues
//         .as_ref()
//         .ok_or("Eigenvalues not found in AnalysisData")?;

//     let n_variables = data.n_variables;

//     let matrix_type = if config.extraction.covariance {
//         "covariance"
//     } else {
//         "correlation"
//     };

//     let total_variance = if matrix_type == "correlation" {
//         n_variables as f64
//     } else {
//         data.total_variance
//             .ok_or("Total variance missing for covariance matrix")?
//     };

//     Ok(calculate_total_variance_explained(
//         eigenvalues,
//         total_variance,
//         n_variables,
//         matrix_type,
//     ))
// }














// pub fn calculate_component_matrix(
//     data: &AnalysisData,
//     config: &FactorAnalysisConfig
// ) -> Result<ComponentMatrix, String> {
//     let (data_matrix, var_names) = extract_data_matrix(data, config)?;

//     // Determine matrix type based on config (covariance vs correlation)
//     let matrix_type = if config.extraction.covariance {
//         "covariance"
//     } else if config.extraction.correlation {
//         "correlation"
//     } else {
//         "correlation" // Default to correlation if neither is explicitly set
//     };

//     let matrix = calculate_matrix(&data_matrix, matrix_type)?;
//     let extraction_result = extract_factors(&matrix, config, &var_names)?;

//     let mut components = HashMap::new();

//     for (i, var_name) in var_names.iter().enumerate() {
//         if i < extraction_result.loadings.nrows() {
//             let mut loadings = Vec::with_capacity(extraction_result.n_factors);

//             for j in 0..extraction_result.n_factors {
//                 loadings.push(extraction_result.loadings[(i, j)]);
//             }

//             components.insert(var_name.clone(), loadings);
//         }
//     }

//     Ok(ComponentMatrix {
//         components,
//         variable_order: var_names,
//     })
// }

// pub fn calculate_reproduced_correlations(
//     data: &AnalysisData,
//     config: &FactorAnalysisConfig
// ) -> Result<ReproducedCorrelations, String> {
//     let (data_matrix, var_names) = extract_data_matrix(data, config)?;
//     let corr_matrix = calculate_matrix(&data_matrix, "correlation")?;
//     let extraction_result = extract_factors(&corr_matrix, config, &var_names)?;

//     let n_vars = var_names.len();
//     let k = extraction_result.n_factors;
//     let mut reproduced_correlation = HashMap::new();
//     let mut residual = HashMap::new();

//     // Calculate reproduced correlation matrix using only k extracted components
//     let loadings = &extraction_result.loadings;

//     // Ensure we only use the first k columns (k extracted components)
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
//             // Reproduced correlation
//             let repro_corr = if i < reproduced_matrix.nrows() && j < reproduced_matrix.ncols() {
//                 reproduced_matrix[(i, j)]
//             } else {
//                 0.0
//             };
//             var_reproduced.insert(other_var.clone(), repro_corr);

//             // Residual (original - reproduced)
//             let orig_corr = if i < corr_matrix.nrows() && j < corr_matrix.ncols() {
//                 corr_matrix[(i, j)]
//             } else {
//                 if i == j { 1.0 } else { 0.0 }
//             };

//             let residual_corr = orig_corr - repro_corr;
//             var_residual.insert(other_var.clone(), residual_corr);
//         }

//         reproduced_correlation.insert(var_name.clone(), var_reproduced);
//         residual.insert(var_name.clone(), var_residual);
//     }

//     Ok(ReproducedCorrelations {
//         reproduced_correlation,
//         residual,
//         variable_order: var_names,
//     })
// }

// pub fn calculate_reproduced_covariances(
//     data: &AnalysisData,
//     config: &FactorAnalysisConfig
// ) -> Result<ReproducedCovariances, String> {
//     // ALGORITHM UNTUK REPRODUCED COVARIANCE:
//     // STEP 1: Mean centering (dilakukan di extract_data_matrix)
//     // STEP 2: Covariance matrix Sigma = (Xcᵀ Xc) / (n - 1)
//     // STEP 3: Eigen decomposition Sigma = Q Λ Qᵀ, sort Λ descending
//     // STEP 4: RAW loadings (tanpa rescaling): L[i][j] = sqrt(Λ[j]) * Q[i][j]
//     // STEP 5: Reproduced covariance: Sigma_reproduced = L_k × L_k^T (using only k components)
//     // STEP 6: Residual: Sigma_residual = Sigma - Sigma_reproduced

//     let (data_matrix, var_names) = extract_data_matrix(data, config)?;

//     // STEP 2: Calculate covariance matrix (NOT correlation, NOT standardized)
//     let cov_matrix = calculate_matrix(&data_matrix, "covariance")?;

//     // STEP 3-4: Extract factors from covariance matrix to get RAW loadings
//     // Penting: extract_factors akan melakukan eigen decomposition pada cov_matrix
//     // dan mengembalikan loadings yang dihitung sebagai: L[i][j] = sqrt(Λ[j]) * Q[i][j]
//     let extraction_result = extract_factors(&cov_matrix, config, &var_names)?;

//     let n_vars = var_names.len();
//     let k = extraction_result.n_factors;
//     let mut reproduced_covariance = HashMap::new();
//     let mut residual = HashMap::new();

//     // STEP 5: Calculate reproduced covariance matrix using RAW loadings
//     // Reproduced = L_k × L_k^T (using only k components, not all p components)
//     let loadings = &extraction_result.loadings;

//     // Ensure we only use the first k columns (k extracted components)
//     let loadings_k = if k < loadings.ncols() {
//         loadings.columns(0, k).into_owned()
//     } else {
//         loadings.clone()
//     };

//     // Reproduced covariance: L_k × L_k^T
//     let reproduced_matrix = &loadings_k * loadings_k.transpose();

//     // Build result matrices
//     for (i, var_name) in var_names.iter().enumerate() {
//         let mut var_reproduced = HashMap::new();
//         let mut var_residual = HashMap::new();

//         for (j, other_var) in var_names.iter().enumerate() {
//             // Reproduced covariance: L_k × L_k^T
//             let repro_cov = if i < reproduced_matrix.nrows() && j < reproduced_matrix.ncols() {
//                 reproduced_matrix[(i, j)]
//             } else {
//                 0.0
//             };
//             var_reproduced.insert(other_var.clone(), repro_cov);

//             // STEP 6: Residual = observed covariance − reproduced covariance
//             let orig_cov = if i < cov_matrix.nrows() && j < cov_matrix.ncols() {
//                 cov_matrix[(i, j)]
//             } else {
//                 0.0
//             };

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

// pub fn calculate_scree_plot(
//     data: &AnalysisData,
//     config: &FactorAnalysisConfig
// ) -> Result<ScreePlot, String> {
//     let (data_matrix, var_names) = extract_data_matrix(data, config)?;

//     // Determine matrix type based on config (covariance vs correlation)
//     let matrix_type = if config.extraction.covariance {
//         "covariance"
//     } else if config.extraction.correlation {
//         "correlation"
//     } else {
//         "correlation" // Default to correlation if neither is explicitly set
//     };

//     let matrix = calculate_matrix(&data_matrix, matrix_type)?;
//     let extraction_result = extract_factors(&matrix, config, &var_names)?;

//     let n_variables = var_names.len();

//     // Ensure we have eigenvalues for all variables
//     let mut eigenvalues = extraction_result.eigenvalues.clone();

//     // Pad with zeros if needed
//     eigenvalues.resize(n_variables, 0.0);

//     // Create component numbers
//     let mut component_numbers = Vec::with_capacity(n_variables);
//     for i in 0..n_variables {
//         component_numbers.push(i + 1);
//     }

//     Ok(ScreePlot {
//         eigenvalues,
//         component_numbers,
//     })
// }

// pub fn calculate_component_score_coefficient_matrix(
//     data: &AnalysisData,
//     config: &FactorAnalysisConfig
// ) -> Result<ComponentScoreCoefficientMatrix, String> {
//     let (data_matrix, var_names) = extract_data_matrix(data, config)?;

//     // Determine matrix type based on config (covariance vs correlation)
//     let matrix_type = if config.extraction.covariance {
//         "covariance"
//     } else if config.extraction.correlation {
//         "correlation"
//     } else {
//         "correlation" // Default to correlation if neither is explicitly set
//     };

//     let matrix = calculate_matrix(&data_matrix, matrix_type)?;
//     let extraction_result = extract_factors(&matrix, config, &var_names)?;

//     // Calculate score coefficients directly
//     let loadings = &extraction_result.loadings;
//     let n_rows = loadings.nrows();
//     let n_cols = loadings.ncols();

//     let mut coefficients = DMatrix::zeros(n_rows, n_cols);

//     // Choose factor score coefficient method
//     if config.scores.regression {
//         // Regression method
//         match matrix.clone().try_inverse() {
//             Some(inv_matrix) => {
//                 coefficients = inv_matrix * loadings;
//             }
//             None => {
//                 return Err(
//                     "Could not invert correlation matrix for factor score calculation".to_string()
//                 );
//             }
//         }
//     } else if config.scores.bartlett {
//         // Bartlett method
//         let mut u_inv_squared = DMatrix::zeros(n_rows, n_rows);
//         for i in 0..n_rows {
//             let h_squared = if i < extraction_result.communalities.len() {
//                 extraction_result.communalities[i]
//             } else {
//                 0.0
//             };

//             let u_squared = (1.0 - h_squared).max(0.001);
//             u_inv_squared[(i, i)] = 1.0 / u_squared;
//         }

//         let a_transpose_u_inv_squared_a = loadings.transpose() * u_inv_squared.clone() * loadings;

//         match a_transpose_u_inv_squared_a.try_inverse() {
//             Some(ata_inv) => {
//                 coefficients = ata_inv * loadings.transpose() * u_inv_squared;
//             }
//             None => {
//                 return Err("Could not invert matrix for Bartlett method".to_string());
//             }
//         }
//     } else if config.scores.anderson {
//         // Anderson-Rubin method
//         let mut u_inv = DMatrix::zeros(n_rows, n_rows);
//         let mut u_inv_squared = DMatrix::zeros(n_rows, n_rows);

//         for i in 0..n_rows {
//             let h_squared = if i < extraction_result.communalities.len() {
//                 extraction_result.communalities[i]
//             } else {
//                 0.0
//             };

//             let u_squared = (1.0 - h_squared).max(0.001);
//             u_inv[(i, i)] = 1.0 / u_squared.sqrt();
//             u_inv_squared[(i, i)] = 1.0 / u_squared;
//         }

//         let a_transpose_u_inv_squared_a = loadings.transpose() * u_inv_squared * loadings;

//         match symmetric_matrix_sqrt(&a_transpose_u_inv_squared_a) {
//             Some(ata_u_sqrt) => {
//                 match ata_u_sqrt.try_inverse() {
//                     Some(ata_u_sqrt_inv) => {
//                         coefficients = u_inv * loadings * ata_u_sqrt_inv;
//                     }
//                     None => {
//                         return Err(
//                             "Could not invert square root matrix for Anderson-Rubin method".to_string()
//                         );
//                     }
//                 }
//             }
//             None => {
//                 return Err(
//                     "Could not calculate square root of matrix for Anderson-Rubin method".to_string()
//                 );
//             }
//         }
//     } else {
//         // Default to regression method
//         match matrix.clone().try_inverse() {
//             Some(inv_matrix) => {
//                 coefficients = inv_matrix * loadings;
//             }
//             None => {
//                 return Err(
//                     "Could not invert correlation matrix for factor score calculation".to_string()
//                 );
//             }
//         }
//     }

//     // Convert to result structure
//     let mut component_score_coefficient_matrix = ComponentScoreCoefficientMatrix {
//         components: HashMap::new(),
//         variable_order: var_names.clone(),
//     };

//     for (i, var_name) in var_names.iter().enumerate() {
//         if i < n_rows {
//             let mut factor_scores = Vec::with_capacity(n_cols);

//             for j in 0..n_cols {
//                 factor_scores.push(coefficients[(i, j)]);
//             }

//             component_score_coefficient_matrix.components.insert(var_name.clone(), factor_scores);
//         }
//     }
//     component_score_coefficient_matrix.variable_order = var_names;

//     Ok(component_score_coefficient_matrix)
// }

// pub fn calculate_component_score_covariance_matrix(
//     data: &AnalysisData,
//     config: &FactorAnalysisConfig
// ) -> Result<ComponentScoreCovarianceMatrix, String> {
//     let (data_matrix, var_names) = extract_data_matrix(data, config)?;
//     let corr_matrix = calculate_matrix(&data_matrix, "correlation")?;
//     let extraction_result = extract_factors(&corr_matrix, config, &var_names)?;

//     // Calculate score covariance matrix directly
//     let loadings = &extraction_result.loadings;
//     let n_rows = loadings.nrows();
//     let n_cols = loadings.ncols();

//     let mut component_score_covariance_matrix = ComponentScoreCovarianceMatrix {
//         components: vec![vec![0.0; n_cols]; n_cols],
//     };

//     if config.scores.anderson {
//         // Anderson-Rubin method produces uncorrelated scores (identity covariance matrix)
//         for i in 0..n_cols {
//             for j in 0..n_cols {
//                 component_score_covariance_matrix.components[i][j] = if i == j { 1.0 } else { 0.0 };
//             }
//         }
//     } else if config.scores.bartlett {
//         // Bartlett method: (A'U^(-2)A)^(-1)
//         let mut u_inv_squared = DMatrix::zeros(n_rows, n_rows);
//         for i in 0..n_rows {
//             let h_squared = if i < extraction_result.communalities.len() {
//                 extraction_result.communalities[i]
//             } else {
//                 0.0
//             };

//             let u_squared = (1.0 - h_squared).max(0.001);
//             u_inv_squared[(i, i)] = 1.0 / u_squared;
//         }

//         let a_transpose_u_inv_squared_a = loadings.transpose() * u_inv_squared * loadings;

//         match a_transpose_u_inv_squared_a.try_inverse() {
//             Some(cov_matrix) => {
//                 for i in 0..n_cols {
//                     for j in 0..n_cols {
//                         component_score_covariance_matrix.components[i][j] = cov_matrix[(i, j)];
//                     }
//                 }
//             }
//             None => {
//                 // Fall back to identity matrix
//                 for i in 0..n_cols {
//                     for j in 0..n_cols {
//                         component_score_covariance_matrix.components[i][j] = if i == j {
//                             1.0
//                         } else {
//                             0.0
//                         };
//                     }
//                 }
//             }
//         }
//     } else {
//         // Regression method: (B'R^(-1)B)
//         // First calculate coefficients
//         let mut coefficients = DMatrix::zeros(n_rows, n_cols);

//         match corr_matrix.clone().try_inverse() {
//             Some(r_inv) => {
//                 coefficients = r_inv.clone() * loadings;
//                 let cov_matrix = coefficients.transpose() * r_inv * coefficients;
//                 for i in 0..n_cols {
//                     for j in 0..n_cols {
//                         component_score_covariance_matrix.components[i][j] = cov_matrix[(i, j)];
//                     }
//                 }
//             }
//             None => {
//                 // Fall back to identity matrix
//                 for i in 0..n_cols {
//                     for j in 0..n_cols {
//                         component_score_covariance_matrix.components[i][j] = if i == j {
//                             1.0
//                         } else {
//                             0.0
//                         };
//                     }
//                 }
//             }
//         }
//     }

//     Ok(component_score_covariance_matrix)
// }

// // Helper function to calculate the symmetric square root of a matrix
// pub fn symmetric_matrix_sqrt(matrix: &DMatrix<f64>) -> Option<DMatrix<f64>> {
//     let n = matrix.nrows();
//     if n != matrix.ncols() {
//         return None;
//     }

//     // Perform eigenvalue decomposition
//     let eigen = matrix.clone().symmetric_eigen();

//     // Create diagonal matrix of sqrt of eigenvalues
//     let mut d_sqrt = DMatrix::zeros(n, n);
//     for i in 0..n {
//         if eigen.eigenvalues[i] < 0.0 {
//             // Matrix is not positive definite
//             return None;
//         }
//         d_sqrt[(i, i)] = eigen.eigenvalues[i].sqrt();
//     }

//     // Compute Q * D^(1/2) * Q'
//     Some(eigen.eigenvectors.clone() * d_sqrt * eigen.eigenvectors.transpose())
// }

// // Create rotated component matrix
// pub fn create_rotated_component_matrix(
//     rotation_result: &RotationResult,
//     var_names: &[String]
// ) -> RotatedComponentMatrix {
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

//     RotatedComponentMatrix {
//         components,
//         variable_order: var_names.to_vec(),
//     }
// }

// // Create component transformation matrix
// pub fn create_component_transformation_matrix(
//     rotation_result: &RotationResult
// ) -> ComponentTransformationMatrix {
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

//     ComponentTransformationMatrix {
//         components,
//     }
// }

// // Create pattern matrix for oblique rotations
// pub fn create_pattern_matrix(
//     rotation_result: &RotationResult,
//     var_names: &[String]
// ) -> PatternMatrix {
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

//     PatternMatrix {
//         components,
//         variable_order: var_names.to_vec(),
//     }
// }

// // Create structure matrix for oblique rotations
// pub fn create_structure_matrix(
//     rotation_result: &RotationResult,
//     var_names: &[String]
// ) -> StructureMatrix {
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

//     StructureMatrix {
//         components,
//         variable_order: var_names.to_vec(),
//     }
// }

// // Create component correlation matrix for oblique rotations
// pub fn create_component_correlation_matrix(
//     rotation_result: &RotationResult
// ) -> ComponentCorrelationMatrix {
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

//     ComponentCorrelationMatrix {
//         correlations,
//     }
// }




// perbaikan bisa (9/1/2026)


use std::collections::HashMap;
use nalgebra::DMatrix;
use super::matrix::calculate_raw_variances;
use crate::models::{
    config::FactorAnalysisConfig,
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

use super::core::{ calculate_matrix, extract_data_matrix, extract_factors, rotate_factors };

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
    // Default jika tidak ada yang dipilih (misalnya, default ke korelasi)
        "correlation" 
    };

    let matrix_for_extraction = calculate_matrix(&data_matrix, matrix_type)?; 
    let extraction_result = extract_factors(&matrix_for_extraction, config, &var_names)?;

    // Properti baru
    let mut raw_initial = HashMap::new();
    let mut rescaled_initial = HashMap::new();
    let mut extraction = HashMap::new();

    // 1. Hitung Raw Initial Variances (Varians Mentah)
    let raw_variances = calculate_raw_variances(&data_matrix)?; 
    for (i, var_name) in var_names.iter().enumerate() {

        // Raw Initial: Selalu diisi dengan Varians Mentah, terlepas dari Extraction Method
        raw_initial.insert(var_name.clone(), raw_variances[i]);

        // Rescaled Initial: Selalu 1.0
        rescaled_initial.insert(var_name.clone(), 1.0);

        // Extraction Communality
        if i < extraction_result.communalities.len() {
            extraction.insert(var_name.clone(), extraction_result.communalities[i]);
        }
    }

    Ok(Communalities {
        raw_initial,
        rescaled_initial,
        extraction, // Tambahkan juga extraction communalities
        variable_order: var_names,
        extraction_matrix_type: matrix_type.to_string(),
    })

}


// pub fn calculate_total_variance_explained(
//     eigenvalues: &[f64],
//     total_variance: f64,
//     n_variables: usize,
//     matrix_type: &str,
// ) -> TotalVarianceExplained {

//     match matrix_type {
//         "correlation" => {
//             let mut initial = Vec::new();
//             let mut extraction = Vec::new();
//             let mut rotation = Vec::new();

//             let mut cumulative = 0.0;

//             for &eig in eigenvalues {
//                 let percent = (eig / n_variables as f64) * 100.0;
//                 cumulative += percent;

//                 let component = TotalVarianceComponent {
//                     total: eig,
//                     percent_of_variance: percent,
//                     cumulative_percent: cumulative,
//                 };

//                 initial.push(component.clone());
//                 extraction.push(component.clone());
//                 rotation.push(component);
//             }

//             TotalVarianceExplained {
//                 blocks: vec![
//                     TotalVarianceBlock {
//                         label: "Component".to_string(),
//                         initial,
//                         extraction,
//                         rotation: Some(rotation),
//                     }
//                 ],
//                 extraction_matrix_type: "correlation".to_string(),
//             }
//         }

//         "covariance" => {
//             let mut raw_initial = Vec::new();
//             let mut raw_extraction = Vec::new();

//             let mut rescaled_initial = Vec::new();
//             let mut rescaled_extraction = Vec::new();

//             let mut cumulative_raw = 0.0;
//             let mut cumulative_rescaled = 0.0;

//             for &eig in eigenvalues {
//                 // RAW
//                 let percent_raw = (eig / total_variance) * 100.0;
//                 cumulative_raw += percent_raw;

//                 raw_initial.push(TotalVarianceComponent {
//                     total: eig,
//                     percent_of_variance: percent_raw,
//                     cumulative_percent: cumulative_raw,
//                 });

//                 raw_extraction.push(TotalVarianceComponent {
//                     total: eig,
//                     percent_of_variance: percent_raw,
//                     cumulative_percent: cumulative_raw,
//                 });

//                 // RESCALED
//                 let rescaled = eig / total_variance * n_variables as f64;
//                 let percent_rescaled = (rescaled / n_variables as f64) * 100.0;
//                 cumulative_rescaled += percent_rescaled;

//                 rescaled_initial.push(TotalVarianceComponent {
//                     total: rescaled,
//                     percent_of_variance: percent_rescaled,
//                     cumulative_percent: cumulative_rescaled,
//                 });

//                 rescaled_extraction.push(TotalVarianceComponent {
//                     total: rescaled,
//                     percent_of_variance: percent_rescaled,
//                     cumulative_percent: cumulative_rescaled,
//                 });
//             }

//             TotalVarianceExplained {
//                 blocks: vec![
//                     TotalVarianceBlock {
//                         label: "Raw".to_string(),
//                         initial: raw_initial,
//                         extraction: raw_extraction,
//                         rotation: None,
//                     },
//                     TotalVarianceBlock {
//                         label: "Rescaled".to_string(),
//                         initial: rescaled_initial,
//                         extraction: rescaled_extraction.clone(),
//                         rotation: Some(rescaled_extraction),
//                     },
//                 ],
//                 extraction_matrix_type: "covariance".to_string(),
//             }
//         }

//         _ => panic!("Unknown matrix type"),
//     }
// }

// pub fn calculate_total_variance_explained_from_data(
//     data: &AnalysisData,
//     config: &FactorAnalysisConfig,
// ) -> Result<TotalVarianceExplained, String> {

//     // Ambil eigenvalues dari hasil ekstraksi
//     let eigenvalues = data
//         .eigenvalues
//         .as_ref()
//         .ok_or("Eigenvalues not found in AnalysisData")?;

//     let n_variables = data.n_variables;

//     let matrix_type = if config.extraction.covariance {
//         "covariance"
//     } else {
//         "correlation"
//     };

//     let total_variance = if matrix_type == "correlation" {
//         n_variables as f64
//     } else {
//         data.total_variance
//             .ok_or("Total variance missing for covariance matrix")?
//     };

//     Ok(calculate_total_variance_explained(
//         eigenvalues,
//         total_variance,
//         n_variables,
//         matrix_type,
//     ))
// }





pub fn calculate_total_variance_explained(
    eigenvalues: &[f64],
    total_variance: f64,
    n_variables: usize,
    matrix_type: &str,
) -> TotalVarianceExplained {

    match matrix_type {
        "correlation" => {
            let mut initial = Vec::new();
            let mut extraction = Vec::new();
            let mut rotation = Vec::new();

            let mut cumulative = 0.0;

            for &eig in eigenvalues {
                let percent = (eig / n_variables as f64) * 100.0;
                cumulative += percent;

                let component = TotalVarianceComponent {
                    total: eig,
                    percent_of_variance: percent,
                    cumulative_percent: cumulative,
                };

                initial.push(component.clone());
                extraction.push(component.clone());
                rotation.push(component);
            }

            TotalVarianceExplained {
                blocks: vec![
                    TotalVarianceBlock {
                        label: "Component".to_string(),
                        initial,
                        extraction,
                        rotation: Some(rotation),
                    }
                ],
                extraction_matrix_type: "correlation".to_string(),
            }
        }

        "covariance" => {
            let mut raw_initial = Vec::new();
            let mut raw_extraction = Vec::new();

            let mut rescaled_initial = Vec::new();
            let mut rescaled_extraction = Vec::new();

            let mut cumulative_raw = 0.0;
            
            // Variabel cumulative untuk rescaled sebenarnya sama dengan raw
            // karena persentasenya sama.
            let mut cumulative_rescaled = 0.0; 

            for &eig in eigenvalues {
                // === RAW ===
                let percent_raw = (eig / total_variance) * 100.0;
                cumulative_raw += percent_raw;

                raw_initial.push(TotalVarianceComponent {
                    total: eig,
                    percent_of_variance: percent_raw,
                    cumulative_percent: cumulative_raw,
                });

                raw_extraction.push(TotalVarianceComponent {
                    total: eig,
                    percent_of_variance: percent_raw,
                    cumulative_percent: cumulative_raw,
                });

                // === RESCALED (PERBAIKAN DISINI) ===
                // Menurut SPSS: "initial eigenvalues are the same across the raw and rescaled solution"
                // Jadi, jangan lakukan normalisasi (eig / total * n_vars). Gunakan eig mentah.
                
                let rescaled = eig; // <--- UBAH INI (sebelumnya ada rumus matematika)
                
                // Persentase varians juga tetap menggunakan basis total variance yang sama
                let percent_rescaled = percent_raw; 
                cumulative_rescaled += percent_rescaled;

                rescaled_initial.push(TotalVarianceComponent {
                    total: rescaled,
                    percent_of_variance: percent_rescaled,
                    cumulative_percent: cumulative_rescaled,
                });

                rescaled_extraction.push(TotalVarianceComponent {
                    total: rescaled,
                    percent_of_variance: percent_rescaled,
                    cumulative_percent: cumulative_rescaled,
                });
            }

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
                        extraction: rescaled_extraction.clone(),
                        rotation: Some(rescaled_extraction),
                    },
                ],
                extraction_matrix_type: "covariance".to_string(),
            }
        }

        _ => panic!("Unknown matrix type"),
    }
}

// PERBAIKAN UTAMA:
// Fungsi ini sekarang menghitung ekstraksi sendiri, tidak bergantung pada data.eigenvalues yang kosong
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
        "correlation" // Default ke correlation jika tidak spesifik
    };

    // 3. Hitung Matriks (R atau S)
    let matrix = calculate_matrix(&data_matrix, matrix_type)?;

    // 4. Lakukan Ekstraksi Faktor untuk mendapatkan Eigenvalues
    // Note: extract_factors di file factor_extraction.rs sudah mengembalikan 'all_eigenvalues'
    // yang kita butuhkan untuk tabel Total Variance.
    let extraction_result = extract_factors(&matrix, config, &var_names)?;

    // 5. Hitung Total Variance yang Valid
    let total_variance: f64 = if is_covariance {
        // Untuk Covariance: Total variance adalah jumlah semua eigenvalues
        extraction_result.eigenvalues.iter().sum()
    } else {
        // Untuk Correlation: Total variance sama dengan jumlah variabel (diagonal 1.0)
        n_variables as f64
    };

    // 6. Generate Struktur Laporan
    // Kita menggunakan eigenvalues dari hasil ekstraksi barusan
    Ok(calculate_total_variance_explained(
        &extraction_result.eigenvalues,
        total_variance,
        n_variables,
        matrix_type,
    ))
}









pub fn calculate_component_matrix(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<ComponentMatrix, String> {
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

    let mut components = HashMap::new();

    for (i, var_name) in var_names.iter().enumerate() {
        if i < extraction_result.loadings.nrows() {
            let mut loadings = Vec::with_capacity(extraction_result.n_factors);

            for j in 0..extraction_result.n_factors {
                loadings.push(extraction_result.loadings[(i, j)]);
            }

            components.insert(var_name.clone(), loadings);
        }
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

pub fn calculate_component_score_coefficient_matrix(
    data: &AnalysisData,
    config: &FactorAnalysisConfig
) -> Result<ComponentScoreCoefficientMatrix, String> {
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

    // Calculate score coefficients directly
    let loadings = &extraction_result.loadings;
    let n_rows = loadings.nrows();
    let n_cols = loadings.ncols();

    let mut coefficients = DMatrix::zeros(n_rows, n_cols);

    // Choose factor score coefficient method
    if config.scores.regression {
        // Regression method
        match matrix.clone().try_inverse() {
            Some(inv_matrix) => {
                coefficients = inv_matrix * loadings;
            }
            None => {
                return Err(
                    "Could not invert correlation matrix for factor score calculation".to_string()
                );
            }
        }
    } else if config.scores.bartlett {
        // Bartlett method
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

        let a_transpose_u_inv_squared_a = loadings.transpose() * u_inv_squared.clone() * loadings;

        match a_transpose_u_inv_squared_a.try_inverse() {
            Some(ata_inv) => {
                coefficients = ata_inv * loadings.transpose() * u_inv_squared;
            }
            None => {
                return Err("Could not invert matrix for Bartlett method".to_string());
            }
        }
    } else if config.scores.anderson {
        // Anderson-Rubin method
        let mut u_inv = DMatrix::zeros(n_rows, n_rows);
        let mut u_inv_squared = DMatrix::zeros(n_rows, n_rows);

        for i in 0..n_rows {
            let h_squared = if i < extraction_result.communalities.len() {
                extraction_result.communalities[i]
            } else {
                0.0
            };

            let u_squared = (1.0 - h_squared).max(0.001);
            u_inv[(i, i)] = 1.0 / u_squared.sqrt();
            u_inv_squared[(i, i)] = 1.0 / u_squared;
        }

        let a_transpose_u_inv_squared_a = loadings.transpose() * u_inv_squared * loadings;

        match symmetric_matrix_sqrt(&a_transpose_u_inv_squared_a) {
            Some(ata_u_sqrt) => {
                match ata_u_sqrt.try_inverse() {
                    Some(ata_u_sqrt_inv) => {
                        coefficients = u_inv * loadings * ata_u_sqrt_inv;
                    }
                    None => {
                        return Err(
                            "Could not invert square root matrix for Anderson-Rubin method".to_string()
                        );
                    }
                }
            }
            None => {
                return Err(
                    "Could not calculate square root of matrix for Anderson-Rubin method".to_string()
                );
            }
        }
    } else {
        // Default to regression method
        match matrix.clone().try_inverse() {
            Some(inv_matrix) => {
                coefficients = inv_matrix * loadings;
            }
            None => {
                return Err(
                    "Could not invert correlation matrix for factor score calculation".to_string()
                );
            }
        }
    }

    // Convert to result structure
    let mut component_score_coefficient_matrix = ComponentScoreCoefficientMatrix {
        components: HashMap::new(),
        variable_order: var_names.clone(),
    };

    for (i, var_name) in var_names.iter().enumerate() {
        if i < n_rows {
            let mut factor_scores = Vec::with_capacity(n_cols);

            for j in 0..n_cols {
                factor_scores.push(coefficients[(i, j)]);
            }

            component_score_coefficient_matrix.components.insert(var_name.clone(), factor_scores);
        }
    }
    component_score_coefficient_matrix.variable_order = var_names;

    Ok(component_score_coefficient_matrix)
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

