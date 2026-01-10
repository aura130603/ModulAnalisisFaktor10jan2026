use std::collections::HashMap;
use std::f64;

use crate::models::{
    config::VarianceCompsConfig,
    data::AnalysisData,
    result::{
        AnovaTable,
        ComponentCovariation,
        ExpectedMeanSquareSource,
        ExpectedMeanSquares,
        FactorInfo,
        FactorLevel,
        FactorLevelInformation,
        MethodInfo,
        SavedVariables,
        VarianceComponent,
        VarianceEstimates,
    },
};

use super::{
    anova::anova_estimation,
    common::data_value_to_string,
    minque::minque_estimation,
    ml::ml_estimation,
    reml::reml_estimation,
};

/// Mendapatkan informasi level faktor untuk output
pub fn calculate_factor_level_information(
    data: &AnalysisData,
    config: &VarianceCompsConfig
) -> Result<FactorLevelInformation, String> {
    let mut factors = Vec::new();
    let dependent_variable = match &config.main.dep_var {
        Some(dep_var) => dep_var.clone(),
        None => {
            return Err("No dependent variable specified".to_string());
        }
    };

    // Proses fixed factors jika ada
    if let Some(fix_factors) = &config.main.fix_factor {
        for factor_name in fix_factors {
            let mut level_counts = HashMap::new();

            // Hitung frekuensi setiap level
            for i in 0..data.fix_factor_data.len() {
                for records in &data.fix_factor_data[i] {
                    if let Some(value) = records.values.get(factor_name) {
                        let level = data_value_to_string(value);
                        *level_counts.entry(level).or_insert(0) += 1;
                    }
                }
            }

            let mut levels = Vec::new();
            for (level, count) in level_counts {
                levels.push(FactorLevel {
                    level,
                    n: count,
                });
            }

            // Urutkan level untuk output yang konsisten
            levels.sort_by(|a, b| a.level.cmp(&b.level));

            factors.push(FactorInfo {
                factor_name: factor_name.clone(),
                levels,
            });
        }
    }

    // Proses random factors jika ada
    if let Some(rand_factors) = &config.main.rand_factor {
        if let Some(rand_factor_data) = &data.random_factor_data {
            for factor_name in rand_factors {
                let mut level_counts = HashMap::new();

                // Hitung frekuensi setiap level
                for i in 0..rand_factor_data.len() {
                    for records in &rand_factor_data[i] {
                        if let Some(value) = records.values.get(factor_name) {
                            let level = data_value_to_string(value);
                            *level_counts.entry(level).or_insert(0) += 1;
                        }
                    }
                }

                let mut levels = Vec::new();
                for (level, count) in level_counts {
                    levels.push(FactorLevel {
                        level,
                        n: count,
                    });
                }

                // Urutkan level untuk output yang konsisten
                levels.sort_by(|a, b| a.level.cmp(&b.level));

                factors.push(FactorInfo {
                    factor_name: factor_name.clone(),
                    levels,
                });
            }
        }
    }

    Ok(FactorLevelInformation {
        factors,
        dependent_variable,
    })
}

/// Menghitung estimasi komponen varians berdasarkan metode yang dipilih
pub fn calculate_variance_estimates(
    data: &AnalysisData,
    config: &VarianceCompsConfig
) -> Result<VarianceEstimates, String> {
    let method_name;
    let sum_of_squares_type;
    let components;

    if config.options.minque {
        // Metode MINQUE
        method_name = if config.options.uniform { "MINQUE(1)" } else { "MINQUE(0)" };
        sum_of_squares_type = None;

        let estimates = minque_estimation(data, config)?;
        components = estimates
            .into_iter()
            .map(|(component, estimate)| VarianceComponent { component, estimate })
            .collect();
    } else if config.options.anova {
        // Metode ANOVA
        method_name = "ANOVA";
        sum_of_squares_type = Some(
            (if config.options.type_i { "Type I" } else { "Type III" }).to_string()
        );

        let (estimates, _) = anova_estimation(data, config)?;
        components = estimates
            .into_iter()
            .map(|(component, estimate)| VarianceComponent { component, estimate })
            .collect();
    } else if config.options.max_likelihood {
        // Metode Maximum Likelihood
        method_name = "Maximum Likelihood";
        sum_of_squares_type = None;

        let (estimates, _, _) = ml_estimation(data, config)?;
        components = estimates
            .into_iter()
            .map(|(component, estimate)| VarianceComponent { component, estimate })
            .collect();
    } else if config.options.res_max_likelihood {
        // Metode Restricted Maximum Likelihood
        method_name = "Restricted Maximum Likelihood";
        sum_of_squares_type = None;

        let (estimates, _, _) = reml_estimation(data, config)?;
        components = estimates
            .into_iter()
            .map(|(component, estimate)| VarianceComponent { component, estimate })
            .collect();
    } else {
        // Default ke MINQUE(1) jika tidak ada metode yang dipilih
        method_name = "MINQUE(1)";
        sum_of_squares_type = None;

        let estimates = minque_estimation(data, config)?;
        components = estimates
            .into_iter()
            .map(|(component, estimate)| VarianceComponent { component, estimate })
            .collect();
    }

    let dependent_variable = match &config.main.dep_var {
        Some(dep_var) => dep_var.clone(),
        None => {
            return Err("No dependent variable specified".to_string());
        }
    };

    Ok(VarianceEstimates {
        components,
        dependent_variable,
        method: method_name.to_string(),
        sum_of_squares_type,
    })
}

/// Menghitung tabel ANOVA jika metode ANOVA dipilih
pub fn calculate_anova_table(
    data: &AnalysisData,
    config: &VarianceCompsConfig
) -> Result<AnovaTable, String> {
    if !config.options.anova {
        return Err("ANOVA table is only available for ANOVA method".to_string());
    }

    let (_, anova_table) = anova_estimation(data, config)?;
    Ok(anova_table)
}

/// Menghitung expected mean squares jika metode ANOVA dipilih
pub fn calculate_expected_mean_squares(
    data: &AnalysisData,
    config: &VarianceCompsConfig
) -> Result<ExpectedMeanSquares, String> {
    if !config.options.anova {
        return Err("Expected Mean Squares is only available for ANOVA method".to_string());
    }

    let dep_var = match &config.main.dep_var {
        Some(var) => var,
        None => {
            return Err("No dependent variable specified".to_string());
        }
    };

    let binding = Vec::new();
    let random_factors = config.main.rand_factor.as_ref().unwrap_or(&binding);
    let mut sources = Vec::new();

    // Tambahkan intercept jika diikutsertakan
    if config.model.intercept {
        let mut variance_components = HashMap::new();

        // Untuk model efek tetap, expected mean squares mencakup varians dari semua efek acak
        for factor in random_factors {
            // Hitung koefisien dari expected mean squares
            let levels = super::common::get_factor_levels(data, config, factor)?;
            let n_levels = levels.len();

            // Menghitung koefisien berdasarkan formula EMS
            let n_total = data.dependent_data[0].len();
            let coefficient = (n_total as f64) / (n_levels as f64);

            variance_components.insert(format!("Var({})", factor), coefficient);
        }

        // Selalu sertakan varians error
        variance_components.insert("Var(Error)".to_string(), 1.0);

        sources.push(ExpectedMeanSquareSource {
            source: "Intercept".to_string(),
            variance_components,
            quadratic_term: Some("Intercept".to_string()),
        });
    }

    // Tambahkan fixed factors
    if let Some(fix_factors) = &config.main.fix_factor {
        for factor in fix_factors {
            let mut variance_components = HashMap::new();

            // Untuk efek tetap, expected mean squares mencakup varians dari semua efek acak
            for rand_factor in random_factors {
                // Hitung koefisien dari expected mean squares
                let levels = super::common::get_factor_levels(data, config, rand_factor)?;
                let n_levels = levels.len();

                // Menghitung koefisien berdasarkan formula EMS
                let n_total = data.dependent_data[0].len();
                let coefficient = (n_total as f64) / (n_levels as f64);

                variance_components.insert(format!("Var({})", rand_factor), coefficient);
            }

            // Selalu sertakan varians error
            variance_components.insert("Var(Error)".to_string(), 1.0);

            sources.push(ExpectedMeanSquareSource {
                source: factor.clone(),
                variance_components,
                quadratic_term: Some(factor.clone()),
            });
        }
    }

    // Tambahkan random factors
    for factor in random_factors {
        let mut variance_components = HashMap::new();

        // Untuk efek acak, expected mean squares mencakup varians dari efek itu sendiri
        // Hitung koefisien dari expected mean squares
        let levels = super::common::get_factor_levels(data, config, factor)?;
        let n_levels = levels.len();

        // Menghitung koefisien berdasarkan formula EMS
        let n_total = data.dependent_data[0].len();
        let coefficient = (n_total as f64) / (n_levels as f64);

        variance_components.insert(format!("Var({})", factor), coefficient);

        // Selalu sertakan varians error
        variance_components.insert("Var(Error)".to_string(), 1.0);

        sources.push(ExpectedMeanSquareSource {
            source: factor.clone(),
            variance_components,
            quadratic_term: None,
        });
    }

    // Tambahkan error
    let mut error_components = HashMap::new();
    error_components.insert("Var(Error)".to_string(), 1.0);

    sources.push(ExpectedMeanSquareSource {
        source: "Error".to_string(),
        variance_components: error_components,
        quadratic_term: None,
    });

    Ok(ExpectedMeanSquares {
        sources,
        dependent_variable: dep_var.clone(),
        note: Some(
            "Expected Mean Squares are based on Type III Sums of Squares.\nFor each source, the expected mean square equals the sum of the coefficients in the cells times the variance components plus any quadratic term involving effects in the Quadratic Term cell.".to_string()
        ),
    })
}

/// Mendapatkan informasi metode yang digunakan untuk output
pub fn calculate_method_info(
    data: &AnalysisData,
    config: &VarianceCompsConfig
) -> Result<MethodInfo, String> {
    let method_name;
    let method_type;
    let convergence_info;
    let random_effect_priors;
    let sum_of_squares_type;

    if config.options.minque {
        method_name = if config.options.uniform { "MINQUE(1)" } else { "MINQUE(0)" };
        method_type = "Minimum Norm Quadratic Unbiased Estimator".to_string();
        convergence_info = None;
        random_effect_priors = Some(
            (if config.options.uniform { "Uniform" } else { "Zero" }).to_string()
        );
        sum_of_squares_type = None;
    } else if config.options.anova {
        method_name = "ANOVA";
        method_type = "Analysis of Variance".to_string();
        convergence_info = None;
        random_effect_priors = None;
        sum_of_squares_type = Some(
            (if config.options.type_i { "Type I" } else { "Type III" }).to_string()
        );
    } else if config.options.max_likelihood {
        method_name = "Maximum Likelihood";
        method_type = "Maximum Likelihood Estimation".to_string();

        // Untuk ML, kita perlu menjalankan estimasi untuk mendapatkan convergence info
        let (_, conv_info, _) = ml_estimation(data, config)?;
        convergence_info = Some(conv_info);

        random_effect_priors = None;
        sum_of_squares_type = None;
    } else if config.options.res_max_likelihood {
        method_name = "Restricted Maximum Likelihood";
        method_type = "Restricted Maximum Likelihood Estimation".to_string();

        // Untuk REML, kita perlu menjalankan estimasi untuk mendapatkan convergence info
        let (_, conv_info, _) = reml_estimation(data, config)?;
        convergence_info = Some(conv_info);

        random_effect_priors = None;
        sum_of_squares_type = None;
    } else {
        // Default ke MINQUE(1)
        method_name = "MINQUE(1)";
        method_type = "Minimum Norm Quadratic Unbiased Estimator".to_string();
        convergence_info = None;
        random_effect_priors = Some("Uniform".to_string());
        sum_of_squares_type = None;
    }

    Ok(MethodInfo {
        method_name: method_name.to_string(),
        method_type,
        convergence_info,
        random_effect_priors,
        sum_of_squares_type,
    })
}

/// Menyimpan estimasi komponen varians ke variabel
pub fn save_variance_component_estimates(
    data: &AnalysisData,
    config: &VarianceCompsConfig
) -> Result<SavedVariables, String> {
    if !config.save.var_comp_est {
        return Err(
            "Saving variance component estimates is not enabled in configuration".to_string()
        );
    }

    // Mendapatkan estimasi varians
    let variance_estimates = calculate_variance_estimates(data, config)?;

    // Membuat variabel untuk disimpan
    let mut variable_names = Vec::new();
    let mut variable_labels = HashMap::new();
    let mut values = Vec::new();

    // Menambahkan estimasi komponen varians
    let mut row = Vec::new();

    for component in &variance_estimates.components {
        variable_names.push(component.component.clone());
        variable_labels.insert(
            component.component.clone(),
            format!("Variance Component for {}", component.component)
        );
        row.push(component.estimate);
    }

    values.push(row);

    Ok(SavedVariables {
        variable_names,
        variable_labels,
        values,
    })
}

/// Menyimpan matriks kovariasi komponen
pub fn save_component_covariation(
    data: &AnalysisData,
    config: &VarianceCompsConfig
) -> Result<ComponentCovariation, String> {
    if !config.save.comp_covar {
        return Err("Saving component covariation is not enabled in configuration".to_string());
    }

    // Fungsi ini hanya tersedia untuk metode ML dan REML
    if !config.options.max_likelihood && !config.options.res_max_likelihood {
        return Err("Component covariation is only available for ML and REML methods".to_string());
    }

    // Dapatkan matriks
    let matrix;

    if config.options.max_likelihood {
        let (_, _, covariation) = ml_estimation(data, config)?;
        matrix = covariation.matrix;
    } else {
        let (_, _, covariation) = reml_estimation(data, config)?;
        matrix = covariation.matrix;
    }

    // Tentukan tipe matriks (kovarians atau korelasi)
    let matrix_type_str = if config.save.cor_matrix { "Correlation" } else { "Covariance" };

    Ok(ComponentCovariation {
        matrix_type: matrix_type_str.to_string(),
        matrix,
    })
}
