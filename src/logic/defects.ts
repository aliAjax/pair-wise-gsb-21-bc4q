// 判断层：缺陷保留流转
// 保留中 open → 航材缺件转候补 awaitingPart → 到货复核 arrived → 关闭 closed
// 候补到货前也可继续保留（撤销候补）；到期未关闭的缺陷不得放行

import type {
  AppState,
  Crew,
  Defect,
  DefectDraft,
  DefectStatus,
  TimelineEvent,
} from "../data/types";
import { DUE_WARNING_HOURS, RETENTION_DAYS } from "../data/reference";
import { addDays, nextId, nowIso } from "./time";

export function createDefect(draft: DefectDraft, crew: Crew, seq: number): Defect {
  const now = nowIso();
  const due =
    draft.dueDate.length > 10 ? new Date(draft.dueDate).toISOString() : draft.dueDate;
  return {
    id: nextId("D", seq),
    aircraftType: draft.aircraftType,
    tailNo: draft.tailNo,
    ata: draft.ata,
    zone: draft.zone,
    description: draft.description,
    category: draft.category,
    dueDate: due,
    owner: draft.owner,
    crew,
    status: "open",
    pn: draft.pn,
    partName: draft.partName,
    history: [{ time: now, actor: `${crew} · ${draft.owner}`, text: "过站检查发现并登记保留" }],
    createdAt: now,
  };
}

function event(actor: string, text: string): TimelineEvent {
  return { time: nowIso(), actor, text };
}

export function getDefect(state: AppState, id: string): Defect {
  const d = state.defects.find((x) => x.id === id);
  if (!d) throw new Error("缺陷不存在：" + id);
  return d;
}

/** 航材缺件 → 转候补 */
export function toWaitlist(d: Defect, actor: string, pn: string, partName: string): Defect {
  if (d.status !== "open") throw new Error("仅保留中的缺陷可转候补");
  const now = nowIso();
  return {
    ...d,
    status: "awaitingPart",
    waitlistSince: now,
    pn: pn || d.pn,
    partName: partName || d.partName,
    history: [...d.history, event(actor, `航材缺件转候补（${partName || d.partName || "未填件名"}）`)],
  };
}

/** 撤销候补，回到保留 */
export function cancelWaitlist(d: Defect, actor: string): Defect {
  if (d.status !== "awaitingPart") throw new Error("仅候件中的缺陷可撤销候补");
  return {
    ...d,
    status: "open",
    waitlistSince: undefined,
    history: [...d.history, event(actor, "撤销候补，转回保留中")],
  };
}

/** 航材到货 → 待复核 */
export function markArrived(d: Defect, actor: string): Defect {
  if (d.status !== "awaitingPart") throw new Error("仅候件中的缺陷可登记到货");
  const now = nowIso();
  return {
    ...d,
    status: "arrived",
    arrivedAt: now,
    history: [...d.history, event(actor, "航材到货，等待复核关闭")],
  };
}

/** 复核通过 → 关闭 */
export function closeDefect(d: Defect, actor: string, note: string): Defect {
  if (d.status !== "arrived" && d.status !== "open")
    throw new Error("到货复核通过后方可关闭");
  return {
    ...d,
    status: "closed",
    closeNote: note || "复核通过，缺陷已关闭",
    history: [...d.history, event(actor, note || "复核通过，缺陷已关闭")],
  };
}

/** 延长保留期限 */
export function extendDue(d: Defect, actor: string, days: number, reason: string): Defect {
  if (d.status === "closed") throw new Error("已关闭缺陷无需延期");
  const next = addDays(d.dueDate, days);
  return {
    ...d,
    dueDate: next,
    history: [
      ...d.history,
      event(actor, `保留期限延长 ${days} 天${reason ? "：" + reason : ""}`),
    ],
  };
}

export type DueState = "overdue" | "dueSoon" | "normal";

/** 保留期限时效判断 */
export function dueState(d: Defect, now: Date = new Date()): DueState {
  if (d.status === "closed") return "normal";
  const due = new Date(d.dueDate).getTime();
  if (due < now.getTime()) return "overdue";
  if (due - now.getTime() < DUE_WARNING_HOURS * 3600_000) return "dueSoon";
  return "normal";
}

/** 未关闭缺陷（放行闸门用）：保留中/候件中/到货待复核均算 */
export function isOpenStatus(s: DefectStatus): boolean {
  return s !== "closed";
}

export function openDefectsForTail(defects: Defect[], tailNo: string): Defect[] {
  return defects.filter((d) => d.tailNo === tailNo && isOpenStatus(d.status));
}

/** 新增缺陷时给保留期限默认值（按 MEL 类别） */
export function defaultDueDateISO(category: Defect["category"]): string {
  return addDays(nowIso(), RETENTION_DAYS[category]);
}
