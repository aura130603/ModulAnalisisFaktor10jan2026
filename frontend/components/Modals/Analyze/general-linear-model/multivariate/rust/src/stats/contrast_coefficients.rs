use crate::models::{
    config::{ ContrastMethod, MultivariateConfig },
    data::AnalysisData,
    result::ContrastCoefficients,
};

use super::core::get_factor_levels;

/// Calculate contrast coefficients
pub fn calculate_contrast_coefficients(
    data: &AnalysisData,
    config: &MultivariateConfig
) -> Result<ContrastCoefficients, String> {
    let mut parameter = Vec::new();
    let mut coefficients = Vec::new();

    // Add intercept parameter
    if config.model.intercept {
        parameter.push("Intercept".to_string());
    }

    // Add factor parameters
    if let Some(factors) = &config.main.fix_factor {
        for factor in factors {
            if let Ok(levels) = get_factor_levels(data, factor) {
                for level in &levels {
                    parameter.push(format!("{}={}", factor, level));
                }
            }
        }
    }

    // Initialize coefficients with zeros
    coefficients = vec![0.0; parameter.len()];

    // Set intercept coefficient if exists
    if config.model.intercept {
        coefficients[0] = 1.0;
    }

    // Generate contrast coefficients based on method
    let mut param_idx = if config.model.intercept { 1 } else { 0 };
    if let Some(factors) = &config.main.fix_factor {
        for factor in factors {
            if let Ok(levels) = get_factor_levels(data, factor) {
                let num_levels = levels.len();

                // Skip factors with only one level
                if num_levels <= 1 {
                    continue;
                }

                // Calculate appropriate contrasts based on the selected method
                match config.contrast.contrast_method {
                    ContrastMethod::None => {
                        // No contrasts, already handled above
                    }
                    ContrastMethod::Deviation => {
                        // Deviation contrasts: each level compared to grand mean
                        for i in 0..num_levels - 1 {
                            coefficients[param_idx + i] = 1.0;
                            coefficients[param_idx + num_levels - 1] = -1.0;
                        }
                    }
                    ContrastMethod::Simple => {
                        // Simple contrasts: each level compared to reference level
                        let ref_idx = if config.contrast.first {
                            0 // First category as reference
                        } else {
                            num_levels - 1 // Last category as reference (default)
                        };

                        for i in 0..num_levels {
                            if i != ref_idx {
                                coefficients[param_idx + i] = 1.0;
                                coefficients[param_idx + ref_idx] = -1.0;
                            }
                        }
                    }
                    ContrastMethod::Difference => {
                        // Difference contrasts: each level compared to mean of previous levels
                        for i in 1..num_levels {
                            coefficients[param_idx + i] = 1.0;
                            for j in 0..i {
                                coefficients[param_idx + j] = -1.0 / (i as f64);
                            }
                        }
                    }
                    ContrastMethod::Helmert => {
                        // Helmert contrasts: each level compared to mean of subsequent levels
                        for i in 0..num_levels - 1 {
                            coefficients[param_idx + i] = 1.0;
                            for j in i + 1..num_levels {
                                coefficients[param_idx + j] = -1.0 / ((num_levels - i - 1) as f64);
                            }
                        }
                    }
                    ContrastMethod::Repeated => {
                        // Repeated contrasts: each level compared to subsequent level
                        for i in 0..num_levels - 1 {
                            coefficients[param_idx + i] = 1.0;
                            coefficients[param_idx + i + 1] = -1.0;
                        }
                    }
                    ContrastMethod::Polynomial => {
                        // Polynomial contrasts: linear, quadratic, cubic, etc.

                        // Linear contrast
                        let linear_weights = generate_polynomial_contrast(num_levels, 1);
                        for j in 0..num_levels {
                            coefficients[param_idx + j] = linear_weights[j];
                        }

                        if num_levels > 2 {
                            // Quadratic contrast
                            let quadratic_weights = generate_polynomial_contrast(num_levels, 2);
                            for j in 0..num_levels {
                                coefficients[param_idx + j] = quadratic_weights[j];
                            }
                        }

                        if num_levels > 3 {
                            // Cubic contrast
                            let cubic_weights = generate_polynomial_contrast(num_levels, 3);
                            for j in 0..num_levels {
                                coefficients[param_idx + j] = cubic_weights[j];
                            }
                        }
                    }
                }

                param_idx += num_levels;
            }
        }
    }

    // Return ContrastCoefficients with the proper structure
    Ok(ContrastCoefficients {
        parameter,
        coefficients,
    })
}

/// Generate polynomial contrasts of specified degree for a given number of levels
fn generate_polynomial_contrast(level_count: usize, degree: usize) -> Vec<f64> {
    let mut contrasts = vec![0.0; level_count];

    // Generate simple linear contrast for degree 1
    if degree == 1 {
        let denominator = ((level_count * level_count - 1) as f64) / 12.0;
        let scale = 1.0 / denominator.sqrt();

        // For equally spaced values from -1 to 1
        for i in 0..level_count {
            let x = -1.0 + (2.0 * (i as f64)) / ((level_count - 1) as f64);
            contrasts[i] = x * scale;
        }
    } else {
        // Higher degree polynomials would need Gram-Schmidt orthogonalization
        // Simplified implementation for higher degrees
        for i in 0..level_count {
            let x = -1.0 + (2.0 * (i as f64)) / ((level_count - 1) as f64);
            contrasts[i] = x.powi(degree as i32);
        }

        // Normalize
        let sum_sq = contrasts
            .iter()
            .map(|x| x * x)
            .sum::<f64>()
            .sqrt();
        if sum_sq > 0.0 {
            for i in 0..level_count {
                contrasts[i] /= sum_sq;
            }
        }
    }

    contrasts
}
