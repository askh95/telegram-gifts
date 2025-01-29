use axum::{
    extract::{State, WebSocketUpgrade, ws::{Message, WebSocket}},
    response::Response,
};
use futures::{StreamExt, SinkExt};
use std::sync::Arc;
use crate::AppState;
use tracing::{info, error};

pub async fn handle_ws_connection(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> Response {
    info!("WebSocket upgrade requested");
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: Arc<AppState>) {
    let (mut sender, mut receiver) = socket.split();
    
    info!("WebSocket connection established");
    
    if let Some(Ok(message)) = receiver.next().await {
        if let Message::Text(gift_name) = message {
            info!("Received gift name: {}", gift_name);
            
            let gift_name_clone = gift_name.clone();
            let checker = state.checker.clone();
            tokio::spawn(async move {
                checker.monitor_gift(&gift_name_clone).await;
            });

            let mut rx = state.tx.subscribe();
            
            while let Ok(status) = rx.recv().await {
                if status.gift_name == gift_name {
                    match serde_json::to_string(&status) {
                        Ok(msg) => {
                            info!("Sending status message: {}", msg);
                            if let Err(e) = sender.send(Message::Text(msg)).await {
                                error!("Failed to send message: {}", e);
                                break;
                            }
                        }
                        Err(e) => error!("Failed to serialize status: {}", e),
                    }
                }
            }
        }
    }

    info!("WebSocket connection closed");
}