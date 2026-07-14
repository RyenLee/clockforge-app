use crate::error::AppResult;
use crate::{AppState, models::*};
use chrono::Utc;
use serde_json::json;
use tauri::{Emitter, State};

#[tauri::command]
pub fn start_shutdown_timer(
    state: State<'_, AppState>,
    delay_seconds: u64,
    action: String,
) -> AppResult<Task> {
    let mut db = state.db.lock().unwrap();
    let action_name = match action.as_str() {
        "shutdown" => "关机",
        "reboot" => "重启",
        "sleep" => "休眠",
        _ => "关机",
    };
    let title = format!("{}分钟后{}", delay_seconds / 60, action_name);

    let payload = json!({ "action": action }).to_string();
    let scheduled_at = (Utc::now() + chrono::Duration::seconds(delay_seconds as i64)).to_rfc3339();

    let task = db.create_task(
        &title,
        "shutdown",
        Some(&payload),
        Some(&scheduled_at),
        None,
    )?;
    let task = db.update_task_status(&task.id, "running")?;

    let scheduler = state.scheduler.lock().unwrap();
    let task_clone = task.clone();
    let tasks_map = scheduler.tasks.clone();
    let app_handle = scheduler.app_handle.clone();
    drop(scheduler);
    drop(db);

    std::thread::spawn(move || {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async move {
            let (cancel_tx, cancel_rx) = tokio::sync::watch::channel(false);
            {
                let mut tasks = tasks_map.lock().await;
                tasks.insert(
                    task_clone.id.clone(),
                    crate::scheduler::ScheduledTask { cancel_tx },
                );
            }
            crate::scheduler::Scheduler::run_task(
                task_clone,
                delay_seconds,
                tasks_map,
                app_handle,
                cancel_rx,
            )
            .await;
        });
    });

    Ok(task)
}

#[tauri::command]
pub fn stop_shutdown_timer(state: State<'_, AppState>, task_id: String) -> AppResult<()> {
    let mut db = state.db.lock().unwrap();
    let _ = db.update_task_status(&task_id, "cancelled");
    drop(db);

    let scheduler = state.scheduler.lock().unwrap();
    let tasks_map = scheduler.tasks.clone();
    let app_handle = scheduler.app_handle.clone();
    drop(scheduler);

    std::thread::spawn(move || {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async move {
            let mut tasks = tasks_map.lock().await;
            if let Some(scheduled) = tasks.remove(&task_id) {
                let _ = scheduled.cancel_tx.send(true);
            }
            let _ = app_handle.emit("task-cancelled", serde_json::json!({ "id": task_id }));
        });
    });

    Ok(())
}

#[tauri::command]
pub fn start_notification_timer(
    state: State<'_, AppState>,
    title: String,
    body: String,
    delay_seconds: u64,
) -> AppResult<Task> {
    let mut db = state.db.lock().unwrap();
    let payload = json!({ "title": title, "body": body }).to_string();
    let scheduled_at = (Utc::now() + chrono::Duration::seconds(delay_seconds as i64)).to_rfc3339();

    let task = db.create_task(
        &title,
        "notification",
        Some(&payload),
        Some(&scheduled_at),
        None,
    )?;
    let task = db.update_task_status(&task.id, "running")?;

    let scheduler = state.scheduler.lock().unwrap();
    let task_clone = task.clone();
    let tasks_map = scheduler.tasks.clone();
    let app_handle = scheduler.app_handle.clone();
    drop(scheduler);
    drop(db);

    std::thread::spawn(move || {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async move {
            let (cancel_tx, cancel_rx) = tokio::sync::watch::channel(false);
            {
                let mut tasks = tasks_map.lock().await;
                tasks.insert(
                    task_clone.id.clone(),
                    crate::scheduler::ScheduledTask { cancel_tx },
                );
            }
            crate::scheduler::Scheduler::run_task(
                task_clone,
                delay_seconds,
                tasks_map,
                app_handle,
                cancel_rx,
            )
            .await;
        });
    });

    Ok(task)
}

#[tauri::command]
pub fn stop_notification_timer(state: State<'_, AppState>, task_id: String) -> AppResult<()> {
    let mut db = state.db.lock().unwrap();
    let _ = db.update_task_status(&task_id, "cancelled");
    drop(db);

    let scheduler = state.scheduler.lock().unwrap();
    let tasks_map = scheduler.tasks.clone();
    let app_handle = scheduler.app_handle.clone();
    drop(scheduler);

    std::thread::spawn(move || {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async move {
            let mut tasks = tasks_map.lock().await;
            if let Some(scheduled) = tasks.remove(&task_id) {
                let _ = scheduled.cancel_tx.send(true);
            }
            let _ = app_handle.emit("task-cancelled", serde_json::json!({ "id": task_id }));
        });
    });

    Ok(())
}
