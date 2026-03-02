/**
 * Recommendations Generator
 * 
 * Produces prioritized recommendations ordered by severity, impact,
 * and implementation ease. Each recommendation includes action, 
 * responsible party suggestion, and deadline.
 */

import { FindingsViewData } from '../../models/findings-v2.model';
import { PrioritizedRecommendation } from '../../models/report-v2.model';

const RESPONSIBLE_MAP: Record<string, string> = {
    SCM: 'Líder de Ingeniería / DevOps',
    QA: 'Líder de QA / Equipo de Testing',
    PM: 'Gerente de Proyecto / Scrum Master',
};

const DEADLINE_MAP: Record<string, Record<string, string>> = {
    HIGH: { 'Fácil': '15 días', 'Moderada': '30 días', 'Compleja': '60 días' },
    MEDIUM: { 'Fácil': '30 días', 'Moderada': '60 días', 'Compleja': '90 días' },
    LOW: { 'Fácil': '60 días', 'Moderada': '90 días', 'Compleja': '180 días' },
};

function assessImplementationEase(ruleViolated: string): 'Fácil' | 'Moderada' | 'Compleja' {
    // Branch protection and PRs are configuration-level changes (easy)
    if (['SCM-R002', 'SCM-R003'].includes(ruleViolated)) return 'Fácil';
    // PRs and issues require process changes (moderate)
    if (['SCM-R001', 'PM-R001', 'PM-R002', 'QA-R002'].includes(ruleViolated)) return 'Moderada';
    // Testing and recent activity require sustained effort (complex)
    if (['QA-R001', 'PM-R003'].includes(ruleViolated)) return 'Compleja';
    return 'Moderada';
}

function generateActionText(finding: { title: string; practice: string; repository: string; rule_violated: string }): string {
    return `Implementar controles para "${finding.title}" en el repositorio ${finding.repository}. ` +
        `Establecer procedimientos documentados y verificables para la práctica ${finding.practice}. ` +
        `Asignar responsable y verificar cumplimiento en el plazo establecido.`;
}

export function generateRecommendations(findingsData: FindingsViewData): PrioritizedRecommendation[] {
    const approved = findingsData.findings.filter(f => f.status === 'approved');

    // Sort by severity (HIGH first), then by practice
    const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    const sorted = [...approved].sort((a, b) => {
        const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (sevDiff !== 0) return sevDiff;
        return a.practice.localeCompare(b.practice);
    });

    return sorted.map((f, idx) => {
        const ease = assessImplementationEase(f.rule_violated);
        const impactLevel: 'Alto' | 'Medio' | 'Bajo' =
            f.severity === 'HIGH' ? 'Alto' : f.severity === 'MEDIUM' ? 'Medio' : 'Bajo';

        return {
            priority: idx + 1,
            finding_id: f.finding_id,
            action: generateActionText(f),
            practice: f.practice,
            severity: f.severity,
            impact: impactLevel,
            implementation_ease: ease,
            suggested_responsible: RESPONSIBLE_MAP[f.practice] || 'Equipo de Desarrollo',
            recommended_deadline: DEADLINE_MAP[f.severity]?.[ease] || '90 días',
        };
    });
}
