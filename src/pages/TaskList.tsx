import { useState, useEffect } from 'react';
import { useTaskStore } from '../stores/taskStore';
import { getStatusLabel, getTypeLabel } from '../utils';

type FilterType = 'all' | 'running' | 'pending' | 'completed';

export function TaskList() {
  const { tasks, loading, fetchTasks, deleteTask, cancelTask, setFilter } = useTaskStore();
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    const statusMap: Record<FilterType, string | undefined> = {
      all: undefined,
      running: 'running',
      pending: 'pending',
      completed: 'completed',
    };
    setFilter({ status: statusMap[currentFilter] });
  }, [currentFilter]);

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    await deleteTask(id);
  };

  const handleCancel = async (id: string) => {
    await cancelTask(id);
  };

  const filterOptions: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'running', label: '运行中' },
    { key: 'pending', label: '等待中' },
    { key: 'completed', label: '已完成' },
  ];

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'running': return 'var(--color-success)';
      case 'pending': return 'var(--color-warning)';
      case 'completed': return 'var(--color-fg-tertiary)';
      case 'cancelled': return 'var(--color-error)';
      default: return 'var(--color-fg-tertiary)';
    }
  };

  return (
    <div className="flex-1 overflow-auto p-5">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--color-bg-elevated)', borderRadius: '12px', padding: '4px', border: '1px solid var(--color-border)' }}>
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setCurrentFilter(opt.key)}
              style={{
                borderRadius: '10px',
                padding: '6px 16px',
                fontSize: '12px',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 200ms',
                backgroundColor: currentFilter === opt.key 
                  ? 'var(--color-primary)' 
                  : 'transparent',
                color: currentFilter === opt.key 
                  ? '#ffffff' 
                  : 'var(--color-fg-secondary)',
              }}
              onMouseEnter={(e) => {
                if (currentFilter !== opt.key) {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-sunken)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentFilter !== opt.key) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative' }}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-fg-tertiary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="搜索任务..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '180px',
              height: '32px',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
              paddingLeft: '32px',
              paddingRight: '12px',
              fontSize: '13px',
              fontWeight: 400,
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
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '14px', overflow: 'hidden' }}>
        {filteredTasks.length === 0 ? (
          <div style={{ height: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-bg-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-fg-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-fg-tertiary)' }}>
              {loading ? '加载中...' : '暂无任务'}
            </p>
          </div>
        ) : (
          <div style={{ maxHeight: '360px', overflowY: 'auto', scrollBehavior: 'smooth' }} className="no-scrollbar">
            {filteredTasks.map((task, idx) => {
              const status = getStatusLabel(task.status);
              return (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '14px 16px',
                    borderBottom: idx < filteredTasks.length - 1 ? '1px solid var(--color-border)' : 'none',
                    cursor: 'default',
                    transition: 'background-color 200ms',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', marginRight: '12px', backgroundColor: getStatusDotColor(task.status) }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {task.title}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--color-fg-tertiary)', marginTop: '2px' }}>
                      {getTypeLabel(task.task_type)}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', marginRight: '16px', minWidth: '90px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 500, fontFamily: 'var(--font-mono)', color: 'var(--color-fg-secondary)' }}>
                      {task.scheduled_at
                        ? new Date(task.scheduled_at).toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </p>
                  </div>
                  <div style={{ marginRight: '12px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 500,
                        backgroundColor: status.bg,
                        color: status.color,
                      }}
                    >
                      {status.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {(task.status === 'running' || task.status === 'pending') && (
                      <button
                        onClick={() => handleCancel(task.id)}
                        title="取消"
                        style={{
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: 'var(--color-error)',
                          cursor: 'pointer',
                          transition: 'all 200ms',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(task.id)}
                      title="删除"
                      style={{
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: 'var(--color-fg-tertiary)',
                        cursor: 'pointer',
                        transition: 'all 200ms',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                        e.currentTarget.style.color = 'var(--color-error)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--color-fg-tertiary)';
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', padding: '0 4px' }}>
        <p style={{ fontSize: '12px', color: 'var(--color-fg-tertiary)' }}>
          共 {filteredTasks.length} 个任务
        </p>
      </div>
    </div>
  );
}
