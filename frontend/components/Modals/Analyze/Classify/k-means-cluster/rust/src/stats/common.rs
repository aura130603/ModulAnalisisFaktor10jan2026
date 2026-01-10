use std::collections::HashMap;

use statrs::distribution::{ FisherSnedecor, ContinuousCDF };

pub fn mean(values: &[f64]) -> f64 {
    if values.is_empty() {
        return 0.0;
    }

    let valid_values: Vec<f64> = values
        .iter()
        .filter(|x| !x.is_nan())
        .copied()
        .collect();
    if valid_values.is_empty() {
        return 0.0;
    }

    valid_values.iter().sum::<f64>() / (valid_values.len() as f64)
}

pub fn sum_squared_deviations(values: &[f64], from_value: f64) -> f64 {
    values
        .iter()
        .filter(|x| !x.is_nan())
        .map(|x| (x - from_value).powi(2))
        .sum()
}

pub fn f_test_p_value(f_stat: f64, df1: i32, df2: i32) -> f64 {
    if df1 <= 0 || df2 <= 0 || f_stat <= 0.0 {
        return 1.0;
    }

    match FisherSnedecor::new(df1 as f64, df2 as f64) {
        Ok(dist) => 1.0 - dist.cdf(f_stat),
        Err(_) => 0.5,
    }
}

pub fn euclidean_distance(a: &[f64], b: &[f64]) -> f64 {
    let mut sum_sq = 0.0;
    let mut valid_pairs = 0;

    for (x, y) in a.iter().zip(b.iter()) {
        if !x.is_nan() && !y.is_nan() {
            sum_sq += (x - y).powi(2);
            valid_pairs += 1;
        }
    }

    if valid_pairs == 0 {
        return f64::MAX;
    }

    sum_sq.sqrt()
}

pub fn find_nearest_cluster(point: &[f64], centers: &[Vec<f64>]) -> (usize, f64) {
    centers
        .iter()
        .enumerate()
        .map(|(i, center)| (i, euclidean_distance(point, center)))
        .min_by(|a, b| a.1.partial_cmp(&b.1).unwrap())
        .unwrap_or((0, f64::MAX))
}

pub fn find_second_closest_cluster(point: &[f64], centers: &[Vec<f64>], closest: usize) -> usize {
    centers
        .iter()
        .enumerate()
        .filter(|(i, _)| *i != closest)
        .map(|(i, center)| (i, euclidean_distance(point, center)))
        .min_by(|a, b| a.1.partial_cmp(&b.1).unwrap())
        .map(|(i, _)| i)
        .unwrap_or_else(|| if closest == 0 { 1 } else { 0 })
}

pub fn min_distance_between_centers(centers: &[Vec<f64>]) -> (f64, usize, usize) {
    let mut min_distance = f64::MAX;
    let mut min_i = 0;
    let mut min_j = 1;

    for i in 0..centers.len() {
        for j in i + 1..centers.len() {
            let dist = euclidean_distance(&centers[i], &centers[j]);
            if dist != f64::MAX && dist < min_distance {
                min_distance = dist;
                min_i = i;
                min_j = j;
            }
        }
    }

    if min_distance == f64::MAX {
        min_distance = 1.0;
    }

    (min_distance, min_i, min_j)
}

pub fn min_distance_from_cluster(centers: &[Vec<f64>], cluster_idx: usize) -> f64 {
    let mut min_distance = f64::MAX;

    for (i, center) in centers.iter().enumerate() {
        if i != cluster_idx {
            let dist = euclidean_distance(&centers[cluster_idx], center);
            // Skip f64::MAX values dari euclidean_distance
            if dist != f64::MAX && dist < min_distance {
                min_distance = dist;
            }
        }
    }

    // Jika tidak ada distance valid, gunakan nilai default
    if min_distance == f64::MAX {
        min_distance = 1.0;
    }

    min_distance
}

pub fn convert_map_to_matrix(
    centers_map: &HashMap<String, Vec<f64>>,
    variables: &[String]
) -> Vec<Vec<f64>> {
    let num_clusters = centers_map
        .values()
        .next()
        .map_or(0, |v| v.len());
    if num_clusters == 0 {
        return Vec::new();
    }

    let mut matrix = vec![vec![0.0; variables.len()]; num_clusters];

    for (var_idx, var) in variables.iter().enumerate() {
        if let Some(values) = centers_map.get(var) {
            for (cluster_idx, value) in values.iter().enumerate().take(matrix.len()) {
                matrix[cluster_idx][var_idx] = *value;
            }
        }
    }

    matrix
}
