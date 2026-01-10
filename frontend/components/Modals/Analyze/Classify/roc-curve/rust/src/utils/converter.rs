use wasm_bindgen::JsValue;
use serde::Serialize;

use crate::models::result::{
    ROCCurveResult,
    CaseProcessingSummary,
    RocCoordinate,
    AreaUnderRocCurve,
};

pub fn string_to_js_error(error: String) -> JsValue {
    JsValue::from_str(&error)
}

pub fn format_result(result: &Option<ROCCurveResult>) -> Result<JsValue, JsValue> {
    match result {
        Some(result) => {
            let formatted = FormatResult::from_curve_result(result);
            Ok(serde_wasm_bindgen::to_value(&formatted).unwrap())
        }
        None => Err(JsValue::from_str("No analysis results available")),
    }
}

#[derive(Serialize)]
struct FormatResult {
    case_processing_summary: Option<CaseProcessingSummary>,
    coordinates_roc: Option<Vec<FormattedRoc>>,
    area_under_roc_curve: Option<Vec<FormattedArea>>,
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

impl FormatResult {
    fn from_curve_result(result: &ROCCurveResult) -> Self {
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

        FormatResult {
            case_processing_summary: result.case_processing_summary.clone(),
            coordinates_roc,
            area_under_roc_curve,
        }
    }
}
