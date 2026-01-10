use std::collections::HashMap;

use nalgebra::{ DMatrix, DVector };

use crate::models::data::{ DataRecord, DataValue };

/// Initialize weights and quantifications
pub fn initialize_weights_and_quantifications(
    category_values: &HashMap<(usize, usize), Vec<usize>>,
    dimensions: usize
) -> (HashMap<(usize, usize), Vec<f64>>, HashMap<(usize, usize, usize), f64>) {
    let mut variable_weights = HashMap::new();
    let mut category_quantifications = HashMap::new();

    for ((set_idx, var_idx), categories) in category_values {
        // Initialize variable weights
        let weights = vec![1.0 / (dimensions as f64); dimensions];
        variable_weights.insert((*set_idx, *var_idx), weights);

        // Initialize category quantifications
        for (i, &cat_val) in categories.iter().enumerate() {
            // Initial quantification: scale from 0 to 1 based on category order
            let init_quant = if categories.len() > 1 {
                (i as f64) / ((categories.len() - 1) as f64)
            } else {
                0.5
            };
            category_quantifications.insert((*set_idx, *var_idx, cat_val), init_quant);
        }
    }

    (variable_weights, category_quantifications)
}

/// Update quantifications for multiple nominal variables
pub fn update_multiple_nominal_quantifications(
    set_idx: usize,
    var_idx: usize,
    var_name: &str,
    var_data: &[DataRecord],
    object_scores: &[Vec<f64>],
    v_kj: &[Vec<f64>],
    category_quantifications: &mut HashMap<(usize, usize, usize), f64>,
    category_values: &HashMap<(usize, usize), Vec<usize>>
) {
    if let Some(categories) = category_values.get(&(set_idx, var_idx)) {
        for &cat_val in categories {
            // Count objects with this category
            let mut cat_objects = Vec::new();

            for (case_idx, record) in var_data.iter().enumerate() {
                if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                    if (*num as usize) == cat_val {
                        cat_objects.push(case_idx);
                    }
                }
            }

            if cat_objects.is_empty() {
                continue;
            }

            // Calculate new quantification
            let dimensions = object_scores[0].len();
            let mut new_quant = 0.0;
            let n = cat_objects.len() as f64;

            for &case_idx in &cat_objects {
                for dim in 0..dimensions {
                    new_quant += object_scores[case_idx][dim] - v_kj[case_idx][dim];
                }
            }

            new_quant /= n;
            category_quantifications.insert((set_idx, var_idx, cat_val), new_quant);
        }
    }
}

/// Update quantifications for single nominal variables
pub fn update_single_nominal_quantifications(
    set_idx: usize,
    var_idx: usize,
    var_name: &str,
    var_data: &[DataRecord],
    object_scores: &[Vec<f64>],
    v_kj: &[Vec<f64>],
    category_quantifications: &mut HashMap<(usize, usize, usize), f64>,
    variable_weights: &mut HashMap<(usize, usize), Vec<f64>>,
    category_values: &HashMap<(usize, usize), Vec<usize>>
) {
    let dimensions = object_scores[0].len();
    if let Some(categories) = category_values.get(&(set_idx, var_idx)) {
        // Create indicator matrix
        let mut g_matrix = DMatrix::zeros(var_data.len(), categories.len());
        let mut cat_frequencies = vec![0; categories.len()];

        // Fill indicator matrix and count frequencies
        for (case_idx, record) in var_data.iter().enumerate() {
            if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                let cat_val = *num as usize;
                if let Some(cat_index) = categories.iter().position(|&c| c == cat_val) {
                    g_matrix[(case_idx, cat_index)] = 1.0;
                    cat_frequencies[cat_index] += 1;
                }
            }
        }

        // Calculate X - V_kj
        let mut x_minus_v = DMatrix::zeros(var_data.len(), dimensions);
        for (case_idx, _record) in var_data.iter().enumerate() {
            for dim in 0..dimensions {
                x_minus_v[(case_idx, dim)] = object_scores[case_idx][dim] - v_kj[case_idx][dim];
            }
        }

        // Calculate category quantifications (unconstrained)
        let g_transpose = g_matrix.transpose();
        let g_t_g = &g_transpose * &g_matrix;
        let g_t_x = &g_transpose * &x_minus_v;

        let y_new = match g_t_g.try_inverse() {
            Some(inv) => inv * g_t_x,
            None => {
                // Fallback if matrix is singular
                DMatrix::from_fn(categories.len(), dimensions, |i, j| {
                    let freq = cat_frequencies[i] as f64;
                    if freq > 0.0 {
                        let mut sum = 0.0;
                        for (case_idx, record) in var_data.iter().enumerate() {
                            if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                                if (*num as usize) == categories[i] {
                                    sum += x_minus_v[(case_idx, j)];
                                }
                            }
                        }
                        sum / freq
                    } else {
                        0.0
                    }
                })
            }
        };

        // Update single quantifications
        let mut y_current = DVector::zeros(categories.len());
        for (i, &cat_val) in categories.iter().enumerate() {
            if let Some(&quant) = category_quantifications.get(&(set_idx, var_idx, cat_val)) {
                y_current[i] = quant;
            }
        }

        // Calculate a_j (variable weights)
        let mut a_j = vec![0.0; dimensions];
        for j in 0..dimensions {
            let mut sum = 0.0;
            let mut weight_sum = 0.0;

            for i in 0..categories.len() {
                let freq = cat_frequencies[i] as f64;
                sum += y_new[(i, j)] * y_current[i] * freq;
                weight_sum += y_current[i].powi(2) * freq;
            }

            if weight_sum > 0.0 {
                a_j[j] = sum / weight_sum;
            }
        }

        // Update variable weights
        variable_weights.insert((set_idx, var_idx), a_j);

        // Update category quantifications
        for (i, &cat_val) in categories.iter().enumerate() {
            category_quantifications.insert((set_idx, var_idx, cat_val), y_new[(i, 0)]);
        }
    }
}

/// Update quantifications for ordinal variables using monotonic regression
pub fn update_ordinal_quantifications(
    set_idx: usize,
    var_idx: usize,
    var_name: &str,
    var_data: &[DataRecord],
    object_scores: &[Vec<f64>],
    v_kj: &[Vec<f64>],
    category_quantifications: &mut HashMap<(usize, usize, usize), f64>,
    variable_weights: &mut HashMap<(usize, usize), Vec<f64>>,
    category_values: &HashMap<(usize, usize), Vec<usize>>
) {
    // First, calculate like single nominal
    update_single_nominal_quantifications(
        set_idx,
        var_idx,
        var_name,
        var_data,
        object_scores,
        v_kj,
        category_quantifications,
        variable_weights,
        category_values
    );

    // Then apply monotonic regression
    if let Some(categories) = category_values.get(&(set_idx, var_idx)) {
        let mut cat_quants: Vec<(usize, f64)> = Vec::new();
        let mut cat_frequencies = HashMap::new();

        // Get current quantifications and calculate frequencies
        for &cat_val in categories {
            if let Some(&quant) = category_quantifications.get(&(set_idx, var_idx, cat_val)) {
                cat_quants.push((cat_val, quant));

                // Count frequency
                let frequency = var_data
                    .iter()
                    .filter(|record| {
                        if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                            (*num as usize) == cat_val
                        } else {
                            false
                        }
                    })
                    .count();

                cat_frequencies.insert(cat_val, frequency);
            }
        }

        // Sort by category value
        cat_quants.sort_by(|a, b| a.0.cmp(&b.0));

        // Apply monotonic regression
        let values: Vec<f64> = cat_quants
            .iter()
            .map(|(_, q)| *q)
            .collect();
        let weights: Vec<f64> = cat_quants
            .iter()
            .map(|(c, _)| *cat_frequencies.get(c).unwrap_or(&0) as f64)
            .collect();

        let monotonic_quants = monotonic_regression(&values, &weights);

        // Normalize
        let mut sum_sq = 0.0;
        let mut sum_weight = 0.0;

        for (i, &cat_val) in categories.iter().enumerate() {
            if i < monotonic_quants.len() {
                let weight = *cat_frequencies.get(&cat_val).unwrap_or(&0) as f64;
                sum_sq += monotonic_quants[i].powi(2) * weight;
                sum_weight += weight;
            }
        }

        let norm_factor = (sum_weight / sum_sq).sqrt();

        // Update category quantifications
        for (i, &cat_val) in categories.iter().enumerate() {
            if i < monotonic_quants.len() {
                category_quantifications.insert(
                    (set_idx, var_idx, cat_val),
                    monotonic_quants[i] * norm_factor
                );
            }
        }
    }
}

/// Update quantifications for numeric variables
pub fn update_numeric_quantifications(
    set_idx: usize,
    var_idx: usize,
    category_values: &HashMap<(usize, usize), Vec<usize>>,
    category_quantifications: &mut HashMap<(usize, usize, usize), f64>
) {
    if let Some(categories) = category_values.get(&(set_idx, var_idx)) {
        if categories.is_empty() {
            return;
        }

        // For numeric variables, enforce linear relationship with category values
        let min_cat = *categories.iter().min().unwrap_or(&1);
        let max_cat = *categories.iter().max().unwrap_or(&1);

        if min_cat == max_cat {
            // Only one category, set to middle value
            for &cat_val in categories {
                category_quantifications.insert((set_idx, var_idx, cat_val), 0.0);
            }
            return;
        }

        // Linear transformation from min_cat..max_cat to -1..1
        for &cat_val in categories {
            let normalized =
                (2.0 * ((cat_val as f64) - (min_cat as f64))) /
                    ((max_cat as f64) - (min_cat as f64)) -
                1.0;
            category_quantifications.insert((set_idx, var_idx, cat_val), normalized);
        }
    }
}

/// Monotonic regression implementation (optimized)
pub fn monotonic_regression(values: &[f64], weights: &[f64]) -> Vec<f64> {
    if values.is_empty() {
        return Vec::new();
    }

    let n = values.len();
    let mut result = values.to_vec();
    let mut active = true;

    while active {
        active = false;

        // Up pass
        let mut i = 0;
        while i < n - 1 {
            if result[i] > result[i + 1] {
                // Find violating block
                let start = i;
                let mut end = i + 1;

                let mut block_sum = weights[start] * result[start] + weights[end] * result[end];
                let mut block_weight = weights[start] + weights[end];

                while end < n - 1 && result[end] > result[end + 1] {
                    end += 1;
                    block_sum += weights[end] * result[end];
                    block_weight += weights[end];
                }

                // Calculate average
                let block_avg = if block_weight > 0.0 { block_sum / block_weight } else { 0.0 };

                // Update block
                for j in start..=end {
                    result[j] = block_avg;
                }

                i = end;
                active = true;
            }
            i += 1;
        }

        // Down pass
        let mut i = n - 1;
        while i > 0 {
            if result[i - 1] > result[i] {
                // Find violating block
                let end = i;
                let mut start = i - 1;

                let mut block_sum = weights[end] * result[end] + weights[start] * result[start];
                let mut block_weight = weights[end] + weights[start];

                while start > 0 && result[start - 1] > result[start] {
                    start -= 1;
                    block_sum += weights[start] * result[start];
                    block_weight += weights[start];
                }

                // Calculate average
                let block_avg = if block_weight > 0.0 { block_sum / block_weight } else { 0.0 };

                // Update block
                for j in start..=end {
                    result[j] = block_avg;
                }

                i = start;
                active = true;
            }
            i -= 1;
        }
    }

    result
}
