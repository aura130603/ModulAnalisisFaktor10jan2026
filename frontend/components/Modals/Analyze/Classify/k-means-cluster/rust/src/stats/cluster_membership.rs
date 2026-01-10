use crate::models::{
    config::KMeansConfig,
    result::{ ClusterMembership, ProcessedData, ClusterMembershipData },
};

use super::core::*;

pub fn generate_cluster_membership(
    data: &ProcessedData,
    config: &KMeansConfig
) -> Result<ClusterMembership, String> {
    let final_centers_result = generate_final_cluster_centers(data, config)?;
    let final_centers = convert_map_to_matrix(&final_centers_result.centers, &data.variables);

    let membership_data = data.data_matrix
        .iter()
        .enumerate()
        .map(|(idx, case)| {
            let (cluster, distance) = find_nearest_cluster(case, &final_centers);

            // Ambil nama kasus
            let case_name = data.case_names.as_ref().and_then(|names| names.get(idx).cloned());

            ClusterMembershipData {
                case_number: data.case_numbers[idx],
                case_name,
                cluster: (cluster + 1) as i32,
                distance,
            }
        })
        .collect();

    let membership = ClusterMembership {
        data: membership_data,
        note: None,
        interpretation: Some(
            "This indicates which cluster the case belongs to and its Euclidean distance to the cluster's center. A smaller distance implies a better fit of the case to its assigned cluster.".to_string()
        ),
    };

    Ok(membership)
}
