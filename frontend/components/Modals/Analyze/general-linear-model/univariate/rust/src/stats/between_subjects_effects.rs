use crate::models::{
    config::{ SumOfSquaresMethod, UnivariateConfig },
    data::AnalysisData,
    result::{
        DesignMatrixInfo,
        SourceEntry,
        SweptMatrixInfo,
        TestEffectEntry,
        TestsBetweenSubjectsEffects,
    },
};

use super::core::*;

pub fn calculate_tests_between_subjects_effects(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<TestsBetweenSubjectsEffects, String> {
    let design_info = create_design_response_weights(data, config)?;
    let ztwz_matrix = create_cross_product_matrix(&design_info)?;
    let swept_info = perform_sweep_and_extract_results(&ztwz_matrix, design_info.p_parameters)?;

    let mut final_sources: Vec<SourceEntry> = Vec::new();

    let y_mean = design_info.y.mean();
    let ss_total_corrected = design_info.y
        .iter()
        .map(|val| (val - y_mean).powi(2))
        .sum::<f64>();
    let df_total = design_info.n_samples.saturating_sub(1);

    let (ss_error, df_error, ms_error) = calculate_error_terms(&design_info, &swept_info)?;

    let (ss_model_corrected, df_model_overall) = calculate_model_terms(
        &design_info,
        ss_total_corrected,
        ss_error
    );

    let (current_r_squared, current_adj_r_squared) = calculate_r_squared_metrics(
        ss_model_corrected,
        ss_total_corrected,
        df_total,
        df_error,
        df_model_overall
    );

    let all_model_terms_in_design = &design_info.term_names;

    for term_name in all_model_terms_in_design {
        // Menghitung sum of squares berdasarkan metode yang dipilih
        let (ss_term, df_term) = (match config.model.sum_of_square_method {
            SumOfSquaresMethod::TypeI => {
                calculate_type_i_ss(
                    &design_info,
                    &term_name,
                    all_model_terms_in_design,
                    &swept_info.beta_hat,
                    &swept_info.g_inv,
                    &ztwz_matrix
                )
            }
            SumOfSquaresMethod::TypeII => {
                calculate_type_ii_ss(
                    &design_info,
                    &term_name,
                    all_model_terms_in_design,
                    &swept_info.beta_hat,
                    &swept_info.g_inv
                )
            }
            SumOfSquaresMethod::TypeIII => {
                calculate_type_iii_ss(
                    &design_info,
                    &term_name,
                    all_model_terms_in_design,
                    &swept_info.beta_hat,
                    &swept_info.g_inv,
                    data,
                    config
                )
            }
            SumOfSquaresMethod::TypeIV => {
                calculate_type_iv_ss(
                    &design_info,
                    &term_name,
                    all_model_terms_in_design,
                    &swept_info.beta_hat,
                    &swept_info.g_inv,
                    data,
                    config
                )
            }
        })?;

        if df_term == 0 {
            final_sources.push(SourceEntry {
                name: term_name.clone(),
                effect: TestEffectEntry::empty_effect(0),
            });
            continue;
        }

        let effect_entry = create_effect_entry(
            ss_term,
            df_term,
            ms_error,
            df_error,
            config.options.sig_level,
            config.options.est_effect_size,
            config.options.obs_power
        );
        final_sources.push(SourceEntry { name: term_name.clone(), effect: effect_entry });
    }

    add_model_summary_entries(
        &mut final_sources,
        ss_model_corrected,
        df_model_overall,
        ss_error,
        df_error,
        ms_error,
        ss_total_corrected,
        df_total,
        &design_info,
        config
    );

    // Mengurutkan hasil
    final_sources.sort_by_key(|s| {
        match s.name.as_str() {
            "Corrected Model" | "Model" => 0,
            "Intercept" => 1,
            s if s.contains('*') => 3, // Efek interaksi
            "Error" => 4,
            "Total" => 5,
            "Corrected Total" => 6,
            _ => 2, // Efek utama
        }
    });

    let mut notes = Vec::new();
    if let Some(dep_var) = &config.main.dep_var {
        notes.push(format!("a. Dependent Variable: {}.", dep_var));
    }
    notes.push(format!("b. Computed using alpha = {}.", config.options.sig_level));
    notes.push(format!("c. Sum of Squares Method: {:?}.", config.model.sum_of_square_method));
    notes.push(format!("d. R Squared = {:.4}.", current_r_squared));
    notes.push(format!("e. Adjusted R Squared = {:.4}.", current_adj_r_squared));

    Ok(TestsBetweenSubjectsEffects {
        sources: final_sources,
        note: Some(notes.join("\n")),
        interpretation: Some(
            "This table tests the hypothesis that each effect (e.g., factor or interaction) in the model is null. A significant F-value (Sig. < .05) suggests that the effect significantly contributes to explaining the variance in the dependent variable. The Partial Eta Squared indicates the proportion of variance uniquely explained by that effect.".to_string()
        ),
    })
}

fn calculate_error_terms(
    design_info: &DesignMatrixInfo,
    swept_info: &SweptMatrixInfo
) -> Result<(f64, usize, f64), String> {
    let current_ss_error = swept_info.s_rss;

    let current_df_error = design_info.n_samples - design_info.r_x_rank;

    // Validasi
    if
        current_df_error <= 0 &&
        !(design_info.n_samples == design_info.r_x_rank && design_info.n_samples > 0)
    {
        return Err(format!("Error degrees of freedom ({}) is not positive.", current_df_error));
    }

    let current_ms_error = if current_df_error > 0 {
        current_ss_error / (current_df_error as f64)
    } else {
        0.0
    };

    Ok((current_ss_error, current_df_error, current_ms_error))
}

fn calculate_model_terms(
    design_info: &DesignMatrixInfo,
    ss_total_corrected: f64,
    ss_error: f64
) -> (f64, usize) {
    let ss_model_corrected = (ss_total_corrected - ss_error).max(0.0);

    let df_model_overall =
        design_info.r_x_rank - (if design_info.intercept_column.is_some() { 1 } else { 0 });

    (ss_model_corrected, df_model_overall)
}

fn calculate_r_squared_metrics(
    ss_model_corrected: f64,
    ss_total_corrected: f64,
    df_total: usize,
    df_error: usize,
    df_model_overall: usize
) -> (f64, f64) {
    let current_r_squared = if ss_total_corrected.abs() > 1e-9 {
        (ss_model_corrected / ss_total_corrected).max(0.0).min(1.0)
    } else {
        0.0
    };

    // R²_adj = 1 - [(1-R²)(n-1)/(n-p-1)]
    let current_adj_r_squared = if df_total > 0 && df_error > 0 && df_total != df_model_overall {
        (1.0 - ((1.0 - current_r_squared) * (df_total as f64)) / (df_error as f64)).max(0.0)
    } else {
        current_r_squared
    };

    (current_r_squared, current_adj_r_squared)
}

fn add_model_summary_entries(
    final_sources: &mut Vec<SourceEntry>,
    ss_model_corrected: f64,
    df_model_overall: usize,
    ss_error: f64,
    df_error: usize,
    ms_error: f64,
    ss_total_corrected: f64,
    df_total: usize,
    design_info: &DesignMatrixInfo,
    config: &UnivariateConfig
) {
    let has_intercept = config.model.intercept;

    if has_intercept {
        if df_model_overall > 0 {
            let ms_model_corrected = ss_model_corrected / (df_model_overall as f64);

            let f_model_corrected = if ms_error > 1e-9 {
                ms_model_corrected / ms_error
            } else {
                f64::NAN
            };

            let sig_model_corrected = calculate_f_significance(
                df_model_overall,
                df_error,
                f_model_corrected
            );

            let pes_model_corrected = if config.options.est_effect_size {
                if ss_total_corrected.abs() > 1e-9 {
                    (ss_model_corrected / ss_total_corrected).max(0.0).min(1.0)
                } else {
                    0.0
                }
            } else {
                f64::NAN
            };

            let (ncp_model_corrected, power_model_corrected) = if config.options.obs_power {
                let ncp = calculate_f_non_centrality(
                    f_model_corrected,
                    df_model_overall as f64,
                    df_error as f64
                );
                let power = calculate_observed_power_f(
                    f_model_corrected,
                    df_model_overall as f64,
                    df_error as f64,
                    config.options.sig_level
                );
                (ncp, power)
            } else {
                (f64::NAN, f64::NAN)
            };

            final_sources.push(SourceEntry {
                name: "Corrected Model".to_string(),
                effect: TestEffectEntry {
                    sum_of_squares: ss_model_corrected,
                    df: df_model_overall,
                    mean_square: ms_model_corrected,
                    f_value: f_model_corrected,
                    significance: sig_model_corrected,
                    partial_eta_squared: pes_model_corrected,
                    noncent_parameter: ncp_model_corrected,
                    observed_power: power_model_corrected,
                },
            });
        }

        final_sources.push(SourceEntry {
            name: "Error".to_string(),
            effect: TestEffectEntry {
                sum_of_squares: ss_error,
                df: df_error,
                mean_square: ms_error,
                f_value: f64::NAN,
                significance: f64::NAN,
                partial_eta_squared: f64::NAN,
                noncent_parameter: f64::NAN,
                observed_power: f64::NAN,
            },
        });

        final_sources.push(SourceEntry {
            name: "Corrected Total".to_string(),
            effect: TestEffectEntry {
                sum_of_squares: ss_total_corrected,
                df: df_total,
                mean_square: f64::NAN,
                f_value: f64::NAN,
                significance: f64::NAN,
                partial_eta_squared: f64::NAN,
                noncent_parameter: f64::NAN,
                observed_power: f64::NAN,
            },
        });

        let ss_total_uncorrected = design_info.y
            .iter()
            .map(|val| val.powi(2))
            .sum::<f64>();
        let df_total_uncorrected = design_info.n_samples;
        final_sources.push(SourceEntry {
            name: "Total".to_string(),
            effect: TestEffectEntry {
                sum_of_squares: ss_total_uncorrected,
                df: df_total_uncorrected,
                mean_square: f64::NAN,
                f_value: f64::NAN,
                significance: f64::NAN,
                partial_eta_squared: f64::NAN,
                noncent_parameter: f64::NAN,
                observed_power: f64::NAN,
            },
        });
    } else {
        let ss_total = design_info.y
            .iter()
            .map(|val| val.powi(2))
            .sum::<f64>();
        let df_total = design_info.n_samples;

        let ss_model = (ss_total - ss_error).max(0.0);
        let df_model = design_info.r_x_rank;

        if df_model > 0 {
            let ms_model = ss_model / (df_model as f64);

            let f_model = if ms_error > 1e-9 { ms_model / ms_error } else { f64::NAN };
            let sig_model = calculate_f_significance(df_model, df_error, f_model);
            let pes_model = if config.options.est_effect_size {
                if ss_total.abs() > 1e-9 { (ss_model / ss_total).max(0.0).min(1.0) } else { 0.0 }
            } else {
                f64::NAN
            };

            let (ncp_model, power_model) = if config.options.obs_power {
                let ncp = calculate_f_non_centrality(f_model, df_model as f64, df_error as f64);
                let power = calculate_observed_power_f(
                    f_model,
                    df_model as f64,
                    df_error as f64,
                    config.options.sig_level
                );
                (ncp, power)
            } else {
                (f64::NAN, f64::NAN)
            };

            final_sources.push(SourceEntry {
                name: "Model".to_string(),
                effect: TestEffectEntry {
                    sum_of_squares: ss_model,
                    df: df_model,
                    mean_square: ms_model,
                    f_value: f_model,
                    significance: sig_model,
                    partial_eta_squared: pes_model,
                    noncent_parameter: ncp_model,
                    observed_power: power_model,
                },
            });
        }

        final_sources.push(SourceEntry {
            name: "Error".to_string(),
            effect: TestEffectEntry {
                sum_of_squares: ss_error,
                df: df_error,
                mean_square: ms_error,
                f_value: f64::NAN,
                significance: f64::NAN,
                partial_eta_squared: f64::NAN,
                noncent_parameter: f64::NAN,
                observed_power: f64::NAN,
            },
        });

        final_sources.push(SourceEntry {
            name: "Total".to_string(),
            effect: TestEffectEntry {
                sum_of_squares: ss_total,
                df: df_total,
                mean_square: f64::NAN,
                f_value: f64::NAN,
                significance: f64::NAN,
                partial_eta_squared: f64::NAN,
                noncent_parameter: f64::NAN,
                observed_power: f64::NAN,
            },
        });
    }
}

pub fn create_effect_entry(
    sum_of_squares: f64,
    df: usize,
    error_ms: f64,
    error_df: usize,
    sig_level: f64,
    est_effect_size: bool,
    obs_power: bool
) -> TestEffectEntry {
    let mean_square = if df > 0 { sum_of_squares / (df as f64) } else { 0.0 };
    let f_value = if error_ms > 0.0 && mean_square > 0.0 { mean_square / error_ms } else { 0.0 };

    let significance = if f_value > 0.0 {
        calculate_f_significance(df, error_df, f_value)
    } else {
        1.0
    };

    let partial_eta_squared = if est_effect_size {
        if sum_of_squares >= 0.0 && error_df > 0 {
            let error_ss = error_ms * (error_df as f64);
            let eta_sq = sum_of_squares / (sum_of_squares + error_ss);
            eta_sq.max(0.0).min(1.0)
        } else {
            0.0
        }
    } else {
        f64::NAN
    };

    let (noncent_parameter, observed_power) = if obs_power {
        // λ = F * df_effect
        let noncent_parameter = if f_value > 0.0 { f_value * (df as f64) } else { 0.0 };

        let observed_power = if f_value > 0.0 {
            calculate_observed_power_f(f_value, df as f64, error_df as f64, sig_level)
        } else {
            0.0
        };
        (noncent_parameter, observed_power)
    } else {
        (f64::NAN, f64::NAN)
    };

    TestEffectEntry {
        sum_of_squares,
        df,
        mean_square,
        f_value,
        significance,
        partial_eta_squared,
        noncent_parameter,
        observed_power,
    }
}
