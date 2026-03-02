/**
 * Rules Engine v2 — Per-Repository Evaluation with Full Traceability
 * 
 * This engine:
 * 1. Iterates repository by repository (never aggregates first)
 * 2. Applies all rules from the standard to each repository
 * 3. Generates findings ONLY when a rule fails, with evidence embedded
 * 4. Computes maturity level per practice per repository
 * 5. Returns structured results ready for aggregation
 * 
 * Key invariant: NO finding is ever generated without concrete evidence.
 */

import { v4 as uuidv4 } from 'uuid';
import { RepositoryMetricsInput } from '../models/rules.model';
import {
    RepositoryAnalysisResult,
    PracticeResult,
    EvaluatedRule,
    AnalysisFinding,
} from '../models/analysis-v2.model';
import { devAuditV1Rules, getRulesByPractice, ALL_PRACTICES } from './standard-rules/devaudit-v1.rules';

// ─── Maturity Level Calculation ─────────────────────────────────────────────────

/**
 * Determines the maturity level label based on score vs max_score.
 * 
 * Level 3 "Definido"    — score == max_score (all rules pass)
 * Level 2 "Gestionado"  — score >= ceil(max_score / 2)
 * Level 1 "Inicial"     — below threshold
 */
function computeMaturityLevel(score: number, maxScore: number): string {
    if (maxScore === 0) return 'Inicial';
    if (score >= maxScore) return 'Definido';
    if (score >= Math.ceil(maxScore / 2)) return 'Gestionado';
    return 'Inicial';
}

function maturityLevelToNumber(level: string): number {
    switch (level) {
        case 'Definido': return 3;
        case 'Gestionado': return 2;
        default: return 1;
    }
}

// ─── Core Engine ────────────────────────────────────────────────────────────────

export interface RulesEngineOutput {
    repository_results: RepositoryAnalysisResult[];
    findings: AnalysisFinding[];
}

/**
 * Evaluates all standard rules against each repository individually.
 * 
 * @param metricsArray - Array of per-repository metrics from STEP 2
 * @param analysisId - The analysis run ID for traceability
 * @returns Per-repository results and all generated findings
 */
export function evaluateAllRepositories(
    metricsArray: RepositoryMetricsInput[],
    analysisId: string
): RulesEngineOutput {
    const allFindings: AnalysisFinding[] = [];
    const repositoryResults: RepositoryAnalysisResult[] = [];

    for (const metrics of metricsArray) {
        const practiceResults: PracticeResult[] = [];

        for (const practice of ALL_PRACTICES) {
            const rules = getRulesByPractice(practice);
            const evaluatedRules: EvaluatedRule[] = [];
            const findingIds: string[] = [];
            let score = 0;
            const maxScore = rules.reduce((sum, r) => sum + r.points, 0);

            for (const rule of rules) {
                const result = rule.evaluate(metrics);

                const evaluatedRule: EvaluatedRule = {
                    rule_id: rule.rule_id,
                    passed: result.passed,
                    metric_values: result.metric_values,
                    detail: result.detail,
                };
                evaluatedRules.push(evaluatedRule);

                if (result.passed) {
                    score += rule.points;
                } else {
                    // Generate finding with embedded evidence
                    const findingId = uuidv4();
                    const finding: AnalysisFinding = {
                        finding_id: findingId,
                        repository: metrics.repo_full_name,
                        practice: practice,
                        severity: rule.severity_on_fail,
                        title: rule.title,
                        description: result.detail,
                        rule_violated: rule.rule_id,
                        standard_reference: rule.standard_reference,
                        evidence_snapshot: { ...result.metric_values },
                        analysis_source_id: analysisId,
                    };
                    allFindings.push(finding);
                    findingIds.push(findingId);
                }
            }

            const level = computeMaturityLevel(score, maxScore);

            practiceResults.push({
                practice,
                score,
                max_score: maxScore,
                level,
                evaluated_rules: evaluatedRules,
                generated_findings: findingIds,
            });
        }

        repositoryResults.push({
            repository: metrics.repo_full_name,
            practice_results: practiceResults,
        });
    }

    return { repository_results: repositoryResults, findings: allFindings };
}

// ─── Aggregation ────────────────────────────────────────────────────────────────

/**
 * Aggregates per-repository practice results into global practice scores
 * and a global maturity level.
 * 
 * Strategy: For each practice, sum scores and max_scores across all repos,
 * then recalculate the maturity level from the totals.
 * Global maturity = average of practice maturity levels (rounded down).
 */
export function aggregateResults(
    repositoryResults: RepositoryAnalysisResult[]
): { practice_scores: Record<string, { score: number; max_score: number; level: string }>; global_maturity_level: string } {
    const practiceAccumulator: Record<string, { totalScore: number; totalMax: number }> = {};

    for (const repoResult of repositoryResults) {
        for (const pr of repoResult.practice_results) {
            if (!practiceAccumulator[pr.practice]) {
                practiceAccumulator[pr.practice] = { totalScore: 0, totalMax: 0 };
            }
            practiceAccumulator[pr.practice].totalScore += pr.score;
            practiceAccumulator[pr.practice].totalMax += pr.max_score;
        }
    }

    const practiceScores: Record<string, { score: number; max_score: number; level: string }> = {};
    let maturitySum = 0;
    let practiceCount = 0;

    for (const [practice, acc] of Object.entries(practiceAccumulator)) {
        const level = computeMaturityLevel(acc.totalScore, acc.totalMax);
        practiceScores[practice] = {
            score: acc.totalScore,
            max_score: acc.totalMax,
            level,
        };
        maturitySum += maturityLevelToNumber(level);
        practiceCount++;
    }

    const avgMaturity = practiceCount > 0 ? Math.round(maturitySum / practiceCount) : 1;
    const globalLevel = avgMaturity >= 3 ? 'Definido' : avgMaturity >= 2 ? 'Gestionado' : 'Inicial';

    return {
        practice_scores: practiceScores,
        global_maturity_level: globalLevel,
    };
}
