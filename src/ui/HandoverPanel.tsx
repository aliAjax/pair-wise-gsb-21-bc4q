// 界面层：交接班面板（逐条确认，未接管仍归原班组）
import type { Crew, Defect, Handover } from "../data/types";
import { handoverReady, isActive } from "../domain/logic";

interface Props {
  crews: Crew[];
  currentCrewId: string;
  handover: Handover | null;
  defects: Defect[];
  onSwitchCrew: (id: string) => void;
  onStart: () => void;
  onDecide: (defectId: string, accepted: boolean) => void;
  onFinish: () => void;
  onCancel: () => void;
}

export function HandoverPanel(props: Props) {
  const { crews, currentCrewId, handover, defects } = props;
  const current = crews.find((c) => c.id === currentCrewId);
  const other = crews.find((c) => c.id !== currentCrewId);
  const transferable = defects.filter((d) => d.crewId === currentCrewId && isActive(d));
  const crewName = (id: string) => crews.find((c) => c.id === id)?.name ?? id;

  return (
    <section className="panel">
      <h2>交接班</h2>
      <label className="crew-select">
        <span>当前班组</span>
        <select value={currentCrewId} disabled={handover !== null} onChange={(e) => props.onSwitchCrew(e.target.value)}>
          {crews.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      {handover === null ? (
        <>
          <p className="muted">
            本班未关闭缺陷 {transferable.length} 项。交接时接班方逐条确认，未接管的仍归 {current?.name ?? "原班组"}。
          </p>
          <button className="primary-action" disabled={transferable.length === 0 || !other} onClick={props.onStart}>
            发起交接 → {other?.name ?? "下一班"}
          </button>
        </>
      ) : (
        <div className="handover-active">
          <p className="muted">
            {crewName(handover.fromCrewId)} → {crewName(handover.toCrewId)}，请接班方逐条确认：
          </p>
          <ul className="handover-items">
            {handover.items.map((item) => {
              const d = defects.find((x) => x.id === item.defectId);
              if (!d) return null;
              return (
                <li key={item.defectId}>
                  <div className="handover-desc">
                    <strong>{d.id}</strong> {d.description}
                    <span className="muted">
                      {" "}
                      {d.ataChapter} · {d.zone} · 责任人 {d.owner}
                    </span>
                  </div>
                  <div className="decide">
                    <button className={item.accepted === true ? "chosen" : ""} onClick={() => props.onDecide(item.defectId, true)}>
                      接管
                    </button>
                    <button className={item.accepted === false ? "chosen" : ""} onClick={() => props.onDecide(item.defectId, false)}>
                      不接管
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="handover-footer">
            <button className="primary-action" disabled={!handoverReady(handover)} onClick={props.onFinish}>
              完成交接
            </button>
            <button onClick={props.onCancel}>取消交接</button>
          </div>
          {!handoverReady(handover) && <p className="muted">还有条目未确认，逐条选择「接管 / 不接管」后才能完成。</p>}
        </div>
      )}
    </section>
  );
}
