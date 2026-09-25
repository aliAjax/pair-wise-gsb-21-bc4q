// 界面层：通用小组件（徽章、弹窗、轻提示、空态）

import type { ReactNode } from "react";
import { STATUS_LABEL } from "../../data/reference";
import type { DefectStatus, ReleaseStatus } from "../../data/types";

export function StatusBadge({ status }: { status: DefectStatus }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>;
}

export function ReleaseBadge({ status }: { status: ReleaseStatus }) {
  return (
    <span className={`badge badge-${status}`}>
      {status === "released" ? "✓ 已放行" : "⛔ 待办（签署被拦）"}
    </span>
  );
}

export function Modal({
  title,
  sub,
  children,
  onClose,
}: {
  title: string;
  sub?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true">
        <h2>{title}</h2>
        {sub && <p className="modal-sub">{sub}</p>}
        {children}
      </div>
    </div>
  );
}

export function Toast({ text, kind }: { text: string; kind: "ok" | "err" }) {
  return <div className={`toast toast-${kind}`}>{text}</div>;
}

export function Empty({ text }: { text: string }) {
  return <div className="empty">{text}</div>;
}
