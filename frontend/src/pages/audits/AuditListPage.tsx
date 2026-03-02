import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AuditService, type Audit } from "../../services/audit.service";
import dayjs from "dayjs";

export function AuditListPage() {
    const navigate = useNavigate();
    const [audits, setAudits] = useState<Audit[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAudits = async () => {
            try {
                const data = await AuditService.getAudits();
                setAudits(data);
            } catch (error) {
                console.error("Failed to fetch audits:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAudits();
    }, []);

    // Helper to format date
    const formatDate = (dateString: string) => {
        return dayjs(dateString).format("MMM D, YYYY h:mm A");
    };

    const handleContinue = (audit: Audit) => {
        const steps = ["scope", "evidence", "analysis", "findings", "report"];
        const stepIndex = audit.currentStep || 0;
        const stepPath = steps[stepIndex] || "scope";
        navigate(`/audit/${audit.id}/${stepPath}`);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("¿Está seguro de que desea eliminar esta auditoría?")) {
            try {
                await AuditService.deleteAudit(id);
                setAudits(prev => prev.filter(a => a.id !== id));
            } catch (error) {
                console.error("Failed to delete audit:", error);
                alert("Error al eliminar la auditoría");
            }
        }
    };

    return (
        <div style={{ padding: "40px 60px", maxWidth: "100%" }}>
            {/* Header */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "40px"
            }}>
                <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1a1a1a" }}>Gestión de Auditorías</h1>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <button
                        onClick={() => navigate("/audit/new/scope")}
                        style={{
                            backgroundColor: "#2196F3",
                            color: "white",
                            border: "none",
                            padding: "12px 24px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "14px"
                        }}>
                        + Nueva Auditoría
                    </button>
                </div>
            </div>

            {/* Dashboard Overview */}
            <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px", color: "#1a1a1a" }}>
                Resumen del Panel
            </h2>

            {/* Stats Cards */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "20px",
                marginBottom: "40px"
            }}>
                <div style={{
                    backgroundColor: "white",
                    padding: "24px",
                    borderRadius: "12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                }}>
                    <div style={{ color: "#666", fontSize: "14px", marginBottom: "8px" }}>
                        Auditorías Pendientes
                    </div>
                    <div style={{ fontSize: "36px", fontWeight: "bold", color: "#1a1a1a" }}>{audits.filter(a => a.status !== 'Completed').length}</div>
                </div>

                <div style={{
                    backgroundColor: "white",
                    padding: "24px",
                    borderRadius: "12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                }}>
                    <div style={{ color: "#666", fontSize: "14px", marginBottom: "8px" }}>
                        Completadas (Año Actual)
                    </div>
                    <div style={{ fontSize: "36px", fontWeight: "bold", color: "#1a1a1a" }}>{audits.filter(a => a.status === 'Completed').length}</div>
                </div>

                <div style={{
                    backgroundColor: "white",
                    padding: "24px",
                    borderRadius: "12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                }}>
                    <div style={{ color: "#666", fontSize: "14px", marginBottom: "8px" }}>
                        Total de Auditorías
                    </div>
                    <div style={{ fontSize: "36px", fontWeight: "bold", color: "#1a1a1a" }}>{audits.length}</div>
                </div>
            </div>

            {/* Recent Audits Table */}
            <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px" }}>
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px"
                }}>
                    <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#1a1a1a" }}>Auditorías Recientes</h3>
                    <div style={{ display: "flex", gap: "12px" }}>
                        <button style={{
                            padding: "8px 16px",
                            border: "1px solid #e0e0e0",
                            borderRadius: "6px",
                            backgroundColor: "white",
                            cursor: "pointer",
                            color: "#333",
                            fontWeight: "500"
                        }}>
                            🔍 Filtrar
                        </button>
                        <button style={{
                            padding: "8px 16px",
                            border: "1px solid #e0e0e0",
                            borderRadius: "6px",
                            backgroundColor: "white",
                            cursor: "pointer",
                            color: "#333",
                            fontWeight: "500"
                        }}>
                            📥 Exportar
                        </button>
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>Cargando auditorías...</div>
                ) : audits.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>No se encontraron auditorías. Cree una para comenzar.</div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "2px solid #f0f0f0" }}>
                                <th style={{ textAlign: "left", padding: "12px", color: "#666", fontWeight: "600" }}>
                                    Nombre de la Auditoría
                                </th>
                                <th style={{ textAlign: "left", padding: "12px", color: "#666", fontWeight: "600" }}>
                                    Organización
                                </th>
                                <th style={{ textAlign: "left", padding: "12px", color: "#666", fontWeight: "600" }}>
                                    Estándar
                                </th>
                                <th style={{ textAlign: "left", padding: "12px", color: "#666", fontWeight: "600" }}>
                                    Estado
                                </th>
                                <th style={{ textAlign: "left", padding: "12px", color: "#666", fontWeight: "600" }}>
                                    Última Actualización
                                </th>
                                <th style={{ textAlign: "left", padding: "12px", color: "#666", fontWeight: "600" }}>
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {audits.map((audit) => (
                                <tr key={audit.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                                    <td style={{ padding: "16px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <span>📄</span>
                                            <span style={{ fontWeight: "600", color: "#1a1a1a" }}>{audit.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: "16px", color: "#333" }}>{audit.organization}</td>
                                    <td style={{ padding: "16px", color: "#333" }}>{audit.complianceStandard}</td>
                                    <td style={{ padding: "16px" }}>
                                        <span style={{
                                            padding: "4px 12px",
                                            borderRadius: "12px",
                                            fontSize: "12px",
                                            fontWeight: "600",
                                            backgroundColor: audit.status === "Completed" ? "#e8f5e9" :
                                                audit.status === "In Progress" ? "#e3f2fd" : "#f5f5f5",
                                            color: audit.status === "Completed" ? "#2e7d32" :
                                                status === "In Progress" ? "#1976d2" : "#666"
                                        }}>
                                            {audit.status === "Completed" ? "Completada" :
                                                status === "In Progress" ? "En Progreso" : audit.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: "16px", color: "#666" }}>{formatDate(audit.updatedAt)}</td>
                                    <td style={{ padding: "16px" }}>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <button
                                                onClick={() => handleContinue(audit)}
                                                style={{
                                                    border: "1px solid #2196F3",
                                                    backgroundColor: "white",
                                                    color: "#2196F3",
                                                    cursor: "pointer",
                                                    fontSize: "12px",
                                                    fontWeight: "600",
                                                    padding: "6px 12px",
                                                    borderRadius: "4px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "4px"
                                                }}
                                                title="Continue Audit"
                                            >
                                                ▶ Continuar
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(e, audit.id)}
                                                style={{
                                                    border: "none",
                                                    backgroundColor: "#ffebee",
                                                    color: "#d32f2f",
                                                    cursor: "pointer",
                                                    fontSize: "14px",
                                                    padding: "6px 10px",
                                                    borderRadius: "4px"
                                                }}
                                                title="Delete Audit"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "20px",
                    color: "#666",
                    fontSize: "14px"
                }}>
                    <div>Mostrando {audits.length} resultados</div>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button style={{
                            padding: "8px 16px",
                            border: "1px solid #e0e0e0",
                            borderRadius: "6px",
                            backgroundColor: "white",
                            cursor: "pointer",
                            color: "#333",
                            fontWeight: "500"
                        }}>
                            Anterior
                        </button>
                        <button style={{
                            padding: "8px 16px",
                            border: "1px solid #e0e0e0",
                            borderRadius: "6px",
                            backgroundColor: "white",
                            cursor: "pointer",
                            color: "#333",
                            fontWeight: "500"
                        }}>
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
