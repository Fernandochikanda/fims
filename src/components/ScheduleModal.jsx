import { useState } from "react";
import { Icon } from "../lib/icons";
import { ROLES } from "../data/constants";

export default function ScheduleModal({ locations, users, inspections, onClose, onCreate }) {
  const [locId, setLocId] = useState("");
  const [inspectorId, setInspectorId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("09:00");
  const [recurring, setRecurring] = useState("none");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const inspectors = users.filter(u => u.role === ROLES.INSPECTOR);

  // Smart Suggestion Logic
  const suggestions = inspectors.map(insp => {
    const hist = inspections.filter(i => i.inspector_id === insp.id && i.location_id === Number(locId) && i.score_pct);
    const avgScore = hist.length ? Math.round(hist.reduce((s,i)=>s+i.score_pct,0)/hist.length) : 0;
    const conflicts = inspections.filter(i => i.inspector_id === insp.id && i.date === date && i.accepted !== false).length;
    return { ...insp, histCount: hist.length, avgScore, conflicts };
  }).sort((a,b) => a.conflicts - b.conflicts || b.avgScore - a.avgScore);

  const handleSave = () => {
    if (!locId || !inspectorId) return alert("Selecione o Cliente e o Inspetor.");
    const loc = locations.find(l => l.id === Number(locId));
    const insp = users.find(u => u.id === Number(inspectorId));
    
    const baseTask = {
      id: Date.now(),
      location_id: loc.id, location_name: loc.name,
      inspector_id: insp.id, inspector_name: insp.name,
      supervisor_id: 3, supervisor_name: "Ana Sitoe",
      status: "pending_acceptance", accepted: null, 
      date, start_time: time, type: "inspection"
    };

    let tasksToCreate = [baseTask];
    
    // Recurring Logic
    if (recurring === "monthly") {
      for (let i = 1; i <= 3; i++) {
        let newDate = new Date(date);
        newDate.setMonth(newDate.getMonth() + i);
        tasksToCreate.push({ ...baseTask, id: Date.now() + i, date: newDate.toISOString().split("T")[0] });
      }
    }

    onCreate(tasksToCreate);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ fontSize: 15, fontWeight: 500 }}>Agendar Inspeção (Despacho)</div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Cliente (Localização) *</label>
            <select className="form-select" value={locId} onChange={e => { setLocId(e.target.value); setShowSuggestions(true); }}>
              <option value="">Selecionar...</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>

          {showSuggestions && locId && (
            <div style={{ background: "#E6F1FB", padding: 10, borderRadius: 8, marginBottom: 16, fontSize: 12 }}>
              <strong>Sugestões de Inspetores:</strong>
              {suggestions.slice(0, 3).map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, cursor: 'pointer' }} onClick={() => setInspectorId(s.id)}>
                  <span>👤 {s.name} {s.id === Number(inspectorId) && '✅'}</span>
                  <span style={{ color: '#666' }}>
                    {s.conflicts > 0 ? `⚠️ ${s.conflicts} conflito(s)` : '✅ Livre'} | 
                    {s.histCount > 0 ? ` Score: ${s.avgScore}%` : ' Sem histórico'}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Inspetor *</label>
            <select className="form-select" value={inspectorId} onChange={e => setInspectorId(e.target.value)}>
              <option value="">Selecionar...</option>
              {inspectors.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Data *</label>
              <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Hora *</label>
              <input className="form-input" type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Repetição (Recorrência)</label>
            <select className="form-select" value={recurring} onChange={e => setRecurring(e.target.value)}>
              <option value="none">Não repetir</option>
              <option value="monthly">Repetir mensalmente (3 meses)</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!locId || !inspectorId}>Despachar Tarefa</button>
        </div>
      </div>
    </div>
  );
}
