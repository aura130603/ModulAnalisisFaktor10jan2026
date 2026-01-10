use std::collections::HashMap;
use std::f64;
use nalgebra::{ DMatrix, DVector, SymmetricEigen };

use crate::models::{ config::VarianceCompsConfig, data::{ AnalysisData, DataValue } };

/// Konversi dari DataValue ke f64
pub fn data_value_to_f64(value: &DataValue) -> Option<f64> {
    match value {
        DataValue::Number(n) => Some(*n),
        DataValue::Boolean(true) => Some(1.0),
        DataValue::Boolean(false) => Some(0.0),
        _ => None,
    }
}

/// Konversi dari DataValue ke String
pub fn data_value_to_string(value: &DataValue) -> String {
    match value {
        DataValue::Number(n) => n.to_string(),
        DataValue::Text(s) => s.clone(),
        DataValue::Boolean(b) => b.to_string(),
        DataValue::Null => "NULL".to_string(),
    }
}

/// Konversi matriks kovarians ke matriks korelasi
pub fn convert_to_correlation_matrix(
    covariance_matrix: &HashMap<String, HashMap<String, f64>>
) -> HashMap<String, HashMap<String, f64>> {
    let mut correlation_matrix = HashMap::new();
    let mut std_devs = HashMap::new();

    // Ekstrak komponen dan hitung standar deviasi
    for (key, row) in covariance_matrix {
        if let Some(&variance) = row.get(key) {
            if variance > 0.0 {
                std_devs.insert(key.clone(), variance.sqrt());
            } else {
                std_devs.insert(key.clone(), 1.0); // Fallback jika varians ≤ 0
            }
        }
    }

    // Hitung korelasi
    for (i_key, i_row) in covariance_matrix {
        let mut corr_row = HashMap::new();

        for (j_key, &cov) in i_row {
            let i_std = std_devs.get(i_key).cloned().unwrap_or(1.0);
            let j_std = std_devs.get(j_key).cloned().unwrap_or(1.0);

            let corr = if i_std > 0.0 && j_std > 0.0 { cov / (i_std * j_std) } else { 0.0 };

            corr_row.insert(j_key.clone(), corr);
        }

        correlation_matrix.insert(i_key.clone(), corr_row);
    }

    correlation_matrix
}

/// Mendapatkan level faktor dari data dan konfigurasi
pub fn get_factor_levels(
    data: &AnalysisData,
    config: &VarianceCompsConfig,
    factor: &str
) -> Result<Vec<String>, String> {
    use super::core::calculate_factor_level_information;

    // Buat config temporary untuk mengekstrak level faktor
    let factor_level_info = calculate_factor_level_information(data, config)?;

    for factor_info in &factor_level_info.factors {
        if factor_info.factor_name == factor {
            return Ok(
                factor_info.levels
                    .iter()
                    .map(|l| l.level.clone())
                    .collect()
            );
        }
    }

    Err(format!("Factor {} not found in data", factor))
}

// Functions moved from linalg.rs
/// Konversi dari Vec<Vec<f64>> ke Matrix nalgebra
pub fn from_vec(data: &[Vec<f64>]) -> Result<DMatrix<f64>, String> {
    let rows = data.len();
    if rows == 0 {
        return Err("Empty matrix".to_string());
    }

    let cols = data[0].len();
    let mut flat_data = Vec::with_capacity(rows * cols);

    for row in data {
        if row.len() != cols {
            return Err("Inconsistent row lengths".to_string());
        }
        flat_data.extend_from_slice(row);
    }

    Ok(DMatrix::from_vec(rows, cols, flat_data))
}

/// Konversi dari Vec<f64> ke Vector nalgebra
pub fn vec_to_vector(data: &[f64]) -> DVector<f64> {
    DVector::from_vec(data.to_vec())
}

/// Cek apakah matriks positive definite
pub fn is_positive_definite(mat: &DMatrix<f64>) -> bool {
    if !mat.is_square() {
        return false;
    }

    let eigen = SymmetricEigen::new(mat.clone());
    eigen.eigenvalues.iter().all(|&v| v > 0.0)
}

/// Cek apakah matriks non-negative definite
pub fn is_nonnegative_definite(mat: &DMatrix<f64>) -> bool {
    if !mat.is_square() {
        return false;
    }

    let eigen = SymmetricEigen::new(mat.clone());
    eigen.eigenvalues.iter().all(|&v| v >= -1e-10) // Toleransi numerik kecil
}

/// Menyelesaikan sistem linear Ax = b
pub fn solve_linear_system(a: &DMatrix<f64>, b: &DVector<f64>) -> Result<DVector<f64>, String> {
    match a.clone().lu().solve(b) {
        Some(x) => Ok(x),
        None => Err("Linear system is singular or ill-conditioned".to_string()),
    }
}

/// Hitung trace dari matriks
pub fn trace(mat: &DMatrix<f64>) -> f64 {
    let mut tr = 0.0;
    let min_dim = std::cmp::min(mat.nrows(), mat.ncols());
    for i in 0..min_dim {
        tr += mat[(i, i)];
    }
    tr
}

/// Hitung sum of squares dari semua elemen matriks
pub fn ssq(mat: &DMatrix<f64>) -> f64 {
    mat.iter().fold(0.0, |acc, &x| acc + x * x)
}

/// Konversi matrix HashMap ke nalgebra DMatrix
pub fn hashmap_to_matrix(
    hash_mat: &HashMap<String, HashMap<String, f64>>,
    keys: &[String]
) -> DMatrix<f64> {
    let n = keys.len();
    let mut mat = DMatrix::zeros(n, n);

    for (i, key_i) in keys.iter().enumerate() {
        if let Some(row) = hash_mat.get(key_i) {
            for (j, key_j) in keys.iter().enumerate() {
                if let Some(&val) = row.get(key_j) {
                    mat[(i, j)] = val;
                }
            }
        }
    }

    mat
}

/// Konversi nalgebra DMatrix ke HashMap
pub fn matrix_to_hashmap(
    mat: &DMatrix<f64>,
    keys: &[String]
) -> HashMap<String, HashMap<String, f64>> {
    let mut hash_mat = HashMap::new();

    for (i, key_i) in keys.iter().enumerate() {
        let mut row = HashMap::new();
        for (j, key_j) in keys.iter().enumerate() {
            row.insert(key_j.clone(), mat[(i, j)]);
        }
        hash_mat.insert(key_i.clone(), row);
    }

    hash_mat
}
