// 界面层：缺陷保留清单与流转操作
import { useState } from "react";
import type { Crew, Defect, DefectStatus } from "../data/types";
import { isOverdue, statusLabels } from "../domain/logic";
import { fmtDate, fmtTime, remainText } from "./format";

const filters: Array<{ key: DefectStatus | "all"; label: string }> = [
  { key: "all", label: "全部" },
  { key: "open", label: "保留中" },
  { key: "parts_wait", label: "候补待航材" },
  { key: "recheck", label: "到货复核" },
  { key: "closed", label: "已关闭" },
];

interface BoardProps {
  defects: Defect[];
  crews: Crew[];
  onTransition: (id: string, next: DefectStatus, note?: string) => void;
}

export function DefectBoard({ defects, crews, onTransition }: BoardProps) {
  const [filter, setFilter] = useState<DefectStatus | "all">("all");
  const shown = defects.filter((d) => filter === "all" || d.status === filter);

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p>缺陷保留清单</p>
          <h2>保留与流转</h2>
        </div>
        <div className="chips">
          {filters.map((f) => (
            <button key={f.key} className={filter === f.key ? "chip-active" : ""} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="defect-list">
        {shown.length === 0 && <p className="empty">暂无记录</p>}
        {shown.map((d) => (
          <DefectCard key={d.id} defect={d} crews={crews} onTransition={onTransition} />
        ))}
      </div>
    </section>
  );
}

function DefectCard({ defect: d, crews, onTransition }: { defect: Defect; crews: Crew[]; onTransition: BoardProps["onTransition"] }) {
  const [partsNote, setPartsNote] = useState("");
  const crewName = crews.find((c) => c.id === d.crewId)?.name ?? d.crewId;
  const overdue = isOverdue(d);

  return (
    <article className={`defect-card ${overdue ? "overdue" : ""}`}>
      <header>
        <strong>{d.id}</strong>
        <span className={`badge badge-${d.status}`}>{statusLabels[d.status]}</span>
        {overdue && <span className="badge badge-overdue">已超期</span>}
        <span className="crew-tag">{crewName}</span>
      </header>
      <p className="meta">
        {d.aircraftType} · {d.ataChapter} · {d.zone} · 责任人 {d.owner}
      </p>
      <p className="desc">{d.description}</p>
      {d.partsNote && <p className="parts">缺件航材：{d.partsNote}</p>}
      <p className={`deadline ${overdue ? "danger-text" : ""}`}>
        保留期限 {fmtDate(d.deferralDeadline)}（{d.status === "closed" ? "已办结" : remainText(d.deferralDeadline)}）
      </p>

      {d.status !== "closed" && (
        <div className="actions">
          {d.status === "open" && (
            <>
              <input placeholder="缺件航材说明（转候补必填）" value={partsNote} onChange={(e) => setPartsNote(e.target.value)} />
              <button
                disabled={partsNote.trim().length === 0}
                onClick={() => {
                  onTransition(d.id, "parts_wait", `航材缺件：${partsNote.trim()}`);
                  setPartsNote("");
                }}
              >
                航材缺件，转候补
              </button>
              <button onClick={() => onTransition(d.id, "closed", "现场修复，直接关闭")}>直接关闭</button>
            </>
          )}
          {d.status === "parts_wait" && (
            <button className="primary-action" onClick={() => onTransition(d.id, "recheck", "航材到货")}>
              航材到货，转复核
            </button>
          )}
          {d.status === "recheck" && (
            <>
              <button className="primary-action" onClick={() => onTransition(d.id, "closed", "到货复核通过")}>
                复核通过，关闭
              </button>
              <button onClick={() => onTransition(d.id, "open", "复核不通过，退回保留")}>复核不通过，退回保留</button>
            </>
          )}
        </div>
      )}

      <ul className="history">
        {d.history.slice(-3).map((h, i) => (
          <li key={`${h.time}-${i}`}>
            {fmtTime(h.time)} · {h.actor} · {h.action}
          </li>
        ))}
      </ul>
    </article>
  );
}
