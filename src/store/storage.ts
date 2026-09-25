// 保存层：localStorage 读写，重开页面后接着办理
import type { StationState } from "../data/types";

const KEY = "hxwl-07.station.v1";

export function loadState(): StationState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StationState;
    if (parsed?.version !== 1 || !Array.isArray(parsed.defects)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveState(state: StationState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // 存储不可用时静默失败，不影响当前办理
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // 同上
  }
}
