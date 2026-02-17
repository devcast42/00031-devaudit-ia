import { RepositoryMetrics } from '../models/repository-metrics.model';
import { AuditFinding } from '../models/analysis.model';

/**
 * A PracticeRule defines how to evaluate a single audit practice.
 * To add a new practice, simply push a new PracticeRule to the `practiceRules` array.
 */
export interface PracticeEvaluation {
    practice_code: string;
    practice_name: string;
    score: number;
    max_score: number;
    maturity_level: number;
    findings: Omit<AuditFinding, 'id' | 'audit_id' | 'created_at'>[];
}

export interface PracticeRule {
    code: string;
    name: string;
    evaluate: (aggregatedMetrics: AggregatedMetrics) => PracticeEvaluation;
}

/**
 * Aggregated metrics across all repositories in an audit.
 */
export interface AggregatedMetrics {
    total_commits: number;
    pull_requests_count: number;
    branches_count: number;
    contributors_count: number;
    has_any_protected_main_branch: boolean;
    issues_count: number;
    open_issues_count: number;
    test_files_count: number;
    repo_count: number;
    last_commit_date: string;
}

/**
 * Aggregate metrics from multiple repositories into a single summary.
 */
export function aggregateMetrics(metrics: RepositoryMetrics[]): AggregatedMetrics {
    return {
        total_commits: metrics.reduce((sum, m) => sum + m.total_commits, 0),
        pull_requests_count: metrics.reduce((sum, m) => sum + m.pull_requests_count, 0),
        branches_count: metrics.reduce((sum, m) => sum + m.branches_count, 0),
        contributors_count: metrics.reduce((sum, m) => sum + m.contributors_count, 0),
        has_any_protected_main_branch: metrics.some(m => m.has_protected_main_branch),
        issues_count: metrics.reduce((sum, m) => sum + m.issues_count, 0),
        open_issues_count: metrics.reduce((sum, m) => sum + m.open_issues_count, 0),
        test_files_count: metrics.reduce((sum, m) => sum + m.test_files_count, 0),
        repo_count: metrics.length,
        last_commit_date: metrics.reduce((latest, m) =>
            m.last_commit_date > latest ? m.last_commit_date : latest
            , ''),
    };
}

// ─── Practice Rules ────────────────────────────────────────────────────────────

const configurationManagement: PracticeRule = {
    code: 'SCM',
    name: 'Gestión de Configuración',
    evaluate: (m: AggregatedMetrics): PracticeEvaluation => {
        let score = 0;
        const findings: PracticeEvaluation['findings'] = [];

        if (m.branches_count > 1) score += 1;
        if (m.pull_requests_count > 0) score += 1;
        if (m.has_any_protected_main_branch) score += 1;

        const maturity_level = score >= 3 ? 3 : score >= 2 ? 2 : 1;

        // Findings
        if (m.pull_requests_count === 0) {
            findings.push({
                practice_code: 'SCM',
                severity: 'high',
                description: 'El repositorio no evidencia revisiones de código mediante Pull Requests.',
            });
        }
        if (!m.has_any_protected_main_branch) {
            findings.push({
                practice_code: 'SCM',
                severity: 'medium',
                description: 'La rama principal no tiene protecciones habilitadas.',
            });
        }
        if (m.branches_count <= 1) {
            findings.push({
                practice_code: 'SCM',
                severity: 'medium',
                description: 'El proyecto solo tiene una rama. Se recomienda usar estrategias de branching.',
            });
        }

        return { practice_code: 'SCM', practice_name: 'Gestión de Configuración', score, max_score: 3, maturity_level, findings };
    },
};

const qualityAssurance: PracticeRule = {
    code: 'QA',
    name: 'Aseguramiento de Calidad',
    evaluate: (m: AggregatedMetrics): PracticeEvaluation => {
        let score = 0;
        const findings: PracticeEvaluation['findings'] = [];

        if (m.test_files_count > 0) score += 1;
        if (m.contributors_count > 1) score += 1;

        const maturity_level = score >= 2 ? 3 : score >= 1 ? 2 : 1;

        if (m.test_files_count === 0) {
            findings.push({
                practice_code: 'QA',
                severity: 'high',
                description: 'No se evidencian pruebas automatizadas en el repositorio.',
            });
        }
        if (m.contributors_count <= 1) {
            findings.push({
                practice_code: 'QA',
                severity: 'low',
                description: 'Solo se detectó un contribuidor. La revisión por pares puede estar limitada.',
            });
        }

        return { practice_code: 'QA', practice_name: 'Aseguramiento de Calidad', score, max_score: 2, maturity_level, findings };
    },
};

const projectManagement: PracticeRule = {
    code: 'PM',
    name: 'Gestión de Proyecto',
    evaluate: (m: AggregatedMetrics): PracticeEvaluation => {
        let score = 0;
        const findings: PracticeEvaluation['findings'] = [];

        if (m.issues_count > 0) score += 1;
        if (m.total_commits > 10) score += 1;

        // Check if there has been a recent commit (within last 90 days)
        if (m.last_commit_date) {
            const lastCommit = new Date(m.last_commit_date);
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            if (lastCommit >= ninetyDaysAgo) score += 1;
        }

        const maturity_level = score >= 3 ? 3 : score >= 2 ? 2 : 1;

        if (m.issues_count === 0) {
            findings.push({
                practice_code: 'PM',
                severity: 'medium',
                description: 'No se evidencia uso de Issues para la gestión del proyecto.',
            });
        }
        if (m.total_commits <= 10) {
            findings.push({
                practice_code: 'PM',
                severity: 'low',
                description: 'El número de commits es bajo, lo que sugiere actividad de desarrollo limitada.',
            });
        }

        return { practice_code: 'PM', practice_name: 'Gestión de Proyecto', score, max_score: 3, maturity_level, findings };
    },
};

// ─── Exportable Rules Registry ─────────────────────────────────────────────────

/**
 * All practice rules. To add a new practice, push a new PracticeRule here.
 */
export const practiceRules: PracticeRule[] = [
    configurationManagement,
    qualityAssurance,
    projectManagement,
];
