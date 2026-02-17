import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { AuditService, type CreateAuditDto } from "../../services/audit.service";

export function ScopeStep() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id && id !== "new";

    const [formData, setFormData] = useState<CreateAuditDto>({
        name: "Q3 Software Process Assessment",
        organization: "TechFlow Solutions Inc.",
        reviewPeriod: "Jan 01, 2024 - Mar 31, 2024",
        complianceStandard: "ISO/IEC 12207:2017 - Software Life Cycle Processes"
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isEditMode && id) {
            setIsLoading(true);
            AuditService.getAuditById(id)
                .then(audit => {
                    setFormData({
                        name: audit.name,
                        organization: audit.organization,
                        reviewPeriod: audit.reviewPeriod,
                        complianceStandard: audit.complianceStandard
                    });
                })
                .catch(error => {
                    console.error("Failed to fetch audit details:", error);
                    alert("Failed to load audit details.");
                })
                .finally(() => setIsLoading(false));
        }
    }, [id, isEditMode]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        try {
            setIsLoading(true);
            if (isEditMode && id) {
                await AuditService.updateAudit(id, formData);
                // If editing, we might want to stay here or go to next step. 
                // Going to next step seems appropriate for "Continue".
                navigate(`/audit/${id}/evidence`);
            } else {
                const newAudit = await AuditService.createAudit(formData);
                navigate(`/audit/${newAudit.id}/evidence`);
            }
        } catch (error) {
            console.error("Failed to save audit:", error);
            alert("Failed to save audit. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            backgroundColor: "white",
            padding: "48px",
            borderRadius: "12px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            width: "100%"
        }}>
            <h2 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "16px", color: "#1a1a1a" }}>
                {isEditMode ? "Edit Scope" : "Scope Definition"}
            </h2>
            <p style={{ color: "#666", fontSize: "16px", marginBottom: "40px", lineHeight: "1.5" }}>
                Define the boundaries and reference standards for this audit session based on ISO/IEC 12207.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Audit Name */}
                <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#333", marginBottom: "8px", textTransform: "uppercase" }}>
                        Audit Name
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        style={{
                            width: "100%",
                            padding: "12px 16px",
                            borderRadius: "8px",
                            border: "1px solid #e0e0e0",
                            fontSize: "16px",
                            color: "#333",
                            backgroundColor: "#fcfcfc"
                        }}
                    />
                </div>

                {/* Organization and Period Row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#333", marginBottom: "8px", textTransform: "uppercase" }}>
                            Organization
                        </label>
                        <div style={{ position: "relative" }}>
                            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#999" }}>🏢</span>
                            <input
                                type="text"
                                name="organization"
                                value={formData.organization}
                                onChange={handleChange}
                                style={{
                                    width: "100%",
                                    padding: "12px 16px 12px 40px",
                                    borderRadius: "8px",
                                    border: "1px solid #e0e0e0",
                                    fontSize: "16px",
                                    color: "#333",
                                    backgroundColor: "#fcfcfc"
                                }}
                            />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#333", marginBottom: "8px", textTransform: "uppercase" }}>
                            Review Period
                        </label>
                        <div style={{ position: "relative" }}>
                            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#999" }}>📅</span>
                            <input
                                type="text"
                                name="reviewPeriod"
                                value={formData.reviewPeriod}
                                onChange={handleChange}
                                style={{
                                    width: "100%",
                                    padding: "12px 16px 12px 40px",
                                    borderRadius: "8px",
                                    border: "1px solid #e0e0e0",
                                    fontSize: "16px",
                                    color: "#333",
                                    backgroundColor: "#fcfcfc"
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Compliance Standard */}
                <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#333", marginBottom: "8px", textTransform: "uppercase" }}>
                        Compliance Standard
                    </label>
                    <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#999" }}>⚙️</span>
                        <select
                            name="complianceStandard"
                            value={formData.complianceStandard}
                            onChange={handleChange}
                            style={{
                                width: "100%",
                                padding: "12px 40px 12px 40px",
                                borderRadius: "8px",
                                border: "1px solid #e0e0e0",
                                fontSize: "16px",
                                color: "#333",
                                backgroundColor: "#fcfcfc",
                                appearance: "none"
                            }}>
                            <option>ISO/IEC 12207:2017 - Software Life Cycle Processes</option>
                        </select>
                        <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#999" }}>⌄</span>
                    </div>
                </div>

                {/* Action Button */}
                <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        style={{
                            backgroundColor: isLoading ? "#ccc" : "#2196F3",
                            color: "white",
                            border: "none",
                            padding: "12px 32px",
                            borderRadius: "8px",
                            cursor: isLoading ? "not-allowed" : "pointer",
                            fontWeight: "600",
                            fontSize: "16px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}
                    >
                        {isLoading ? "Saving..." : (isEditMode ? "Save & Continue →" : "Create & Continue →")}
                    </button>
                </div>
            </div>
        </div>
    );
}
