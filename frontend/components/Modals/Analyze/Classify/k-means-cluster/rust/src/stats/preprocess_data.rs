use crate::models::{
    config::KMeansConfig,
    data::{ AnalysisData, DataValue },
    result::ProcessedData,
};

pub fn preprocess_data(
    data: &AnalysisData,
    config: &KMeansConfig
) -> Result<ProcessedData, String> {
    let variables = config.main.target_var.as_ref().cloned().unwrap_or_default();

    let num_cases = data.target_data.first().map_or(0, |ds| ds.len());
    if num_cases == 0 {
        return Err("No cases found in data".to_string());
    }

    let mut data_matrix = Vec::new();
    let mut case_numbers = Vec::new();

    let use_list_wise = config.options.exclude_list_wise;
    let use_pair_wise = config.options.exclude_pair_wise;

    for case_idx in 0..num_cases {
        let mut row = Vec::with_capacity(variables.len());
        let mut has_missing = false;
        let mut non_missing_count = 0;

        for var in &variables {
            let mut var_found = false;

            for dataset in &data.target_data {
                if case_idx < dataset.len() {
                    if let Some(value) = dataset[case_idx].values.get(var) {
                        // Konversi nilai ke format numerik yang sesuai
                        let numeric_value = match value {
                            DataValue::Number(v) => Some(*v as f64),
                            DataValue::NumberFloat(v) => Some(*v),
                            DataValue::Currency(v) => Some(*v),
                            DataValue::Scientific(v) => Some(*v),
                            DataValue::Percentage(v) => Some(*v),
                            _ => None,
                        };

                        if let Some(val) = numeric_value {
                            row.push(val);
                            non_missing_count += 1;
                            var_found = true;
                            break;
                        }
                    }
                }
            }

            if !var_found {
                has_missing = true;
                if use_list_wise {
                    break;
                } else if use_pair_wise {
                    row.push(f64::NAN);
                }
            }
        }

        if use_list_wise {
            if !has_missing {
                data_matrix.push(row);
                case_numbers.push((case_idx + 1) as i32);
            }
        } else if use_pair_wise {
            if non_missing_count > 0 {
                data_matrix.push(row);
                case_numbers.push((case_idx + 1) as i32);
            }
        }
    }

    // Validasi
    if data_matrix.is_empty() {
        return Err("No valid data records after preprocessing".to_string());
    }

    // Ekstraksi Nama Kasus
    let case_names = if let Some(case_target) = &config.main.case_target {
        let mut names = Vec::with_capacity(case_numbers.len());

        for &case_idx in &case_numbers {
            let idx = (case_idx - 1) as usize;
            let mut name = None;

            for dataset in &data.case_data {
                if idx < dataset.len() {
                    if let Some(value) = dataset[idx].values.get(case_target) {
                        // Konversi nilai (teks, angka, boolean, dll.) menjadi string
                        name = Some(match value {
                            DataValue::Text(text) => text.clone(),
                            DataValue::Number(num) => num.to_string(),
                            DataValue::NumberFloat(num) => num.to_string(),
                            DataValue::Boolean(b) => b.to_string(),
                            DataValue::Date(d) => d.clone(),
                            DataValue::DateTime(dt) => dt.clone(),
                            DataValue::Time(t) => t.clone(),
                            DataValue::Currency(c) => c.to_string(),
                            DataValue::Scientific(s) => s.to_string(),
                            DataValue::Percentage(p) => p.to_string(),
                            DataValue::Null => String::new(),
                        });
                        if name.is_some() {
                            break;
                        }
                    }
                }
            }

            names.push(name.unwrap_or_default());
        }
        Some(names)
    } else {
        None
    };

    let missing_cases = num_cases - data_matrix.len();

    Ok(ProcessedData {
        variables,
        data_matrix,
        case_numbers,
        case_names,
        total_cases: num_cases,
        missing_cases,
    })
}
