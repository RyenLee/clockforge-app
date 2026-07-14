import { useNavigationStore } from '../stores/navigationStore';

const pageTitles: Record<string, string> = {
  dashboard: '仪表盘',
  shutdown: '定时关机',
  notification: '定时通知',
  tasks: '任务列表',
  stopwatch: '计时器',
};

const pageIcons: Record<string, React.ReactNode> = {
  dashboard: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  shutdown: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.36 6.64A9 9 0 1 1 5.64 6.64" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  ),
  notification: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  tasks: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  stopwatch: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="13" x2="15" y2="13" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="17" y1="2" x2="15.5" y2="3.5" />
    </svg>
  ),
};

export function PageHeader() {
  const currentPage = useNavigationStore((s) => s.currentPage);

  return (
    <div
      className="flex items-center justify-between flex-shrink-0 px-5"
      style={{
        height: '48px',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            color: 'var(--color-primary)',
          }}
        >
          {pageIcons[currentPage]}
        </div>
        <h1 className="text-base font-semibold" style={{ color: 'var(--color-fg)' }}>
          {pageTitles[currentPage]}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-medium" style={{ color: 'var(--color-fg-tertiary)' }}>
          {new Date().toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', weekday: 'short' })}
        </span>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)',
            color: '#ffffff',
          }}
        >
          C
        </div>
      </div>
    </div>
  );
}
