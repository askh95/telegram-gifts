use axum::{
    extract::{State, WebSocketUpgrade, ws::{Message, WebSocket}},
    response::Response,
};
use futures::{StreamExt, SinkExt};
use std::sync::Arc;
use std::time::{Duration, Instant};
use crate::AppState;
use tracing::{info, error};
use tokio::task::JoinHandle;

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

    let mut current_task: Option<JoinHandle<()>> = None;
    let mut last_activity = Instant::now();
    const WS_TIMEOUT: Duration = Duration::from_secs(150);

    let ping_interval = tokio::time::interval(Duration::from_secs(30));
    tokio::pin!(ping_interval);

    loop {
        tokio::select! {
            _ = ping_interval.tick() => {
                if last_activity.elapsed() > WS_TIMEOUT {
                    break;
                }
                
                if let Err(_) = sender.send(Message::Ping(vec![])).await {
                    break;
                }
            }

            message = receiver.next() => {
                match message {
                    Some(Ok(msg)) => {
                        last_activity = Instant::now();
                        match msg {
                            Message::Text(gift_name) => {
                                if let Some(handle) = current_task.take() {
                                    handle.abort();
                                }

                                let gift_name_clone = gift_name.clone();
                                let checker = state.checker.clone();
                                let handle = tokio::spawn(async move {
                                    checker.monitor_gift(&gift_name_clone).await;
                                });
                                current_task = Some(handle);

                                let mut rx = state.tx.subscribe();
                                while let Ok(status) = rx.recv().await {
                                    if status.gift_name == gift_name {
                                        match serde_json::to_string(&status) {
                                            Ok(msg) => {
                                                if let Err(_) = sender.send(Message::Text(msg)).await {
                                                    break;
                                                }
                                            }
                                            Err(e) => error!("Serialize error: {}", e),
                                        }
                                    }
                                }
                            }
                            Message::Pong(_) => last_activity = Instant::now(),
                            Message::Close(_) => break,
                            _ => {}
                        }
                    }
                    Some(Err(e)) => {
                        error!("WebSocket error: {}", e);
                        break;
                    }
                    None => break
                }
            }
        }
    }

    if let Some(handle) = current_task {
        handle.abort();
    }
    info!("WebSocket connection closed");
}