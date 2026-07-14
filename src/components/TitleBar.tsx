import { getCurrentWindow } from '@tauri-apps/api/window';

export function TitleBar() {
  const getAppWindow = () => {
    try {
      return getCurrentWindow();
    } catch {
      return null;
    }
  };

  const appWindow = getAppWindow();

  const handleMinimize = () => appWindow?.minimize().catch(() => {});
  const handleMaximize = () => appWindow?.toggleMaximize().catch(() => {});
  const handleClose = () => appWindow?.close().catch(() => {});

  return (
    <div
      data-tauri-drag-region
      className="flex items-center justify-between h-10 px-4 flex-shrink-0 select-none"
      style={{
        backgroundColor: 'var(--color-bg-elevated)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center gap-2" data-tauri-drag-region>
        <div className="flex items-center gap-2 mr-3">
          <div
            className="traffic-light"
            style={{ backgroundColor: '#ef4444' }}
            onClick={handleClose}
            onMouseDown={(e) => e.stopPropagation()}
          />
          <div
            className="traffic-light"
            style={{ backgroundColor: '#f59e0b' }}
            onClick={handleMinimize}
            onMouseDown={(e) => e.stopPropagation()}
          />
          <div
            className="traffic-light"
            style={{ backgroundColor: '#22c55e' }}
            onClick={handleMaximize}
            onMouseDown={(e) => e.stopPropagation()}
          />
        </div>
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 7 12 12 15.5 14" />
          </svg>
        </div>
        <span className="text-xs font-semibold tracking-tight" style={{ color: 'var(--color-fg)' }}>
          ClockForge
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium" style={{ color: 'var(--color-fg-tertiary)' }}>
          v1.0.0
        </span>
      </div>
    </div>
  );
}
