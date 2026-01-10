use std::collections::HashMap;

use crate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{ DescriptiveStatistics, DescriptiveStatGroup, StatsEntry },
};

use super::core::*;

pub fn calculate_descriptive_statistics(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<HashMap<String, DescriptiveStatistics>, String> {
    let dep_var_name = config.main.dep_var.as_ref().unwrap();

    let mut all_factors = Vec::new();
    if let Some(fix_factors) = &config.main.fix_factor {
        all_factors.extend(fix_factors.clone());
    }
    if let Some(rand_factors) = &config.main.rand_factor {
        all_factors.extend(rand_factors.clone());
    }

    let n_obs = data.dependent_data.get(0).map_or(0, |d| d.len());

    let mut factor_locations: HashMap<String, (bool, usize)> = HashMap::new();
    for factor_name in &all_factors {
        let mut found = false;

        for (group_idx, def_group) in data.fix_factor_data_defs.iter().enumerate() {
            if def_group.iter().any(|def| &def.name == factor_name) {
                factor_locations.insert(factor_name.clone(), (true, group_idx));
                found = true;
                break;
            }
        }

        if found {
            continue;
        }

        if let Some(rand_defs) = &data.random_factor_data_defs {
            for (group_idx, def_group) in rand_defs.iter().enumerate() {
                if def_group.iter().any(|def| &def.name == factor_name) {
                    factor_locations.insert(factor_name.clone(), (false, group_idx));
                    found = true;
                    break;
                }
            }
        }

        if !found {
            return Err(format!("Definition for factor '{}' not found.", factor_name));
        }
    }

    let mut combo_values: HashMap<String, Vec<(f64, f64)>> = HashMap::new();

    for i in 0..n_obs {
        if
            let Some(dep_val) = data.dependent_data[0]
                .get(i)
                .and_then(|r| r.values.get(dep_var_name))
                .and_then(|val| data_value_to_string(val).parse::<f64>().ok())
        {
            let weight = 1.0;

            let mut observation_levels = HashMap::new();
            let mut skip_obs = false;

            for factor_name in &all_factors {
                if let Some(&(is_fixed, group_idx)) = factor_locations.get(factor_name) {
                    let data_source = if is_fixed {
                        data.fix_factor_data.get(group_idx)
                    } else {
                        data.random_factor_data.as_ref().and_then(|d| d.get(group_idx))
                    };

                    if
                        let Some(value) = data_source
                            .and_then(|g| g.get(i))
                            .and_then(|r| r.values.get(factor_name))
                    {
                        observation_levels.insert(factor_name.clone(), data_value_to_string(value));
                    } else {
                        skip_obs = true;
                        break;
                    }
                }
            }

            if skip_obs {
                continue;
            }

            let mut super_combos: Vec<HashMap<String, String>> = vec![HashMap::new()];
            for factor_name in &all_factors {
                let level = observation_levels.get(factor_name).unwrap();
                let mut next_combos = Vec::with_capacity(super_combos.len() * 2);
                for combo in super_combos {
                    let mut combo_with_level = combo.clone();
                    combo_with_level.insert(factor_name.clone(), level.clone());
                    next_combos.push(combo_with_level);

                    let mut combo_with_total = combo;
                    combo_with_total.insert(factor_name.clone(), "Total".to_string());
                    next_combos.push(combo_with_total);
                }
                super_combos = next_combos;
            }

            for combo in super_combos {
                let combo_key = all_factors
                    .iter()
                    .map(|f| format!("{}={}", f, combo.get(f).unwrap()))
                    .collect::<Vec<_>>()
                    .join(";");
                combo_values.entry(combo_key).or_default().push((dep_val, weight));
            }
        }
    }

    let stats_entries: HashMap<String, StatsEntry> = combo_values
        .into_iter()
        .map(|(key, values)| (key, calculate_stats_for_values(&values)))
        .collect();

    let mut factor_levels_map = HashMap::new();
    for factor in &all_factors {
        let mut levels = get_factor_levels(data, factor)?;
        levels.sort();
        factor_levels_map.insert(factor.clone(), levels);
    }

    let groups = build_groups_recursive(
        &all_factors,
        &factor_levels_map,
        &stats_entries,
        0,
        &mut vec![]
    );

    Ok(
        HashMap::from([
            (
                dep_var_name.clone(),
                DescriptiveStatistics {
                    dependent_variable: dep_var_name.clone(),
                    groups,
                    factor_names: all_factors,
                    note: None,
                    interpretation: Some(
                        "This table displays the mean, standard deviation, and count (N) for the dependent variable, broken down by each level of the specified factors and their combinations.".to_string()
                    ),
                },
            ),
        ])
    )
}

fn build_groups_recursive(
    factor_names: &[String],
    factor_levels_map: &HashMap<String, Vec<String>>,
    stats_entries: &HashMap<String, StatsEntry>,
    level: usize,
    current_path: &mut Vec<(String, String)>
) -> Vec<DescriptiveStatGroup> {
    if level >= factor_names.len() {
        return vec![];
    }

    let factor_name = &factor_names[level];
    let mut levels = factor_levels_map.get(factor_name).cloned().unwrap_or_default();

    levels.push("Total".to_string());

    let mut groups = Vec::new();

    for value in levels {
        current_path.push((factor_name.clone(), value.clone()));

        let mut key_map = current_path.iter().cloned().collect::<HashMap<_, _>>();
        for i in level + 1..factor_names.len() {
            key_map.insert(factor_names[i].clone(), "Total".to_string());
        }

        // Buat key unik
        let key = factor_names
            .iter()
            .map(|f| format!("{}={}", f, key_map.get(f).unwrap_or(&"Total".to_string())))
            .collect::<Vec<_>>()
            .join(";");

        if let Some(stats) = stats_entries.get(&key) {
            // Membangun sub-grup pada level berikutnya.
            let subgroups = build_groups_recursive(
                factor_names,
                factor_levels_map,
                stats_entries,
                level + 1,
                current_path
            );

            groups.push(DescriptiveStatGroup {
                factor_name: factor_name.clone(),
                factor_value: value.clone(),
                stats: stats.clone(),
                subgroups,
                is_total: value == "Total",
            });
        }

        current_path.pop();
    }

    groups
}
