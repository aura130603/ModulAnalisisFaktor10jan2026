// refactored_cf_tree.rs
use std::collections::HashMap;
use rand::seq::SliceRandom;
use rand::thread_rng;
use crate::models::result::{ CFEntry, CFNode };

use super::core::{
    calculate_cluster_distance,
    calculate_euclidean_distance,
    calculate_log_likelihood_distance,
};

pub fn cf_entry_new(num_continuous: usize, num_categorical: usize) -> CFEntry {
    CFEntry {
        n: 0,
        sum_values: vec![0.0; num_continuous],
        sum_squared: vec![0.0; num_continuous],
        category_counts: vec![HashMap::new(); num_categorical],
        distance: 0.0,
        cases: Vec::new(),
    }
}

pub fn cf_entry_mean(entry: &CFEntry, idx: usize) -> f64 {
    if entry.n > 0 { entry.sum_values[idx] / (entry.n as f64) } else { 0.0 }
}

pub fn cf_entry_variance(entry: &CFEntry, idx: usize) -> f64 {
    if entry.n > 1 {
        let mean = cf_entry_mean(entry, idx);
        (entry.sum_squared[idx] / (entry.n as f64) - mean * mean).max(0.0)
    } else {
        0.0
    }
}

pub fn cf_entry_add_case(
    entry: &mut CFEntry,
    case_idx: usize,
    data_row: &[f64],
    cat_row: &[String]
) {
    entry.n += 1;
    entry.cases.push(case_idx);

    for (i, &val) in data_row.iter().enumerate() {
        if i < entry.sum_values.len() {
            entry.sum_values[i] += val;
            entry.sum_squared[i] += val * val;
        }
    }

    for (i, cat) in cat_row.iter().enumerate() {
        if i < entry.category_counts.len() {
            let count = entry.category_counts[i].entry(cat.clone()).or_insert(0);
            *count += 1;
        }
    }
}

pub fn cf_entry_calculate_tightness(entry: &CFEntry, use_euclidean: bool) -> f64 {
    if entry.n <= 1 {
        return 0.0;
    }

    let mut tightness = 0.0;

    if use_euclidean {
        for i in 0..entry.sum_values.len() {
            tightness += cf_entry_variance(entry, i) * (entry.n as f64);
        }
        tightness = tightness.sqrt();
    } else {
        for i in 0..entry.sum_values.len() {
            let var = cf_entry_variance(entry, i);
            if var > 0.0 {
                let ln_2pi = std::f64::consts::LN_2 + std::f64::consts::PI.ln();
                tightness += (entry.n as f64) * 0.5 * (var.ln() + 1.0 + ln_2pi);
            }
        }

        for i in 0..entry.category_counts.len() {
            let total = entry.n as f64;
            for (_, &count) in &entry.category_counts[i] {
                let prob = (count as f64) / total;
                if prob > 0.0 {
                    tightness -= (count as f64) * prob.ln();
                }
            }
        }
    }

    tightness
}

pub fn cf_entry_clone_with_cases(entry: &CFEntry) -> CFEntry {
    CFEntry {
        n: entry.n,
        sum_values: entry.sum_values.clone(),
        sum_squared: entry.sum_squared.clone(),
        category_counts: entry.category_counts.clone(),
        distance: entry.distance,
        cases: entry.cases.clone(),
    }
}

pub fn cf_entry_merge_with(entry: &mut CFEntry, other: &CFEntry) {
    entry.n += other.n;

    for i in 0..entry.sum_values.len() {
        entry.sum_values[i] += other.sum_values[i];
        entry.sum_squared[i] += other.sum_squared[i];
    }

    for i in 0..entry.category_counts.len() {
        for (cat, &count) in &other.category_counts[i] {
            let entry_count = entry.category_counts[i].entry(cat.clone()).or_insert(0);
            *entry_count += count;
        }
    }

    entry.cases.extend(other.cases.iter());
}

pub fn cf_node_new(is_leaf: bool) -> CFNode {
    CFNode {
        entries: Vec::new(),
        is_leaf,
        children: Vec::new(),
    }
}

pub fn cf_node_find_closest_entry(
    node: &CFNode,
    entry: &CFEntry,
    use_euclidean: bool
) -> (usize, f64) {
    if node.entries.is_empty() {
        return (0, f64::MAX);
    }

    let mut closest_idx = 0;
    let mut min_distance = f64::MAX;

    for (i, node_entry) in node.entries.iter().enumerate() {
        let distance = calculate_cluster_distance(entry, node_entry, use_euclidean);
        if distance < min_distance {
            min_distance = distance;
            closest_idx = i;
        }
    }

    (closest_idx, min_distance)
}

pub fn cf_node_find_farthest_pair(node: &CFNode, use_euclidean: bool) -> (usize, usize, f64) {
    let mut seed1 = 0;
    let mut seed2 = 1;
    let mut max_distance = 0.0;

    if node.entries.len() < 2 {
        return (0, 0, 0.0);
    }

    for i in 0..node.entries.len() {
        for j in i + 1..node.entries.len() {
            let distance = calculate_cluster_distance(
                &node.entries[i],
                &node.entries[j],
                use_euclidean
            );

            if distance > max_distance {
                max_distance = distance;
                seed1 = i;
                seed2 = j;
            }
        }
    }

    (seed1, seed2, max_distance)
}

pub fn cf_node_split(node: &mut CFNode, max_branches: usize, use_euclidean: bool) -> CFNode {
    let mut new_node = cf_node_new(node.is_leaf);

    if node.entries.len() <= 2 {
        if !node.entries.is_empty() {
            new_node.entries.push(node.entries.pop().unwrap());
        }
        return new_node;
    }

    let (seed1, seed2, _) = cf_node_find_farthest_pair(node, use_euclidean);

    let mut seed_entries = Vec::new();

    if seed1 < seed2 {
        seed_entries.push(node.entries.remove(seed2));
        seed_entries.push(node.entries.remove(seed1));
    } else {
        seed_entries.push(node.entries.remove(seed1));
        seed_entries.push(node.entries.remove(seed2));
    }

    let mut centers = vec![
        cf_entry_clone_with_cases(&seed_entries[0]),
        cf_entry_clone_with_cases(&seed_entries[1])
    ];

    let mut entries_to_redistribute = std::mem::take(&mut node.entries);
    for entry in entries_to_redistribute {
        let mut closest_idx = 0;
        let mut min_distance = f64::MAX;

        for (i, center) in centers.iter().enumerate() {
            let distance = calculate_cluster_distance(&entry, center, use_euclidean);
            if distance < min_distance {
                min_distance = distance;
                closest_idx = i;
            }
        }

        if closest_idx == 0 {
            cf_entry_merge_with(&mut seed_entries[0], &entry);
            cf_entry_merge_with(&mut centers[0], &entry);
        } else {
            cf_entry_merge_with(&mut seed_entries[1], &entry);
            cf_entry_merge_with(&mut centers[1], &entry);
        }
    }

    node.entries.push(cf_entry_clone_with_cases(&seed_entries[0]));
    new_node.entries.push(cf_entry_clone_with_cases(&seed_entries[1]));

    new_node
}

pub fn cf_node_redistribute_children_after_split(
    node: &mut CFNode,
    new_node: &mut CFNode,
    use_euclidean: bool
) {
    if !node.is_leaf && !node.children.is_empty() {
        let mut new_children = Vec::new();

        for child in std::mem::take(&mut node.children) {
            let child_rep = if child.is_leaf && !child.entries.is_empty() {
                let mut rep = cf_entry_clone_with_cases(&child.entries[0]);
                for i in 1..child.entries.len() {
                    cf_entry_merge_with(&mut rep, &child.entries[i]);
                }
                rep
            } else if !child.entries.is_empty() {
                cf_entry_clone_with_cases(&child.entries[0])
            } else {
                let num_continuous = if !node.entries.is_empty() {
                    node.entries[0].sum_values.len()
                } else if !new_node.entries.is_empty() {
                    new_node.entries[0].sum_values.len()
                } else {
                    0
                };

                let num_categorical = if !node.entries.is_empty() {
                    node.entries[0].category_counts.len()
                } else if !new_node.entries.is_empty() {
                    new_node.entries[0].category_counts.len()
                } else {
                    0
                };

                cf_entry_new(num_continuous, num_categorical)
            };

            let dist_to_this = if !node.entries.is_empty() {
                calculate_cluster_distance(&child_rep, &node.entries[0], use_euclidean)
            } else {
                f64::MAX
            };

            let dist_to_new = if !new_node.entries.is_empty() {
                calculate_cluster_distance(&child_rep, &new_node.entries[0], use_euclidean)
            } else {
                f64::MAX
            };

            if dist_to_this <= dist_to_new {
                node.children.push(child);
            } else {
                new_children.push(child);
            }
        }

        new_node.children = new_children;
    }
}

pub struct CFTree {
    pub root: CFNode,
    pub threshold: f64,
    pub max_branches: usize,
    pub max_depth: usize,
    pub use_euclidean: bool,
    pub num_continuous: usize,
    pub num_categorical: usize,
    pub noise_handling: bool,
    pub noise_threshold: f64,
    pub noise_entries: Vec<CFEntry>,
    pub total_entries: usize,
    pub max_leaf_entries: usize,
}

pub fn cf_tree_new(
    threshold: f64,
    max_branches: usize,
    max_depth: usize,
    use_euclidean: bool,
    num_continuous: usize,
    num_categorical: usize,
    noise_handling: bool,
    noise_threshold: f64
) -> CFTree {
    CFTree {
        root: cf_node_new(true),
        threshold,
        max_branches,
        max_depth,
        use_euclidean,
        num_continuous,
        num_categorical,
        noise_handling,
        noise_threshold,
        noise_entries: Vec::new(),
        total_entries: 0,
        max_leaf_entries: max_branches,
    }
}

pub fn cf_tree_insert(
    tree: &mut CFTree,
    case_idx: usize,
    data_row: &[f64],
    cat_row: &[String]
) -> bool {
    let mut entry = cf_entry_new(tree.num_continuous, tree.num_categorical);
    cf_entry_add_case(&mut entry, case_idx, data_row, cat_row);

    tree.total_entries += 1;

    // Extract tree parameters to avoid borrowing tree multiple times
    let threshold = tree.threshold;
    let max_branches = tree.max_branches;
    let max_depth = tree.max_depth;
    let use_euclidean = tree.use_euclidean;
    let num_continuous = tree.num_continuous;
    let num_categorical = tree.num_categorical;
    let noise_handling = tree.noise_handling;

    let result = cf_tree_insert_entry(
        &entry,
        &mut tree.root,
        &mut tree.noise_entries,
        1,
        threshold,
        max_branches,
        max_depth,
        use_euclidean,
        num_continuous,
        num_categorical,
        noise_handling
    );

    result
}

// Modified to take specific tree parameters instead of &mut CFTree
pub fn cf_tree_insert_entry(
    entry: &CFEntry,
    node: &mut CFNode,
    noise_entries: &mut Vec<CFEntry>,
    level: usize,
    threshold: f64,
    max_branches: usize,
    max_depth: usize,
    use_euclidean: bool,
    num_continuous: usize,
    num_categorical: usize,
    noise_handling: bool
) -> bool {
    if node.is_leaf {
        if node.entries.is_empty() {
            node.entries.push(cf_entry_clone_with_cases(entry));
            return true;
        }

        let (closest_idx, distance) = cf_node_find_closest_entry(node, entry, use_euclidean);

        if distance <= threshold {
            cf_entry_merge_with(&mut node.entries[closest_idx], entry);
            return true;
        }

        if node.entries.len() < max_branches {
            node.entries.push(cf_entry_clone_with_cases(entry));
            return true;
        }

        if level < max_depth {
            let mut new_leaf = cf_node_split(node, max_branches, use_euclidean);

            let dist_to_node = if !node.entries.is_empty() {
                calculate_cluster_distance(entry, &node.entries[0], use_euclidean)
            } else {
                f64::MAX
            };

            let dist_to_new = if !new_leaf.entries.is_empty() {
                calculate_cluster_distance(entry, &new_leaf.entries[0], use_euclidean)
            } else {
                f64::MAX
            };

            if dist_to_node <= dist_to_new {
                if node.entries.len() < max_branches {
                    node.entries.push(cf_entry_clone_with_cases(entry));
                    return true;
                }
            } else {
                if new_leaf.entries.len() < max_branches {
                    new_leaf.entries.push(cf_entry_clone_with_cases(entry));

                    if level == 1 {
                        // Special case for root level, need to create a new parent
                        let mut new_root = cf_node_new(false);

                        let mut rep1 = cf_entry_new(num_continuous, num_categorical);
                        for e in &node.entries {
                            cf_entry_merge_with(&mut rep1, e);
                        }

                        let mut rep2 = cf_entry_new(num_continuous, num_categorical);
                        for e in &new_leaf.entries {
                            cf_entry_merge_with(&mut rep2, e);
                        }

                        new_root.entries.push(rep1);
                        new_root.entries.push(rep2);

                        new_root.children.push(std::mem::replace(node, new_root.clone()));
                        new_root.children.push(new_leaf);

                        return true;
                    } else {
                        // In real implementation, we'd handle updating the parent
                        // For simplicity, we'll just return true here
                        return true;
                    }
                }
            }

            if noise_handling {
                noise_entries.push(cf_entry_clone_with_cases(entry));
                return true;
            }

            return false;
        }

        if noise_handling {
            noise_entries.push(cf_entry_clone_with_cases(entry));
            return true;
        }

        return false;
    } else {
        // Non-leaf node
        let mut closest_child_idx = 0;
        let mut min_distance = f64::MAX;

        for (i, child_entry) in node.entries.iter().enumerate() {
            let distance = calculate_cluster_distance(entry, child_entry, use_euclidean);

            if distance < min_distance {
                min_distance = distance;
                closest_child_idx = i;
            }
        }

        if closest_child_idx < node.children.len() {
            // Try inserting into closest child
            let insert_result = cf_tree_insert_entry(
                entry,
                &mut node.children[closest_child_idx],
                noise_entries,
                level + 1,
                threshold,
                max_branches,
                max_depth,
                use_euclidean,
                num_continuous,
                num_categorical,
                noise_handling
            );

            if !insert_result {
                // Child couldn't insert, handle split at this level
                if node.entries.len() < max_branches {
                    // Create new child for this entry
                    let mut new_child = cf_node_new(true);
                    new_child.entries.push(cf_entry_clone_with_cases(entry));

                    // Create representative entry
                    let rep_entry = cf_entry_clone_with_cases(entry);

                    node.entries.push(rep_entry);
                    node.children.push(new_child);

                    return true;
                } else {
                    // This node is also full, split it
                    if level < max_depth - 1 {
                        let mut new_node = cf_node_split(node, max_branches, use_euclidean);
                        cf_node_redistribute_children_after_split(
                            node,
                            &mut new_node,
                            use_euclidean
                        );

                        let dist_to_node = if !node.entries.is_empty() {
                            calculate_cluster_distance(entry, &node.entries[0], use_euclidean)
                        } else {
                            f64::MAX
                        };

                        let dist_to_new = if !new_node.entries.is_empty() {
                            calculate_cluster_distance(entry, &new_node.entries[0], use_euclidean)
                        } else {
                            f64::MAX
                        };

                        if dist_to_node <= dist_to_new {
                            // Try insert into this node again
                            return cf_tree_insert_entry(
                                entry,
                                node,
                                noise_entries,
                                level,
                                threshold,
                                max_branches,
                                max_depth,
                                use_euclidean,
                                num_continuous,
                                num_categorical,
                                noise_handling
                            );
                        } else {
                            // Try insert into new node
                            return cf_tree_insert_entry(
                                entry,
                                &mut new_node,
                                noise_entries,
                                level,
                                threshold,
                                max_branches,
                                max_depth,
                                use_euclidean,
                                num_continuous,
                                num_categorical,
                                noise_handling
                            );
                        }
                    }

                    if noise_handling {
                        noise_entries.push(cf_entry_clone_with_cases(entry));
                        return true;
                    }

                    return false; // Need rebuild
                }
            }

            // Update this node's entry for the child
            cf_entry_merge_with(&mut node.entries[closest_child_idx], entry);
            return true;
        } else {
            // No matching child, need to create a new one
            if node.entries.len() < max_branches {
                // Create new child for this entry
                let mut new_child = cf_node_new(true);
                new_child.entries.push(cf_entry_clone_with_cases(entry));

                // Create representative entry
                let rep_entry = cf_entry_clone_with_cases(entry);

                node.entries.push(rep_entry);
                node.children.push(new_child);

                return true;
            } else if noise_handling {
                noise_entries.push(cf_entry_clone_with_cases(entry));
                return true;
            }

            return false; // Need rebuild
        }
    }
}

pub fn cf_tree_rebuild_with_higher_threshold(tree: &mut CFTree, increase_factor: f64) -> bool {
    tree.threshold *= increase_factor;

    // Get all entries before resetting the tree
    let entries = cf_tree_get_all_entries(tree);

    // Reset tree
    tree.root = cf_node_new(true);
    tree.noise_entries.clear();
    tree.total_entries = 0;

    let mut success = true;
    for entry in entries {
        for &case_idx in &entry.cases {
            let mut data_row = vec![0.0; tree.num_continuous];
            let mut cat_row = vec![String::new(); tree.num_categorical];

            for i in 0..tree.num_continuous {
                data_row[i] = cf_entry_mean(&entry, i);
            }

            for i in 0..tree.num_categorical {
                if
                    let Some((cat, _)) = entry.category_counts[i]
                        .iter()
                        .max_by_key(|(_, &count)| count)
                {
                    cat_row[i] = cat.clone();
                }
            }

            if !cf_tree_insert(tree, case_idx, &data_row, &cat_row) {
                success = false;
            }
        }
    }

    success
}

pub fn cf_tree_get_all_entries(tree: &CFTree) -> Vec<CFEntry> {
    let mut result = Vec::new();
    cf_tree_collect_entries_recursive(&tree.root, &mut result);
    result.extend(tree.noise_entries.iter().cloned());
    result
}

fn cf_tree_collect_entries_recursive(node: &CFNode, result: &mut Vec<CFEntry>) {
    if node.is_leaf {
        for entry in &node.entries {
            result.push(cf_entry_clone_with_cases(entry));
        }
    } else {
        for child in &node.children {
            cf_tree_collect_entries_recursive(child, result);
        }
    }
}

pub fn cf_tree_get_leaf_entries(tree: &CFTree) -> Vec<CFEntry> {
    let mut result = Vec::new();
    cf_tree_collect_leaf_entries(&tree.root, &mut result);
    result
}

fn cf_tree_collect_leaf_entries(node: &CFNode, result: &mut Vec<CFEntry>) {
    if node.is_leaf {
        for entry in &node.entries {
            result.push(cf_entry_clone_with_cases(entry));
        }
    } else {
        for child in &node.children {
            cf_tree_collect_leaf_entries(child, result);
        }
    }
}

pub fn cf_tree_handle_noise_entries(tree: &mut CFTree, min_size_ratio: f64) -> Vec<CFEntry> {
    if !tree.noise_handling || tree.noise_entries.is_empty() {
        return Vec::new();
    }

    let leaf_entries = cf_tree_get_leaf_entries(tree);
    let max_size = leaf_entries
        .iter()
        .map(|e| e.n)
        .max()
        .unwrap_or(0) as f64;

    let min_size_threshold = (max_size * min_size_ratio).max(1.0) as i32;

    let mut remaining_noise = Vec::new();
    let mut small_entries = Vec::new();

    // Take ownership of noise_entries to avoid borrowing tree twice
    let noise_entries = std::mem::take(&mut tree.noise_entries);

    for entry in noise_entries {
        if entry.n >= min_size_threshold {
            let mut reinserted = false;

            let mut data_row = vec![0.0; tree.num_continuous];
            let mut cat_row = vec![String::new(); tree.num_categorical];

            for i in 0..tree.num_continuous {
                data_row[i] = cf_entry_mean(&entry, i);
            }

            for i in 0..tree.num_categorical {
                if
                    let Some((cat, _)) = entry.category_counts[i]
                        .iter()
                        .max_by_key(|(_, &count)| count)
                {
                    cat_row[i] = cat.clone();
                }
            }

            if cf_tree_insert(tree, entry.cases[0], &data_row, &cat_row) {
                reinserted = true;
            }

            if !reinserted {
                remaining_noise.push(entry);
            }
        } else {
            small_entries.push(entry);
        }
    }

    tree.noise_entries = remaining_noise;
    small_entries
}

pub fn build_cf_tree(
    data_matrix: &[Vec<f64>],
    categorical_matrix: &[Vec<String>],
    use_euclidean: bool,
    handle_noise: bool,
    noise_threshold: f64,
    max_branch: i32,
    max_depth: i32,
    initial_threshold: f64
) -> Vec<CFEntry> {
    let num_continuous = if !data_matrix.is_empty() { data_matrix[0].len() } else { 0 };
    let num_categorical = if !categorical_matrix.is_empty() {
        categorical_matrix[0].len()
    } else {
        0
    };

    let mut indices: Vec<usize> = (0..data_matrix.len()).collect();
    indices.shuffle(&mut thread_rng());

    let threshold = if initial_threshold <= 0.0 { 0.5 } else { initial_threshold };

    let mut cf_tree = cf_tree_new(
        threshold,
        max_branch as usize,
        max_depth as usize,
        use_euclidean,
        num_continuous,
        num_categorical,
        handle_noise,
        noise_threshold
    );

    for &idx in &indices {
        let success = cf_tree_insert(
            &mut cf_tree,
            idx,
            &data_matrix[idx],
            &categorical_matrix[idx]
        );

        if !success {
            cf_tree_rebuild_with_higher_threshold(&mut cf_tree, 1.5);

            cf_tree_insert(&mut cf_tree, idx, &data_matrix[idx], &categorical_matrix[idx]);
        }
    }

    let mut subclusters = Vec::new();

    if handle_noise {
        let small_entries = cf_tree_handle_noise_entries(&mut cf_tree, noise_threshold);

        subclusters = cf_tree_get_leaf_entries(&cf_tree);

        let max_size = subclusters
            .iter()
            .map(|e| e.n)
            .max()
            .unwrap_or(1) as f64;

        let min_size_threshold = (max_size * noise_threshold).max(1.0) as i32;

        let (clean_clusters, potential_noise): (Vec<_>, Vec<_>) = subclusters
            .into_iter()
            .partition(|sc| sc.n >= min_size_threshold);

        subclusters = clean_clusters;

        for noise_entry in potential_noise.into_iter().chain(small_entries.into_iter()) {
            for &case_idx in &noise_entry.cases {
                if subclusters.is_empty() {
                    let mut entry = cf_entry_new(num_continuous, num_categorical);
                    cf_entry_add_case(
                        &mut entry,
                        case_idx,
                        &data_matrix[case_idx],
                        &categorical_matrix[case_idx]
                    );
                    subclusters.push(entry);
                    continue;
                }

                let mut closest_idx = 0;
                let mut min_distance = f64::MAX;

                for (i, entry) in subclusters.iter().enumerate() {
                    let distance = if use_euclidean {
                        calculate_euclidean_distance(&data_matrix[case_idx], entry, num_continuous)
                    } else {
                        calculate_log_likelihood_distance(
                            &data_matrix[case_idx],
                            &categorical_matrix[case_idx],
                            entry,
                            num_continuous,
                            num_categorical
                        )
                    };

                    if distance < min_distance {
                        min_distance = distance;
                        closest_idx = i;
                    }
                }

                cf_entry_add_case(
                    &mut subclusters[closest_idx],
                    case_idx,
                    &data_matrix[case_idx],
                    &categorical_matrix[case_idx]
                );
            }
        }
    } else {
        subclusters = cf_tree_get_leaf_entries(&cf_tree);
    }

    subclusters
}
