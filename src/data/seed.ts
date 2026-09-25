// 资料层：初始演示数据（首次打开时落库，点"重置演示数据"可恢复）

import type { AppState, Defect, Release } from "./types";
import { addDays, addHours, nextId } from "../logic/time";

function h(actor: string, text: string, at: string) {
  return { time: at, actor, text };
}

export function buildSeedState(): AppState {
  const now = new Date().toISOString();

  const defects: Defect[] = [
    {
      id: nextId("D", 0),
      aircraftType: "A320",
      tailNo: "B-1683",
      ata: "ATA 32 起落架",
      zone: "主起落架",
      description: "左轮主轮胎面磨耗接近更换限制，需换轮",
      category: "MEL C",
      dueDate: addDays(now, 6),
      owner: "张维",
      crew: "甲班",
      status: "awaitingPart",
      pn: "PN-4-1-2081",
      partName: "主轮组件",
      waitlistSince: addHours(now, -30),
      history: [
        h("甲班 · 张维", "过站检查发现并登记保留", addHours(now, -32)),
        h("甲班 · 张维", "航材缺件转候补（主轮组件）", addHours(now, -30)),
      ],
      createdAt: addHours(now, -32),
    },
    {
      id: nextId("D", 1),
      aircraftType: "B737",
      tailNo: "B-5298",
      ata: "ATA 24 电源",
      zone: "前货舱",
      description: "电瓶充电器输出电压低，航后复查",
      category: "MEL C",
      dueDate: addDays(now, 4),
      owner: "李远",
      crew: "乙班",
      status: "arrived",
      pn: "PN-24-3-1190",
      partName: "电瓶充电机",
      waitlistSince: addHours(now, -26),
      arrivedAt: addHours(now, -3),
      history: [
        h("乙班 · 李远", "过站检查发现并登记保留", addHours(now, -28)),
        h("乙班 · 李远", "航材缺件转候补（电瓶充电机）", addHours(now, -26)),
        h("航材库", "航材到货，等待复核关闭", addHours(now, -3)),
      ],
      createdAt: addHours(now, -28),
    },
    {
      id: nextId("D", 2),
      aircraftType: "A320",
      tailNo: "B-6782",
      ata: "ATA 27 飞控",
      zone: "机翼/吊架",
      description: "左副翼作动测试行程偏差，需复查",
      category: "MEL B",
      dueDate: addDays(now, 1),
      owner: "王珂",
      crew: "乙班",
      status: "open",
      pn: "",
      partName: "",
      history: [
        h("甲班 · 王珂", "过站检查发现并登记保留", addHours(now, -8)),
        h("甲班 → 乙班", "交接班由乙班接管（演示交接）", addHours(now, -1)),
      ],
      createdAt: addHours(now, -8),
    },
    {
      id: nextId("D", 3),
      aircraftType: "A321",
      tailNo: "B-8560",
      ata: "ATA 21 空调/增压",
      zone: "后货舱",
      description: "后货舱加温指示间歇跳变",
      category: "非MEL",
      dueDate: addDays(now, -1),
      owner: "赵勤",
      crew: "丙班",
      status: "open",
      pn: "",
      partName: "",
      history: [h("丙班 · 赵勤", "过站检查发现并登记保留", addHours(now, -50))],
      createdAt: addHours(now, -50),
    },
    {
      id: nextId("D", 4),
      aircraftType: "ARJ21",
      tailNo: "B-651N",
      ata: "ATA 52 舱门",
      zone: "前货舱",
      description: "前货舱门封严老化，关闭后微漏",
      category: "MEL C",
      dueDate: addDays(now, 9),
      owner: "陈默",
      crew: "乙班",
      status: "awaitingPart",
      pn: "PN-52-7-0045",
      partName: "货舱门封严条",
      waitlistSince: addHours(now, -20),
      history: [
        h("乙班 · 陈默", "过站检查发现并登记保留", addHours(now, -22)),
        h("乙班 · 陈默", "航材缺件转候补（货舱门封严条）", addHours(now, -20)),
      ],
      createdAt: addHours(now, -22),
    },
    {
      id: nextId("D", 5),
      aircraftType: "B787",
      tailNo: "B-209X",
      ata: "ATA 49 辅助动力",
      zone: "APU舱",
      description: "APU 引气活门渗漏，更换后测试正常",
      category: "MEL C",
      dueDate: addDays(now, -2),
      owner: "孙涛",
      crew: "甲班",
      status: "closed",
      pn: "PN-49-2-0677",
      partName: "引气活门",
      waitlistSince: addHours(now, -70),
      arrivedAt: addHours(now, -55),
      closeNote: "复核通过，渗漏消失，引气压力正常",
      history: [
        h("甲班 · 孙涛", "过站检查发现并登记保留", addHours(now, -72)),
        h("甲班 · 孙涛", "航材缺件转候补（引气活门）", addHours(now, -70)),
        h("航材库", "航材到货，等待复核关闭", addHours(now, -55)),
        h("甲班 · 孙涛", "复核通过，渗漏消失，引气压力正常", addHours(now, -50)),
      ],
      createdAt: addHours(now, -72),
    },
  ];

  // 进行中的交接班：甲班 → 乙班。D 已接管（归属已是乙班），D 未接管仍归甲班
  const handovers: AppState["handovers"] = [
    {
      id: nextId("H", 0),
      fromCrew: "甲班",
      toCrew: "乙班",
      startedAt: addHours(now, -1),
      status: "active",
      items: [
        { defectId: defects[0].id, accepted: false },
        { defectId: defects[2].id, accepted: true, acceptedAt: addHours(now, -1) },
      ],
    },
  ];

  const tomorrow9 = new Date(now);
  tomorrow9.setDate(tomorrow9.getDate() + 1);
  tomorrow9.setHours(9, 0, 0, 0);
  const at = (d: Date, dh: number, mh: number) => {
    const x = new Date(d);
    x.setHours(dh, mh, 0, 0);
    return x.toISOString();
  };

  const releases: Release[] = [
    {
      id: nextId("R", 0),
      flightNo: "MU3320",
      tailNo: "B-1715",
      aircraftType: "B737",
      stand: "103",
      scheduledIn: at(tomorrow9, 9, 0),
      scheduledOut: at(tomorrow9, 10, 0),
      status: "released",
      gates: [
        { key: "openDefects", label: "未关闭缺陷", pass: true, detail: "B-1715 无未关闭缺陷" },
        { key: "standConflict", label: "机位冲突", pass: true, detail: "机位 103 占用窗口无冲突" },
      ],
      blockers: [],
      signer: "放行 · 何平",
      attemptedAt: addHours(now, -6),
      releasedAt: addHours(now, -6),
    },
    {
      id: nextId("R", 1),
      flightNo: "MU6612",
      tailNo: "B-1715",
      aircraftType: "B737",
      stand: "103",
      scheduledIn: at(tomorrow9, 9, 40),
      scheduledOut: at(tomorrow9, 11, 0),
      status: "todo",
      gates: [
        { key: "openDefects", label: "未关闭缺陷", pass: true, detail: "B-1715 无未关闭缺陷" },
        {
          key: "standConflict",
          label: "机位冲突",
          pass: false,
          detail: "与 MU3320（B-1715）机位 103 占用窗口重叠",
        },
      ],
      blockers: ["机位冲突：与 MU3320（B-1715）机位 103 占用窗口重叠"],
      signer: "放行 · 何平",
      attemptedAt: addHours(now, -5),
    },
    {
      id: nextId("R", 2),
      flightNo: "MU2203",
      tailNo: "B-5298",
      aircraftType: "B737",
      stand: "205",
      scheduledIn: at(tomorrow9, 14, 20),
      scheduledOut: at(tomorrow9, 15, 10),
      status: "todo",
      gates: [
        {
          key: "openDefects",
          label: "未关闭缺陷",
          pass: false,
          detail: "电瓶充电器输出电压低，航后复查（到货待复核）",
        },
        { key: "standConflict", label: "机位冲突", pass: true, detail: "机位 205 占用窗口无冲突" },
      ],
      blockers: ["未关闭缺陷：电瓶充电器输出电压低，航后复查（到货待复核）"],
      signer: "放行 · 何平",
      attemptedAt: addHours(now, -4),
    },
  ];

  return { currentCrew: "甲班", defects, handovers, releases };
}
