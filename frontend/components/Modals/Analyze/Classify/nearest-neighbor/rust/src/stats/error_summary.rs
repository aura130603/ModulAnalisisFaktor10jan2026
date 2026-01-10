// error_summary.rs
use crate::models::result::{ ClassificationTable, ErrorSummary };

/// Calculate error summary based on classification table results
pub fn calculate_error_summary(
    classification_table: &Option<ClassificationTable>
) -> Result<ErrorSummary, String> {
    match classification_table {
        Some(table) => {
            // Calculate overall accuracy for training set
            let training_total: usize = table.training.observed.iter().sum();
            let training_correct: f64 = table.training.observed
                .iter()
                .zip(table.training.percent_correct.iter())
                .map(|(&obs, &pct)| ((obs as f64) * pct) / 100.0)
                .sum();
            let training_accuracy = if training_total > 0 {
                (training_correct * 100.0) / (training_total as f64)
            } else {
                0.0
            };

            // Calculate overall accuracy for holdout set
            let holdout_total: usize = table.holdout.observed.iter().sum();
            let holdout_correct: f64 = table.holdout.observed
                .iter()
                .zip(table.holdout.percent_correct.iter())
                .map(|(&obs, &pct)| ((obs as f64) * pct) / 100.0)
                .sum();
            let holdout_accuracy = if holdout_total > 0 {
                (holdout_correct * 100.0) / (holdout_total as f64)
            } else {
                0.0
            };

            // Convert accuracies to error rates
            let training_error = 100.0 - training_accuracy;
            let holdout_error = 100.0 - holdout_accuracy;

            Ok(ErrorSummary {
                training: training_error,
                holdout: holdout_error,
            })
        }
        None => Err("Classification table not available for error summary calculation".to_string()),
    }
}
