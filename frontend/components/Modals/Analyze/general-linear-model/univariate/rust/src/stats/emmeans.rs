use std::collections::{ BTreeMap, HashMap, HashSet };
use nalgebra::{ DMatrix, DVector };

use crate::models::{
    config::{ CIMethod, UnivariateConfig },
    data::AnalysisData,
    result::{
        EMMeansResult,
        EMMeansEstimates,
        EMMeansEstimatesEntry,
        PairwiseComparisons,
        PairwiseComparisonsEntry,
        UnivariateTests,
        UnivariateTestsEntry,
        ContrastCoefficientsEntry,
        ConfidenceInterval,
        DesignMatrixInfo,
    },
};

use super::core::*;

pub fn calculate_emmeans(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<EMMeansResult, String> {
    let factors_to_analyze_for_emmeans: Vec<String> = match config.emmeans.target_list.as_ref() {
        Some(targets) if !targets.is_empty() => targets.clone(),
        _ => {
            return Ok(EMMeansResult {
                parameter_names: Vec::new(),
                contrast_coefficients: Vec::new(),
                em_estimates: Vec::new(),
                pairwise_comparisons: None,
                univariate_tests: None,
            });
        }
    };

    let design_info = create_design_response_weights(data, config)?;
    let all_model_parameters_names = generate_all_row_parameter_names_sorted(&design_info, data)?;
    let covariate_means_map = prepare_covariate_means_from_design(&design_info, data, config)?;

    let ztz_matrix = create_cross_product_matrix(&design_info)?;
    let swept_info = perform_sweep_and_extract_results(&ztz_matrix, design_info.p_parameters)?;

    let beta_hat = &swept_info.beta_hat;
    let g_inv = &swept_info.g_inv;
    let s_rss = swept_info.s_rss;
    let df_error = (design_info.n_samples as i64) - (design_info.r_x_rank as i64);
    let mse = if df_error > 0 { s_rss / (df_error as f64) } else { f64::NAN };

    if mse.is_nan() || df_error <= 0 {
        return Err(
            "MSE is NaN or df_error is not positive. Cannot proceed with EMMeans.".to_string()
        );
    }

    let factor_levels_map = extract_factor_levels_from_design(&design_info, data, config)?;

    let emmeans_results = process_emmeans_specifications(
        &factors_to_analyze_for_emmeans,
        &all_model_parameters_names,
        &design_info,
        &factor_levels_map,
        &covariate_means_map,
        beta_hat,
        g_inv,
        mse,
        df_error,
        s_rss,
        config
    )?;

    Ok(EMMeansResult {
        parameter_names: emmeans_results.0,
        contrast_coefficients: emmeans_results.1,
        em_estimates: emmeans_results.2,
        pairwise_comparisons: if emmeans_results.3.is_empty() {
            None
        } else {
            Some(emmeans_results.3)
        },
        univariate_tests: if emmeans_results.4.is_empty() {
            None
        } else {
            Some(emmeans_results.4)
        },
    })
}

fn add_empty_emmeans_result(
    factor_spec: &str,
    all_model_parameters_names: &[String],
    config: &UnivariateConfig,
    contrast_coeffs_list: &mut Vec<ContrastCoefficientsEntry>,
    estimates_list: &mut Vec<EMMeansEstimates>
) {
    estimates_list.push(EMMeansEstimates {
        entries: Vec::new(),
        note: Some(format!("No level combinations for {}", factor_spec)),
        interpretation: Some(
            "The specified term is not a factor or has no levels, so no estimates can be calculated.".to_string()
        ),
    });

    if config.options.coefficient_matrix {
        contrast_coeffs_list.push(ContrastCoefficientsEntry {
            parameter: all_model_parameters_names.to_vec(),
            l_label: Vec::new(),
            l_matrix: Vec::new(),
            contrast_information: vec![format!("L-Matrix for EMMEANS of {}", factor_spec)],
            note: Some(format!("No level combinations for {}.", factor_spec)),
            interpretation: Some(
                "No L-vectors could be generated as there are no factor levels for the specified term.".to_string()
            ),
        });
    }
}

fn prepare_covariate_means_from_design(
    design_info: &DesignMatrixInfo,
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<HashMap<String, f64>, String> {
    let mut means_map = HashMap::new();

    if let Some(covar_names) = &config.main.covar {
        for covar_name in covar_names {
            if let Some(covar_indices) = design_info.covariate_indices.get(covar_name) {
                if let Some(&first_col_idx) = covar_indices.first() {
                    if first_col_idx < design_info.x.ncols() {
                        let covar_mean = design_info.x.column(first_col_idx).mean();
                        means_map.insert(covar_name.clone(), covar_mean);
                    }
                }
            }
        }
    }

    for param_name in &generate_all_row_parameter_names_sorted(design_info, data)? {
        if means_map.contains_key(param_name) || param_name == "Intercept" {
            continue;
        }

        let constituent_terms = parse_interaction_term(param_name);
        if constituent_terms.len() <= 1 {
            continue;
        }

        if let Some(covar_names) = &config.main.covar {
            let is_covar_product = constituent_terms.iter().all(|term| covar_names.contains(term));
            if is_covar_product {
                let product_mean = constituent_terms
                    .iter()
                    .map(|term| means_map.get(term).copied().unwrap_or(0.0))
                    .product();
                means_map.insert(param_name.clone(), product_mean);
            }
        }
    }

    Ok(means_map)
}

fn extract_factor_levels_from_design(
    design_info: &DesignMatrixInfo,
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<HashMap<String, Vec<String>>, String> {
    let mut factor_levels_map = HashMap::new();

    let all_factor_names: HashSet<String> = design_info.fixed_factor_indices
        .keys()
        .chain(design_info.random_factor_indices.keys())
        .cloned()
        .collect();

    for factor_name in all_factor_names {
        if config.main.covar.as_ref().map_or(false, |c| c.contains(&factor_name)) {
            continue;
        }

        match get_factor_levels(data, &factor_name) {
            Ok(levels) if !levels.is_empty() => {
                factor_levels_map.insert(factor_name, levels);
            }
            _ => {
                continue;
            }
        }
    }

    Ok(factor_levels_map)
}

fn process_emmeans_specifications(
    factors_to_analyze: &[String],
    all_model_parameters_names: &[String],
    design_info: &DesignMatrixInfo,
    factor_levels_map: &HashMap<String, Vec<String>>,
    covariate_means_map: &HashMap<String, f64>,
    beta_hat: &DVector<f64>,
    g_inv: &DMatrix<f64>,
    mse: f64,
    df_error: i64,
    s_rss: f64,
    config: &UnivariateConfig
) -> Result<
    (
        Vec<String>,
        Vec<ContrastCoefficientsEntry>,
        Vec<EMMeansEstimates>,
        Vec<PairwiseComparisons>,
        Vec<UnivariateTests>,
    ),
    String
> {
    let mut param_names = Vec::new();
    let mut contrast_coeffs_list = Vec::new();
    let mut estimates_list = Vec::new();
    let mut pairwise_list = Vec::new();
    let mut univariate_tests_list = Vec::new();

    let covar_names = config.main.covar.as_ref().map_or_else(Vec::new, |v| v.clone());

    for factor_spec in factors_to_analyze {
        param_names.push(factor_spec.clone());

        if factor_spec == "(OVERALL)" {
            process_grand_mean_emmeans(
                all_model_parameters_names,
                design_info,
                factor_levels_map,
                covariate_means_map,
                &covar_names,
                beta_hat,
                g_inv,
                mse,
                df_error,
                config,
                &mut contrast_coeffs_list,
                &mut estimates_list
            )?;
            continue;
        }

        process_factor_emmeans(
            factor_spec,
            all_model_parameters_names,
            design_info,
            factor_levels_map,
            covariate_means_map,
            &covar_names,
            beta_hat,
            g_inv,
            mse,
            df_error,
            s_rss,
            config,
            &mut contrast_coeffs_list,
            &mut estimates_list,
            &mut pairwise_list,
            &mut univariate_tests_list
        )?;
    }

    Ok((param_names, contrast_coeffs_list, estimates_list, pairwise_list, univariate_tests_list))
}

fn process_grand_mean_emmeans(
    all_model_parameters_names: &[String],
    design_info: &DesignMatrixInfo,
    factor_levels_map: &HashMap<String, Vec<String>>,
    covariate_means_map: &HashMap<String, f64>,
    covar_names: &[String],
    beta_hat: &DVector<f64>,
    g_inv: &DMatrix<f64>,
    mse: f64,
    df_error: i64,
    config: &UnivariateConfig,
    contrast_coeffs_list: &mut Vec<ContrastCoefficientsEntry>,
    estimates_list: &mut Vec<EMMeansEstimates>
) -> Result<(), String> {
    let grand_mean_l_vector = generate_l_vector_for_grand_mean(
        all_model_parameters_names,
        design_info.p_parameters,
        factor_levels_map,
        covariate_means_map,
        covar_names
    )?;

    let grand_mean_estimates = generate_em_estimates_table(
        &[grand_mean_l_vector.clone()],
        &[BTreeMap::new()],
        beta_hat,
        g_inv,
        mse,
        df_error,
        config.options.sig_level,
        "Grand Mean"
    );
    estimates_list.push(grand_mean_estimates);

    if config.options.coefficient_matrix {
        contrast_coeffs_list.push(ContrastCoefficientsEntry {
            parameter: all_model_parameters_names.to_vec(),
            l_label: vec!["Grand Mean".to_string()],
            l_matrix: vec![grand_mean_l_vector],
            contrast_information: vec!["L-Matrix for Grand Mean".to_string()],
            note: Some("Defines the overall estimated grand mean.".to_string()),
            interpretation: Some(
                "This L-vector calculates the grand mean of the model, averaging over all factor levels and using the mean of covariates.".to_string()
            ),
        });
    }

    Ok(())
}

fn process_factor_emmeans(
    factor_spec: &str,
    all_model_parameters_names: &[String],
    design_info: &DesignMatrixInfo,
    factor_levels_map: &HashMap<String, Vec<String>>,
    covariate_means_map: &HashMap<String, f64>,
    covar_names: &[String],
    beta_hat: &DVector<f64>,
    g_inv: &DMatrix<f64>,
    mse: f64,
    df_error: i64,
    s_rss: f64,
    config: &UnivariateConfig,
    contrast_coeffs_list: &mut Vec<ContrastCoefficientsEntry>,
    estimates_list: &mut Vec<EMMeansEstimates>,
    pairwise_list: &mut Vec<PairwiseComparisons>,
    univariate_tests_list: &mut Vec<UnivariateTests>
) -> Result<(), String> {
    let parsed_terms = parse_interaction_term(factor_spec);
    let current_spec_factors: Vec<&str> = parsed_terms.iter().map(String::as_str).collect();

    if current_spec_factors.is_empty() && factor_spec != "Intercept" {
        add_empty_emmeans_result(
            factor_spec,
            all_model_parameters_names,
            config,
            contrast_coeffs_list,
            estimates_list
        );
        return Ok(());
    }

    let level_combinations = match
        get_factor_level_combinations(&current_spec_factors, factor_levels_map)
    {
        Ok(combos) if combos.is_empty() => {
            add_empty_emmeans_result(
                factor_spec,
                all_model_parameters_names,
                config,
                contrast_coeffs_list,
                estimates_list
            );
            return Ok(());
        }
        Ok(combos) => combos,
        Err(e) => {
            return Err(format!("Error generating level combinations for {}: {}", factor_spec, e));
        }
    };

    let (l_matrix_rows, l_labels) = generate_l_vectors_for_emmeans(
        &level_combinations,
        all_model_parameters_names,
        design_info.p_parameters,
        factor_levels_map,
        covariate_means_map,
        covar_names
    )?;

    let estimates_table = generate_em_estimates_table(
        &l_matrix_rows,
        &level_combinations,
        beta_hat,
        g_inv,
        mse,
        df_error,
        config.options.sig_level,
        factor_spec
    );
    estimates_list.push(estimates_table);

    if config.options.coefficient_matrix {
        contrast_coeffs_list.push(ContrastCoefficientsEntry {
            parameter: all_model_parameters_names.to_vec(),
            l_label: l_labels,
            l_matrix: l_matrix_rows.clone(),
            contrast_information: vec![format!("L-Matrix for EMMEANS of {}", factor_spec)],
            note: Some(format!("Defines the EMMs for {}. Each row is an L-vector.", factor_spec)),
            interpretation: Some(
                "These L-vectors are the linear combinations of model parameters used to calculate the Estimated Marginal Means (EMMs) for the specified effect.".to_string()
            ),
        });
    }

    if current_spec_factors.len() == 1 && config.emmeans.comp_main_effect {
        let main_effect_name = current_spec_factors[0];
        if let Some(main_effect_levels) = factor_levels_map.get(main_effect_name) {
            if
                let Some(pairwise_table) = generate_pairwise_comparisons_table(
                    main_effect_name,
                    main_effect_levels,
                    &l_matrix_rows,
                    beta_hat,
                    g_inv,
                    mse,
                    df_error,
                    config
                )
            {
                pairwise_list.push(pairwise_table);
            }

            if
                let Some(univariate_table) = generate_univariate_test_table(
                    main_effect_name,
                    main_effect_levels.len(),
                    &l_matrix_rows,
                    beta_hat,
                    g_inv,
                    mse,
                    df_error,
                    design_info.p_parameters,
                    s_rss,
                    config.options.sig_level,
                    config.options.est_effect_size,
                    config.options.obs_power
                )
            {
                univariate_tests_list.push(univariate_table);
            }
        }
    }

    Ok(())
}

fn calculate_emmeans_coefficient(
    model_param_name: &str,
    level_combo_map: &BTreeMap<String, String>,
    factor_levels_map: &HashMap<String, Vec<String>>,
    covariate_means_map: &HashMap<String, f64>,
    covariate_names: &[String]
) -> f64 {
    if model_param_name == "Intercept" {
        return 1.0;
    }

    if let Some(&covar_mean) = covariate_means_map.get(model_param_name) {
        return covar_mean;
    }

    let parsed_param = parse_parameter_name(model_param_name);
    if parsed_param.is_empty() {
        return 0.0;
    }

    let mut coefficient = 1.0;
    for (factor_or_cov_name, level_in_param) in parsed_param {
        if factor_or_cov_name == "Intercept" {
            continue;
        }

        if let Some(expected_level) = level_combo_map.get(&factor_or_cov_name) {
            if expected_level != &level_in_param {
                return 0.0;
            }
        } else if covariate_names.contains(&factor_or_cov_name) {
            coefficient *= covariate_means_map.get(&factor_or_cov_name).copied().unwrap_or(0.0);
        } else if let Some(other_factor_levels) = factor_levels_map.get(&factor_or_cov_name) {
            if !other_factor_levels.is_empty() {
                coefficient /= other_factor_levels.len() as f64;
            } else {
                return 0.0;
            }
        } else {
            return 0.0;
        }
    }

    coefficient
}

fn generate_em_estimates_table(
    l_matrix_for_emms: &[Vec<f64>],
    level_combinations_for_spec: &[BTreeMap<String, String>],
    beta_hat: &DVector<f64>,
    g_inv: &DMatrix<f64>,
    mse: f64,
    df_error: i64,
    sig_level: f64,
    factor_spec_emmeans: &str
) -> EMMeansEstimates {
    let mut emm_estimates_entries = Vec::new();
    let mut emm_levels_collector: Vec<String> = Vec::new();
    let mut emm_means_collector: Vec<f64> = Vec::new();
    let mut emm_std_errors_collector: Vec<f64> = Vec::new();
    let mut emm_ci_collector: Vec<ConfidenceInterval> = Vec::new();

    for (idx, l_vector_data) in l_matrix_for_emms.iter().enumerate() {
        let level_combo_map = &level_combinations_for_spec[idx];
        let emm_param_name_parts: Vec<String> = level_combo_map
            .iter()
            .map(|(f, l)| format!("{}={}", f, l))
            .collect();
        emm_levels_collector.push(emm_param_name_parts.join(", "));

        if l_vector_data.iter().all(|&x| x == 0.0) {
            emm_means_collector.push(f64::NAN);
            emm_std_errors_collector.push(f64::NAN);
            emm_ci_collector.push(ConfidenceInterval {
                lower_bound: f64::NAN,
                upper_bound: f64::NAN,
            });
            continue;
        }

        let l_vector = DVector::from_column_slice(l_vector_data);
        let emm_value_scalar = (l_vector.transpose() * beta_hat)[(0, 0)];

        let variance_of_emm_matrix = l_vector.transpose() * g_inv * &l_vector * mse;
        let std_error_emm = if variance_of_emm_matrix[(0, 0)] >= 0.0 {
            variance_of_emm_matrix[(0, 0)].sqrt()
        } else {
            f64::NAN
        };

        let t_crit_emm = calculate_t_critical(Some(sig_level), df_error as usize);
        let ci_width_emm = if !t_crit_emm.is_nan() && !std_error_emm.is_nan() {
            std_error_emm * t_crit_emm
        } else {
            f64::NAN
        };

        emm_means_collector.push(emm_value_scalar);
        emm_std_errors_collector.push(std_error_emm);
        emm_ci_collector.push(ConfidenceInterval {
            lower_bound: if !ci_width_emm.is_nan() {
                emm_value_scalar - ci_width_emm
            } else {
                f64::NAN
            },
            upper_bound: if !ci_width_emm.is_nan() {
                emm_value_scalar + ci_width_emm
            } else {
                f64::NAN
            },
        });
    }

    if !emm_levels_collector.is_empty() {
        emm_estimates_entries.push(EMMeansEstimatesEntry {
            levels: emm_levels_collector,
            mean: emm_means_collector,
            standard_error: emm_std_errors_collector,
            confidence_interval: emm_ci_collector,
        });
    }

    EMMeansEstimates {
        entries: emm_estimates_entries,
        note: Some(format!("Estimates for {}", factor_spec_emmeans)),
        interpretation: Some(
            "This table shows the Estimated Marginal Means (EMMs), which are the adjusted means for each level of the factor, controlling for other variables in the model. A non-estimable EMM (shown as NaN) indicates that the mean for that level combination cannot be uniquely determined from the data.".to_string()
        ),
    }
}

fn generate_pairwise_comparisons_table(
    main_effect_name: &str,
    main_effect_levels: &[String],
    l_matrix_for_emms: &[Vec<f64>],
    beta_hat: &DVector<f64>,
    g_inv: &DMatrix<f64>,
    mse: f64,
    df_error: i64,
    config: &UnivariateConfig
) -> Option<PairwiseComparisons> {
    let num_levels_main_effect = main_effect_levels.len();
    if num_levels_main_effect < 2 {
        return None;
    }

    let mut pairwise_entries = Vec::new();
    let num_pairwise_comparisons = (num_levels_main_effect * (num_levels_main_effect - 1)) / 2;
    if num_pairwise_comparisons == 0 {
        return None;
    }

    let alpha_pairwise_sig = match config.emmeans.confi_interval_method {
        CIMethod::Bonferroni => config.options.sig_level / (num_pairwise_comparisons as f64),
        CIMethod::Sidak =>
            1.0 - (1.0 - config.options.sig_level).powf(1.0 / (num_pairwise_comparisons as f64)),
        CIMethod::LsdNone => config.options.sig_level,
    };

    for i in 0..num_levels_main_effect {
        for j in 0..num_levels_main_effect {
            if i == j {
                continue;
            }

            let l_vector_i_data = &l_matrix_for_emms[i];
            let l_vector_j_data = &l_matrix_for_emms[j];

            if
                l_vector_i_data.iter().all(|&x| x == 0.0) ||
                l_vector_j_data.iter().all(|&x| x == 0.0)
            {
                pairwise_entries.push(PairwiseComparisonsEntry {
                    parameter: vec![
                        format!("{}={}", main_effect_name, main_effect_levels[i]),
                        format!("{}={}", main_effect_name, main_effect_levels[j])
                    ],
                    mean_difference: vec![f64::NAN],
                    standard_error: vec![f64::NAN],
                    significance: vec![f64::NAN],
                    confidence_interval: vec![ConfidenceInterval {
                        lower_bound: f64::NAN,
                        upper_bound: f64::NAN,
                    }],
                });
                continue;
            }

            let l_vector_i = DVector::from_column_slice(l_vector_i_data);
            let l_vector_j = DVector::from_column_slice(l_vector_j_data);

            let emm_i_val = (l_vector_i.transpose() * beta_hat)[(0, 0)];
            let emm_j_val = (l_vector_j.transpose() * beta_hat)[(0, 0)];
            let mean_diff = emm_i_val - emm_j_val;

            let l_vector_diff = &l_vector_i - &l_vector_j;
            let variance_of_diff_matrix = l_vector_diff.transpose() * g_inv * &l_vector_diff * mse;
            let std_error_diff = if variance_of_diff_matrix[(0, 0)] >= 0.0 {
                variance_of_diff_matrix[(0, 0)].sqrt()
            } else {
                f64::NAN
            };

            let t_value_diff = if !std_error_diff.is_nan() && std_error_diff != 0.0 {
                mean_diff / std_error_diff
            } else {
                f64::NAN
            };

            let raw_significance_diff = if !t_value_diff.is_nan() && df_error > 0 {
                calculate_t_significance(t_value_diff.abs(), df_error as usize)
            } else {
                f64::NAN
            };

            let adjusted_significance_diff = if !raw_significance_diff.is_nan() {
                match config.emmeans.confi_interval_method {
                    CIMethod::Bonferroni =>
                        (raw_significance_diff * (num_pairwise_comparisons as f64)).min(1.0),
                    CIMethod::Sidak =>
                        (
                            1.0 -
                            (1.0 - raw_significance_diff).powf(num_pairwise_comparisons as f64)
                        ).min(1.0),
                    CIMethod::LsdNone => raw_significance_diff,
                }
            } else {
                f64::NAN
            };

            let t_crit_pairwise = calculate_t_critical(Some(alpha_pairwise_sig), df_error as usize);
            let ci_width_diff = if !t_crit_pairwise.is_nan() && !std_error_diff.is_nan() {
                std_error_diff * t_crit_pairwise
            } else {
                f64::NAN
            };

            pairwise_entries.push(PairwiseComparisonsEntry {
                parameter: vec![
                    format!("{}={}", main_effect_name, main_effect_levels[i]),
                    format!("{}={}", main_effect_name, main_effect_levels[j])
                ],
                mean_difference: vec![mean_diff],
                standard_error: vec![std_error_diff],
                significance: vec![adjusted_significance_diff],
                confidence_interval: vec![ConfidenceInterval {
                    lower_bound: if !ci_width_diff.is_nan() {
                        mean_diff - ci_width_diff
                    } else {
                        f64::NAN
                    },
                    upper_bound: if !ci_width_diff.is_nan() {
                        mean_diff + ci_width_diff
                    } else {
                        f64::NAN
                    },
                }],
            });
        }
    }
    Some(PairwiseComparisons {
        entries: pairwise_entries,
        note: Some(
            format!(
                "Pairwise comparisons for {}. Adjustment for multiple comparisons: {:?}.",
                main_effect_name,
                config.emmeans.confi_interval_method
            )
        ),
        interpretation: Some(
            "This table compares each pair of levels for a main effect. A significant p-value (typically < .05) indicates a statistically significant difference between the two levels' means. The confidence interval for the mean difference should not contain zero for the difference to be significant.".to_string()
        ),
    })
}

fn generate_univariate_test_table(
    main_effect_name: &str,
    num_levels_main_effect: usize,
    l_matrix_for_emms: &[Vec<f64>],
    beta_hat: &DVector<f64>,
    g_inv: &DMatrix<f64>,
    mse: f64,
    df_error: i64,
    p_parameters: usize,
    s_rss: f64,
    sig_level_option: f64,
    est_effect_size: bool,
    obs_power: bool
) -> Option<UnivariateTests> {
    if num_levels_main_effect < 2 {
        return None;
    }
    let df_hypothesis_uni = num_levels_main_effect - 1;

    let error_entry = UnivariateTestsEntry {
        source: "Error".to_string(),
        sum_of_squares: s_rss,
        df: df_error as usize,
        mean_square: mse,
        f_value: f64::NAN,
        significance: f64::NAN,
        partial_eta_squared: f64::NAN,
        noncent_parameter: f64::NAN,
        observed_power: f64::NAN,
    };

    if df_hypothesis_uni == 0 {
        let contrast_entry = UnivariateTestsEntry {
            source: main_effect_name.to_string(),
            sum_of_squares: f64::NAN,
            df: 0,
            mean_square: f64::NAN,
            f_value: f64::NAN,
            significance: f64::NAN,
            partial_eta_squared: f64::NAN,
            noncent_parameter: f64::NAN,
            observed_power: f64::NAN,
        };
        return Some(UnivariateTests {
            entries: vec![contrast_entry, error_entry],
            note: Some(format!("No hypothesis to test for {} (df_hyp=0)", main_effect_name)),
            interpretation: Some(
                "The degrees of freedom for the hypothesis is 0, so no test can be performed.".to_string()
            ),
        });
    }

    if l_matrix_for_emms.iter().all(|l_vec| l_vec.iter().all(|&x| x == 0.0)) {
        let contrast_entry = UnivariateTestsEntry {
            source: main_effect_name.to_string(),
            sum_of_squares: f64::NAN,
            df: df_hypothesis_uni,
            mean_square: f64::NAN,
            f_value: f64::NAN,
            significance: f64::NAN,
            partial_eta_squared: f64::NAN,
            noncent_parameter: f64::NAN,
            observed_power: f64::NAN,
        };
        return Some(UnivariateTests {
            entries: vec![contrast_entry, error_entry],
            note: Some(
                format!("Cannot perform univariate test for {} (all EMMs non-estimable)", main_effect_name)
            ),
            interpretation: Some(
                "The univariate test could not be performed because all the estimated marginal means for this effect were non-estimable.".to_string()
            ),
        });
    }

    let mut l_matrix_uni_test_rows_as_vecs: Vec<Vec<f64>> = Vec::new();
    let l_vector_last_level_data = &l_matrix_for_emms[num_levels_main_effect - 1];

    for i in 0..num_levels_main_effect - 1 {
        let l_vector_i_data = &l_matrix_for_emms[i];
        let diff_row_data: Vec<f64> = l_vector_i_data
            .iter()
            .zip(l_vector_last_level_data.iter())
            .map(|(a, b)| a - b)
            .collect();
        l_matrix_uni_test_rows_as_vecs.push(diff_row_data);
    }

    let num_uni_rows = l_matrix_uni_test_rows_as_vecs.len();
    let num_uni_cols = if num_uni_rows > 0 {
        l_matrix_uni_test_rows_as_vecs[0].len()
    } else {
        p_parameters
    };

    if num_uni_rows == 0 {
        let contrast_entry = UnivariateTestsEntry {
            source: main_effect_name.to_string(),
            sum_of_squares: f64::NAN,
            df: df_hypothesis_uni,
            mean_square: f64::NAN,
            f_value: f64::NAN,
            significance: f64::NAN,
            partial_eta_squared: f64::NAN,
            noncent_parameter: f64::NAN,
            observed_power: f64::NAN,
        };
        return Some(UnivariateTests {
            entries: vec![contrast_entry, error_entry],
            note: Some(
                format!("Cannot perform univariate test for {} (L-matrix has no rows but df_hyp > 0)", main_effect_name)
            ),
            interpretation: Some(
                "The test could not be performed due to an issue in constructing the contrast matrix, which is necessary for the hypothesis test.".to_string()
            ),
        });
    }

    let l_uni_test_nalgebra = DMatrix::from_row_slice(
        num_uni_rows,
        num_uni_cols,
        &l_matrix_uni_test_rows_as_vecs.iter().flatten().cloned().collect::<Vec<f64>>()
    );

    let l_beta_uni: DVector<f64> = &l_uni_test_nalgebra * beta_hat;
    let l_ginv_lt_uni: DMatrix<f64> =
        &l_uni_test_nalgebra * g_inv * l_uni_test_nalgebra.transpose();

    let mut ssh_uni = f64::NAN;
    let mut msh_uni = f64::NAN;
    let mut f_value_uni = f64::NAN;
    let mut sig_uni = f64::NAN;
    let (mut partial_eta_sq_uni, mut noncent_param_uni, mut obs_power_uni) = (
        f64::NAN,
        f64::NAN,
        f64::NAN,
    );

    if let Some(l_ginv_lt_uni_inv) = l_ginv_lt_uni.clone().try_inverse() {
        let ssh_matrix_uni = l_beta_uni.transpose() * l_ginv_lt_uni_inv * &l_beta_uni;
        if ssh_matrix_uni.nrows() == 1 && ssh_matrix_uni.ncols() == 1 {
            ssh_uni = ssh_matrix_uni[(0, 0)];
            if ssh_uni < 0.0 && ssh_uni.abs() > 1e-9 {
                ssh_uni = f64::NAN;
            } else if ssh_uni < 0.0 {
                ssh_uni = 0.0;
            }

            if !ssh_uni.is_nan() && df_hypothesis_uni > 0 {
                msh_uni = ssh_uni / (df_hypothesis_uni as f64);
                if !mse.is_nan() && mse > 1e-12 && df_error > 0 {
                    f_value_uni = msh_uni / mse;

                    if est_effect_size {
                        if !s_rss.is_nan() && (ssh_uni + s_rss).abs() > 1e-12 {
                            partial_eta_sq_uni = ssh_uni / (ssh_uni + s_rss);
                        } else {
                            partial_eta_sq_uni = 0.0;
                        }
                    }

                    if obs_power {
                        noncent_param_uni = f_value_uni * (df_hypothesis_uni as f64);

                        if df_error > 0 {
                            obs_power_uni = calculate_observed_power_f(
                                f_value_uni,
                                df_hypothesis_uni as f64,
                                df_error as f64,
                                sig_level_option
                            );
                        } else {
                            obs_power_uni = f64::NAN;
                        }
                    }
                } else if mse == 0.0 && msh_uni > 1e-9 {
                    f_value_uni = f64::INFINITY;
                    if est_effect_size {
                        partial_eta_sq_uni = if ssh_uni > 0.0 { 1.0 } else { 0.0 };
                    }
                    if obs_power {
                        noncent_param_uni = f64::INFINITY;
                        obs_power_uni = if ssh_uni > 0.0 { 1.0 } else { 0.0 };
                    }
                }
                if !f_value_uni.is_nan() && df_error > 0 && df_hypothesis_uni > 0 {
                    sig_uni = calculate_f_significance(
                        df_hypothesis_uni,
                        df_error as usize,
                        f_value_uni
                    );
                }
            }
        }
    } else {
        let is_l_beta_zero = l_beta_uni.iter().all(|&x| x.abs() < 1e-9);
        if is_l_beta_zero {
            ssh_uni = 0.0;
            msh_uni = 0.0;
            f_value_uni = if mse > 0.0 { 0.0 } else { f64::NAN };

            if est_effect_size {
                partial_eta_sq_uni = 0.0;
            }
            if obs_power {
                noncent_param_uni = 0.0;
                obs_power_uni = if !f_value_uni.is_nan() && df_hypothesis_uni > 0 && df_error > 0 {
                    calculate_observed_power_f(
                        f_value_uni,
                        df_hypothesis_uni as f64,
                        df_error as f64,
                        sig_level_option
                    )
                } else {
                    f64::NAN
                };
            }

            if !f_value_uni.is_nan() && df_hypothesis_uni > 0 && df_error > 0 {
                sig_uni = calculate_f_significance(
                    df_hypothesis_uni,
                    df_error as usize,
                    f_value_uni
                );
            }
        }
    }

    let contrast_entry = UnivariateTestsEntry {
        source: main_effect_name.to_string(),
        sum_of_squares: ssh_uni,
        df: df_hypothesis_uni,
        mean_square: msh_uni,
        f_value: f_value_uni,
        significance: sig_uni,
        partial_eta_squared: partial_eta_sq_uni,
        noncent_parameter: noncent_param_uni,
        observed_power: obs_power_uni,
    };

    Some(UnivariateTests {
        entries: vec![contrast_entry, error_entry],
        note: Some(format!("Univariate test for {}", main_effect_name)),
        interpretation: Some(
            "This F-test examines the null hypothesis that the means of all levels of the effect are equal. A significant F-value (Sig. < .05) suggests that there is a statistically significant difference somewhere among the level means.".to_string()
        ),
    })
}

fn get_factor_level_combinations(
    factors_in_spec: &[&str],
    all_factors_in_model_with_their_levels: &HashMap<String, Vec<String>>
) -> Result<Vec<BTreeMap<String, String>>, String> {
    let mut current_spec_factor_levels_map: HashMap<String, Vec<String>> = HashMap::new();
    for &factor_name_in_spec in factors_in_spec {
        if let Some(levels) = all_factors_in_model_with_their_levels.get(factor_name_in_spec) {
            current_spec_factor_levels_map.insert(factor_name_in_spec.to_string(), levels.clone());
        } else {
            return Err(
                format!("Factor '{}' not found in model or has no levels.", factor_name_in_spec)
            );
        }
    }

    let mut level_combinations_for_spec: Vec<BTreeMap<String, String>> = Vec::new();
    let mut temp_combo_vec: Vec<(String, String)> = Vec::new();

    generate_emmeans_level_combos_recursive(
        factors_in_spec,
        &current_spec_factor_levels_map,
        0,
        &mut temp_combo_vec,
        &mut level_combinations_for_spec
    );
    Ok(level_combinations_for_spec)
}

fn generate_emmeans_level_combos_recursive(
    factors: &[&str],
    levels_map: &HashMap<String, Vec<String>>,
    current_idx: usize,
    current_path: &mut Vec<(String, String)>,
    output: &mut Vec<BTreeMap<String, String>>
) {
    if current_idx == factors.len() {
        let btree_map: BTreeMap<_, _> = current_path.iter().cloned().collect();
        output.push(btree_map);
        return;
    }

    let factor_name = factors[current_idx];
    if let Some(levels) = levels_map.get(factor_name) {
        for level in levels {
            current_path.push((factor_name.to_string(), level.clone()));
            generate_emmeans_level_combos_recursive(
                factors,
                levels_map,
                current_idx + 1,
                current_path,
                output
            );
            current_path.pop();
        }
    } else {
        generate_emmeans_level_combos_recursive(
            factors,
            levels_map,
            current_idx + 1,
            current_path,
            output
        );
    }
}

fn generate_l_vector_for_grand_mean(
    all_model_parameters_names: &[String],
    p_parameters: usize,
    all_factors_in_model_with_their_levels: &HashMap<String, Vec<String>>,
    covariate_means_map: &HashMap<String, f64>,
    covariate_names_from_config: &[String]
) -> Result<Vec<f64>, String> {
    let mut l_vector = vec![0.0; p_parameters];

    for (param_idx, model_param_full_name) in all_model_parameters_names.iter().enumerate() {
        if model_param_full_name == "Intercept" {
            l_vector[param_idx] = 1.0;
        } else if let Some(&covar_mean) = covariate_means_map.get(model_param_full_name) {
            l_vector[param_idx] = covar_mean;
        } else {
            let mut current_param_l_coeff = 1.0;
            let mut is_estimable_component = true;
            let detailed_parsed_param = parse_parameter_name(model_param_full_name);

            if detailed_parsed_param.is_empty() {
                current_param_l_coeff = 0.0;
            } else {
                for (name_part, _level_part) in detailed_parsed_param {
                    if name_part == "Intercept" {
                        continue;
                    }

                    if covariate_names_from_config.contains(&name_part) {
                        current_param_l_coeff *= covariate_means_map
                            .get(&name_part)
                            .copied()
                            .unwrap_or(0.0);
                    } else if
                        let Some(levels) = all_factors_in_model_with_their_levels.get(&name_part)
                    {
                        if !levels.is_empty() {
                            current_param_l_coeff /= levels.len() as f64;
                        } else {
                            is_estimable_component = false;
                            break;
                        }
                    } else {
                        is_estimable_component = false;
                        break;
                    }
                }
            }
            l_vector[param_idx] = if is_estimable_component { current_param_l_coeff } else { 0.0 };
        }
    }
    Ok(l_vector)
}

fn generate_l_vectors_for_emmeans(
    level_combinations_for_spec: &[BTreeMap<String, String>],
    all_model_parameters_names: &[String],
    p_parameters: usize,
    all_factors_in_model_with_their_levels: &HashMap<String, Vec<String>>,
    covariate_means_map: &HashMap<String, f64>,
    covariate_names_from_config: &[String]
) -> Result<(Vec<Vec<f64>>, Vec<String>), String> {
    let mut l_matrix_rows: Vec<Vec<f64>> = Vec::new();
    let mut l_labels: Vec<String> = Vec::new();

    for level_combo_map_for_emm_spec in level_combinations_for_spec {
        let mut l_vector = vec![0.0; p_parameters];

        let emm_param_name_parts: Vec<String> = level_combo_map_for_emm_spec
            .iter()
            .map(|(f, l)| format!("{}={}", f, l))
            .collect();
        l_labels.push(format!("EMM: {}", emm_param_name_parts.join(", ")));

        for (param_idx, model_param_full_name) in all_model_parameters_names.iter().enumerate() {
            let coeff = calculate_emmeans_coefficient(
                model_param_full_name,
                level_combo_map_for_emm_spec,
                all_factors_in_model_with_their_levels,
                covariate_means_map,
                covariate_names_from_config
            );
            l_vector[param_idx] = coeff;
        }

        l_matrix_rows.push(l_vector);
    }
    Ok((l_matrix_rows, l_labels))
}
