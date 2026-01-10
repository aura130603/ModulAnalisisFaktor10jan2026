use wasm_bindgen::prelude::*;

use crate::models::{
    config::VarianceCompsConfig,
    data::AnalysisData,
    result::VarianceComponentsResult,
};
use crate::stats::core;
use crate::utils::log::FunctionLogger;
use crate::utils::{ converter::string_to_js_error, error::ErrorCollector };

pub fn run_analysis(
    data: &AnalysisData,
    config: &VarianceCompsConfig,
    error_collector: &mut ErrorCollector,
    logger: &mut FunctionLogger
) -> Result<Option<VarianceComponentsResult>, JsValue> {
    web_sys::console::log_1(&"Starting variance components analysis".into());

    // Log configuration to track which methods will be executed
    web_sys::console::log_1(&format!("Config: {:?}", config).into());

    // Step 1: Calculate factor level information (always executed)
    logger.add_log("calculate_factor_level_information");
    let mut factor_level_information = None;
    match core::calculate_factor_level_information(data, config) {
        Ok(info) => {
            factor_level_information = Some(info);
        }
        Err(e) => {
            error_collector.add_error("calculate_factor_level_information", &e);
        }
    }

    // Step 2: Calculate variance components estimates (always executed)
    logger.add_log("calculate_variance_estimates");
    let mut variance_estimates = None;
    match core::calculate_variance_estimates(data, config) {
        Ok(estimates) => {
            variance_estimates = Some(estimates);
        }
        Err(e) => {
            error_collector.add_error("calculate_variance_estimates", &e);
        }
    }

    // Step 3: ANOVA method specific calculations
    let mut anova_table = None;
    if config.options.anova {
        logger.add_log("calculate_anova_table");
        match core::calculate_anova_table(data, config) {
            Ok(table) => {
                anova_table = Some(table);
            }
            Err(e) => {
                error_collector.add_error("calculate_anova_table", &e);
            }
        }
    }

    // Step 4: Expected Mean Squares (if using ANOVA method and requested in options)
    let mut expected_mean_squares = None;
    if config.options.anova && config.options.expected_mean_squares {
        logger.add_log("calculate_expected_mean_squares");
        match core::calculate_expected_mean_squares(data, config) {
            Ok(ems) => {
                expected_mean_squares = Some(ems);
            }
            Err(e) => {
                error_collector.add_error("calculate_expected_mean_squares", &e);
            }
        }
    }

    // Step 5: ML/REML method specific calculations - Component covariation
    let mut method_info = None;
    if config.options.max_likelihood || config.options.res_max_likelihood {
        logger.add_log("calculate_method_info");
        match core::calculate_method_info(data, config) {
            Ok(info) => {
                method_info = Some(info);
            }
            Err(e) => {
                error_collector.add_error("calculate_method_info", &e);
            }
        }
    }

    // Step 6: Iteration history for ML or REML methods if requested
    if
        (config.options.max_likelihood || config.options.res_max_likelihood) &&
        config.options.iteration_history
    {
        logger.add_log("calculate_iteration_history");
        // This is already handled in method_info, just tracking the function execution
    }

    // Step 7: Save variance component estimates if requested
    if config.save.var_comp_est {
        logger.add_log("save_variance_component_estimates");
        match core::save_variance_component_estimates(data, config) {
            Ok(_) => {}
            Err(e) => {
                error_collector.add_error("save_variance_component_estimates", &e);
            }
        }
    }

    // Step 8: Save component covariation if requested
    if config.save.comp_covar {
        logger.add_log("save_component_covariation");
        match core::save_component_covariation(data, config) {
            Ok(_) => {}
            Err(e) => {
                error_collector.add_error("save_component_covariation", &e);
            }
        }
    }

    // Create the final result
    let result = VarianceComponentsResult {
        variance_estimates,
        factor_level_information,
        anova_table,
        expected_mean_squares,
        method_info,
        design: None, // This would come from the config
        executed_functions: logger.get_executed_functions(),
    };

    Ok(Some(result))
}

pub fn get_results(result: &Option<VarianceComponentsResult>) -> Result<JsValue, JsValue> {
    match result {
        Some(result) => Ok(serde_wasm_bindgen::to_value(result).unwrap()),
        None => Err(string_to_js_error("No analysis results available".to_string())),
    }
}

pub fn get_formatted_results(
    result: &Option<VarianceComponentsResult>
) -> Result<JsValue, JsValue> {
    match result {
        Some(result) => {
            let formatted_results = serde_wasm_bindgen::to_value(result).unwrap();
            Ok(formatted_results)
        }
        None => Err(string_to_js_error("No analysis results available".to_string())),
    }
}

pub fn get_executed_functions(
    result: &Option<VarianceComponentsResult>
) -> Result<JsValue, JsValue> {
    match result {
        Some(result) => Ok(serde_wasm_bindgen::to_value(&result.executed_functions).unwrap()),
        None => Err(string_to_js_error("No analysis has been performed".to_string())),
    }
}

pub fn get_all_log(logger: &FunctionLogger) -> Result<JsValue, JsValue> {
    Ok(serde_wasm_bindgen::to_value(&logger.get_executed_functions()).unwrap_or(JsValue::NULL))
}

pub fn get_all_errors(error_collector: &ErrorCollector) -> JsValue {
    JsValue::from_str(&error_collector.get_error_summary())
}

pub fn clear_errors(error_collector: &mut ErrorCollector) -> JsValue {
    error_collector.clear();
    JsValue::from_str("Error collector cleared")
}
