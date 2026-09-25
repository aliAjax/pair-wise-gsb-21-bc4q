// 保存层：应用状态仓库
// 所有变更先经过 logic 判断层，再统一写入这里并落 localStorage；
// 界面只发动作、读快照，不直接改数据。关闭重开后自动恢复。

import { useSyncExternalStore } from "react";
import type { AppState, Crew, DefectDraft, Handover, Release } from "../data/types";
import { buildSeedState } from "../data/seed";
import {
  cancelWaitlist,
  closeDefect,
  createDefect,
  extendDue,
  markArrived,
  toWaitlist,
} from "../logic/defects";
import {
  acceptItem,
  completeHandover,
  startHandover,
} from "../logic/handovers";
import { attemptRelease, retryRelease, type ReleaseRequest } from "../logic/releases";
import { nowIso } from "../logic/time";

const STORAGE_KEY = "hxwl-07-retention-release:v1";

type DefectActionKind =
  | "waitlist"
  | "cancelWaitlist"
  | "arrive"
  | "close"
  | "extendDue";

export type Action =
  | { type: "ADD_DEFECT"; draft: DefectDraft }
  | {
      type: "DEFECT_ACTION";
      id: string;
      kind: DefectActionKind;
      actor: string;
      pn?: string;
      partName?: string;
      note?: string;
      days?: number;
      reason?: string;
    }
  | { type: "START_HANDOVER"; fromCrew: Crew; toCrew: Crew }
  | { type: "ACCEPT_ITEM"; handoverId: string; defectId: string }
  | { type: "COMPLETE_HANDOVER"; handoverId: string }
  | { type: "SET_CREW"; crew: Crew }
  | { type: "ATTEMPT_RELEASE"; req: ReleaseRequest }
  | { type: "RETRY_RELEASE"; id: string }
  | { type: "RESET" };

export interface DispatchMeta {
  release?: Release;
  handover?: Handover;
}

export interface DispatchResult {
  ok: boolean;
  error?: string;
  meta?: DispatchMeta;
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (
        parsed &&
        Array.isArray(parsed.defects) &&
        Array.isArray(parsed.handovers) &&
        Array.isArray(parsed.releases)
      ) {
        return parsed;
      }
    }
  } catch {
    // 存档损坏时回落到种子数据
  }
  return buildSeedState();
}

function applyDefectAction(state: AppState, action: Extract<Action, { type: "DEFECT_ACTION" }>): AppState {
  const d = state.defects.find((x) => x.id === action.id);
  if (!d) throw new Error("缺陷不存在：" + action.id);
  let next = d;
  switch (action.kind) {
    case "waitlist":
      next = toWaitlist(d, action.actor, action.pn ?? "", action.partName ?? "");
      break;
    case "cancelWaitlist":
      next = cancelWaitlist(d, action.actor);
      break;
    case "arrive":
      next = markArrived(d, action.actor);
      break;
    case "close":
      next = closeDefect(d, action.actor, action.note ?? "");
      break;
    case "extendDue":
      next = extendDue(d, action.actor, action.days ?? 3, action.reason ?? "");
      break;
  }
  return { ...state, defects: state.defects.map((x) => (x.id === d.id ? next : x)) };
}

function reducer(state: AppState, action: Action): { state: AppState; meta?: DispatchMeta } {
  switch (action.type) {
    case "ADD_DEFECT": {
      const defect = createDefect(action.draft, state.currentCrew, state.defects.length);
      return { state: { ...state, defects: [defect, ...state.defects] } };
    }
    case "DEFECT_ACTION":
      return { state: applyDefectAction(state, action) };
    case "START_HANDOVER": {
      const handover = startHandover(state, action.fromCrew, action.toCrew);
      return {
        state: { ...state, handovers: [handover, ...state.handovers] },
        meta: { handover },
      };
    }
    case "ACCEPT_ITEM":
      return { state: acceptItem(state, action.handoverId, action.defectId) };
    case "COMPLETE_HANDOVER":
      return { state: completeHandover(state, action.handoverId) };
    case "SET_CREW":
      return { state: { ...state, currentCrew: action.crew } };
    case "ATTEMPT_RELEASE": {
      const result = attemptRelease(state, action.req);
      return { state: result.state, meta: { release: result.release } };
    }
    case "RETRY_RELEASE": {
      const result = retryRelease(state, action.id);
      return { state: result.state, meta: { release: result.release } };
    }
    case "RESET":
      return { state: buildSeedState() };
    default:
      return { state };
  }
}

// ---- 极简外部 store（不依赖具体框架，配合 useSyncExternalStore） ----

let current: AppState = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // 存储空间受限时仅保留内存态
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): AppState {
  return current;
}

export function dispatch(action: Action): DispatchResult {
  try {
    const result = reducer(current, action);
    current = result.state;
    persist();
    listeners.forEach((l) => l());
    return { ok: true, meta: result.meta };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export { subscribe, getSnapshot, nowIso };
