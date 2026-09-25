// 界面层：航材候补台
// 候件中：跟踪缺件与候补时长；到货待复核：复核后关闭，两条队列都不会被交接班漏掉。

import { useMemo, useState } from "react";
import { useAppState, dispatch } from "../../store/hooks";
import { DefectCard } from "../components/DefectCard";
import { DefectActionModal, type Opener } from "../components/DefectActions";
import { Empty } from "../components/Common";
import { dueState } from "../../logic/defects";
import type { Defect } from "../../data/types";
import type { ToastApi } from "../toast";

function waitHours(iso?: string): number {
  if (!iso) return 0;
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 3600_000));
}

function QueueSummary({ defects, title, desc }: { defects: Defect[]; title: string; desc: string }) {
  const overdue = defects.filter((d) => dueState(d) === "overdue").length;
  return (
    <div className="section-heading">
      <div>
        <p>{desc}</p>
        <h2>
          {title} <span className="muted">（{defects.length} 项{overdue ? `，${overdue} 项保留已超期` : ""}）</span>
        </h2>
      </div>
    </div>
  );
}

export function PartsDesk({ toast, highlightId }: { toast: ToastApi; highlightId?: string }) {
  const state = useAppState();
  const [opener, setOpener] = useState<Opener>(null);

  const waiting = useMemo(
    () =>
      state.defects
        .filter((d) => d.status === "awaitingPart")
        .sort((a, b) => (a.waitlistSince ?? "").localeCompare(b.waitlistSince ?? "")),
    [state.defects]
  );
  const arrived = useMemo(
    () => state.defects.filter((d) => d.status === "arrived"),
    [state.defects]
  );

  function confirmAction(
    defectId: string,
    kind: Exclude<Opener, null>["kind"],
    payload: { note?: string }
  ) {
    const r = dispatch({
      type: "DEFECT_ACTION",
      id: defectId,
      kind,
      actor: `${state.currentCrew}`,
      ...payload,
    });
    toast(r.ok ? "办理完成" : r.error ?? "操作失败", r.ok ? "ok" : "err");
  }

  return (
    <>
      <section className="panel">
        <QueueSummary
          defects={waiting}
          title="缺件候补队列"
          desc="航材没到 → 先转候补，责任班组持续跟踪"
        />
        {waiting.length === 0 ? (
          <Empty text="暂无候件中的缺陷" />
        ) : (
          <div className="defect-list">
            {waiting.map((d) => (
              <DefectCard
                key={d.id}
                defect={d}
                highlightId={highlightId}
                onAction={(kind) => setOpener({ kind, defect: d })}
              />
            ))}
          </div>
        )}
        <p className="hint" style={{ marginTop: 10 }}>
          最早入列已候补 {waiting.length ? waitHours(waiting[0].waitlistSince) : 0} 小时，最近入列{" "}
          {waiting.length ? waitHours(waiting[waiting.length - 1].waitlistSince) : 0} 小时。
        </p>
      </section>

      <section className="panel">
        <QueueSummary
          defects={arrived}
          title="到货待复核"
          desc="航材到货后必须复核，通过才允许关闭"
        />
        {arrived.length === 0 ? (
          <Empty text="暂无到货待复核项" />
        ) : (
          <div className="defect-list">
            {arrived.map((d) => (
              <DefectCard
                key={d.id}
                defect={d}
                highlightId={highlightId}
                onAction={(kind) => setOpener({ kind, defect: d })}
              />
            ))}
          </div>
        )}
      </section>

      <DefectActionModal opener={opener} onClose={() => setOpener(null)} onConfirm={confirmAction} />
    </>
  );
}
