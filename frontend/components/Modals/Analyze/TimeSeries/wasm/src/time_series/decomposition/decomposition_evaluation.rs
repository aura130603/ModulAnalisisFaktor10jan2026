use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;
use js_sys::{Object, Reflect};
use crate::Decomposition;
use crate::basic_evaluation;

#[wasm_bindgen]
impl Decomposition {
    pub fn decomposition_evaluation(&self, forecast: Vec<f64>) -> JsValue {
        let mse = basic_evaluation::mse(self.get_data(), forecast.clone()) as f64;
        let rmse = basic_evaluation::rmse(self.get_data(), forecast.clone()) as f64;
        let mae = basic_evaluation::mae(self.get_data(), forecast.clone()) as f64;
        let mpe = basic_evaluation::mpe(self.get_data(), forecast.clone()) as f64;
        let mape = basic_evaluation::mape(self.get_data(), forecast.clone()) as f64;
        
        let results = Object::new();
        Reflect::set(&results, &"MSE".into(), &mse.into()).unwrap();
        Reflect::set(&results, &"RMSE".into(), &rmse.into()).unwrap();
        Reflect::set(&results, &"MAE".into(), &mae.into()).unwrap();
        Reflect::set(&results, &"MPE".into(), &mpe.into()).unwrap();
        Reflect::set(&results, &"MAPE".into(), &mape.into()).unwrap();

        // Mengembalikan objek JavaScript sebagai JsValue
        JsValue::from(results)
    }
}
