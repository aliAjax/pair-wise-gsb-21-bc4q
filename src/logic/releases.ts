// 判断层：放行签署
// 放行前两道闸门：
// 1. 该机号存在未关闭缺陷（含保留中/候件中/到货待复核，且未过保留期限的更要说明）；
// 2. 机位冲突：与其他未取消的过站占用窗口重叠。
// 任一不过 → 签署停在待办，逐条写明原因；全部通过 → 放行。

import type { AppState, GateCheck, Release } from "../data/types";
import { STAND_BUFFER_AFTER_MIN, STAND_BUFFER_BEFORE_MIN } from "../data/reference";
import { dueState } from "./defects";
import { openDefectsForTail } from "./defects";
import { fmt, nextId, nowIso, overlaps } from "./time";

export interface ReleaseRequest {
  flightNo: string;
  tailNo: string;
  aircraftType: string;
  stand: string;
  scheduledIn: string;
  scheduledOut: string;
  signer: string;
}

/** 含缓冲时间的机位占用窗口 */
export function standWindow(r: Pick<ReleaseRequest, "scheduledIn" | "scheduledOut">) {
  const start = new Date(
    new Date(r.scheduledIn).getTime() - STAND_BUFFER_BEFORE_MIN * 60_000
  ).toISOString();
  const end = new Date(
    new Date(r.scheduledOut).getTime() + STAND_BUFFER_AFTER_MIN * 60_000
  ).toISOString();
  return { start, end };
}

/** 机位冲突检查：与其他待办/已放行记录比较，排除自身 */
export function findStandConflicts(
  state: AppState,
  req: ReleaseRequest,
  selfId?: string
): Release[] {
  const win = standWindow(req);
  return state.releases.filter((r) => {
    if (r.id === selfId || r.stand !== req.stand) return false;
    const other = standWindow(r);
    return overlaps(win.start, win.end, other.start, other.end);
  });
}

/** 汇总闸门检查结果 */
export function evaluateGates(state: AppState, req: ReleaseRequest, selfId?: string): GateCheck[] {
  const open = openDefectsForTail(state.defects, req.tailNo);
  const openDetail =
    open.length === 0
      ? `${req.tailNo} 无未关闭缺陷`
      : open
          .map((d) => {
            const due =
              dueState(d) === "overdue"
                ? "，保留已超期"
                : dueState(d) === "dueSoon"
                  ? "，保留临期"
                  : "";
            return `${d.id}（${d.ata}）${d.description}${due}`;
          })
          .join("；");

  const conflicts = findStandConflicts(state, req, selfId);
  const conflictDetail =
    conflicts.length === 0
      ? `机位 ${req.stand} 占用窗口无冲突（入位前 ${STAND_BUFFER_BEFORE_MIN} 分钟 / 离位后 ${STAND_BUFFER_AFTER_MIN} 分钟缓冲）`
      : conflicts
          .map(
            (r) =>
              `与 ${r.flightNo}（${r.tailNo}）${fmt(r.scheduledIn)} ~ ${fmt(
                r.scheduledOut
              )}）${r.status === "todo" ? "（待办）" : ""}窗口重叠`
          )
          .join("；");

  return [
    {
      key: "openDefects",
      label: "未关闭缺陷",
      pass: open.length === 0,
      detail: openDetail,
    },
    {
      key: "standConflict",
      label: "机位冲突",
      pass: conflicts.length === 0,
      detail: conflictDetail,
    },
  ];
}

/** 签署：按闸门结果落到 已放行 / 待办 */
export function attemptRelease(
  state: AppState,
  req: ReleaseRequest
): { state: AppState; release: Release } {
  const gates = evaluateGates(state, req);
  const blockers = gates.filter((g) => !g.pass).map((g) => `${g.label}：${g.detail}`);
  const release: Release = {
    id: nextId("R", state.releases.length),
    flightNo: req.flightNo,
    tailNo: req.tailNo,
    aircraftType: req.aircraftType,
    stand: req.stand,
    scheduledIn: new Date(req.scheduledIn).toISOString(),
    scheduledOut: new Date(req.scheduledOut).toISOString(),
    status: blockers.length === 0 ? "released" : "todo",
    gates,
    blockers,
    signer: req.signer,
    attemptedAt: nowIso(),
    releasedAt: blockers.length === 0 ? nowIso() : undefined,
  };
  return {
    state: { ...state, releases: [release, ...state.releases] },
    release,
  };
}

/** 待办原因排除后重新签署（复用同一条待办记录，保留痕迹） */
export function retryRelease(
  state: AppState,
  id: string
): { state: AppState; release: Release } {
  const old = state.releases.find((r) => r.id === id);
  if (!old) throw new Error("放行记录不存在");
  const gates = evaluateGates(
    state,
    {
      flightNo: old.flightNo,
      tailNo: old.tailNo,
      aircraftType: old.aircraftType,
      stand: old.stand,
      scheduledIn: old.scheduledIn,
      scheduledOut: old.scheduledOut,
      signer: old.signer,
    },
    old.id
  );
  const blockers = gates.filter((g) => !g.pass).map((g) => `${g.label}：${g.detail}`);
  const updated: Release = {
    ...old,
    gates,
    blockers,
    status: blockers.length === 0 ? "released" : "todo",
    releasedAt: blockers.length === 0 ? nowIso() : undefined,
  };
  return {
    state: {
      ...state,
      releases: state.releases.map((r) => (r.id === id ? updated : r)),
    },
    release: updated,
  };
}
