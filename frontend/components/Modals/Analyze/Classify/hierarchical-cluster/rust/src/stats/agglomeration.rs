// File: agglomeration.rs
use std::collections::HashMap;

use crate::models::{
    config::{ ClusMethod, ClusterConfig },
    data::{ AnalysisData, DataValue },
    result::{ AgglomerationSchedule, AgglomerationStage, ClusterState },
};

use super::core::{
    calculate_distance,
    calculate_variable_distance,
    extract_case_label,
    find_closest_clusters,
    merge_clusters,
};

// Memeriksa apakah kita melakukan clustering untuk kasus atau variabel
pub fn generate_agglomeration_schedule_wrapper(
    data: &AnalysisData,
    config: &ClusterConfig
) -> Result<AgglomerationSchedule, String> {
    if config.main.cluster_cases {
        generate_case_agglomeration_schedule(data, config)
    } else if config.main.cluster_var {
        generate_variable_agglomeration_schedule(data, config)
    } else {
        Err("Neither case nor variable clustering specified".to_string())
    }
}

// Fungsi untuk menghasilkan jadwal aglomerasi untuk clustering kasus
fn generate_case_agglomeration_schedule(
    data: &AnalysisData,
    config: &ClusterConfig
) -> Result<AgglomerationSchedule, String> {
    // Mendapatkan variabel yang akan digunakan untuk menghitung jarak
    let variables = config.main.variables
        .as_ref()
        .ok_or_else(|| "No variables specified for clustering".to_string())?;

    if data.cluster_data.is_empty() {
        return Err("No data available for clustering".to_string());
    }

    // Ekstrak nilai dan inisialisasi struktur clustering
    let cluster_state = initialize_case_cluster_state(data, config, variables)?;

    // Menghasilkan jadwal aglomerasi
    generate_agglomeration_schedule(&mut cluster_state.clone(), config)
}

// Fungsi untuk menghasilkan jadwal aglomerasi untuk clustering variabel
fn generate_variable_agglomeration_schedule(
    data: &AnalysisData,
    config: &ClusterConfig
) -> Result<AgglomerationSchedule, String> {
    // Mendapatkan variabel yang akan digunakan dalam clustering
    let variables = config.main.variables
        .as_ref()
        .ok_or_else(|| "No variables specified for clustering".to_string())?;

    if data.cluster_data.is_empty() {
        return Err("No data available for clustering".to_string());
    }

    // Ekstrak nilai dan inisialisasi struktur clustering
    let variable_values = extract_variable_data(data, variables)?;
    let cluster_state = initialize_variable_cluster_state(&variable_values, variables, config)?;

    // Menghasilkan jadwal aglomerasi
    generate_agglomeration_schedule(&mut cluster_state.clone(), config)
}

// Inisialisasi cluster state untuk clustering kasus
fn initialize_case_cluster_state(
    data: &AnalysisData,
    config: &ClusterConfig,
    variables: &[String]
) -> Result<ClusterState, String> {
    let case_count = data.cluster_data
        .get(0)
        .map(|d| d.len())
        .ok_or_else(|| "No data available for clustering".to_string())?;

    // Ekstraksi data kasus
    let case_values: Vec<HashMap<String, DataValue>> = (0..case_count)
        .map(|case_idx| {
            let mut values = HashMap::new();
            for var in variables {
                for dataset in &data.cluster_data {
                    if case_idx < dataset.len() {
                        if let Some(value) = dataset[case_idx].values.get(var) {
                            values.insert(var.clone(), value.clone());
                            break;
                        }
                    }
                }
            }
            values
        })
        .collect();

    // Membuat label kasus menggunakan fungsi yang ada
    let case_labels: Vec<String> = (0..case_count)
        .map(|case_idx| extract_case_label(data, config, case_idx))
        .collect();

    // Inisialisasi cluster - setiap kasus awalnya menjadi cluster sendiri
    let clusters = (0..case_count).map(|i| vec![i]).collect::<Vec<_>>();

    // Menghitung matriks jarak awal
    let mut distances = vec![vec![0.0; case_count]; case_count];
    for i in 0..case_count {
        for j in i..case_count {
            if i == j {
                distances[i][j] = 0.0;
                continue;
            }

            let distance = calculate_distance(&case_values[i], &case_values[j], variables, config);
            distances[i][j] = distance;
            distances[j][i] = distance; // Memastikan simetri
        }
    }

    Ok(ClusterState {
        clusters,
        distances,
        case_labels,
        variables: variables.to_vec(),
        method: config.method.clus_method.clone(),
    })
}

// Fungsi untuk mengekstrak data variabel dari dataset
fn extract_variable_data(
    data: &AnalysisData,
    variables: &[String]
) -> Result<HashMap<String, Vec<f64>>, String> {
    let case_count = data.cluster_data
        .get(0)
        .map(|d| d.len())
        .ok_or_else(|| "No data available for clustering".to_string())?;

    let mut variable_values = HashMap::new();

    // Untuk setiap variabel, kumpulkan nilainya di semua kasus
    for var in variables {
        let mut values = Vec::with_capacity(case_count);

        for i in 0..case_count {
            // Coba temukan nilai ini di dataset manapun
            let value = data.cluster_data
                .iter()
                .filter_map(|dataset| {
                    if i < dataset.len() {
                        if let Some(DataValue::Number(val)) = dataset[i].values.get(var) {
                            Some(*val)
                        } else {
                            None
                        }
                    } else {
                        None
                    }
                })
                .next();

            if let Some(val) = value {
                values.push(val);
            }
        }

        variable_values.insert(var.clone(), values);
    }

    Ok(variable_values)
}

// Inisialisasi cluster state untuk clustering variabel
fn initialize_variable_cluster_state(
    variable_values: &HashMap<String, Vec<f64>>,
    variables: &Vec<String>,
    config: &ClusterConfig
) -> Result<ClusterState, String> {
    let var_count = variables.len();

    // Inisialisasi cluster - setiap variabel awalnya adalah cluster sendiri
    let clusters = (0..var_count).map(|i| vec![i]).collect::<Vec<_>>();

    // Menghitung matriks jarak awal antara variabel
    let mut distances = vec![vec![0.0; var_count]; var_count];
    for i in 0..var_count {
        for j in i..var_count {
            if i == j {
                distances[i][j] = 0.0;
                continue;
            }

            let var_i = &variables[i];
            let var_j = &variables[j];
            let distance = calculate_variable_distance(variable_values, var_i, var_j, config);

            distances[i][j] = distance;
            distances[j][i] = distance; // Memastikan simetri
        }
    }

    Ok(ClusterState {
        clusters,
        distances,
        case_labels: variables.clone(), // Nama variabel berfungsi sebagai label
        variables: variables.to_vec(),
        method: config.method.clus_method.clone(),
    })
}

pub fn generate_agglomeration_schedule(
    state: &mut ClusterState,
    config: &ClusterConfig
) -> Result<AgglomerationSchedule, String> {
    let original_count = state.clusters.len();
    let stages_count = original_count - 1;

    // Inisialisasi struktur untuk pelacakan
    let mut stages = Vec::with_capacity(stages_count);
    let mut ward_coefficient = 0.0;

    // Menyimpan ID cluster aktif (1-indexed)
    // Ini adalah mapping dari indeks cluster saat ini ke ID asli
    let mut active_clusters: Vec<usize> = (1..=original_count).collect();

    // Melacak kapan cluster pertama kali muncul dalam jadwal
    // Original clusters memiliki stage 0, merged clusters memiliki stage saat mereka dibentuk
    let mut first_appears: HashMap<usize, usize> = HashMap::new();

    // Melacak stage di mana tiap cluster terakhir muncul sebagai salah satu dari clusters_combined
    // (digunakan untuk menghitung next_stage)
    let mut last_stage_used: HashMap<usize, usize> = HashMap::new();

    // Simpan cluster sizes untuk perhitungan jarak
    let mut cluster_sizes: Vec<usize> = state.clusters
        .iter()
        .map(|c| c.len())
        .collect();

    // Memproses setiap tahap
    for stage_idx in 0..stages_count {
        let stage = stage_idx + 1; // Nomor tahap 1-indexed

        // Menemukan cluster terdekat
        if let Some((idx1, idx2, distance)) = find_closest_clusters(state) {
            // Mendapatkan ID cluster yang akan digabung (1-indexed)
            let cluster1_id = active_clusters[idx1];
            let cluster2_id = active_clusters[idx2];

            // Untuk metode Ward, perbarui koefisien dengan formula yang tepat
            let coefficient = match state.method {
                ClusMethod::Ward => {
                    // Formula Ward: W = W + 0.5 * s_pq
                    ward_coefficient += 0.5 * distance;
                    ward_coefficient
                }
                _ => distance,
            };

            // Menghitung kapan cluster pertama kali muncul
            // Jika belum pernah muncul (original cluster), default ke 0
            let cluster1_first_stage = *first_appears.get(&cluster1_id).unwrap_or(&0);
            let cluster2_first_stage = *first_appears.get(&cluster2_id).unwrap_or(&0);

            // Catat stage di mana cluster terakhir digunakan
            last_stage_used.insert(cluster1_id, stage);
            last_stage_used.insert(cluster2_id, stage);

            // Sementara set next_stage ke 0, akan diupdate nanti
            let next_stage = 0;

            // Membuat entri tahap untuk agglomeration schedule
            stages.push(AgglomerationStage {
                stage,
                clusters_combined: (cluster1_id, cluster2_id),
                coefficients: coefficient,
                cluster_first_appears: (cluster1_first_stage, cluster2_first_stage),
                next_stage: next_stage,
            });

            web_sys::console::log_1(
                &format!(
                    "Stage {}: Merging clusters {} and {} with distance {}",
                    stage,
                    cluster1_id,
                    cluster2_id,
                    distance
                ).into()
            );

            // Perbarui ukuran cluster untuk perhitungan berikutnya
            let new_cluster_size = cluster_sizes[idx1] + cluster_sizes[idx2];
            cluster_sizes[idx1] = new_cluster_size;

            // Menggabungkan cluster secara fisik (dalam array clusters)
            merge_clusters(state, idx1, idx2, &cluster_sizes);

            // Hapus ukuran cluster yang sudah digabung
            cluster_sizes.remove(idx2);

            // Hapus cluster yang sudah digabung dari active_clusters
            active_clusters.remove(idx2);

            // Catat kapan cluster hasil gabungan pertama kali muncul
            // Kita gunakan cluster1_id sebagai ID untuk cluster gabungan
            first_appears.insert(cluster1_id, stage);
        } else {
            return Err(format!("Failed to find closest clusters at stage {}", stage_idx));
        }
    }

    // Post-processing: Hitung next_stage
    // Untuk setiap stage, cari stage berikutnya di mana cluster yang terbentuk
    // muncul dalam clusters_combined
    for i in 0..stages_count {
        let (cluster1_id, _) = stages[i].clusters_combined;

        // Cluster hasil gabungan direpresentasikan oleh cluster1_id
        // Cari stage berikutnya di mana cluster ini muncul
        let mut next_stage_idx = 0;

        for j in i + 1..stages_count {
            let (next_cluster1_id, next_cluster2_id) = stages[j].clusters_combined;
            if next_cluster1_id == cluster1_id || next_cluster2_id == cluster1_id {
                next_stage_idx = j + 1; // +1 karena stages di-index dari 1
                break;
            }
        }

        stages[i].next_stage = next_stage_idx;
    }

    Ok(AgglomerationSchedule { stages })
}
