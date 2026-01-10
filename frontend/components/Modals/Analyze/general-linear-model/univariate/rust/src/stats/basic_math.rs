use statrs::statistics::Statistics;
use crate::models::result::StatsEntry;

pub fn calculate_median(group: &[f64]) -> f64 {
    if group.is_empty() {
        return 0.0;
    }

    let mut sorted_group = group.to_vec();
    sorted_group.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

    if sorted_group.len() % 2 == 1 {
        sorted_group[sorted_group.len() / 2]
    } else {
        (sorted_group[sorted_group.len() / 2 - 1] + sorted_group[sorted_group.len() / 2]) / 2.0
    }
}

pub fn calculate_mean(values: &[f64]) -> f64 {
    if values.is_empty() {
        return 0.0;
    }
    values.mean()
}

pub fn calculate_variance(values: &[f64], known_mean: Option<f64>) -> f64 {
    let n = values.len();
    if n < 2 {
        return 0.0;
    }

    let mean = known_mean.unwrap_or_else(|| values.mean());
    values
        .iter()
        .map(|x| (x - mean).powi(2))
        .sum::<f64>() / (n as f64)
}

pub fn calculate_stats_for_values(values_with_weights: &[(f64, f64)]) -> StatsEntry {
    let valid_data: Vec<(f64, f64)> = values_with_weights
        .iter()
        .filter(|(_, w)| *w > 1e-9)
        .cloned()
        .collect();
    let n_effective = valid_data.len();

    if n_effective == 0 {
        return StatsEntry { mean: 0.0, std_deviation: 0.0, n: 0 };
    }

    let sum_of_weights: f64 = valid_data
        .iter()
        .map(|(_, w)| *w)
        .sum();

    if sum_of_weights.abs() < 1e-9 {
        return StatsEntry { mean: 0.0, std_deviation: 0.0, n: n_effective };
    }

    let mean: f64 =
        valid_data
            .iter()
            .map(|(v, w)| v * w)
            .sum::<f64>() / sum_of_weights;

    let std_deviation: f64 = if n_effective > 1 {
        let variance_numerator: f64 = valid_data
            .iter()
            .map(|(v, w)| *w * (v - mean).powi(2))
            .sum();

        let variance_denominator =
            (sum_of_weights * ((n_effective - 1) as f64)) / (n_effective as f64);

        if variance_denominator.abs() > 1e-9 {
            (variance_numerator / variance_denominator).sqrt()
        } else {
            if variance_numerator.abs() < 1e-9 { 0.0 } else { f64::NAN }
        }
    } else {
        0.0
    };

    StatsEntry {
        mean,
        std_deviation,
        n: n_effective,
    }
}
