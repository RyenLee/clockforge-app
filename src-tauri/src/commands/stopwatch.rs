use tauri::State;
use crate::{AppState, models::*};
use crate::error::AppResult;

#[tauri::command]
pub fn stopwatch_start(
    state: State<'_, AppState>,
    mode: String,
    duration_ms: Option<u64>,
) -> AppResult<()> {
    let stopwatch = state.stopwatch.lock().unwrap();
    let mut db = state.db.lock().unwrap();
    db.clear_lap_records(&mode)?;
    stopwatch.start(&mode, duration_ms);
    Ok(())
}

#[tauri::command]
pub fn stopwatch_pause(state: State<'_, AppState>) -> AppResult<()> {
    let stopwatch = state.stopwatch.lock().unwrap();
    stopwatch.pause();
    Ok(())
}

#[tauri::command]
pub fn stopwatch_resume(state: State<'_, AppState>) -> AppResult<()> {
    let stopwatch = state.stopwatch.lock().unwrap();
    stopwatch.resume();
    Ok(())
}

#[tauri::command]
pub fn stopwatch_reset(state: State<'_, AppState>) -> AppResult<()> {
    let stopwatch = state.stopwatch.lock().unwrap();
    let mode = stopwatch.get_state().mode;
    let mut db = state.db.lock().unwrap();
    db.clear_lap_records(&mode)?;
    stopwatch.reset();
    Ok(())
}

#[tauri::command]
pub fn stopwatch_lap(state: State<'_, AppState>) -> AppResult<Option<LapRecord>> {
    let stopwatch = state.stopwatch.lock().unwrap();
    let record = stopwatch.lap();

    if let Some(ref lap) = record {
        let mut db = state.db.lock().unwrap();
        let _ = db.add_lap_record(&lap.timer_id, lap.lap_time_ms);
    }

    Ok(record)
}

#[tauri::command]
pub fn stopwatch_get_state(state: State<'_, AppState>) -> AppResult<StopwatchStateData> {
    let stopwatch = state.stopwatch.lock().unwrap();
    Ok(stopwatch.get_state())
}
