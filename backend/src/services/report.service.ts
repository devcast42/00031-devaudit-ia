import { v4 as uuidv4 } from 'uuid';
import { AuditReport, ReportData } from '../models/report.model';
import { AuditService } from './audit.service';
import { MetricsService } from './metrics.service';
import { AnalysisServiceV2 } from './analysis-v2.service';
import { FindingsServiceV2 } from './findings-v2.service';

export class ReportService {
    private static reports: AuditReport[] = [];
    private static reportDataCache: Map<string, ReportData> = new Map();

    /**
     * Generates the audit report by consolidating data from all previous steps.
     * Does NOT call any external APIs — only reads in-memory data.
     */
    static async generateAuditReport(auditId: string): Promise<ReportData> {
        // 1. Get audit info
        const audit = await AuditService.getAuditById(auditId);
        if (!audit) {
            throw new Error('Auditoría no encontrada.');
        }

        // 2. Check if already finalized
        const existing = this.reports.find(r => r.audit_id === auditId);
        if (existing && existing.status === 'finalized') {
            throw new Error('Esta auditoría ha sido finalizada. No se permiten modificaciones.');
        }

        // 3. Get repository info from metrics
        const metrics = await MetricsService.getMetricsByAuditId(auditId);
        const repositories = metrics.map(m => ({
            repo_name: m.repo_name,
            repo_full_name: m.repo_full_name,
        }));

        // 4. Get analysis results (v2)
        const analysis = await AnalysisServiceV2.getAnalysisByAuditId(auditId);
        if (!analysis) {
            throw new Error('No se encontró ningún análisis. Por favor, ejecute el paso de análisis primero.');
        }

        // 5. Get ONLY approved findings (v2)
        const findingsViewData = await FindingsServiceV2.getByAuditId(auditId);
        const approvedFindings = findingsViewData.findings.filter(f => f.status === 'approved');

        // 6. Build maturity summary from v2 aggregated results
        const maturityLevelToNumber = (level: string): number => {
            switch (level) {
                case 'Definido': return 3;
                case 'Gestionado': return 2;
                default: return 1;
            }
        };

        const practices = Object.entries(analysis.aggregated_results.practice_scores).map(
            ([code, data]) => ({
                practice_code: code,
                practice_name: code === 'SCM' ? 'Gestión de Configuración'
                    : code === 'QA' ? 'Aseguramiento de Calidad'
                        : code === 'PM' ? 'Gestión de Proyecto'
                            : code,
                score: data.score,
                max_score: data.max_score,
                maturity_level: maturityLevelToNumber(data.level),
            })
        );

        const globalLevel = maturityLevelToNumber(analysis.aggregated_results.global_maturity_level);

        const maturity_summary = {
            global_level: globalLevel,
            global_label: analysis.aggregated_results.global_maturity_level,
            practices,
        };

        // 7. Build findings summary (only approved)
        const findings_summary = {
            total: approvedFindings.length,
            high: approvedFindings.filter(f => f.severity === 'HIGH').length,
            medium: approvedFindings.filter(f => f.severity === 'MEDIUM').length,
            low: approvedFindings.filter(f => f.severity === 'LOW').length,
        };

        // 8. Create or update report record
        const version = existing ? existing.version + 1 : 1;
        const now = new Date().toISOString();

        if (existing) {
            existing.generated_at = now;
            existing.final_maturity_level = globalLevel;
            existing.version = version;
        } else {
            const report: AuditReport = {
                id: uuidv4(),
                audit_id: auditId,
                generated_at: now,
                generated_by: 'system',
                final_maturity_level: globalLevel,
                status: 'draft',
                version,
            };
            this.reports.push(report);
        }

        const reportRecord = this.reports.find(r => r.audit_id === auditId)!;

        // 9. Build full report data
        const reportData: ReportData = {
            report: reportRecord,
            audit_info: audit,
            repositories,
            maturity_summary,
            findings_summary,
            findings: approvedFindings,
            generated_at: now,
        };

        this.reportDataCache.set(auditId, reportData);
        return reportData;
    }

    /**
     * Gets the stored report for an audit.
     */
    static async getReport(auditId: string): Promise<ReportData | null> {
        return this.reportDataCache.get(auditId) || null;
    }

    /**
     * Finalizes the audit: locks the report and marks audit as Completed.
     */
    static async finalizeAudit(auditId: string): Promise<ReportData> {
        // 1. Validate audit exists
        const audit = await AuditService.getAuditById(auditId);
        if (!audit) {
            throw new Error('Auditoría no encontrada.');
        }

        // 2. Check not already finalized
        const report = this.reports.find(r => r.audit_id === auditId);
        if (report && report.status === 'finalized') {
            throw new Error('Esta auditoría ya ha sido finalizada.');
        }

        // 3. Validate approved findings exist (v2)
        const findingsViewData = await FindingsServiceV2.getByAuditId(auditId);
        const approvedFindings = findingsViewData.findings.filter(f => f.status === 'approved');
        if (approvedFindings.length === 0) {
            throw new Error('No se puede finalizar: no hay hallazgos aprobados. Por favor, apruebe al menos un hallazgo.');
        }

        // 4. Generate or refresh the report
        const reportData = await this.generateAuditReport(auditId);

        // 5. Mark report as finalized
        const reportRecord = this.reports.find(r => r.audit_id === auditId)!;
        reportRecord.status = 'finalized';

        // 6. Mark audit as Completed
        await AuditService.updateAudit(auditId, { status: 'Completed' });

        // 7. Update cached data
        reportData.report = { ...reportRecord };
        reportData.audit_info = (await AuditService.getAuditById(auditId))!;
        this.reportDataCache.set(auditId, reportData);

        return reportData;
    }
}
