use std::collections::{ HashMap, HashSet };
use crate::models::{
    config::ClusterConfig,
    data::AnalysisData,
    result::{ IciclePlot, AgglomerationSchedule },
};

use super::core::{
    generate_agglomeration_schedule_wrapper,
    generate_cluster_membership,
    generate_dendrogram,
    extract_case_label,
};

/// Generates the icicle plot data structure
pub fn generate_icicle_plot(
    data: &AnalysisData,
    config: &ClusterConfig
) -> Result<IciclePlot, String> {
    // Determine orientation
    let orientation = if config.plots.vert_orien { "vertical" } else { "horizontal" };

    // Get the number of cases
    let num_cases = data.cluster_data
        .get(0)
        .map(|d| d.len())
        .unwrap_or(0);

    // Get agglomeration schedule
    let agglomeration = generate_agglomeration_schedule_wrapper(data, config)?;

    // Generate the dendrogram to get case information
    let dendrogram = generate_dendrogram(data, config)?;

    // Get the original case labels using extract_case_label
    let case_labels: Vec<String> = (0..num_cases)
        .map(|case_idx| extract_case_label(data, config, case_idx))
        .collect();

    // Create a matrix to track which cases are in clusters at each level
    // case_in_cluster[n][i] = true means case i is part of a multi-case cluster when there are n clusters
    let mut case_in_cluster = vec![vec![false; num_cases]; num_cases+1];

    // Start by analyzing from 1 cluster up to num_cases clusters
    // For 1 cluster, all cases are in the same cluster
    for i in 0..num_cases {
        case_in_cluster[1][i] = true;
    }

    // Process each level from 2 to num_cases clusters
    for cluster_count in 2..=num_cases {
        // Which stage in the agglomeration schedule corresponds to this cluster count?
        let stage_idx = num_cases - cluster_count;

        // If we've processed all stages but still need more cluster counts, break
        if stage_idx >= agglomeration.stages.len() {
            break;
        }

        // Copy the case memberships from the previous level (fewer clusters)
        for i in 0..num_cases {
            case_in_cluster[cluster_count][i] = case_in_cluster[cluster_count - 1][i];
        }

        // Use generate_cluster_membership to get memberships for this cluster count
        let memberships = generate_cluster_membership(
            &agglomeration.stages,
            num_cases,
            cluster_count
        )?;

        // Create a map of cluster IDs to the cases they contain
        let mut clusters: HashMap<usize, Vec<usize>> = HashMap::new();
        for (i, &cluster_id) in memberships.iter().enumerate() {
            if i < num_cases {
                clusters.entry(cluster_id).or_insert_with(Vec::new).push(i);
            }
        }

        // Mark cases that are in clusters with multiple members
        for (_, cases) in &clusters {
            if cases.len() > 1 {
                for &case_idx in cases {
                    case_in_cluster[cluster_count][case_idx] = true;
                }
            } else if cases.len() == 1 {
                // Mark singleton clusters as not part of a multi-case cluster
                let case_idx = cases[0];
                case_in_cluster[cluster_count][case_idx] = false;
            }
        }
    }

    // Find the case with the highest number
    let highest_case = find_highest_case_number(&case_labels);

    // Order cases according to agglomeration schedule
    let ordered_cases = order_cases_by_agglomeration(highest_case, &agglomeration, num_cases)?;

    // Calculate cluster ranges for each case
    let mut case_clusters_map = HashMap::new();

    // Get the last case in ordered_cases
    let last_case_idx = ordered_cases.last().copied();

    for &case_idx in &ordered_cases {
        if case_idx < case_labels.len() {
            let label = case_labels[case_idx].clone();

            // Find the min and max cluster counts where this case is in a multi-case cluster
            let mut min_clusters = num_cases + 1;
            let mut max_clusters = 0;

            for cluster_count in 1..=num_cases {
                if case_in_cluster[cluster_count][case_idx] {
                    min_clusters = min_clusters.min(cluster_count);
                    max_clusters = max_clusters.max(cluster_count);
                }
            }

            // Special case for cases that are always alone
            if min_clusters > max_clusters {
                min_clusters = num_cases;
                max_clusters = num_cases;
            }

            // For the last case, only use one value
            if Some(case_idx) == last_case_idx {
                case_clusters_map.insert(label, vec![min_clusters]);
            } else {
                // Order matters: we want the larger value first (reverse of usual range)
                case_clusters_map.insert(label, vec![max_clusters, min_clusters]);
            }
        }
    }

    // Determine the range of clusters to display
    let (start_cluster, stop_cluster, step_by) = determine_cluster_range(config, num_cases);

    // Create the icicle plot structure
    Ok(IciclePlot {
        orientation: orientation.to_string(),
        case_clusters: case_clusters_map,
        start_cluster,
        stop_cluster,
        step_by,
    })
}

/// Finds the case with the highest number
fn find_highest_case_number(case_labels: &[String]) -> usize {
    let mut highest_num = 0;
    let mut highest_case_idx = 0;

    for (idx, label) in case_labels.iter().enumerate() {
        if label.starts_with("Case ") {
            let parts: Vec<&str> = label.split(|c| (c == ' ' || c == ':')).collect();
            if parts.len() >= 2 {
                if let Ok(case_num) = parts[1].parse::<usize>() {
                    if case_num > highest_num {
                        highest_num = case_num;
                        highest_case_idx = idx;
                    }
                }
            }
        }
    }

    highest_case_idx
}

/// Orders cases according to the agglomeration schedule
fn order_cases_by_agglomeration(
    highest_case: usize,
    agglomeration: &AgglomerationSchedule,
    num_cases: usize
) -> Result<Vec<usize>, String> {
    let mut ordered_cases = Vec::with_capacity(num_cases);
    let mut processed_cases = HashSet::new();

    // Start with the highest case
    ordered_cases.push(highest_case);
    processed_cases.insert(highest_case);

    // Initialize case-to-cluster mapping (each case starts in its own cluster)
    let mut case_to_cluster = vec![0; num_cases];
    for i in 0..num_cases {
        case_to_cluster[i] = i + 1; // 1-indexed clusters
    }

    // Process each agglomeration stage in reverse order (from num_cases-1 clusters down to 1)
    for stage_idx in (0..agglomeration.stages.len()).rev() {
        let stage = &agglomeration.stages[stage_idx];
        let (cluster1, cluster2) = stage.clusters_combined;

        // After this stage, cases in cluster2 are moved to cluster1
        // Find all cases that are in cluster2 at this point (pre-merge)
        let cases_in_cluster2: Vec<usize> = (0..num_cases)
            .filter(|&i| case_to_cluster[i] == cluster2)
            .collect();

        // Add any unprocessed cases from cluster2 to our ordered list
        for &case_idx in &cases_in_cluster2 {
            if !processed_cases.contains(&case_idx) {
                ordered_cases.push(case_idx);
                processed_cases.insert(case_idx);
            }
        }

        // Update cluster assignments for next iteration
        for i in 0..num_cases {
            if case_to_cluster[i] == cluster2 {
                case_to_cluster[i] = cluster1;
            }
        }
    }

    // Add any remaining cases that weren't processed
    for i in 0..num_cases {
        if !processed_cases.contains(&i) {
            ordered_cases.push(i);
        }
    }

    Ok(ordered_cases)
}

/// Determine the range of clusters to display based on configuration
fn determine_cluster_range(config: &ClusterConfig, num_cases: usize) -> (i32, i32, i32) {
    if config.plots.all_clusters {
        // Process all clusters from 1 to number of cases
        (1, num_cases as i32, 1)
    } else if config.plots.range_clusters {
        // Use configured range
        let start = config.plots.start_cluster;
        let stop = config.plots.stop_cluster.unwrap_or_else(|| (num_cases as i32) / 2);
        let step = config.plots.step_by_cluster;
        (start, stop, step)
    } else {
        // Use single solution
        let cluster = config.plots.start_cluster;
        (cluster, cluster, 1)
    }
}
