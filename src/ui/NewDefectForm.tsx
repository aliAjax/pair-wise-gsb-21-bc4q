// 界面层：登记缺陷保留表单
import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

export interface NewDefectInput {
  aircraftType: string;
  ataChapter: string;
  zone: string;
  description: string;
  deferralDeadline: string;
  owner: string;
}

const aircraftTypes = ["A320", "B737", "ARJ21", "C919"];

const ataChapters = [
  "ATA 21 空调",
  "ATA 22 自动飞行",
  "ATA 23 通信",
  "ATA 24 电源",
  "ATA 25 设备/装饰",
  "ATA 26 防火",
  "ATA 27 飞行操纵",
  "ATA 28 燃油",
  "ATA 29 液压",
  "ATA 30 防冰防雨",
  "ATA 31 指示/记录",
  "ATA 32 起落架",
  "ATA 34 导航",
  "ATA 49 APU",
  "ATA 71 动力装置",
];

const empty: NewDefectInput = {
  aircraftType: "A320",
  ataChapter: "",
  zone: "",
  description: "",
  deferralDeadline: "",
  owner: "",
};

export function NewDefectForm({ onAdd }: { onAdd: (input: NewDefectInput) => void }) {
  const [form, setForm] = useState<NewDefectInput>(empty);

  const set =
    (key: keyof NewDefectInput) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const valid =
    form.ataChapter.trim().length > 0 &&
    form.zone.trim().length > 0 &&
    form.description.trim().length > 0 &&
    form.deferralDeadline.length > 0 &&
    form.owner.trim().length > 0;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    onAdd({ ...form, ataChapter: form.ataChapter.trim(), zone: form.zone.trim(), description: form.description.trim(), owner: form.owner.trim() });
    setForm(empty);
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h2>登记缺陷保留</h2>
      <label>
        <span>机型</span>
        <select value={form.aircraftType} onChange={set("aircraftType")}>
          {aircraftTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>ATA章节</span>
        <input list="ata-chapters" placeholder="如 ATA 32 起落架" value={form.ataChapter} onChange={set("ataChapter")} />
        <datalist id="ata-chapters">
          {ataChapters.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </label>
      <label>
        <span>区域</span>
        <input placeholder="如 前起落架舱" value={form.zone} onChange={set("zone")} />
      </label>
      <label>
        <span>缺陷描述</span>
        <textarea rows={3} placeholder="缺陷现象与保留依据" value={form.description} onChange={set("description")} />
      </label>
      <label>
        <span>保留期限</span>
        <input type="date" value={form.deferralDeadline} onChange={set("deferralDeadline")} />
      </label>
      <label>
        <span>责任人</span>
        <input placeholder="姓名" value={form.owner} onChange={set("owner")} />
      </label>
      <button className="primary-action" type="submit" disabled={!valid}>
        登记保留
      </button>
    </form>
  );
}
