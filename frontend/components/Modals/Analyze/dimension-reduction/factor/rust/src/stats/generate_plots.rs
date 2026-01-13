use crate::models::result::{FactorAnalysisResult, LoadingPlot, LoadingPoint};

pub fn generate_loading_plots(
    result: &FactorAnalysisResult,
) -> Result<LoadingPlot, String> {

    // 1. Pilih Matriks (Prioritas: Pattern > Rotated > Component)
    let (components_map, variable_order) = if let Some(pattern) = &result.pattern_matrix {
        (&pattern.components, &pattern.variable_order)
    } else if let Some(rotated) = &result.rotated_component_matrix {
        (&rotated.components, &rotated.variable_order)
    } else if let Some(component) = &result.component_matrix {
        (&component.components, &component.variable_order)
    } else {
        return Err("No matrix available for loading plot".to_string());
    };

    // 2. Cek Jumlah Komponen
    let first_var = variable_order.first()
        .ok_or("No variables found".to_string())?;
    
    let num_components = components_map.get(first_var)
        .map(|v| v.len())
        .unwrap_or(0);

    if num_components < 2 {
        return Err("Min 2 components required for plot".to_string());
    }

    // 3. Buat Label Sumbu
    let axis_labels: Vec<String> = (1..=num_components)
        .map(|i| format!("Component {}", i))
        .collect();

    // 4. Ambil Koordinat
    let mut points: Vec<LoadingPoint> = Vec::new();

    for var_name in variable_order {
        if let Some(loadings) = components_map.get(var_name) {
            // Kita ambil sejumlah num_components saja untuk keamanan
            if loadings.len() >= num_components {
                points.push(LoadingPoint {
                    label: var_name.clone(),
                    coordinates: loadings[0..num_components].to_vec(),
                });
            }
        }
    }

    Ok(LoadingPlot {
        axis_labels,
        points,
    })
}