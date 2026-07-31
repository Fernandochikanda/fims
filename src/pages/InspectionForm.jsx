import { useState, useEffect } from "react";
import { Icon } from "../lib/icons";
import { calcScore, isItemComplete } from "../lib/helpers";
import { photoStore } from "../lib/photoStore";
import { TEMPLATE_SECTIONS } from "../data/constants";
import SignaturePad from "../components/SignaturePad";
import PhotoUploader from "../components/PhotoUploader";

export default function InspectionForm({ inspection, onSave, onSubmit, onBack }) {
  const draftKey = `fims_draft_${inspection.id}`;

  const loadDraft = (field, fallback) => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed[field] !== undefined ? parsed[field] : fallback;
      }
    } catch (e) {}
    return fallback;
  };

  const initialSections = () => {
    let s = loadDraft("sections", inspection.sections || []);
    if (s.length === 0) {
      s = TEMPLATE_SECTIONS.map(sec => ({ id: sec.id, observation: "", photos: [] }));
    }
    return s;
  };

  const [items, setItems] = useState(() => loadDraft("items", inspection.items));
  const [sections, setSections] = useState(() => initialSections());
  const [notes, setNotes] = useState(() => loadDraft("notes", inspection.notes || ""));
  const [activeSection, setActiveSection] = useState(TEMPLATE_SECTIONS[0].id);
  const [saved, setSaved] = useState(false);
  const [photosByItem, setPhotosByItem] = useState({});
  const [showIncompleteHint, setShowIncompleteHint] = useState("");

  const [clientMgrName, setClientMgrName] = useState(() => loadDraft("clientMgrName", inspection.client_mgr_name || ""));
  const [inspectorSig, setInspectorSig] = useState(() => loadDraft("inspectorSig", inspection.inspector_sig || ""));
  const [clientSig, setClientSig] = useState(() => loadDraft("clientSig", inspection.client_sig || ""));

  useEffect(() => {
    const draftData = { items, sections, notes, clientMgrName, inspectorSig, clientSig };
    localStorage.setItem(draftKey, JSON.stringify(draftData));
  }, [items, sections, notes, clientMgrName, inspectorSig, clientSig, draftKey]);

  useEffect(() => {
    let cancelled = false;
    photoStore.listByInspection(inspection.id).then(grouped => {
      if (cancelled) return;
      setPhotosByItem(grouped);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [inspection.id]);

  const setScore = (itemId, score) => setItems(prev => prev.map(i => i.id === itemId ? { ...i, score } : i));
  const setComment = (itemId, comment) => setItems(prev => prev.map(i => i.id === itemId ? { ...i, comment } : i));
  const setSectionObservation = (secId, text) => setSections(prev => prev.map(s => s.id === secId ? { ...s, observation: text } : s));

  const addPhoto = async (entityId, file) => {
    const meta = await photoStore.add(inspection.id, entityId, file);
    meta.url = URL.createObjectURL(file);
    setPhotosByItem(prev => ({ ...prev, [entityId]: [...(prev[entityId] || []), meta] }));
  };

  const removePhoto = async (entityId, photo) => {
    await photoStore.remove(photo.id);
    setPhotosByItem(prev => ({ ...prev, [entityId]: (prev[entityId] || []).filter(p => p.id !== photo.id) }));
  };

  const photoCount = entityId => (photosByItem[entityId] || []).length;
  const totalComplete = items.filter(i => isItemComplete(i, photoCount(i.id))).length;
  const totalItems = items.length;
  const allComplete = totalComplete === totalItems;

  const handleSave = () => {
    onSave({ ...inspection, items, sections, notes, status: "in_progress", client_mgr_name: clientMgrName, inspector_sig: inspectorSig, client_sig: clientSig });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSubmit = () => {
    if (!allComplete) {
      setShowIncompleteHint("Alguns itens têm scores baixos (1-3) e requerem obrigatoriamente 3 fotos, ou faltam notas.");
      return;
    }
    if (!clientMgrName.trim()) return setShowIncompleteHint("O nome do Supervisor do Cliente é obrigatório.");
    if (!inspectorSig || !clientSig) return setShowIncompleteHint("Ambas as assinaturas devem ser confirmadas.");

    const clearedItems = items.map(i => i.qc_comment ? { ...i, qc_comment: null } : i);
    const pct = calcScore(clearedItems);
    const alertLevel = pct < 60 ? "critical" : pct < 75 ? "warning" : "ok";
    
    localStorage.removeItem(draftKey);
    onSubmit({ ...inspection, items: clearedItems, sections, notes, status: "submitted", score_pct: pct, alert_level: alertLevel, client_mgr_name: clientMgrName, inspector_sig: inspectorSig, client_sig: clientSig });
  };

  const activeSectionDef = TEMPLATE_SECTIONS.find(s => s.id === activeSection);
  const activeSectionData = sections.find(s => s.id === activeSection) || { observation: "" };
  const activeSectionItems = items.filter(i => i.section_id === activeSection);

  return (
    <div>
      <div className="page-header" style={{ flexWrap: "wrap", gap: "16px" }}>
        <div>
          <button className="btn btn-secondary btn-sm" onClick={onBack} style={{ marginBottom: 8 }}>← Voltar</button>
          <div className="page-title">{inspection.location_name}</div>
          <div className="page-sub">Relatório de Inspeção · {inspection.date}</div>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: "#888" }}>Itens completos</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{totalComplete}/{totalItems}</div>
          </div>
        </div>
      </div>

      {showIncompleteHint && <div className="alert-bar alert-critical"><Icon name="alert" size={14} />{showIncompleteHint}</div>}

      <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
        {TEMPLATE_SECTIONS.map(s => {
          const sItems = items.filter(i => i.section_id === s.id);
          const complete = sItems.filter(i => isItemComplete(i, photoCount(i.id))).length;
          const hasQc = sItems.some(i => i.qc_comment);
          return (
            <button key={s.id} onClick={() => setActiveSection(s.id)} style={{ padding: "6px 12px", borderRadius: 20, border: "0.5px solid", fontSize: 12, cursor: "pointer", background: activeSection === s.id ? "#1E2A3A" : "#fff", color: activeSection === s.id ? "#fff" : "#444", borderColor: activeSection === s.id ? "#1E2A3A" : "rgba(0,0,0,0.15)", display: 'flex', alignItems: 'center', gap: 4 }}>
              {s.name} <span style={{ opacity: 0.7 }}>({complete}/{sItems.length})</span>
              {hasQc && <span style={{ width: 8, height: 8, background: "#A32D2D", borderRadius: 50, border: "1px solid #fff" }}></span>}
            </button>
          );
        })}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 14, color: "#1E2A3A" }}>{activeSectionDef?.name}</div>

        <div style={{ background: "#F8F7F4", padding: 12, borderRadius: 8, marginBottom: 16 }}>
          <label className="form-label" style={{ fontWeight: 600 }}>Observação Geral da Categoria</label>
          <textarea 
            className="form-textarea" 
            placeholder="Enter overall observations for this category..." 
            value={activeSectionData.observation} 
            onChange={e => setSectionObservation(activeSection, e.target.value)} 
            style={{ minHeight: 60, resize: "vertical", marginBottom: 12 }}
          />
          <label className="form-label" style={{ fontWeight: 600 }}>Fotos da Categoria (Max 3)</label>
          <PhotoUploader 
            id={activeSection} 
            photos={photosByItem[activeSection] || []} 
            onAdd={addPhoto} 
            onRemove={removePhoto} 
            max={3} 
          />
        </div>

        {activeSectionItems.map(item => {
          const complete = isItemComplete(item, photoCount(item.id));
          const scored = item.score !== null;
          const isLowScore = scored && item.score <= 3;
          const needsNote = scored && !item.comment?.trim();
          const needsPhotos = isLowScore && photoCount(item.id) < 3;
          
          return (
            <div key={item.id} className={`checklist-item ${scored ? "scored" : ""} ${complete ? "complete" : needsNote || needsPhotos ? "needs-note" : ""}`}>
              <div style={{ marginBottom: 8, fontSize: 13, display: "flex", alignItems: "flex-start", gap: 6 }}>
                <span style={{ flex: 1 }}>{item.text}</span>
                {complete && <Icon name="check" size={14} style={{ color: "#0F6E56", flexShrink: 0, marginTop: 1 }} />}
              </div>
              
              {item.qc_comment && (
                <div style={{ background: "#FCEBEB", padding: 8, borderRadius: 6, marginBottom: 8, borderLeft: "3px solid #A32D2D" }}>
                  <div style={{ fontSize: 11, color: "#A32D2D", fontWeight: 600, marginBottom: 4 }}>⚠️ CORREÇÃO PEDIDA PELO SUPERVISOR:</div>
                  <div style={{ fontSize: 12, color: "#A32D2D" }}>{item.qc_comment}</div>
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                <div style={{ display: "flex", gap: 4 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} className={`score-btn score-${n} ${item.score === n ? "selected" : ""}`} onClick={() => setScore(item.id, n)}>{n}</button>
                  ))}
                </div>
              </div>

              <input className="form-input" style={{ fontSize: 12, borderColor: needsNote ? "#A32D2D" : undefined, marginBottom: 8 }} placeholder="Observações do item (obrigatório)..." value={item.comment || ""} onChange={e => setComment(item.id, e.target.value)} spellCheck="true" />

              {isLowScore && needsPhotos && (
                <div style={{ fontSize: 11, color: "#A32D2D", fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                  <Icon name="alert" size={12} /> Photo evidence is required for scores between 1 and 3.
                </div>
              )}
              <PhotoUploader 
                id={item.id} 
                photos={photosByItem[item.id] || []} 
                onAdd={addPhoto} 
                onRemove={removePhoto} 
                max={3} 
                isRequired={isLowScore}
              />
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <label className="form-label">Observações Gerais da Inspeção</label>
        <textarea className="form-textarea" placeholder="Notas adicionais sobre esta inspeção..." value={notes} onChange={e => setNotes(e.target.value)} spellCheck="true" />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 14, color: "#1E2A3A" }}>Assinaturas Obrigatórias</div>
        <div className="form-group">
          <label className="form-label">Nome do Supervisor do Cliente <span className="required">*</span></label>
          <input className="form-input" value={clientMgrName} onChange={e => setClientMgrName(e.target.value)} placeholder="Nome do gestor do cliente" spellCheck="true" />
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 250 }}>
            <SignaturePad label="Assinatura do Inspetor *" onSave={setInspectorSig} onClear={() => setInspectorSig("")} />
            {inspectorSig && <div style={{ fontSize: 11, color: "#0F6E56", marginBottom: 8 }}>✓ Assinatura do Inspetor capturada.</div>}
            {inspectorSig && <img src={inspectorSig} alt="Assinatura Inspetor" style={{ width: 100, height: 30, objectFit: 'contain' }} />}
          </div>
          <div style={{ flex: 1, minWidth: 250 }}>
            <SignaturePad label="Assinatura do Cliente *" onSave={setClientSig} onClear={() => setClientSig("")} />
            {clientSig && <div style={{ fontSize: 11, color: "#0F6E56", marginBottom: 8 }}>✓ Assinatura do Cliente capturada.</div>}
            {clientSig && <img src={clientSig} alt="Assinatura Cliente" style={{ width: 100, height: 30, objectFit: 'contain' }} />}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center" }}>
        <button className="btn btn-secondary" onClick={handleSave}>{saved ? <><Icon name="check" size={13} />Guardado!</> : "Guardar Rascunho"}</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={totalComplete === 0}><Icon name="check" size={13} />Submeter Inspeção</button>
      </div>
    </div>
  );
}
