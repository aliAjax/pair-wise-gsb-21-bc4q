// 界面层：缺陷保留与放行台主框架（顶栏、指标、四个工作台）

import { useMemo, useState } from "react";
import "./styles.css";
import { useAppState, dispatch } from "../store/hooks";
import { CREWS } from "../data/reference";
import type { Crew } from "../data/types";
import { dueState } from "../logic/defects";
import { DefectBoard } from "./pages/DefectBoard";
import { PartsDesk } from "./pages/PartsDesk";
import { HandoverDesk } from "./pages/HandoverDesk";
import { ReleaseDesk } from "./pages/ReleaseDesk";
import { useToast } from "./toast";

type Tab = "defects" | "parts" | "handover" | "release";

const TABS: { key: Tab; label: string }[] = [
  { key: "defects", label: "缺陷保留台账" },
  { key: "parts", label: "航材候补台" },
  { key: "handover", label: "交接班" },
  { key: "release", label: "放行台" },
];

function Metrics() {
  const state = useAppState();
  const m = useMemo(() => {
    const open = state.defects.filter((d) => d.status !== "closed");
    return {
      open: open.length,
      waiting: state.defects.filter((d) => d.status === "awaitingPart").length,
      arrived: state.defects.filter((d) => d.status === "arrived").length,
      overdue: open.filter((d) => dueState(d) === "overdue").length,
      handover: state.handovers.filter((h) => h.status === "active").length,
      todo: state.releases.filter((r) => r.status === "todo").length,
    };
  }, [state]);

  const cards = [
    { label: "未关闭缺陷", value: m.open, sub: "保留中+候件+待复核", cls: "" },
    { label: "候件中", value: m.waiting, sub: "航材未到，持续跟踪", cls: "m-warn" },
    { label: "到货待复核", value: m.arrived, sub: "复核通过后关闭", cls: "m-purple" },
    { label: "保留已超期", value: m.overdue, sub: "需立即处置或延期", cls: "m-danger" },
    { label: "进行中交接", value: m.handover, sub: "逐条确认接管", cls: "m-warn" },
    { label: "放行待办", value: m.todo, sub: "闸门未过，写明原因", cls: m.todo ? "m-danger" : "m-ok" },
  ];

  return (
    <section className="metrics-grid">
      {cards.map((c) => (
        <article key={c.label} className={`metric-card ${c.cls}`}>
          <span>{c.label}</span>
          <strong>{c.value}</strong>
          <small>{c.sub}</small>
        </article>
      ))}
    </section>
  );
}

export default function App() {
  const state = useAppState();
  const { toast, node: toastNode } = useToast();
  const [tab, setTab] = useState<Tab>("defects");

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <h1>缺陷保留与放行台</h1>
          <p>过站缺陷全程保留 · 缺件候补 · 交接班逐条接管 · 放行闸门签署</p>
        </div>
        <div className="topbar-actions">
          <div className="crew-switch">
            当前班组
            <select
              value={state.currentCrew}
              onChange={(e) => dispatch({ type: "SET_CREW", crew: e.target.value as Crew })}
            >
              {CREWS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              if (window.confirm("重置为初始演示数据？当前办理记录会被覆盖。")) {
                dispatch({ type: "RESET" });
                toast("已恢复初始演示数据", "ok");
              }
            }}
          >
            重置演示数据
          </button>
        </div>
      </header>

      <Metrics />

      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? "active" : ""} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "defects" && <DefectBoard toast={toast} />}
      {tab === "parts" && <PartsDesk toast={toast} />}
      {tab === "handover" && <HandoverDesk toast={toast} />}
      {tab === "release" && <ReleaseDesk toast={toast} />}

      {toastNode}
    </main>
  );
}
