// 界面层：交接班台
// 发起交接后逐条确认；接班人点"接管"归属才转移，未接管条目即使交接完成仍归原班组。

import { useMemo, useState } from "react";
import { useAppState, dispatch } from "../../store/hooks";
import { CREWS } from "../../data/reference";
import type { Crew, Handover } from "../../data/types";
import { fmt } from "../../logic/time";
import { handoverProgress, handoverSummary } from "../../logic/handovers";
import { StatusBadge, Empty } from "../components/Common";
import type { ToastApi } from "../toast";

function ActiveHandover({
  handover,
  toast,
}: {
  handover: Handover;
  toast: ToastApi;
}) {
  const state = useAppState();
  const { done, total } = handoverProgress(handover);
  const defectOf = (id: string) => state.defects.find((d) => d.id === id);

  return (
    <article className="item-card">
      <h3>
        进行中：{handover.fromCrew} → {handover.toCrew}
        <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}>
          {handover.id} · {fmt(handover.startedAt)} 发起
        </span>
      </h3>
      <div className="progress-bar">
        <i style={{ width: `${(done / total) * 100}%` }} />
      </div>
      <p className="item-sub">
        已接管 {done}/{total}。请接班人逐条确认；未接管条目在交接完成后仍归{handover.fromCrew}。
      </p>

      <div className="item-list">
        {handover.items.map((it) => {
          const d = defectOf(it.defectId);
          if (!d) return null;
          return (
            <div key={it.defectId} className={`handoff-item ${it.accepted ? "accepted" : ""}`}>
              <div className="info">
                <h4>
                  {d.tailNo} · {d.ata}
                  <span style={{ marginLeft: 8 }}>
                    <StatusBadge status={d.status} />
                  </span>
                </h4>
                <p>{d.description}</p>
                <p>
                  当前归属：<strong>{d.crew}</strong> · 责任人 {d.owner} · 保留期限{" "}
                  {fmt(d.dueDate)}
                  {it.accepted && it.acceptedAt ? ` · ${fmt(it.acceptedAt)} 已接管` : ""}
                </p>
              </div>
              {it.accepted ? (
                <span className="badge badge-closed">已由{handover.toCrew}接管</span>
              ) : (
                <button
                  className="btn-primary btn-sm"
                  onClick={() => {
                    const r = dispatch({
                      type: "ACCEPT_ITEM",
                      handoverId: handover.id,
                      defectId: it.defectId,
                    });
                    toast(
                      r.ok ? `已接管 ${d.tailNo} 缺陷，归属转至${handover.toCrew}` : r.error ?? "操作失败",
                      r.ok ? "ok" : "err"
                    );
                  }}
                >
                  {handover.toCrew}确认接管
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="form-actions">
        <button
          className="btn-danger"
          onClick={() => {
            const r = dispatch({ type: "COMPLETE_HANDOVER", handoverId: handover.id });
            toast(
              r.ok
                ? `交接班已结束：${done}/${total} 项已接管，其余仍归${handover.fromCrew}`
                : r.error ?? "操作失败",
              r.ok ? "ok" : "err"
            );
          }}
        >
          完成交接（未接管项留在{handover.fromCrew}）
        </button>
      </div>
    </article>
  );
}

export function HandoverDesk({ toast }: { toast: ToastApi }) {
  const state = useAppState();
  const [toCrew, setToCrew] = useState<Crew>("乙班");

  const active = useMemo(
    () => state.handovers.filter((h) => h.status === "active"),
    [state.handovers]
  );
  const completed = useMemo(
    () =>
      state.handovers
        .filter((h) => h.status === "completed")
        .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? "")),
    [state.handovers]
  );

  const currentActive = active.find((h) => h.fromCrew === state.currentCrew);

  return (
    <>
      <section className="panel">
        <div className="section-heading">
          <div>
            <p>交接班</p>
            <h2>发起交接 · {state.currentCrew}</h2>
          </div>
        </div>
        {currentActive ? (
          <p className="hint">{state.currentCrew}已有进行中的交接班，请在下方逐条办理。</p>
        ) : (
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ minWidth: 180 }}>
              接班班组
              <select value={toCrew} onChange={(e) => setToCrew(e.target.value as Crew)}>
                {CREWS.filter((c) => c !== state.currentCrew).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <button
              className="btn-primary"
              style={{ marginTop: 16 }}
              onClick={() => {
                const r = dispatch({
                  type: "START_HANDOVER",
                  fromCrew: state.currentCrew,
                  toCrew,
                });
                toast(
                  r.ok ? `已发起 ${state.currentCrew} → ${toCrew} 交接班，请逐条确认` : r.error ?? "发起失败",
                  r.ok ? "ok" : "err"
                );
              }}
            >
              发起交接班
            </button>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p>逐条确认</p>
            <h2>进行中的交接班（{active.length}）</h2>
          </div>
        </div>
        {active.length === 0 ? (
          <Empty text="当前没有进行中的交接班" />
        ) : (
          <div className="item-list">
            {active.map((h) => (
              <ActiveHandover key={h.id} handover={h} toast={toast} />
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p>交接留痕</p>
            <h2>历史交接班</h2>
          </div>
        </div>
        {completed.length === 0 ? (
          <Empty text="暂无已完成的交接班记录" />
        ) : (
          <div className="item-list">
            {completed.map((h) => (
              <div key={h.id} className="item-card">
                <h3>
                  {h.fromCrew} → {h.toCrew}
                  <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}>
                    {h.id} · {fmt(h.completedAt)} 完成
                  </span>
                </h3>
                <p className="item-sub">{handoverSummary(h, state.defects)}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
