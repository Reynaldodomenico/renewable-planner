use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct SimulationRequest {
    pub latitude: f64,
    pub longitude: f64,
    pub avg_sun_hours_per_day: f64,
    pub roof_size_m2: f64,
    pub panel_efficiency: f64,
    pub panel_wattage: i32,
    pub price_per_watt: f64,
}

#[derive(Debug, Serialize)]
pub struct SimulationResponse {
    pub estimated_output_kwh: f64,
    pub estimated_cost_usd: f64,
    pub estimated_roi_years: f64,
    pub system_size_kw: f64,
    pub num_panels: i32,
    pub monthly_breakdown: Vec<MonthlyData>,
    pub efficiency_factors: EfficiencyFactors,
}

#[derive(Debug, Serialize)]
pub struct MonthlyData {
    pub month: String,
    pub output_kwh: f64,
    pub sun_hours: f64,
}

#[derive(Debug, Serialize)]
pub struct EfficiencyFactors {
    pub temperature_loss: f64,
    pub inverter_efficiency: f64,
    pub dirt_shading_loss: f64,
    pub system_efficiency: f64,
}