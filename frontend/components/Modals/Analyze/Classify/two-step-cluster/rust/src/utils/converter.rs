use wasm_bindgen::JsValue;
use serde::Serialize;

use crate::models::result::{
    AutoClustering,
    CentroidData,
    ClusterDistribution,
    ClusterSizes,
    ClusteringResult,
    ModelSummary,
    VariableDistribution,
};

// Convert String error to JsValue for WASM interaction
pub fn string_to_js_error(error: String) -> JsValue {
    JsValue::from_str(&error)
}

pub fn format_result(result: &Option<ClusteringResult>) -> Result<JsValue, JsValue> {
    match result {
        Some(result) => {
            let formatted = FormatResult::from_clustering_result(result);
            Ok(serde_wasm_bindgen::to_value(&formatted).unwrap())
        }
        None => Err(JsValue::from_str("No clustering results available")),
    }
}

#[derive(Serialize)]
struct FormatResult {
    model_summary: Option<ModelSummary>,
    cell_distribution: Option<Vec<FormattedCellDistribution>>,
    cluster_profiles: Option<FormattedClusterProfiles>,
    auto_clustering: Option<AutoClustering>,
    cluster_distribution: Option<ClusterDistribution>,
    clusters: Option<Vec<FormattedClusterGroup>>,
    predictor_importance: Option<FormattedPredictorImportance>,
    cluster_sizes: Option<ClusterSizes>,
}

#[derive(Serialize)]
struct FormattedCellDistribution {
    variable: String,
    distribution: VariableDistribution,
}

#[derive(Serialize)]
struct FormattedClusterProfiles {
    centroids: Vec<FormattedCentroid>,
    frequencies: Vec<FormattedFrequency>,
}

#[derive(Serialize)]
struct FormattedClusterGroup {
    label: Option<String>,
    description: Option<String>,
    size: f64,
    inputs: Vec<FormattedInput>,
}

#[derive(Serialize)]
struct FormattedCentroid {
    variable: String,
    data: CentroidData,
}

#[derive(Serialize)]
struct FormattedFrequency {
    variable: String,
    categories: Vec<FormattedCategory>,
}

#[derive(Serialize)]
struct FormattedCategory {
    category: String,
    frequency: i32,
    percent: f64,
}

#[derive(Serialize)]
struct FormattedInput {
    variable: String,
    value: f64,
}

#[derive(Serialize)]
struct FormattedPredictorImportance {
    predictors: Vec<FormattedPredictor>,
}

#[derive(Serialize)]
struct FormattedPredictor {
    variable: String,
    importance: f64,
}

impl FormatResult {
    fn from_clustering_result(result: &ClusteringResult) -> Self {
        let cell_distribution = result.cell_distribution.as_ref().map(|dist| {
            dist.distributions
                .iter()
                .map(|(key, value)| {
                    FormattedCellDistribution {
                        variable: key.clone(),
                        distribution: value.clone(),
                    }
                })
                .collect()
        });

        let cluster_profiles = result.cluster_profiles.as_ref().map(|profiles| {
            let centroids = profiles.centroids
                .iter()
                .map(|(key, value)| {
                    FormattedCentroid {
                        variable: key.clone(),
                        data: value.clone(),
                    }
                })
                .collect();

            let frequencies = profiles.frequencies
                .iter()
                .map(|(key, freq_data)| {
                    let categories = freq_data.categories
                        .iter()
                        .map(|(cat_key, cat_freq)| {
                            FormattedCategory {
                                category: cat_key.clone(),
                                frequency: cat_freq.frequency,
                                percent: cat_freq.percent,
                            }
                        })
                        .collect();

                    FormattedFrequency {
                        variable: key.clone(),
                        categories,
                    }
                })
                .collect();

            FormattedClusterProfiles {
                centroids,
                frequencies,
            }
        });

        let clusters = result.clusters.as_ref().map(|cluster_data| {
            cluster_data.cluster_groups
                .iter()
                .map(|group| {
                    let inputs = group.inputs
                        .iter()
                        .map(|(key, value)| {
                            FormattedInput {
                                variable: key.clone(),
                                value: *value,
                            }
                        })
                        .collect();

                    FormattedClusterGroup {
                        label: group.label.clone(),
                        description: group.description.clone(),
                        size: group.size,
                        inputs,
                    }
                })
                .collect()
        });

        let predictor_importance = result.predictor_importance.as_ref().map(|importance| {
            let predictors = importance.predictors
                .iter()
                .map(|(key, value)| {
                    FormattedPredictor {
                        variable: key.clone(),
                        importance: *value,
                    }
                })
                .collect();

            FormattedPredictorImportance {
                predictors,
            }
        });

        FormatResult {
            model_summary: result.model_summary.clone(),
            cell_distribution,
            cluster_profiles,
            auto_clustering: result.auto_clustering.clone(),
            cluster_distribution: result.cluster_distribution.clone(),
            clusters,
            predictor_importance,
            cluster_sizes: result.cluster_sizes.clone(),
        }
    }
}
