use std::collections::HashMap;

use crate::models::{
    config::OVERALSAnalysisConfig,
    data::AnalysisData,
    result::{ Dimensions, ObjectScores },
};

use super::core::run_overals_algorithm;

/// Initialize object scores
pub fn initialize_object_scores(
    dimensions: usize,
    num_cases: usize,
    use_random_init: bool
) -> Vec<Vec<f64>> {
    if use_random_init {
        // Random initialization
        use rand::Rng;
        let mut rng = rand::thread_rng();
        (0..num_cases)
            .map(|_| { (0..dimensions).map(|_| rng.gen::<f64>() * 2.0 - 1.0).collect() })
            .collect()
    } else {
        // Numerical initialization
        (0..num_cases)
            .map(|i| {
                (0..dimensions)
                    .map(|d| { (((i % 10) as f64) / 10.0) * (if d % 2 == 0 { 1.0 } else { -1.0 }) })
                    .collect()
            })
            .collect()
    }
}

/// Calculate object scores for OVERALS analysis
pub fn calculate_object_scores(
    data: &AnalysisData,
    config: &OVERALSAnalysisConfig
) -> Result<ObjectScores, String> {
    // Run OVERALS algorithm
    let result = run_overals_algorithm(data, config)?;

    // Prepare result structure
    let mut scores = HashMap::new();

    // Add object scores to results
    for (i, score) in result.object_scores.iter().enumerate() {
        scores.insert(format!("Case{}", i + 1), Dimensions {
            dimensions: score.clone(),
        });
    }

    Ok(ObjectScores { scores })
}
