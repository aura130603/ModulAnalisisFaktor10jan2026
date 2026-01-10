// reml.rs (Updated)
use std::collections::HashMap;

use crate::models::{
    config::VarianceCompsConfig,
    data::AnalysisData,
    result::{ ComponentCovariation, ConvergenceInfo },
};

use super::core::likelihood_estimation;

/// REML estimation wrapper function
pub fn reml_estimation(
    data: &AnalysisData,
    config: &VarianceCompsConfig
) -> Result<(HashMap<String, f64>, ConvergenceInfo, ComponentCovariation), String> {
    likelihood_estimation(data, config, "REML")
}
