use crate::models::{
    config::CorrespondenceAnalysisConfig,
    data::{ AnalysisData, DataRecord, DataValue },
    result::CorrespondenceTable,
};

use super::core::{ filter_active_categories, get_unique_categories, apply_equality_constraints };

// correspondence_table.rs - Modify create_correspondence_table to use weights
// correspondence_table.rs - Modified to properly use weight data
pub fn create_correspondence_table(
    data: &AnalysisData,
    config: &CorrespondenceAnalysisConfig
) -> Result<CorrespondenceTable, String> {
    // Extract row and column variables from configuration
    let row_var = config.main.row_target_var.as_ref().ok_or("Row target variable not specified")?;
    let col_var = config.main.col_target_var
        .as_ref()
        .ok_or("Column target variable not specified")?;

    // First collect all records with the row and column variables
    let mut row_records = Vec::new();
    for dataset in &data.row_data {
        for record in dataset {
            if record.values.contains_key(row_var) {
                row_records.push(record.clone());
            }
        }
    }

    let mut col_records = Vec::new();
    for dataset in &data.col_data {
        for record in dataset {
            if record.values.contains_key(col_var) {
                col_records.push(record.clone());
            }
        }
    }

    // Get unique categories
    let row_categories = get_unique_categories(&row_records, row_var)?;
    let col_categories = get_unique_categories(&col_records, col_var)?;

    // Filter active categories based on configuration
    let active_row_cats = filter_active_categories(&row_categories, &config.define_range_row)?;
    let active_col_cats = filter_active_categories(&col_categories, &config.define_range_column)?;

    // Create correspondence table matrix
    let mut table_data: Vec<Vec<f64>> =
        vec![vec![0.0; active_col_cats.len()]; active_row_cats.len()];
    let mut active_margin_row: Vec<f64> = vec![0.0; active_row_cats.len()];
    let mut active_margin_col: Vec<f64> = vec![0.0; active_col_cats.len()];

    // Flatten all datasets into a single list for easier processing
    let flattened_rows: Vec<&DataRecord> = data.row_data.iter().flatten().collect();
    let flattened_cols: Vec<&DataRecord> = data.col_data.iter().flatten().collect();
    let flattened_weights: Vec<&DataRecord> = data.weight_data.iter().flatten().collect();

    // Process records in order
    let record_count = std::cmp::min(
        flattened_rows.len(),
        std::cmp::min(flattened_cols.len(), if flattened_weights.is_empty() {
            usize::MAX
        } else {
            flattened_weights.len()
        })
    );

    for i in 0..record_count {
        let row_record = flattened_rows[i];
        let col_record = flattened_cols[i];

        // Extract row value
        let row_value = match row_record.values.get(row_var) {
            Some(DataValue::Text(s)) => s.clone(),
            Some(DataValue::Number(n)) => n.to_string(),
            _ => {
                continue;
            }
        };

        // Extract column value
        let col_value = match col_record.values.get(col_var) {
            Some(DataValue::Text(s)) => s.clone(),
            Some(DataValue::Number(n)) => n.to_string(),
            _ => {
                continue;
            }
        };

        // Extract weight value (default to 1.0 if no weights available)
        let weight = if i < flattened_weights.len() {
            flattened_weights[i].values
                .values()
                .find_map(|v| if let DataValue::Number(n) = v { Some(*n) } else { None })
                .unwrap_or(1.0)
        } else {
            1.0
        };

        // Find indices in active categories
        if
            let (Some(row_idx), Some(col_idx)) = (
                active_row_cats.iter().position(|c| c == &row_value),
                active_col_cats.iter().position(|c| c == &col_value),
            )
        {
            // Update table with weighted value
            table_data[row_idx][col_idx] += weight;
            active_margin_row[row_idx] += weight;
            active_margin_col[col_idx] += weight;
        }
    }

    // Apply equality constraints if specified
    apply_equality_constraints(
        &mut table_data,
        &mut active_margin_row,
        &mut active_margin_col,
        config
    )?;

    // Debug output
    println!("Created correspondence table of size {}x{}", table_data.len(), if
        table_data.is_empty()
    {
        0
    } else {
        table_data[0].len()
    });

    Ok(CorrespondenceTable {
        data: table_data,
        active_margin: active_margin_row,
        active_margin_col: active_margin_col,
    })
}
