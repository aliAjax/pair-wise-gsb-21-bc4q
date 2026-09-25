// 界面层：缺陷卡片（资料字段、状态、保留期限时效、责任归属、时间线）

import { useState } from "react";
import type { Defect } from "../../data/types";
import { dueState } from "../../logic/defects";
import { fmt, fmtDay } from "../../logic/time";
import { ActionButtons, type Opener } from "./DefectActions";
import { StatusBadge } from "./Common";

type ActionKind = Exclude<Opener, null>["kind"];

export function DefectCard({
  defect,
  onAction,
  highlightId,
}: {
  defect: Defect;
  onAction: (kind: ActionKind) => void;
  highlightId?: string;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const due = dueState(defect);

  return (
    <article
      className={`defect-card ${due === "overdue" ? "overdue" : due === "dueSoon" ? "due-soon" : ""}`}
      id={highlightId === defect.id ? "highlight" : undefined}
      style={highlightId === defect.id ? { outline: "2px solid var(--primary)" } : undefined}
    >
      <div className="defect-head">
        <div className="defect-title">
          <span className="defect-id">{defect.id}</span>
          <h3>
            {defect.aircraftType} · {defect.tailNo}
          </h3>
          <StatusBadge status={defect.status} />
          {due === "overdue" && <span className="badge badge-overdue">保留已超期</span>}
          {due === "dueSoon" && <span className="badge badge-dueSoon">保留临期（48h内）</span>}
        </div>
        <button className="btn-sm" onClick={() => setShowHistory((v) => !v)}>
          {showHistory ? "收起记录" : "办理记录"}
        </button>
      </div>

      <div className="defect-meta">
        <span className="meta-pill">
          <strong>{defect.ata}</strong>
        </span>
        <span className="meta-pill">区域：{defect.zone}</span>
        <span className="meta-pill">类别：{defect.category}</span>
        <span className="meta-pill">
          保留期限至 <strong>{fmtDay(defect.dueDate)}</strong>
        </span>
        <span className="badge badge-crew">{defect.crew}</span>
      </div>

      <p className="defect-desc">{defect.description}</p>

      <div className="defect-footer">
        <div className="owner-line">
          责任人 <strong>{defect.owner}</strong>
          {defect.status === "awaitingPart" && (
            <>
              {" "}
              · 候件 {defect.partName || "未命名航材"} {defect.pn ? `(${defect.pn})` : ""} · 自{" "}
              {fmt(defect.waitlistSince)} 起候补
            </>
          )}
          {defect.status === "arrived" && <> · {defect.partName || defect.pn} 已于 {fmt(defect.arrivedAt)} 到货</>}
          {defect.status === "closed" && <> · {defect.closeNote}</>}
        </div>
        <ActionButtons status={defect.status} onOpen={onAction} />
      </div>

      {showHistory && (
        <div className="timeline">
          {defect.history.map((ev, i) => (
            <div className="timeline-item" key={i}>
              <time>{fmt(ev.time)}</time>
              <div>
                <b>{ev.actor}</b> {ev.text}
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
