use crate::error::AppResult;
use crate::{AppState, models::*};
use tauri::{Emitter, State};
use tracing::info;

#[tauri::command]
pub fn get_all_tasks(
    state: State<'_, AppState>,
    status: Option<String>,
    task_type: Option<String>,
) -> AppResult<Vec<Task>> {
    let db = state.db.lock().unwrap();
    db.get_all_tasks(status.as_deref(), task_type.as_deref())
}

#[tauri::command]
pub fn get_task_by_id(state: State<'_, AppState>, id: String) -> AppResult<Task> {
    let db = state.db.lock().unwrap();
    db.get_task(&id)
}

#[tauri::command]
pub fn create_task(
    state: State<'_, AppState>,
    title: String,
    task_type: String,
    payload: Option<String>,
    scheduled_at: Option<String>,
    cron_expr: Option<String>,
) -> AppResult<Task> {
    let mut db = state.db.lock().unwrap();
    let task = db.create_task(
        &title,
        &task_type,
        payload.as_deref(),
        scheduled_at.as_deref(),
        cron_expr.as_deref(),
    )?;
    Ok(task)
}

#[tauri::command]
pub fn update_task(
    state: State<'_, AppState>,
    id: String,
    status: Option<String>,
) -> AppResult<Task> {
    let mut db = state.db.lock().unwrap();
    if let Some(s) = status {
        Ok(db.update_task_status(&id, &s)?)
    } else {
        db.get_task(&id)
    }
}

#[tauri::command]
pub fn delete_task(state: State<'_, AppState>, id: String) -> AppResult<()> {
    info!("Deleting task: id={}", id);
    let mut db = state.db.lock().unwrap();
    db.delete_task(&id)?;
    drop(db);

    let scheduler = state.scheduler.lock().unwrap();
    let tasks_map = scheduler.tasks.clone();
    let app_handle = scheduler.app_handle.clone();
    drop(scheduler);

    std::thread::spawn(move || {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async move {
            let mut tasks = tasks_map.lock().await;
            if let Some(scheduled) = tasks.remove(&id) {
                let _ = scheduled.cancel_tx.send(true);
            }
            let _ = app_handle.emit("task-cancelled", serde_json::json!({ "id": id }));
        });
    });

    Ok(())
}

#[tauri::command]
pub fn cancel_task(state: State<'_, AppState>, id: String) -> AppResult<Task> {
    info!("Cancelling task: id={}", id);
    let mut db = state.db.lock().unwrap();
    let task = db.update_task_status(&id, "cancelled")?;
    drop(db);

    let scheduler = state.scheduler.lock().unwrap();
    let tasks_map = scheduler.tasks.clone();
    let app_handle = scheduler.app_handle.clone();
    drop(scheduler);

    let task_id = id.clone();
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

    Ok(task)
}

#[tauri::command]
pub fn execute_task_now(state: State<'_, AppState>, id: String) -> AppResult<Task> {
    let mut db = state.db.lock().unwrap();
    let task = db.get_task(&id)?;
    let task_clone = task.clone();

    let scheduler = state.scheduler.lock().unwrap();
    let app_handle = scheduler.app_handle.clone();
    let tasks_map = scheduler.tasks.clone();
    drop(scheduler);

    crate::scheduler::Scheduler::execute_task(
        &app_handle,
        &task.id,
        &task.task_type,
        &task.title,
        &task.payload,
    );

    std::thread::spawn(move || {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async move {
            let mut tasks = tasks_map.lock().await;
            if let Some(scheduled) = tasks.remove(&task_clone.id) {
                let _ = scheduled.cancel_tx.send(true);
            }
            let _ = app_handle.emit("task-completed", serde_json::json!({ "id": task_clone.id }));
        });
    });

    db.update_task_status(&id, "completed")
}
