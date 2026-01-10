// anova.rs
use std::collections::HashMap;
use nalgebra::{ DMatrix, DVector };

use crate::models::{
    config::VarianceCompsConfig,
    data::AnalysisData,
    result::{ AnovaSource, AnovaTable },
};

use super::core::{
    from_vec,
    vec_to_vector,
    get_factor_levels,
    create_design_and_response,
    create_effect_matrices,
};

/// Estimasi komponen varians menggunakan metode ANOVA
pub fn anova_estimation(
    data: &AnalysisData,
    config: &VarianceCompsConfig
) -> Result<(HashMap<String, f64>, AnovaTable), String> {
    // Validasi input
    let dep_var = match &config.main.dep_var {
        Some(var) => var,
        None => {
            return Err("No dependent variable specified".to_string());
        }
    };

    // Get design matrix and response
    let (design_matrix, y) = create_design_and_response(data, config)?;
    let design_mat = from_vec(&design_matrix)?;
    let y_vec = vec_to_vector(&y);

    // Determine sum of squares type
    let ss_type = if config.options.type_i { "Type I" } else { "Type III" };

    // Calculate sums of squares, degrees of freedom, and mean squares
    let (sources, total_ss, df_total, corrected_total_ss, df_corrected) = calculate_sums_of_squares(
        data,
        config,
        &design_mat,
        &y_vec,
        ss_type
    )?;

    // Create ANOVA table
    let mut anova_sources = Vec::new();
    let mut variance_components = HashMap::new();

    // Add corrected model
    let model_ss: f64 = sources
        .iter()
        .filter(|(source, _)| *source != "Error" && *source != "Intercept")
        .map(|(_, (ss, _, _))| *ss)
        .sum();
    let model_df: usize = sources
        .iter()
        .filter(|(source, _)| *source != "Error" && *source != "Intercept")
        .map(|(_, (_, df, _))| *df)
        .sum();
    let model_ms = if model_df > 0 { model_ss / (model_df as f64) } else { 0.0 };

    anova_sources.push(AnovaSource {
        source: "Corrected Model".to_string(),
        sum_of_squares: model_ss,
        df: model_df,
        mean_square: model_ms,
    });

    // Add individual sources
    for (source, (ss, df, ms)) in &sources {
        anova_sources.push(AnovaSource {
            source: source.clone(),
            sum_of_squares: *ss,
            df: *df,
            mean_square: *ms,
        });
    }

    // Add total
    anova_sources.push(AnovaSource {
        source: "Total".to_string(),
        sum_of_squares: total_ss,
        df: df_total,
        mean_square: 0.0, // Not applicable for total
    });

    // Add corrected total
    anova_sources.push(AnovaSource {
        source: "Corrected Total".to_string(),
        sum_of_squares: corrected_total_ss,
        df: df_corrected,
        mean_square: 0.0, // Not applicable for corrected total
    });

    let anova_table = AnovaTable {
        sources: anova_sources,
        sum_of_squares_type: ss_type.to_string(),
        dependent_variable: dep_var.clone(),
    };

    // Get random factors
    let random_factors = match &config.main.rand_factor {
        Some(factors) => factors,
        None => &Vec::new(),
    };

    // Find error mean square
    let error_ms = sources
        .iter()
        .find(|(source, _)| *source == "Error")
        .map(|(_, (_, _, ms))| *ms)
        .unwrap_or(0.0);

    // Calculate variance components for random effects
    for factor in random_factors {
        let factor_ms = sources
            .iter()
            .find(|(source, _)| *source == factor)
            .map(|(_, (_, _, ms))| *ms)
            .unwrap_or(0.0);

        // Hitung koefisien dari expected mean squares
        let coefficient = calculate_ems_coefficient(data, config, factor, &design_mat)?;

        // Variance component = (MS_effect - MS_error) / coefficient
        let variance = (factor_ms - error_ms) / coefficient;
        variance_components.insert(format!("Var({})", factor), if variance > 0.0 {
            variance
        } else {
            0.0
        });
    }

    // Add error variance
    variance_components.insert("Var(Error)".to_string(), error_ms);

    Ok((variance_components, anova_table))
}

/// Hitung koefisien untuk expected mean squares
fn calculate_ems_coefficient(
    data: &AnalysisData,
    config: &VarianceCompsConfig,
    factor: &str,
    design_matrix: &DMatrix<f64>
) -> Result<f64, String> {
    // Menghitung koefisien dari expected mean squares untuk efek acak
    // Untuk balanced design, koefisien biasanya adalah jumlah observasi per level
    let factor_levels = get_factor_levels(data, config, factor)?;
    let n_levels = factor_levels.len();

    // Dalam kasus seimbang, koefisien adalah jumlah observasi total / jumlah level
    let n_total = design_matrix.nrows();
    let coefficient = (n_total as f64) / (n_levels as f64);

    Ok(coefficient)
}

/// Hitung sums of squares untuk metode ANOVA
pub fn calculate_sums_of_squares(
    data: &AnalysisData,
    config: &VarianceCompsConfig,
    design_matrix: &DMatrix<f64>,
    y: &DVector<f64>,
    ss_type: &str
) -> Result<(HashMap<String, (f64, usize, f64)>, f64, usize, f64, usize), String> {
    // Simpan sums of squares, degrees of freedom, dan mean squares untuk setiap source of variation
    let mut sources = HashMap::new();

    // Total sum of squares
    let total_mean = y.iter().sum::<f64>() / (y.len() as f64);
    let total_ss = y
        .iter()
        .map(|&yi| (yi - total_mean).powi(2))
        .sum::<f64>();
    let df_total = y.len();

    // Dapatkan faktor dan efek
    let mut effects = Vec::new();

    // Tambahkan intercept jika disertakan
    if config.model.intercept {
        effects.push("Intercept".to_string());
    }

    // Tambahkan fixed factors
    if let Some(fix_factors) = &config.main.fix_factor {
        for factor in fix_factors {
            effects.push(factor.clone());
        }
    }

    // Tambahkan random factors
    if let Some(rand_factors) = &config.main.rand_factor {
        for factor in rand_factors {
            effects.push(factor.clone());
        }
    }

    // Buat X matriks untuk setiap efek (termasuk intercept dan faktor)
    let mut effect_matrices = HashMap::new();

    if config.model.intercept {
        let intercept = DVector::from_element(y.len(), 1.0);
        effect_matrices.insert("Intercept".to_string(), intercept);
    }

    // Isi efek faktor
    let (x_matrices, _) = create_effect_matrices(data, config)?;

    // Extract fixed effect design matrices
    if let Some(fix_factors) = &config.main.fix_factor {
        for factor in fix_factors {
            let levels = get_factor_levels(data, config, factor)?;
            let n_levels = levels.len();

            // Create dummy variable matrix for this factor (n_obs x (n_levels-1))
            let mut factor_matrix: DMatrix<f64> = DMatrix::zeros(y.len(), n_levels - 1);

            // Add to effect_matrices - simplified
            effect_matrices.insert(factor.clone(), DVector::zeros(y.len()));
        }
    }

    // Extract random effect design matrices
    if let Some(rand_factors) = &config.main.rand_factor {
        for factor in rand_factors {
            let levels = get_factor_levels(data, config, factor)?;
            let n_levels = levels.len();

            // Create dummy variable matrix for this factor (n_obs x n_levels)
            let mut factor_matrix: DMatrix<f64> = DMatrix::zeros(y.len(), n_levels);

            // Add to effect_matrices - simplified
            effect_matrices.insert(factor.clone(), DVector::zeros(y.len()));
        }
    }

    if ss_type == "Type I" {
        // Type I: Hierarchical decomposition
        // Each term is adjusted only for the term that precedes it in the model
        let mut residual_ss = total_ss;
        let mut residual_df = df_total - 1; // Adjust for mean

        // Create X matrix from all effects
        let full_model = design_matrix;

        // Fit full model: β = (X'X)⁻¹X'y
        let full_xtx = full_model.transpose() * full_model;
        let full_xty = full_model.transpose() * y;

        let full_beta = match full_xtx.try_inverse() {
            Some(inv) => inv * full_xty,
            None => {
                return Err("X'X matrix is not invertible".to_string());
            }
        };

        // Calculate fitted values: ŷ = Xβ
        let full_fitted = full_model * full_beta;

        // Calculate residual sum of squares: SSₑ = (y - ŷ)'(y - ŷ)
        let residuals = y - full_fitted;
        let full_rss = (residuals.transpose() * residuals)[0];

        // Calculate effect sum of squares sequentially
        let mut sequential_model = Vec::new();

        for effect in &effects {
            if effect == "Intercept" {
                // Intercept SS = n * ȳ²
                let intercept_ss = (y.len() as f64) * total_mean.powi(2);
                let intercept_df = 1;
                let intercept_ms = intercept_ss;

                sources.insert("Intercept".to_string(), (intercept_ss, intercept_df, intercept_ms));
                residual_ss -= intercept_ss;
                residual_df -= intercept_df;

                // Add intercept to sequential model
                if let Some(intercept_matrix) = effect_matrices.get("Intercept") {
                    sequential_model.push(intercept_matrix.clone());
                }
            } else {
                // Add current effect to sequential model
                if let Some(effect_matrix) = effect_matrices.get(effect) {
                    sequential_model.push(effect_matrix.clone());
                } else {
                    return Err(format!("Effect matrix not found for {}", effect));
                }

                // Fit sequential model
                let seq_model_matrix = DMatrix::from_columns(&sequential_model);
                let seq_xtx = seq_model_matrix.transpose() * &seq_model_matrix;
                let seq_xty = seq_model_matrix.transpose() * y;

                let seq_beta = match seq_xtx.try_inverse() {
                    Some(inv) => inv * seq_xty,
                    None => {
                        return Err(
                            format!("Sequential model X'X matrix is not invertible for effect {}", effect)
                        );
                    }
                };

                // Calculate sequential fitted values
                let seq_fitted = seq_model_matrix * seq_beta;

                // Calculate sequential residual sum of squares
                let seq_residuals = y - seq_fitted;
                let seq_rss = (seq_residuals.transpose() * seq_residuals)[0];

                // Calculate previous sequential RSS (without current effect)
                let prev_seq_model_matrix = if sequential_model.len() > 1 {
                    DMatrix::from_columns(&sequential_model[0..sequential_model.len() - 1])
                } else {
                    // If only intercept, create matrix with just intercept
                    DMatrix::from_columns(&[DVector::from_element(y.len(), 1.0)])
                };

                let prev_seq_xtx = prev_seq_model_matrix.transpose() * &prev_seq_model_matrix;
                let prev_seq_xty = prev_seq_model_matrix.transpose() * y;

                let prev_seq_beta = match prev_seq_xtx.try_inverse() {
                    Some(inv) => inv * prev_seq_xty,
                    None => {
                        return Err(
                            format!("Previous sequential model X'X matrix is not invertible for effect {}", effect)
                        );
                    }
                };

                let prev_seq_fitted = prev_seq_model_matrix * prev_seq_beta;
                let prev_seq_residuals = y - prev_seq_fitted;
                let prev_seq_rss = (prev_seq_residuals.transpose() * prev_seq_residuals)[0];

                // Type I SS for current effect = previous sequential RSS - current sequential RSS
                let effect_ss = prev_seq_rss - seq_rss;

                // Calculate DF for effect
                let effect_df = get_effect_df(data, config, effect)?;

                // Mean square
                let effect_ms = effect_ss / (effect_df as f64);

                sources.insert(effect.clone(), (effect_ss, effect_df, effect_ms));
                residual_ss -= effect_ss;
                residual_df -= effect_df;
            }
        }

        // Add error/residual
        let error_ms = if residual_df > 0 { residual_ss / (residual_df as f64) } else { 0.0 };
        sources.insert("Error".to_string(), (residual_ss, residual_df, error_ms));

        // Corrected total = total SS - intercept SS
        let intercept_ss = sources
            .get("Intercept")
            .map(|(ss, _, _)| *ss)
            .unwrap_or(0.0);
        let corrected_total_ss = total_ss - intercept_ss;
        let df_corrected = df_total - 1; // Adjust for mean

        Ok((sources, total_ss, df_total, corrected_total_ss, df_corrected))
    } else {
        // Type III: Each effect is adjusted for all other effects
        // Create full model
        let full_model = design_matrix;

        // Fit full model: β = (X'X)⁻¹X'y
        let full_xtx = full_model.transpose() * full_model;
        let full_xty = full_model.transpose() * y;

        let full_beta = match full_xtx.try_inverse() {
            Some(inv) => inv * full_xty,
            None => {
                return Err("X'X matrix is not invertible".to_string());
            }
        };

        // Calculate fitted values: ŷ = Xβ
        let full_fitted = full_model * full_beta;

        // Calculate residual sum of squares: SSₑ = (y - ŷ)'(y - ŷ)
        let residuals = y - full_fitted;
        let full_rss = (residuals.transpose() * residuals)[0];

        // For each effect, calculate Type III SS
        for effect in &effects {
            if effect == "Intercept" {
                // Special handling for intercept
                // Type III SS for intercept adjusts for all other effects
                // We need the model without intercept to calculate this

                // Create model without intercept
                let mut reduced_model_cols = Vec::new();

                for other_effect in &effects {
                    if other_effect != "Intercept" {
                        if let Some(effect_matrix) = effect_matrices.get(other_effect) {
                            reduced_model_cols.push(effect_matrix.clone());
                        }
                    }
                }

                let reduced_model = DMatrix::from_columns(&reduced_model_cols);

                // Fit reduced model
                let reduced_xtx = reduced_model.transpose() * &reduced_model;
                let reduced_xty = reduced_model.transpose() * y;

                let reduced_beta = match reduced_xtx.try_inverse() {
                    Some(inv) => inv * reduced_xty,
                    None => {
                        return Err(
                            "Reduced model X'X matrix is not invertible for intercept".to_string()
                        );
                    }
                };

                // Calculate reduced fitted values
                let reduced_fitted = reduced_model * reduced_beta;

                // Calculate reduced residual sum of squares
                let reduced_residuals = y - reduced_fitted;
                let reduced_rss = (reduced_residuals.transpose() * reduced_residuals)[0];

                // Type III SS for intercept = reduced RSS - full RSS
                let intercept_ss = reduced_rss - full_rss;
                let intercept_df = 1;
                let intercept_ms = intercept_ss;

                sources.insert("Intercept".to_string(), (intercept_ss, intercept_df, intercept_ms));
            } else {
                // For other effects, create model without this effect
                let mut reduced_model_cols = Vec::new();

                for other_effect in &effects {
                    if other_effect != effect {
                        if let Some(effect_matrix) = effect_matrices.get(other_effect) {
                            reduced_model_cols.push(effect_matrix.clone());
                        }
                    }
                }

                let reduced_model = DMatrix::from_columns(&reduced_model_cols);

                // Fit reduced model
                let reduced_xtx = reduced_model.transpose() * &reduced_model;
                let reduced_xty = reduced_model.transpose() * y;

                let reduced_beta = match reduced_xtx.try_inverse() {
                    Some(inv) => inv * reduced_xty,
                    None => {
                        return Err(
                            format!("Reduced model X'X matrix is not invertible for effect {}", effect)
                        );
                    }
                };

                // Calculate reduced fitted values
                let reduced_fitted = reduced_model * reduced_beta;

                // Calculate reduced residual sum of squares
                let reduced_residuals = y - reduced_fitted;
                let reduced_rss = (reduced_residuals.transpose() * reduced_residuals)[0];

                // Type III SS for effect = reduced RSS - full RSS
                let effect_ss = reduced_rss - full_rss;

                // Calculate DF for effect
                let effect_df = get_effect_df(data, config, effect)?;

                // Mean square
                let effect_ms = effect_ss / (effect_df as f64);

                sources.insert(effect.clone(), (effect_ss, effect_df, effect_ms));
            }
        }

        // Calculate error SS and DF
        let model_df: usize = sources
            .values()
            .map(|(_, df, _)| *df)
            .sum();
        let error_df = df_total - model_df;
        let error_ss = full_rss;
        let error_ms = if error_df > 0 { error_ss / (error_df as f64) } else { 0.0 };

        sources.insert("Error".to_string(), (error_ss, error_df, error_ms));

        // Corrected total = total SS - intercept SS
        let intercept_ss = sources
            .get("Intercept")
            .map(|(ss, _, _)| *ss)
            .unwrap_or(0.0);
        let corrected_total_ss = total_ss - intercept_ss;
        let df_corrected = df_total - 1; // Adjust for mean

        Ok((sources, total_ss, df_total, corrected_total_ss, df_corrected))
    }
}

/// Mendapatkan degrees of freedom untuk efek
pub fn get_effect_df(
    data: &AnalysisData,
    config: &VarianceCompsConfig,
    effect: &str
) -> Result<usize, String> {
    if effect == "Intercept" {
        return Ok(1);
    }

    // Check if effect is a fixed factor
    if let Some(fix_factors) = &config.main.fix_factor {
        if fix_factors.contains(&effect.to_string()) {
            // For fixed factor, df = number of levels - 1
            let levels = get_factor_levels(data, config, effect)?;
            return Ok(levels.len() - 1);
        }
    }

    // Check if effect is a random factor
    if let Some(rand_factors) = &config.main.rand_factor {
        if rand_factors.contains(&effect.to_string()) {
            // For random factor, df = number of levels - 1
            let levels = get_factor_levels(data, config, effect)?;
            return Ok(levels.len() - 1);
        }
    }

    Err(format!("Effect {} not found in model", effect))
}
