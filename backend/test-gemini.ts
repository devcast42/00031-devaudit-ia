import { GeminiService } from './src/services/ai/gemini.service';
import { UIFinding } from './src/models/findings-v2.model';

async function testGemini() {
    console.log('--- Probando GeminiService con Fallback ---');

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
        }
    ];

    try {
        const recommendations = await GeminiService.generateRecommendations(mockFindings);
        console.log('Resultado Final:', recommendations.length > 0 ? 'ÉXITO' : 'FALLO');
    } catch (error) {
        console.error('Error durante la prueba:', error);
    }
}

testGemini();
