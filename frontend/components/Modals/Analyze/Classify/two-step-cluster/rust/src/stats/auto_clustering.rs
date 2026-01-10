// auto_clustering.rs
use crate::models::{
    config::ClusterConfig,
    result::{ AutoClustering, ClusterAnalysisPoint, ProcessedData },
};

use super::core::{
    calculate_information_criteria,
    calculate_min_intercluster_distance,
    hierarchical_clustering,
};

pub fn calculate_auto_clustering(
    processed_data: &ProcessedData,
    config: &ClusterConfig
) -> Result<AutoClustering, String> {
    // Use max_cluster from config
    let max_clusters = config.main.max_cluster;
    let mut cluster_analysis = Vec::new();

    // Determine which criteria to calculate
    let calculate_bic = config.main.bic;
    let calculate_aic = config.main.aic;

    // Return early if neither BIC nor AIC is selected
    if !calculate_bic && !calculate_aic {
        return Ok(AutoClustering {
            cluster_analysis,
        });
    }

    // Calculate BIC and/or AIC for different cluster numbers
    for k in 1..=max_clusters {
        // Skip if we don't have enough sub-clusters
        if (k as usize) > processed_data.sub_clusters.len() {
            continue;
        }

        // Create temporary cluster assignments
        let cluster_assignments = if k == 1 {
            vec![0; processed_data.sub_clusters.len()]
        } else {
            hierarchical_clustering(&processed_data.sub_clusters, k as usize, config.main.euclidean)
        };

        // Calculate BIC and/or AIC based on config
        let (bic, aic) = calculate_information_criteria(
            &processed_data.sub_clusters,
            &cluster_assignments,
            k
        );

        // Calculate distance measure ratio
        let ratio_of_distance = if k > 1 {
            let min_dist_k = calculate_min_intercluster_distance(
                &processed_data.sub_clusters,
                &cluster_assignments,
                config.main.euclidean
            );

            let prev_assignments = hierarchical_clustering(
                &processed_data.sub_clusters,
                (k - 1) as usize,
                config.main.euclidean
            );

            let min_dist_prev = calculate_min_intercluster_distance(
                &processed_data.sub_clusters,
                &prev_assignments,
                config.main.euclidean
            );

            if min_dist_prev > 0.0 {
                min_dist_k / min_dist_prev
            } else {
                1.0
            }
        } else {
            0.0
        };

        // Create analysis point based on which criteria are calculated
        let analysis_point = ClusterAnalysisPoint {
            number_of_clusters: k,
            bayesian_criterion: if calculate_bic {
                bic
            } else {
                0.0
            },
            aic_criterion: if calculate_aic {
                Some(aic)
            } else {
                None
            },
            bic_change: None,
            aic_change: None,
            ratio_of_bic_changes: None,
            ratio_of_aic_changes: None,
            ratio_of_distance_measures: ratio_of_distance,
        };

        cluster_analysis.push(analysis_point);
    }

    // Calculate BIC and AIC changes and ratios based on config
    if cluster_analysis.len() > 1 {
        for i in 1..cluster_analysis.len() {
            // BIC changes (only if BIC is calculated)
            if calculate_bic {
                let bic_change =
                    cluster_analysis[i - 1].bayesian_criterion -
                    cluster_analysis[i].bayesian_criterion;
                cluster_analysis[i].bic_change = Some(bic_change);

                // BIC change ratios
                if i == 1 {
                    cluster_analysis[i].ratio_of_bic_changes = Some(1.0);
                } else {
                    // BIC ratio
                    if let Some(first_change) = cluster_analysis[1].bic_change {
                        if first_change != 0.0 {
                            cluster_analysis[i].ratio_of_bic_changes = Some(
                                bic_change / first_change
                            );
                        }
                    }
                }
            }

            // AIC changes (only if AIC is calculated)
            if calculate_aic {
                if
                    let (Some(prev_aic), Some(current_aic)) = (
                        cluster_analysis[i - 1].aic_criterion,
                        cluster_analysis[i].aic_criterion,
                    )
                {
                    let aic_change = prev_aic - current_aic;
                    cluster_analysis[i].aic_change = Some(aic_change);

                    // AIC ratio
                    if i == 1 {
                        cluster_analysis[i].ratio_of_aic_changes = Some(1.0);
                    } else {
                        if
                            let (Some(first_aic_change), Some(current_aic_change)) = (
                                cluster_analysis[1].aic_change,
                                cluster_analysis[i].aic_change,
                            )
                        {
                            if first_aic_change != 0.0 {
                                cluster_analysis[i].ratio_of_aic_changes = Some(
                                    current_aic_change / first_aic_change
                                );
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(AutoClustering {
        cluster_analysis,
    })
}
