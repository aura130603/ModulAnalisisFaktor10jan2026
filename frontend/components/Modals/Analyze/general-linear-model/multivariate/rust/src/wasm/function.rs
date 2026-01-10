use wasm_bindgen::prelude::*;

use crate::models::config::ContrastMethod;
use crate::models::{
    config::MultivariateConfig,
    data::AnalysisData,
    result::MultivariateResult,
};
use crate::stats::core;
use crate::utils::log::FunctionLogger;
use crate::utils::{ converter::string_to_js_error, error::ErrorCollector };

pub fn run_analysis(
    data: &AnalysisData,
    config: &MultivariateConfig,
    error_collector: &mut ErrorCollector,
    logger: &mut FunctionLogger
) -> Result<Option<MultivariateResult>, JsValue> {
    web_sys::console::log_1(&"Starting multivariate analysis".into());

    // Log configuration to track which methods will be executed
    web_sys::console::log_1(&format!("Config: {:?}", config).into());

    // Log data to track the data being processed
    web_sys::console::log_1(&format!("Data: {:?}", data).into());

    // Step 1: Basic processing summary (always executed)
    logger.add_log("basic_processing_summary");
    let mut processing_summary = None;
    match core::basic_processing_summary(data, config) {
        Ok(summary) => {
            // Store the summary in the result
            processing_summary = Some(summary);
        }
        Err(e) => {
            error_collector.add_error("basic_processing_summary", &e);
        }
    }

    // Step 2: Descriptive statistics if requested
    let mut descriptive_statistics = None;
    if config.options.desc_stats {
        logger.add_log("calculate_descriptive_statistics");
        match core::calculate_descriptive_statistics(data, config) {
            Ok(stats) => {
                descriptive_statistics = Some(stats);
            }
            Err(e) => {
                error_collector.add_error("calculate_descriptive_statistics", &e);
                // Continue execution despite errors for non-critical functions
            }
        }
    }

    let mut box_test = None;
    if config.options.homogen_test {
        logger.add_log("calculate_box_test");
        match core::calculate_box_test(data, config) {
            Ok(test) => {
                box_test = Some(test);
            }
            Err(e) => {
                error_collector.add_error("calculate_box_test", &e);
                // Continue execution despite errors for non-critical functions
            }
        }
    }

    let mut bartlett_test = None;
    if config.options.homogen_test {
        logger.add_log("calculate_bartlett_test");
        match core::calculate_bartlett_test(data, config) {
            Ok(test) => {
                bartlett_test = Some(test);
            }
            Err(e) => {
                error_collector.add_error("calculate_bartlett_test", &e);
                // Continue execution despite errors for non-critical functions
            }
        }
    }

    // Step 3: Levene's Test for Homogeneity of Variances if requested
    let mut levene_test = None;
    if config.options.homogen_test {
        logger.add_log("calculate_levene_test");
        match core::calculate_levene_test(data, config) {
            Ok(test) => {
                levene_test = Some(test);
            }
            Err(e) => {
                error_collector.add_error("calculate_levene_test", &e);
                // Continue execution despite errors for non-critical functions
            }
        }
    }

    // Step 4: Tests of Between-Subjects Effects (ANOVA)
    let mut tests_of_between_subjects_effects = None;
    match core::calculate_tests_between_subjects_effects(data, config) {
        Ok(tests) => {
            logger.add_log("calculate_tests_between_subjects_effects");
            tests_of_between_subjects_effects = Some(tests);
        }
        Err(e) => {
            error_collector.add_error("calculate_tests_between_subjects_effects", &e);
        }
    }

    // Step 5: Parameter Estimates if requested
    let mut parameter_estimates = None;
    if config.options.param_est {
        logger.add_log("calculate_parameter_estimates");
        match core::calculate_parameter_estimates(data, config) {
            Ok(estimates) => {
                parameter_estimates = Some(estimates);
            }
            Err(e) => {
                error_collector.add_error("calculate_parameter_estimates", &e);
                // Continue execution despite errors for non-critical functions
            }
        }
    }

    let mut between_subjects_sscp = None;
    if config.options.sscp_mat {
        logger.add_log("calculate_between_subjects_sscp");
        match core::calculate_between_subjects_sscp(data, config) {
            Ok(sscp) => {
                // Store the SSCP matrix in the result
                between_subjects_sscp = Some(sscp);
            }
            Err(e) => {
                error_collector.add_error("calculate_between_subjects_sscp", &e);
                // Continue execution despite errors for non-critical functions
            }
        }
    }

    let mut residual_matrix = None;
    if config.options.res_sscp_mat {
        executed_functions.push("calculate_residual_matrix".to_string());
        match core::calculate_residual_matrix(data, config) {
            Ok(matrix) => {
                residual_matrix = Some(matrix);
            }
            Err(e) => {
                error_collector.add_error("calculate_residual_matrix", &e);
                // Continue execution despite errors for non-critical functions
            }
        }
    }

    let mut multivariate_tests = None;
    executed_functions.push("calculate_multivariate_tests".to_string());
    match core::calculate_multivariate_tests(data, config) {
        Ok(tests) => {
            multivariate_tests = Some(tests);
        }
        Err(e) => {
            error_collector.add_error("calculate_multivariate_tests", &e);
            // Continue execution despite errors for non-critical functions
        }
    }

    let mut univariate_tests = None;
    executed_functions.push("calculate_univariate_tests".to_string());
    match core::calculate_univariate_tests(data, config) {
        Ok(tests) => {
            univariate_tests = Some(tests);
        }
        Err(e) => {
            error_collector.add_error("calculate_univariate_tests", &e);
            // Continue execution despite errors for non-critical functions
        }
    }

    let mut sscp_matrix = None;
    if config.options.sscp_mat {
        executed_functions.push("calculate_sscp_matrix".to_string());
        match core::calculate_sscp_matrix(data, config) {
            Ok(matrix) => {
                sscp_matrix = Some(matrix);
            }
            Err(e) => {
                error_collector.add_error("calculate_sscp_matrix", &e);
                // Continue execution despite errors for non-critical functions
            }
        }
    }

    // Step 7: Spread-vs-Level Plots if requested
    let mut spread_vs_level_plots = None;
    if config.options.spr_vs_level {
        executed_functions.push("calculate_spread_vs_level_plots".to_string());
        match core::calculate_spread_vs_level_plots(data, config) {
            Ok(plots) => {
                spread_vs_level_plots = Some(plots);
            }
            Err(e) => {
                error_collector.add_error("calculate_spread_vs_level_plots", &e);
                // Continue execution despite errors for non-critical functions
            }
        }
    }

    // Step 8: Bootstrap analysis if requested
    if config.bootstrap.perform_boot_strapping {
        executed_functions.push("perform_bootstrap_analysis".to_string());
        match core::perform_bootstrap_analysis(data, config) {
            Ok(_) => {}
            Err(e) => {
                error_collector.add_error("perform_bootstrap_analysis", &e);
                // Continue execution despite errors for non-critical functions
            }
        }
    }

    // Step 9: Post-hoc tests if requested
    let mut posthoc_tests = None;
    if config.posthoc.src_list.is_some() && !config.posthoc.src_list.as_ref().unwrap().is_empty() {
        executed_functions.push("calculate_posthoc_tests".to_string());
        match core::calculate_posthoc_tests(data, config) {
            Ok(tests) => {
                posthoc_tests = Some(tests);
            }
            Err(e) => {
                error_collector.add_error("calculate_posthoc_tests", &e);
                // Continue execution despite errors
            }
        }
    }

    let mut homogeneous_subsets = None;
    executed_functions.push("calculate_homogeneous_subsets".to_string());
    match core::calculate_homogeneous_subsets(data, config) {
        Ok(subsets) => {
            homogeneous_subsets = Some(subsets);
        }
        Err(e) => {
            error_collector.add_error("calculate_homogeneous_subsets", &e);
            // Continue execution
        }
    }

    // Step 10: Estimated Marginal Means if requested
    let mut emmeans = None;
    if config.emmeans.target_list.as_ref().map_or(false, |v| !v.is_empty()) {
        executed_functions.push("calculate_emmeans".to_string());
        match core::calculate_emmeans(data, config) {
            Ok(means) => {
                emmeans = Some(means);
            }
            Err(e) => {
                error_collector.add_error("calculate_emmeans", &e);
            }
        }
    }

    // Step 12: Generate plots if requested
    let mut plots = None;
    if config.plots.line_chart_type || config.plots.bar_chart_type {
        executed_functions.push("generate_plots".to_string());
        match core::generate_plots(data, config) {
            Ok(plot_data) => {
                plots = Some(plot_data);
            }
            Err(e) => {
                error_collector.add_error("generate_plots", &e);
                // Continue execution despite errors
            }
        }
    }

    // Step 13: Save variables if requested
    let mut saved_variables = None;
    if
        config.save.res_weighted ||
        config.save.pre_weighted ||
        config.save.unstandardized_res ||
        config.save.leverage ||
        config.save.cooks_d
    {
        executed_functions.push("save_variables".to_string());
        match core::save_variables(data, config) {
            Ok(vars) => {
                saved_variables = Some(vars);
            }
            Err(e) => {
                error_collector.add_error("save_variables", &e);
                // Continue execution despite errors
            }
        }
    }

    // Step 14: Calculate general estimable function if requested
    let mut general_estimable_function = None;
    if config.options.general_fun {
        executed_functions.push("calculate_general_estimable_function".to_string());
        match core::calculate_general_estimable_function(data, config) {
            Ok(gef) => {
                general_estimable_function = Some(gef);
            }
            Err(e) => {
                error_collector.add_error("calculate_general_estimable_function", &e);
                // Continue execution despite errors
            }
        }
    }

    // Step 15: Calculate contrast coefficients if requested
    let mut contrast_coefficients = None;
    if config.contrast.contrast_method != ContrastMethod::None {
        executed_functions.push("calculate_contrast_coefficients".to_string());
        match core::calculate_contrast_coefficients(data, config) {
            Ok(coefs) => {
                contrast_coefficients = Some(coefs);
            }
            Err(e) => {
                error_collector.add_error("calculate_contrast_coefficients", &e);
                // Continue execution despite errors
            }
        }
    }

    // Step 19: Calculate residual plots if requested
    if config.options.res_plot {
        executed_functions.push("calculate_residual_plots".to_string());
        match core::calculate_residual_plots(data, config) {
            Ok(_) => {}
            Err(e) => {
                error_collector.add_error("calculate_residual_plots", &e);
                // Continue execution despite errors
            }
        }
    }

    // Create the final result
    let result = MultivariateResult {
        between_subjects_factors: processing_summary,
        descriptive_statistics,
        levene_test,
        tests_of_between_subjects_effects,
        parameter_estimates,
        general_estimable_function,
        between_subjects_sscp,
        contrast_coefficients,
        spread_vs_level_plots,
        posthoc_tests,
        emmeans,
        plots,
        saved_variables,
        executed_functions: logger.get_executed_functions(),
        box_test,
        bartlett_test,
        multivariate_tests,
        residual_matrix,
        sscp_matrix,
        univariate_tests,
        homogeneous_subsets,
        scatter_plot_matrices: None,
        profile_plots: None,
    };

    Ok(Some(result))
}

pub fn get_results(result: &Option<MultivariateResult>) -> Result<JsValue, JsValue> {
    match result {
        Some(result) => Ok(serde_wasm_bindgen::to_value(result).unwrap()),
        None => Err(string_to_js_error("No analysis results available".to_string())),
    }
}

pub fn get_formatted_results(result: &Option<MultivariateResult>) -> Result<JsValue, JsValue> {
    match result {
        Some(result) => {
            let formatted_results = serde_wasm_bindgen::to_value(result).unwrap();
            Ok(formatted_results)
        }
        None => Err(string_to_js_error("No analysis results available".to_string())),
    }
}

pub fn get_executed_functions(result: &Option<MultivariateResult>) -> Result<JsValue, JsValue> {
    match result {
        Some(result) => Ok(serde_wasm_bindgen::to_value(&result.executed_functions).unwrap()),
        None => Err(string_to_js_error("No analysis has been performed".to_string())),
    }
}

pub fn get_all_errors(error_collector: &ErrorCollector) -> JsValue {
    JsValue::from_str(&error_collector.get_error_summary())
}

pub fn get_all_log(logger: &FunctionLogger) -> Result<JsValue, JsValue> {
    Ok(serde_wasm_bindgen::to_value(&logger.get_executed_functions()).unwrap_or(JsValue::NULL))
}

pub fn clear_errors(error_collector: &mut ErrorCollector) -> JsValue {
    error_collector.clear();
    JsValue::from_str("Error collector cleared")
}
