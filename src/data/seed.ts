// 资料层：初始示例数据（时间相对生成时刻，保证演示时不过期）
import type { StationState } from "./types";

function isoIn(hours: number): string {
  return new Date(Date.now() + hours * 3600_000).toISOString();
}

function dateIn(days: number): string {
  const d = new Date(Date.now() + days * 86400_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function seedState(): StationState {
  return {
    version: 1,
    crews: [
      { id: "crew-a", name: "维修一班" },
      { id: "crew-b", name: "维修二班" },
    ],
    currentCrewId: "crew-a",
    defects: [
      {
        id: "D-2501",
        aircraftType: "A320",
        ataChapter: "ATA 32 起落架",
        zone: "前起落架舱",
        description: "前起舱门封严条破损，按 MEL 保留观察",
        deferralDeadline: dateIn(2),
        owner: "王建国",
        crewId: "crew-a",
        status: "open",
        partsNote: "",
        history: [{ time: isoIn(-3), actor: "维修一班", action: "过站检查发现缺陷，登记保留" }],
      },
      {
        id: "D-2502",
        aircraftType: "A320",
        ataChapter: "ATA 25 设备/装饰",
        zone: "客舱 3AC",
        description: "座椅靠背作动器失效，需换件",
        deferralDeadline: dateIn(3),
        owner: "李梅",
        crewId: "crew-a",
        status: "parts_wait",
        partsNote: "作动器（件号 25-1147-9）已订货",
        history: [
          { time: isoIn(-20), actor: "维修一班", action: "过站检查发现缺陷，登记保留" },
          { time: isoIn(-18), actor: "维修一班", action: "保留中 → 候补待航材：航材缺件：作动器（件号 25-1147-9）已订货" },
        ],
      },
      {
        id: "D-2503",
        aircraftType: "ARJ21",
        ataChapter: "ATA 27 飞行操纵",
        zone: "右机翼副翼",
        description: "副翼调整片间隙超标，航材已到货待复核",
        deferralDeadline: dateIn(1),
        owner: "赵磊",
        crewId: "crew-b",
        status: "recheck",
        partsNote: "调整片组件已到货",
        history: [
          { time: isoIn(-30), actor: "维修二班", action: "过站检查发现缺陷，登记保留" },
          { time: isoIn(-26), actor: "维修二班", action: "保留中 → 候补待航材：航材缺件：调整片组件" },
          { time: isoIn(-2), actor: "维修二班", action: "候补待航材 → 到货复核：航材到货" },
        ],
      },
      {
        id: "D-2504",
        aircraftType: "B737",
        ataChapter: "ATA 24 电源",
        zone: "电子舱",
        description: "备用电瓶容量低于放行标准",
        deferralDeadline: dateIn(-1),
        owner: "王建国",
        crewId: "crew-a",
        status: "closed",
        partsNote: "电瓶（件号 60B50011-1）",
        history: [
          { time: isoIn(-50), actor: "维修一班", action: "过站检查发现缺陷，登记保留" },
          { time: isoIn(-40), actor: "维修一班", action: "保留中 → 候补待航材：航材缺件：电瓶" },
          { time: isoIn(-10), actor: "维修一班", action: "候补待航材 → 到货复核：航材到货" },
          { time: isoIn(-8), actor: "维修一班", action: "到货复核 → 已关闭：到货复核通过" },
        ],
      },
    ],
    handover: null,
    standSlots: [
      { id: "S1", stand: "207", flight: "CA1832", aircraftType: "A320", start: isoIn(2), end: isoIn(4) },
      { id: "S2", stand: "207", flight: "MU5210", aircraftType: "B737", start: isoIn(3), end: isoIn(5) },
      { id: "S3", stand: "112", flight: "ZH9976", aircraftType: "ARJ21", start: isoIn(4), end: isoIn(6) },
      { id: "S4", stand: "305", flight: "CZ3105", aircraftType: "A320", start: isoIn(1), end: isoIn(2.5) },
    ],
    releases: [
      { id: "R1", flight: "CA1832", aircraftType: "A320", stand: "207", departure: isoIn(4), status: "pending", signedBy: "", signedAt: "" },
      { id: "R2", flight: "ZH9976", aircraftType: "ARJ21", stand: "112", departure: isoIn(6), status: "pending", signedBy: "", signedAt: "" },
    ],
  };
}
