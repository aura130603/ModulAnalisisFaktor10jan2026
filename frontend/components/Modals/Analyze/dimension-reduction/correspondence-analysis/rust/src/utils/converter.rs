use wasm_bindgen::JsValue;
use serde::Serialize;

use crate::models::result::{
    CorrespondenceAnalysisResult,
    CorrespondenceTable,
    RowProfiles,
    ColumnProfiles,
    AnalysisSummary,
    PointsAnalysis,
    ConfidencePoints,
};

// Konversi dari String error ke JsValue untuk interaksi WASM
pub fn string_to_js_error(error: String) -> JsValue {
    JsValue::from_str(&error)
}

pub fn format_result(result: &Option<CorrespondenceAnalysisResult>) -> Result<JsValue, JsValue> {
    match result {
        Some(result) => {
            let formatted = FormatResult::from_analysis_result(result);
            Ok(serde_wasm_bindgen::to_value(&formatted).unwrap())
        }
        None => Err(JsValue::from_str("No correspondence analysis results available")),
    }
}

#[derive(Serialize)]
struct FormatResult {
    correspondence_table: Option<CorrespondenceTable>,
    row_profiles: Option<RowProfiles>,
    column_profiles: Option<ColumnProfiles>,
    summary: Option<AnalysisSummary>,
    row_points: Option<PointsAnalysis>,
    column_points: Option<PointsAnalysis>,
    confidence_row_points: Option<ConfidencePoints>,
    confidence_column_points: Option<ConfidencePoints>,
}

impl FormatResult {
    fn from_analysis_result(result: &CorrespondenceAnalysisResult) -> Self {
        FormatResult {
            correspondence_table: result.correspondence_table.clone(),
            row_profiles: result.row_profiles.clone(),
            column_profiles: result.column_profiles.clone(),
            summary: result.summary.clone(),
            row_points: result.row_points.clone(),
            column_points: result.column_points.clone(),
            confidence_row_points: result.confidence_row_points.clone(),
            confidence_column_points: result.confidence_column_points.clone(),
        }
    }
}
