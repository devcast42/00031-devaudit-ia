import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import {
    Box,
    Stepper,
    Step,
    StepLabel,
    Typography,
    AppBar,
    Toolbar,
    IconButton,
    Avatar,
    Container,
    alpha,
    Divider,
    Paper,
    StepConnector,
    stepConnectorClasses,
    styled
} from "@mui/material";
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { AuditService } from "../services/audit.service";

// Custom connector for the stepper
const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
    [`&.${stepConnectorClasses.alternativeLabel}`]: {
        top: 22,
    },
    [`&.${stepConnectorClasses.active}`]: {
        [`& .${stepConnectorClasses.line}`]: {
            backgroundImage: 'linear-gradient( 95deg, #2563eb 0%, #6366f1 50%, #8b5cf6 100%)',
        },
    },
    [`&.${stepConnectorClasses.completed}`]: {
        [`& .${stepConnectorClasses.line}`]: {
            backgroundImage: 'linear-gradient( 95deg, #2563eb 0%, #6366f1 50%, #8b5cf6 100%)',
        },
    },
    [`& .${stepConnectorClasses.line}`]: {
        height: 3,
        border: 0,
        backgroundColor: alpha(theme.palette.divider, 0.1),
        borderRadius: 1,
    },
}));

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
    const [maxStepReached, setMaxStepReached] = useState(currentStepIndex);
    const [auditLoaded, setAuditLoaded] = useState(false);

    useEffect(() => {
        if (id && id !== "new") {
            AuditService.getAuditById(id).then(audit => {
                const step = audit.currentStep || 0;
                setMaxStepReached(prev => Math.max(prev, step));
                setAuditLoaded(true);
            }).catch(err => {
                console.error("Failed to load audit", err);
                navigate("/");
            });
        } else if (id === "new") {
            setAuditLoaded(true);
        }
    }, [id, navigate]);

    useEffect(() => {
        if (currentStepIndex > maxStepReached) {
            setMaxStepReached(currentStepIndex);
            if (id && id !== "new") {
                AuditService.updateAudit(id, { currentStep: currentStepIndex })
                    .catch(err => console.error("Failed to update audit progress", err));
            }
        }
    }, [currentStepIndex, maxStepReached, id]);

    if (!auditLoaded && id && id !== "new") {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'text.secondary' }}>
                <Typography>Cargando auditoría...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
            {/* Header */}
            <AppBar position="static" elevation={0} sx={{
                bgcolor: 'background.paper',
                borderBottom: '1px solid',
                borderColor: 'divider',
                backdropFilter: 'blur(20px)',
            }}>
                <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 4 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <IconButton
                            onClick={() => navigate("/")}
                            sx={{ color: 'text.primary', '&:hover': { bgcolor: alpha('#fff', 0.05) } }}
                        >
                            <ArrowBackIcon fontSize="small" />
                        </IconButton>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{
                                width: 28, height: 28, borderRadius: '6px',
                                background: 'linear-gradient(135deg, #2563eb 0%, #6366f1 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontWeight: 'bold', fontSize: '14px'
                            }}>D</Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                DevAudit IA
                            </Typography>
                        </Box>
                        <Divider orientation="vertical" flexItem sx={{ height: 24, my: 'auto', opacity: 0.5 }} />
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                            Ejecución de Auditoría
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <IconButton sx={{ color: 'text.secondary' }}>
                            <HelpOutlineIcon />
                        </IconButton>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>Jane Auditor</Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Evaluador Principal</Typography>
                            </Box>
                            <Avatar sx={{
                                width: 36, height: 36, bgcolor: alpha('#2563eb', 0.2),
                                color: '#60a5fa', fontWeight: 700, fontSize: '14px',
                                border: '1px solid rgba(96, 165, 250, 0.2)'
                            }}>JA</Avatar>
                        </Box>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Stepper Section */}
            <Paper elevation={0} sx={{
                py: 4,
                borderRadius: 0,
                borderBottom: '1px solid',
                borderColor: 'divider',
                background: alpha('#1e293b', 0.4)
            }}>
                <Container maxWidth="md">
                    <Stepper
                        activeStep={currentStepIndex}
                        alternativeLabel
                        connector={<ColorlibConnector />}
                    >
                        {steps.map((step, index) => {
                            const isClickable = index <= maxStepReached && index !== currentStepIndex;

                            return (
                                <Step key={step.label}>
                                    <StepLabel
                                        onClick={() => isClickable && navigate(step.path)}
                                        sx={{
                                            cursor: isClickable ? 'pointer' : 'default',
                                            '& .MuiStepLabel-label': {
                                                mt: 1,
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                color: index <= currentStepIndex ? 'text.primary' : 'text.secondary',
                                            },
                                            '& .MuiStepIcon-root': {
                                                width: 24,
                                                height: 24,
                                                color: index < currentStepIndex ? 'primary.main' :
                                                    index === currentStepIndex ? 'primary.main' : 'divider',
                                                '&.Mui-active': { color: 'primary.main' },
                                                '&.Mui-completed': { color: 'primary.main' },
                                            }
                                        }}
                                    >
                                        {step.label}
                                    </StepLabel>
                                </Step>
                            );
                        })}
                    </Stepper>
                </Container>
            </Paper>

            {/* Content area */}
            <Box component="main" sx={{ flexGrow: 1, py: 6, display: 'flex', justifyContent: 'center' }}>
                <Container maxWidth="lg">
                    <Outlet />
                </Container>
            </Box>
        </Box>
    );
}
