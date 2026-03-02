import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client from "../../app/api";

// ─── Interfaces matching AnalysisOutput from backend v2 ─────────────────────────

interface EvaluatedRule {
    rule_id: string;
    passed: boolean;
    metric_values: Record<string, string | number | boolean>;
    detail: string;
}

interface PracticeResult {
    practice: string;
    score: number;
    max_score: number;
    level: string;
    evaluated_rules: EvaluatedRule[];
    generated_findings: string[];
}

interface RepositoryAnalysisResult {
    repository: string;
    practice_results: PracticeResult[];
}

interface PracticeScoreAggregate {
    score: number;
    max_score: number;
    level: string;
}

interface AnalysisFinding {
    finding_id: string;
    repository: string;
    practice: string;
    severity: "HIGH" | "MEDIUM" | "LOW";
    title: string;
    description: string;
    rule_violated: string;
    standard_reference: string;
    evidence_snapshot: Record<string, string | number | boolean>;
    analysis_source_id: string;
}

interface AnalysisOutput {
    analysis_id: string;
    audit_id: string;
    executed_at: string;
    repository_results: RepositoryAnalysisResult[];
    aggregated_results: {
        practice_scores: Record<string, PracticeScoreAggregate>;
        global_maturity_level: string;
    };
    findings: AnalysisFinding[];
}

// ─── Component ──────────────────────────────────────────────────────────────────

export function AnalysisStep() {
    const navigate = useNavigate();
    const { id: auditId } = useParams();
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<AnalysisOutput | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
    const [expandedRules, setExpandedRules] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (auditId) {
            client
                .get(`/audits/${auditId}/analysis`)
                .then((res) => setResult(res.data))
                .catch(() => { });
        }
    }, [auditId]);

    const handleRunAnalysis = async () => {
        setIsRunning(true);
        setError(null);
        try {
            const res = await client.post(`/audits/${auditId}/analysis`);
            setResult(res.data);
            setSelectedRepo(null);
        } catch (err: any) {
            setError(
                err.response?.data?.error ||
                "Error al ejecutar el análisis. Asegúrese de haber recolectado la evidencia."
            );
        } finally {
            setIsRunning(false);
        }
    };

    const maturityColor = (level: string) => {
        switch (level) {
            case "Inicial": return "#EF5350";
            case "Gestionado": return "#FFA726";
            case "Definido": return "#66BB6A";
            default: return "#999";
        }
    };

    const severityBadge = (severity: string) => {
        const colors: Record<string, { bg: string; text: string }> = {
            HIGH: { bg: "#FFEBEE", text: "#C62828" },
            MEDIUM: { bg: "#FFF3E0", text: "#E65100" },
            LOW: { bg: "#E8F5E9", text: "#2E7D32" },
        };
        const c = colors[severity] || colors.LOW;
        return (
            <span style={{ padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "600", backgroundColor: c.bg, color: c.text, textTransform: "uppercase" }}>
                {severity}
            </span>
        );
    };

    const toggleRuleExpand = (key: string) => {
        setExpandedRules(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const activeRepo = selectedRepo
        ? result?.repository_results.find(r => r.repository === selectedRepo)
        : null;

    return (
        <div style={{ width: "100%", maxWidth: "1100px", margin: "0 auto" }}>
            {/* Step Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "8px" }}>
                <div>
                    <div style={{ fontSize: "12px", fontWeight: "bold", color: "#2196F3", textTransform: "uppercase", marginBottom: "4px" }}>
                        Paso 3 de 5 • Análisis
                    </div>
                    <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "#1a1a1a", margin: 0 }}>
                        Análisis de Auditoría
                    </h2>
                </div>
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "14px", fontWeight: "bold", color: "#1a1a1a", marginBottom: "4px" }}>50% Completado</div>
                    <div style={{ width: "200px", height: "6px", backgroundColor: "#e0e0e0", borderRadius: "3px" }}>
                        <div style={{ width: "50%", height: "100%", backgroundColor: "#2196F3", borderRadius: "3px" }} />
                    </div>
                </div>
            </div>

            <div style={{ height: "1px", backgroundColor: "#e0e0e0", margin: "24px 0" }} />

            {/* Run Analysis Button */}
            {!result && (
                <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e0e0e0", padding: "60px", textAlign: "center", marginBottom: "24px" }}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔬</div>
                    <h3 style={{ margin: "0 0 8px 0", color: "#333", fontSize: "20px" }}>Listo para Analizar</h3>
                    <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "#666", maxWidth: "500px", marginLeft: "auto", marginRight: "auto" }}>
                        El motor de análisis evaluará cada repositorio individualmente contra el estándar DevAudit v1.0 y calculará los niveles de madurez con trazabilidad completa.
                    </p>
                    <button
                        onClick={handleRunAnalysis}
                        disabled={isRunning}
                        style={{ backgroundColor: isRunning ? "#90CAF9" : "#2196F3", color: "white", border: "none", padding: "14px 32px", borderRadius: "8px", cursor: isRunning ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "16px", display: "inline-flex", alignItems: "center", gap: "8px" }}
                    >
                        {isRunning ? "⏳ Ejecutando Análisis..." : "▶ Ejecutar Análisis"}
                    </button>
                    {error && <p style={{ marginTop: "16px", color: "#C62828", fontSize: "14px" }}>{error}</p>}
                </div>
            )}

            {/* Results Dashboard */}
            {result && (
                <>
                    {/* Global Maturity Level */}
                    <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e0e0e0", padding: "32px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "32px" }}>
                        <div style={{
                            width: "80px", height: "80px", borderRadius: "50%",
                            backgroundColor: maturityColor(result.aggregated_results.global_maturity_level) + "22",
                            border: `3px solid ${maturityColor(result.aggregated_results.global_maturity_level)}`,
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                            <span style={{ fontSize: "16px", fontWeight: "bold", color: maturityColor(result.aggregated_results.global_maturity_level), textAlign: "center" }}>
                                {result.aggregated_results.global_maturity_level}
                            </span>
                        </div>
                        <div>
                            <div style={{ fontSize: "12px", fontWeight: "700", color: "#999", textTransform: "uppercase", marginBottom: "4px" }}>
                                Nivel de Madurez Global
                            </div>
                            <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1a1a1a" }}>
                                {result.aggregated_results.global_maturity_level}
                            </div>
                            <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>
                                {result.repository_results.length} repositorios evaluados • {result.findings.length} hallazgos generados
                            </div>
                        </div>
                        <div style={{ marginLeft: "auto" }}>
                            <button
                                onClick={handleRunAnalysis}
                                disabled={isRunning}
                                style={{ padding: "8px 16px", border: "1px solid #e0e0e0", borderRadius: "6px", backgroundColor: "white", cursor: "pointer", fontWeight: "500", fontSize: "13px", color: "#333" }}
                            >
                                {isRunning ? "Re-ejecutando..." : "🔄 Re-analizar"}
                            </button>
                        </div>
                    </div>

                    {/* Aggregated Practice Scores */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                        {Object.entries(result.aggregated_results.practice_scores).map(([code, data]) => {
                            const names: Record<string, string> = { SCM: "Gestión de Configuración", QA: "Aseguramiento de Calidad", PM: "Gestión de Proyecto" };
                            return (
                                <div key={code} style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e0e0e0", padding: "24px", position: "relative", overflow: "hidden" }}>
                                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", backgroundColor: maturityColor(data.level) }} />
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                                        <div>
                                            <div style={{ fontSize: "11px", fontWeight: "700", color: "#999", textTransform: "uppercase", marginBottom: "4px" }}>{code}</div>
                                            <div style={{ fontSize: "16px", fontWeight: "bold", color: "#1a1a1a" }}>{names[code] || code}</div>
                                        </div>
                                        <div style={{ backgroundColor: maturityColor(data.level) + "22", color: maturityColor(data.level), padding: "6px 12px", borderRadius: "16px", fontSize: "12px", fontWeight: "700" }}>
                                            {data.level}
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: "8px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#666", marginBottom: "6px" }}>
                                            <span>Puntaje</span>
                                            <span>{data.score} / {data.max_score}</span>
                                        </div>
                                        <div style={{ height: "8px", backgroundColor: "#f0f0f0", borderRadius: "4px", overflow: "hidden" }}>
                                            <div style={{ height: "100%", width: data.max_score > 0 ? `${(data.score / data.max_score) * 100}%` : '0%', backgroundColor: maturityColor(data.level), borderRadius: "4px", transition: "width 0.5s ease" }} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Repository Selector */}
                    <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e0e0e0", overflow: "hidden", marginBottom: "24px" }}>
                        <div style={{ padding: "16px 24px", borderBottom: "1px solid #e0e0e0", backgroundColor: "#fafafa" }}>
                            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#1a1a1a" }}>
                                📦 Resultados por Repositorio
                            </h3>
                        </div>
                        <div style={{ display: "flex", gap: "8px", padding: "16px 24px", flexWrap: "wrap" }}>
                            {result.repository_results.map(rr => (
                                <button
                                    key={rr.repository}
                                    onClick={() => setSelectedRepo(selectedRepo === rr.repository ? null : rr.repository)}
                                    style={{
                                        padding: "8px 16px", borderRadius: "20px", fontSize: "13px", fontWeight: "600",
                                        border: selectedRepo === rr.repository ? "2px solid #2196F3" : "1px solid #e0e0e0",
                                        backgroundColor: selectedRepo === rr.repository ? "#E3F2FD" : "white",
                                        color: selectedRepo === rr.repository ? "#1565C0" : "#555",
                                        cursor: "pointer",
                                    }}
                                >
                                    {rr.repository}
                                </button>
                            ))}
                        </div>

                        {/* Per-repo practice details */}
                        {activeRepo && (
                            <div style={{ padding: "0 24px 24px" }}>
                                {activeRepo.practice_results.map(pr => (
                                    <div key={pr.practice} style={{ marginBottom: "16px", border: "1px solid #f0f0f0", borderRadius: "8px", overflow: "hidden" }}>
                                        <div style={{ padding: "12px 16px", backgroundColor: "#fafafa", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div>
                                                <span style={{ fontWeight: "700", fontSize: "14px", color: "#333" }}>{pr.practice}</span>
                                                <span style={{ marginLeft: "12px", fontSize: "13px", color: "#666" }}>
                                                    {pr.score}/{pr.max_score} — {pr.level}
                                                </span>
                                            </div>
                                            <span style={{ backgroundColor: maturityColor(pr.level) + "22", color: maturityColor(pr.level), padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" }}>
                                                {pr.level}
                                            </span>
                                        </div>
                                        {/* Evaluated Rules */}
                                        <div style={{ padding: "8px 16px" }}>
                                            {pr.evaluated_rules.map(rule => {
                                                const ruleKey = `${activeRepo.repository}-${rule.rule_id}`;
                                                const isExpanded = expandedRules[ruleKey];
                                                return (
                                                    <div key={rule.rule_id} style={{ borderBottom: "1px solid #f5f5f5", padding: "8px 0" }}>
                                                        <div
                                                            onClick={() => toggleRuleExpand(ruleKey)}
                                                            style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
                                                        >
                                                            <span style={{ fontSize: "14px" }}>{rule.passed ? "✅" : "❌"}</span>
                                                            <span style={{ fontSize: "13px", fontWeight: "600", color: "#333", fontFamily: "monospace" }}>{rule.rule_id}</span>
                                                            <span style={{ fontSize: "13px", color: "#666", flex: 1 }}>{rule.detail}</span>
                                                            <span style={{ fontSize: "11px", color: "#999" }}>{isExpanded ? "▲" : "▼"}</span>
                                                        </div>
                                                        {isExpanded && (
                                                            <div style={{ marginTop: "8px", padding: "8px 12px", backgroundColor: "#f9f9f9", borderRadius: "6px", fontSize: "12px" }}>
                                                                <div style={{ fontWeight: "600", color: "#555", marginBottom: "6px" }}>Evidencia (snapshot):</div>
                                                                {Object.entries(rule.metric_values).map(([k, v]) => (
                                                                    <div key={k} style={{ display: "flex", gap: "8px", color: "#666", marginBottom: "2px" }}>
                                                                        <span style={{ fontFamily: "monospace", fontWeight: "600" }}>{k}:</span>
                                                                        <span>{String(v)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Findings Table */}
                    {result.findings.length > 0 && (
                        <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e0e0e0", overflow: "hidden", marginBottom: "24px" }}>
                            <div style={{ padding: "16px 24px", borderBottom: "1px solid #e0e0e0", backgroundColor: "#fafafa" }}>
                                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#1a1a1a" }}>
                                    📋 Hallazgos ({result.findings.length})
                                </h3>
                            </div>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
                                        {["Repositorio", "Práctica", "Regla", "Severidad", "Descripción"].map(h => (
                                            <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: "12px", fontWeight: "700", color: "#999", textTransform: "uppercase" }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.findings.map(f => (
                                        <tr key={f.finding_id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                                            <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: "500", color: "#333" }}>{f.repository}</td>
                                            <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: "600", color: "#333" }}>{f.practice}</td>
                                            <td style={{ padding: "12px 16px", fontSize: "12px", fontFamily: "monospace", color: "#666" }}>{f.rule_violated}</td>
                                            <td style={{ padding: "12px 16px" }}>{severityBadge(f.severity)}</td>
                                            <td style={{ padding: "12px 16px", fontSize: "13px", color: "#555", maxWidth: "320px" }}>{f.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Footer Navigation */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px", paddingTop: "24px", borderTop: "1px solid #e0e0e0" }}>
                <button
                    onClick={() => navigate(`/audit/${auditId}/evidence`)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#666", fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}
                >
                    ← Volver a Evidencia
                </button>
                <button
                    onClick={() => navigate(`/audit/${auditId}/findings`)}
                    disabled={!result}
                    style={{
                        backgroundColor: result ? "#2196F3" : "#ccc", color: "white", border: "none",
                        padding: "12px 24px", borderRadius: "8px", cursor: result ? "pointer" : "not-allowed",
                        fontWeight: "600", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px",
                    }}
                >
                    Continuar a Hallazgos →
                </button>
            </div>
        </div>
    );
}
