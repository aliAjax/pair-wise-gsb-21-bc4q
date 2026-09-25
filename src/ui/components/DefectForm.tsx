// 界面层：新增缺陷登记表单

import { useMemo, useState } from "react";
import {
  AIRCRAFT_TYPES,
  ATA_CHAPTERS,
  CATEGORIES,
  RETENTION_DAYS,
  TAIL_NO_BY_TYPE,
  ZONES,
} from "../../data/reference";
import type { DefectCategory, DefectDraft } from "../../data/types";
import { defaultDueDateISO } from "../../logic/defects";
import { toLocalInput } from "../../logic/time";

const emptyDraft = (): DefectDraft => ({
  aircraftType: "A320",
  tailNo: TAIL_NO_BY_TYPE["A320"][0],
  ata: ATA_CHAPTERS[0],
  zone: ZONES[0],
  description: "",
  category: "非MEL",
  dueDate: toLocalInput(new Date(defaultDueDateISO("非MEL"))),
  owner: "",
  pn: "",
  partName: "",
});

export function DefectForm({ onSubmit }: { onSubmit: (draft: DefectDraft) => boolean }) {
  const [draft, setDraft] = useState<DefectDraft>(emptyDraft);

  const tails = useMemo(
    () => TAIL_NO_BY_TYPE[draft.aircraftType] ?? [],
    [draft.aircraftType]
  );

  function set<K extends keyof DefectDraft>(key: K, value: DefectDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!draft.description.trim() || !draft.owner.trim()) return;
        const ok = onSubmit({ ...draft, description: draft.description.trim(), owner: draft.owner.trim() });
        if (ok) setDraft(emptyDraft());
      }}
    >
      <div className="form-grid">
        <label>
          机型
          <select
            value={draft.aircraftType}
            onChange={(e) => {
              const type = e.target.value;
              setDraft((d) => ({
                ...d,
                aircraftType: type,
                tailNo: TAIL_NO_BY_TYPE[type]?.[0] ?? "",
              }));
            }}
          >
            {AIRCRAFT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          机号
          <select value={draft.tailNo} onChange={(e) => set("tailNo", e.target.value)}>
            {tails.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          ATA 章节
          <select value={draft.ata} onChange={(e) => set("ata", e.target.value)}>
            {ATA_CHAPTERS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        <label>
          区域
          <select value={draft.zone} onChange={(e) => set("zone", e.target.value)}>
            {ZONES.map((z) => (
              <option key={z}>{z}</option>
            ))}
          </select>
        </label>
        <label>
          保留类别
          <select
            value={draft.category}
            onChange={(e) => {
              const category = e.target.value as DefectCategory;
              setDraft((d) => ({
                ...d,
                category,
                dueDate: toLocalInput(new Date(defaultDueDateISO(category))),
              }));
            }}
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          保留期限
          <input
            type="date"
            value={draft.dueDate.slice(0, 10)}
            onChange={(e) => set("dueDate", e.target.value)}
          />
          <span className="hint">{draft.category} 默认保留 {RETENTION_DAYS[draft.category]} 天，可调整</span>
        </label>
        <label className="span-3">
          缺陷描述（过站检查发现）
          <textarea
            placeholder="例如：左主轮胎面磨耗接近更换限制，需换轮"
            value={draft.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </label>
        <label>
          责任人
          <input
            placeholder="姓名"
            value={draft.owner}
            onChange={(e) => set("owner", e.target.value)}
          />
        </label>
        <label>
          关联件号（可缺）
          <input value={draft.pn} onChange={(e) => set("pn", e.target.value)} placeholder="PN-..." />
        </label>
        <label>
          航材名称（可缺）
          <input
            value={draft.partName}
            onChange={(e) => set("partName", e.target.value)}
            placeholder="缺件时在候补台补录"
          />
        </label>
      </div>
      <div className="form-actions">
        <button className="btn-primary" type="submit" disabled={!draft.description.trim() || !draft.owner.trim()}>
          登记保留
        </button>
      </div>
    </form>
  );
}
