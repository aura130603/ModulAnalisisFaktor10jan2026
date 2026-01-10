use wasm_bindgen::JsValue;
use serde::Serialize;

use crate::models::result::{
    ROCAnalysisResult,
    CaseProcessingSummary,
    PrecisionRecallCoordinate,
    RocCoordinate,
    AreaUnderRocCurve,
    ClassifierEvaluationMetrics,
};

// Konversi dari String error ke JsValue untuk interaksi WASM
pub fn string_to_js_error(error: String) -> JsValue {
    JsValue::from_str(&error)
}

pub fn format_result(result: &Option<ROCAnalysisResult>) -> Result<JsValue, JsValue> {
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
    coordinates_precision_recall: Option<Vec<FormattedPrecisionRecall>>,
    coordinates_roc: Option<Vec<FormattedRoc>>,
    area_under_roc_curve: Option<Vec<FormattedArea>>,
    overall_model_quality: Option<Vec<FormattedQuality>>,
    classifier_evaluation_metrics: Option<Vec<FormattedMetrics>>,
}

#[derive(Serialize)]
struct FormattedPrecisionRecall {
    variable: String,
    coordinates: Vec<PrecisionRecallCoordinate>,
}

#[derive(Serialize)]
struct FormattedRoc {
    variable: String,
    coordinates: Vec<RocCoordinate>,
}

#[derive(Serialize)]
struct FormattedArea {
    variable: String,
    data: AreaUnderRocCurve,
}

#[derive(Serialize)]
struct FormattedQuality {
    variable: String,
    quality: f64,
}

#[derive(Serialize)]
struct FormattedMetrics {
    variable: String,
    metrics: ClassifierEvaluationMetrics,
}

impl FormatResult {
    fn from_analysis_result(result: &ROCAnalysisResult) -> Self {
        let coordinates_precision_recall = result.coordinates_precision_recall.as_ref().map(|map| {
            map.iter()
                .map(|(key, value)| {
                    FormattedPrecisionRecall {
                        variable: key.clone(),
                        coordinates: value.clone(),
                    }
                })
                .collect()
        });

        let coordinates_roc = result.coordinates_roc.as_ref().map(|map| {
            map.iter()
                .map(|(key, value)| {
                    FormattedRoc {
                        variable: key.clone(),
                        coordinates: value.clone(),
                    }
                })
                .collect()
        });

        let area_under_roc_curve = result.area_under_roc_curve.as_ref().map(|map| {
            map.iter()
                .map(|(key, value)| {
                    FormattedArea {
                        variable: key.clone(),
                        data: value.clone(),
                    }
                })
                .collect()
        });

        let overall_model_quality = result.overall_model_quality.as_ref().map(|map| {
            map.iter()
                .map(|(key, value)| {
                    FormattedQuality {
                        variable: key.clone(),
                        quality: *value,
                    }
                })
                .collect()
        });

        let classifier_evaluation_metrics = result.classifier_evaluation_metrics
            .as_ref()
            .map(|map| {
                map.iter()
                    .map(|(key, value)| {
                        FormattedMetrics {
                            variable: key.clone(),
                            metrics: value.clone(),
                        }
                    })
                    .collect()
            });

        FormatResult {
            case_processing_summary: result.case_processing_summary.clone(),
            coordinates_precision_recall,
            coordinates_roc,
            area_under_roc_curve,
            overall_model_quality,
            classifier_evaluation_metrics,
        }
    }
}
