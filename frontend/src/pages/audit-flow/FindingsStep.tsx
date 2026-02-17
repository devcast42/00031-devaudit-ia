import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client from "../../app/api";

interface Finding {
    id: string;
    audit_id: string;
    practice_code: string;
    title: string;
    description: string;
    severity: "low" | "medium" | "high";
    recommendation: string;
    evidence_reference?: string;
    source: "automatic" | "manual";
    status: "draft" | "approved";
    created_at: string;
    updated_at: string;
}

interface FindingsSummary {
    total_findings: number;
    high: number;
    medium: number;
    low: number;
    findings: Finding[];
}

const emptyForm = {
    practice_code: "",
    title: "",
    description: "",
    severity: "medium" as "low" | "medium" | "high",
    recommendation: "",
    evidence_reference: "",
    status: "draft" as "draft" | "approved",
};

export function FindingsStep() {
    const navigate = useNavigate();
    const { id: auditId } = useParams();

    const [summary, setSummary] = useState<FindingsSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);

    // Delete confirmation
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const fetchFindings = async () => {
        try {
            const res = await client.get(`/audits/${auditId}/findings`);
            setSummary(res.data);
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
            setSummary(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to generate findings.");
        } finally {
            setGenerating(false);
        }
    };

    const openCreate = () => {
        setEditingId(null);
        setForm(emptyForm);
        setShowModal(true);
    };

    const openEdit = (f: Finding) => {
        setEditingId(f.id);
        setForm({
            practice_code: f.practice_code,
            title: f.title,
            description: f.description,
            severity: f.severity,
            recommendation: f.recommendation,
            evidence_reference: f.evidence_reference || "",
            status: f.status,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            if (editingId) {
                await client.patch(`/audits/${auditId}/findings/${editingId}`, form);
            } else {
                await client.post(`/audits/${auditId}/findings`, form);
            }
            setShowModal(false);
            fetchFindings();
        } catch (err: any) {
            alert(err.response?.data?.error || "Failed to save finding.");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await client.delete(`/audits/${auditId}/findings/${id}`);
            setDeleteId(null);
            fetchFindings();
        } catch {
            alert("Failed to delete finding.");
        }
    };

    const handleApprove = async (f: Finding) => {
        const newStatus = f.status === "draft" ? "approved" : "draft";
        await client.patch(`/audits/${auditId}/findings/${f.id}`, { status: newStatus });
        fetchFindings();
    };

    const severityBadge = (severity: string) => {
        const colors: Record<string, { bg: string; text: string }> = {
            high: { bg: "#FFEBEE", text: "#C62828" },
            medium: { bg: "#FFF3E0", text: "#E65100" },
            low: { bg: "#E8F5E9", text: "#2E7D32" },
        };
        const c = colors[severity] || colors.low;
        return (
            <span style={{ padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "600", backgroundColor: c.bg, color: c.text, textTransform: "uppercase" }}>
                {severity}
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
                {status}
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
        return <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>Loading findings...</div>;
    }

    return (
        <div style={{ width: "100%", maxWidth: "1100px", margin: "0 auto" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "8px" }}>
                <div>
                    <div style={{ fontSize: "12px", fontWeight: "bold", color: "#2196F3", textTransform: "uppercase", marginBottom: "4px" }}>
                        Step 4 of 5 • Findings
                    </div>
                    <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "#1a1a1a", margin: 0 }}>
                        Audit Findings
                    </h2>
                </div>
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "14px", fontWeight: "bold", color: "#1a1a1a", marginBottom: "4px" }}>67% Completed</div>
                    <div style={{ width: "200px", height: "6px", backgroundColor: "#e0e0e0", borderRadius: "3px" }}>
                        <div style={{ width: "67%", height: "100%", backgroundColor: "#2196F3", borderRadius: "3px" }} />
                    </div>
                </div>
            </div>

            <div style={{ height: "1px", backgroundColor: "#e0e0e0", margin: "24px 0" }} />

            {/* Summary Cards */}
            {summary && summary.total_findings > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
                    {[
                        { label: "Total", value: summary.total_findings, color: "#2196F3", bg: "#E3F2FD" },
                        { label: "High", value: summary.high, color: "#C62828", bg: "#FFEBEE" },
                        { label: "Medium", value: summary.medium, color: "#E65100", bg: "#FFF3E0" },
                        { label: "Low", value: summary.low, color: "#2E7D32", bg: "#E8F5E9" },
                    ].map(card => (
                        <div key={card.label} style={{
                            backgroundColor: "white", borderRadius: "12px", border: "1px solid #e0e0e0",
                            padding: "20px", textAlign: "center",
                        }}>
                            <div style={{ fontSize: "28px", fontWeight: "bold", color: card.color }}>{card.value}</div>
                            <div style={{ fontSize: "12px", fontWeight: "700", color: "#999", textTransform: "uppercase", marginTop: "4px" }}>{card.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    style={{
                        backgroundColor: generating ? "#90CAF9" : "#2196F3", color: "white", border: "none",
                        padding: "10px 20px", borderRadius: "8px", cursor: generating ? "not-allowed" : "pointer",
                        fontWeight: "600", fontSize: "14px",
                    }}
                >
                    {generating ? "⏳ Generating..." : "⚡ Generate from Analysis"}
                </button>
                <button
                    onClick={openCreate}
                    style={{
                        backgroundColor: "white", color: "#2196F3", border: "1px solid #2196F3",
                        padding: "10px 20px", borderRadius: "8px", cursor: "pointer",
                        fontWeight: "600", fontSize: "14px",
                    }}
                >
                    ➕ Add Manual Finding
                </button>
            </div>

            {error && <div style={{ color: "#C62828", marginBottom: "16px", fontSize: "14px" }}>{error}</div>}

            {/* Findings Table */}
            {(!summary || summary.total_findings === 0) ? (
                <div style={{
                    backgroundColor: "white", borderRadius: "12px", border: "1px solid #e0e0e0",
                    padding: "60px", textAlign: "center", marginBottom: "24px",
                }}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
                    <h3 style={{ margin: "0 0 8px 0", color: "#333", fontSize: "20px" }}>No Findings Yet</h3>
                    <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
                        Click "Generate from Analysis" to auto-create findings, or add them manually.
                    </p>
                </div>
            ) : (
                <div style={{
                    backgroundColor: "white", borderRadius: "12px", border: "1px solid #e0e0e0",
                    overflow: "hidden", marginBottom: "24px",
                }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "2px solid #e0e0e0", backgroundColor: "#fafafa" }}>
                                {["Title", "Practice", "Severity", "Status", "Source", "Actions"].map(h => (
                                    <th key={h} style={{
                                        textAlign: "left", padding: "14px 16px", fontSize: "12px",
                                        fontWeight: "700", color: "#999", textTransform: "uppercase",
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {summary!.findings.map(f => (
                                <tr key={f.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                                    <td style={{ padding: "16px", maxWidth: "260px" }}>
                                        <div style={{ fontSize: "14px", fontWeight: "600", color: "#1a1a1a", marginBottom: "4px" }}>{f.title}</div>
                                        <div style={{ fontSize: "12px", color: "#888", lineHeight: "1.4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "260px" }}>
                                            {f.description}
                                        </div>
                                    </td>
                                    <td style={{ padding: "16px", fontSize: "14px", fontWeight: "600", color: "#333" }}>{f.practice_code}</td>
                                    <td style={{ padding: "16px" }}>{severityBadge(f.severity)}</td>
                                    <td style={{ padding: "16px" }}>
                                        <span onClick={() => handleApprove(f)} style={{ cursor: "pointer" }}>
                                            {statusBadge(f.status)}
                                        </span>
                                    </td>
                                    <td style={{ padding: "16px" }}>{sourceBadge(f.source)}</td>
                                    <td style={{ padding: "16px" }}>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <button onClick={() => openEdit(f)} style={{
                                                padding: "6px 12px", border: "1px solid #e0e0e0", borderRadius: "6px",
                                                backgroundColor: "white", cursor: "pointer", fontSize: "12px", fontWeight: "500", color: "#333",
                                            }}>✏️ Edit</button>
                                            <button onClick={() => setDeleteId(f.id)} style={{
                                                padding: "6px 12px", border: "1px solid #FFCDD2", borderRadius: "6px",
                                                backgroundColor: "#FFF5F5", cursor: "pointer", fontSize: "12px", fontWeight: "500", color: "#C62828",
                                            }}>🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteId && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
                }}>
                    <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "32px", maxWidth: "400px", width: "90%", textAlign: "center" }}>
                        <div style={{ fontSize: "36px", marginBottom: "12px" }}>⚠️</div>
                        <h3 style={{ margin: "0 0 8px 0", color: "#1a1a1a" }}>Delete Finding?</h3>
                        <p style={{ color: "#666", fontSize: "14px", margin: "0 0 24px 0" }}>This action cannot be undone.</p>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                            <button onClick={() => setDeleteId(null)} style={{
                                padding: "10px 24px", border: "1px solid #e0e0e0", borderRadius: "8px",
                                backgroundColor: "white", cursor: "pointer", fontWeight: "600", fontSize: "14px",
                            }}>Cancel</button>
                            <button onClick={() => handleDelete(deleteId)} style={{
                                padding: "10px 24px", border: "none", borderRadius: "8px",
                                backgroundColor: "#EF5350", color: "white", cursor: "pointer", fontWeight: "600", fontSize: "14px",
                            }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
                }}>
                    <div style={{
                        backgroundColor: "white", borderRadius: "12px", padding: "32px",
                        maxWidth: "600px", width: "90%", maxHeight: "85vh", overflowY: "auto",
                    }}>
                        <h3 style={{ margin: "0 0 20px 0", color: "#1a1a1a", fontSize: "20px" }}>
                            {editingId ? "Edit Finding" : "Create Manual Finding"}
                        </h3>

                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {/* Practice Code */}
                            <div>
                                <label style={labelStyle}>Practice Code</label>
                                <input
                                    type="text"
                                    value={form.practice_code}
                                    onChange={e => setForm({ ...form, practice_code: e.target.value })}
                                    placeholder="e.g., SCM, QA, PM"
                                    style={inputStyle}
                                    disabled={!!editingId}
                                />
                            </div>

                            {/* Title */}
                            <div>
                                <label style={labelStyle}>Title</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    placeholder="Finding title"
                                    style={inputStyle}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label style={labelStyle}>Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    placeholder="Detailed description of the finding"
                                    rows={3}
                                    style={{ ...inputStyle, resize: "vertical" }}
                                />
                            </div>

                            {/* Severity */}
                            <div>
                                <label style={labelStyle}>Severity</label>
                                <select
                                    value={form.severity}
                                    onChange={e => setForm({ ...form, severity: e.target.value as any })}
                                    style={inputStyle}
                                >
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>

                            {/* Status (only on edit) */}
                            {editingId && (
                                <div>
                                    <label style={labelStyle}>Status</label>
                                    <select
                                        value={form.status}
                                        onChange={e => setForm({ ...form, status: e.target.value as any })}
                                        style={inputStyle}
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="approved">Approved</option>
                                    </select>
                                </div>
                            )}

                            {/* Recommendation */}
                            <div>
                                <label style={labelStyle}>Recommendation</label>
                                <textarea
                                    value={form.recommendation}
                                    onChange={e => setForm({ ...form, recommendation: e.target.value })}
                                    placeholder="Recommended actions"
                                    rows={2}
                                    style={{ ...inputStyle, resize: "vertical" }}
                                />
                            </div>

                            {/* Evidence Reference */}
                            <div>
                                <label style={labelStyle}>Evidence Reference (optional)</label>
                                <input
                                    type="text"
                                    value={form.evidence_reference}
                                    onChange={e => setForm({ ...form, evidence_reference: e.target.value })}
                                    placeholder="e.g., metric source or reference"
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
                            <button onClick={() => setShowModal(false)} style={{
                                padding: "10px 24px", border: "1px solid #e0e0e0", borderRadius: "8px",
                                backgroundColor: "white", cursor: "pointer", fontWeight: "600", fontSize: "14px",
                            }}>Cancel</button>
                            <button onClick={handleSave} style={{
                                padding: "10px 24px", border: "none", borderRadius: "8px",
                                backgroundColor: "#2196F3", color: "white", cursor: "pointer", fontWeight: "600", fontSize: "14px",
                            }}>{editingId ? "Save Changes" : "Create Finding"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Navigation */}
            <div style={{
                display: "flex", justifyContent: "space-between", marginTop: "40px",
                paddingTop: "24px", borderTop: "1px solid #e0e0e0",
            }}>
                <button
                    onClick={() => navigate(`/audit/${auditId}/analysis`)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#666", fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}
                >
                    ← Back to Analysis
                </button>
                <button
                    onClick={() => navigate(`/audit/${auditId}/report`)}
                    disabled={!summary || summary.total_findings === 0}
                    style={{
                        backgroundColor: (summary && summary.total_findings > 0) ? "#2196F3" : "#ccc",
                        color: "white", border: "none", padding: "12px 24px", borderRadius: "8px",
                        cursor: (summary && summary.total_findings > 0) ? "pointer" : "not-allowed",
                        fontWeight: "600", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px",
                    }}
                >
                    Continue to Report →
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
