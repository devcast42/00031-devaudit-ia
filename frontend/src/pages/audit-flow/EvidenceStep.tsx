import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import client from "../../app/api";

export function EvidenceStep() {
    const navigate = useNavigate();
    const { id: auditId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(!!localStorage.getItem('github_token'));
    const [isLoadingRepos, setIsLoadingRepos] = useState(false);
    const [repos, setRepos] = useState<any[]>([]);
    const [selectedRepoIds, setSelectedRepoIds] = useState<Set<number>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const code = searchParams.get("code");
        const state = searchParams.get("state");

        // If we have a code and state that points to a different audit, redirect to it
        if (code && state && state !== auditId) {
            navigate(`/audit/${state}/evidence?code=${code}&state=${state}`, { replace: true });
            return;
        }

        if (code && !isConnecting) {
            handleExchangeToken(code);
        } else if (isConnected) {
            fetchRepositories();
        }
    }, [searchParams, auditId, navigate, isConnecting, isConnected]);

    // Reset pagination when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const fetchRepositories = async () => {
        setIsLoadingRepos(true);
        try {
            const token = localStorage.getItem("github_token");
            const response = await client.get("/auth/github/repositories", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setRepos(response.data);
        } catch (error) {
            console.error("Failed to fetch repositories:", error);
            // If token is invalid, clear it
            if ((error as any).response?.status === 401) {
                localStorage.removeItem("github_token");
                setIsConnected(false);
            }
        } finally {
            setIsLoadingRepos(false);
        }
    };

    const handleExchangeToken = async (code: string) => {
        setIsConnecting(true);
        try {
            // We MUST use exactly the same redirectUri that was sent to GitHub in handleGitHubConnect
            const stableRedirectUri = window.location.origin + "/audit/new/evidence";
            const response = await client.post("/auth/github/token", {
                code,
                redirectUri: stableRedirectUri
            });
            const { access_token } = response.data;
            if (access_token) {
                localStorage.setItem("github_token", access_token);
                setIsConnected(true);
                // Clear the parameters from URL
                searchParams.delete("code");
                searchParams.delete("state");
                setSearchParams(searchParams);
                alert("Successfully connected to GitHub!");
            }
        } catch (error) {
            console.error("Failed to exchange GitHub token:", error);
            alert("Failed to connect to GitHub. Please try again.");
        } finally {
            setIsConnecting(false);
        }
    };

    const handleGitHubConnect = () => {
        const clientId = "Ov23licfhgwxbYZkH0Ll"; // Found in backend .env
        // Use a stable path for GitHub registration compatibility
        const stableRedirectUri = window.location.origin + "/audit/new/evidence";
        const scope = "repo,user";
        // Use the state parameter to carry the auditId through the OAuth flow
        const state = auditId || "new";
        const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(stableRedirectUri)}&scope=${scope}&state=${state}`;

        window.location.href = authUrl;
    };

    const toggleRepoSelection = (repoId: number) => {
        const newSelection = new Set(selectedRepoIds);
        if (newSelection.has(repoId)) {
            newSelection.delete(repoId);
        } else {
            newSelection.add(repoId);
        }
        setSelectedRepoIds(newSelection);
    };

    const filteredRepos = repos.filter(repo =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (repo.full_name && repo.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const toggleAllRepos = () => {
        const allFilteredIds = filteredRepos.map(r => r.id);
        const allSelected = allFilteredIds.every(id => selectedRepoIds.has(id));

        const newSelection = new Set(selectedRepoIds);
        if (allSelected && filteredRepos.length > 0) {
            // Unselect all currently filtered items
            allFilteredIds.forEach(id => newSelection.delete(id));
        } else {
            // Select all currently filtered items
            allFilteredIds.forEach(id => newSelection.add(id));
        }
        setSelectedRepoIds(newSelection);
    };

    const totalPages = Math.ceil(filteredRepos.length / itemsPerPage);
    const paginatedRepos = filteredRepos.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const [isCollectingMetrics, setIsCollectingMetrics] = useState(false);

    const handleContinue = async () => {
        if (selectedRepoIds.size === 0) {
            alert("Please select at least one repository to proceed.");
            return;
        }

        // Get the selected repos with their full details
        const selectedRepos = repos.filter(r => selectedRepoIds.has(r.id));
        const token = localStorage.getItem("github_token");

        if (!token) {
            alert("GitHub token not found. Please reconnect.");
            return;
        }

        setIsCollectingMetrics(true);
        try {
            await client.post(`/audits/${auditId}/collect-metrics`, {
                repositories: selectedRepos.map(r => ({
                    id: r.id,
                    name: r.name,
                    full_name: r.full_name,
                })),
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            navigate(`/audit/${auditId}/analysis`);
        } catch (error) {
            console.error("Failed to collect metrics:", error);
            alert("Failed to collect repository metrics. Please try again.");
        } finally {
            setIsCollectingMetrics(false);
        }
    };

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

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", gap: "20px" }}>
                <div style={{ flex: 1, position: "relative" }}>
                    <input
                        type="text"
                        placeholder="Search repositories by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={!isConnected}
                        style={{
                            width: "100%",
                            padding: "10px 16px",
                            paddingLeft: "40px",
                            borderRadius: "8px",
                            border: "1px solid #e0e0e0",
                            fontSize: "14px",
                            outline: "none",
                            backgroundColor: isConnected ? "white" : "#f5f5f5"
                        }}
                    />
                    <span style={{ position: "absolute", left: "14px", top: "10px", color: "#999" }}>🔍</span>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                    <button
                        onClick={handleGitHubConnect}
                        disabled={isConnecting}
                        style={{
                            padding: "8px 16px",
                            border: "1px solid #e0e0e0",
                            borderRadius: "6px",
                            backgroundColor: isConnected ? "#E8F5E9" : "white",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            color: isConnected ? "#4CAF50" : "#333",
                            fontWeight: "600"
                        }}
                    >
                        <span>{isConnecting ? "Connecting..." : isConnected ? "✓ Connected to GitHub" : "Connect to GitHub"}</span>
                    </button>
                    <button
                        onClick={() => isConnected && fetchRepositories()}
                        disabled={!isConnected || isLoadingRepos}
                        style={{ padding: "8px 16px", border: "1px solid #e0e0e0", borderRadius: "6px", backgroundColor: "white", cursor: isConnected ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: "8px", color: "#333", fontWeight: "500", opacity: isConnected ? 1 : 0.5 }}>
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e0e0e0", overflow: "hidden" }}>
                {!isConnected ? (
                    <div style={{ padding: "60px", textAlign: "center", color: "#666" }}>
                        <div style={{ fontSize: "40px", marginBottom: "16px" }}>🐙</div>
                        <h3 style={{ margin: "0 0 8px 0", color: "#333" }}>GitHub Connection Required</h3>
                        <p style={{ margin: 0, fontSize: "14px" }}>Connect your account to select repositories for this audit.</p>
                    </div>
                ) : isLoadingRepos ? (
                    <div style={{ padding: "60px", textAlign: "center", color: "#666" }}>
                        <div style={{ marginBottom: "16px" }}>Loading repositories...</div>
                    </div>
                ) : filteredRepos.length === 0 ? (
                    <div style={{ padding: "60px", textAlign: "center", color: "#666" }}>
                        <h3 style={{ margin: "0 0 8px 0", color: "#333" }}>No repositories found</h3>
                        <p style={{ margin: 0, fontSize: "14px" }}>{searchQuery ? "No results match your search." : "We couldn't find any repositories in your GitHub account."}</p>
                    </div>
                ) : (
                    <>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #e0e0e0", backgroundColor: "#fafafa" }}>
                                    <th style={{ textAlign: "left", padding: "16px", width: "40px" }}>
                                        <input
                                            type="checkbox"
                                            checked={filteredRepos.length > 0 && filteredRepos.every(id => selectedRepoIds.has(id.id))}
                                            onChange={toggleAllRepos}
                                            style={{ cursor: "pointer" }}
                                        />
                                    </th>
                                    <th style={{ textAlign: "left", padding: "16px", fontSize: "12px", fontWeight: "700", color: "#999", textTransform: "uppercase" }}>Repository Name</th>
                                    <th style={{ textAlign: "left", padding: "16px", fontSize: "12px", fontWeight: "700", color: "#999", textTransform: "uppercase" }}>Primary Language</th>
                                    <th style={{ textAlign: "left", padding: "16px", fontSize: "12px", fontWeight: "700", color: "#999", textTransform: "uppercase" }}>Last Updated</th>
                                    <th style={{ textAlign: "left", padding: "16px", fontSize: "12px", fontWeight: "700", color: "#999", textTransform: "uppercase" }}>Default Branch</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRepos.map((repo) => (
                                    <tr key={repo.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                                        <td style={{ padding: "16px" }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedRepoIds.has(repo.id)}
                                                onChange={() => toggleRepoSelection(repo.id)}
                                                style={{ cursor: "pointer" }}
                                            />
                                        </td>
                                        <td style={{ padding: "16px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #eee", fontSize: "18px" }}>
                                                    💻
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: "600", color: "#1a1a1a", fontSize: "14px" }}>{repo.name}</div>
                                                    <div style={{ fontSize: "12px", color: "#999" }}>{repo.full_name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: "16px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#333" }}>
                                                {repo.language || "N/A"}
                                            </div>
                                        </td>
                                        <td style={{ padding: "16px", fontSize: "14px", color: "#666" }}>
                                            {new Date(repo.updated_at).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: "16px" }}>
                                            <span style={{
                                                padding: "4px 12px",
                                                borderRadius: "12px",
                                                fontSize: "12px",
                                                fontWeight: "500",
                                                color: "#666",
                                                backgroundColor: "#f0f0f0"
                                            }}>
                                                {repo.default_branch}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination Bar */}
                        <div style={{
                            padding: "12px 16px",
                            borderTop: "1px solid #e0e0e0",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            backgroundColor: "#fafafa"
                        }}>
                            <div style={{ fontSize: "13px", color: "#666" }}>
                                Showing {Math.min(filteredRepos.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredRepos.length, currentPage * itemsPerPage)} of {filteredRepos.length} repositories
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => p - 1)}
                                    style={{
                                        padding: "6px 12px",
                                        borderRadius: "6px",
                                        border: "1px solid #e0e0e0",
                                        backgroundColor: currentPage === 1 ? "#f5f5f5" : "white",
                                        cursor: currentPage === 1 ? "not-allowed" : "pointer",
                                        fontSize: "13px",
                                        color: "#333"
                                    }}
                                >
                                    Previous
                                </button>
                                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: "600", color: "#333", padding: "0 8px" }}>
                                    Page {currentPage} of {totalPages}
                                </div>
                                <button
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    style={{
                                        padding: "6px 12px",
                                        borderRadius: "6px",
                                        border: "1px solid #e0e0e0",
                                        backgroundColor: (currentPage === totalPages || totalPages === 0) ? "#f5f5f5" : "white",
                                        cursor: (currentPage === totalPages || totalPages === 0) ? "not-allowed" : "pointer",
                                        fontSize: "13px",
                                        color: "#333"
                                    }}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Selection Info */}
            {isConnected && repos.length > 0 && (
                <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "14px", color: "#666", fontWeight: "500" }}>
                        {selectedRepoIds.size} repositories selected for audit.
                    </div>
                </div>
            )}

            {/* Footer Navigation */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "40px",
                paddingTop: "24px",
                borderTop: "1px solid #e0e0e0"
            }}>
                <button
                    onClick={() => navigate(`/audit/new/scope`)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#666", fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}
                >
                    ← Back to Configuration
                </button>
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    <button
                        onClick={handleContinue}
                        disabled={selectedRepoIds.size === 0 || isCollectingMetrics}
                        style={{
                            backgroundColor: (selectedRepoIds.size > 0 && !isCollectingMetrics) ? "#2196F3" : "#ccc",
                            color: "white",
                            border: "none",
                            padding: "12px 24px",
                            borderRadius: "8px",
                            cursor: (selectedRepoIds.size > 0 && !isCollectingMetrics) ? "pointer" : "not-allowed",
                            fontWeight: "600",
                            fontSize: "14px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}
                    >
                        {isCollectingMetrics ? "Collecting Metrics..." : "Continue to Analysis →"}
                    </button>
                </div>
            </div>
        </div>
    );
}
