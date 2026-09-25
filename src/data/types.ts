// 资料层：领域数据结构定义

export type DefectStatus = "open" | "parts_wait" | "recheck" | "closed";

export interface HistoryEntry {
  time: string; // ISO 时间
  actor: string; // 操作人 / 班组
  action: string; // 发生了什么
}

export interface Defect {
  id: string;
  aircraftType: string; // 机型
  ataChapter: string; // ATA章节
  zone: string; // 区域
  description: string; // 缺陷描述
  deferralDeadline: string; // 保留期限（YYYY-MM-DD）
  owner: string; // 责任人
  crewId: string; // 当前归属班组
  status: DefectStatus;
  partsNote: string; // 缺件航材说明（转候补时填写）
  history: HistoryEntry[]; // 流转记录
}

export interface Crew {
  id: string;
  name: string;
}

export interface HandoverItem {
  defectId: string;
  accepted: boolean | null; // null = 接班人尚未确认
}

export interface Handover {
  id: string;
  fromCrewId: string;
  toCrewId: string;
  createdAt: string;
  items: HandoverItem[];
}

export interface StandSlot {
  id: string;
  stand: string; // 机位号
  flight: string; // 航班号
  aircraftType: string;
  start: string; // ISO
  end: string; // ISO
}

export interface Release {
  id: string;
  flight: string;
  aircraftType: string;
  stand: string;
  departure: string; // 计划离港 ISO
  status: "pending" | "released"; // 待办 / 已放行
  signedBy: string;
  signedAt: string;
}

export interface StationState {
  version: 1;
  crews: Crew[];
  currentCrewId: string;
  defects: Defect[];
  handover: Handover | null; // 进行中的交接班
  standSlots: StandSlot[];
  releases: Release[];
}
