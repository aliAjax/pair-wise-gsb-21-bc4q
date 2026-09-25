// 判断层：纯函数，不碰界面也不碰存储
import type { Defect, DefectStatus, Handover, Release, StandSlot, StationState } from "../data/types";

export const statusLabels: Record<DefectStatus, string> = {
  open: "保留中",
  parts_wait: "候补待航材",
  recheck: "到货复核",
  closed: "已关闭",
};

// 缺陷状态机：保留中 → 候补待航材 → 到货复核 → 已关闭（复核不通过可退回保留）
const flow: Record<DefectStatus, DefectStatus[]> = {
  open: ["parts_wait", "closed"],
  parts_wait: ["recheck"],
  recheck: ["open", "closed"],
  closed: [],
};

export function nowIso(): string {
  return new Date().toISOString();
}

export function isActive(d: Defect): boolean {
  return d.status !== "closed";
}

export function isOverdue(d: Defect, now: Date = new Date()): boolean {
  return isActive(d) && new Date(`${d.deferralDeadline}T23:59:59`).getTime() < now.getTime();
}

export function nextDefectId(defects: Defect[]): string {
  const max = defects.reduce((m, d) => {
    const n = parseInt(d.id.replace(/\D/g, ""), 10);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 2500);
  return `D-${max + 1}`;
}

export function transitionDefect(d: Defect, next: DefectStatus, actor: string, note = ""): Defect {
  if (!flow[d.status].includes(next)) {
    throw new Error(`不允许从「${statusLabels[d.status]}」转到「${statusLabels[next]}」`);
  }
  const action = note
    ? `${statusLabels[d.status]} → ${statusLabels[next]}：${note}`
    : `${statusLabels[d.status]} → ${statusLabels[next]}`;
  return { ...d, status: next, history: [...d.history, { time: nowIso(), actor, action }] };
}

// ---- 交接班 ----

export function openHandover(state: StationState, toCrewId: string): Handover {
  const items = state.defects
    .filter((d) => d.crewId === state.currentCrewId && isActive(d))
    .map((d) => ({ defectId: d.id, accepted: null }));
  return {
    id: `H-${Date.now().toString(36)}`,
    fromCrewId: state.currentCrewId,
    toCrewId,
    createdAt: nowIso(),
    items,
  };
}

export function decideHandoverItem(h: Handover, defectId: string, accepted: boolean): Handover {
  return { ...h, items: h.items.map((i) => (i.defectId === defectId ? { ...i, accepted } : i)) };
}

// 逐条确认完毕才允许完成交接
export function handoverReady(h: Handover): boolean {
  return h.items.length > 0 && h.items.every((i) => i.accepted !== null);
}

// 完成交接：被接管的归新班组；未接管的仍归原班组，双方都留痕
export function completeHandover(state: StationState): StationState {
  const h = state.handover;
  if (!h || !handoverReady(h)) return state;
  const from = state.crews.find((c) => c.id === h.fromCrewId)?.name ?? h.fromCrewId;
  const to = state.crews.find((c) => c.id === h.toCrewId)?.name ?? h.toCrewId;
  const time = nowIso();
  const defects = state.defects.map((d) => {
    const item = h.items.find((i) => i.defectId === d.id);
    if (!item) return d;
    return item.accepted
      ? { ...d, crewId: h.toCrewId, history: [...d.history, { time, actor: to, action: `交接班接管（${from} → ${to}）` }] }
      : { ...d, history: [...d.history, { time, actor: to, action: `接班人未接管，仍归 ${from}` }] };
  });
  return { ...state, defects, handover: null };
}

// ---- 放行闸门 ----

export interface GateResult {
  ok: boolean;
  reasons: string[]; // 阻塞原因，逐条写明
}

function hhmm(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

function overlap(a: StandSlot, b: StandSlot): boolean {
  return new Date(a.start).getTime() < new Date(b.end).getTime() && new Date(b.start).getTime() < new Date(a.end).getTime();
}

// 放行前校验：同机型未关闭缺陷、本航班机位占用与他航班冲突
export function evaluateRelease(release: Release, defects: Defect[], slots: StandSlot[]): GateResult {
  const reasons: string[] = [];

  const open = defects.filter((d) => d.aircraftType === release.aircraftType && isActive(d));
  if (open.length > 0) {
    const overdue = open.filter((d) => isOverdue(d)).length;
    reasons.push(
      `未关闭缺陷 ${open.length} 项（${open.map((d) => d.id).join("、")}）${overdue > 0 ? `，其中已超期 ${overdue} 项` : ""}`
    );
  }

  const own = slots.find((s) => s.flight === release.flight && s.stand === release.stand);
  if (!own) {
    reasons.push(`机位计划缺失：未找到 ${release.flight} 在机位 ${release.stand} 的占用时段`);
  } else {
    const conflicts = slots.filter((s) => s.id !== own.id && s.stand === own.stand && overlap(own, s));
    if (conflicts.length > 0) {
      reasons.push(
        `机位 ${own.stand} 冲突：${conflicts.map((c) => `${c.flight} ${hhmm(c.start)}–${hhmm(c.end)}`).join("，")}`
      );
    }
  }

  return { ok: reasons.length === 0, reasons };
}

// 闸门未通过或签署人空缺时，签署停在待办
export function signRelease(release: Release, gate: GateResult, signer: string): Release {
  if (release.status !== "pending") return release;
  if (!gate.ok || signer.trim().length === 0) return release;
  return { ...release, status: "released", signedBy: signer.trim(), signedAt: nowIso() };
}
