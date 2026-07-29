import { useState } from "react";
import { Icon } from "../lib/icons";

export default function Schedule({ inspections, users, onUpdate, onOpenModal }) {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const startOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek(currentWeek));
    d.setDate(d.getDate() + i);
    return d;
  });

  const changeWeek = (days) => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + days);
    setCurrentWeek(newDate);
  };

  const handleReschedule = (insp) => {
    const newDate = prompt("Nova data (AAAA-MM-DD):", insp.date);
    if (newDate) {
      const reason = prompt("Motivo do reagendamento:", "");
      onUpdate({ ...insp, date: newDate, status: "pending_acceptance", accepted: null, reschedule_reason: reason });
    }
  };

  const handleRoute = (dayStr, inspectorId) => {
    const tasks = inspections.filter(i => i.date === dayStr && i.inspector_id === inspectorId && i.accepted !== false);
    if (tasks.length === 0) return alert("Sem tarefas aceites para este inspetor.");
    const routeUrl = `https://www.google.com/maps/dir/${tasks.map(t => t.location_name).join('/')}`;
    window.open(routeUrl, '_blank');
  };

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Agenda de Inspeções</div><div className="page-sub">Gestão de disponibilidade e despacho</div></div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn btn-secondary btn-sm" onClick={() => changeWeek(-7)}>← Anterior</button>
          <span style={{ fontWeight: 500, fontSize: 14 }}>
            {weekDays[0].toLocaleDateString("pt-PT", { day: "numeric", month: "short" })} - {weekDays[6].toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={() => changeWeek(7)}>Próxima →</button>
          <button className="btn btn-primary btn-sm" onClick={onOpenModal}><Icon name="plus" size={13} /> Despachar</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", minWidth: "700px" }}>
        {weekDays.map((day, i) => {
          const dayStr = day.toISOString().split("T")[0];
          const dayInspections = inspections.filter(insp => insp.date === dayStr);
          const isToday = dayStr === new Date().toISOString().split("T")[0];
          const dayInspectors = [...new Set(dayInspections.map(i => i.inspector_id))];

          return (
            <div key={i} style={{ background: "#fff", border: `1px solid ${isToday ? "#378ADD" : "#e0e0e0"}`, borderRadius: "8px", minHeight: "250px", padding: "8px", display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: isToday ? "#378ADD" : "#888", marginBottom: "8px", textAlign: "center" }}>
                {day.toLocaleDateString("pt-PT", { weekday: 'short', day: 'numeric' })}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                {dayInspectors.map(inspId => {
                  const insp = users.find(u => u.id === inspId);
                  const inspTasks = dayInspections.filter(i => i.inspector_id === inspId);
                  return (
                    <div key={inspId} style={{ borderTop: "1px solid #eee", paddingTop: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "#444" }}>{insp?.name}</div>
                        <button onClick={() => handleRoute(dayStr, inspId)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#378ADD' }} title="Ver Rota no Mapa"><Icon name="location" size={12} /></button>
                      </div>
                      {inspTasks.map(task => (
                        <div key={task.id} style={{ 
                          background: task.accepted === true ? "#EAF3DE" : task.accepted === false ? "#FCEBEB" : "#E6F1FB", 
                          padding: "4px", borderRadius: "4px", fontSize: "10px", marginTop: "4px", 
                          borderLeft: `3px solid ${task.accepted === true ? "#0F6E56" : task.accepted === false ? "#A32D2D" : "#378ADD"}`
                        }}>
                          <div style={{ fontWeight: 600, color: "#1E2A3A" }}>{task.start_time || 'N/A'} - {task.location_name}</div>
                          {task.accepted === null && <div style={{ color: "#185FA5" }}>⏳ Pendente Aceitação</div>}
                          {task.accepted === false && <div style={{ color: "#A32D2D" }}>❌ Recusada</div>}
                          {task.reschedule_reason && <div style={{ color: "#A32D2D", fontStyle: 'italic' }}>Reagendada: {task.reschedule_reason}</div>}
                          <button onClick={() => handleReschedule(task)} style={{ fontSize: 9, color: '#378ADD', border: 'none', background: 'transparent', cursor: 'pointer', marginTop: 2 }}>Reagendar</button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
