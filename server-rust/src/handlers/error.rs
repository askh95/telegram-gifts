use axum::{
    response::{IntoResponse, Response},
    http::StatusCode,
    Json,
};
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
    pub error_type: String,
}

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Invalid gift name: {0}")]
    InvalidGiftName(String),
    
    #[error("Failed to check gift after {0} attempts")]
    MaxRetriesExceeded(u32),
    
    #[error("Rate limit exceeded")]
    RateLimit,
    
    #[error("Network error: {0}")]
    Network(#[from] reqwest::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_type) = match &self {
            AppError::InvalidGiftName(_) => (StatusCode::BAD_REQUEST, "INVALID_GIFT_NAME"),
            AppError::MaxRetriesExceeded(_) => (StatusCode::BAD_REQUEST, "MAX_RETRIES_EXCEEDED"),
            AppError::RateLimit => (StatusCode::TOO_MANY_REQUESTS, "RATE_LIMIT"),
            AppError::Network(_) => (StatusCode::INTERNAL_SERVER_ERROR, "NETWORK_ERROR"),
        };

        let body = ErrorResponse {
            error: self.to_string(),
            error_type: error_type.to_string(),
        };

        (status, Json(body)).into_response()
    }
}
