import { Icon } from "../lib/icons";

export default function LiveMap({ inspections, users }) {
  const activeInspections = inspections.filter(i => i.status === "in_progress" || i.status === "submitted");
  
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Mapa de Campo (Localização)</div><div className="page-sub">Inspetores ativos no campo</div></div>
      </div>

      <div className="two-col">
        <div className="card" style={{ height: "500px", padding: 0, overflow: "hidden", position: "relative" }}>
          {activeInspections.length > 0 && activeInspections[0].gps_coords ? (
            <iframe title="Live Map" width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen src={`https://www.google.com/maps?q=${activeInspections[0].gps_coords}&z=13&output=embed`} />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#888" }}>
              <div style={{ textAlign: "center" }}>
                <Icon name="location" size={32} style={{ color: "#ccc", marginBottom: "8px" }} />
                <div>Nenhuma inspeção ativa com GPS no momento.</div>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>Atividade no Campo</h3>
          {activeInspections.length === 0 ? (
            <div style={{ color: "#888", fontSize: 13, textAlign: "center", padding: "20px" }}>Nenhum inspetor ativo.</div>
          ) : (
            activeInspections.map(insp => {
              const inspector = users.find(u => u.id === insp.inspector_id);
              return (
                <div key={insp.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #eee" }}>
                  <div style={{ width: 10, height: 10, borderRadius: 50, background: insp.status === "in_progress" ? "#EF9F27" : "#0F6E56" }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{insp.location_name}</div>
                    <div style={{ color: "#888", fontSize: 12 }}>{inspector?.name} · {insp.date}</div>
                  </div>
                  {insp.gps_coords && (
                    <a href={`https://maps.google.com/?q=${insp.gps_coords}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                      <Icon name="location" size={12} /> Ver Mapa
                    </a>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
