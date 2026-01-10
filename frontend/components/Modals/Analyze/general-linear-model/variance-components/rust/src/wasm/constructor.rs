use wasm_bindgen::prelude::*;

use crate::models::{
    config::VarianceCompsConfig,
    data::{ AnalysisData, DataRecord, VariableDefinition },
    result::VarianceComponentsResult,
};
use crate::utils::{ converter::string_to_js_error, error::ErrorCollector };
use crate::utils::log::FunctionLogger;
use crate::wasm::function;

#[wasm_bindgen]
pub struct VarianceComponentsAnalysis {
    config: VarianceCompsConfig,
    data: AnalysisData,
    result: Option<VarianceComponentsResult>,
    error_collector: ErrorCollector,
    logger: FunctionLogger,
}

#[wasm_bindgen]
impl VarianceComponentsAnalysis {
    #[wasm_bindgen(constructor)]
    pub fn new(
        dependent_data: JsValue,
        fix_factor_data: JsValue,
        random_factor_data: JsValue,
        covar_data: JsValue,
        wls_data: JsValue,
        dependent_data_defs: JsValue,
        fix_factor_data_defs: JsValue,
        random_factor_data_defs: JsValue,
        covar_data_defs: JsValue,
        wls_data_defs: JsValue,
        config_data: JsValue
    ) -> Result<VarianceComponentsAnalysis, JsValue> {
        // Initialize error collector
        let mut error_collector = ErrorCollector::default();

        // Initialize function logger
        let logger = FunctionLogger::default();

        // Parse dependent data
        let dependent_data: Vec<Vec<DataRecord>> = match
            serde_wasm_bindgen::from_value(dependent_data)
        {
            Ok(data) => data,
            Err(e) => {
                let msg = format!("Failed to parse dependent data: {}", e);
                error_collector.add_error("constructor.dependent_data", &msg);
                return Err(string_to_js_error(msg));
            }
        };

        // Parse fixed factor data
        let fix_factor_data: Vec<Vec<DataRecord>> = match
            serde_wasm_bindgen::from_value(fix_factor_data)
        {
            Ok(data) => data,
            Err(e) => {
                let msg = format!("Failed to parse fixed factor data: {}", e);
                error_collector.add_error("constructor.fix_factor_data", &msg);
                return Err(string_to_js_error(msg));
            }
        };

        // Parse random factor data (optional)
        let random_factor_data: Option<Vec<Vec<DataRecord>>> = match
            serde_wasm_bindgen::from_value(random_factor_data)
        {
            Ok(data) => data,
            Err(e) => {
                let msg = format!("Failed to parse random factor data: {}", e);
                error_collector.add_error("constructor.random_factor_data", &msg);
                return Err(string_to_js_error(msg));
            }
        };

        // Parse covariate data (optional)
        let covariate_data: Option<Vec<Vec<DataRecord>>> = match
            serde_wasm_bindgen::from_value(covar_data)
        {
            Ok(data) => data,
            Err(e) => {
                let msg = format!("Failed to parse covariate data: {}", e);
                error_collector.add_error("constructor.covariate_data", &msg);
                return Err(string_to_js_error(msg));
            }
        };

        // Parse WLS weight data (optional)
        let wls_data: Option<Vec<Vec<DataRecord>>> = match serde_wasm_bindgen::from_value(wls_data) {
            Ok(data) => data,
            Err(e) => {
                let msg = format!("Failed to parse WLS weight data: {}", e);
                error_collector.add_error("constructor.wls_data", &msg);
                return Err(string_to_js_error(msg));
            }
        };

        // Parse variable definitions
        let dependent_data_defs: Vec<Vec<VariableDefinition>> = match
            serde_wasm_bindgen::from_value(dependent_data_defs)
        {
            Ok(data) => data,
            Err(e) => {
                let msg = format!("Failed to parse dependent variable definitions: {}", e);
                error_collector.add_error("constructor.dependent_data_defs", &msg);
                return Err(string_to_js_error(msg));
            }
        };

        let fix_factor_data_defs: Vec<Vec<VariableDefinition>> = match
            serde_wasm_bindgen::from_value(fix_factor_data_defs)
        {
            Ok(data) => data,
            Err(e) => {
                let msg = format!("Failed to parse fixed factor variable definitions: {}", e);
                error_collector.add_error("constructor.fix_factor_data_defs", &msg);
                return Err(string_to_js_error(msg));
            }
        };

        let random_factor_data_defs: Option<Vec<Vec<VariableDefinition>>> = match
            serde_wasm_bindgen::from_value(random_factor_data_defs)
        {
            Ok(data) => data,
            Err(e) => {
                let msg = format!("Failed to parse random factor variable definitions: {}", e);
                error_collector.add_error("constructor.random_factor_data_defs", &msg);
                return Err(string_to_js_error(msg));
            }
        };

        let covariate_data_defs: Option<Vec<Vec<VariableDefinition>>> = match
            serde_wasm_bindgen::from_value(covar_data_defs)
        {
            Ok(data) => data,
            Err(e) => {
                let msg = format!("Failed to parse covariate variable definitions: {}", e);
                error_collector.add_error("constructor.covariate_data_defs", &msg);
                return Err(string_to_js_error(msg));
            }
        };

        let wls_data_defs: Option<Vec<Vec<VariableDefinition>>> = match
            serde_wasm_bindgen::from_value(wls_data_defs)
        {
            Ok(data) => data,
            Err(e) => {
                let msg = format!("Failed to parse WLS weight variable definitions: {}", e);
                error_collector.add_error("constructor.wls_data_defs", &msg);
                return Err(string_to_js_error(msg));
            }
        };

        // Parse configuration
        let config: VarianceCompsConfig = match serde_wasm_bindgen::from_value(config_data) {
            Ok(data) => data,
            Err(e) => {
                let msg = format!("Failed to parse configuration: {}", e);
                error_collector.add_error("constructor.config", &msg);
                return Err(string_to_js_error(msg));
            }
        };

        // Validate required configuration settings
        if config.main.dep_var.is_none() || config.main.dep_var.as_ref().unwrap().is_empty() {
            let msg =
                "A dependent variable must be selected for variance components analysis".to_string();
            error_collector.add_error("config.validation.dep_var", &msg);
            return Err(string_to_js_error(msg));
        }

        if
            config.main.rand_factor.is_none() ||
            config.main.rand_factor.as_ref().unwrap().is_empty()
        {
            let msg =
                "At least one random factor must be selected for variance components analysis".to_string();
            error_collector.add_error("config.validation.rand_factor", &msg);
            return Err(string_to_js_error(msg));
        }

        // Create analysis data structure
        let data = AnalysisData {
            dependent_data,
            fix_factor_data,
            random_factor_data,
            covariate_data,
            wls_data,
            dependent_data_defs,
            fix_factor_data_defs,
            random_factor_data_defs,
            covariate_data_defs,
            wls_data_defs,
        };

        // Create analysis instance
        let mut analysis = VarianceComponentsAnalysis {
            config,
            data,
            result: None,
            error_collector,
            logger,
        };

        // Run the analysis
        match
            function::run_analysis(
                &analysis.data,
                &analysis.config,
                &mut analysis.error_collector,
                &mut analysis.logger
            )
        {
            Ok(result) => {
                analysis.result = result;
                Ok(analysis)
            }
            Err(e) => Err(e),
        }
    }

    // Methods to retrieve results and errors
    pub fn get_results(&self) -> Result<JsValue, JsValue> {
        function::get_results(&self.result)
    }

    pub fn get_formatted_results(&self) -> Result<JsValue, JsValue> {
        function::get_formatted_results(&self.result)
    }

    pub fn get_executed_functions(&self) -> Result<JsValue, JsValue> {
        function::get_executed_functions(&self.result)
    }

    pub fn get_all_errors(&self) -> JsValue {
        function::get_all_errors(&self.error_collector)
    }

    pub fn get_all_log(&self) -> Result<JsValue, JsValue> {
        function::get_all_log(&self.logger)
    }

    pub fn clear_errors(&mut self) -> JsValue {
        function::clear_errors(&mut self.error_collector)
    }
}
