use std::collections::HashMap;

use crate::models::{
    config::MultivariateConfig,
    data::AnalysisData,
    result::SavedVariables,
};

use super::core::{ build_design_matrix_and_response, to_dmatrix, to_dvector };

/// Save variables
pub fn save_variables(
    data: &AnalysisData,
    config: &MultivariateConfig
) -> Result<SavedVariables, String> {
    let mut variable_values = HashMap::new();

    // Get dependent variables
    let dependent_vars = data.dependent_data_defs
        .iter()
        .flat_map(|defs| defs.iter().map(|def| def.name.clone()))
        .collect::<Vec<String>>();

    // Check which variables to save
    let should_save_residuals =
        config.save.unstandardized_res ||
        config.save.standardized_res ||
        config.save.studentized_res ||
        config.save.deleted_res;

    let should_save_predicted = config.save.pre_weighted;
    let should_save_cook = config.save.cooks_d;
    let should_save_leverage = config.save.leverage;

    if should_save_residuals || should_save_predicted || should_save_cook || should_save_leverage {
        for dep_var in &dependent_vars {
            // Fit the model
            let (x_matrix, y_vector) = build_design_matrix_and_response(data, config, dep_var)?;

            let x_mat = to_dmatrix(&x_matrix);
            let y_vec = to_dvector(&y_vector);

            let x_transpose_x = &x_mat.transpose() * &x_mat;
            let x_transpose_y = &x_mat.transpose() * &y_vec;

            // Get parameter estimates
            let beta = match x_transpose_x.clone().try_inverse() {
                Some(inv) => inv * x_transpose_y,
                None => {
                    return Err(
                        "Could not invert X'X matrix - possibly due to multicollinearity".to_string()
                    );
                }
            };

            // Calculate fitted values and residuals
            let y_hat = &x_mat * &beta;
            let residuals = &y_vec - &y_hat;

            // Calculate degrees of freedom
            let n = y_vector.len();
            let p = x_matrix[0].len();
            let df_error = n - p;

            // Calculate residual mean square error
            let ss_error = residuals
                .iter()
                .map(|r| r.powi(2))
                .sum::<f64>();
            let ms_error = ss_error / (df_error as f64);

            // Calculate hat matrix diagonal (leverage values)
            let xtx_inv = x_transpose_x.try_inverse().unwrap();
            let hat_diag = (0..x_mat.nrows())
                .map(|i| {
                    let x_i = x_mat.row(i);
                    let h_ii = x_i * xtx_inv.clone() * x_i.transpose();
                    h_ii[0]
                })
                .collect::<Vec<f64>>();

            // Save predicted values
            if should_save_predicted {
                variable_values.insert(format!("{}_PRE", dep_var), y_hat.iter().copied().collect());
            }

            // Save unstandardized residuals
            if config.save.unstandardized_res {
                variable_values.insert(
                    format!("{}_RES", dep_var),
                    residuals.iter().copied().collect()
                );
            }

            // Save standardized residuals
            if config.save.standardized_res {
                let std_residuals = residuals
                    .iter()
                    .map(|r| r / ms_error.sqrt())
                    .collect();

                variable_values.insert(format!("{}_ZRE", dep_var), std_residuals);
            }

            // Save studentized residuals
            if config.save.studentized_res {
                let stud_residuals = residuals
                    .iter()
                    .zip(hat_diag.iter())
                    .map(|(r, h)| r / (ms_error * (1.0 - h)).sqrt())
                    .collect();

                variable_values.insert(format!("{}_SRE", dep_var), stud_residuals);
            }

            // Save deleted residuals
            if config.save.deleted_res {
                let del_residuals = residuals
                    .iter()
                    .zip(hat_diag.iter())
                    .map(|(r, h)| {
                        if *h < 1.0 {
                            r / (1.0 - h)
                        } else {
                            0.0 // Avoid division by zero
                        }
                    })
                    .collect();

                variable_values.insert(format!("{}_DRE", dep_var), del_residuals);
            }

            // Save Cook's distance
            if should_save_cook {
                let cook_d = residuals
                    .iter()
                    .zip(hat_diag.iter())
                    .map(|(r, h)| {
                        if *h < 1.0 {
                            (r.powi(2) / ((p as f64) * ms_error)) * (h / (1.0 - h))
                        } else {
                            0.0 // Avoid division by zero
                        }
                    })
                    .collect();

                variable_values.insert(format!("{}_COO", dep_var), cook_d);
            }

            // Save leverage values
            if should_save_leverage {
                variable_values.insert(format!("{}_LEV", dep_var), hat_diag);
            }
        }
    }

    if variable_values.is_empty() {
        Err("No variables to save".to_string())
    } else {
        Ok(SavedVariables { variable_values })
    }
}
