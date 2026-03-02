/**
 * STEP 5 — Report Service v2 (Orchestrator)
 * 
 * Assembles the complete professional audit report by:
 *   1. Fetching data from STEP 1 (Audit), STEP 2 (Metrics), STEP 3 (Analysis), STEP 4 (Findings)
 *   2. Invoking each generator to produce its section
 *   3. Composing the full ProfessionalReportData
 *   4. Managing versioning and caching
 * 
 * Key guarantee: NO recalculation. Only transformation and enrichment.
 */

import { v4 as uuidv4 } from 'uuid';
import { ProfessionalReportData, ReportMetadata } from '../models/report-v2.model';
import { AuditService } from './audit.service';
import { MetricsService } from './metrics.service';
import { AnalysisServiceV2 } from './analysis-v2.service';
import { FindingsServiceV2 } from './findings-v2.service';
import { generateExecutiveSummary } from './report-builder/executive-summary.generator';
import { generatePracticeDetails } from './report-builder/practice-detail.generator';
import { generateFindingsMatrix } from './report-builder/findings-matrix.generator';
import { generateRiskAnalysis } from './report-builder/risk-analysis.generator';
import { generateRecommendations } from './report-builder/recommendations.generator';
import { generateRoadmap } from './report-builder/roadmap.generator';
import { generateTraceability } from './report-builder/traceability.generator';
import { generateConclusion } from './report-builder/conclusion.generator';

export class ReportServiceV2 {
    private static reportStore: Map<string, ProfessionalReportData> = new Map();
    private static versionTracker: Map<string, number> = new Map();

    /**
     * Generates the complete professional audit report.
     */
    static async generateReport(auditId: string): Promise<ProfessionalReportData> {
        // 1. Fetch all source data
        const audit = await AuditService.getAuditById(auditId);
        if (!audit) throw new Error('Auditoría no encontrada.');

        const existing = this.reportStore.get(auditId);
        if (existing && existing.metadata.status === 'finalized') {
            throw new Error('Esta auditoría ha sido finalizada. No se permiten modificaciones.');
        }

        const metrics = await MetricsService.getMetricsByAuditId(auditId);
        const analysis = await AnalysisServiceV2.getAnalysisByAuditId(auditId);
        if (!analysis) {
            throw new Error('No se encontró ningún análisis. Ejecute el paso de análisis primero.');
        }

        const findingsData = await FindingsServiceV2.getByAuditId(auditId);

        // 2. Generate each section
        const executiveSummary = generateExecutiveSummary(analysis, findingsData);
        const practiceDetails = generatePracticeDetails(analysis);
        const findingsMatrix = generateFindingsMatrix(findingsData);
        const riskAnalysis = generateRiskAnalysis(analysis, findingsData);
        const recommendations = generateRecommendations(findingsData);
        const roadmap = generateRoadmap(recommendations);
        const traceability = generateTraceability(analysis);
        const conclusion = generateConclusion(
            analysis, findingsData, riskAnalysis,
            audit.name, audit.organization,
        );

        // 3. Build metadata with versioning
        const currentVersion = (this.versionTracker.get(auditId) || 0) + 1;
        this.versionTracker.set(auditId, currentVersion);

        const now = new Date().toISOString();
        const metadata: ReportMetadata = {
            report_id: existing?.metadata.report_id || uuidv4(),
            audit_id: auditId,
            generated_at: now,
            generated_by: 'system',
            status: 'draft',
            version: currentVersion,
        };

        // 4. Build cover page
        const coverPage = {
            audit_name: audit.name,
            organization: audit.organization,
            review_period: audit.reviewPeriod,
            standard_used: audit.complianceStandard || 'DevAudit v1.0',
            issue_date: now,
            report_version: currentVersion,
            status: 'Borrador' as const,
            repositories_count: metrics.length,
            repositories: metrics.map(m => m.repo_full_name),
        };

        // 5. Assemble complete report
        const report: ProfessionalReportData = {
            metadata,
            cover_page: coverPage,
            executive_summary: executiveSummary,
            practice_details: practiceDetails,
            findings_matrix: findingsMatrix,
            traceability,
            risk_analysis: riskAnalysis,
            recommendations,
            roadmap,
            conclusion,
        };

        this.reportStore.set(auditId, report);
        return report;
    }

    /**
     * Gets stored report data.
     */
    static async getReport(auditId: string): Promise<ProfessionalReportData | null> {
        return this.reportStore.get(auditId) || null;
    }

    /**
     * Finalizes the audit: locks report and marks audit as Completed.
     */
    static async finalizeAudit(auditId: string): Promise<ProfessionalReportData> {
        const audit = await AuditService.getAuditById(auditId);
        if (!audit) throw new Error('Auditoría no encontrada.');

        const existing = this.reportStore.get(auditId);
        if (existing && existing.metadata.status === 'finalized') {
            throw new Error('Esta auditoría ya ha sido finalizada.');
        }

        // Validate approved findings exist
        const findingsData = await FindingsServiceV2.getByAuditId(auditId);
        const approved = findingsData.findings.filter(f => f.status === 'approved');
        if (approved.length === 0) {
            throw new Error('No se puede finalizar: no hay hallazgos aprobados.');
        }

        // Re-generate with latest data
        const report = await this.generateReport(auditId);

        // Mark as finalized
        report.metadata.status = 'finalized';
        report.cover_page.status = 'Final';

        // Update audit status
        await AuditService.updateAudit(auditId, { status: 'Completed' });

        this.reportStore.set(auditId, report);
        return report;
    }
}
