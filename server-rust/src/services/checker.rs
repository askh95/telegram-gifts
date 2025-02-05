// src/services/checker.rs
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
use std::collections::{HashSet, HashMap};
use std::time::Instant;

const REQUEST_TIMEOUT: Duration = Duration::from_secs(10);
const MAX_RETRIES: u32 = 5;
const RETRY_DELAY: Duration = Duration::from_secs(2);
const DEFAULT_START_ID: u32 = 1;
const CLEANUP_INTERVAL: u64 = 5 * 60; 

pub struct GiftChecker {
    client: Client,
    tx: broadcast::Sender<GiftStatus>,
    found_ids: Arc<tokio::sync::Mutex<HashMap<String, (HashSet<u32>, Instant)>>>,
}

impl GiftChecker {
    pub fn new(tx: broadcast::Sender<GiftStatus>) -> Self {
        let checker = Self {
            client: ClientBuilder::new()
                .timeout(REQUEST_TIMEOUT)
                .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                .build()
                .unwrap(),
            tx,
            found_ids: Arc::new(tokio::sync::Mutex::new(HashMap::new())),
        };
        
        checker.start_cleanup();
        checker
    }

    fn start_cleanup(&self) {
        let found_ids = self.found_ids.clone();
        
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(CLEANUP_INTERVAL));
            
            loop {
                interval.tick().await;
                let mut ids = found_ids.lock().await;
                let now = Instant::now();
                
                ids.retain(|_, (_, last_update)| {
                    now.duration_since(*last_update).as_secs() < CLEANUP_INTERVAL
                });
                
                info!("Memory cleanup completed. Current entries: {}", ids.len());
            }
        });
    }

    pub async fn get_current_gift_count(&self, gift_name: &str) -> Result<u32, AppError> {
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
    
        let found_ids = self.found_ids.clone();
        let batch_size: u32 = 100;
    
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
                                let mut found_map = found_ids.lock().await;
                                let (found_set, timestamp) = found_map
                                    .entry(gift_name.clone())
                                    .or_insert_with(|| (HashSet::new(), Instant::now()));
                                
                                if !found_set.contains(&id) {
                                    found_set.insert(id);
                                    *timestamp = Instant::now(); // Обновляем время последнего изменения
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
            tokio::time::sleep(Duration::from_millis(20)).await;
        }
    }

    pub async fn check_gift(&self, gift_name: &str, id: u32) -> Result<bool, AppError> {
        const TELEGRAM_ORG_SIZE: u64 = 5925; 

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

                   
                    if let Some(content_length) = response.content_length() {
                        if content_length < TELEGRAM_ORG_SIZE {
                            return Ok(false);
                        } else {
                            let final_url = response.url().to_string();
                            return Ok(!final_url.contains("telegram.org"));
                        }
                    } else {
                       
                        let final_url = response.url().to_string();
                        return Ok(!final_url.contains("telegram.org"));
                    }
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