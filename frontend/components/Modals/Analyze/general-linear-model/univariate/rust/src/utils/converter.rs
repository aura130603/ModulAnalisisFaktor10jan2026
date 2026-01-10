use wasm_bindgen::JsValue;
use serde::Serialize;

use crate::models::result::{
    ContrastCoefficients,
    EMMeansResult,
    GeneralEstimableFunction,
    HeteroscedasticityTests,
    HypothesisLMatrices,
    LackOfFitTests,
    LeveneTest,
    ParameterEstimates,
    SavedVariables,
    SourceEntry,
    UnivariateResult,
    DescriptiveStatGroup,
};

pub fn string_to_js_error(error: String) -> JsValue {
    JsValue::from_str(&error)
}

pub fn format_result(result: &Option<UnivariateResult>) -> Result<JsValue, JsValue> {
    match result {
        Some(result) => {
            let formatted = FormatResult::from_univariate_result(result);
            Ok(serde_wasm_bindgen::to_value(&formatted).unwrap())
        }
        None => Err(JsValue::from_str("No univariate analysis results available")),
    }
}

#[derive(Serialize)]
struct FormatResult {
    between_subjects_factors: Option<Vec<FormattedBetweenSubjectFactor>>,
    descriptive_statistics: Option<Vec<FormattedDescriptiveStatistic>>,
    levene_test: Option<Vec<LeveneTest>>,
    heteroscedasticity_tests: Option<HeteroscedasticityTests>,
    tests_of_between_subjects_effects: Option<FormattedTestsBetweenSubjectsEffects>,
    parameter_estimates: Option<ParameterEstimates>,
    general_estimable_function: Option<GeneralEstimableFunction>,
    contrast_coefficients: Option<ContrastCoefficients>,
    hypothesis_l_matrices: Option<HypothesisLMatrices>,
    lack_of_fit_tests: Option<LackOfFitTests>,
    emmeans: Option<EMMeansResult>,
    saved_variables: Option<SavedVariables>,
}

#[derive(Serialize)]
struct FormattedBetweenSubjectFactor {
    name: String,
    factors: Vec<FactorEntry>,
    note: Option<String>,
    interpretation: Option<String>,
}

#[derive(Serialize)]
struct FactorEntry {
    name: String,
    value: usize,
}

#[derive(Serialize)]
struct FormattedDescriptiveStatistic {
    dependent_variable: String,
    groups: Vec<DescriptiveStatGroup>,
    factor_names: Vec<String>,
    note: Option<String>,
    interpretation: Option<String>,
}

#[derive(Serialize)]
struct FormattedTestsBetweenSubjectsEffects {
    sources: Vec<SourceEntry>,
    note: Option<String>,
    interpretation: Option<String>,
}

impl FormatResult {
    fn from_univariate_result(result: &UnivariateResult) -> Self {
        let between_subjects_factors = result.between_subjects_factors.as_ref().map(|factors| {
            factors
                .iter()
                .map(|(name, bsf)| {
                    FormattedBetweenSubjectFactor {
                        name: name.clone(),
                        factors: bsf.factors
                            .iter()
                            .map(|(factor_name, value)| {
                                FactorEntry {
                                    name: factor_name.clone(),
                                    value: *value,
                                }
                            })
                            .collect(),
                        note: bsf.note.clone(),
                        interpretation: bsf.interpretation.clone(),
                    }
                })
                .collect()
        });

        let descriptive_statistics = result.descriptive_statistics.as_ref().map(|stats| {
            stats
                .iter()
                .map(|(_, stat)| {
                    FormattedDescriptiveStatistic {
                        dependent_variable: stat.dependent_variable.clone(),
                        groups: stat.groups.clone(),
                        factor_names: stat.factor_names.clone(),
                        note: stat.note.clone(),
                        interpretation: stat.interpretation.clone(),
                    }
                })
                .collect()
        });

        let tests_of_between_subjects_effects = result.tests_of_between_subjects_effects
            .as_ref()
            .map(|tests| {
                FormattedTestsBetweenSubjectsEffects {
                    sources: tests.sources.clone(),
                    note: tests.note.clone(),
                    interpretation: tests.interpretation.clone(),
                }
            });

        FormatResult {
            between_subjects_factors,
            descriptive_statistics,
            levene_test: result.levene_test.clone(),
            heteroscedasticity_tests: result.heteroscedasticity_tests.clone(),
            tests_of_between_subjects_effects,
            parameter_estimates: result.parameter_estimates.clone(),
            general_estimable_function: result.general_estimable_function.clone(),
            contrast_coefficients: result.contrast_coefficients.clone(),
            hypothesis_l_matrices: result.hypothesis_l_matrices.clone(),
            lack_of_fit_tests: result.lack_of_fit_tests.clone(),
            emmeans: result.emmeans.clone(),
            saved_variables: result.saved_variables.clone(),
        }
    }
}
