use std::collections::HashMap;
use nalgebra::DMatrix;
use crate::models::{
    config::{ SumOfSquaresMethod, UnivariateConfig },
    data::AnalysisData,
    result::{ HypothesisLMatrices, TermMatrix },
};

use super::core::*;

pub fn calculate_hypothesis_l_matrices(
    data: &AnalysisData,
    config: &UnivariateConfig
) -> Result<HypothesisLMatrices, String> {
    let design_info = create_design_response_weights(data, config)?;

    let all_param_names = generate_all_row_parameter_names_sorted(&design_info, data)?;
    let all_model_terms_in_design = &design_info.term_names;

    let mut l_matrices_map: HashMap<String, DMatrix<f64>> = HashMap::new();

    for term_name in all_model_terms_in_design {
        // Membuat matriks L
        let l_matrix_result = match config.model.sum_of_square_method {
            SumOfSquaresMethod::TypeI => {
                let ztwz_matrix = create_cross_product_matrix(&design_info)?;

                construct_type_i_l_matrix(
                    &design_info,
                    term_name,
                    all_model_terms_in_design,
                    &ztwz_matrix
                )
            }
            SumOfSquaresMethod::TypeII =>
                construct_type_ii_l_matrix(&design_info, term_name, all_model_terms_in_design),
            SumOfSquaresMethod::TypeIII =>
                construct_type_iii_l_matrix(
                    &design_info,
                    term_name,
                    all_model_terms_in_design,
                    data,
                    config
                ),
            SumOfSquaresMethod::TypeIV =>
                construct_type_iv_l_matrix(
                    &design_info,
                    term_name,
                    all_model_terms_in_design,
                    data,
                    config
                ),
        };

        if let Ok(l_matrix) = l_matrix_result {
            l_matrices_map.insert(term_name.clone(), l_matrix);
        } else if let Err(e) = l_matrix_result {
            return Err(format!("Could not generate L-matrix for term '{}': {}", term_name, e));
        }
    }

    let ss_type_str = match config.model.sum_of_square_method {
        SumOfSquaresMethod::TypeI => "I",
        SumOfSquaresMethod::TypeII => "II",
        SumOfSquaresMethod::TypeIII => "III",
        SumOfSquaresMethod::TypeIV => "IV",
    };
    let note = format!("Based on Type {} Sums of Squares.", ss_type_str);

    let mut matrices = Vec::new();

    for term_name in all_model_terms_in_design {
        if let Some(l_matrix) = l_matrices_map.get(term_name) {
            if l_matrix.nrows() == 0 || l_matrix.ncols() == 0 {
                continue;
            }

            let l_transpose = l_matrix.transpose();
            let mut matrix_data: Vec<Vec<f64>> = Vec::new();

            for r in 0..l_transpose.nrows() {
                matrix_data.push(l_transpose.row(r).iter().cloned().collect());
            }

            let mut contrast_names = Vec::new();
            for i in 0..l_matrix.nrows() {
                contrast_names.push(format!("L{}", i + 1));
            }

            matrices.push(TermMatrix {
                term: term_name.clone(),
                parameter_names: all_param_names.clone(),
                contrast_names,
                matrix: matrix_data,
                note: Some(note.clone()),
                interpretation: Some(
                    "This matrix provides the coefficients for the linear combinations of parameters that form the basis for testing the hypothesis for the given term. Each row corresponds to a specific contrast (e.g., L1, L2).".to_string()
                ),
            });
        }
    }

    Ok(HypothesisLMatrices {
        matrices,
        note: Some(
            "These matrices define the testable hypotheses for each term in the model.".to_string()
        ),
        interpretation: Some(
            "Each matrix (L) specifies the linear combinations of parameters (β) that correspond to a particular hypothesis test (Lβ = 0). These are constructed based on the selected Sum of Squares type and are fundamental for calculating the F-statistics in the 'Tests of Between-Subjects Effects' table.".to_string()
        ),
    })
}
