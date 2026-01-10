use wasm_bindgen::prelude::*;

use crate::models::{
    config::OVERALSAnalysisConfig,
    data::AnalysisData,
    result::OVERALSAnalysisResult,
};
use crate::utils::{ converter::string_to_js_error, error::ErrorCollector };
use crate::stats::core;

pub fn run_analysis(
    data: &AnalysisData,
    config: &OVERALSAnalysisConfig,
    error_collector: &mut ErrorCollector
) -> Result<Option<OVERALSAnalysisResult>, JsValue> {
    web_sys::console::log_1(&"Starting OVERALS analysis".into());

    // Initialize result with executed functions tracking
    let mut executed_functions = Vec::new();

    // Log configuration to track which methods will be executed
    web_sys::console::log_1(&format!("Config: {:?}", config).into());

    // Log data
    web_sys::console::log_1(&format!("Data: {:?}", data).into());

    // Step 1: Case Processing Summary (always executed)
    executed_functions.push("case_processing_summary".to_string());
    let mut case_processing_summary = None;
    match core::calculate_case_processing_summary(data, config) {
        Ok(summary) => {
            web_sys::console::log_1(&format!("Case Processing Summary: {:?}", summary).into());
            case_processing_summary = Some(summary);
        }
        Err(e) => {
            error_collector.add_error("case_processing_summary", &e);
            web_sys::console::error_1(&format!("Error in case_processing_summary: {:?}", e).into());
        }
    }

    let mut prepared_data = data.clone(); // Default to original data
    match core::prepare_data(data, config) {
        Ok(prepared) => {
            web_sys::console::log_1(&format!("Data preparation successful").into());
            prepared_data = prepared;
        }
        Err(e) => {
            error_collector.add_error("filter_valid_cases", &e);
            web_sys::console::error_1(&format!("Error in filter_valid_cases: {:?}", e).into());
            // Continue execution despite errors for filtering
        }
    }

    // Prepared data for further processing
    web_sys::console::log_1(&format!("Prepared Data: {:?}", prepared_data).into());

    // Step 2: Variable Processing
    executed_functions.push("process_variables".to_string());
    let mut variables = None;
    match core::process_variables(&prepared_data, config) {
        Ok(var_info) => {
            web_sys::console::log_1(&format!("Variable Processing: {:?}", var_info).into());
            variables = Some(var_info);
        }
        Err(e) => {
            error_collector.add_error("process_variables", &e);
            web_sys::console::error_1(&format!("Error in process_variables: {:?}", e).into());
        }
    }

    // Step 3: Calculate Centroids
    executed_functions.push("calculate_centroids".to_string());
    let mut centroids = None;
    match core::calculate_centroids(&prepared_data, config) {
        Ok(cent_result) => {
            web_sys::console::log_1(&format!("Centroids Calculation: {:?}", cent_result).into());
            centroids = Some(cent_result);
        }
        Err(e) => {
            error_collector.add_error("calculate_centroids", &e);
            web_sys::console::error_1(&format!("Error in calculate_centroids: {:?}", e).into());
        }
    }

    // Step 4: Calculate Iteration History
    executed_functions.push("calculate_iteration_history".to_string());
    let mut iteration_history = None;
    match core::calculate_iteration_history(&prepared_data, config) {
        Ok(history) => {
            web_sys::console::log_1(&format!("Iteration History: {:?}", history).into());
            iteration_history = Some(history);
        }
        Err(e) => {
            error_collector.add_error("calculate_iteration_history", &e);
            web_sys::console::error_1(
                &format!("Error in calculate_iteration_history: {:?}", e).into()
            );
        }
    }

    // Step 5: Calculate Summary Analysis
    executed_functions.push("calculate_summary_analysis".to_string());
    let mut summary_analysis = None;
    match core::calculate_summary_analysis(&prepared_data, config) {
        Ok(summary) => {
            web_sys::console::log_1(&format!("Summary Analysis: {:?}", summary).into());
            summary_analysis = Some(summary);
        }
        Err(e) => {
            error_collector.add_error("calculate_summary_analysis", &e);
            web_sys::console::error_1(
                &format!("Error in calculate_summary_analysis: {:?}", e).into()
            );
        }
    }

    // Step 6: Calculate Weights
    executed_functions.push("calculate_weights".to_string());
    let mut weights = None;
    match core::calculate_weights(&prepared_data, config) {
        Ok(weight_result) => {
            web_sys::console::log_1(&format!("Weights Calculation: {:?}", weight_result).into());
            weights = Some(weight_result);
        }
        Err(e) => {
            error_collector.add_error("calculate_weights", &e);
            web_sys::console::error_1(&format!("Error in calculate_weights: {:?}", e).into());
        }
    }

    // Step 7: Calculate Component Loadings
    executed_functions.push("calculate_component_loadings".to_string());
    let mut component_loadings = None;
    match core::calculate_component_loadings(&prepared_data, config) {
        Ok(loadings) => {
            web_sys::console::log_1(&format!("Component Loadings: {:?}", loadings).into());
            component_loadings = Some(loadings);
        }
        Err(e) => {
            error_collector.add_error("calculate_component_loadings", &e);
            web_sys::console::error_1(
                &format!("Error in calculate_component_loadings: {:?}", e).into()
            );
        }
    }

    // Step 8: Calculate Fit Measures
    executed_functions.push("calculate_fit_measures".to_string());
    let mut fit_measures = None;
    match core::calculate_fit_measures(&prepared_data, config) {
        Ok(measures) => {
            web_sys::console::log_1(&format!("Fit Measures: {:?}", measures).into());
            fit_measures = Some(measures);
        }
        Err(e) => {
            error_collector.add_error("calculate_fit_measures", &e);
            web_sys::console::error_1(&format!("Error in calculate_fit_measures: {:?}", e).into());
        }
    }

    // Step 9: Calculate Object Scores
    executed_functions.push("calculate_object_scores".to_string());
    let mut object_scores = None;
    match core::calculate_object_scores(&prepared_data, config) {
        Ok(scores) => {
            web_sys::console::log_1(&format!("Object Scores: {:?}", scores).into());
            object_scores = Some(scores);
        }
        Err(e) => {
            error_collector.add_error("calculate_object_scores", &e);
            web_sys::console::error_1(&format!("Error in calculate_object_scores: {:?}", e).into());
        }
    }

    // Step 10: Generate Transformation Plots
    executed_functions.push("generate_transformation_plots".to_string());
    let mut transformation_plots = None;
    match core::generate_transformation_plots(&prepared_data, config) {
        Ok(plots) => {
            web_sys::console::log_1(&format!("Transformation Plots: {:?}", plots).into());
            transformation_plots = Some(plots);
        }
        Err(e) => {
            error_collector.add_error("generate_transformation_plots", &e);
            web_sys::console::error_1(
                &format!("Error in generate_transformation_plots: {:?}", e).into()
            );
        }
    }

    // Log execution summary
    web_sys::console::log_1(&format!("Executed functions: {:?}", executed_functions).into());

    // Create the final result
    let result = OVERALSAnalysisResult {
        case_processing_summary,
        variables,
        centroids,
        iteration_history,
        summary_analysis,
        weights,
        component_loadings,
        fit_measures,
        object_scores,
        transformation_plots,
    };

    web_sys::console::log_1(&"OVERALS analysis completed".into());
    Ok(Some(result))
}

pub fn get_results(result: &Option<OVERALSAnalysisResult>) -> Result<JsValue, JsValue> {
    match result {
        Some(result) => {
            web_sys::console::log_1(&"Getting OVERALS analysis results".into());
            Ok(serde_wasm_bindgen::to_value(result).unwrap())
        }
        None => {
            web_sys::console::error_1(&"No analysis results available".into());
            Err(string_to_js_error("No analysis results available".to_string()))
        }
    }
}

pub fn get_executed_functions(result: &Option<OVERALSAnalysisResult>) -> Result<JsValue, JsValue> {
    match result {
        Some(result) => {
            web_sys::console::log_1(&"Getting executed functions".into());
            Ok(serde_wasm_bindgen::to_value(result).unwrap())
        }
        None => {
            web_sys::console::error_1(
                &"No analysis results available for executed functions".into()
            );
            Err(string_to_js_error("No analysis results available".to_string()))
        }
    }
}

pub fn get_all_errors(error_collector: &ErrorCollector) -> JsValue {
    web_sys::console::log_1(&"Getting all errors from error collector".into());
    JsValue::from_str(&error_collector.get_error_summary())
}

pub fn clear_errors(error_collector: &mut ErrorCollector) -> JsValue {
    web_sys::console::log_1(&"Clearing error collector".into());
    error_collector.clear();
    JsValue::from_str("Error collector cleared")
}
