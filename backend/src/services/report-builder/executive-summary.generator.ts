/**
 * Executive Summary Generator
 * 
 * Generates an intelligent, data-driven executive summary.
 * NO fixed text — everything is derived from actual analysis and findings data.
 */

import { AnalysisOutput } from '../../models/analysis-v2.model';
import { FindingsViewData } from '../../models/findings-v2.model';
import { ExecutiveSummary } from '../../models/report-v2.model';

const MATURITY_INTERPRETATIONS: Record<string, string> = {
    'Inicial': 'La organización se encuentra en un nivel inicial de madurez. Los procesos de desarrollo evaluados carecen de controles formales y prácticas estandarizadas. Esto indica que las actividades de ingeniería de software se realizan de forma ad-hoc, sin procedimientos documentados ni mecanismos de verificación sistemática.',
    'Gestionado': 'La organización se encuentra en un nivel gestionado de madurez. Existen controles parciales en algunas prácticas, pero no se han implementado de forma consistente en todos los repositorios evaluados. Aunque se evidencian esfuerzos de formalización, subsisten brechas significativas que limitan la capacidad de asegurar la calidad de forma sostenible.',
    'Definido': 'La organización se encuentra en un nivel definido de madurez. Los procesos evaluados demuestran controles formales implementados y funcionando de manera consistente. Las prácticas de desarrollo siguen procedimientos documentados con mecanismos de verificación activos.',
};

function maturityToNumber(level: string): number {
    switch (level) {
        case 'Definido': return 3;
        case 'Gestionado': return 2;
        default: return 1;
    }
}

export function generateExecutiveSummary(
    analysis: AnalysisOutput,
    findingsData: FindingsViewData
): ExecutiveSummary {
    const globalLevel = analysis.aggregated_results.global_maturity_level;
    const approvedFindings = findingsData.findings.filter(f => f.status === 'approved');
    const highCount = approvedFindings.filter(f => f.severity === 'HIGH').length;
    const mediumCount = approvedFindings.filter(f => f.severity === 'MEDIUM').length;
    const lowCount = approvedFindings.filter(f => f.severity === 'LOW').length;

    // Principal risks — derived from HIGH severity findings
    const principalRisks: string[] = [];
    const highFindings = approvedFindings.filter(f => f.severity === 'HIGH');
    for (const f of highFindings) {
        principalRisks.push(`${f.practice_name}: ${f.title} (${f.repository})`);
    }
    if (principalRisks.length === 0 && mediumCount > 0) {
        const medFindings = approvedFindings.filter(f => f.severity === 'MEDIUM').slice(0, 3);
        for (const f of medFindings) {
            principalRisks.push(`${f.practice_name}: ${f.title} (${f.repository})`);
        }
    }
    if (principalRisks.length === 0) {
        principalRisks.push('No se identificaron riesgos de severidad alta o media.');
    }

    // Organizational impact
    const repoCount = analysis.repository_results.length;
    const totalFindings = approvedFindings.length;
    let organizationalImpact: string;
    if (highCount > 0) {
        organizationalImpact = `Se identificaron ${highCount} hallazgos de severidad alta que afectan directamente la integridad del proceso de desarrollo en ${repoCount} repositorios evaluados. La ausencia de controles críticos expone a la organización a riesgos de calidad, seguridad y trazabilidad que pueden impactar la operación y la capacidad de escalar.`;
    } else if (mediumCount > 0) {
        organizationalImpact = `Se identificaron ${mediumCount} hallazgos de severidad media en ${repoCount} repositorios evaluados. Si bien no representan un riesgo inmediato, estas debilidades pueden acumularse y comprometer la sostenibilidad del proceso de desarrollo a mediano plazo.`;
    } else {
        organizationalImpact = `Los ${repoCount} repositorios evaluados demuestran un cumplimiento satisfactorio del estándar. Los hallazgos identificados son de baja severidad y no representan riesgos operativos significativos.`;
    }

    // General recommendation
    let generalRecommendation: string;
    if (globalLevel === 'Inicial') {
        generalRecommendation = `Se recomienda con carácter urgente establecer controles formales para las prácticas de severidad alta (${highCount} hallazgos). Priorizar la implementación de revisión de código mediante Pull Requests, protección de ramas principales, y adopción de pruebas automatizadas. Establecer un comité de seguimiento con revisiones quincenales.`;
    } else if (globalLevel === 'Gestionado') {
        generalRecommendation = `Se recomienda fortalecer los controles existentes y abordar los ${totalFindings} hallazgos identificados. Enfocarse en cerrar las brechas de severidad media para alcanzar un nivel definido de madurez. Establecer métricas de seguimiento y revisiones mensuales de cumplimiento.`;
    } else {
        generalRecommendation = `Se recomienda mantener los controles actuales y abordar los ${totalFindings} hallazgos menores identificados. Implementar un proceso de auditoría periódica para asegurar la sostenibilidad del nivel alcanzado. Considerar la adopción de prácticas avanzadas de DevOps para continuar la mejora.`;
    }

    return {
        global_maturity_level: globalLevel,
        global_maturity_numeric: maturityToNumber(globalLevel),
        maturity_interpretation: MATURITY_INTERPRETATIONS[globalLevel] || MATURITY_INTERPRETATIONS['Inicial'],
        principal_risks: principalRisks,
        organizational_impact: organizationalImpact,
        severity_summary: {
            high: highCount,
            medium: mediumCount,
            low: lowCount,
            total: totalFindings,
        },
        general_recommendation: generalRecommendation,
    };
}
