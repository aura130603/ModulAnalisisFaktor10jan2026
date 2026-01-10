use crate::models::{ config::ROCCurveConfig, data::{ AnalysisData, DataValue } };

// Data extraction function
pub fn extract_values(
    data: &AnalysisData,
    config: &ROCCurveConfig,
    test_target_var: &str
) -> Result<(Vec<f64>, Vec<f64>), String> {
    if config.main.state_target_variable.is_none() {
        return Err("State target variable is not specified".to_string());
    }
    let state_target_var = config.main.state_target_variable.as_ref().unwrap();

    if config.main.state_var_val.is_none() {
        return Err("State variable value is not specified".to_string());
    }
    let state_var_val = config.main.state_var_val.as_ref().unwrap();

    let mut positive_values = Vec::new();
    let mut negative_values = Vec::new();

    if data.state_data.is_empty() {
        return Err("No state data provided".to_string());
    }

    let state_dataset = &data.state_data[0];

    for test_dataset in &data.test_data {
        if test_dataset.len() != state_dataset.len() {
            continue;
        }

        for case_idx in 0..state_dataset.len() {
            let state_record = &state_dataset[case_idx];

            if let Some(state_value) = state_record.values.get(state_target_var) {
                let is_positive = match state_value {
                    DataValue::Text(val) => val == state_var_val,
                    DataValue::Number(val) =>
                        state_var_val
                            .parse::<f64>()
                            .map(|p| p == *val)
                            .unwrap_or(false),
                    DataValue::Boolean(val) => {
                        if state_var_val == "true" {
                            *val
                        } else if state_var_val == "false" {
                            !*val
                        } else {
                            false
                        }
                    }
                    DataValue::Null => false,
                };

                let test_record = &test_dataset[case_idx];

                if let Some(DataValue::Number(val)) = test_record.values.get(test_target_var) {
                    if is_positive {
                        positive_values.push(*val);
                    } else {
                        negative_values.push(*val);
                    }
                }
            }
        }
    }

    if positive_values.is_empty() || negative_values.is_empty() {
        return Err(
            format!(
                "Insufficient positive ({}) or negative ({}) values found for test variable '{}'",
                positive_values.len(),
                negative_values.len(),
                test_target_var
            )
        );
    }

    Ok((positive_values, negative_values))
}

pub fn generate_cutoffs(positive_values: &[f64], negative_values: &[f64]) -> Vec<f64> {
    let mut all_values = positive_values.to_vec();
    all_values.extend_from_slice(negative_values);
    all_values.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

    let mut cutoffs = Vec::new();

    if let Some(min_val) = all_values.first() {
        cutoffs.push(min_val - 1.0);
    }

    let mut unique_values = Vec::new();
    for &value in all_values.iter() {
        if !unique_values.contains(&value) {
            unique_values.push(value);
        }
    }
    unique_values.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

    for i in 0..unique_values.len().saturating_sub(1) {
        cutoffs.push((unique_values[i] + unique_values[i + 1]) / 2.0);
    }

    if let Some(max_val) = unique_values.last() {
        cutoffs.push(max_val + 1.0);
    }

    cutoffs
}

// Statistical utility functions
pub fn calculate_nonparametric_std_error(
    positive_values: &[f64],
    negative_values: &[f64],
    auc: f64,
    larger_is_positive: bool
) -> f64 {
    let m = positive_values.len();
    let n = negative_values.len();

    let mut q1_sum = 0.0;
    for i in 0..m {
        let mut count = 0.0;
        for j in 0..n {
            if larger_is_positive {
                if positive_values[i] > negative_values[j] {
                    count += 1.0;
                } else if positive_values[i] == negative_values[j] {
                    count += 0.5;
                }
            } else {
                if positive_values[i] < negative_values[j] {
                    count += 1.0;
                } else if positive_values[i] == negative_values[j] {
                    count += 0.5;
                }
            }
        }
        q1_sum += (count / (n as f64) - auc).powi(2);
    }
    let q1 = q1_sum / ((m - 1) as f64);

    let mut q2_sum = 0.0;
    for j in 0..n {
        let mut count = 0.0;
        for i in 0..m {
            if larger_is_positive {
                if positive_values[i] > negative_values[j] {
                    count += 1.0;
                } else if positive_values[i] == negative_values[j] {
                    count += 0.5;
                }
            } else {
                if positive_values[i] < negative_values[j] {
                    count += 1.0;
                } else if positive_values[i] == negative_values[j] {
                    count += 0.5;
                }
            }
        }
        q2_sum += (count / (m as f64) - auc).powi(2);
    }
    let q2 = q2_sum / ((n - 1) as f64);

    ((auc * (1.0 - auc) + ((m - 1) as f64) * q1 + ((n - 1) as f64) * q2) / ((m * n) as f64)).sqrt()
}

pub fn calculate_binegexp_std_error(
    positive_values: &[f64],
    negative_values: &[f64],
    auc: f64
) -> f64 {
    let m = positive_values.len();
    let n = negative_values.len();

    if m != n {
        return calculate_nonparametric_std_error(positive_values, negative_values, auc, true);
    }

    let q3 = auc / (2.0 - auc);
    let q4 = (2.0 * auc.powi(2)) / (1.0 + auc);

    (
        (auc * (1.0 - auc) +
            ((m - 1) as f64) * (q3 - auc.powi(2)) +
            ((n - 1) as f64) * (q4 - auc.powi(2))) /
        ((m * n) as f64)
    ).sqrt()
}

pub fn normal_cdf(x: f64) -> f64 {
    0.5 * (1.0 + erf(x / (2.0_f64).sqrt()))
}

pub fn erf(x: f64) -> f64 {
    let sign = if x >= 0.0 { 1.0 } else { -1.0 };
    let x = x.abs();

    let a1 = 0.254829592;
    let a2 = -0.284496736;
    let a3 = 1.421413741;
    let a4 = -1.453152027;
    let a5 = 1.061405429;
    let p = 0.3275911;

    let t = 1.0 / (1.0 + p * x);
    let y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * (-x * x).exp();

    sign * y
}

pub fn normal_quantile(p: f64) -> f64 {
    if p <= 0.0 {
        return f64::NEG_INFINITY;
    }
    if p >= 1.0 {
        return f64::INFINITY;
    }

    if p == 0.5 {
        return 0.0;
    }

    let q = if p > 0.5 { 1.0 - p } else { p };

    let t = (-2.0 * q.ln()).sqrt();

    let c0 = 2.515517;
    let c1 = 0.802853;
    let c2 = 0.010328;
    let d1 = 1.432788;
    let d2 = 0.189269;
    let d3 = 0.001308;

    let x = t - (c0 + c1 * t + c2 * t.powi(2)) / (1.0 + d1 * t + d2 * t.powi(2) + d3 * t.powi(3));

    if p > 0.5 {
        x
    } else {
        -x
    }
}

// Analysis functions
pub fn calculate_confusion_matrix(
    positive_values: &[f64],
    negative_values: &[f64],
    cutoff: f64,
    config: &ROCCurveConfig
) -> (usize, usize, usize, usize) {
    let mut true_positives = 0;
    let mut false_negatives = 0;
    let mut true_negatives = 0;
    let mut false_positives = 0;

    let larger_is_positive = config.options.larger_test;
    let exclude_cutoff = config.options.exclude_cutoff;

    let include_equal = if exclude_cutoff { false } else { true };

    for &val in positive_values {
        let is_positive = if larger_is_positive {
            if val > cutoff { true } else if val == cutoff { include_equal } else { false }
        } else {
            if val < cutoff { true } else if val == cutoff { include_equal } else { false }
        };

        if is_positive {
            true_positives += 1;
        } else {
            false_negatives += 1;
        }
    }

    for &val in negative_values {
        let is_positive = if larger_is_positive {
            if val > cutoff { true } else if val == cutoff { include_equal } else { false }
        } else {
            if val < cutoff { true } else if val == cutoff { include_equal } else { false }
        };

        if is_positive {
            false_positives += 1;
        } else {
            true_negatives += 1;
        }
    }

    (true_positives, false_negatives, true_negatives, false_positives)
}
