pub mod config;
pub mod data;
pub mod result;

// Re-export the main types for easier access
pub use config::UnivariateConfig;
pub use data::AnalysisData;
pub use result::UnivariateResult;
