import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client from "../../app/api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
// @ts-ignore
import { asBlob } from "html-docx-js-typescript";
import { saveAs } from "file-saver";

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

    const reportRef = useRef<HTMLDivElement>(null);
    // actually useRef is better but let's stick to standard hooks if possible, wait, useRef is standard.
    // Let's use useRef properly.


    const isFinalized = data?.report.status === "finalized";

    // View settings
    const [showDetailedCharts, setShowDetailedCharts] = useState(true);
    const [showRecommendations, setShowRecommendations] = useState(true);
    const [showWatermark, setShowWatermark] = useState(false);

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

    const handleExportPDF = async () => {
        if (!reportRef.current) return;

        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff"
            });

            const imgData = canvas.toDataURL("image/png");

            // A4 dimensions in mm
            const pdfWidth = 210;
            const pdfHeight = 297;
            const imgWidth = pdfWidth;
            const imgHeight = (canvas.height * pdfWidth) / canvas.width;

            const pdf = new jsPDF("p", "mm", "a4");
            let heightLeft = imgHeight;
            let position = 0;

            // First page
            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;

            // Subsequent pages if content overflows
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight;
            }

            pdf.save(`Audit_Report_${auditId}.pdf`);
        } catch (err) {
            console.error("PDF Export failed", err);
            setError("Failed to export PDF.");
        }
    };

    const handleExportWord = () => {
        if (!data) return;

        // Simple HTML construction for Word
        // We could capture reportRef.current.innerHTML but styling is tricky. 
        // A constructed string is more reliable for basic requirements.

        const htmlString = `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Reporte de Auditoría - ${data.audit_info.name}</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        h1 { color: #2196F3; font-size: 24px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
                        h2 { color: #1a1a1a; font-size: 18px; margin-top: 20px; background-color: #f5f5f5; padding: 10px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background-color: #f5f5f5; text-align: left; padding: 8px; border-bottom: 2px solid #ddd; }
                        td { padding: 8px; border-bottom: 1px solid #eee; }
                        .badge { padding: 4px 8px; border-radius: 4px; font-weight: bold; color: white; display: inline-block; }
                        .high { background-color: #C62828; }
                        .medium { background-color: #E65100; }
                        .low { background-color: #2E7D32; }
                    </style>
                </head>
                <body>
                    <h1>Reporte de Auditoría: ${data.audit_info.name}</h1>
                    <p><strong>Organización:</strong> ${data.audit_info.organization}</p>
                    <p><strong>Fecha:</strong> ${new Date(data.report.generated_at).toLocaleString()}</p>
                    <p><strong>Nivel de Madurez Global:</strong> ${data.maturity_summary.global_level} - ${data.maturity_summary.global_label}</p>
                    
                    <h2>Alcance - Repositorios</h2>
                    <ul>
                        ${data.repositories.map(r => `<li>${r.repo_full_name}</li>`).join('')}
                    </ul>
                    
                    <h2>Madurez por Práctica</h2>
                    <table>
                        <thead><tr><th>Práctica</th><th>Nivel</th><th>Puntaje</th></tr></thead>
                        <tbody>
                            ${data.maturity_summary.practices.map(p => `
                                <tr>
                                    <td>${p.practice_name}</td>
                                    <td>${p.maturity_level}</td>
                                    <td>${p.score}/${p.max_score}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <h2>Hallazgos</h2>
                    ${data.findings.length === 0 ? '<p>No se registraron hallazgos.</p>' : `
                        <table>
                            <thead><tr><th>Título</th><th>Severidad</th><th>Práctica</th><th>Recomendación</th></tr></thead>
                            <tbody>
                                ${data.findings.map(f => `
                                    <tr>
                                        <td>${f.title}</td>
                                        <td><span class="badge ${f.severity}">${f.severity.toUpperCase()}</span></td>
                                        <td>${f.practice_code}</td>
                                        <td>${f.recommendation || '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `}
                    
                    <h2>Conclusión</h2>
                    <p>${data.maturity_summary.global_level >= 3 ?
                "La organización demuestra un nivel definido de madurez. Se recomienda continuar con la mejora." :
                "Se requiere atención inmediata para establecer procesos y controles formales."}</p>
                </body>
            </html>
        `;

        asBlob(htmlString).then((blob: any) => {
            saveAs(blob as Blob, `Audit_Report_${auditId}.docx`);
        });
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
        <div style={{ width: "100%", maxWidth: "1400px", margin: "0 auto", display: "flex", gap: "32px", alignItems: "flex-start" }}>
            {/* Main Content Column */}
            <div style={{ flex: 1, minWidth: 0 }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "8px" }}>
                    <div>
                        <div style={{ fontSize: "12px", fontWeight: "bold", color: "#2196F3", textTransform: "uppercase", marginBottom: "4px" }}>
                            Paso 5 de 5 • Reporte
                        </div>
                        <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "#1a1a1a", margin: 0 }}>
                            Reporte de Auditoría
                        </h2>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "14px", fontWeight: "bold", color: "#1a1a1a", marginBottom: "4px" }}>
                            {isFinalized ? "100%" : "83%"} Completado
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
                            <div style={{ fontWeight: "bold", color: "#2E7D32", fontSize: "15px" }}>Auditoría Finalizada</div>
                            <div style={{ fontSize: "13px", color: "#388E3C" }}>
                                Esta auditoría fue finalizada el {new Date(data!.report.generated_at).toLocaleString()}. No se permiten más modificaciones.
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
                        <h3 style={{ margin: "0 0 8px 0", color: "#333", fontSize: "20px" }}>Generar Reporte de Auditoría</h3>
                        <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "#666", maxWidth: "500px", marginLeft: "auto", marginRight: "auto" }}>
                            Consolide su análisis de auditoría y hallazgos aprobados en un reporte formal.
                        </p>
                        <button onClick={handleGenerate} disabled={generating} style={{
                            backgroundColor: generating ? "#90CAF9" : "#2196F3", color: "white", border: "none",
                            padding: "14px 32px", borderRadius: "8px", cursor: generating ? "not-allowed" : "pointer",
                            fontWeight: "600", fontSize: "16px",
                        }}>
                            {generating ? "⏳ Generando..." : "📄 Generar Reporte"}
                        </button>
                        {error && <p style={{ marginTop: "16px", color: "#C62828", fontSize: "14px" }}>{error}</p>}
                    </div>
                )}

                {/* Report Preview */}
                {data && (
                    <div style={{ position: "relative" }}>
                        {showWatermark && (
                            <div style={{
                                position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-45deg)",
                                fontSize: "120px", fontWeight: "bold", color: "rgba(0,0,0,0.05)", pointerEvents: "none", zIndex: 10
                            }}>
                                BORRADOR
                            </div>
                        )}
                        <>
                            {/* Action bar */}
                            {!isFinalized && (
                                <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
                                    <button onClick={handleGenerate} disabled={generating} style={{
                                        padding: "10px 20px", border: "1px solid #e0e0e0", borderRadius: "8px",
                                        backgroundColor: "white", cursor: "pointer", fontWeight: "600", fontSize: "14px", color: "#333",
                                    }}>
                                        {generating ? "Actualizando..." : "🔄 Actualizar Reporte"}
                                    </button>
                                    <button onClick={() => setShowFinalizeModal(true)} style={{
                                        padding: "10px 20px", border: "none", borderRadius: "8px",
                                        backgroundColor: "#66BB6A", color: "white", cursor: "pointer", fontWeight: "600", fontSize: "14px",
                                    }}>
                                        🔒 Finalizar Auditoría
                                    </button>
                                </div>
                            )}

                            {error && <div style={{ color: "#C62828", marginBottom: "16px", fontSize: "14px" }}>{error}</div>}

                            {/* ─── Section 1: Audit Info ─── */}
                            <Section title="📋 Información de Auditoría">
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                    {[
                                        { label: "Nombre de Auditoría", value: data.audit_info.name },
                                        { label: "Organización", value: data.audit_info.organization },
                                        { label: "Período de Revisión", value: data.audit_info.reviewPeriod },
                                        { label: "Estándar de Cumplimiento", value: data.audit_info.complianceStandard },
                                        { label: "Estado", value: data.audit_info.status },
                                        { label: "Versión del Reporte", value: `v${data.report.version}` },
                                    ].map(item => (
                                        <div key={item.label}>
                                            <div style={{ fontSize: "12px", fontWeight: "700", color: "#999", textTransform: "uppercase", marginBottom: "4px" }}>{item.label}</div>
                                            <div style={{ fontSize: "15px", fontWeight: "600", color: "#1a1a1a" }}>{item.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </Section>

                            {/* ─── Section 2: Scope ─── */}
                            <Section title="🔍 Alcance — Repositorios Evaluados">
                                {data.repositories.length === 0 ? (
                                    <p style={{ color: "#666", margin: 0 }}>No se registraron repositorios.</p>
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
                            <Section title="📊 Resumen Ejecutivo">
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
                                            Nivel {data.maturity_summary.global_level} — {data.maturity_summary.global_label}
                                        </div>
                                        <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>
                                            Nivel de Madurez Global
                                        </div>
                                    </div>
                                </div>
                                {showDetailedCharts && (
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                                        {[
                                            { label: "Total de Hallazgos", v: data.findings_summary.total, color: "#2196F3" },
                                            { label: "Alta", v: data.findings_summary.high, color: "#C62828" },
                                            { label: "Media", v: data.findings_summary.medium, color: "#E65100" },
                                            { label: "Baja", v: data.findings_summary.low, color: "#2E7D32" },
                                        ].map(c => (
                                            <div key={c.label} style={{ textAlign: "center", padding: "16px", backgroundColor: "#fafafa", borderRadius: "8px" }}>
                                                <div style={{ fontSize: "24px", fontWeight: "bold", color: c.color }}>{c.v}</div>
                                                <div style={{ fontSize: "12px", fontWeight: "600", color: "#999", textTransform: "uppercase", marginTop: "4px" }}>{c.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Section>

                            {/* ─── Section 4: Practices ─── */}
                            <Section title="📐 Resultados por Práctica">
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
                                                    Nivel {p.maturity_level}
                                                </div>
                                            </div>
                                            {showDetailedCharts && (
                                                <>
                                                    <div style={{ height: "6px", backgroundColor: "#e0e0e0", borderRadius: "3px", overflow: "hidden" }}>
                                                        <div style={{
                                                            height: "100%", width: `${(p.score / p.max_score) * 100}%`,
                                                            backgroundColor: maturityColor(p.maturity_level), borderRadius: "3px",
                                                        }} />
                                                    </div>
                                                    <div style={{ fontSize: "12px", color: "#999", marginTop: "6px", textAlign: "right" }}>
                                                        {p.score} / {p.max_score}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </Section>

                            {/* ─── Section 5: Findings ─── */}
                            <Section title={`📋 Hallazgos Aprobados (${data.findings.length})`}>
                                {data.findings.length === 0 ? (
                                    <p style={{ color: "#666", margin: 0 }}>No hay hallazgos aprobados.</p>
                                ) : (
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ borderBottom: "2px solid #e0e0e0" }}>
                                                {["Título", "Práctica", "Severidad", ...(showRecommendations ? ["Recomendación"] : [])].map(h => (
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
                                                    {showRecommendations && (
                                                        <td style={{ padding: "14px 16px", fontSize: "13px", color: "#555", maxWidth: "300px" }}>{f.recommendation}</td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </Section>

                            {/* ─── Section 6: Conclusion ─── */}
                            <Section title="🏁 Conclusión">
                                <p style={{ fontSize: "14px", lineHeight: "1.7", color: "#444", margin: 0 }}>
                                    {data.maturity_summary.global_level >= 3
                                        ? `La organización "${data.audit_info.organization}" demuestra un nivel definido de madurez en las prácticas de desarrollo de software evaluadas. La auditoría identificó ${data.findings_summary.total} hallazgos, los cuales deben ser abordados para mantener y mejorar el nivel actual. Se recomienda continuar con evaluaciones periódicas para asegurar la mejora continua.`
                                        : data.maturity_summary.global_level === 2
                                            ? `La organización "${data.audit_info.organization}" demuestra un nivel gestionado de madurez. La auditoría identificó ${data.findings_summary.total} hallazgos (${data.findings_summary.high} de severidad alta). Se recomienda encarecidamente implementar las acciones correctivas descritas en cada hallazgo para elevar el nivel de madurez y reducir los riesgos operativos.`
                                            : `La organización "${data.audit_info.organization}" está en un nivel inicial de madurez. La auditoría identificó ${data.findings_summary.total} hallazgos (${data.findings_summary.high} de severidad alta). Se requiere atención inmediata para establecer procesos y controles formales. Priorizar los hallazgos de alta severidad es crítico para mitigar riesgos.`
                                    }
                                </p>
                            </Section>
                        </>
                    </div>
                )}

                {/* Finalize Confirmation Modal */}
                {showFinalizeModal && (
                    <div style={{
                        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
                    }}>
                        <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "32px", maxWidth: "450px", width: "90%", textAlign: "center" }}>
                            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔒</div>
                            <h3 style={{ margin: "0 0 8px 0", color: "#1a1a1a", fontSize: "20px" }}>¿Finalizar Auditoría?</h3>
                            <p style={{ color: "#666", fontSize: "14px", margin: "0 0 8px 0" }}>
                                Esto bloqueará permanentemente la auditoría y su reporte.
                            </p>
                            <p style={{ color: "#C62828", fontSize: "13px", fontWeight: "600", margin: "0 0 24px 0" }}>
                                ⚠️ Esta acción no se puede deshacer.
                            </p>
                            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                                <button onClick={() => setShowFinalizeModal(false)} style={{
                                    padding: "10px 24px", border: "1px solid #e0e0e0", borderRadius: "8px",
                                    backgroundColor: "white", cursor: "pointer", fontWeight: "600", fontSize: "14px",
                                }}>Cancelar</button>
                                <button onClick={handleFinalize} disabled={finalizing} style={{
                                    padding: "10px 24px", border: "none", borderRadius: "8px",
                                    backgroundColor: finalizing ? "#A5D6A7" : "#66BB6A", color: "white", cursor: finalizing ? "not-allowed" : "pointer",
                                    fontWeight: "600", fontSize: "14px",
                                }}>{finalizing ? "Finalizando..." : "Finalizar"}</button>
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
                        ← Volver a Hallazgos
                    </button>
                    <button
                        onClick={() => navigate("/")}
                        style={{
                            backgroundColor: "#2196F3", color: "white", border: "none",
                            padding: "12px 24px", borderRadius: "8px", cursor: "pointer",
                            fontWeight: "600", fontSize: "14px",
                        }}
                    >
                        Volver a Auditorías
                    </button>
                </div>
            </div>

            {/* Sidebar Column */}
            <div style={{ width: "300px", flexShrink: 0 }}>
                <ReportActionsSidebar
                    showCharts={showDetailedCharts}
                    setShowCharts={setShowDetailedCharts}
                    showRecommendations={showRecommendations}
                    setShowRecommendations={setShowRecommendations}
                    showWatermark={showWatermark}
                    setShowWatermark={setShowWatermark}
                    onExportPDF={handleExportPDF}
                    onExportWord={handleExportWord}
                />
            </div>
        </div>
    );
}

function ReportActionsSidebar({
    showCharts, setShowCharts,
    showRecommendations, setShowRecommendations,
    showWatermark, setShowWatermark,
    onExportPDF,
    onExportWord
}: {
    showCharts: boolean, setShowCharts: (v: boolean) => void,
    showRecommendations: boolean, setShowRecommendations: (v: boolean) => void,
    showWatermark: boolean, setShowWatermark: (v: boolean) => void,
    onExportPDF: () => void,
    onExportWord: () => void
}) {
    return (
        <div style={{ position: "sticky", top: "24px" }}>
            <div style={{ marginBottom: "24px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#1a1a1a", margin: "0 0 8px 0" }}>Acciones del Reporte</h3>
                <p style={{ fontSize: "13px", color: "#666", margin: 0, lineHeight: "1.4" }}>Configure y distribuya el reporte final.</p>
            </div>

            {/* Export Options */}
            <Section title="Opciones de Exportación">
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <button onClick={onExportPDF} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        backgroundColor: "#2196F3", color: "white", border: "none",
                        padding: "12px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span>📄</span>
                            <div style={{ textAlign: "left" }}>
                                <div>Exportar como PDF</div>
                                <div style={{ fontSize: "11px", opacity: 0.8, fontWeight: "normal" }}>Formato estándar</div>
                            </div>
                        </div>
                        <span>→</span>
                    </button>
                    <button onClick={onExportWord} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        backgroundColor: "white", color: "#333", border: "1px solid #e0e0e0",
                        padding: "12px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span>📝</span>
                            <div style={{ textAlign: "left" }}>
                                <div>Exportar como Word</div>
                                <div style={{ fontSize: "11px", color: "#666", fontWeight: "normal" }}>Formato editable</div>
                            </div>
                        </div>
                        <span style={{ color: "#999" }}>↓</span>
                    </button>
                </div>
            </Section>

            {/* Share Report */}
            <Section title="Compartir Reporte">
                <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#999", textTransform: "uppercase", marginBottom: "8px" }}>Invitar Interesados</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <input
                            type="email"
                            placeholder="colega@empresa.com"
                            style={{
                                flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid #e0e0e0", fontSize: "13px", outline: "none"
                            }}
                        />
                        <button style={{
                            padding: "8px 16px", backgroundColor: "#f5f5f5", border: "1px solid #e0e0e0", borderRadius: "6px",
                            color: "#333", fontWeight: "600", fontSize: "13px", cursor: "pointer"
                        }}>Enviar</button>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "-8px" }}>
                        {["JD", "AK", "+3"].map((initials, i) => (
                            <div key={i} style={{
                                width: "28px", height: "28px", borderRadius: "50%", backgroundColor: i === 2 ? "#f0f0f0" : (i === 0 ? "#E3F2FD" : "#F3E5F5"),
                                border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "11px", fontWeight: "bold", color: "#555", marginLeft: i > 0 ? "-8px" : 0
                            }}>
                                {initials}
                            </div>
                        ))}
                    </div>
                    <button style={{ background: "none", border: "none", color: "#2196F3", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>Gestionar Acceso</button>
                </div>
            </Section>

            {/* Report Settings */}
            <Section title="Configuración del Reporte">
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <Toggle
                        label="Gráficos Detallados"
                        subLabel="Incluir desglose visual"
                        checked={showCharts}
                        onChange={setShowCharts}
                    />
                    <Toggle
                        label="Recomendaciones"
                        subLabel="Mostrar pasos de mejora"
                        checked={showRecommendations}
                        onChange={setShowRecommendations}
                    />
                    <Toggle
                        label="Marca de Agua de Borrador"
                        subLabel="Superponer texto 'BORRADOR'"
                        checked={showWatermark}
                        onChange={setShowWatermark}
                    />
                </div>
            </Section>
        </div>
    );
}

function Toggle({ label, subLabel, checked, onChange }: { label: string, subLabel: string, checked: boolean, onChange: (v: boolean) => void }) {
    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
                <div style={{ fontSize: "14px", fontWeight: "500", color: "#333" }}>{label}</div>
                <div style={{ fontSize: "11px", color: "#999" }}>{subLabel}</div>
            </div>
            <div
                onClick={() => onChange(!checked)}
                style={{
                    width: "40px", height: "22px", backgroundColor: checked ? "#2196F3" : "#e0e0e0",
                    borderRadius: "11px", padding: "2px", cursor: "pointer", transition: "background-color 0.2s",
                    display: "flex", justifyContent: checked ? "flex-end" : "flex-start", boxSizing: "border-box"
                }}
            >
                <div style={{
                    width: "18px", height: "18px", backgroundColor: "white", borderRadius: "50%",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.2)"
                }} />
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
