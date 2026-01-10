use wasm_bindgen::prelude::*;

use crate::models::{
    config::KMeansConfig,
    data::{ AnalysisData, DataRecord, VariableDefinition, DataValue },
    result::KMeansResult,
};
use crate::utils::{ converter::string_to_js_error, error::ErrorCollector, log::FunctionLogger };
use crate::wasm::function;

#[wasm_bindgen]
pub struct KMeansClusterAnalysis {
    config: KMeansConfig,
    data: AnalysisData,
    result: Option<KMeansResult>,
    error_collector: ErrorCollector,
    logger: FunctionLogger,
}

#[wasm_bindgen]
impl KMeansClusterAnalysis {
    #[wasm_bindgen(constructor)]
    pub fn new(
        target_data: JsValue,
        case_data: JsValue,
        target_data_defs: JsValue,
        case_data_defs: JsValue,
        config_data: JsValue
    ) -> Result<KMeansClusterAnalysis, JsValue> {
        // Initialize error collector
        let mut error_collector = ErrorCollector::default();

        // Initialize function logger
        let logger = FunctionLogger::default();

        let is_all_null = |data: &Vec<Vec<DataRecord>>| -> bool {
            if data.is_empty() || data[0].is_empty() {
                return false;
            }
            data.iter().all(|row| {
                row.iter().all(|record| {
                    record.values.values().all(|value| matches!(value, DataValue::Null))
                })
            })
        };

        // Parse input data using serde_wasm_bindgen
        let target_data: Vec<Vec<DataRecord>> = match serde_wasm_bindgen::from_value(target_data) {
            Ok(data) => data,
            Err(e) => {
                let msg = format!("Failed to parse target data: {}", e);
                error_collector.add_error("Constructor : Target Data", &msg);
                return Err(string_to_js_error(msg));
            }
        };

        let case_data: Vec<Vec<DataRecord>> = match serde_wasm_bindgen::from_value(case_data) {
            Ok(data) => data,
            Err(e) => {
                let msg = format!("Failed to parse case data: {}", e);
                error_collector.add_error("Constructor : Case Data", &msg);
                return Err(string_to_js_error(msg));
            }
        };

        let target_data_defs: Vec<Vec<VariableDefinition>> = match
            serde_wasm_bindgen::from_value(target_data_defs)
        {
            Ok(data) => data,
            Err(e) => {
                let msg = format!("Failed to parse target data definitions: {}", e);
                error_collector.add_error("Constructor : Target Data Definitions", &msg);
                return Err(string_to_js_error(msg));
            }
        };

        let case_data_defs: Vec<Vec<VariableDefinition>> = match
            serde_wasm_bindgen::from_value(case_data_defs)
        {
            Ok(data) => data,
            Err(e) => {
                let msg = format!("Failed to parse case data definitions: {}", e);
                error_collector.add_error("Constructor : Case Data Definitions", &msg);
                return Err(string_to_js_error(msg));
            }
        };

        if is_all_null(&target_data) {
            let msg = "Target data contains all null values".to_string();
            error_collector.add_error("Constructor : Target Data Validation", &msg);
            return Err(string_to_js_error(msg));
        }

        if is_all_null(&case_data) {
            let msg = "Case data contains all null values".to_string();
            error_collector.add_error("Constructor : Case Data Validation", &msg);
            return Err(string_to_js_error(msg));
        }

        if target_data.is_empty() {
            let msg = "Target data cannot be empty".to_string();
            error_collector.add_error("Constructor : Target Data Validation", &msg);
            return Err(string_to_js_error(msg));
        }

        let config: KMeansConfig = match serde_wasm_bindgen::from_value(config_data.clone()) {
            Ok(data) => data,
            Err(e) => {
                let msg =
                    format!("Failed to parse configuration: {}. Ensure field names match the expected format.", e);
                error_collector.add_error("Constructor : Config", &msg);

                // Try to get a more detailed error by inspecting the config data
                if let Ok(config_json) = js_sys::JSON::stringify(&config_data) {
                    let config_str = config_json.as_string().unwrap_or_default();
                    error_collector.add_error(
                        "Constructor : Config : Raw",
                        &format!("Raw config: {}", config_str)
                    );
                }

                return Err(string_to_js_error(msg));
            }
        };

        // Validate important configuration
        if config.main.cluster <= 0 {
            let msg = "Number of clusters must be positive".to_string();
            error_collector.add_error("Config : Validation : Clusters", &msg);
            return Err(string_to_js_error(msg));
        }

        // Store data
        let data = AnalysisData {
            target_data,
            case_data,
            target_data_defs,
            case_data_defs,
        };

        // Create instance
        let mut analysis = KMeansClusterAnalysis {
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

    pub fn get_all_log(&self) -> Result<JsValue, JsValue> {
        function::get_all_log(&self.logger)
    }

    pub fn get_all_errors(&self) -> JsValue {
        function::get_all_errors(&self.error_collector)
    }

    pub fn clear_errors(&mut self) -> JsValue {
        function::clear_errors(&mut self.error_collector)
    }
}
