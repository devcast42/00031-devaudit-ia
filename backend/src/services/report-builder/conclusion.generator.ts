/**
 * Technical Conclusion Generator
 * 
 * Generates a contextual, data-driven conclusion — NOT generic text.
 * Covers: current state, gaps against standard, risk of inaction, and scalability readiness.
 */

import { AnalysisOutput } from '../../models/analysis-v2.model';
import { FindingsViewData } from '../../models/findings-v2.model';
import { RiskAnalysis } from '../../models/report-v2.model';

const PRACTICE_NAMES: Record<string, string> = {
    SCM: 'Gestión de Configuración',
    QA: 'Aseguramiento de Calidad',
    PM: 'Gestión de Proyecto',
};

export function generateConclusion(
    analysis: AnalysisOutput,
    findingsData: FindingsViewData,
    riskAnalysis: RiskAnalysis,
    auditName: string,
    organization: string,
): { current_state: string; gaps_against_standard: string[]; risk_of_inaction: string; scalability_readiness: string } {
    const globalLevel = analysis.aggregated_results.global_maturity_level;
    const approved = findingsData.findings.filter(f => f.status === 'approved');
    const highCount = approved.filter(f => f.severity === 'HIGH').length;
    const repoCount = analysis.repository_results.length;

    // Current state — derived from actual data
    const practiceStates: string[] = [];
    for (const [code, data] of Object.entries(analysis.aggregated_results.practice_scores)) {
        const name = PRACTICE_NAMES[code] || code;
        practiceStates.push(`${name}: nivel ${data.level} (${data.score}/${data.max_score})`);
    }

    const current_state =
        `La auditoría "${auditName}" evaluó ${repoCount} repositorios de la organización "${organization}" ` +
        `contra el estándar DevAudit v1.0, alcanzando un nivel de madurez global "${globalLevel}". ` +
        `Desglose por práctica: ${practiceStates.join('; ')}. ` +
        `Se generaron ${approved.length} hallazgos formales (${highCount} de severidad alta).`;

    // Gaps — concrete, from failed rules
    const gaps: string[] = [];
    const failedRuleIds = new Set<string>();
    for (const repo of analysis.repository_results) {
        for (const pr of repo.practice_results) {
            for (const er of pr.evaluated_rules) {
                if (!er.passed && !failedRuleIds.has(er.rule_id)) {
                    failedRuleIds.add(er.rule_id);
                    gaps.push(`${er.rule_id} — ${er.detail.split(':').pop()?.trim() || er.detail}`);
                }
            }
        }
    }
    if (gaps.length === 0) {
        gaps.push('No se identificaron brechas significativas. Todos los controles del estándar están implementados.');
    }

    // Risk of inaction
    let risk_of_inaction: string;
    if (globalLevel === 'Inicial') {
        risk_of_inaction =
            `Si no se implementan las acciones correctivas, la organización mantiene una exposición alta a riesgos de calidad, ` +
            `seguridad y trazabilidad. Con ${highCount} hallazgos críticos sin resolver, ` +
            `existe riesgo de acumulación de deuda técnica, pérdida de conocimiento organizacional, ` +
            `y dificultad creciente para escalar equipos o procesos. ` +
            `La ausencia de controles formales impide la adopción de prácticas DevOps maduras.`;
    } else if (globalLevel === 'Gestionado') {
        risk_of_inaction =
            `Sin intervención, los controles parciales existentes pueden degradarse gradualmente. ` +
            `Las brechas identificadas, aunque no críticas individualmente, pueden acumularse y ` +
            `comprometer la sostenibilidad del proceso. El riesgo principal es el estancamiento ` +
            `en un nivel de madurez que no garantiza calidad consistente.`;
    } else {
        risk_of_inaction =
            `El riesgo de inacción es bajo dado el nivel actual. Sin embargo, la ausencia de ` +
            `auditorías periódicas y la no atención a los ${approved.length} hallazgos menores ` +
            `podría resultar en una regresión gradual del nivel de madurez alcanzado.`;
    }

    // Scalability readiness
    let scalability_readiness: string;
    if (globalLevel === 'Definido') {
        scalability_readiness =
            `La organización está preparada para escalar sus procesos de desarrollo. ` +
            `Los controles formales implementados permiten incorporar nuevos equipos, ` +
            `repositorios y proyectos manteniendo la calidad. Se recomienda adoptar ` +
            `prácticas avanzadas de CI/CD y observabilidad como siguiente nivel de madurez.`;
    } else if (globalLevel === 'Gestionado') {
        scalability_readiness =
            `La organización tiene una base parcial para escalar, pero las brechas identificadas ` +
            `limitarían la capacidad de mantener la calidad al crecer. Se recomienda ` +
            `cerrar los hallazgos de severidad media antes de expandir equipos o procesos.`;
    } else {
        scalability_readiness =
            `La organización NO está preparada para escalar sus procesos de desarrollo. ` +
            `La ausencia de controles formales hace que agregar repositorios, equipos o ` +
            `complejidad tecnológica amplifique los riesgos actuales exponencialmente. ` +
            `Se debe priorizar la maduración de procesos antes de cualquier expansión.`;
    }

    return { current_state, gaps_against_standard: gaps, risk_of_inaction, scalability_readiness };
}
