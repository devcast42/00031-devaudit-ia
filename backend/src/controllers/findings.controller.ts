import { Request, Response } from 'express';
import { FindingsServiceV2 } from '../services/findings-v2.service';
import { CreateUIFindingDto, UpdateUIFindingDto } from '../models/findings-v2.model';

export class FindingsController {
    /**
     * Auto-generates findings from analysis results (v2 — pure transformation).
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
     *         description: Findings generated successfully (FindingsViewData)
     *       400:
     *         description: No analysis found
     */
    static async generateFindings(req: Request, res: Response): Promise<void> {
        const auditId = req.params.id as string;
        try {
            const viewData = await FindingsServiceV2.generateFromAnalysis(auditId);
            res.json(viewData);
        } catch (error: any) {
            res.status(400).json({ error: error.message || 'Error al generar los hallazgos' });
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
     *         description: Returns findings view data (FindingsViewData)
     */
    static async getFindings(req: Request, res: Response): Promise<void> {
        const auditId = req.params.id as string;
        try {
            const viewData = await FindingsServiceV2.getByAuditId(auditId);
            res.json(viewData);
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Error al obtener los hallazgos' });
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
     *               - practice
     *               - repository
     *               - title
     *               - description
     *               - severity
     *               - recommendation
     *             properties:
     *               practice:
     *                 type: string
     *               repository:
     *                 type: string
     *               title:
     *                 type: string
     *               description:
     *                 type: string
     *               severity:
     *                 type: string
     *                 enum: [HIGH, MEDIUM, LOW]
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
        const dto: CreateUIFindingDto = req.body;

        if (!dto.practice || !dto.repository || !dto.title || !dto.description || !dto.severity || !dto.recommendation) {
            res.status(400).json({
                error: 'Faltan campos obligatorios: practice, repository, title, description, severity, recommendation',
            });
            return;
        }

        try {
            const finding = await FindingsServiceV2.create(auditId, dto);
            res.status(201).json(finding);
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Error al crear el hallazgo' });
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
        const dto: UpdateUIFindingDto = req.body;

        try {
            const finding = await FindingsServiceV2.update(auditId, findingId, dto);
            if (!finding) {
                res.status(404).json({ error: 'Hallazgo no encontrado' });
                return;
            }
            res.json(finding);
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Error al actualizar el hallazgo' });
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
            const success = await FindingsServiceV2.delete(auditId, findingId);
            if (!success) {
                res.status(404).json({ error: 'Hallazgo no encontrado' });
                return;
            }
            res.status(204).send();
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Error al eliminar el hallazgo' });
        }
    }
}
