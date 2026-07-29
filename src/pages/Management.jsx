import { useState } from "react";
import { Icon } from "../lib/icons";
import ScoreRing from "../components/ScoreRing";
import { ROLES, TEMPLATE_SECTIONS } from "../data/constants";
import { scoreLabel } from "../lib/helpers";

export function UsersPage({ users, setUsers }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: ROLES.INSPECTOR });

  const save = () => {
    setUsers(prev => [...prev, { id: Date.now(), ...form, active: true, avatar: form.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() }]);
    setShowModal(false);
  };

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Gestão de Utilizadores</div><div className="page-sub">{users.length} utilizadores</div></div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}><Icon name="plus" size={13} />Novo Utilizador</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Nome</th><th>Email</th><th>Perfil</th><th>Estado</th><th>Ações</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td><div style={{ display: "flex", alignItems: "center", gap: 9 }}><div className="user-avatar-sm">{u.avatar}</div><span style={{ fontWeight: 500 }}>{u.name}</span></div></td>
                <td style={{ color: "#888" }}>{u.email}</td>
                <td><span className="badge badge-progress">{u.role}</span></td>
                <td><span className={`badge ${u.active ? "badge-ok" : "badge-closed"}`}>{u.active ? "Ativo" : "Inativo"}</span></td>
                <td><button className="btn btn-danger btn-sm" onClick={() => setUsers(prev => prev.map(x => x.id === u.id ? { ...x, active: !x.active } : x))}>{u.active ? "Desativar" : "Ativar"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><div style={{ fontSize: 15, fontWeight: 500 }}>Novo Utilizador</div><button className="icon-btn" onClick={() => setShowModal(false)}><Icon name="x" size={14} /></button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Nome completo</label><input className="form-input" spellCheck="true" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Perfil</label><select className="form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}><option value={ROLES.INSPECTOR}>Inspetor</option><option value={ROLES.SUPERVISOR}>Supervisor</option><option value={ROLES.CEO}>CEO</option><option value={ROLES.ADMIN}>Administrador</option></select></div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={save}>Criar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export function LocationsPage({ locations, setLocations, users, inspections }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", supervisor_id: "" });

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Localizações</div><div className="page-sub">{locations.length} locais</div></div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}><Icon name="plus" size={13} />Nova Localização</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {locations.map(loc => {
          const locInsp = inspections.filter(i => i.location_id === loc.id && i.score_pct !== null);
          const avg = locInsp.length ? Math.round(locInsp.reduce((s, i) => s + i.score_pct, 0) / locInsp.length) : null;
          return (
            <div key={loc.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div><div style={{ fontSize: 14, fontWeight: 500 }}>{loc.name}</div><div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{loc.address}</div></div>
                <ScoreRing pct={avg} size={44} />
              </div>
              <div style={{ fontSize: 12, color: "#888" }}>{locInsp.length} inspeções realizadas</div>
            </div>
          );
        })}
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><div style={{ fontSize: 15, fontWeight: 500 }}>Nova Localização</div><button className="icon-btn" onClick={() => setShowModal(false)}><Icon name="x" size={14} /></button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Nome do Local</label><input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Endereço</label><input className="form-input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={() => { setLocations(prev => [...prev, { id: Date.now(), ...form }]); setShowModal(false); }}>Criar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ReportsPage({ inspections, locations }) {
  const [filterLoc, setFilterLoc] = useState("all");
  let filtered = inspections.filter(i => i.score_pct !== null);
  if (filterLoc !== "all") filtered = filtered.filter(i => i.location_id === Number(filterLoc));
  const avgScore = filtered.length ? Math.round(filtered.reduce((s, i) => s + i.score_pct, 0) / filtered.length) : 0;

  return (
    <div>
      <div className="page-header"><div><div className="page-title">Relatórios e Analytics</div><div className="page-sub">{filtered.length} inspeções</div></div></div>
      <div className="metric-grid">
        <div className="metric-card"><div className="metric-label">Score Médio</div><div className="metric-value" style={{ color: scoreLabel(avgScore).color }}>{avgScore}%</div></div>
        <div className="metric-card"><div className="metric-label">Total Inspeções</div><div className="metric-value">{filtered.length}</div></div>
        <div className="metric-card"><div className="metric-label">Críticas</div><div className="metric-value" style={{ color: "#A32D2D" }}>{filtered.filter(i => i.alert_level === "critical").length}</div></div>
      </div>
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Performance por Localização</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Localização</th><th>Nº Inspeções</th><th>Score Médio</th></tr></thead>
            <tbody>
              {locations.map(loc => {
                const li = filtered.filter(i => i.location_id === loc.id);
                if (!li.length) return null;
                const avg = Math.round(li.reduce((s, i) => s + i.score_pct, 0) / li.length);
                return <tr key={loc.id}><td style={{ fontWeight: 500 }}>{loc.name}</td><td>{li.length}</td><td><ScoreRing pct={avg} size={36} /></td></tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function TemplatesPage() {
  return (
    <div>
      <div className="page-header"><div><div className="page-title">Templates de Inspeção</div><div className="page-sub">1 template ativo</div></div></div>
      <div className="card">
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 16 }}>Relatório de Inspeção de Limpeza</div>
        {TEMPLATE_SECTIONS.map(section => (
          <div key={section.id} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#1E2A3A", marginBottom: 6, padding: "6px 0", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>{section.name}</div>
            {section.items.map(item => <div key={item.id} style={{ fontSize: 12, color: "#888", padding: "3px 0 3px 12px" }}>• {item.text}</div>)}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AuditPage({ auditLogs }) {
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Registo de Auditoria (Log)</div><div className="page-sub">Entradas, saídas e ações no sistema</div></div>
      </div>
      <div className="table-wrap">
        <table className="audit-table">
          <thead><tr><th>Data e Hora</th><th>Utilizador</th><th>Ação</th><th>Detalhes</th></tr></thead>
          <tbody>
            {auditLogs.length === 0 && <tr><td colSpan={4} style={{textAlign: 'center', padding: '20px'}}>Nenhum registo ainda.</td></tr>}
            {auditLogs.map(log => (
              <tr key={log.id}>
                <td>{new Date(log.timestamp).toLocaleString("pt-PT")}</td>
                <td>{log.user}</td>
                <td><span className={`badge ${log.type === "login" ? "badge-ok" : log.type === "logout" ? "badge-closed" : "badge-progress"}`}>{log.action}</span></td>
                <td>{log.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SettingsPage() {
  return (
    <div>
      <div className="page-header"><div><div className="page-title">Configurações</div><div className="page-sub">Parâmetros globais</div></div></div>
      <div className="card"><div style={{ fontSize: 13, color: "#888", textAlign: "center", padding: 40 }}>Configurações do sistema aparecerão aqui.</div></div>
    </div>
  );
}
