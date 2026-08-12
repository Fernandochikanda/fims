// /src/pages/InspectionsList.jsx
import { useState } from "react";
import { Icon } from "../lib/icons";
import ScoreRing from "../components/ScoreRing";
import StatusBadge from "../components/StatusBadge";
import { ROLES } from "../data/constants";

export default function InspectionsList({ 
  inspections, 
  currentUser, 
  onView, 
  onCreate,
  onDelete
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(null);

  const isAdmin = currentUser?.role === ROLES.ADMIN || currentUser?.role === ROLES.CEO;

  const locations = [...new Set(inspections.map(i => i.location_name))].filter(Boolean);

  const filtered = inspections.filter(insp => {
    if (filterStatus !== "all" && insp.status !== filterStatus) return false;
    if (filterLocation !== "all" && insp.location_name !== filterLocation) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchLocation = insp.location_name?.toLowerCase().includes(term);
      const matchInspector = insp.inspector_name?.toLowerCase().includes(term);
      const matchDate = insp.date?.includes(term);
      if (!matchLocation && !matchInspector && !matchDate) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleDeleteClick = (insp) => {
    setShowDeleteModal(insp);
  };

  const confirmDelete = () => {
    if (showDeleteModal && onDelete) {
      onDelete(showDeleteModal.id);
      setShowDeleteModal(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(null);
  };

  const getRiskLabel = (scorePct) => {
    if (scorePct === null || scorePct === undefined) return { label: "N/A", color: "#888" };
    if (scorePct >= 80) return { label: "Baixo", color: "#0F6E56" };
    if (scorePct >= 60) return { label: "Médio", color: "#EF9F27" };
    if (scorePct >= 40) return { label: "Alto", color: "#BA7517" };
    return { label: "Crítico", color: "#A32D2D" };
  };

  return (
    <div>
      <div className="page-header" style={{ flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div className="page-title">📋 Inspeções</div>
          <div className="page-sub">
            {sorted.length} inspeções • {inspections.filter(i => i.status === "submitted" || i.status === "pending_acceptance").length} pendentes
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-primary btn-sm" onClick={onCreate}>
            <Icon name="plus" size={13} /> Nova Inspeção
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: 16, padding: "12px 16px" }}>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr 1fr 1fr", 
          gap: 12,
          alignItems: "end"
        }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 11, color: "#888" }}>🔍 Buscar</label>
            <input
              type="text"
              className="form-input"
              placeholder="Local, inspetor ou data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: "6px 10px", fontSize: 13 }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 11, color: "#888" }}>📌 Status</label>
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ padding: "6px 10px", fontSize: 13 }}
            >
              <option value="all">Todos</option>
              <option value="pending_acceptance">Pendente</option>
              <option value="in_progress">Em Andamento</option>
              <option value="submitted">Submetida</option>
              <option value="reviewed">Aprovada</option>
              <option value="needs_corrections">Corrigir</option>
              <option value="sent_to_client">Enviada</option>
              <option value="closed">Fechada</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 11, color: "#888" }}>📍 Localização</label>
            <select
              className="form-select"
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              style={{ padding: "6px 10px", fontSize: 13 }}
            >
              <option value="all">Todos</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>
        {(searchTerm || filterStatus !== "all" || filterLocation !== "all") && (
          <div style={{ marginTop: 8, fontSize: 12, color: "#888" }}>
            {sorted.length} resultados encontrados
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginLeft: 12, padding: "2px 10px", fontSize: 11 }}
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("all");
                setFilterLocation("all");
              }}
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* Tabela */}
      <div className="table-wrap" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 700 }}>
          <thead>
            <tr>
              <th>📍 Localização</th>
              <th>👤 Inspetor</th>
              <th>📅 Data</th>
              <th>📊 Score</th>
              <th>⚠️ Risco</th>
              <th>📌 Status</th>
              <th style={{ textAlign: "center" }}>⚡ Ações</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "#888" }}>
                  {inspections.length === 0 
                    ? "Nenhuma inspeção encontrada. Crie uma nova inspeção para começar."
                    : "Nenhuma inspeção corresponde aos filtros selecionados."}
                </td>
              </tr>
            ) : (
              sorted.map(insp => {
                const risk = getRiskLabel(insp.score_pct);
                
                return (
                  <tr key={insp.id}>
                    <td style={{ fontWeight: 500 }}>{insp.location_name || "N/A"}</td>
                    <td style={{ color: "#555" }}>{insp.inspector_name || "Não atribuído"}</td>
                    <td style={{ color: "#888", fontSize: 13 }}>{insp.date || "N/A"}</td>
                    <td>
                      <ScoreRing pct={insp.score_pct} size={32} />
                    </td>
                    <td>
                      <span style={{ 
                        color: risk.color, 
                        fontWeight: 600,
                        fontSize: 12 
                      }}>
                        {risk.label}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={insp.status} />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => onView(insp)}
                          style={{ padding: "4px 10px" }}
                          title="Ver detalhes"
                        >
                          <Icon name="eye" size={13} />
                        </button>
                        {isAdmin && (
                          <button 
                            className="btn btn-danger btn-sm" 
                            onClick={() => handleDeleteClick(insp)}
                            style={{ padding: "4px 10px" }}
                            title="Excluir inspeção"
                          >
                            <Icon name="trash" size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header" style={{ borderBottom: "1px solid #A32D2D" }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#A32D2D", display: "flex", alignItems: "center", gap: 10 }}>
                <Icon name="alert" size={20} />
                Confirmar Exclusão
              </div>
              <button className="icon-btn" onClick={cancelDelete}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: "20px" }}>
              <p style={{ fontSize: 14, color: "#333", marginBottom: 8 }}>
                Tem certeza que deseja <strong style={{ color: "#A32D2D" }}>eliminar permanentemente</strong> esta inspeção?
              </p>
              <div style={{ 
                background: "#F8F7F4", 
                padding: "12px 16px", 
                borderRadius: 6,
                marginTop: 12,
                fontSize: 13
              }}>
                <div><strong>Cliente:</strong> {showDeleteModal.location_name || "N/A"}</div>
                <div><strong>Data:</strong> {showDeleteModal.date || "N/A"}</div>
                <div><strong>Inspetor:</strong> {showDeleteModal.inspector_name || "Não atribuído"}</div>
                <div><strong>Status:</strong> <StatusBadge status={showDeleteModal.status} /></div>
                <div><strong>Score:</strong> {showDeleteModal.score_pct !== null ? `${showDeleteModal.score_pct}%` : "N/A"}</div>
              </div>
              <p style={{ fontSize: 12, color: "#888", marginTop: 12 }}>
                ⚠️ Esta ação é <strong>irreversível</strong> e não pode ser desfeita. Todas as fotos e dados associados serão removidos.
              </p>
            </div>
            <div className="modal-footer" style={{ display: "flex", gap: 10, justifyContent: "flex-end", padding: "12px 20px" }}>
              <button className="btn btn-secondary" onClick={cancelDelete}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={confirmDelete} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="trash" size={14} />
                Sim, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .card {
          background: white;
          border-radius: 10px;
          border: 1px solid #E5E7EB;
        }
        .form-group {
          margin-bottom: 12px;
        }
        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #1E2A3A;
          margin-bottom: 4px;
        }
        .form-input, .form-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #D1D5DB;
          border-radius: 6px;
          font-size: 13px;
          background: white;
          transition: border-color 0.2s ease;
        }
        .form-input:focus, .form-select:focus {
          outline: none;
          border-color: #3B82F6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .table-wrap {
          overflow-x: auto;
          background: white;
          border-radius: 10px;
          border: 1px solid #E5E7EB;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        thead {
          background: #F8F7F4;
        }
        th {
          padding: 10px 14px;
          text-align: left;
          font-weight: 600;
          color: #1E2A3A;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #E5E7EB;
        }
        td {
          padding: 10px 14px;
          border-bottom: 1px solid #F3F4F6;
          vertical-align: middle;
        }
        tr:hover td {
          background: #FAFAFA;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-sm {
          padding: 4px 10px;
          font-size: 12px;
        }
        .btn-primary {
          background: #1E2A3A;
          color: white;
        }
        .btn-primary:hover {
          background: #2D3A4A;
        }
        .btn-secondary {
          background: #F3F4F6;
          color: #374151;
        }
        .btn-secondary:hover {
          background: #E5E7EB;
        }
        .btn-danger {
          background: #FEF2F2;
          color: #A32D2D;
          border: 1px solid #FCA5A5;
        }
        .btn-danger:hover {
          background: #FEE2E2;
          border-color: #F87171;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal {
          background: white;
          border-radius: 12px;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #E5E7EB;
        }
        .modal-body {
          padding: 20px;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 12px 20px;
          border-top: 1px solid #E5E7EB;
          background: #F8F7F4;
          border-radius: 0 0 12px 12px;
        }
        .icon-btn {
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: #6B7280;
          border-radius: 4px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .icon-btn:hover {
          background: #F3F4F6;
          color: #1E2A3A;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 16px;
        }
        .page-title {
          font-size: 20px;
          font-weight: 600;
          color: #1E2A3A;
        }
        .page-sub {
          font-size: 13px;
          color: #888;
          margin-top: 2px;
        }
        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
          }
          .card > div {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
