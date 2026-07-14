export function formatTime(ms: number, showCentis: boolean = true): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const centis = Math.floor((ms % 1000) / 10);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (showCentis) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(centis)}`;
  }
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function formatShortTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function getStatusLabel(status: string): { label: string; color: string; bg: string } {
  switch (status) {
    case 'running':
      return { label: '运行中', color: '#2D9D78', bg: '#E8F6F0' };
    case 'pending':
      return { label: '等待中', color: '#D4920B', bg: '#FEF7E6' };
    case 'completed':
      return { label: '已完成', color: '#8D93A5', bg: '#ECEEF4' };
    case 'cancelled':
      return { label: '已取消', color: '#D94452', bg: '#FDECEB' };
    default:
      return { label: status, color: '#8D93A5', bg: '#ECEEF4' };
  }
}

export function getTypeLabel(type: string): string {
  return type === 'shutdown' ? '关机' : '通知';
}
