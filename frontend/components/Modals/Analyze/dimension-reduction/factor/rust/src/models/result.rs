

// perbaikan BISA (9/1/2026)
use serde::{ Deserialize, Serialize };
use std::collections::HashMap;
use nalgebra::DMatrix;

#[derive(Debug, Serialize, Deserialize, Clone)]

// JSON untuk menampilkan output (untuk menyimpan output)
pub struct FactorAnalysisResult {
    #[serde(rename = "descriptive_statistics")]
    pub descriptive_statistics: Option<Vec<DescriptiveStatistic>>,
    #[serde(rename = "scree_plot")]
    pub scree_plot: Option<ScreePlot>,
    #[serde(rename = "correlation_matrix")]
    pub correlation_matrix: Option<CorrelationMatrix>,
    #[serde(rename = "inverse_correlation_matrix")]
    pub inverse_correlation_matrix: Option<InverseCorrelationMatrix>,
    #[serde(rename = "covariance_matrix")]
    pub covariance_matrix: Option<CovarianceMatrix>,
    #[serde(rename = "inverse_covariance_matrix")]
    pub inverse_covariance_matrix: Option<InverseCovarianceMatrix>,
    #[serde(rename = "kmo_bartletts_test")]
    pub kmo_bartletts_test: Option<KMOBartlettsTest>,
    #[serde(rename = "anti_image_matrices")]
    pub anti_image_matrices: Option<AntiImageMatrices>,
    #[serde(rename = "communalities")]
    pub communalities: Option<Communalities>,
    #[serde(rename = "total_variance_explained")]
    pub total_variance_explained: Option<TotalVarianceExplained>,
    #[serde(rename = "component_matrix")]
    pub component_matrix: Option<ComponentMatrix>,
    #[serde(rename = "reproduced_correlations")]
    pub reproduced_correlations: Option<ReproducedCorrelations>,
    #[serde(rename = "reproduced_covariances")]
    pub reproduced_covariances: Option<ReproducedCovariances>,
    #[serde(rename = "rotated_component_matrix")]
    pub rotated_component_matrix: Option<RotatedComponentMatrix>,
    #[serde(rename = "component_transformation_matrix")]
    pub component_transformation_matrix: Option<ComponentTransformationMatrix>,
    #[serde(rename = "component_score_coefficient_matrix")]
    pub component_score_coefficient_matrix: Option<ComponentScoreCoefficientMatrix>,
    #[serde(rename = "component_score_covariance_matrix")]
    pub component_score_covariance_matrix: Option<ComponentScoreCovarianceMatrix>,
    #[serde(rename = "pattern_matrix")]
    pub pattern_matrix: Option<PatternMatrix>,
    #[serde(rename = "structure_matrix")]
    pub structure_matrix: Option<StructureMatrix>,
    #[serde(rename = "component_correlation_matrix")]
    pub component_correlation_matrix: Option<ComponentCorrelationMatrix>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DescriptiveStatistic {
    pub variable: String,
    pub mean: f64,
    #[serde(rename = "std_deviation")]
    pub std_deviation: f64,
    #[serde(rename = "analysis_n")]
    pub analysis_n: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScreePlot {
    pub eigenvalues: Vec<f64>,
    #[serde(rename = "component_numbers")]
    pub component_numbers: Vec<usize>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CorrelationMatrix {
    pub correlations: HashMap<String, HashMap<String, f64>>,
    #[serde(rename = "sig_values")]
    pub sig_values: HashMap<String, HashMap<String, f64>>,
    #[serde(rename = "variable_order")]
    pub variable_order: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InverseCorrelationMatrix {
    pub inverse_correlations: HashMap<String, HashMap<String, f64>>,
    #[serde(rename = "variable_order")]
    pub variable_order: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CovarianceMatrix {
    pub covariances: HashMap<String, HashMap<String, f64>>,
    #[serde(rename = "variable_order")]
    pub variable_order: Vec<String>,
    pub determinant: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InverseCovarianceMatrix {
    pub inverse_covariances: HashMap<String, HashMap<String, f64>>,
    #[serde(rename = "variable_order")]
    pub variable_order: Vec<String>,
    pub determinant: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct KMOBartlettsTest {
    #[serde(rename = "kaiser_meyer_olkin")]
    pub kaiser_meyer_olkin: f64,
    #[serde(rename = "bartletts_test_chi_square")]
    pub bartletts_test_chi_square: f64,
    pub df: usize,
    pub significance: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AntiImageMatrices {
    #[serde(rename = "anti_image_covariance")]
    pub anti_image_covariance: HashMap<String, HashMap<String, f64>>,
    #[serde(rename = "anti_image_correlation")]
    pub anti_image_correlation: HashMap<String, HashMap<String, f64>>,
    #[serde(rename = "variable_order")]
    pub variable_order: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Communalities {
    // Varians Mentah (Variabel jika Kovariansi)
    pub raw_initial: HashMap<String, f64>,

    // Varians Tereskalasi (seharusnya selalu bernilai 1.0)
    pub rescaled_initial: HashMap<String, f64>,
    pub extraction: HashMap<String, f64>,
    #[serde(rename = "variable_order")]
    pub variable_order: Vec<String>,

    // Track which matrix type was used for extraction
    #[serde(rename = "extraction_matrix_type")]
    pub extraction_matrix_type: String, // "correlation" or "covariance"
}

// #[derive(Debug, Serialize, Deserialize, Clone)]
// pub struct TotalVarianceExplained {
//     #[serde(rename = "initial_eigenvalues")]
//     pub initial_eigenvalues: Vec<TotalVarianceComponent>,
//     #[serde(rename = "extraction_sums")]
//     pub extraction_sums: Vec<TotalVarianceComponent>,
//     #[serde(rename = "rotation_sums")]
//     pub rotation_sums: Vec<TotalVarianceComponent>,
//     // Track which matrix type was used for extraction
//     #[serde(rename = "extraction_matrix_type")]
//     pub extraction_matrix_type: String, // "correlation" or "covariance"
// }

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TotalVarianceBlock {
    pub label: String, // "Component" | "Raw" | "Rescaled"
    pub initial: Vec<TotalVarianceComponent>,
    pub extraction: Vec<TotalVarianceComponent>,
    pub rotation: Option<Vec<TotalVarianceComponent>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TotalVarianceExplained {
    pub blocks: Vec<TotalVarianceBlock>,

    #[serde(rename = "extraction_matrix_type")]
    pub extraction_matrix_type: String, // "correlation" | "covariance"
}


#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TotalVarianceComponent {
    pub total: f64,
    #[serde(rename = "percent_of_variance")]
    pub percent_of_variance: f64,
    #[serde(rename = "cumulative_percent")]
    pub cumulative_percent: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ComponentMatrix {
    pub components: HashMap<String, Vec<f64>>,
    #[serde(rename = "variable_order")]
    pub variable_order: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ReproducedCorrelations {
    pub reproduced_correlation: HashMap<String, HashMap<String, f64>>,
    pub residual: HashMap<String, HashMap<String, f64>>,
    #[serde(rename = "variable_order")]
    pub variable_order: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ReproducedCovariances {
    pub reproduced_covariance: HashMap<String, HashMap<String, f64>>,
    pub residual: HashMap<String, HashMap<String, f64>>,
    #[serde(rename = "variable_order")]
    pub variable_order: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RotatedComponentMatrix {
    pub components: HashMap<String, Vec<f64>>,
    #[serde(rename = "variable_order")]
    pub variable_order: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ComponentTransformationMatrix {
    pub components: Vec<Vec<f64>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ComponentScoreCoefficientMatrix {
    pub components: HashMap<String, Vec<f64>>,
    #[serde(rename = "variable_order")]
    pub variable_order: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ComponentScoreCovarianceMatrix {
    pub components: Vec<Vec<f64>>,
}

pub struct ExtractionResult {
    pub loadings: DMatrix<f64>,
    pub eigenvalues: Vec<f64>,
    pub communalities: Vec<f64>,
    pub explained_variance: Vec<f64>,
    pub cumulative_variance: Vec<f64>,
    pub n_factors: usize,
    pub var_names: Vec<String>,
}

pub struct RotationResult {
    pub rotated_loadings: DMatrix<f64>,
    pub transformation_matrix: DMatrix<f64>,
    pub factor_correlations: Option<DMatrix<f64>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PatternMatrix {
    pub components: HashMap<String, Vec<f64>>,
    #[serde(rename = "variable_order")]
    pub variable_order: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StructureMatrix {
    pub components: HashMap<String, Vec<f64>>,
    #[serde(rename = "variable_order")]
    pub variable_order: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ComponentCorrelationMatrix {
    pub correlations: Vec<Vec<f64>>,
}
