use std::collections::HashMap;

use crate::models::{ config::KMeansConfig, result::{ InitialClusterCenters, ProcessedData } };

use super::core::*;

pub fn initialize_clusters(
    data: &ProcessedData,
    config: &KMeansConfig
) -> Result<InitialClusterCenters, String> {
    let num_clusters = config.main.cluster as usize;

    let mut initial_centers: Vec<Vec<f64>>;

    let valid_cases: Vec<&Vec<f64>> = data.data_matrix
        .iter()
        .filter(|case| case.iter().any(|&val| !val.is_nan()))
        .collect();

    if valid_cases.len() < num_clusters {
        return Err(
            format!(
                "Not enough valid data points ({}) for requested clusters ({})",
                valid_cases.len(),
                num_clusters
            )
        );
    }

    if !config.options.initial_cluster {
        initial_centers = valid_cases
            .iter()
            .take(num_clusters)
            .map(|&case| case.clone())
            .collect();
    } else {
        initial_centers = valid_cases
            .iter()
            .take(num_clusters)
            .map(|&case| case.clone())
            .collect();
        for k in num_clusters..valid_cases.len() {
            let x_k = valid_cases[k];

            // Cari pusat cluster terdekat dan jarak minimum
            let (closest, min_dist) = find_nearest_cluster(x_k, &initial_centers);
            // Cari pusat cluster kedua terdekat
            let second_closest = find_second_closest_cluster(x_k, &initial_centers, closest);

            let (min_center_dist, m, n) = min_distance_between_centers(&initial_centers);

            // Kondisi untuk menentukan apakah x_k harus menjadi pusat cluster baru
            if min_dist > min_center_dist {
                // Kondisi 1: Jika jarak titik x_k ke pusat terdekatnya lebih besar dari jarak
                // minimum antar pusat, ganti salah satu dari dua pusat terdekat
                // satu sama lain (m atau n) dengan x_k.
                if
                    euclidean_distance(x_k, &initial_centers[m]) >
                    euclidean_distance(x_k, &initial_centers[n])
                {
                    initial_centers[m] = x_k.clone(); // Ganti pusat m dengan x_k
                } else {
                    initial_centers[n] = x_k.clone(); // Ganti pusat n dengan x_k
                }
            } else {
                // Kondisi 2: Jika tidak memenuhi kondisi pertama, pertimbangkan untuk mengganti
                // pusat terdekat dengan x_k jika x_k cukup jauh dari pusat-pusat lainnya.
                let dist_to_second = euclidean_distance(x_k, &initial_centers[second_closest]);
                let min_dist_from_closest = min_distance_from_cluster(&initial_centers, closest);

                if dist_to_second > min_dist_from_closest {
                    initial_centers[closest] = x_k.clone(); // Ganti pusat terdekat dengan x_k
                }
            }
        }
    }

    let mut centers_map = HashMap::new();
    for (i, var) in data.variables.iter().enumerate() {
        let var_values: Vec<f64> = initial_centers
            .iter()
            .map(|center| {
                let val = center[i];

                if val.is_nan() {
                    let valid_values: Vec<f64> = data.data_matrix
                        .iter()
                        .map(|row| row[i])
                        .filter(|x| !x.is_nan())
                        .collect();
                    if valid_values.is_empty() {
                        0.0
                    } else {
                        mean(&valid_values)
                    }
                } else {
                    val
                }
            })
            .collect();
        centers_map.insert(var.clone(), var_values);
    }

    Ok(InitialClusterCenters {
        centers: centers_map,
        note: None,
        interpretation: Some(
            "This table shows the initial positions of the cluster centers before the iterative optimization process begins. These centers are selected based on the chosen initialization strategy. The quality of these initial centers can influence the final clustering outcome and convergence speed.".to_string()
        ),
    })
}
