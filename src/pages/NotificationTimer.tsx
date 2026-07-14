import { useState, useEffect } from 'react';
import { useTaskStore } from '../stores/taskStore';
import { formatTime } from '../utils';

type PresetTime = 5 | 10 | 30 | 60 | 120;

export function NotificationTimer() {
  const { startNotificationTimer, cancelTask, tasks, fetchTasks } = useTaskStore();
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [message, setMessage] = useState('');
  const [activeTimerId, setActiveTimerId] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const [totalMs, setTotalMs] = useState(0);

  const runningTask = tasks.find((t) => t.task_type === 'notification' && t.status === 'running');

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (runningTask) {
      setActiveTimerId(runningTask.id);
      const scheduledAt = runningTask.scheduled_at ? new Date(runningTask.scheduled_at).getTime() : Date.now();
      const createdAt = runningTask.created_at ? new Date(runningTask.created_at).getTime() : Date.now();
      const total = scheduledAt - createdAt;
      setTotalMs(total);
      const updateRemaining = () => {
        const now = Date.now();
        const remaining = Math.max(0, scheduledAt - now);
        setRemainingMs(remaining);
      };
      updateRemaining();
      const interval = setInterval(updateRemaining, 1000);
      return () => clearInterval(interval);
    } else {
      setActiveTimerId(null);
      setRemainingMs(0);
      setTotalMs(0);
    }
  }, [runningTask]);

  const applyPreset = (minutesVal: PresetTime) => {
    setHours(Math.floor(minutesVal / 60));
    setMinutes(minutesVal % 60);
    setSeconds(0);
  };

  const handleStart = async () => {
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    if (totalSeconds > 0) {
      try {
        await startNotificationTimer('定时通知', message || '时间到了', totalSeconds);
      } catch (err) {
        console.error('Failed to start notification timer:', err);
      }
    }
  };

  const handleCancel = async () => {
    if (activeTimerId) {
      await cancelTask(activeTimerId);
    }
  };

  const displayMs = activeTimerId ? remainingMs : (hours * 3600 + minutes * 60 + seconds) * 1000;
  const isRunning = !!activeTimerId;

  return (
    <div className="flex-1 overflow-auto p-5">
      <div style={{ maxWidth: '460px', margin: '0 auto' }}>
        <div className="text-center" style={{ marginTop: '32px', marginBottom: '32px' }}>
          <p className="font-mono font-bold" style={{ fontSize: '56px', color: 'var(--color-fg)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            {formatTime(displayMs, false)}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--color-fg-tertiary)', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>时 : 分 : 秒</p>
          {isRunning && (
            <div style={{ margin: '16px auto 0', maxWidth: '360px', height: '6px', backgroundColor: 'var(--color-bg-sunken)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--color-success) 0%, var(--color-success-light) 100%)', borderRadius: '9999px', transition: 'width 1s linear', width: `${totalMs > 0 ? Math.max(0, Math.min(100, (remainingMs / totalMs) * 100)) : 0}%`, boxShadow: '0 0 10px var(--color-success)' }} />
            </div>
          )}
        </div>

        <div style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>快速设定</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {([5, 10, 30, 60, 120] as PresetTime[]).map((m) => {
              const isActive = hours * 60 + minutes === m && seconds === 0;
              const label = m >= 60 ? `${m / 60}小时` : `${m}分钟`;
              return (
                <button key={m} onClick={() => !isRunning && applyPreset(m)} disabled={isRunning} style={{ border: isActive ? 'none' : '1px solid var(--color-border)', borderRadius: '9999px', padding: '0 20px', height: '32px', fontSize: '12px', fontWeight: 500, color: isActive ? '#ffffff' : 'var(--color-fg-secondary)', background: isActive ? 'linear-gradient(135deg, var(--color-success) 0%, var(--color-success-light) 100%)' : 'transparent', cursor: isRunning ? 'default' : 'pointer', transition: 'all 200ms' }} onMouseEnter={(e) => { if (!isActive && !isRunning) e.currentTarget.style.backgroundColor = 'var(--color-bg-sunken)'; }} onMouseLeave={(e) => { if (!isActive && !isRunning) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>自定义时间</p>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '12px' }}>
            <TimeInput label="时" value={hours} onChange={setHours} max={23} disabled={isRunning} />
            <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-fg-tertiary)', fontFamily: 'var(--font-mono)', paddingTop: '20px' }}>:</span>
            <TimeInput label="分" value={minutes} onChange={setMinutes} max={59} disabled={isRunning} />
            <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-fg-tertiary)', fontFamily: 'var(--font-mono)', paddingTop: '20px' }}>:</span>
            <TimeInput label="秒" value={seconds} onChange={setSeconds} max={59} disabled={isRunning} />
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>通知内容</p>
          <textarea value={message} onChange={(e) => !isRunning && setMessage(e.target.value)} disabled={isRunning} placeholder="输入通知内容（可选）" rows={3} style={{ width: '100%', resize: 'none', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '14px 16px', fontSize: '14px', fontWeight: 400, color: 'var(--color-fg)', outline: 'none', transition: 'all 200ms', backgroundColor: isRunning ? 'var(--color-bg-sunken)' : 'var(--color-bg-elevated)', fontFamily: 'inherit', lineHeight: 1.5 }} onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-success)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)'; }} onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }} />
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '8px' }}>
          {!isRunning ? (
            <button onClick={handleStart} style={{ background: 'linear-gradient(135deg, var(--color-success) 0%, var(--color-success-light) 100%)', color: '#ffffff', border: 'none', borderRadius: '12px', padding: '0 32px', height: '40px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 200ms', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(34, 197, 94, 0.5)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.4)'; }}>
              开始计时
            </button>
          ) : (
            <button onClick={handleCancel} style={{ background: 'linear-gradient(135deg, var(--color-error) 0%, #dc2626 100%)', color: '#ffffff', border: 'none', borderRadius: '12px', padding: '0 32px', height: '40px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 200ms', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.5)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)'; }}>
              取消
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TimeInput({ label, value, onChange, max, disabled }: { label: string; value: number; onChange: (v: number) => void; max: number; disabled?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <span style={{ fontSize: '10px', color: 'var(--color-fg-tertiary)', fontWeight: 500 }}>{label}</span>
      <input type="number" min={0} max={max} value={value.toString().padStart(2, '0')} onChange={(e) => { const v = parseInt(e.target.value) || 0; onChange(Math.min(max, Math.max(0, v))); }} disabled={disabled} style={{ width: '72px', height: '40px', border: '1px solid var(--color-border)', borderRadius: '10px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 600, color: 'var(--color-fg)', outline: 'none', transition: 'all 200ms', backgroundColor: disabled ? 'var(--color-bg-sunken)' : 'var(--color-bg-elevated)' }} onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-success)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)'; }} onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }} />
    </div>
  );
}
