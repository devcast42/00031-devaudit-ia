/**
 * STEP 3 — Analysis Service v2
 * 
 * Orchestrates the full analysis pipeline:
 *   1. Fetches stored metrics from STEP 2 (never calls GitHub)
 *   2. Transforms metrics into RepositoryMetricsInput (decoupled from storage)
 *   3. Delegates to RulesEngineV2 for per-repo evaluation
 *   4. Aggregates results across all repositories
 *   5. Produces AnalysisOutput with complete traceability
 *   6. Persists results in memory for later retrieval
 * 
 * Key guarantee: every generated finding has concrete evidence embedded.
 */

import { v4 as uuidv4 } from 'uuid';
import { RepositoryMetricsInput } from '../models/rules.model';
import { AnalysisOutput } from '../models/analysis-v2.model';
import { RepositoryMetrics } from '../models/repository-metrics.model';
import { MetricsService } from './metrics.service';
import { evaluateAllRepositories, aggregateResults } from './rules-engine-v2';

export class AnalysisServiceV2 {
    /** In-memory store for analysis results (keyed by audit_id) */
    private static analysisStore: Map<string, AnalysisOutput> = new Map();

    /**
     * Runs the complete audit analysis for a given audit.
     * 
     * @param auditId - The audit to analyze
     * @returns Complete AnalysisOutput with per-repo results, findings, and aggregation
     * @throws Error if no metrics are found for the audit
     */
    static async runAuditAnalysis(auditId: string): Promise<AnalysisOutput> {
        // 1. Fetch stored metrics (never calls GitHub)
        const metrics = await MetricsService.getMetricsByAuditId(auditId);

        if (metrics.length === 0) {
            throw new Error(
                'No se encontraron métricas para esta auditoría. Por favor, recolecte la evidencia primero.'
            );
        }

        // 2. Transform RepositoryMetrics → RepositoryMetricsInput (decouple from storage)
        const metricsInput: RepositoryMetricsInput[] = metrics.map(
            (m: RepositoryMetrics) => ({
                repo_name: m.repo_name,
                repo_full_name: m.repo_full_name,
                total_commits: m.total_commits,
                pull_requests_count: m.pull_requests_count,
                branches_count: m.branches_count,
                contributors_count: m.contributors_count,
                has_protected_main_branch: m.has_protected_main_branch,
                issues_count: m.issues_count,
                open_issues_count: m.open_issues_count,
                test_files_count: m.test_files_count,
                last_commit_date: m.last_commit_date,
            })
        );

        // 3. Generate analysis ID for traceability
        const analysisId = uuidv4();

        // 4. Evaluate all repos against all rules
        const { repository_results, findings } = evaluateAllRepositories(metricsInput, analysisId);

        // 5. Aggregate results across repos
        const aggregated = aggregateResults(repository_results);

        // 6. Build complete output
        const output: AnalysisOutput = {
            analysis_id: analysisId,
            audit_id: auditId,
            executed_at: new Date().toISOString(),
            repository_results,
            aggregated_results: {
                practice_scores: aggregated.practice_scores,
                global_maturity_level: aggregated.global_maturity_level,
            },
            findings,
        };

        // 7. Persist (replace previous analysis for this audit)
        this.analysisStore.set(auditId, output);

        return output;
    }

    /**
     * Gets the saved analysis output for an audit.
     * 
     * @param auditId - The audit to look up
     * @returns The stored AnalysisOutput or null if not found
     */
    static async getAnalysisByAuditId(auditId: string): Promise<AnalysisOutput | null> {
        return this.analysisStore.get(auditId) || null;
    }
}
