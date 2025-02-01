// handlers/monitor.rs
use crate::models::gift::{GiftRequest, GiftResponse};
use crate::AppState;
use axum::{
    extract::State,
    response::IntoResponse,
    Json,
};
use std::sync::Arc;

pub async fn start_monitoring(
    State(state): State<Arc<AppState>>,
    Json(request): Json<GiftRequest>,
) -> Result<impl IntoResponse, crate::handlers::error::AppError> {

    state.checker.validate_gift_name(&request.gift_name).await?;
    let result = state.checker.check_gift(&request.gift_name, 1).await?;


    Ok(Json(GiftResponse {
        gift_name: request.gift_name,   
        id: 1,
        status: if result { "found" } else { "not_found" }.to_string(),
    }))
}