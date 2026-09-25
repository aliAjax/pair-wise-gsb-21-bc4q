// 判断层：交接班
// 开班时把原班组名下所有未关闭缺陷列入交接清单，接班人逐条确认接管；
// 未接管的条目班组归属不变（仍归原班组）。接班班组可以是多个。

import type { AppState, Crew, Defect, Handover } from "../data/types";
import { isOpenStatus } from "./defects";
import { fmt, nextId, nowIso } from "./time";

/** 发起交接班：快照当前未关闭、归属交班班组的缺陷 */
export function startHandover(
  state: AppState,
  fromCrew: Crew,
  toCrew: Crew
): Handover {
  if (fromCrew === toCrew) throw new Error("交班与接班班组不能相同");
  const active = state.handovers.find(
    (h) => h.status === "active" && h.fromCrew === fromCrew
  );
  if (active) throw new Error(`${fromCrew}已有进行中的交接班，请先完成或继续办理`);

  const items = state.defects
    .filter((d) => d.crew === fromCrew && isOpenStatus(d.status))
    .map((d) => ({ defectId: d.id, accepted: false }));
  if (items.length === 0) throw new Error(`${fromCrew}名下没有需要交接的未关闭缺陷`);

  return {
    id: nextId("H", state.handovers.length),
    fromCrew,
    toCrew,
    startedAt: nowIso(),
    status: "active",
    items,
  };
}

/** 接班人逐条接管：缺陷归属转给接班班组 */
export function acceptItem(
  state: AppState,
  handoverId: string,
  defectId: string
): AppState {
  const h = state.handovers.find((x) => x.id === handoverId);
  if (!h || h.status !== "active") throw new Error("交接班次不存在或已结束");

  const handover: Handover = {
    ...h,
    items: h.items.map((it) =>
      it.defectId === defectId && !it.accepted
        ? { ...it, accepted: true, acceptedAt: nowIso() }
        : it
    ),
  };

  const defects = state.defects.map((d): Defect => {
    if (d.id !== defectId || d.crew !== h.fromCrew) return d;
    return {
      ...d,
      crew: h.toCrew,
      history: [
        ...d.history,
        {
          time: nowIso(),
          actor: `${h.fromCrew} → ${h.toCrew}`,
          text: `交接班由${h.toCrew}接管（${h.id}）`,
        },
      ],
    };
  });

  return {
    ...state,
    defects,
    handovers: state.handovers.map((x) => (x.id === handoverId ? handover : x)),
  };
}

/** 完成交接：未接管条目自动留在原班组（其 crew 本就没变） */
export function completeHandover(state: AppState, handoverId: string): AppState {
  const h = state.handovers.find((x) => x.id === handoverId);
  if (!h || h.status !== "active") throw new Error("交接班次不存在或已结束");
  const acceptedCount = h.items.filter((it) => it.accepted).length;
  return {
    ...state,
    handovers: state.handovers.map((x) =>
      x.id === handoverId
        ? {
            ...x,
            status: "completed",
            completedAt: nowIso(),
            items: x.items,
          }
        : x
    ),
    defects: state.defects.map((d) => {
      const item = h.items.find((it) => it.defectId === d.id);
      if (item && !item.accepted && d.crew === h.fromCrew) {
        return {
          ...d,
          history: [
            ...d.history,
            {
              time: nowIso(),
              actor: `${h.fromCrew}`,
              text: `交接班完成但${h.toCrew}未接管，仍归${h.fromCrew}（${h.id}，已接管 ${acceptedCount}/${h.items.length}）`,
            },
          ],
        };
      }
      return d;
    }),
  };
}

export function handoverProgress(h: Handover): { done: number; total: number } {
  return { done: h.items.filter((it) => it.accepted).length, total: h.items.length };
}

export function handoverSummary(h: Handover, defects: Defect[]): string {
  const { done, total } = handoverProgress(h);
  const pending = h.items
    .filter((it) => !it.accepted)
    .map((it) => defects.find((d) => d.id === it.defectId))
    .filter((d): d is Defect => Boolean(d))
    .map((d) => `${d.tailNo} ${d.description.slice(0, 12)}`)
    .join("；");
  return `${fmt(h.startedAt)} 发起 · ${h.fromCrew} → ${h.toCrew} · ${done}/${total} 已接管${
    pending ? ` · 未接管：${pending}` : ""
  }`;
}
