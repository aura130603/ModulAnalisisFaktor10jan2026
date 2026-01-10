use wasm_bindgen::prelude::*;
use crate::Smoothing;

#[wasm_bindgen]
impl Smoothing {
    // Simple Exponential Smoothing Method
    pub fn calculate_ses(&self, alpha:f64) -> Vec<f64> {
        let data: Vec<f64> = self.get_data();
        let mut ses_values: Vec<f64> = Vec::new();
        for i in 0..data.len(){
            if i == 0{
                ses_values.push(0.0);
            }
            else if i == 1{
                ses_values.push(data[i-1]);
            }
            else{
                ses_values.push(alpha * data[i-1] + (1.0 - alpha) * ses_values[i-1]);
            }
        }
        ses_values
    }

    // Double Exponential Smoothing Method
    pub fn calculate_des(&self, alpha:f64) -> Vec<f64> {
        let mut des_values: Vec<f64> = Vec::new();
        // first exponential smoothing
        let exp1: Smoothing = Smoothing::new(self.get_data());
        let mut exp1_values: Vec<f64> = exp1.calculate_ses(alpha);
        exp1_values.remove(0);
        // second exponential smoothing
        let exp2: Smoothing = Smoothing::new(exp1_values.clone());
        let mut exp2_values: Vec<f64> = exp2.calculate_ses(alpha);
        exp2_values.insert(0, 0.0);
        exp1_values.insert(0, 0.0);
        for i in 0..self.get_data().len(){
            if i <= 1{
                des_values.push(0.0);
            }
            else{
                let a: f64 = 2.0 * exp1_values[i] - exp2_values[i];
                let b: f64 = alpha / (1.0 - alpha) * (exp1_values[i] - exp2_values[i]);
                des_values.push(a+b);
            }
        }
        des_values
    }
}