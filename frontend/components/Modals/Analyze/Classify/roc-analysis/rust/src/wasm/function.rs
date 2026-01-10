use wasm_bindgen::prelude::*;

use crate::models::{
    config::RocConfig,
    data::AnalysisData,
    result::ROCAnalysisResult,
};
use crate::utils::converter::format_result;
use crate::utils::log::{ FunctionLogger };
use crate::utils::{ converter::string_to_js_error, error::ErrorCollector };
use crate::stats::core;

pub fn run_analysis(
    data: &AnalysisData,
    config: &RocConfig,
    error_collector: &mut ErrorCollector,
    logger: &mut FunctionLogger
) -> Result<Option<ROCAnalysisResult>, JsValue> {
    web_sys::console::log_1(&"Starting ROC Analysis".into());

    // Log configuration to track which methods will be executed
    web_sys::console::log_1(&format!("Config: {:?}", config).into());

    // Log data to track the input data
    web_sys::console::log_1(&format!("Data: {:?}", data).into());

    // Step 1: Case Processing Summary (always executed)
    logger.add_log("case_processing_summary");
    let mut case_processing_summary = None;
    match core::calculate_case_processing_summary(data, config) {
        Ok(summary) => {
            web_sys::console::log_1(&format!("Case Processing Summary: {:?}", summary).into());
            case_processing_summary = Some(summary);
        }
        Err(e) => {
            error_collector.add_error("case_processing_summary", &e);
        }
    }

    // Step 2: ROC Curve Coordinates if ROC Curve is requested
    let mut coordinates_roc = None;
    if config.display.roc_curve {
        logger.add_log("calculate_roc_coordinates");
        match core::calculate_roc_coordinates(data, config) {
            Ok(coords) => {
                coordinates_roc = Some(coords);
                web_sys::console::log_1(&format!("ROC Coordinates: {:?}", coordinates_roc).into());
            }
            Err(e) => {
                error_collector.add_error("calculate_roc_coordinates", &e);
                // Continue execution despite errors for non-critical functions
            }
        };
    }

    // Step 3: Precision-Recall Curve Coordinates if PRC is requested
    let mut coordinates_precision_recall = None;
    if config.display.prc {
        logger.add_log("calculate_precision_recall_coordinates");
        match core::calculate_precision_recall_coordinates(data, config) {
            Ok(coords) => {
                coordinates_precision_recall = Some(coords);
                web_sys::console::log_1(
                    &format!(
                        "Precision-Recall Coordinates: {:?}",
                        coordinates_precision_recall
                    ).into()
                );
            }
            Err(e) => {
                error_collector.add_error("calculate_precision_recall_coordinates", &e);
                // Continue execution despite errors for non-critical functions
            }
        };
    }

    // Step 4: Calculate Area Under ROC Curve
    let mut area_under_roc_curve = None;
    logger.add_log("calculate_area_under_roc_curve");
    match core::calculate_area_under_roc_curve(data, config) {
        Ok(area) => {
            area_under_roc_curve = Some(area);
            web_sys::console::log_1(
                &format!("Area Under ROC Curve: {:?}", area_under_roc_curve).into()
            );
        }
        Err(e) => {
            error_collector.add_error("calculate_area_under_roc_curve", &e);
            // Continue execution despite errors for non-critical functions
        }
    }

    // Step 5: Overall Model Quality if requested
    let mut overall_model_quality = None;
    if config.display.overall {
        logger.add_log("calculate_overall_model_quality");
        match core::calculate_overall_model_quality(data, config) {
            Ok(quality) => {
                overall_model_quality = Some(quality);
                web_sys::console::log_1(
                    &format!("Overall Model Quality: {:?}", overall_model_quality).into()
                );
            }
            Err(e) => {
                error_collector.add_error("calculate_overall_model_quality", &e);
                // Continue execution despite errors for non-critical functions
            }
        };
    }

    // Step 6: Classifier Evaluation Metrics if requested
    let mut classifier_evaluation_metrics = None;
    if config.display.eval_metrics {
        logger.add_log("calculate_classifier_evaluation_metrics");
        match core::calculate_classifier_evaluation_metrics(data, config) {
            Ok(metrics) => {
                classifier_evaluation_metrics = Some(metrics);
                web_sys::console::log_1(
                    &format!(
                        "Classifier Evaluation Metrics: {:?}",
                        classifier_evaluation_metrics
                    ).into()
                );
            }
            Err(e) => {
                error_collector.add_error("calculate_classifier_evaluation_metrics", &e);
                // Continue execution despite errors for non-critical functions
            }
        };
    }

    // Create the final result
    let result = ROCAnalysisResult {
        case_processing_summary,
        coordinates_precision_recall,
        coordinates_roc,
        area_under_roc_curve,
        overall_model_quality,
        classifier_evaluation_metrics,
    };

    Ok(Some(result))
}

pub fn get_results(result: &Option<ROCAnalysisResult>) -> Result<JsValue, JsValue> {
    match result {
        Some(result) => Ok(serde_wasm_bindgen::to_value(result).unwrap()),
        None => Err(string_to_js_error("No analysis results available".to_string())),
    }
}

pub fn get_formatted_results(result: &Option<ROCAnalysisResult>) -> Result<JsValue, JsValue> {
    format_result(result)
}

pub fn get_all_errors(error_collector: &ErrorCollector) -> JsValue {
    JsValue::from_str(&error_collector.get_error_summary())
}

pub fn get_all_log(logger: &FunctionLogger) -> Result<JsValue, JsValue> {
    Ok(serde_wasm_bindgen::to_value(&logger.get_executed_functions()).unwrap_or(JsValue::NULL))
}
