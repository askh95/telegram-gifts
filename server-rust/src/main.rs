mod handlers;
mod models;
mod services;

use axum::{
    routing::{get, post},
    Router,
};
use handlers::monitor::start_monitoring;  
use handlers::ws::handle_ws_connection;
use services::checker::GiftChecker;
use std::{sync::Arc, net::SocketAddr};
use tokio::sync::broadcast;
use tower_http::cors::CorsLayer;
use tracing::Level;
use crate::models::gift::GiftStatus;

#[derive(Clone)]
pub struct AppState {
    checker: Arc<GiftChecker>,
    tx: broadcast::Sender<GiftStatus>,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_max_level(Level::INFO)
        .init();

    let (tx, _) = broadcast::channel::<GiftStatus>(100);

    let checker = Arc::new(GiftChecker::new(tx.clone()));

    let state = Arc::new(AppState {
        checker,
        tx,
    });

    let app = Router::new()
        .nest("/api/rust", Router::new()
            .route("/check", post(start_monitoring))
            .route("/ws", get(handle_ws_connection))
        )
        .layer(CorsLayer::permissive())
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], 3003));
    println!("Server running on http://{}", addr);

    axum::serve(
        tokio::net::TcpListener::bind(addr)
            .await
            .unwrap(),
        app,
    )
    .await
    .unwrap();
}