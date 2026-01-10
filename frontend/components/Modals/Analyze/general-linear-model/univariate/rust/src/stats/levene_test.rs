use statrs::distribution::ContinuousCDF;
use rayon::prelude::*;
use crate::models::{
    config::UnivariateConfig,
    data::AnalysisData,
    result::{ LeveneCenter, LeveneTest, LeveneTestEntry },
};

use super::core::*;

pub fn calculate_levene_test(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<Vec<LeveneTest>, String> {
    let dep_var_name = config.main.dep_var.as_ref().unwrap();
    let design_info = create_design_response_weights(data, config)?;
    let design_string = generate_design_string(&design_info);

    let data_for_levene = if config.main.covar.as_ref().map_or(true, |c| c.is_empty()) {
        design_info.y.as_slice().to_vec()
    } else {
        let ztwz_matrix = create_cross_product_matrix(&design_info)?;
        let swept_info = perform_sweep_and_extract_results(&ztwz_matrix, design_info.p_parameters)?;

        let y_hat = &design_info.x * &swept_info.beta_hat;
        let residuals = &design_info.y - y_hat;
        residuals.as_slice().to_vec()
    };

    let mut groups = create_groups_from_design_matrix(&design_info, &data_for_levene);

    if config.main.covar.as_ref().map_or(true, |c| c.is_empty()) {
        groups = groups
            .into_iter()
            .filter(|g| g.len() > 1)
            .collect();
    }

    if groups.is_empty() {
        return Err("No groups with more than 1 observation found for Levene's test".to_string());
    }

    let levene_entries = calculate_levene_entries(&groups, config)?;

    let result = LeveneTest {
        dependent_variable: dep_var_name.clone(),
        entries: levene_entries,
        design: design_string,
        note: Some(
            "Levene's test checks if the variance of the dependent variable is equal across groups.".to_string()
        ),
        interpretation: Some(
            "A significant p-value (e.g., < 0.05) suggests that the variances are not equal, violating the assumption of homogeneity of variances. Different versions of the test (based on mean, median, etc.) are provided for robustness.".to_string()
        ),
    };

    Ok(vec![result])
}

pub fn calculate_levene_entries(
    groups: &[Vec<f64>],
    config: &UnivariateConfig
) -> Result<Vec<LeveneTestEntry>, String> {
    let mut entries = Vec::new();
    let has_no_covariates = config.main.covar.as_ref().map_or(true, |c| c.is_empty());

    if has_no_covariates {
        if let Ok((f, df1, df2, sig)) = calculate_levene_anova(groups, LeveneCenter::Mean) {
            entries.push(LeveneTestEntry {
                function: "Based on Mean".to_string(),
                levene_statistic: f,
                df1,
                df2: df2 as f64,
                significance: sig,
            });
        }

        if let Ok((f, df1, df2, sig)) = calculate_levene_anova(groups, LeveneCenter::Median) {
            entries.push(LeveneTestEntry {
                function: "Based on Median".to_string(),
                levene_statistic: f,
                df1,
                df2: df2 as f64,
                significance: sig,
            });
        }

        if let Ok((f, df1, df2, sig)) = calculate_levene_anova_adjusted_df(groups) {
            entries.push(LeveneTestEntry {
                function: "Based on Median and with adjusted df".to_string(),
                levene_statistic: f,
                df1,
                df2,
                significance: sig,
            });
        }

        if
            let Ok((f, df1, df2, sig)) = calculate_levene_anova(
                groups,
                LeveneCenter::TrimmedMean(0.05)
            )
        {
            entries.push(LeveneTestEntry {
                function: "Based on trimmed mean".to_string(),
                levene_statistic: f,
                df1,
                df2: df2 as f64,
                significance: sig,
            });
        }
    } else {
        if let Ok((f, df1, df2, sig)) = calculate_levene_anova(groups, LeveneCenter::Mean) {
            entries.push(LeveneTestEntry {
                function: "Levene".to_string(),
                levene_statistic: f,
                df1,
                df2: df2 as f64,
                significance: sig,
            });
        }
    }

    if entries.is_empty() {
        Err("No valid Levene test entries could be calculated".to_string())
    } else {
        Ok(entries)
    }
}

fn calculate_levene_anova(
    groups: &[Vec<f64>],
    center_method: LeveneCenter
) -> Result<(f64, usize, usize, f64), String> {
    if groups.iter().any(|g| g.is_empty()) || groups.len() < 2 {
        return Ok((f64::NAN, 0, 0, f64::NAN));
    }

    let group_centers: Vec<f64> = groups
        .par_iter()
        .map(|group| {
            match center_method {
                LeveneCenter::Mean => calculate_mean(group),
                LeveneCenter::Median => calculate_median(group),
                LeveneCenter::TrimmedMean(proportion) => {
                    calculate_interpolated_trimmed_mean(group, proportion)
                }
            }
        })
        .collect();

    let abs_deviations: Vec<Vec<f64>> = groups
        .par_iter()
        .enumerate()
        .map(|(i, group)| {
            let center = group_centers[i];
            group
                .iter()
                .map(|val| (val - center).abs())
                .collect()
        })
        .collect();

    let total_samples = groups
        .iter()
        .map(|group| group.len())
        .sum::<usize>();
    let all_deviations: Vec<f64> = abs_deviations.iter().flatten().cloned().collect();
    let overall_mean = calculate_mean(&all_deviations);

    let ss_between = abs_deviations
        .par_iter()
        .enumerate()
        .map(|(i, group)| {
            let group_mean = calculate_mean(group);
            let group_size = groups[i].len() as f64;
            group_size * (group_mean - overall_mean).powi(2)
        })
        .sum::<f64>();

    let ss_within = abs_deviations
        .par_iter()
        .map(|group| {
            let group_mean = calculate_mean(group);
            group
                .iter()
                .map(|val| (val - group_mean).powi(2))
                .sum::<f64>()
        })
        .sum::<f64>();

    let df1 = groups.len() - 1;
    let df2 = total_samples - groups.len();

    if df2 == 0 {
        return Ok((f64::NAN, df1, df2, f64::NAN));
    }

    let f_statistic = if ss_within < 1e-12 {
        if ss_between < 1e-12 { 0.0 } else { f64::INFINITY }
    } else {
        let ms_between = ss_between / (df1 as f64);
        let ms_within = ss_within / (df2 as f64);
        if ms_within == 0.0 {
            f64::INFINITY
        } else {
            ms_between / ms_within
        }
    };

    let significance = calculate_f_significance(df1, df2, f_statistic);

    Ok((f_statistic, df1, df2, significance))
}

pub fn calculate_levene_anova_adjusted_df(
    groups: &[Vec<f64>]
) -> Result<(f64, usize, f64, f64), String> {
    let abs_deviations_b: Vec<Vec<f64>> = groups
        .par_iter()
        .map(|group| {
            if group.is_empty() {
                return Vec::new();
            }
            let median = calculate_median(group);
            group
                .iter()
                .map(|val| (val - median).abs())
                .collect()
        })
        .collect();

    let (f_stat, df1, df2_unadjusted, _sig_unadjusted) = calculate_levene_anova(
        groups,
        LeveneCenter::Median
    )?;

    if df1 == 0 || groups.iter().all(|g| g.len() <= 1) {
        return Ok((f_stat, df1, df2_unadjusted as f64, f64::NAN));
    }

    let k = groups.len();
    let (u_values, v_i_values): (Vec<f64>, Vec<f64>) = (0..k)
        .into_par_iter()
        .map(|i| {
            let z_values_group_i = &abs_deviations_b[i];
            let m_i = z_values_group_i.len();

            if m_i <= 1 {
                return (0.0, 0.0);
            }

            let z_bar_i_b = calculate_mean(z_values_group_i);
            let u_i = z_values_group_i
                .iter()
                .map(|z| (z - z_bar_i_b).powi(2))
                .sum::<f64>();

            (u_i, (m_i - 1) as f64)
        })
        .unzip();

    let sum_u_i: f64 = u_values.iter().sum();
    let sum_u_i_sq_over_v_i: f64 = u_values
        .iter()
        .zip(v_i_values.iter())
        .map(|(&ui, &vi)| {
            if vi == 0.0 {
                if ui.abs() < 1e-9 { 0.0 } else { f64::NAN }
            } else {
                ui.powi(2) / vi
            }
        })
        .sum();

    let df2_adjusted = if sum_u_i.abs() < 1e-9 {
        df2_unadjusted as f64
    } else if sum_u_i_sq_over_v_i.is_nan() || sum_u_i_sq_over_v_i.abs() < 1e-9 {
        f64::INFINITY
    } else {
        sum_u_i.powi(2) / sum_u_i_sq_over_v_i
    };

    let significance_adj = if
        f_stat.is_nan() ||
        df1 == 0 ||
        df2_adjusted.is_nan() ||
        df2_adjusted <= 0.0 ||
        df2_adjusted.is_infinite()
    {
        if f_stat > 0.0 && df2_adjusted.is_infinite() { 0.0 } else { f64::NAN }
    } else {
        match statrs::distribution::FisherSnedecor::new(df1 as f64, df2_adjusted) {
            Ok(dist) => 1.0 - dist.cdf(f_stat),
            Err(_) => f64::NAN,
        }
    };

    Ok((f_stat, df1, df2_adjusted, significance_adj))
}

fn calculate_interpolated_trimmed_mean(group: &[f64], proportion_alpha: f64) -> f64 {
    if group.is_empty() {
        return 0.0;
    }
    let n = group.len();
    let n_float = n as f64;

    let mut sorted_group = group.to_vec();
    sorted_group.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

    let trim_target_count_float = proportion_alpha * n_float;
    let g = trim_target_count_float.floor();
    let g_usize = g as usize;
    let fraction = trim_target_count_float - g;

    let effective_n_for_denominator = n_float * (1.0 - 2.0 * proportion_alpha);
    if effective_n_for_denominator < 1e-9 {
        return calculate_mean(group);
    }

    if n <= 2 * g_usize {
        return if n % 2 == 1 {
            sorted_group[n / 2]
        } else if n > 0 {
            (sorted_group[n / 2 - 1] + sorted_group[n / 2]) / 2.0
        } else {
            0.0
        };
    }

    let mut weighted_sum = 0.0;

    if g_usize + 1 < n - g_usize {
        for i in g_usize + 1..n - g_usize - 1 {
            weighted_sum += sorted_group[i];
        }
    }

    if fraction == 0.0 {
        weighted_sum += sorted_group[g_usize];
        weighted_sum += sorted_group[n - 1 - g_usize];
    } else {
        weighted_sum += (1.0 - fraction) * sorted_group[g_usize];
        weighted_sum += (1.0 - fraction) * sorted_group[n - 1 - g_usize];
    }

    weighted_sum / effective_n_for_denominator
}
