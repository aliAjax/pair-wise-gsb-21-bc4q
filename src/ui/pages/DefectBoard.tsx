// 界面层：缺陷保留台账（登记、筛选、状态流转入口）

import { useMemo, useState } from "react";
import { useAppState, dispatch } from "../../store/hooks";
import type { DefectDraft } from "../../data/types";
import { DefectForm } from "../components/DefectForm";
import { DefectCard } from "../components/DefectCard";
import { DefectActionModal, type Opener } from "../components/DefectActions";
import { Empty } from "../components/Common";
import { STATUS_LABEL } from "../../data/reference";
import type { DefectStatus } from "../../data/types";
import type { ToastApi } from "../toast";

type Filter = "all" | DefectStatus | "mine" | "overdue";

export function DefectBoard({ toast, highlightId }: { toast: ToastApi; highlightId?: string }) {
  const state = useAppState();
  const [filter, setFilter] = useState<Filter>("all");
  const [opener, setOpener] = useState<Opener>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      all: state.defects.length,
      open: 0,
      awaitingPart: 0,
      arrived: 0,
      closed: 0,
      mine: 0,
      overdue: 0,
    };
    for (const d of state.defects) {
      c[d.status]++;
      if (d.crew === state.currentCrew) c.mine++;
      const due = new Date(d.dueDate).getTime();
      if (d.status !== "closed" && due < Date.now()) c.overdue++;
    }
    return c;
  }, [state.defects, state.currentCrew]);

  const list = useMemo(() => {
    return state.defects.filter((d) => {
      if (filter === "all") return true;
      if (filter === "mine") return d.crew === state.currentCrew;
      if (filter === "overdue") return d.status !== "closed" && new Date(d.dueDate).getTime() < Date.now();
      return d.status === filter;
    });
  }, [state.defects, filter, state.currentCrew]);

  function submitDraft(draft: DefectDraft): boolean {
    const r = dispatch({ type: "ADD_DEFECT", draft });
    toast(r.ok ? "缺陷已登记保留，班组交接前会持续跟踪" : r.error ?? "登记失败", r.ok ? "ok" : "err");
    return r.ok;
  }

  function confirmAction(
    defectId: string,
    kind: Exclude<Opener, null>["kind"],
    payload: { pn?: string; partName?: string; note?: string; days?: number; reason?: string }
  ) {
    const r = dispatch({
      type: "DEFECT_ACTION",
      id: defectId,
      kind,
      actor: `${state.currentCrew}`,
      ...payload,
    });
    if (!r.ok) toast(r.error ?? "操作失败", "err");
    else {
      const done: Record<string, string> = {
        waitlist: "已转候补，等待航材到货",
        arrive: "航材已登记到货，请复核后关闭",
        close: "复核通过，缺陷已关闭",
        extendDue: "保留期限已更新",
        cancelWaitlist: "已撤销候补，转回保留中",
      };
      toast(done[kind], "ok");
    }
  }

  const filterDefs: { key: Filter; label: string }[] = [
    { key: "all", label: `全部 ${counts.all}` },
    { key: "open", label: `${STATUS_LABEL.open} ${counts.open}` },
    { key: "awaitingPart", label: `${STATUS_LABEL.awaitingPart} ${counts.awaitingPart}` },
    { key: "arrived", label: `${STATUS_LABEL.arrived} ${counts.arrived}` },
    { key: "closed", label: `${STATUS_LABEL.closed} ${counts.closed}` },
    { key: "mine", label: `${state.currentCrew}名下 ${counts.mine}` },
    { key: "overdue", label: `已超期 ${counts.overdue}` },
  ];

  return (
    <>
      <section className="panel">
        <div className="section-heading">
          <div>
            <p>缺陷登记</p>
            <h2>过站缺陷保留</h2>
          </div>
        </div>
        <DefectForm onSubmit={submitDraft} />
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p>保留台账</p>
            <h2>缺陷清单</h2>
          </div>
        </div>
        <div className="filters">
          {filterDefs.map((f) => (
            <button
              key={f.key}
              className={filter === f.key ? "active" : ""}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="defect-list">
          {list.length === 0 ? (
            <Empty text="该筛选下暂无缺陷记录" />
          ) : (
            list.map((d) => (
              <DefectCard
                key={d.id}
                defect={d}
                highlightId={highlightId}
                onAction={(kind) => setOpener({ kind, defect: d })}
              />
            ))
          )}
        </div>
      </section>

      <DefectActionModal opener={opener} onClose={() => setOpener(null)} onConfirm={confirmAction} />
    </>
  );
}
