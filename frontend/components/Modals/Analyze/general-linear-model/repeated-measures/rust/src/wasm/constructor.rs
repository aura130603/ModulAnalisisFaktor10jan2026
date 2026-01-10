use wasm_bindgen::prelude::*;

use crate::models::{
    config::RepeatedMeasuresConfig,
    data::{ AnalysisData, DataRecord, VariableDefinition },
    result::RepeatedMeasureResult,
};
use crate::utils::{ converter::string_to_js_error, error::ErrorCollector };
use crate::wasm::function;

#[wasm_bindgen]
pub struct RepeatedMeasureAnalysis {
    config: RepeatedMeasuresConfig,
    data: AnalysisData,
    result: Option<RepeatedMeasureResult>,
    error_collector: ErrorCollector,
}

#[wasm_bindgen]
impl RepeatedMeasureAnalysis {
    #[wasm_bindgen(constructor)]
    pub fn new(
        subject_data: JsValue,
        factors_data: JsValue,
        covar_data: JsValue,
        subject_data_defs: JsValue,
        factors_data_defs: JsValue,
        covar_data_defs: JsValue,
        config_data: JsValue
    ) -> Result<RepeatedMeasureAnalysis, JsValue> {
        // Initialize error collector
        let mut error_collector = ErrorCollector::default();

        // Parse subject data
        let subject_data: Vec<Vec<DataRecord>> = match serde_wasm_bindgen::from_value(subject_data) {
            Ok(data) => data,
            Err(e) => {
                let msg = format!("Failed to parse subject data: {}", e);
                error_collector.add_error("constructor.subject_data", &msg);
                return Err(string_to_js_error(msg));
            }
        };

        // Parse factors data
        let factors_data: Vec<Vec<DataRecord>> = match serde_wasm_bindgen::from_value(factors_data) {
            Ok(data) => data,
            Err(e) => {
                let msg = format!("Failed to parse factors data: {}", e);
                error_collector.add_error("constructor.factors_data", &msg);
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

        // Parse variable definitions
        let subject_data_defs: Vec<Vec<VariableDefinition>> = match
            serde_wasm_bindgen::from_value(subject_data_defs)
        {
            Ok(data) => data,
            Err(e) => {
                let msg = format!("Failed to parse subject variable definitions: {}", e);
                error_collector.add_error("constructor.subject_data_defs", &msg);
                return Err(string_to_js_error(msg));
            }
        };

        let factors_data_defs: Vec<Vec<VariableDefinition>> = match
            serde_wasm_bindgen::from_value(factors_data_defs)
        {
            Ok(data) => data,
            Err(e) => {
                let msg = format!("Failed to parse factors variable definitions: {}", e);
                error_collector.add_error("constructor.factors_data_defs", &msg);
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

        // Parse configuration
        let config: RepeatedMeasuresConfig = match serde_wasm_bindgen::from_value(config_data) {
            Ok(data) => data,
            Err(e) => {
                let msg = format!("Failed to parse configuration: {}", e);
                error_collector.add_error("constructor.config", &msg);
                return Err(string_to_js_error(msg));
            }
        };

        // Validate required configuration settings
        if config.main.sub_var.is_none() || config.main.sub_var.as_ref().unwrap().is_empty() {
            let msg =
                "At least one subject variable must be selected for repeated measures analysis".to_string();
            error_collector.add_error("config.validation.sub_var", &msg);
            return Err(string_to_js_error(msg));
        }

        // Create analysis data structure
        let data = AnalysisData {
            subject_data,
            factors_data,
            covariate_data,
            subject_data_defs,
            factors_data_defs,
            covariate_data_defs,
        };

        // Create analysis instance
        let mut analysis = RepeatedMeasureAnalysis {
            config,
            data,
            result: None,
            error_collector,
        };

        // Run the analysis
        match
            function::run_analysis(&analysis.data, &analysis.config, &mut analysis.error_collector)
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

    pub fn clear_errors(&mut self) -> JsValue {
        function::clear_errors(&mut self.error_collector)
    }
}
