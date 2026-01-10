use std::collections::HashMap;
use crate::models::{
    config::ClusterConfig,
    data::AnalysisData,
    result::{ AgglomerationSchedule, Dendrogram, DendrogramNode },
};

use super::core::{ extract_case_label, generate_agglomeration_schedule_wrapper };

// Build the dendrogram tree from the agglomeration schedule
pub fn generate_dendrogram(
    data: &AnalysisData,
    config: &ClusterConfig
) -> Result<Dendrogram, String> {
    // Get agglomeration schedule
    let agglomeration = generate_agglomeration_schedule_wrapper(data, config)?;

    // Get all case labels
    let case_labels = if config.main.cluster_cases {
        let case_count = data.cluster_data
            .get(0)
            .map(|d| d.len())
            .unwrap_or(0);

        (0..case_count).map(|idx| extract_case_label(data, config, idx)).collect()
    } else {
        // For variable clustering, use variable names as labels
        config.main.variables
            .as_ref()
            .map(|vars| vars.clone())
            .unwrap_or_else(|| vec![])
    };

    let num_items = case_labels.len();

    // Create initial leaf nodes for each case
    let mut nodes: HashMap<usize, DendrogramNode> = (1..=num_items)
        .map(|i| (
            i,
            DendrogramNode {
                id: i,
                height: 0.0,
                cases: vec![i - 1], // Store 0-based case indices
                left: None,
                right: None,
                is_leaf: true,
                stage: None,
                x_position: None,
                label: Some(case_labels[i - 1].clone()),
                case_number: Some(i), // 1-based case number
            },
        ))
        .collect();

    // Maps to track the actual clusters across stages
    let mut cluster_to_node_id: HashMap<usize, usize> = (1..=num_items).map(|i| (i, i)).collect();

    // Next node ID
    let mut next_id = num_items + 1;

    // Maximum height in the tree
    let mut max_height = 0.0;

    // Process each agglomeration stage
    for (stage_idx, stage) in agglomeration.stages.iter().enumerate() {
        let (cluster1_id, cluster2_id) = stage.clusters_combined;
        let stage_num = stage_idx + 1;

        // Find the actual node IDs for these clusters
        let node1_id = *cluster_to_node_id.get(&cluster1_id).unwrap_or(&cluster1_id);
        let node2_id = *cluster_to_node_id.get(&cluster2_id).unwrap_or(&cluster2_id);

        // Get the nodes being merged
        if let (Some(node1), Some(node2)) = (nodes.remove(&node1_id), nodes.remove(&node2_id)) {
            // Update max height if needed
            if stage.coefficients > max_height {
                max_height = stage.coefficients;
            }

            // Combine cases from both nodes
            let mut merged_cases = node1.cases.clone();
            merged_cases.extend(node2.cases.clone());
            merged_cases.sort(); // Sort for consistency

            // Create new node for the merged cluster
            // Always put the node with more cases (or the first one if equal) on the left
            // This helps with consistent visualization
            let (left_node, right_node) = if node1.cases.len() >= node2.cases.len() {
                (node1, node2)
            } else {
                (node2, node1)
            };

            let merged_node = DendrogramNode {
                id: next_id,
                height: stage.coefficients,
                cases: merged_cases,
                left: Some(Box::new(left_node)),
                right: Some(Box::new(right_node)),
                is_leaf: false,
                stage: Some(stage_num),
                x_position: None,
                label: None,
                case_number: None,
            };

            // Add new node to map
            nodes.insert(next_id, merged_node);

            // Update cluster to node mapping - the new merged cluster is represented by cluster1_id
            cluster_to_node_id.insert(cluster1_id, next_id);

            next_id += 1;
        }
    }

    // Get the root node (last remaining node)
    let mut root = if nodes.len() == 1 {
        nodes.into_values().next().unwrap()
    } else {
        // This shouldn't happen with a valid agglomeration schedule
        return Err("Invalid agglomeration schedule: failed to build dendrogram".to_string());
    };

    // Get the leaf order using in-order traversal
    let ordered_cases = get_dendrogram_leaf_order(&root);

    // Create a position map for leaves
    let mut position_map = HashMap::new();
    for (pos, &case_idx) in ordered_cases.iter().enumerate() {
        position_map.insert(case_idx, pos as f64);
    }

    // Assign x positions to all nodes
    assign_x_positions(&mut root, &position_map);

    Ok(Dendrogram {
        root,
        max_height,
        num_items,
        case_labels,
        ordered_cases,
    })
}

// Improved in-order traversal to get leaf order
fn get_dendrogram_leaf_order(node: &DendrogramNode) -> Vec<usize> {
    if node.is_leaf {
        // Leaf node - return its case index
        if let Some(&case_idx) = node.cases.first() {
            return vec![case_idx];
        } else {
            return vec![];
        }
    }

    let mut ordered_cases = Vec::new();

    // Add leaves from left subtree
    if let Some(left) = &node.left {
        ordered_cases.extend(get_dendrogram_leaf_order(left));
    }

    // Add leaves from right subtree
    if let Some(right) = &node.right {
        ordered_cases.extend(get_dendrogram_leaf_order(right));
    }

    ordered_cases
}

// Assign x positions to nodes for visualization
fn assign_x_positions(node: &mut DendrogramNode, position_map: &HashMap<usize, f64>) {
    if node.is_leaf {
        // Leaf node gets its position directly from the map
        if let Some(&case_idx) = node.cases.first() {
            if let Some(&pos) = position_map.get(&case_idx) {
                node.x_position = Some(pos);
            }
        }
        return;
    }

    // Process children first
    if let Some(mut left_child) = node.left.take() {
        assign_x_positions(&mut left_child, position_map);
        node.left = Some(left_child);
    }

    if let Some(mut right_child) = node.right.take() {
        assign_x_positions(&mut right_child, position_map);
        node.right = Some(right_child);
    }

    // Internal node's position is the average of its children
    let left_pos = node.left
        .as_ref()
        .and_then(|n| n.x_position)
        .unwrap_or(0.0);
    let right_pos = node.right
        .as_ref()
        .and_then(|n| n.x_position)
        .unwrap_or(0.0);

    node.x_position = Some((left_pos + right_pos) / 2.0);
}

// Extract dendrogram data for visualization
pub fn extract_dendrogram_visualization_data(
    dendrogram: &Dendrogram
) -> Vec<(String, usize, f64, f64, f64)> {
    let mut visualization_data = Vec::new();
    extract_node_visualization_data(
        &dendrogram.root,
        0.0,
        dendrogram.max_height,
        &mut visualization_data
    );
    visualization_data
}

// Helper function to extract node data for visualization
fn extract_node_visualization_data(
    node: &DendrogramNode,
    parent_height: f64,
    max_height: f64,
    data: &mut Vec<(String, usize, f64, f64, f64)>
) {
    // Normalize height
    let normalized_height = if max_height > 0.0 { node.height / max_height } else { 0.0 };

    if let Some(x_pos) = node.x_position {
        if node.is_leaf {
            // For leaf nodes, add a data point with label and case number
            if let (Some(label), Some(case_num)) = (&node.label, &node.case_number) {
                data.push((
                    label.clone(),
                    *case_num,
                    x_pos,
                    normalized_height,
                    normalized_height, // For leaf nodes, start and end height are the same
                ));
            }
        } else {
            // For internal nodes, add connection data
            let left_x = node.left
                .as_ref()
                .and_then(|n| n.x_position)
                .unwrap_or(x_pos);
            let right_x = node.right
                .as_ref()
                .and_then(|n| n.x_position)
                .unwrap_or(x_pos);

            // Add data for horizontal line
            data.push((
                String::new(), // No label for internal node
                0, // No case number
                left_x,
                normalized_height,
                right_x, // Connect left and right x positions
            ));

            // Add data for vertical lines to children (if needed)
            let left_height = node.left
                .as_ref()
                .map(|n| n.height / max_height)
                .unwrap_or(0.0);
            if left_height < normalized_height {
                data.push((String::new(), 0, left_x, left_height, normalized_height));
            }

            let right_height = node.right
                .as_ref()
                .map(|n| n.height / max_height)
                .unwrap_or(0.0);
            if right_height < normalized_height {
                data.push((String::new(), 0, right_x, right_height, normalized_height));
            }
        }
    }

    // Recursively process children
    if let Some(left) = &node.left {
        extract_node_visualization_data(left, normalized_height, max_height, data);
    }

    if let Some(right) = &node.right {
        extract_node_visualization_data(right, normalized_height, max_height, data);
    }
}
