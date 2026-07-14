use crate::AppState;
use crate::error::AppResult;
use crate::models::DashboardStats;
use tauri::State;

#[tauri::command]
pub fn get_dashboard_stats(state: State<'_, AppState>) -> AppResult<DashboardStats> {
    let db = state.db.lock().unwrap();

    let running = db.count_tasks_by_status("running")?;
    let pending = db.count_tasks_by_status("pending")?;
    let cancelled = db.count_tasks_by_status("cancelled")?;
    let completed_today = db.count_completed_today()?;
    let recent_tasks = db.get_recent_tasks(5)?;

    Ok(DashboardStats {
        running,
        completed_today,
        pending,
        cancelled,
        recent_tasks,
    })
}
