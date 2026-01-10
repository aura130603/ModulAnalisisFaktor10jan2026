use crate::models::{ config::UnivariateConfig, data::AnalysisData, result::SavedVariables };
use nalgebra::DVector;

use super::core::*;

pub fn save_variables(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<SavedVariables, String> {
    let mut result = SavedVariables::default();

    let design_info = create_design_response_weights(data, config)?;

    let n = design_info.n_samples;
    let p = design_info.p_parameters;
    let rank = design_info.r_x_rank;

    let x = &design_info.x;
    let y = &design_info.y;

    let ztwz_matrix = create_cross_product_matrix(&design_info)?;
    let swept_info = perform_sweep_and_extract_results(&ztwz_matrix, p)?;

    let beta_hat = &swept_info.beta_hat;
    let g_inv = &swept_info.g_inv;

    let y_hat = x * beta_hat;
    let residuals = y - &y_hat;

    let df_residual = (n - rank) as f64;
    if df_residual <= 0.0 {
        return Err(
            "Cannot calculate saved variables with zero or negative degrees of freedom for error.".to_string()
        );
    }
    let mse = swept_info.s_rss / df_residual;

    let weight_values = match &design_info.w {
        Some(w) => w.clone_owned(),
        None => DVector::from_element(n, 1.0),
    };

    let h_diag = DVector::from_iterator(
        n,
        (0..n).map(|i| {
            let x_i = x.row(i);
            let temp = x_i * g_inv;
            (temp * x_i.transpose())[(0, 0)]
        })
    );

    for i in 0..n {
        let weight = weight_values[i];
        let residual = residuals[i];

        let h_i = h_diag[i];

        let leverage = weight * h_i;

        let se_residual_denom = 1.0 / weight - h_i;

        let se_residual = if weight > 0.0 && se_residual_denom > 0.0 {
            (mse * se_residual_denom).sqrt()
        } else {
            f64::NAN
        };

        if config.save.unstandardized_pre {
            result.predicted_values.push(y_hat[i]);
        }

        if config.save.weighted_pre {
            result.weighted_predicted_values.push(y_hat[i] * weight.sqrt());
        }

        if config.save.std_statistics {
            result.standard_errors.push((mse * h_i).sqrt());
        }

        if config.save.unstandardized_res {
            result.residuals.push(residual);
        }

        if config.save.weighted_res {
            result.weighted_residuals.push(residual * weight.sqrt());
        }

        if config.save.deleted_res {
            if weight > 0.0 && se_residual_denom > 0.0 {
                result.deleted_residuals.push(residual / se_residual_denom);
            } else {
                result.deleted_residuals.push(f64::NAN);
            }
        }

        if config.save.standardized_res {
            if weight > 0.0 {
                result.standardized_residuals.push(residual / (mse / weight).sqrt());
            } else {
                result.standardized_residuals.push(f64::NAN);
            }
        }

        if config.save.studentized_res {
            if se_residual.is_finite() && se_residual > 0.0 {
                result.studentized_residuals.push(residual / se_residual);
            } else {
                result.studentized_residuals.push(f64::NAN);
            }
        }

        if config.save.cooks_d {
            if se_residual.is_finite() && se_residual > 0.0 && leverage < 1.0 && leverage >= 0.0 {
                let stud_res = residual / se_residual;
                let cook_d = (stud_res.powi(2) / (rank as f64)) * (leverage / (1.0 - leverage));
                result.cook_distances.push(cook_d);
            } else {
                result.cook_distances.push(f64::NAN);
            }
        }

        if config.save.leverage {
            result.leverages.push(leverage);
        }
    }

    Ok(result)
}
