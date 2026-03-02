import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { GitHubService } from '../services/github.service';
import { MetricsService } from '../services/metrics.service';
import { AnalysisServiceV2 } from '../services/analysis-v2.service';
import { RepositoryMetrics } from '../models/repository-metrics.model';

export class AnalysisController {
    /**
     * Collects metrics from GitHub for the selected repositories.
     * This is called once from the Evidence step when the user clicks "Continue".
     * @openapi
     * /audits/{id}/collect-metrics:
     *   post:
     *     tags:
     *       - Analysis
     *     description: Collects repository metrics from GitHub for selected repos
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Audit ID
     *       - in: header
     *         name: Authorization
     *         required: true
     *         schema:
     *           type: string
     *         description: Bearer <github_access_token>
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               repositories:
     *                 type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: number
     *                     name:
     *                       type: string
     *                     full_name:
     *                       type: string
     *     responses:
     *       200:
     *         description: Metrics collected successfully
     *       400:
     *         description: Missing repositories or token
     *       500:
     *         description: Internal server error
     */
    static async collectMetrics(req: Request, res: Response): Promise<void> {
        const auditId = req.params.id as string;
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(' ')[1];
        const { repositories } = req.body;

        if (!token) {
            res.status(401).json({ error: 'Se requiere el token de acceso de GitHub' });
            return;
        }

        if (!repositories || !Array.isArray(repositories) || repositories.length === 0) {
            res.status(400).json({ error: 'Se requiere al menos un repositorio' });
            return;
        }

        try {
            const allMetrics: RepositoryMetrics[] = [];

            for (const repo of repositories) {
                try {
                    const rawMetrics = await GitHubService.collectRepositoryMetrics(token, repo.full_name);

                    allMetrics.push({
                        id: uuidv4(),
                        audit_id: auditId,
                        repo_id: repo.id,
                        repo_name: repo.name,
                        repo_full_name: repo.full_name,
                        ...rawMetrics,
                        collected_at: new Date().toISOString(),
                    });
                } catch (repoError: any) {
                    console.error(`Failed to collect metrics for ${repo.full_name}:`, repoError.message);
                    // Continue with other repos even if one fails
                }
            }

            await MetricsService.saveMetrics(allMetrics);

            res.json({
                message: `Métricas recolectadas para ${allMetrics.length} de ${repositories.length} repositorios`,
                metrics: allMetrics,
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Error al recolectar métricas' });
        }
    }

    /**
     * Runs the audit analysis engine (v2 — per-repository with full traceability).
     * @openapi
     * /audits/{id}/analysis:
     *   post:
     *     tags:
     *       - Analysis
     *     description: Runs the audit analysis on previously collected metrics
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Audit ID
     *     responses:
     *       200:
     *         description: Analysis completed successfully (AnalysisOutput)
     *       400:
     *         description: No metrics found for this audit
     *       500:
     *         description: Internal server error
     */
    static async runAnalysis(req: Request, res: Response): Promise<void> {
        const auditId = req.params.id as string;

        try {
            const result = await AnalysisServiceV2.runAuditAnalysis(auditId);
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message || 'Error al ejecutar el análisis' });
        }
    }

    /**
     * Gets saved analysis results for an audit.
     * @openapi
     * /audits/{id}/analysis:
     *   get:
     *     tags:
     *       - Analysis
     *     description: Gets saved analysis results for an audit
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Audit ID
     *     responses:
     *       200:
     *         description: Returns the analysis results (AnalysisOutput)
     *       404:
     *         description: No analysis found for this audit
     */
    static async getAnalysis(req: Request, res: Response): Promise<void> {
        const auditId = req.params.id as string;

        try {
            const result = await AnalysisServiceV2.getAnalysisByAuditId(auditId);
            if (!result) {
                res.status(404).json({ error: 'No se encontró ningún análisis para esta auditoría. Ejecute el análisis primero.' });
                return;
            }
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Error al obtener el análisis' });
        }
    }

    /**
     * Gets the stored metrics for an audit.
     * @openapi
     * /audits/{id}/metrics:
     *   get:
     *     tags:
     *       - Analysis
     *     description: Gets the stored repository metrics for an audit
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Audit ID
     *     responses:
     *       200:
     *         description: Returns the repository metrics
     */
    static async getMetrics(req: Request, res: Response): Promise<void> {
        const auditId = req.params.id as string;

        try {
            const metrics = await MetricsService.getMetricsByAuditId(auditId);
            res.json(metrics);
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Error al obtener las métricas' });
        }
    }
}
