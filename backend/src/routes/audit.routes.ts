import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { AnalysisController } from '../controllers/analysis.controller';
import { FindingsController } from '../controllers/findings.controller';
import { ReportController } from '../controllers/report.controller';

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
import { uploadEvidence } from '../middleware/upload.middleware';
router.post('/:id/findings/generate', FindingsController.generateFindings);
router.get('/:id/findings', FindingsController.getFindings);
router.post('/:id/findings', FindingsController.createFinding);
router.patch('/:id/findings/:findingId', FindingsController.updateFinding);
router.delete('/:id/findings/:findingId', FindingsController.deleteFinding);
router.post('/:id/findings/:findingId/evidence', uploadEvidence.single('evidence'), FindingsController.uploadEvidence);

// Report routes
router.post('/:id/report/generate', ReportController.generateReport);
router.get('/:id/report', ReportController.getReport);
router.post('/:id/report/finalize', ReportController.finalizeAudit);

export default router;

