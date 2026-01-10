use crate::models::{ config::KMeansConfig, result::{ ClusterPlot, ProcessedData } };

use crate::stats::core::*;

pub fn create_cluster_plot(
    data: &ProcessedData,
    config: &KMeansConfig
) -> Result<ClusterPlot, String> {
    if data.variables.len() < 2 {
        return Err("Data must have at least 2 variables to create a plot.".to_string());
    }

    let final_centers_result = generate_final_cluster_centers(data, config)?;

    let centers_matrix = convert_map_to_matrix(&final_centers_result.centers, &data.variables);

    let x_variable = data.variables[0].clone(); // Variabel pertama sebagai sumbu x
    let y_variable = data.variables[1].clone(); // Variabel kedua sebagai sumbu y
    let x_col_index = 0; // Indeks kolom untuk variabel x
    let y_col_index = 1; // Indeks kolom untuk variabel y

    let mut x_coords: Vec<f64> = Vec::with_capacity(data.data_matrix.len() + centers_matrix.len());
    let mut y_coords: Vec<f64> = Vec::with_capacity(data.data_matrix.len() + centers_matrix.len());
    let mut clusters: Vec<i32> = Vec::with_capacity(data.data_matrix.len() + centers_matrix.len());
    let mut is_center: Vec<bool> = Vec::with_capacity(
        data.data_matrix.len() + centers_matrix.len()
    );

    for case in &data.data_matrix {
        let x_val = case[x_col_index];
        let y_val = case[y_col_index];

        if !x_val.is_nan() && !y_val.is_nan() {
            x_coords.push(x_val); // Koordinat x = nilai variabel pertama
            y_coords.push(y_val); // Koordinat y = nilai variabel kedua

            let (cluster_index, _) = find_nearest_cluster(case, &centers_matrix);
            clusters.push((cluster_index + 1) as i32);
            is_center.push(false); // Tandai bukan center cluster
        }
    }

    for (i, center) in centers_matrix.iter().enumerate() {
        x_coords.push(center[x_col_index]); // Koordinat x pusat cluster
        y_coords.push(center[y_col_index]); // Koordinat y pusat cluster
        clusters.push((i + 1) as i32);
        is_center.push(true); // Tandai sebagai pusat cluster
    }

    let mut cluster_labels: Vec<String> = Vec::with_capacity(clusters.len());
    let num_points = x_coords.len() - centers_matrix.len();

    if let Some(case_names) = &data.case_names {
        for (idx, case) in data.data_matrix.iter().enumerate() {
            let x_val = case[x_col_index];
            let y_val = case[y_col_index];

            if !x_val.is_nan() && !y_val.is_nan() {
                if let Some(name) = case_names.get(idx) {
                    cluster_labels.push(name.clone());
                } else {
                    cluster_labels.push(format!("Case {}", idx + 1));
                }
            }
        }
    } else {
        for i in 0..num_points {
            cluster_labels.push(format!("Cluster {}", clusters[i]));
        }
    }

    for i in 0..centers_matrix.len() {
        cluster_labels.push(format!("Center {}", clusters[num_points + i]));
    }

    Ok(ClusterPlot {
        x: x_coords,
        x_label: x_variable,
        y: y_coords,
        y_label: y_variable,
        cluster: clusters,
        cluster_label: cluster_labels,
        cluster_center: is_center,
        note: None,
        interpretation: Some(
            "This plot visualizes the clusters using the first two variables as axes. Each point represents a case, colored by its assigned cluster. The larger points mark the final cluster centers. This visualization helps to assess the separation and cohesion of the formed clusters.".to_string()
        ),
    })
}
