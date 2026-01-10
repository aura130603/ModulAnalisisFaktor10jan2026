use wasm_bindgen::JsValue;
use serde::Serialize;

use crate::models::result::{
    ClusterMembership,
    KMeansResult,
    DistancesBetweenCenters,
    ClusterPlot,
};

pub fn string_to_js_error(error: String) -> JsValue {
    JsValue::from_str(&error)
}

pub fn format_result(result: &Option<KMeansResult>) -> Result<JsValue, JsValue> {
    match result {
        Some(result) => {
            let formatted = FormatResult::from_clustering_result(result);
            Ok(serde_wasm_bindgen::to_value(&formatted).unwrap())
        }
        None => Err(JsValue::from_str("No clustering results available")),
    }
}

#[derive(Serialize)]
struct FormatResult {
    initial_centers: Option<FormattedInitialClusterCenters>,
    iteration_history: Option<FormattedIterationHistory>,
    cluster_membership: Option<ClusterMembership>,
    final_cluster_centers: Option<FormattedFinalClusterCenters>,
    distances_between_centers: Option<DistancesBetweenCenters>,
    anova: Option<FormattedANOVATable>,
    cases_count: Option<FormattedCaseCountTable>,
    cluster_plot: Option<ClusterPlot>,
}

#[derive(Serialize)]
struct FormattedInitialClusterCenters {
    centers: Vec<ClusterCenter>,
    note: Option<String>,
    interpretation: Option<String>,
}

#[derive(Serialize)]
struct ClusterCenter {
    variable: String,
    values: Vec<f64>,
}

#[derive(Serialize)]
struct FormattedIterationHistory {
    iterations: Vec<FormattedIterationStep>,
    note: Option<String>,
    interpretation: Option<String>,
}

#[derive(Serialize)]
struct FormattedIterationStep {
    iteration: i32,
    changes: Vec<ClusterChange>,
}

#[derive(Serialize)]
struct ClusterChange {
    cluster: String,
    change: f64,
}

#[derive(Serialize)]
struct FormattedFinalClusterCenters {
    centers: Vec<ClusterCenter>,
    note: Option<String>,
    interpretation: Option<String>,
}

#[derive(Serialize)]
struct FormattedANOVATable {
    clusters: Vec<ANOVAEntry>,
    note: Option<String>,
    interpretation: Option<String>,
}

#[derive(Serialize)]
struct ANOVAEntry {
    variable: String,
    mean_square: f64,
    error_mean_square: f64,
    df: i32,
    error_df: i32,
    f: f64,
    significance: f64,
}

#[derive(Serialize)]
struct FormattedCaseCountTable {
    valid: usize,
    missing: usize,
    clusters: Vec<ClusterCount>,
    note: Option<String>,
    interpretation: Option<String>,
}

#[derive(Serialize)]
struct ClusterCount {
    cluster: String,
    count: usize,
}

impl FormatResult {
    fn from_clustering_result(result: &KMeansResult) -> Self {
        let initial_centers = result.initial_centers.as_ref().map(|centers| {
            let centers_vec = centers.centers
                .iter()
                .map(|(var_name, values)| {
                    ClusterCenter {
                        variable: var_name.clone(),
                        values: values.clone(),
                    }
                })
                .collect();

            FormattedInitialClusterCenters {
                centers: centers_vec,
                note: centers.note.clone(),
                interpretation: centers.interpretation.clone(),
            }
        });

        let iteration_history = result.iteration_history.as_ref().map(|history| {
            let iterations = history.iterations
                .iter()
                .map(|step| {
                    let changes = step.changes
                        .iter()
                        .map(|(cluster, change)| {
                            ClusterChange {
                                cluster: cluster.clone(),
                                change: *change,
                            }
                        })
                        .collect();

                    FormattedIterationStep {
                        iteration: step.iteration,
                        changes,
                    }
                })
                .collect();

            FormattedIterationHistory {
                iterations,
                note: history.note.clone(),
                interpretation: history.interpretation.clone(),
            }
        });

        let final_cluster_centers = result.final_cluster_centers.as_ref().map(|centers| {
            let centers_vec = centers.centers
                .iter()
                .map(|(var_name, values)| {
                    ClusterCenter {
                        variable: var_name.clone(),
                        values: values.clone(),
                    }
                })
                .collect();

            FormattedFinalClusterCenters {
                centers: centers_vec,
                note: centers.note.clone(),
                interpretation: centers.interpretation.clone(),
            }
        });

        let anova = result.anova.as_ref().map(|anova| {
            let clusters = anova.clusters
                .iter()
                .map(|(var_name, cluster)| {
                    ANOVAEntry {
                        variable: var_name.clone(),
                        mean_square: cluster.mean_square,
                        error_mean_square: cluster.error_mean_square,
                        df: cluster.df,
                        error_df: cluster.error_df,
                        f: cluster.f,
                        significance: cluster.significance,
                    }
                })
                .collect();

            FormattedANOVATable {
                clusters,
                note: anova.note.clone(),
                interpretation: anova.interpretation.clone(),
            }
        });

        let cases_count = result.cases_count.as_ref().map(|count| {
            let mut clusters: Vec<_> = count.clusters
                .iter()
                .map(|(cluster_name, count_val)| {
                    ClusterCount {
                        cluster: cluster_name.clone(),
                        count: *count_val,
                    }
                })
                .collect();

            clusters.sort_by_key(|c| c.cluster.parse::<i32>().unwrap_or_default());

            FormattedCaseCountTable {
                valid: count.valid,
                missing: count.missing,
                clusters,
                note: count.note.clone(),
                interpretation: count.interpretation.clone(),
            }
        });

        FormatResult {
            initial_centers,
            iteration_history,
            cluster_membership: result.cluster_membership.clone(),
            final_cluster_centers,
            distances_between_centers: result.distances_between_centers.clone(),
            anova,
            cases_count,
            cluster_plot: result.cluster_plot.clone(),
        }
    }
}
