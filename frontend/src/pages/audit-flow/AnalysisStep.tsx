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
    Card,
    CardContent,
    LinearProgress,
    Chip,
    IconButton,
    Collapse,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow
} from "@mui/material";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import RefreshIcon from '@mui/icons-material/Refresh';
import ScienceIcon from '@mui/icons-material/Science';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import client from "../../app/api";

// ─── Interfaces matching AnalysisOutput from backend v2 ─────────────────────────

interface EvaluatedRule {
    rule_id: string;
    passed: boolean;
    metric_values: Record<string, string | number | boolean>;
    detail: string;
}

interface PracticeResult {
    practice: string;
    score: number;
    max_score: number;
    level: string;
    evaluated_rules: EvaluatedRule[];
    generated_findings: string[];
}

interface RepositoryAnalysisResult {
    repository: string;
    practice_results: PracticeResult[];
}

interface PracticeScoreAggregate {
    score: number;
    max_score: number;
    level: string;
}

interface AnalysisFinding {
    finding_id: string;
    repository: string;
    practice: string;
    severity: "HIGH" | "MEDIUM" | "LOW";
    title: string;
    description: string;
    rule_violated: string;
    standard_reference: string;
    evidence_snapshot: Record<string, string | number | boolean>;
    analysis_source_id: string;
}

interface AnalysisOutput {
    analysis_id: string;
    audit_id: string;
    executed_at: string;
    repository_results: RepositoryAnalysisResult[];
    aggregated_results: {
        practice_scores: Record<string, PracticeScoreAggregate>;
        global_maturity_level: string;
    };
    findings: AnalysisFinding[];
}

// ─── Component ──────────────────────────────────────────────────────────────────

export function AnalysisStep() {
    const navigate = useNavigate();
    const { id: auditId } = useParams();
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<AnalysisOutput | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
    const [expandedRules, setExpandedRules] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (auditId) {
            client
                .get(`/audits/${auditId}/analysis`)
                .then((res) => setResult(res.data))
                .catch(() => { });
        }
    }, [auditId]);

    const handleRunAnalysis = async () => {
        setIsRunning(true);
        setError(null);
        try {
            const res = await client.post(`/audits/${auditId}/analysis`);
            setResult(res.data);
            setSelectedRepo(null);
        } catch (err: any) {
            setError(
                err.response?.data?.error ||
                "Error al ejecutar el análisis. Asegúrese de haber recolectado la evidencia."
            );
        } finally {
            setIsRunning(false);
        }
    };

    const maturityColor = (level: string) => {
        switch (level) {
            case "Inicial": return "#ef4444";
            case "Gestionado": return "#f59e0b";
            case "Definido": return "#10b981";
            default: return "#94a3b8";
        }
    };

    const severityBadge = (severity: string) => {
        const configs: Record<string, { color: string; bg: string }> = {
            HIGH: { color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" },
            MEDIUM: { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" },
            LOW: { color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" },
        };
        const c = configs[severity] || configs.LOW;
        return (
            <Chip
                label={severity}
                size="small"
                sx={{
                    bgcolor: c.bg,
                    color: c.color,
                    fontWeight: 800,
                    borderRadius: '6px',
                    fontSize: '11px',
                    border: '1px solid',
                    borderColor: alpha(c.color, 0.2)
                }}
            />
        );
    };

    const toggleRuleExpand = (key: string) => {
        setExpandedRules(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const activeRepo = selectedRepo
        ? result?.repository_results.find(r => r.repository === selectedRepo)
        : null;

    return (
        <Box sx={{ width: "100%", maxWidth: "1200px", mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 1 }}>
                    <Box>
                        <Typography variant="overline" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '0.1em' }}>
                            Paso 3 de 5 • Análisis Estratégico
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                            Resultados del Análisis
                        </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right", display: { xs: 'none', sm: 'block' } }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>
                            50% Completado
                        </Typography>
                        <Box sx={{ width: "200px", height: "6px", bgcolor: alpha('#fff', 0.1), borderRadius: "3px", mt: 1, overflow: 'hidden' }}>
                            <Box sx={{ width: "50%", height: "100%", bgcolor: "primary.main" }} />
                        </Box>
                    </Box>
                </Stack>
                <Typography variant="body1" sx={{ color: "text.secondary", mt: 2 }}>
                    Evaluación multidimensional basada en el estándar DevAudit v1.0, cruzando métricas y evidencias técnicas.
                </Typography>
            </Box>

            {!result ? (
                <Paper sx={{
                    p: 8,
                    textAlign: 'center',
                    borderRadius: '24px',
                    bgcolor: alpha('#1e293b', 0.4),
                    border: '1px solid',
                    borderColor: 'divider',
                    backdropFilter: 'blur(20px)',
                }}>
                    <ScienceIcon sx={{ fontSize: 64, color: alpha('#fff', 0.2), mb: 2 }} />
                    <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>Motor de Análisis Listo</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, maxWidth: 500, mx: 'auto' }}>
                        Evaluaremos cada repositorio contra el estándar para calcular niveles de madurez con trazabilidad completa.
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={isRunning ? <CircularProgress size={20} color="inherit" /> : <ScienceIcon />}
                        onClick={handleRunAnalysis}
                        disabled={isRunning}
                        sx={{ borderRadius: '12px', py: 1.5, px: 4 }}
                    >
                        {isRunning ? "Ejecutando Análisis..." : "Ejecutar Análisis Técnico"}
                    </Button>
                    {error && <Typography color="error" variant="caption" sx={{ display: 'block', mt: 2 }}>{error}</Typography>}
                </Paper>
            ) : (
                <Stack spacing={4}>
                    {/* Results Dashboard Summary */}
                    <Paper sx={{
                        p: 4,
                        borderRadius: '24px',
                        bgcolor: alpha('#1e293b', 0.4),
                        border: '1px solid',
                        borderColor: 'divider',
                        backdropFilter: 'blur(20px)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                    }}>
                        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                            <CircularProgress
                                variant="determinate"
                                value={100}
                                size={100}
                                thickness={4}
                                sx={{ color: alpha('#fff', 0.05) }}
                            />
                            <CircularProgress
                                variant="determinate"
                                value={((result.aggregated_results.global_maturity_level === "Definido" ? 100 : result.aggregated_results.global_maturity_level === "Gestionado" ? 66 : 33))}
                                size={100}
                                thickness={4}
                                sx={{
                                    color: maturityColor(result.aggregated_results.global_maturity_level),
                                    position: 'absolute',
                                    left: 0,
                                    '& .MuiCircularProgress-circle': { strokeLinecap: 'round' }
                                }}
                            />
                            <Box sx={{
                                top: 0, left: 0, bottom: 0, right: 0, position: 'absolute',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Typography variant="h6" sx={{ fontWeight: 800, color: maturityColor(result.aggregated_results.global_maturity_level) }}>
                                    {result.aggregated_results.global_maturity_level.charAt(0)}
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary' }}>Nivel de Madurez Global</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: maturityColor(result.aggregated_results.global_maturity_level) }}>
                                {result.aggregated_results.global_maturity_level}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                                {result.repository_results.length} repositorios evaluados • {result.findings.length} hallazgos generados
                            </Typography>
                        </Box>
                        <Button
                            startIcon={<RefreshIcon />}
                            variant="outlined"
                            onClick={handleRunAnalysis}
                            disabled={isRunning}
                            sx={{ borderRadius: '10px' }}
                        >
                            {isRunning ? "Re-ejecutando..." : "Re-analizar"}
                        </Button>
                    </Paper>

                    {/* Practice Scores Grid */}
                    <Grid container spacing={3}>
                        {Object.entries(result.aggregated_results.practice_scores).map(([code, data]) => {
                            const names: Record<string, string> = { SCM: "Gestión de Configuración", QA: "Aseguramiento de Calidad", PM: "Gestión de Proyecto" };
                            const color = maturityColor(data.level);
                            return (
                                <Grid size={{ xs: 12, md: 4 }} key={code}>
                                    <Card sx={{
                                        height: '100%',
                                        bgcolor: alpha('#1e293b', 0.4),
                                        borderRadius: '20px',
                                        border: '1px solid',
                                        borderColor: alpha(color, 0.2),
                                        position: 'relative',
                                        '&:before': {
                                            content: '""',
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '4px',
                                            height: '100%',
                                            bgcolor: color
                                        }
                                    }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                                                <Box>
                                                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>{code}</Typography>
                                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{names[code] || code}</Typography>
                                                </Box>
                                                <Chip
                                                    label={data.level}
                                                    size="small"
                                                    sx={{ bgcolor: alpha(color, 0.1), color: color, fontWeight: 800, fontSize: '10px' }}
                                                />
                                            </Stack>
                                            <Box sx={{ mb: 1 }}>
                                                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Cumplimiento</Typography>
                                                    <Typography variant="caption" sx={{ fontWeight: 800 }}>{data.score} / {data.max_score}</Typography>
                                                </Stack>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={data.max_score > 0 ? (data.score / data.max_score) * 100 : 0}
                                                    sx={{
                                                        height: 6,
                                                        borderRadius: 3,
                                                        bgcolor: alpha('#fff', 0.05),
                                                        '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 }
                                                    }}
                                                />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>

                    {/* Repository Breakdown */}
                    <Paper sx={{
                        p: 3,
                        borderRadius: '24px',
                        bgcolor: alpha('#1e293b', 0.4),
                        border: '1px solid',
                        borderColor: 'divider',
                        backdropFilter: 'blur(20px)',
                    }}>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                            <Box sx={{ p: 1, borderRadius: '8px', bgcolor: alpha('#fff', 0.05), color: 'primary.main' }}>
                                <AnalyticsIcon />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>Análisis Detallado por Repositorio</Typography>
                        </Stack>

                        <Stack direction="row" spacing={1} sx={{ mb: 4, flexWrap: 'wrap', gap: 1 }}>
                            {result.repository_results.map(rr => (
                                <Chip
                                    key={rr.repository}
                                    label={rr.repository}
                                    onClick={() => setSelectedRepo(selectedRepo === rr.repository ? null : rr.repository)}
                                    color={selectedRepo === rr.repository ? "primary" : "default"}
                                    variant={selectedRepo === rr.repository ? "filled" : "outlined"}
                                    sx={{ borderRadius: '10px', fontWeight: 600 }}
                                />
                            ))}
                        </Stack>

                        {activeRepo && (
                            <Stack spacing={2}>
                                {activeRepo.practice_results.map(pr => (
                                    <Box key={pr.practice} sx={{
                                        borderRadius: '16px',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        overflow: 'hidden'
                                    }}>
                                        <Box sx={{
                                            p: 2,
                                            bgcolor: alpha('#fff', 0.03),
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <Stack direction="row" spacing={2} alignItems="center">
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{pr.practice}</Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    {pr.score}/{pr.max_score} puntos — {pr.level}
                                                </Typography>
                                            </Stack>
                                            <Chip
                                                label={pr.level}
                                                size="small"
                                                sx={{ bgcolor: alpha(maturityColor(pr.level), 0.1), color: maturityColor(pr.level), fontWeight: 800, fontSize: '10px' }}
                                            />
                                        </Box>
                                        <Box sx={{ p: 1 }}>
                                            {pr.evaluated_rules.map(rule => {
                                                const ruleKey = `${activeRepo.repository}-${rule.rule_id}`;
                                                const isExpanded = expandedRules[ruleKey];
                                                return (
                                                    <Box key={rule.rule_id} sx={{
                                                        borderBottom: '1px solid',
                                                        borderColor: alpha('#fff', 0.05),
                                                        '&:last-child': { borderBottom: 'none' }
                                                    }}>
                                                        <Box
                                                            onClick={() => toggleRuleExpand(ruleKey)}
                                                            sx={{
                                                                p: 1.5,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 2,
                                                                cursor: 'pointer',
                                                                '&:hover': { bgcolor: alpha('#fff', 0.02) }
                                                            }}
                                                        >
                                                            {rule.passed ?
                                                                <CheckCircleOutlineIcon sx={{ color: 'success.main', fontSize: 18 }} /> :
                                                                <ErrorOutlineIcon sx={{ color: 'error.main', fontSize: 18 }} />
                                                            }
                                                            <Typography sx={{ fontSize: '13px', fontWeight: 700, fontFamily: 'monospace', color: rule.passed ? 'success.light' : 'error.light', minWidth: 100 }}>
                                                                {rule.rule_id}
                                                            </Typography>
                                                            <Typography sx={{ fontSize: '13px', flex: 1, color: 'text.secondary' }}>
                                                                {rule.detail}
                                                            </Typography>
                                                            <IconButton size="small">
                                                                {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                                            </IconButton>
                                                        </Box>
                                                        <Collapse in={isExpanded}>
                                                            <Box sx={{ p: 2, mx: 2, mb: 1, borderRadius: '8px', bgcolor: alpha('#000', 0.2) }}>
                                                                <Typography variant="overline" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 1 }}>Evidencia Recolectada</Typography>
                                                                {Object.entries(rule.metric_values).map(([k, v]) => (
                                                                    <Stack key={k} direction="row" spacing={1} sx={{ mb: 0.5 }}>
                                                                        <Typography sx={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 800, color: 'primary.light' }}>{k}:</Typography>
                                                                        <Typography sx={{ fontFamily: 'monospace', fontSize: '12px' }}>{String(v)}</Typography>
                                                                    </Stack>
                                                                ))}
                                                            </Box>
                                                        </Collapse>
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    </Box>
                                ))}
                            </Stack>
                        )}
                    </Paper>

                    {/* Findings Matrix */}
                    {result.findings.length > 0 && (
                        <Paper sx={{
                            borderRadius: '24px',
                            bgcolor: alpha('#1e293b', 0.4),
                            border: '1px solid',
                            borderColor: 'divider',
                            backdropFilter: 'blur(20px)',
                            overflow: 'hidden'
                        }}>
                            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha('#fff', 0.02) }}>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>Matriz de Hallazgos Potenciales</Typography>
                            </Box>
                            <Box sx={{ overflowX: 'auto' }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: alpha('#fff', 0.03) }}>
                                            <TableCell sx={{ fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', color: 'text.secondary' }}>Repositorio</TableCell>
                                            <TableCell sx={{ fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', color: 'text.secondary' }}>Práctica</TableCell>
                                            <TableCell sx={{ fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', color: 'text.secondary' }}>Severidad</TableCell>
                                            <TableCell sx={{ fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', color: 'text.secondary' }}>Hallazgo</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {result.findings.map(f => (
                                            <TableRow key={f.finding_id} sx={{ '&:hover': { bgcolor: alpha('#fff', 0.02) } }}>
                                                <TableCell sx={{ fontSize: '12px', fontWeight: 600 }}>{f.repository}</TableCell>
                                                <TableCell sx={{ fontSize: '12px', color: 'primary.light', fontWeight: 700 }}>{f.practice}</TableCell>
                                                <TableCell>{severityBadge(f.severity)}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '13px' }}>{f.title}</Typography>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{f.rule_violated}</Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                        </Paper>
                    )}
                </Stack>
            )}

            {/* Footer Navigation */}
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 6, pt: 4, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(`/audit/${auditId}/evidence`)}
                    sx={{ color: 'text.secondary', fontWeight: 800 }}
                >
                    Volver a Evidencia
                </Button>
                <Button
                    variant="contained"
                    disabled={!result}
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate(`/audit/${auditId}/findings`)}
                    sx={{ borderRadius: '12px', py: 1.5, px: 4, fontWeight: 800 }}
                >
                    Continuar a Hallazgos
                </Button>
            </Stack>
        </Box>
    );
}
