import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client from "../../app/api";

interface Practice {
    id: string;
    practice_code: string;
    practice_name: string;
    score: number;
    max_score: number;
    maturity_level: number;
}

interface Finding {
    id: string;
    practice_code: string;
    severity: "low" | "medium" | "high";
    description: string;
}

interface AnalysisResult {
    global_maturity_level: number;
    practices: Practice[];
    findings: Finding[];
}

export function AnalysisStep() {
    const navigate = useNavigate();
    const { id: auditId } = useParams();
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Try to load existing analysis on mount
    useEffect(() => {
        if (auditId) {
            client
                .get(`/audits/${auditId}/analysis`)
                .then((res) => setResult(res.data))
                .catch(() => {
                    /* no existing analysis */
                });
        }
    }, [auditId]);

    const handleRunAnalysis = async () => {
        setIsRunning(true);
        setError(null);
        try {
            const res = await client.post(`/audits/${auditId}/analysis`);
            setResult(res.data);
        } catch (err: any) {
            setError(
                err.response?.data?.error ||
                "Failed to run analysis. Make sure evidence has been collected."
            );
        } finally {
            setIsRunning(false);
        }
    };

    const maturityLabel = (level: number) => {
        switch (level) {
            case 1:
                return "Inicial";
            case 2:
                return "Gestionado";
            case 3:
                return "Definido";
            default:
                return "Desconocido";
        }
    };

    const maturityColor = (level: number) => {
        switch (level) {
            case 1:
                return "#EF5350";
            case 2:
                return "#FFA726";
            case 3:
                return "#66BB6A";
            default:
                return "#999";
        }
    };

    const severityBadge = (severity: string) => {
        const colors: Record<string, { bg: string; text: string }> = {
            high: { bg: "#FFEBEE", text: "#C62828" },
            medium: { bg: "#FFF3E0", text: "#E65100" },
            low: { bg: "#E8F5E9", text: "#2E7D32" },
        };
        const c = colors[severity] || colors.low;
        return (
            <span
                style={{
                    padding: "4px 12px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "600",
                    backgroundColor: c.bg,
                    color: c.text,
                    textTransform: "uppercase",
                }}
            >
                {severity}
            </span>
        );
    };

    return (
        <div style={{ width: "100%", maxWidth: "1100px", margin: "0 auto" }}>
            {/* Step Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    marginBottom: "8px",
                }}
            >
                <div>
                    <div
                        style={{
                            fontSize: "12px",
                            fontWeight: "bold",
                            color: "#2196F3",
                            textTransform: "uppercase",
                            marginBottom: "4px",
                        }}
                    >
                        Paso 3 de 5 • Análisis
                    </div>
                    <h2
                        style={{
                            fontSize: "28px",
                            fontWeight: "bold",
                            color: "#1a1a1a",
                            margin: 0,
                        }}
                    >
                        Análisis de Auditoría
                    </h2>
                </div>
                <div style={{ textAlign: "right" }}>
                    <div
                        style={{
                            fontSize: "14px",
                            fontWeight: "bold",
                            color: "#1a1a1a",
                            marginBottom: "4px",
                        }}
                    >
                        50% Completado
                    </div>
                    <div
                        style={{
                            width: "200px",
                            height: "6px",
                            backgroundColor: "#e0e0e0",
                            borderRadius: "3px",
                        }}
                    >
                        <div
                            style={{
                                width: "50%",
                                height: "100%",
                                backgroundColor: "#2196F3",
                                borderRadius: "3px",
                            }}
                        />
                    </div>
                </div>
            </div>

            <div
                style={{
                    height: "1px",
                    backgroundColor: "#e0e0e0",
                    margin: "24px 0",
                }}
            />

            {/* Run Analysis Button */}
            {!result && (
                <div
                    style={{
                        backgroundColor: "white",
                        borderRadius: "12px",
                        border: "1px solid #e0e0e0",
                        padding: "60px",
                        textAlign: "center",
                        marginBottom: "24px",
                    }}
                >
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>
                        🔬
                    </div>
                    <h3
                        style={{
                            margin: "0 0 8px 0",
                            color: "#333",
                            fontSize: "20px",
                        }}
                    >
                        Listo para Analizar
                    </h3>
                    <p
                        style={{
                            margin: "0 0 24px 0",
                            fontSize: "14px",
                            color: "#666",
                            maxWidth: "500px",
                            marginLeft: "auto",
                            marginRight: "auto",
                        }}
                    >
                        El motor de análisis evaluará sus métricas de repositorio contra las prácticas de desarrollo de software establecidas y calculará los niveles de madurez.
                    </p>
                    <button
                        onClick={handleRunAnalysis}
                        disabled={isRunning}
                        style={{
                            backgroundColor: isRunning ? "#90CAF9" : "#2196F3",
                            color: "white",
                            border: "none",
                            padding: "14px 32px",
                            borderRadius: "8px",
                            cursor: isRunning ? "not-allowed" : "pointer",
                            fontWeight: "600",
                            fontSize: "16px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        {isRunning
                            ? "⏳ Ejecutando Análisis..."
                            : "▶ Ejecutar Análisis"}
                    </button>
                    {error && (
                        <p
                            style={{
                                marginTop: "16px",
                                color: "#C62828",
                                fontSize: "14px",
                            }}
                        >
                            {error}
                        </p>
                    )}
                </div>
            )}

            {/* Results Dashboard */}
            {result && (
                <>
                    {/* Global Maturity Level */}
                    <div
                        style={{
                            backgroundColor: "white",
                            borderRadius: "12px",
                            border: "1px solid #e0e0e0",
                            padding: "32px",
                            marginBottom: "24px",
                            display: "flex",
                            alignItems: "center",
                            gap: "32px",
                        }}
                    >
                        <div
                            style={{
                                width: "80px",
                                height: "80px",
                                borderRadius: "50%",
                                backgroundColor:
                                    maturityColor(
                                        result.global_maturity_level
                                    ) + "22",
                                border: `3px solid ${maturityColor(
                                    result.global_maturity_level
                                )}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "28px",
                                    fontWeight: "bold",
                                    color: maturityColor(
                                        result.global_maturity_level
                                    ),
                                }}
                            >
                                {result.global_maturity_level}
                            </span>
                        </div>
                        <div>
                            <div
                                style={{
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    color: "#999",
                                    textTransform: "uppercase",
                                    marginBottom: "4px",
                                }}
                            >
                                Nivel de Madurez Global
                            </div>
                            <div
                                style={{
                                    fontSize: "24px",
                                    fontWeight: "bold",
                                    color: "#1a1a1a",
                                }}
                            >
                                Nivel {result.global_maturity_level} —{" "}
                                {maturityLabel(result.global_maturity_level)}
                            </div>
                            <div
                                style={{
                                    fontSize: "14px",
                                    color: "#666",
                                    marginTop: "4px",
                                }}
                            >
                                Basado en {result.practices.length} prácticas evaluadas • {result.findings.length} hallazgos generados
                            </div>
                        </div>
                        <div style={{ marginLeft: "auto" }}>
                            <button
                                onClick={handleRunAnalysis}
                                disabled={isRunning}
                                style={{
                                    padding: "8px 16px",
                                    border: "1px solid #e0e0e0",
                                    borderRadius: "6px",
                                    backgroundColor: "white",
                                    cursor: "pointer",
                                    fontWeight: "500",
                                    fontSize: "13px",
                                    color: "#333",
                                }}
                            >
                                {isRunning ? "Re-ejecutando..." : "🔄 Re-analizar"}
                            </button>
                        </div>
                    </div>

                    {/* Practice Cards */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fill, minmax(320px, 1fr))",
                            gap: "16px",
                            marginBottom: "24px",
                        }}
                    >
                        {result.practices.map((practice) => (
                            <div
                                key={practice.id}
                                style={{
                                    backgroundColor: "white",
                                    borderRadius: "12px",
                                    border: "1px solid #e0e0e0",
                                    padding: "24px",
                                    position: "relative",
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: "4px",
                                        backgroundColor: maturityColor(
                                            practice.maturity_level
                                        ),
                                    }}
                                />
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        marginBottom: "16px",
                                    }}
                                >
                                    <div>
                                        <div
                                            style={{
                                                fontSize: "11px",
                                                fontWeight: "700",
                                                color: "#999",
                                                textTransform: "uppercase",
                                                marginBottom: "4px",
                                            }}
                                        >
                                            {practice.practice_code}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "16px",
                                                fontWeight: "bold",
                                                color: "#1a1a1a",
                                            }}
                                        >
                                            {practice.practice_name}
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            backgroundColor:
                                                maturityColor(
                                                    practice.maturity_level
                                                ) + "22",
                                            color: maturityColor(
                                                practice.maturity_level
                                            ),
                                            padding: "6px 12px",
                                            borderRadius: "16px",
                                            fontSize: "12px",
                                            fontWeight: "700",
                                        }}
                                    >
                                        Nivel{" "}
                                        {practice.maturity_level}
                                    </div>
                                </div>

                                {/* Score Bar */}
                                <div style={{ marginBottom: "8px" }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            fontSize: "12px",
                                            color: "#666",
                                            marginBottom: "6px",
                                        }}
                                    >
                                        <span>Puntaje</span>
                                        <span>
                                            {practice.score} /{" "}
                                            {practice.max_score}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            height: "8px",
                                            backgroundColor: "#f0f0f0",
                                            borderRadius: "4px",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <div
                                            style={{
                                                height: "100%",
                                                width: `${(practice.score /
                                                    practice.max_score) *
                                                    100
                                                    }%`,
                                                backgroundColor: maturityColor(
                                                    practice.maturity_level
                                                ),
                                                borderRadius: "4px",
                                                transition:
                                                    "width 0.5s ease",
                                            }}
                                        />
                                    </div>
                                </div>

                                <div
                                    style={{
                                        fontSize: "13px",
                                        color: "#999",
                                        fontWeight: "500",
                                    }}
                                >
                                    {maturityLabel(practice.maturity_level)}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Findings Table */}
                    {result.findings.length > 0 && (
                        <div
                            style={{
                                backgroundColor: "white",
                                borderRadius: "12px",
                                border: "1px solid #e0e0e0",
                                overflow: "hidden",
                                marginBottom: "24px",
                            }}
                        >
                            <div
                                style={{
                                    padding: "16px 24px",
                                    borderBottom: "1px solid #e0e0e0",
                                    backgroundColor: "#fafafa",
                                }}
                            >
                                <h3
                                    style={{
                                        margin: 0,
                                        fontSize: "16px",
                                        fontWeight: "bold",
                                        color: "#1a1a1a",
                                    }}
                                >
                                    📋 Hallazgos ({result.findings.length})
                                </h3>
                            </div>
                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                }}
                            >
                                <thead>
                                    <tr
                                        style={{
                                            borderBottom: "1px solid #e0e0e0",
                                        }}
                                    >
                                        <th
                                            style={{
                                                textAlign: "left",
                                                padding: "12px 24px",
                                                fontSize: "12px",
                                                fontWeight: "700",
                                                color: "#999",
                                                textTransform: "uppercase",
                                            }}
                                        >
                                            Práctica
                                        </th>
                                        <th
                                            style={{
                                                textAlign: "left",
                                                padding: "12px 24px",
                                                fontSize: "12px",
                                                fontWeight: "700",
                                                color: "#999",
                                                textTransform: "uppercase",
                                            }}
                                        >
                                            Severidad
                                        </th>
                                        <th
                                            style={{
                                                textAlign: "left",
                                                padding: "12px 24px",
                                                fontSize: "12px",
                                                fontWeight: "700",
                                                color: "#999",
                                                textTransform: "uppercase",
                                            }}
                                        >
                                            Descripción
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.findings.map((finding) => (
                                        <tr
                                            key={finding.id}
                                            style={{
                                                borderBottom:
                                                    "1px solid #f0f0f0",
                                            }}
                                        >
                                            <td
                                                style={{
                                                    padding: "16px 24px",
                                                    fontSize: "14px",
                                                    fontWeight: "600",
                                                    color: "#333",
                                                }}
                                            >
                                                {finding.practice_code}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "16px 24px",
                                                }}
                                            >
                                                {severityBadge(
                                                    finding.severity
                                                )}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "16px 24px",
                                                    fontSize: "14px",
                                                    color: "#555",
                                                }}
                                            >
                                                {finding.description}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Footer Navigation */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "40px",
                    paddingTop: "24px",
                    borderTop: "1px solid #e0e0e0",
                }}
            >
                <button
                    onClick={() => navigate(`/audit/${auditId}/evidence`)}
                    style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#666",
                        fontSize: "14px",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    ← Volver a Evidencia
                </button>
                <button
                    onClick={() => navigate(`/audit/${auditId}/findings`)}
                    disabled={!result}
                    style={{
                        backgroundColor: result ? "#2196F3" : "#ccc",
                        color: "white",
                        border: "none",
                        padding: "12px 24px",
                        borderRadius: "8px",
                        cursor: result ? "pointer" : "not-allowed",
                        fontWeight: "600",
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    Continuar a Hallazgos →
                </button>
            </div>
        </div>
    );
}
