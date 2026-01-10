use serde::{ Deserialize, Serialize };
use std::collections::{ HashMap, BTreeMap };
use nalgebra::{ DMatrix, DVector };

use crate::models::config::ContrastMethod;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UnivariateResult {
    pub between_subjects_factors: Option<HashMap<String, BetweenSubjectFactors>>,
    pub descriptive_statistics: Option<HashMap<String, DescriptiveStatistics>>,
    pub levene_test: Option<Vec<LeveneTest>>,
    pub heteroscedasticity_tests: Option<HeteroscedasticityTests>,
    pub tests_of_between_subjects_effects: Option<TestsBetweenSubjectsEffects>,
    pub parameter_estimates: Option<ParameterEstimates>,
    pub general_estimable_function: Option<GeneralEstimableFunction>,
    pub hypothesis_l_matrices: Option<HypothesisLMatrices>,
    pub contrast_coefficients: Option<ContrastCoefficients>,
    pub lack_of_fit_tests: Option<LackOfFitTests>,
    pub emmeans: Option<EMMeansResult>,
    pub saved_variables: Option<SavedVariables>,
}

#[derive(Debug, Clone)]
pub struct DesignMatrixInfo {
    pub x: DMatrix<f64>,
    pub y: DVector<f64>,
    pub w: Option<DVector<f64>>,
    pub n_samples: usize,
    pub p_parameters: usize,
    pub r_x_rank: usize,
    pub term_column_indices: HashMap<String, (usize, usize)>,
    pub intercept_column: Option<usize>,
    pub term_names: Vec<String>,
    pub case_indices_to_keep: Vec<usize>,
    pub fixed_factor_indices: HashMap<String, Vec<usize>>,
    pub random_factor_indices: HashMap<String, Vec<usize>>,
    pub covariate_indices: HashMap<String, Vec<usize>>,
}

#[derive(Debug, Clone)]
pub struct SweptMatrixInfo {
    pub g_inv: DMatrix<f64>,
    pub beta_hat: DVector<f64>,
    pub s_rss: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BetweenSubjectFactors {
    pub factors: BTreeMap<String, usize>,
    pub note: Option<String>,
    pub interpretation: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DescriptiveStatistics {
    pub dependent_variable: String,
    pub groups: Vec<DescriptiveStatGroup>,
    pub factor_names: Vec<String>,
    pub note: Option<String>,
    pub interpretation: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DescriptiveStatGroup {
    pub factor_name: String,
    pub factor_value: String,
    pub stats: StatsEntry,
    pub subgroups: Vec<DescriptiveStatGroup>,
    pub is_total: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StatsEntry {
    pub mean: f64,
    pub std_deviation: f64,
    pub n: usize,
}

#[derive(Clone, Copy, Debug)]
pub enum LeveneCenter {
    Mean,
    Median,
    TrimmedMean(f64),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LeveneTest {
    pub dependent_variable: String,
    pub entries: Vec<LeveneTestEntry>,
    pub design: String,
    pub note: Option<String>,
    pub interpretation: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LeveneTestEntry {
    pub function: String,
    pub levene_statistic: f64,
    pub df1: usize,
    pub df2: f64,
    pub significance: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TestsBetweenSubjectsEffects {
    pub sources: Vec<SourceEntry>,
    pub note: Option<String>,
    pub interpretation: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SourceEntry {
    pub name: String,
    pub effect: TestEffectEntry,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TestEffectEntry {
    pub sum_of_squares: f64,
    pub df: usize,
    pub mean_square: f64,
    pub f_value: f64,
    pub significance: f64,
    pub partial_eta_squared: f64,
    pub noncent_parameter: f64,
    pub observed_power: f64,
}

impl TestEffectEntry {
    pub fn empty_effect(df: usize) -> Self {
        TestEffectEntry {
            sum_of_squares: 0.0,
            df,
            mean_square: 0.0,
            f_value: f64::NAN,
            significance: f64::NAN,
            partial_eta_squared: 0.0,
            noncent_parameter: 0.0,
            observed_power: 0.0,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EMMeansResult {
    pub parameter_names: Vec<String>,
    pub contrast_coefficients: Vec<ContrastCoefficientsEntry>,
    pub em_estimates: Vec<EMMeansEstimates>,
    pub pairwise_comparisons: Option<Vec<PairwiseComparisons>>,
    pub univariate_tests: Option<Vec<UnivariateTests>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EMMeansEstimates {
    pub entries: Vec<EMMeansEstimatesEntry>,
    pub note: Option<String>,
    pub interpretation: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EMMeansEstimatesEntry {
    pub levels: Vec<String>,
    pub mean: Vec<f64>,
    pub standard_error: Vec<f64>,
    pub confidence_interval: Vec<ConfidenceInterval>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PairwiseComparisons {
    pub entries: Vec<PairwiseComparisonsEntry>,
    pub note: Option<String>,
    pub interpretation: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PairwiseComparisonsEntry {
    pub parameter: Vec<String>,
    pub mean_difference: Vec<f64>,
    pub standard_error: Vec<f64>,
    pub significance: Vec<f64>,
    pub confidence_interval: Vec<ConfidenceInterval>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UnivariateTests {
    pub entries: Vec<UnivariateTestsEntry>,
    pub note: Option<String>,
    pub interpretation: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UnivariateTestsEntry {
    pub source: String,
    pub sum_of_squares: f64,
    pub df: usize,
    pub mean_square: f64,
    pub f_value: f64,
    pub significance: f64,
    pub partial_eta_squared: f64,
    pub noncent_parameter: f64,
    pub observed_power: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ParameterEstimates {
    pub estimates: Vec<ParameterEstimateEntry>,
    pub note: Option<String>,
    pub interpretation: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ParameterEstimateEntry {
    pub parameter: String,
    pub b: f64,
    pub std_error: f64,
    pub t_value: f64,
    pub significance: f64,
    pub confidence_interval: ConfidenceInterval,
    pub partial_eta_squared: f64,
    pub noncent_parameter: f64,
    pub observed_power: f64,
    pub is_redundant: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConfidenceInterval {
    pub lower_bound: f64,
    pub upper_bound: f64,
}

#[derive(Debug, Clone)]
pub struct FactorDetail {
    pub name: String,
    pub levels: Vec<String>,
    pub reference_level: String,
    pub pivot_level: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GeneralEstimableFunction {
    pub estimable_function: GeneralEstimableFunctionEntry,
    pub note: Option<String>,
    pub interpretation: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GeneralEstimableFunctionEntry {
    pub parameter: Vec<String>,
    pub l_label: Vec<String>,
    pub l_matrix: Vec<Vec<i32>>,
    pub contrast_information: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HypothesisLMatrices {
    pub matrices: Vec<TermMatrix>,
    pub note: Option<String>,
    pub interpretation: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TermMatrix {
    pub term: String,
    pub parameter_names: Vec<String>,
    pub contrast_names: Vec<String>,
    pub matrix: Vec<Vec<f64>>,
    pub note: Option<String>,
    pub interpretation: Option<String>,
}

#[derive(Debug)]
pub struct ParsedFactorSpec {
    pub factor_name: String,
    pub method: ContrastMethod,
    pub ref_setting: String,
    pub use_first_as_ref: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ContrastCoefficients {
    pub information: Vec<ContrastInformation>,
    pub factor_names: Vec<String>,
    pub contrast_coefficients: Vec<ContrastCoefficientsEntry>,
    pub contrast_result: Vec<ContrastResult>,
    pub contrast_test_result: Vec<ContrastTestResult>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ContrastInformation {
    pub contrast_name: String,
    pub transformation_coef: String,
    pub contrast_result: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ContrastCoefficientsEntry {
    pub parameter: Vec<String>,
    pub l_label: Vec<String>,
    pub l_matrix: Vec<Vec<f64>>,
    pub contrast_information: Vec<String>,
    pub note: Option<String>,
    pub interpretation: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ContrastResult {
    pub parameter: Vec<String>,
    pub contrast_result: Vec<ContrastResultEntry>,
    pub note: Option<String>,
    pub interpretation: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ContrastResultEntry {
    pub contrast_estimate: f64,
    pub hypothesized_value: f64,
    pub difference: f64,
    pub standard_error: f64,
    pub significance: f64,
    pub confidence_interval: ConfidenceInterval,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ContrastTestResult {
    pub source: Vec<String>,
    pub contrast_result: Vec<ContrastTestResultEntry>,
    pub note: Option<String>,
    pub interpretation: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ContrastTestResultEntry {
    pub source: String,
    pub sum_of_squares: f64,
    pub df: usize,
    pub mean_square: f64,
    pub f_value: f64,
    pub significance: f64,
    pub partial_eta_squared: f64,
    pub noncent_parameter: f64,
    pub observed_power: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LackOfFitTests {
    pub lack_of_fit: LackOfFitTestsEntries,
    pub pure_error: LackOfFitTestsEntries,
    pub note: Option<String>,
    pub interpretation: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LackOfFitTestsEntries {
    pub sum_of_squares: f64,
    pub df: usize,
    pub mean_square: f64,
    pub f_value: f64,
    pub significance: f64,
    pub partial_eta_squared: f64,
    pub noncent_parameter: f64,
    pub observed_power: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HeteroscedasticityTests {
    pub white: Option<WhiteTest>,
    pub breusch_pagan: Option<BPTest>,
    pub modified_breusch_pagan: Option<ModifiedBPTest>,
    pub f_test: Option<FTest>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OlsResult {
    pub r_squared: f64,
    pub ess: f64,
    pub df_regressors: usize,
    pub df_residuals: usize,
}
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WhiteTest {
    pub statistic: f64,
    pub df: usize,
    pub p_value: f64,
    pub note: Option<String>,
    pub interpretation: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BPTest {
    pub statistic: f64,
    pub df: usize,
    pub p_value: f64,
    pub note: Option<String>,
    pub interpretation: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModifiedBPTest {
    pub statistic: f64,
    pub df: usize,
    pub p_value: f64,
    pub note: Option<String>,
    pub interpretation: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FTest {
    pub statistic: f64,
    pub df1: usize,
    pub df2: usize,
    pub p_value: f64,
    pub note: Option<String>,
    pub interpretation: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct SavedVariables {
    pub predicted_values: Vec<f64>,
    pub weighted_predicted_values: Vec<f64>,
    pub residuals: Vec<f64>,
    pub weighted_residuals: Vec<f64>,
    pub deleted_residuals: Vec<f64>,
    pub standardized_residuals: Vec<f64>,
    pub studentized_residuals: Vec<f64>,
    pub standard_errors: Vec<f64>,
    pub cook_distances: Vec<f64>,
    pub leverages: Vec<f64>,
}
