/**
 * DevAudit v1.0 Standard Rules — Declarative Definitions
 * 
 * Each rule is an atomic, self-contained evaluation unit that:
 * 1. Operates on a SINGLE repository's metrics
 * 2. Returns pass/fail with the exact metric values used (evidence snapshot)
 * 3. References the standard section it enforces
 * 
 * To add a new rule: push a new StandardRule to the exported array.
 * No other code changes are needed — the engine discovers rules dynamically.
 */

import { StandardRule, RepositoryMetricsInput } from '../../models/rules.model';

// ─── SCM: Gestión de Configuración ─────────────────────────────────────────────

const SCM_R001: StandardRule = {
    rule_id: 'SCM-R001',
    practice: 'SCM',
    standard_reference: 'DevAudit v1.0 §3.1.1',
    title: 'Uso de Pull Requests para revisión de código',
    description: 'El repositorio debe evidenciar revisiones de código mediante Pull Requests como mecanismo formal de integración.',
    severity_on_fail: 'HIGH',
    points: 1,
    evaluate: (m: RepositoryMetricsInput) => ({
        passed: m.pull_requests_count > 0,
        metric_values: {
            pull_requests_count: m.pull_requests_count,
        },
        detail: m.pull_requests_count > 0
            ? `Se evidencian ${m.pull_requests_count} Pull Requests.`
            : 'No se evidencian Pull Requests. El repositorio no muestra revisiones formales de código.',
    }),
};

const SCM_R002: StandardRule = {
    rule_id: 'SCM-R002',
    practice: 'SCM',
    standard_reference: 'DevAudit v1.0 §3.1.2',
    title: 'Protección de rama principal',
    description: 'La rama principal (main/master) debe tener protecciones habilitadas para evitar cambios directos sin revisión.',
    severity_on_fail: 'MEDIUM',
    points: 1,
    evaluate: (m: RepositoryMetricsInput) => ({
        passed: m.has_protected_main_branch,
        metric_values: {
            has_protected_main_branch: m.has_protected_main_branch,
        },
        detail: m.has_protected_main_branch
            ? 'La rama principal tiene protecciones habilitadas.'
            : 'La rama principal no tiene protecciones habilitadas. Se permite push directo sin revisión.',
    }),
};

const SCM_R003: StandardRule = {
    rule_id: 'SCM-R003',
    practice: 'SCM',
    standard_reference: 'DevAudit v1.0 §3.1.3',
    title: 'Estrategia de branching',
    description: 'El repositorio debe usar múltiples ramas para gestionar el desarrollo, indicando una estrategia de branching.',
    severity_on_fail: 'MEDIUM',
    points: 1,
    evaluate: (m: RepositoryMetricsInput) => ({
        passed: m.branches_count > 1,
        metric_values: {
            branches_count: m.branches_count,
        },
        detail: m.branches_count > 1
            ? `Se evidencian ${m.branches_count} ramas activas.`
            : 'Solo se detectó una rama. No se evidencia estrategia de branching.',
    }),
};

// ─── QA: Aseguramiento de Calidad ──────────────────────────────────────────────

const QA_R001: StandardRule = {
    rule_id: 'QA-R001',
    practice: 'QA',
    standard_reference: 'DevAudit v1.0 §3.2.1',
    title: 'Presencia de pruebas automatizadas',
    description: 'El repositorio debe contener archivos de pruebas automatizadas como evidencia de prácticas de testing.',
    severity_on_fail: 'HIGH',
    points: 1,
    evaluate: (m: RepositoryMetricsInput) => ({
        passed: m.test_files_count > 0,
        metric_values: {
            test_files_count: m.test_files_count,
        },
        detail: m.test_files_count > 0
            ? `Se evidencian ${m.test_files_count} archivos de prueba.`
            : 'No se evidencian archivos de pruebas automatizadas en el repositorio.',
    }),
};

const QA_R002: StandardRule = {
    rule_id: 'QA-R002',
    practice: 'QA',
    standard_reference: 'DevAudit v1.0 §3.2.2',
    title: 'Revisión por pares (múltiples contribuidores)',
    description: 'El repositorio debe tener más de un contribuidor para garantizar revisión por pares efectiva.',
    severity_on_fail: 'LOW',
    points: 1,
    evaluate: (m: RepositoryMetricsInput) => ({
        passed: m.contributors_count > 1,
        metric_values: {
            contributors_count: m.contributors_count,
        },
        detail: m.contributors_count > 1
            ? `Se evidencian ${m.contributors_count} contribuidores.`
            : 'Solo se detectó un contribuidor. La revisión por pares puede estar limitada.',
    }),
};

// ─── PM: Gestión de Proyecto ────────────────────────────────────────────────────

const PM_R001: StandardRule = {
    rule_id: 'PM-R001',
    practice: 'PM',
    standard_reference: 'DevAudit v1.0 §3.3.1',
    title: 'Uso de Issues para gestión de trabajo',
    description: 'El repositorio debe evidenciar uso de Issues como mecanismo de seguimiento y gestión de tareas.',
    severity_on_fail: 'MEDIUM',
    points: 1,
    evaluate: (m: RepositoryMetricsInput) => ({
        passed: m.issues_count > 0,
        metric_values: {
            issues_count: m.issues_count,
            open_issues_count: m.open_issues_count,
        },
        detail: m.issues_count > 0
            ? `Se evidencian ${m.issues_count} issues (${m.open_issues_count} abiertos).`
            : 'No se evidencia uso de Issues para la gestión del proyecto.',
    }),
};

const PM_R002: StandardRule = {
    rule_id: 'PM-R002',
    practice: 'PM',
    standard_reference: 'DevAudit v1.0 §3.3.2',
    title: 'Actividad de desarrollo sostenida',
    description: 'El repositorio debe demostrar actividad de desarrollo significativa, medida por el número de commits.',
    severity_on_fail: 'LOW',
    points: 1,
    evaluate: (m: RepositoryMetricsInput) => ({
        passed: m.total_commits > 10,
        metric_values: {
            total_commits: m.total_commits,
        },
        detail: m.total_commits > 10
            ? `Se evidencian ${m.total_commits} commits.`
            : `Solo se detectaron ${m.total_commits} commits. La actividad de desarrollo es limitada.`,
    }),
};

const PM_R003: StandardRule = {
    rule_id: 'PM-R003',
    practice: 'PM',
    standard_reference: 'DevAudit v1.0 §3.3.3',
    title: 'Actividad reciente (últimos 90 días)',
    description: 'El repositorio debe mostrar actividad reciente (commits en los últimos 90 días) como indicador de mantenimiento activo.',
    severity_on_fail: 'MEDIUM',
    points: 1,
    evaluate: (m: RepositoryMetricsInput) => {
        let isRecent = false;
        if (m.last_commit_date) {
            const lastCommit = new Date(m.last_commit_date);
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            isRecent = lastCommit >= ninetyDaysAgo;
        }
        return {
            passed: isRecent,
            metric_values: {
                last_commit_date: m.last_commit_date || 'N/A',
            },
            detail: isRecent
                ? `Último commit: ${m.last_commit_date}. Actividad reciente confirmada.`
                : `Último commit: ${m.last_commit_date || 'desconocido'}. No se evidencia actividad en los últimos 90 días.`,
        };
    },
};

// ─── Exportable Registry ─────────────────────────────────────────────────────────

/**
 * All rules from the DevAudit v1.0 standard.
 * To add a new rule, define it above and add it to this array.
 */
export const devAuditV1Rules: StandardRule[] = [
    SCM_R001,
    SCM_R002,
    SCM_R003,
    QA_R001,
    QA_R002,
    PM_R001,
    PM_R002,
    PM_R003,
];

/**
 * Rules indexed by practice for efficient lookup.
 */
export function getRulesByPractice(practice: 'SCM' | 'QA' | 'PM'): StandardRule[] {
    return devAuditV1Rules.filter(r => r.practice === practice);
}

/**
 * All distinct practices in the standard.
 */
export const ALL_PRACTICES: ('SCM' | 'QA' | 'PM')[] = ['SCM', 'QA', 'PM'];
