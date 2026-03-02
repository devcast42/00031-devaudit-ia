import { Request, Response } from 'express';
import { AuditService } from '../services/audit.service';
import { CreateAuditDto } from '../models/audit.model';

export class AuditController {
    /**
     * @openapi
     * /audits:
     *   post:
     *     tags:
     *       - Audits
     *     description: Create a new audit
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - name
     *               - organization
     *               - reviewPeriod
     *               - complianceStandard
     *             properties:
     *               name:
     *                 type: string
     *               organization:
     *                 type: string
     *               reviewPeriod:
     *                 type: string
     *               complianceStandard:
     *                 type: string
     *     responses:
     *       201:
     *         description: Audit created successfully
     */
    static async createAudit(req: Request, res: Response): Promise<void> {
        try {
            const data: CreateAuditDto = req.body;
            const audit = await AuditService.createAudit(data);
            res.status(201).json(audit);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * @openapi
     * /audits:
     *   get:
     *     tags:
     *       - Audits
     *     description: Get all audits
     *     responses:
     *       200:
     *         description: List of audits
     */
    static async getAudits(req: Request, res: Response): Promise<void> {
        try {
            const audits = await AuditService.getAudits();
            res.json(audits);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getAuditById(req: Request, res: Response): Promise<void> {
        try {
            const audit = await AuditService.getAuditById(req.params.id as string);
            if (audit) {
                res.json(audit);
            } else {
                res.status(404).json({ error: 'Auditoría no encontrada' });
            }
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async updateAudit(req: Request, res: Response): Promise<void> {
        try {
            const audit = await AuditService.updateAudit(req.params.id as string, req.body);
            if (audit) {
                res.json(audit);
            } else {
                res.status(404).json({ error: 'Auditoría no encontrada' });
            }
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async deleteAudit(req: Request, res: Response): Promise<void> {
        try {
            const success = await AuditService.deleteAudit(req.params.id as string);
            if (success) {
                res.status(204).send();
            } else {
                res.status(404).json({ error: 'Auditoría no encontrada' });
            }
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
