import { useState, useEffect, useRef } from "react";
import { Icon } from "../lib/icons";
import { calcScore, isItemComplete } from "../lib/helpers";
import { photoStore } from "../lib/photoStore";
import { optimizeImage } from "../lib/imageOptimizer";
import { TEMPLATE_SECTIONS } from "../data/constants";
import SignaturePad from "../components/SignaturePad";

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

  const [items, setItems] = useState(() => loadDraft("items", inspection.items));
  const [notes, setNotes] = useState(() => loadDraft("notes", inspection.notes || ""));
  const [activeSection, setActiveSection] = useState(TEMPLATE_SECTIONS[0].id);
  const [showPhotoModal, setShowPhotoModal] = useState(null);
  const [saved, setSaved] = useState(false);
  const [photosByItem, setPhotosByItem] = useState({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [showIncompleteHint, setShowIncompleteHint] = useState("");

  const [clientMgrName, setClientMgrName] = useState(() => loadDraft("clientMgrName", inspection.client_mgr_name || ""));
  const [inspectorSig, setInspectorSig] = useState(() => loadDraft("inspectorSig", inspection.inspector_sig || ""));
  const [clientSig, setClientSig] = useState(() => loadDraft("clientSig", inspection.client_sig || ""));
  
  const [gpsCoords, setGpsCoords] = useState(inspection.gps_coords || null);
  const [elapsedTime, setElapsedTime] = useState("00:00");
  const [startTime] = useState(inspection.start_time ? new Date(inspection.start_time) : new Date());
  
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    const draftData = { items, notes, clientMgrName, inspectorSig, clientSig };
    localStorage.setItem(draftKey, JSON.stringify(draftData));
  }, [items, notes, clientMgrName, inspectorSig, clientSig, draftKey]);

  useEffect(() => {
    if (!inspection.gps_coords && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGpsCoords(`${pos.coords.latitude.toFixed(5)},${pos.coords.longitude.toFixed(5)}`),
        (err) => console.warn("GPS Error:", err.message),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, [inspection.gps_coords]);

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Math.floor((new Date() - startTime) / 1000);
      const m = String(Math.floor(diff / 60)).padStart(2, '0');
      const s = String(diff % 60).padStart(2, '0');
      setElapsedTime(`${m}:${s}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

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

  const photoCount = itemId => (photosByItem[itemId] || []).length;
  const totalComplete = items.filter(i => isItemComplete(i, photoCount(i.id))).length;
  const totalItems = items.length;
  const allComplete = totalComplete === totalItems;

  const handleSave = () => {
    onSave({ 
      ...inspection, items, notes, status: "in_progress", 
      client_mgr_name: clientMgrName, inspector_sig: inspectorSig, client_sig: clientSig,
      gps_coords: gpsCoords,
      start_time: startTime.toISOString()
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSubmit = () => {
    if (!allComplete) {
      setShowIncompleteHint("Cada item precisa de pontuação, observação (nota) e pelo menos 3 fotos.");
      return;
    }
    if (!clientMgrName.trim()) {
      setShowIncompleteHint("O nome do Supervisor do Cliente é obrigatório.");
      return;
    }
    if (!inspectorSig || !clientSig) {
      setShowIncompleteHint("Ambas as assinaturas (Inspetor e Cliente) devem ser confirmadas.");
      return;
    }

    const clearedItems = items.map(i => i.qc_comment ? { ...i, qc_comment: null } : i);
    const pct = calcScore(clearedItems);
    const alertLevel = pct < 60 ? "critical" : pct < 75 ? "warning" : "ok";
    
    localStorage.removeItem(draftKey);
    
    onSubmit({ 
      ...inspection, items: clearedItems, notes, status: "submitted", score_pct: pct, alert_level: alertLevel, 
      client_mgr_name: clientMgrName, inspector_sig: inspectorSig, client_sig: clientSig,
      gps_coords: gpsCoords,
      start_time: startTime.toISOString(),
      end_time: new Date().toISOString()
    });
  };

  const addFiles = async (itemId, fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setUploading(true); setPhotoError("");
    try {
      const savedFiles = [];
      for (const file of files) {
        setUploadProgress("A otimizar imagem...");
        const optimizedFile = await optimizeImage(file); // OPTIMIZE HERE
        setUploadProgress("A guardar foto...");
        const meta = await photoStore.add(inspection.id, itemId, optimizedFile);
        meta.url = URL.createObjectURL(optimizedFile);
        savedFiles.push(meta);
      }
      setPhotosByItem(prev => ({ ...prev, [itemId]: [...(prev[itemId] || []), ...savedFiles] }));
    } catch (err) {
      setPhotoError(err.message || "Não foi possível guardar a foto.");
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  const removePhoto = async (itemId, photo) => {
    await photoStore.remove(photo.id);
    setPhotosByItem(prev => ({ ...prev, [itemId]: (prev[itemId] || []).filter(p => p.id !== photo.id) }));
  };

  const activeSectionItems = items.filter(i => i.section_id === activeSection);
  const modalItem = showPhotoModal ? items.find(i => i.id === showPhotoModal) : null;
  const modalPhotos = showPhotoModal ? (photosByItem[showPhotoModal] || []) : [];

  return (
    <div>
      <div className="page-header" style={{ flexWrap: "wrap", gap: "16px" }}>
        <div>
          <button className="btn btn-secondary btn-sm" onClick={onBack} style={{ marginBottom: 8 }}>← Voltar</button>
          <div className="page-title">{inspection.location_name}</div>
          <div className="page-sub">Relatório de Inspeção · {inspection.date}</div>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ textAlign: 'right', fontSize: 12 }}>
            <div style={{ color: gpsCoords ? "#0F6E56" : "#888", fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
              <Icon name="location" size={12} /> {gpsCoords ? "GPS Capturado" : "A capturar GPS..."}
            </div>
            {gpsCoords && <a href={`https://maps.google.com/?q=${gpsCoords}`} target="_blank" rel="noreferrer" style={{ color: "#378ADD", fontSize: 10 }}>{gpsCoords}</a>}
            <div style={{ fontWeight: 600, fontSize: 16, color: "#1E2A3A", marginTop: 4 }}>⏱ {elapsedTime}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: "#888" }}>Itens completos</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{totalComplete}/{totalItems}</div>
          </div>
        </div>
      </div>

      {showIncompleteHint && (
        <div className="alert-bar alert-critical"><Icon name="alert" size={14} />{showIncompleteHint}</div>
      )}

      <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
        {TEMPLATE_SECTIONS.map(s => {
          const sItems = items.filter(i => i.section_id === s.id);
          const complete = sItems.filter(i => isItemComplete(i, photoCount(i.id))).length;
          const hasQc = sItems.some(i => i.qc_comment);
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              style={{
                padding: "6px 12px", borderRadius: 20, border: "0.5px solid", fontSize: 12, cursor: "pointer",
                background: activeSection === s.id ? "#1E2A3A" : "#fff",
                color: activeSection === s.id ? "#fff" : "#444",
                borderColor: activeSection === s.id ? "#1E2A3A" : "rgba(0,0,0,0.15)",
                display: 'flex', alignItems: 'center', gap: 4
              }}
            >
              {s.name} <span style={{ opacity: 0.7 }}>({complete}/{sItems.length})</span>
              {hasQc && <span style={{ width: 8, height: 8, background: "#A32D2D", borderRadius: 50, border: "1px solid #fff" }}></span>}
            </button>
          );
        })}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 14, color: "#1E2A3A" }}>
          {TEMPLATE_SECTIONS.find(s => s.id === activeSection)?.name}
        </div>
        {activeSectionItems.map(item => {
          const complete = isItemComplete(item, photoCount(item.id));
          const scored = item.score !== null;
          const needsNote = scored && !item.comment?.trim();
          const needsPhotos = scored && photoCount(item.id) < 3;
          const hasQc = item.qc_comment;
          return (
            <div key={item.id} className={`checklist-item ${scored ? "scored" : ""} ${complete ? "complete" : needsNote ? "needs-note" : needsPhotos ? "needs-evidence" : ""} ${hasQc ? "needs-note" : ""}`}>
              <div style={{ marginBottom: 8, fontSize: 13, display: "flex", alignItems: "flex-start", gap: 6 }}>
                <span style={{ flex: 1 }}>{item.text}</span>
                {complete && <Icon name="check" size={14} style={{ color: "#0F6E56", flexShrink: 0, marginTop: 1 }} />}
              </div>
              
              {hasQc && (
                <div style={{ background: "#FCEBEB", padding: 8, borderRadius: 6, marginBottom: 8, borderLeft: "3px solid #A32D2D" }}>
                  <div style={{ fontSize: 11, color: "#A32D2D", fontWeight: 600, marginBottom: 4 }}>⚠️ CORREÇÃO PEDIDA PELO SUPERVISOR:</div>
                  <div style={{ fontSize: 12, color: "#A32D2D" }}>{item.qc_comment}</div>
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 4 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} className={`score-btn score-${n} ${item.score === n ? "selected" : ""}`} onClick={() => setScore(item.id, n)}>{n}</button>
                  ))}
                </div>
                <button 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => setShowPhotoModal(item.id)} 
                  style={{ marginLeft: "auto", color: photoCount(item.id) < 3 ? "#854F0B" : "#0F6E56", borderColor: photoCount(item.id) < 3 ? "#EF9F27" : "#0F6E56" }}
                >
                  <Icon name="camera" size={12} />{photoCount(item.id)}/3 Fotos
                </button>
              </div>
              <input
                className="form-input"
                style={{ marginTop: 6, fontSize: 12, borderColor: needsNote ? "#A32D2D" : undefined }}
                placeholder="Observações (obrigatório)..."
                value={item.comment || ""}
                onChange={e => setComment(item.id, e.target.value)}
                spellCheck="true"
              />
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <label className="form-label">Observações Gerais da Inspeção</label>
        <textarea
          className="form-textarea"
          placeholder="Notas adicionais sobre esta inspeção..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          spellCheck="true"
        />
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
        <button className="btn btn-secondary" onClick={handleSave}>
          {saved ? <><Icon name="check" size={13} />Guardado!</> : "Guardar Rascunho"}
        </button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={totalComplete === 0}>
          <Icon name="check" size={13} />Submeter Inspeção
        </button>
      </div>

      {showPhotoModal && (
        <div className="modal-overlay" onClick={() => setShowPhotoModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div><div style={{ fontSize: 15, fontWeight: 500 }}>Evidência Fotográfica (Mín. 3)</div><div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{modalItem?.text}</div></div>
              <button className="icon-btn" onClick={() => setShowPhotoModal(null)}><Icon name="x" size={14} /></button>
            </div>
            <div className="modal-body">
              {photoError && <div className="alert-bar alert-critical" style={{ marginBottom: 12 }}><Icon name="alert" size={14} />{photoError}</div>}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 16 }}>
                <button className="btn btn-secondary" onClick={() => fileInputRef.current.click()}><Icon name="file" size={14} /> Upload da Galeria</button>
                <button className="btn btn-primary" onClick={() => cameraInputRef.current.click()}><Icon name="camera" size={14} /> Tirar Foto (Câmara)</button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => { addFiles(showPhotoModal, e.target.files); e.target.value = ""; }} />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={e => { addFiles(showPhotoModal, e.target.files); e.target.value = ""; }} />
              
              {uploading && <div style={{ textAlign: 'center', color: '#378ADD', fontSize: 13, margin: '12px 0', fontWeight: 500 }}>⚙️ {uploadProgress}</div>}

              {modalPhotos.length > 0 && (
                <div className="photo-grid">
                  {modalPhotos.map(p => (
                    <div key={p.id} className="photo-thumb"><img src={p.url} alt={p.filename} onClick={() => setLightboxUrl(p.url)} /><button className="photo-thumb-remove" onClick={() => removePhoto(showPhotoModal, p)}><Icon name="x" size={12} /></button></div>
                  ))}
                </div>
              )}
              {modalPhotos.length === 0 && !uploading && <div style={{ textAlign: 'center', color: '#888', fontSize: 13, padding: '20px' }}>Nenhuma foto adicionada ainda.</div>}
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowPhotoModal(null)}>Fechar</button></div>
          </div>
        </div>
      )}

      {lightboxUrl && <div className="photo-lightbox-overlay" onClick={() => setLightboxUrl(null)}><img src={lightboxUrl} alt="Evidência" /></div>}
    </div>
  );
}
