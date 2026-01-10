use serde::{ Deserialize, Serialize };
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MCAResult {
    #[serde(rename = "processing_summary")]
    pub processing_summary: Option<ProcessingSummary>,
    #[serde(rename = "iteration_history")]
    pub iteration_history: Option<IterationHistory>,
    #[serde(rename = "model_summary")]
    pub model_summary: Option<ModelSummary>,
    #[serde(rename = "original_correlations")]
    pub original_correlations: Option<CorrelationsMatrix>,
    #[serde(rename = "transformed_correlations")]
    pub transformed_correlations: Option<CorrelationsMatrix>,
    #[serde(rename = "object_scores")]
    pub object_scores: Option<ObjectScores>,
    #[serde(rename = "object_contributions")]
    pub object_contributions: Option<ObjectContributions>,
    #[serde(rename = "discrimination_measures")]
    pub discrimination_measures: Option<DiscriminationMeasures>,
    #[serde(rename = "category_points")]
    pub category_points: Option<CategoryPoints>,
    #[serde(rename = "object_points_labeled")]
    pub object_points_labeled: Option<HashMap<String, ObjectPointsLabeled>>,
    #[serde(rename = "executed_functions")]
    pub executed_functions: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProcessingSummary {
    #[serde(rename = "valid_count")]
    pub valid_cases: usize,
    #[serde(rename = "excluded_count")]
    pub excluded_cases: usize,
    #[serde(rename = "total_count")]
    pub total_cases: usize,
    #[serde(rename = "valid_percent")]
    pub valid_percent: Option<f64>,
    #[serde(rename = "missing_group_codes")]
    pub missing_group_codes: Option<usize>,
    #[serde(rename = "missing_group_percent")]
    pub missing_group_percent: Option<f64>,
    #[serde(rename = "missing_disc_vars")]
    pub missing_disc_vars: Option<usize>,
    #[serde(rename = "missing_disc_percent")]
    pub missing_disc_percent: Option<f64>,
    #[serde(rename = "both_missing")]
    pub both_missing: Option<usize>,
    #[serde(rename = "both_missing_percent")]
    pub both_missing_percent: Option<f64>,
    #[serde(rename = "total_excluded_percent")]
    pub total_excluded_percent: Option<f64>,
    #[serde(rename = "active_cases_with_missing")]
    pub active_cases_with_missing: Option<usize>,
    #[serde(rename = "supplementary_cases")]
    pub supplementary_cases: Option<usize>,
    #[serde(rename = "cases_used_in_analysis")]
    pub cases_used_in_analysis: Option<usize>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct IterationHistory {
    #[serde(rename = "iteration_number")]
    pub iteration_number: Vec<i32>,
    #[serde(rename = "variance_accounted_total")]
    pub variance_accounted_total: Vec<f64>,
    #[serde(rename = "variance_accounted_increase")]
    pub variance_accounted_increase: Vec<f64>,
    pub loss: Vec<f64>,
    pub note: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModelSummary {
    pub dimension: Vec<String>,
    #[serde(rename = "cronbachs_alpha")]
    pub cronbachs_alpha: Vec<f64>,
    #[serde(rename = "variance_accounted_eigenvalue")]
    pub variance_accounted_eigenvalue: Vec<f64>,
    #[serde(rename = "variance_accounted_inertia")]
    pub variance_accounted_inertia: Vec<f64>,
    #[serde(rename = "variance_accounted_percentage")]
    pub variance_accounted_percentage: Vec<f64>,
    pub total: Option<TotalRow>,
    pub mean: Option<MeanRow>,
    pub note: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TotalRow {
    pub cronbachs_alpha: Option<f64>,
    pub eigenvalue: f64,
    pub inertia: f64,
    pub percentage: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MeanRow {
    pub cronbachs_alpha: f64,
    pub eigenvalue: f64,
    pub inertia: f64,
    pub percentage: f64,
    pub note: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CorrelationsMatrix {
    pub variables: Vec<String>,
    pub dimensions: Vec<String>,
    pub eigenvalues: Vec<f64>,
    pub correlations: HashMap<String, HashMap<String, f64>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ObjectScores {
    #[serde(rename = "case_numbers")]
    pub case_numbers: Vec<i32>,
    pub dimensions: Vec<String>,
    pub scores: HashMap<String, Vec<f64>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ObjectContributions {
    #[serde(rename = "case_numbers")]
    pub case_numbers: Vec<i32>,
    pub mass: Vec<f64>,
    pub inertia: Vec<f64>,
    #[serde(rename = "point_to_inertia_dim1")]
    pub point_to_inertia: HashMap<String, Vec<f64>>,
    #[serde(rename = "dim1_to_inertia_point")]
    pub dim_to_inertia_point: HashMap<String, Vec<f64>>,
    #[serde(rename = "total_to_inertia_point")]
    pub total_to_inertia_point: Vec<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DiscriminationMeasures {
    pub variables: Vec<String>,
    pub dimensions: Vec<String>,
    pub mean: Option<Vec<f64>>,
    pub measures: HashMap<String, Vec<f64>>,
    #[serde(rename = "active_total")]
    pub active_total: Vec<f64>,
    #[serde(rename = "percentage_of_variance")]
    pub percentage_of_variance: Vec<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CategoryPoints {
    pub variables: Vec<String>,
    pub categories: HashMap<String, Vec<String>>,
    #[serde(rename = "dimension_coordinates")]
    pub dimension_coordinates: HashMap<String, HashMap<String, Vec<f64>>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ObjectPointsLabeled {
    pub dimension_labels: Vec<String>,
    #[serde(rename = "case_numbers")]
    pub case_numbers: Vec<i32>,
    #[serde(rename = "category_labels")]
    pub category_labels: Vec<String>,
    #[serde(rename = "dimension_coordinates")]
    pub dimension_coordinates: HashMap<String, Vec<f64>>,
}
