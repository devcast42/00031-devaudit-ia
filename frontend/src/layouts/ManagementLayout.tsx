import { Outlet } from "react-router-dom";

export function ManagementLayout() {
    return (
        <div style={{ display: "flex", minHeight: "100vh", width: "100%", backgroundColor: "#f5f5f5" }}>
            {/* Sidebar */}
            <aside style={{
                width: "240px",
                backgroundColor: "white",
                borderRight: "1px solid #e0e0e0",
                padding: "20px",
                position: "fixed",
                height: "100vh",
                left: 0,
                top: 0,
                overflowY: "auto"
            }}>
                <h1 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "40px", color: "#1a1a1a" }}>
                    RepoAudit
                </h1>

                <nav>
                    <div style={{
                        padding: "12px 16px",
                        backgroundColor: "#e3f2fd",
                        borderRadius: "8px",
                        marginBottom: "8px",
                        cursor: "pointer",
                        color: "#1976d2",
                        fontWeight: "500"
                    }}>
                        📋 Audits
                    </div>
                    <div style={{
                        padding: "12px 16px",
                        borderRadius: "8px",
                        marginBottom: "8px",
                        cursor: "pointer",
                        color: "#333",
                        fontWeight: "500"
                    }}>
                        📊 Reports
                    </div>
                    <div style={{
                        padding: "12px 16px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        color: "#333",
                        fontWeight: "500"
                    }}>
                        ⚙️ Settings
                    </div>
                </nav>

                {/* User profile at bottom */}
                <div style={{
                    position: "absolute",
                    bottom: "20px",
                    left: "20px",
                    right: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px"
                }}>
                    <div style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        backgroundColor: "#e0e0e0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        color: "#666"
                    }}>
                        JD
                    </div>
                    <div>
                        <div style={{ fontWeight: "600", fontSize: "14px", color: "#1a1a1a" }}>John Doe</div>
                        <div style={{ fontSize: "12px", color: "#666" }}>Lead Auditor</div>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <main style={{
                flex: 1,
                marginLeft: "240px",
                overflowY: "auto",
                height: "100vh"
            }}>
                <Outlet />
            </main>
        </div>
    );
}
