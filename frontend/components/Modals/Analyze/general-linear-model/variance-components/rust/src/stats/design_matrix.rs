use nalgebra::{ DMatrix, DVector };
use std::collections::HashMap;

use crate::models::{ config::VarianceCompsConfig, data::AnalysisData };
use super::core::{ data_value_to_f64, data_value_to_string, get_factor_levels };

/// Create design matrix dan response vector dari data dan konfigurasi
pub fn create_design_and_response(
    data: &AnalysisData,
    config: &VarianceCompsConfig
) -> Result<(Vec<Vec<f64>>, Vec<f64>), String> {
    // Validasi input
    let dep_var = match &config.main.dep_var {
        Some(var) => var,
        None => {
            return Err("No dependent variable specified".to_string());
        }
    };

    // Dapatkan ukuran sampel
    let n_samples = data.dependent_data[0].len();

    // Ekstrak response vector (y)
    let mut y = Vec::with_capacity(n_samples);
    for records in &data.dependent_data[0] {
        if let Some(value) = records.values.get(dep_var) {
            if let Some(val) = data_value_to_f64(value) {
                y.push(val);
            } else {
                return Err(format!("Non-numeric value in dependent variable {}", dep_var));
            }
        }
    }

    // Buat design matrix
    let mut design_matrix = Vec::new();

    // Tambahkan intercept jika diikutsertakan
    if config.model.intercept {
        let intercept_col = vec![1.0; n_samples];
        design_matrix.push(intercept_col);
    }

    // Tambahkan fixed factors
    if let Some(fix_factors) = &config.main.fix_factor {
        for factor in fix_factors {
            let levels = get_factor_levels(data, config, factor)?;

            // Coding efek untuk setiap level kecuali level terakhir (reference level)
            for j in 0..levels.len() - 1 {
                let mut col = vec![0.0; n_samples];

                // Isi kolom berdasarkan data faktor
                let mut row_idx = 0;
                for records in &data.fix_factor_data {
                    for record in records {
                        if row_idx >= n_samples {
                            break;
                        }

                        if let Some(value) = record.values.get(factor) {
                            let level = data_value_to_string(value);

                            if level == levels[j] {
                                col[row_idx] = 1.0;
                            }
                        }
                        row_idx += 1;
                    }
                }

                design_matrix.push(col);
            }
        }
    }

    // Tambahkan random factors
    if let Some(rand_factors) = &config.main.rand_factor {
        if let Some(rand_factor_data) = &data.random_factor_data {
            for (i, factor) in rand_factors.iter().enumerate() {
                if i < rand_factor_data.len() {
                    let levels = get_factor_levels(data, config, factor)?;

                    // Coding efek untuk setiap level
                    for j in 0..levels.len() {
                        let mut col = vec![0.0; n_samples];

                        // Isi kolom berdasarkan data faktor
                        let mut row_idx = 0;
                        for records in &rand_factor_data[i] {
                            if row_idx >= n_samples {
                                break;
                            }

                            if let Some(value) = records.values.get(factor) {
                                let level = data_value_to_string(value);

                                if level == levels[j] {
                                    col[row_idx] = 1.0;
                                }
                            }

                            row_idx += 1;
                        }

                        design_matrix.push(col);
                    }
                }
            }
        }
    }

    // Tambahkan covariates
    if let Some(covariates) = &config.main.covar {
        if let Some(covariate_data) = &data.covariate_data {
            for (i, covar) in covariates.iter().enumerate() {
                if i < covariate_data.len() {
                    let mut col = vec![0.0; n_samples];

                    // Isi kolom berdasarkan data kovariat
                    let mut row_idx = 0;
                    for records in &covariate_data[i] {
                        if row_idx >= n_samples {
                            break;
                        }

                        if let Some(value) = records.values.get(covar) {
                            if let Some(val) = data_value_to_f64(value) {
                                col[row_idx] = val;
                                row_idx += 1;
                            } else {
                                return Err(format!("Non-numeric value in covariate {}", covar));
                            }
                        }
                    }

                    design_matrix.push(col);
                }
            }
        }
    }

    Ok((design_matrix, y))
}

/// Buat matriks desain untuk setiap efek dan matriks varians-kovarians yang sesuai
pub fn create_effect_matrices(
    data: &AnalysisData,
    config: &VarianceCompsConfig
) -> Result<(Vec<DMatrix<f64>>, Vec<DMatrix<f64>>), String> {
    // Dapatkan ukuran sampel dan desain matrix dasar
    let (design_vecs, y) = create_design_and_response(data, config)?;
    let n_samples = y.len();

    // Buat matriks X0 (fixed effects)
    let mut x0_cols = Vec::new();
    let mut col_idx = 0;

    // Tambahkan intercept jika diikutsertakan
    if config.model.intercept {
        if col_idx < design_vecs.len() {
            x0_cols.push(DVector::from_vec(design_vecs[col_idx].clone()));
            col_idx += 1;
        }
    }

    // Tambahkan fixed factors
    if let Some(fix_factors) = &config.main.fix_factor {
        for factor in fix_factors {
            let levels = get_factor_levels(data, config, factor)?;
            let n_dummy_vars = levels.len() - 1; // Dummy coding

            for j in 0..n_dummy_vars {
                if col_idx < design_vecs.len() {
                    x0_cols.push(DVector::from_vec(design_vecs[col_idx].clone()));
                    col_idx += 1;
                }
            }
        }
    }

    // Buat X0 sebagai DMatrix dari kolom-kolom tersebut
    let x0 = if !x0_cols.is_empty() {
        DMatrix::from_columns(&x0_cols)
    } else {
        DMatrix::zeros(n_samples, 0)
    };

    // Kumpulkan semua matriks X
    let mut x_matrices = Vec::new();
    x_matrices.push(x0);

    // Tambahkan X matrices untuk random effects
    let mut v_matrices = Vec::new();

    if let Some(rand_factors) = &config.main.rand_factor {
        for factor in rand_factors {
            let levels = get_factor_levels(data, config, factor)?;
            let n_levels = levels.len();

            let mut xi_cols = Vec::new();
            for j in 0..n_levels {
                if col_idx < design_vecs.len() {
                    xi_cols.push(DVector::from_vec(design_vecs[col_idx].clone()));
                    col_idx += 1;
                }
            }

            let xi = DMatrix::from_columns(&xi_cols);

            // Buat matriks varians-kovarians Vi = Xi Xi'
            let vi = &xi * &xi.transpose();

            x_matrices.push(xi);
            v_matrices.push(vi);
        }
    }

    // Tambahkan matriks varians-kovarians residual (matriks identitas)
    let v_residual = DMatrix::identity(n_samples, n_samples);
    v_matrices.push(v_residual);

    Ok((x_matrices, v_matrices))
}

/// Buat matriks desain dan mengekstrak informasi komponen model
pub fn extract_model_components(
    data: &AnalysisData,
    config: &VarianceCompsConfig
) -> Result<HashMap<String, DMatrix<f64>>, String> {
    let (design_vecs, _) = create_design_and_response(data, config)?;
    let mut components = HashMap::new();
    let mut col_idx = 0;

    // Tambahkan intercept jika diikutsertakan
    if config.model.intercept {
        if col_idx < design_vecs.len() {
            let intercept_mat = DMatrix::from_column_slice(
                design_vecs[col_idx].len(),
                1,
                &design_vecs[col_idx]
            );
            components.insert("Intercept".to_string(), intercept_mat);
            col_idx += 1;
        }
    }

    // Tambahkan fixed factors
    if let Some(fix_factors) = &config.main.fix_factor {
        for factor in fix_factors {
            let levels = get_factor_levels(data, config, factor)?;
            let n_dummy_vars = levels.len() - 1; // Dummy coding

            let mut factor_cols = Vec::new();
            for j in 0..n_dummy_vars {
                if col_idx < design_vecs.len() {
                    factor_cols.push(DVector::from_vec(design_vecs[col_idx].clone()));
                    col_idx += 1;
                }
            }

            if !factor_cols.is_empty() {
                let factor_mat = DMatrix::from_columns(&factor_cols);
                components.insert(factor.clone(), factor_mat);
            }
        }
    }

    // Tambahkan random factors
    if let Some(rand_factors) = &config.main.rand_factor {
        for factor in rand_factors {
            let levels = get_factor_levels(data, config, factor)?;
            let n_levels = levels.len();

            let mut factor_cols = Vec::new();
            for j in 0..n_levels {
                if col_idx < design_vecs.len() {
                    factor_cols.push(DVector::from_vec(design_vecs[col_idx].clone()));
                    col_idx += 1;
                }
            }

            if !factor_cols.is_empty() {
                let factor_mat = DMatrix::from_columns(&factor_cols);
                components.insert(factor.clone(), factor_mat);
            }
        }
    }

    // Tambahkan covariates
    if let Some(covariates) = &config.main.covar {
        for covar in covariates {
            if col_idx < design_vecs.len() {
                let covar_mat = DMatrix::from_column_slice(
                    design_vecs[col_idx].len(),
                    1,
                    &design_vecs[col_idx]
                );
                components.insert(covar.clone(), covar_mat);
                col_idx += 1;
            }
        }
    }

    Ok(components)
}
