import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client from "../../app/api";

interface AuditReport {
    id: string;
    audit_id: string;
    generated_at: string;
    final_maturity_level: number;
    status: "draft" | "finalized";
    version: number;
}

interface AuditInfo {
    id: string;
    name: string;
    organization: string;
    reviewPeriod: string;
    complianceStandard: string;
    status: string;
}

interface Repository {
    repo_name: string;
    repo_full_name: string;
}

interface Practice {
    practice_code: string;
    practice_name: string;
    score: number;
    max_score: number;
    maturity_level: number;
}

interface MaturitySummary {
    global_level: number;
    global_label: string;
    practices: Practice[];
}

interface FindingsSummaryData {
    total: number;
    high: number;
    medium: number;
    low: number;
}

interface Finding {
    id: string;
    practice_code: string;
    title: string;
    description: string;
    severity: "low" | "medium" | "high";
    recommendation: string;
    source: "automatic" | "manual";
    status: "draft" | "approved";
}

interface ReportData {
    report: AuditReport;
    audit_info: AuditInfo;
    repositories: Repository[];
    maturity_summary: MaturitySummary;
    findings_summary: FindingsSummaryData;
    findings: Finding[];
    generated_at: string;
}

export function ReportStep() {
    const navigate = useNavigate();
    const { id: auditId } = useParams();

    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [finalizing, setFinalizing] = useState(false);
    const [showFinalizeModal, setShowFinalizeModal] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isFinalized = data?.report.status === "finalized";

    useEffect(() => {
        if (auditId) {
            client.get(`/audits/${auditId}/report`)
                .then(res => setData(res.data))
                .catch(() => { /* no report yet */ })
                .finally(() => setLoading(false));
        }
    }, [auditId]);

    const handleGenerate = async () => {
        setGenerating(true);
        setError(null);
        try {
            const res = await client.post(`/audits/${auditId}/report/generate`);
            setData(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to generate report.");
        } finally {
            setGenerating(false);
        }
    };

    const handleFinalize = async () => {
        setFinalizing(true);
        setError(null);
        try {
            const res = await client.post(`/audits/${auditId}/report/finalize`);
            setData(res.data);
            setShowFinalizeModal(false);
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to finalize audit.");
            setShowFinalizeModal(false);
        } finally {
            setFinalizing(false);
        }
    };

    const maturityColor = (level: number) => {
        switch (level) {
            case 1: return "#EF5350";
            case 2: return "#FFA726";
            case 3: return "#66BB6A";
            default: return "#999";
        }
    };

    const severityBadge = (severity: string) => {
        const c: Record<string, { bg: string; text: string }> = {
            high: { bg: "#FFEBEE", text: "#C62828" },
            medium: { bg: "#FFF3E0", text: "#E65100" },
            low: { bg: "#E8F5E9", text: "#2E7D32" },
        };
        const s = c[severity] || c.low;
        return (
            <span style={{ padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "600", backgroundColor: s.bg, color: s.text, textTransform: "uppercase" }}>
                {severity}
            </span>
        );
    };

    if (loading) {
        return <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>Loading report...</div>;
    }

    return (
        <div style={{ width: "100%", maxWidth: "1100px", margin: "0 auto" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "8px" }}>
                <div>
                    <div style={{ fontSize: "12px", fontWeight: "bold", color: "#2196F3", textTransform: "uppercase", marginBottom: "4px" }}>
                        Step 5 of 5 • Report
                    </div>
                    <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "#1a1a1a", margin: 0 }}>
                        Audit Report
                    </h2>
                </div>
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "14px", fontWeight: "bold", color: "#1a1a1a", marginBottom: "4px" }}>
                        {isFinalized ? "100%" : "83%"} Completed
                    </div>
                    <div style={{ width: "200px", height: "6px", backgroundColor: "#e0e0e0", borderRadius: "3px" }}>
                        <div style={{ width: isFinalized ? "100%" : "83%", height: "100%", backgroundColor: isFinalized ? "#66BB6A" : "#2196F3", borderRadius: "3px" }} />
                    </div>
                </div>
            </div>

            <div style={{ height: "1px", backgroundColor: "#e0e0e0", margin: "24px 0" }} />

            {/* Finalized Banner */}
            {isFinalized && (
                <div style={{
                    backgroundColor: "#E8F5E9", border: "1px solid #A5D6A7", borderRadius: "12px",
                    padding: "16px 24px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px",
                }}>
                    <span style={{ fontSize: "24px" }}>🔒</span>
                    <div>
                        <div style={{ fontWeight: "bold", color: "#2E7D32", fontSize: "15px" }}>Audit Finalized</div>
                        <div style={{ fontSize: "13px", color: "#388E3C" }}>
                            This audit was finalized on {new Date(data!.report.generated_at).toLocaleString()}. No further modifications are allowed.
                        </div>
                    </div>
                </div>
            )}

            {/* Generate / empty state */}
            {!data && (
                <div style={{
                    backgroundColor: "white", borderRadius: "12px", border: "1px solid #e0e0e0",
                    padding: "60px", textAlign: "center", marginBottom: "24px",
                }}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>📄</div>
                    <h3 style={{ margin: "0 0 8px 0", color: "#333", fontSize: "20px" }}>Generate Audit Report</h3>
                    <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "#666", maxWidth: "500px", marginLeft: "auto", marginRight: "auto" }}>
                        Consolidate your audit analysis and approved findings into a formal report.
                    </p>
                    <button onClick={handleGenerate} disabled={generating} style={{
                        backgroundColor: generating ? "#90CAF9" : "#2196F3", color: "white", border: "none",
                        padding: "14px 32px", borderRadius: "8px", cursor: generating ? "not-allowed" : "pointer",
                        fontWeight: "600", fontSize: "16px",
                    }}>
                        {generating ? "⏳ Generating..." : "📄 Generate Report"}
                    </button>
                    {error && <p style={{ marginTop: "16px", color: "#C62828", fontSize: "14px" }}>{error}</p>}
                </div>
            )}

            {/* Report Preview */}
            {data && (
                <>
                    {/* Action bar */}
                    {!isFinalized && (
                        <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
                            <button onClick={handleGenerate} disabled={generating} style={{
                                padding: "10px 20px", border: "1px solid #e0e0e0", borderRadius: "8px",
                                backgroundColor: "white", cursor: "pointer", fontWeight: "600", fontSize: "14px", color: "#333",
                            }}>
                                {generating ? "Refreshing..." : "🔄 Refresh Report"}
                            </button>
                            <button onClick={() => setShowFinalizeModal(true)} style={{
                                padding: "10px 20px", border: "none", borderRadius: "8px",
                                backgroundColor: "#66BB6A", color: "white", cursor: "pointer", fontWeight: "600", fontSize: "14px",
                            }}>
                                🔒 Finalize Audit
                            </button>
                        </div>
                    )}

                    {error && <div style={{ color: "#C62828", marginBottom: "16px", fontSize: "14px" }}>{error}</div>}

                    {/* ─── Section 1: Audit Info ─── */}
                    <Section title="📋 Audit Information">
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            {[
                                { label: "Audit Name", value: data.audit_info.name },
                                { label: "Organization", value: data.audit_info.organization },
                                { label: "Review Period", value: data.audit_info.reviewPeriod },
                                { label: "Compliance Standard", value: data.audit_info.complianceStandard },
                                { label: "Status", value: data.audit_info.status },
                                { label: "Report Version", value: `v${data.report.version}` },
                            ].map(item => (
                                <div key={item.label}>
                                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#999", textTransform: "uppercase", marginBottom: "4px" }}>{item.label}</div>
                                    <div style={{ fontSize: "15px", fontWeight: "600", color: "#1a1a1a" }}>{item.value}</div>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* ─── Section 2: Scope ─── */}
                    <Section title="🔍 Scope — Repositories Evaluated">
                        {data.repositories.length === 0 ? (
                            <p style={{ color: "#666", margin: 0 }}>No repositories recorded.</p>
                        ) : (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                {data.repositories.map(r => (
                                    <span key={r.repo_full_name} style={{
                                        padding: "8px 16px", backgroundColor: "#F5F5F5", borderRadius: "8px",
                                        fontSize: "14px", fontWeight: "500", color: "#333", border: "1px solid #e0e0e0",
                                    }}>
                                        {r.repo_full_name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </Section>

                    {/* ─── Section 3: Executive Summary ─── */}
                    <Section title="📊 Executive Summary">
                        <div style={{ display: "flex", gap: "24px", alignItems: "center", marginBottom: "20px" }}>
                            <div style={{
                                width: "80px", height: "80px", borderRadius: "50%",
                                backgroundColor: maturityColor(data.maturity_summary.global_level) + "22",
                                border: `3px solid ${maturityColor(data.maturity_summary.global_level)}`,
                                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                            }}>
                                <span style={{ fontSize: "28px", fontWeight: "bold", color: maturityColor(data.maturity_summary.global_level) }}>
                                    {data.maturity_summary.global_level}
                                </span>
                            </div>
                            <div>
                                <div style={{ fontSize: "22px", fontWeight: "bold", color: "#1a1a1a" }}>
                                    Level {data.maturity_summary.global_level} — {data.maturity_summary.global_label}
                                </div>
                                <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>
                                    Global Maturity Level
                                </div>
                            </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                            {[
                                { label: "Total Findings", v: data.findings_summary.total, color: "#2196F3" },
                                { label: "High", v: data.findings_summary.high, color: "#C62828" },
                                { label: "Medium", v: data.findings_summary.medium, color: "#E65100" },
                                { label: "Low", v: data.findings_summary.low, color: "#2E7D32" },
                            ].map(c => (
                                <div key={c.label} style={{ textAlign: "center", padding: "16px", backgroundColor: "#fafafa", borderRadius: "8px" }}>
                                    <div style={{ fontSize: "24px", fontWeight: "bold", color: c.color }}>{c.v}</div>
                                    <div style={{ fontSize: "12px", fontWeight: "600", color: "#999", textTransform: "uppercase", marginTop: "4px" }}>{c.label}</div>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* ─── Section 4: Practices ─── */}
                    <Section title="📐 Results by Practice">
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
                            {data.maturity_summary.practices.map(p => (
                                <div key={p.practice_code} style={{
                                    padding: "20px", backgroundColor: "#fafafa", borderRadius: "10px",
                                    borderLeft: `4px solid ${maturityColor(p.maturity_level)}`,
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                        <div>
                                            <div style={{ fontSize: "11px", fontWeight: "700", color: "#999", textTransform: "uppercase" }}>{p.practice_code}</div>
                                            <div style={{ fontSize: "15px", fontWeight: "bold", color: "#1a1a1a" }}>{p.practice_name}</div>
                                        </div>
                                        <div style={{
                                            padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "700",
                                            backgroundColor: maturityColor(p.maturity_level) + "22", color: maturityColor(p.maturity_level),
                                        }}>
                                            Level {p.maturity_level}
                                        </div>
                                    </div>
                                    <div style={{ height: "6px", backgroundColor: "#e0e0e0", borderRadius: "3px", overflow: "hidden" }}>
                                        <div style={{
                                            height: "100%", width: `${(p.score / p.max_score) * 100}%`,
                                            backgroundColor: maturityColor(p.maturity_level), borderRadius: "3px",
                                        }} />
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#999", marginTop: "6px", textAlign: "right" }}>
                                        {p.score} / {p.max_score}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* ─── Section 5: Findings ─── */}
                    <Section title={`📋 Approved Findings (${data.findings.length})`}>
                        {data.findings.length === 0 ? (
                            <p style={{ color: "#666", margin: 0 }}>No approved findings.</p>
                        ) : (
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
                                        {["Title", "Practice", "Severity", "Recommendation"].map(h => (
                                            <th key={h} style={{
                                                textAlign: "left", padding: "12px 16px", fontSize: "12px",
                                                fontWeight: "700", color: "#999", textTransform: "uppercase",
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.findings.map(f => (
                                        <tr key={f.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                                            <td style={{ padding: "14px 16px", fontSize: "14px", fontWeight: "600", color: "#1a1a1a", maxWidth: "220px" }}>{f.title}</td>
                                            <td style={{ padding: "14px 16px", fontSize: "14px", fontWeight: "600", color: "#333" }}>{f.practice_code}</td>
                                            <td style={{ padding: "14px 16px" }}>{severityBadge(f.severity)}</td>
                                            <td style={{ padding: "14px 16px", fontSize: "13px", color: "#555", maxWidth: "300px" }}>{f.recommendation}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </Section>

                    {/* ─── Section 6: Conclusion ─── */}
                    <Section title="🏁 Conclusion">
                        <p style={{ fontSize: "14px", lineHeight: "1.7", color: "#444", margin: 0 }}>
                            {data.maturity_summary.global_level >= 3
                                ? `The organization "${data.audit_info.organization}" demonstrates a defined level of maturity across the evaluated software development practices. The audit identified ${data.findings_summary.total} findings, which should be addressed to maintain and improve the current level. It is recommended to continue periodic evaluations to ensure continuous improvement.`
                                : data.maturity_summary.global_level === 2
                                    ? `The organization "${data.audit_info.organization}" demonstrates a managed level of maturity. The audit identified ${data.findings_summary.total} findings (${data.findings_summary.high} high severity). It is strongly recommended to implement the corrective actions described in each finding to elevate the maturity level and reduce operational risks.`
                                    : `The organization "${data.audit_info.organization}" is at an initial level of maturity. The audit identified ${data.findings_summary.total} findings (${data.findings_summary.high} high severity). Immediate attention is required to establish formal processes and controls. Prioritizing the high-severity findings is critical to mitigate risks.`
                            }
                        </p>
                    </Section>
                </>
            )}

            {/* Finalize Confirmation Modal */}
            {showFinalizeModal && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
                }}>
                    <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "32px", maxWidth: "450px", width: "90%", textAlign: "center" }}>
                        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔒</div>
                        <h3 style={{ margin: "0 0 8px 0", color: "#1a1a1a", fontSize: "20px" }}>Finalize Audit?</h3>
                        <p style={{ color: "#666", fontSize: "14px", margin: "0 0 8px 0" }}>
                            This will permanently lock the audit and its report.
                        </p>
                        <p style={{ color: "#C62828", fontSize: "13px", fontWeight: "600", margin: "0 0 24px 0" }}>
                            ⚠️ This action cannot be undone.
                        </p>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                            <button onClick={() => setShowFinalizeModal(false)} style={{
                                padding: "10px 24px", border: "1px solid #e0e0e0", borderRadius: "8px",
                                backgroundColor: "white", cursor: "pointer", fontWeight: "600", fontSize: "14px",
                            }}>Cancel</button>
                            <button onClick={handleFinalize} disabled={finalizing} style={{
                                padding: "10px 24px", border: "none", borderRadius: "8px",
                                backgroundColor: finalizing ? "#A5D6A7" : "#66BB6A", color: "white", cursor: finalizing ? "not-allowed" : "pointer",
                                fontWeight: "600", fontSize: "14px",
                            }}>{finalizing ? "Finalizing..." : "Finalize"}</button>
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
                    onClick={() => navigate(`/audit/${auditId}/findings`)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#666", fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}
                >
                    ← Back to Findings
                </button>
                <button
                    onClick={() => navigate("/")}
                    style={{
                        backgroundColor: "#2196F3", color: "white", border: "none",
                        padding: "12px 24px", borderRadius: "8px", cursor: "pointer",
                        fontWeight: "600", fontSize: "14px",
                    }}
                >
                    Return to Audits
                </button>
            </div>
        </div>
    );
}

// ─── Reusable section wrapper ───────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{
            backgroundColor: "white", borderRadius: "12px", border: "1px solid #e0e0e0",
            overflow: "hidden", marginBottom: "20px",
        }}>
            <div style={{
                padding: "16px 24px", borderBottom: "1px solid #e0e0e0", backgroundColor: "#fafafa",
            }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#1a1a1a" }}>{title}</h3>
            </div>
            <div style={{ padding: "24px" }}>{children}</div>
        </div>
    );
}
