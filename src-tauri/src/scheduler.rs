use crate::models::Task;
use serde_json::{Value, json};
use std::collections::HashMap;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::sync::{Mutex, watch};
use tokio::time::{Duration, Instant, sleep};

pub struct Scheduler {
    pub app_handle: AppHandle,
    pub tasks: Arc<Mutex<HashMap<String, ScheduledTask>>>,
}

pub struct ScheduledTask {
    pub cancel_tx: watch::Sender<bool>,
}

impl Scheduler {
    pub fn new(app_handle: AppHandle) -> Self {
        Scheduler {
            app_handle,
            tasks: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    fn execute_shutdown() -> Result<(), String> {
        #[cfg(target_os = "windows")]
        {
            std::process::Command::new("shutdown")
                .args(["/s", "/t", "0"])
                .spawn()
                .map_err(|e| format!("Failed to spawn shutdown command: {}", e))?;
        }
        #[cfg(target_os = "macos")]
        {
            std::process::Command::new("sudo")
                .args(["shutdown", "-h", "now"])
                .spawn()
                .map_err(|e| format!("Failed to spawn shutdown command: {}", e))?;
        }
        #[cfg(target_os = "linux")]
        {
            std::process::Command::new("shutdown")
                .arg("-h")
                .arg("now")
                .spawn()
                .map_err(|e| format!("Failed to spawn shutdown command: {}", e))?;
        }
        Ok(())
    }

    fn execute_reboot() -> Result<(), String> {
        #[cfg(target_os = "windows")]
        {
            std::process::Command::new("shutdown")
                .args(["/r", "/t", "0"])
                .spawn()
                .map_err(|e| format!("Failed to spawn reboot command: {}", e))?;
        }
        #[cfg(target_os = "macos")]
        {
            std::process::Command::new("sudo")
                .args(["shutdown", "-r", "now"])
                .spawn()
                .map_err(|e| format!("Failed to spawn reboot command: {}", e))?;
        }
        #[cfg(target_os = "linux")]
        {
            std::process::Command::new("reboot")
                .spawn()
                .map_err(|e| format!("Failed to spawn reboot command: {}", e))?;
        }
        Ok(())
    }

    fn execute_sleep() -> Result<(), String> {
        #[cfg(target_os = "windows")]
        {
            std::process::Command::new("rundll32")
                .args(["powrprof.dll,SetSuspendState", "0,1,0"])
                .spawn()
                .map_err(|e| format!("Failed to spawn sleep command: {}", e))?;
        }
        #[cfg(target_os = "macos")]
        {
            std::process::Command::new("pmset")
                .arg("sleepnow")
                .spawn()
                .map_err(|e| format!("Failed to spawn sleep command: {}", e))?;
        }
        #[cfg(target_os = "linux")]
        {
            std::process::Command::new("systemctl")
                .arg("suspend")
                .spawn()
                .map_err(|e| format!("Failed to spawn suspend command: {}", e))?;
        }
        Ok(())
    }

    pub fn start_task(&self, task: Task, delay_seconds: u64) {
        let tasks_map = self.tasks.clone();
        let app_handle = self.app_handle.clone();

        std::thread::spawn(move || {
            let rt = tokio::runtime::Runtime::new().unwrap();
            rt.block_on(async move {
                let (cancel_tx, cancel_rx) = tokio::sync::watch::channel(false);
                {
                    let mut tasks = tasks_map.lock().await;
                    tasks.insert(task.id.clone(), ScheduledTask { cancel_tx });
                }
                Self::run_task(task, delay_seconds, tasks_map, app_handle, cancel_rx).await;
            });
        });
    }

    pub async fn run_task(
        task: Task,
        delay_seconds: u64,
        tasks_map: Arc<Mutex<HashMap<String, ScheduledTask>>>,
        app_handle: AppHandle,
        cancel_rx: watch::Receiver<bool>,
    ) {
        let task_id = task.id.clone();
        let task_type = task.task_type.clone();
        let title = task.title.clone();
        let payload = task.payload.clone();

        let start = Instant::now();
        let total_duration = Duration::from_secs(delay_seconds);
        let mut cancel_rx = cancel_rx;

        loop {
            let elapsed = start.elapsed();
            let remaining = total_duration.saturating_sub(elapsed);

            if *cancel_rx.borrow() {
                let _ = app_handle.emit("task-cancelled", json!({ "id": task_id }));
                break;
            }

            if remaining.as_secs() == 0 {
                Self::execute_task(&app_handle, &task_id, &task_type, &title, &payload);
                let mut tasks = tasks_map.lock().await;
                tasks.remove(&task_id);
                let _ = app_handle.emit("task-completed", json!({ "id": task_id }));
                break;
            }

            let _ = app_handle.emit(
                "timer-tick",
                json!({
                    "id": task_id,
                    "remaining_seconds": remaining.as_secs(),
                }),
            );

            tokio::select! {
                _ = sleep(Duration::from_secs(1)) => {},
                _ = cancel_rx.changed() => {
                    if *cancel_rx.borrow() {
                        let _ = app_handle.emit("task-cancelled", json!({ "id": task_id }));
                        break;
                    }
                }
            }
        }
    }

    pub fn execute_task(
        app_handle: &AppHandle,
        task_id: &str,
        task_type: &str,
        title: &str,
        payload: &Option<String>,
    ) {
        match task_type {
            "shutdown" => {
                let action = payload
                    .as_ref()
                    .and_then(|p| serde_json::from_str::<Value>(p).ok())
                    .and_then(|v| {
                        v.get("action")
                            .and_then(|a| a.as_str().map(|s| s.to_string()))
                    })
                    .unwrap_or_else(|| "shutdown".to_string());

                let execute_result = match action.as_str() {
                    "shutdown" => Self::execute_shutdown(),
                    "reboot" => Self::execute_reboot(),
                    "sleep" => Self::execute_sleep(),
                    _ => Ok(()),
                };

                match execute_result {
                    Ok(_) => {
                        let _ = app_handle.emit(
                            "task-triggered",
                            json!({
                                "id": task_id,
                                "type": "shutdown",
                                "title": title,
                                "success": true,
                            }),
                        );
                        tracing::info!("Shutdown action '{}' executed successfully", action);
                    }
                    Err(e) => {
                        let _ = app_handle.emit(
                            "task-triggered",
                            json!({
                                "id": task_id,
                                "type": "shutdown",
                                "title": title,
                                "success": false,
                                "error": e,
                            }),
                        );
                        tracing::error!("Failed to execute shutdown action '{}': {}", action, e);
                    }
                }
            }
            "notification" => {
                let body = payload
                    .as_ref()
                    .and_then(|p| serde_json::from_str::<Value>(p).ok())
                    .and_then(|v| {
                        v.get("body")
                            .and_then(|b| b.as_str().map(|s| s.to_string()))
                    })
                    .unwrap_or_else(|| "时间到了！".to_string());

                let _ = app_handle.emit(
                    "task-triggered",
                    json!({
                        "id": task_id,
                        "type": "notification",
                        "title": title,
                        "body": body,
                    }),
                );

                use tauri_plugin_notification::NotificationExt;
                let _ = app_handle
                    .notification()
                    .builder()
                    .title(title)
                    .body(&body)
                    .show();
            }
            _ => {}
        }
    }
}
