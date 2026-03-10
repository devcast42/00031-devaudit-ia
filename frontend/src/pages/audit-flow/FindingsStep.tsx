import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Box,
    Typography,
    Button,
    Paper,
    Grid,
    alpha,
    Stack,
    CircularProgress,
    Chip,
    IconButton,
    Collapse,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Tooltip
} from "@mui/material";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import BoltIcon from '@mui/icons-material/Bolt';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import client from "../../app/api";

// ─── Interfaces matching FindingsViewData / UIFinding from backend v2 ───────────

interface EvidenceAttachment {
    file_name: string;
    original_name: string;
    mime_type: string;
    url: string;
    uploaded_at: string;
}

interface UIFinding {
    finding_id: string;
    repository: string;
    practice: string;
    practice_name: string;
    severity: "HIGH" | "MEDIUM" | "LOW";
    title: string;
    description: string;
    recommendation: string;
    rule_violated: string;
    standard_reference: string;
    evidence_snapshot: Record<string, string | number | boolean>;
    source: "automatic" | "manual";
    status: "draft" | "approved";
    analysis_source_id: string;
    attachments?: EvidenceAttachment[];
    created_at: string;
    updated_at: string;
}

interface FindingsViewData {
    total_findings: number;
    by_severity: { high: number; medium: number; low: number };
    by_practice: Record<string, number>;
    by_repository: Record<string, number>;
    findings: UIFinding[];
}

const emptyForm = {
    practice: "",
    repository: "",
    title: "",
    description: "",
    severity: "MEDIUM" as "HIGH" | "MEDIUM" | "LOW",
    recommendation: "",
    evidence_reference: "",
    status: "draft" as "draft" | "approved",
};

export function FindingsStep() {
    const navigate = useNavigate();
    const { id: auditId } = useParams();

    const [viewData, setViewData] = useState<FindingsViewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [filterPractice, setFilterPractice] = useState<string>("ALL");
    const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
    const [filterRepo, setFilterRepo] = useState<string>("ALL");

    // Expanded finding details
    const [expandedFinding, setExpandedFinding] = useState<string | null>(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);

    // Delete confirmation
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Upload state
    const [uploadingId, setUploadingId] = useState<string | null>(null);

    const fetchFindings = async () => {
        try {
            const res = await client.get(`/audits/${auditId}/findings`);
            setViewData(res.data);
        } catch {
            /* empty state */
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (auditId) fetchFindings();
    }, [auditId]);

    const handleGenerate = async () => {
        setGenerating(true);
        setError(null);
        try {
            const res = await client.post(`/audits/${auditId}/findings/generate`);
            setViewData(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || "Error al generar los hallazgos.");
        } finally {
            setGenerating(false);
        }
    };

    const openCreate = () => {
        setEditingId(null);
        setForm(emptyForm);
        setShowModal(true);
    };

    const openEdit = (f: UIFinding) => {
        setEditingId(f.finding_id);
        setForm({
            practice: f.practice,
            repository: f.repository,
            title: f.title,
            description: f.description,
            severity: f.severity,
            recommendation: f.recommendation,
            evidence_reference: "",
            status: f.status,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            if (editingId) {
                await client.patch(`/audits/${auditId}/findings/${editingId}`, {
                    title: form.title,
                    description: form.description,
                    severity: form.severity,
                    recommendation: form.recommendation,
                    status: form.status,
                });
            } else {
                await client.post(`/audits/${auditId}/findings`, form);
            }
            setShowModal(false);
            fetchFindings();
        } catch (err: any) {
            alert(err.response?.data?.error || "Error al guardar el hallazgo.");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await client.delete(`/audits/${auditId}/findings/${id}`);
            setDeleteId(null);
            fetchFindings();
        } catch {
            alert("Error al eliminar el hallazgo.");
        }
    };

    const handleApprove = async (f: UIFinding) => {
        const newStatus = f.status === "draft" ? "approved" : "draft";
        await client.patch(`/audits/${auditId}/findings/${f.finding_id}`, { status: newStatus });
        fetchFindings();
    };

    const handleFileUpload = async (findingId: string, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadingId(findingId);
        const formData = new FormData();
        formData.append("evidence", file);

        try {
            await client.post(`/audits/${auditId}/findings/${findingId}/evidence`, formData);
            fetchFindings();
        } catch (err: any) {
            alert(err.response?.data?.error || "Error al subir el archivo.");
        } finally {
            setUploadingId(null);
            event.target.value = "";
        }
    };

    const filteredFindings = (viewData?.findings || []).filter(f => {
        if (filterPractice !== "ALL" && f.practice !== filterPractice) return false;
        if (filterSeverity !== "ALL" && f.severity !== filterSeverity) return false;
        if (filterRepo !== "ALL" && f.repository !== filterRepo) return false;
        return true;
    });

    const allPractices = [...new Set((viewData?.findings || []).map(f => f.practice))];
    const allRepos = [...new Set((viewData?.findings || []).map(f => f.repository))];

    const severityConfigs: Record<string, { color: string; bg: string; label: string }> = {
        HIGH: { color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", label: "Alta" },
        MEDIUM: { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)", label: "Media" },
        LOW: { color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", label: "Baja" },
    };

    const severityBadge = (severity: string) => {
        const c = severityConfigs[severity] || severityConfigs.LOW;
        return (
            <Chip
                label={c.label}
                size="small"
                sx={{ bgcolor: c.bg, color: c.color, fontWeight: 800, borderRadius: '6px', fontSize: '11px', border: '1px solid', borderColor: alpha(c.color, 0.2) }}
            />
        );
    };

    if (loading) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress size={40} />
                <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>Cargando hallazgos...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ width: "100%", maxWidth: "1200px", mx: "auto" }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 1 }}>
                    <Box>
                        <Typography variant="overline" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '0.1em' }}>
                            Paso 4 de 5 • Gestión de Hallazgos
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                            Matriz de Hallazgos
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right", display: { xs: 'none', sm: 'block' } }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
                            67% Completado
                        </Typography>
                        <Box sx={{ width: "200px", height: "6px", bgcolor: alpha('#fff', 0.1), borderRadius: "3px", mt: 1, overflow: 'hidden' }}>
                            <Box sx={{ width: "67%", height: "100%", bgcolor: "primary.main" }} />
                        </Box>
                    </Box>
                </Stack>
                <Typography variant="body1" sx={{ color: "text.secondary", mt: 2 }}>
                    Consolidación de debilidades y oportunidades de mejora identificadas. Permite trazabilidad técnica y aprobación de resultados.
                </Typography>
            </Box>

            {/* Metrics Row */}
            {viewData && viewData.total_findings > 0 && (
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    {[
                        { label: "Total Hallazgos", value: viewData.total_findings, color: "primary.main" },
                        { label: "Severidad Alta", value: viewData.by_severity.high, color: "#ef4444" },
                        { label: "Severidad Media", value: viewData.by_severity.medium, color: "#f59e0b" },
                        { label: "Severidad Baja", value: viewData.by_severity.low, color: "#10b981" },
                    ].map(card => (
                        <Grid size={{ xs: 6, sm: 3 }} key={card.label}>
                            <Paper sx={{
                                p: 2.5,
                                textAlign: 'center',
                                borderRadius: '16px',
                                bgcolor: alpha('#1e293b', 0.4),
                                border: '1px solid',
                                borderColor: 'divider',
                                backdropFilter: 'blur(20px)',
                            }}>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: card.color }}>{card.value}</Typography>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>{card.label}</Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Toolbar */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }} alignItems={{ md: 'center' }}>
                <Button
                    variant="contained"
                    startIcon={generating ? <CircularProgress size={18} color="inherit" /> : <BoltIcon />}
                    onClick={handleGenerate}
                    disabled={generating}
                    sx={{ borderRadius: '10px', py: 1.2 }}
                >
                    {generating ? "Generando..." : "Generar desde Análisis"}
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={openCreate}
                    sx={{ borderRadius: '10px', py: 1.2 }}
                >
                    Añadir Manual
                </Button>

                <Box sx={{ flexGrow: 1 }} />

                <Stack direction="row" spacing={1}>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel>Práctica</InputLabel>
                        <Select value={filterPractice} label="Práctica" onChange={e => setFilterPractice(e.target.value as string)}>
                            <MenuItem value="ALL">Todas</MenuItem>
                            {allPractices.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel>Severidad</InputLabel>
                        <Select value={filterSeverity} label="Severidad" onChange={e => setFilterSeverity(e.target.value as string)}>
                            <MenuItem value="ALL">Todas</MenuItem>
                            <MenuItem value="HIGH">Alta</MenuItem>
                            <MenuItem value="MEDIUM">Media</MenuItem>
                            <MenuItem value="LOW">Baja</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel>Repositorio</InputLabel>
                        <Select value={filterRepo} label="Repositorio" onChange={e => setFilterRepo(e.target.value as string)}>
                            <MenuItem value="ALL">Todos</MenuItem>
                            {allRepos.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Stack>
            </Stack>

            {error && <Typography color="error" variant="body2" sx={{ mb: 2 }}>{error}</Typography>}

            {/* Findings List */}
            {filteredFindings.length === 0 ? (
                <Paper sx={{
                    p: 8,
                    textAlign: 'center',
                    borderRadius: '24px',
                    bgcolor: alpha('#1e293b', 0.4),
                    border: '1px solid',
                    borderColor: 'divider',
                }}>
                    <AssignmentIcon sx={{ fontSize: 64, color: alpha('#fff', 0.2), mb: 2 }} />
                    <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>Sin hallazgos registrados</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400, mx: 'auto' }}>
                        Inicie la generación automática desde el análisis o registre hallazgos puntuales manualmente para continuar el flujo.
                    </Typography>
                </Paper>
            ) : (
                <Paper sx={{
                    borderRadius: '24px',
                    bgcolor: alpha('#1e293b', 0.4),
                    border: '1px solid',
                    borderColor: 'divider',
                    backdropFilter: 'blur(20px)',
                    overflow: 'hidden'
                }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: alpha('#fff', 0.02) }}>
                                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', width: 60 }} />
                                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Hallazgo</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Repositorio</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Severidad</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Estado</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Fuente</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textAlign: 'right' }}>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredFindings.map(f => {
                                const isExpanded = expandedFinding === f.finding_id;
                                return (
                                    <>
                                        <TableRow key={f.finding_id} sx={{ '&:hover': { bgcolor: alpha('#fff', 0.02) }, borderBottom: isExpanded ? 'none' : 'inherit' }}>
                                            <TableCell>
                                                <IconButton size="small" onClick={() => setExpandedFinding(isExpanded ? null : f.finding_id)}>
                                                    {isExpanded ? <KeyboardArrowDownIcon sx={{ transform: 'rotate(180deg)' }} /> : <KeyboardArrowDownIcon />}
                                                </IconButton>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{f.title}</Typography>
                                                <Typography sx={{ fontSize: '11px', color: 'primary.light', fontFamily: 'monospace' }}>{f.practice}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '12px' }}>{f.repository}</TableCell>
                                            <TableCell>{severityBadge(f.severity)}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={f.status === 'approved' ? 'Aprobado' : 'Borrador'}
                                                    size="small"
                                                    onClick={() => handleApprove(f)}
                                                    sx={{
                                                        bgcolor: f.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                        color: f.status === 'approved' ? '#10b981' : '#f59e0b',
                                                        fontWeight: 800, fontSize: '10px', cursor: 'pointer'
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={f.source === 'automatic' ? 'Auto' : 'Manual'}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontSize: '10px', height: 20, borderColor: alpha('#fff', 0.2), color: 'text.secondary' }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                    <IconButton size="small" onClick={() => openEdit(f)} sx={{ color: 'primary.main' }}><EditIcon sx={{ fontSize: 18 }} /></IconButton>
                                                    <IconButton size="small" onClick={() => setDeleteId(f.finding_id)} sx={{ color: 'error.main' }}><DeleteIcon sx={{ fontSize: 18 }} /></IconButton>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell sx={{ p: 0 }} colSpan={7}>
                                                <Collapse in={isExpanded}>
                                                    <Box sx={{ p: 3, bgcolor: alpha('#000', 0.1), borderBottom: '1px solid', borderColor: 'divider' }}>
                                                        <Grid container spacing={3}>
                                                            <Grid size={{ xs: 12, md: 6 }}>
                                                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>Descripción Detallada</Typography>
                                                                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', whiteSpace: 'pre-wrap' }}>{f.description}</Typography>
                                                            </Grid>
                                                            <Grid size={{ xs: 12, md: 6 }}>
                                                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>Recomendación Estratégica</Typography>
                                                                <Typography variant="body2" sx={{ mt: 1, color: 'success.light', fontWeight: 600 }}>{f.recommendation}</Typography>
                                                            </Grid>
                                                            <Grid size={{ xs: 12, md: 6 }}>
                                                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>Snapshot de Evidencia</Typography>
                                                                <Box sx={{ mt: 1, p: 1.5, borderRadius: '8px', bgcolor: alpha('#000', 0.2) }}>
                                                                    {Object.entries(f.evidence_snapshot).length > 0 ? (
                                                                        Object.entries(f.evidence_snapshot).map(([k, v]) => (
                                                                            <Stack key={k} direction="row" spacing={1}>
                                                                                <Typography sx={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 800, color: 'primary.light' }}>{k}:</Typography>
                                                                                <Typography sx={{ fontFamily: 'monospace', fontSize: '11px' }}>{String(v)}</Typography>
                                                                            </Stack>
                                                                        ))
                                                                    ) : <Typography variant="caption" sx={{ fontStyle: 'italic', opacity: 0.5 }}>Sin evidencia técnica asociada</Typography>}
                                                                </Box>
                                                            </Grid>
                                                            <Grid size={{ xs: 12, md: 6 }}>
                                                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>Evidencia Adjunta ({f.attachments?.length || 0})</Typography>
                                                                    <Button
                                                                        component="label"
                                                                        size="small"
                                                                        startIcon={<CloudUploadIcon />}
                                                                        disabled={uploadingId === f.finding_id}
                                                                        sx={{ fontSize: '10px' }}
                                                                    >
                                                                        {uploadingId === f.finding_id ? "Subiendo..." : "Adjuntar"}
                                                                        <input type="file" hidden onChange={e => handleFileUpload(f.finding_id, e)} />
                                                                    </Button>
                                                                </Stack>
                                                                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
                                                                    {f.attachments?.map((att, i) => (
                                                                        <Tooltip key={i} title={att.original_name}>
                                                                            <Chip
                                                                                icon={<AttachFileIcon sx={{ fontSize: '14px !important' }} />}
                                                                                label={att.original_name}
                                                                                component="a"
                                                                                href={att.url}
                                                                                target="_blank"
                                                                                clickable
                                                                                size="small"
                                                                                sx={{ maxWidth: 180, bgcolor: alpha('#fff', 0.05) }}
                                                                            />
                                                                        </Tooltip>
                                                                    ))}
                                                                    {!f.attachments?.length && <Typography variant="caption" sx={{ fontStyle: 'italic', opacity: 0.5 }}>Sin archivos vinculados</Typography>}
                                                                </Stack>
                                                            </Grid>
                                                        </Grid>
                                                    </Box>
                                                </Collapse>
                                            </TableCell>
                                        </TableRow>
                                    </>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Paper>
            )}

            {/* Modal de Creación/Edición */}
            <Dialog
                open={showModal}
                onClose={() => setShowModal(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '24px', bgcolor: '#1e293b', backgroundImage: 'none', border: '1px solid', borderColor: 'divider' }
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, borderBottom: '1px solid', borderColor: 'divider', mb: 2 }}>
                    {editingId ? "Editar Hallazgo" : "Registro de Hallazgo Manual"}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Práctica</InputLabel>
                                    <Select
                                        value={form.practice}
                                        label="Práctica"
                                        onChange={e => setForm({ ...form, practice: e.target.value as string })}
                                        disabled={!!editingId}
                                    >
                                        <MenuItem value="SCM">Gestión de Configuración</MenuItem>
                                        <MenuItem value="QA">Aseguramiento de Calidad</MenuItem>
                                        <MenuItem value="PM">Gestión de Proyecto</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Repositorio"
                                    value={form.repository}
                                    onChange={e => setForm({ ...form, repository: e.target.value })}
                                    disabled={!!editingId}
                                />
                            </Grid>
                        </Grid>
                        <TextField
                            fullWidth
                            size="small"
                            label="Título del Hallazgo"
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                        />
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Descripción del Problema"
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                        />
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Recomendación Solución"
                            value={form.recommendation}
                            onChange={e => setForm({ ...form, recommendation: e.target.value })}
                        />
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Severidad</InputLabel>
                                    <Select value={form.severity} label="Severidad" onChange={e => setForm({ ...form, severity: e.target.value as any })}>
                                        <MenuItem value="HIGH">Alta</MenuItem>
                                        <MenuItem value="MEDIUM">Media</MenuItem>
                                        <MenuItem value="LOW">Baja</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Estado</InputLabel>
                                    <Select value={form.status} label="Estado" onChange={e => setForm({ ...form, status: e.target.value as any })}>
                                        <MenuItem value="draft">Borrador</MenuItem>
                                        <MenuItem value="approved">Aprobado</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 4, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button onClick={() => setShowModal(false)} sx={{ color: 'text.secondary' }}>Cancelar</Button>
                    <Button variant="contained" onClick={handleSave} sx={{ borderRadius: '10px', px: 4 }}>
                        {editingId ? "Actualizar Hallazgo" : "Crear Hallazgo"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Confirmación de Eliminación */}
            <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
                <DialogTitle sx={{ fontWeight: 800 }}>Confirmar eliminación</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        ¿Está seguro de que desea eliminar este hallazgo? Esta acción borrará permanentemente la descripción y cualquier evidencia vinculada.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setDeleteId(null)} sx={{ color: 'text.secondary' }}>Cancelar</Button>
                    <Button variant="contained" color="error" onClick={() => deleteId && handleDelete(deleteId)}>
                        Eliminar Hallazgo
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Footer Navigation */}
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 6, pt: 4, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(`/audit/${auditId}/analysis`)}
                    sx={{ color: 'text.secondary', fontWeight: 800 }}
                >
                    Volver al Análisis
                </Button>
                <Button
                    variant="contained"
                    disabled={!viewData || viewData.total_findings === 0}
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate(`/audit/${auditId}/report`)}
                    sx={{ borderRadius: '12px', py: 1.5, px: 4, fontWeight: 800 }}
                >
                    Continuar al Informe
                </Button>
            </Stack>
        </Box>
    );
}
