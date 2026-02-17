import { Audit } from './audit.model';
import { AuditAnalysis } from './analysis.model';
import { FormalFinding } from './findings.model';
import { RepositoryMetrics } from './repository-metrics.model';

export interface AuditReport {
    id: string;
    audit_id: string;
    generated_at: string;
    generated_by: string;
    final_maturity_level: number;
    status: 'draft' | 'finalized';
    version: number;
}

export interface MaturitySummary {
    global_level: number;
    global_label: string;
    practices: {
        practice_code: string;
        practice_name: string;
        score: number;
        max_score: number;
        maturity_level: number;
    }[];
}

export interface FindingsSummaryData {
    total: number;
    high: number;
    medium: number;
    low: number;
}

export interface ReportData {
    report: AuditReport;
    audit_info: Audit;
    repositories: Pick<RepositoryMetrics, 'repo_name' | 'repo_full_name'>[];
    maturity_summary: MaturitySummary;
    findings_summary: FindingsSummaryData;
    findings: FormalFinding[];
    generated_at: string;
}
