use crate::models::result::{ FactorAnalysisResult, LoadingPlot };

pub fn generate_loading_plots(
    result: &FactorAnalysisResult,
) -> Result<LoadingPlot, String> {

    // 1. Tentukan sumber matrix (Rotated > Pattern > Component)
    let (components, variable_order) = if let Some(rotated) = &result.rotated_component_matrix {
        (&rotated.components, &rotated.variable_order)
    } else if let Some(pattern) = &result.pattern_matrix {
        (&pattern.components, &pattern.variable_order)
    } else if let Some(component) = &result.component_matrix {
        (&component.components, &component.variable_order)
    } else {
        return Err("No component matrix available for loading plot".to_string());
    };

    // 2. Siapkan vector untuk menampung data
    let mut x_loadings: Vec<f64> = Vec::new();
    let mut y_loadings: Vec<f64> = Vec::new();
    let mut valid_variables: Vec<String> = Vec::new();

    // 3. Iterasi berdasarkan urutan variabel agar label sesuai
    for var_name in variable_order {
        if let Some(loadings) = components.get(var_name) {
            // Pastikan minimal ada 2 komponen untuk plot X vs Y
            if loadings.len() >= 2 {
                x_loadings.push(loadings[0]); // Index 0 = Component 1
                y_loadings.push(loadings[1]); // Index 1 = Component 2
                valid_variables.push(var_name.clone());
            }
        }
    }

    // 4. Cek apakah data berhasil diambil
    if x_loadings.is_empty() {
        return Err("Not enough components extracted to generate a plot (min 2 required)".to_string());
    }

    Ok(LoadingPlot {
        variables: valid_variables,
        component_x: "Component 1".to_string(),
        component_y: "Component 2".to_string(),
        x_loadings,
        y_loadings,
    })
}