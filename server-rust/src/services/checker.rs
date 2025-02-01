use crate::handlers::error::AppError;
use crate::models::gift::GiftStatus;
use reqwest::{Client, ClientBuilder};
use std::time::Duration;
use tokio::sync::broadcast;
use std::sync::Arc;
use std::sync::atomic::{AtomicU32, Ordering};
use tracing::{info, warn, error};
use scraper::{Html, Selector};
use futures::future::join_all;
use std::collections::HashSet;

const REQUEST_TIMEOUT: Duration = Duration::from_secs(10);
const MAX_RETRIES: u32 = 5;
const RETRY_DELAY: Duration = Duration::from_secs(2);
const DEFAULT_START_ID: u32 = 1;

pub struct GiftChecker {
    client: Client,
    tx: broadcast::Sender<GiftStatus>,
}

impl GiftChecker {
    pub fn new(tx: broadcast::Sender<GiftStatus>) -> Self {
        let client = ClientBuilder::new()
            .timeout(REQUEST_TIMEOUT)
            .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
            .build()
            .unwrap();

        Self {
            client,
            tx,
        }
    }

    async fn get_current_gift_count(&self, gift_name: &str) -> Result<u32, AppError> {
        for attempt in 1..=MAX_RETRIES {
            info!("Attempting to get gift count, attempt #{}", attempt);
            
            let url = format!("https://t.me/nft/{}-1", gift_name);
            match self.client.get(&url).send().await {
                Ok(response) => {
                    if response.status().is_client_error() {
                        if response.status() == reqwest::StatusCode::TOO_MANY_REQUESTS {
                            return Err(AppError::RateLimit);
                        }
                        continue;
                    }

                    let html = response.text().await?;
                    let document = Html::parse_document(&html);
                    let selector = Selector::parse("tr").unwrap();
                    
                    for row in document.select(&selector) {
                        if let Some(th) = row.select(&Selector::parse("th").unwrap()).next() {
                            if th.text().collect::<String>().contains("Quantity") {
                                if let Some(td) = row.select(&Selector::parse("td").unwrap()).next() {
                                    let quantity_text = td.text().collect::<String>();
                                    info!("Found quantity text: {}", quantity_text);
                                    
                                    let clean_number = quantity_text
                                        .split('/')
                                        .next()
                                        .and_then(|s| s.chars()
                                            .filter(|c| c.is_digit(10))
                                            .collect::<String>()
                                            .parse::<u32>()
                                            .ok());
                                    
                                    if let Some(count) = clean_number {
                                        info!("Successfully parsed gift count: {}", count);
                                        return Ok(count);
                                    }
                                }
                            }
                        }
                    }
                }
                Err(e) => {
                    error!("Error in attempt {}: {}", attempt, e);
                    if attempt == MAX_RETRIES {
                        return Err(AppError::Network(e));
                    }
                }
            }
            
            tokio::time::sleep(RETRY_DELAY).await;
        }
        
        Err(AppError::MaxRetriesExceeded(MAX_RETRIES))
    }

    pub async fn monitor_gift(&self, gift_name: &str) {
        info!("Starting gift monitor for {}", gift_name);
    
        let max_id = Arc::new(AtomicU32::new(
            match self.get_current_gift_count(gift_name).await {
                Ok(count) => {
                    info!("Got initial gift count: {}", count);
                    count
                },
                Err(e) => {
                    warn!("Failed to get count: {}. Using default", e);
                    DEFAULT_START_ID
                }
            }
        ));
    
        // Добавляем HashSet для отслеживания найденных ID
        let found_ids = Arc::new(tokio::sync::Mutex::new(HashSet::new()));
        let batch_size: u32 = 20;
    
        loop {
            let mut tasks = Vec::with_capacity(batch_size as usize);
            let current_max = max_id.load(Ordering::Relaxed);
    
            for id in current_max..current_max + batch_size {
                let client = self.client.clone();
                let gift_name = gift_name.to_string();
                let tx = self.tx.clone();
                let max_id = max_id.clone();
                let found_ids = found_ids.clone();
    
                tasks.push(tokio::spawn(async move {
                    match client.get(&format!("https://t.me/nft/{}-{}", gift_name, id))
                        .send()
                        .await 
                    {
                        Ok(response) => {
                            if response.status() == reqwest::StatusCode::TOO_MANY_REQUESTS {
                                return;
                            }
    
                            let final_url = response.url().to_string();
                            if !final_url.contains("telegram.org") {
                                // Проверяем, не был ли ID уже найден
                                let mut found = found_ids.lock().await;
                                if !found.contains(&id) {
                                    found.insert(id);
                                    max_id.fetch_max(id, Ordering::Relaxed);
                                    
                                    let _ = tx.send(GiftStatus {
                                        gift_name: gift_name,
                                        current_id: id,
                                        found: true,
                                    });
                                }
                            }
                        },
                        Err(_) => {}
                    }
                }));
            }
    
            join_all(tasks).await;
            tokio::time::sleep(Duration::from_millis(50)).await;
        }
    }

    pub async fn check_gift(&self, gift_name: &str, id: u32) -> Result<bool, AppError> {
        for attempt in 1..=MAX_RETRIES {
            let url = format!("https://t.me/nft/{}-{}", gift_name, id);
            
            match self.client.get(&url).send().await {
                Ok(response) => {
                    if response.status() == reqwest::StatusCode::TOO_MANY_REQUESTS {
                        if attempt == MAX_RETRIES {
                            return Err(AppError::RateLimit);
                        }
                        tokio::time::sleep(RETRY_DELAY).await;
                        continue;
                    }
                    
                    let final_url = response.url().to_string();
                    return Ok(!final_url.contains("telegram.org"));
                }
                Err(e) => {
                    if attempt == MAX_RETRIES {
                        return Err(AppError::Network(e));
                    }
                    tokio::time::sleep(RETRY_DELAY).await;
                }
            }
        }
        
        Err(AppError::MaxRetriesExceeded(MAX_RETRIES))
    }

    pub async fn validate_gift_name(&self, gift_name: &str) -> Result<(), AppError> {
        if gift_name.chars().all(|c| c.is_alphanumeric() || c == '-') {
            Ok(())
        } else {
            Err(AppError::InvalidGiftName(
                "Gift name should only contain letters, numbers, and hyphens".to_string(),
            ))
        }
    }
}