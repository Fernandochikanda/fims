import { useState, useEffect } from "react";
import { Icon } from "./lib/icons";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Login from "./pages/Login";
import { CEODashboard, SupervisorDashboard, InspectorDashboard } from "./pages/Dashboards";
import InspectionForm from "./pages/InspectionForm";
import InspectionsList from "./pages/InspectionsList";
import InspectionDetail from "./pages/InspectionDetail";
import MonthlyReport from "./pages/MonthlyReport";
import Alerts from "./pages/Alerts";
import Schedule from "./pages/Schedule";
import LiveMap from "./pages/LiveMap";
import Team from "./pages/Team";
import Messages from "./pages/Messages";
import ScheduleModal from "./components/ScheduleModal";
import { UsersPage, LocationsPage, ReportsPage, TemplatesPage, AuditPage, SettingsPage } from "./pages/Management";
import { SEED_USERS, SEED_LOCATIONS, ROLES, TEMPLATE_SECTIONS } from "./data/constants";
import { genSeedInspections, genId } from "./lib/helpers";
import { LangProvider } from "./context/LangContext";
import { CommsProvider, useComms } from "./context/CommsContext";

function NewInspectionModal({ locations, users, currentUser, onClose, onCreate }) {
  const [locId, setLocId] = useState("");
  const [inspectorId, setInspectorId] = useState(currentUser.role === ROLES.INSPECTOR ? currentUser.id : "");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const handle = () => {
    if (!locId) return;
    const loc = locations.find(l => l.id === Number(locId));
    const inspector = users.find(u => u.id === Number(inspectorId)) || currentUser;
    const insp = {
      id: genId(), location_id: loc.id, location_name: loc.name,
      inspector_id: inspector.id, inspector_name: inspector.name,
      supervisor_id: 3, supervisor_name: "Ana Sitoe",
      status: "in_progress", score_pct: null, date,
      items: TEMPLATE_SECTIONS.flatMap(s => s.items.map(item => ({ ...item, section_id: s.id, score: null, comment: "", photos: [] }))),
      notes: "", alert_level: "ok", type: "inspection", accepted: true
    };
    onCreate(insp);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><div style={{ fontSize: 15, fontWeight: 500 }}>Nova Inspeção Imediata</div><button className="icon-btn" onClick={onClose}><Icon name="x" size={14} /></button></div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Localização (Cliente) *</label>
            <select className="form-select" value={locId} onChange={e => setLocId(e.target.value)}>
              <option value="">Selecionar localização...</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          {currentUser.role !== ROLES.INSPECTOR && (
            <div className="form-group">
              <label className="form-label">Inspetor</label>
              <select className="form-select" value={inspectorId} onChange={e => setInspectorId(e.target.value)}>
                <option value="">Selecionar inspetor...</option>
                {users.filter(u => u.role === ROLES.INSPECTOR).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          )}
          <div className="form-group"><label className="form-label">Data</label><input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
        </div>
        <div className="modal-footer"><button className="btn btn-secondary" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={handle} disabled={!locId}>Iniciar Inspeção</button></div>
      </div>
    </div>
  );
}

function AppContent() {
  const { notify } = useComms();
  
  // Persist Current User
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("fims_current_user");
    return saved ? JSON.parse(saved) : null;
  });
  
  const [page, setPage] = useState("dashboard");
  const [inspections, setInspections] = useState(() => {
    const saved = localStorage.getItem("fims_inspections");
    return saved ? JSON.parse(saved) : genSeedInspections();
  });
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem("fims_users");
    return saved ? JSON.parse(saved) : SEED_USERS;
  });
  const [locations, setLocations] = useState(() => {
    const saved = localStorage.getItem("fims_locations");
    return saved ? JSON.parse(saved) : SEED_LOCATIONS;
  });
  const [auditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem("fims_logs");
    return saved ? JSON.parse(saved) : [];
  });

  const [viewingInspection, setViewingInspection] = useState(null);
  const [editingInspection, setEditingInspection] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { localStorage.setItem("fims_inspections", JSON.stringify(inspections)); }, [inspections]);
  useEffect(() => { localStorage.setItem("fims_users", JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem("fims_locations", JSON.stringify(locations)); }, [locations]);
  useEffect(() => { localStorage.setItem("fims_logs", JSON.stringify(auditLogs)); }, [auditLogs]);

  const alertCount = inspections.filter(i => i.alert_level === "critical" && i.score_pct !== null && !i.resolved).length;
  const topBarTitles = {
    dashboard: "Dashboard", inspections: "Inspeções", alerts: "Alertas", reports: "Relatórios",
    users: "Utilizadores", locations: "Localizações", templates: "Templates",
    audit: "Auditoria", settings: "Configurações", monthly_report: "Relatório Mensal",
    schedule: "Agenda", field_map: "Mapa de Campo", team: "Equipa (KPIs)", messages: "Mensagens"
  };

  const addAuditLog = (user, action, type, detail) => {
    setAuditLogs(prev => [{ id: genId(), timestamp: new Date().toISOString(), user: user.name, action, type, detail }, ...prev]);
  };

  const handleLogin = (user) => { 
    setCurrentUser(user); 
    localStorage.setItem("fims_current_user", JSON.stringify(user));
    addAuditLog(user, "Login", "login", "Entrou no sistema"); 
  };
  
  const handleLogout = () => { 
    if (currentUser) addAuditLog(currentUser, "Logout", "logout", "Saiu do sistema"); 
    localStorage.removeItem("fims_current_user");
    setCurrentUser(null); 
    setPage("dashboard"); 
  };
  
  const handleNavigate = (p) => { setPage(p); setViewingInspection(null); setEditingInspection(null); if (p === "new-inspection") setShowNewModal(true); };
  const handleViewInspection = (insp) => { setViewingInspection(insp); setEditingInspection(null); setPage("inspections"); };
  
  const handleStartInspection = (insp) => {
    const updated = insp.status === "pending" || insp.status === "needs_corrections" ? { ...insp, status: "in_progress" } : insp;
    setInspections(prev => prev.map(i => i.id === updated.id ? updated : i));
    setEditingInspection(updated); setViewingInspection(null); setPage("inspections");
  };
  const handleSaveInspection = (updated) => { setInspections(prev => prev.map(i => i.id === updated.id ? updated : i)); setEditingInspection(updated); };
  
  const handleSubmitInspection = (updated) => {
    setInspections(prev => prev.map(i => i.id === updated.id ? updated : i)); setEditingInspection(null); setPage("inspections");
    addAuditLog(currentUser, "Notificação Enviada", "notification", `Email e WhatsApp enviados para o Supervisor (${updated.supervisor_name}) sobre a inspeção em ${updated.location_name}`);
    notify(3, `Nova inspeção submetida por ${currentUser.name} para ${updated.location_name}.`, "inspections");
  };
  
  const handleCreateInspection = (insp) => { setInspections(prev => [insp, ...prev]); setShowNewModal(false); setEditingInspection(insp); setPage("inspections"); };
  
  const handleUpdateInspection = (updated) => {
    setInspections(prev => prev.map(i => i.id === updated.id ? updated : i)); 
    if (viewingInspection) setViewingInspection(updated);
    if (updated.status === "needs_corrections") {
      notify(updated.inspector_id, `A inspeção de ${updated.location_name} foi rejeitada. Veja as correções necessárias.`, "inspections");
    }
    if (updated.status === "reviewed") {
      notify(2, `Uma inspeção foi aprovada por ${currentUser.name}. Pronta para envio ao cliente.`, "inspections");
    }
  };

  const handleCreateSchedule = (tasks) => {
    setInspections(prev => [...tasks, ...prev]);
    setShowScheduleModal(false);
    addAuditLog(currentUser, "Despacho Criado", "schedule", `Agendou ${tasks.length} tarefa(s) para ${tasks[0].inspector_name}`);
    tasks.forEach(t => notify(t.inspector_id, `Nova tarefa agendada para ${t.date} no local ${t.location_name}.`, "schedule"));
  };

  const handleAcceptTask = (insp) => {
    setInspections(prev => prev.map(i => i.id === insp.id ? { ...i, accepted: true, status: "pending" } : i));
    addAuditLog(currentUser, "Tarefa Aceite", "schedule", `Aceitou a tarefa para ${insp.location_name}`);
    notify(3, `${currentUser.name} aceitou a tarefa para ${insp.location_name}.`, "schedule");
  };

  const handleDeclineTask = (insp) => {
    const reason = prompt("Motivo da recusa:", "");
    if (reason === null) return;
    setInspections(prev => prev.map(i => i.id === insp.id ? { ...i, accepted: false, status: "rejected", decline_reason: reason } : i));
    addAuditLog(currentUser, "Tarefa Recusada", "schedule", `Recusou a tarefa para ${insp.location_name}. Motivo: ${reason}`);
    notify(3, `⚠️ ${currentUser.name} RECUSOU a tarefa para ${insp.location_name}. Motivo: ${reason}`, "schedule");
  };

  const handleRequestLeave = (user) => {
    const date = prompt("Data da folga (AAAA-MM-DD):", new Date().toISOString().split("T")[0]);
    if (!date) return;
    const leaveTask = { id: genId(), inspector_id: user.id, inspector_name: user.name, date, type: "leave", status: "leave" };
    setInspections(prev => [leaveTask, ...prev]);
    addAuditLog(user, "Folga Pedida", "schedule", `Pediu folga para ${date}`);
    notify(3, `${user.name} pediu folga para ${date}.`, "schedule");
    alert("Folga registada.");
  };

  if (!currentUser) return <Login onLogin={handleLogin} />;

  return (
    <div className="fims-app">
      <Sidebar currentUser={currentUser} activePage={page} onNavigate={handleNavigate} alertCount={alertCount} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main">
        <Topbar title={editingInspection ? editingInspection.location_name : viewingInspection ? viewingInspection.location_name : topBarTitles[page] || "FIMS"} onMenuClick={() => setSidebarOpen(true)} onLogout={handleLogout} currentUser={currentUser} onNavigate={handleNavigate} />
        <div className="page scrollbar-thin">
          {editingInspection ? <InspectionForm inspection={editingInspection} onSave={handleSaveInspection} onSubmit={handleSubmitInspection} onBack={() => { setEditingInspection(null); setPage("inspections"); }} /> 
          : viewingInspection ? <InspectionDetail inspection={viewingInspection} currentUser={currentUser} onBack={() => setViewingInspection(null)} onUpdate={handleUpdateInspection} addAuditLog={addAuditLog} /> 
          : page === "dashboard" ? (
            currentUser.role === ROLES.CEO || currentUser.role === ROLES.ADMIN ? <CEODashboard inspections={inspections} locations={locations} auditLogs={auditLogs} currentUser={currentUser} />
            : currentUser.role === ROLES.SUPERVISOR ? <SupervisorDashboard inspections={inspections} users={users} currentUser={currentUser} onView={handleViewInspection} />
            : <InspectorDashboard inspections={inspections} users={users} currentUser={currentUser} onStartInspection={handleStartInspection} onCreate={() => setShowNewModal(true)} onAcceptTask={handleAcceptTask} onDeclineTask={handleDeclineTask} onRequestLeave={handleRequestLeave} />
          ) : page === "inspections" ? <InspectionsList inspections={inspections} currentUser={currentUser} onView={handleViewInspection} onCreate={() => setShowNewModal(true)} />
          : page === "messages" ? <Messages users={users} currentUser={currentUser} />
          : page === "alerts" ? <Alerts inspections={inspections} onView={handleViewInspection} onUpdate={handleUpdateInspection} />
          : page === "schedule" ? <Schedule inspections={inspections} users={users} onUpdate={handleUpdateInspection} onOpenModal={() => setShowScheduleModal(true)} />
          : page === "field_map" ? <LiveMap inspections={inspections} />
          : page === "team" ? <Team users={users} inspections={inspections} />
          : page === "monthly_report" ? <MonthlyReport inspections={inspections} locations={locations} />
          : page === "reports" ? <ReportsPage inspections={inspections} locations={locations} users={users} />
          : page === "users" ? <UsersPage users={users} setUsers={setUsers} />
          : page === "locations" ? <LocationsPage locations={locations} setLocations={setLocations} users={users} inspections={inspections} />
          : page === "templates" ? <TemplatesPage />
          : page === "audit" ? <AuditPage auditLogs={auditLogs} />
          : page === "settings" ? <SettingsPage /> : null}
        </div>
      </div>
      {showNewModal && <NewInspectionModal locations={locations} users={users} currentUser={currentUser} onClose={() => setShowNewModal(false)} onCreate={handleCreateInspection} />}
      {showScheduleModal && <ScheduleModal locations={locations} users={users} inspections={inspections} onClose={() => setShowScheduleModal(false)} onCreate={handleCreateSchedule} />}
    </div>
  );
}

export default function App() {
  return (
    <LangProvider>
      <CommsProvider>
        <AppContent />
      </CommsProvider>
    </LangProvider>
  );
}
