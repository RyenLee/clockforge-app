import { useEffect } from 'react';
import { useNavigationStore } from '../stores/navigationStore';
import { useTaskStore } from '../stores/taskStore';

export function Dashboard() {
  const { stats, fetchStats, fetchTasks } = useTaskStore();
  const setPage = useNavigationStore((s) => s.setPage);

  useEffect(() => {
    fetchStats();
    fetchTasks();
  }, []);

  const runningCount = stats?.running ?? 0;
  const completedToday = stats?.completed_today ?? 0;
  const pendingCount = stats?.pending ?? 0;
  const cancelledCount = stats?.cancelled ?? 0;

  return (
    <div className="flex-1 overflow-auto p-5">
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          iconBg="rgba(99, 102, 241, 0.15)"
          iconColor="#6366f1"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18.36 6.64A9 9 0 1 1 5.64 6.64" />
              <line x1="12" y1="2" x2="12" y2="12" />
            </svg>
          }
          value={runningCount}
          label="运行中"
          trend="+12%"
          trendUp
        />
        <StatCard
          iconBg="rgba(34, 197, 94, 0.15)"
          iconColor="#22c55e"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
          value={completedToday}
          label="今日完成"
          trend="+8%"
          trendUp
        />
        <StatCard
          iconBg="rgba(245, 158, 11, 0.15)"
          iconColor="#f59e0b"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          value={pendingCount}
          label="等待执行"
          trend="-3%"
          trendUp={false}
        />
        <StatCard
          iconBg="rgba(239, 68, 68, 0.15)"
          iconColor="#ef4444"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          }
          value={cancelledCount}
          label="已取消"
          trend="+2%"
          trendUp={false}
        />
      </div>

      <div className="mb-6">
        <div className="text-[11px] font-semibold mb-3" style={{ color: 'var(--color-fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          当前任务
        </div>
        {stats?.recent_tasks && stats.recent_tasks.length > 0 ? (
          <div className="space-y-3">
            {stats.recent_tasks.slice(0, 3).map((task, index) => {
              const isActive = task.status === 'running' || task.status === 'pending';
              const dotColor = isActive ? '#6366f1' : 'var(--color-fg-tertiary)';
              const statusLabel = task.status === 'running' ? '运行中' : task.status === 'pending' ? '等待中' : task.status === 'completed' ? '已完成' : '已取消';
              const statusColor = task.status === 'running' || task.status === 'pending' ? '#22c55e' : task.status === 'cancelled' ? '#ef4444' : 'var(--color-fg-tertiary)';
              const statusBg = task.status === 'running' || task.status === 'pending' ? 'rgba(34, 197, 94, 0.1)' : task.status === 'cancelled' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(100, 116, 139, 0.1)';
              return (
                <div
                  key={task.id}
                  className="rounded-xl p-4 flex items-center justify-between transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    animation: `fadeIn 0.3s ease ${index * 0.1}s both`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border-light)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
                      {isActive && (
                        <div className="absolute inset-0 w-2 h-2 rounded-full" style={{ backgroundColor: dotColor, animation: 'pulse 1.5s ease-in-out infinite' }} />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium" style={{ color: 'var(--color-fg)' }}>{task.title}</div>
                      <div className="text-[11px]" style={{ color: 'var(--color-fg-tertiary)' }}>
                        {task.scheduled_at ? new Date(task.scheduled_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) + ' 触发' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full text-[11px] font-medium px-2.5 py-1" style={{ backgroundColor: statusBg, color: statusColor }}>
                      {statusLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 text-sm" style={{ color: 'var(--color-fg-tertiary)', backgroundColor: 'var(--color-bg-card)', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
            暂无任务，创建一个新任务开始吧
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <QuickActionCard
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18.36 6.64A9 9 0 1 1 5.64 6.64" />
              <line x1="12" y1="2" x2="12" y2="12" />
            </svg>
          }
          title="定时关机"
          description="设置系统定时关机、重启或休眠"
          onClick={() => setPage('shutdown')}
          gradient="from-indigo-500/20 to-purple-500/10"
        />
        <QuickActionCard
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          }
          title="定时通知"
          description="创建自定义提醒和通知"
          onClick={() => setPage('notification')}
          gradient="from-blue-500/20 to-cyan-500/10"
        />
      </div>
    </div>
  );
}

function StatCard({ icon, iconBg, iconColor, value, label, trend, trendUp }: { icon: React.ReactNode; iconBg: string; iconColor: string; value: number; label: string; trend: string; trendUp: boolean }) {
  return (
    <div
      className="rounded-xl p-4 transition-all duration-200"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border-light)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: iconBg, color: iconColor }}>
          {icon}
        </div>
        <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded`} style={{ color: trendUp ? '#22c55e' : '#ef4444', backgroundColor: trendUp ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}>
          {trend}
        </span>
      </div>
      <div>
        <div className="text-2xl font-bold" style={{ color: 'var(--color-fg)' }}>{value}</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--color-fg-tertiary)' }}>{label}</div>
      </div>
    </div>
  );
}

function QuickActionCard({ icon, title, description, onClick, gradient }: { icon: React.ReactNode; title: string; description: string; onClick: () => void; gradient: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl p-5 flex items-start gap-4 transition-all duration-200 text-left border-none cursor-pointer group"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        background: `linear-gradient(135deg, ${gradient})`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-primary)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold" style={{ color: 'var(--color-fg)' }}>{title}</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--color-fg-tertiary)' }}>{description}</div>
      </div>
      <svg className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="var(--color-fg-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );
}
