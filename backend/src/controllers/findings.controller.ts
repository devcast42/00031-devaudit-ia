import { Request, Response } from 'express';
import { FindingsService } from '../services/findings.service';
import { CreateFindingDto, UpdateFindingDto } from '../models/findings.model';

export class FindingsController {
    /**
     * Auto-generates findings from analysis results.
     * @openapi
     * /audits/{id}/findings/generate:
     *   post:
     *     tags:
     *       - Findings
     *     description: Auto-generates formal findings from analysis results
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Audit ID
     *     responses:
     *       200:
     *         description: Findings generated successfully
     *       400:
     *         description: No analysis found
     */
    static async generateFindings(req: Request, res: Response): Promise<void> {
        const auditId = req.params.id as string;
        try {
            const summary = await FindingsService.generateFindingsFromAnalysis(auditId);
            res.json(summary);
        } catch (error: any) {
            res.status(400).json({ error: error.message || 'Failed to generate findings' });
        }
    }

    /**
     * Lists all findings for an audit.
     * @openapi
     * /audits/{id}/findings:
     *   get:
     *     tags:
     *       - Findings
     *     description: Lists all findings for an audit
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Audit ID
     *     responses:
     *       200:
     *         description: Returns findings summary
     */
    static async getFindings(req: Request, res: Response): Promise<void> {
        const auditId = req.params.id as string;
        try {
            const summary = await FindingsService.getByAuditId(auditId);
            res.json(summary);
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to get findings' });
        }
    }

    /**
     * Creates a manual finding.
     * @openapi
     * /audits/{id}/findings:
     *   post:
     *     tags:
     *       - Findings
     *     description: Creates a manual finding for an audit
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Audit ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - practice_code
     *               - title
     *               - description
     *               - severity
     *               - recommendation
     *             properties:
     *               practice_code:
     *                 type: string
     *               title:
     *                 type: string
     *               description:
     *                 type: string
     *               severity:
     *                 type: string
     *                 enum: [low, medium, high]
     *               recommendation:
     *                 type: string
     *               evidence_reference:
     *                 type: string
     *     responses:
     *       201:
     *         description: Finding created
     *       400:
     *         description: Invalid input
     */
    static async createFinding(req: Request, res: Response): Promise<void> {
        const auditId = req.params.id as string;
        const dto: CreateFindingDto = req.body;

        if (!dto.practice_code || !dto.title || !dto.description || !dto.severity || !dto.recommendation) {
            res.status(400).json({ error: 'Missing required fields: practice_code, title, description, severity, recommendation' });
            return;
        }

        try {
            const finding = await FindingsService.create(auditId, dto);
            res.status(201).json(finding);
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to create finding' });
        }
    }

    /**
     * Updates a finding.
     * @openapi
     * /audits/{id}/findings/{findingId}:
     *   patch:
     *     tags:
     *       - Findings
     *     description: Updates an existing finding
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Audit ID
     *       - in: path
     *         name: findingId
     *         required: true
     *         schema:
     *           type: string
     *         description: Finding ID
     *     responses:
     *       200:
     *         description: Finding updated
     *       404:
     *         description: Finding not found
     */
    static async updateFinding(req: Request, res: Response): Promise<void> {
        const auditId = req.params.id as string;
        const findingId = req.params.findingId as string;
        const dto: UpdateFindingDto = req.body;

        try {
            const finding = await FindingsService.update(auditId, findingId, dto);
            if (!finding) {
                res.status(404).json({ error: 'Finding not found' });
                return;
            }
            res.json(finding);
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to update finding' });
        }
    }

    /**
     * Deletes a finding.
     * @openapi
     * /audits/{id}/findings/{findingId}:
     *   delete:
     *     tags:
     *       - Findings
     *     description: Deletes a finding
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Audit ID
     *       - in: path
     *         name: findingId
     *         required: true
     *         schema:
     *           type: string
     *         description: Finding ID
     *     responses:
     *       204:
     *         description: Finding deleted
     *       404:
     *         description: Finding not found
     */
    static async deleteFinding(req: Request, res: Response): Promise<void> {
        const auditId = req.params.id as string;
        const findingId = req.params.findingId as string;

        try {
            const success = await FindingsService.delete(auditId, findingId);
            if (!success) {
                res.status(404).json({ error: 'Finding not found' });
                return;
            }
            res.status(204).send();
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to delete finding' });
        }
    }
}
