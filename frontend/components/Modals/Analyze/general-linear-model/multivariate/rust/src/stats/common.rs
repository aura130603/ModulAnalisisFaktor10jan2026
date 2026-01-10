use statrs::distribution::{ ContinuousCDF, FisherSnedecor, StudentsT, ChiSquared, Gamma };
use statrs::function::gamma::gamma;
use nalgebra::{ DMatrix, DVector };

use std::collections::{ HashMap, HashSet };
use crate::models::config::ContrastMethod;
use crate::models::{
    data::{ AnalysisData, DataRecord, DataValue },
    config::MultivariateConfig,
};

pub fn calculate_mean(values: &[f64]) -> f64 {
    if values.is_empty() {
        return 0.0;
    }
    values.iter().sum::<f64>() / (values.len() as f64)
}

/// Calculate variance of values
pub fn calculate_variance(values: &[f64], mean: Option<f64>) -> f64 {
    if values.len() <= 1 {
        return 0.0;
    }

    let mean_val = mean.unwrap_or_else(|| calculate_mean(values));
    values
        .iter()
        .map(|x| (x - mean_val).powi(2))
        .sum::<f64>() / (values.len() as f64)
}

/// Calculate standard deviation of values
pub fn calculate_std_deviation(values: &[f64], mean: Option<f64>) -> f64 {
    calculate_variance(values, mean).sqrt()
}

/// Calculate F significance (p-value) for F statistic
pub fn calculate_f_significance(df1: usize, df2: usize, f_value: f64) -> f64 {
    if df1 == 0 || df2 == 0 || f_value.is_nan() {
        return 0.0;
    }

    FisherSnedecor::new(df1 as f64, df2 as f64)
        .map(|dist| 1.0 - dist.cdf(f_value))
        .unwrap_or(0.0)
}

/// Calculate t significance (p-value) for t statistic
pub fn calculate_t_significance(df: usize, t_value: f64) -> f64 {
    if df == 0 || t_value.is_nan() {
        return 0.0;
    }

    StudentsT::new(0.0, 1.0, df as f64)
        .map(|dist| 2.0 * (1.0 - dist.cdf(t_value.abs())))
        .unwrap_or(0.0)
}

/// Calculate critical t value for confidence intervals
pub fn calculate_t_critical(df: usize, alpha: f64) -> f64 {
    if df == 0 {
        return 1.96; // Default to normal approximation
    }

    StudentsT::new(0.0, 1.0, df as f64)
        .and_then(|dist| Ok(dist.inverse_cdf(1.0 - alpha)))
        .unwrap_or_else(|_| {
            // Fallback to bisection method
            let dist = StudentsT::new(0.0, 1.0, df as f64).unwrap();
            let p = 1.0 - alpha;
            let mut low = -10.0;
            let mut high = 10.0;
            let tol = 1e-6;

            for _ in 0..50 {
                let mid = (low + high) / 2.0;
                let prob = dist.cdf(mid);

                if (prob - p).abs() < tol {
                    return mid;
                }

                if prob < p {
                    low = mid;
                } else {
                    high = mid;
                }
            }

            (low + high) / 2.0
        })
}

/// Calculate observed power for F-test
pub fn calculate_observed_power(df1: usize, df2: usize, f_value: f64, alpha: f64) -> f64 {
    if df1 == 0 || df2 == 0 || f_value <= 0.0 || alpha <= 0.0 || alpha >= 1.0 {
        return 0.0;
    }

    // Approximation using non-central parameter
    let ncp = f_value * (df1 as f64);
    1.0 - (-ncp * 0.5).exp()
}

/// Calculate observed power for t-test
pub fn calculate_observed_power_t(df: usize, t_value: f64, alpha: f64) -> f64 {
    if df == 0 || t_value.abs() <= 0.0 || alpha <= 0.0 || alpha >= 1.0 {
        return 0.0;
    }

    // Approximation using non-central parameter
    let ncp = t_value.abs();
    1.0 - (-ncp * 0.5).exp()
}

/// Chi-square CDF approximation for p-value calculations
pub fn chi_square_cdf(x: f64, df: f64) -> f64 {
    if x <= 0.0 {
        return 0.0;
    }

    ChiSquared::new(df)
        .map(|dist| dist.cdf(x))
        .unwrap_or_else(|_| {
            // Fallback approximation
            if df > 30.0 {
                // Normal approximation for large df
                let z = (x / df).sqrt();
                let t = z - (1.0 - 2.0 / (9.0 * df)) / (3.0 * df.sqrt());
                0.5 * (1.0 + (0.5 * t.sqrt() * t).tanh())
            } else {
                // Gamma approximation for smaller df
                let shape = df / 2.0;
                Gamma::new(shape, 2.0)
                    .map(|dist| dist.cdf(x))
                    .unwrap_or_else(|_| {
                        // Last resort manual calculation
                        let mut p = 0.0;
                        let mut term = (-x / 2.0).exp() * x.powf(shape - 1.0);
                        p += term;

                        for i in 1..100 {
                            term *= x / (shape + (i as f64) - 1.0);
                            p += term;
                            if term < 1e-10 * p {
                                break;
                            }
                        }

                        p *= 1.0 / ((2.0_f64).powf(shape) * gamma(shape));
                        1.0 - p
                    })
            }
        })
}

/// F distribution CDF
pub fn f_distribution_cdf(x: f64, df1: f64, df2: f64) -> f64 {
    if x <= 0.0 {
        return 0.0;
    }

    FisherSnedecor::new(df1, df2)
        .map(|dist| dist.cdf(x))
        .unwrap_or_else(|_| {
            // Fallback approximation
            let z = (df1 * x) / (df1 * x + df2);
            z.min(1.0).max(0.0)
        })
}

/// Count total cases in the data
pub fn count_total_cases(data: &AnalysisData) -> usize {
    data.dependent_data
        .iter()
        .map(|records| records.len())
        .sum()
}

/// Extract dependent variable value from a record
pub fn extract_dependent_value(record: &DataRecord, dep_var_name: &str) -> Option<f64> {
    record.values.get(dep_var_name).and_then(|value| {
        match value {
            DataValue::Number(n) => Some(*n),
            _ => None,
        }
    })
}

/// Convert DataValue to String representation
pub fn data_value_to_string(value: &DataValue) -> String {
    match value {
        DataValue::Number(n) => n.to_string(),
        DataValue::Text(t) => t.clone(),
        DataValue::Boolean(b) => b.to_string(),
        DataValue::Null => "null".to_string(),
    }
}

pub fn get_factor_levels(data: &AnalysisData, factor: &str) -> Result<Vec<String>, String> {
    let mut levels = Vec::new();
    let mut level_set = HashSet::new();

    for (i, factor_defs) in data.fix_factor_data_defs.iter().enumerate() {
        for factor_def in factor_defs {
            if factor_def.name == factor {
                // Found our factor, extract levels
                for records in &data.fix_factor_data[i] {
                    if let Some(value) = records.values.get(factor) {
                        let level = data_value_to_string(value);
                        if !level_set.contains(&level) {
                            level_set.insert(level.clone());
                            levels.push(level);
                        }
                    }
                }

                return Ok(levels);
            }
        }
    }

    Err(format!("Factor '{}' not found in the data", factor))
}

/// Get factor combinations for analysis
pub fn get_factor_combinations(
    data: &AnalysisData,
    config: &MultivariateConfig
) -> Result<Vec<HashMap<String, String>>, String> {
    let mut combinations = Vec::new();

    if let Some(factors) = &config.main.fix_factor {
        if factors.is_empty() {
            return Ok(vec![HashMap::new()]);
        }

        // Get levels for each factor
        let mut factor_levels = Vec::new();
        for factor in factors {
            factor_levels.push(get_factor_levels(data, factor)?);
        }

        // Generate all combinations
        let mut current = HashMap::new();
        generate_combinations(&mut current, factors, &factor_levels, 0, &mut combinations);
    } else {
        combinations.push(HashMap::new()); // No factors case
    }

    Ok(combinations)
}

/// Helper function to generate factor combinations
fn generate_combinations(
    current: &mut HashMap<String, String>,
    factors: &[String],
    levels: &[Vec<String>],
    index: usize,
    result: &mut Vec<HashMap<String, String>>
) {
    if index == factors.len() {
        result.push(current.clone());
        return;
    }

    for level in &levels[index] {
        current.insert(factors[index].clone(), level.clone());
        generate_combinations(current, factors, levels, index + 1, result);
    }
}

/// Generate all possible interaction terms from a list of factors
pub fn generate_interaction_terms(factors: &[String]) -> Vec<String> {
    if factors.is_empty() {
        return Vec::new();
    }

    // We'll store all the interaction terms here
    let mut interactions = Vec::new();

    // Generate all possible combinations of factors from size 2 to size N
    // (We start from 2 because size 1 would just be the individual factors)
    for size in 2..=factors.len() {
        generate_factor_combinations(factors, size, &mut Vec::new(), 0, &mut interactions);
    }

    interactions
}

/// Helper function to recursively generate factor combinations of a specific size
fn generate_factor_combinations(
    factors: &[String],
    size: usize,
    current: &mut Vec<String>,
    start_idx: usize,
    result: &mut Vec<String>
) {
    // If we've selected the required number of factors, create the interaction term
    if current.len() == size {
        // Join the selected factors with "*" to form the interaction term
        let interaction = current.join("*");
        result.push(interaction);
        return;
    }

    // Try including each remaining factor
    for i in start_idx..factors.len() {
        // Add this factor to our current selection
        current.push(factors[i].clone());

        // Recursively generate combinations with this factor included
        generate_factor_combinations(factors, size, current, i + 1, result);

        // Remove this factor for the next iteration (backtracking)
        current.pop();
    }
}

/// Parse an interaction term into its component factors
pub fn parse_interaction_term(term: &str) -> Vec<String> {
    term.split('*')
        .map(|s| s.trim().to_string())
        .collect()
}

/// Check if a record matches an interaction term
/// An interaction term might be something like "age*month" or "age*month*year"
pub fn record_matches_interaction(
    record: &DataRecord,
    combination: &HashMap<String, String>,
    interaction_term: &str
) -> bool {
    let factors = parse_interaction_term(interaction_term);

    for factor in &factors {
        if let Some(expected_level) = combination.get(factor) {
            let actual_level = record.values.get(factor).map(data_value_to_string);
            match actual_level {
                Some(ref level) if level == expected_level => {
                    continue;
                }
                _ => {
                    return false;
                }
            }
        } else {
            return false;
        }
    }

    true
}

/// Get factor combinations that include interactions
pub fn get_factor_combinations_with_interactions(
    data: &AnalysisData,
    config: &MultivariateConfig
) -> Result<Vec<HashMap<String, String>>, String> {
    let mut combinations = get_factor_combinations(data, config)?;

    // If there are no fixed factors or only one, return the basic combinations
    if config.main.fix_factor.is_none() || config.main.fix_factor.as_ref().unwrap().len() <= 1 {
        return Ok(combinations);
    }

    // Generate interaction terms
    let factors = config.main.fix_factor.as_ref().unwrap();
    let interaction_terms = generate_interaction_terms(factors);

    // For each combination, add derived values for each interaction term
    for combo in &mut combinations {
        for term in &interaction_terms {
            // For interaction terms, we could store a special value that indicates
            // this is a combination of the individual factors, but for simplicity
            // we'll just store the term name as the key and value
            combo.insert(term.clone(), term.clone());
        }
    }

    Ok(combinations)
}

/// Extract values for records that match a specific interaction
pub fn get_interaction_level_values(
    data: &AnalysisData,
    interaction_term: &str,
    dep_var_name: &str
) -> Result<Vec<f64>, String> {
    let factors = parse_interaction_term(interaction_term);
    let mut values = Vec::new();

    // Get the levels for each factor in the interaction
    let mut factor_levels = Vec::new();
    for factor in &factors {
        factor_levels.push(get_factor_levels(data, factor)?);
    }

    // Generate all possible level combinations for this interaction
    let mut level_combinations = Vec::new();
    let mut current = HashMap::new();

    fn generate_level_combinations(
        current: &mut HashMap<String, String>,
        factors: &[String],
        levels: &[Vec<String>],
        index: usize,
        result: &mut Vec<HashMap<String, String>>
    ) {
        if index == factors.len() {
            result.push(current.clone());
            return;
        }

        for level in &levels[index] {
            current.insert(factors[index].clone(), level.clone());
            generate_level_combinations(current, factors, levels, index + 1, result);
        }
    }

    generate_level_combinations(&mut current, &factors, &factor_levels, 0, &mut level_combinations);

    // For each level combination, extract matching records
    for combo in &level_combinations {
        let mut combo_values = Vec::new();

        for records in &data.dependent_data {
            for record in records {
                let mut matches = true;

                for (factor, expected_level) in combo {
                    let actual_level = record.values.get(factor).map(data_value_to_string);
                    match actual_level {
                        Some(ref level) if level == expected_level => {
                            continue;
                        }
                        _ => {
                            matches = false;
                            break;
                        }
                    }
                }

                if matches {
                    if let Some(value) = extract_dependent_value(record, dep_var_name) {
                        combo_values.push(value);
                    }
                }
            }
        }

        values.extend(combo_values);
    }

    Ok(values)
}

/// Check if a record matches a particular factor combination
pub fn matches_combination(
    record: &DataRecord,
    combo: &HashMap<String, String>,
    _data: &AnalysisData,
    _config: &MultivariateConfig
) -> bool {
    for (factor, level) in combo {
        let record_level = record.values.get(factor).map(data_value_to_string);

        match record_level {
            Some(ref r_level) if r_level == level => {
                continue;
            }
            _ => {
                return false;
            }
        }
    }
    true
}

/// Get values for a specific factor level in the dependent variable
pub fn get_level_values(
    data: &AnalysisData,
    factor: &str,
    level: &str,
    dep_var_name: &str
) -> Result<Vec<f64>, String> {
    let mut values = Vec::new();

    for records in &data.dependent_data {
        for record in records {
            let factor_level = record.values.get(factor).map(data_value_to_string);

            if factor_level.as_deref() == Some(level) {
                if let Some(value) = extract_dependent_value(record, dep_var_name) {
                    values.push(value);
                }
            }
        }
    }

    Ok(values)
}

/// Get values adjusted for previous factors (for Type I SS)
pub fn get_level_values_adjusted(
    values: &[f64],
    data: &AnalysisData,
    factor: &str,
    level: &str,
    dep_var_name: &str
) -> Result<Vec<f64>, String> {
    let mut level_values = Vec::new();
    let mut i = 0;

    for records in &data.dependent_data {
        for record in records {
            if i >= values.len() {
                continue;
            }

            let factor_level = record.values.get(factor).map(data_value_to_string);

            if factor_level.as_deref() == Some(level) {
                level_values.push(values[i]);
            }

            i += 1;
        }
    }

    Ok(level_values)
}

/// Convert 2D vector to DMatrix
pub fn to_dmatrix(matrix: &[Vec<f64>]) -> DMatrix<f64> {
    if matrix.is_empty() || matrix[0].is_empty() {
        return DMatrix::zeros(0, 0);
    }

    let rows = matrix.len();
    let cols = matrix[0].len();
    DMatrix::from_fn(rows, cols, |i, j| matrix[i][j])
}

/// Convert vector to DVector
pub fn to_dvector(vector: &[f64]) -> DVector<f64> {
    DVector::from_iterator(vector.len(), vector.iter().cloned())
}

/// Convert DMatrix to 2D vector
pub fn from_dmatrix(matrix: &DMatrix<f64>) -> Vec<Vec<f64>> {
    let rows = matrix.nrows();
    let cols = matrix.ncols();

    let mut result = vec![vec![0.0; cols]; rows];
    for i in 0..rows {
        for j in 0..cols {
            result[i][j] = matrix[(i, j)];
        }
    }

    result
}

/// Matrix multiplication using nalgebra
pub fn matrix_multiply(a: &[Vec<f64>], b: &[Vec<f64>]) -> Result<Vec<Vec<f64>>, String> {
    if a.is_empty() || b.is_empty() || a[0].is_empty() || b[0].is_empty() {
        return Err("Empty matrices provided for multiplication".to_string());
    }

    let a_cols = a[0].len();
    let b_rows = b.len();

    if a_cols != b_rows {
        return Err(
            format!(
                "Matrix dimensions mismatch: {}x{} and {}x{}",
                a.len(),
                a_cols,
                b_rows,
                b[0].len()
            )
        );
    }

    let a_matrix = to_dmatrix(a);
    let b_matrix = to_dmatrix(b);

    Ok(from_dmatrix(&(a_matrix * b_matrix)))
}

/// Matrix inversion using nalgebra
pub fn matrix_inverse(matrix: &[Vec<f64>]) -> Result<Vec<Vec<f64>>, String> {
    if matrix.is_empty() || matrix[0].is_empty() {
        return Err("Empty matrix provided for inversion".to_string());
    }

    let rows = matrix.len();
    let cols = matrix[0].len();

    if rows != cols {
        return Err("Matrix must be square for inversion".to_string());
    }

    // Special cases for small matrices (faster than general algorithm)
    if rows == 1 {
        if matrix[0][0] == 0.0 {
            return Err("Matrix is singular".to_string());
        }
        return Ok(vec![vec![1.0 / matrix[0][0]]]);
    }

    if rows == 2 {
        let det = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
        if det.abs() < 1e-10 {
            return Err("Matrix is nearly singular".to_string());
        }

        let inv_det = 1.0 / det;
        return Ok(
            vec![
                vec![matrix[1][1] * inv_det, -matrix[0][1] * inv_det],
                vec![-matrix[1][0] * inv_det, matrix[0][0] * inv_det]
            ]
        );
    }

    // General case using nalgebra
    let a_matrix = to_dmatrix(matrix);
    match a_matrix.try_inverse() {
        Some(inv) => Ok(from_dmatrix(&inv)),
        None => Err("Matrix is singular and cannot be inverted".to_string()),
    }
}

/// Calculate matrix determinant
pub fn matrix_determinant(matrix: &[Vec<f64>]) -> Result<f64, String> {
    if matrix.is_empty() || matrix[0].is_empty() {
        return Err("Empty matrix provided for determinant".to_string());
    }

    let rows = matrix.len();
    let cols = matrix[0].len();

    if rows != cols {
        return Err("Matrix must be square for determinant".to_string());
    }

    // Special cases for small matrices
    if rows == 1 {
        return Ok(matrix[0][0]);
    }

    if rows == 2 {
        return Ok(matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0]);
    }

    // General case using nalgebra
    let a_matrix = to_dmatrix(matrix);
    Ok(a_matrix.determinant())
}

/// Transpose a matrix
pub fn matrix_transpose(matrix: &[Vec<f64>]) -> Vec<Vec<f64>> {
    if matrix.is_empty() || matrix[0].is_empty() {
        return Vec::new();
    }

    let rows = matrix.len();
    let cols = matrix[0].len();

    let mut result = vec![vec![0.0; rows]; cols];
    for i in 0..rows {
        for j in 0..cols {
            result[j][i] = matrix[i][j];
        }
    }

    result
}

/// Solve linear system Ax = b
pub fn solve_linear_system(a: &[Vec<f64>], b: &[f64]) -> Result<Vec<f64>, String> {
    if a.is_empty() || a[0].is_empty() || b.is_empty() {
        return Err("Empty matrices provided for linear system".to_string());
    }

    let rows = a.len();
    let cols = a[0].len();

    if rows != b.len() {
        return Err(
            format!("Dimension mismatch: A is {}x{} but b has length {}", rows, cols, b.len())
        );
    }

    if rows != cols {
        return Err("Matrix A must be square for direct solving".to_string());
    }

    let a_matrix = to_dmatrix(a);
    let b_vector = to_dvector(b);

    match a_matrix.try_inverse() {
        Some(a_inv) => {
            let x = a_inv * b_vector;
            Ok(x.as_slice().to_vec())
        }
        None => Err("Matrix is singular and system cannot be solved".to_string()),
    }
}

/// Helper function to build design matrix and response vector
pub fn build_design_matrix_and_response(
    data: &AnalysisData,
    config: &MultivariateConfig,
    dependent_var: &str
) -> Result<(Vec<Vec<f64>>, Vec<f64>), String> {
    let mut x_matrix = Vec::new();
    let mut y_vector = Vec::new();

    // Collect all records
    for records in &data.dependent_data {
        for record in records {
            if let Some(y_value) = extract_dependent_value(record, dependent_var) {
                // Build design matrix row for this record
                let mut x_row = Vec::new();

                // Add intercept if included in the model
                if config.model.intercept {
                    x_row.push(1.0);
                }

                // Add factor columns (dummy variables)
                if let Some(factors) = &config.main.fix_factor {
                    for factor in factors {
                        if let Ok(levels) = get_factor_levels(data, factor) {
                            // Create dummy variables based on the factor levels
                            let factor_value = record.values
                                .get(factor)
                                .map(|v| data_value_to_string(v))
                                .unwrap_or_default();

                            // Use effect coding or dummy coding based on contrast type
                            match config.contrast.contrast_method {
                                ContrastMethod::Deviation => {
                                    // Effect coding
                                    for level in &levels[0..levels.len() - 1] {
                                        if &factor_value == level {
                                            x_row.push(1.0);
                                        } else if &factor_value == &levels[levels.len() - 1] {
                                            x_row.push(-1.0);
                                        } else {
                                            x_row.push(0.0);
                                        }
                                    }
                                }
                                _ => {
                                    // Default to dummy coding (simple contrasts)
                                    for level in &levels[0..levels.len() - 1] {
                                        if &factor_value == level {
                                            x_row.push(1.0);
                                        } else {
                                            x_row.push(0.0);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Add covariate columns
                if let Some(covariates) = &config.main.covar {
                    for covar in covariates {
                        if let Some(covar_value) = record.values.get(covar) {
                            match covar_value {
                                DataValue::Number(num) => x_row.push(*num),
                                _ => x_row.push(0.0), // Handle non-numeric covariates
                            }
                        } else {
                            x_row.push(0.0); // Missing covariate value
                        }
                    }
                }

                // Add interaction terms
                if let Some(factors) = &config.main.fix_factor {
                    if factors.len() > 1 {
                        let interaction_terms = generate_interaction_terms(factors);
                        for term in &interaction_terms {
                            let factor_levels = parse_interaction_term(term);
                            let mut interaction_value = 1.0;
                            let mut valid = true;

                            for factor in &factor_levels {
                                if let Some(factor_value) = record.values.get(factor) {
                                    // For simplicity, we use the product of factor dummy variables
                                    // This needs to be refined based on the actual coding scheme
                                    if let Ok(levels) = get_factor_levels(data, factor) {
                                        let level_value = data_value_to_string(factor_value);
                                        let level_index = levels
                                            .iter()
                                            .position(|l| l == &level_value);

                                        if let Some(idx) = level_index {
                                            // The interaction term encodes as 1 only if all factors match
                                            // specific levels, otherwise 0
                                            if idx != levels.len() - 1 {
                                                // Not the reference level
                                                interaction_value *= 1.0;
                                            } else {
                                                // Reference level
                                                valid = false;
                                                break;
                                            }
                                        } else {
                                            valid = false;
                                            break;
                                        }
                                    }
                                } else {
                                    valid = false;
                                    break;
                                }
                            }

                            if valid {
                                x_row.push(interaction_value);
                            } else {
                                x_row.push(0.0);
                            }
                        }
                    }
                }

                // Add this record to the design matrix and response vector
                x_matrix.push(x_row);
                y_vector.push(y_value);
            }
        }
    }

    Ok((x_matrix, y_vector))
}
