// 界面层：放行台
// 签署前检查两道闸门：未关闭缺陷、机位冲突。
// 有任一不过 → 签署停在"待办"并写明原因；排除后可对同一条待办再次签署。

import { useMemo, useState } from "react";
import { useAppState, dispatch } from "../../store/hooks";
import { ALL_TAILS, STANDS, STAND_BUFFER_AFTER_MIN, STAND_BUFFER_BEFORE_MIN } from "../../data/reference";
import type { Release } from "../../data/types";
import type { ReleaseRequest } from "../../logic/releases";
import { toLocalInput, fmt } from "../../logic/time";
import { ReleaseBadge, Empty } from "../components/Common";
import type { ToastApi } from "../toast";

function defaultTimes(): { in: string; out: string } {
  const d = new Date();
  d.setHours(d.getHours() + 2, 0, 0, 0);
  const inT = d;
  const out = new Date(d.getTime() + 50 * 60_000);
  return { in: toLocalInput(inT), out: toLocalInput(out) };
}

function GateRows({ release }: { release: Release }) {
  return (
    <div className="gate-list">
      {release.gates.map((g) => (
        <div key={g.key} className={`gate-row ${g.pass ? "pass" : "fail"}`}>
          <span className="gate-icon">{g.pass ? "✓" : "✕"}</span>
          <div>
            <strong>{g.label}</strong>
            <div className="muted">{g.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReleaseCard({ release, toast }: { release: Release; toast: ToastApi }) {
  return (
    <article className={`item-card ${release.status === "todo" ? "blocked" : "passed"}`}>
      <h3>
        {release.flightNo} · {release.tailNo}（{release.aircraftType}）· 机位 {release.stand}
        <ReleaseBadge status={release.status} />
      </h3>
      <p className="item-sub">
        计划 {fmt(release.scheduledIn)} 入位 ~ {fmt(release.scheduledOut)} 离位 · 签署人 {release.signer}
        {release.releasedAt ? ` · ${fmt(release.releasedAt)} 放行` : ` · ${fmt(release.attemptedAt)} 尝试签署`}
      </p>
      <GateRows release={release} />
      {release.status === "todo" ? (
        <>
          <div className="blocker-box">
            签署停在待办，原因：
            <ul>
              {release.blockers.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
          <button
            className="btn-primary btn-sm"
            onClick={() => {
              const r = dispatch({ type: "RETRY_RELEASE", id: release.id });
              if (!r.ok) toast(r.error ?? "操作失败", "err");
              else
                toast(
                  r.meta?.release?.status === "released"
                    ? "闸门已全部通过，完成放行"
                    : "仍有闸门未通过，继续留在待办（原因已更新）",
                  r.meta?.release?.status === "released" ? "ok" : "err"
                );
            }}
          >
            排除原因后再次签署
          </button>
        </>
      ) : (
        <p className="hint">闸门全部通过，已签署放行。</p>
      )}
    </article>
  );
}

export function ReleaseDesk({ toast }: { toast: ToastApi }) {
  const state = useAppState();
  const times = useMemo(defaultTimes, []);
  const [form, setForm] = useState<ReleaseRequest>({
    flightNo: "",
    tailNo: ALL_TAILS[0].tail,
    aircraftType: ALL_TAILS[0].type,
    stand: STANDS[0],
    scheduledIn: times.in,
    scheduledOut: times.out,
    signer: "",
  });

  const todos = state.releases.filter((r) => r.status === "todo");
  const released = state.releases.filter((r) => r.status === "released");

  function set<K extends keyof ReleaseRequest>(key: K, value: ReleaseRequest[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <>
      <section className="panel">
        <div className="section-heading">
          <div>
            <p>放行签署</p>
            <h2>过站放行申请</h2>
          </div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (new Date(form.scheduledOut) <= new Date(form.scheduledIn)) {
              toast("离位时间需晚于入位时间", "err");
              return;
            }
            const r = dispatch({
              type: "ATTEMPT_RELEASE",
              req: { ...form, flightNo: form.flightNo.trim().toUpperCase(), signer: form.signer.trim() },
            });
            if (!r.ok) toast(r.error ?? "签署失败", "err");
            else
              toast(
                r.meta?.release?.status === "released"
                  ? "闸门全部通过，已签署放行"
                  : "闸门未通过，签署停在待办，原因已写明",
                r.meta?.release?.status === "released" ? "ok" : "err"
              );
          }}
        >
          <div className="form-grid">
            <label>
              航班号
              <input
                value={form.flightNo}
                onChange={(e) => set("flightNo", e.target.value)}
                placeholder="如 MU3320"
                required
              />
            </label>
            <label>
              机号
              <select
                value={form.tailNo}
                onChange={(e) => {
                  const found = ALL_TAILS.find((t) => t.tail === e.target.value);
                  setForm((f) => ({ ...f, tailNo: e.target.value, aircraftType: found?.type ?? f.aircraftType }));
                }}
              >
                {ALL_TAILS.map((t) => (
                  <option key={t.tail} value={t.tail}>
                    {t.tail}（{t.type}）
                  </option>
                ))}
              </select>
            </label>
            <label>
              机型
              <input value={form.aircraftType} readOnly />
            </label>
            <label>
              机位
              <select value={form.stand} onChange={(e) => set("stand", e.target.value)}>
                {STANDS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              计划入位
              <input
                type="datetime-local"
                value={form.scheduledIn}
                onChange={(e) => set("scheduledIn", e.target.value)}
                required
              />
            </label>
            <label>
              计划离位
              <input
                type="datetime-local"
                value={form.scheduledOut}
                onChange={(e) => set("scheduledOut", e.target.value)}
                required
              />
            </label>
            <label className="span-3">
              签署人
              <input
                value={form.signer}
                onChange={(e) => set("signer", e.target.value)}
                placeholder="如 放行 · 何平"
                required
              />
            </label>
          </div>
          <p className="hint">
            机位占用按入位前 {STAND_BUFFER_BEFORE_MIN} 分钟、离位后 {STAND_BUFFER_AFTER_MIN} 分钟缓冲判冲突；
            该机号有任何未关闭缺陷（含超期/临期）都会拦下签署。
          </p>
          <div className="form-actions">
            <button className="btn-primary" type="submit">
              签署放行
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p>闸门未过的签署</p>
            <h2>待办（{todos.length}）</h2>
          </div>
        </div>
        {todos.length === 0 ? (
          <Empty text="没有待办，闸门全部通过" />
        ) : (
          <div className="item-list">
            {todos.map((r) => (
              <ReleaseCard key={r.id} release={r} toast={toast} />
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p>放行留痕</p>
            <h2>已放行（{released.length}）</h2>
          </div>
        </div>
        {released.length === 0 ? (
          <Empty text="暂无放行记录" />
        ) : (
          <div className="item-list">
            {released.map((r) => (
              <ReleaseCard key={r.id} release={r} toast={toast} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
