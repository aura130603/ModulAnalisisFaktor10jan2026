use crate::models::{
    config::OVERALSAnalysisConfig,
    data::AnalysisData,
    result::IterationHistory,
};

use super::core::run_overals_algorithm;

/// Calculate iteration history for OVERALS analysis
pub fn calculate_iteration_history(
    data: &AnalysisData,
    config: &OVERALSAnalysisConfig
) -> Result<IterationHistory, String> {
    // Run the OVERALS algorithm
    let result = run_overals_algorithm(data, config)?;

    // Return the iteration history
    Ok(IterationHistory {
        iterations: result.iteration_history,
    })
}
