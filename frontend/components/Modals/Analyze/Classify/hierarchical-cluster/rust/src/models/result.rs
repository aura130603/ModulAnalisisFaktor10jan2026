use serde::{ Deserialize, Serialize };
use std::collections::HashMap;

use super::config::ClusMethod;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ClusteringResult {
    pub case_processing_summary: CaseProcessingSummary,
    pub proximity_matrix: Option<ProximityMatrix>,
    pub agglomeration_schedule: Option<AgglomerationSchedule>,
    pub dendrogram: Option<Dendrogram>,
    pub icicle_plot: Option<IciclePlot>,
    pub executed_functions: Vec<String>,
    pub cluster_memberships: Vec<ClusterMembership>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CaseProcessingSummary {
    pub valid_cases: usize,
    pub valid_percent: f64,
    pub missing_cases: usize,
    pub missing_percent: f64,
    pub total_cases: usize,
    pub total_percent: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProximityMatrix {
    pub distances: HashMap<(String, String), f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AgglomerationStage {
    pub stage: usize,
    pub clusters_combined: (usize, usize),
    pub coefficients: f64,
    pub cluster_first_appears: (usize, usize),
    pub next_stage: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AgglomerationSchedule {
    pub stages: Vec<AgglomerationStage>,
}

// Completely redesigned dendrogram structure
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Dendrogram {
    // The root node of the dendrogram tree
    pub root: DendrogramNode,
    // The maximum height in the tree (for scaling)
    pub max_height: f64,
    // Number of cases/items
    pub num_items: usize,
    // Case labels in their original order
    pub case_labels: Vec<String>,
    // Case ordering as they appear in the dendrogram (left to right)
    pub ordered_cases: Vec<usize>,
}

// Redesigned node structure for the dendrogram
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DendrogramNode {
    // Unique identifier for the node
    pub id: usize,
    // The height (distance) at which this cluster forms
    pub height: f64,
    // The cases contained in this cluster (as indices)
    pub cases: Vec<usize>,
    // Left child node (if any)
    pub left: Option<Box<DendrogramNode>>,
    // Right child node (if any)
    pub right: Option<Box<DendrogramNode>>,
    // Whether this is a leaf node
    pub is_leaf: bool,
    // The stage at which this node was created
    pub stage: Option<usize>,
    // Horizontal position for visualization (normalized)
    pub x_position: Option<f64>,
    // Case label (if this is a leaf node)
    pub label: Option<String>,
    // Case number (if this is a leaf node)
    pub case_number: Option<usize>,
}

// Structure to track clusters during agglomeration
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ClusterState {
    pub clusters: Vec<Vec<usize>>, // List of clusters, each containing case indices
    pub distances: Vec<Vec<f64>>, // Distance matrix between clusters
    pub case_labels: Vec<String>, // Labels for each case
    pub variables: Vec<String>, // Variables used for clustering
    pub method: ClusMethod, // Clustering method
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct IciclePlot {
    // The orientation of the plot ("vertical" or "horizontal")
    pub orientation: String,
    // HashMap mapping case labels to their complete sequence of cluster counts
    pub case_clusters: HashMap<String, Vec<usize>>,
    // The starting cluster number for display
    pub start_cluster: i32,
    // The ending cluster number for display
    pub stop_cluster: i32,
    // The step size between cluster numbers
    pub step_by: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ClusterMembership {
    pub num_clusters: usize,
    pub case_assignments: Vec<usize>,
}
