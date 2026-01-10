use std::collections::HashMap;

use nalgebra::DMatrix;

use crate::models::{
    config::MCAConfig,
    data::{ AnalysisData, DataValue },
    result::CategoryPoints,
};

use super::core::{
    calculate_object_scores,
    collect_valid_categories,
    get_all_variables,
    is_missing,
    parse_variable_weight,
    update_category_quantifications,
};

/// Calculate category points (quantifications)
pub fn calculate_category_points(
    data: &AnalysisData,
    config: &MCAConfig
) -> Result<CategoryPoints, String> {
    // Get variables for which category quantifications are requested
    let quant_vars = match &config.output.cat_quantifications {
        Some(vars) if !vars.is_empty() => {
            vars.iter()
                .map(|v| parse_variable_weight(v).0)
                .collect()
        }
        _ => {
            match &config.main.analysis_vars {
                Some(vars) => {
                    vars.iter()
                        .map(|v| parse_variable_weight(v).0)
                        .collect()
                }
                None => get_all_variables(data),
            }
        }
    };

    // Use the first dataset for analysis
    if data.analysis_data.is_empty() || data.analysis_data[0].is_empty() {
        return Err("No data available for analysis".to_string());
    }

    let dataset = &data.analysis_data[0];
    let p_dims = config.main.dimensions as usize;

    // Get object scores
    let object_scores_result = calculate_object_scores(data, config)?;

    // Create scores matrix
    let n_cases = dataset.len();
    let mut scores_matrix = DMatrix::zeros(n_cases, p_dims);

    for (i, case_num) in object_scores_result.case_numbers.iter().enumerate() {
        for dim in 0..p_dims {
            let dim_name = &object_scores_result.dimensions[dim];
            if let Some(score) = object_scores_result.scores.get(dim_name).map(|v| v[i]) {
                scores_matrix[(i, (*case_num as usize) - 1)] = score;
            }
        }
    }

    // Calculate indicator matrices and category quantifications
    let mut categories_map = HashMap::new();
    let mut coordinates_map = HashMap::new();

    for var_name in &quant_vars {
        // Collect all categories for this variable
        let categories = collect_valid_categories(dataset, var_name);
        if categories.is_empty() {
            continue;
        }

        // Create string representation of categories
        let cat_labels: Vec<String> = categories
            .iter()
            .map(|cat| {
                match cat {
                    DataValue::Number(num) => num.to_string(),
                    DataValue::Text(text) => text.clone(),
                    DataValue::Boolean(b) => b.to_string(),
                    DataValue::Null => "Null".to_string(),
                }
            })
            .collect();

        // Create indicator matrix for this variable
        let n_cats = categories.len();
        let mut indicator = DMatrix::zeros(n_cases, n_cats);

        for (row_idx, record) in dataset.iter().enumerate() {
            if let Some(value) = record.values.get(var_name) {
                if !is_missing(value) {
                    // Find category index
                    if
                        let Some(col_idx) = categories.iter().position(|cat| {
                            match (cat, value) {
                                (DataValue::Number(a), DataValue::Number(b)) =>
                                    (a - b).abs() < 1e-10,
                                (DataValue::Text(a), DataValue::Text(b)) => a == b,
                                (DataValue::Boolean(a), DataValue::Boolean(b)) => a == b,
                                _ => false,
                            }
                        })
                    {
                        indicator[(row_idx, col_idx)] = 1.0;
                    }
                }
            }
        }

        // Calculate category quantifications (centroid coordinates)
        let quantifications = update_category_quantifications(&indicator, &scores_matrix, 1.0);

        // Store category coordinates by dimension
        let mut var_coords = HashMap::new();

        for dim in 0..p_dims {
            let mut dim_coords = Vec::new();

            for cat_idx in 0..n_cats {
                dim_coords.push(quantifications[(cat_idx, dim)]);
            }

            var_coords.insert(dim.to_string(), dim_coords);
        }

        categories_map.insert(var_name.clone(), cat_labels);
        coordinates_map.insert(var_name.clone(), var_coords);
    }

    // Create dimension labels
    let dimensions: Vec<String> = (1..=p_dims).map(|i| i.to_string()).collect();

    Ok(CategoryPoints {
        variables: quant_vars,
        categories: categories_map,
        dimension_coordinates: coordinates_map,
    })
}
