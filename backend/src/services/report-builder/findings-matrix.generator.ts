/**
 * Findings Matrix Generator
 * 
 * Transforms approved UIFindings into the formal 11-field matrix
 * required for professional audit reports.
 */

import { FindingsViewData } from '../../models/findings-v2.model';
import { FindingsMatrixEntry } from '../../models/report-v2.model';

const PRACTICE_NAMES: Record<string, string> = {
    SCM: 'Gestión de Configuración',
    QA: 'Aseguramiento de Calidad',
    PM: 'Gestión de Proyecto',
};

function generateImpact(severity: string, practice: string): string {
    const practiceName = PRACTICE_NAMES[practice] || practice;
    switch (severity) {
        case 'HIGH':
            return `Impacto alto en ${practiceName}. La ausencia de este control compromete directamente la integridad del proceso y puede generar riesgos de calidad, seguridad y trazabilidad.`;
        case 'MEDIUM':
            return `Impacto medio en ${practiceName}. Esta debilidad limita la capacidad de asegurar la calidad de forma consistente y puede acumularse con otros riesgos.`;
        default:
            return `Impacto bajo en ${practiceName}. Este hallazgo representa una oportunidad de mejora sin riesgo operativo inmediato.`;
    }
}

export function generateFindingsMatrix(findingsData: FindingsViewData): FindingsMatrixEntry[] {
    const approved = findingsData.findings.filter(f => f.status === 'approved');

    return approved.map(f => ({
        id: f.finding_id,
        practice: f.practice,
        repository: f.repository,
        severity: f.severity,
        title: f.title,
        description: f.description,
        evidence: { ...f.evidence_snapshot },
        rule_violated: f.rule_violated,
        standard_reference: f.standard_reference,
        impact: generateImpact(f.severity, f.practice),
        recommendation: f.recommendation,
        status: f.status,
    }));
}
