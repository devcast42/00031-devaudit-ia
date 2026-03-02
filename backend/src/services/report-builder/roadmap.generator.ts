/**
 * Improvement Roadmap Generator
 * 
 * Transforms prioritized recommendations into a phased improvement plan:
 *   - Short term (0–30 days): HIGH severity, easy/moderate implementation
 *   - Medium term (1–3 months): MEDIUM severity + remaining HIGH
 *   - Long term (3–6 months): LOW severity + complex implementations
 */

import { PrioritizedRecommendation, RoadmapItem, ImprovementRoadmap } from '../../models/report-v2.model';

function generateExpectedOutcome(rec: PrioritizedRecommendation): string {
    switch (rec.severity) {
        case 'HIGH':
            return `Eliminación de riesgo crítico en ${rec.practice}. Reducción directa de la exposición organizacional.`;
        case 'MEDIUM':
            return `Fortalecimiento de controles en ${rec.practice}. Mejora en la consistencia y sostenibilidad del proceso.`;
        default:
            return `Mejora incremental en ${rec.practice}. Contribución a la madurez avanzada del proceso.`;
    }
}

export function generateRoadmap(recommendations: PrioritizedRecommendation[]): ImprovementRoadmap {
    const short_term: RoadmapItem[] = [];
    const medium_term: RoadmapItem[] = [];
    const long_term: RoadmapItem[] = [];

    for (const rec of recommendations) {
        const item: RoadmapItem = {
            phase: 'Corto Plazo (0–30 días)',
            action: rec.action,
            practice: rec.practice,
            related_finding_id: rec.finding_id,
            expected_outcome: generateExpectedOutcome(rec),
        };

        if (rec.severity === 'HIGH' && rec.implementation_ease !== 'Compleja') {
            item.phase = 'Corto Plazo (0–30 días)';
            short_term.push(item);
        } else if (rec.severity === 'HIGH' && rec.implementation_ease === 'Compleja') {
            item.phase = 'Mediano Plazo (1–3 meses)';
            medium_term.push(item);
        } else if (rec.severity === 'MEDIUM') {
            item.phase = 'Mediano Plazo (1–3 meses)';
            medium_term.push(item);
        } else {
            item.phase = 'Largo Plazo (3–6 meses)';
            long_term.push(item);
        }
    }

    return { short_term, medium_term, long_term };
}
