import { useEffect, useMemo, useState } from "react";
import "./styles.css";
import type { DefectStatus, StationState } from "./data/types";
import { seedState } from "./data/seed";
import { clearState, loadState, saveState } from "./store/storage";
import {
  completeHandover,
  decideHandoverItem,
  evaluateRelease,
  nextDefectId,
  openHandover,
  signRelease,
  transitionDefect,
} from "./domain/logic";
import { NewDefectForm } from "./ui/NewDefectForm";
import type { NewDefectInput } from "./ui/NewDefectForm";
import { DefectBoard } from "./ui/DefectBoard";
import { HandoverPanel } from "./ui/HandoverPanel";
import { ReleaseDesk } from "./ui/ReleaseDesk";

function MetricCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <i className={`tone-${tone}`} />
    </article>
  );
}

function App() {
  // 保存层：启动时读取，之后每次变更自动落盘，重开接着办理
  const [state, setState] = useState<StationState>(() => loadState() ?? seedState());
  useEffect(() => {
    saveState(state);
  }, [state]);

  const currentCrew = state.crews.find((c) => c.id === state.currentCrewId) ?? state.crews[0];

  const counts = useMemo(() => {
    const by = (s: DefectStatus) => state.defects.filter((d) => d.status === s).length;
    return {
      open: by("open"),
      partsWait: by("parts_wait"),
      recheck: by("recheck"),
      closed: by("closed"),
      pendingRelease: state.releases.filter((r) => r.status === "pending").length,
    };
  }, [state.defects, state.releases]);

  function addDefect(input: NewDefectInput) {
    setState((s) => ({
      ...s,
      defects: [
        {
          id: nextDefectId(s.defects),
          ...input,
          crewId: s.currentCrewId,
          status: "open" as const,
          partsNote: "",
          history: [{ time: new Date().toISOString(), actor: currentCrew.name, action: "过站检查发现缺陷，登记保留" }],
        },
        ...s.defects,
      ],
    }));
  }

  function changeStatus(id: string, next: DefectStatus, note = "") {
    setState((s) => ({
      ...s,
      defects: s.defects.map((d) => (d.id === id ? transitionDefect(d, next, currentCrew.name, note) : d)),
    }));
  }

  function startHandover() {
    const other = state.crews.find((c) => c.id !== state.currentCrewId);
    if (!other) return;
    setState((s) => ({ ...s, handover: openHandover(s, other.id) }));
  }

  function decideItem(defectId: string, accepted: boolean) {
    setState((s) => (s.handover ? { ...s, handover: decideHandoverItem(s.handover, defectId, accepted) } : s));
  }

  function finishHandover() {
    setState((s) => completeHandover(s));
  }

  function cancelHandover() {
    setState((s) => ({ ...s, handover: null }));
  }

  function switchCrew(id: string) {
    setState((s) => (s.handover ? s : { ...s, currentCrewId: id }));
  }

  function sign(releaseId: string, signer: string) {
    setState((s) => ({
      ...s,
      releases: s.releases.map((r) =>
        r.id === releaseId ? signRelease(r, evaluateRelease(r, s.defects, s.standSlots), signer) : r
      ),
    }));
  }

  function resetAll() {
    if (window.confirm("确定清空当前数据并恢复示例数据？")) {
      clearState();
      setState(seedState());
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">hxwl-07 · 过站维修</p>
          <h1>缺陷保留与放行台</h1>
          <p className="subtitle">
            过站缺陷登记保留，航材缺件转候补、到货复核后关闭；交接班逐条确认，未接管仍归原班组；放行前校验未关闭缺陷与机位冲突，存在阻塞时签署停在待办并写明原因。数据自动保存，重开页面接着办理。
          </p>
        </div>
        <div className="stack-card">
          <span>当前班组</span>
          <strong>{currentCrew.name}</strong>
          <button onClick={resetAll}>恢复示例数据</button>
        </div>
      </section>

      <section className="metrics-grid">
        <MetricCard label="保留中" value={counts.open} tone="ok" />
        <MetricCard label="候补待航材" value={counts.partsWait} tone="warn" />
        <MetricCard label="到货复核" value={counts.recheck} tone="info" />
        <MetricCard label="已关闭" value={counts.closed} tone="done" />
        <MetricCard label="放行待办" value={counts.pendingRelease} tone="danger" />
      </section>

      <section className="station-grid">
        <aside className="side">
          <NewDefectForm onAdd={addDefect} />
          <HandoverPanel
            crews={state.crews}
            currentCrewId={state.currentCrewId}
            handover={state.handover}
            defects={state.defects}
            onSwitchCrew={switchCrew}
            onStart={startHandover}
            onDecide={decideItem}
            onFinish={finishHandover}
            onCancel={cancelHandover}
          />
        </aside>
        <DefectBoard defects={state.defects} crews={state.crews} onTransition={changeStatus} />
      </section>

      <ReleaseDesk releases={state.releases} defects={state.defects} slots={state.standSlots} onSign={sign} />
    </main>
  );
}

export default App;
