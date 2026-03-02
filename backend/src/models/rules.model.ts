/**
 * DevAudit Standard Rule Definitions
 * 
 * Each rule is a declarative, immutable unit that evaluates a single metric
 * against the DevAudit v1.0 standard for ONE repository at a time.
 */

/**
 * Input metrics for a single repository, derived from RepositoryMetrics.
 * Decoupled from persistence model to allow rule evaluation without storage concerns.
 */
export interface RepositoryMetricsInput {
    repo_name: string;
    repo_full_name: string;
    total_commits: number;
    pull_requests_count: number;
    branches_count: number;
    contributors_count: number;
    has_protected_main_branch: boolean;
    issues_count: number;
    open_issues_count: number;
    test_files_count: number;
    last_commit_date: string;
}

/**
 * Result of evaluating a single rule against a repository's metrics.
 */
export interface RuleEvaluationResult {
    /** Whether the rule criteria were satisfied */
    passed: boolean;
    /** Snapshot of the actual metric values used in evaluation — the evidence */
    metric_values: Record<string, string | number | boolean>;
    /** Human-readable explanation of the evaluation outcome */
    detail: string;
}

/**
 * A declarative rule from the DevAudit v1.0 standard.
 * Each rule is an atomic, self-contained evaluation unit.
 */
export interface StandardRule {
    /** Unique identifier: "{PRACTICE}-R{NNN}" (e.g., "SCM-R001") */
    rule_id: string;
    /** Practice area this rule belongs to */
    practice: 'SCM' | 'QA' | 'PM';
    /** Reference to the standard section (e.g., "DevAudit v1.0 §3.1.1") */
    standard_reference: string;
    /** Short title of the rule */
    title: string;
    /** Detailed description of what the rule checks */
    description: string;
    /** Severity assigned when this rule fails */
    severity_on_fail: 'HIGH' | 'MEDIUM' | 'LOW';
    /** Score weight — points contributed to the practice score when passed */
    points: number;
    /** Pure evaluation function: metrics in → result out */
    evaluate: (metrics: RepositoryMetricsInput) => RuleEvaluationResult;
}
