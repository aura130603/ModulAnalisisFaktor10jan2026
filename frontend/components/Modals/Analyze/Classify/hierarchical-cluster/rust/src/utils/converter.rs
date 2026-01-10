use wasm_bindgen::JsValue;
use serde::Serialize;

use crate::models::result::{
    CaseProcessingSummary,
    ClusteringResult,
    IciclePlot,
    DendrogramNode,
};

pub fn string_to_js_error(error: String) -> JsValue {
    JsValue::from_str(&error)
}

pub fn format_result(result: &Option<ClusteringResult>) -> Result<JsValue, JsValue> {
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
    case_processing_summary: CaseProcessingSummary,
    proximity_matrix: Option<FormattedProximityMatrix>,
    agglomeration_schedule: Option<FormattedAgglomerationSchedule>,
    dendrogram: Option<FormattedDendrogram>,
    icicle_plot: Option<IciclePlot>,
    executed_functions: Vec<String>,
    cluster_memberships: Vec<FormattedClusterMembership>,
}

#[derive(Serialize)]
struct FormattedProximityMatrix {
    distances: Vec<DistanceEntry>,
}

#[derive(Serialize)]
struct DistanceEntry {
    case1: String,
    case2: String,
    distance: f64,
}

#[derive(Serialize)]
struct FormattedAgglomerationSchedule {
    stages: Vec<FormattedAgglomerationStage>,
}

#[derive(Serialize)]
struct FormattedAgglomerationStage {
    stage: usize,
    cluster1: usize,
    cluster2: usize,
    coefficient: f64,
    first_appears1: usize,
    first_appears2: usize,
    next_stage: usize,
}

#[derive(Serialize)]
struct FormattedDendrogram {
    root: FormattedDendrogramNode,
    max_height: f64,
    num_items: usize,
    case_labels: Vec<String>,
    ordered_cases: Vec<usize>,
}

#[derive(Serialize)]
struct FormattedDendrogramNode {
    id: usize,
    height: f64,
    cases: Vec<usize>,
    left: Option<Box<FormattedDendrogramNode>>,
    right: Option<Box<FormattedDendrogramNode>>,
    is_leaf: bool,
    stage: Option<usize>,
    x_position: Option<f64>,
    label: Option<String>,
    case_number: Option<usize>,
}

#[derive(Serialize)]
struct FormattedClusterMembership {
    num_clusters: usize,
    case_assignments: Vec<CaseAssignment>,
}

#[derive(Serialize)]
struct CaseAssignment {
    case_index: usize,
    cluster: usize,
}

impl FormatResult {
    fn from_clustering_result(result: &ClusteringResult) -> Self {
        let proximity_matrix = result.proximity_matrix.as_ref().map(|matrix| {
            let mut distances = Vec::new();

            for ((case1, case2), distance) in &matrix.distances {
                distances.push(DistanceEntry {
                    case1: case1.clone(),
                    case2: case2.clone(),
                    distance: *distance,
                });
            }

            FormattedProximityMatrix {
                distances,
            }
        });

        let agglomeration_schedule = result.agglomeration_schedule.as_ref().map(|schedule| {
            let stages = schedule.stages
                .iter()
                .map(|stage| {
                    FormattedAgglomerationStage {
                        stage: stage.stage,
                        cluster1: stage.clusters_combined.0,
                        cluster2: stage.clusters_combined.1,
                        coefficient: stage.coefficients,
                        first_appears1: stage.cluster_first_appears.0,
                        first_appears2: stage.cluster_first_appears.1,
                        next_stage: stage.next_stage,
                    }
                })
                .collect();

            FormattedAgglomerationSchedule {
                stages,
            }
        });

        let dendrogram = result.dendrogram.as_ref().map(|dend| {
            // Convert the hierarchical dendrogram structure
            FormattedDendrogram {
                root: Self::format_dendrogram_node(&dend.root),
                max_height: dend.max_height,
                num_items: dend.num_items,
                case_labels: dend.case_labels.clone(),
                ordered_cases: dend.ordered_cases.clone(),
            }
        });

        let cluster_memberships = result.cluster_memberships
            .iter()
            .map(|membership| {
                let case_assignments = membership.case_assignments
                    .iter()
                    .enumerate()
                    .map(|(idx, &cluster)| {
                        CaseAssignment {
                            case_index: idx,
                            cluster,
                        }
                    })
                    .collect();

                FormattedClusterMembership {
                    num_clusters: membership.num_clusters,
                    case_assignments,
                }
            })
            .collect();

        FormatResult {
            case_processing_summary: result.case_processing_summary.clone(),
            proximity_matrix,
            agglomeration_schedule,
            dendrogram,
            icicle_plot: result.icicle_plot.clone(),
            executed_functions: result.executed_functions.clone(),
            cluster_memberships,
        }
    }

    // Helper function to recursively format dendrogram nodes
    fn format_dendrogram_node(node: &DendrogramNode) -> FormattedDendrogramNode {
        FormattedDendrogramNode {
            id: node.id,
            height: node.height,
            cases: node.cases.clone(),
            left: node.left
                .as_ref()
                .map(|left_node| Box::new(Self::format_dendrogram_node(left_node))),
            right: node.right
                .as_ref()
                .map(|right_node| Box::new(Self::format_dendrogram_node(right_node))),
            is_leaf: node.is_leaf,
            stage: node.stage,
            x_position: node.x_position,
            label: node.label.clone(),
            case_number: node.case_number,
        }
    }
}
