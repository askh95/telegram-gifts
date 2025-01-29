use crate::handlers::error::AppError;
use crate::models::gift::GiftStatus;
use reqwest::{Client, ClientBuilder};
use std::time::Duration;
use tokio::sync::broadcast;
use std::sync::Arc;
use tokio::sync::Mutex;
use std::collections::HashSet;
use futures::future::join_all;
use tracing::{info, warn, error};
use scraper::{Html, Selector};

const REQUEST_TIMEOUT: Duration = Duration::from_secs(10);
const CHECK_DELAY: Duration = Duration::from_secs(1);
const BATCH_SIZE: u32 = 10;
const MAX_RETRIES: u32 = 5;
const RETRY_DELAY: Duration = Duration::from_secs(2);
const UPDATE_INTERVAL: Duration = Duration::from_secs(1000);
const DEFAULT_START_ID: u32 = 1;

pub struct GiftChecker {
    client: Client,
    found_nfts: Arc<Mutex<HashSet<u32>>>,
    last_max_id: Arc<Mutex<u32>>,
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
            found_nfts: Arc::new(Mutex::new(HashSet::new())),
            last_max_id: Arc::new(Mutex::new(0)),
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
    
        let start_id = match self.get_current_gift_count(gift_name).await {
            Ok(count) => {
                info!("Got initial gift count: {}", count);
                count
            },
            Err(e) => {
                warn!("Failed to get count: {}. Using default", e);
                DEFAULT_START_ID
            }
        };
    
        let found_ids = Arc::new(Mutex::new(HashSet::new()));
        let mut current_ids: Vec<u32> = (start_id..start_id+10).rev().collect();
    
        loop {
            let mut tasks = Vec::with_capacity(10);
    
            for &id in &current_ids {
                let client = self.client.clone();
                let gift_name = gift_name.to_string();
                let tx = self.tx.clone();
                let found_ids = found_ids.clone();
    
                tasks.push(tokio::spawn(async move {
                    if found_ids.lock().await.contains(&id) {
                        return;
                    }
    
                    loop {
                        match client.get(&format!("https://t.me/nft/{}-{}", gift_name, id)).send().await {
                            Ok(response) => {
                                if response.status() == reqwest::StatusCode::TOO_MANY_REQUESTS {
                                    tokio::time::sleep(Duration::from_secs(60)).await;
                                    continue;
                                }
    
                                let final_url = response.url().to_string();
                                if !final_url.contains("telegram.org") {
                                    found_ids.lock().await.insert(id);
                                    
                                    let _ = tx.send(GiftStatus {
                                        gift_name: gift_name.clone(),
                                        current_id: id,
                                        found: true,
                                    });
                                    break;
                                }
                                tokio::time::sleep(Duration::from_secs(1)).await;
                            },
                            Err(_) => {
                                tokio::time::sleep(Duration::from_secs(1)).await;
                            }
                        }
                    }
                }));
            }
    
            join_all(tasks).await;
            
            let next_start = current_ids.last().unwrap() + 10;
            current_ids = (next_start..next_start+10).rev().collect();
        }
    }

    async fn monitor_batch(&self, gift_name: &str, start_id: u32) -> Result<Vec<u32>, AppError> {
        let mut tasks = Vec::with_capacity(BATCH_SIZE as usize);
        let mut found = Vec::new();

        {
            let found_nfts = self.found_nfts.lock().await;
            for id in start_id..start_id + BATCH_SIZE {
                if found_nfts.contains(&id) {
                    continue;
                }
                let client = self.client.clone();
                let url = format!("https://t.me/nft/{}-{}", gift_name, id);
                tasks.push(tokio::spawn(async move {
                    (id, client.get(&url).send().await)
                }));
            }
        }

        for result in join_all(tasks).await {
            if let Ok((id, response)) = result {
                match response {
                    Ok(response) => {
                        if response.status() == reqwest::StatusCode::TOO_MANY_REQUESTS {
                            return Err(AppError::RateLimit);
                        }

                        let final_url = response.url().to_string();
                        if !final_url.contains("telegram.org") {
                            self.found_nfts.lock().await.insert(id);
                            found.push(id);
                            
                            let mut last_max = self.last_max_id.lock().await;
                            if id > *last_max {
                                *last_max = id;
                            }
                            
                            let _ = self.tx.send(GiftStatus {
                                gift_name: gift_name.to_string(),
                                current_id: id,
                                found: true,
                            });
                            
                            info!("Found gift: {} for {}", id, gift_name);
                        }
                    }
                    Err(e) => {
                        error!("Request error for ID {}: {}", id, e);
                    }
                }
            }
        }

        Ok(found)
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