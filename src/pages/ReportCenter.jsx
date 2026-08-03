import { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { Icon } from "../lib/icons";
import { calcScore, getCategoryHealth } from "../lib/helpers";
import { TEMPLATE_SECTIONS } from "../data/constants";
import { photoStore } from "../lib/photoStore";

export default function ReportCenter({ inspections, locations, users }) {
  const [reportType, setReportType] = useState("daily");
  const [clientId, setClientId] = useState("");
  const [month, setMonth] = useState(new Date().toISOString().substring(0, 7));
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split("T")[0]);
  const [generating, setGenerating] = useState(false);

  // Helper to load all photos for an inspection
  const loadInspectionPhotos = async (inspId) => {
    try {
      return await photoStore.listByInspection(inspId);
    } catch (e) {
      return {};
    }
  };

  // Helper to convert Image URL to Base64 for PDF/Word
  const getBase64 = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  const handleGenerate = async (format) => {
    if (!clientId) return alert("Please select a client.");
    setGenerating(true);
    
    const client = locations.find(l => l.id === Number(clientId));
    let clientInsps = inspections.filter(i => i.location_id === Number(clientId) && i.score_pct !== null);

    if (reportType === "daily") {
      clientInsps = clientInsps.filter(i => i.date === dailyDate);
      if (clientInsps.length === 0) { setGenerating(false); return alert("No submitted inspections found for this date."); }
    } else {
      clientInsps = clientInsps.filter(i => i.date.startsWith(month));
      if (clientInsps.length === 0) { setGenerating(false); return alert("No submitted inspections found for this month."); }
    }

    // Load all photos for these inspections
    const inspData = [];
    for (const insp of clientInsps) {
      const photos = await loadInspectionPhotos(insp.id);
      inspData.push({ ...insp, photosByItem: photos });
    }

    if (format === "pdf") {
      generatePDF(client, inspData, reportType === "daily" ? dailyDate : month, reportType);
    } else {
      generateWord(client, inspData, reportType === "daily" ? dailyDate : month, reportType);
    }

    setGenerating(false);
  };

  const generatePDF = async (client, inspData, dateStr, type) => {
    const doc = new jsPDF();
    let y = 0;

    // --- CORPORATE HEADER ---
    doc.setFillColor(30, 42, 58); doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(24); doc.setFont("helvetica", "bold");
    doc.text("NEMCHEM", 14, 18);
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text("Avª Joaquim Chissano nº2305, Matola – Moçambique", 14, 25);
    doc.text("Tel: 21 74 94 26/84 300 7940 | supervisao@nemchem.co.mz", 14, 30);
    
    y = 45;
    doc.setTextColor(50, 50, 50); doc.setFontSize(12); doc.setFont("helvetica", "bold");
    doc.text(type === "daily" ? "RELATÓRIO DIÁRIO DE INSPEÇÃO" : "RELATÓRIO MENSAL DE ATIVIDADES", 105, y, { align: "center" });
    y += 10;

    // Meta Info
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    const insp = inspData[0];
    doc.text(`Cliente: ${client.name}`, 14, y); y += 6;
    doc.text(`Endereço: ${client.address}`, 14, y); y += 6;
    doc.text(`Atenção: ${insp?.client_mgr_name || "N/A"}`, 14, y); y += 6;
    doc.text(`Data: ${new Date().toLocaleDateString("pt-PT")}`, 14, y); y += 6;
    doc.text(`Assunto: Relatório referente a ${dateStr}`, 14, y); y += 10;

    // --- EXECUTIVE SUMMARY ---
    doc.setFillColor(248, 247, 244); doc.roundedRect(14, y, 182, 20, 3, 3, 'F');
    doc.setFont("helvetica", "italic"); doc.setFontSize(9);
    const summaryText = type === "daily" 
      ? "Durante a inspeção de hoje, a maioria das áreas inspecionadas cumpriu os padrões exigidos. No entanto, foram identificados alguns itens com pontuações que exigem ação corretiva. As observações abaixo resumem os resultados que exigem atenção do cliente."
      : "Durante o período em análise, todas as inspeções e atividades de limpeza agendadas foram realizadas conforme o programa de manutenção acordado. A qualidade geral do serviço permaneceu satisfatória, com operações de rotina concluídas com sucesso. Problemas operacionais menores identificados durante as inspeções foram documentados juntamente com recomendações corretivas.";
    const splitSummary = doc.splitTextToSize(summaryText, 175);
    doc.text(splitSummary, 16, y + 7); y += splitSummary.length * 5 + 10;

    // --- DAILY REPORT LOGIC (Critical Findings Only) ---
    if (type === "daily") {
      doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(163, 45, 45);
      doc.text("1. Resultados Críticos (Score ≤ 3)", 14, y); y += 8;
      doc.setTextColor(50, 50, 50); doc.setFont("helvetica", "normal"); doc.setFontSize(10);

      let findingsCount = 0;
      for (const insp of inspData) {
        for (const item of insp.items) {
          if (item.score !== null && item.score <= 3) {
            findingsCount++;
            if (y > 250) { doc.addPage(); y = 20; }
            
            const secName = TEMPLATE_SECTIONS.find(s => s.id === item.section_id)?.name || "N/A";
            doc.setFont("helvetica", "bold"); doc.text(`${secName}: ${item.text}`, 14, y); y += 5;
            doc.setFont("helvetica", "normal");
            doc.text(`Score: ${item.score}/5`, 14, y); 
            doc.text(`Severidade: ${item.score === 1 ? "Crítica" : "Alta"}`, 60, y); y += 5;
            const obs = doc.splitTextToSize(`Observação: ${item.comment || "N/A"}`, 180);
            doc.text(obs, 14, y); y += obs.length * 5;
            
            // Photos
            const photos = insp.photosByItem[item.id] || [];
            if (photos.length > 0) {
              let imgX = 14;
              for (let i=0; i<Math.min(photos.length, 3); i++) {
                if (imgX > 160) { imgX = 14; y += 35; }
                if (y > 250) { doc.addPage(); y = 20; }
                try {
                  const base64 = await getBase64(photos[i].url);
                  if (base64) doc.addImage(base64, 'JPEG', imgX, y, 40, 30);
                  imgX += 42;
                } catch(e) {}
              }
              y += 35;
            }
            y += 5;
          }
        }
      }
      if (findingsCount === 0) { doc.text("Nenhum resultado crítico encontrado. Todas as áreas pontuaram 4 ou 5.", 14, y); y += 10; }
    } 
    // --- MONTHLY REPORT LOGIC ---
    else {
      // KPIs
      doc.setFont("helvetica", "bold"); doc.setFontSize(12);
      doc.text("1. Resumo de Desempenho Mensal", 14, y); y += 8;
      doc.setFont("helvetica", "normal"); doc.setFontSize(10);
      
      const totalInsps = inspData.length;
      const avgScore = Math.round(inspData.reduce((s,i) => s + i.score_pct, 0) / totalInsps);
      const criticals = inspData.reduce((s,i) => s + i.items.filter(it => it.score !== null && it.score <= 2).length, 0);
      
      const kpis = [
        ["Total Inspeções", totalInsps], ["Score Médio", `${avgScore}%`],
        ["Problemas Críticos", criticals], ["Locais Inspecionados", new Set(inspData.map(i=>i.location_id)).size]
      ];
      let kpiX = 14;
      kpis.forEach(([label, val]) => {
        doc.setFillColor(30, 42, 58); doc.roundedRect(kpiX, y, 40, 20, 2, 2, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.text(label, kpiX+20, y+8, { align: "center" });
        doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text(val, kpiX+20, y+15, { align: "center" });
        kpiX += 45;
      });
      doc.setTextColor(50, 50, 50); doc.setFont("helvetica", "normal"); y += 30;

      // Daily Log & Photos
      doc.setFont("helvetica", "bold"); doc.setFontSize(12);
      doc.text("2. Registo de Atividades e Evidências", 14, y); y += 8;
      doc.setFont("helvetica", "normal"); doc.setFontSize(10);

      for (const insp of inspData.sort((a,b) => new Date(a.date) - new Date(b.date))) {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold"); doc.text(`Dia ${new Date(insp.date).toLocaleDateString("pt-PT")}`, 14, y); y += 6;
        doc.setFont("helvetica", "normal");
        const actText = doc.splitTextToSize(`Atividades executadas conforme cronograma. Score: ${insp.score_pct}%.`, 180);
        doc.text(actText, 14, y); y += actText.length * 5 + 4;

        // Group all photos for this day
        const allPhotos = Object.values(insp.photosByItem || {}).flat();
        let imgX = 14;
        for (let i=0; i<allPhotos.length; i++) {
          if (imgX > 160) { imgX = 14; y += 35; }
          if (y > 250) { doc.addPage(); y = 20; }
          try {
            const base64 = await getBase64(allPhotos[i].url);
            if (base64) doc.addImage(base64, 'JPEG', imgX, y, 40, 30);
            imgX += 42;
          } catch(e) {}
        }
        y += 40;
      }
    }

    // --- SIGNATURES ---
    if (y > 240) { doc.addPage(); y = 20; }
    y += 10;
    doc.setDrawColor(200, 200, 200); doc.line(20, y, 80, y); doc.line(120, y, 180, y);
    doc.setFontSize(9); doc.setTextColor(100, 100, 100);
    doc.text("Inspetor", 20, y + 5); doc.text("Cliente", 120, y + 5);
    if (inspData[0]?.inspector_sig) { try { doc.addImage(inspData[0].inspector_sig, 'PNG', 20, y-15, 40, 15); } catch(e){} }
    if (inspData[0]?.client_sig) { try { doc.addImage(inspData[0].client_sig, 'PNG', 120, y-15, 40, 15); } catch(e){} }

    // --- FOOTER (Page Numbers) ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8); doc.setTextColor(150, 150, 150);
      doc.text("NEMCHEM © 2024 - Documento gerado pelo FIMS", 105, 290, { align: "center" });
      doc.text(`Página ${i} de ${pageCount}`, 196, 290, { align: "right" });
    }

    doc.save(`Nemchem_${type === "daily" ? "Diario" : "Mensal"}_${client.name}.pdf`);
  };

  const generateWord = async (client, inspData, dateStr, type) => {
    let html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 11pt; color: #333; }
      .header { background-color: #1E2A3A; color: white; padding: 20px; margin-bottom: 20px; }
      .header h1 { font-size: 24pt; margin: 0; }
      .header p { font-size: 9pt; margin: 5px 0 0 0; }
      .title { text-align: center; font-size: 14pt; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; }
      .meta { margin-bottom: 20px; }
      .meta div { margin-bottom: 4px; }
      .summary { background: #f8f7f4; padding: 15px; margin-bottom: 20px; font-style: italic; border-left: 4px solid #1E2A3A; }
      h2 { color: #1E2A3A; border-bottom: 1px solid #ccc; padding-bottom: 4px; font-size: 13pt; margin-top: 24px; }
      .finding { margin-bottom: 20px; padding: 10px; border: 1px solid #eee; background: #fff; }
      .finding h3 { margin: 0 0 5px 0; font-size: 11pt; color: #A32D2D; }
      .kpi-grid { display: table; width: 100%; margin: 20px 0; }
      .kpi-card { display: table-cell; width: 25%; background: #1E2A3A; color: white; padding: 15px; text-align: center; border: 2px solid #fff; }
      .kpi-val { font-size: 18pt; font-weight: bold; display: block; }
      .kpi-lbl { font-size: 9pt; display: block; }
      .photo-grid { display: table; width: 100%; margin: 10px 0; }
      .photo-cell { display: table-cell; width: 33%; padding: 5px; }
      .photo-cell img { width: 100%; height: 120px; object-fit: cover; }
      .signatures { margin-top: 50px; display: table; width: 100%; }
      .sig-cell { display: table-cell; width: 50%; text-align: center; padding-top: 20px; border-top: 1px solid #333; }
      .footer { margin-top: 40px; text-align: center; font-size: 9pt; color: #888; border-top: 1px solid #eee; padding-top: 10px; }
    </style>
    </head><body>`;

    html += `<div class="header"><h1>NEMCHEM</h1><p>Avª Joaquim Chissano nº2305, Matola – Moçambique<br/>Tel: 21 74 94 26/84 300 7940 | supervisao@nemchem.co.mz</p></div>`;
    html += `<div class="title">${type === "daily" ? "Relatório Diário de Inspeção" : "Relatório Mensal de Atividades"}</div>`;
    
    const insp = inspData[0];
    html += `<div class="meta">
      <div><strong>Cliente:</strong> ${client.name}</div>
      <div><strong>Endereço:</strong> ${client.address}</div>
      <div><strong>Atenção:</strong> ${insp?.client_mgr_name || "N/A"}</div>
      <div><strong>Data:</strong> ${new Date().toLocaleDateString("pt-PT")}</div>
      <div><strong>Assunto:</strong> Relatório referente a ${dateStr}</div>
    </div>`;

    html += `<div class="summary">${type === "daily" ? "Durante a inspeção de hoje, a maioria das áreas inspecionadas cumpriu os padrões exigidos. No entanto, foram identificados alguns itens com pontuações que exigem ação corretiva. As observações abaixo resumem os resultados que exigem atenção do cliente." : "Durante o período em análise, todas as inspeções e atividades de limpeza agendadas foram realizadas conforme o programa de manutenção acordado. A qualidade geral do serviço permaneceu satisfatória, com operações de rotina concluídas com sucesso."}</div>`;

    if (type === "daily") {
      html += `<h2>1. Resultados Críticos (Score ≤ 3)</h2>`;
      let findings = 0;
      for (const insp of inspData) {
        for (const item of insp.items) {
          if (item.score !== null && item.score <= 3) {
            findings++;
            const secName = TEMPLATE_SECTIONS.find(s => s.id === item.section_id)?.name || "N/A";
            html += `<div class="finding">
              <h3>${secName}: ${item.text}</h3>
              <div><strong>Score:</strong> ${item.score}/5 | <strong>Severidade:</strong> ${item.score === 1 ? "Crítica" : "Alta"}</div>
              <div><strong>Observação:</strong> ${item.comment || "N/A"}</div>
            `;
            const photos = insp.photosByItem[item.id] || [];
            if (photos.length > 0) {
              html += `<div class="photo-grid">`;
              for (let i=0; i<Math.min(photos.length, 3); i++) {
                const base64 = await getBase64(photos[i].url);
                if (base64) html += `<div class="photo-cell"><img src="${base64}" /></div>`;
              }
              html += `</div>`;
            }
            html += `</div>`;
          }
        }
      }
      if (findings === 0) html += `<p>Nenhum resultado crítico encontrado.</p>`;
    } else {
      // Monthly KPIs
      const totalInsps = inspData.length;
      const avgScore = Math.round(inspData.reduce((s,i) => s + i.score_pct, 0) / totalInsps);
      const criticals = inspData.reduce((s,i) => s + i.items.filter(it => it.score !== null && it.score <= 2).length, 0);
      html += `<h2>1. Resumo de Desempenho Mensal</h2>
        <div class="kpi-grid">
          <div class="kpi-card"><span class="kpi-val">${totalInsps}</span><span class="kpi-lbl">Inspeções</span></div>
          <div class="kpi-card"><span class="kpi-val">${avgScore}%</span><span class="kpi-lbl">Score Médio</span></div>
          <div class="kpi-card"><span class="kpi-val">${criticals}</span><span class="kpi-lbl">Críticos</span></div>
          <div class="kpi-card"><span class="kpi-val">1</span><span class="kpi-lbl">Local</span></div>
        </div>`;

      html += `<h2>2. Registo de Atividades e Evidências</h2>`;
      for (const insp of inspData.sort((a,b) => new Date(a.date) - new Date(b.date))) {
        html += `<div style="margin-bottom: 20px;">
          <h3>Dia ${new Date(insp.date).toLocaleDateString("pt-PT")}</h3>
          <p>Atividades executadas conforme cronograma. Score: ${insp.score_pct}%.</p>
        `;
        const allPhotos = Object.values(insp.photosByItem || {}).flat();
        if (allPhotos.length > 0) {
          html += `<div class="photo-grid">`;
          for (let i=0; i<allPhotos.length; i++) {
            const base64 = await getBase64(allPhotos[i].url);
            if (base64) html += `<div class="photo-cell"><img src="${base64}" /></div>`;
          }
          html += `</div>`;
        }
        html += `</div>`;
      }
    }

    // Signatures
    html += `<div class="signatures">
      <div class="sig-cell">
        ${inspData[0]?.inspector_sig ? `<img src="${inspData[0].inspector_sig}" style="width: 150px; height: 50px; object-fit: contain;" />` : ""}<br/>
        <strong>Inspetor</strong><br/>${inspData[0]?.inspector_name || ""}
      </div>
      <div class="sig-cell">
        ${inspData[0]?.client_sig ? `<img src="${inspData[0].client_sig}" style="width: 150px; height: 50px; object-fit: contain;" />` : ""}<br/>
        <strong>Cliente</strong><br/>${inspData[0]?.client_mgr_name || ""}
      </div>
    </div>`;

    html += `<div class="footer">NEMCHEM © 2024 - Documento gerado pelo FIMS</div>`;
    html += `</body></html>`;
    
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Nemchem_${type === "daily" ? "Diario" : "Mensal"}_${client.name}.doc`;
    link.click();
  };

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Centro de Relatórios</div><div className="page-sub">Gere Relatórios Diários e Mensais oficiais (PDF/Word)</div></div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">Tipo de Relatório</label>
            <select className="form-select" value={reportType} onChange={e => setReportType(e.target.value)}>
              <option value="daily">Diário (Apenas falhas ≤ 3)</option>
              <option value="monthly">Mensal (Completo)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Cliente</label>
            <select className="form-select" value={clientId} onChange={e => setClientId(e.target.value)}>
              <option value="">Selecionar cliente...</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        </div>

        {reportType === "daily" ? (
          <div className="form-group">
            <label className="form-label">Data da Inspeção</label>
            <input className="form-input" type="date" value={dailyDate} onChange={e => setDailyDate(e.target.value)} />
          </div>
        ) : (
          <div className="form-group">
            <label className="form-label">Mês</label>
            <input className="form-input" type="month" value={month} onChange={e => setMonth(e.target.value)} />
          </div>
        )}

        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <button className="btn btn-danger" onClick={() => handleGenerate("pdf")} disabled={generating || !clientId}>
            {generating ? <><Icon name="bell" size={14} /> A Gerar...</> : <><Icon name="download" size={14} /> Gerar PDF</>}
          </button>
          <button className="btn btn-primary" onClick={() => handleGenerate("word")} disabled={generating || !clientId}>
            {generating ? <><Icon name="bell" size={14} /> A Gerar...</> : <><Icon name="file" size={14} /> Gerar Word</>}
          </button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Regras de Geração</h3>
        <ul style={{ fontSize: 12, color: "#666", marginLeft: 20, lineHeight: 1.8 }}>
          <li><strong>Relatório Diário:</strong> Foca apenas em problemas. Mostra apenas itens com pontuação 1, 2 ou 3. Agrupa as fotos por falha.</li>
          <li><strong>Relatório Mensal:</strong> Documento completo. Inclui KPIs, registo de atividades diárias e todas as fotos agrupadas por dia.</li>
          <li>Ambos os formatos usam o cabeçalho e rodapé oficial da NEMCHEM, com assinaturas digitais anexadas no final.</li>
        </ul>
      </div>
    </div>
  );
}
