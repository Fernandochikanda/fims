import { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { Icon } from "../lib/icons";
import ScoreRing from "../components/ScoreRing";
import StatusBadge from "../components/StatusBadge";
import { photoStore } from "../lib/photoStore";
import { TEMPLATE_SECTIONS, ROLES } from "../data/constants";
import { scoreLabel, getCategoryHealth, generateAISummary } from "../lib/helpers";

export default function InspectionDetail({ inspection, currentUser, onBack, onUpdate, addAuditLog, allInspections }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [photosByItem, setPhotosByItem] = useState({});
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [rejectNote, setRejectNote] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [qcItem, setQcItem] = useState(null);
  const [qcText, setQcText] = useState("");
  const [showClientModal, setShowClientModal] = useState(false);
  const [portalLink, setPortalLink] = useState("");

  const canReview = [ROLES.ADMIN, ROLES.SUPERVISOR].includes(currentUser.role);

  useEffect(() => {
    photoStore.listByInspection(inspection.id).then(grouped => setPhotosByItem(grouped)).catch(() => {});
  }, [inspection.id]);

  const sectionScores = TEMPLATE_SECTIONS.map(s => {
    const sItems = inspection.items.filter(i => i.section_id === s.id && i.score !== null);
    const avg = sItems.length ? Math.round((sItems.reduce((sum, i) => sum + Number(i.score), 0) / (sItems.length * 5)) * 100) : null;
    return { ...s, avg, count: sItems.length };
  });

  const defectHeatmap = (() => {
    if (!allInspections) return [];
    const clientInsps = allInspections.filter(i => i.location_id === inspection.location_id && i.score_pct !== null);
    const defectMap = {};
    clientInsps.forEach(insp => {
      insp.items.forEach(item => {
        if (item.score !== null && item.score <= 2) {
          if (!defectMap[item.text]) defectMap[item.text] = { count: 0, section: item.section_id };
          defectMap[item.text].count++;
        }
      });
    });
    return Object.keys(defectMap).map(text => ({ text, count: defectMap[text].count, section: defectMap[text].section })).sort((a,b) => b.count - a.count).slice(0, 5);
  })();

  const handleApprove = () => { onUpdate({ ...inspection, status: "reviewed" }); addAuditLog(currentUser, "Inspeção Aprovada", "review", `Aprovou a inspeção de ${inspection.location_name}`); };
  const handleReject = () => {
    if (!rejectNote.trim()) return alert("Por favor, adicione uma nota de correção geral.");
    const updatedItems = inspection.items.map(i => qcItem === i.id ? { ...i, qc_comment: qcText } : i);
    onUpdate({ ...inspection, status: "needs_corrections", notes: inspection.notes + `\n\n[NECESSITA CORREÇÃO]: ${rejectNote}`, items: updatedItems });
    addAuditLog(currentUser, "Inspeção Rejeitada", "review", `Rejeitou a inspeção de ${inspection.location_name}. Motivo: ${rejectNote}`);
    setShowRejectBox(false); setRejectNote(""); setQcItem(null);
  };
  const handleAddQcComment = (itemId) => {
    const updatedItems = inspection.items.map(i => i.id === itemId ? { ...i, qc_comment: qcText } : i);
    onUpdate({ ...inspection, items: updatedItems }); setQcItem(null); setQcText("");
  };
  const handleSendToClient = () => { onUpdate({ ...inspection, status: "sent_to_client" }); addAuditLog(currentUser, "Relatório Enviado", "notification", `Enviou o relatório de ${inspection.location_name} para o Cliente.`); };
  const handleGeneratePortalLink = () => {
    const token = btoa(`${inspection.id}_${inspection.location_name}`).substring(0, 15);
    setPortalLink(`https://fims.co.mz/portal/${inspection.location_id}/${token}`);
  };
  const handleClientFeedback = (rating, comment) => { onUpdate({ ...inspection, status: "closed", client_rating: rating, client_comment: comment }); addAuditLog(currentUser, "Feedback Recebido", "notification", `Cliente avaliou ${inspection.location_name} com ${rating}/5 estrelas.`); setShowClientModal(false); };

  // Professional PDF with Photos
  const handleDownloadPDF = async () => {
    const doc = new jsPDF();
    const ai = generateAISummary(inspection.items, inspection.location_name);
    
    // Header
    doc.setFillColor(30, 42, 58); doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(20); doc.setFont("helvetica", "bold");
    doc.text("Relatório de Inspeção", 105, 15, { align: "center" });
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text("NEMCHEM - Field Inspection Management System", 105, 22, { align: "center" });

    // Info Box
    doc.setFillColor(248, 247, 244); doc.roundedRect(14, 35, 182, 30, 3, 3, 'F');
    doc.setTextColor(50, 50, 50); doc.setFontSize(10);
    doc.text(`Cliente: ${inspection.location_name}`, 18, 43);
    doc.text(`Data: ${new Date(inspection.date).toLocaleDateString("pt-PT")}`, 18, 49);
    doc.text(`Inspetor: ${inspection.inspector_name}`, 18, 55);
    doc.text(`Score Total: ${inspection.score_pct}%`, 120, 43);
    doc.text(`Estado: ${inspection.status.toUpperCase()}`, 120, 49);

    // Executive Summary
    let y = 72;
    doc.setFontSize(13); doc.setTextColor(30, 42, 58); doc.setFont("helvetica", "bold");
    doc.text("Executive Summary & AI Recommendations", 14, y); y += 6;
    doc.setFontSize(10); doc.setTextColor(80, 80, 80); doc.setFont("helvetica", "normal");
    const splitSummary = doc.splitTextToSize(ai.summary, 180);
    doc.text(splitSummary, 14, y); y += splitSummary.length * 5 + 4;
    
    if (ai.recommendations.length > 0) {
      ai.recommendations.forEach(rec => {
        if (y > 270) { doc.addPage(); y = 20; }
        const cleanRec = rec.replace(/\*\*/g, '');
        const splitRec = doc.splitTextToSize(cleanRec, 180);
        doc.text(splitRec, 14, y); y += splitRec.length * 5 + 2;
      });
    }
    y += 6;

    // Sections with Photos
    for (const section of TEMPLATE_SECTIONS) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFillColor(30, 42, 58); doc.roundedRect(14, y, 182, 7, 2, 2, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(11); doc.setFont("helvetica", "bold");
      doc.text(section.name, 18, y + 5); y += 10;

      const secData = inspection.sections?.find(s => s.id === section.id);
      if (secData?.observation) {
        doc.setFontSize(9); doc.setTextColor(80, 80, 80); doc.setFont("helvetica", "italic");
        const splitObs = doc.splitTextToSize(`Obs: ${secData.observation}`, 180);
        doc.text(splitObs, 18, y); y += splitObs.length * 5 + 3;
      }

      // Category Photos
      const secPhotos = photosByItem[section.id] || [];
      if (secPhotos.length > 0) {
        if (y > 250) { doc.addPage(); y = 20; }
        let imgX = 14;
        secPhotos.forEach(p => {
          try { 
            doc.addImage(p.url, 'JPEG', imgX, y, 40, 30);
            imgX += 42;
            if (imgX > 160) { imgX = 14; y += 32; }
          } catch(e) {}
        });
        y += (imgX > 14 ? 32 : 0) + 4;
      }

      const sItems = inspection.items.filter(i => i.section_id === section.id);
      doc.setFontSize(10);
      for (const item of sItems) {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setTextColor(40, 40, 40); doc.setFont("helvetica", "normal");
        const itemText = doc.splitTextToSize(item.text, 155);
        doc.text(itemText, 18, y);
        if (item.score !== null) {
          const colors = ["230,45,45", "153,60,29", "186,117,23", "59,109,17", "15,110,86"];
          doc.setFillColor(...colors[item.score - 1].split(',').map(Number));
          doc.roundedRect(175, y - 4, 12, 6, 1, 1, 'F');
          doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont("helvetica", "bold");
          doc.text(item.score.toString(), 181, y, { align: "center" });
        }
        y += itemText.length * 5;
        if (item.comment) { doc.setTextColor(110, 110, 110); doc.setFontSize(9); doc.setFont("helvetica", "italic"); const cmt = doc.splitTextToSize(`→ ${item.comment}`, 170); doc.text(cmt, 20, y); y += cmt.length * 5; }
        
        // Item Photos
        const itemPhotos = photosByItem[item.id] || [];
        if (itemPhotos.length > 0) {
          if (y > 250) { doc.addPage(); y = 20; }
          let imgX = 20;
          itemPhotos.forEach(p => {
            try { 
              doc.addImage(p.url, 'JPEG', imgX, y, 30, 22);
              imgX += 32;
              if (imgX > 180) { imgX = 20; y += 24; }
            } catch(e) {}
          });
          y += (imgX > 20 ? 24 : 0) + 2;
        }
        y += 4;
      }
      y += 6;
    }

    // Signatures
    if (y > 250) { doc.addPage(); y = 20; }
    if (inspection.inspector_sig) { try { doc.addImage(inspection.inspector_sig, 'PNG', 20, y, 40, 15); doc.text("Inspector", 20, y + 20); } catch(e) {} }
    if (inspection.client_sig) { try { doc.addImage(inspection.client_sig, 'PNG', 120, y, 40, 15); doc.text("Client", 120, y + 20); } catch(e) {} }

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) { doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150, 150, 150); doc.text("NEMCHEM © 2024 - Documento gerado pelo FIMS", 105, 290, { align: "center" }); }
    doc.save(`Relatorio-${inspection.location_name}.pdf`);
  };

  const handleDownloadWord = () => {
    const ai = generateAISummary(inspection.items, inspection.location_name);
    let html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 11pt; color: #333; }
      h1 { background-color: #1E2A3A; color: white; padding: 10px; font-size: 18pt; margin-bottom: 20px; text-align: center; }
      h2 { color: #1E2A3A; border-bottom: 1px solid #ccc; padding-bottom: 4px; font-size: 14pt; margin-top: 24px; }
      .meta { margin-bottom: 20px; background: #f8f7f4; padding: 10px; }
      .meta div { margin-bottom: 4px; }
      .item { margin-bottom: 8px; padding-left: 10px; border-left: 3px solid #eee; }
      .score { font-weight: bold; padding: 2px 6px; border-radius: 4px; color: white; font-size: 9pt; }
      .obs { font-style: italic; color: #555; margin-bottom: 10px; background: #f9f9f9; padding: 8px; }
      .cmt { color: #666; font-size: 10pt; margin-left: 15px; }
      .qc { color: #A32D2D; font-size: 10pt; margin-left: 15px; font-weight: bold; }
      .ai-box { background: #E6F1FB; padding: 10px; margin-bottom: 20px; border-left: 4px solid #378ADD; }
      .photo-grid { display: table; width: 100%; margin: 10px 0; }
      .photo-cell { display: table-cell; width: 33%; padding: 5px; }
      .photo-cell img { width: 100%; }
    </style>
    </head><body>`;
    html += `<h1>Relatório de Inspeção</h1><div class="meta">
      <div><strong>Cliente:</strong> ${inspection.location_name}</div>
      <div><strong>Data:</strong> ${new Date(inspection.date).toLocaleDateString("pt-PT")}</div>
      <div><strong>Inspetor:</strong> ${inspection.inspector_name}</div>
      <div><strong>Score Total:</strong> ${inspection.score_pct}%</div>
    </div>`;
    html += `<div class="ai-box"><strong>🤖 AI Executive Summary:</strong><br/>${ai.summary}<br/><br/><strong>Recommendations:</strong><ul>${ai.recommendations.map(r => `<li>${r.replace(/\*\*/g, '')}</li>`).join('')}</ul></div>`;

    TEMPLATE_SECTIONS.forEach(section => {
      const secData = inspection.sections?.find(s => s.id === section.id);
      html += `<h2>${section.name}</h2>`;
      if (secData?.observation) html += `<div class="obs"><strong>Observation:</strong> ${secData.observation}</div>`;
      
      // Category Photos
      const secPhotos = photosByItem[section.id] || [];
      if (secPhotos.length > 0) {
        html += `<div class="photo-grid">`;
        secPhotos.forEach(p => { html += `<div class="photo-cell"><img src="${p.url}" /></div>`; });
        html += `</div>`;
      }

      const sItems = inspection.items.filter(i => i.section_id === section.id);
      sItems.forEach(item => {
        const colors = ["#A32D2D", "#993C1D", "#BA7517", "#3B6D11", "#0F6E56"];
        const scoreBg = item.score !== null ? colors[item.score - 1] : "#888";
        const scoreTxt = item.score !== null ? item.score : "N/A";
        html += `<div class="item"><strong>${item.text}</strong> <span class="score" style="background:${scoreBg}">${scoreTxt}/5</span>`;
        if (item.comment) html += `<div class="cmt">→ ${item.comment}</div>`;
        
        // Item Photos
        const itemPhotos = photosByItem[item.id] || [];
        if (itemPhotos.length > 0) {
          html += `<div class="photo-grid">`;
          itemPhotos.forEach(p => { html += `<div class="photo-cell"><img src="${p.url}" /></div>`; });
          html += `</div>`;
        }

        if (item.qc_comment) html += `<div class="qc">⚠ QC: ${item.qc_comment}</div>`;
        html += `</div>`;
      });
    });

    // Signatures
    html += `<div style="margin-top: 40px; display: flex; justify-content: space-between;">`;
    if (inspection.inspector_sig) html += `<div><img src="${inspection.inspector_sig}" style="width: 150px; height: 50px;" /><br/><strong>Inspector Signature</strong></div>`;
    if (inspection.client_sig) html += `<div><img src="${inspection.client_sig}" style="width: 150px; height: 50px;" /><br/><strong>Client Signature</strong></div>`;
    html += `</div>`;

    html += `</body></html>`;
    
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio-${inspection.location_name}.doc`;
    link.click();
  };

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

      <div className="card" style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>Exportar Relatório Oficial</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-danger btn-sm" onClick={handleDownloadPDF}><Icon name="download" size={13} /> Baixar PDF</button>
          <button className="btn btn-primary btn-sm" onClick={handleDownloadWord}><Icon name="file" size={13} /> Baixar Word</button>
          {canReview && inspection.status === "reviewed" && (
            <button className="btn btn-secondary btn-sm" onClick={handleGeneratePortalLink}><Icon name="link" size={13} /> Client Portal</button>
          )}
        </div>
      </div>

      {portalLink && (
        <div className="alert-bar alert-info" style={{ justifyContent: "space-between" }}>
          <div style={{ fontSize: 12, wordBreak: "break-all" }}><strong>Client Link:</strong> {portalLink}</div>
          <button className="btn btn-secondary btn-sm" onClick={() => { navigator.clipboard.writeText(portalLink); alert("Link copied!"); }}>Copy</button>
        </div>
      )}

      {canReview && inspection.status === "submitted" && (
        <div className="card" style={{ marginBottom: 16, background: "#F8F7F4", border: "1px solid #EF9F27" }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Controlo de Qualidade (QC)</div>
          {!showRejectBox ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn-primary btn-sm" onClick={handleApprove}><Icon name="check" size={13} /> Aprovar Inspeção</button>
              <button className="btn btn-danger btn-sm" onClick={() => setShowRejectBox(true)}><Icon name="x" size={13} /> Rejeitar</button>
            </div>
          ) : (
            <div>
              <textarea className="form-textarea" placeholder="Nota geral de correção..." value={rejectNote} onChange={e => setRejectNote(e.target.value)} style={{ marginBottom: 10 }} />
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
          <button className="btn btn-primary btn-sm" onClick={() => onUpdate({ ...inspection, status: "sent_to_client" })}>Enviar ao Cliente</button>
        </div>
      )}

      {inspection.status === "closed" && inspection.client_rating && (
        <div className="alert-bar alert-ok" style={{ background: "#EAF3DE", color: "#3B6D11", borderLeft: "3px solid #0F6E56" }}>
          <Icon name="star" size={14} />
          <div><strong>Feedback do Cliente: {inspection.client_rating}/5 Estrelas.</strong> {inspection.client_comment && <span style={{ marginLeft: 8, fontStyle: "italic" }}>"{inspection.client_comment}"</span>}</div>
        </div>
      )}

      {inspection.status === "needs_corrections" && (
        <div className="alert-bar alert-critical"><Icon name="alert" size={14} /><div>Esta inspeção foi rejeitada e precisa de correções. Verifique os itens marcados.</div></div>
      )}

      <div className="tabs">
        {["overview", "details", "photos", "heatmap"].map(t => (
          <div key={t} className={`tab ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>
            {t === "overview" ? "Resumo" : t === "details" ? "Detalhes" : t === "photos" ? "Evidências" : "Heatmap"}
          </div>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="two-col">
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Category Health Scores</div>
            {sectionScores.map(s => {
              const sItems = inspection.items.filter(i => i.section_id === s.id);
              const health = getCategoryHealth(sItems);
              return (
                <div key={s.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: "#444" }}>{s.name}</span>
                    <span style={{ fontWeight: 500, color: health.color }}>{health.avg} ({health.risk})</span>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${health.health}%`, background: health.color }} /></div>
                </div>
              );
            })}
          </div>
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Informações</div>
            {[["Local", inspection.location_name], ["Inspetor", inspection.inspector_name], ["Data", inspection.date], ["Score Total", inspection.score_pct ? `${inspection.score_pct}%` : "—"], ["Duração", inspection.start_time && inspection.end_time ? `${Math.round((new Date(inspection.end_time) - new Date(inspection.start_time)) / 60000)} min` : "N/A"], ["GPS", inspection.gps_coords ? <a href={`https://maps.google.com/?q=${inspection.gps_coords}`} target="_blank" rel="noreferrer" style={{color: "#378ADD"}}>Ver Mapa</a> : "N/A"]].map(([k, v]) => (
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
            if (sItems.length === 0) return null;
            const secData = inspection.sections?.find(s => s.id === section.id);
            return (
              <div key={section.id} className="card" style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, color: "#1E2A3A" }}>{section.name}</div>
                {secData?.observation && <div style={{ background: "#F8F7F4", padding: 8, borderRadius: 6, marginBottom: 10, fontSize: 12 }}><strong>Obs. da Categoria:</strong> {secData.observation}</div>}
                {sItems.map(item => (
                  <div key={item.id} style={{ padding: "8px 0", borderBottom: "0.5px solid rgba(0,0,0,0.05)", flexWrap: 'wrap' }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ flex: 1, fontSize: 13, color: "#444", minWidth: 200 }}>{item.text}</div>
                      {item.score !== null ? (
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <div style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#fff", background: ["#A32D2D", "#993C1D", "#BA7517", "#3B6D11", "#0F6E56"][item.score - 1] }}>{item.score}</div>
                          <span style={{ fontSize: 11, color: "#888" }}>{["Mau", "Deficiente", "Média", "Acima da Média", "Excelente"][item.score - 1]}</span>
                        </div>
                      ) : <span style={{ fontSize: 12, color: "#B4B2A9" }}>N/A</span>}
                      {canReview && inspection.status === "submitted" && (<button className="btn btn-secondary btn-sm" style={{ fontSize: 10 }} onClick={() => { setQcItem(item.id); setQcText(item.qc_comment || ""); }}>{item.qc_comment ? "Edit. QC" : "Add QC"}</button>)}
                    </div>
                    {item.comment && <div style={{ width: '100%', fontSize: 12, color: '#666', background: '#F8F7F4', padding: '6px 8px', borderRadius: 6, marginTop: 4 }}>Nota Inspetor: {item.comment}</div>}
                    {qcItem === item.id ? (
                      <div style={{ marginTop: 8, background: "#FCEBEB", padding: 8, borderRadius: 6, border: "1px solid #A32D2D" }}>
                        <textarea className="form-textarea" placeholder="Comentário do Supervisor para correção..." value={qcText} onChange={e => setQcText(e.target.value)} style={{ fontSize: 12, minHeight: 60 }} />
                        <button className="btn btn-primary btn-sm" style={{ marginTop: 4 }} onClick={() => handleAddQcComment(item.id)}>Guardar QC</button>
                      </div>
                    ) : item.qc_comment ? (
                      <div style={{ width: '100%', fontSize: 12, color: '#A32D2D', background: '#FCEBEB', padding: '6px 8px', borderRadius: 6, marginTop: 4, borderLeft: "3px solid #A32D2D" }}><strong>Correção Pedida:</strong> {item.qc_comment}</div>
                    ) : null}
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
              const secData = inspection.sections?.find(s => s.id === section.id);
              const secPhotos = photosByItem[section.id] || [];
              if (!sItems.length && secPhotos.length === 0) return null;
              return (
                <div key={section.id} className="card" style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, color: "#1E2A3A" }}>{section.name}</div>
                  {secPhotos.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 12, color: "#444", marginBottom: 6 }}>Fotos da Categoria</div>
                      <div className="photo-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))" }}>
                        {secPhotos.map(p => (<div key={p.id} className="photo-thumb"><img src={p.url} alt={p.filename} onClick={() => setLightboxUrl(p.url)} /></div>))}
                      </div>
                    </div>
                  )}
                  {sItems.map(item => (
                    <div key={item.id} style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 12, color: "#444", marginBottom: 6 }}>{item.text}</div>
                      <div className="photo-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))" }}>
                        {photosByItem[item.id].map(p => (<div key={p.id} className="photo-thumb"><img src={p.url} alt={p.filename} onClick={() => setLightboxUrl(p.url)} /></div>))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === "heatmap" && (
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 12, color: "#1E2A3A" }}>Recurring Defect Heatmap</h3>
          <p style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>Items that frequently score 1 or 2 at this client's site. These indicate systemic issues requiring operational changes.</p>
          {defectHeatmap.length === 0 && <div style={{ fontSize: 13, color: "#888" }}>No recurring defects found for this client.</div>}
          {defectHeatmap.map((defect, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #eee" }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{defect.text}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: "#888" }}>Failed {defect.count} times</span>
                <div style={{ width: 40, height: 8, background: "#eee", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(defect.count * 20, 100)}%`, height: "100%", background: defect.count > 3 ? "#A32D2D" : "#EF9F27" }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {lightboxUrl && <div className="photo-lightbox-overlay" onClick={() => setLightboxUrl(null)}><img src={lightboxUrl} alt="Evidência" /></div>}
      {showClientModal && <ClientFeedbackModal onClose={() => setShowClientModal(false)} onSubmit={handleClientFeedback} />}
    </div>
  );
}

function ClientFeedbackModal({ onClose, onSubmit }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="modal-header"><div style={{ fontSize: 15, fontWeight: 500 }}>Simular Feedback do Cliente</div><button className="icon-btn" onClick={onClose}><Icon name="x" size={14} /></button></div>
        <div className="modal-body">
          <div className="form-group"><label className="form-label">Avaliação (1-5 Estrelas)</label><div style={{ display: "flex", gap: 8, fontSize: 24, cursor: "pointer" }}>{[1, 2, 3, 4, 5].map(n => (<span key={n} onClick={() => setRating(n)} style={{ color: n <= rating ? "#EF9F27" : "#ccc" }}>★</span>))}</div></div>
          <div className="form-group"><label className="form-label">Comentário (Opcional)</label><textarea className="form-textarea" placeholder="Ex: Excelente serviço..." value={comment} onChange={e => setComment(e.target.value)}></textarea></div>
        </div>
        <div className="modal-footer"><button className="btn btn-secondary" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={() => onSubmit(rating, comment)}>Submeter Feedback</button></div>
      </div>
    </div>
  );
}
