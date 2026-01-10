use crate::models::{
    config::ClusterConfig,
    data::AnalysisData,
    result::{ AgglomerationStage, ClusterMembership },
};

use super::core::generate_agglomeration_schedule_wrapper;

// Fungsi untuk mendapatkan keanggotaan cluster
pub fn get_cluster_memberships(
    data: &AnalysisData,
    config: &ClusterConfig
) -> Result<Vec<ClusterMembership>, String> {
    // Dapatkan jadwal aglomerasi
    let agglomeration = generate_agglomeration_schedule_wrapper(data, config)?;

    // Hitung jumlah kasus
    let num_cases = data.cluster_data
        .iter()
        .map(|d| d.len())
        .next()
        .unwrap_or(0);

    // Tentukan solusi cluster yang akan dihasilkan
    let solutions = if config.statistics.none_sol {
        vec![] // Tidak ada solusi
    } else if config.statistics.single_sol {
        // Solusi tunggal
        vec![config.statistics.no_of_cluster.unwrap_or(2)]
    } else if config.statistics.range_sol {
        // Rentang solusi
        let min = config.statistics.min_cluster.unwrap_or(2);
        let max = config.statistics.max_cluster.unwrap_or(((num_cases as i32) / 2).max(min));
        (min..=max).collect()
    } else {
        // Default: solusi tunggal
        vec![config.statistics.no_of_cluster.unwrap_or(2)]
    };

    // Hasilkan keanggotaan untuk setiap solusi yang diminta
    let mut result = Vec::new();
    for num_clusters in solutions {
        let assignments = generate_cluster_membership(
            &agglomeration.stages,
            num_cases,
            num_clusters as usize
        )?;

        result.push(ClusterMembership {
            num_clusters: num_clusters as usize,
            case_assignments: assignments,
        });
    }

    Ok(result)
}

// Membuat keanggotaan cluster berdasarkan jadwal aglomerasi
pub fn generate_cluster_membership(
    stages: &[AgglomerationStage],
    num_cases: usize,
    num_clusters: usize
) -> Result<Vec<usize>, String> {
    // Inisialisasi: setiap kasus adalah cluster sendiri
    let mut case_cluster_ids = (0..num_cases).collect::<Vec<usize>>();

    // Proses jadwal aglomerasi untuk membuat jumlah cluster yang diinginkan
    let num_stages_to_process = num_cases.saturating_sub(num_clusters);

    for i in 0..num_stages_to_process {
        if i >= stages.len() {
            break;
        }

        let stage = &stages[i];
        let (cluster1, cluster2) = stage.clusters_combined;

        // Gabungkan cluster dengan menetapkan semua kasus dari cluster2 ke cluster1
        for case_id in 0..case_cluster_ids.len() {
            if case_cluster_ids[case_id] == cluster2 - 1 {
                case_cluster_ids[case_id] = cluster1 - 1;
            }
        }
    }

    Ok(case_cluster_ids)
}
