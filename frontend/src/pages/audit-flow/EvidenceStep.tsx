import { useNavigate } from "react-router-dom";

export function EvidenceStep() {
    const navigate = useNavigate();

    const repos = [
        {
            id: 1,
            name: "backend-service-api",
            branch: "main branch",
            platform: "GitHub",
            platformIcon: "GitHub",
            summary: "145 artifacts collected",
            date: "Oct 24, 2023",
            status: "Complete",
            statusColor: "#4CAF50",
            statusBg: "#E8F5E9"
        },
        {
            id: 2,
            name: "frontend-web-client",
            branch: "production",
            platform: "GitLab",
            platformIcon: "GitLab",
            summary: "89 artifacts collected",
            date: "Oct 24, 2023",
            status: "Complete",
            statusColor: "#4CAF50",
            statusBg: "#E8F5E9"
        },
        {
            id: 3,
            name: "payment-gateway",
            branch: "v2-release",
            platform: "GitHub",
            platformIcon: "GitHub",
            summary: "12 artifacts (Missing logs)",
            alert: true,
            date: "Oct 23, 2023",
            status: "Partial",
            statusColor: "#FF9800",
            statusBg: "#FFF3E0"
        },
        {
            id: 4,
            name: "legacy-auth-server",
            branch: "archived",
            platform: "Legacy",
            platformIcon: "📁",
            summary: "No artifacts detected",
            error: true,
            date: "Oct 20, 2023",
            status: "Insufficient",
            statusColor: "#F44336",
            statusBg: "#FFEBEE"
        },
        {
            id: 5,
            name: "data-pipeline-worker",
            branch: "staging",
            platform: "GitLab",
            platformIcon: "GitLab",
            summary: "203 artifacts collected",
            date: "Oct 26, 2023",
            status: "Complete",
            statusColor: "#4CAF50",
            statusBg: "#E8F5E9"
        },
    ];

    return (
        <div style={{ width: "100%", maxWidth: "1100px", margin: "0 auto" }}>
            {/* Step Info */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "8px" }}>
                <div>
                    <div style={{ fontSize: "12px", fontWeight: "bold", color: "#2196F3", textTransform: "uppercase", marginBottom: "4px" }}>
                        Step 2 of 5 • Evidence Collection
                    </div>
                    <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "#1a1a1a", margin: 0 }}>
                        Evidence Repositories
                    </h2>
                </div>
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "14px", fontWeight: "bold", color: "#1a1a1a", marginBottom: "4px" }}>33% Completed</div>
                    <div style={{ width: "200px", height: "6px", backgroundColor: "#e0e0e0", borderRadius: "3px" }}>
                        <div style={{ width: "33%", height: "100%", backgroundColor: "#2196F3", borderRadius: "3px" }} />
                    </div>
                </div>
            </div>

            <div style={{ height: "1px", backgroundColor: "#e0e0e0", margin: "24px 0" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <p style={{ color: "#666", fontSize: "14px", maxWidth: "600px", margin: 0 }}>
                    Review and validate the automated evidence collected from your source control systems. Ensure all required artifacts for compliance are present before proceeding to analysis.
                </p>
                <div style={{ display: "flex", gap: "12px" }}>
                    <button style={{ padding: "8px 16px", border: "1px solid #e0e0e0", borderRadius: "6px", backgroundColor: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", color: "#333", fontWeight: "500" }}>
                        <span>Filter</span>
                    </button>
                    <button style={{ padding: "8px 16px", border: "1px solid #e0e0e0", borderRadius: "6px", backgroundColor: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", color: "#333", fontWeight: "500" }}>
                        <span>Export</span>
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e0e0e0", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid #e0e0e0", backgroundColor: "#fafafa" }}>
                            <th style={{ textAlign: "left", padding: "16px", fontSize: "12px", fontWeight: "700", color: "#999", textTransform: "uppercase" }}>Repository Name</th>
                            <th style={{ textAlign: "left", padding: "16px", fontSize: "12px", fontWeight: "700", color: "#999", textTransform: "uppercase" }}>Platform</th>
                            <th style={{ textAlign: "left", padding: "16px", fontSize: "12px", fontWeight: "700", color: "#999", textTransform: "uppercase" }}>Evidence Summary</th>
                            <th style={{ textAlign: "left", padding: "16px", fontSize: "12px", fontWeight: "700", color: "#999", textTransform: "uppercase" }}>Detection Date</th>
                            <th style={{ textAlign: "left", padding: "16px", fontSize: "12px", fontWeight: "700", color: "#999", textTransform: "uppercase" }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {repos.map((repo) => (
                            <tr key={repo.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                                <td style={{ padding: "16px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #eee", fontSize: "18px" }}>
                                            💻
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: "600", color: "#1a1a1a", fontSize: "14px" }}>{repo.name}</div>
                                            <div style={{ fontSize: "12px", color: "#999" }}>{repo.branch}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: "16px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#333" }}>
                                        <span style={{ fontSize: "16px" }}>{repo.platformIcon === "GitHub" ? "🐙" : repo.platformIcon === "GitLab" ? "🦊" : repo.platformIcon}</span>
                                        {repo.platform}
                                    </div>
                                </td>
                                <td style={{ padding: "16px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: repo.error ? "#F44336" : repo.alert ? "#FF9800" : "#666" }}>
                                        <span>{repo.error ? "🚫" : "📄"}</span>
                                        {repo.summary}
                                    </div>
                                </td>
                                <td style={{ padding: "16px", fontSize: "14px", color: "#666" }}>
                                    {repo.date}
                                </td>
                                <td style={{ padding: "16px" }}>
                                    <span style={{
                                        padding: "6px 16px",
                                        borderRadius: "20px",
                                        fontSize: "12px",
                                        fontWeight: "600",
                                        color: repo.statusColor,
                                        backgroundColor: repo.statusBg
                                    }}>
                                        {repo.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer Navigation */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "40px",
                paddingTop: "24px",
                borderTop: "1px solid #e0e0e0"
            }}>
                <button
                    onClick={() => navigate("/audit/new/scope")}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#666", fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}
                >
                    ← Back to Configuration
                </button>
                <button
                    onClick={() => navigate("/audit/new/analysis")}
                    style={{ backgroundColor: "#2196F3", color: "white", border: "none", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}
                >
                    Continue to Analysis →
                </button>
            </div>
        </div>
    );
}
