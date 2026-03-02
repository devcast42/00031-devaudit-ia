/**
 * Practice Detail Generator
 * 
 * For each practice (SCM, QA, PM), generates a detailed analytical section
 * with rules passed/failed, risk level, and technical explanation.
 */

import { AnalysisOutput } from '../../models/analysis-v2.model';
import { PracticeDetailSection, PracticeRuleDetail } from '../../models/report-v2.model';
import { devAuditV1Rules } from '../standard-rules/devaudit-v1.rules';

const PRACTICE_NAMES: Record<string, string> = {
    SCM: 'Gestión de Configuración del Software',
    QA: 'Aseguramiento de Calidad',
    PM: 'Gestión de Proyecto',
};

function computeAggregatedRisk(score: number, maxScore: number): 'Alto' | 'Medio' | 'Bajo' {
    if (maxScore === 0) return 'Alto';
    const ratio = score / maxScore;
    if (ratio >= 0.8) return 'Bajo';
    if (ratio >= 0.5) return 'Medio';
    return 'Alto';
}

function generateTechnicalExplanation(
    practiceCode: string,
    practiceName: string,
    level: string,
    score: number,
    maxScore: number,
    failedCount: number,
    repoCount: number,
): string {
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    if (level === 'Definido') {
        return `La práctica ${practiceName} alcanza un nivel Definido con un cumplimiento del ${percentage}% (${score}/${maxScore} puntos) evaluado en ${repoCount} repositorios. Todos los controles del estándar DevAudit v1.0 para ${practiceCode} se encuentran implementados de forma consistente.`;
    } else if (level === 'Gestionado') {
        return `La práctica ${practiceName} se encuentra en nivel Gestionado con un cumplimiento del ${percentage}% (${score}/${maxScore} puntos). Se identificaron ${failedCount} reglas incumplidas en ${repoCount} repositorios evaluados. Los controles existentes operan de forma parcial, lo que limita la capacidad de asegurar la calidad de manera sostenible.`;
    }
    return `La práctica ${practiceName} se encuentra en nivel Inicial con un cumplimiento del ${percentage}% (${score}/${maxScore} puntos). Se identificaron ${failedCount} reglas incumplidas en ${repoCount} repositorios evaluados. La ausencia de controles formales en esta práctica representa un riesgo significativo para la organización.`;
}

export function generatePracticeDetails(analysis: AnalysisOutput): PracticeDetailSection[] {
    const practiceMap = new Map<string, {
        totalScore: number; totalMax: number;
        passedRules: Map<string, PracticeRuleDetail>;
        failedRules: Map<string, PracticeRuleDetail>;
        findingsCount: number;
    }>();

    const rulesLookup = new Map(devAuditV1Rules.map(r => [r.rule_id, r]));
    const repoCount = analysis.repository_results.length;

    for (const repo of analysis.repository_results) {
        for (const pr of repo.practice_results) {
            if (!practiceMap.has(pr.practice)) {
                practiceMap.set(pr.practice, {
                    totalScore: 0, totalMax: 0,
                    passedRules: new Map(), failedRules: new Map(),
                    findingsCount: 0,
                });
            }
            const acc = practiceMap.get(pr.practice)!;
            acc.totalScore += pr.score;
            acc.totalMax += pr.max_score;
            acc.findingsCount += pr.generated_findings.length;

            for (const er of pr.evaluated_rules) {
                const ruleDef = rulesLookup.get(er.rule_id);
                const detail: PracticeRuleDetail = {
                    rule_id: er.rule_id,
                    title: ruleDef?.title || er.rule_id,
                    passed: er.passed,
                    detail: `${repo.repository}: ${er.detail}`,
                    standard_reference: ruleDef?.standard_reference || 'N/A',
                };

                if (er.passed) {
                    if (!acc.passedRules.has(er.rule_id)) {
                        acc.passedRules.set(er.rule_id, { ...detail });
                    }
                } else {
                    if (!acc.failedRules.has(`${er.rule_id}-${repo.repository}`)) {
                        acc.failedRules.set(`${er.rule_id}-${repo.repository}`, detail);
                    }
                }
            }
        }
    }

    const sections: PracticeDetailSection[] = [];
    for (const [code, acc] of practiceMap.entries()) {
        const level = acc.totalMax === 0 ? 'Inicial'
            : acc.totalScore >= acc.totalMax ? 'Definido'
                : acc.totalScore >= Math.ceil(acc.totalMax / 2) ? 'Gestionado'
                    : 'Inicial';

        sections.push({
            practice_code: code,
            practice_name: PRACTICE_NAMES[code] || code,
            score: acc.totalScore,
            max_score: acc.totalMax,
            maturity_level: level,
            rules_passed: [...acc.passedRules.values()],
            rules_failed: [...acc.failedRules.values()],
            associated_findings_count: acc.findingsCount,
            aggregated_risk: computeAggregatedRisk(acc.totalScore, acc.totalMax),
            technical_explanation: generateTechnicalExplanation(
                code, PRACTICE_NAMES[code] || code, level,
                acc.totalScore, acc.totalMax,
                acc.failedRules.size, repoCount,
            ),
        });
    }

    return sections;
}
