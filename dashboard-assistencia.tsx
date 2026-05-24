import { useState, useMemo } from "react";

const initialData = [
  { id: "OS-001", empreendimento: "Residencial Aurora", apartamento: "101", inicio: "2026-03-20", fim: "2026-04-30", status: "Concluído" },
  { id: "OS-002", empreendimento: "Parque das Flores", apartamento: "304", inicio: "2026-04-01", fim: "", status: "Em Andamento" },
  { id: "OS-003", empreendimento: "Residencial Aurora", apartamento: "212", inicio: "2026-03-10", fim: "", status: "Em Andamento" },
  { id: "OS-004", empreendimento: "Vila Serena", apartamento: "508", inicio: "2026-04-15", fim: "2026-05-10", status: "Concluído" },
  { id: "OS-005", empreendimento: "Parque das Flores", apartamento: "102", inicio: "2026-02-28", fim: "", status: "Em Andamento" },
];

const today = new Date("2026-05-23");

function daysDiff(start, end) {
  const s = new Date(start);
  const e = end ? new Date(end) : today;
  return Math.floor((e - s) / (1000 * 60 * 60 * 24));
}

function statusBadge(row) {
  const days = daysDiff(row.inicio, row.fim || null);
  if (row.status === "Concluído") {
    return days > 60
      ? { label: "Concluído c/ Atraso", color: "#f97316", bg: "#fff7ed" }
      : { label: "Concluído", color: "#16a34a", bg: "#f0fdf4" };
  }
  if (days > 60) return { label: "Atrasado", color: "#dc2626", bg: "#fef2f2" };
  if (days >= 45) return { label: "Atenção", color: "#d97706", bg: "#fffbeb" };
  return { label: "No Prazo", color: "#0284c7", bg: "#f0f9ff" };
}

const EMPREENDIMENTOS = ["Todos", "Residencial Aurora", "Parque das Flores", "Vila Serena"];

export default function App() {
  const [rows, setRows] = useState(initialData);
  const [filter, setFilter] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [showModal, setShowModal] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ id: "", empreendimento: "", apartamento: "", inicio: "", fim: "", status: "Em Andamento" });
  const [sortCol, setSortCol] = useState("dias");
  const [sortDir, setSortDir] = useState("desc");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const enriched = useMemo(() => rows.map(r => ({
    ...r,
    dias: daysDiff(r.inicio, r.fim || null),
    badge: statusBadge(r),
  })), [rows]);

  const filtered = useMemo(() => {
    let d = enriched;
    if (filter !== "Todos") d = d.filter(r => r.empreendimento === filter);
    if (filterStatus !== "Todos") d = d.filter(r => r.badge.label === filterStatus || r.status === filterStatus);
    if (search) d = d.filter(r =>
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.apartamento.toLowerCase().includes(search.toLowerCase()) ||
      r.empreendimento.toLowerCase().includes(search.toLowerCase())
    );
    return [...d].sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (sortCol === "dias") { va = a.dias; vb = b.dias; }
      if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === "asc" ? va - vb : vb - va;
    });
  }, [enriched, filter, filterStatus, search, sortCol, sortDir]);

  const stats = useMemo(() => ({
    total: enriched.length,
    atrasados: enriched.filter(r => r.badge.label === "Atrasado").length,
    atencao: enriched.filter(r => r.badge.label === "Atenção").length,
    concluidos: enriched.filter(r => r.status === "Concluído").length,
    mediaDias: enriched.length ? Math.round(enriched.reduce((s, r) => s + r.dias, 0) / enriched.length) : 0,
  }), [enriched]);

  function openNew() {
    setForm({ id: "", empreendimento: "", apartamento: "", inicio: "", fim: "", status: "Em Andamento" });
    setEditRow(null);
    setShowModal(true);
  }

  function openEdit(row) {
    setForm({ ...row });
    setEditRow(row.id);
    setShowModal(true);
  }

  function saveForm() {
    if (!form.id || !form.empreendimento || !form.apartamento || !form.inicio) return;
    if (editRow) {
      setRows(r => r.map(x => x.id === editRow ? { ...form } : x));
    } else {
      if (rows.find(r => r.id === form.id)) { alert("ID já existe!"); return; }
      setRows(r => [...r, { ...form }]);
    }
    setShowModal(false);
  }

  function deleteRow(id) {
    setRows(r => r.filter(x => x.id !== id));
    setDeleteConfirm(null);
  }

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  }

  function exportCSV() {
    const header = "OS,Empreendimento,Apartamento,Início,Fim,Dias,Status\n";
    const body = filtered.map(r =>
      `${r.id},${r.empreendimento},${r.apartamento},${r.inicio},${r.fim || "-"},${r.dias},${r.badge.label}`
    ).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "ordens_servico.csv"; a.click();
  }

  const SortIcon = ({ col }) => (
    <span style={{ opacity: sortCol === col ? 1 : 0.3, fontSize: 11 }}>
      {sortCol === col ? (sortDir === "asc" ? " ▲" : " ▼") : " ⇅"}
    </span>
  );

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif", background: "#f1f5f9", minHeight: "100vh", padding: "28px 20px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap');
        * { box-sizing: border-box; }
        .btn { cursor: pointer; border: none; border-radius: 8px; font-family: inherit; font-weight: 600; transition: all .15s; }
        .btn:hover { filter: brightness(0.93); }
        .th-btn { background: none; border: none; cursor: pointer; font-family: inherit; font-weight: 700; font-size: 12px; color: #475569; text-transform: uppercase; letter-spacing: .05em; padding: 0; }
        .row-hover:hover { background: #f8fafc !important; }
        input, select { font-family: inherit; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.45); display: flex; align-items: center; justify-content: center; z-index: 100; }
        .modal { background: #fff; border-radius: 16px; padding: 32px; width: 480px; max-width: 95vw; box-shadow: 0 20px 60px rgba(0,0,0,.18); }
        .tag { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .progress-bar { height: 6px; border-radius: 3px; background: #e2e8f0; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 3px; transition: width .3s; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: "#1e3a5f", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 18 }}>🏗️</span>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: "-.02em" }}>Assistência Técnica</h1>
              <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Controle de Ordens de Serviço · Reparos em Apartamentos</p>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" onClick={exportCSV} style={{ background: "#e2e8f0", color: "#334155", padding: "9px 16px", fontSize: 13 }}>⬇ Exportar CSV</button>
          <button className="btn" onClick={openNew} style={{ background: "#1e3a5f", color: "#fff", padding: "9px 18px", fontSize: 13 }}>+ Nova OS</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total de OS", value: stats.total, icon: "📋", color: "#1e3a5f", bg: "#dbeafe" },
          { label: "Atrasadas (+60d)", value: stats.atrasados, icon: "🚨", color: "#dc2626", bg: "#fee2e2" },
          { label: "Atenção (45-60d)", value: stats.atencao, icon: "⚠️", color: "#d97706", bg: "#fef3c7" },
          { label: "Concluídas", value: stats.concluidos, icon: "✅", color: "#16a34a", bg: "#dcfce7" },
          { label: "Média de Dias", value: stats.mediaDias + "d", icon: "📅", color: "#7c3aed", bg: "#ede9fe" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,.06)", borderLeft: `4px solid ${s.color}` }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: "'IBM Plex Mono', monospace" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", marginBottom: 18, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
        <input
          placeholder="🔍  Buscar OS, apto, empreendimento..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 14px", fontSize: 13, width: 260, outline: "none", color: "#0f172a" }}
        />
        <select value={filter} onChange={e => setFilter(e.target.value)}
          style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, background: "#fff", color: "#334155", cursor: "pointer" }}>
          {EMPREENDIMENTOS.map(e => <option key={e}>{e}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, background: "#fff", color: "#334155", cursor: "pointer" }}>
          {["Todos", "Atrasado", "Atenção", "No Prazo", "Concluído", "Concluído c/ Atraso"].map(s => <option key={s}>{s}</option>)}
        </select>
        <span style={{ marginLeft: "auto", fontSize: 13, color: "#94a3b8" }}>{filtered.length} resultado(s)</span>
      </div>

      {/* Tabela */}
      <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,.06)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                {[
                  { label: "Ordem de Serviço", col: "id" },
                  { label: "Empreendimento", col: "empreendimento" },
                  { label: "Apartamento", col: "apartamento" },
                  { label: "Início", col: "inicio" },
                  { label: "Fim", col: "fim" },
                  { label: "Dias", col: "dias" },
                  { label: "Progresso", col: null },
                  { label: "Status", col: "status" },
                  { label: "Ações", col: null },
                ].map(h => (
                  <th key={h.label} style={{ padding: "13px 16px", textAlign: "left" }}>
                    {h.col
                      ? <button className="th-btn" onClick={() => handleSort(h.col)}>{h.label}<SortIcon col={h.col} /></button>
                      : <span style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".05em" }}>{h.label}</span>
                    }
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ padding: "40px", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Nenhuma OS encontrada.</td></tr>
              )}
              {filtered.map((row, i) => {
                const pct = Math.min(100, Math.round((row.dias / 60) * 100));
                const barColor = row.dias > 60 ? "#dc2626" : row.dias >= 45 ? "#d97706" : "#0284c7";
                return (
                  <tr key={row.id} className="row-hover" style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "13px 16px", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, color: "#1e3a5f", fontSize: 13 }}>{row.id}</td>
                    <td style={{ padding: "13px 16px", color: "#334155", fontWeight: 500 }}>{row.empreendimento}</td>
                    <td style={{ padding: "13px 16px", color: "#64748b" }}>{row.apartamento}</td>
                    <td style={{ padding: "13px 16px", color: "#64748b", whiteSpace: "nowrap" }}>
                      {row.inicio ? new Date(row.inicio + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td style={{ padding: "13px 16px", color: "#64748b", whiteSpace: "nowrap" }}>
                      {row.fim ? new Date(row.fim + "T12:00:00").toLocaleDateString("pt-BR") : <span style={{ color: "#94a3b8", fontStyle: "italic" }}>Em aberto</span>}
                    </td>
                    <td style={{ padding: "13px 16px", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: barColor, fontSize: 14 }}>
                      {row.dias}d
                    </td>
                    <td style={{ padding: "13px 16px", minWidth: 100 }}>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: pct + "%", background: barColor }} />
                      </div>
                      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 3 }}>{pct}% de 60d</div>
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <span className="tag" style={{ color: row.badge.color, background: row.badge.bg }}>
                        {row.badge.label}
                      </span>
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn" onClick={() => openEdit(row)} style={{ background: "#f1f5f9", color: "#334155", padding: "5px 11px", fontSize: 12 }}>✏️</button>
                        <button className="btn" onClick={() => setDeleteConfirm(row.id)} style={{ background: "#fee2e2", color: "#dc2626", padding: "5px 11px", fontSize: 12 }}>🗑</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legenda */}
      <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
        {[
          { color: "#0284c7", bg: "#f0f9ff", label: "No Prazo (< 45 dias)" },
          { color: "#d97706", bg: "#fffbeb", label: "Atenção (45–60 dias)" },
          { color: "#dc2626", bg: "#fef2f2", label: "Atrasado (> 60 dias)" },
          { color: "#16a34a", bg: "#f0fdf4", label: "Concluído" },
        ].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#64748b" }}>
            <span className="tag" style={{ color: l.color, background: l.bg }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Modal Nova/Editar OS */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
              {editRow ? "✏️ Editar Ordem de Serviço" : "➕ Nova Ordem de Serviço"}
            </h2>
            {[
              { label: "Número da OS *", key: "id", placeholder: "Ex: OS-006", disabled: !!editRow },
              { label: "Empreendimento *", key: "empreendimento", placeholder: "Ex: Residencial Aurora" },
              { label: "Apartamento *", key: "apartamento", placeholder: "Ex: 302" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>{f.label}</label>
                <input disabled={f.disabled} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none", background: f.disabled ? "#f8fafc" : "#fff" }} />
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Data de Início *</label>
                <input type="date" value={form.inicio} onChange={e => setForm(p => ({ ...p, inicio: e.target.value }))}
                  style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Data de Conclusão</label>
                <input type="date" value={form.fim} onChange={e => setForm(p => ({ ...p, fim: e.target.value }))}
                  style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none" }} />
              </div>
            </div>
            <div style={{ marginBottom: 22 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, background: "#fff", outline: "none" }}>
                <option>Em Andamento</option>
                <option>Concluído</option>
                <option>Aguardando Material</option>
                <option>Pausado</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn" onClick={() => setShowModal(false)} style={{ background: "#f1f5f9", color: "#334155", padding: "10px 20px", fontSize: 13 }}>Cancelar</button>
              <button className="btn" onClick={saveForm} style={{ background: "#1e3a5f", color: "#fff", padding: "10px 22px", fontSize: 13 }}>
                {editRow ? "Salvar Alterações" : "Criar OS"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar exclusão */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ width: 360 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 40 }}>🗑️</div>
              <h3 style={{ margin: "10px 0 6px", color: "#0f172a" }}>Excluir OS?</h3>
              <p style={{ color: "#64748b", fontSize: 14 }}>Esta ação não pode ser desfeita.</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn" onClick={() => setDeleteConfirm(null)} style={{ flex: 1, background: "#f1f5f9", color: "#334155", padding: 11, fontSize: 13 }}>Cancelar</button>
              <button className="btn" onClick={() => deleteRow(deleteConfirm)} style={{ flex: 1, background: "#dc2626", color: "#fff", padding: 11, fontSize: 13 }}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
