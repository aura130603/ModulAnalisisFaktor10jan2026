use serde::{ Deserialize, Serialize };
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct KMeansResult {
    pub initial_centers: Option<InitialClusterCenters>,
    pub iteration_history: Option<IterationHistory>,
    pub cluster_membership: Option<ClusterMembership>,
    pub final_cluster_centers: Option<FinalClusterCenters>,
    pub distances_between_centers: Option<DistancesBetweenCenters>,
    pub anova: Option<ANOVATable>,
    pub cases_count: Option<CaseCountTable>,
    pub cluster_plot: Option<ClusterPlot>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ANOVATable {
    pub clusters: HashMap<String, ANOVACluster>,
    pub note: Option<String>,
    pub interpretation: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ANOVACluster {
    pub mean_square: f64,
    pub error_mean_square: f64,
    pub df: i32,
    pub error_df: i32,
    pub f: f64,
    pub significance: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CaseCountTable {
    pub valid: usize,
    pub missing: usize,
    pub clusters: HashMap<String, usize>,
    pub note: Option<String>,
    pub interpretation: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InitialClusterCenters {
    pub centers: HashMap<String, Vec<f64>>,
    pub note: Option<String>,
    pub interpretation: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct IterationHistory {
    pub iterations: Vec<IterationStep>,
    pub note: Option<String>,
    pub interpretation: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct IterationStep {
    pub iteration: i32,
    pub changes: Vec<(String, f64)>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ClusterMembership {
    pub data: Vec<ClusterMembershipData>,
    pub note: Option<String>,
    pub interpretation: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ClusterMembershipData {
    pub case_number: i32,
    pub case_name: Option<String>,
    pub cluster: i32,
    pub distance: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FinalClusterCenters {
    pub centers: HashMap<String, Vec<f64>>,
    pub note: Option<String>,
    pub interpretation: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DistancesBetweenCenters {
    pub distances: Vec<Vec<f64>>,
    pub note: Option<String>,
    pub interpretation: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProcessedData {
    pub variables: Vec<String>,
    pub data_matrix: Vec<Vec<f64>>,
    pub case_numbers: Vec<i32>,
    pub case_names: Option<Vec<String>>,
    pub total_cases: usize,
    pub missing_cases: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ClusterPlot {
    pub x: Vec<f64>,
    pub x_label: String,
    pub y: Vec<f64>,
    pub y_label: String,
    pub cluster: Vec<i32>,
    pub cluster_label: Vec<String>,
    pub cluster_center: Vec<bool>,
    pub note: Option<String>,
    pub interpretation: Option<String>,
}
