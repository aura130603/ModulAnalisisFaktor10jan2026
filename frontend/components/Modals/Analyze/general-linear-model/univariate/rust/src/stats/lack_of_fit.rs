use crate::models::{
    config::UnivariateConfig,
    data::{ AnalysisData },
    result::{ LackOfFitTests, LackOfFitTestsEntries },
};

use super::core::*;

pub fn calculate_lack_of_fit_tests(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<LackOfFitTests, String> {
    let design_info = create_design_response_weights(data, config)?;
    let p_model_params = design_info.r_x_rank;
    let ztwz_matrix = create_cross_product_matrix(&design_info)?;
    let swept_info = perform_sweep_and_extract_results(&ztwz_matrix, design_info.p_parameters)?;

    let ss_error_total = swept_info.s_rss;

    let y_values_vec: Vec<f64> = design_info.y.iter().cloned().collect();
    let groups = create_groups_from_design_matrix(&design_info, &y_values_vec);

    let c_unique_combinations = groups.len();
    let mut ss_pure_error = 0.0;

    for y_group in &groups {
        if y_group.len() > 1 {
            let group_mean = calculate_mean(y_group);
            for &y_val in y_group {
                ss_pure_error += (y_val - group_mean).powi(2);
            }
        }
    }

    let df_pure_error = (design_info.n_samples as isize) - (c_unique_combinations as isize);

    let ss_lack_of_fit = (ss_error_total - ss_pure_error).max(0.0);
    let df_lack_of_fit = (c_unique_combinations as isize) - (p_model_params as isize);

    let ms_lack_of_fit = if df_lack_of_fit > 0 {
        ss_lack_of_fit / (df_lack_of_fit as f64)
    } else {
        0.0
    };

    let ms_pure_error = if df_pure_error > 0 {
        ss_pure_error / (df_pure_error as f64)
    } else {
        0.0
    };

    let f_value_lof = if ms_pure_error > 1e-9 && df_lack_of_fit > 0 {
        (ms_lack_of_fit / ms_pure_error).max(0.0)
    } else if df_lack_of_fit == 0 && ss_lack_of_fit < 1e-9 {
        0.0
    } else {
        f64::NAN
    };

    let significance_lof = if df_lack_of_fit > 0 && df_pure_error > 0 && !f_value_lof.is_nan() {
        calculate_f_significance(df_lack_of_fit as usize, df_pure_error as usize, f_value_lof)
    } else {
        f64::NAN
    };

    let partial_eta_squared_lof = if config.options.est_effect_size {
        if ss_error_total.abs() > 1e-9 {
            (ss_lack_of_fit / ss_error_total).max(0.0).min(1.0)
        } else {
            0.0
        }
    } else {
        f64::NAN
    };

    let (noncent_parameter_lof, observed_power_lof) = if config.options.obs_power {
        let noncent_parameter_lof = if df_lack_of_fit > 0 && !f_value_lof.is_nan() {
            (df_lack_of_fit as f64) * f_value_lof
        } else {
            0.0
        };

        let observed_power_lof = if
            df_lack_of_fit > 0 &&
            df_pure_error > 0 &&
            !f_value_lof.is_nan()
        {
            calculate_observed_power_f(
                f_value_lof,
                df_lack_of_fit as f64,
                df_pure_error as f64,
                config.options.sig_level
            )
        } else {
            f64::NAN
        };
        (noncent_parameter_lof, observed_power_lof)
    } else {
        (f64::NAN, f64::NAN)
    };

    let mut notes = Vec::new();
    if let Some(dep_var) = &config.main.dep_var {
        notes.push(format!("Dependent Variable: {}", dep_var));
    }

    notes.push(
        format!(
            "Significance level for F-test and power calculation: {}. Partial eta-squared for Lack of Fit is calculated as SS_LOF / SS_Error_Total.",
            config.options.sig_level
        )
    );

    Ok(LackOfFitTests {
        lack_of_fit: LackOfFitTestsEntries {
            sum_of_squares: ss_lack_of_fit,
            df: df_lack_of_fit.max(0) as usize,
            mean_square: ms_lack_of_fit,
            f_value: f_value_lof,
            significance: significance_lof,
            partial_eta_squared: partial_eta_squared_lof,
            noncent_parameter: noncent_parameter_lof,
            observed_power: observed_power_lof,
        },
        pure_error: LackOfFitTestsEntries {
            sum_of_squares: ss_pure_error,
            df: df_pure_error.max(0) as usize,
            mean_square: ms_pure_error,
            f_value: f64::NAN,
            significance: f64::NAN,
            partial_eta_squared: f64::NAN,
            noncent_parameter: f64::NAN,
            observed_power: f64::NAN,
        },
        note: Some(notes.join(" \n")),
        interpretation: Some(
            "The Lack of Fit test assesses whether the model is adequate. A significant F-value (p < .05) indicates that the model does not fit the data well (i.e., there is a significant lack of fit). Pure Error represents the variability of the response variable at fixed predictor values.".to_string()
        ),
    })
}
