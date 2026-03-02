/**
 * Risk Analysis Generator
 * 
 * Produces consolidated risk assessment from analysis + findings data.
 * Classifies global risk, identifies critical areas, and maps weakness dependencies.
 */

import { AnalysisOutput } from '../../models/analysis-v2.model';
import { FindingsViewData } from '../../models/findings-v2.model';
import { RiskAnalysis, CriticalArea } from '../../models/report-v2.model';

const PRACTICE_NAMES: Record<string, string> = {
    SCM: 'Gestión de Configuración',
    QA: 'Aseguramiento de Calidad',
    PM: 'Gestión de Proyecto',
};

export function generateRiskAnalysis(
    analysis: AnalysisOutput,
    findingsData: FindingsViewData
): RiskAnalysis {
    const approved = findingsData.findings.filter(f => f.status === 'approved');
    const highCount = approved.filter(f => f.severity === 'HIGH').length;
    const mediumCount = approved.filter(f => f.severity === 'MEDIUM').length;
    const totalFindings = approved.length;

    // Global risk score: weighted sum (HIGH=3, MEDIUM=2, LOW=1) normalized
    const riskScore = highCount * 3 + mediumCount * 2 + (totalFindings - highCount - mediumCount);
    const maxPossibleRisk = totalFindings * 3;
    const normalizedRisk = maxPossibleRisk > 0 ? Math.round((riskScore / maxPossibleRisk) * 100) : 0;

    const globalRiskLevel: 'Alto' | 'Medio' | 'Bajo' =
        highCount > 0 || normalizedRisk >= 70 ? 'Alto'
            : normalizedRisk >= 40 ? 'Medio'
                : 'Bajo';

    const riskClassification =
        globalRiskLevel === 'Alto'
            ? `Riesgo alto (${normalizedRisk}%). Se identificaron ${highCount} hallazgos de severidad alta que requieren acción inmediata. La organización presenta vulnerabilidades críticas en sus procesos de desarrollo.`
            : globalRiskLevel === 'Medio'
                ? `Riesgo medio (${normalizedRisk}%). Los hallazgos identificados no representan riesgos inmediatos pero requieren atención planificada para evitar degradación del proceso.`
                : `Riesgo bajo (${normalizedRisk}%). Los controles evaluados funcionan adecuadamente. Los hallazgos menores identificados representan oportunidades de mejora.`;

    // Critical areas — group by practice
    const practiceFindings = new Map<string, { high: number; medium: number; total: number }>();
    for (const f of approved) {
        if (!practiceFindings.has(f.practice)) {
            practiceFindings.set(f.practice, { high: 0, medium: 0, total: 0 });
        }
        const pf = practiceFindings.get(f.practice)!;
        pf.total++;
        if (f.severity === 'HIGH') pf.high++;
        if (f.severity === 'MEDIUM') pf.medium++;
    }

    const criticalAreas: CriticalArea[] = [];
    for (const [practice, counts] of practiceFindings.entries()) {
        const riskLevel: 'Alto' | 'Medio' | 'Bajo' =
            counts.high > 0 ? 'Alto' : counts.medium > 0 ? 'Medio' : 'Bajo';

        const practiceName = PRACTICE_NAMES[practice] || practice;
        let description: string;
        if (riskLevel === 'Alto') {
            description = `${practiceName} presenta ${counts.high} hallazgos de severidad alta y ${counts.medium} de media. Se requieren controles correctivos inmediatos.`;
        } else if (riskLevel === 'Medio') {
            description = `${practiceName} presenta ${counts.medium} hallazgos de severidad media. Se recomienda planificar acciones correctivas a corto plazo.`;
        } else {
            description = `${practiceName} presenta ${counts.total} hallazgos de baja severidad. No requiere intervención urgente.`;
        }

        criticalAreas.push({
            area: practiceName,
            risk_level: riskLevel,
            findings_count: counts.total,
            description,
        });
    }

    // Sort critical areas by risk level (Alto first)
    const riskOrder = { Alto: 0, Medio: 1, Bajo: 2 };
    criticalAreas.sort((a, b) => riskOrder[a.risk_level] - riskOrder[b.risk_level]);

    // Weakness dependencies
    const weaknessDependencies: string[] = [];
    const hasSCMIssues = practiceFindings.has('SCM') && (practiceFindings.get('SCM')!.high > 0 || practiceFindings.get('SCM')!.medium > 0);
    const hasQAIssues = practiceFindings.has('QA') && (practiceFindings.get('QA')!.high > 0 || practiceFindings.get('QA')!.medium > 0);
    const hasPMIssues = practiceFindings.has('PM') && (practiceFindings.get('PM')!.high > 0 || practiceFindings.get('PM')!.medium > 0);

    if (hasSCMIssues && hasQAIssues) {
        weaknessDependencies.push('La debilidad en Gestión de Configuración amplifica el riesgo en Aseguramiento de Calidad: sin control de versiones formal, las pruebas pierden trazabilidad.');
    }
    if (hasSCMIssues && hasPMIssues) {
        weaknessDependencies.push('La ausencia de controles SCM dificulta la gestión de proyecto: sin branching strategy ni PRs, la planificación y seguimiento del trabajo se vuelven informales.');
    }
    if (hasQAIssues && hasPMIssues) {
        weaknessDependencies.push('Las debilidades en QA y PM se refuerzan mutuamente: sin pruebas automatizadas ni seguimiento formal de issues, los defectos no se detectan ni se gestionan adecuadamente.');
    }
    if (weaknessDependencies.length === 0) {
        weaknessDependencies.push('No se identificaron dependencias significativas entre las debilidades encontradas.');
    }

    return {
        global_risk_level: globalRiskLevel,
        global_risk_score: normalizedRisk,
        risk_classification: riskClassification,
        critical_areas: criticalAreas,
        weakness_dependencies: weaknessDependencies,
    };
}
