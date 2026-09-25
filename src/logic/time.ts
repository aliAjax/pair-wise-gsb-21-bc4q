// 判断层：时间与编号工具

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Date → "YYYY-MM-DDTHH:mm"（datetime-local 值） */
export function toLocalInput(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(
    d.getHours()
  )}:${pad2(d.getMinutes())}`;
}

export function toDateInput(d: Date): string {
  return toLocalInput(d).slice(0, 10);
}

/** 任意可解析时间 → "MM-DD HH:mm" 展示 */
export function fmt(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(
    d.getMinutes()
  )}`;
}

/** "YYYY-MM-DD" 展示 */
export function fmtDay(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** 在某个时间上增减天/小时 */
export function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function addHours(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 3600_000).toISOString();
}

/** 生成业务编号，前缀 + 日期 + 序号，如 D-250925-03 */
export function nextId(prefix: string, count: number): string {
  const d = new Date();
  const stamp = `${String(d.getFullYear()).slice(2)}${pad2(d.getMonth() + 1)}${pad2(
    d.getDate()
  )}`;
  return `${prefix}-${stamp}-${pad2(count + 1)}`;
}

/** 时间区间是否重叠（半开区间） */
export function overlaps(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);
}
