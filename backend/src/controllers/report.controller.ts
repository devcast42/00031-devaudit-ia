import { Request, Response } from 'express';
import { ReportServiceV2 } from '../services/report-v2.service';

export class ReportController {
    /**
     * Generates the professional audit report.
     * @openapi
     * /audits/{id}/report/generate:
     *   post:
     *     tags:
     *       - Report
     *     description: Generates the professional audit report with 9 sections
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Audit ID
     *     responses:
     *       200:
     *         description: ProfessionalReportData
     *       400:
     *         description: Missing data or audit finalized
     */
    static async generateReport(req: Request, res: Response): Promise<void> {
        const auditId = req.params.id as string;
        try {
            const reportData = await ReportServiceV2.generateReport(auditId);
            res.json(reportData);
        } catch (error: any) {
            res.status(400).json({ error: error.message || 'Error al generar el informe' });
        }
    }

    /**
     * Gets the stored report.
     * @openapi
     * /audits/{id}/report:
     *   get:
     *     tags:
     *       - Report
     *     description: Retrieves the stored professional report
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Audit ID
     *     responses:
     *       200:
     *         description: ProfessionalReportData
     *       404:
     *         description: No report found
     */
    static async getReport(req: Request, res: Response): Promise<void> {
        const auditId = req.params.id as string;
        try {
            const reportData = await ReportServiceV2.getReport(auditId);
            if (!reportData) {
                res.status(404).json({ error: 'No se encontró ningún informe. Genere el informe primero.' });
                return;
            }
            res.json(reportData);
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Error al obtener el informe' });
        }
    }

    /**
     * Finalizes the audit.
     * @openapi
     * /audits/{id}/report/finalize:
     *   post:
     *     tags:
     *       - Report
     *     description: Finalizes the audit — locks report and marks audit as Completed
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Audit ID
     *     responses:
     *       200:
     *         description: Audit finalized
     *       400:
     *         description: Validation error
     */
    static async finalizeAudit(req: Request, res: Response): Promise<void> {
        const auditId = req.params.id as string;
        try {
            const reportData = await ReportServiceV2.finalizeAudit(auditId);
            res.json(reportData);
        } catch (error: any) {
            res.status(400).json({ error: error.message || 'Error al finalizar la auditoría' });
        }
    }
}
