use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;
use js_sys::{Object, Reflect};
use crate::Arima;
use crate::basic_evaluation;

#[wasm_bindgen]
impl Arima{
    pub fn forecasting_evaluation(&self)-> JsValue{
        let data = self.get_data();
        let forecast = self.forecast();
        assert_eq!(data.len(), forecast.len());

        let mse = basic_evaluation::mse(data.clone(), forecast.clone()) as f64;
        let rmse = basic_evaluation::rmse(data.clone(), forecast.clone()) as f64;
        let mae = basic_evaluation::mae(data.clone(), forecast.clone()) as f64;
        let mpe = basic_evaluation::mpe(data.clone(), forecast.clone()) as f64;
        let mape = basic_evaluation::mape(data.clone(), forecast.clone()) as f64;
        
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