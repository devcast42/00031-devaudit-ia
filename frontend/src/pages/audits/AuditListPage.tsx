export function AuditListPage() {
    const audits = [
        { id: 1, name: "Q3 Process Audit", org: "Acme Corp", standard: "ISO/IEC 12207", status: "In Progress", updated: "Today, 10:23 AM" },
        { id: 2, name: "Compliance Check 2023", org: "Globex Inc", standard: "ISO/IEC 12207", status: "Completed", updated: "Yesterday, 4:15 PM" },
        { id: 3, name: "Internal Review Alpha", org: "Soylent Corp", standard: "ISO/IEC 12207", status: "Draft", updated: "Oct 24, 2023" },
        { id: 4, name: "Security Standards v2", org: "Initech", standard: "ISO/IEC 12207", status: "Completed", updated: "Oct 20, 2023" },
    ];

    return (
        <div style={{ padding: "40px 60px", maxWidth: "100%" }}>
            {/* Header */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "40px"
            }}>
                <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "#1a1a1a" }}>Audit Management</h1>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <button style={{
                        backgroundColor: "#2196F3",
                        color: "white",
                        border: "none",
                        padding: "12px 24px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "14px"
                    }}>
                        + New Audit
                    </button>
                </div>
            </div>

            {/* Dashboard Overview */}
            <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px", color: "#1a1a1a" }}>
                Dashboard Overview
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
                        Pending Audits
                    </div>
                    <div style={{ fontSize: "36px", fontWeight: "bold", color: "#1a1a1a" }}>12</div>
                </div>

                <div style={{
                    backgroundColor: "white",
                    padding: "24px",
                    borderRadius: "12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                }}>
                    <div style={{ color: "#666", fontSize: "14px", marginBottom: "8px" }}>
                        Completed (YTD)
                    </div>
                    <div style={{ fontSize: "36px", fontWeight: "bold", color: "#1a1a1a" }}>85</div>
                </div>

                <div style={{
                    backgroundColor: "white",
                    padding: "24px",
                    borderRadius: "12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                }}>
                    <div style={{ color: "#666", fontSize: "14px", marginBottom: "8px" }}>
                        Overdue Actions
                    </div>
                    <div style={{ fontSize: "36px", fontWeight: "bold", color: "#f44336" }}>2</div>
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
                    <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "#1a1a1a" }}>Recent Audits</h3>
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
                            🔍 Filter
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
                            📥 Export
                        </button>
                    </div>
                </div>

                {/* Table */}
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ borderBottom: "2px solid #f0f0f0" }}>
                            <th style={{ textAlign: "left", padding: "12px", color: "#666", fontWeight: "600" }}>
                                Audit Name
                            </th>
                            <th style={{ textAlign: "left", padding: "12px", color: "#666", fontWeight: "600" }}>
                                Organization
                            </th>
                            <th style={{ textAlign: "left", padding: "12px", color: "#666", fontWeight: "600" }}>
                                Standard
                            </th>
                            <th style={{ textAlign: "left", padding: "12px", color: "#666", fontWeight: "600" }}>
                                Status
                            </th>
                            <th style={{ textAlign: "left", padding: "12px", color: "#666", fontWeight: "600" }}>
                                Last Updated
                            </th>
                            <th style={{ textAlign: "left", padding: "12px", color: "#666", fontWeight: "600" }}>
                                Actions
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
                                <td style={{ padding: "16px", color: "#333" }}>{audit.org}</td>
                                <td style={{ padding: "16px", color: "#333" }}>{audit.standard}</td>
                                <td style={{ padding: "16px" }}>
                                    <span style={{
                                        padding: "4px 12px",
                                        borderRadius: "12px",
                                        fontSize: "12px",
                                        fontWeight: "600",
                                        backgroundColor: audit.status === "Completed" ? "#e8f5e9" :
                                            audit.status === "In Progress" ? "#e3f2fd" : "#f5f5f5",
                                        color: audit.status === "Completed" ? "#2e7d32" :
                                            audit.status === "In Progress" ? "#1976d2" : "#666"
                                    }}>
                                        {audit.status}
                                    </span>
                                </td>
                                <td style={{ padding: "16px", color: "#666" }}>{audit.updated}</td>
                                <td style={{ padding: "16px" }}>
                                    <button style={{
                                        border: "none",
                                        background: "none",
                                        cursor: "pointer",
                                        fontSize: "18px",
                                        color: "#666",
                                        fontWeight: "bold",
                                        padding: "4px 8px"
                                    }}>
                                        •••
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "20px",
                    color: "#666",
                    fontSize: "14px"
                }}>
                    <div>Showing 1 to 4 of 12 results</div>
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
                            Previous
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
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
