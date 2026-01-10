use crate::models::{
    config::{ ClusterConfig, StandardizeMethod },
    data::{ AnalysisData, DataValue },
};
use crate::stats::common::{ calculate_statistics, DataStats };

// Fungsi utama untuk mentransformasi data
pub fn transform_data(data: &mut AnalysisData, config: &ClusterConfig) -> Result<(), String> {
    // Dapatkan variabel yang akan digunakan untuk standardisasi
    let variables = match &config.main.variables {
        Some(vars) => vars.clone(),
        None => {
            return Err("No variables specified for transformation".to_string());
        }
    };

    if config.method.by_case {
        standardize_by_case(data, config, &variables)?;
    } else if config.method.by_variable {
        standardize_by_variable(data, config, &variables)?;
    }

    Ok(())
}

// Standardisasi data berdasarkan kasus (baris)
fn standardize_by_case(
    data: &mut AnalysisData,
    config: &ClusterConfig,
    variables: &[String]
) -> Result<(), String> {
    if data.cluster_data.is_empty() {
        return Ok(());
    }

    // Proses setiap kasus (baris) secara terpisah
    for dataset_idx in 0..data.cluster_data.len() {
        let dataset = &mut data.cluster_data[dataset_idx];

        for case_idx in 0..dataset.len() {
            // Ekstrak nilai untuk semua variabel dari kasus ini
            let case_values: Vec<f64> = variables
                .iter()
                .filter_map(|var| {
                    if let Some(DataValue::Number(value)) = dataset[case_idx].values.get(var) {
                        Some(*value)
                    } else {
                        None
                    }
                })
                .collect();

            // Lewati jika tidak ada nilai untuk di-standardisasi
            if case_values.is_empty() {
                continue;
            }

            // Hitung statistik untuk kasus ini
            let stats = calculate_statistics(&case_values);

            // Terapkan standardisasi ke setiap nilai
            for var in variables {
                if let Some(DataValue::Number(value)) = dataset[case_idx].values.get_mut(var) {
                    *value = standardize_value(*value, &stats, &config.method.standardize_method);
                }
            }
        }
    }

    Ok(())
}

// Standardisasi data berdasarkan variabel (kolom)
fn standardize_by_variable(
    data: &mut AnalysisData,
    config: &ClusterConfig,
    variables: &[String]
) -> Result<(), String> {
    if data.cluster_data.is_empty() {
        return Ok(());
    }

    // Proses setiap variabel (kolom) secara terpisah
    for var in variables {
        // Ekstrak semua nilai untuk variabel ini di semua kasus
        let var_values: Vec<f64> = data.cluster_data
            .iter()
            .flat_map(|dataset| dataset.iter())
            .filter_map(|case| {
                if let Some(DataValue::Number(value)) = case.values.get(var) {
                    Some(*value)
                } else {
                    None
                }
            })
            .collect();

        // Lewati jika tidak ada nilai untuk di-standardisasi
        if var_values.is_empty() {
            continue;
        }

        // Hitung statistik untuk variabel ini
        let stats = calculate_statistics(&var_values);

        // Terapkan standardisasi ke setiap kasus untuk variabel ini
        for dataset in &mut data.cluster_data {
            for case in dataset {
                if let Some(DataValue::Number(value)) = case.values.get_mut(var) {
                    *value = standardize_value(*value, &stats, &config.method.standardize_method);
                }
            }
        }
    }

    Ok(())
}

// Fungsi untuk melakukan standardisasi nilai berdasarkan metode yang ditentukan
fn standardize_value(value: f64, stats: &DataStats, method: &StandardizeMethod) -> f64 {
    match method {
        StandardizeMethod::None => value,
        StandardizeMethod::ZScore => {
            if stats.std_dev == 0.0 { 0.0 } else { (value - stats.mean) / stats.std_dev }
        }
        StandardizeMethod::RangeNegOneToOne => {
            if stats.range == 0.0 { 0.0 } else { 2.0 * ((value - stats.min) / stats.range) - 1.0 }
        }
        StandardizeMethod::RangeZeroToOne => {
            if stats.range == 0.0 { 0.5 } else { (value - stats.min) / stats.range }
        }
        StandardizeMethod::MaxMagnitudeOne => {
            if stats.abs_max == 0.0 { 0.0 } else { value / stats.abs_max }
        }
        StandardizeMethod::MeanOne => {
            if stats.mean == 0.0 { value + 1.0 } else { value / stats.mean }
        }
        StandardizeMethod::StdDevOne => {
            if stats.std_dev == 0.0 { value } else { value / stats.std_dev }
        }
    }
}
