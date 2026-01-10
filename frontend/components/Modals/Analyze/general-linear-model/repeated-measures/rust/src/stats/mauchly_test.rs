use nalgebra::{ DMatrix, DVector };
use statrs::distribution::{ ChiSquared, ContinuousCDF };
use std::collections::HashMap;

use crate::models::{
    config::RepeatedMeasuresConfig,
    data::{ AnalysisData, DataValue },
    result::{ MauchlyTest, MauchlyTestEntry },
};

use super::core::parse_within_subject_factors;

/// Calculate Mauchly's Test of Sphericity
fn calculate_mauchly_test(
    data: &AnalysisData,
    config: &RepeatedMeasuresConfig
) -> Result<MauchlyTest, String> {
    // Get within-subjects factors
    let within_factors = parse_within_subject_factors(data, config)?;

    let mut tests = HashMap::new();
    let mut design = None;

    // Process each within-subjects factor
    for (factor_name, factors) in &within_factors.measures {
        // We need at least 2 levels for the test
        if factors.len() < 2 {
            continue;
        }

        // Extract variable names for this factor
        let var_names: Vec<String> = factors
            .iter()
            .map(|f| f.dependent_variable.clone())
            .collect();

        // Extract data values
        let mut data_matrix = Vec::new();

        for record_group in &data.subject_data {
            let mut subject_data = Vec::new();

            for var_name in &var_names {
                let mut found = false;

                for record in record_group {
                    if let Some(data_value) = record.values.get(var_name) {
                        match data_value {
                            DataValue::Number(val) => {
                                subject_data.push(*val);
                                found = true;
                                break;
                            }
                            _ => {
                                continue;
                            }
                        }
                    }
                }

                if !found {
                    subject_data.push(0.0); // Missing data handling
                }
            }

            if subject_data.len() == var_names.len() {
                data_matrix.push(subject_data);
            }
        }

        // Convert to nalgebra matrix
        let n_subjects = data_matrix.len();
        let n_vars = var_names.len();

        if n_subjects < 2 || n_vars < 2 {
            continue; // Not enough data for the test
        }

        let mut matrix = DMatrix::zeros(n_subjects, n_vars);
        for (i, row) in data_matrix.iter().enumerate() {
            for (j, &val) in row.iter().enumerate() {
                matrix[(i, j)] = val;
            }
        }

        // Calculate covariance matrix
        let centered =
            &matrix -
            DVector::from_iterator(n_subjects, std::iter::repeat(1.0)).transpose() *
                DVector::from_iterator(n_vars, matrix.column_mean().iter().cloned());

        let cov_matrix = (centered.transpose() * centered) / ((n_subjects - 1) as f64);

        // Calculate Mauchly's W
        // For sphericity, we need to check if the variances of differences are equal
        // Transform the covariance matrix to get the contrasts
        let k = n_vars;
        let mut contrast_matrix = DMatrix::zeros(k - 1, k);

        for i in 0..k - 1 {
            contrast_matrix[(i, i)] = 1.0;
            contrast_matrix[(i, i + 1)] = -1.0;
        }

        // Calculate the transformed covariance matrix
        let transformed_cov = contrast_matrix * cov_matrix * contrast_matrix.transpose();

        // Calculate determinants
        let det_cov = cov_matrix.determinant();
        let det_transformed = transformed_cov.determinant();

        // Calculate Mauchly's W
        let mauchly_w = if det_transformed.abs() < 1e-10 {
            0.0
        } else {
            det_transformed / (transformed_cov.trace() / ((k - 1) as f64)).powi(k - 1)
        };

        // Calculate chi-square statistic
        let n = n_subjects as f64;
        let chi_square = (n - 1.0) * ((k - 1) as f64) * -mauchly_w.ln();

        // Calculate degrees of freedom
        let df = (k * (k - 1)) / 2 - 1;

        // Calculate significance (p-value)
        let chi_squared_dist = ChiSquared::new(df as f64).map_err(|e| e.to_string())?;
        let significance = 1.0 - chi_squared_dist.cdf(chi_square);

        // Calculate epsilon adjustments
        // Greenhouse-Geisser epsilon
        let mut eigenvalues = Vec::with_capacity(k - 1);
        let symmetric_transformed = (transformed_cov + transformed_cov.transpose()) / 2.0;

        for i in 0..k - 1 {
            eigenvalues.push(symmetric_transformed[(i, i)]);
        }

        let sum_eigenvalues: f64 = eigenvalues.iter().sum();
        let sum_squared_eigenvalues: f64 = eigenvalues
            .iter()
            .map(|&e| e.powi(2))
            .sum();

        let greenhouse_geisser_epsilon = if sum_squared_eigenvalues < 1e-10 {
            1.0
        } else {
            sum_eigenvalues.powi(2) / (((k - 1) as f64) * sum_squared_eigenvalues)
        };

        // Huynh-Feldt epsilon
        let huynh_feldt_epsilon = if n_subjects <= k {
            greenhouse_geisser_epsilon
        } else {
            let numerator = n_subjects * ((k - 1) as f64) * greenhouse_geisser_epsilon - 2.0;
            let denominator =
                ((k - 1) as f64) *
                (n_subjects - 1.0 - ((k - 1) as f64) * greenhouse_geisser_epsilon);

            if denominator < 1e-10 {
                greenhouse_geisser_epsilon
            } else {
                (numerator / denominator).min(1.0).max(greenhouse_geisser_epsilon)
            }
        };

        // Lower bound epsilon
        let lower_bound_epsilon = 1.0 / ((k - 1) as f64);

        // Store the test result
        let test_entry = MauchlyTestEntry {
            effect: factor_name.clone(),
            mauchly_w,
            chi_square,
            df,
            significance,
            greenhouse_geisser_epsilon,
            huynh_feldt_epsilon,
            lower_bound_epsilon,
        };

        tests.insert(factor_name.clone(), test_entry);

        // Store design information
        if design.is_none() {
            if let Some(ws_design) = &config.model.with_sub_model {
                design = Some(ws_design.clone());
            } else {
                design = Some("Full factorial within-subjects design".to_string());
            }
        }
    }

    // Add a note about interpretation
    let note = Some(
        "Tests the null hypothesis that the error covariance matrix of the orthonormalized transformed dependent variables is proportional to an identity matrix.".to_string()
    );

    Ok(MauchlyTest {
        tests,
        design,
        note,
    })
}
