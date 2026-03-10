import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox,
    alpha,
    Stack,
    InputAdornment,
    CircularProgress,
    Chip,
    IconButton,
    Tooltip
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import GitHubIcon from '@mui/icons-material/GitHub';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VerifiedIcon from '@mui/icons-material/Verified';
import CodeIcon from '@mui/icons-material/Code';
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
    const itemsPerPage = 8;

    useEffect(() => {
        const code = searchParams.get("code");
        const state = searchParams.get("state");

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
            const stableRedirectUri = window.location.origin + "/audit/new/evidence";
            const response = await client.post("/auth/github/token", {
                code,
                redirectUri: stableRedirectUri
            });
            const { access_token } = response.data;
            if (access_token) {
                localStorage.setItem("github_token", access_token);
                setIsConnected(true);
                searchParams.delete("code");
                searchParams.delete("state");
                setSearchParams(searchParams);
            }
        } catch (error) {
            console.error("Failed to exchange GitHub token:", error);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleGitHubConnect = () => {
        const clientId = "Ov23licfhgwxbYZkH0Ll";
        const stableRedirectUri = window.location.origin + "/audit/new/evidence";
        const scope = "repo,user";
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
        const allFilteredIds = paginatedRepos.map((r: any) => r.id);
        const allSelected = allFilteredIds.every((id: number) => selectedRepoIds.has(id));

        const newSelection = new Set(selectedRepoIds);
        if (allSelected && paginatedRepos.length > 0) {
            allFilteredIds.forEach((id: number) => newSelection.delete(id));
        } else {
            allFilteredIds.forEach((id: number) => newSelection.add(id));
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
            alert("Por favor seleccione al menos un repositorio para continuar.");
            return;
        }

        const selectedRepos = repos.filter((r: any) => selectedRepoIds.has(r.id));
        const token = localStorage.getItem("github_token");

        if (!token) return;

        setIsCollectingMetrics(true);
        try {
            await client.post(`/audits/${auditId}/collect-metrics`, {
                repositories: selectedRepos.map((r: any) => ({
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
        } finally {
            setIsCollectingMetrics(false);
        }
    };

    return (
        <Box sx={{ width: "100%", maxWidth: "1100px", mx: "auto" }}>
            {/* Header Section */}
            <Box sx={{ mb: 4 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 1 }}>
                    <Box>
                        <Typography variant="overline" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '0.1em' }}>
                            Paso 2 de 5 • Recolección de Evidencia
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                            Repositorios de Evidencia
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right", display: { xs: 'none', sm: 'block' } }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
                            33% Completado
                        </Typography>
                        <Box sx={{ width: "200px", height: "6px", bgcolor: alpha('#fff', 0.1), borderRadius: "3px", mt: 1, overflow: 'hidden' }}>
                            <Box sx={{ width: "33%", height: "100%", bgcolor: "primary.main" }} />
                        </Box>
                    </Box>
                </Stack>
            </Box>

            {/* Controls Section */}
            <Paper sx={{
                p: 3,
                mb: 3,
                borderRadius: '16px',
                bgcolor: alpha('#1e293b', 0.4),
                border: '1px solid',
                borderColor: 'divider',
                backdropFilter: 'blur(20px)',
            }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                    <TextField
                        fullWidth
                        placeholder="Buscar repositorios por nombre..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={!isConnected}
                        size="small"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                bgcolor: alpha('#0f172a', 0.3),
                                borderRadius: '10px'
                            }
                        }}
                    />
                    <Stack direction="row" spacing={1.5} sx={{ width: { xs: '100%', md: 'auto' } }}>
                        <Button
                            variant={isConnected ? "text" : "contained"}
                            onClick={handleGitHubConnect}
                            disabled={isConnecting}
                            startIcon={isConnected ? <VerifiedIcon /> : <GitHubIcon />}
                            sx={{
                                whiteSpace: 'nowrap',
                                borderRadius: '10px',
                                fontWeight: 700,
                                bgcolor: isConnected ? alpha('#4caf50', 0.1) : undefined,
                                color: isConnected ? '#4caf50' : undefined,
                                px: 3
                            }}
                        >
                            {isConnecting ? "Conectando..." : isConnected ? "Conectado" : "Conectar GitHub"}
                        </Button>
                        <Tooltip title="Actualizar lista">
                            <IconButton
                                onClick={() => isConnected && fetchRepositories()}
                                disabled={!isConnected || isLoadingRepos}
                                sx={{
                                    bgcolor: alpha('#fff', 0.05),
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: '10px'
                                }}
                            >
                                {isLoadingRepos ? <CircularProgress size={20} /> : <RefreshIcon fontSize="small" />}
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Stack>
            </Paper>

            {/* Table Section */}
            <TableContainer component={Paper} sx={{
                borderRadius: '20px',
                bgcolor: alpha('#1e293b', 0.4),
                border: '1px solid',
                borderColor: 'divider',
                backdropFilter: 'blur(20px)',
                minHeight: '400px',
                mb: 4
            }}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                        <TableRow sx={{ bgcolor: alpha('#1e293b', 0.6) }}>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    indeterminate={selectedRepoIds.size > 0 && selectedRepoIds.size < paginatedRepos.length}
                                    checked={paginatedRepos.length > 0 && paginatedRepos.every(r => selectedRepoIds.has(r.id))}
                                    onChange={toggleAllRepos}
                                    sx={{ color: alpha('#fff', 0.3) }}
                                />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>Repositorio</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>Lenguaje</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>Actualización</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>Rama</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {!isConnected ? (
                            <TableRow>
                                <TableCell colSpan={5} sx={{ py: 10, textAlign: 'center' }}>
                                    <Box sx={{ opacity: 0.5 }}>
                                        <GitHubIcon sx={{ fontSize: 48, mb: 2 }} />
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>Se requiere conexión a GitHub</Typography>
                                        <Typography variant="body2">Conecte su cuenta para seleccionar repositorios para esta auditoría.</Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : isLoadingRepos ? (
                            <TableRow>
                                <TableCell colSpan={5} sx={{ py: 10, textAlign: 'center' }}>
                                    <CircularProgress size={32} sx={{ mb: 2 }} />
                                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Cargando repositorios...</Typography>
                                </TableCell>
                            </TableRow>
                        ) : paginatedRepos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} sx={{ py: 10, textAlign: 'center' }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>No se encontraron repositorios.</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedRepos.map((repo) => (
                                <TableRow
                                    key={repo.id}
                                    hover
                                    sx={{
                                        '&:hover': { bgcolor: alpha('#2563eb', 0.05) },
                                        transition: 'background-color 0.2s',
                                        bgcolor: selectedRepoIds.has(repo.id) ? alpha('#2563eb', 0.03) : 'transparent'
                                    }}
                                >
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selectedRepoIds.has(repo.id)}
                                            onChange={() => toggleRepoSelection(repo.id)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Box sx={{
                                                width: 36, height: 36, borderRadius: '8px',
                                                bgcolor: alpha('#fff', 0.05), border: '1px solid', borderColor: 'divider',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <CodeIcon sx={{ fontSize: 18, color: 'primary.light' }} />
                                            </Box>
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{repo.name}</Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{repo.full_name}</Typography>
                                            </Box>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        {repo.language && (
                                            <Chip
                                                label={repo.language}
                                                size="small"
                                                sx={{
                                                    height: 20, fontSize: '10px', fontWeight: 800,
                                                    bgcolor: alpha('#fff', 0.05), color: 'text.secondary', border: '1px solid', borderColor: 'divider'
                                                }}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                            {new Date(repo.updated_at).toLocaleDateString()}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={repo.default_branch}
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                                height: 20, fontSize: '10px', fontWeight: 800,
                                                borderColor: (theme) => alpha(theme.palette.primary.main, 0.3), color: 'primary.light'
                                            }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: alpha('#1e293b', 0.2) }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            Página {currentPage} de {totalPages}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            <Button
                                size="small"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                                sx={{ borderRadius: '8px', fontWeight: 800 }}
                            >
                                Anterior
                            </Button>
                            <Button
                                size="small"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                                sx={{ borderRadius: '8px', fontWeight: 800 }}
                            >
                                Siguiente
                            </Button>
                        </Stack>
                    </Stack>
                )}
            </TableContainer>

            {/* Footer Navigation */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 4, pt: 4, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button
                    onClick={() => navigate(`/audit/${auditId}/scope`)}
                    startIcon={<ArrowBackIcon />}
                    sx={{ color: 'text.secondary', fontWeight: 800 }}
                >
                    Volver al Alcance
                </Button>
                <Stack direction="row" spacing={3} alignItems="center">
                    {selectedRepoIds.size > 0 && (
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
                            {selectedRepoIds.size} Repositorios Seleccionados
                        </Typography>
                    )}
                    <Button
                        variant="contained"
                        onClick={handleContinue}
                        disabled={selectedRepoIds.size === 0 || isCollectingMetrics}
                        endIcon={!isCollectingMetrics && <ArrowForwardIcon />}
                        sx={{
                            py: 1.5, px: 4, borderRadius: '12px', fontWeight: 800,
                            boxShadow: `0 8px 20px ${alpha('#2563eb', 0.3)}`
                        }}
                    >
                        {isCollectingMetrics ? "Recolectando Métricas..." : "Continuar a Análisis"}
                    </Button>
                </Stack>
            </Stack>
        </Box>
    );
}
