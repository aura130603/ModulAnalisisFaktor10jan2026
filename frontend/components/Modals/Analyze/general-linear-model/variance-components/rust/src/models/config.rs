use serde::{ Deserialize, Serialize };

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VarianceCompsConfig {
    pub main: MainConfig,
    pub model: ModelConfig,
    pub options: OptionsConfig,
    pub save: SaveConfig,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MainConfig {
    #[serde(rename = "DepVar")]
    pub dep_var: Option<String>,
    #[serde(rename = "FixFactor")]
    pub fix_factor: Option<Vec<String>>,
    #[serde(rename = "RandFactor")]
    pub rand_factor: Option<Vec<String>>,
    #[serde(rename = "Covar")]
    pub covar: Option<Vec<String>>,
    #[serde(rename = "WlsWeight")]
    pub wls_weight: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum BuildTermMethod {
    #[serde(rename = "interaction")]
    Interaction,
    #[serde(rename = "mainEffects")]
    MainEffects,
    #[serde(rename = "all2Way")]
    All2Way,
    #[serde(rename = "all3Way")]
    All3Way,
    #[serde(rename = "all4Way")]
    All4Way,
    #[serde(rename = "all5Way")]
    All5Way,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModelConfig {
    #[serde(rename = "NonCust")]
    pub non_cust: bool,
    #[serde(rename = "Custom")]
    pub custom: bool,
    #[serde(rename = "FactorsVar")]
    pub factors_var: Option<Vec<String>>,
    #[serde(rename = "TermsVar")]
    pub terms_var: Option<String>,
    #[serde(rename = "FactorsModel")]
    pub factors_model: Option<Vec<String>>,
    #[serde(rename = "BuildTermMethod")]
    pub build_term_method: Option<BuildTermMethod>,
    #[serde(rename = "Intercept")]
    pub intercept: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OptionsConfig {
    #[serde(rename = "Minque")]
    pub minque: bool,
    #[serde(rename = "Anova")]
    pub anova: bool,
    #[serde(rename = "MaxLikelihood")]
    pub max_likelihood: bool,
    #[serde(rename = "ResMaxLikelihood")]
    pub res_max_likelihood: bool,
    #[serde(rename = "Uniform")]
    pub uniform: bool,
    #[serde(rename = "Zero")]
    pub zero: bool,
    #[serde(rename = "TypeI")]
    pub type_i: bool,
    #[serde(rename = "TypeIII")]
    pub type_iii: bool,
    #[serde(rename = "ConvergenceMethod")]
    pub convergence_method: Option<String>,
    #[serde(rename = "MaxIter")]
    pub max_iter: Option<i32>,
    #[serde(rename = "SumOfSquares")]
    pub sum_of_squares: bool,
    #[serde(rename = "ExpectedMeanSquares")]
    pub expected_mean_squares: bool,
    #[serde(rename = "IterationHistory")]
    pub iteration_history: bool,
    #[serde(rename = "InStepsOf")]
    pub in_steps_of: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SaveConfig {
    #[serde(rename = "VarCompEst")]
    pub var_comp_est: bool,
    #[serde(rename = "CompCovar")]
    pub comp_covar: bool,
    #[serde(rename = "CovMatrix")]
    pub cov_matrix: bool,
    #[serde(rename = "CorMatrix")]
    pub cor_matrix: bool,
    #[serde(rename = "CreateNewDataset")]
    pub create_new_dataset: bool,
    #[serde(rename = "DatasetName")]
    pub dataset_name: Option<String>,
    #[serde(rename = "WriteNewDataFile")]
    pub write_new_data_file: bool,
    #[serde(rename = "FilePath")]
    pub file_path: Option<String>,
}
