import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client from "../../app/api";
import jsPDF from "jspdf";
// @ts-ignore
import { asBlob } from "html-docx-js-typescript";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";

// ─── Interfaces matching ProfessionalReportData from backend ────────────────────

interface ReportMetadata { report_id: string; audit_id: string; generated_at: string; generated_by: string; status: "draft" | "finalized"; version: number; }
interface CoverPage { audit_name: string; organization: string; review_period: string; standard_used: string; issue_date: string; report_version: number; status: string; repositories_count: number; repositories: string[]; }
interface ExecutiveSummary { global_maturity_level: string; global_maturity_numeric: number; maturity_interpretation: string; principal_risks: string[]; organizational_impact: string; severity_summary: { high: number; medium: number; low: number; total: number }; general_recommendation: string; }
interface PracticeRuleDetail { rule_id: string; title: string; passed: boolean; detail: string; standard_reference: string; }
interface PracticeDetailSection { practice_code: string; practice_name: string; score: number; max_score: number; maturity_level: string; rules_passed: PracticeRuleDetail[]; rules_failed: PracticeRuleDetail[]; associated_findings_count: number; aggregated_risk: string; technical_explanation: string; }
interface FindingsMatrixEntry { id: string; practice: string; repository: string; severity: string; title: string; description: string; evidence: Record<string, string | number | boolean>; rule_violated: string; standard_reference: string; impact: string; recommendation: string; status: string; }
interface TraceabilityChain { finding_id: string; repository: string; evidence_metric: string; evidence_value: string | number | boolean; rule_evaluated: string; rule_result: string; finding_title: string; severity: string; practice: string; practice_level: string; contribution_to_global: string; }
interface TraceabilitySection { chains: TraceabilityChain[]; methodology_explanation: string; scoring_explanation: string; }
interface CriticalArea { area: string; risk_level: string; findings_count: number; description: string; }
interface RiskAnalysis { global_risk_level: string; global_risk_score: number; risk_classification: string; critical_areas: CriticalArea[]; weakness_dependencies: string[]; }
interface PrioritizedRecommendation { priority: number; finding_id: string; action: string; practice: string; severity: string; impact: string; implementation_ease: string; suggested_responsible: string; recommended_deadline: string; }
interface RoadmapItem { phase: string; action: string; practice: string; related_finding_id: string; expected_outcome: string; }
interface ImprovementRoadmap { short_term: RoadmapItem[]; medium_term: RoadmapItem[]; long_term: RoadmapItem[]; }
interface TechnicalConclusion { current_state: string; gaps_against_standard: string[]; risk_of_inaction: string; scalability_readiness: string; }

interface ProfessionalReportData {
    metadata: ReportMetadata;
    cover_page: CoverPage;
    executive_summary: ExecutiveSummary;
    practice_details: PracticeDetailSection[];
    findings_matrix: FindingsMatrixEntry[];
    traceability: TraceabilitySection;
    risk_analysis: RiskAnalysis;
    recommendations: PrioritizedRecommendation[];
    roadmap: ImprovementRoadmap;
    conclusion: TechnicalConclusion;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export function ReportStep() {
    const navigate = useNavigate();
    const { id: auditId } = useParams();
    const [data, setData] = useState<ProfessionalReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [finalizing, setFinalizing] = useState(false);
    const [showFinalizeModal, setShowFinalizeModal] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState(0);
    const [expandedFinding, setExpandedFinding] = useState<string | null>(null);
    const reportRef = useRef<HTMLDivElement>(null);

    const isFinalized = data?.metadata.status === "finalized";

    useEffect(() => {
        if (auditId) {
            client.get(`/audits/${auditId}/report`).then(r => setData(r.data)).catch(() => { }).finally(() => setLoading(false));
        }
    }, [auditId]);

    const handleGenerate = async () => {
        setGenerating(true); setError(null);
        try { const r = await client.post(`/audits/${auditId}/report/generate`); setData(r.data); }
        catch (e: any) { setError(e.response?.data?.error || "Error al generar el informe."); }
        finally { setGenerating(false); }
    };

    const handleFinalize = async () => {
        setFinalizing(true); setError(null);
        try { const r = await client.post(`/audits/${auditId}/report/finalize`); setData(r.data); setShowFinalizeModal(false); }
        catch (e: any) { setError(e.response?.data?.error || "Error al finalizar."); setShowFinalizeModal(false); }
        finally { setFinalizing(false); }
    };

    const handleExportPDF = async () => {
        if (!reportRef.current) return;
        try {
            const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff" });
            const imgData = canvas.toDataURL("image/png");
            const pdfWidth = 210; const pdfHeight = 297;
            const imgWidth = pdfWidth; const imgHeight = (canvas.height * pdfWidth) / canvas.width;
            const pdf = new jsPDF("p", "mm", "a4");
            let heightLeft = imgHeight; let position = 0;
            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight); heightLeft -= pdfHeight;
            while (heightLeft > 0) { position = heightLeft - imgHeight; pdf.addPage(); pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight); heightLeft -= pdfHeight; }
            pdf.save(`Informe_Auditoria_${data?.cover_page.organization || auditId}.pdf`);
        } catch { setError("Error al exportar PDF."); }
    };

    const handleExportWord = () => {
        if (!data) return;
        const d = data;
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Informe de Auditoría - ${d.cover_page.audit_name}</title>
<style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:800px;margin:0 auto;padding:40px}
h1{color:#1565C0;border-bottom:2px solid #1565C0;padding-bottom:8px}h2{color:#1a1a1a;background:#f5f5f5;padding:10px 16px;margin-top:32px}h3{color:#333;margin-top:24px}
table{width:100%;border-collapse:collapse;margin:16px 0}th{background:#f5f5f5;text-align:left;padding:8px;border-bottom:2px solid #ddd;font-size:12px;text-transform:uppercase;color:#666}
td{padding:8px;border-bottom:1px solid #eee;font-size:13px}
.badge{padding:4px 10px;border-radius:4px;font-weight:bold;font-size:11px;text-transform:uppercase}
.high{background:#FFEBEE;color:#C62828}.medium{background:#FFF3E0;color:#E65100}.low{background:#E8F5E9;color:#2E7D32}
.cover{text-align:center;padding:80px 0;border-bottom:3px solid #1565C0;margin-bottom:40px}
.cover h1{font-size:28px;border:none}.cover p{font-size:14px;color:#666;margin:4px 0}
.metric{display:inline-block;text-align:center;padding:12px 20px;background:#f9f9f9;border-radius:8px;margin:4px}
</style></head><body>
<div class="cover"><h1>${d.cover_page.audit_name}</h1><p><strong>${d.cover_page.organization}</strong></p>
<p>Período: ${d.cover_page.review_period}</p><p>Estándar: ${d.cover_page.standard_used}</p>
<p>Fecha: ${new Date(d.cover_page.issue_date).toLocaleDateString('es-ES')}</p>
<p>Versión ${d.cover_page.report_version} — ${d.cover_page.status}</p></div>

<h2>1. Resumen Ejecutivo</h2>
<p><strong>Nivel de Madurez Global: ${d.executive_summary.global_maturity_level}</strong></p>
<p>${d.executive_summary.maturity_interpretation}</p>
<h3>Principales Riesgos</h3><ul>${d.executive_summary.principal_risks.map(r => `<li>${r}</li>`).join('')}</ul>
<h3>Impacto Organizacional</h3><p>${d.executive_summary.organizational_impact}</p>
<h3>Severidades</h3><p>Total: ${d.executive_summary.severity_summary.total} | Alta: ${d.executive_summary.severity_summary.high} | Media: ${d.executive_summary.severity_summary.medium} | Baja: ${d.executive_summary.severity_summary.low}</p>
<h3>Recomendación General</h3><p>${d.executive_summary.general_recommendation}</p>

<h2>2. Resultados por Práctica</h2>
${d.practice_details.map(p => `<h3>${p.practice_code} — ${p.practice_name}</h3>
<p>Nivel: ${p.maturity_level} | Puntaje: ${p.score}/${p.max_score} | Riesgo: ${p.aggregated_risk} | Hallazgos: ${p.associated_findings_count}</p>
<p>${p.technical_explanation}</p>
${p.rules_failed.length > 0 ? `<p><strong>Reglas incumplidas:</strong></p><ul>${p.rules_failed.map(r => `<li>${r.rule_id}: ${r.title} (${r.standard_reference})</li>`).join('')}</ul>` : '<p>Todas las reglas cumplidas.</p>'}
`).join('')}

<h2>3. Matriz de Hallazgos</h2>
<table><thead><tr><th>ID</th><th>Práctica</th><th>Repositorio</th><th>Severidad</th><th>Título</th><th>Regla</th><th>Referencia</th></tr></thead>
<tbody>${d.findings_matrix.map(f => `<tr><td>${f.id.substring(0, 8)}</td><td>${f.practice}</td><td>${f.repository}</td><td><span class="badge ${f.severity.toLowerCase()}">${f.severity}</span></td><td>${f.title}</td><td>${f.rule_violated}</td><td>${f.standard_reference}</td></tr>`).join('')}</tbody></table>

<h2>4. Trazabilidad</h2>
<p>${d.traceability.methodology_explanation}</p>
<p>${d.traceability.scoring_explanation.replace(/\n/g, '<br/>')}</p>
<table><thead><tr><th>Hallazgo</th><th>Métrica</th><th>Valor</th><th>Regla</th><th>Resultado</th><th>Práctica</th><th>Nivel</th></tr></thead>
<tbody>${d.traceability.chains.map(c => `<tr><td>${c.finding_title}</td><td>${c.evidence_metric}</td><td>${c.evidence_value}</td><td>${c.rule_evaluated}</td><td>${c.rule_result}</td><td>${c.practice}</td><td>${c.practice_level}</td></tr>`).join('')}</tbody></table>

<h2>5. Análisis de Riesgo</h2>
<p><strong>Nivel de Riesgo Global: ${d.risk_analysis.global_risk_level} (${d.risk_analysis.global_risk_score}%)</strong></p>
<p>${d.risk_analysis.risk_classification}</p>
<h3>Áreas Críticas</h3><ul>${d.risk_analysis.critical_areas.map(a => `<li><strong>${a.area} (${a.risk_level})</strong>: ${a.description}</li>`).join('')}</ul>
<h3>Dependencias entre Debilidades</h3><ul>${d.risk_analysis.weakness_dependencies.map(w => `<li>${w}</li>`).join('')}</ul>

<h2>6. Recomendaciones Prioritizadas</h2>
<table><thead><tr><th>#</th><th>Acción</th><th>Severidad</th><th>Impacto</th><th>Facilidad</th><th>Responsable</th><th>Plazo</th></tr></thead>
<tbody>${d.recommendations.map(r => `<tr><td>${r.priority}</td><td>${r.action}</td><td><span class="badge ${r.severity.toLowerCase()}">${r.severity}</span></td><td>${r.impact}</td><td>${r.implementation_ease}</td><td>${r.suggested_responsible}</td><td>${r.recommended_deadline}</td></tr>`).join('')}</tbody></table>

<h2>7. Roadmap de Mejora</h2>
${[{ title: 'Corto Plazo (0–30 días)', items: d.roadmap.short_term }, { title: 'Mediano Plazo (1–3 meses)', items: d.roadmap.medium_term }, { title: 'Largo Plazo (3–6 meses)', items: d.roadmap.long_term }].map(phase => phase.items.length > 0 ? `<h3>${phase.title}</h3><ul>${phase.items.map(i => `<li><strong>${i.practice}:</strong> ${i.action}<br/><em>Resultado esperado: ${i.expected_outcome}</em></li>`).join('')}</ul>` : '').join('')}

<h2>8. Conclusión Técnica</h2>
<h3>Estado Actual</h3><p>${d.conclusion.current_state}</p>
<h3>Brechas contra el Estándar</h3><ul>${d.conclusion.gaps_against_standard.map(g => `<li>${g}</li>`).join('')}</ul>
<h3>Riesgo de Inacción</h3><p>${d.conclusion.risk_of_inaction}</p>
<h3>Preparación para Escalar</h3><p>${d.conclusion.scalability_readiness}</p>
</body></html>`;

        asBlob(html).then((blob: any) => { saveAs(blob as Blob, `Informe_Auditoria_${d.cover_page.organization}.docx`); });
    };

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    const maturityColor = (level: string) => level === "Definido" ? "#66BB6A" : level === "Gestionado" ? "#FFA726" : "#EF5350";
    const riskColor = (level: string) => level === "Alto" ? "#EF5350" : level === "Medio" ? "#FFA726" : "#66BB6A";
    const sevColor = (s: string) => ({ HIGH: { bg: "#FFEBEE", text: "#C62828" }, MEDIUM: { bg: "#FFF3E0", text: "#E65100" }, LOW: { bg: "#E8F5E9", text: "#2E7D32" } }[s] || { bg: "#E8F5E9", text: "#2E7D32" });
    const SevBadge = ({ s }: { s: string }) => { const c = sevColor(s); const labels: Record<string, string> = { HIGH: "Alta", MEDIUM: "Media", LOW: "Baja" }; return <span style={{ padding: "4px 12px", borderRadius: "12px", fontSize: "11px", fontWeight: 700, backgroundColor: c.bg, color: c.text, textTransform: "uppercase" }}>{labels[s] || s}</span>; };

    const SECTIONS = ["Portada", "Resumen Ejecutivo", "Prácticas", "Hallazgos", "Trazabilidad", "Riesgo", "Recomendaciones", "Roadmap", "Conclusión"];

    if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>Cargando informe...</div>;

    return (
        <div style={{ width: "100%", maxWidth: "1400px", margin: "0 auto", display: "flex", gap: "32px", alignItems: "flex-start" }}>
            {/* Main Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "8px" }}>
                    <div>
                        <div style={{ fontSize: "12px", fontWeight: "bold", color: "#2196F3", textTransform: "uppercase", marginBottom: "4px" }}>Paso 5 de 5 • Reporte</div>
                        <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "#1a1a1a", margin: 0 }}>Informe Profesional de Auditoría</h2>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "14px", fontWeight: "bold", color: "#1a1a1a", marginBottom: "4px" }}>{isFinalized ? "100%" : "83%"} Completado</div>
                        <div style={{ width: "200px", height: "6px", backgroundColor: "#e0e0e0", borderRadius: "3px" }}>
                            <div style={{ width: isFinalized ? "100%" : "83%", height: "100%", backgroundColor: isFinalized ? "#66BB6A" : "#2196F3", borderRadius: "3px" }} />
                        </div>
                    </div>
                </div>
                <div style={{ height: "1px", backgroundColor: "#e0e0e0", margin: "24px 0" }} />

                {isFinalized && (
                    <div style={{ backgroundColor: "#E8F5E9", border: "1px solid #A5D6A7", borderRadius: "12px", padding: "16px 24px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "24px" }}>🔒</span>
                        <div>
                            <div style={{ fontWeight: "bold", color: "#2E7D32", fontSize: "15px" }}>Auditoría Finalizada</div>
                            <div style={{ fontSize: "13px", color: "#388E3C" }}>Finalizada el {new Date(data!.metadata.generated_at).toLocaleString()}. No se permiten más modificaciones.</div>
                        </div>
                    </div>
                )}

                {!data && (
                    <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e0e0e0", padding: "60px", textAlign: "center", marginBottom: "24px" }}>
                        <div style={{ fontSize: "48px", marginBottom: "16px" }}>📄</div>
                        <h3 style={{ margin: "0 0 8px 0", color: "#333", fontSize: "20px" }}>Generar Informe Profesional</h3>
                        <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "#666", maxWidth: "500px", marginLeft: "auto", marginRight: "auto" }}>
                            Consolide análisis, hallazgos y recomendaciones en un informe formal con 9 secciones profesionales, listo para comité directivo.
                        </p>
                        <button onClick={handleGenerate} disabled={generating} style={{ backgroundColor: generating ? "#90CAF9" : "#2196F3", color: "white", border: "none", padding: "14px 32px", borderRadius: "8px", cursor: generating ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "16px" }}>
                            {generating ? "⏳ Generando..." : "📄 Generar Informe"}
                        </button>
                        {error && <p style={{ marginTop: "16px", color: "#C62828", fontSize: "14px" }}>{error}</p>}
                    </div>
                )}

                {data && (
                    <>
                        {!isFinalized && (
                            <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
                                <button onClick={handleGenerate} disabled={generating} style={{ padding: "10px 20px", border: "1px solid #e0e0e0", borderRadius: "8px", backgroundColor: "white", cursor: "pointer", fontWeight: 600, fontSize: "14px", color: "#333" }}>
                                    {generating ? "Actualizando..." : "🔄 Actualizar"}
                                </button>
                                <button onClick={() => setShowFinalizeModal(true)} style={{ padding: "10px 20px", border: "none", borderRadius: "8px", backgroundColor: "#66BB6A", color: "white", cursor: "pointer", fontWeight: 600, fontSize: "14px" }}>
                                    🔒 Finalizar Auditoría
                                </button>
                            </div>
                        )}
                        {error && <div style={{ color: "#C62828", marginBottom: "16px", fontSize: "14px" }}>{error}</div>}

                        {/* Section Navigation Tabs */}
                        <div style={{ display: "flex", gap: "4px", marginBottom: "24px", flexWrap: "wrap" }}>
                            {SECTIONS.map((s, i) => (
                                <button key={s} onClick={() => setActiveSection(i)} style={{
                                    padding: "8px 16px", borderRadius: "20px", fontSize: "13px", fontWeight: 600,
                                    border: activeSection === i ? "2px solid #1565C0" : "1px solid #e0e0e0",
                                    backgroundColor: activeSection === i ? "#E3F2FD" : "white",
                                    color: activeSection === i ? "#1565C0" : "#666", cursor: "pointer",
                                }}>{i + 1}. {s}</button>
                            ))}
                        </div>

                        <div ref={reportRef}>
                            {/* SEC 0: Cover Page */}
                            {activeSection === 0 && (
                                <Section title="">
                                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#1565C0", textTransform: "uppercase", letterSpacing: "3px", marginBottom: "16px" }}>Informe de Auditoría de Procesos de Software</div>
                                        <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "#1a1a1a", margin: "0 0 8px 0" }}>{data.cover_page.audit_name}</h1>
                                        <div style={{ fontSize: "18px", color: "#555", marginBottom: "32px" }}>{data.cover_page.organization}</div>
                                        <div style={{ display: "inline-block", padding: "24px 48px", backgroundColor: "#fafafa", borderRadius: "12px", border: "1px solid #e0e0e0", textAlign: "left" }}>
                                            {[
                                                { l: "Período Evaluado", v: data.cover_page.review_period },
                                                { l: "Estándar", v: data.cover_page.standard_used },
                                                { l: "Fecha de Emisión", v: new Date(data.cover_page.issue_date).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" }) },
                                                { l: "Versión", v: `v${data.cover_page.report_version}` },
                                                { l: "Estado", v: data.cover_page.status },
                                                { l: "Repositorios", v: `${data.cover_page.repositories_count} evaluados` },
                                            ].map(i => (
                                                <div key={i.l} style={{ display: "flex", justifyContent: "space-between", gap: "48px", padding: "6px 0", borderBottom: "1px solid #f0f0f0" }}>
                                                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#999" }}>{i.l}</span>
                                                    <span style={{ fontSize: "14px", fontWeight: 600, color: "#1a1a1a" }}>{i.v}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Section>
                            )}

                            {/* SEC 1: Executive Summary */}
                            {activeSection === 1 && (
                                <Section title="📊 Resumen Ejecutivo Estratégico">
                                    <div style={{ display: "flex", gap: "24px", alignItems: "center", marginBottom: "24px" }}>
                                        <div style={{ width: "90px", height: "90px", borderRadius: "50%", backgroundColor: maturityColor(data.executive_summary.global_maturity_level) + "22", border: `3px solid ${maturityColor(data.executive_summary.global_maturity_level)}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <span style={{ fontSize: "14px", fontWeight: "bold", color: maturityColor(data.executive_summary.global_maturity_level), textAlign: "center" }}>{data.executive_summary.global_maturity_level}</span>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "22px", fontWeight: "bold", color: "#1a1a1a" }}>Nivel {data.executive_summary.global_maturity_numeric} — {data.executive_summary.global_maturity_level}</div>
                                            <div style={{ fontSize: "14px", color: "#666" }}>Nivel de Madurez Global</div>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: "14px", lineHeight: 1.7, color: "#444", marginBottom: "20px" }}>{data.executive_summary.maturity_interpretation}</p>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
                                        {[{ l: "Total", v: data.executive_summary.severity_summary.total, c: "#2196F3" }, { l: "Alta", v: data.executive_summary.severity_summary.high, c: "#C62828" }, { l: "Media", v: data.executive_summary.severity_summary.medium, c: "#E65100" }, { l: "Baja", v: data.executive_summary.severity_summary.low, c: "#2E7D32" }].map(s => (
                                            <div key={s.l} style={{ textAlign: "center", padding: "16px", backgroundColor: "#fafafa", borderRadius: "8px" }}>
                                                <div style={{ fontSize: "28px", fontWeight: "bold", color: s.c }}>{s.v}</div>
                                                <div style={{ fontSize: "12px", fontWeight: 700, color: "#999", textTransform: "uppercase", marginTop: "4px" }}>{s.l}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <SubSection title="Principales Riesgos">
                                        <ul style={{ margin: 0, paddingLeft: "20px" }}>{data.executive_summary.principal_risks.map((r, i) => <li key={i} style={{ fontSize: "14px", color: "#444", marginBottom: "6px" }}>{r}</li>)}</ul>
                                    </SubSection>
                                    <SubSection title="Impacto Organizacional">
                                        <p style={{ fontSize: "14px", lineHeight: 1.7, color: "#444", margin: 0 }}>{data.executive_summary.organizational_impact}</p>
                                    </SubSection>
                                    <SubSection title="Recomendación General">
                                        <p style={{ fontSize: "14px", lineHeight: 1.7, color: "#444", margin: 0 }}>{data.executive_summary.general_recommendation}</p>
                                    </SubSection>
                                </Section>
                            )}

                            {/* SEC 2: Practice Details */}
                            {activeSection === 2 && (
                                <Section title="📐 Resultados por Práctica (Detalle Analítico)">
                                    {data.practice_details.map(p => (
                                        <div key={p.practice_code} style={{ marginBottom: "24px", border: "1px solid #e0e0e0", borderRadius: "10px", overflow: "hidden" }}>
                                            <div style={{ padding: "16px 20px", backgroundColor: "#fafafa", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e0e0e0" }}>
                                                <div>
                                                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#999" }}>{p.practice_code}</span>
                                                    <div style={{ fontSize: "16px", fontWeight: "bold", color: "#1a1a1a" }}>{p.practice_name}</div>
                                                </div>
                                                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                                    <span style={{ padding: "4px 12px", borderRadius: "12px", fontSize: "11px", fontWeight: 700, backgroundColor: maturityColor(p.maturity_level) + "22", color: maturityColor(p.maturity_level) }}>{p.maturity_level}</span>
                                                    <span style={{ padding: "4px 12px", borderRadius: "12px", fontSize: "11px", fontWeight: 700, backgroundColor: riskColor(p.aggregated_risk) + "22", color: riskColor(p.aggregated_risk) }}>Riesgo: {p.aggregated_risk}</span>
                                                </div>
                                            </div>
                                            <div style={{ padding: "20px" }}>
                                                <div style={{ display: "flex", gap: "24px", marginBottom: "16px" }}>
                                                    <div><span style={{ fontSize: "12px", color: "#999" }}>Puntaje</span><div style={{ fontSize: "18px", fontWeight: "bold" }}>{p.score}/{p.max_score}</div></div>
                                                    <div><span style={{ fontSize: "12px", color: "#999" }}>Hallazgos</span><div style={{ fontSize: "18px", fontWeight: "bold" }}>{p.associated_findings_count}</div></div>
                                                    <div><span style={{ fontSize: "12px", color: "#999" }}>Reglas Cumplidas</span><div style={{ fontSize: "18px", fontWeight: "bold", color: "#66BB6A" }}>{p.rules_passed.length}</div></div>
                                                    <div><span style={{ fontSize: "12px", color: "#999" }}>Reglas Incumplidas</span><div style={{ fontSize: "18px", fontWeight: "bold", color: "#EF5350" }}>{p.rules_failed.length}</div></div>
                                                </div>
                                                <div style={{ height: "8px", backgroundColor: "#f0f0f0", borderRadius: "4px", overflow: "hidden", marginBottom: "16px" }}>
                                                    <div style={{ height: "100%", width: p.max_score > 0 ? `${(p.score / p.max_score) * 100}%` : "0%", backgroundColor: maturityColor(p.maturity_level), borderRadius: "4px" }} />
                                                </div>
                                                <p style={{ fontSize: "13px", lineHeight: 1.6, color: "#555", marginBottom: "16px" }}>{p.technical_explanation}</p>
                                                {p.rules_failed.length > 0 && (
                                                    <div style={{ backgroundColor: "#FFF8E1", borderRadius: "8px", padding: "12px 16px" }}>
                                                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#F57F17", textTransform: "uppercase", marginBottom: "8px" }}>Reglas Incumplidas</div>
                                                        {p.rules_failed.map(r => (
                                                            <div key={r.rule_id + r.detail} style={{ fontSize: "13px", color: "#555", marginBottom: "6px", paddingLeft: "12px", borderLeft: "2px solid #FFA726" }}>
                                                                <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{r.rule_id}</span> — {r.title}
                                                                <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>{r.detail}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </Section>
                            )}

                            {/* SEC 3: Findings Matrix */}
                            {activeSection === 3 && (
                                <Section title={`📋 Matriz de Hallazgos Formal (${data.findings_matrix.length})`}>
                                    {data.findings_matrix.length === 0 ? <p style={{ color: "#666" }}>No hay hallazgos aprobados.</p> : (
                                        <div style={{ overflowX: "auto", paddingBottom: "8px" }}>
                                            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
                                                <thead><tr style={{ borderBottom: "2px solid #e0e0e0" }}>
                                                    {["ID", "Práctica", "Repositorio", "Severidad", "Título", "Regla", "Ref."].map(h => (
                                                        <th key={h} style={{ textAlign: "left", padding: "12px 8px", fontSize: "11px", fontWeight: 700, color: "#999", textTransform: "uppercase" }}>{h}</th>
                                                    ))}
                                                </tr></thead>
                                                <tbody>
                                                    {data.findings_matrix.map(f => (
                                                        <>
                                                            <tr key={f.id} onClick={() => setExpandedFinding(expandedFinding === f.id ? null : f.id)} style={{ borderBottom: expandedFinding === f.id ? "none" : "1px solid #f0f0f0", cursor: "pointer" }}>
                                                                <td style={{ padding: "10px 8px", fontSize: "12px", fontFamily: "monospace", color: "#666" }}>{f.id.substring(0, 8)}</td>
                                                                <td style={{ padding: "10px 8px", fontSize: "13px", fontWeight: 600 }}>{f.practice}</td>
                                                                <td style={{ padding: "10px 8px", fontSize: "13px", color: "#555" }}>{f.repository}</td>
                                                                <td style={{ padding: "10px 8px" }}><SevBadge s={f.severity} /></td>
                                                                <td style={{ padding: "10px 8px", fontSize: "13px", fontWeight: 600, color: "#333" }}>{f.title}</td>
                                                                <td style={{ padding: "10px 8px", fontSize: "12px", fontFamily: "monospace", color: "#666" }}>{f.rule_violated}</td>
                                                                <td style={{ padding: "10px 8px", fontSize: "12px", color: "#888" }}>{f.standard_reference}</td>
                                                            </tr>
                                                            {expandedFinding === f.id && (
                                                                <tr key={`${f.id}-exp`} style={{ borderBottom: "1px solid #f0f0f0" }}>
                                                                    <td colSpan={7} style={{ padding: "0 8px 16px", backgroundColor: "#fafafa" }}>
                                                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", padding: "12px" }}>
                                                                            <div><DLabel>Descripción</DLabel><DVal>{f.description}</DVal></div>
                                                                            <div><DLabel>Impacto</DLabel><DVal>{f.impact}</DVal></div>
                                                                            <div><DLabel>Recomendación</DLabel><DVal>{f.recommendation}</DVal></div>
                                                                            <div><DLabel>Evidencia</DLabel><DVal>{Object.entries(f.evidence).map(([k, v]) => <div key={k}><span style={{ fontFamily: "monospace", fontWeight: 600 }}>{k}:</span> {String(v)}</div>)}</DVal></div>
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
                                </Section>
                            )}

                            {/* SEC 4: Traceability */}
                            {activeSection === 4 && (
                                <Section title="🔗 Trazabilidad Completa">
                                    <SubSection title="Metodología de Evaluación">
                                        <p style={{ fontSize: "14px", lineHeight: 1.7, color: "#444", margin: 0 }}>{data.traceability.methodology_explanation}</p>
                                    </SubSection>
                                    <SubSection title="Metodología de Scoring">
                                        <p style={{ fontSize: "14px", lineHeight: 1.7, color: "#444", margin: 0, whiteSpace: "pre-line" }}>{data.traceability.scoring_explanation}</p>
                                    </SubSection>
                                    <SubSection title="Cadena de Trazabilidad">
                                        {data.traceability.chains.length === 0 ? <p style={{ color: "#666" }}>Sin cadenas de trazabilidad (todos los controles cumplidos).</p> : (
                                            <div style={{ overflowX: "auto", paddingBottom: "8px" }}>
                                                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
                                                    <thead><tr style={{ borderBottom: "2px solid #e0e0e0" }}>
                                                        {["Repo", "Métrica", "Valor", "Regla", "Resultado", "Hallazgo", "Nivel Práctica"].map(h => (
                                                            <th key={h} style={{ textAlign: "left", padding: "10px 8px", fontSize: "11px", fontWeight: 700, color: "#999", textTransform: "uppercase" }}>{h}</th>
                                                        ))}
                                                    </tr></thead>
                                                    <tbody>{data.traceability.chains.map((c, i) => (
                                                        <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                                                            <td style={{ padding: "10px 8px", fontSize: "13px", color: "#555" }}>{c.repository}</td>
                                                            <td style={{ padding: "10px 8px", fontSize: "12px", fontFamily: "monospace" }}>{c.evidence_metric}</td>
                                                            <td style={{ padding: "10px 8px", fontSize: "13px", fontWeight: 600 }}>{String(c.evidence_value)}</td>
                                                            <td style={{ padding: "10px 8px", fontSize: "12px", fontFamily: "monospace" }}>{c.rule_evaluated}</td>
                                                            <td style={{ padding: "10px 8px" }}><span style={{ padding: "3px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: 700, backgroundColor: "#FFEBEE", color: "#C62828" }}>FAIL</span></td>
                                                            <td style={{ padding: "10px 8px", fontSize: "13px", color: "#333" }}>{c.finding_title}</td>
                                                            <td style={{ padding: "10px 8px" }}><span style={{ padding: "3px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: 700, backgroundColor: maturityColor(c.practice_level) + "22", color: maturityColor(c.practice_level) }}>{c.practice_level}</span></td>
                                                        </tr>
                                                    ))}</tbody>
                                                </table>
                                            </div>
                                        )}
                                    </SubSection>
                                </Section>
                            )}

                            {/* SEC 5: Risk Analysis */}
                            {activeSection === 5 && (
                                <Section title="⚠️ Análisis de Riesgo Consolidado">
                                    <div style={{ display: "flex", gap: "24px", alignItems: "center", marginBottom: "24px" }}>
                                        <div style={{ width: "90px", height: "90px", borderRadius: "50%", backgroundColor: riskColor(data.risk_analysis.global_risk_level) + "22", border: `3px solid ${riskColor(data.risk_analysis.global_risk_level)}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <span style={{ fontSize: "22px", fontWeight: "bold", color: riskColor(data.risk_analysis.global_risk_level) }}>{data.risk_analysis.global_risk_score}%</span>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "22px", fontWeight: "bold", color: "#1a1a1a" }}>Riesgo {data.risk_analysis.global_risk_level}</div>
                                            <div style={{ fontSize: "14px", color: "#666" }}>Nivel de Riesgo Global</div>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: "14px", lineHeight: 1.7, color: "#444", marginBottom: "20px" }}>{data.risk_analysis.risk_classification}</p>
                                    <SubSection title="Áreas Críticas">
                                        {data.risk_analysis.critical_areas.map((a, i) => (
                                            <div key={i} style={{ padding: "12px 16px", marginBottom: "8px", borderRadius: "8px", backgroundColor: "#fafafa", borderLeft: `4px solid ${riskColor(a.risk_level)}` }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                                    <span style={{ fontSize: "14px", fontWeight: 600, color: "#333" }}>{a.area}</span>
                                                    <span style={{ padding: "3px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: 700, backgroundColor: riskColor(a.risk_level) + "22", color: riskColor(a.risk_level) }}>{a.risk_level} ({a.findings_count})</span>
                                                </div>
                                                <p style={{ fontSize: "13px", color: "#555", margin: 0 }}>{a.description}</p>
                                            </div>
                                        ))}
                                    </SubSection>
                                    <SubSection title="Dependencias entre Debilidades">
                                        <ul style={{ margin: 0, paddingLeft: "20px" }}>{data.risk_analysis.weakness_dependencies.map((w, i) => <li key={i} style={{ fontSize: "14px", color: "#444", marginBottom: "8px", lineHeight: 1.6 }}>{w}</li>)}</ul>
                                    </SubSection>
                                </Section>
                            )}

                            {/* SEC 6: Recommendations */}
                            {activeSection === 6 && (
                                <Section title="✅ Recomendaciones Prioritizadas">
                                    <div style={{ overflowX: "auto", paddingBottom: "8px" }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
                                            <thead><tr style={{ borderBottom: "2px solid #e0e0e0" }}>
                                                {["#", "Acción", "Sev.", "Impacto", "Facilidad", "Responsable", "Plazo"].map(h => (
                                                    <th key={h} style={{ textAlign: "left", padding: "12px 8px", fontSize: "11px", fontWeight: 700, color: "#999", textTransform: "uppercase" }}>{h}</th>
                                                ))}
                                            </tr></thead>
                                            <tbody>{data.recommendations.map(r => (
                                                <tr key={r.priority} style={{ borderBottom: "1px solid #f0f0f0" }}>
                                                    <td style={{ padding: "12px 8px", fontSize: "16px", fontWeight: "bold", color: "#1565C0" }}>{r.priority}</td>
                                                    <td style={{ padding: "12px 8px", fontSize: "13px", color: "#444", maxWidth: "280px" }}>{r.action}</td>
                                                    <td style={{ padding: "12px 8px" }}><SevBadge s={r.severity} /></td>
                                                    <td style={{ padding: "12px 8px", fontSize: "13px", fontWeight: 600 }}>{r.impact}</td>
                                                    <td style={{ padding: "12px 8px", fontSize: "13px" }}>{r.implementation_ease}</td>
                                                    <td style={{ padding: "12px 8px", fontSize: "13px", color: "#555" }}>{r.suggested_responsible}</td>
                                                    <td style={{ padding: "12px 8px", fontSize: "13px", fontWeight: 600, color: "#333" }}>{r.recommended_deadline}</td>
                                                </tr>
                                            ))}</tbody>
                                        </table>
                                    </div>
                                </Section>
                            )}

                            {/* SEC 7: Roadmap */}
                            {activeSection === 7 && (
                                <Section title="🗺️ Roadmap de Mejora">
                                    {[
                                        { title: "Corto Plazo (0–30 días)", items: data.roadmap.short_term, color: "#C62828", bg: "#FFEBEE" },
                                        { title: "Mediano Plazo (1–3 meses)", items: data.roadmap.medium_term, color: "#E65100", bg: "#FFF3E0" },
                                        { title: "Largo Plazo (3–6 meses)", items: data.roadmap.long_term, color: "#2E7D32", bg: "#E8F5E9" },
                                    ].map(phase => phase.items.length > 0 && (
                                        <div key={phase.title} style={{ marginBottom: "24px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                                                <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: phase.color }} />
                                                <span style={{ fontSize: "16px", fontWeight: "bold", color: "#1a1a1a" }}>{phase.title}</span>
                                                <span style={{ padding: "2px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: 700, backgroundColor: phase.bg, color: phase.color }}>{phase.items.length} acciones</span>
                                            </div>
                                            {phase.items.map((item, i) => (
                                                <div key={i} style={{ padding: "12px 16px", marginBottom: "8px", borderRadius: "8px", backgroundColor: "#fafafa", borderLeft: `3px solid ${phase.color}`, marginLeft: "20px" }}>
                                                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#333", marginBottom: "4px" }}>{item.practice}: {item.action.substring(0, 120)}...</div>
                                                    <div style={{ fontSize: "12px", color: "#888" }}>Resultado esperado: {item.expected_outcome}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                    {data.roadmap.short_term.length === 0 && data.roadmap.medium_term.length === 0 && data.roadmap.long_term.length === 0 && (
                                        <p style={{ color: "#666" }}>No se generaron acciones de mejora (todos los controles cumplidos).</p>
                                    )}
                                </Section>
                            )}

                            {/* SEC 8: Conclusion */}
                            {activeSection === 8 && (
                                <Section title="🏁 Conclusión Técnica">
                                    <SubSection title="Estado Actual del Proceso">
                                        <p style={{ fontSize: "14px", lineHeight: 1.7, color: "#444", margin: 0 }}>{data.conclusion.current_state}</p>
                                    </SubSection>
                                    <SubSection title="Brechas contra el Estándar">
                                        <ul style={{ margin: 0, paddingLeft: "20px" }}>{data.conclusion.gaps_against_standard.map((g, i) => <li key={i} style={{ fontSize: "14px", color: "#444", marginBottom: "6px" }}>{g}</li>)}</ul>
                                    </SubSection>
                                    <SubSection title="Riesgo de Inacción">
                                        <p style={{ fontSize: "14px", lineHeight: 1.7, color: "#444", margin: 0 }}>{data.conclusion.risk_of_inaction}</p>
                                    </SubSection>
                                    <SubSection title="Preparación para Escalar">
                                        <p style={{ fontSize: "14px", lineHeight: 1.7, color: "#444", margin: 0 }}>{data.conclusion.scalability_readiness}</p>
                                    </SubSection>
                                </Section>
                            )}
                        </div>
                    </>
                )}

                {/* Finalize Modal */}
                {showFinalizeModal && (
                    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                        <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "32px", maxWidth: "450px", width: "90%", textAlign: "center" }}>
                            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔒</div>
                            <h3 style={{ margin: "0 0 8px 0", color: "#1a1a1a", fontSize: "20px" }}>¿Finalizar Auditoría?</h3>
                            <p style={{ color: "#666", fontSize: "14px", margin: "0 0 8px 0" }}>Esto bloqueará permanentemente la auditoría y su reporte.</p>
                            <p style={{ color: "#C62828", fontSize: "13px", fontWeight: 600, margin: "0 0 24px 0" }}>⚠️ Esta acción no se puede deshacer.</p>
                            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                                <button onClick={() => setShowFinalizeModal(false)} style={{ padding: "10px 24px", border: "1px solid #e0e0e0", borderRadius: "8px", backgroundColor: "white", cursor: "pointer", fontWeight: 600, fontSize: "14px" }}>Cancelar</button>
                                <button onClick={handleFinalize} disabled={finalizing} style={{ padding: "10px 24px", border: "none", borderRadius: "8px", backgroundColor: finalizing ? "#A5D6A7" : "#66BB6A", color: "white", cursor: finalizing ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "14px" }}>{finalizing ? "Finalizando..." : "Finalizar"}</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Navigation */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px", paddingTop: "24px", borderTop: "1px solid #e0e0e0" }}>
                    <button onClick={() => navigate(`/audit/${auditId}/findings`)} style={{ background: "none", border: "none", cursor: "pointer", color: "#666", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>← Volver a Hallazgos</button>
                    <button onClick={() => navigate("/")} style={{ backgroundColor: "#2196F3", color: "white", border: "none", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px" }}>Volver a Auditorías</button>
                </div>
            </div>

            {/* Sidebar */}
            {data && (
                <div style={{ width: "280px", flexShrink: 0, position: "sticky", top: "24px" }}>
                    <Section title="Acciones del Informe">
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <button onClick={handleExportPDF} style={{ display: "flex", alignItems: "center", gap: "12px", backgroundColor: "#1565C0", color: "white", border: "none", padding: "12px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px" }}>
                                <span>📄</span><div style={{ textAlign: "left" }}><div>Exportar PDF</div><div style={{ fontSize: "11px", opacity: 0.8, fontWeight: "normal" }}>Formato estándar</div></div>
                            </button>
                            <button onClick={handleExportWord} style={{ display: "flex", alignItems: "center", gap: "12px", backgroundColor: "white", color: "#333", border: "1px solid #e0e0e0", padding: "12px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px" }}>
                                <span>📝</span><div style={{ textAlign: "left" }}><div>Exportar Word</div><div style={{ fontSize: "11px", color: "#666", fontWeight: "normal" }}>Formato editable</div></div>
                            </button>
                        </div>
                    </Section>
                    <Section title="Contenido del Informe">
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {SECTIONS.map((s, i) => (
                                <button key={s} onClick={() => setActiveSection(i)} style={{
                                    textAlign: "left", padding: "8px 12px", borderRadius: "6px", border: "none", fontSize: "13px",
                                    backgroundColor: activeSection === i ? "#E3F2FD" : "transparent",
                                    color: activeSection === i ? "#1565C0" : "#555",
                                    fontWeight: activeSection === i ? 600 : 400,
                                    cursor: "pointer",
                                }}>{i + 1}. {s}</button>
                            ))}
                        </div>
                    </Section>
                    <Section title="Información">
                        <div style={{ fontSize: "13px", color: "#666", lineHeight: 1.5 }}>
                            <div style={{ marginBottom: "8px" }}><span style={{ fontWeight: 600, color: "#333" }}>Versión:</span> v{data.metadata.version}</div>
                            <div style={{ marginBottom: "8px" }}><span style={{ fontWeight: 600, color: "#333" }}>Generado:</span> {new Date(data.metadata.generated_at).toLocaleString()}</div>
                            <div><span style={{ fontWeight: 600, color: "#333" }}>Estado:</span> {data.metadata.status === "finalized" ? "Final" : "Borrador"}</div>
                        </div>
                    </Section>
                </div>
            )}
        </div>
    );
}

// ─── Reusable Components ────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e0e0e0", overflow: "hidden", marginBottom: "20px" }}>
            {title && <div style={{ padding: "16px 24px", borderBottom: "1px solid #e0e0e0", backgroundColor: "#fafafa" }}><h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#1a1a1a" }}>{title}</h3></div>}
            <div style={{ padding: "24px" }}>{children}</div>
        </div>
    );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#555", textTransform: "uppercase", marginBottom: "8px", borderBottom: "1px solid #f0f0f0", paddingBottom: "6px" }}>{title}</div>
            {children}
        </div>
    );
}

function DLabel({ children }: { children: React.ReactNode }) {
    return <div style={{ fontSize: "11px", fontWeight: 700, color: "#999", textTransform: "uppercase", marginBottom: "4px" }}>{children}</div>;
}

function DVal({ children }: { children: React.ReactNode }) {
    return <div style={{ fontSize: "13px", color: "#555", lineHeight: 1.5 }}>{children}</div>;
}
