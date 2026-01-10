use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Smoothing {
    data: Vec<f64>,      // Data input
}

#[wasm_bindgen]
impl Smoothing{
    #[wasm_bindgen(constructor)]
    pub fn new(data: Vec<f64>) -> Smoothing {
        Smoothing {
            data,
        }
    }

    // Getter
    pub fn get_data(&self) -> Vec<f64> {
        self.data.clone()
    }

    // Setter
    pub fn set_data(&mut self, data: Vec<f64>) {
        self.data = data;
    }
}