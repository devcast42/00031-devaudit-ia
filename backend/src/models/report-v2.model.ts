/**
 * STEP 5 — Professional Report Model v2
 * 
 * Complete data model for a professional audit report with 9 sections.
 * Every section is generated from STEP 3/4 data — no recalculation.
 */

import { UIFinding } from './findings-v2.model';

// ─── 1. Cover Page ──────────────────────────────────────────────────────────────

export interface ReportCoverPage {
    audit_name: string;
    organization: string;
    review_period: string;
    standard_used: string;
    issue_date: string;
    report_version: number;
    status: 'Borrador' | 'Final';
    repositories_count: number;
    repositories: string[];
}

// ─── 2. Executive Summary ───────────────────────────────────────────────────────

export interface ExecutiveSummary {
    global_maturity_level: string;
    global_maturity_numeric: number;
    maturity_interpretation: string;
    principal_risks: string[];
    organizational_impact: string;
    severity_summary: { high: number; medium: number; low: number; total: number };
    general_recommendation: string;
}

// ─── 3. Practice Detail ─────────────────────────────────────────────────────────

export interface PracticeRuleDetail {
    rule_id: string;
    title: string;
    passed: boolean;
    detail: string;
    standard_reference: string;
}

export interface PracticeDetailSection {
    practice_code: string;
    practice_name: string;
    score: number;
    max_score: number;
    maturity_level: string;
    rules_passed: PracticeRuleDetail[];
    rules_failed: PracticeRuleDetail[];
    associated_findings_count: number;
    aggregated_risk: 'Alto' | 'Medio' | 'Bajo';
    technical_explanation: string;
}

// ─── 4. Findings Matrix ─────────────────────────────────────────────────────────

export interface FindingsMatrixEntry {
    id: string;
    practice: string;
    repository: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    title: string;
    description: string;
    evidence: Record<string, string | number | boolean>;
    rule_violated: string;
    standard_reference: string;
    impact: string;
    recommendation: string;
    status: string;
}

// ─── 5. Traceability Chain ──────────────────────────────────────────────────────

export interface TraceabilityChain {
    finding_id: string;
    repository: string;
    evidence_metric: string;
    evidence_value: string | number | boolean;
    rule_evaluated: string;
    rule_result: 'PASS' | 'FAIL';
    finding_title: string;
    severity: string;
    practice: string;
    practice_level: string;
    contribution_to_global: string;
}

export interface TraceabilitySection {
    chains: TraceabilityChain[];
    methodology_explanation: string;
    scoring_explanation: string;
}

// ─── 6. Risk Analysis ───────────────────────────────────────────────────────────

export interface CriticalArea {
    area: string;
    risk_level: 'Alto' | 'Medio' | 'Bajo';
    findings_count: number;
    description: string;
}

export interface RiskAnalysis {
    global_risk_level: 'Alto' | 'Medio' | 'Bajo';
    global_risk_score: number;
    risk_classification: string;
    critical_areas: CriticalArea[];
    weakness_dependencies: string[];
}

// ─── 7. Prioritized Recommendations ─────────────────────────────────────────────

export interface PrioritizedRecommendation {
    priority: number;
    finding_id: string;
    action: string;
    practice: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    impact: 'Alto' | 'Medio' | 'Bajo';
    implementation_ease: 'Fácil' | 'Moderada' | 'Compleja';
    suggested_responsible: string;
    recommended_deadline: string;
}

// ─── 8. Improvement Roadmap ─────────────────────────────────────────────────────

export interface RoadmapItem {
    phase: 'Corto Plazo (0–30 días)' | 'Mediano Plazo (1–3 meses)' | 'Largo Plazo (3–6 meses)';
    action: string;
    practice: string;
    related_finding_id: string;
    expected_outcome: string;
}

export interface ImprovementRoadmap {
    short_term: RoadmapItem[];
    medium_term: RoadmapItem[];
    long_term: RoadmapItem[];
}

// ─── 9. Technical Conclusion ────────────────────────────────────────────────────

export interface TechnicalConclusion {
    current_state: string;
    gaps_against_standard: string[];
    risk_of_inaction: string;
    scalability_readiness: string;
}

// ─── Top-Level Report Container ─────────────────────────────────────────────────

export interface ReportMetadata {
    report_id: string;
    audit_id: string;
    generated_at: string;
    generated_by: string;
    status: 'draft' | 'finalized';
    version: number;
}

export interface ProfessionalReportData {
    metadata: ReportMetadata;
    cover_page: ReportCoverPage;
    executive_summary: ExecutiveSummary;
    practice_details: PracticeDetailSection[];
    findings_matrix: FindingsMatrixEntry[];
    traceability: TraceabilitySection;
    risk_analysis: RiskAnalysis;
    recommendations: PrioritizedRecommendation[];
    roadmap: ImprovementRoadmap;
    conclusion: TechnicalConclusion;
}
