use crate::models::{ config::MCAConfig, data::AnalysisData };

use super::core::{ apply_discretization, calculate_category_points, calculate_object_scores };

/// Save model results (discretized data, transformed values, object scores)
pub fn save_model_results(data: &AnalysisData, config: &MCAConfig) -> Result<(), String> {
    // This function would typically save results to files or datasets
    // For this Rust implementation, we'll just prepare the data

    // Check what needs to be saved
    let save_discretized = config.save.discretized;
    let save_transformed = config.save.save_trans;
    let save_object_scores = config.save.save_obj_scores;

    // If nothing needs to be saved, return early
    if !save_discretized && !save_transformed && !save_object_scores {
        return Ok(());
    }

    // Save discretized data if requested
    if save_discretized {
        if config.save.disc_newdata || config.save.disc_write_newdata {
            // Apply discretization to get discretized data
            let discretized_data = apply_discretization(data, config)?;

            // In a real implementation, we would save this to a file or dataset
            // For now, we'll just log success
            web_sys::console::log_1(&"Discretized data prepared for saving".into());
        }
    }

    // Save transformed data if requested
    if save_transformed {
        if config.save.trans_newdata || config.save.trans_write_newdata {
            // Calculate object scores and category quantifications
            let object_scores = calculate_object_scores(data, config)?;
            let category_points = calculate_category_points(data, config)?;

            // Transform original data using quantifications
            // (This would be implemented in a real application)

            web_sys::console::log_1(&"Transformed data prepared for saving".into());
        }
    }

    // Save object scores if requested
    if save_object_scores {
        if config.save.obj_newdata || config.save.obj_write_newdata {
            // Calculate object scores
            let object_scores = calculate_object_scores(data, config)?;

            // In a real implementation, we would save this to a file or dataset
            web_sys::console::log_1(&"Object scores prepared for saving".into());
        }
    }

    Ok(())
}
