import { useNavigationStore } from '../stores/navigationStore';
import type { PageType } from '../types';

const navItems: { key: PageType; icon: React.ReactNode; title: string }[] = [
  {
    key: 'dashboard',
    title: '仪表盘',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    key: 'shutdown',
    title: '定时关机',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18.36 6.64A9 9 0 1 1 5.64 6.64" />
        <line x1="12" y1="2" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    key: 'notification',
    title: '定时通知',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    key: 'tasks',
    title: '任务列表',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    key: 'stopwatch',
    title: '计时器',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="13" r="8" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="13" x2="15" y2="13" />
        <line x1="12" y1="2" x2="12" y2="5" />
        <line x1="17" y1="2" x2="15.5" y2="3.5" />
      </svg>
    ),
  },
];

export function IconNav() {
  const { currentPage, setPage } = useNavigationStore();

  return (
    <div
      className="flex flex-col items-center py-4 flex-shrink-0 relative"
      style={{
        width: '60px',
        backgroundColor: 'var(--color-bg-elevated)',
        borderRight: '1px solid var(--color-border)',
        zIndex: 100,
      }}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center mb-6"
        style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <polyline points="12 7 12 12 15.5 14" />
        </svg>
      </div>

      {navItems.map((item, index) => {
        const isActive = currentPage === item.key;
        return (
          <button
            key={item.key}
            onClick={() => setPage(item.key)}
            title={item.title}
            className="w-10 h-10 flex items-center justify-center rounded-xl mb-1.5 transition-all duration-200 cursor-pointer border-none relative group"
            style={{
              color: isActive ? '#ffffff' : 'var(--color-fg-tertiary)',
              backgroundColor: isActive 
                ? 'var(--color-primary)' 
                : 'transparent',
              boxShadow: isActive 
                ? '0 4px 12px rgba(99, 102, 241, 0.4)' 
                : 'none',
              animation: `fadeIn 0.3s ease ${index * 0.05}s both`,
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
                e.currentTarget.style.color = 'var(--color-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--color-fg-tertiary)';
              }
            }}
          >
            {item.icon}
            <span
              className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
              style={{
                backgroundColor: 'var(--color-fg)',
                color: 'var(--color-bg)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                transform: 'translateY(-2px)',
              }}
            >
              {item.title}
              <span
                className="absolute right-full top-1/2 -translate-y-1/2 w-2 h-2"
                style={{
                  borderTop: '5px solid transparent',
                  borderBottom: '5px solid transparent',
                  borderRight: '5px solid var(--color-fg)',
                }}
              />
            </span>
          </button>
        );
      })}

      <div className="flex-1" />

      <button
        title="设置"
        className="w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer border-none relative group"
        style={{ color: 'var(--color-fg-tertiary)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
          e.currentTarget.style.color = 'var(--color-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--color-fg-tertiary)';
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
        <span
          className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
          style={{
            backgroundColor: 'var(--color-fg)',
            color: 'var(--color-bg)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          设置
          <span
            className="absolute right-full top-1/2 -translate-y-1/2 w-2 h-2"
            style={{
              borderTop: '5px solid transparent',
              borderBottom: '5px solid transparent',
              borderRight: '5px solid var(--color-fg)',
            }}
          />
        </span>
      </button>
    </div>
  );
}
