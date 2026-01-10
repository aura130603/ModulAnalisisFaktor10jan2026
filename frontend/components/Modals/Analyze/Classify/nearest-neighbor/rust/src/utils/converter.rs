use wasm_bindgen::JsValue;
use serde::Serialize;

use crate::models::result::{
    CaseProcessingSummary,
    ClassificationTable,
    ErrorSummary,
    FocalNeighborSet,
    NearestNeighborAnalysis,
    NearestNeighbors,
    PredictorSpace,
    SystemSettings,
};

pub fn string_to_js_error(error: String) -> JsValue {
    JsValue::from_str(&error)
}

pub fn format_result(result: &Option<NearestNeighborAnalysis>) -> Result<JsValue, JsValue> {
    match result {
        Some(result) => {
            let formatted = FormatResult::from_analysis_result(result);
            Ok(serde_wasm_bindgen::to_value(&formatted).unwrap())
        }
        None => Err(JsValue::from_str("No analysis results available")),
    }
}

#[derive(Serialize)]
struct FormatResult {
    case_processing_summary: Option<CaseProcessingSummary>,
    system_settings: Option<SystemSettings>,
    predictor_importance: Option<FormattedPredictorImportance>,
    classification_table: Option<ClassificationTable>,
    error_summary: Option<ErrorSummary>,
    predictor_space: Option<PredictorSpace>,
    peers_chart: Option<FormattedPeersChart>,
    nearest_neighbors: Option<NearestNeighbors>,
    quadrant_map: Option<FormattedQuadrantMap>,
}

#[derive(Serialize)]
struct FormattedPredictorImportance {
    predictors: Vec<PredictorEntry>,
    target: String,
}

#[derive(Serialize)]
struct PredictorEntry {
    name: String,
    value: f64,
}

#[derive(Serialize)]
struct FormattedPeersChart {
    focal_neighbor_sets: Vec<FocalNeighborSet>,
    features: Vec<FeatureEntry>,
}

#[derive(Serialize)]
struct FormattedQuadrantMap {
    focal_neighbor_sets: Vec<FocalNeighborSet>,
    features: Vec<FeatureEntry>,
}

#[derive(Serialize)]
struct FeatureEntry {
    name: String,
    values: Vec<f64>,
}

impl FormatResult {
    fn from_analysis_result(result: &NearestNeighborAnalysis) -> Self {
        let predictor_importance = result.predictor_importance.as_ref().map(|pi| {
            let predictors = pi.predictors
                .iter()
                .map(|(name, value)| {
                    PredictorEntry {
                        name: name.clone(),
                        value: *value,
                    }
                })
                .collect();

            FormattedPredictorImportance {
                predictors,
                target: pi.target.clone(),
            }
        });

        let peers_chart = result.peers_chart.as_ref().map(|pc| {
            let features = pc.features
                .iter()
                .map(|(name, values)| {
                    FeatureEntry {
                        name: name.clone(),
                        values: values.clone(),
                    }
                })
                .collect();

            FormattedPeersChart {
                focal_neighbor_sets: pc.focal_neighbor_sets.clone(),
                features,
            }
        });

        let quadrant_map = result.quadrant_map.as_ref().map(|qm| {
            let features = qm.features
                .iter()
                .map(|(name, values)| {
                    FeatureEntry {
                        name: name.clone(),
                        values: values.clone(),
                    }
                })
                .collect();

            FormattedQuadrantMap {
                focal_neighbor_sets: qm.focal_neighbor_sets.clone(),
                features,
            }
        });

        FormatResult {
            case_processing_summary: result.case_processing_summary.clone(),
            system_settings: result.system_settings.clone(),
            predictor_importance,
            classification_table: result.classification_table.clone(),
            error_summary: result.error_summary.clone(),
            predictor_space: result.predictor_space.clone(),
            peers_chart,
            nearest_neighbors: result.nearest_neighbors.clone(),
            quadrant_map,
        }
    }
}
