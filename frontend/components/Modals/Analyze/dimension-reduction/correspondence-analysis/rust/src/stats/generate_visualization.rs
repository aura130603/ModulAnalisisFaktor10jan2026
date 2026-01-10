use crate::models::{ config::CorrespondenceAnalysisConfig, data::AnalysisData };

use super::core::{ calculate_column_points, calculate_row_points };

// Define plot types and data structures for visualization
#[derive(Debug, Clone)]
pub enum PlotType {
    RowPoints,
    ColumnPoints,
    Biplot,
    RowTransformation,
    ColumnTransformation,
}

#[derive(Debug, Clone)]
pub struct PointData {
    pub label: String,
    pub x: f64,
    pub y: f64,
    pub mass: f64,
    pub is_supplementary: bool,
}

#[derive(Debug, Clone)]
pub struct PlotData {
    pub plot_type: PlotType,
    pub dimension1: usize,
    pub dimension2: usize,
    pub points: Vec<PointData>,
}

pub fn generate_scatter_plots(
    data: &AnalysisData,
    config: &CorrespondenceAnalysisConfig
) -> Result<Vec<PlotData>, String> {
    // Calculate the row and column points
    let row_points = calculate_row_points(data, config)?;
    let column_points = calculate_column_points(data, config)?;

    // Generate plot data for row and column points
    let mut plots = Vec::new();

    // Get dimension count (can be limited by config)
    let dimensions = if config.plots.restrict_dim {
        let lowest = config.plots.lowest.unwrap_or(1) as usize;
        let highest = config.plots.highest.unwrap_or(row_points.scores[0].len() as i32) as usize;
        highest.min(row_points.scores[0].len()).max(lowest)
    } else {
        row_points.scores[0].len()
    };

    // Generate row points plot if requested
    if config.plots.row_pts {
        // Generate plot for each dimension pair
        for dim1 in 0..dimensions - 1 {
            for dim2 in dim1 + 1..dimensions {
                let mut plot_data = PlotData {
                    plot_type: PlotType::RowPoints,
                    dimension1: dim1,
                    dimension2: dim2,
                    points: Vec::new(),
                };

                // Add points for rows
                for i in 0..row_points.scores.len() {
                    if row_points.mass[i] > 0.0 || config.plots.display_all {
                        plot_data.points.push(PointData {
                            label: format!("Row{}", i + 1),
                            x: row_points.scores[i][dim1],
                            y: row_points.scores[i][dim2],
                            mass: row_points.mass[i],
                            is_supplementary: row_points.mass[i] <= 0.0,
                        });
                    }
                }

                plots.push(plot_data);
            }
        }
    }

    // Generate column points plot if requested
    if config.plots.col_pts {
        // Generate plot for each dimension pair
        for dim1 in 0..dimensions - 1 {
            for dim2 in dim1 + 1..dimensions {
                let mut plot_data = PlotData {
                    plot_type: PlotType::ColumnPoints,
                    dimension1: dim1,
                    dimension2: dim2,
                    points: Vec::new(),
                };

                // Add points for columns
                for i in 0..column_points.scores.len() {
                    if column_points.mass[i] > 0.0 || config.plots.display_all {
                        plot_data.points.push(PointData {
                            label: format!("Col{}", i + 1),
                            x: column_points.scores[i][dim1],
                            y: column_points.scores[i][dim2],
                            mass: column_points.mass[i],
                            is_supplementary: column_points.mass[i] <= 0.0,
                        });
                    }
                }

                plots.push(plot_data);
            }
        }
    }

    // Generate biplot if requested
    if config.plots.biplot {
        // Generate biplot for each dimension pair
        for dim1 in 0..dimensions - 1 {
            for dim2 in dim1 + 1..dimensions {
                let mut plot_data = PlotData {
                    plot_type: PlotType::Biplot,
                    dimension1: dim1,
                    dimension2: dim2,
                    points: Vec::new(),
                };

                // Add points for rows
                for i in 0..row_points.scores.len() {
                    if row_points.mass[i] > 0.0 || config.plots.display_all {
                        plot_data.points.push(PointData {
                            label: format!("Row{}", i + 1),
                            x: row_points.scores[i][dim1],
                            y: row_points.scores[i][dim2],
                            mass: row_points.mass[i],
                            is_supplementary: row_points.mass[i] <= 0.0,
                        });
                    }
                }

                // Add points for columns
                for i in 0..column_points.scores.len() {
                    if column_points.mass[i] > 0.0 || config.plots.display_all {
                        plot_data.points.push(PointData {
                            label: format!("Col{}", i + 1),
                            x: column_points.scores[i][dim1],
                            y: column_points.scores[i][dim2],
                            mass: column_points.mass[i],
                            is_supplementary: column_points.mass[i] <= 0.0,
                        });
                    }
                }

                plots.push(plot_data);
            }
        }
    }

    Ok(plots)
}

// Generate line plots for transformations
pub fn generate_line_plots(
    data: &AnalysisData,
    config: &CorrespondenceAnalysisConfig
) -> Result<Vec<PlotData>, String> {
    // Calculate the row and column points
    let row_points = calculate_row_points(data, config)?;
    let column_points = calculate_column_points(data, config)?;

    // Generate line plot data for transformations
    let mut plots = Vec::new();

    // Get dimension count (can be limited by config)
    let dimensions = if config.plots.restrict_dim {
        let lowest = config.plots.lowest.unwrap_or(1) as usize;
        let highest = config.plots.highest.unwrap_or(row_points.scores[0].len() as i32) as usize;
        highest.min(row_points.scores[0].len()).max(lowest)
    } else {
        row_points.scores[0].len()
    };

    // Generate row transformation plots if requested
    if config.plots.trans_row {
        for dim in 0..dimensions {
            let mut plot_data = PlotData {
                plot_type: PlotType::RowTransformation,
                dimension1: dim,
                dimension2: 0, // Not applicable for transformation plots
                points: Vec::new(),
            };

            // Add points for row transformations
            for i in 0..row_points.scores.len() {
                if row_points.mass[i] > 0.0 || config.plots.display_all {
                    plot_data.points.push(PointData {
                        label: format!("Row{}", i + 1),
                        x: i as f64, // Category index as x
                        y: row_points.scores[i][dim], // Score as y
                        mass: row_points.mass[i],
                        is_supplementary: row_points.mass[i] <= 0.0,
                    });
                }
            }

            plots.push(plot_data);
        }
    }

    // Generate column transformation plots if requested
    if config.plots.trans_col {
        for dim in 0..dimensions {
            let mut plot_data = PlotData {
                plot_type: PlotType::ColumnTransformation,
                dimension1: dim,
                dimension2: 0, // Not applicable for transformation plots
                points: Vec::new(),
            };

            // Add points for column transformations
            for i in 0..column_points.scores.len() {
                if column_points.mass[i] > 0.0 || config.plots.display_all {
                    plot_data.points.push(PointData {
                        label: format!("Col{}", i + 1),
                        x: i as f64, // Category index as x
                        y: column_points.scores[i][dim], // Score as y
                        mass: column_points.mass[i],
                        is_supplementary: column_points.mass[i] <= 0.0,
                    });
                }
            }

            plots.push(plot_data);
        }
    }

    Ok(plots)
}
