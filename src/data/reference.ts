// 资料层：静态参考数据（机型/机号、ATA章节、区域、机位、班组、默认保留期）

import type { Crew, DefectCategory } from "./types";

export const CREWS: Crew[] = ["甲班", "乙班", "丙班"];

export const AIRCRAFT_TYPES = ["A320", "A321", "B737", "B787", "ARJ21"] as const;

/** 机号 → 机型 对照 */
export const TAIL_NO_BY_TYPE: Record<string, string[]> = {
  A320: ["B-1683", "B-6782"],
  A321: ["B-8560"],
  B737: ["B-5298", "B-1715"],
  B787: ["B-209X"],
  ARJ21: ["B-651N"],
};

export const ALL_TAILS = Object.entries(TAIL_NO_BY_TYPE).flatMap(([type, tails]) =>
  tails.map((tail) => ({ type, tail }))
);

/** 常用 ATA 章节 */
export const ATA_CHAPTERS = [
  "ATA 21 空调/增压",
  "ATA 22 自动飞行",
  "ATA 24 电源",
  "ATA 26 火警/烟雾",
  "ATA 27 飞控",
  "ATA 28 燃油",
  "ATA 29 液压",
  "ATA 30 防冰/防雨",
  "ATA 32 起落架",
  "ATA 34 导航",
  "ATA 36 引气",
  "ATA 49 辅助动力",
  "ATA 52 舱门",
  "ATA 53 机身",
] as const;

export const ZONES = [
  "雷达罩/前机身",
  "驾驶舱",
  "前客舱",
  "后客舱",
  "前货舱",
  "后货舱",
  "主起落架",
  "前起落架",
  "机翼/吊架",
  "发动机",
  "尾翼",
  "APU舱",
] as const;

export const STANDS = ["101", "102", "103", "205", "207"] as const;

export const CATEGORIES: DefectCategory[] = [
  "MEL A",
  "MEL B",
  "MEL C",
  "MEL D",
  "非MEL",
];

/** 各类别默认保留天数，到期后保留自动失效，需重新评估 */
export const RETENTION_DAYS: Record<DefectCategory, number> = {
  "MEL A": 1,
  "MEL B": 3,
  "MEL C": 10,
  "MEL D": 120,
  非MEL: 7,
};

/** 距保留期限多少小时内提示临期 */
export const DUE_WARNING_HOURS = 48;

/** 机位占用窗口：计划入位前 40 分钟至计划离位后 60 分钟，重叠即判冲突 */
export const STAND_BUFFER_BEFORE_MIN = 40;
export const STAND_BUFFER_AFTER_MIN = 60;

/** 状态展示文案 */
export const STATUS_LABEL = {
  open: "保留中",
  awaitingPart: "候件中",
  arrived: "到货待复核",
  closed: "已关闭",
} as const;
