import { ROLES } from "../data/constants";
import ScoreRing from "../components/ScoreRing";

export default function Team({ users, inspections }) {
  const inspectors = users.filter(u => u.role === ROLES.INSPECTOR);

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Desempenho da Equipa (KPIs)</div><div className="page-sub">Métricas individuais dos inspetores</div></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
        {inspectors.map(insp => {
          const myInspections = inspections.filter(i => i.inspector_id === insp.id && i.type !== "leave");
          const completed = myInspections.filter(i => i.score_pct !== null);
          const avgScore = completed.length ? Math.round(completed.reduce((s, i) => s + i.score_pct, 0) / completed.length) : 0;
          const pending = myInspections.filter(i => i.status === "pending" || i.status === "in_progress").length;
          const alerts = myInspections.filter(i => i.alert_level === "critical" || i.alert_level === "warning").length;
          const declines = myInspections.filter(i => i.accepted === false).length;
          
          return (
            <div key={insp.id} className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#1E2A3A", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 16 }}>{insp.avatar}</div>
                <div><div style={{ fontWeight: 600, fontSize: 15 }}>{insp.name}</div><div style={{ color: "#888", fontSize: 12 }}>Inspetor de Campo</div></div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div><div style={{ fontSize: 11, color: "#888" }}>Score Médio</div><div style={{ fontSize: 13, fontWeight: 500 }}>{avgScore}%</div></div>
                <ScoreRing pct={avgScore} size={40} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                <div style={{ background: "#F8F7F4", padding: "8px", borderRadius: "6px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "#0F6E56" }}>{completed.length}</div>
                  <div style={{ fontSize: 10, color: "#888" }}>Concluídas</div>
                </div>
                <div style={{ background: "#F8F7F4", padding: "8px", borderRadius: "6px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "#EF9F27" }}>{pending}</div>
                  <div style={{ fontSize: 10, color: "#888" }}>Pendentes</div>
                </div>
                <div style={{ background: "#F8F7F4", padding: "8px", borderRadius: "6px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: declines > 0 ? "#A32D2D" : "#888" }}>{declines}</div>
                  <div style={{ fontSize: 10, color: "#888" }}>Recusas</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
