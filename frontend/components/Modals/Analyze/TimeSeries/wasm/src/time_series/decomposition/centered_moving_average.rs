use wasm_bindgen::prelude::*;
use crate::Decomposition;

pub fn moving_average (data: Vec<f64>, distance: usize) -> Vec<f64> {
    let mut sma_values: Vec<f64> = Vec::new();
    let mut avg: f64;
    for i in 0..data.len(){
        if i < distance-1{
            sma_values.push(0.0);
        }else{
            avg = data[i-distance+1..i+1].iter().sum::<f64>() / distance as f64;
            sma_values.push(avg);
        }
    }
    sma_values
}

// Calculate Centered Moving Average
#[wasm_bindgen]
impl Decomposition{
    pub fn calculate_centered_moving_average(&self)->Vec<f64>{
        // Initialize the variables
        let period = self.get_period() as usize;
        let mut centered_ma: Vec<f64>;
        // let data = Smoothing::new(self.get_data());
        
        // Calculate Moving Average
        if period%2 == 0{ // if the period is even
            let sma = moving_average(self.get_data(), period);
            centered_ma = moving_average(sma.clone(), 2);
        }else{ // if the period is odd
            centered_ma = moving_average(self.get_data(), period);
        }

        // Move the moving average values to the center
        let position = (period - (period%2)) / 2;
        for _i in 0..position{
            centered_ma.remove(0);
            centered_ma.insert(centered_ma.len(), 0.0);
        }

        // Make sure values if even
        if period%2 == 0{
            centered_ma[position-1] = 0.0;
        }

        centered_ma
    }
}