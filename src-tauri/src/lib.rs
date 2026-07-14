mod commands;
mod db;
mod error;
mod models;
mod scheduler;
mod stopwatch;

use db::Database;
use scheduler::Scheduler;
use std::path::PathBuf;
use std::sync::Mutex;
use stopwatch::StopwatchState;
use tauri::Manager;
use tauri::WebviewWindowBuilder;

pub struct AppState {
    pub db: Mutex<Database>,
    pub scheduler: Mutex<Scheduler>,
    pub stopwatch: Mutex<StopwatchState>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            let exe_dir = std::env::current_exe()
                .ok()
                .and_then(|p| p.parent().map(|p| p.to_path_buf()))
                .unwrap_or_else(|| PathBuf::from("."));
            let webview_data_dir = exe_dir.join("webview_data");
            std::fs::create_dir_all(&webview_data_dir).ok();

            let _window =
                WebviewWindowBuilder::new(app, "main", tauri::WebviewUrl::App("index.html".into()))
                    .title("ClockForge")
                    .inner_size(900.0, 850.0)
                    .min_inner_size(700.0, 500.0)
                    .decorations(false)
                    .transparent(true)
                    .resizable(true)
                    .data_directory(webview_data_dir)
                    .build()?;

            let db = Database::new(app.handle())?;
            let scheduler = Scheduler::new(app.handle().clone());
            let stopwatch = StopwatchState::new();

            let app_state = AppState {
                db: Mutex::new(db),
                scheduler: Mutex::new(scheduler),
                stopwatch: Mutex::new(stopwatch),
            };

            let db_lock = app_state.db.lock().unwrap();
            let running_tasks = db_lock.get_all_tasks(Some("running"), None)?;
            drop(db_lock);

            let scheduler_lock = app_state.scheduler.lock().unwrap();
            for task in running_tasks {
                if let Some(scheduled_at) = &task.scheduled_at {
                    if let Ok(scheduled_time) = chrono::DateTime::parse_from_rfc3339(scheduled_at) {
                        let scheduled_time_utc = scheduled_time.with_timezone(&chrono::Utc);
                        let now = chrono::Utc::now();
                        if scheduled_time_utc > now {
                            let delay_seconds = (scheduled_time_utc - now).num_seconds() as u64;
                            tracing::info!(
                                "Restoring task: {} with {} seconds remaining",
                                task.id,
                                delay_seconds
                            );
                            scheduler_lock.start_task(task, delay_seconds);
                        } else {
                            tracing::warn!("Skipping expired task: {}", task.id);
                        }
                    }
                }
            }
            drop(scheduler_lock);

            app.manage(app_state);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_dashboard_stats,
            commands::get_all_tasks,
            commands::get_task_by_id,
            commands::create_task,
            commands::update_task,
            commands::delete_task,
            commands::cancel_task,
            commands::execute_task_now,
            commands::start_shutdown_timer,
            commands::stop_shutdown_timer,
            commands::start_notification_timer,
            commands::stop_notification_timer,
            commands::stopwatch_start,
            commands::stopwatch_pause,
            commands::stopwatch_resume,
            commands::stopwatch_reset,
            commands::stopwatch_lap,
            commands::stopwatch_get_state,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
