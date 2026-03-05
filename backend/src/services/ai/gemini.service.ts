import { GoogleGenerativeAI } from '@google/generative-ai';
import { UIFinding } from '../../models/findings-v2.model';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface AIGeneratedRecommendation {
    finding_id: string;
    suggested_action: string;
    justification: string;
    implementation_ease: 'Fácil' | 'Moderada' | 'Compleja';
    impact: 'Alto' | 'Medio' | 'Bajo';
}

export interface FullReportEnrichment {
    executive_summary: {
        maturity_interpretation: string;
        principal_risks: string[];
        organizational_impact: string;
        general_recommendation: string;
    };
    risk_analysis: {
        risk_classification: string;
        weakness_dependencies: string[];
    };
    conclusion: {
        current_state: string;
        risk_of_inaction: string;
        scalability_readiness: string;
    };
}

export class GeminiService {
    /**
     * Generates a complete enrichment for the audit report.
     */
    static async enrichFullReport(
        auditData: {
            name: string;
            organization: string;
            findings: UIFinding[];
            summary_stats: any;
        }
    ): Promise<FullReportEnrichment | null> {
        const prompt = `
            Actúa como un Auditor de Software Sénior y Consultor Estratégico de TI.
            He realizado una auditoría para la organización "${auditData.organization}" en el proyecto "${auditData.name}".
            
             हॉल hallazgos principales (resumen):
            ${JSON.stringify(auditData.findings.map(f => ({
            title: f.title,
            severity: f.severity,
            practice: f.practice
        })), null, 2)}

            Estadísticas sugeridas:
            ${JSON.stringify(auditData.summary_stats, null, 2)}

            Necesito que generes el contenido textual narrativo para las siguientes secciones del informe:
            1. Resumen Ejecutivo (Interpretación de madurez, Riesgos principales, Impacto organizacional, Recomendación general)
            2. Análisis de Riesgos (Clasificación detallada del riesgo, Dependencias de debilidades)
            3. Conclusión Técnica (Estado actual, Riesgo de inacción, Preparación para escalabilidad)

            Responde ÚNICAMENTE con un objeto JSON con la siguiente estructura:
            {
                "executive_summary": {
                    "maturity_interpretation": "...",
                    "principal_risks": ["...", "..."],
                    "organizational_impact": "...",
                    "general_recommendation": "..."
                },
                "risk_analysis": {
                    "risk_classification": "...",
                    "weakness_dependencies": ["...", "..."]
                },
                "conclusion": {
                    "current_state": "...",
                    "risk_of_inaction": "...",
                    "scalability_readiness": "..."
                }
            }

            Idioma: Español. Profesional, ejecutivo y técnico.
        `;

        const modelsToTry = ['gemini-3-flash-preview', 'gemini-2.0-flash', 'gemini-1.5-pro'];

        for (const modelName of modelsToTry) {
            try {
                console.log(`Enriqueciendo informe con modelo: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(cleanedJson);
            } catch (error: any) {
                console.warn(`Fallo enriquecimiento con ${modelName}:`, error.message || error);
                if (modelName === modelsToTry[modelsToTry.length - 1]) {
                    console.error('Todos los modelos de Gemini fallaron para enriquecimiento.');
                    return null;
                }
            }
        }
        return null;
    }

    /**
     * Generates professional recommendations based on audit findings.
     */
    static async generateRecommendations(findings: UIFinding[]): Promise<AIGeneratedRecommendation[]> {
        const prompt = `
            Actúa como un Auditor de Software Sénior y Experto en DevOps/QA.
            He realizado una auditoría y encontrado los siguientes hallazgos. 
            Necesito que generes una recomendación profesional para cada uno de ellos.
            
            Los hallazgos son:
            ${JSON.stringify(findings.map(f => ({
            id: f.finding_id,
            title: f.title,
            description: f.description,
            practice: f.practice,
            severity: f.severity,
            repository: f.repository
        })), null, 2)}

            Para cada hallazgo, proporciona un objeto JSON con la siguiente estructura:
            {
                "finding_id": "id del hallazgo original",
                "suggested_action": "Una acción clara, técnica y profesional para resolver el problema",
                "justification": "Por qué es importante realizar esta acción (contexto técnico)",
                "implementation_ease": "Fácil" | "Moderada" | "Compleja",
                "impact": "Alto" | "Medio" | "Bajo"
            }

            Responde ÚNICAMENTE con un array de JSON válido. No incluyas explicaciones adicionales ni bloques de código markdown.
            Idioma: Español.
        `;

        // Intentar modelos profesionales primero (incluyendo experimentales/nuevos)
        const modelsToTry = [
            'gemini-3-flash-preview',
        ];

        for (const modelName of modelsToTry) {
            try {
                console.log(`Intentando con modelo: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                // Limpiar markdown si está presente
                const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

                console.log(`Éxito con ${modelName}. Recomendaciones generadas.`);
                console.log('JSON:', cleanedJson);

                return JSON.parse(cleanedJson);
            } catch (error: any) {
                console.warn(`Fallo con ${modelName}:`, error.message || error);

                // Si es el último modelo, devuelvo array vacío
                if (modelName === modelsToTry[modelsToTry.length - 1]) {
                    console.error('Todos los modelos de Gemini fallaron.');
                    return [];
                }
            }
        }
        return [];
    }
}
