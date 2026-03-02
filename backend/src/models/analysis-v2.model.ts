/**
 * STEP 3 — Analysis Output Models
 * 
 * Complete traceability chain:
 *   Evidence (STEP 2) → EvaluatedRule → AnalysisFinding → PracticeResult → AggregatedResults
 * 
 * Every finding embeds the evidence snapshot and references the violated rule.
 */

// ─── Per-Repository Results ─────────────────────────────────────────────────────

/**
 * Result of evaluating a single rule against one repository.
 */
export interface EvaluatedRule {
    rule_id: string;
    passed: boolean;
    /** The actual metric values at evaluation time — immutable evidence */
    metric_values: Record<string, string | number | boolean>;
    detail: string;
}

/**
 * Aggregated results for one practice within one repository.
 */
export interface PracticeResult {
    practice: 'SCM' | 'QA' | 'PM';
    score: number;
    max_score: number;
    level: string;                 // "Inicial" | "Gestionado" | "Definido"
    evaluated_rules: EvaluatedRule[];
    generated_findings: string[];  // finding_id references for traceability
}

/**
 * Complete analysis result for a single repository.
 */
export interface RepositoryAnalysisResult {
    repository: string;            // repo_full_name
    practice_results: PracticeResult[];
}

// ─── Findings with Full Traceability ────────────────────────────────────────────

/**
 * A finding generated during analysis, with embedded evidence.
 * 
 * Invariants:
 *   - evidence_snapshot is NEVER empty
 *   - rule_violated references a valid StandardRule.rule_id
 *   - standard_reference is the exact section from DevAudit v1.0
 *   - repository identifies the specific repo where the issue was found
 */
export interface AnalysisFinding {
    finding_id: string;
    repository: string;
    practice: 'SCM' | 'QA' | 'PM';
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    title: string;
    description: string;
    rule_violated: string;         // StandardRule.rule_id
    standard_reference: string;    // "DevAudit v1.0 §X.Y.Z"
    evidence_snapshot: Record<string, string | number | boolean>;
    analysis_source_id: string;    // analysis_id — links back to the analysis run
}

// ─── Aggregated Results ─────────────────────────────────────────────────────────

export interface PracticeScoreAggregate {
    score: number;
    max_score: number;
    level: string;
}

export interface AggregatedResults {
    practice_scores: Record<string, PracticeScoreAggregate>;
    global_maturity_level: string;
}

// ─── Top-Level Output ───────────────────────────────────────────────────────────

/**
 * Complete output of STEP 3. This is the single source of truth
 * consumed by STEP 4 (Findings) and STEP 5 (Report).
 */
export interface AnalysisOutput {
    analysis_id: string;
    audit_id: string;
    executed_at: string;
    repository_results: RepositoryAnalysisResult[];
    aggregated_results: AggregatedResults;
    findings: AnalysisFinding[];
}
