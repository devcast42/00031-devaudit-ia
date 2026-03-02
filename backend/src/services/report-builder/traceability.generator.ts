/**
 * Traceability Generator
 * 
 * Builds the complete traceability chain for each finding:
 *   Evidence (metric) → Rule evaluated → Finding → Practice level → Global contribution
 * 
 * Also generates methodology and scoring explanations for academic/committee defense.
 */

import { AnalysisOutput } from '../../models/analysis-v2.model';
import { TraceabilityChain, TraceabilitySection } from '../../models/report-v2.model';

export function generateTraceability(analysis: AnalysisOutput): TraceabilitySection {
    const chains: TraceabilityChain[] = [];

    for (const repo of analysis.repository_results) {
        for (const pr of repo.practice_results) {
            for (const er of pr.evaluated_rules) {
                // Create chains for FAILED rules (findings)
                if (!er.passed) {
                    // Find the corresponding finding
                    const finding = analysis.findings.find(
                        f => f.rule_violated === er.rule_id && f.repository === repo.repository
                    );

                    // For each metric value in the evidence, create a chain entry
                    const metricEntries = Object.entries(er.metric_values);
                    const primaryMetric = metricEntries[0] || ['N/A', 'N/A'];

                    chains.push({
                        finding_id: finding?.finding_id || 'N/A',
                        repository: repo.repository,
                        evidence_metric: primaryMetric[0],
                        evidence_value: primaryMetric[1],
                        rule_evaluated: er.rule_id,
                        rule_result: 'FAIL',
                        finding_title: finding?.title || er.rule_id,
                        severity: finding?.severity || 'MEDIUM',
                        practice: pr.practice,
                        practice_level: pr.level,
                        contribution_to_global: `${pr.score}/${pr.max_score} puntos en ${pr.practice} → contribuye al nivel ${analysis.aggregated_results.global_maturity_level}`,
                    });
                }
            }
        }
    }

    const methodology = `La evaluación se realizó aplicando el estándar DevAudit v1.0 mediante un motor de reglas declarativo. ` +
        `Cada regla del estándar se evaluó individualmente contra cada repositorio del alcance, ` +
        `garantizando que la evaluación sea reproducible y que cada hallazgo tenga evidencia concreta asociada. ` +
        `Las métricas fueron recolectadas directamente de la API de GitHub (STEP 2) y se preservaron como snapshots inmutables ` +
        `al momento de la evaluación (STEP 3). El proceso no involucra juicio subjetivo: cada regla tiene criterios binarios ` +
        `(cumple/no cumple) documentados en el estándar.`;

    const scoring = `El nivel de madurez se calcula en tres niveles jerárquicos:\n` +
        `1. **Nivel de Regla**: Cada regla aporta puntos si se cumple (pass) y genera un hallazgo si no se cumple (fail).\n` +
        `2. **Nivel de Práctica**: Se suman los puntos de todas las reglas de la práctica en todos los repositorios. ` +
        `Nivel Definido (100%), Gestionado (≥50%), Inicial (<50%).\n` +
        `3. **Nivel Global**: Promedio de los niveles numéricos de las tres prácticas (SCM, QA, PM), redondeado. ` +
        `Este es el nivel de madurez final reportado.`;

    return {
        chains,
        methodology_explanation: methodology,
        scoring_explanation: scoring,
    };
}
