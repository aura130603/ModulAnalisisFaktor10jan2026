use std::collections::HashMap;

use crate::models::{
    config::MultivariateConfig,
    data::AnalysisData,
    result::{ SpreadVsLevelPlots, SpreadVsLevelPoint },
};

use super::core::{ build_design_matrix_and_response, calculate_mean, to_dmatrix, to_dvector };

/// Calculate spread vs level plots
pub fn calculate_spread_vs_level_plots(
    data: &AnalysisData,
    config: &MultivariateConfig
) -> Result<HashMap<String, SpreadVsLevelPlots>, String> {
    let mut result = HashMap::new();

    // Get dependent variables
    let dependent_vars = data.dependent_data_defs
        .iter()
        .flat_map(|defs| defs.iter().map(|def| def.name.clone()))
        .collect::<Vec<String>>();

    for dep_var in &dependent_vars {
        let (x_matrix, y_vector) = build_design_matrix_and_response(data, config, dep_var)?;

        // Fit the model
        let x_mat = to_dmatrix(&x_matrix);
        let y_vec = to_dvector(&y_vector);

        let x_transpose_x = &x_mat.transpose() * &x_mat;
        let x_transpose_y = &x_mat.transpose() * &y_vec;

        // Get parameter estimates (beta coefficients)
        let beta = match x_transpose_x.try_inverse() {
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

        // Calculate absolute residuals
        let abs_residuals: Vec<f64> = residuals
            .iter()
            .map(|r| r.abs())
            .collect();

        // Group by predicted values (rounded to nearest 0.5 for binning)
        // Use a Vec instead of HashMap since f64 doesn't implement Eq and Hash
        let mut level_spreads: Vec<(f64, Vec<f64>)> = Vec::new();

        for i in 0..y_hat.len() {
            let level = (y_hat[i] * 2.0).round() / 2.0; // Round to nearest 0.5
            let spread = abs_residuals[i];

            // Find the appropriate group or create a new one
            let mut found = false;
            for (existing_level, spreads) in &mut level_spreads {
                // Use approximate equality for floating point comparison
                if (*existing_level - level).abs() < 1e-10 {
                    spreads.push(spread);
                    found = true;
                    break;
                }
            }

            if !found {
                level_spreads.push((level, vec![spread]));
            }
        }

        // Calculate mean spread for each level
        let mut points = Vec::new();

        for (level, spreads) in level_spreads {
            let mean_spread = calculate_mean(&spreads);

            points.push(SpreadVsLevelPoint {
                level_mean: level,
                spread_standard_deviation: mean_spread,
            });
        }

        // Sort points by level for proper plotting
        points.sort_by(|a, b|
            a.level_mean.partial_cmp(&b.level_mean).unwrap_or(std::cmp::Ordering::Equal)
        );

        result.insert(dep_var.clone(), SpreadVsLevelPlots { points });
    }

    Ok(result)
}
