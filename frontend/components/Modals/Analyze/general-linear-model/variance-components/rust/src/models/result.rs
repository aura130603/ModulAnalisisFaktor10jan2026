use serde::{ Deserialize, Serialize };
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VarianceComponentsResult {
    pub variance_estimates: Option<VarianceEstimates>,
    pub factor_level_information: Option<FactorLevelInformation>,
    pub anova_table: Option<AnovaTable>,
    pub expected_mean_squares: Option<ExpectedMeanSquares>,
    pub method_info: Option<MethodInfo>,
    pub design: Option<String>,
    pub executed_functions: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VarianceEstimates {
    pub components: Vec<VarianceComponent>,
    pub dependent_variable: String,
    pub method: String,
    pub sum_of_squares_type: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VarianceComponent {
    pub component: String,
    pub estimate: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FactorLevelInformation {
    pub factors: Vec<FactorInfo>,
    pub dependent_variable: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FactorInfo {
    pub factor_name: String,
    pub levels: Vec<FactorLevel>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FactorLevel {
    pub level: String,
    pub n: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AnovaTable {
    pub sources: Vec<AnovaSource>,
    pub sum_of_squares_type: String,
    pub dependent_variable: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AnovaSource {
    pub source: String,
    pub sum_of_squares: f64,
    pub df: usize,
    pub mean_square: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExpectedMeanSquares {
    pub sources: Vec<ExpectedMeanSquareSource>,
    pub dependent_variable: String,
    pub note: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExpectedMeanSquareSource {
    pub source: String,
    pub variance_components: HashMap<String, f64>,
    pub quadratic_term: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MethodInfo {
    pub method_name: String,
    pub method_type: String,
    pub convergence_info: Option<ConvergenceInfo>,
    pub random_effect_priors: Option<String>,
    pub sum_of_squares_type: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConvergenceInfo {
    pub iterations: Option<usize>,
    pub convergence_criterion: Option<f64>,
    pub convergence_achieved: Option<bool>,
    pub iteration_history: Option<Vec<IterationHistoryEntry>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct IterationHistoryEntry {
    pub iteration: usize,
    pub log_likelihood: Option<f64>,
    pub variance_components: HashMap<String, f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ComponentCovariation {
    pub matrix_type: String, // "Covariance" or "Correlation"
    pub matrix: HashMap<String, HashMap<String, f64>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SavedVariables {
    pub variable_names: Vec<String>,
    pub variable_labels: HashMap<String, String>,
    pub values: Vec<Vec<f64>>,
}
