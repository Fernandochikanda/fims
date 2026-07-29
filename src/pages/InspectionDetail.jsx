import { useState, useEffect } from "react";
import { Icon } from "../lib/icons";
import ScoreRing from "../components/ScoreRing";
import StatusBadge from "../components/StatusBadge";
import { photoStore } from "../lib/photoStore";
import { TEMPLATE_SECTIONS, ROLES } from "../data/constants";
import { scoreLabel } from "../lib/helpers";

export default function InspectionDetail({ inspection, currentUser, onBack, onUpdate, addAuditLog }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [photosByItem, setPhotosByItem] = useState({});
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [rejectNote, setRejectNote] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);

  const canReview = [ROLES.ADMIN, ROLES.SUPERVISOR].includes(currentUser.role);

  useEffect(() => {
    photoStore.listByInspection(inspection.id).then(grouped => setPhotosByItem(grouped)).catch(() => {});
  }, [inspection.id]);

  const sectionScores = TEMPLATE_SECTIONS.map(s => {
    const sItems = inspection.items.filter(i => i.section_id === s.id && i.score !== null);
    const avg = sItems.length ? Math.round((sItems.reduce((sum, i) => sum + Number(i.score), 0) / (sItems.length * 5)) * 100) : null;
    return { ...s, avg, count: sItems.length };
  });

  const handleApprove = () => {
    onUpdate({ ...inspection, status: "reviewed" });
    addAuditLog(currentUser, "Inspeção Aprovada", "review", `Aprovou a inspeção de ${inspection.location_name}`);
  };

  const handleReject = () => {
    if (!rejectNote.trim()) return alert("Por favor, adicione uma nota de correção.");
    onUpdate({ ...inspection, status: "needs_corrections", notes: inspection.notes + `\n\n[NECESSITA CORREÇÃO]: ${rejectNote}` });
    addAuditLog(currentUser, "Inspeção Rejeitada", "review", `Rejeitou a inspeção de ${inspection.location_name}. Motivo: ${rejectNote}`);
    setShowRejectBox(false);
    setRejectNote("");
  };

  const handleSendToClient = () => {
    addAuditLog(currentUser, "Relatório Enviado", "notification", `Enviou o relatório de ${inspection.location_name} para o Cliente via Email/WhatsApp.`);
    alert("Relatório enviado para o Cliente (Simulação).");
  };

  // Filter for faults only
  const isFaultView = inspection.onlyFaults;
  const faultFilter = (item) => !isFaultView || item.score === null || item.score <= 3;

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-secondary btn-sm" onClick={onBack} style={{ marginBottom: 8 }}>← Voltar</button>
          <div className="page-title">{inspection.location_name}</div>
          <div className="page-sub">Inspeção · {inspection.date} · {inspection.inspector_name}</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <ScoreRing pct={inspection.score_pct} size={56} />
          <StatusBadge status={inspection.status} />
        </div>
      </div>

      {canReview && inspection.status === "submitted" && (
        <div className="card" style={{ marginBottom: 16, background: "#F8F7F4", border: "1px solid #EF9F27" }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Controlo de Qualidade (QC)</div>
          {!showRejectBox ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn-primary btn-sm" onClick={handleApprove}><Icon name="check" size={13} /> Aprovar Inspeção</button>
              <button className="btn btn-danger btn-sm" onClick={() => setShowRejectBox(true)}><Icon name="x" size={13} /> Rejeitar (Pedir Correção)</button>
            </div>
          ) : (
            <div>
              <textarea className="form-textarea" placeholder="Explique o que precisa de ser corrigido..." value={rejectNote} onChange={e => setRejectNote(e.target.value)} style={{ marginBottom: 10 }} />
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-danger btn-sm" onClick={handleReject}>Confirmar Rejeição</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowRejectBox(false)}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}

      {canReview && inspection.status === "reviewed" && (
        <div className="alert-bar alert-info" style={{ justifyContent: "space-between" }}>
          <div>Esta inspeção foi aprovada. O relatório está pronto para o Cliente.</div>
          <button className="btn btn-primary btn-sm" onClick={handleSendToClient}>Enviar ao Cliente</button>
        </div>
      )}

      {inspection.status === "needs_corrections" && (
        <div className="alert-bar alert-critical"><Icon name="alert" size={14} /><div>Esta inspeção foi rejeitada e precisa de correções. Verifique as notas.</div></div>
      )}

      <div className="tabs">
        {["overview", "details", "photos"].map(t => (
          <div key={t} className={`tab ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
            {t === "overview" ? "Resumo" : t === "details" ? "Detalhes" : "Evidências"}
          </div>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="two-col">
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Score por Secção</div>
            {sectionScores.map(s => (
              <div key={s.id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: "#444" }}>{s.name}</span>
                  <span style={{ fontWeight: 500, color: s.avg ? scoreLabel(s.avg).color : "#888" }}>{s.avg ? `${s.avg}%` : "N/A"}</span>
                </div>
                {s.avg && <div className="progress-bar"><div className="progress-fill" style={{ width: `${s.avg}%`, background: scoreLabel(s.avg).color }} /></div>}
              </div>
            ))}
          </div>
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Informações</div>
            {[
              ["Local", inspection.location_name], ["Inspetor", inspection.inspector_name], ["Data", inspection.date],
              ["Score Total", inspection.score_pct ? `${inspection.score_pct}%` : "—"],
              ["Duração", inspection.start_time && inspection.end_time ? `${Math.round((new Date(inspection.end_time) - new Date(inspection.start_time)) / 60000)} min` : "N/A"],
              ["GPS", inspection.gps_coords ? <a href={`https://maps.google.com/?q=${inspection.gps_coords}`} target="_blank" rel="noreferrer" style={{color: "#378ADD"}}>Ver Mapa</a> : "N/A"]
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "0.5px solid rgba(0,0,0,0.06)", fontSize: 13 }}>
                <span style={{ color: "#888" }}>{k}</span><span style={{ fontWeight: 500 }}>{v}</span>
              </div>
            ))}
            {inspection.notes && <div style={{ marginTop: 12, padding: 10, background: "#F8F7F4", borderRadius: 8, fontSize: 12, color: "#444" }}><strong>Notas:</strong> {inspection.notes}</div>}
          </div>
        </div>
      )}

      {activeTab === "details" && (
        <div>
          {TEMPLATE_SECTIONS.map(section => {
            const sItems = inspection.items.filter(i => i.section_id === section.id && faultFilter(i));
            if (sItems.length === 0) return null; // Hide empty sections in fault view
            return (
              <div key={section.id} className="card" style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, color: "#1E2A3A" }}>{section.name}</div>
                {sItems.map(item => (
                  <div key={item.id} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "0.5px solid rgba(0,0,0,0.05)", alignItems: "center", flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, fontSize: 13, color: "#444", minWidth: 200 }}>{item.text}</div>
                    {item.score !== null ? (
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#fff", background: ["#A32D2D", "#993C1D", "#BA7517", "#3B6D11", "#0F6E56"][item.score - 1] }}>{item.score}</div>
                        <span style={{ fontSize: 11, color: "#888" }}>{["Mau", "Deficiente", "Média", "Acima da Média", "Excelente"][item.score - 1]}</span>
                      </div>
                    ) : <span style={{ fontSize: 12, color: "#B4B2A9" }}>N/A</span>}
                    {item.comment && <div style={{ width: '100%', fontSize: 12, color: '#666', background: '#F8F7F4', padding: '6px 8px', borderRadius: 6, marginTop: 4 }}>Nota: {item.comment}</div>}
                  </div>
                ))}
              </div>
            );
          })}
          {isFaultView && <div className="alert-bar alert-info">A mostrar apenas itens com score 3 ou inferior (falhas).</div>}
        </div>
      )}

      {activeTab === "photos" && (
        <div>
          {Object.keys(photosByItem).length === 0 ? (
            <div className="card"><div style={{ fontSize: 13, color: "#888", textAlign: "center", padding: 40 }}>Nenhuma evidência fotográfica guardada.</div></div>
          ) : (
            TEMPLATE_SECTIONS.map(section => {
              const sItems = inspection.items.filter(i => i.section_id === section.id && (photosByItem[i.id] || []).length > 0 && faultFilter(i));
              if (!sItems.length) return null;
              return (
                <div key={section.id} className="card" style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, color: "#1E2A3A" }}>{section.name}</div>
                  {sItems.map(item => (
                    <div key={item.id} style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 12, color: "#444", marginBottom: 6 }}>{item.text}</div>
                      <div className="photo-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))" }}>
                        {photosByItem[item.id].map(p => (
                          <div key={p.id} className="photo-thumb"><img src={p.url} alt={p.filename} onClick={() => setLightboxUrl(p.url)} /></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      )}

      {lightboxUrl && <div className="photo-lightbox-overlay" onClick={() => setLightboxUrl(null)}><img src={lightboxUrl} alt="Evidência" /></div>}
    </div>
  );
}
