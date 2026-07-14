use crate::error::AppResult;
use crate::models::{LapRecord, Task};
use chrono::Utc;
use rusqlite::Connection;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use tracing::{info, warn};
use uuid::Uuid;

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(app_handle: &AppHandle) -> AppResult<Self> {
        let db_path = Self::resolve_db_path(app_handle);
        info!("Opening database at: {}", db_path.display());

        let conn = Connection::open(&db_path)?;
        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;

        info!("Running database migrations");
        Self::run_migrations(&conn)?;

        Ok(Database { conn })
    }

    fn resolve_db_path(app_handle: &AppHandle) -> PathBuf {
        let exe_dir = std::env::current_exe()
            .ok()
            .and_then(|p| p.parent().map(|p| p.to_path_buf()))
            .unwrap_or_else(|| PathBuf::from("."));
        let exe_db_path = exe_dir.join("clockforge.db");

        if Self::can_write_to_path(&exe_db_path) {
            Self::migrate_from_old_location(app_handle, &exe_db_path);
            return exe_db_path;
        }

        warn!("Cannot write to exe directory, falling back to app_data_dir");
        let app_data_dir = app_handle
            .path()
            .app_data_dir()
            .expect("failed to get app data dir");
        std::fs::create_dir_all(&app_data_dir).ok();
        app_data_dir.join("clockforge.db")
    }

    fn can_write_to_path(path: &PathBuf) -> bool {
        if path.exists() {
            return std::fs::metadata(path).map(|m| m.permissions().readonly()).map_or(false, |r| !r);
        }
        if let Some(parent) = path.parent() {
            return std::fs::create_dir_all(parent).is_ok() && std::fs::write(path, "").is_ok();
        }
        false
    }

    fn migrate_from_old_location(app_handle: &AppHandle, new_path: &PathBuf) {
        if new_path.exists() {
            return;
        }

        let old_data_dir = app_handle.path().app_data_dir();
        if let Ok(old_dir) = old_data_dir {
            let old_path = old_dir.join("clockforge.db");
            if old_path.exists() {
                info!("Migrating database from old location: {}", old_path.display());
                if let Err(e) = std::fs::copy(&old_path, new_path) {
                    warn!("Failed to migrate database: {}", e);
                } else {
                    info!("Database migrated successfully");
                }
            }
        }
    }

    fn run_migrations(conn: &Connection) -> AppResult<()> {
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS tasks (
                id         TEXT PRIMARY KEY,
                title      TEXT NOT NULL,
                task_type  TEXT NOT NULL,
                status     TEXT NOT NULL DEFAULT 'pending',
                payload    TEXT,
                scheduled_at TEXT,
                cron_expr  TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                executed_at TEXT
            );
            CREATE TABLE IF NOT EXISTS lap_records (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                timer_id     TEXT NOT NULL,
                lap_time_ms  INTEGER NOT NULL,
                recorded_at  TEXT NOT NULL DEFAULT (datetime('now'))
            );",
        )?;
        Ok(())
    }

    pub fn create_task(
        &mut self,
        title: &str,
        task_type: &str,
        payload: Option<&str>,
        scheduled_at: Option<&str>,
        cron_expr: Option<&str>,
    ) -> AppResult<Task> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        info!(
            "Creating task: id={}, title={}, type={}",
            id, title, task_type
        );
        self.conn.execute(
            "INSERT INTO tasks (id, title, task_type, status, payload, scheduled_at, cron_expr, created_at, updated_at) 
             VALUES (?1, ?2, ?3, 'pending', ?4, ?5, ?6, ?7, ?7)",
            rusqlite::params![id, title, task_type, payload, scheduled_at, cron_expr, now],
        )?;

        self.get_task(&id)
    }

    pub fn get_task(&self, id: &str) -> AppResult<Task> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, task_type, status, payload, scheduled_at, cron_expr, created_at, updated_at, executed_at 
             FROM tasks WHERE id = ?1"
        )?;

        let task = stmt.query_row(rusqlite::params![id], |row| {
            Ok(Task {
                id: row.get(0)?,
                title: row.get(1)?,
                task_type: row.get(2)?,
                status: row.get(3)?,
                payload: row.get(4)?,
                scheduled_at: row.get(5)?,
                cron_expr: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
                executed_at: row.get(9)?,
            })
        })?;

        Ok(task)
    }

    pub fn get_all_tasks(
        &self,
        status_filter: Option<&str>,
        type_filter: Option<&str>,
    ) -> AppResult<Vec<Task>> {
        let mut query = "SELECT id, title, task_type, status, payload, scheduled_at, cron_expr, created_at, updated_at, executed_at FROM tasks WHERE 1=1".to_string();
        let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(status) = status_filter {
            query += " AND status = ?";
            params.push(Box::new(status.to_string()));
        }
        if let Some(task_type) = type_filter {
            query += " AND task_type = ?";
            params.push(Box::new(task_type.to_string()));
        }
        query += " ORDER BY created_at DESC";

        let mut stmt = self.conn.prepare(&query)?;
        let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();

        let tasks = stmt.query_map(param_refs.as_slice(), |row| {
            Ok(Task {
                id: row.get(0)?,
                title: row.get(1)?,
                task_type: row.get(2)?,
                status: row.get(3)?,
                payload: row.get(4)?,
                scheduled_at: row.get(5)?,
                cron_expr: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
                executed_at: row.get(9)?,
            })
        })?;

        let mut result = Vec::new();
        for task in tasks {
            result.push(task?);
        }

        Ok(result)
    }

    pub fn update_task_status(&mut self, id: &str, status: &str) -> AppResult<Task> {
        info!("Updating task status: id={}, status={}", id, status);
        let now = Utc::now().to_rfc3339();
        let executed_at = if status == "completed" {
            Some(now.as_str())
        } else {
            None
        };

        if executed_at.is_some() {
            self.conn.execute(
                "UPDATE tasks SET status = ?1, updated_at = ?2, executed_at = ?3 WHERE id = ?4",
                rusqlite::params![status, now, executed_at, id],
            )?;
        } else {
            self.conn.execute(
                "UPDATE tasks SET status = ?1, updated_at = ?2 WHERE id = ?3",
                rusqlite::params![status, now, id],
            )?;
        }

        self.get_task(id)
    }

    pub fn delete_task(&mut self, id: &str) -> AppResult<()> {
        self.conn
            .execute("DELETE FROM tasks WHERE id = ?1", rusqlite::params![id])?;
        Ok(())
    }

    pub fn count_tasks_by_status(&self, status: &str) -> AppResult<i64> {
        let mut stmt = self
            .conn
            .prepare("SELECT COUNT(*) FROM tasks WHERE status = ?1")?;
        let count: i64 = stmt.query_row(rusqlite::params![status], |row| row.get(0))?;
        Ok(count)
    }

    pub fn count_completed_today(&self) -> AppResult<i64> {
        let today = Utc::now().format("%Y-%m-%d").to_string();
        let pattern = format!("{}%", today);
        let mut stmt = self.conn.prepare(
            "SELECT COUNT(*) FROM tasks WHERE status = 'completed' AND executed_at LIKE ?1",
        )?;
        let count: i64 = stmt.query_row(rusqlite::params![pattern], |row| row.get(0))?;
        Ok(count)
    }

    pub fn get_recent_tasks(&self, limit: i64) -> AppResult<Vec<Task>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, task_type, status, payload, scheduled_at, cron_expr, created_at, updated_at, executed_at 
             FROM tasks ORDER BY created_at DESC LIMIT ?1"
        )?;

        let tasks = stmt.query_map(rusqlite::params![limit], |row| {
            Ok(Task {
                id: row.get(0)?,
                title: row.get(1)?,
                task_type: row.get(2)?,
                status: row.get(3)?,
                payload: row.get(4)?,
                scheduled_at: row.get(5)?,
                cron_expr: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
                executed_at: row.get(9)?,
            })
        })?;

        let mut result = Vec::new();
        for task in tasks {
            result.push(task?);
        }

        Ok(result)
    }

    pub fn add_lap_record(&mut self, timer_id: &str, lap_time_ms: u64) -> AppResult<LapRecord> {
        let now = Utc::now().to_rfc3339();
        self.conn.execute(
            "INSERT INTO lap_records (timer_id, lap_time_ms, recorded_at) VALUES (?1, ?2, ?3)",
            rusqlite::params![timer_id, lap_time_ms as i64, now],
        )?;

        let id = self.conn.last_insert_rowid();
        Ok(LapRecord {
            id: Some(id),
            timer_id: timer_id.to_string(),
            lap_time_ms,
            recorded_at: now,
        })
    }

    pub fn get_lap_records(&self, timer_id: &str) -> AppResult<Vec<LapRecord>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, timer_id, lap_time_ms, recorded_at FROM lap_records WHERE timer_id = ?1 ORDER BY id ASC"
        )?;

        let records = stmt.query_map(rusqlite::params![timer_id], |row| {
            Ok(LapRecord {
                id: Some(row.get(0)?),
                timer_id: row.get(1)?,
                lap_time_ms: row.get::<_, i64>(2)? as u64,
                recorded_at: row.get(3)?,
            })
        })?;

        let mut result = Vec::new();
        for record in records {
            result.push(record?);
        }

        Ok(result)
    }

    pub fn clear_lap_records(&mut self, timer_id: &str) -> AppResult<()> {
        self.conn.execute(
            "DELETE FROM lap_records WHERE timer_id = ?1",
            rusqlite::params![timer_id],
        )?;
        Ok(())
    }
}
