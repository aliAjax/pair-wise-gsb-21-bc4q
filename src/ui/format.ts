// 界面层辅助：时间与期限的展示格式

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function fmtDate(iso: string): string {
  return iso.length <= 10 ? iso : iso.slice(0, 10);
}

export function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fmtDateTime(iso: string): string {
  return fmtTime(iso);
}

export function remainText(deadline: string, now: Date = new Date()): string {
  const end = new Date(`${deadline}T23:59:59`);
  const days = Math.ceil((end.getTime() - now.getTime()) / 86400_000);
  return days >= 0 ? `剩 ${days} 天` : `已超期 ${-days} 天`;
}
