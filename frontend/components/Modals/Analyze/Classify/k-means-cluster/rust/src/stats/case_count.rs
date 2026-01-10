use crate::models::{ config::KMeansConfig, result::{ CaseCountTable, ProcessedData } };

use super::core::*;

pub fn generate_case_count(
    data: &ProcessedData,
    config: &KMeansConfig
) -> Result<CaseCountTable, String> {
    let num_clusters = config.main.cluster as usize;
    let membership = generate_cluster_membership(data, config)?;

    let counts = (1..=num_clusters)
        .map(|i| {
            let count = membership.data
                .iter()
                .filter(|m| m.cluster == (i as i32))
                .count();

            // (nomor cluster, jumlah anggota).
            (i.to_string(), count)
        })
        .collect();

    Ok(CaseCountTable {
        valid: membership.data.len(),
        missing: data.missing_cases,
        clusters: counts,
        note: None,
        interpretation: Some(
            "This table shows the number of cases assigned to each cluster. 'Valid' represents the total count of data points processed, while 'Missing' indicates cases that were excluded. The 'Clusters' field details the specific case count for each cluster.".to_string()
        ),
    })
}
