import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { AnalysisController } from '../controllers/analysis.controller';
import { FindingsController } from '../controllers/findings.controller';

const router = Router();

router.post('/', AuditController.createAudit);
router.get('/', AuditController.getAudits);
router.get('/:id', AuditController.getAuditById);
router.patch('/:id', AuditController.updateAudit);
router.delete('/:id', AuditController.deleteAudit);

// Analysis routes
router.post('/:id/collect-metrics', AnalysisController.collectMetrics);
router.post('/:id/analysis', AnalysisController.runAnalysis);
router.get('/:id/analysis', AnalysisController.getAnalysis);
router.get('/:id/metrics', AnalysisController.getMetrics);

// Findings routes
router.post('/:id/findings/generate', FindingsController.generateFindings);
router.get('/:id/findings', FindingsController.getFindings);
router.post('/:id/findings', FindingsController.createFinding);
router.patch('/:id/findings/:findingId', FindingsController.updateFinding);
router.delete('/:id/findings/:findingId', FindingsController.deleteFinding);

export default router;
