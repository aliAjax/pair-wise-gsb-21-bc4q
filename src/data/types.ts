// 资料层：缺陷保留与放行台的领域数据结构

export type Crew = "甲班" | "乙班" | "丙班";

/** 缺陷生命周期：保留中 → 候件中 → 到货待复核 → 已关闭 */
export type DefectStatus = "open" | "awaitingPart" | "arrived" | "closed";

export type DefectCategory = "MEL A" | "MEL B" | "MEL C" | "MEL D" | "非MEL";

export interface TimelineEvent {
  time: string;
  actor: string;
  text: string;
}

export interface Defect {
  id: string;
  aircraftType: string;
  tailNo: string;
  ata: string;
  zone: string;
  description: string;
  category: DefectCategory;
  /** 保留期限（ISO 字符串） */
  dueDate: string;
  /** 当前责任人 */
  owner: string;
  /** 责任班组 */
  crew: Crew;
  status: DefectStatus;
  pn: string;
  partName: string;
  /** 转为候补的时间 */
  waitlistSince?: string;
  /** 航材到货时间 */
  arrivedAt?: string;
  closeNote?: string;
  history: TimelineEvent[];
  createdAt: string;
}

export interface DefectDraft {
  aircraftType: string;
  tailNo: string;
  ata: string;
  zone: string;
  description: string;
  category: DefectCategory;
  dueDate: string;
  owner: string;
  pn: string;
  partName: string;
}

/** 交接班条目：每一条缺陷都需接班人逐条确认 */
export interface HandoverItem {
  defectId: string;
  accepted: boolean;
  acceptedAt?: string;
}

export interface Handover {
  id: string;
  fromCrew: Crew;
  toCrew: Crew;
  startedAt: string;
  completedAt?: string;
  /** 进行中 / 已完成（含部分未接管，未接管条目仍归原班组） */
  status: "active" | "completed";
  items: HandoverItem[];
}

export type ReleaseStatus = "released" | "todo";

export interface GateCheck {
  key: "openDefects" | "standConflict";
  label: string;
  pass: boolean;
  detail: string;
}

/** 一次放行签署尝试：被拦下时停留待办并写明原因 */
export interface Release {
  id: string;
  flightNo: string;
  tailNo: string;
  aircraftType: string;
  stand: string;
  scheduledIn: string;
  scheduledOut: string;
  status: ReleaseStatus;
  gates: GateCheck[];
  blockers: string[];
  signer: string;
  attemptedAt: string;
  releasedAt?: string;
}

export interface AppState {
  currentCrew: Crew;
  defects: Defect[];
  handovers: Handover[];
  releases: Release[];
}
