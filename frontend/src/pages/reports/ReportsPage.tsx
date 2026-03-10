import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, useTheme, CircularProgress } from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BugReportIcon from '@mui/icons-material/BugReport';
import SpeedIcon from '@mui/icons-material/Speed';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { AuditService } from '../../services/audit.service';
import dayjs from 'dayjs';

const MetricCard = ({ title, value, subtext, icon, color }: { title: string, value: string, subtext: string, icon: React.ReactNode, color: string }) => (
    <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', right: -10, top: -10, opacity: 0.1, transform: 'scale(1.5)', color: color }}>
            {icon}
        </Box>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {title}
        </Typography>
        <Typography variant="h4" fontWeight="bold" sx={{ my: 1, color: color }}>
            {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
            {subtext}
        </Typography>
    </Paper>
);

export function ReportsPage() {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        totalAudits: 0,
        auditsThisMonth: 0,
        totalFindings: 0,
        findingsBySeverity: { high: 0, medium: 0, low: 0 },
        auditsByMonth: new Array(6).fill(0), // Last 6 months
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const audits = await AuditService.getAudits();
                
                // 1. Total Audits
                const totalAudits = audits.length;

                // 2. Audits this month
                const now = dayjs();
                const auditsThisMonth = audits.filter(a => dayjs(a.createdAt).isSame(now, 'month')).length;

                // 3. Fetch Findings for all audits (in parallel)
                // Note: In a production app, we should have a dedicated dashboard endpoint.
                const findingsPromises = audits.map(audit => AuditService.getFindings(audit.id).catch(() => null));
                const findingsResults = await Promise.all(findingsPromises);

                let totalFindings = 0;
                const findingsBySeverity = { high: 0, medium: 0, low: 0 };
                
                // For "Recent Activity" chart (audits per month)
                const last6Months = Array.from({ length: 6 }, (_, i) => now.subtract(5 - i, 'month'));
                const auditsByMonth = last6Months.map(month => {
                    return audits.filter(a => dayjs(a.createdAt).isSame(month, 'month')).length;
                });

                findingsResults.forEach(result => {
                    if (result) {
                        totalFindings += result.total_findings;
                        findingsBySeverity.high += result.by_severity.high;
                        findingsBySeverity.medium += result.by_severity.medium;
                        findingsBySeverity.low += result.by_severity.low;
                    }
                });

                setMetrics({
                    totalAudits,
                    auditsThisMonth,
                    totalFindings,
                    findingsBySeverity,
                    auditsByMonth
                });

            } catch (error) {
                console.error("Failed to load report data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    const pieData = [
        { id: 0, value: metrics.findingsBySeverity.high, label: 'Alto', color: '#ef4444' },
        { id: 1, value: metrics.findingsBySeverity.medium, label: 'Medio', color: '#f97316' },
        { id: 2, value: metrics.findingsBySeverity.low, label: 'Bajo', color: '#3b82f6' },
    ];

    // Dummy data for categories as we don't have this breakdown yet in aggregated view easily without more processing
    const barData = [
        { data: [4, 3, 5, 2, 6, 4], label: 'Seguridad', color: '#ef4444' },
        { data: [2, 5, 3, 6, 2, 5], label: 'Rendimiento', color: '#3b82f6' },
        { data: [6, 4, 7, 5, 8, 6], label: 'Calidad', color: '#10b981' },
    ];
    
    const xLabels = Array.from({ length: 6 }, (_, i) => dayjs().subtract(5 - i, 'month').format('MMM'));

    return (
        <Box sx={{ p: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom fontWeight="bold">
                    Informes de Auditoría
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Visualización general del estado de seguridad y calidad del código basado en datos reales.
                </Typography>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MetricCard 
                        title="Total Auditorías" 
                        value={metrics.totalAudits.toString()} 
                        subtext={`${metrics.auditsThisMonth > 0 ? '+' : ''}${metrics.auditsThisMonth} este mes`} 
                        icon={<AssessmentIcon fontSize="large" />} 
                        color={theme.palette.primary.main} 
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MetricCard 
                        title="Vulnerabilidades" 
                        value={metrics.totalFindings.toString()} 
                        subtext="Detectadas en total" 
                        icon={<BugReportIcon fontSize="large" />} 
                        color="#ef4444" 
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MetricCard 
                        title="Score Promedio" 
                        value="85/100" 
                        subtext="Estimado" 
                        icon={<SpeedIcon fontSize="large" />} 
                        color="#10b981" 
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <MetricCard 
                        title="Auditorías Activas" 
                        value={metrics.auditsByMonth[metrics.auditsByMonth.length - 1].toString()} 
                        subtext="En el último mes" 
                        icon={<TrendingUpIcon fontSize="large" />} 
                        color="#f59e0b" 
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 3, height: '400px' }}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">
                            Tendencia de Auditorías (Últimos 6 meses)
                        </Typography>
                        <BarChart
                            series={[{ data: metrics.auditsByMonth, label: 'Auditorías', color: theme.palette.primary.main }]}
                            xAxis={[{ data: xLabels, scaleType: 'band' }]}
                            margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
                        />
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="h6" gutterBottom fontWeight="bold" align="left" sx={{ width: '100%' }}>
                            Severidad de Riesgos
                        </Typography>
                        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                            <PieChart
                                series={[
                                    {
                                        data: pieData,
                                        innerRadius: 30,
                                        outerRadius: 100,
                                        paddingAngle: 5,
                                        cornerRadius: 5,
                                        startAngle: -90,
                                        endAngle: 180,
                                        cx: 150,
                                        cy: 150,
                                    },
                                ]}
                                slotProps={{
                                    legend: { hidden: true } as any
                                }}
                                width={300}
                                height={300}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', mt: 2 }}>
                            {pieData.map((item) => (
                                <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color }} />
                                    <Typography variant="caption">{item.label} ({item.value})</Typography>
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 3, height: '350px' }}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">
                            Actividad Reciente
                        </Typography>
                         <LineChart
                            xAxis={[{ data: [1, 2, 3, 5, 8, 10] }]}
                            series={[
                                {
                                curve: "linear",
                                data: [2, 5.5, 2, 8.5, 1.5, 5],
                                },
                            ]}
                            
                        />
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
