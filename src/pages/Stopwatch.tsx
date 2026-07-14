import { useState, useEffect } from 'react';
import { useStopwatchStore } from '../stores/stopwatchStore';
import { formatTime } from '../utils';

type StopwatchMode = 'stopwatch' | 'countdown';

export function Stopwatch() {
  const { state, displayMs, start, pause, resume, reset, lap, fetchState, startTicking, stopTicking } =
    useStopwatchStore();
  const [mode, setMode] = useState<StopwatchMode>('stopwatch');
  const [cdHours, setCdHours] = useState(0);
  const [cdMinutes, setCdMinutes] = useState(5);
  const [cdSeconds, setCdSeconds] = useState(0);

  useEffect(() => {
    fetchState();
    return () => stopTicking();
  }, []);

  useEffect(() => {
    if (state?.status === 'running') {
      startTicking();
    }
  }, [state?.status]);

  const handleStart = async () => {
    try {
      if (mode === 'stopwatch') {
        await start('stopwatch');
      } else {
        const ms = (cdHours * 3600 + cdMinutes * 60 + cdSeconds) * 1000;
        if (ms > 0) {
          await start('countdown', ms);
        }
      }
    } catch (err) {
      console.error('Failed to start stopwatch:', err);
    }
  };

  const handlePauseResume = () => {
    if (state?.status === 'running') {
      pause();
    } else if (state?.status === 'paused') {
      resume();
    }
  };

  const handleReset = () => {
    reset();
  };

  const handleLap = () => {
    lap();
  };

  const isIdle = state?.status === 'idle' || !state;
  const isRunning = state?.status === 'running';
  const isPaused = state?.status === 'paused';
  const currentMode = isIdle ? mode : (state?.mode || mode);

  const displayTime = isIdle
    ? mode === 'stopwatch'
      ? 0
      : (cdHours * 3600 + cdMinutes * 60 + cdSeconds) * 1000
    : displayMs;

  const timeStr = formatTime(displayTime, true);
  const mainTime = timeStr.slice(0, -3);
  const centisTime = timeStr.slice(-2);

  const laps = state?.laps || [];

  return (
    <div className="flex-1 overflow-auto p-5">
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--color-bg-elevated)', borderRadius: '10px', padding: '3px', border: '1px solid var(--color-border)' }}>
            {(['stopwatch', 'countdown'] as StopwatchMode[]).map((m) => (
              <button
                key={m}
                onClick={() => isIdle && setMode(m)}
                disabled={!isIdle}
                style={{
                  borderRadius: '8px',
                  padding: '8px 24px',
                  fontSize: '13px',
                  fontWeight: 500,
                  border: 'none',
                  cursor: isIdle ? 'pointer' : 'default',
                  transition: 'all 200ms',
                  backgroundColor: currentMode === m 
                    ? 'var(--color-primary)' 
                    : 'transparent',
                  color: currentMode === m 
                    ? '#ffffff' 
                    : 'var(--color-fg-secondary)',
                }}
              >
                {m === 'stopwatch' ? '秒表' : '倒计时'}
              </button>
            ))}
          </div>
        </div>

        {isIdle && mode === 'countdown' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
            <CdInput value={cdHours} onChange={setCdHours} max={23} />
            <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-fg-tertiary)', fontFamily: 'var(--font-mono)' }}>:</span>
            <CdInput value={cdMinutes} onChange={setCdMinutes} max={59} />
            <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-fg-tertiary)', fontFamily: 'var(--font-mono)' }}>:</span>
            <CdInput value={cdSeconds} onChange={setCdSeconds} max={59} />
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '16px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
            <span className="font-mono font-bold" style={{ fontSize: '56px', color: 'var(--color-fg)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {mainTime}
            </span>
            <span className="font-mono font-bold" style={{ fontSize: '32px', color: 'var(--color-fg-tertiary)', letterSpacing: '0.02em' }}>
              .{centisTime}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '32px' }}>
          <button
            onClick={handleReset}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--color-border)',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              transition: 'all 200ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-sunken)';
              e.currentTarget.style.borderColor = 'var(--color-border-light)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'var(--color-border)';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-fg-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>

          {isIdle ? (
            <button
              onClick={handleStart}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 200ms',
                background: 'linear-gradient(135deg, var(--color-success) 0%, var(--color-success-light) 100%)',
                boxShadow: '0 4px 14px rgba(34, 197, 94, 0.4)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(34, 197, 94, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(34, 197, 94, 0.4)';
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#ffffff" stroke="none">
                <polygon points="6,3 20,12 6,21" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handlePauseResume}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 200ms',
                background: isRunning 
                  ? 'linear-gradient(135deg, var(--color-warning) 0%, #d97706 100%)'
                  : 'linear-gradient(135deg, var(--color-success) 0%, var(--color-success-light) 100%)',
                boxShadow: isRunning 
                  ? '0 4px 14px rgba(234, 179, 8, 0.4)'
                  : '0 4px 14px rgba(34, 197, 94, 0.4)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {isRunning ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#ffffff" stroke="none">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#ffffff" stroke="none">
                  <polygon points="6,3 20,12 6,21" />
                </svg>
              )}
            </button>
          )}

          {currentMode === 'stopwatch' && (isRunning || isPaused) && (
            <button
              onClick={handleLap}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--color-primary)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                cursor: 'pointer',
                transition: 'all 200ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          )}
        </div>

        {currentMode === 'stopwatch' && laps.length > 0 && (
          <div style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', backgroundColor: 'var(--color-bg-elevated)' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-fg-tertiary)' }}>计次</span>
              <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-fg-tertiary)' }}>
                共 {laps.length} 次
              </span>
            </div>
            <div style={{ maxHeight: '240px', overflowY: 'auto', scrollBehavior: 'smooth' }} className="no-scrollbar">
              {laps.map((lap, idx) => {
                const prevLap = idx > 0 ? laps[idx - 1].lap_time_ms : 0;
                const diff = lap.lap_time_ms - prevLap;
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderBottom: idx < laps.length - 1 ? '1px solid var(--color-border)' : 'none',
                      transition: 'background-color 200ms',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span style={{ fontSize: '12px', color: 'var(--color-fg-tertiary)' }}>
                      #{idx + 1}
                    </span>
                    <span className="font-mono" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-fg)' }}>
                      {formatTime(lap.lap_time_ms, true)}
                    </span>
                    <span className="font-mono" style={{ fontSize: '12px', color: diff >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                      {diff >= 0 ? '+' : ''}{formatTime(Math.abs(diff), true)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Space 开始/暂停 · R 重置 · L 计次
          </span>
        </div>
      </div>
    </div>
  );
}

function CdInput({ value, onChange, max }: { value: number; onChange: (v: number) => void; max: number }) {
  return (
    <input
      type="number"
      min={0}
      max={max}
      value={value.toString().padStart(2, '0')}
      onChange={(e) => {
        const v = parseInt(e.target.value) || 0;
        onChange(Math.min(max, Math.max(0, v)));
      }}
      style={{
        width: '72px',
        height: '44px',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        textAlign: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: '20px',
        fontWeight: 600,
        color: 'var(--color-fg)',
        outline: 'none',
        transition: 'all 200ms',
        backgroundColor: 'var(--color-bg-elevated)',
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-primary)';
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    />
  );
}
