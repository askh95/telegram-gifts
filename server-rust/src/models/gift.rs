// src/models/gift.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GiftRequest {
    pub gift_name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GiftResponse {
    pub gift_name: String,
    pub id: u32,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GiftStatus {
    pub gift_name: String,
    pub current_id: u32,
    pub found: bool,
}