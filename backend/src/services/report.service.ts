import { v4 as uuidv4 } from 'uuid';
import { AuditReport, ReportData } from '../models/report.model';
import { AuditService } from './audit.service';
import { MetricsService } from './metrics.service';
import { AnalysisService } from './analysis.service';
import { FindingsService } from './findings.service';

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
            throw new Error('Audit not found.');
        }

        // 2. Check if already finalized
        const existing = this.reports.find(r => r.audit_id === auditId);
        if (existing && existing.status === 'finalized') {
            throw new Error('This audit has been finalized. No modifications are allowed.');
        }

        // 3. Get repository info from metrics
        const metrics = await MetricsService.getMetricsByAuditId(auditId);
        const repositories = metrics.map(m => ({
            repo_name: m.repo_name,
            repo_full_name: m.repo_full_name,
        }));

        // 4. Get analysis results
        const analysis = await AnalysisService.getAnalysisByAuditId(auditId);
        if (!analysis) {
            throw new Error('No analysis found. Please run the analysis step first.');
        }

        // 5. Get ONLY approved findings
        const findingsSummary = await FindingsService.getByAuditId(auditId);
        const approvedFindings = findingsSummary.findings.filter(f => f.status === 'approved');

        // 6. Build maturity summary
        const maturityLabel = (level: number) => {
            switch (level) {
                case 1: return 'Initial';
                case 2: return 'Managed';
                case 3: return 'Defined';
                default: return 'Unknown';
            }
        };

        const maturity_summary = {
            global_level: analysis.global_maturity_level,
            global_label: maturityLabel(analysis.global_maturity_level),
            practices: analysis.practices.map(p => ({
                practice_code: p.practice_code,
                practice_name: p.practice_name,
                score: p.score,
                max_score: p.max_score,
                maturity_level: p.maturity_level,
            })),
        };

        // 7. Build findings summary (only approved)
        const findings_summary = {
            total: approvedFindings.length,
            high: approvedFindings.filter(f => f.severity === 'high').length,
            medium: approvedFindings.filter(f => f.severity === 'medium').length,
            low: approvedFindings.filter(f => f.severity === 'low').length,
        };

        // 8. Create or update report record
        const version = existing ? existing.version + 1 : 1;
        const now = new Date().toISOString();

        if (existing) {
            existing.generated_at = now;
            existing.final_maturity_level = analysis.global_maturity_level;
            existing.version = version;
        } else {
            const report: AuditReport = {
                id: uuidv4(),
                audit_id: auditId,
                generated_at: now,
                generated_by: 'system',
                final_maturity_level: analysis.global_maturity_level,
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
            throw new Error('Audit not found.');
        }

        // 2. Check not already finalized
        const report = this.reports.find(r => r.audit_id === auditId);
        if (report && report.status === 'finalized') {
            throw new Error('This audit has already been finalized.');
        }

        // 3. Validate approved findings exist
        const findingsSummary = await FindingsService.getByAuditId(auditId);
        const approvedFindings = findingsSummary.findings.filter(f => f.status === 'approved');
        if (approvedFindings.length === 0) {
            throw new Error('Cannot finalize: no approved findings. Please approve at least one finding.');
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
