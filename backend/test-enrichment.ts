import { GeminiService } from './src/services/ai/gemini.service';
import { UIFinding } from './src/models/findings-v2.model';

async function testFullEnrichment() {
    console.log('--- Probando Enriquecimiento Completo de Informe ---');

    const mockFindings: UIFinding[] = [
        {
            finding_id: 'test-1',
            repository: 'backend-repo',
            practice: 'SCM',
            practice_name: 'Gestión de Configuración',
            severity: 'HIGH',
            title: 'Falta de protección de ramas',
            description: 'La rama principal (main) no tiene reglas de protección habilitadas.',
            recommendation: '',
            rule_violated: 'SCM-R002',
            standard_reference: 'ISO 27001',
            evidence_snapshot: {},
            source: 'automatic',
            status: 'approved',
            analysis_source_id: 'analysis-123',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            finding_id: 'test-2',
            repository: 'frontend-repo',
            practice: 'QA',
            practice_name: 'Aseguramiento de Calidad',
            severity: 'MEDIUM',
            title: 'Baja cobertura de pruebas',
            description: 'La cobertura de pruebas unitarias es inferior al 50%.',
            recommendation: '',
            rule_violated: 'QA-R001',
            standard_reference: 'ISO 27001',
            evidence_snapshot: {},
            source: 'automatic',
            status: 'approved',
            analysis_source_id: 'analysis-123',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    ];

    try {
        const enrichment = await GeminiService.enrichFullReport({
            name: 'Proyecto de Prueba',
            organization: 'DevAudit Labs',
            findings: mockFindings,
            summary_stats: {
                total_findings: 2,
                by_severity: { HIGH: 1, MEDIUM: 1, LOW: 0 },
                global_maturity_level: 'Gestionado'
            }
        });

        if (enrichment) {
            console.log('--- Enriquecimiento Exitoso ---');
            console.log('Resumen Ejecutivo:', enrichment.executive_summary.maturity_interpretation.substring(0, 100) + '...');
            console.log('Riesgos Principales:', enrichment.executive_summary.principal_risks);
            console.log('Análisis de Riesgos:', enrichment.risk_analysis.risk_classification.substring(0, 100) + '...');
            console.log('Conclusión:', enrichment.conclusion.current_state.substring(0, 100) + '...');
        } else {
            console.error('El enriquecimiento falló o devolvió null.');
        }
    } catch (error) {
        console.error('Error durante la prueba de enriquecimiento:', error);
    }
}

testFullEnrichment();
