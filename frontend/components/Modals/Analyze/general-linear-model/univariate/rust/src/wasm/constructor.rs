use wasm_bindgen::prelude::*;

use crate::models::{
    config::UnivariateConfig,
    data::{ AnalysisData, DataRecord, VariableDefinition, DataValue },
    result::UnivariateResult,
};
use crate::utils::{ converter::string_to_js_error, error::ErrorCollector };
use crate::utils::log::FunctionLogger;
use crate::wasm::function;

#[wasm_bindgen]
pub struct UnivariateAnalysis {
    config: UnivariateConfig,
    data: AnalysisData,
    result: Option<UnivariateResult>,
    error_collector: ErrorCollector,
    logger: FunctionLogger,
}

#[wasm_bindgen]
impl UnivariateAnalysis {
    #[wasm_bindgen(constructor)]
    pub fn new(
        dep_data: JsValue,
        fix_factor_data: JsValue,
        rand_factor_data: JsValue,
        covar_data: JsValue,
        wls_data: JsValue,
        dep_data_defs: JsValue,
        fix_factor_data_defs: JsValue,
        rand_factor_data_defs: JsValue,
        covar_data_defs: JsValue,
        wls_data_defs: JsValue,
        config_data: JsValue
    ) -> Result<UnivariateAnalysis, JsValue> {
        // Initialize error collector
        let mut error_collector = ErrorCollector::default();

        // Initialize function logger
        let logger = FunctionLogger::default();

        let is_all_null = |data: &Vec<Vec<DataRecord>>| -> bool {
            if data.is_empty() || data[0].is_empty() {
                return false; // Not all null if empty, handled by other validation
            }
            data.iter().all(|row| {
                row.iter().all(|record| {
                    record.values.values().all(|value| matches!(value, DataValue::Null))
                })
            })
        };

        // Parse input data using serde_wasm_bindgen
        let dependent_data: Vec<Vec<DataRecord>> = match serde_wasm_bindgen::from_value(dep_data) {
            Ok(data) => data,
            Err(e) => {
                let msg = format!("Failed to parse dependent data: {}", e);
                error_collector.add_error("Constructor : Dependent Data", &msg);
                return Err(string_to_js_error(msg));
            }
        };

        let fix_factor_data: Vec<Vec<DataRecord>> = match
            serde_wasm_bindgen::from_value(fix_factor_data)
        {
            Ok(data) => data,
            Err(e) => {
                let msg = format!("Failed to parse fixed factor data: {}", e);
                error_collector.add_error("Constructor : Fix Factor Data", &msg);
                return Err(string_to_js_error(msg));
            }
        };

        let random_factor_data: Option<Vec<Vec<DataRecord>>> = match
            serde_wasm_bindgen::from_value(rand_factor_data)
        {
            Ok(data) => data,
            Err(e) => {
                let msg = format!("Failed to parse random factor data: {}", e);
                error_collector.add_error("Constructor : Random Factor Data", &msg);
                return Err(string_to_js_error(msg));
            }
        };

        let covariate_data: Option<Vec<Vec<DataRecord>>> = match
            serde_wasm_bindgen::from_value(covar_data)
        {
            Ok(data) => data,
            Err(e) => {
                let msg = format!("Failed to parse covariate data: {}", e);
                error_collector.add_error("Constructor : Covariate Data", &msg);
                return Err(string_to_js_error(msg));
            }
        };

        let wls_data: Option<Vec<Vec<DataRecord>>> = match serde_wasm_bindgen::from_value(wls_data) {
            Ok(data) => data,
            Err(e) => {
                let msg = format!("Failed to parse WLS weight data: {}", e);
                error_collector.add_error("Constructor : WLS Data", &msg);
                return Err(string_to_js_error(msg));
            }
        };

        let dependent_data_defs: Vec<Vec<VariableDefinition>> = match
            serde_wasm_bindgen::from_value(dep_data_defs)
        {
            Ok(data) => data,
            Err(e) => {
                let msg = format!("Failed to parse dependent data definitions: {}", e);
                error_collector.add_error("Constructor : Dependent Data Definitions", &msg);
                return Err(string_to_js_error(msg));
            }
        };

        let fix_factor_data_defs: Vec<Vec<VariableDefinition>> = match
            serde_wasm_bindgen::from_value(fix_factor_data_defs)
        {
            Ok(data) => data,
            Err(e) => {
                let msg = format!("Failed to parse fixed factor data definitions: {}", e);
                error_collector.add_error("Constructor : Fix Factor Data Definitions", &msg);
                return Err(string_to_js_error(msg));
            }
        };

        let random_factor_data_defs: Option<Vec<Vec<VariableDefinition>>> = match
            serde_wasm_bindgen::from_value(rand_factor_data_defs)
        {
            Ok(data) => data,
            Err(e) => {
                let msg = format!("Failed to parse random factor data definitions: {}", e);
                error_collector.add_error("Constructor : Random Factor Data Definitions", &msg);
                return Err(string_to_js_error(msg));
            }
        };

        let covariate_data_defs: Option<Vec<Vec<VariableDefinition>>> = match
            serde_wasm_bindgen::from_value(covar_data_defs)
        {
            Ok(data) => data,
            Err(e) => {
                let msg = format!("Failed to parse covariate data definitions: {}", e);
                error_collector.add_error("Constructor : Covariate Data Definitions", &msg);
                return Err(string_to_js_error(msg));
            }
        };

        let wls_data_defs: Option<Vec<Vec<VariableDefinition>>> = match
            serde_wasm_bindgen::from_value(wls_data_defs)
        {
            Ok(data) => data,
            Err(e) => {
                let msg = format!("Failed to parse WLS weight data definitions: {}", e);
                error_collector.add_error("Constructor : WLS Data Definitions", &msg);
                return Err(string_to_js_error(msg));
            }
        };

        let config: UnivariateConfig = match serde_wasm_bindgen::from_value(config_data) {
            Ok(data) => data,
            Err(e) => {
                let msg = format!("Failed to parse configuration: {}", e);
                error_collector.add_error("Constructor : Config", &msg);
                return Err(string_to_js_error(msg));
            }
        };

        // Validate important configuration
        if config.main.dep_var.is_none() {
            let msg = "Dependent variable must be selected for univariate analysis".to_string();
            error_collector.add_error("Config : Validation : Dependent Variable", &msg);
            return Err(string_to_js_error(msg));
        }

        if
            fix_factor_data.is_empty() &&
            random_factor_data.as_deref().map_or(true, |v| v.is_empty()) &&
            covariate_data.as_deref().map_or(true, |v| v.is_empty())
        {
            let msg =
                "At least one fixed factor, random factor, or covariate must be provided".to_string();
            error_collector.add_error("Config : Validation : Independent Variables", &msg);
            return Err(string_to_js_error(msg));
        }

        if is_all_null(&dependent_data) {
            let msg = "Dependent data contains all null values".to_string();
            error_collector.add_error("Data : Validation : Dependent Data", &msg);
            return Err(string_to_js_error(msg));
        }

        if is_all_null(&fix_factor_data) {
            let msg = "Fixed factor data contains all null values".to_string();
            error_collector.add_error("Data : Validation : Fixed Factor Data", &msg);
            return Err(string_to_js_error(msg));
        }

        if let Some(data) = &random_factor_data {
            if is_all_null(data) {
                let msg = "Random factor data contains all null values".to_string();
                error_collector.add_error("Data : Validation : Random Factor Data", &msg);
                return Err(string_to_js_error(msg));
            }
        }

        if let Some(data) = &covariate_data {
            if is_all_null(data) {
                let msg = "Covariate data contains all null values".to_string();
                error_collector.add_error("Data : Validation : Covariate Data", &msg);
                return Err(string_to_js_error(msg));
            }
        }

        if let Some(data) = &wls_data {
            if is_all_null(data) {
                let msg = "WLS data contains all null values".to_string();
                error_collector.add_error("Data : Validation : WLS Data", &msg);
                return Err(string_to_js_error(msg));
            }
        }

        // Check significance level
        if config.options.sig_level < 0.0 || config.options.sig_level > 1.0 {
            let msg = "Significance level must be between 0 and 1".to_string();
            error_collector.add_error("Config : Validation : Significance Level", &msg);
            return Err(string_to_js_error(msg));
        }

        // Store data
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

        // Create instance
        let mut analysis = UnivariateAnalysis {
            config,
            data,
            result: None,
            error_collector,
            logger,
        };

        // Run the analysis using the function from function.rs
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

    // Use functions from function.rs
    pub fn get_results(&self) -> Result<JsValue, JsValue> {
        function::get_results(&self.result)
    }

    pub fn get_formatted_results(&self) -> Result<JsValue, JsValue> {
        function::get_formatted_results(&self.result)
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
