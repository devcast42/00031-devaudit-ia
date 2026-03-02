import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { AuditService } from "../services/audit.service";

export function AuditFlowLayout() {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();

    const steps = [
        { label: "Alcance", path: "scope" },
        { label: "Evidencia", path: "evidence" },
        { label: "Análisis", path: "analysis" },
        { label: "Hallazgos", path: "findings" },
        { label: "Informe", path: "report" },
    ];

    const currentStepIndex = steps.findIndex(step => location.pathname.includes(step.path));

    // Track the furthest step reached to allow navigating forward to visited steps
    const [maxStepReached, setMaxStepReached] = useState(currentStepIndex);
    const [auditLoaded, setAuditLoaded] = useState(false);

    // Fetch initial audit state
    useEffect(() => {
        if (id && id !== "new") {
            AuditService.getAuditById(id).then(audit => {
                const step = audit.currentStep || 0;
                // Only set if backend has a further step than current (though usually they should match on load)
                setMaxStepReached(prev => Math.max(prev, step));
                setAuditLoaded(true);
            }).catch(err => {
                console.error("Failed to load audit", err);
                // Handle error (e.g. redirect to list)
            });
        } else if (id === "new") {
            setAuditLoaded(true);
        }
    }, [id]);

    // Update local state and backend when advancing
    useEffect(() => {
        if (currentStepIndex > maxStepReached) {
            setMaxStepReached(currentStepIndex);

            // Persist to backend
            if (id) {
                AuditService.updateAudit(id, { currentStep: currentStepIndex })
                    .catch(err => console.error("Failed to update audit progress", err));
            }
        }
    }, [currentStepIndex, maxStepReached, id]);

    if (!auditLoaded && id && id !== "new") {
        return <div style={{ padding: "40px", textAlign: "center" }}>Cargando auditoría...</div>;
    }

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f9f9f9", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <header style={{
                backgroundColor: "white",
                padding: "12px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid #e0e0e0"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                    <div
                        onClick={() => navigate("/")}
                        style={{ display: "flex", alignItems: "center", gap: "12px", borderRight: "1px solid #eee", paddingRight: "24px", cursor: "pointer" }}
                    >
                        <span style={{ fontWeight: "bold", fontSize: "16px", color: "#1a1a1a" }}>DevAudit IA</span>
                    </div>
                    <span style={{ fontSize: "14px", color: "#666" }}>Ejecución de Auditoría</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                    <span style={{ cursor: "pointer", fontSize: "20px", color: "#666" }}>❓</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "14px", fontWeight: "bold", color: "#1a1a1a" }}>Jane Auditor</div>
                            <div style={{ fontSize: "12px", color: "#666" }}>Evaluador Principal</div>
                        </div>
                        <div style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            backgroundColor: "#2196F3",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "bold",
                            fontSize: "14px"
                        }}>
                            JA
                        </div>
                    </div>
                </div>
            </header>

            {/* Stepper */}
            <div style={{
                padding: "40px 0",
                backgroundColor: "white",
                display: "flex",
                justifyContent: "center",
                borderBottom: "1px solid #e0e0e0"
            }}>
                <div style={{ display: "flex", alignItems: "center", width: "80%", maxWidth: "800px", justifyContent: "space-between", position: "relative" }}>
                    {/* Progress Line */}
                    <div style={{
                        position: "absolute",
                        top: "16px",
                        left: "40px",
                        right: "40px",
                        height: "2px",
                        backgroundColor: "#e0e0e0",
                        zIndex: 0
                    }} />
                    <div style={{
                        position: "absolute",
                        top: "16px",
                        left: "40px",
                        width: `${(currentStepIndex / (steps.length - 1)) * (100 - (80 / 800 * 100))}%`, // Simplified calc
                        height: "2px",
                        backgroundColor: "#2196F3",
                        zIndex: 0,
                        transition: "width 0.3s ease"
                    }} />

                    {steps.map((step, index) => {
                        const isActive = index === currentStepIndex;
                        const isCompleted = index < currentStepIndex;
                        const isLocked = index > maxStepReached;
                        const isAvailable = index <= maxStepReached && !isActive; // Clickable if not active and not locked

                        return (
                            <div
                                key={step.label}
                                onClick={() => isAvailable && navigate(step.path)}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    zIndex: 1,
                                    width: "80px",
                                    cursor: isAvailable ? "pointer" : (isLocked ? "not-allowed" : "default"),
                                    opacity: isLocked ? 0.6 : 1
                                }}
                            >
                                <div style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    backgroundColor: isActive || isCompleted ? "#2196F3" : "white",
                                    border: isActive || isCompleted ? "none" : (
                                        !isLocked ? "2px solid #2196F3" : "2px solid #e0e0e0"
                                    ),
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: isActive || isCompleted ? "white" : (
                                        !isLocked ? "#2196F3" : "#999"
                                    ),
                                    fontWeight: "bold",
                                    fontSize: "14px",
                                    marginBottom: "8px",
                                    boxShadow: isActive ? "0 0 0 4px rgba(33, 150, 243, 0.2)" : "none"
                                }}>
                                    {isCompleted ? "✓" : index + 1}
                                </div>
                                <span style={{
                                    fontSize: "12px",
                                    fontWeight: isActive || isAvailable ? "bold" : "500",
                                    color: isActive || isAvailable ? "#2196F3" : "#999"
                                }}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Content area */}
            <main style={{ flex: 1, padding: "40px", display: "flex", justifyContent: "center" }}>
                <div style={{ width: "100%", maxWidth: "900px" }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
