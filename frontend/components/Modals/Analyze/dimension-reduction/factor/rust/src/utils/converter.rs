// perbaikan bisa (9/1/2026)

use wasm_bindgen::JsValue;
use serde::Serialize;
use crate::models::config::OptionsConfig;
use crate::stats::display_format::format_factor_matrix;
use crate::models::result::{
    ComponentCorrelationMatrix,
    ComponentScoreCovarianceMatrix,
    ComponentTransformationMatrix,
    DescriptiveStatistic,
    FactorAnalysisResult,
    KMOBartlettsTest,
    ScreePlot,
    TotalVarianceComponent,
    LoadingPlot,
};

pub fn string_to_js_error(error: String) -> JsValue {
    JsValue::from_str(&error)
}

pub fn format_result(result: &Option<FactorAnalysisResult>, config: &crate::models::config::FactorAnalysisConfig) -> Result<JsValue, JsValue> {
    match result {
        Some(result) => {
            let formatted = FormatResult::from_analysis_result(result, &config.options);
            Ok(serde_wasm_bindgen::to_value(&formatted).unwrap())
        }
        None => Err(JsValue::from_str("No analysis results available")),
    }
}

#[derive(Serialize)]
struct FormatResult {
    descriptive_statistics: Option<Vec<DescriptiveStatistic>>,
    scree_plot: Option<ScreePlot>,
    correlation_matrix: Option<FormattedCorrelation>,
    inverse_correlation_matrix: Option<FormattedInverseCorrelation>,
    covariance_matrix: Option<FormattedCovariance>,
    inverse_covariance_matrix: Option<FormattedInverseCovariance>,
    kmo_bartletts_test: Option<KMOBartlettsTest>,
    anti_image_matrices: Option<FormattedAntiImage>,
    communalities: Option<FormattedCommunalities>,
    // total_variance_explained: Option<FormattedTotalVarianceExplained>,
    total_variance_explained: Option<Vec<(String, FormattedTotalVarianceExplained)>>,
    component_matrix: Option<FormattedComponentMatrix>,
    reproduced_correlations: Option<FormattedReproducedCorrelations>,
    reproduced_covariances: Option<FormattedReproducedCovariances>,
    rotated_component_matrix: Option<FormattedRotatedComponentMatrix>,
    component_transformation_matrix: Option<ComponentTransformationMatrix>,
    pattern_matrix: Option<FormattedPatternMatrix>,
    structure_matrix: Option<FormattedStructureMatrix>,
    component_correlation_matrix: Option<ComponentCorrelationMatrix>,
    component_score_coefficient_matrix: Option<FormattedComponentScoreCoefficient>,
    component_score_covariance_matrix: Option<ComponentScoreCovarianceMatrix>,
    factor_scores: Option<Vec<ScoreColumn>>,
    loading_plot: Option<LoadingPlot>,
}

#[derive(Serialize)]
struct FormattedTotalVarianceBlock {
    headers: Vec<String>,
    rows: Vec<Vec<f64>>,
}

#[derive(Serialize)]
struct FormattedTotalVarianceExplained {
    matrix_type: String,
    initial: FormattedTotalVarianceBlock,
    extraction: FormattedTotalVarianceBlock,
    rotation: FormattedTotalVarianceBlock,
}


#[derive(Serialize)]
struct FormattedCorrelation {
    correlations: Vec<CorrelationEntry>,
    sig_values: Vec<CorrelationEntry>,
}

#[derive(Serialize)]
struct CorrelationEntry {
    variable: String,
    values: Vec<VariableValue>,
}

#[derive(Serialize)]
struct VariableValue {
    variable: String,
    value: f64,
}

#[derive(Serialize)]
struct FormattedInverseCorrelation {
    inverse_correlations: Vec<CorrelationEntry>,
}

#[derive(Serialize)]
struct FormattedCovariance {
    covariances: Vec<CorrelationEntry>,
    determinant: f64,
}

#[derive(Serialize)]
struct FormattedInverseCovariance {
    inverse_covariances: Vec<CorrelationEntry>,
    determinant: f64,
}

#[derive(Serialize)]
struct FormattedAntiImage {
    anti_image_covariance: Vec<CorrelationEntry>,
    anti_image_correlation: Vec<CorrelationEntry>,
}

#[derive(Serialize)]
struct FormattedCommunalities {
    raw_initial: Vec<VariableValue>,
    rescaled_initial: Vec<VariableValue>,
    extraction: Vec<VariableValue>,
    rescaled_extraction: Vec<VariableValue>,
    extraction_matrix_type: String,
}

#[derive(Serialize)]
struct FormattedComponentMatrix {
    components: Vec<FormattedComponentEntry>,
}

#[derive(Serialize)]
struct ComponentEntry {
    variable: String,
    values: Vec<f64>,
}

/// Entry khusus untuk matriks yang terpengaruh oleh Sorted by Size dan Suppress Small Coefficients:
/// - Component Matrix
/// - Rotated Component Matrix
/// - Pattern Matrix
/// - Structure Matrix
#[derive(Serialize)]
struct FormattedComponentEntry {
    variable: String,
    values: Vec<Option<f64>>,
}

#[derive(Serialize)]
struct FormattedReproducedCorrelations {
    reproduced_correlation: Vec<CorrelationEntry>,
    residual: Vec<CorrelationEntry>,
}

#[derive(Serialize)]
struct FormattedReproducedCovariances {
    reproduced_covariance: Vec<CorrelationEntry>,
    residual: Vec<CorrelationEntry>,
}

#[derive(Serialize)]
struct FormattedRotatedComponentMatrix {
    components: Vec<FormattedComponentEntry>,
}

#[derive(Serialize)]
struct FormattedPatternMatrix {
    components: Vec<FormattedComponentEntry>,
}

#[derive(Serialize)]
struct FormattedStructureMatrix {
    components: Vec<FormattedComponentEntry>,
}

#[derive(Serialize)]
struct FormattedComponentScoreCoefficient {
    components: Vec<ComponentEntry>,
}

// STRUCT BARU UNTUK FORMAT SKOR
#[derive(Serialize)]
struct ScoreColumn {
    variable_name: String, // misal: "FAC1_1"
    values: Vec<f64>,      // nilai per baris
}

impl FormatResult {
    fn from_analysis_result(result: &FactorAnalysisResult, options: &OptionsConfig) -> Self {
        let correlation_matrix = result.correlation_matrix.as_ref().map(|matrix| {
            // Use variable_order to maintain the correct order
            let correlations = matrix.variable_order
                .iter()
                .map(|var_name| {
                    let values = matrix.correlations
                        .get(var_name)
                        .map(|var_values| {
                            // Build values in the order of variables
                            matrix.variable_order
                                .iter()
                                .map(|other_var| {
                                    VariableValue {
                                        variable: other_var.clone(),
                                        value: *var_values.get(other_var).unwrap_or(&0.0),
                                    }
                                })
                                .collect()
                        })
                        .unwrap_or_default();

                    CorrelationEntry {
                        variable: var_name.clone(),
                        values,
                    }
                })
                .collect();

            let sig_values = if matrix.sig_values.values().all(|v| v.is_empty()) {
                // Don't populate sig_values if none were calculated (all inner HashMaps are empty)
                Vec::new()
            } else {
                matrix.variable_order
                    .iter()
                    .map(|var_name| {
                        let values = matrix.sig_values
                            .get(var_name)
                            .map(|var_values| {
                                matrix.variable_order
                                    .iter()
                                    .map(|other_var| {
                                        VariableValue {
                                            variable: other_var.clone(),
                                            value: *var_values.get(other_var).unwrap_or(&0.0),
                                        }
                                    })
                                    .collect()
                            })
                            .unwrap_or_default();

                        CorrelationEntry {
                            variable: var_name.clone(),
                            values,
                        }
                    })
                    .collect()
            };

            FormattedCorrelation {
                correlations,
                sig_values,
            }
        });

        let inverse_correlation_matrix = result.inverse_correlation_matrix.as_ref().map(|matrix| {
            let inverse_correlations = matrix.variable_order
                .iter()
                .map(|var_name| {
                    let values = matrix.inverse_correlations
                        .get(var_name)
                        .map(|var_values| {
                            matrix.variable_order
                                .iter()
                                .map(|other_var| {
                                    VariableValue {
                                        variable: other_var.clone(),
                                        value: *var_values.get(other_var).unwrap_or(&0.0),
                                    }
                                })
                                .collect()
                        })
                        .unwrap_or_default();

                    CorrelationEntry {
                        variable: var_name.clone(),
                        values,
                    }
                })
                .collect();

            FormattedInverseCorrelation {
                inverse_correlations,
            }
        });

        let covariance_matrix = result.covariance_matrix.as_ref().map(|matrix| {
            let covariances = matrix.variable_order
                .iter()
                .map(|var_name| {
                    let values = matrix.covariances
                        .get(var_name)
                        .map(|var_values| {
                            matrix.variable_order
                                .iter()
                                .map(|other_var| {
                                    VariableValue {
                                        variable: other_var.clone(),
                                        value: *var_values.get(other_var).unwrap_or(&0.0),
                                    }
                                })
                                .collect()
                        })
                        .unwrap_or_default();

                    CorrelationEntry {
                        variable: var_name.clone(),
                        values,
                    }
                })
                .collect();

            FormattedCovariance {
                covariances,
                determinant: matrix.determinant,
            }
        });

        let inverse_covariance_matrix = result.inverse_covariance_matrix.as_ref().map(|matrix| {
            let inverse_covariances = matrix.variable_order
                .iter()
                .map(|var_name| {
                    let values = matrix.inverse_covariances
                        .get(var_name)
                        .map(|var_values| {
                            matrix.variable_order
                                .iter()
                                .map(|other_var| {
                                    VariableValue {
                                        variable: other_var.clone(),
                                        value: *var_values.get(other_var).unwrap_or(&0.0),
                                    }
                                })
                                .collect()
                        })
                        .unwrap_or_default();

                    CorrelationEntry {
                        variable: var_name.clone(),
                        values,
                    }
                })
                .collect();

            FormattedInverseCovariance {
                inverse_covariances,
                determinant: matrix.determinant,
            }
        });

        let anti_image_matrices = result.anti_image_matrices.as_ref().map(|matrices| {
            let anti_image_covariance = matrices.variable_order
                .iter()
                .map(|var_name| {
                    let values = matrices.anti_image_covariance
                        .get(var_name)
                        .map(|var_values| {
                            matrices.variable_order
                                .iter()
                                .map(|other_var| {
                                    VariableValue {
                                        variable: other_var.clone(),
                                        value: *var_values.get(other_var).unwrap_or(&0.0),
                                    }
                                })
                                .collect()
                        })
                        .unwrap_or_default();

                    CorrelationEntry {
                        variable: var_name.clone(),
                        values,
                    }
                })
                .collect();

            let anti_image_correlation = matrices.variable_order
                .iter()
                .map(|var_name| {
                    let values = matrices.anti_image_correlation
                        .get(var_name)
                        .map(|var_values| {
                            matrices.variable_order
                                .iter()
                                .map(|other_var| {
                                    VariableValue {
                                        variable: other_var.clone(),
                                        value: *var_values.get(other_var).unwrap_or(&0.0),
                                    }
                                })
                                .collect()
                        })
                        .unwrap_or_default();

                    CorrelationEntry {
                        variable: var_name.clone(),
                        values,
                    }
                })
                .collect();

            FormattedAntiImage {
                anti_image_covariance,
                anti_image_correlation,
            }
        });

        let communalities = result.communalities.as_ref().map(|comm| {
            let raw_initial = comm.variable_order
                .iter()
                .map(|var_name| {
                    VariableValue {
                        variable: var_name.clone(),
                        value: *comm.raw_initial.get(var_name).unwrap_or(&0.0),
                    }
                })
                .collect();

            let rescaled_initial = comm.variable_order
                .iter()
                .map(|var_name| {
                    VariableValue {
                        variable: var_name.clone(),
                        value: *comm.rescaled_initial.get(var_name).unwrap_or(&0.0),
                    }
                })
                .collect();

            // --- PERBAIKAN DI SINI ---
            // Jika comm.extraction kosong (karena suppress di report.rs atau Unrotated = false),
            // JANGAN lakukan mapping dengan unwrap_or(&0.0). Kembalikan Vec kosong.
            let extraction: Vec<VariableValue> = if comm.extraction.is_empty() {
                Vec::new()
            } else {
                comm.variable_order
                    .iter()
                    .map(|var_name| {
                        VariableValue {
                            variable: var_name.clone(),
                            value: *comm.extraction.get(var_name).unwrap_or(&0.0),
                        }
                    })
                    .collect()
            };

            // Rescaled Extraction (untuk covariance mode)
            let rescaled_extraction: Vec<VariableValue> = if comm.rescaled_extraction.is_empty() {
                Vec::new()
            } else {
                comm.variable_order
                    .iter()
                    .map(|var_name| {
                        VariableValue {
                            variable: var_name.clone(),
                            value: *comm.rescaled_extraction.get(var_name).unwrap_or(&0.0),
                        }
                    })
                    .collect()
            };


            FormattedCommunalities {
                raw_initial,
                rescaled_initial,
                extraction,
                rescaled_extraction,
                extraction_matrix_type: comm.extraction_matrix_type.clone(),
            }
        });

        // ==================================================================================
        // COMPONENT MATRIX - TERPENGARUH OLEH SORTED BY SIZE DAN SUPPRESS SMALL COEFFICIENTS
        // ==================================================================================
        let component_matrix = result.component_matrix.as_ref().map(|matrix| {
            // Konversi HashMap ke Vec<Vec<f64>> dengan urutan sesuai variable_order
            let values: Vec<Vec<f64>> = matrix.variable_order
                .iter()
                .map(|var_name| {
                    matrix.components.get(var_name).cloned().unwrap_or_default()
                })
                .collect();

            // Terapkan sorting dan suppress menggunakan display_format
            let formatted = format_factor_matrix(&matrix.variable_order, &values, options);

            // Konversi kembali ke FormattedComponentEntry
            let components: Vec<FormattedComponentEntry> = formatted.sorted_var_names
                .iter()
                .zip(formatted.formatted_values.iter())
                .map(|(name, vals)| FormattedComponentEntry {
                    variable: name.clone(),
                    values: vals.clone(),
                })
                .collect();

            FormattedComponentMatrix {
                components,
            }
        });

        let reproduced_correlations = result.reproduced_correlations.as_ref().map(|corr| {
            let reproduced_correlation = corr.variable_order
                .iter()
                .map(|var_name| {
                    let values = corr.reproduced_correlation
                        .get(var_name)
                        .map(|var_values| {
                            corr.variable_order
                                .iter()
                                .map(|other_var| {
                                    VariableValue {
                                        variable: other_var.clone(),
                                        value: *var_values.get(other_var).unwrap_or(&0.0),
                                    }
                                })
                                .collect()
                        })
                        .unwrap_or_default();

                    CorrelationEntry {
                        variable: var_name.clone(),
                        values,
                    }
                })
                .collect();

            let residual = corr.variable_order
                .iter()
                .map(|var_name| {
                    let values = corr.residual
                        .get(var_name)
                        .map(|var_values| {
                            corr.variable_order
                                .iter()
                                .map(|other_var| {
                                    VariableValue {
                                        variable: other_var.clone(),
                                        value: *var_values.get(other_var).unwrap_or(&0.0),
                                    }
                                })
                                .collect()
                        })
                        .unwrap_or_default();

                    CorrelationEntry {
                        variable: var_name.clone(),
                        values,
                    }
                })
                .collect();

            FormattedReproducedCorrelations {
                reproduced_correlation,
                residual,
            }
        });

        let reproduced_covariances = result.reproduced_covariances.as_ref().map(|cov| {
            let reproduced_covariance = cov.variable_order
                .iter()
                .map(|var_name| {
                    let values = cov.reproduced_covariance
                        .get(var_name)
                        .map(|var_values| {
                            cov.variable_order
                                .iter()
                                .map(|other_var| {
                                    VariableValue {
                                        variable: other_var.clone(),
                                        value: *var_values.get(other_var).unwrap_or(&0.0),
                                    }
                                })
                                .collect()
                        })
                        .unwrap_or_default();

                    CorrelationEntry {
                        variable: var_name.clone(),
                        values,
                    }
                })
                .collect();

            let residual = cov.variable_order
                .iter()
                .map(|var_name| {
                    let values = cov.residual
                        .get(var_name)
                        .map(|var_values| {
                            cov.variable_order
                                .iter()
                                .map(|other_var| {
                                    VariableValue {
                                        variable: other_var.clone(),
                                        value: *var_values.get(other_var).unwrap_or(&0.0),
                                    }
                                })
                                .collect()
                        })
                        .unwrap_or_default();

                    CorrelationEntry {
                        variable: var_name.clone(),
                        values,
                    }
                })
                .collect();

            FormattedReproducedCovariances {
                reproduced_covariance,
                residual,
            }
        });

        // ==================================================================================
        // ROTATED COMPONENT MATRIX - TERPENGARUH OLEH SORTED BY SIZE DAN SUPPRESS SMALL COEFFICIENTS
        // ==================================================================================
        let rotated_component_matrix = result.rotated_component_matrix.as_ref().map(|matrix| {
            // Konversi HashMap ke Vec<Vec<f64>> dengan urutan sesuai variable_order
            let values: Vec<Vec<f64>> = matrix.variable_order
                .iter()
                .map(|var_name| {
                    matrix.components.get(var_name).cloned().unwrap_or_default()
                })
                .collect();

            // Terapkan sorting dan suppress menggunakan display_format
            let formatted = format_factor_matrix(&matrix.variable_order, &values, options);

            // Konversi kembali ke FormattedComponentEntry
            let components: Vec<FormattedComponentEntry> = formatted.sorted_var_names
                .iter()
                .zip(formatted.formatted_values.iter())
                .map(|(name, vals)| FormattedComponentEntry {
                    variable: name.clone(),
                    values: vals.clone(),
                })
                .collect();

            FormattedRotatedComponentMatrix {
                components,
            }
        });

        // ==================================================================================
        // PATTERN MATRIX - TERPENGARUH OLEH SORTED BY SIZE DAN SUPPRESS SMALL COEFFICIENTS
        // ==================================================================================
        let pattern_matrix = result.pattern_matrix.as_ref().map(|matrix| {
            // Konversi HashMap ke Vec<Vec<f64>> dengan urutan sesuai variable_order
            let values: Vec<Vec<f64>> = matrix.variable_order
                .iter()
                .map(|var_name| {
                    matrix.components.get(var_name).cloned().unwrap_or_default()
                })
                .collect();

            // Terapkan sorting dan suppress menggunakan display_format
            let formatted = format_factor_matrix(&matrix.variable_order, &values, options);

            // Konversi kembali ke FormattedComponentEntry
            let components: Vec<FormattedComponentEntry> = formatted.sorted_var_names
                .iter()
                .zip(formatted.formatted_values.iter())
                .map(|(name, vals)| FormattedComponentEntry {
                    variable: name.clone(),
                    values: vals.clone(),
                })
                .collect();

            FormattedPatternMatrix {
                components,
            }
        });

        // ==================================================================================
        // STRUCTURE MATRIX - TERPENGARUH OLEH SORTED BY SIZE DAN SUPPRESS SMALL COEFFICIENTS
        // ==================================================================================
        let structure_matrix = result.structure_matrix.as_ref().map(|matrix| {
            // Konversi HashMap ke Vec<Vec<f64>> dengan urutan sesuai variable_order
            let values: Vec<Vec<f64>> = matrix.variable_order
                .iter()
                .map(|var_name| {
                    matrix.components.get(var_name).cloned().unwrap_or_default()
                })
                .collect();

            // Terapkan sorting dan suppress menggunakan display_format
            let formatted = format_factor_matrix(&matrix.variable_order, &values, options);

            // Konversi kembali ke FormattedComponentEntry
            let components: Vec<FormattedComponentEntry> = formatted.sorted_var_names
                .iter()
                .zip(formatted.formatted_values.iter())
                .map(|(name, vals)| FormattedComponentEntry {
                    variable: name.clone(),
                    values: vals.clone(),
                })
                .collect();

            FormattedStructureMatrix {
                components,
            }
        });

        // ==================================================================================
        // COMPONENT SCORE COEFFICIENT MATRIX - TIDAK TERPENGARUH (tetap menggunakan urutan asli)
        // ==================================================================================
        let component_score_coefficient_matrix = result.component_score_coefficient_matrix
            .as_ref()
            .map(|matrix| {
                let components = matrix.variable_order
                    .iter()
                    .map(|var_name| {
                        ComponentEntry {
                            variable: var_name.clone(),
                            values: matrix.components.get(var_name).cloned().unwrap_or_default(),
                        }
                    })
                    .collect();

                FormattedComponentScoreCoefficient {
                    components,
                }
            });

        let total_variance_explained = result.total_variance_explained.as_ref().map(|tve| {

    let map_components = |components: &Vec<TotalVarianceComponent>| {
        components
            .iter()
            .map(|c| {
                vec![
                    c.total,
                    c.percent_of_variance,
                    c.cumulative_percent,
                ]
            })
            .collect::<Vec<Vec<f64>>>()
    };

    let formatted_blocks = tve.blocks.iter().map(|block| {

        let initial_headers = if tve.extraction_matrix_type == "covariance" {
            match block.label.as_str() {
                "Raw" => vec![
                    "Raw Eigenvalue".into(),
                    "% of Variance".into(),
                    "Cumulative %".into(),
                ],
                "Rescaled" => vec![
                    "Rescaled Eigenvalue".into(),
                    "% of Variance".into(),
                    "Cumulative %".into(),
                ],
                _ => vec![],
            }
        } else {
            vec![
                "Total".into(),
                "% of Variance".into(),
                "Cumulative %".into(),
            ]
        };

        (
            block.label.clone(),
            FormattedTotalVarianceExplained {
                matrix_type: tve.extraction_matrix_type.clone(),
                initial: FormattedTotalVarianceBlock {
                    headers: initial_headers.clone(),
                    rows: map_components(&block.initial),
                },
                extraction: FormattedTotalVarianceBlock {
                    headers: initial_headers.clone(),
                    rows: map_components(&block.extraction),
                },
                rotation: FormattedTotalVarianceBlock {
                    headers: initial_headers,
                    rows: block
                        .rotation
                        .as_ref()
                        .map(map_components)
                        .unwrap_or_default(),
                },
            }
        )
    }).collect::<Vec<_>>();

    formatted_blocks
});


    // MAPPING FACTOR SCORES
        let factor_scores = result.factor_scores.as_ref().map(|scores| {
            // Sort keys agar urutan FAC1_1, FAC2_1 rapi
            let mut keys: Vec<&String> = scores.keys().collect();
            keys.sort(); 

            keys.iter().map(|k| {
                ScoreColumn {
                    variable_name: k.to_string(),
                    values: scores.get(*k).unwrap().clone(),
                }
            }).collect()
        });

        FormatResult {
            descriptive_statistics: result.descriptive_statistics.clone(),
            scree_plot: result.scree_plot.clone(),
            correlation_matrix,
            inverse_correlation_matrix,
            covariance_matrix,
            inverse_covariance_matrix,
            kmo_bartletts_test: result.kmo_bartletts_test.clone(),
            anti_image_matrices,
            communalities,
            // total_variance_explained: result.total_variance_explained.clone(),
            total_variance_explained,
            component_matrix,
            reproduced_correlations,
            reproduced_covariances,
            rotated_component_matrix,
            component_transformation_matrix: result.component_transformation_matrix.clone(),
            pattern_matrix,
            structure_matrix,
            component_correlation_matrix: result.component_correlation_matrix.clone(),
            component_score_coefficient_matrix,
            component_score_covariance_matrix: result.component_score_covariance_matrix.clone(),
            factor_scores,
            loading_plot: result.loading_plot.clone(),
        }
    }
}
