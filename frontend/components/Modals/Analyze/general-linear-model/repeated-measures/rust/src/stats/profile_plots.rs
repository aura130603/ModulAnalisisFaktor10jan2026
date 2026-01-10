use std::collections::HashMap;

/// Create profile plots for within-subjects factors
fn create_profile_plots(
    data: &AnalysisData,
    config: &RepeatedMeasuresConfig,
    descriptive_stats: &HashMap<String, DescriptiveStatistics>
) -> Result<Vec<PlotData>, String> {
    let mut plots = Vec::new();

    // Check if plots are requested in the config
    if config.plots.src_list.is_none() || config.plots.src_list.as_ref().unwrap().is_empty() {
        return Ok(plots);
    }

    // Get within-subjects factors
    let within_factors = parse_within_subject_factors(data, config)?;

    // Get between-subjects factors if any
    let between_factors = &config.model.bet_sub_var;

    // Process each requested plot
    if let Some(src_list) = &config.plots.src_list {
        for factor_name in src_list {
            // Skip if not a within-subjects factor
            if !within_factors.measures.contains_key(factor_name) {
                continue;
            }

            // Create plot without between-subjects factor first
            let plot = create_single_profile_plot(factor_name, None, descriptive_stats, config)?;

            plots.push(plot);

            // Create plots with between-subjects factors if any
            if let Some(between_factors) = between_factors {
                for between_factor in between_factors {
                    let plot_with_group = create_single_profile_plot(
                        factor_name,
                        Some(between_factor),
                        descriptive_stats,
                        config
                    )?;

                    plots.push(plot_with_group);
                }
            }
        }
    }

    Ok(plots)
}

/// Create a single profile plot
fn create_single_profile_plot(
    factor_name: &str,
    group_factor: Option<&String>,
    descriptive_stats: &HashMap<String, DescriptiveStatistics>,
    config: &RepeatedMeasuresConfig
) -> Result<PlotData, String> {
    let mut series = Vec::new();
    let mut legend_items = Vec::new();

    // Get factor levels
    let mut factor_levels = Vec::new();

    // Extract all factor levels
    for (_, stats) in descriptive_stats {
        for group in &stats.groups {
            if group.factor_name == factor_name {
                if !factor_levels.contains(&group.factor_value) {
                    factor_levels.push(group.factor_value.clone());
                }
            }
        }
    }

    // Sort factor levels numerically if possible
    factor_levels.sort_by(|a, b| {
        if let (Ok(a_num), Ok(b_num)) = (a.parse::<f64>(), b.parse::<f64>()) {
            a_num.partial_cmp(&b_num).unwrap_or(std::cmp::Ordering::Equal)
        } else {
            a.cmp(b)
        }
    });

    if let Some(group_factor_name) = group_factor {
        // Get all group factor levels
        let mut group_levels = Vec::new();

        for (_, stats) in descriptive_stats {
            for group in &stats.groups {
                if let Some(subgroups) = &group.subgroups {
                    for subgroup in subgroups {
                        if subgroup.factor_name == *group_factor_name {
                            if !group_levels.contains(&subgroup.factor_value) {
                                group_levels.push(subgroup.factor_value.clone());
                            }
                        }
                    }
                }
            }
        }

        // Sort group levels
        group_levels.sort_by(|a, b| {
            if let (Ok(a_num), Ok(b_num)) = (a.parse::<f64>(), b.parse::<f64>()) {
                a_num.partial_cmp(&b_num).unwrap_or(std::cmp::Ordering::Equal)
            } else {
                a.cmp(b)
            }
        });

        // Create a series for each group level
        for group_level in &group_levels {
            let mut points = Vec::new();
            let mut error_bars = Vec::new();

            // Extract mean values for each factor level
            for (i, factor_level) in factor_levels.iter().enumerate() {
                let mut found = false;

                for (_, stats) in descriptive_stats {
                    for group in &stats.groups {
                        if group.factor_name == factor_name && group.factor_value == *factor_level {
                            if let Some(subgroups) = &group.subgroups {
                                for subgroup in subgroups {
                                    if
                                        subgroup.factor_name == *group_factor_name &&
                                        subgroup.factor_value == *group_level
                                    {
                                        points.push(PlotPoint {
                                            x: (i as f64) + 1.0,
                                            y: subgroup.stats.mean,
                                            label: factor_level.clone(),
                                        });

                                        // Calculate error bars (95% CI)
                                        let std_error =
                                            subgroup.stats.std_deviation /
                                            (subgroup.stats.n as f64).sqrt();
                                        let margin = 1.96 * std_error;

                                        error_bars.push(ConfidenceInterval {
                                            lower_bound: subgroup.stats.mean - margin,
                                            upper_bound: subgroup.stats.mean + margin,
                                        });

                                        found = true;
                                        break;
                                    }
                                }
                            }

                            if found {
                                break;
                            }
                        }
                    }

                    if found {
                        break;
                    }
                }

                // If no data found for this combination, add placeholder point
                if !found {
                    points.push(PlotPoint {
                        x: (i as f64) + 1.0,
                        y: 0.0,
                        label: factor_level.clone(),
                    });

                    error_bars.push(ConfidenceInterval {
                        lower_bound: 0.0,
                        upper_bound: 0.0,
                    });
                }
            }

            // Add series
            let color = get_color_for_index(series.len());
            let line_style = get_line_style_for_index(series.len());

            series.push(PlotSeries {
                name: format!("{} = {}", group_factor_name, group_level),
                points,
                error_bars: Some(error_bars),
                series_type: (
                    if config.plots.line_chart_type {
                        "line"
                    } else {
                        "bar"
                    }
                ).to_string(),
                color: Some(color.clone()),
                line_style: Some(line_style.clone()),
                marker_style: Some("circle".to_string()),
                is_reference_line: None,
            });

            // Add legend item
            legend_items.push(LegendItem {
                label: format!("{} = {}", group_factor_name, group_level),
                color: Some(color),
                line_style: Some(line_style),
                marker_style: Some("circle".to_string()),
            });
        }
    } else {
        // Create a single series for the factor
        let mut points = Vec::new();
        let mut error_bars = Vec::new();

        // Extract mean values for each factor level
        for (i, factor_level) in factor_levels.iter().enumerate() {
            let mut found = false;

            for (_, stats) in descriptive_stats {
                for group in &stats.groups {
                    if group.factor_name == factor_name && group.factor_value == *factor_level {
                        points.push(PlotPoint {
                            x: (i as f64) + 1.0,
                            y: group.stats.mean,
                            label: factor_level.clone(),
                        });

                        // Calculate error bars (95% CI)
                        let std_error = group.stats.std_deviation / (group.stats.n as f64).sqrt();
                        let margin = 1.96 * std_error;

                        error_bars.push(ConfidenceInterval {
                            lower_bound: group.stats.mean - margin,
                            upper_bound: group.stats.mean + margin,
                        });

                        found = true;
                        break;
                    }
                }

                if found {
                    break;
                }
            }

            // If no data found for this level, add placeholder point
            if !found {
                points.push(PlotPoint {
                    x: (i as f64) + 1.0,
                    y: 0.0,
                    label: factor_level.clone(),
                });

                error_bars.push(ConfidenceInterval {
                    lower_bound: 0.0,
                    upper_bound: 0.0,
                });
            }
        }

        // Add series
        series.push(PlotSeries {
            name: factor_name.to_string(),
            points,
            error_bars: Some(error_bars),
            series_type: (if config.plots.line_chart_type { "line" } else { "bar" }).to_string(),
            color: Some("blue".to_string()),
            line_style: Some("solid".to_string()),
            marker_style: Some("circle".to_string()),
            is_reference_line: None,
        });
    }

    // Add reference line for grand mean if requested
    if config.plots.include_ref_line_for_grand_mean {
        let grand_mean = calculate_grand_mean(descriptive_stats);

        let ref_line_points = factor_levels
            .iter()
            .enumerate()
            .map(|(i, level)| PlotPoint {
                x: (i as f64) + 1.0,
                y: grand_mean,
                label: level.clone(),
            })
            .collect();

        series.push(PlotSeries {
            name: "Grand Mean".to_string(),
            points: ref_line_points,
            error_bars: None,
            series_type: "line".to_string(),
            color: Some("red".to_string()),
            line_style: Some("dashed".to_string()),
            marker_style: None,
            is_reference_line: Some(true),
        });

        // Add to legend
        legend_items.push(LegendItem {
            label: "Grand Mean".to_string(),
            color: Some("red".to_string()),
            line_style: Some("dashed".to_string()),
            marker_style: None,
        });
    }

    // Create plot
    let title = if let Some(group_factor) = group_factor {
        format!("Profile Plot: {} by {}", factor_name, group_factor)
    } else {
        format!("Profile Plot: {}", factor_name)
    };

    Ok(PlotData {
        title,
        x_label: factor_name.to_string(),
        y_label: "Estimated Marginal Means".to_string(),
        series,
        y_axis_starts_at_zero: config.plots.y_axis_start_0,
        includes_reference_line: config.plots.include_ref_line_for_grand_mean,
        reference_line: if config.plots.include_ref_line_for_grand_mean {
            Some(calculate_grand_mean(descriptive_stats))
        } else {
            None
        },
        dependent_variable: None,
        plot_type: Some((if config.plots.line_chart_type { "line" } else { "bar" }).to_string()),
        groups_label: group_factor.cloned(),
        model: Some("Full Factorial".to_string()),
        error_bars: Some(
            (
                if config.plots.confidence_interval {
                    "95% Confidence Interval"
                } else if config.plots.standard_error {
                    "Standard Error"
                } else {
                    "None"
                }
            ).to_string()
        ),
        legend: Some(legend_items),
    })
}

/// Calculate grand mean across all groups
fn calculate_grand_mean(descriptive_stats: &HashMap<String, DescriptiveStatistics>) -> f64 {
    let mut total_sum = 0.0;
    let mut total_count = 0;

    for (_, stats) in descriptive_stats {
        for group in &stats.groups {
            total_sum += group.stats.mean * (group.stats.n as f64);
            total_count += group.stats.n;
        }
    }

    if total_count > 0 {
        total_sum / (total_count as f64)
    } else {
        0.0
    }
}

/// Get a color based on index
fn get_color_for_index(index: usize) -> String {
    let colors = [
        "blue",
        "red",
        "green",
        "orange",
        "purple",
        "teal",
        "maroon",
        "navy",
        "olive",
        "gray",
    ];

    colors[index % colors.len()].to_string()
}

/// Get a line style based on index
fn get_line_style_for_index(index: usize) -> String {
    let styles = ["solid", "dashed", "dotted", "dashdot"];

    styles[index % styles.len()].to_string()
}
