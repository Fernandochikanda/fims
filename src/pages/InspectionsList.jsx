import { useState } from "react";
import { Icon } from "../lib/icons";
import ScoreRing from "../components/ScoreRing";
import StatusBadge from "../components/StatusBadge";
import { ROLES } from "../data/constants";

export default function InspectionsList({ inspections, currentUser, onView, onCreate }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const canSeeAll = [ROLES.ADMIN, ROLES.CEO, ROLES.SUPERVISOR].includes(currentUser.role);
  let list = canSeeAll ? inspections : inspections.filter(i => i.inspector_id === currentUser.id);

  if (search) list = list.filter(i => i.location_name.toLowerCase().includes(search.toLowerCase()) || i.inspector_name.toLowerCase().includes(search.toLowerCase()));
  if (statusFilter !== "all") list = list.filter(i => i.status === statusFilter);
  if (riskFilter !== "all") list = list.filter(i => i.alert_level === riskFilter);
  if (dateFrom) list = list.filter(i => i.date >= dateFrom);
  if (dateTo) list = list.filter(i => i.date <= dateTo);

  const canCreate = [ROLES.ADMIN, ROLES.SUPERVISOR].includes(currentUser.role);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Inspeções</div>
          <div className="page-sub">{list.length} inspeção(ões) encontrada(s)</div>
        </div>
        {canCreate && (
          <button className="btn btn-primary btn-sm" onClick={onCreate}><Icon name="plus" size={13} />Nova Inspeção</button>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Icon name="search" size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#888" }} />
          <input className="form-input" style={{ paddingLeft: 32 }} placeholder="Pesquisar..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 150 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">Todos Status</option>
          <option value="pending_acceptance">Aguarda Aceitação</option>
          <option value="pending">Pendente</option>
          <option value="in_progress">Em Progresso</option>
          <option value="submitted">Submetida</option>
          <option value="needs_corrections">Rejeitada</option>
          <option value="reviewed">Aprovada</option>
          <option value="closed">Fechada</option>
        </select>
        <select className="form-select" style={{ width: 130 }} value={riskFilter} onChange={e => setRiskFilter(e.target.value)}>
          <option value="all">Todo Risco</option>
          <option value="critical">Crítico</option>
          <option value="warning">Atenção</option>
          <option value="ok">OK</option>
        </select>
        <input type="date" className="form-input" style={{ width: 150 }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="De" />
        <input type="date" className="form-input" style={{ width: 150 }} value={dateTo} onChange={e => setDateTo(e.target.value)} title="Até" />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Localização</th>
              {canSeeAll && <th>Inspetor</th>}
              <th>Data</th>
              <th>Score</th>
              <th>Risco</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {list.slice(0, 100).map(insp => (
              <tr key={insp.id}>
                <td style={{ fontWeight: 500 }}>{insp.location_name}</td>
                {canSeeAll && <td style={{ color: "#888" }}>{insp.inspector_name}</td>}
                <td style={{ color: "#888" }}>{insp.date}</td>
                <td><ScoreRing pct={insp.score_pct} size={36} /></td>
                <td>{insp.score_pct !== null && <StatusBadge status={insp.alert_level} />}</td>
                <td><StatusBadge status={insp.status} /></td>
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => onView(insp)}><Icon name="eye" size={12} />Ver</button>
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "#888" }}>Nenhuma inspeção encontrada.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
