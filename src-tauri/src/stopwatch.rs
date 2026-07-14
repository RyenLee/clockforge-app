use crate::models::{LapRecord, StopwatchStateData};
use chrono::Utc;
use std::sync::Mutex;
use std::time::Instant;

pub struct StopwatchState {
    inner: Mutex<StopwatchInner>,
}

struct StopwatchInner {
    mode: String,
    status: String,
    start_time: Option<Instant>,
    elapsed_ms: u64,
    total_duration_ms: u64,
    laps: Vec<LapRecord>,
}

impl StopwatchState {
    pub fn new() -> Self {
        StopwatchState {
            inner: Mutex::new(StopwatchInner {
                mode: "stopwatch".to_string(),
                status: "idle".to_string(),
                start_time: None,
                elapsed_ms: 0,
                total_duration_ms: 0,
                laps: Vec::new(),
            }),
        }
    }

    pub fn start(&self, mode: &str, duration_ms: Option<u64>) {
        let mut inner = self.inner.lock().unwrap();
        inner.mode = mode.to_string();
        inner.status = "running".to_string();
        inner.start_time = Some(Instant::now());
        inner.total_duration_ms = duration_ms.unwrap_or(0);
        inner.elapsed_ms = 0;
        inner.laps.clear();
    }

    pub fn pause(&self) {
        let mut inner = self.inner.lock().unwrap();
        if inner.status == "running" {
            if let Some(start) = inner.start_time {
                inner.elapsed_ms += start.elapsed().as_millis() as u64;
            }
            inner.status = "paused".to_string();
            inner.start_time = None;
        }
    }

    pub fn resume(&self) {
        let mut inner = self.inner.lock().unwrap();
        if inner.status == "paused" {
            inner.status = "running".to_string();
            inner.start_time = Some(Instant::now());
        }
    }

    pub fn reset(&self) {
        let mut inner = self.inner.lock().unwrap();
        inner.status = "idle".to_string();
        inner.start_time = None;
        inner.elapsed_ms = 0;
        inner.laps.clear();
    }

    pub fn lap(&self) -> Option<LapRecord> {
        let mut inner = self.inner.lock().unwrap();
        if inner.status != "running" && inner.status != "paused" {
            return None;
        }

        let current_elapsed = if let Some(start) = inner.start_time {
            inner.elapsed_ms + start.elapsed().as_millis() as u64
        } else {
            inner.elapsed_ms
        };

        let lap_num = inner.laps.len() + 1;
        let prev_elapsed = if lap_num > 1 {
            let mut total = 0;
            for lap in &inner.laps {
                total += lap.lap_time_ms;
            }
            total
        } else {
            0
        };

        let lap_time = current_elapsed - prev_elapsed;

        let record = LapRecord {
            id: None,
            timer_id: inner.mode.clone(),
            lap_time_ms: lap_time,
            recorded_at: Utc::now().to_rfc3339(),
        };

        inner.laps.push(record.clone());
        Some(record)
    }

    pub fn get_state(&self) -> StopwatchStateData {
        let inner = self.inner.lock().unwrap();
        let elapsed = if let Some(start) = inner.start_time {
            inner.elapsed_ms + start.elapsed().as_millis() as u64
        } else {
            inner.elapsed_ms
        };

        StopwatchStateData {
            mode: inner.mode.clone(),
            status: inner.status.clone(),
            elapsed_ms: elapsed,
            total_duration_ms: inner.total_duration_ms,
            laps: inner.laps.clone(),
        }
    }
}
