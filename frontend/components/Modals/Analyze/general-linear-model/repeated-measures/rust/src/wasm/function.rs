use wasm_bindgen::prelude::*;

use crate::models::config::ContrastMethod;
use crate::models::{
    config::RepeatedMeasuresConfig,
    data::AnalysisData,
    result::RepeatedMeasureResult,
};
use crate::stats::core;
use crate::utils::{ converter::string_to_js_error, error::ErrorCollector };

pub fn run_analysis(
    data: &AnalysisData,
    config: &RepeatedMeasuresConfig,
    error_collector: &mut ErrorCollector
) -> Result<Option<RepeatedMeasureResult>, JsValue> {
    web_sys::console::log_1(&"Starting repeated measures analysis".into());

    // Initialize result with executed functions tracking
    let mut executed_functions = Vec::new();

    // Log configuration to track which methods will be executed
    web_sys::console::log_1(&format!("Config: {:?}", config).into());

    // Step 1: Calculate within-subjects factors (always executed)
    executed_functions.push("calculate_within_subjects_factors".to_string());
    let mut within_subjects_factors = None;
    match core::calculate_within_subjects_factors(data, config) {
        Ok(factors) => {
            within_subjects_factors = Some(factors);
        }
        Err(e) => {
            error_collector.add_error("calculate_within_subjects_factors", &e);
        }
    }

    // Step 2: Descriptive statistics if requested in options
    let mut descriptive_statistics = None;
    if config.options.desc_stats {
        executed_functions.push("calculate_descriptive_statistics".to_string());
        match core::calculate_descriptive_statistics(data, config) {
            Ok(stats) => {
                descriptive_statistics = Some(stats);
            }
            Err(e) => {
                error_collector.add_error("calculate_descriptive_statistics", &e);
            }
        }
    }

    // Step 3: Bartlett test if requested in options
    let mut bartlett_test = None;
    if config.options.homogen_test {
        executed_functions.push("calculate_bartlett_test".to_string());
        match core::calculate_bartlett_test(data, config) {
            Ok(test) => {
                bartlett_test = Some(test);
            }
            Err(e) => {
                error_collector.add_error("calculate_bartlett_test", &e);
            }
        }
    }

    // Step 4: Multivariate tests (always executed)
    let mut multivariate_tests = None;
    executed_functions.push("calculate_multivariate_tests".to_string());
    match core::calculate_multivariate_tests(data, config) {
        Ok(tests) => {
            multivariate_tests = Some(tests);
        }
        Err(e) => {
            error_collector.add_error("calculate_multivariate_tests", &e);
        }
    }

    // Step 5: Mauchly test
    let mut mauchly_test = None;
    executed_functions.push("calculate_mauchly_test".to_string());
    match core::calculate_mauchly_test(data, config) {
        Ok(test) => {
            mauchly_test = Some(test);
        }
        Err(e) => {
            error_collector.add_error("calculate_mauchly_test", &e);
        }
    }

    // Step 6: Tests of within-subjects effects
    let mut tests_of_within_subjects_effects = None;
    executed_functions.push("calculate_tests_within_subjects_effects".to_string());
    match core::calculate_tests_within_subjects_effects(data, config) {
        Ok(tests) => {
            tests_of_within_subjects_effects = Some(tests);
        }
        Err(e) => {
            error_collector.add_error("calculate_tests_within_subjects_effects", &e);
        }
    }

    // Step 7: Tests of within-subjects contrasts
    let mut tests_of_within_subjects_contrasts = None;
    executed_functions.push("calculate_tests_within_subjects_contrasts".to_string());
    match core::calculate_tests_within_subjects_contrasts(data, config) {
        Ok(tests) => {
            tests_of_within_subjects_contrasts = Some(tests);
        }
        Err(e) => {
            error_collector.add_error("calculate_tests_within_subjects_contrasts", &e);
        }
    }

    // Step 8: Tests of between-subjects effects
    let mut tests_of_between_subjects_effects = None;
    executed_functions.push("calculate_tests_between_subjects_effects".to_string());
    match core::calculate_tests_between_subjects_effects(data, config) {
        Ok(tests) => {
            tests_of_between_subjects_effects = Some(tests);
        }
        Err(e) => {
            error_collector.add_error("calculate_tests_between_subjects_effects", &e);
        }
    }

    // Step 9: Parameter Estimates if requested in options
    let mut parameter_estimates = None;
    if config.options.param_est {
        executed_functions.push("calculate_parameter_estimates".to_string());
        match core::calculate_parameter_estimates(data, config) {
            Ok(estimates) => {
                parameter_estimates = Some(estimates);
            }
            Err(e) => {
                error_collector.add_error("calculate_parameter_estimates", &e);
            }
        }
    }

    // Step 10: General estimable function if requested in options
    let mut general_estimable_function = None;
    if config.options.general_fun {
        executed_functions.push("calculate_general_estimable_function".to_string());
        match core::calculate_general_estimable_function(data, config) {
            Ok(gef) => {
                general_estimable_function = Some(gef);
            }
            Err(e) => {
                error_collector.add_error("calculate_general_estimable_function", &e);
            }
        }
    }

    // Step 11: Within-subjects SSCP Matrix if requested in options
    let mut within_subjects_sscp = None;
    if config.options.sscp_mat {
        executed_functions.push("calculate_within_subjects_sscp".to_string());
        match core::calculate_within_subjects_sscp(data, config) {
            Ok(sscp) => {
                within_subjects_sscp = Some(sscp);
            }
            Err(e) => {
                error_collector.add_error("calculate_within_subjects_sscp", &e);
            }
        }
    }

    // Step 12: Between-subjects SSCP Matrix if requested in options
    let mut between_subjects_sscp = None;
    if config.options.sscp_mat {
        executed_functions.push("calculate_between_subjects_sscp".to_string());
        match core::calculate_between_subjects_sscp(data, config) {
            Ok(sscp) => {
                between_subjects_sscp = Some(sscp);
            }
            Err(e) => {
                error_collector.add_error("calculate_between_subjects_sscp", &e);
            }
        }
    }

    // Step 13: Residual SSCP Matrix if requested in options
    let mut residual_matrix = None;
    if config.options.res_sscp_mat {
        executed_functions.push("calculate_residual_matrix".to_string());
        match core::calculate_residual_matrix(data, config) {
            Ok(matrix) => {
                residual_matrix = Some(matrix);
            }
            Err(e) => {
                error_collector.add_error("calculate_residual_matrix", &e);
            }
        }
    }

    // Step 14: SSCP Matrix if requested
    let mut sscp_matrix = None;
    if config.options.sscp_mat {
        executed_functions.push("calculate_sscp_matrix".to_string());
        match core::calculate_sscp_matrix(data, config) {
            Ok(matrix) => {
                sscp_matrix = Some(matrix);
            }
            Err(e) => {
                error_collector.add_error("calculate_sscp_matrix", &e);
            }
        }
    }

    // Step 15: Univariate tests
    let mut univariate_tests = None;
    executed_functions.push("calculate_univariate_tests".to_string());
    match core::calculate_univariate_tests(data, config) {
        Ok(tests) => {
            univariate_tests = Some(tests);
        }
        Err(e) => {
            error_collector.add_error("calculate_univariate_tests", &e);
        }
    }

    // Step 17: Post-hoc tests if requested
    let mut posthoc_tests = None;
    if let Some(fix_factor_vars) = &config.posthoc.fix_factor_vars {
        if !fix_factor_vars.is_empty() {
            executed_functions.push("calculate_posthoc_tests".to_string());
            match core::calculate_posthoc_tests(data, config) {
                Ok(tests) => {
                    posthoc_tests = Some(tests);
                }
                Err(e) => {
                    error_collector.add_error("calculate_posthoc_tests", &e);
                }
            }
        }
    }

    // Step 18: Estimated Marginal Means if requested
    let mut emmeans = None;
    if let Some(target_list) = &config.emmeans.target_list {
        if !target_list.is_empty() {
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
    }

    // Step 19: Save variables if requested
    if
        config.save.res_weighted ||
        config.save.pre_weighted ||
        config.save.unstandardized_res ||
        config.save.weighted_res ||
        config.save.standardized_res ||
        config.save.studentized_res ||
        config.save.deleted_res ||
        config.save.leverage ||
        config.save.cooks_d
    {
        executed_functions.push("save_variables".to_string());
        match core::save_variables(data, config) {
            Ok(_) => {}
            Err(e) => {
                error_collector.add_error("save_variables", &e);
            }
        }
    }

    // Create the final result
    let result = RepeatedMeasureResult {
        within_subjects_factors,
        descriptive_statistics,
        bartlett_test,
        multivariate_tests,
        mauchly_test,
        tests_of_within_subjects_effects,
        tests_of_within_subjects_contrasts,
        tests_of_between_subjects_effects,
        parameter_estimates,
        general_estimable_function,
        within_subjects_sscp,
        between_subjects_sscp,
        residual_matrix,
        sscp_matrix,
        univariate_tests,
        posthoc_tests,
        emmeans,
        executed_functions,
    };

    Ok(Some(result))
}

pub fn get_results(result: &Option<RepeatedMeasureResult>) -> Result<JsValue, JsValue> {
    match result {
        Some(result) => Ok(serde_wasm_bindgen::to_value(result).unwrap()),
        None => Err(string_to_js_error("No analysis results available".to_string())),
    }
}

pub fn get_formatted_results(result: &Option<RepeatedMeasureResult>) -> Result<JsValue, JsValue> {
    match result {
        Some(result) => {
            let formatted_results = serde_wasm_bindgen::to_value(result).unwrap();
            Ok(formatted_results)
        }
        None => Err(string_to_js_error("No analysis results available".to_string())),
    }
}

pub fn get_executed_functions(result: &Option<RepeatedMeasureResult>) -> Result<JsValue, JsValue> {
    match result {
        Some(result) => Ok(serde_wasm_bindgen::to_value(&result.executed_functions).unwrap()),
        None => Err(string_to_js_error("No analysis has been performed".to_string())),
    }
}

pub fn get_all_errors(error_collector: &ErrorCollector) -> JsValue {
    JsValue::from_str(&error_collector.get_error_summary())
}

pub fn clear_errors(error_collector: &mut ErrorCollector) -> JsValue {
    error_collector.clear();
    JsValue::from_str("Error collector cleared")
}
