use std::{ collections::HashMap, f32::consts::E };

use crate::models::{
    config::MultivariateConfig,
    data::AnalysisData,
    result::{ ConfidenceInterval, LegendItem, PlotData, PlotPoint, PlotSeries },
};

use super::core::{
    calculate_mean,
    calculate_std_deviation,
    calculate_t_critical,
    data_value_to_string,
    extract_dependent_value,
    get_factor_levels,
    get_level_values,
};

/// Generate plots
pub fn generate_plots(
    data: &AnalysisData,
    config: &MultivariateConfig
) -> Result<HashMap<String, PlotData>, String> {
    let mut result = HashMap::new();

    // Get dependent variables
    let dependent_vars = data.dependent_data_defs
        .iter()
        .flat_map(|defs| defs.iter().map(|def| def.name.clone()))
        .collect::<Vec<String>>();

    // Check if plots are requested
    if config.plots.line_chart_type || config.plots.bar_chart_type {
        for dep_var in &dependent_vars {
            if let Some(factors) = &config.plots.src_list {
                if factors.len() >= 1 {
                    // Create a profile plot for factor1 * factor2 (if available)
                    let x_factor = &factors[0];
                    let line_factor = if factors.len() >= 2 { Some(&factors[1]) } else { None };

                    // Get levels for x-axis factor
                    if let Ok(x_levels) = get_factor_levels(data, x_factor) {
                        let mut plot_data = PlotData {
                            title: format!("Estimated Marginal Means of {}", dep_var),
                            x_label: x_factor.clone(),
                            y_label: dep_var.clone(),
                            series: Vec::new(),
                            y_axis_starts_at_zero: config.plots.y_axis_start_0,
                            includes_reference_line: config.plots.include_ref_line_for_grand_mean,
                            reference_line: None,
                            dependent_variable: Some(dep_var.clone()),
                            plot_type: if config.plots.line_chart_type {
                                Some("Line".to_string())
                            } else {
                                Some("Bar".to_string())
                            },
                            groups_label: line_factor.map(|f| f.clone()),
                            model: Some(
                                format!(
                                    "Intercept + {}",
                                    config.main.fix_factor
                                        .as_ref()
                                        .map_or("".to_string(), |f| f.join(" + "))
                                )
                            ),
                            error_bars: if config.plots.include_error_bars {
                                if config.plots.confidence_interval {
                                    Some("95% CI".to_string())
                                } else if config.plots.standard_error {
                                    Some("Standard Error".to_string())
                                } else {
                                    None
                                }
                            } else {
                                None
                            },
                            legend: None,
                        };

                        // If we have a line factor, create separate lines for each level
                        if let Some(line_factor_name) = line_factor {
                            if let Ok(line_levels) = get_factor_levels(data, line_factor_name) {
                                let mut legend_items = Vec::new();

                                for (i, line_level) in line_levels.iter().enumerate() {
                                    // Create a series for this line level
                                    let mut points = Vec::new();
                                    let mut error_bars = if config.plots.include_error_bars {
                                        Some(Vec::new())
                                    } else {
                                        None
                                    };

                                    for (j, x_level) in x_levels.iter().enumerate() {
                                        // Get mean for this combination of factor levels
                                        let mut values = Vec::new();

                                        for records in &data.dependent_data {
                                            for record in records {
                                                let x_factor_value = record.values
                                                    .get(x_factor)
                                                    .map(|v| data_value_to_string(v))
                                                    .unwrap_or_default();

                                                let line_factor_value = record.values
                                                    .get(line_factor_name)
                                                    .map(|v| data_value_to_string(v))
                                                    .unwrap_or_default();

                                                if
                                                    x_factor_value == *x_level &&
                                                    line_factor_value == *line_level
                                                {
                                                    if
                                                        let Some(value) = extract_dependent_value(
                                                            record,
                                                            dep_var
                                                        )
                                                    {
                                                        values.push(value);
                                                    }
                                                }
                                            }
                                        }

                                        if !values.is_empty() {
                                            let mean = calculate_mean(&values);
                                            let std_dev = calculate_std_deviation(
                                                &values,
                                                Some(mean)
                                            );
                                            let n = values.len();

                                            points.push(PlotPoint {
                                                x: j as f64,
                                                y: mean,
                                                label: x_level.clone(),
                                            });

                                            // Calculate error bars if needed
                                            if let Some(error_bars_vec) = &mut error_bars {
                                                let std_error = std_dev / (n as f64).sqrt();

                                                if config.plots.confidence_interval {
                                                    // 95% CI
                                                    let t_critical = calculate_t_critical(
                                                        n - 1,
                                                        0.025
                                                    );
                                                    let margin = t_critical * std_error;

                                                    error_bars_vec.push(ConfidenceInterval {
                                                        lower_bound: mean - margin,
                                                        upper_bound: mean + margin,
                                                    });
                                                } else if config.plots.standard_error {
                                                    // Standard error
                                                    let multiplier =
                                                        config.plots.multiplier.unwrap_or(1) as f64;

                                                    error_bars_vec.push(ConfidenceInterval {
                                                        lower_bound: mean - multiplier * std_error,
                                                        upper_bound: mean + multiplier * std_error,
                                                    });
                                                }
                                            }
                                        }
                                    }

                                    // Add the series
                                    if !points.is_empty() {
                                        // Generate a color based on the index
                                        let colors = [
                                            "blue",
                                            "red",
                                            "green",
                                            "orange",
                                            "purple",
                                            "brown",
                                        ];
                                        let color = colors[i % colors.len()].to_string();

                                        // Generate a line style
                                        let line_styles = ["solid", "dashed", "dotted", "dashdot"];
                                        let line_style =
                                            line_styles[i % line_styles.len()].to_string();

                                        plot_data.series.push(PlotSeries {
                                            name: line_level.clone(),
                                            points,
                                            error_bars,
                                            series_type: if config.plots.line_chart_type {
                                                "line".to_string()
                                            } else {
                                                "bar".to_string()
                                            },
                                            color: Some(color.clone()),
                                            line_style: Some(line_style.clone()),
                                            marker_style: Some("circle".to_string()),
                                            is_reference_line: Some(false),
                                        });

                                        legend_items.push(LegendItem {
                                            label: line_level.clone(),
                                            color: Some(color),
                                            line_style: Some(line_style),
                                            marker_style: Some("circle".to_string()),
                                        });
                                    }
                                }

                                // Add reference line for grand mean if requested
                                if config.plots.include_ref_line_for_grand_mean {
                                    let mut all_values = Vec::new();

                                    for records in &data.dependent_data {
                                        for record in records {
                                            if
                                                let Some(value) = extract_dependent_value(
                                                    record,
                                                    dep_var
                                                )
                                            {
                                                all_values.push(value);
                                            }
                                        }
                                    }

                                    if !all_values.is_empty() {
                                        let grand_mean = calculate_mean(&all_values);

                                        // Add grand mean reference line
                                        let mut ref_points = Vec::new();

                                        for (j, x_level) in x_levels.iter().enumerate() {
                                            ref_points.push(PlotPoint {
                                                x: j as f64,
                                                y: grand_mean,
                                                label: x_level.clone(),
                                            });
                                        }

                                        plot_data.series.push(PlotSeries {
                                            name: "Grand Mean".to_string(),
                                            points: ref_points,
                                            error_bars: None,
                                            series_type: "line".to_string(),
                                            color: Some("black".to_string()),
                                            line_style: Some("dashed".to_string()),
                                            marker_style: Some("none".to_string()),
                                            is_reference_line: Some(true),
                                        });

                                        plot_data.reference_line = Some(grand_mean);

                                        legend_items.push(LegendItem {
                                            label: "Grand Mean".to_string(),
                                            color: Some("black".to_string()),
                                            line_style: Some("dashed".to_string()),
                                            marker_style: Some("none".to_string()),
                                        });
                                    }
                                }

                                plot_data.legend = Some(legend_items);
                            }
                        } else {
                            // Single factor plot
                            let mut points = Vec::new();
                            let mut error_bars = if config.plots.include_error_bars {
                                Some(Vec::new())
                            } else {
                                None
                            };

                            for (j, x_level) in x_levels.iter().enumerate() {
                                // Get mean for this factor level
                                let values = get_level_values(data, x_factor, x_level, dep_var)?;

                                if !values.is_empty() {
                                    let mean = calculate_mean(&values);
                                    let std_dev = calculate_std_deviation(&values, Some(mean));
                                    let n = values.len();

                                    points.push(PlotPoint {
                                        x: j as f64,
                                        y: mean,
                                        label: x_level.clone(),
                                    });

                                    // Calculate error bars if needed
                                    if let Some(error_bars_vec) = &mut error_bars {
                                        let std_error = std_dev / (n as f64).sqrt();

                                        if config.plots.confidence_interval {
                                            // 95% CI
                                            let t_critical = calculate_t_critical(n - 1, 0.025);
                                            let margin = t_critical * std_error;

                                            error_bars_vec.push(ConfidenceInterval {
                                                lower_bound: mean - margin,
                                                upper_bound: mean + margin,
                                            });
                                        } else if config.plots.standard_error {
                                            // Standard error
                                            let multiplier = config.plots.multiplier.unwrap_or(
                                                1
                                            ) as f64;

                                            error_bars_vec.push(ConfidenceInterval {
                                                lower_bound: mean - multiplier * std_error,
                                                upper_bound: mean + multiplier * std_error,
                                            });
                                        }
                                    }
                                }
                            }

                            // Add the series
                            if !points.is_empty() {
                                plot_data.series.push(PlotSeries {
                                    name: x_factor.clone(),
                                    points,
                                    error_bars,
                                    series_type: if config.plots.line_chart_type {
                                        "line".to_string()
                                    } else {
                                        "bar".to_string()
                                    },
                                    color: Some("blue".to_string()),
                                    line_style: Some("solid".to_string()),
                                    marker_style: Some("circle".to_string()),
                                    is_reference_line: Some(false),
                                });
                            }

                            // Add reference line for grand mean if requested
                            if config.plots.include_ref_line_for_grand_mean {
                                let mut all_values = Vec::new();

                                for records in &data.dependent_data {
                                    for record in records {
                                        if
                                            let Some(value) = extract_dependent_value(
                                                record,
                                                dep_var
                                            )
                                        {
                                            all_values.push(value);
                                        }
                                    }
                                }

                                if !all_values.is_empty() {
                                    let grand_mean = calculate_mean(&all_values);

                                    // Add grand mean reference line
                                    let mut ref_points = Vec::new();

                                    for (j, x_level) in x_levels.iter().enumerate() {
                                        ref_points.push(PlotPoint {
                                            x: j as f64,
                                            y: grand_mean,
                                            label: x_level.clone(),
                                        });
                                    }

                                    plot_data.series.push(PlotSeries {
                                        name: "Grand Mean".to_string(),
                                        points: ref_points,
                                        error_bars: None,
                                        series_type: "line".to_string(),
                                        color: Some("black".to_string()),
                                        line_style: Some("dashed".to_string()),
                                        marker_style: Some("none".to_string()),
                                        is_reference_line: Some(true),
                                    });

                                    plot_data.reference_line = Some(grand_mean);
                                }
                            }
                        }

                        result.insert(dep_var.clone(), plot_data);
                    }
                }
            }
        }
    }

    if result.is_empty() {
        Err("No plots generated. Check your configuration.".to_string())
    } else {
        Ok(result)
    }
}
