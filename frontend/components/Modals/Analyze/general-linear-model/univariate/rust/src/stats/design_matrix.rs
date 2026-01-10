use nalgebra::{ DMatrix, DVector };
use std::collections::HashMap;

use crate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{ DesignMatrixInfo, SweptMatrixInfo },
};

use super::core::*;

pub fn create_design_response_weights(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<DesignMatrixInfo, String> {
    let dep_var_name = config.main.dep_var.as_ref().unwrap();

    let mut y_values = Vec::new();
    let mut wls_weights = config.main.wls_weight.as_ref().map(|_| Vec::new());
    let mut case_indices_to_keep = Vec::new();

    for (i, record) in data.dependent_data[0].iter().enumerate() {
        let dep_val = extract_numeric_from_record(record, dep_var_name).ok_or_else(||
            format!("Non-numeric dependent variable value for case {}", i)
        )?;
        if let Some(wls_var_name) = &config.main.wls_weight {
            let wls_val = if let Some(wls_data_sets) = &data.wls_data {
                let wls_data_set_index = data.wls_data_defs
                    .as_ref()
                    .and_then(|wls_defs|
                        wls_defs
                            .iter()
                            .position(|def_group|
                                def_group.iter().any(|def| def.name == *wls_var_name)
                            )
                    );

                if let Some(index) = wls_data_set_index {
                    if let Some(wls_data_set) = wls_data_sets.get(index) {
                        wls_data_set
                            .get(i)
                            .and_then(|r| extract_numeric_from_record(r, wls_var_name))
                    } else {
                        None
                    }
                } else {
                    None
                }
            } else {
                None
            };

            let wls_val = wls_val.ok_or_else(|| format!("Non-numeric WLS weight for case {}", i))?;

            if wls_val > 0.0 {
                y_values.push(dep_val);
                wls_weights.as_mut().unwrap().push(wls_val);
                case_indices_to_keep.push(i);
            }
        } else {
            y_values.push(dep_val);
            case_indices_to_keep.push(i);
        }
    }

    let n_samples_effective = y_values.len();
    if n_samples_effective == 0 {
        return Ok(DesignMatrixInfo {
            x: DMatrix::zeros(0, 0),
            y: DVector::zeros(0),
            w: None,
            n_samples: 0,
            p_parameters: 0,
            r_x_rank: 0,
            term_column_indices: HashMap::new(),
            intercept_column: None,
            term_names: Vec::new(),
            case_indices_to_keep: Vec::new(),
            fixed_factor_indices: HashMap::new(),
            random_factor_indices: HashMap::new(),
            covariate_indices: HashMap::new(),
        });
    }

    let y_nalgebra = DVector::from_vec(y_values);
    let w_nalgebra_opt = wls_weights.map(DVector::from_vec);

    let mut model_terms = Vec::new();
    if config.model.intercept {
        model_terms.push("Intercept".to_string());
    }
    if config.model.non_cust {
        model_terms.extend(generate_non_cust_terms(config)?);
    } else if config.model.custom || config.model.build_custom_term {
        model_terms.extend(generate_custom_terms(config)?);
    }

    let mut x_matrix_cols = Vec::new();
    let mut term_column_map = HashMap::new();
    let mut current_col_idx = 0;
    let mut intercept_col_idx = None;
    let mut final_term_names = Vec::new();
    let mut fixed_factor_indices = HashMap::new();
    let mut random_factor_indices = HashMap::new();
    let mut covariate_indices = HashMap::new();

    let mut factor_levels_cache = HashMap::new();
    let mut covariate_cols_cache = HashMap::new();
    let mut factor_cols_cache = HashMap::new();

    let all_terms_for_cache: Vec<_> = model_terms
        .iter()
        .filter(|t| t.as_str() != "Intercept")
        .flat_map(|t| parse_interaction_term(t))
        .collect();

    // Cache covariate and factor columns
    for term_component in &all_terms_for_cache {
        if
            config.main.covar.as_ref().map_or(false, |c| c.contains(term_component)) &&
            !covariate_cols_cache.contains_key(term_component)
        {
            let mut cov_values_filtered = Vec::with_capacity(case_indices_to_keep.len());
            let cov_data_set_index = data.covariate_data_defs
                .as_ref()
                .and_then(|cov_defs|
                    cov_defs
                        .iter()
                        .position(|def_group|
                            def_group.iter().any(|def| def.name == *term_component)
                        )
                );
            if let Some(index) = cov_data_set_index {
                if let Some(cov_data_sets) = &data.covariate_data {
                    if let Some(cov_data_set) = cov_data_sets.get(index) {
                        for &idx_to_keep in &case_indices_to_keep {
                            let val = cov_data_set
                                .get(idx_to_keep)
                                .and_then(|r| extract_numeric_from_record(r, term_component))
                                .ok_or_else(||
                                    format!("Non-numeric covariate '{}'", term_component)
                                )?;
                            cov_values_filtered.push(val);
                        }
                    }
                }
            }
            covariate_cols_cache.insert(
                term_component.clone(),
                DVector::from_vec(cov_values_filtered)
            );
        } else if !factor_levels_cache.contains_key(term_component) {
            let levels = get_factor_levels(data, term_component)?;
            let mut level_cols = HashMap::with_capacity(levels.len());
            for level in &levels {
                let mut combo = HashMap::new();
                combo.insert(term_component.clone(), level.clone());
                let full_col = matches_combination(&combo, data);
                let filtered_col: Vec<f64> = case_indices_to_keep
                    .iter()
                    .map(|&idx| full_col.get(idx).cloned().unwrap_or(0.0))
                    .collect();
                level_cols.insert(level.clone(), DVector::from_vec(filtered_col));
            }
            factor_cols_cache.insert(term_component.clone(), level_cols);
            factor_levels_cache.insert(term_component.clone(), levels);
        }
    }

    for term_name in &model_terms {
        final_term_names.push(term_name.clone());
        let term_start_col = current_col_idx;
        let mut term_matrix_cols = Vec::new();

        if term_name == "Intercept" {
            if config.model.intercept {
                term_matrix_cols.push(DVector::from_element(n_samples_effective, 1.0));
            } else {
                continue;
            }
        } else if config.main.covar.as_ref().map_or(false, |c| c.contains(term_name)) {
            if let Some(col) = covariate_cols_cache.get(term_name) {
                if !col.is_empty() {
                    term_matrix_cols.push(col.clone());
                }
            }
        } else if term_name.contains('*') {
            let components = parse_interaction_term(term_name);
            let (factors, covariates): (Vec<_>, Vec<_>) = components
                .into_iter()
                .partition(|comp| !covariate_cols_cache.contains_key(comp));
            let mut factor_interaction_cols = if !factors.is_empty() {
                let factor_levels: Vec<_> = factors
                    .iter()
                    .map(|f| (f.clone(), factor_levels_cache.get(f).unwrap().clone()))
                    .collect();
                let mut level_combinations = Vec::new();
                generate_level_combinations(
                    &factor_levels,
                    &mut HashMap::new(),
                    0,
                    &mut level_combinations
                );
                level_combinations
                    .iter()
                    .map(|combo| {
                        combo
                            .iter()
                            .fold(
                                DVector::from_element(n_samples_effective, 1.0),
                                |mut acc, (factor_name, level)| {
                                    if let Some(level_cols) = factor_cols_cache.get(factor_name) {
                                        if let Some(level_col) = level_cols.get(level) {
                                            acc.component_mul_assign(level_col);
                                        }
                                    }
                                    acc
                                }
                            )
                    })
                    .collect()
            } else {
                vec![DVector::from_element(n_samples_effective, 1.0)]
            };
            let covariate_cols: Vec<_> = covariates
                .iter()
                .filter_map(|name| covariate_cols_cache.get(name))
                .collect();
            for cov_col in &covariate_cols {
                factor_interaction_cols = factor_interaction_cols
                    .into_iter()
                    .map(|factor_col| factor_col.component_mul(cov_col))
                    .collect();
            }
            term_matrix_cols.extend(factor_interaction_cols);
        } else if let Some(level_cols) = factor_cols_cache.get(term_name) {
            if let Some(levels) = factor_levels_cache.get(term_name) {
                for level in levels {
                    if let Some(col) = level_cols.get(level) {
                        term_matrix_cols.push(col.clone());
                    }
                }
            }
        }

        if !term_matrix_cols.is_empty() {
            let term_end_col = current_col_idx + term_matrix_cols.len() - 1;
            let added_indices: Vec<usize> = (current_col_idx..=term_end_col).collect();

            if config.main.fix_factor.as_ref().map_or(false, |f| f.contains(term_name)) {
                fixed_factor_indices.insert(term_name.clone(), added_indices.clone());
            } else if config.main.rand_factor.as_ref().map_or(false, |r| r.contains(term_name)) {
                random_factor_indices.insert(term_name.clone(), added_indices.clone());
            } else if config.main.covar.as_ref().map_or(false, |c| c.contains(term_name)) {
                covariate_indices.insert(term_name.clone(), added_indices.clone());
            }

            for col_vec in term_matrix_cols {
                if col_vec.len() == n_samples_effective {
                    x_matrix_cols.push(col_vec);
                    current_col_idx += 1;
                }
            }

            if current_col_idx > term_start_col {
                term_column_map.insert(term_name.clone(), (term_start_col, current_col_idx - 1));
            }
        }
    }

    let x_nalgebra = if !x_matrix_cols.is_empty() {
        DMatrix::from_columns(&x_matrix_cols)
    } else {
        DMatrix::zeros(n_samples_effective, 0)
    };

    let p_parameters = x_nalgebra.ncols();
    let r_x_rank = if p_parameters > 0 { x_nalgebra.rank(1e-10) } else { 0 };

    if
        config.model.intercept &&
        x_nalgebra.ncols() > 0 &&
        model_terms.get(0) == Some(&"Intercept".to_string())
    {
        if let Some((start, end)) = term_column_map.get("Intercept") {
            if *start == 0 && *end == 0 {
                intercept_col_idx = Some(0);
            }
        }
    }

    Ok(DesignMatrixInfo {
        x: x_nalgebra,
        y: y_nalgebra,
        w: w_nalgebra_opt,
        n_samples: n_samples_effective,
        p_parameters,
        r_x_rank,
        term_column_indices: term_column_map,
        intercept_column: intercept_col_idx,
        term_names: final_term_names,
        case_indices_to_keep,
        fixed_factor_indices,
        random_factor_indices,
        covariate_indices,
    })
}

pub fn create_cross_product_matrix(design_info: &DesignMatrixInfo) -> Result<DMatrix<f64>, String> {
    let x = &design_info.x;
    let y = &design_info.y;
    let n = design_info.n_samples;

    let mut z_parts: Vec<DMatrix<f64>> = Vec::new();
    z_parts.push(x.clone_owned());

    let y_matrix = DMatrix::from_column_slice(y.nrows(), 1, y.as_slice());
    z_parts.push(y_matrix);

    let z_columns: Vec<_> = z_parts
        .iter()
        .flat_map(|m| m.column_iter())
        .collect();
    let z = DMatrix::from_columns(&z_columns);

    if let Some(w_vec) = &design_info.w {
        if w_vec.len() != n {
            return Err("Weight vector length mismatch for Z'WZ.".to_string());
        }
        let w_diag = DMatrix::from_diagonal(w_vec);
        let ztwz = z.transpose() * w_diag * z;
        Ok(ztwz)
    } else {
        let ztz = z.transpose() * z;
        Ok(ztz)
    }
}

pub fn perform_sweep_and_extract_results(
    ztwz_matrix: &DMatrix<f64>,
    p_params_in_model: usize
) -> Result<SweptMatrixInfo, String> {
    if p_params_in_model == 0 {
        let s_rss = if ztwz_matrix.nrows() == 1 && ztwz_matrix.ncols() == 1 {
            ztwz_matrix[(0, 0)]
        } else if ztwz_matrix.nrows() > 0 && ztwz_matrix.ncols() > 0 {
            ztwz_matrix[(0, 0)]
        } else {
            0.0
        };

        return Ok(SweptMatrixInfo {
            g_inv: DMatrix::zeros(0, 0),
            beta_hat: DVector::zeros(0),
            s_rss,
        });
    }

    let total_dims = ztwz_matrix.nrows();

    // Validasi dimensi matriks
    if total_dims != p_params_in_model + 1 {
        return Err(
            format!(
                "Z'WZ matrix dimensions ({}x{}) inconsistent with p_params_in_model ({}). Expected {}x{}.",
                ztwz_matrix.nrows(),
                ztwz_matrix.ncols(),
                p_params_in_model,
                p_params_in_model + 1,
                p_params_in_model + 1
            )
        );
    }

    if ztwz_matrix.ncols() != total_dims {
        return Err(
            format!("Z'WZ matrix is not square ({}x{}).", ztwz_matrix.nrows(), ztwz_matrix.ncols())
        );
    }

    let mut c_matrix = ztwz_matrix.clone_owned();
    let mut swept_k_flags: Vec<bool> = vec![false; p_params_in_model];
    let mut original_diagonals: Vec<f64> = Vec::with_capacity(p_params_in_model);
    for k in 0..p_params_in_model {
        original_diagonals.push(c_matrix[(k, k)]);
    }
    let mut is_param_aliased: Vec<bool> = vec![false; p_params_in_model];
    let epsilon = 1e-12;

    // Proses sweep untuk setiap parameter
    for k in 0..p_params_in_model {
        let pivot_candidate = c_matrix[(k, k)];
        let s_k = original_diagonals[k];

        // Deteksi parameter yang tidak teridentifikasi (aliased)
        if pivot_candidate.abs() <= epsilon * s_k.abs() {
            is_param_aliased[k] = true;
            continue;
        }

        let is_inconsistent =
            (swept_k_flags[k] && pivot_candidate > epsilon) ||
            (!swept_k_flags[k] && pivot_candidate < -epsilon);
        if is_inconsistent {
            is_param_aliased[k] = true;
            continue;
        }

        let pivot_val = c_matrix[(k, k)];

        // Simpan nilai kolom dan baris ke-k sebelum diubah
        let mut old_col_k_vals = DVector::zeros(total_dims);
        let mut old_row_k_vals = DVector::zeros(total_dims);
        for i in 0..total_dims {
            old_col_k_vals[i] = c_matrix[(i, k)];
        }
        for j in 0..total_dims {
            old_row_k_vals[j] = c_matrix[(k, j)];
        }

        // Update semua elemen kecuali baris dan kolom pivot
        for i in 0..total_dims {
            if i == k {
                continue;
            }
            for j in 0..total_dims {
                if j == k {
                    continue;
                }
                c_matrix[(i, j)] -= (old_col_k_vals[i] * old_row_k_vals[j]) / pivot_val;
            }
        }

        // Update baris dan kolom pivot
        for j in 0..total_dims {
            if j == k {
                continue;
            }
            c_matrix[(k, j)] /= pivot_val;
        }

        for i in 0..total_dims {
            if i == k {
                continue;
            }
            c_matrix[(i, k)] /= pivot_val;
        }

        // Update elemen pivot
        c_matrix[(k, k)] = -1.0 / pivot_val;

        swept_k_flags[k] = !swept_k_flags[k];
    }

    // s_rss diambil dari elemen terakhir (baris dan kolom terakhir)
    let s_rss = c_matrix[(p_params_in_model, p_params_in_model)];

    // Ekstrak matriks invers dan estimasi parameter
    let mut final_g_inv = DMatrix::zeros(p_params_in_model, p_params_in_model);
    let mut final_beta_hat = DVector::zeros(p_params_in_model);

    for i in 0..p_params_in_model {
        if !is_param_aliased[i] {
            final_beta_hat[i] = c_matrix[(i, p_params_in_model)];
            for j in 0..p_params_in_model {
                if !is_param_aliased[j] {
                    final_g_inv[(i, j)] = -c_matrix[(i, j)];
                } else {
                    final_g_inv[(i, j)] = 0.0;
                }
            }
        } else {
            final_beta_hat[i] = 0.0;
            for r in 0..p_params_in_model {
                final_g_inv[(i, r)] = 0.0;
                final_g_inv[(r, i)] = 0.0;
            }
        }
    }

    Ok(SweptMatrixInfo {
        g_inv: final_g_inv,
        beta_hat: final_beta_hat,
        s_rss,
    })
}

pub fn create_groups_from_design_matrix(
    design_info: &DesignMatrixInfo,
    data: &[f64]
) -> Vec<Vec<f64>> {
    let n_rows = design_info.x.nrows();
    if n_rows == 0 {
        return Vec::new();
    }

    let mut factor_col_indices: Vec<usize> = design_info.fixed_factor_indices
        .values()
        .flatten()
        .cloned()
        .chain(design_info.random_factor_indices.values().flatten().cloned())
        .collect();
    factor_col_indices.sort_unstable();
    factor_col_indices.dedup();

    let mut group_indices: Vec<Vec<usize>> = Vec::new();

    for i in 0..n_rows {
        let mut found_group = false;
        for group in group_indices.iter_mut() {
            let first_idx_in_group = group[0];
            let are_in_same_group = if factor_col_indices.is_empty() {
                design_info.x.row(i) == design_info.x.row(first_idx_in_group)
            } else {
                factor_col_indices
                    .iter()
                    .all(|&col_idx| {
                        design_info.x[(i, col_idx)] == design_info.x[(first_idx_in_group, col_idx)]
                    })
            };

            if are_in_same_group {
                group.push(i);
                found_group = true;
                break;
            }
        }

        if !found_group {
            group_indices.push(vec![i]);
        }
    }

    let mut groups: Vec<Vec<f64>> = Vec::new();
    for index_list in group_indices {
        let mut group_data: Vec<f64> = Vec::with_capacity(index_list.len());
        for &row_idx in &index_list {
            if row_idx < data.len() {
                group_data.push(data[row_idx]);
            }
        }
        if !group_data.is_empty() {
            groups.push(group_data);
        }
    }

    groups
}
