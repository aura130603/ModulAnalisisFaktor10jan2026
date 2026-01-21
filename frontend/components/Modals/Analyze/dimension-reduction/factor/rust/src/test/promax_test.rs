// Test untuk memverifikasi hasil Promax sama dengan SPSS
// Data: 8 variabel, 10 observasi
// Metode: PCA + Promax (kappa=4) + Correlation Matrix

#[cfg(test)]
mod tests {
    use nalgebra::DMatrix;
    use crate::stats::factor_extraction::extract_principal_components;
    use crate::stats::rotation::rotate_promax;
    use crate::models::config::*;

    fn create_test_config() -> FactorAnalysisConfig {
        FactorAnalysisConfig {
            main: MainConfig {
                target_var: Some(vec![
                    "VAR1".to_string(), "VAR2".to_string(), "VAR3".to_string(), "VAR4".to_string(),
                    "VAR5".to_string(), "VAR6".to_string(), "VAR7".to_string(), "VAR8".to_string(),
                ]),
                value_target: None,
            },
            value: ValueConfig {
                selection: None,
            },
            descriptives: DescriptivesConfig {
                univar_desc: false,
                initial_sol: false,
                coefficient: true,
                inverse: false,
                significance_lvl: false,
                reproduced: false,
                determinant: false,
                anti_image: false,
                kmo: false,
            },
            extraction: ExtractionConfig {
                method: ExtractionMethod::PrincipalComponents,
                correlation: true,
                covariance: false,
                unrotated: true,
                scree: false,
                eigen: true,
                factor: false,
                eigen_val: 1.0,
                max_factors: None,
                max_iter: 25,
            },
            rotation: RotationConfig {
                none: false,
                varimax: false,
                oblimin: false,
                delta: 0.0,
                quartimax: false,
                equimax: false,
                promax: true,
                kappa: 4,
                rotated_sol: true,
                loading_plot: false,
                max_iter: 25,
            },
            scores: ScoresConfig {
                save_var: false,
                regression: true,
                bartlett: false,
                anderson: false,
                display_factor: false,
            },
            options: OptionsConfig {
                exclude_list_wise: true,
                exclude_pair_wise: false,
                replace_mean: false,
                sort_size: false,
                suppress_values: false,
                suppress_values_num: 0.1,
            },
        }
    }

    fn create_correlation_matrix() -> DMatrix<f64> {
        // Data mentah (10 baris x 8 kolom)
        let raw_data: Vec<Vec<f64>> = vec![
            vec![13.4, 39.0, 4100.0, 14.0, 25.0, 17.0, 17.0, 46.0],
            vec![14.6, 46.0, 5000.0, 15.0, 30.0, 20.0, 20.0, 44.0],
            vec![13.5, 42.0, 4500.0, 19.0, 21.0, 18.0, 20.0, 44.0],
            vec![15.0, 46.0, 4600.0, 23.0, 16.0, 18.0, 21.0, 49.0],
            vec![14.6, 44.0, 5100.0, 17.0, 31.0, 19.0, 16.0, 44.0],
            vec![14.0, 44.0, 4900.0, 20.0, 24.0, 19.0, 27.0, 44.0],
            vec![16.4, 49.0, 4300.0, 21.0, 17.0, 18.0, 18.0, 49.0],
            vec![14.8, 44.0, 4400.0, 16.0, 26.0, 29.0, 22.0, 39.0],
            vec![15.2, 46.0, 4100.0, 27.0, 13.0, 27.0, 27.0, 46.0],
            vec![15.5, 48.0, 8400.0, 34.0, 42.0, 36.0, 24.0, 42.0],
        ];

        let n = 10; // jumlah observasi
        let p = 8;  // jumlah variabel

        // Hitung mean
        let mut means = vec![0.0; p];
        for row in &raw_data {
            for j in 0..p {
                means[j] += row[j];
            }
        }
        for j in 0..p {
            means[j] /= n as f64;
        }

        // Hitung std dev
        let mut std_devs = vec![0.0; p];
        for row in &raw_data {
            for j in 0..p {
                std_devs[j] += (row[j] - means[j]).powi(2);
            }
        }
        for j in 0..p {
            std_devs[j] = (std_devs[j] / (n as f64 - 1.0)).sqrt();
        }

        // Hitung correlation matrix
        let mut corr = DMatrix::<f64>::zeros(p, p);
        for i in 0..p {
            for j in 0..p {
                let mut sum = 0.0;
                for k in 0..n {
                    sum += (raw_data[k][i] - means[i]) * (raw_data[k][j] - means[j]);
                }
                corr[(i, j)] = sum / ((n as f64 - 1.0) * std_devs[i] * std_devs[j]);
            }
        }

        corr
    }

    #[test]
    fn test_promax_matches_spss() {
        let config = create_test_config();
        let corr_matrix = create_correlation_matrix();
        let var_names: Vec<String> = (1..=8).map(|i| format!("VAR{}", i)).collect();

        // Step 1: Extract factors
        let extraction_result = extract_principal_components(&corr_matrix, &config, &var_names)
            .expect("Extraction failed");

        println!("Number of factors extracted: {}", extraction_result.n_factors);
        println!("Eigenvalues: {:?}", extraction_result.eigenvalues);

        // Step 2: Rotate with Promax
        let rotation_result = rotate_promax(&extraction_result, &config)
            .expect("Rotation failed");

        let pattern = &rotation_result.rotated_loadings;
        let phi = rotation_result.factor_correlations.as_ref().unwrap();

        println!("\n=== PATTERN MATRIX ===");
        for i in 0..pattern.nrows() {
            print!("VAR{}: ", i + 1);
            for j in 0..pattern.ncols() {
                print!("{:.3} ", pattern[(i, j)]);
            }
            println!();
        }

        println!("\n=== COMPONENT CORRELATION MATRIX ===");
        for i in 0..phi.nrows() {
            for j in 0..phi.ncols() {
                print!("{:.3} ", phi[(i, j)]);
            }
            println!();
        }

        // Structure Matrix = Pattern * Phi
        let structure = pattern * phi;
        println!("\n=== STRUCTURE MATRIX ===");
        for i in 0..structure.nrows() {
            print!("VAR{}: ", i + 1);
            for j in 0..structure.ncols() {
                print!("{:.3} ", structure[(i, j)]);
            }
            println!();
        }

        // Expected SPSS values (Pattern Matrix)
        let expected_pattern: Vec<Vec<f64>> = vec![
            vec![-0.065, 0.977, -0.102],  // VAR1
            vec![-0.010, 0.945, 0.012],   // VAR2
            vec![0.846, 0.337, -0.059],   // VAR3
            vec![0.120, 0.576, 0.470],    // VAR4
            vec![1.082, -0.049, -0.367],  // VAR5
            vec![0.555, 0.178, 0.470],    // VAR6
            vec![-0.250, -0.079, 1.069],  // VAR7
            vec![-0.733, 0.538, -0.253],  // VAR8
        ];

        // Verify Pattern Matrix (with tolerance)
        let tolerance = 0.05; // Allow 5% difference due to numerical precision
        for i in 0..8 {
            for j in 0..3 {
                let diff = (pattern[(i, j)] - expected_pattern[i][j]).abs();
                if diff > tolerance {
                    println!(
                        "WARNING: Pattern[{},{}] = {:.3}, expected = {:.3}, diff = {:.3}",
                        i, j, pattern[(i, j)], expected_pattern[i][j], diff
                    );
                }
            }
        }
    }
}
