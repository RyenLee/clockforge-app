use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub task_type: String,
    pub status: String,
    pub payload: Option<String>,
    pub scheduled_at: Option<String>,
    pub cron_expr: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub executed_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LapRecord {
    pub id: Option<i64>,
    pub timer_id: String,
    pub lap_time_ms: u64,
    pub recorded_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StopwatchStateData {
    pub mode: String,
    pub status: String,
    pub elapsed_ms: u64,
    pub total_duration_ms: u64,
    pub laps: Vec<LapRecord>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardStats {
    pub running: i64,
    pub completed_today: i64,
    pub pending: i64,
    pub cancelled: i64,
    pub recent_tasks: Vec<Task>,
}
