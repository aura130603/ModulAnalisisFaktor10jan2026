use crate::models::config::OptionsConfig;

/// Struktur output untuk data matriks yang sudah diformat
/// Menggunakan Option<f64> agar bisa mengirim 'null' untuk nilai yang di-suppress
#[derive(Debug, Clone)]
pub struct FormattedMatrixData {
    pub sorted_var_names: Vec<String>,
    pub formatted_values: Vec<Vec<Option<f64>>>,
}

/// Menentukan komponen dominan untuk setiap variabel (baris)
/// Mengembalikan indeks komponen yang memiliki nilai absolut terbesar
fn get_dominant_component(row: &[f64]) -> (usize, f64) {
    let mut max_idx = 0;
    let mut max_val = 0.0_f64;
    
    for (idx, &val) in row.iter().enumerate() {
        if val.abs() > max_val {
            max_val = val.abs();
            max_idx = idx;
        }
    }
    
    (max_idx, max_val)
}

/// Memformat matriks faktor dengan sorted by size dan suppress small coefficients
/// 
/// # Arguments
/// * `var_names` - Nama variabel dalam urutan asli
/// * `values` - Matriks nilai loading (baris = variabel, kolom = komponen)
/// * `config` - Konfigurasi options yang berisi sort_size dan suppress_values
/// 
/// # Returns
/// FormattedMatrixData dengan nama variabel yang sudah diurutkan dan nilai yang diformat
pub fn format_factor_matrix(
    var_names: &[String],
    values: &[Vec<f64>],
    config: &OptionsConfig,
) -> FormattedMatrixData {
    let n_rows = var_names.len();
    
    if n_rows == 0 || values.is_empty() {
        return FormattedMatrixData {
            sorted_var_names: vec![],
            formatted_values: vec![],
        };
    }

    // 1. Gabungkan nama variabel dengan baris datanya
    let mut rows: Vec<(String, Vec<f64>)> = var_names
        .iter()
        .zip(values.iter())
        .map(|(name, vals)| (name.clone(), vals.clone()))
        .collect();

    // 2. LOGIKA SORTED BY SIZE
    // Mengurutkan variabel berdasarkan komponen dominan, lalu berdasarkan nilai loading
    if config.sort_size {
        rows.sort_by(|a, b| {
            let (comp_a, max_a) = get_dominant_component(&a.1);
            let (comp_b, max_b) = get_dominant_component(&b.1);
            
            // Pertama, urutkan berdasarkan komponen (variabel dengan loading tinggi di komponen 1 lebih dulu)
            match comp_a.cmp(&comp_b) {
                std::cmp::Ordering::Equal => {
                    // Jika komponen sama, urutkan berdasarkan nilai loading (descending)
                    max_b.partial_cmp(&max_a).unwrap_or(std::cmp::Ordering::Equal)
                }
                other => other,
            }
        });
    }

    // 3. LOGIKA SUPPRESS SMALL COEFFICIENTS & PEMISAHAN KEMBALI
    let mut final_names = Vec::with_capacity(n_rows);
    let mut final_values = Vec::with_capacity(n_rows);

    for (name, data) in rows {
        final_names.push(name);

        let row_processed: Vec<Option<f64>> = data
            .into_iter()
            .map(|val| {
                if config.suppress_values {
                    // Cek apakah nilai absolute di bawah threshold
                    if val.abs() < config.suppress_values_num {
                        None // Akan menjadi null di JSON
                    } else {
                        Some(val)
                    }
                } else {
                    Some(val) // Tetap kirim angkanya
                }
            })
            .collect();

        final_values.push(row_processed);
    }

    FormattedMatrixData {
        sorted_var_names: final_names,
        formatted_values: final_values,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_config(sort_size: bool, suppress_values: bool, threshold: f64) -> OptionsConfig {
        OptionsConfig {
            exclude_list_wise: false,
            exclude_pair_wise: false,
            replace_mean: false,
            sort_size,
            suppress_values,
            suppress_values_num: threshold,
        }
    }

    #[test]
    fn test_sorted_by_size() {
        let var_names = vec!["VAR1".to_string(), "VAR2".to_string(), "VAR3".to_string()];
        let values = vec![
            vec![0.3, 0.8],  // VAR1: dominan di komponen 2
            vec![0.9, 0.1],  // VAR2: dominan di komponen 1
            vec![0.2, 0.7],  // VAR3: dominan di komponen 2
        ];
        
        let config = create_test_config(true, false, 0.1);
        let result = format_factor_matrix(&var_names, &values, &config);
        
        // VAR2 harus paling atas karena dominan di komponen 1 dengan nilai tinggi
        assert_eq!(result.sorted_var_names[0], "VAR2");
    }

    #[test]
    fn test_suppress_small_coefficients() {
        let var_names = vec!["VAR1".to_string()];
        let values = vec![vec![0.05, 0.8]];
        
        let config = create_test_config(false, true, 0.1);
        let result = format_factor_matrix(&var_names, &values, &config);
        
        // Nilai 0.05 harus di-suppress
        assert_eq!(result.formatted_values[0][0], None);
        // Nilai 0.8 harus tetap ada
        assert_eq!(result.formatted_values[0][1], Some(0.8));
    }
}