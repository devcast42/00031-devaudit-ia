import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    MenuItem,
    Grid,
    alpha,
    Stack,
    InputAdornment
} from "@mui/material";
import BusinessIcon from '@mui/icons-material/Business';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
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
                })
                .finally(() => setIsLoading(false));
        }
    }, [id, isEditMode]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
                navigate(`/audit/${id}/evidence`);
            } else {
                const newAudit = await AuditService.createAudit(formData);
                navigate(`/audit/${newAudit.id}/evidence`);
            }
        } catch (error) {
            console.error("Failed to save audit:", error);
            alert("Error al guardar la auditoría.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box sx={{ width: "100%", maxWidth: "900px", mx: "auto" }}>
            <Paper sx={{
                p: { xs: 4, md: 6 },
                borderRadius: '24px',
                bgcolor: alpha('#1e293b', 0.4),
                border: '1px solid',
                borderColor: 'divider',
                backdropFilter: 'blur(20px)',
            }}>
                <Box sx={{ mb: 6 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 1 }}>
                        <Box>
                            <Typography variant="overline" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '0.1em' }}>
                                Paso 1 de 5 • Definición del Alcance
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                                Información y Alcance
                            </Typography>
                        </Box>
                        <Box sx={{ textAlign: "right", display: { xs: 'none', sm: 'block' } }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
                                16% Completado
                            </Typography>
                            <Box sx={{ width: "180px", height: "6px", bgcolor: alpha('#fff', 0.1), borderRadius: "3px", mt: 1, overflow: 'hidden' }}>
                                <Box sx={{ width: "16%", height: "100%", bgcolor: "primary.main" }} />
                            </Box>
                        </Box>
                    </Stack>
                    <Typography variant="body1" sx={{ color: "text.secondary", mt: 2 }}>
                        Defina los límites, la organización y los estándares de referencia para esta sesión de auditoría técnica.
                    </Typography>
                </Box>

                <Grid container spacing={4}>
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', mb: 1.5, display: 'block' }}>
                            Nombre de la Auditoría
                        </Typography>
                        <TextField
                            fullWidth
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Ej. Auditoría de Seguridad Q1"
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: alpha('#0f172a', 0.3),
                                    borderRadius: '12px'
                                }
                            }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', mb: 1.5, display: 'block' }}>
                            Organización
                        </Typography>
                        <TextField
                            fullWidth
                            name="organization"
                            value={formData.organization}
                            onChange={handleChange}
                            variant="outlined"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <BusinessIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: alpha('#0f172a', 0.3),
                                    borderRadius: '12px'
                                }
                            }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', mb: 1.5, display: 'block' }}>
                            Período de Revisión
                        </Typography>
                        <TextField
                            fullWidth
                            name="reviewPeriod"
                            value={formData.reviewPeriod}
                            onChange={handleChange}
                            variant="outlined"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <CalendarMonthIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: alpha('#0f172a', 0.3),
                                    borderRadius: '12px'
                                }
                            }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', mb: 1.5, display: 'block' }}>
                            Estándar de Cumplimiento
                        </Typography>
                        <TextField
                            select
                            fullWidth
                            name="complianceStandard"
                            value={formData.complianceStandard}
                            onChange={handleChange}
                            variant="outlined"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SettingsIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: alpha('#0f172a', 0.3),
                                    borderRadius: '12px'
                                }
                            }}
                        >
                            <MenuItem value="Estándar Interno DevAudit v1.0">Estándar Interno DevAudit v1.0</MenuItem>
                            <MenuItem value="ISO/IEC 25010 (Calidad de Software)">ISO/IEC 25010 (Calidad de Software)</MenuItem>
                            <MenuItem value="OWASP Top 10 (Seguridad)">OWASP Top 10 (Seguridad)</MenuItem>
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12 }} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleSubmit}
                            disabled={isLoading}
                            endIcon={!isLoading && <ArrowForwardIcon />}
                            sx={{
                                py: 1.5,
                                px: 4,
                                borderRadius: '12px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                boxShadow: `0 8px 20px ${alpha('#2563eb', 0.3)}`
                            }}
                        >
                            {isLoading ? "Guardando..." : (isEditMode ? "Guardar y Continuar" : "Crear y Continuar")}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}
