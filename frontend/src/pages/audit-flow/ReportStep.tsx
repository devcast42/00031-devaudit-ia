import React, { useEffect, useState, useRef, Fragment } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Box,
    Typography,
    Button,
    Paper,
    Tabs,
    Tab,
    Divider,
    LinearProgress,
    Stack,
    alpha,
    Alert,
    CircularProgress,
    Grid,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogContent,
    DialogActions,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
} from "@mui/material";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import LockIcon from '@mui/icons-material/Lock';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import VerifiedIcon from '@mui/icons-material/Verified';
import AssessmentIcon from '@mui/icons-material/Assessment';
import client from "../../app/api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { asBlob } from 'html-docx-js-typescript';
import { saveAs } from 'file-saver';
import { ThemeProvider } from '@mui/material/styles';
import { lightTheme } from "../../styles/theme";


// ─── Interfaces ────────────────────────────────────────────────────────────────
// (Keeping existing interfaces as they are correct)
interface ReportMetadata { report_id: string; audit_id: string; generated_at: string; generated_by: string; status: "draft" | "finalized"; version: number; }
interface CoverPage { audit_name: string; organization: string; review_period: string; standard_used: string; issue_date: string; report_version: number; status: string; repositories_count: number; repositories: string[]; }
interface ExecutiveSummary { global_maturity_level: string; global_compliance_percentage: number; maturity_interpretation: string; principal_risks: string[]; organizational_impact: string; severity_summary: { high: number; medium: number; low: number; total: number }; general_recommendation: string; }
interface PracticeRuleDetail { rule_id: string; title: string; passed: boolean; detail: string; standard_reference: string; }
interface PracticeDetailSection { practice_code: string; practice_name: string; score: number; max_score: number; maturity_level: string; rules_passed: PracticeRuleDetail[]; rules_failed: PracticeRuleDetail[]; associated_findings_count: number; aggregated_risk: string; technical_explanation: string; }
interface FindingsMatrixEntry { id: string; practice: string; repository: string; severity: string; title: string; description: string; evidence: Record<string, string | number | boolean>; rule_violated: string; standard_reference: string; impact: string; recommendation: string; status: string; }
interface TraceabilityChain { finding_id: string; repository: string; evidence_metric: string; evidence_value: string | number | boolean; rule_evaluated: string; rule_result: string; finding_title: string; severity: string; practice: string; practice_level: string; contribution_to_global: string; }
interface TraceabilitySection { chains: TraceabilityChain[]; methodology_explanation: string; scoring_explanation: string; }
interface CriticalArea { area: string; risk_level: string; findings_count: number; description: string; }
interface RiskAnalysis { global_risk_level: string; global_risk_score: number; risk_classification: string; critical_areas: CriticalArea[]; weakness_dependencies: string[]; }
interface PrioritizedRecommendation { priority: number; finding_id: string; action: string; practice: string; severity: string; impact: string; implementation_ease: string; suggested_responsible: string; recommended_deadline: string; }
interface RoadmapItem { phase: string; action: string; practice: string; related_finding_id: string; expected_outcome: string; }
interface ImprovementRoadmap { short_term: RoadmapItem[]; medium_term: RoadmapItem[]; long_term: RoadmapItem[]; }
interface TechnicalConclusion { current_state: string; gaps_against_standard: string[]; risk_of_inaction: string; scalability_readiness: string; }

interface ProfessionalReportData {
    metadata: ReportMetadata;
    cover_page: CoverPage;
    executive_summary: ExecutiveSummary;
    practice_details: PracticeDetailSection[];
    findings_matrix: FindingsMatrixEntry[];
    traceability: TraceabilitySection;
    risk_analysis: RiskAnalysis;
    recommendations: PrioritizedRecommendation[];
    roadmap: ImprovementRoadmap;
    conclusion: TechnicalConclusion;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export function ReportStep() {
    const navigate = useNavigate();
    const { id: auditId } = useParams();
    const [data, setData] = useState<ProfessionalReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [finalizing, setFinalizing] = useState(false);
    const [showFinalizeModal, setShowFinalizeModal] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState(0);
    const [expandedFinding, setExpandedFinding] = useState<string | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    const isFinalized = data?.metadata.status === "finalized";

    useEffect(() => {
        if (auditId) {
            client.get(`/audits/${auditId}/report`).then(r => setData(r.data)).catch(() => { }).finally(() => setLoading(false));
        }
    }, [auditId]);

    const handleGenerate = async () => {
        setGenerating(true);
        setError(null);
        try { const r = await client.post(`/audits/${auditId}/report/generate`); setData(r.data); }
        catch (e: any) { setError(e.response?.data?.error || "Error al generar el informe."); }
        finally { setGenerating(false); }
    };

    const handleFinalize = async () => {
        setFinalizing(true);
        setError(null);
        try {
            const r = await client.post(`/audits/${auditId}/report/finalize`);
            setData(r.data);
            setShowFinalizeModal(false);
        }
        catch (e: any) {
            setError(e.response?.data?.error || "Error al finalizar.");
            setShowFinalizeModal(false);
        }
        finally { setFinalizing(false); }
    };

    const handleExportPDF = async () => {
        if (!printRef.current) return;
        try {
            const element = printRef.current;
            element.style.display = "block";
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                windowWidth: 1000
            });
            element.style.display = "none";

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = 210;
            const pdfHeight = 297;
            const imgWidth = pdfWidth;
            const imgHeight = (canvas.height * pdfWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight;
            }
            pdf.save(`Informe_Auditoria_${data?.cover_page?.organization || auditId}.pdf`);
        } catch (e) { console.error(e); }
    };

    const handleExportWord = async () => {
        if (!printRef.current) return;
        try {
            const element = printRef.current;
            element.style.display = "block";

            // Create a clone to manipulate for Word export
            const clone = element.cloneNode(true) as HTMLElement;
            element.style.display = "none";

            // Transformation: Replace modern Grids/Stacks with tables for Word compatibility
            const grids = clone.querySelectorAll('.MuiGrid-container');
            grids.forEach(grid => {
                const table = document.createElement('table');
                table.style.width = '100%';
                table.style.borderCollapse = 'collapse';
                table.style.marginBottom = '20px';

                const tr = document.createElement('tr');
                const items = grid.querySelectorAll('.MuiGrid-item, [class*="MuiGrid-grid-"]');

                items.forEach(item => {
                    const td = document.createElement('td');
                    td.style.verticalAlign = 'top';
                    td.style.padding = '10px';
                    // Simple logic for 2-column layout usually found in our report
                    td.style.width = items.length > 1 ? `${Math.floor(100 / items.length)}%` : '100%';
                    td.innerHTML = item.innerHTML;
                    tr.appendChild(td);
                });

                table.appendChild(tr);
                grid.parentNode?.replaceChild(table, grid);
            });

            // Specific Fix for standardized Tables (like Findings Matrix)
            const tables = clone.querySelectorAll('table');
            tables.forEach(table => {
                table.style.width = '100%';
                table.style.border = '1px solid #e2e8f0';
                table.style.tableLayout = 'fixed';

                const rows = table.querySelectorAll('tr');
                rows.forEach(row => {
                    const cells = row.querySelectorAll('th, td');
                    if (cells.length === 5) { // Match Findings matrix
                        const widths = ['10%', '15%', '35%', '20%', '20%'];
                        cells.forEach((cell, idx) => {
                            (cell as HTMLElement).setAttribute('width', widths[idx]);
                            (cell as HTMLElement).style.width = widths[idx];
                            (cell as HTMLElement).style.wordWrap = 'break-word';
                            (cell as HTMLElement).style.wordBreak = 'break-all';
                        });
                    }
                });
            });

            const html = clone.innerHTML;

            const fullHtml = `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <title>Informe de Auditoría Professional</title>
                    <style>
                        * { box-sizing: border-box; }
                        body { 
                            font-family: 'Arial', sans-serif; 
                            line-height: 1.3;
                            color: #333;
                            padding: 24pt;
                            font-size: 10pt;
                            width: 100%;
                        }
                        h1, h2, h3 { color: #2563eb; margin-top: 15pt; margin-bottom: 8pt; }
                        table { width: 100%; border: 1px solid #ddd; border-collapse: collapse; margin-bottom: 15pt; table-layout: fixed; }
                        th, td { border: 1px solid #ddd; padding: 4pt; text-align: left; vertical-align: top; word-wrap: break-word; word-break: break-all; }
                        th { background-color: #f8fafc; font-weight: bold; color: #475569; }
                        .MuiTypography-root { margin-bottom: 5pt; }
                        .MuiPaper-root, .MuiCard-root { border: 1px solid #eee; padding: 10pt; margin-bottom: 10pt; }
                    </style>
                </head>
                <body>
                    ${html}
                </body>
            </html>
            `;

            const blob = await asBlob(fullHtml);
            saveAs(blob as any, `Informe_Auditoria_${data?.cover_page?.organization || auditId}.docx`);
        } catch (e) {
            console.error("Word Export Error:", e);
        }
    };

    const SECTIONS = ["Portada", "Resumen Ejecutivo", "Prácticas", "Hallazgos", "Trazabilidad", "Riesgo", "Recomendaciones", "Roadmap", "Conclusión"];

    if (loading) return (
        <Box sx={{ py: 10, textAlign: 'center' }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Cargando informe...</Typography>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
            {/* Hidden template for PDF export */}
            <div ref={printRef} style={{ display: "none" }}>
                <ThemeProvider theme={lightTheme}>
                    {data && <PrintTemplate data={data} />}
                </ThemeProvider>
            </div>

            {/* Main Content */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 1 }}>
                        <Box>
                            <Typography variant="overline" sx={{ fontWeight: 800, color: 'primary.main', mb: 0.5, display: 'block' }}>
                                Paso 5 de 5 • Reporte
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 800 }}>Informe Profesional de Auditoría</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right', minWidth: 200 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                                {isFinalized ? "100%" : "83%"} Completado
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={isFinalized ? 100 : 83}
                                sx={{ height: 6, borderRadius: 3, bgcolor: alpha('#fff', 0.1), '& .MuiLinearProgress-bar': { borderRadius: 3 } }}
                            />
                        </Box>
                    </Stack>
                    <Divider sx={{ mt: 3, mb: 4 }} />
                </Box>

                {isFinalized && (
                    <Alert
                        severity="success"
                        icon={<LockIcon />}
                        sx={{
                            borderRadius: '16px', mb: 4,
                            bgcolor: alpha('#10b981', 0.1), color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)',
                            '& .MuiAlert-icon': { color: '#34d399' }
                        }}
                    >
                        <Typography sx={{ fontWeight: 700 }}>Auditoría Finalizada</Typography>
                        <Typography variant="body2">
                            Finalizada el {new Date(data!.metadata.generated_at).toLocaleString()}. No se permiten más modificaciones.
                        </Typography>
                    </Alert>
                )}

                {!data ? (
                    <Paper sx={{ p: 8, textAlign: 'center', borderRadius: '24px' }}>
                        <DescriptionIcon sx={{ fontSize: 64, mb: 2, color: alpha('#fff', 0.2) }} />
                        <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>Generar Informe Profesional</Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, maxWidth: 500, mx: 'auto' }}>
                            Consolide análisis, hallazgos y recomendaciones en un informe formal con 9 secciones profesionales, listo para comité directivo.
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                            onClick={handleGenerate}
                            disabled={generating}
                        >
                            {generating ? "Generando..." : "Generar Informe"}
                        </Button>
                        {error && <Typography color="error" variant="caption" sx={{ display: 'block', mt: 2 }}>{error}</Typography>}
                    </Paper>
                ) : (
                    <>
                        {!isFinalized && (
                            <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
                                <Button
                                    variant="outlined"
                                    color="inherit"
                                    startIcon={<RefreshIcon />}
                                    onClick={handleGenerate}
                                    disabled={generating}
                                    sx={{ borderRadius: '10px' }}
                                >
                                    {generating ? "Actualizando..." : "Actualizar"}
                                </Button>
                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={<LockIcon />}
                                    onClick={() => setShowFinalizeModal(true)}
                                    sx={{ borderRadius: '10px' }}
                                >
                                    Finalizar Auditoría
                                </Button>
                            </Stack>
                        )}
                        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                        {/* Section Navigation Tabs */}
                        <Paper sx={{ p: 1, mb: 4, borderRadius: '14px', bgcolor: alpha('#1e293b', 0.5) }}>
                            <Tabs
                                value={activeSection}
                                onChange={(_, v) => setActiveSection(v)}
                                variant="scrollable"
                                scrollButtons="auto"
                                sx={{
                                    minHeight: 48,
                                    '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' }
                                }}
                            >
                                {SECTIONS.map((s, i) => (
                                    <Tab
                                        key={s}
                                        label={`${i + 1}. ${s}`}
                                        sx={{
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            fontSize: '13px',
                                            minHeight: 48,
                                            '&.Mui-selected': { color: 'primary.main' }
                                        }}
                                    />
                                ))}
                            </Tabs>
                        </Paper>

                        <Box className="report-canvas" sx={{
                            bgcolor: 'background.paper',
                            borderRadius: '24px',
                            border: '1px solid',
                            borderColor: 'divider',
                            p: { xs: 3, md: 6 },
                            minHeight: 600,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                        }}>
                            {activeSection === 0 && <CoverView data={data.cover_page} />}
                            {activeSection === 1 && <ExecutiveView data={data.executive_summary} practices={data.practice_details} />}
                            {activeSection === 2 && <PracticesView data={data.practice_details} />}
                            {activeSection === 3 && <FindingsView data={data.findings_matrix} expandedFinding={expandedFinding} setExpandedFinding={setExpandedFinding} />}
                            {activeSection === 4 && <TraceabilityView data={data.traceability} />}
                            {activeSection === 5 && <RiskView data={data.risk_analysis} />}
                            {activeSection === 6 && <RecommendationsView data={data.recommendations} />}
                            {activeSection === 7 && <RoadmapView data={data.roadmap} />}
                            {activeSection === 8 && <ConclusionView data={data.conclusion} />}
                        </Box>
                    </>
                )}

                {/* Footer Navigation */}
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 6, pt: 4, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button
                        startIcon={<ArrowBackIosNewIcon fontSize="small" />}
                        onClick={() => navigate(`/audit/${auditId}/findings`)}
                        color="inherit"
                        sx={{ fontWeight: 600 }}
                    >
                        Volver a Hallazgos
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => navigate("/")}
                        sx={{ borderRadius: '10px', px: 3 }}
                    >
                        Volver a Auditorías
                    </Button>
                </Stack>
            </Box>

            {/* Sidebar Actions */}
            {data && (
                <Box sx={{ width: 300, flexShrink: 0, position: 'sticky', top: 24 }}>
                    <Stack spacing={3}>
                        <SectionBox title="Acciones">
                            <Stack spacing={2}>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    startIcon={<PictureAsPdfIcon />}
                                    onClick={handleExportPDF}
                                    sx={{ py: 1.5, borderRadius: '12px' }}
                                >
                                    <Box sx={{ textAlign: 'left', flex: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>Exportar PDF</Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>Formato estándar</Typography>
                                    </Box>
                                </Button>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    color="inherit"
                                    startIcon={<DescriptionIcon />}
                                    onClick={handleExportWord}
                                    sx={{ py: 1.5, borderRadius: '12px' }}
                                >
                                    <Box sx={{ textAlign: 'left', flex: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>Exportar Word</Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Formato editable</Typography>
                                    </Box>
                                </Button>
                            </Stack>
                        </SectionBox>

                        <SectionBox title="Contenido">
                            <Stack spacing={0.5}>
                                {SECTIONS.map((s, i) => (
                                    <Button
                                        key={s}
                                        fullWidth
                                        size="small"
                                        onClick={() => setActiveSection(i)}
                                        sx={{
                                            justifyContent: 'flex-start',
                                            py: 1, px: 1.5, borderRadius: '8px',
                                            bgcolor: activeSection === i ? alpha('#2563eb', 0.1) : 'transparent',
                                            color: activeSection === i ? 'primary.main' : 'text.secondary',
                                            fontWeight: activeSection === i ? 700 : 500,
                                            fontSize: '13px',
                                            '&:hover': { bgcolor: alpha('#2563eb', 0.05) }
                                        }}
                                    >
                                        {i + 1}. {s}
                                    </Button>
                                ))}
                            </Stack>
                        </SectionBox>

                        <SectionBox title="Información">
                            <Stack spacing={1.5}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Versión</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>v{data.metadata.version}.0</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Generado</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{new Date(data.metadata.generated_at).toLocaleString()}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Estado</Typography>
                                    <Chip
                                        label={data.metadata.status === "finalized" ? "Finalizado" : "Borrador"}
                                        size="small"
                                        color={data.metadata.status === "finalized" ? "success" : "warning"}
                                        sx={{ height: 20, fontSize: '10px', fontWeight: 800, ml: 1 }}
                                    />
                                </Box>
                            </Stack>
                        </SectionBox>
                    </Stack>
                </Box>
            )}

            {/* Finalize Modal */}
            <Dialog
                open={showFinalizeModal}
                onClose={() => !finalizing && setShowFinalizeModal(false)}
                PaperProps={{ sx: { borderRadius: '24px', p: 2, maxWidth: 450 } }}
            >
                <DialogContent sx={{ textAlign: 'center', py: 4 }}>
                    <Box sx={{
                        width: 64, height: 64, borderRadius: '50%', bgcolor: alpha('#f59e0b', 0.1),
                        display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3
                    }}>
                        <WarningAmberIcon sx={{ fontSize: 32, color: '#f59e0b' }} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>¿Finalizar Auditoría?</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                        Esto bloqueará permanentemente la auditoría y su reporte. Esta acción no se puede deshacer.
                    </Typography>
                    <Alert severity="warning" sx={{ borderRadius: '12px', textAlign: 'left' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            ⚠️ Una vez finalizado, no podrá editar ningún paso de esta auditoría.
                        </Typography>
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 4, justifyContent: 'center', gap: 2 }}>
                    <Button
                        onClick={() => setShowFinalizeModal(false)}
                        disabled={finalizing}
                        color="inherit"
                        sx={{ fontWeight: 600 }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleFinalize}
                        disabled={finalizing}
                        startIcon={finalizing ? <CircularProgress size={16} color="inherit" /> : <LockIcon />}
                        sx={{ borderRadius: '10px', px: 4 }}
                    >
                        {finalizing ? "Finalizando..." : "Finalizar y Bloquear"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

// ─── Sub-Views (Restored to Section/SubSection Pattern) ───────────────────────

function CoverView({ data }: { data: CoverPage }) {
    return (
        <Box sx={{ py: 4 }}>
            <Box sx={{ mb: 10, textAlign: 'center' }}>
                <Box sx={{
                    width: 80, height: 80, borderRadius: '20px',
                    background: 'linear-gradient(135deg, #2563eb 0%, #6366f1 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 900, fontSize: '32px', mb: 3, mx: 'auto',
                    boxShadow: '0 8px 32px rgba(37, 99, 235, 0.3)'
                }}>D</Box>
                <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: '-0.025em', mb: 1, color: 'text.primary' }}>DevAudit IA</Typography>
                <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 500 }}>Reporte de Evaluación Técnica</Typography>
            </Box>

            <Grid container spacing={3} sx={{ mb: 8 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
                        <CardContent sx={{ p: 4 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                <BusinessIcon sx={{ color: 'primary.main' }} />
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>Entidad Evaluada</Typography>
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>{data.organization}</Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Proyecto: {data.audit_name}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ height: '100%', bgcolor: 'background.paper' }}>
                        <CardContent sx={{ p: 4 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                <CalendarMonthIcon sx={{ color: 'primary.main' }} />
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>Periodo y Emisión</Typography>
                            </Box>
                            <DLabel>Periodo de Revisión</DLabel>
                            <DVal>{data.review_period}</DVal>
                            <Box sx={{ mt: 2 }}>
                                <DLabel>Fecha de Emisión</DLabel>
                                <DVal>{data.issue_date}</DVal>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Box sx={{ p: 4, borderRadius: '24px', bgcolor: alpha('#2563eb', 0.05), border: '1px solid', borderColor: alpha('#2563eb', 0.1) }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Especificaciones de Auditoría</Typography>
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <DLabel>Estándar</DLabel>
                        <Chip label={data.standard_used} size="small" variant="outlined" sx={{ mt: 0.5, fontWeight: 700 }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <DLabel>Versión Informe</DLabel>
                        <DVal>v{data.report_version}.0</DVal>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <DLabel>Estado</DLabel>
                        <Chip
                            label={data.status === "finalized" ? "FINALIZADO" : "BORRADOR"}
                            size="small"
                            color={data.status === "finalized" ? "success" : "warning"}
                            sx={{ mt: 0.5, fontWeight: 800, height: 20, fontSize: '10px' }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <DLabel>Repositorios Analizados</DLabel>
                        <DVal>{data.repositories_count} Sources</DVal>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}

function ExecutiveView({ data, practices }: { data: ExecutiveSummary; practices: PracticeDetailSection[] }) {
    return (
        <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 4, color: 'text.primary' }}>Resumen Ejecutivo</Typography>
            <Grid container spacing={4}>
                {/* Score and Maturity Card */}
                <Grid size={{ xs: 12, lg: 5 }}>
                    <Card sx={{ p: 4, textAlign: 'center', height: '100%', bgcolor: 'background.paper', position: 'relative' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 3 }}>Nivel de Madurez Global</Typography>
                        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3, justifyContent: 'center', alignItems: 'center' }}>
                            <CircularProgress
                                variant="determinate"
                                value={Math.round((data.global_compliance_percentage || 0) * 100)}
                                size={150}
                                thickness={5}
                                sx={{
                                    color: maturityColor(data.global_maturity_level),
                                    '& .MuiCircularProgress-circle': { strokeLinecap: 'round' }
                                }}
                            />
                            <Box
                                sx={{
                                    top: 0, left: 0, bottom: 0, right: 0,
                                    position: 'absolute',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Typography variant="h3" sx={{ fontWeight: 900, color: maturityColor(data.global_maturity_level) }}>
                                    {Math.round((data.global_compliance_percentage || 0) * 100)}%
                                </Typography>
                            </Box>
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: maturityColor(data.global_maturity_level), mb: 1 }}>
                            {data.global_maturity_level}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Métrica consolidada basada en {practices.length} dominios analizados</Typography>
                    </Card>
                </Grid>

                {/* Interpretation and Risks */}
                <Grid size={{ xs: 12, lg: 7 }}>
                    <Stack spacing={3}>
                        <Box>
                            <DLabel>Interpretación Estratégica</DLabel>
                            <Typography variant="body2" sx={{ lineHeight: 1.7, color: 'text.primary' }}>{data.maturity_interpretation}</Typography>
                        </Box>
                        <Box>
                            <DLabel>Riesgos Principales Identificados</DLabel>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                                {data.principal_risks.map((r, i) => (
                                    <Chip key={i} label={r} size="small" sx={{ bgcolor: alpha('#ef4444', 0.1), color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', fontWeight: 600 }} />
                                ))}
                            </Stack>
                        </Box>
                        <Box>
                            <DLabel>Impacto Organizacional</DLabel>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{data.organizational_impact}</Typography>
                        </Box>
                    </Stack>
                </Grid>
            </Grid>

            {/* Severity Summary */}
            <Box sx={{ mt: 6 }}>
                <DLabel>Resumen de Hallazgos por Severidad</DLabel>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                    {Object.entries(data.severity_summary).map(([k, v]) => {
                        if (k === 'total') return null;
                        const label = k === 'high' ? 'Crítico' : k === 'medium' ? 'Medio' : 'Bajo';
                        const color = k === 'high' ? '#ef4444' : k === 'medium' ? '#f59e0b' : '#10b981';
                        return (
                            <Grid size={{ xs: 12, sm: 4 }} key={k}>
                                <Paper sx={{ p: 2, textAlign: 'center', border: '1px solid', borderColor: alpha(color, 0.2), bgcolor: alpha(color, 0.05) }}>
                                    <Typography variant="h4" sx={{ fontWeight: 900, color }}>{v}</Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>{label}</Typography>
                                </Paper>
                            </Grid>
                        );
                    })}
                </Grid>
            </Box>

            <Box sx={{ mt: 6, p: 4, borderRadius: '20px', bgcolor: alpha('#2563eb', 0.1), border: '1px solid', borderColor: alpha('#2563eb', 0.2) }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <VerifiedIcon sx={{ color: 'primary.main' }} />
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>Recomendación General de Auditoría</Typography>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>{data.general_recommendation}</Typography>
                    </Box>
                </Stack>
            </Box>
        </Box>
    );
}

function PracticesView({ data }: { data: PracticeDetailSection[] }) {
    return (
        <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 4, color: 'text.primary' }}>Detalle por Dominio de Práctica</Typography>
            <Stack spacing={4}>
                {data.map((p) => (
                    <Card key={p.practice_code} sx={{ borderRadius: '24px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                        <Box sx={{ px: 4, py: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.paper' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{
                                    width: 32, height: 32, borderRadius: '8px', bgcolor: 'primary.main',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '12px'
                                }}>
                                    {p.practice_code}
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>{p.practice_name}</Typography>
                            </Box>
                            <Chip
                                label={p.maturity_level}
                                size="small"
                                sx={{ bgcolor: alpha(maturityColor(p.maturity_level), 0.1), color: maturityColor(p.maturity_level), fontWeight: 800, border: '1px solid currentColor' }}
                            />
                        </Box>
                        <CardContent sx={{ p: 4 }}>
                            <Grid container spacing={4}>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="h3" sx={{ fontWeight: 900, mb: 0.5, color: 'text.primary' }}>{Math.round((p.score / (p.max_score || 1)) * 100)}%</Typography>
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>Puntaje de Conformidad</Typography>
                                        <LinearProgress
                                            variant="determinate"
                                            value={(p.score / (p.max_score || 1)) * 100}
                                            sx={{ mt: 1, height: 4, borderRadius: 2, bgcolor: alpha('#fff', 0.1) }}
                                        />
                                    </Box>
                                    <Box sx={{ p: 2, borderRadius: '12px', bgcolor: alpha('#1e293b', 0.2), border: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', mb: 1, display: 'block' }}>Resumen de Reglas</Typography>
                                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                                            <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>Cumplidas</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 800 }}>{p.rules_passed.length}</Typography>
                                        </Stack>
                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 600 }}>Incumplidas</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 800 }}>{p.rules_failed.length}</Typography>
                                        </Stack>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, md: 8 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>Justificación Técnica</Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7, mb: 3 }}>{p.technical_explanation}</Typography>

                                    <Box sx={{ display: 'flex', gap: 4 }}>
                                        <Box>
                                            <DLabel>Hallazgos Asociados</DLabel>
                                            <Typography variant="h6" sx={{ fontWeight: 800 }}>{p.associated_findings_count}</Typography>
                                        </Box>
                                        <Box>
                                            <DLabel>Riesgo Agregado</DLabel>
                                            <Chip label={p.aggregated_risk} size="small" sx={{ bgcolor: alpha(riskColor(p.aggregated_risk), 0.1), color: riskColor(p.aggregated_risk), fontWeight: 800, border: '1px solid currentColor' }} />
                                        </Box>
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                ))}
            </Stack>
        </Box>
    );
}

function FindingsView({ data, expandedFinding, setExpandedFinding }: { data: FindingsMatrixEntry[], expandedFinding: string | null, setExpandedFinding: (id: string | null) => void }) {
    return (
        <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 4, color: 'text.primary' }}>Matriz de Hallazgos Formal ({data.length})</Typography>
            {data.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: '16px' }}>No hay hallazgos aprobados para esta auditoría.</Alert>
            ) : (
                <Box sx={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: 'background.paper' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '11px', textTransform: 'uppercase' }}>ID</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '11px', textTransform: 'uppercase' }}>Severidad</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '11px', textTransform: 'uppercase' }}>Título</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '11px', textTransform: 'uppercase' }}>Repositorio</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '11px', textTransform: 'uppercase' }}>Regla</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.map((f) => (
                                <Fragment key={f.id}>
                                    <TableRow
                                        onClick={() => setExpandedFinding(expandedFinding === f.id ? null : f.id)}
                                        sx={{
                                            cursor: 'pointer',
                                            '&:hover': { bgcolor: alpha('#2563eb', 0.05) },
                                            bgcolor: expandedFinding === f.id ? alpha('#2563eb', 0.03) : 'transparent',
                                            transition: 'background-color 0.2s'
                                        }}
                                    >
                                        <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary', fontSize: '12px' }}>{f.id.substring(0, 8)}</TableCell>
                                        <TableCell><SevBadge s={f.severity} /></TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>{f.title}</TableCell>
                                        <TableCell sx={{ color: 'text.secondary' }}>{f.repository}</TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '12px', color: 'text.secondary' }}>{f.rule_violated}</TableCell>
                                    </TableRow>
                                    {expandedFinding === f.id && (
                                        <TableRow sx={{ bgcolor: alpha('#1e293b', 0.2) }}>
                                            <TableCell colSpan={5} sx={{ py: 4, px: 6 }}>
                                                <Grid container spacing={4}>
                                                    <Grid size={{ xs: 12, md: 6 }}>
                                                        <DLabel>Descripción del Hallazgo</DLabel>
                                                        <Typography variant="body2" sx={{ mb: 2, color: 'text.primary' }}>{f.description}</Typography>
                                                        <DLabel>Impacto Potencial</DLabel>
                                                        <Typography variant="body2" sx={{ color: 'text.primary' }}>{f.impact}</Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 12, md: 6 }}>
                                                        <DLabel>Recomendación de Mitigación</DLabel>
                                                        <Typography variant="body2" sx={{ mb: 2, color: 'text.primary' }}>{f.recommendation}</Typography>
                                                        <DLabel>Evidencia Técnica</DLabel>
                                                        <Box sx={{ p: 2, borderRadius: '8px', bgcolor: alpha('#000', 0.2), border: '1px solid', borderColor: 'divider' }}>
                                                            {Object.entries(f.evidence).map(([k, v]) => (
                                                                <Box key={k} sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                                                                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 800, color: 'primary.light' }}>{k}:</Typography>
                                                                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{String(v)}</Typography>
                                                                </Box>
                                                            ))}
                                                        </Box>
                                                    </Grid>
                                                </Grid>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </Box>
            )}
        </Box>
    );
}

function TraceabilityView({ data }: { data: TraceabilitySection }) {
    return (
        <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 4, color: 'text.primary' }}>Trazabilidad de Evidencia</Typography>
            <SubSection title="Metodología de Evaluación">
                <Typography variant="body2" sx={{ lineHeight: 1.7, color: 'text.secondary' }}>{data.methodology_explanation}</Typography>
            </SubSection>

            <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>Cadenas de Evidencia Técnica</Typography>
                <Box sx={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: 'background.paper' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '10px', textTransform: 'uppercase' }}>Repositorio</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '10px', textTransform: 'uppercase' }}>Métrica</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '10px', textTransform: 'uppercase' }}>Valor</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '10px', textTransform: 'uppercase' }}>Regla Evaluada</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '10px', textTransform: 'uppercase' }}>Resultado</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.chains.map((c, i) => (
                                <TableRow key={i} sx={{ '&:hover': { bgcolor: alpha('#fff', 0.02) } }}>
                                    <TableCell sx={{ fontSize: '12px' }}>{c.repository}</TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '11px', color: 'primary.light' }}>{c.evidence_metric}</TableCell>
                                    <TableCell sx={{ fontWeight: 700, fontSize: '12px' }}>{String(c.evidence_value)}</TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '11px', color: 'text.secondary' }}>{c.rule_evaluated}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label="FAIL"
                                            size="small"
                                            sx={{ height: 18, fontSize: '9px', fontWeight: 900, bgcolor: alpha('#ef4444', 0.1), color: '#ef4444' }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>
            </Box>
        </Box>
    );
}

function RiskView({ data }: { data: RiskAnalysis }) {
    return (
        <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 4, color: 'text.primary' }}>Análisis de Riesgo Consolidado</Typography>

            <Grid container spacing={4} sx={{ mb: 6 }}>
                <Grid size={{ xs: 12, md: 5 }}>
                    <Card sx={{ p: 4, textAlign: 'center', height: '100%', bgcolor: alpha(riskColor(data.global_risk_level), 0.05), border: '1px solid', borderColor: alpha(riskColor(data.global_risk_level), 0.2) }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 3 }}>Puntaje de Riesgo Global</Typography>
                        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
                            <Box sx={{
                                width: 140, height: 140, borderRadius: '50%',
                                border: '10px solid', borderColor: alpha(riskColor(data.global_risk_level), 0.2),
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Typography variant="h3" sx={{ fontWeight: 900, color: riskColor(data.global_risk_level) }}>
                                    {data.global_risk_score}%
                                </Typography>
                            </Box>
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: riskColor(data.global_risk_level), mb: 1 }}>Riesgo {data.global_risk_level}</Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Clasificación heurística según hallazgos críticos</Typography>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 7 }}>
                    <Stack spacing={4}>
                        <Box>
                            <DLabel>Clasificación de Riesgo</DLabel>
                            <Typography variant="body2" sx={{ lineHeight: 1.7, color: 'text.primary' }}>{data.risk_classification}</Typography>
                        </Box>
                        <Box>
                            <DLabel>Dependencias Críticas</DLabel>
                            <Stack spacing={1}>
                                {data.weakness_dependencies.map((w, i) => (
                                    <Box key={i} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'error.main' }} />
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{w}</Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </Box>
                    </Stack>
                </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 3 }}>Áreas de Impacto Crítico</Typography>
            <Grid container spacing={2}>
                {data.critical_areas.map((a, i) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={i}>
                        <Paper sx={{ p: 3, height: '100%', borderLeft: '4px solid', borderColor: riskColor(a.risk_level), bgcolor: 'background.paper' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{a.area}</Typography>
                                <Chip label={a.risk_level} size="small" sx={{ height: 18, fontSize: '9px', fontWeight: 900, bgcolor: alpha(riskColor(a.risk_level), 0.1), color: riskColor(a.risk_level) }} />
                            </Box>
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '13px' }}>{a.description}</Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}

function RecommendationsView({ data }: { data: PrioritizedRecommendation[] }) {
    return (
        <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 4, color: 'text.primary' }}>Recomendaciones Prioritizadas</Typography>
            <Box sx={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
                <Table>
                    <TableHead sx={{ bgcolor: 'background.paper' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '11px', textTransform: 'uppercase', width: 60 }}>#</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '11px', textTransform: 'uppercase' }}>Acción Recomendada</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '11px', textTransform: 'uppercase' }}>Severidad</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '11px', textTransform: 'uppercase' }}>Impacto</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary', fontSize: '11px', textTransform: 'uppercase' }}>Responsable</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.map((r) => (
                            <TableRow key={r.priority} sx={{ '&:hover': { bgcolor: alpha('#2563eb', 0.05) } }}>
                                <TableCell sx={{ fontWeight: 900, fontSize: '18px', color: 'primary.main' }}>{r.priority}</TableCell>
                                <TableCell sx={{ maxWidth: 350 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>{r.action}</Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Práctica: {r.practice}</Typography>
                                </TableCell>
                                <TableCell><SevBadge s={r.severity} /></TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>{r.impact}</TableCell>
                                <TableCell sx={{ color: 'text.secondary', fontSize: '13px' }}>{r.suggested_responsible}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Box>
        </Box>
    );
}

function RoadmapView({ data }: { data: ImprovementRoadmap }) {
    const phases = [
        { title: "Corto Plazo (0–30 días)", items: data.short_term, color: "#ef4444", icon: <LockIcon sx={{ fontSize: 16 }} /> },
        { title: "Mediano Plazo (1–3 meses)", items: data.medium_term, color: "#f59e0b", icon: <AssessmentIcon sx={{ fontSize: 16 }} /> },
        { title: "Largo Plazo (3–6 meses)", items: data.long_term, color: "#10b981", icon: <PlayArrowIcon sx={{ fontSize: 16 }} /> },
    ];

    return (
        <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 4, color: 'text.primary' }}>Roadmap de Mejora Continua</Typography>
            <Stack spacing={4}>
                {phases.map(phase => phase.items.length > 0 && (
                    <Box key={phase.title}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                            <Box sx={{
                                width: 32, height: 32, borderRadius: '50%', bgcolor: alpha(phase.color, 0.1), color: phase.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {phase.icon}
                            </Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>{phase.title}</Typography>
                        </Box>
                        <Stack spacing={2} sx={{ ml: 6 }}>
                            {phase.items.map((item, i) => (
                                <Paper key={i} sx={{ p: 3, borderLeft: '4px solid', borderColor: phase.color, bgcolor: 'background.paper' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>{item.action}</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Resultado esperado:</Typography>
                                        <Typography variant="caption" sx={{ color: 'primary.light' }}>{item.expected_outcome}</Typography>
                                    </Box>
                                </Paper>
                            ))}
                        </Stack>
                    </Box>
                ))}
            </Stack>
        </Box>
    );
}

function ConclusionView({ data }: { data: TechnicalConclusion }) {
    return (
        <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 4, color: 'text.primary' }}>Conclusión Técnica Final</Typography>
            <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Stack spacing={4}>
                        <Box>
                            <DLabel>Estado Actual del Proceso</DLabel>
                            <Typography variant="body2" sx={{ lineHeight: 1.7, color: 'text.primary' }}>{data.current_state}</Typography>
                        </Box>
                        <Box>
                            <DLabel>Riesgo de Inacción</DLabel>
                            <Paper sx={{ p: 2, bgcolor: alpha('#ef4444', 0.05), border: '1px solid', borderColor: alpha('#ef4444', 0.2) }}>
                                <Typography variant="body2" sx={{ color: '#ef4444', fontWeight: 500 }}>{data.risk_of_inaction}</Typography>
                            </Paper>
                        </Box>
                    </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Stack spacing={4}>
                        <Box>
                            <DLabel>Brechas contra el Estándar</DLabel>
                            <Stack spacing={1}>
                                {data.gaps_against_standard.map((g: string, i: number) => (
                                    <Box key={i} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', mt: 1 }} />
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{g}</Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </Box>
                        <Box>
                            <DLabel>Preparación para Escalabilidad</DLabel>
                            <Typography variant="body2" sx={{ color: 'text.primary' }}>{data.scalability_readiness}</Typography>
                        </Box>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
}

function PrintTemplate({ data }: { data: ProfessionalReportData }) {
    return (
        <div style={{ padding: "60px", backgroundColor: "white", width: "1000px", color: "#0f172a" }}>
            <CoverView data={data.cover_page} />
            <div style={{ pageBreakBefore: "always", height: "40px" }} />
            <ExecutiveView data={data.executive_summary} practices={data.practice_details} />
            <div style={{ pageBreakBefore: "always", height: "40px" }} />
            <PracticesView data={data.practice_details} />
            <div style={{ pageBreakBefore: "always", height: "40px" }} />
            <FindingsView data={data.findings_matrix} expandedFinding={null} setExpandedFinding={() => { }} />
            <div style={{ pageBreakBefore: "always", height: "40px" }} />
            <TraceabilityView data={data.traceability} />
            <div style={{ pageBreakBefore: "always", height: "40px" }} />
            <RiskView data={data.risk_analysis} />
            <div style={{ pageBreakBefore: "always", height: "40px" }} />
            <RecommendationsView data={data.recommendations} />
            <div style={{ pageBreakBefore: "always", height: "40px" }} />
            <RoadmapView data={data.roadmap} />
            <div style={{ pageBreakBefore: "always", height: "40px" }} />
            <ConclusionView data={data.conclusion} />
        </div>
    );
}

// ─── Helpers Components ────────────────────────────────────────────────────────

function SectionBox({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <Paper sx={{ mb: 4, borderRadius: '20px', overflow: 'hidden' }}>
            {title && (
                <Box sx={{
                    px: 3, py: 2,
                    bgcolor: alpha('#1e293b', 0.4),
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {title}
                    </Typography>
                </Box>
            )}
            <Box sx={{ p: 3 }}>{children}</Box>
        </Paper>
    );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <Box sx={{ mb: 4 }}>
            <Typography variant="caption" sx={{
                fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase',
                letterSpacing: '0.1em', mb: 2, display: 'block',
                pb: 1, borderBottom: '1px solid', borderColor: 'divider'
            }}>
                {title}
            </Typography>
            {children}
        </Box>
    );
}

function DLabel({ children }: { children: React.ReactNode }) {
    return <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 0.5, display: 'block' }}>{children}</Typography>;
}

function DVal({ children }: { children: React.ReactNode }) {
    return <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.6 }}>{children}</Typography>;
}

function SevBadge({ s }: { s: string }) {
    const color = s === "HIGH" ? "#ef4444" : s === "MEDIUM" ? "#f59e0b" : "#10b981";
    return (
        <Chip
            label={s}
            size="small"
            sx={{
                height: 20,
                fontSize: '10px',
                fontWeight: 800,
                bgcolor: alpha(color, 0.1),
                color: color,
                border: `1px solid ${alpha(color, 0.2)}`
            }}
        />
    );
}

function maturityColor(lvl: string) {
    if (!lvl) return "#94a3b8";
    const level = lvl.toLowerCase();
    if (level.includes("optimizado")) return "#6366f1";
    if (level.includes("gestionado") && level.includes("cuantitativamente")) return "#2563eb";
    if (level.includes("gestionado")) return "#10b981";
    if (level.includes("definido")) return "#f59e0b";
    if (level.includes("repetible")) return "#ef4444";
    if (level.includes("inicial")) return "#ef4444";
    return "#94a3b8";
}

function riskColor(lvl: string) {
    if (lvl === "BAJO") return "#10b981";
    if (lvl === "MEDIO") return "#f59e0b";
    return "#ef4444";
}
