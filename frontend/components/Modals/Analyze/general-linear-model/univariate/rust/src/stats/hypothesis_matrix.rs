use std::collections::{ HashMap, HashSet };
use itertools::Itertools;
use nalgebra::{ DMatrix, DVector };
use crate::models::{ config::UnivariateConfig, data::AnalysisData, result::DesignMatrixInfo };

use super::core::*;

pub fn construct_type_i_l_matrix(
    design_info: &DesignMatrixInfo,
    term_of_interest: &str,
    all_model_terms_in_order: &[String],
    original_ztwz: &DMatrix<f64>
) -> Result<DMatrix<f64>, String> {
    if design_info.p_parameters == 0 {
        return Ok(DMatrix::zeros(0, 0));
    }

    let is_factor =
        design_info.fixed_factor_indices.contains_key(term_of_interest) ||
        design_info.random_factor_indices.contains_key(term_of_interest);

    if is_factor {
        if let Some((start, end)) = design_info.term_column_indices.get(term_of_interest) {
            let num_levels = end - start + 1;
            if num_levels < 2 {
                return Ok(DMatrix::zeros(0, design_info.p_parameters));
            }
            let num_contrasts = num_levels - 1;
            let ref_level_col_idx = *end;

            let mut l_rows = Vec::new();
            for i in 0..num_contrasts {
                let current_level_col_idx = start + i;
                let mut l_vec = DVector::from_element(design_info.p_parameters, 0.0);
                l_vec[current_level_col_idx] = 1.0;
                l_vec[ref_level_col_idx] = -1.0;
                l_rows.push(l_vec.transpose());
            }
            return Ok(DMatrix::from_rows(&l_rows));
        } else {
            return Err(
                format!("Factor term '{}' not found in term_column_indices.", term_of_interest)
            );
        }
    }

    if
        original_ztwz.nrows() < design_info.p_parameters ||
        original_ztwz.ncols() < design_info.p_parameters
    {
        return Err("Z'WZ matrix too small for p_parameters for Type I L.".to_string());
    }

    let x_t_x = original_ztwz
        .view((0, 0), (design_info.p_parameters, design_info.p_parameters))
        .clone_owned();

    let mut cols_before: Vec<usize> = Vec::new();
    let mut cols_current: Vec<usize> = Vec::new();
    let mut term_found = false;

    for term_name in all_model_terms_in_order {
        if let Some((start, end)) = design_info.term_column_indices.get(term_name) {
            let term_cols: Vec<usize> = (*start..=*end)
                .filter(|&c| c < design_info.p_parameters)
                .collect();

            if term_name == term_of_interest {
                cols_current.extend(term_cols);
                term_found = true;
                break;
            } else {
                cols_before.extend(term_cols);
            }
        }
    }

    if !term_found {
        return Err(
            format!("Term of interest '{}' not found in ordered model terms for Type I L.", term_of_interest)
        );
    }
    if cols_current.is_empty() {
        return Ok(DMatrix::zeros(0, design_info.p_parameters));
    }

    let l_swept = sweep_matrix_on_columns(x_t_x, &cols_before);

    let mut l_rows = Vec::new();
    for &current_col_idx in &cols_current {
        if current_col_idx < l_swept.nrows() {
            let mut row = l_swept.row(current_col_idx).clone_owned();
            let pivot = row[current_col_idx];

            if pivot.abs() > 1e-9 {
                row /= pivot;
            }

            for &before_col_idx in &cols_before {
                if before_col_idx < row.len() {
                    row[before_col_idx] = 0.0;
                }
            }
            l_rows.push(row);
        }
    }

    if l_rows.is_empty() {
        return Ok(DMatrix::zeros(0, design_info.p_parameters));
    }

    let l_matrix = DMatrix::from_rows(&l_rows);

    let l_orth = gram_schmidt_orthogonalization(&l_matrix);

    let mut final_rows = Vec::new();
    for row in l_orth.row_iter() {
        if row.norm_squared() > 1e-12 {
            final_rows.push(row.clone_owned());
        }
    }

    if final_rows.is_empty() {
        return Ok(DMatrix::zeros(0, design_info.p_parameters));
    }

    Ok(DMatrix::from_rows(&final_rows))
}

pub fn construct_type_ii_l_matrix(
    design_info: &DesignMatrixInfo,
    term_of_interest: &str,
    all_model_terms: &[String]
) -> Result<DMatrix<f64>, String> {
    let p_total = design_info.p_parameters;

    let mut x1_indices = Vec::new();
    let mut x2_indices = Vec::new();
    let mut x3_indices = Vec::new();

    if let Some((start, end)) = design_info.term_column_indices.get(term_of_interest) {
        x2_indices.extend(*start..=*end);
    } else {
        return Err(format!("Term of interest '{}' not found in column indices.", term_of_interest));
    }

    if term_of_interest == "Intercept" {
        for other_term in all_model_terms {
            if other_term == "Intercept" {
                continue;
            }
            if let Some((start_j, end_j)) = design_info.term_column_indices.get(other_term) {
                let term_cols = *start_j..=*end_j;
                let j_components = parse_interaction_term(other_term);
                let j_involves_covariate = j_components
                    .iter()
                    .any(|comp| design_info.covariate_indices.contains_key(comp));

                if j_involves_covariate {
                    x1_indices.extend(term_cols);
                } else {
                    x3_indices.extend(term_cols);
                }
            }
        }
    } else {
        let f_components: HashSet<_> = parse_interaction_term(term_of_interest)
            .into_iter()
            .collect();

        let f_is_purely_factor = f_components
            .iter()
            .all(|comp| !design_info.covariate_indices.contains_key(comp));

        for other_term in all_model_terms {
            if other_term == term_of_interest {
                continue;
            }

            if let Some((start_j, end_j)) = design_info.term_column_indices.get(other_term) {
                let term_cols = *start_j..=*end_j;
                let j_components: HashSet<_> = parse_interaction_term(other_term)
                    .into_iter()
                    .collect();

                let j_contains_f =
                    f_components.is_subset(&j_components) && f_components != j_components;

                if j_contains_f {
                    let j_involves_covariate = j_components
                        .iter()
                        .any(|comp| design_info.covariate_indices.contains_key(comp));

                    if f_is_purely_factor && j_involves_covariate {
                        x1_indices.extend(term_cols.clone());
                    } else {
                        x3_indices.extend(term_cols.clone());
                    }
                } else {
                    x1_indices.extend(term_cols.clone());
                }
            }
        }
    }

    x1_indices.sort_unstable();
    x1_indices.dedup();
    x3_indices.sort_unstable();
    x3_indices.dedup();

    if x2_indices.is_empty() {
        return Ok(DMatrix::zeros(0, p_total));
    }

    let x_full = &design_info.x;
    let n_samples = design_info.n_samples;

    let w_sqrt_matrix = DMatrix::identity(n_samples, n_samples);
    let w_matrix = DMatrix::identity(n_samples, n_samples);

    let x1 = if !x1_indices.is_empty() {
        x_full.select_columns(&x1_indices)
    } else {
        DMatrix::zeros(n_samples, 0)
    };
    let x2 = x_full.select_columns(&x2_indices);
    let x3 = if !x3_indices.is_empty() {
        x_full.select_columns(&x3_indices)
    } else {
        DMatrix::zeros(n_samples, 0)
    };

    let m1_matrix = if x1.ncols() > 0 {
        let x1_t_w_x1 = x1.transpose() * &w_matrix * &x1;
        let x1_t_w_x1_pinv = x1_t_w_x1.pseudo_inverse(1e-10).map_err(|e| e.to_string())?;
        let p1 = &x1 * x1_t_w_x1_pinv * x1.transpose() * &w_matrix;
        DMatrix::identity(n_samples, n_samples) - p1
    } else {
        DMatrix::identity(n_samples, n_samples)
    };

    let m_adj = &w_sqrt_matrix * &m1_matrix * &w_sqrt_matrix;
    let c_inv_term = x2.transpose() * &m_adj * &x2;
    let df_f = c_inv_term.rank(1e-8);
    if df_f == 0 {
        return Ok(DMatrix::zeros(0, p_total));
    }

    let c_matrix = c_inv_term.pseudo_inverse(1e-10).map_err(|e| e.to_string())?;
    let l_part_x2 = &c_matrix * x2.transpose() * &m_adj;

    let l_coeffs_for_x2_params = &l_part_x2 * &x2;
    let l_coeffs_for_x3_params = if x3.ncols() > 0 {
        &l_part_x2 * &x3
    } else {
        DMatrix::zeros(l_coeffs_for_x2_params.nrows(), 0)
    };

    let mut l_final = DMatrix::zeros(l_coeffs_for_x2_params.nrows(), p_total);
    for r in 0..l_final.nrows() {
        for (block_col, &original_col) in x2_indices.iter().enumerate() {
            l_final[(r, original_col)] = l_coeffs_for_x2_params[(r, block_col)];
        }
        for (block_col, &original_col) in x3_indices.iter().enumerate() {
            l_final[(r, original_col)] = l_coeffs_for_x3_params[(r, block_col)];
        }
    }

    let l_orth = gram_schmidt_orthogonalization(&l_final);
    let mut final_rows = Vec::new();
    for row in l_orth.row_iter() {
        if row.norm_squared() > 1e-12 {
            final_rows.push(row.clone_owned());
        }
    }

    if final_rows.is_empty() {
        return Ok(DMatrix::zeros(0, p_total));
    }

    let mut final_matrix = DMatrix::from_rows(&final_rows);

    let tolerance = 1e-9;
    for x in final_matrix.iter_mut() {
        if (*x - x.round()).abs() < tolerance {
            *x = x.round();
        }
        if x.abs() < tolerance {
            *x = 0.0;
        }
    }

    Ok(final_matrix)
}

pub fn construct_type_iii_l_matrix(
    design_info: &DesignMatrixInfo,
    term_of_interest: &str,
    _all_model_terms: &[String],
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<DMatrix<f64>, String> {
    let all_model_param_names = generate_all_row_parameter_names_sorted(design_info, data)?;
    if all_model_param_names.len() != design_info.p_parameters {
        return Err(
            format!(
                "Mismatch between generated param names ({}) and p_parameters ({}). Param names: {:?}",
                all_model_param_names.len(),
                design_info.p_parameters,
                all_model_param_names
            )
        );
    }

    let mut factor_levels_map: HashMap<String, Vec<String>> = HashMap::new();
    let mut unique_true_factor_names_in_model = HashSet::new();

    for term_in_design in &design_info.term_names {
        if term_in_design == "Intercept" {
            continue;
        }
        let components = parse_interaction_term(term_in_design);
        for potential_factor_name in components {
            let is_covariate = config.main.covar
                .as_ref()
                .map_or(false, |c_list| c_list.contains(&potential_factor_name));
            let is_fix_factor = config.main.fix_factor
                .as_ref()
                .map_or(false, |f_list| f_list.contains(&potential_factor_name));
            let is_rand_factor = config.main.rand_factor
                .as_ref()
                .map_or(false, |r_list| r_list.contains(&potential_factor_name));

            if !is_covariate && (is_fix_factor || is_rand_factor) {
                unique_true_factor_names_in_model.insert(potential_factor_name.clone());
            }
        }
    }

    for factor_name_str in &unique_true_factor_names_in_model {
        match get_factor_levels(data, factor_name_str) {
            Ok(levels) => {
                if levels.is_empty() {
                    return Err(
                        format!("Factor '{}' (identified as a true factor from config) has no levels defined in the data.", factor_name_str)
                    );
                }
                factor_levels_map.insert(factor_name_str.clone(), levels);
            }
            Err(e) => {
                return Err(
                    format!(
                        "Error getting levels for presumed factor '{}': {}.",
                        factor_name_str,
                        e
                    )
                );
            }
        }
    }

    let mut l_rows: Vec<DVector<f64>> = Vec::new();
    let p = design_info.p_parameters;

    let is_covariate_term =
        config.main.covar
            .as_ref()
            .map_or(false, |covars| covars.iter().any(|c| c == term_of_interest)) &&
        !term_of_interest.contains('*') &&
        term_of_interest != "Intercept";

    if term_of_interest == "Intercept" {
        let mut l_vec = DVector::from_element(p, 0.0);
        for (j, param_name) in all_model_param_names.iter().enumerate() {
            if param_name == "Intercept" {
                l_vec[j] = 1.0;
            } else {
                let param_components = parse_parameter_name(param_name);
                let mut coeff_prod = 1.0;
                let mut is_pure_factor_based_param = !param_components.is_empty();

                for (factor_in_param, _level_in_param) in &param_components {
                    if let Some(levels) = factor_levels_map.get(factor_in_param) {
                        coeff_prod *= 1.0 / (levels.len() as f64);
                    } else {
                        is_pure_factor_based_param = false;
                        break;
                    }
                }

                if is_pure_factor_based_param {
                    l_vec[j] = coeff_prod;
                } else {
                    l_vec[j] = 0.0;
                }
            }
        }
        l_rows.push(l_vec);
    } else if is_covariate_term {
        if let Some(param_idx) = all_model_param_names.iter().position(|pn| pn == term_of_interest) {
            let mut l_vec = DVector::from_element(p, 0.0);
            l_vec[param_idx] = 1.0;
            l_rows.push(l_vec);
        } else {
            return Err(
                format!(
                    "Hypothesis matrix (Type III): Covariate term '{}' from config was not found in the generated parameter names ({:?}). L-matrix for this term will be empty.",
                    term_of_interest,
                    all_model_param_names
                )
            );
        }
    } else if !term_of_interest.contains('*') && factor_levels_map.contains_key(term_of_interest) {
        let f_levels = factor_levels_map.get(term_of_interest).unwrap();
        let num_f_levels = f_levels.len();
        if num_f_levels >= 2 {
            let ref_level_f = f_levels.last().unwrap().clone();
            for i in 0..num_f_levels - 1 {
                let current_level_f = f_levels[i].clone();
                let mut l_vec = DVector::from_element(p, 0.0);

                for (j, param_name) in all_model_param_names.iter().enumerate() {
                    let param_components = parse_parameter_name(param_name);
                    if let Some(level_in_param_for_f) = param_components.get(term_of_interest) {
                        let f_contrast_coeff: f64 = if level_in_param_for_f == &current_level_f {
                            1.0
                        } else if level_in_param_for_f == &ref_level_f {
                            -1.0
                        } else {
                            0.0
                        };

                        if f_contrast_coeff.abs() > 1e-9 {
                            let mut avg_coeff_for_other_factors = 1.0;
                            let mut is_param_structure_valid_for_avg = true;

                            for (factor_in_param, _level_in_param) in &param_components {
                                if factor_in_param != term_of_interest {
                                    if
                                        let Some(other_factor_levels) =
                                            factor_levels_map.get(factor_in_param)
                                    {
                                        avg_coeff_for_other_factors *=
                                            1.0 / (other_factor_levels.len() as f64);
                                    } else {
                                        is_param_structure_valid_for_avg = false;
                                        break;
                                    }
                                }
                            }

                            if is_param_structure_valid_for_avg {
                                l_vec[j] = f_contrast_coeff * avg_coeff_for_other_factors;
                            }
                        }
                    }
                }
                l_rows.push(l_vec);
            }
        }
    } else if term_of_interest.contains('*') {
        let interaction_factors_names = parse_interaction_term(term_of_interest);
        let mut factor_contrast_plans = Vec::new();
        let mut interaction_possible_and_valid = true;

        for f_name in &interaction_factors_names {
            if let Some(levels) = factor_levels_map.get(f_name) {
                if levels.len() < 2 {
                    interaction_possible_and_valid = false;
                    break;
                }
                let ref_level = levels.last().unwrap().clone();
                let mut contrasts_for_this_factor = Vec::new();
                for i in 0..levels.len() - 1 {
                    contrasts_for_this_factor.push((levels[i].clone(), ref_level.clone()));
                }
                factor_contrast_plans.push(contrasts_for_this_factor);
            } else {
                interaction_possible_and_valid = false;
                break;
            }
        }

        if interaction_possible_and_valid && !factor_contrast_plans.is_empty() {
            for specific_contrast_combination in factor_contrast_plans
                .iter()
                .map(|plan| plan.iter())
                .multi_cartesian_product() {
                let mut l_vec = DVector::from_element(p, 0.0);
                for (j_param_idx, param_name) in all_model_param_names.iter().enumerate() {
                    let param_components = parse_parameter_name(param_name);
                    let mut final_param_coeff_for_this_l: f64 = 1.0;
                    let mut param_relevant_to_this_l = true;

                    for (k_int_factor, int_factor_name) in interaction_factors_names
                        .iter()
                        .enumerate() {
                        if
                            let Some(level_of_int_factor_in_param) =
                                param_components.get(int_factor_name)
                        {
                            let (non_ref_level_for_contrast, ref_level_for_contrast) =
                                specific_contrast_combination[k_int_factor];

                            if level_of_int_factor_in_param == non_ref_level_for_contrast {
                                final_param_coeff_for_this_l *= 1.0;
                            } else if level_of_int_factor_in_param == ref_level_for_contrast {
                                final_param_coeff_for_this_l *= -1.0;
                            } else {
                                final_param_coeff_for_this_l = 0.0;
                                break;
                            }
                        } else {
                            param_relevant_to_this_l = false;
                            break;
                        }
                    }

                    if !param_relevant_to_this_l || final_param_coeff_for_this_l.abs() < 1e-9 {
                        l_vec[j_param_idx] = 0.0;
                        continue;
                    }

                    for (factor_in_param_name, _level_in_param) in param_components.iter() {
                        if !interaction_factors_names.contains(factor_in_param_name) {
                            if
                                let Some(other_factor_levels) =
                                    factor_levels_map.get(factor_in_param_name)
                            {
                                final_param_coeff_for_this_l *=
                                    1.0 / (other_factor_levels.len() as f64);
                            } else {
                                final_param_coeff_for_this_l = 0.0;
                                break;
                            }
                        }
                    }
                    l_vec[j_param_idx] = final_param_coeff_for_this_l;
                }
                l_rows.push(l_vec);
            }
        }
    }

    if l_rows.is_empty() {
        Ok(DMatrix::zeros(0, p))
    } else {
        let row_d_vectors: Vec<nalgebra::RowDVector<f64>> = l_rows
            .into_iter()
            .map(|dv_col| dv_col.transpose())
            .collect();
        Ok(DMatrix::from_rows(&row_d_vectors))
    }
}

pub fn construct_type_iv_l_matrix(
    design_info: &DesignMatrixInfo,
    term_of_interest: &str,
    all_model_terms: &[String],
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<DMatrix<f64>, String> {
    let mut l_matrix_type_iv = construct_type_iii_l_matrix(
        design_info,
        term_of_interest,
        all_model_terms,
        data,
        config
    )?;

    if l_matrix_type_iv.nrows() == 0 || design_info.p_parameters == 0 {
        return Ok(l_matrix_type_iv);
    }

    let all_model_param_names = generate_all_row_parameter_names_sorted(design_info, data)?;
    if all_model_param_names.len() != design_info.p_parameters {
        return Err(
            "Parameter name and design matrix column count mismatch for Type IV.".to_string()
        );
    }

    let factors_in_f_set: HashSet<String> = parse_interaction_term(term_of_interest)
        .into_iter()
        .collect();

    let mut effects_containing_f: Vec<String> = Vec::new();
    for model_term_name in all_model_terms {
        if model_term_name == term_of_interest {
            continue;
        }
        let factors_in_model_term_set: HashSet<String> = parse_interaction_term(model_term_name)
            .into_iter()
            .collect();
        if factors_in_f_set.is_subset(&factors_in_model_term_set) {
            effects_containing_f.push(model_term_name.clone());
        }
    }

    if effects_containing_f.is_empty() {
        return Ok(l_matrix_type_iv);
    }

    for row_idx in 0..l_matrix_type_iv.nrows() {
        for col_idx in 0..l_matrix_type_iv.ncols() {
            let l_coeff = l_matrix_type_iv[(row_idx, col_idx)];
            if l_coeff.abs() < 1e-10 {
                continue;
            }

            let param_name = &all_model_param_names[col_idx];
            let param_components = parse_parameter_name(param_name);

            let belongs_to_containing_effect = effects_containing_f.iter().any(|eff_name| {
                let eff_factors = parse_interaction_term(eff_name);
                eff_factors.iter().all(|f| param_components.contains_key(f))
            });

            if !belongs_to_containing_effect {
                continue;
            }

            let f_factors: Vec<_> = parse_interaction_term(term_of_interest);

            let mut f_levels_in_param = HashMap::new();
            for f_factor in &f_factors {
                if let Some(level) = param_components.get(f_factor) {
                    f_levels_in_param.insert(f_factor.clone(), level.clone());
                } else {
                    return Err(
                        format!(
                            "Logic error: Factor '{}' expected but not found in param '{}'.",
                            f_factor,
                            param_name
                        )
                    );
                }
            }

            let mut relevant_combos = 0;
            let all_non_empty_cells = get_all_non_empty_cells(data, config)?;

            'cell_loop: for cell_combo in &all_non_empty_cells {
                for (f_factor_name, f_level) in &f_levels_in_param {
                    if cell_combo.get(f_factor_name) != Some(f_level) {
                        continue 'cell_loop;
                    }
                }
                for (other_factor, other_level) in &param_components {
                    if !f_factors.contains(other_factor) {
                        if cell_combo.get(other_factor) != Some(other_level) {
                            continue 'cell_loop;
                        }
                    }
                }
                relevant_combos += 1;
            }

            if relevant_combos > 0 {
            } else {
                l_matrix_type_iv[(row_idx, col_idx)] = 0.0;
            }
        }
    }

    let rank = l_matrix_type_iv.rank(1e-8);
    if rank == 0 {
        return Ok(DMatrix::zeros(0, design_info.p_parameters));
    }

    if rank < l_matrix_type_iv.nrows() {
        let svd = l_matrix_type_iv.clone().svd(true, false);
        if let Some(u) = svd.u {
            let basis = u.transpose() * &l_matrix_type_iv;
            return Ok(basis.rows(0, rank).clone_owned());
        } else {
            return Err("SVD failed during Type IV L-matrix final basis extraction.".to_string());
        }
    }

    Ok(l_matrix_type_iv)
}

pub fn sweep_matrix_on_columns(mut matrix: DMatrix<f64>, cols_to_sweep: &[usize]) -> DMatrix<f64> {
    let n = matrix.nrows();
    for &k in cols_to_sweep {
        if k >= n {
            continue;
        }
        let pivot = matrix[(k, k)];
        if pivot.abs() < 1e-12 {
            continue;
        }

        for i in 0..n {
            for j in 0..n {
                if i != k && j != k {
                    matrix[(i, j)] -= (matrix[(i, k)] * matrix[(k, j)]) / pivot;
                }
            }
        }

        for j in 0..n {
            if j != k {
                matrix[(k, j)] /= pivot;
            }
        }

        for i in 0..n {
            if i != k {
                matrix[(i, k)] /= pivot;
            }
        }

        matrix[(k, k)] = -1.0 / pivot;
    }
    matrix
}

fn gram_schmidt_orthogonalization(matrix: &DMatrix<f64>) -> DMatrix<f64> {
    if matrix.nrows() == 0 {
        return matrix.clone_owned();
    }

    let mut basis_vectors: Vec<nalgebra::DVector<f64>> = Vec::new();

    for row_vec in matrix.row_iter() {
        let mut v = row_vec.transpose();

        for u in &basis_vectors {
            let u_dot_u = u.dot(u);
            if u_dot_u.abs() > 1e-12 {
                let v_dot_u = v.dot(u);
                let proj = u * (v_dot_u / u_dot_u);
                v -= &proj;
            }
        }

        if v.norm_squared() > 1e-12 {
            basis_vectors.push(v);
        }
    }

    if basis_vectors.is_empty() {
        return DMatrix::zeros(0, matrix.ncols());
    }

    let row_d_vectors: Vec<nalgebra::RowDVector<f64>> = basis_vectors
        .iter()
        .map(|dv_col| dv_col.transpose())
        .collect();

    DMatrix::from_rows(&row_d_vectors)
}
