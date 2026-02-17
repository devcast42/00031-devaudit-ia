import { v4 as uuidv4 } from 'uuid';
import { AuditAnalysis, AuditFinding, AnalysisResult } from '../models/analysis.model';
import { MetricsService } from './metrics.service';
import { practiceRules, aggregateMetrics } from './rules-engine';

export class AnalysisService {
    private static analyses: AuditAnalysis[] = [];
    private static findings: AuditFinding[] = [];

    /**
     * Runs the full audit analysis for a given audit.
     * Reads stored metrics, evaluates all practice rules, and saves results.
     */
    static async runAuditAnalysis(auditId: string): Promise<AnalysisResult> {
        // 1. Fetch stored metrics (never calls GitHub)
        const metrics = await MetricsService.getMetricsByAuditId(auditId);

        if (metrics.length === 0) {
            throw new Error('No metrics found for this audit. Please collect evidence first.');
        }

        // 2. Aggregate metrics across all repositories
        const aggregated = aggregateMetrics(metrics);

        // 3. Clear previous analysis for this audit
        this.analyses = this.analyses.filter(a => a.audit_id !== auditId);
        this.findings = this.findings.filter(f => f.audit_id !== auditId);

        // 4. Evaluate each practice rule
        const practices: AuditAnalysis[] = [];
        const allFindings: AuditFinding[] = [];

        for (const rule of practiceRules) {
            const evaluation = rule.evaluate(aggregated);

            const analysis: AuditAnalysis = {
                id: uuidv4(),
                audit_id: auditId,
                practice_code: evaluation.practice_code,
                practice_name: evaluation.practice_name,
                score: evaluation.score,
                max_score: evaluation.max_score,
                maturity_level: evaluation.maturity_level,
                calculated_at: new Date().toISOString(),
            };
            practices.push(analysis);

            for (const finding of evaluation.findings) {
                const auditFinding: AuditFinding = {
                    id: uuidv4(),
                    audit_id: auditId,
                    practice_code: finding.practice_code,
                    severity: finding.severity,
                    description: finding.description,
                    created_at: new Date().toISOString(),
                };
                allFindings.push(auditFinding);
            }
        }

        // 5. Save results
        this.analyses.push(...practices);
        this.findings.push(...allFindings);

        // 6. Calculate global maturity level (average, rounded)
        const global_maturity_level = practices.length > 0
            ? Math.round(practices.reduce((sum, p) => sum + p.maturity_level, 0) / practices.length)
            : 1;

        return {
            global_maturity_level,
            practices,
            findings: allFindings,
        };
    }

    /**
     * Gets saved analysis results for an audit.
     */
    static async getAnalysisByAuditId(auditId: string): Promise<AnalysisResult | null> {
        const practices = this.analyses.filter(a => a.audit_id === auditId);
        const findings = this.findings.filter(f => f.audit_id === auditId);

        if (practices.length === 0) return null;

        const global_maturity_level = Math.round(
            practices.reduce((sum, p) => sum + p.maturity_level, 0) / practices.length
        );

        return { global_maturity_level, practices, findings };
    }
}
