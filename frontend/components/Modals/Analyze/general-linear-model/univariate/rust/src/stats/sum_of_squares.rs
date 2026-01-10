use nalgebra::{ DMatrix, DVector };
use crate::models::{ config::UnivariateConfig, data::AnalysisData, result::DesignMatrixInfo };

use super::core::*;

pub fn calculate_ss_for_term(
    l_matrix: &DMatrix<f64>,
    beta_hat_model: &DVector<f64>,
    g_inv_model: &DMatrix<f64>,
    term_of_interest: &str
) -> Result<(f64, usize), String> {
    if l_matrix.nrows() == 0 || l_matrix.ncols() == 0 {
        return Ok((0.0, 0));
    }

    if beta_hat_model.nrows() != l_matrix.ncols() {
        return Err(
            format!(
                "L-matrix ({},{}) and Beta-hat ({}) dimensions mismatch for term '{}'",
                l_matrix.nrows(),
                l_matrix.ncols(),
                beta_hat_model.nrows(),
                term_of_interest
            )
        );
    }

    if g_inv_model.nrows() != l_matrix.ncols() || g_inv_model.ncols() != l_matrix.ncols() {
        return Err(
            format!(
                "L-matrix ({},{}) and G_inv ({},{}) dimensions mismatch for term '{}'",
                l_matrix.nrows(),
                l_matrix.ncols(),
                g_inv_model.nrows(),
                g_inv_model.ncols(),
                term_of_interest
            )
        );
    }

    let l_beta_hat = l_matrix * beta_hat_model;

    let l_g_inv_lt = l_matrix * g_inv_model * l_matrix.transpose();

    let df_term = l_g_inv_lt.rank(1e-8);
    if df_term == 0 {
        return Ok((0.0, 0));
    }

    let l_g_inv_lt_inv_tolerance = 1e-12;
    let l_g_inv_lt_inv = l_g_inv_lt
        .clone()
        .svd(true, true)
        .pseudo_inverse(l_g_inv_lt_inv_tolerance)
        .map_err(|e|
            format!(
                "Singular (LGL') matrix for term '{}', pseudo-inverse failed: {}. Cannot compute SS. LGL' norm: {:.2e}",
                term_of_interest,
                e,
                l_g_inv_lt.norm()
            )
        )?;

    let ss_matrix = l_beta_hat.transpose() * l_g_inv_lt_inv * l_beta_hat;

    if ss_matrix.nrows() == 1 && ss_matrix.ncols() == 1 {
        Ok((ss_matrix[(0, 0)].max(0.0), df_term))
    } else {
        Err(
            format!(
                "SS calculation for term '{}' resulted in a non-scalar matrix ({}x{}).",
                term_of_interest,
                ss_matrix.nrows(),
                ss_matrix.ncols()
            )
        )
    }
}

pub fn calculate_type_i_ss(
    design_info: &DesignMatrixInfo,
    term_of_interest: &str,
    all_model_terms: &[String],
    beta_hat: &DVector<f64>,
    g_inv: &DMatrix<f64>,
    ztwz_matrix: &DMatrix<f64>
) -> Result<(f64, usize), String> {
    let l_matrix = construct_type_i_l_matrix(
        design_info,
        term_of_interest,
        all_model_terms,
        ztwz_matrix
    )?;

    calculate_ss_for_term(&l_matrix, beta_hat, g_inv, term_of_interest)
}

pub fn calculate_type_ii_ss(
    design_info: &DesignMatrixInfo,
    term_of_interest: &str,
    all_model_terms: &[String],
    beta_hat: &DVector<f64>,
    g_inv: &DMatrix<f64>
) -> Result<(f64, usize), String> {
    let l_matrix = construct_type_ii_l_matrix(design_info, term_of_interest, all_model_terms)?;

    calculate_ss_for_term(&l_matrix, beta_hat, g_inv, term_of_interest)
}

pub fn calculate_type_iii_ss(
    design_info: &DesignMatrixInfo,
    term_of_interest: &str,
    all_model_terms: &[String],
    beta_hat: &DVector<f64>,
    g_inv: &DMatrix<f64>,
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<(f64, usize), String> {
    let l_matrix = construct_type_iii_l_matrix(
        design_info,
        term_of_interest,
        all_model_terms,
        data,
        config
    )?;

    calculate_ss_for_term(&l_matrix, beta_hat, g_inv, term_of_interest)
}

pub fn calculate_type_iv_ss(
    design_info: &DesignMatrixInfo,
    term_of_interest: &str,
    all_model_terms: &[String],
    beta_hat: &DVector<f64>,
    g_inv: &DMatrix<f64>,
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<(f64, usize), String> {
    let l_matrix = construct_type_iv_l_matrix(
        design_info,
        term_of_interest,
        all_model_terms,
        data,
        config
    )?;

    calculate_ss_for_term(&l_matrix, beta_hat, g_inv, term_of_interest)
}
