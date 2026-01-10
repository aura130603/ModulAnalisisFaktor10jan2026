use std::collections::HashMap;

use crate::models::{ config::KMeansConfig, result::{ ANOVACluster, ANOVATable, ProcessedData } };

use super::core::*;

pub fn calculate_anova(data: &ProcessedData, config: &KMeansConfig) -> Result<ANOVATable, String> {
    let num_clusters = config.main.cluster as usize;
    let membership = generate_cluster_membership(data, config)?;

    let mut anova_clusters = HashMap::new();

    for (var_idx, var_name) in data.variables.iter().enumerate() {
        let var_values: Vec<f64> = data.data_matrix
            .iter()
            .map(|row| row[var_idx])
            .collect();

        let overall_mean = mean(&var_values);

        let mut cluster_data: Vec<Vec<f64>> = vec![Vec::new(); num_clusters];
        for (idx, case) in data.data_matrix.iter().enumerate() {
            let cluster = (membership.data[idx].cluster as usize) - 1;
            cluster_data[cluster].push(case[var_idx]);
        }

        let cluster_means: Vec<f64> = cluster_data
            .iter()
            .map(|cluster| if cluster.is_empty() { overall_mean } else { mean(cluster) })
            .collect();

        let ssb: f64 = cluster_data
            .iter()
            .enumerate()
            .map(|(i, cluster)| {
                let valid_count = cluster
                    .iter()
                    .filter(|x| !x.is_nan())
                    .count() as f64;
                valid_count * (cluster_means[i] - overall_mean).powi(2)
            })
            .sum();

        let ssw: f64 = cluster_data
            .iter()
            .enumerate()
            .map(|(i, cluster)| sum_squared_deviations(cluster, cluster_means[i]))
            .sum();

        // Hitung total kasus valid untuk degrees of freedom
        let total_valid_cases: usize = cluster_data
            .iter()
            .map(|cluster|
                cluster
                    .iter()
                    .filter(|x| !x.is_nan())
                    .count()
            )
            .sum();

        let df_between = (num_clusters as i32) - 1;
        let df_within = (total_valid_cases as i32) - (num_clusters as i32);

        if df_within <= 0 {
            anova_clusters.insert(var_name.clone(), ANOVACluster {
                mean_square: 0.0,
                error_mean_square: 0.0,
                df: df_between,
                error_df: df_within,
                f: 0.0,
                significance: 1.0,
            });
            continue;
        }

        let mean_square_between = ssb / (df_between as f64);
        let mean_square_within = ssw / (df_within as f64);

        let f_statistic = if mean_square_within > 0.0 {
            mean_square_between / mean_square_within
        } else {
            f64::MAX
        };

        let p_value = f_test_p_value(f_statistic, df_between, df_within);

        anova_clusters.insert(var_name.clone(), ANOVACluster {
            mean_square: mean_square_between,
            error_mean_square: mean_square_within,
            df: df_between,
            error_df: df_within,
            f: f_statistic,
            significance: p_value,
        });
    }

    Ok(ANOVATable {
        clusters: anova_clusters,
        note: Some(
            "The F tests should be used only for descriptive purposes because the clusters have been chosen to maximize the differences among cases in different clusters. The observed significance levels are not corrected for this and thus cannot be interpreted as tests of the hypothesis that the cluster means are equal.".to_string()
        ),
        interpretation: Some("".to_string()),
    })
}
