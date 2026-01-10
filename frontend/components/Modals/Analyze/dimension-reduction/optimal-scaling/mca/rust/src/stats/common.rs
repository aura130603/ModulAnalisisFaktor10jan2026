use std::collections::{ HashMap, HashSet };

use nalgebra::DVector;

use crate::models::data::{ AnalysisData, DataRecord, DataValue };

/// Helper function to check if a value is missing
pub fn is_missing(value: &DataValue) -> bool {
    match value {
        DataValue::Number(val) => *val < 1.0,
        DataValue::Null => true,
        _ => false,
    }
}

/// Parse variable and weight from "variable_name (weight)" format
pub fn parse_variable_weight(var_str: &str) -> (String, f64) {
    if let Some(paren_pos) = var_str.find('(') {
        let variable = var_str[0..paren_pos].trim().to_string();
        let weight_str = var_str[paren_pos..].trim_matches(|c| (c == '(' || c == ')' || c == ' '));

        if let Ok(weight) = weight_str.parse::<f64>() {
            return (variable, weight);
        }
    }

    // Default if no weight specified or parsing failed
    (var_str.trim().to_string(), 1.0)
}

/// Parse discretization settings from variable strings
pub fn parse_discretization_setting(var_str: &str) -> (String, String, Option<u8>, Option<bool>) {
    if let Some(paren_pos) = var_str.find('(') {
        let variable = var_str[0..paren_pos].trim().to_string();
        let settings_str = var_str[paren_pos..].trim_matches(
            |c| (c == '(' || c == ')' || c == ' ')
        );

        let parts: Vec<&str> = settings_str.split_whitespace().collect();

        if parts.is_empty() {
            // Default if no settings
            return (variable, "Unspecified".to_string(), None, None);
        }

        let method = parts[0].to_string();

        if method == "Grouping" {
            if parts.len() == 2 {
                // Format: "age (Grouping 9)" - Equal Intervals
                if let Ok(value) = parts[1].parse::<u8>() {
                    return (variable, method, Some(value), None);
                }
            } else if parts.len() >= 3 {
                // Format: "age (Grouping Normal 7)" or "age (Grouping Uniform 7)"
                let distribution = match parts[1] {
                    "Normal" => true, // Normal distribution
                    "Uniform" => false, // Uniform distribution
                    _ => true, // Default to Normal
                };

                if let Ok(value) = parts[2].parse::<u8>() {
                    return (variable, method, Some(value), Some(distribution));
                }
            }
        }

        return (variable, method, None, None);
    }

    // Default if no settings
    (var_str.trim().to_string(), "Unspecified".to_string(), None, None)
}

/// Parse missing value handling settings
pub fn parse_missing_value_strategy(var_str: &str) -> (String, String) {
    if let Some(paren_pos) = var_str.find('(') {
        let variable = var_str[0..paren_pos].trim().to_string();
        let strategy_str = var_str[paren_pos..].trim_matches(
            |c| (c == '(' || c == ')' || c == ' ')
        );

        return (variable, strategy_str.to_string());
    }

    // No strategy specified, return the variable name and empty strategy
    (var_str.trim().to_string(), "".to_string())
}

pub fn calculate_mode(dataset: &[DataRecord], var_name: &str) -> Option<DataValue> {
    let mut value_counts: HashMap<String, (usize, DataValue)> = HashMap::new();

    for record in dataset {
        if let Some(value) = record.values.get(var_name) {
            // Skip missing values
            if !is_missing(value) {
                // Create a string key for the HashMap based on the data type
                let key = match value {
                    DataValue::Number(num) => format!("num_{}", num),
                    DataValue::Text(text) => format!("text_{}", text),
                    DataValue::Boolean(b) => format!("bool_{}", b),
                    DataValue::Null => {
                        continue;
                    } // Skip null values
                };

                // Update the count for this value
                let entry = value_counts.entry(key).or_insert((0, value.clone()));
                entry.0 += 1;
            }
        }
    }

    // Return None if no valid values found
    if value_counts.is_empty() {
        return None;
    }

    // Find the value with the highest count
    value_counts
        .into_iter()
        .max_by_key(|(_, (count, _))| *count)
        .map(|(_, (_, value))| value)
}

/// Find the maximum category value for a variable
pub fn find_max_category(dataset: &[DataRecord], var_name: &str) -> f64 {
    let mut max_cat = 0.0;

    for record in dataset {
        if let Some(DataValue::Number(val)) = record.values.get(var_name) {
            if *val >= 1.0 && *val > max_cat {
                max_cat = *val;
            }
        }
    }

    max_cat
}

/// Collect all valid categories for a variable
pub fn collect_valid_categories(dataset: &[DataRecord], var_name: &str) -> Vec<DataValue> {
    let mut valid_categories = Vec::new();
    let mut seen_categories = HashSet::new();

    for record in dataset {
        if let Some(value) = record.values.get(var_name) {
            if !is_missing(value) {
                // Use a HashSet to track seen categories for deduplication
                let key = match value {
                    DataValue::Number(num) => format!("num_{}", num),
                    DataValue::Text(text) => format!("text_{}", text),
                    DataValue::Boolean(b) => format!("bool_{}", b),
                    DataValue::Null => {
                        continue;
                    }
                };

                if !seen_categories.contains(&key) {
                    seen_categories.insert(key);
                    valid_categories.push(value.clone());
                }
            }
        }
    }

    valid_categories
}

/// Get all variable names from the data
pub fn get_all_variables(data: &AnalysisData) -> Vec<String> {
    let mut variables = HashSet::new();

    for dataset in &data.analysis_data {
        if let Some(record) = dataset.first() {
            for var_name in record.values.keys() {
                variables.insert(var_name.clone());
            }
        }
    }

    variables.into_iter().collect()
}

/// Approximation of the normal quantile function (inverse CDF)
///
/// This function implements the Acklam's approximation which provides
/// high accuracy for the inverse of the normal cumulative distribution function.
///
/// # Arguments
///
/// * `p` - Probability value between 0 and 1
///
/// # Returns
///
/// The corresponding quantile of the standard normal distribution
pub fn normal_quantile(p: f64) -> f64 {
    // Handle edge cases
    if p <= 0.0 {
        return -8.0; // Better lower bound for numerical stability
    }
    if p >= 1.0 {
        return 8.0; // Better upper bound for numerical stability
    }

    // For numerical stability, handle values very close to 0 or 1
    if p < 1e-15 {
        return -8.0;
    }
    if p > 1.0 - 1e-15 {
        return 8.0;
    }

    // Apply symmetry of the normal distribution
    let q: f64;
    let r: f64;

    if p <= 0.5 {
        q = p;
        r = -1.0;
    } else {
        q = 1.0 - p;
        r = 1.0;
    }

    // Constants for Acklam's approximation
    // These provide a very accurate approximation
    let a = [
        -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2,
        -3.066479806614716e1, 2.506628277459239,
    ];

    let b = [
        -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1,
        -1.328068155288572e1, 1.0,
    ];

    // Compute the quantile
    let t = (-2.0 * q.ln()).sqrt();

    let num = a[0] + t * (a[1] + t * (a[2] + t * (a[3] + t * (a[4] + t * a[5]))));
    let den = b[0] + t * (b[1] + t * (b[2] + t * (b[3] + t * (b[4] + t * b[5]))));

    r * (t - num / den)
}

/// Calculate correlation between two vectors
pub fn calculate_correlation_vectors(
    vec1: &DVector<f64>,
    vec2: &DVector<f64>
) -> Result<f64, String> {
    if vec1.len() != vec2.len() || vec1.len() < 2 {
        return Err("Vectors must have the same length and at least 2 elements".to_string());
    }

    let n = vec1.len();

    // Calculate means
    let mean1 = vec1.sum() / (n as f64);
    let mean2 = vec2.sum() / (n as f64);

    // Calculate covariance and variances
    let mut cov = 0.0;
    let mut var1 = 0.0;
    let mut var2 = 0.0;

    for i in 0..n {
        let diff1 = vec1[i] - mean1;
        let diff2 = vec2[i] - mean2;

        cov += diff1 * diff2;
        var1 += diff1 * diff1;
        var2 += diff2 * diff2;
    }

    // Calculate Pearson correlation
    if var1 > 0.0 && var2 > 0.0 {
        Ok(cov / (var1.sqrt() * var2.sqrt()))
    } else {
        Ok(0.0)
    }
}

/// Calculate correlation between two variables
pub fn calculate_correlation(
    dataset: &[DataRecord],
    var1: &str,
    var2: &str,
    transformed: bool
) -> Result<f64, String> {
    let mut values1 = Vec::new();
    let mut values2 = Vec::new();

    for record in dataset {
        if let (Some(val1), Some(val2)) = (record.values.get(var1), record.values.get(var2)) {
            if let (DataValue::Number(num1), DataValue::Number(num2)) = (val1, val2) {
                if !is_missing(val1) && !is_missing(val2) {
                    values1.push(*num1);
                    values2.push(*num2);
                }
            }
        }
    }

    if values1.len() < 2 {
        return Ok(0.0); // Not enough data
    }

    // Calculate means
    let mean1: f64 = values1.iter().sum::<f64>() / (values1.len() as f64);
    let mean2: f64 = values2.iter().sum::<f64>() / (values2.len() as f64);

    // Calculate covariance and variances
    let mut cov = 0.0;
    let mut var1 = 0.0;
    let mut var2 = 0.0;

    for i in 0..values1.len() {
        let diff1 = values1[i] - mean1;
        let diff2 = values2[i] - mean2;

        cov += diff1 * diff2;
        var1 += diff1 * diff1;
        var2 += diff2 * diff2;
    }

    // Calculate Pearson correlation
    if var1 > 0.0 && var2 > 0.0 {
        Ok(cov / (var1.sqrt() * var2.sqrt()))
    } else {
        Ok(0.0)
    }
}
