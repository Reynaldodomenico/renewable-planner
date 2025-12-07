mod calculator;
mod models;

use actix_cors::Cors;
use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use models::SimulationRequest;

async fn health_check() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "healthy",
        "service": "solar-simulator"
    }))
}

async fn calculate(req: web::Json<SimulationRequest>) -> impl Responder {
    match calculator::calculate_solar_output(&req) {
        Ok(result) => HttpResponse::Ok().json(result),
        Err(e) => HttpResponse::BadRequest().json(serde_json::json!({
            "error": e
        })),
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("Starting Rust Solar Simulator on port 8080...");

    HttpServer::new(|| {
        let cors = Cors::permissive();
        
        App::new()
            .wrap(cors)
            .route("/health", web::get().to(health_check))
            .route("/calculate", web::post().to(calculate))
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}