// 界面层：放行台（闸门校验 + 签署）
import { useState } from "react";
import type { Defect, Release, StandSlot } from "../data/types";
import { evaluateRelease } from "../domain/logic";
import { fmtDateTime } from "./format";

interface Props {
  releases: Release[];
  defects: Defect[];
  slots: StandSlot[];
  onSign: (releaseId: string, signer: string) => void;
}

export function ReleaseDesk({ releases, defects, slots, onSign }: Props) {
  const [signers, setSigners] = useState<Record<string, string>>({});

  return (
    <section className="panel releases">
      <div className="section-heading">
        <div>
          <p>放行台</p>
          <h2>放行签署</h2>
        </div>
      </div>
      <div className="release-list">
        {releases.map((r) => {
          const gate = evaluateRelease(r, defects, slots);
          const signer = signers[r.id] ?? "";
          const canSign = r.status === "pending" && gate.ok && signer.trim().length > 0;
          return (
            <article key={r.id} className="release-card">
              <header>
                <strong>{r.flight}</strong>
                <span className="meta">
                  {r.aircraftType} · 机位 {r.stand} · 计划离港 {fmtDateTime(r.departure)}
                </span>
                <span className={`badge badge-${r.status}`}>{r.status === "pending" ? "待办" : "已放行"}</span>
              </header>

              {r.status === "released" ? (
                <p className="ok-text">
                  已放行：{r.signedBy} 签署于 {fmtDateTime(r.signedAt)}
                </p>
              ) : gate.ok ? (
                <p className="ok-text">未关闭缺陷 0 项，机位无冲突，满足放行条件。</p>
              ) : (
                <ul className="reasons">
                  {gate.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              )}

              {r.status === "pending" && (
                <div className="sign-row">
                  <input
                    placeholder="签署人"
                    value={signer}
                    onChange={(e) => setSigners((m) => ({ ...m, [r.id]: e.target.value }))}
                  />
                  <button className="primary-action" disabled={!canSign} onClick={() => onSign(r.id, signer.trim())}>
                    {gate.ok ? "签署放行" : "存在阻塞，停在待办"}
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
