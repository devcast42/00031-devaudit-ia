import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client from "../../app/api";

// ─── Interfaces matching FindingsViewData / UIFinding from backend v2 ───────────

interface UIFinding {
    finding_id: string;
    repository: string;
    practice: string;
    practice_name: string;
    severity: "HIGH" | "MEDIUM" | "LOW";
    title: string;
    description: string;
    recommendation: string;
    rule_violated: string;
    standard_reference: string;
    evidence_snapshot: Record<string, string | number | boolean>;
    source: "automatic" | "manual";
    status: "draft" | "approved";
    analysis_source_id: string;
    created_at: string;
    updated_at: string;
}

interface FindingsViewData {
    total_findings: number;
    by_severity: { high: number; medium: number; low: number };
    by_practice: Record<string, number>;
    by_repository: Record<string, number>;
    findings: UIFinding[];
}

const emptyForm = {
    practice: "",
    repository: "",
    title: "",
    description: "",
    severity: "MEDIUM" as "HIGH" | "MEDIUM" | "LOW",
    recommendation: "",
    evidence_reference: "",
    status: "draft" as "draft" | "approved",
};

export function FindingsStep() {
    const navigate = useNavigate();
    const { id: auditId } = useParams();

    const [viewData, setViewData] = useState<FindingsViewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [filterPractice, setFilterPractice] = useState<string>("ALL");
    const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
    const [filterRepo, setFilterRepo] = useState<string>("ALL");

    // Expanded finding details
    const [expandedFinding, setExpandedFinding] = useState<string | null>(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);

    // Delete confirmation
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const fetchFindings = async () => {
        try {
            const res = await client.get(`/audits/${auditId}/findings`);
            setViewData(res.data);
        } catch {
            /* empty state */
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (auditId) fetchFindings();
    }, [auditId]);

    const handleGenerate = async () => {
        setGenerating(true);
        setError(null);
        try {
            const res = await client.post(`/audits/${auditId}/findings/generate`);
            setViewData(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || "Error al generar los hallazgos.");
        } finally {
            setGenerating(false);
        }
    };

    const openCreate = () => {
        setEditingId(null);
        setForm(emptyForm);
        setShowModal(true);
    };

    const openEdit = (f: UIFinding) => {
        setEditingId(f.finding_id);
        setForm({
            practice: f.practice,
            repository: f.repository,
            title: f.title,
            description: f.description,
            severity: f.severity,
            recommendation: f.recommendation,
            evidence_reference: "",
            status: f.status,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            if (editingId) {
                await client.patch(`/audits/${auditId}/findings/${editingId}`, {
                    title: form.title,
                    description: form.description,
                    severity: form.severity,
                    recommendation: form.recommendation,
                    status: form.status,
                });
            } else {
                await client.post(`/audits/${auditId}/findings`, form);
            }
            setShowModal(false);
            fetchFindings();
        } catch (err: any) {
            alert(err.response?.data?.error || "Error al guardar el hallazgo.");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await client.delete(`/audits/${auditId}/findings/${id}`);
            setDeleteId(null);
            fetchFindings();
        } catch {
            alert("Error al eliminar el hallazgo.");
        }
    };

    const handleApprove = async (f: UIFinding) => {
        const newStatus = f.status === "draft" ? "approved" : "draft";
        await client.patch(`/audits/${auditId}/findings/${f.finding_id}`, { status: newStatus });
        fetchFindings();
    };

    // ─── Filters ────────────────────────────────────────────────────────────────

    const filteredFindings = (viewData?.findings || []).filter(f => {
        if (filterPractice !== "ALL" && f.practice !== filterPractice) return false;
        if (filterSeverity !== "ALL" && f.severity !== filterSeverity) return false;
        if (filterRepo !== "ALL" && f.repository !== filterRepo) return false;
        return true;
    });

    const allPractices = [...new Set((viewData?.findings || []).map(f => f.practice))];
    const allRepos = [...new Set((viewData?.findings || []).map(f => f.repository))];

    // ─── Badges ─────────────────────────────────────────────────────────────────

    const severityBadge = (severity: string) => {
        const colors: Record<string, { bg: string; text: string }> = {
            HIGH: { bg: "#FFEBEE", text: "#C62828" },
            MEDIUM: { bg: "#FFF3E0", text: "#E65100" },
            LOW: { bg: "#E8F5E9", text: "#2E7D32" },
        };
        const labels: Record<string, string> = { HIGH: "Alta", MEDIUM: "Media", LOW: "Baja" };
        const c = colors[severity] || colors.LOW;
        return (
            <span style={{ padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "600", backgroundColor: c.bg, color: c.text, textTransform: "uppercase" }}>
                {labels[severity] || severity}
            </span>
        );
    };

    const statusBadge = (status: string) => {
        const isApproved = status === "approved";
        return (
            <span style={{
                padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "600",
                backgroundColor: isApproved ? "#E8F5E9" : "#FFF8E1",
                color: isApproved ? "#2E7D32" : "#F57F17",
                textTransform: "uppercase",
            }}>
                {isApproved ? "Aprobado" : "Borrador"}
            </span>
        );
    };

    const sourceBadge = (source: string) => (
        <span style={{
            padding: "3px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "600",
            backgroundColor: source === "automatic" ? "#E3F2FD" : "#F3E5F5",
            color: source === "automatic" ? "#1565C0" : "#7B1FA2",
            textTransform: "uppercase",
        }}>
            {source === "automatic" ? "Auto" : "Manual"}
        </span>
    );

    if (loading) {
        return <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>Cargando hallazgos...</div>;
    }

    return (
        <div style={{ width: "100%", maxWidth: "1100px", margin: "0 auto" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "8px" }}>
                <div>
                    <div style={{ fontSize: "12px", fontWeight: "bold", color: "#2196F3", textTransform: "uppercase", marginBottom: "4px" }}>
                        Paso 4 de 5 • Hallazgos
                    </div>
                    <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "#1a1a1a", margin: 0 }}>
                        Hallazgos de Auditoría
                    </h2>
                </div>
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "14px", fontWeight: "bold", color: "#1a1a1a", marginBottom: "4px" }}>67% Completado</div>
                    <div style={{ width: "200px", height: "6px", backgroundColor: "#e0e0e0", borderRadius: "3px" }}>
                        <div style={{ width: "67%", height: "100%", backgroundColor: "#2196F3", borderRadius: "3px" }} />
                    </div>
                </div>
            </div>

            <div style={{ height: "1px", backgroundColor: "#e0e0e0", margin: "24px 0" }} />

            {/* Summary Cards */}
            {viewData && viewData.total_findings > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
                    {[
                        { label: "Total", value: viewData.total_findings, color: "#2196F3" },
                        { label: "Alta", value: viewData.by_severity.high, color: "#C62828" },
                        { label: "Media", value: viewData.by_severity.medium, color: "#E65100" },
                        { label: "Baja", value: viewData.by_severity.low, color: "#2E7D32" },
                    ].map(card => (
                        <div key={card.label} style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e0e0e0", padding: "20px", textAlign: "center" }}>
                            <div style={{ fontSize: "28px", fontWeight: "bold", color: card.color }}>{card.value}</div>
                            <div style={{ fontSize: "12px", fontWeight: "700", color: "#999", textTransform: "uppercase", marginTop: "4px" }}>{card.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Action Buttons + Filters */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
                <button onClick={handleGenerate} disabled={generating}
                    style={{ backgroundColor: generating ? "#90CAF9" : "#2196F3", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: generating ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "14px" }}>
                    {generating ? "⏳ Generando..." : "⚡ Generar desde el Análisis"}
                </button>
                <button onClick={openCreate}
                    style={{ backgroundColor: "white", color: "#2196F3", border: "1px solid #2196F3", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}>
                    ➕ Añadir Hallazgo Manual
                </button>

                <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
                    <select value={filterPractice} onChange={e => setFilterPractice(e.target.value)} style={filterSelectStyle}>
                        <option value="ALL">Todas las prácticas</option>
                        {allPractices.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} style={filterSelectStyle}>
                        <option value="ALL">Todas las severidades</option>
                        <option value="HIGH">Alta</option>
                        <option value="MEDIUM">Media</option>
                        <option value="LOW">Baja</option>
                    </select>
                    <select value={filterRepo} onChange={e => setFilterRepo(e.target.value)} style={filterSelectStyle}>
                        <option value="ALL">Todos los repos</option>
                        {allRepos.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
            </div>

            {error && <div style={{ color: "#C62828", marginBottom: "16px", fontSize: "14px" }}>{error}</div>}

            {/* Findings List */}
            {filteredFindings.length === 0 ? (
                <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e0e0e0", padding: "60px", textAlign: "center", marginBottom: "24px" }}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
                    <h3 style={{ margin: "0 0 8px 0", color: "#333", fontSize: "20px" }}>Aún no hay hallazgos</h3>
                    <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
                        Haga clic en "Generar desde el Análisis" para crear hallazgos automáticamente, o añádalos manualmente.
                    </p>
                </div>
            ) : (
                <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e0e0e0", overflow: "hidden", marginBottom: "24px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "2px solid #e0e0e0", backgroundColor: "#fafafa" }}>
                                {["Título", "Repositorio", "Práctica", "Severidad", "Estado", "Fuente", "Acciones"].map(h => (
                                    <th key={h} style={{ textAlign: "left", padding: "14px 12px", fontSize: "12px", fontWeight: "700", color: "#999", textTransform: "uppercase" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFindings.map(f => (
                                <>
                                    <tr key={f.finding_id} style={{ borderBottom: expandedFinding === f.finding_id ? "none" : "1px solid #f0f0f0" }}>
                                        <td style={{ padding: "12px", maxWidth: "220px" }}>
                                            <div
                                                onClick={() => setExpandedFinding(expandedFinding === f.finding_id ? null : f.finding_id)}
                                                style={{ cursor: "pointer" }}
                                            >
                                                <div style={{ fontSize: "14px", fontWeight: "600", color: "#1a1a1a", marginBottom: "2px" }}>{f.title}</div>
                                                <div style={{ fontSize: "11px", color: "#999", fontFamily: "monospace" }}>{f.rule_violated}</div>
                                            </div>
                                        </td>
                                        <td style={{ padding: "12px", fontSize: "13px", color: "#555" }}>{f.repository}</td>
                                        <td style={{ padding: "12px", fontSize: "13px", fontWeight: "600", color: "#333" }}>{f.practice}</td>
                                        <td style={{ padding: "12px" }}>{severityBadge(f.severity)}</td>
                                        <td style={{ padding: "12px" }}>
                                            <span onClick={() => handleApprove(f)} style={{ cursor: "pointer" }}>{statusBadge(f.status)}</span>
                                        </td>
                                        <td style={{ padding: "12px" }}>{sourceBadge(f.source)}</td>
                                        <td style={{ padding: "12px" }}>
                                            <div style={{ display: "flex", gap: "6px" }}>
                                                <button onClick={() => openEdit(f)} style={actionBtnStyle}>✏️</button>
                                                <button onClick={() => setDeleteId(f.finding_id)} style={{ ...actionBtnStyle, borderColor: "#FFCDD2", backgroundColor: "#FFF5F5", color: "#C62828" }}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                    {/* Expanded Detail Row */}
                                    {expandedFinding === f.finding_id && (
                                        <tr key={`${f.finding_id}-detail`} style={{ borderBottom: "1px solid #f0f0f0" }}>
                                            <td colSpan={7} style={{ padding: "0 12px 16px", backgroundColor: "#fafafa" }}>
                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", padding: "12px" }}>
                                                    <div>
                                                        <div style={detailLabelStyle}>Descripción</div>
                                                        <div style={detailValueStyle}>{f.description}</div>
                                                    </div>
                                                    <div>
                                                        <div style={detailLabelStyle}>Recomendación</div>
                                                        <div style={detailValueStyle}>{f.recommendation}</div>
                                                    </div>
                                                    <div>
                                                        <div style={detailLabelStyle}>Referencia del Estándar</div>
                                                        <div style={{ ...detailValueStyle, fontFamily: "monospace" }}>{f.standard_reference}</div>
                                                    </div>
                                                    <div>
                                                        <div style={detailLabelStyle}>Evidencia (snapshot)</div>
                                                        <div style={detailValueStyle}>
                                                            {Object.keys(f.evidence_snapshot).length > 0 ? (
                                                                Object.entries(f.evidence_snapshot).map(([k, v]) => (
                                                                    <div key={k} style={{ fontSize: "12px", color: "#555", marginBottom: "2px" }}>
                                                                        <span style={{ fontFamily: "monospace", fontWeight: "600" }}>{k}:</span> {String(v)}
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <span style={{ fontSize: "12px", color: "#999" }}>Sin evidencia</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteId && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "32px", maxWidth: "400px", width: "90%", textAlign: "center" }}>
                        <div style={{ fontSize: "36px", marginBottom: "12px" }}>⚠️</div>
                        <h3 style={{ margin: "0 0 8px 0", color: "#1a1a1a" }}>¿Eliminar Hallazgo?</h3>
                        <p style={{ color: "#666", fontSize: "14px", margin: "0 0 24px 0" }}>Esta acción no se puede deshacer.</p>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                            <button onClick={() => setDeleteId(null)} style={{ padding: "10px 24px", border: "1px solid #e0e0e0", borderRadius: "8px", backgroundColor: "white", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}>Cancelar</button>
                            <button onClick={() => handleDelete(deleteId)} style={{ padding: "10px 24px", border: "none", borderRadius: "8px", backgroundColor: "#EF5350", color: "white", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}>Eliminar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "32px", maxWidth: "600px", width: "90%", maxHeight: "85vh", overflowY: "auto" }}>
                        <h3 style={{ margin: "0 0 20px 0", color: "#1a1a1a", fontSize: "20px" }}>
                            {editingId ? "Editar Hallazgo" : "Crear Hallazgo Manual"}
                        </h3>

                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label style={labelStyle}>Práctica</label>
                                <select value={form.practice} onChange={e => setForm({ ...form, practice: e.target.value })} style={inputStyle} disabled={!!editingId}>
                                    <option value="">Seleccionar...</option>
                                    <option value="SCM">SCM — Gestión de Configuración</option>
                                    <option value="QA">QA — Aseguramiento de Calidad</option>
                                    <option value="PM">PM — Gestión de Proyecto</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Repositorio</label>
                                <input type="text" value={form.repository} onChange={e => setForm({ ...form, repository: e.target.value })} placeholder="ej., owner/repo-name" style={inputStyle} disabled={!!editingId} />
                            </div>
                            <div>
                                <label style={labelStyle}>Título</label>
                                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Título del hallazgo" style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Descripción</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripción detallada del hallazgo" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                            </div>
                            <div>
                                <label style={labelStyle}>Severidad</label>
                                <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value as any })} style={inputStyle}>
                                    <option value="HIGH">Alta</option>
                                    <option value="MEDIUM">Media</option>
                                    <option value="LOW">Baja</option>
                                </select>
                            </div>
                            {editingId && (
                                <div>
                                    <label style={labelStyle}>Estado</label>
                                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })} style={inputStyle}>
                                        <option value="draft">Borrador</option>
                                        <option value="approved">Aprobado</option>
                                    </select>
                                </div>
                            )}
                            <div>
                                <label style={labelStyle}>Recomendación</label>
                                <textarea value={form.recommendation} onChange={e => setForm({ ...form, recommendation: e.target.value })} placeholder="Acciones recomendadas" rows={2} style={{ ...inputStyle, resize: "vertical" }} />
                            </div>
                            {!editingId && (
                                <div>
                                    <label style={labelStyle}>Referencia de Evidencia (opcional)</label>
                                    <input type="text" value={form.evidence_reference} onChange={e => setForm({ ...form, evidence_reference: e.target.value })} placeholder="ej., fuente de métrica o referencia" style={inputStyle} />
                                </div>
                            )}
                        </div>

                        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
                            <button onClick={() => setShowModal(false)} style={{ padding: "10px 24px", border: "1px solid #e0e0e0", borderRadius: "8px", backgroundColor: "white", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}>Cancelar</button>
                            <button onClick={handleSave} style={{ padding: "10px 24px", border: "none", borderRadius: "8px", backgroundColor: "#2196F3", color: "white", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}>{editingId ? "Guardar Cambios" : "Crear Hallazgo"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Navigation */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px", paddingTop: "24px", borderTop: "1px solid #e0e0e0" }}>
                <button onClick={() => navigate(`/audit/${auditId}/analysis`)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#666", fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                    ← Volver al Análisis
                </button>
                <button onClick={() => navigate(`/audit/${auditId}/report`)}
                    disabled={!viewData || viewData.total_findings === 0}
                    style={{
                        backgroundColor: (viewData && viewData.total_findings > 0) ? "#2196F3" : "#ccc",
                        color: "white", border: "none", padding: "12px 24px", borderRadius: "8px",
                        cursor: (viewData && viewData.total_findings > 0) ? "pointer" : "not-allowed",
                        fontWeight: "600", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px",
                    }}>
                    Continuar al Informe →
                </button>
            </div>
        </div>
    );
}

// ─── Shared styles ──────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "13px", fontWeight: "600", color: "#555", marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: "8px",
    fontSize: "14px", color: "#333", outline: "none", boxSizing: "border-box",
};

const filterSelectStyle: React.CSSProperties = {
    padding: "8px 12px", border: "1px solid #e0e0e0", borderRadius: "8px",
    fontSize: "13px", color: "#555", backgroundColor: "white", cursor: "pointer", outline: "none",
};

const actionBtnStyle: React.CSSProperties = {
    padding: "6px 10px", border: "1px solid #e0e0e0", borderRadius: "6px",
    backgroundColor: "white", cursor: "pointer", fontSize: "12px",
};

const detailLabelStyle: React.CSSProperties = {
    fontSize: "11px", fontWeight: "700", color: "#999", textTransform: "uppercase", marginBottom: "4px",
};

const detailValueStyle: React.CSSProperties = {
    fontSize: "13px", color: "#555", lineHeight: "1.5",
};
