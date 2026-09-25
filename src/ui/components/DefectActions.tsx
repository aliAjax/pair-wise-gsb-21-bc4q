// 界面层：缺陷操作弹窗（转候补、到货、复核关闭、延期）

import { useState } from "react";
import type { Defect, DefectStatus } from "../../data/types";
import { Modal } from "./Common";

export type Opener =
  | { kind: "waitlist"; defect: Defect }
  | { kind: "arrive" | "close" | "extendDue" | "cancelWaitlist"; defect: Defect }
  | null;

export function DefectActionModal({
  opener,
  onClose,
  onConfirm,
}: {
  opener: Opener;
  onClose: () => void;
  onConfirm: (
    defectId: string,
    kind: Exclude<Opener, null>["kind"],
    payload: { pn?: string; partName?: string; note?: string; days?: number; reason?: string }
  ) => void;
}) {
  const [pn, setPn] = useState("");
  const [partName, setPartName] = useState("");
  const [note, setNote] = useState("");
  const [days, setDays] = useState(3);
  const [reason, setReason] = useState("");

  if (!opener) return null;
  const { kind, defect } = opener;

  const titleMap: Record<Exclude<Opener, null>["kind"], string> = {
    waitlist: "航材缺件，转候补",
    arrive: "登记航材到货",
    close: "到货复核后关闭缺陷",
    extendDue: "延长保留期限",
    cancelWaitlist: "撤销候补",
  };

  return (
    <Modal
      title={titleMap[kind]}
      sub={`${defect.id} · ${defect.tailNo} · ${defect.ata}`}
      onClose={onClose}
    >
      {kind === "waitlist" && (
        <div className="form-grid">
          <label>
            件号
            <input defaultValue={defect.pn} onChange={(e) => setPn(e.target.value)} placeholder="PN-..." />
          </label>
          <label>
            航材名称
            <input
              defaultValue={defect.partName}
              onChange={(e) => setPartName(e.target.value)}
              placeholder="如：主轮组件"
            />
          </label>
          <p className="hint span-3">转候补后缺陷继续保留，不会因交接丢失；航材到货时在此站登记并复核。</p>
        </div>
      )}
      {kind === "arrive" && (
        <p className="hint">确认 {defect.partName || defect.pn || "该航材"} 已到货？状态将变为「到货待复核」，复核通过方可关闭。</p>
      )}
      {kind === "close" && (
        <div className="form-grid">
          <label className="span-3">
            复核结论
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例如：更换主轮后渗漏/磨耗检查正常，功能测试通过"
            />
          </label>
        </div>
      )}
      {kind === "extendDue" && (
        <div className="form-grid">
          <label>
            延长天数
            <input type="number" min={1} value={days} onChange={(e) => setDays(Number(e.target.value))} />
          </label>
          <label className="span-2">
            延期依据 / 原因
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="如：MEL 允许重新申办，工卡已批准" />
          </label>
        </div>
      )}
      {kind === "cancelWaitlist" && <p className="hint">航材需求撤销或已有别的处置方式？缺陷将回到「保留中」。</p>}

      <div className="form-actions">
        <button onClick={onClose}>取消</button>
        <button
          className="btn-primary"
          onClick={() => {
            onConfirm(defect.id, kind, { pn, partName, note, days, reason });
            onClose();
          }}
        >
          确认
        </button>
      </div>
    </Modal>
  );
}

/** 各状态下可执行的操作按钮 */
export function ActionButtons({
  status,
  onOpen,
}: {
  status: DefectStatus;
  onOpen: (kind: Exclude<Opener, null>["kind"]) => void;
}) {
  if (status === "open")
    return (
      <div className="action-row">
        <button className="btn-warn btn-sm" onClick={() => onOpen("waitlist")}>
          航材缺件 → 转候补
        </button>
        <button className="btn-ok btn-sm" onClick={() => onOpen("close")}>
          复核关闭
        </button>
        <button className="btn-sm" onClick={() => onOpen("extendDue")}>
          延期
        </button>
      </div>
    );
  if (status === "awaitingPart")
    return (
      <div className="action-row">
        <button className="btn-primary btn-sm" onClick={() => onOpen("arrive")}>
          航材到货
        </button>
        <button className="btn-sm" onClick={() => onOpen("cancelWaitlist")}>
          撤销候补
        </button>
        <button className="btn-sm" onClick={() => onOpen("extendDue")}>
          延期
        </button>
      </div>
    );
  if (status === "arrived")
    return (
      <div className="action-row">
        <button className="btn-ok btn-sm" onClick={() => onOpen("close")}>
          复核关闭
        </button>
        <button className="btn-sm" onClick={() => onOpen("extendDue")}>
          延期
        </button>
      </div>
    );
  return null;
}
