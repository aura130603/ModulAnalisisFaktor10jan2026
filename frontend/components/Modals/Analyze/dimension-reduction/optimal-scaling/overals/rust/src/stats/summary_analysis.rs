use std::collections::HashMap;

use crate::models::{
    config::OVERALSAnalysisConfig,
    data::{ AnalysisData, DataValue },
    result::SummaryAnalysis,
};

use super::core::{ get_var_def, run_overals_algorithm };

/// Calculate summary analysis for OVERALS analysis
/// Calculate summary analysis for OVERALS analysis
pub fn calculate_summary_analysis(
    data: &AnalysisData,
    config: &OVERALSAnalysisConfig
) -> Result<SummaryAnalysis, String> {
    // Run the OVERALS algorithm
    let result = run_overals_algorithm(data, config)?;

    // Number of sets
    let num_sets = data.set_target_data.len();

    // Create result structure
    let mut loss = HashMap::new();
    let mut eigenvalue = HashMap::new();
    let mut fit = HashMap::new();

    // Calculate loss per set and dimension
    for set_idx in 0..num_sets {
        let mut set_loss_by_dim = vec![0.0; result.dimensions];
        let mut total_set_cases = 0;

        if let Some(set_data) = data.set_target_data.get(set_idx) {
            // Calculate loss for each case in this set
            for case_idx in 0..result.object_scores.len() {
                let mut case_has_data = false;
                let mut expected_scores =
                    vec![vec![0.0; result.dimensions]; result.object_scores.len()];

                // Calculate expected scores based on quantifications for this set
                for (var_idx, var_data) in set_data.iter().enumerate() {
                    if case_idx < var_data.len() {
                        if let Ok(var_def) = get_var_def(data, set_idx, var_idx) {
                            let record = &var_data[case_idx];
                            let var_name = &var_def.name;

                            if let Some(DataValue::Number(num)) = record.values.get(var_name) {
                                if *num > 0.0 && (*num - num.floor()).abs() < 1e-10 {
                                    let cat_val = *num as usize;
                                    case_has_data = true;

                                    if
                                        let Some(&quant) = result.category_quantifications.get(
                                            &(set_idx, var_idx, cat_val)
                                        )
                                    {
                                        if
                                            let Some(weights) = result.variable_weights.get(
                                                &(set_idx, var_idx)
                                            )
                                        {
                                            for dim in 0..result.dimensions {
                                                expected_scores[case_idx][dim] +=
                                                    quant * weights[dim];
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // If case has data, calculate loss
                if case_has_data {
                    for dim in 0..result.dimensions {
                        let case_loss = (
                            result.object_scores[case_idx][dim] - expected_scores[case_idx][dim]
                        ).powi(2);
                        set_loss_by_dim[dim] += case_loss;
                    }
                    total_set_cases += 1;
                }
            }

            // Normalize by number of cases
            if total_set_cases > 0 {
                for dim in 0..result.dimensions {
                    set_loss_by_dim[dim] /= total_set_cases as f64;
                }
            }

            // Store loss per dimension for this set
            let mut set_loss = 0.0;
            for dim in 0..result.dimensions {
                loss.insert(
                    format!("Set {} Dimension {}", set_idx + 1, dim + 1),
                    set_loss_by_dim[dim]
                );
                set_loss += set_loss_by_dim[dim];
            }

            // Store total set loss
            loss.insert(format!("Set {}", set_idx + 1), set_loss);
        }
    }

    // Calculate mean loss per dimension
    for dim in 0..result.dimensions {
        let mut dim_loss = 0.0;
        for set_idx in 0..num_sets {
            if
                let Some(&set_dim_loss) = loss.get(
                    &format!("Set {} Dimension {}", set_idx + 1, dim + 1)
                )
            {
                dim_loss += set_dim_loss;
            }
        }
        let mean_dim_loss = dim_loss / (num_sets as f64);
        loss.insert(format!("Dimension {}", dim + 1), mean_dim_loss);

        // Calculate eigenvalues (1 - mean loss per dimension)
        eigenvalue.insert(format!("Dimension {}", dim + 1), 1.0 - mean_dim_loss);
    }

    // Calculate total mean loss
    let mut total_loss = 0.0;
    for set_idx in 0..num_sets {
        if let Some(&set_loss) = loss.get(&format!("Set {}", set_idx + 1)) {
            total_loss += set_loss;
        }
    }
    let mean_loss = total_loss / (num_sets as f64);
    loss.insert("Mean".to_string(), mean_loss);

    // Calculate total fit (sum of eigenvalues)
    let mut total_fit = 0.0;
    for dim in 0..result.dimensions {
        if let Some(&eigen) = eigenvalue.get(&format!("Dimension {}", dim + 1)) {
            total_fit += eigen;
        }
    }
    fit.insert("Total".to_string(), total_fit);

    Ok(SummaryAnalysis {
        loss,
        eigenvalue,
        fit,
    })
}
