use crate::models::{
    config::{ ContrastMethod, UnivariateConfig },
    data::AnalysisData,
    result::{
        ConfidenceInterval,
        ContrastCoefficients,
        ContrastCoefficientsEntry,
        ContrastInformation,
        ContrastResult,
        ContrastResultEntry,
        ContrastTestResult,
        ContrastTestResultEntry,
        ParsedFactorSpec,
    },
};
use std::collections::{ HashMap, HashSet };
use nalgebra::{ DMatrix, DVector };

use super::core::*;

pub fn calculate_contrast_coefficients(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<ContrastCoefficients, String> {
    let mut processed_contrast_data_map = HashMap::new();

    let design_info = create_design_response_weights(data, config)?;
    let all_model_parameters_names = generate_all_row_parameter_names_sorted(&design_info, data)?;
    let ztwz_matrix = create_cross_product_matrix(&design_info)?;
    let swept_info = perform_sweep_and_extract_results(&ztwz_matrix, design_info.p_parameters)?;

    let beta_hat = &swept_info.beta_hat;
    let g_inv = &swept_info.g_inv;
    let s_rss = swept_info.s_rss;

    let df_error = (design_info.n_samples as i64) - (design_info.r_x_rank as i64);
    let mse = if df_error > 0 { s_rss / (df_error as f64) } else { f64::NAN };
    let sig_level_config = config.options.sig_level;

    let mut all_factors_in_model_with_their_levels: HashMap<String, Vec<String>> = HashMap::new();
    let mut unique_factors_in_model: HashSet<String> = HashSet::new();

    for term_name in &design_info.term_names {
        if term_name == "Intercept" {
            continue;
        }
        term_name.split('*').for_each(|f_name_part| {
            let f_name = f_name_part.trim().to_string();
            let is_covariate = config.main.covar
                .as_ref()
                .map_or(false, |covars| covars.contains(&f_name));
            if !is_covariate {
                unique_factors_in_model.insert(f_name);
            }
        });
    }

    for f_name in unique_factors_in_model {
        match get_factor_levels(data, &f_name) {
            Ok(levels) => {
                if !levels.is_empty() {
                    all_factors_in_model_with_their_levels.insert(f_name, levels);
                }
            }
            Err(e) => {
                return Err(format!("Error getting levels for factor '{}' in model: {}", f_name, e));
            }
        }
    }

    let factors_to_process_specs = config.contrast.factor_list.as_ref().unwrap().clone();

    for spec_str in &factors_to_process_specs {
        let parsed_spec = parse_contrast_factor_spec(spec_str)?;
        let levels_of_contrasted_factor = get_factor_levels(data, &parsed_spec.factor_name)?;

        let (l_matrix, cce_row_descriptions, l_labels) = generate_l_matrix_and_descriptions(
            &parsed_spec,
            &levels_of_contrasted_factor,
            &all_model_parameters_names,
            design_info.p_parameters,
            &all_factors_in_model_with_their_levels
        )?;

        if l_matrix.is_empty() {
            continue;
        }

        let cce: ContrastCoefficientsEntry;

        if config.options.coefficient_matrix {
            let cce_note_ref_part = if parsed_spec.ref_setting != "N/A" {
                format!(", Ref: {}.", parsed_spec.ref_setting)
            } else {
                if parsed_spec.method == ContrastMethod::None {
                    ".".to_string()
                } else {
                    ".".to_string()
                }
            };

            let cce_notes = vec![
                format!(
                    "L-Matrix for factor spec: \"{}\". Method: {:?}, Ref: {}.",
                    spec_str,
                    parsed_spec.method,
                    cce_note_ref_part
                )
            ];

            cce = ContrastCoefficientsEntry {
                parameter: all_model_parameters_names.clone(),
                l_label: l_labels,
                l_matrix: l_matrix.clone(),
                contrast_information: vec![format!("L-Matrix for: {}", spec_str)],
                note: Some(cce_notes.join("\n")),
                interpretation: Some(
                    "This table provides the contrast coefficients (L' Matrix) for the specified factor. Each row represents a contrast, and each column represents a model parameter. The coefficients indicate the contribution of each parameter to the contrast.".to_string()
                ),
            };
        } else {
            cce = ContrastCoefficientsEntry {
                parameter: Vec::new(),
                l_label: Vec::new(),
                l_matrix: Vec::new(),
                contrast_information: Vec::new(),
                note: None,
                interpretation: None,
            };
        }

        let contrast_result_struct = create_contrast_result(
            &cce_row_descriptions,
            spec_str,
            &l_matrix,
            beta_hat,
            g_inv,
            mse,
            df_error as f64,
            sig_level_config
        );

        let contrast_test_struct = create_contrast_test_result(
            spec_str,
            &l_matrix,
            beta_hat,
            g_inv,
            mse,
            df_error as f64,
            config.options.sig_level,
            config.options.est_effect_size,
            config.options.obs_power
        );

        let method_name_str = match parsed_spec.method {
            ContrastMethod::Deviation => "Deviation",
            ContrastMethod::Simple => "Simple",
            ContrastMethod::Difference => "Difference",
            ContrastMethod::Helmert => "Helmert",
            ContrastMethod::Repeated => "Repeated",
            ContrastMethod::Polynomial => "Polynomial (Linear)",
            ContrastMethod::None => "No",
        };

        let detail_str = if parsed_spec.method == ContrastMethod::Polynomial {
            format!(" (metric = {} levels)", levels_of_contrasted_factor.len())
        } else if
            (parsed_spec.method == ContrastMethod::Deviation ||
                parsed_spec.method == ContrastMethod::Simple) &&
            parsed_spec.ref_setting != "N/A"
        {
            let ref_level_name = if parsed_spec.use_first_as_ref {
                levels_of_contrasted_factor.first().map_or("N/A", |s| s.as_str())
            } else {
                levels_of_contrasted_factor.last().map_or("N/A", |s| s.as_str())
            };
            format!(" (Omitted category/ref = {})", ref_level_name)
        } else {
            "".to_string()
        };

        let l_matrix_description_for_index = format!(
            "{} Contrast{} for {}",
            method_name_str,
            detail_str,
            parsed_spec.factor_name
        );

        let contrast_info_for_index = ContrastInformation {
            contrast_name: l_matrix_description_for_index,
            transformation_coef: "Identity Matrix".to_string(),
            contrast_result: "Zero Matrix".to_string(),
        };

        processed_contrast_data_map.insert(spec_str.clone(), (
            cce,
            contrast_result_struct,
            contrast_test_struct,
            contrast_info_for_index,
        ));
    }

    let mut final_information_list: Vec<ContrastInformation> = Vec::new();
    let mut final_factor_names_list: Vec<String> = Vec::new();
    let mut final_cce_list: Vec<ContrastCoefficientsEntry> = Vec::new();
    let mut final_cr_list: Vec<ContrastResult> = Vec::new();
    let mut final_ctr_list: Vec<ContrastTestResult> = Vec::new();

    for spec_str in factors_to_process_specs {
        if let Some((cce, cr, ctr, info)) = processed_contrast_data_map.remove(&spec_str) {
            final_factor_names_list.push(spec_str.clone());
            if config.options.coefficient_matrix {
                final_cce_list.push(cce);
            }
            final_cr_list.push(cr);
            final_ctr_list.push(ctr);
            final_information_list.push(info);
        }
    }

    Ok(ContrastCoefficients {
        information: final_information_list,
        factor_names: final_factor_names_list,
        contrast_coefficients: final_cce_list,
        contrast_result: final_cr_list,
        contrast_test_result: final_ctr_list,
    })
}

fn parse_contrast_factor_spec(factor_spec_str: &str) -> Result<ParsedFactorSpec, String> {
    let parts: Vec<&str> = factor_spec_str.splitn(2, " (").collect();
    let factor_name = parts[0].trim().to_string();
    let mut method = ContrastMethod::None;
    let mut actual_ref_setting = "N/A".to_string();
    let mut use_first_as_ref = false;

    if parts.len() > 1 {
        let settings_part = parts[1].trim_end_matches(')');
        let settings_details: Vec<&str> = settings_part.split(", Ref:").collect();
        let method_str = settings_details[0].trim();

        // Menentukan metode kontras
        method = match method_str.to_lowercase().as_str() {
            "deviation" => ContrastMethod::Deviation,
            "simple" => ContrastMethod::Simple,
            "difference" => ContrastMethod::Difference,
            "helmert" => ContrastMethod::Helmert,
            "repeated" => ContrastMethod::Repeated,
            "polynomial" => ContrastMethod::Polynomial,
            "none" => ContrastMethod::None,
            _ => {
                return Err(
                    format!(
                        "Unknown contrast method: '{}' in spec '{}'",
                        method_str,
                        factor_spec_str
                    )
                );
            }
        };

        if method == ContrastMethod::Deviation || method == ContrastMethod::Simple {
            actual_ref_setting = "Last".to_string();
            use_first_as_ref = false;

            if settings_details.len() > 1 {
                let ref_from_spec = settings_details[1].trim().to_string();
                if ref_from_spec == "First" || ref_from_spec == "Last" {
                    actual_ref_setting = ref_from_spec.clone();
                    use_first_as_ref = ref_from_spec == "First";
                }
            }
        } else {
            if settings_details.len() > 1 {
                let ref_from_spec_ignored = settings_details[1].trim();
                return Err(
                    format!(
                        "Warning: 'Ref: {}' setting is ignored for contrast method '{}' on factor '{}'.",
                        ref_from_spec_ignored,
                        method_str,
                        factor_name
                    )
                );
            }
        }
    }

    // Jika parts.len() <= 1 (tidak ada kurung), method tetap None,
    // actual_ref_setting tetap "N/A", use_first_as_ref tetap false.
    Ok(ParsedFactorSpec {
        factor_name,
        method,
        ref_setting: actual_ref_setting,
        use_first_as_ref,
    })
}

fn generate_l_matrix_and_descriptions(
    parsed_spec: &ParsedFactorSpec,
    levels_of_contrasted_factor: &Vec<String>,
    all_model_parameters_names: &Vec<String>,
    p_total_model_params: usize,
    all_factors_in_model_with_their_levels: &HashMap<String, Vec<String>>
) -> Result<(Vec<Vec<f64>>, Vec<String>, Vec<String>), String> {
    let level_count_of_contrasted_factor = levels_of_contrasted_factor.len();
    let use_first_as_ref = parsed_spec.use_first_as_ref;
    let factor_to_contrast_name = &parsed_spec.factor_name;

    let num_contrasts = match parsed_spec.method {
        ContrastMethod::Polynomial => {
            if level_count_of_contrasted_factor >= 2 { 1 } else { 0 }
        }
        ContrastMethod::None => 0,
        _ => level_count_of_contrasted_factor.saturating_sub(1),
    };

    let mut l_matrix = vec![vec![0.0; p_total_model_params]; num_contrasts];
    let mut cce_row_descriptions: Vec<String> = Vec::with_capacity(num_contrasts);
    let mut l_labels: Vec<String> = Vec::with_capacity(num_contrasts);

    for i_contrast_idx in 0..num_contrasts {
        for j_param_col_idx in 0..p_total_model_params {
            let model_param_str = &all_model_parameters_names[j_param_col_idx];
            let parsed_model_param_map = parse_parameter_name(model_param_str);

            if !parsed_model_param_map.contains_key(factor_to_contrast_name) {
                l_matrix[i_contrast_idx][j_param_col_idx] = 0.0;
                continue;
            }

            let level_of_contrasted_factor_in_this_param = parsed_model_param_map
                .get(factor_to_contrast_name)
                .unwrap();
            let level_idx_in_factor_levels = levels_of_contrasted_factor
                .iter()
                .position(|r| r == level_of_contrasted_factor_in_this_param);

            let current_level_data_idx = level_idx_in_factor_levels.unwrap();

            let mut base_coeff = 0.0;

            match parsed_spec.method {
                ContrastMethod::Deviation => {
                    // Deviation: membandingkan level tertentu dengan grand mean
                    if level_count_of_contrasted_factor == 2 {
                        let target_level_for_positive_coeff = if use_first_as_ref { 1 } else { 0 };

                        if current_level_data_idx == target_level_for_positive_coeff {
                            base_coeff = 0.5;
                        } else {
                            base_coeff = -0.5;
                        }
                    } else {
                        let focus_level_for_this_contrast_row = if use_first_as_ref {
                            i_contrast_idx + 1
                        } else {
                            i_contrast_idx
                        };

                        if focus_level_for_this_contrast_row >= level_count_of_contrasted_factor {
                            continue;
                        }

                        if current_level_data_idx == focus_level_for_this_contrast_row {
                            base_coeff = 1.0 - 1.0 / (level_count_of_contrasted_factor as f64);
                        } else {
                            base_coeff = -1.0 / (level_count_of_contrasted_factor as f64);
                        }
                    }
                }
                ContrastMethod::Simple => {
                    // Simple: membandingkan level tertentu dengan level referensi
                    let ref_level_data_idx = if use_first_as_ref {
                        0
                    } else {
                        level_count_of_contrasted_factor - 1
                    };

                    let current_level_for_this_contrast_row = if use_first_as_ref {
                        i_contrast_idx + 1
                    } else {
                        i_contrast_idx
                    };

                    if current_level_for_this_contrast_row >= level_count_of_contrasted_factor {
                        continue;
                    }

                    if current_level_data_idx == current_level_for_this_contrast_row {
                        base_coeff = 1.0;
                    } else if current_level_data_idx == ref_level_data_idx {
                        base_coeff = -1.0;
                    }
                }
                ContrastMethod::Difference => {
                    // Difference: level_i dengan mean dari level sebelumnya
                    let level_being_compared_idx = i_contrast_idx + 1;

                    if current_level_data_idx == level_being_compared_idx {
                        base_coeff = 1.0;
                    } else if current_level_data_idx < level_being_compared_idx {
                        base_coeff = -1.0 / (level_being_compared_idx as f64);
                    }
                }
                ContrastMethod::Helmert => {
                    // Helmert: level_i dengan mean dari level berikutnya
                    let level_being_compared_idx = i_contrast_idx;

                    if current_level_data_idx == level_being_compared_idx {
                        base_coeff = 1.0;
                    } else if current_level_data_idx > level_being_compared_idx {
                        let num_subsequent =
                            level_count_of_contrasted_factor - 1 - level_being_compared_idx;
                        if num_subsequent > 0 {
                            base_coeff = -1.0 / (num_subsequent as f64);
                        }
                    }
                }
                ContrastMethod::Repeated => {
                    // Repeated: level_i dengan level_{i+1}
                    let level_being_compared_idx = i_contrast_idx;
                    let next_level_idx = i_contrast_idx + 1;

                    if current_level_data_idx == level_being_compared_idx {
                        base_coeff = 1.0;
                    } else if current_level_data_idx == next_level_idx {
                        base_coeff = -1.0;
                    }
                }
                ContrastMethod::Polynomial => {
                    // Hanya Linear (degree 1)
                    let poly_coeffs = generate_polynomial_contrast(
                        level_count_of_contrasted_factor
                    );

                    if current_level_data_idx < poly_coeffs.len() {
                        base_coeff = poly_coeffs[current_level_data_idx];
                    }
                }
                ContrastMethod::None => {
                    base_coeff = 0.0;
                }
            }

            let mut final_coeff = base_coeff;
            for (other_factor_in_param_name, _level) in parsed_model_param_map.iter() {
                if
                    other_factor_in_param_name != factor_to_contrast_name &&
                    other_factor_in_param_name != "Intercept"
                {
                    if
                        let Some(other_factor_levels) = all_factors_in_model_with_their_levels.get(
                            other_factor_in_param_name
                        )
                    {
                        if !other_factor_levels.is_empty() {
                            final_coeff /= other_factor_levels.len() as f64;
                        }
                    }
                }
            }
            l_matrix[i_contrast_idx][j_param_col_idx] = final_coeff;
        }

        // Informasi Contrast
        let row_desc = match parsed_spec.method {
            ContrastMethod::Deviation => {
                if level_count_of_contrasted_factor == 2 {
                    let compared_level_idx = if use_first_as_ref { 1 } else { 0 };
                    let omitted_level_idx = if use_first_as_ref { 0 } else { 1 };

                    format!(
                        "{} vs. Mean (Omitted: {})",
                        levels_of_contrasted_factor[compared_level_idx],
                        levels_of_contrasted_factor[omitted_level_idx]
                    )
                } else {
                    let focus_level_idx = if use_first_as_ref {
                        i_contrast_idx + 1
                    } else {
                        i_contrast_idx
                    };

                    format!(
                        "{} vs. Grand Mean (Ref: {})",
                        levels_of_contrasted_factor[focus_level_idx],
                        levels_of_contrasted_factor
                            [
                                if use_first_as_ref {
                                    0
                                } else {
                                    level_count_of_contrasted_factor - 1
                                }
                            ]
                    )
                }
            }
            ContrastMethod::Simple => {
                let ref_idx = if use_first_as_ref {
                    0
                } else {
                    level_count_of_contrasted_factor - 1
                };

                let current_idx = if use_first_as_ref {
                    i_contrast_idx + 1
                } else {
                    i_contrast_idx
                };

                format!(
                    "{} vs. {}",
                    levels_of_contrasted_factor[current_idx],
                    levels_of_contrasted_factor[ref_idx]
                )
            }
            ContrastMethod::Difference => {
                let current_idx = i_contrast_idx + 1;

                format!(
                    "{} vs. Mean(Levels {}..{})",
                    levels_of_contrasted_factor[current_idx],
                    levels_of_contrasted_factor[0],
                    levels_of_contrasted_factor[i_contrast_idx]
                )
            }
            ContrastMethod::Helmert => {
                let current_idx = i_contrast_idx;

                let desc = if current_idx + 1 < level_count_of_contrasted_factor {
                    format!(
                        "Mean(Levels {}..{})",
                        levels_of_contrasted_factor[current_idx + 1],
                        levels_of_contrasted_factor[level_count_of_contrasted_factor - 1]
                    )
                } else {
                    "No subsequent".to_string()
                };

                format!("{} vs. {}", levels_of_contrasted_factor[current_idx], desc)
            }
            ContrastMethod::Repeated => {
                let current_idx = i_contrast_idx;
                let next_idx = i_contrast_idx + 1;

                format!(
                    "{} vs. {}",
                    levels_of_contrasted_factor[current_idx],
                    levels_of_contrasted_factor[next_idx]
                )
            }
            ContrastMethod::Polynomial => "Linear Trend".to_string(),
            ContrastMethod::None => "No Contrast".to_string(),
        };

        cce_row_descriptions.push(format!("{}: {}", factor_to_contrast_name, row_desc));

        let label_detail = if parsed_spec.method == ContrastMethod::Polynomial {
            "Linear".to_string()
        } else {
            format!("C{}", i_contrast_idx + 1)
        };
        l_labels.push(
            format!("L{}_{}_{}", i_contrast_idx + 1, factor_to_contrast_name, label_detail)
        );
    }

    Ok((l_matrix, cce_row_descriptions, l_labels))
}

fn create_contrast_result(
    k_matrix_row_descriptions: &Vec<String>,
    factor_spec_str: &str,
    l_matrix_factor: &Vec<Vec<f64>>,
    beta_hat: &DVector<f64>,
    g_inv: &DMatrix<f64>,
    mse: f64,
    df_error: f64,
    sig_level: f64
) -> ContrastResult {
    let num_contrasts_for_factor = l_matrix_factor.len();
    if num_contrasts_for_factor == 0 {
        return ContrastResult {
            parameter: k_matrix_row_descriptions.clone(),
            contrast_result: Vec::new(),
            note: Some(format!("No contrasts to calculate for: {}", factor_spec_str)),
            interpretation: None,
        };
    }

    let p_model_params = beta_hat.nrows();
    if p_model_params == 0 {
        return ContrastResult {
            parameter: k_matrix_row_descriptions.clone(),
            contrast_result: vec![ContrastResultEntry {
                contrast_estimate: f64::NAN,
                hypothesized_value: 0.0,
                difference: f64::NAN,
                standard_error: f64::NAN,
                significance: f64::NAN,
                confidence_interval: ConfidenceInterval {
                    lower_bound: f64::NAN,
                    upper_bound: f64::NAN,
                },
            }; num_contrasts_for_factor],
            note: Some(format!("No model parameters for contrast: {}", factor_spec_str)),
            interpretation: None,
        };
    }

    let l_nalgebra = DMatrix::from_row_slice(
        num_contrasts_for_factor,
        p_model_params,
        &l_matrix_factor.iter().flatten().cloned().collect::<Vec<f64>>()
    );
    let contrast_estimates_vec: DVector<f64> = &l_nalgebra * beta_hat;
    let mut result_entries: Vec<ContrastResultEntry> = Vec::with_capacity(num_contrasts_for_factor);

    for i in 0..num_contrasts_for_factor {
        let l_row_i: DVector<f64> = l_nalgebra.row(i).transpose().into_owned();

        let contrast_estimate_scalar = contrast_estimates_vec[i];
        let hypothesized_value = 0.0;
        let difference = contrast_estimate_scalar - hypothesized_value;

        let std_error = if mse.is_nan() || mse < 0.0 {
            f64::NAN
        } else {
            let variance_of_contrast_estimate_matrix = l_row_i.transpose() * g_inv * &l_row_i * mse;

            if
                variance_of_contrast_estimate_matrix.nrows() == 1 &&
                variance_of_contrast_estimate_matrix.ncols() == 1
            {
                let var_scalar = variance_of_contrast_estimate_matrix[(0, 0)];
                if var_scalar >= 0.0 {
                    var_scalar.sqrt()
                } else {
                    f64::NAN
                }
            } else {
                f64::NAN
            }
        };

        let t_value = if std_error.is_nan() || std_error == 0.0 {
            f64::NAN
        } else {
            contrast_estimate_scalar / std_error
        };

        let df_error_usize = if df_error >= 0.0 { df_error as usize } else { 0 };
        let t_significance = if t_value.is_nan() || df_error_usize == 0 {
            f64::NAN
        } else {
            calculate_t_significance(t_value.abs(), df_error_usize)
        };

        let t_critical_val = if df_error_usize == 0 {
            f64::NAN
        } else {
            calculate_t_critical(Some(sig_level), df_error_usize)
        };

        let (ci_lower, ci_upper) = if t_critical_val.is_nan() || std_error.is_nan() {
            (f64::NAN, f64::NAN)
        } else {
            (
                contrast_estimate_scalar - t_critical_val * std_error,
                contrast_estimate_scalar + t_critical_val * std_error,
            )
        };

        result_entries.push(ContrastResultEntry {
            contrast_estimate: contrast_estimate_scalar,
            hypothesized_value,
            difference,
            standard_error: std_error,
            significance: t_significance,
            confidence_interval: ConfidenceInterval {
                lower_bound: ci_lower,
                upper_bound: ci_upper,
            },
        });
    }

    ContrastResult {
        parameter: k_matrix_row_descriptions.clone(),
        contrast_result: result_entries,
        note: Some(format!("Calculated results for factor spec: {}", factor_spec_str)),
        interpretation: Some(
            "This table provides the results for each contrast. It shows the estimated value of the contrast (the 'Contrast Estimate'), its standard error, and a t-test for the hypothesis that the contrast value is zero. The confidence interval provides a range for the true contrast value.".to_string()
        ),
    }
}

fn create_contrast_test_result(
    factor_spec_str: &str,
    l_matrix_factor: &Vec<Vec<f64>>,
    beta_hat: &DVector<f64>,
    g_inv: &DMatrix<f64>,
    mse: f64,
    df_error: f64,
    sig_level: f64,
    est_effect_size: bool,
    obs_power: bool
) -> ContrastTestResult {
    let num_contrasts_for_factor = l_matrix_factor.len();
    let df_hypothesis = num_contrasts_for_factor;
    let df_error_usize = if df_error >= 0.0 { df_error as usize } else { 0 };

    if df_hypothesis == 0 {
        let contrast_entry = ContrastTestResultEntry {
            source: "Contrast".to_string(),
            sum_of_squares: f64::NAN,
            df: 0,
            mean_square: f64::NAN,
            f_value: f64::NAN,
            significance: f64::NAN,
            partial_eta_squared: f64::NAN,
            noncent_parameter: f64::NAN,
            observed_power: f64::NAN,
        };

        let error_entry = ContrastTestResultEntry {
            source: "Error".to_string(),
            sum_of_squares: if !mse.is_nan() && df_error_usize > 0 {
                mse * (df_error_usize as f64)
            } else {
                f64::NAN
            },
            df: df_error_usize,
            mean_square: if !mse.is_nan() {
                mse
            } else {
                f64::NAN
            },
            f_value: f64::NAN,
            significance: f64::NAN,
            partial_eta_squared: f64::NAN,
            noncent_parameter: f64::NAN,
            observed_power: f64::NAN,
        };

        return ContrastTestResult {
            source: vec![format!("Overall test for {}", factor_spec_str)],
            contrast_result: vec![contrast_entry, error_entry],
            note: Some(format!("No hypothesis to test for: {}", factor_spec_str)),
            interpretation: None,
        };
    }

    let p_model_params = beta_hat.nrows();
    if p_model_params == 0 {
        let contrast_entry = ContrastTestResultEntry {
            source: "Contrast".to_string(),
            sum_of_squares: f64::NAN,
            df: df_hypothesis,
            mean_square: f64::NAN,
            f_value: f64::NAN,
            significance: f64::NAN,
            partial_eta_squared: f64::NAN,
            noncent_parameter: f64::NAN,
            observed_power: f64::NAN,
        };

        let error_entry = ContrastTestResultEntry {
            source: "Error".to_string(),
            sum_of_squares: if !mse.is_nan() && df_error_usize > 0 {
                mse * (df_error_usize as f64)
            } else {
                f64::NAN
            },
            df: df_error_usize,
            mean_square: if !mse.is_nan() {
                mse
            } else {
                f64::NAN
            },
            f_value: f64::NAN,
            significance: f64::NAN,
            partial_eta_squared: f64::NAN,
            noncent_parameter: f64::NAN,
            observed_power: f64::NAN,
        };

        return ContrastTestResult {
            source: vec![format!("Overall test for {}", factor_spec_str)],
            contrast_result: vec![contrast_entry, error_entry],
            note: Some(format!("No model parameters for contrast test: {}", factor_spec_str)),
            interpretation: None,
        };
    }

    let l_nalgebra = DMatrix::from_row_slice(
        num_contrasts_for_factor,
        p_model_params,
        &l_matrix_factor.iter().flatten().cloned().collect::<Vec<f64>>()
    );

    let l_beta: DVector<f64> = &l_nalgebra * beta_hat;
    let l_ginv_lt: DMatrix<f64> = &l_nalgebra * g_inv * l_nalgebra.transpose();

    let mut ssh = f64::NAN;
    let mut msh = f64::NAN;
    let mut f_value = f64::NAN;
    let mut notes = vec![format!("Calculated test for factor spec: {}", factor_spec_str)];

    if let Some(l_ginv_lt_inv) = l_ginv_lt.clone().try_inverse() {
        let ssh_matrix = l_beta.transpose() * l_ginv_lt_inv * &l_beta;
        if ssh_matrix.nrows() == 1 && ssh_matrix.ncols() == 1 {
            ssh = ssh_matrix[(0, 0)];
            if ssh < 0.0 && ssh.abs() > 1e-9 {
                ssh = f64::NAN;
            } else if ssh < 0.0 {
                ssh = 0.0;
            }

            if !ssh.is_nan() {
                msh = ssh / (df_hypothesis as f64);
                if !mse.is_nan() && mse > 0.0 && df_error > 0.0 {
                    f_value = msh / mse;
                } else if mse == 0.0 && msh > 1e-9 {
                    f_value = f64::INFINITY;
                } else if mse == 0.0 && msh <= 1e-9 {
                    f_value = f64::NAN;
                }
            }
        } else {
            notes.push("Error on SSH matrix was not 1x1.".to_string());
        }
    } else {
        notes.push(
            format!(
                "Matrix L*G_inv*L' ({}x{}) was not invertible.",
                l_ginv_lt.nrows(),
                l_ginv_lt.ncols()
            )
        );

        let is_l_ginv_lt_zero = l_ginv_lt.iter().all(|&x| x.abs() < 1e-9);
        let is_l_beta_zero = l_beta.iter().all(|&x| x.abs() < 1e-9);

        if is_l_ginv_lt_zero && is_l_beta_zero {
            ssh = 0.0;
            msh = 0.0;
            f_value = if mse > 0.0 { 0.0 } else { f64::NAN };
            notes.push("SSH set to 0.".to_string());
        } else if is_l_ginv_lt_zero && !is_l_beta_zero {
            notes.push("SSH is NaN.".to_string());
        }
    }

    let f_significance = if f_value.is_nan() || df_hypothesis == 0 || df_error_usize == 0 {
        f64::NAN
    } else {
        calculate_f_significance(df_hypothesis, df_error_usize, f_value)
    };

    let (partial_eta_squared, noncent_parameter, observed_power) = {
        let ss_error = if !mse.is_nan() && df_error_usize > 0 {
            mse * (df_error_usize as f64)
        } else {
            f64::NAN
        };

        let pes = if est_effect_size && !ssh.is_nan() && !ss_error.is_nan() {
            let den = ssh + ss_error;
            if den > 1e-9 {
                (ssh / den).max(0.0).min(1.0)
            } else {
                0.0
            }
        } else {
            f64::NAN
        };

        let (ncp, power) = if obs_power && !f_value.is_nan() && f_value > 0.0 && df_hypothesis > 0 {
            let ncp_val = f_value * (df_hypothesis as f64);
            let power_val = calculate_observed_power_f(
                f_value,
                df_hypothesis as f64,
                df_error,
                sig_level
            );
            (ncp_val, power_val)
        } else {
            (f64::NAN, f64::NAN)
        };

        (pes, ncp, power)
    };

    let contrast_entry = ContrastTestResultEntry {
        source: "Contrast".to_string(),
        sum_of_squares: ssh,
        df: df_hypothesis,
        mean_square: msh,
        f_value,
        significance: f_significance,
        partial_eta_squared,
        noncent_parameter,
        observed_power,
    };

    let error_entry = ContrastTestResultEntry {
        source: "Error".to_string(),
        sum_of_squares: if !mse.is_nan() && df_error_usize > 0 {
            mse * (df_error_usize as f64)
        } else {
            f64::NAN
        },
        df: df_error_usize,
        mean_square: if !mse.is_nan() {
            mse
        } else {
            f64::NAN
        },
        f_value: f64::NAN,
        significance: f64::NAN,
        partial_eta_squared: f64::NAN,
        noncent_parameter: f64::NAN,
        observed_power: f64::NAN,
    };

    ContrastTestResult {
        source: vec![format!("Overall test for {}", factor_spec_str)],
        contrast_result: vec![contrast_entry, error_entry],
        note: Some(notes.join("\n")),
        interpretation: Some(
            "This table provides an overall F-test for the set of contrasts associated with the factor. A significant F-value indicates that there is a statistically significant difference among the levels of the factor, based on the specified contrast type.".to_string()
        ),
    }
}

pub fn generate_polynomial_contrast(level_count: usize) -> Vec<f64> {
    if level_count == 0 {
        return vec![];
    }
    let mut contrasts = vec![0.0; level_count];

    if level_count < 2 {
        return contrasts;
    }

    let x_values: Vec<f64> = (0..level_count)
        .map(|i| (i as f64) - ((level_count - 1) as f64) / 2.0)
        .collect();

    for i in 0..level_count {
        contrasts[i] = x_values[i];
    }

    let sum_sq: f64 = contrasts
        .iter()
        .map(|&x| x * x)
        .sum();

    if sum_sq > 1e-19 {
        let norm = sum_sq.sqrt();
        for x in contrasts.iter_mut() {
            *x /= norm;
        }
    }

    contrasts
}
