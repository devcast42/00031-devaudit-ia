import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Button,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Avatar,
    alpha,
    Stack,
    Pagination
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIcon from '@mui/icons-material/Assignment';
import dayjs from "dayjs";
import { AuditService, type Audit } from "../../services/audit.service";

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

    const stats = [
        { label: "Auditorías Pendientes", value: audits.filter(a => a.status !== 'Completed').length, color: '#2563eb' },
        { label: "Completadas", value: audits.filter(a => a.status === 'Completed').length, color: '#10b981' },
        { label: "Total Proyectos", value: audits.length, color: '#6366f1' },
    ];

    return (
        <Box sx={{ p: { xs: 3, md: 6 }, maxWidth: 1400, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
                <Box>
                    <Typography variant="h4" sx={{ mb: 1 }}>Gestión de Auditorías</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Supervise y gestione el estado de sus evaluaciones de IA.</Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate("/audit/new/scope")}
                >
                    Nueva Auditoría
                </Button>
            </Box>

            {/* Stats Overview */}
            <Box sx={{ mb: 6 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>Vista General</Typography>
                <Grid container spacing={3}>
                    {stats.map((stat, index) => (
                        <Grid size={{ xs: 12, sm: 4 }} key={index}>
                            <Paper sx={{ p: 4, position: 'relative', overflow: 'hidden' }}>
                                <Box sx={{
                                    position: 'absolute', top: -20, right: -20, width: 100, height: 100,
                                    borderRadius: '50%', backgroundColor: alpha(stat.color, 0.1)
                                }} />
                                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1, fontWeight: 500 }}>
                                    {stat.label}
                                </Typography>
                                <Typography variant="h3" sx={{ fontWeight: 800 }}>
                                    {stat.value}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            {/* Main Table Section */}
            <Paper sx={{ mb: 4, borderRadius: '16px', overflow: 'hidden' }}>
                <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="h6">Auditorías Recientes</Typography>
                    <Stack direction="row" spacing={1}>
                        <Button size="small" variant="outlined" startIcon={<FilterListIcon />} color="inherit">
                            Filtrar
                        </Button>
                        <Button size="small" variant="outlined" color="inherit">
                            Exportar
                        </Button>
                    </Stack>
                </Box>

                <TableContainer>
                    <Table sx={{ minWidth: 800 }}>
                        <TableHead sx={{ bgcolor: alpha('#1e293b', 0.5) }}>
                            <TableRow>
                                <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Nombre de la Auditoría</TableCell>
                                <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Organización</TableCell>
                                <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Estándar</TableCell>
                                <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Estado</TableCell>
                                <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Última Actualización</TableCell>
                                <TableCell align="right" sx={{ color: 'text.secondary', fontWeight: 600 }}>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8, color: 'text.secondary' }}>Cargando auditorías...</TableCell></TableRow>
                            ) : audits.length === 0 ? (
                                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8, color: 'text.secondary' }}>No se encontraron auditorías.</TableCell></TableRow>
                            ) : audits.map((audit) => (
                                <TableRow key={audit.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell sx={{ py: 2.5 }}>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Avatar sx={{ width: 32, height: 32, bgcolor: alpha('#6366f1', 0.1), color: '#6366f1' }}>
                                                <AssignmentIcon sx={{ fontSize: 18 }} />
                                            </Avatar>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{audit.name}</Typography>
                                        </Stack>
                                    </TableCell>
                                    <TableCell sx={{ color: 'text.secondary' }}>{audit.organization}</TableCell>
                                    <TableCell sx={{ color: 'text.secondary' }}>
                                        <Chip label={audit.complianceStandard} size="small" variant="outlined" sx={{ borderRadius: '6px', fontSize: '11px' }} />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={audit.status === "Completed" ? "Completada" : audit.status === "In Progress" ? "En Progreso" : audit.status}
                                            size="small"
                                            color={audit.status === "Completed" ? "success" : audit.status === "In Progress" ? "primary" : "default"}
                                            sx={{ borderRadius: '6px', fontWeight: 600, fontSize: '11px' }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ color: 'text.secondary' }}>{formatDate(audit.updatedAt)}</TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={() => handleContinue(audit)}
                                                sx={{ px: 2, fontSize: '12px' }}
                                            >
                                                Continuar
                                            </Button>
                                            <IconButton size="small" color="error" onClick={(e) => handleDelete(e, audit.id)} sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Mostrando {audits.length} resultados</Typography>
                    <Pagination count={1} size="small" shape="rounded" color="primary" />
                </Box>
            </Paper>
        </Box>
    );
}
