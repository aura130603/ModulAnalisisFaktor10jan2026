// File: cluster_method.rs
use crate::models::{ config::ClusMethod, result::ClusterState };
use nalgebra::DMatrix;

// Menemukan dua cluster terdekat dan mengembalikan indeksnya serta jarak
pub fn find_closest_clusters(state: &ClusterState) -> Option<(usize, usize, f64)> {
    let n_clusters = state.clusters.len();
    if n_clusters < 2 {
        return None;
    }

    // Cari nilai minimum dan indeksnya secara langsung tanpa konversi ke DMatrix
    let mut min_distance = f64::MAX;
    let mut closest_pair = None;

    for i in 0..n_clusters {
        for j in i + 1..n_clusters {
            let distance = state.distances[i][j];
            if distance < min_distance {
                min_distance = distance;
                closest_pair = Some((i, j, distance));
            }
        }
    }

    closest_pair
}

// Menggabungkan cluster dan memperbarui cluster state
// SUDAH DIGANTI dengan implementasi yang lebih baik di agglomeration.rs

// Menghitung jarak baru antara cluster yang digabung dan cluster lainnya
pub fn calculate_new_distance(
    method: &ClusMethod,
    n_keep: usize,
    n_remove: usize,
    n_other: usize,
    d_keep_other: f64,
    d_remove_other: f64,
    d_keep_remove: f64
) -> f64 {
    // Konversi ke float untuk perhitungan
    let n_keep = n_keep as f64;
    let n_remove = n_remove as f64;
    let n_other = n_other as f64;
    let n_t = n_keep + n_remove; // Ukuran cluster gabungan

    match method {
        ClusMethod::AverageBetweenGroups => {
            // Formula: s_tr = (N_p*s_pr + N_q*s_qr) / (N_p + N_q)
            (n_keep * d_keep_other + n_remove * d_remove_other) / n_t
        }
        ClusMethod::AverageWithinGroups => {
            // Formula simplifikasi dari: (SUM_p + SUM_q + s_pq) / ((N_p + N_q)*(N_p + N_q - 1)/2)
            (d_keep_other + d_remove_other) / 2.0
        }
        ClusMethod::SingleLinkage => {
            // Minimal distance for dissimilarity matrices
            d_keep_other.min(d_remove_other)
        }
        ClusMethod::CompleteLinkage => {
            // Maximal distance for dissimilarity matrices
            d_keep_other.max(d_remove_other)
        }
        ClusMethod::Centroid => {
            // Formula: s_tr = (N_p*s_pr + N_q*s_qr - N_p*N_q*s_pq/(N_p + N_q)) / (N_p + N_q)
            (n_keep * d_keep_other +
                n_remove * d_remove_other -
                (n_keep * n_remove * d_keep_remove) / n_t) /
                n_t
        }
        ClusMethod::Median => {
            // Formula: s_tr = (s_pr + s_qr)/2 - s_pq/4
            (d_keep_other + d_remove_other) / 2.0 - d_keep_remove / 4.0
        }
        ClusMethod::Ward => {
            // Formula: s_tr = [(N_r + N_p)*s_rp + (N_r + N_q)*s_rq - N_r*s_pq] / (N_t + N_r)
            ((n_other + n_keep) * d_keep_other +
                (n_other + n_remove) * d_remove_other -
                n_other * d_keep_remove) /
                (n_t + n_other)
        }
    }
}

// Menggabungkan cluster dan memperbarui distances dengan implementasi yang disederhanakan
pub fn merge_clusters(
    state: &mut ClusterState,
    keep_idx: usize,
    remove_idx: usize,
    cluster_sizes: &[usize]
) {
    // Validasi indeks
    if keep_idx >= state.clusters.len() || remove_idx >= state.clusters.len() {
        // Tangani kesalahan dengan aman, kembalikan tanpa mengubah state
        return;
    }

    // 1. Gabungkan elemen cluster
    let mut merged_cluster = state.clusters[keep_idx].clone();
    merged_cluster.extend(state.clusters[remove_idx].clone());
    state.clusters[keep_idx] = merged_cluster;

    // 2. Pertahankan matriks jarak asli sebelum dimodifikasi
    let original_distances = state.distances.clone();
    let n_clusters = state.clusters.len();

    // 3. Hapus cluster yang sudah digabung
    state.clusters.remove(remove_idx);

    // 4. Buat matriks jarak baru dengan dimensi yang tepat
    let new_n_clusters = n_clusters - 1;
    let mut new_distances = vec![vec![0.0; new_n_clusters]; new_n_clusters];

    // 5. Isi matriks jarak baru
    for i in 0..new_n_clusters {
        for j in 0..i {
            // Hanya isi setengah matriks, kemudian copy untuk simetri
            if i == j {
                new_distances[i][j] = 0.0;
                continue;
            }

            // Hitung jarak baru jika i atau j adalah cluster gabungan
            if i == keep_idx || j == keep_idx {
                let other_idx = if i == keep_idx { j } else { i };

                // Transformasikan indeks other_idx ke indeks asli
                let orig_other_idx = if other_idx < remove_idx { other_idx } else { other_idx + 1 };

                // Ambil jarak yang diperlukan dari matriks asli
                let d_keep_other = original_distances[keep_idx][orig_other_idx];
                let d_remove_other = original_distances[remove_idx][orig_other_idx];
                let d_keep_remove = original_distances[keep_idx][remove_idx];

                // Dapatkan ukuran cluster dengan aman
                let n_keep = if keep_idx < cluster_sizes.len() {
                    cluster_sizes[keep_idx]
                } else {
                    1
                };
                let n_remove = if remove_idx < cluster_sizes.len() {
                    cluster_sizes[remove_idx]
                } else {
                    1
                };
                let n_other = if orig_other_idx < cluster_sizes.len() {
                    cluster_sizes[orig_other_idx]
                } else {
                    1
                };

                // Hitung jarak baru
                new_distances[i][j] = calculate_new_distance(
                    &state.method,
                    n_keep,
                    n_remove,
                    n_other,
                    d_keep_other,
                    d_remove_other,
                    d_keep_remove
                );
            } else {
                // Untuk cluster yang tidak berubah, salin jarak dari matriks asli
                let orig_i = if i < remove_idx { i } else { i + 1 };
                let orig_j = if j < remove_idx { j } else { j + 1 };
                new_distances[i][j] = original_distances[orig_i][orig_j];
            }

            // Salin untuk menjaga simetri
            new_distances[j][i] = new_distances[i][j];
        }
        // Diagonal selalu 0
        new_distances[i][i] = 0.0;
    }

    // 6. Perbarui matriks jarak state
    state.distances = new_distances;
}
