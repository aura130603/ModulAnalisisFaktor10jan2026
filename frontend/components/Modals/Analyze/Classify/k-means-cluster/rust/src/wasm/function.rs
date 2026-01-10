use wasm_bindgen::prelude::*;

use crate::models::{ config::KMeansConfig, data::AnalysisData, result::KMeansResult };
use crate::utils::converter::format_result;
use crate::utils::{ log::FunctionLogger, converter::string_to_js_error, error::ErrorCollector };

use crate::stats::core;

pub fn run_analysis(
    data: &AnalysisData,
    config: &KMeansConfig,
    error_collector: &mut ErrorCollector,
    logger: &mut FunctionLogger
) -> Result<Option<KMeansResult>, JsValue> {
    logger.add_log("preprocess_data");
    let preprocessed_data = match core::preprocess_data(data, config) {
        Ok(processed) => { processed }
        Err(e) => {
            error_collector.add_error("Run Analysis : Preprocess Data", &e);
            return Err(string_to_js_error(e));
        }
    };

    logger.add_log("initialize_clusters");
    let mut initial_centers = None;
    if config.options.initial_cluster {
        match core::initialize_clusters(&preprocessed_data, config) {
            Ok(centers) => {
                initial_centers = Some(centers);
            }
            Err(e) => {
                error_collector.add_error("Run Analysis : Initialize Clusters", &e);
            }
        };
    }

    logger.add_log("iteration_history");
    let mut iteration_history = None;
    match core::generate_iteration_history(&preprocessed_data, config) {
        Ok(history) => {
            iteration_history = Some(history);
        }
        Err(e) => {
            error_collector.add_error("Run Analysis : Iteration History", &e);
        }
    }

    logger.add_log("cluster_membership");
    let mut cluster_membership = None;
    if config.options.cluster_info {
        match core::generate_cluster_membership(&preprocessed_data, config) {
            Ok(membership) => {
                cluster_membership = Some(membership);
            }
            Err(e) => {
                error_collector.add_error("Run Analysis : Cluster Membership", &e);
            }
        }
    }

    logger.add_log("final_cluster_centers");
    let mut final_cluster_centers = None;
    match core::generate_final_cluster_centers(&preprocessed_data, config) {
        Ok(centers) => {
            final_cluster_centers = Some(centers);
        }
        Err(e) => {
            error_collector.add_error("Run Analysis : Final Cluster Centers", &e);
        }
    }

    logger.add_log("distances_between_centers");
    let mut distances_between_centers = None;
    if config.options.cluster_info {
        match core::calculate_distances_between_centers(&preprocessed_data, config) {
            Ok(distances) => {
                distances_between_centers = Some(distances);
            }
            Err(e) => {
                error_collector.add_error("Run Analysis : Distances Between Centers", &e);
            }
        }
    }

    let mut anova = None;
    if config.options.anova {
        logger.add_log("calculate_anova");
        match core::calculate_anova(&preprocessed_data, &config) {
            Ok(result) => {
                anova = Some(result);
            }
            Err(e) => {
                error_collector.add_error("Run Analysis : Calculate Anova", &e);
            }
        }
    }

    let mut cases_count = None;
    logger.add_log("generate_case_count");
    match core::generate_case_count(&preprocessed_data, &config) {
        Ok(count) => {
            cases_count = Some(count);
        }
        Err(e) => {
            error_collector.add_error("Run Analysis : Generate Case Count", &e);
        }
    }

    let mut cluster_plot = None;
    if config.options.cluster_plot {
        logger.add_log("create_cluster_plot");
        match core::create_cluster_plot(&preprocessed_data, &config) {
            Ok(plot) => {
                cluster_plot = Some(plot);
            }
            Err(e) => {
                error_collector.add_error("Run Analysis : Create Cluster Plot", &e);
            }
        }
    }

    let result = KMeansResult {
        initial_centers,
        iteration_history,
        cluster_membership,
        final_cluster_centers,
        distances_between_centers,
        anova,
        cases_count,
        cluster_plot,
    };

    Ok(Some(result))
}

pub fn get_results(result: &Option<KMeansResult>) -> Result<JsValue, JsValue> {
    match result {
        Some(result) => Ok(serde_wasm_bindgen::to_value(result).unwrap()),
        None => Err(string_to_js_error("No analysis results available".to_string())),
    }
}

pub fn get_formatted_results(result: &Option<KMeansResult>) -> Result<JsValue, JsValue> {
    format_result(result)
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
