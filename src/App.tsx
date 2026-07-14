import { TitleBar } from './components/TitleBar';
import { IconNav } from './components/IconNav';
import { PageHeader } from './components/PageHeader';
import { Dashboard, ShutdownTimer, NotificationTimer, TaskList, Stopwatch } from './pages';
import { useNavigationStore } from './stores/navigationStore';
import { useEffect, useState } from 'react';

interface Toast {
  id: number;
  title: string;
  body: string;
  type: 'success' | 'error' | 'info';
}

function App() {
  const currentPage = useNavigationStore((s) => s.currentPage);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (title: string, body: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, body, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  useEffect(() => {
    const handleTaskTriggered = (event: Event) => {
    const payload = (event as CustomEvent).detail || {};
    console.log('Task triggered:', payload);
    if (payload.type === 'notification') {
      showToast(payload.title || '定时通知', payload.body || '时间到了！', 'success');
    } else if (payload.type === 'shutdown') {
      if (payload.success === false) {
        showToast('操作失败', payload.error || '执行系统命令时发生错误', 'error');
      } else {
        const actionNames: Record<string, string> = {
          shutdown: '关机',
          reboot: '重启',
          sleep: '休眠',
        };
        const actionName = actionNames[payload.action] || '系统操作';
        showToast(payload.title || actionName, `即将${actionName}...`, 'info');
      }
    }
  };

    const setupListeners = async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event');
        await listen('timer-tick', () => { });
        await listen('task-triggered', (event) => {
          handleTaskTriggered({ detail: event.payload } as CustomEvent);
        });
        await listen('task-completed', () => { });
        await listen('task-cancelled', () => { });
      } catch {
        console.log('Tauri event listeners not available in browser');
      }
    };

    window.addEventListener('task-triggered', handleTaskTriggered);
    setupListeners();

    return () => {
      window.removeEventListener('task-triggered', handleTaskTriggered);
    };
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'shutdown':
        return <ShutdownTimer />;
      case 'notification':
        return <NotificationTimer />;
      case 'tasks':
        return <TaskList />;
      case 'stopwatch':
        return <Stopwatch />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{
        backgroundColor: 'var(--color-bg)',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
      }}
    >
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <IconNav />
        <div className="flex-1 flex flex-col overflow-hidden">
          <PageHeader />
          {renderPage()}
        </div>
      </div>

      <div className="fixed top-16 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="rounded-xl px-4 py-3 shadow-lg border-l-4 min-w-[280px] animate-[slideInRight_0.3s_ease]"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              borderColor:
                toast.type === 'success'
                  ? 'var(--color-success)'
                  : toast.type === 'error'
                  ? 'var(--color-error)'
                  : 'var(--color-primary)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor:
                    toast.type === 'success'
                      ? 'rgba(34, 197, 94, 0.1)'
                      : toast.type === 'error'
                      ? 'rgba(239, 68, 68, 0.1)'
                      : 'rgba(99, 102, 241, 0.1)',
                }}
              >
                {toast.type === 'success' && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {toast.type === 'error' && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                )}
                {toast.type === 'info' && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-fg)' }}>
                  {toast.title}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-fg-secondary)' }}>
                  {toast.body}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
