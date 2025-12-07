use crate::models::{SimulationRequest, SimulationResponse, MonthlyData, EfficiencyFactors};

const PANEL_AREA_M2: f64 = 1.7;
const ELECTRICITY_PRICE_PER_KWH: f64 = 0.15;

pub fn calculate_solar_output(req: &SimulationRequest) -> Result<SimulationResponse, String> {
    if req.roof_size_m2 <= 0.0 {
        return Err("Roof size must be positive".to_string());
    }
    if req.panel_efficiency <= 0.0 || req.panel_efficiency > 100.0 {
        return Err("Panel efficiency must be between 0 and 100".to_string());
    }

    let num_panels = (req.roof_size_m2 / PANEL_AREA_M2).floor() as i32;
    
    if num_panels == 0 {
        return Err("Roof size too small for any panels".to_string());
    }

    let system_size_kw = (num_panels as f64 * req.panel_wattage as f64) / 1000.0;
    let efficiency_factors = calculate_efficiency_factors(req.latitude);
    let monthly_breakdown = calculate_monthly_breakdown(
        req.avg_sun_hours_per_day,
        system_size_kw,
        req.latitude,
        efficiency_factors.system_efficiency,
    );

    let annual_output_kwh: f64 = monthly_breakdown.iter().map(|m| m.output_kwh).sum();
    let total_system_cost = system_size_kw * 1000.0 * req.price_per_watt;
    let annual_savings = annual_output_kwh * ELECTRICITY_PRICE_PER_KWH;
    let roi_years = if annual_savings > 0.0 {
        total_system_cost / annual_savings
    } else {
        999.0
    };

    Ok(SimulationResponse {
        estimated_output_kwh: annual_output_kwh,
        estimated_cost_usd: total_system_cost,
        estimated_roi_years: roi_years,
        system_size_kw,
        num_panels,
        monthly_breakdown,
        efficiency_factors,
    })
}

fn calculate_efficiency_factors(latitude: f64) -> EfficiencyFactors {
    let abs_lat = latitude.abs();
    let temperature_loss = if abs_lat < 30.0 {
        0.15
    } else if abs_lat < 45.0 {
        0.10
    } else {
        0.05
    };

    let inverter_efficiency = 0.96;
    let dirt_shading_loss = 0.05;
    let system_efficiency = (1.0 - temperature_loss) * inverter_efficiency * (1.0 - dirt_shading_loss);

    EfficiencyFactors {
        temperature_loss,
        inverter_efficiency,
        dirt_shading_loss,
        system_efficiency,
    }
}

fn calculate_monthly_breakdown(
    avg_sun_hours: f64,
    system_size_kw: f64,
    latitude: f64,
    system_efficiency: f64,
) -> Vec<MonthlyData> {
    let months = vec![
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ];

    let days_in_month = vec![31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let is_northern = latitude > 0.0;

    months
        .iter()
        .enumerate()
        .map(|(i, &month)| {
            let month_angle = (i as f64 / 12.0) * 2.0 * std::f64::consts::PI;
            let seasonal_variation = if is_northern {
                1.0 + 0.3 * (month_angle - std::f64::consts::PI).cos()
            } else {
                1.0 + 0.3 * month_angle.cos()
            };

            let adjusted_sun_hours = avg_sun_hours * seasonal_variation;
            let days = days_in_month[i] as f64;
            let output_kwh = system_size_kw * adjusted_sun_hours * days * system_efficiency;

            MonthlyData {
                month: month.to_string(),
                output_kwh: (output_kwh * 100.0).round() / 100.0,
                sun_hours: (adjusted_sun_hours * 100.0).round() / 100.0,
            }
        })
        .collect()
}