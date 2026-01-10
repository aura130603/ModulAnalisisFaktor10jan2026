// ml.rs
use std::collections::HashMap;

use crate::models::{
    config::VarianceCompsConfig,
    data::AnalysisData,
    result::{ ComponentCovariation, ConvergenceInfo },
};

use super::core::likelihood_estimation;

/// ML estimation wrapper function
pub fn ml_estimation(
    data: &AnalysisData,
    config: &VarianceCompsConfig
) -> Result<(HashMap<String, f64>, ConvergenceInfo, ComponentCovariation), String> {
    likelihood_estimation(data, config, "ML")
}
