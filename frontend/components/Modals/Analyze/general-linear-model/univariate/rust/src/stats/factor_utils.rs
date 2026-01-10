use std::collections::{ HashMap, HashSet };

use crate::models::{ config::UnivariateConfig, data::AnalysisData, result::DesignMatrixInfo };
use super::core::*;

pub fn parse_interaction_term(term: &str) -> Vec<String> {
    if term.is_empty() {
        return Vec::new();
    }
    term.split('*')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect()
}

pub fn parse_parameter_name(param_str: &str) -> HashMap<String, String> {
    let mut factors = HashMap::new();
    if param_str == "Intercept" {
        factors.insert("Intercept".to_string(), "Intercept".to_string());
        return factors;
    }

    for part in param_str.split('*') {
        let clean_part = part.trim_matches(|c| (c == '[' || c == ']'));
        if let Some((factor, level)) = clean_part.split_once('=') {
            factors.insert(factor.to_string(), level.to_string());
        }
    }
    factors
}

pub fn get_factor_levels(data: &AnalysisData, factor_name: &str) -> Result<Vec<String>, String> {
    let mut level_set = HashSet::new();

    if
        let Some((group_idx, _)) = data.fix_factor_data_defs
            .iter()
            .enumerate()
            .find(|(_, def_group)| def_group.iter().any(|def| def.name == factor_name))
    {
        if let Some(data_records_for_group) = data.fix_factor_data.get(group_idx) {
            for record in data_records_for_group {
                if let Some(value) = record.values.get(factor_name) {
                    level_set.insert(data_value_to_string(value));
                }
            }
        }
        let mut levels: Vec<String> = level_set.into_iter().collect();
        levels.sort();
        return Ok(levels);
    }

    if let Some(random_defs_groups) = &data.random_factor_data_defs {
        if
            let Some((group_idx, _)) = random_defs_groups
                .iter()
                .enumerate()
                .find(|(_, def_group)| def_group.iter().any(|def| def.name == factor_name))
        {
            if let Some(random_data_groups_vec) = &data.random_factor_data {
                if let Some(data_records_for_group) = random_data_groups_vec.get(group_idx) {
                    for record in data_records_for_group {
                        if let Some(value) = record.values.get(factor_name) {
                            level_set.insert(data_value_to_string(value));
                        }
                    }
                }
            }
            let mut levels: Vec<String> = level_set.into_iter().collect();
            levels.sort();
            return Ok(levels);
        }
    }

    if let Some(covar_defs_groups) = &data.covariate_data_defs {
        for def_group in covar_defs_groups {
            if def_group.iter().any(|def| def.name == factor_name) {
                return Ok(Vec::new());
            }
        }
    }

    Err(
        format!("Term '{}' not found as a factor or covariate in the data definitions", factor_name)
    )
}

pub fn matches_combination(combo: &HashMap<String, String>, data: &AnalysisData) -> Vec<f64> {
    let n_samples = data.dependent_data[0].len();
    let mut row = vec![0.0; n_samples];

    let mut factor_locations = HashMap::new();
    for (factor, _) in combo {
        for (group_idx, def_group) in data.fix_factor_data_defs.iter().enumerate() {
            if def_group.iter().any(|def| &def.name == factor) {
                factor_locations.insert(factor.clone(), (true, group_idx));
                break;
            }
        }

        if !factor_locations.contains_key(factor) {
            if let Some(random_defs_groups) = &data.random_factor_data_defs {
                for (group_idx, def_group) in random_defs_groups.iter().enumerate() {
                    if def_group.iter().any(|def| &def.name == factor) {
                        factor_locations.insert(factor.clone(), (false, group_idx));
                        break;
                    }
                }
            }
        }
    }

    for i in 0..n_samples {
        let mut matches = true;

        for (factor, expected_level) in combo {
            if let Some(&(is_fixed, group_idx)) = factor_locations.get(factor) {
                let data_records = if is_fixed {
                    data.fix_factor_data.get(group_idx)
                } else {
                    data.random_factor_data.as_ref().and_then(|d| d.get(group_idx))
                };

                if let Some(record) = data_records.and_then(|records| records.get(i)) {
                    if let Some(value) = record.values.get(factor) {
                        if data_value_to_string(value) != *expected_level {
                            matches = false;
                            break;
                        }
                    } else {
                        matches = false;
                        break;
                    }
                } else {
                    matches = false;
                    break;
                }
            } else {
                matches = false;
                break;
            }
        }

        if matches {
            row[i] = 1.0;
        }
    }
    row
}

pub fn generate_lower_order_terms(
    factors: &[String],
    size: usize,
    current: &mut Vec<String>,
    start: usize,
    result: &mut Vec<String>
) {
    if current.len() == size {
        result.push(current.join("*"));
        return;
    }

    for i in start..factors.len() {
        current.push(factors[i].clone());
        generate_lower_order_terms(factors, size, current, i + 1, result);
        current.pop();
    }
}

pub fn generate_interaction_terms(factors: &[String]) -> Vec<String> {
    if factors.is_empty() {
        return Vec::new();
    }

    let total_combinations: usize = (2..=factors.len())
        .map(|size| {
            let mut result = 1;
            for i in 0..size {
                result = (result * (factors.len() - i)) / (i + 1);
            }
            result
        })
        .sum();

    let mut interactions = Vec::with_capacity(total_combinations);

    for size in 2..=factors.len() {
        generate_lower_order_terms(factors, size, &mut Vec::new(), 0, &mut interactions);
    }
    interactions
}

pub fn generate_level_combinations(
    factor_levels: &[(String, Vec<String>)],
    current_combo: &mut HashMap<String, String>,
    index: usize,
    result: &mut Vec<HashMap<String, String>>
) {
    if index == factor_levels.len() {
        result.push(current_combo.clone());
        return;
    }

    let (factor, levels) = &factor_levels[index];
    for level in levels {
        current_combo.insert(factor.clone(), level.clone());
        generate_level_combinations(factor_levels, current_combo, index + 1, result);
    }
}

pub fn generate_non_cust_terms(config: &UnivariateConfig) -> Result<Vec<String>, String> {
    let mut terms = Vec::new();
    let mut factors_for_interaction = Vec::new();
    let mut added_terms = HashSet::new();

    if let Some(covariates) = &config.main.covar {
        for covar_name in covariates {
            if added_terms.insert(covar_name.clone()) {
                terms.push(covar_name.clone());
            }
        }
    }

    if let Some(fix_factors) = &config.main.fix_factor {
        for factor_name in fix_factors {
            if added_terms.insert(factor_name.clone()) {
                terms.push(factor_name.clone());
            }
            factors_for_interaction.push(factor_name.clone());
        }
    }

    if let Some(random_factors) = &config.main.rand_factor {
        for factor_name in random_factors {
            if added_terms.insert(factor_name.clone()) {
                terms.push(factor_name.clone());
            }
            factors_for_interaction.push(factor_name.clone());
        }
    }

    if factors_for_interaction.len() > 1 {
        terms.extend(generate_interaction_terms(&factors_for_interaction));
    }
    Ok(terms)
}

pub fn generate_custom_terms(config: &UnivariateConfig) -> Result<Vec<String>, String> {
    let mut terms = Vec::new();
    let mut added_terms = HashSet::new();

    if let Some(cov_model_str) = &config.model.cov_model {
        for term_name in cov_model_str.split_whitespace() {
            if added_terms.insert(term_name.to_string()) {
                terms.push(term_name.to_string());
            }
        }
    }

    if let Some(factors_model) = &config.model.factors_model {
        for factor_name in factors_model {
            if added_terms.insert(factor_name.clone()) {
                terms.push(factor_name.clone());
            }
        }
    }
    Ok(terms)
}

pub fn generate_design_string(design_info: &DesignMatrixInfo) -> String {
    let has_intercept = design_info.term_names.contains(&"Intercept".to_string());
    let other_terms: Vec<_> = design_info.term_names
        .iter()
        .filter(|&term| term != "Intercept")
        .collect();

    let estimated_capacity = other_terms
        .iter()
        .map(|term| term.len())
        .sum::<usize>();

    let mut design_string = String::with_capacity(estimated_capacity);

    if has_intercept {
        design_string.push_str("Design: Intercept");
    } else {
        design_string.push_str("Design: ");
    }

    for term in other_terms {
        design_string.push_str(" + ");
        design_string.push_str(term);
    }
    design_string
}

pub fn generate_l_labels(design_info: &DesignMatrixInfo) -> Vec<String> {
    let mut l_labels = Vec::with_capacity(design_info.p_parameters);
    let mut l_counter = 1;

    for term_name in &design_info.term_names {
        if let Some((start_idx, end_idx)) = design_info.term_column_indices.get(term_name) {
            let num_cols = end_idx - start_idx + 1;
            for _ in 0..num_cols {
                l_labels.push(format!("L{}", l_counter));
                l_counter += 1;
            }
        }
    }
    l_labels
}

pub fn generate_all_row_parameter_names_sorted(
    design_info: &DesignMatrixInfo,
    data: &AnalysisData
) -> Result<Vec<String>, String> {
    let mut all_params = Vec::with_capacity(design_info.p_parameters);
    let mut factor_levels_cache: HashMap<String, Vec<String>> = HashMap::new();

    let mut covariate_names = HashSet::new();
    if let Some(covar_defs_groups) = &data.covariate_data_defs {
        for def_group in covar_defs_groups {
            for def in def_group {
                covariate_names.insert(def.name.clone());
            }
        }
    }

    let unique_factors: HashSet<String> = design_info.term_names
        .iter()
        .filter(|&term| term != "Intercept")
        .flat_map(|term| parse_interaction_term(term))
        .filter(|factor_name| !covariate_names.contains(factor_name))
        .collect();

    for factor_name in unique_factors {
        match get_factor_levels(data, &factor_name) {
            Ok(levels) => {
                factor_levels_cache.insert(factor_name, levels);
            }
            Err(e) => {
                return Err(format!("Error getting levels for factor '{}': {}", factor_name, e));
            }
        }
    }

    for term_name in &design_info.term_names {
        if term_name == "Intercept" {
            all_params.push("Intercept".to_string());
            continue;
        }

        if covariate_names.contains(term_name) {
            all_params.push(term_name.clone());
            continue;
        }

        if let Some((start_idx, end_idx)) = design_info.term_column_indices.get(term_name) {
            let num_cols = end_idx - start_idx + 1;

            if term_name.contains('*') {
                let factors_in_term = parse_interaction_term(term_name);

                let has_covariate = factors_in_term.iter().any(|f| covariate_names.contains(f));

                if has_covariate {
                    for _ in 0..num_cols {
                        all_params.push(term_name.clone());
                    }
                } else {
                    let level_sets: Result<Vec<_>, String> = factors_in_term
                        .iter()
                        .map(|factor_name| {
                            factor_levels_cache
                                .get(factor_name)
                                .ok_or_else(||
                                    format!(
                                        "Levels not found for factor '{}' in interaction '{}'.",
                                        factor_name,
                                        term_name
                                    )
                                )
                                .and_then(|levels| {
                                    if levels.is_empty() {
                                        Err(
                                            format!(
                                                "Factor '{}' in interaction '{}' has no defined levels (might be a covariate).",
                                                factor_name,
                                                term_name
                                            )
                                        )
                                    } else {
                                        Ok((factor_name, levels))
                                    }
                                })
                        })
                        .collect();

                    let level_sets = level_sets?;

                    let mut combination_indices = vec![0; level_sets.len()];

                    for _ in 0..num_cols {
                        let param_parts: Vec<String> = level_sets
                            .iter()
                            .enumerate()
                            .map(|(idx, (factor_name, levels))| {
                                format!("[{}={}]", factor_name, levels[combination_indices[idx]])
                            })
                            .collect();
                        all_params.push(param_parts.join("*"));

                        let mut carry_pos = level_sets.len();
                        loop {
                            if carry_pos == 0 {
                                break;
                            }
                            carry_pos -= 1;
                            combination_indices[carry_pos] += 1;
                            if combination_indices[carry_pos] < level_sets[carry_pos].1.len() {
                                break;
                            }
                            combination_indices[carry_pos] = 0;
                        }
                    }
                }
            } else {
                if let Some(levels) = factor_levels_cache.get(term_name) {
                    if levels.is_empty() {
                        all_params.push(term_name.clone());
                    } else {
                        for level in levels {
                            all_params.push(format!("[{}={}]", term_name, level));
                        }
                    }
                } else {
                    all_params.push(term_name.clone());
                }
            }
        }
    }
    Ok(all_params)
}

pub fn get_all_non_empty_cells(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<Vec<HashMap<String, String>>, String> {
    let mut all_factor_names = HashSet::new();
    if let Some(fix_factors) = &config.main.fix_factor {
        all_factor_names.extend(fix_factors.iter().cloned());
    }
    if let Some(rand_factors) = &config.main.rand_factor {
        all_factor_names.extend(rand_factors.iter().cloned());
    }

    if all_factor_names.is_empty() {
        return Ok(Vec::new());
    }

    let n_samples = data.dependent_data.get(0).map_or(0, |d| d.len());
    if n_samples == 0 {
        return Ok(Vec::new());
    }

    let mut factor_locations = HashMap::with_capacity(all_factor_names.len());
    for factor_name in &all_factor_names {
        if
            let Some((group_idx, _)) = data.fix_factor_data_defs
                .iter()
                .enumerate()
                .find(|(_, def_group)| def_group.iter().any(|def| &def.name == factor_name))
        {
            factor_locations.insert(factor_name.clone(), (true, group_idx));
            continue;
        }

        if let Some(rand_defs) = &data.random_factor_data_defs {
            if
                let Some((group_idx, _)) = rand_defs
                    .iter()
                    .enumerate()
                    .find(|(_, def_group)| def_group.iter().any(|def| &def.name == factor_name))
            {
                factor_locations.insert(factor_name.clone(), (false, group_idx));
                continue;
            }
        }

        return Err(format!("Definition for factor '{}' not found.", factor_name));
    }

    let mut seen_representations = HashSet::new();
    let mut unique_cells = Vec::new();

    for i in 0..n_samples {
        let mut current_cell = HashMap::with_capacity(all_factor_names.len());
        let mut cell_complete = true;

        for factor_name in &all_factor_names {
            if let Some(&(is_fixed, group_idx)) = factor_locations.get(factor_name) {
                let data_records = if is_fixed {
                    data.fix_factor_data.get(group_idx)
                } else {
                    data.random_factor_data.as_ref().and_then(|d| d.get(group_idx))
                };

                if let Some(record) = data_records.and_then(|g| g.get(i)) {
                    if let Some(value) = record.values.get(factor_name) {
                        current_cell.insert(factor_name.clone(), data_value_to_string(value));
                    } else {
                        return Err(
                            format!(
                                "Data inconsistency: Value for factor '{}' not found at row {}.",
                                factor_name,
                                i
                            )
                        );
                    }
                } else {
                    cell_complete = false;
                    break;
                }
            }
        }

        if cell_complete && !current_cell.is_empty() {
            let mut pairs: Vec<_> = current_cell.iter().collect();
            pairs.sort_unstable_by_key(|(k, _)| *k);
            let representation = pairs
                .into_iter()
                .map(|(k, v)| format!("{}={}", k, v))
                .collect::<Vec<_>>()
                .join(";");

            if seen_representations.insert(representation) {
                unique_cells.push(current_cell);
            }
        }
    }

    Ok(unique_cells)
}
