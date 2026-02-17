import { v4 as uuidv4 } from 'uuid';
import { FormalFinding, CreateFindingDto, UpdateFindingDto, FindingsSummary } from '../models/findings.model';
import { AnalysisService } from './analysis.service';

/**
 * Practice name mappings for human-readable finding titles.
 */
const practiceNames: Record<string, string> = {
    SCM: 'Gestión de Configuración',
    QA: 'Aseguramiento de Calidad',
    PM: 'Gestión de Proyecto',
};

export class FindingsService {
    private static findings: FormalFinding[] = [];

    // ─── Auto-generation ────────────────────────────────────────────────────────

    /**
     * Generates formal findings from analysis results.
     * Reads audit_analysis data (never calls external APIs).
     * Only generates for practices with maturity_level <= 2.
     */
    static async generateFindingsFromAnalysis(auditId: string): Promise<FindingsSummary> {
        const analysis = await AnalysisService.getAnalysisByAuditId(auditId);

        if (!analysis) {
            throw new Error('No analysis found for this audit. Run the analysis first.');
        }

        // Remove previous automatic findings for this audit (keep manual ones)
        this.findings = this.findings.filter(
            f => !(f.audit_id === auditId && f.source === 'automatic')
        );

        const generated: FormalFinding[] = [];

        for (const practice of analysis.practices) {
            // Only generate findings for practices with maturity level <= 2
            if (practice.maturity_level <= 2) {
                const practiceName = practiceNames[practice.practice_code] || practice.practice_code;
                const severity = practice.maturity_level <= 1 ? 'high' : 'medium';

                const finding: FormalFinding = {
                    id: uuidv4(),
                    audit_id: auditId,
                    practice_code: practice.practice_code,
                    title: `Debilidad en ${practiceName}`,
                    description: `Se evidencia un bajo nivel de madurez (Nivel ${practice.maturity_level}) en la práctica ${practiceName} (${practice.practice_code}), con un score de ${practice.score}/${practice.max_score}. Esto puede generar riesgos operativos y afectar la calidad del proceso de desarrollo.`,
                    severity,
                    recommendation: `Implementar controles formales asociados a la práctica ${practiceName}. Se recomienda establecer procedimientos documentados y verificables para elevar el nivel de madurez.`,
                    evidence_reference: `Análisis de métricas — Score: ${practice.score}/${practice.max_score}, Nivel: ${practice.maturity_level}`,
                    source: 'automatic',
                    status: 'draft',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                generated.push(finding);
            }
        }

        // Also transform preliminary findings from the analysis into formal findings
        for (const prelim of analysis.findings) {
            // Avoid duplicating if we already generated a practice-level finding
            const alreadyGenerated = generated.some(
                g => g.practice_code === prelim.practice_code && g.description.includes(prelim.description)
            );
            if (!alreadyGenerated) {
                const practiceName = practiceNames[prelim.practice_code] || prelim.practice_code;
                const finding: FormalFinding = {
                    id: uuidv4(),
                    audit_id: auditId,
                    practice_code: prelim.practice_code,
                    title: `Hallazgo en ${practiceName}`,
                    description: prelim.description,
                    severity: prelim.severity,
                    recommendation: `Revisar y mejorar las prácticas relacionadas con ${practiceName}.`,
                    source: 'automatic',
                    status: 'draft',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                generated.push(finding);
            }
        }

        this.findings.push(...generated);

        return this.buildSummary(auditId);
    }

    // ─── CRUD ───────────────────────────────────────────────────────────────────

    static async getByAuditId(auditId: string): Promise<FindingsSummary> {
        return this.buildSummary(auditId);
    }

    static async getById(auditId: string, findingId: string): Promise<FormalFinding | undefined> {
        return this.findings.find(f => f.audit_id === auditId && f.id === findingId);
    }

    static async create(auditId: string, dto: CreateFindingDto): Promise<FormalFinding> {
        const finding: FormalFinding = {
            id: uuidv4(),
            audit_id: auditId,
            ...dto,
            source: 'manual',
            status: 'draft',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        this.findings.push(finding);
        return finding;
    }

    static async update(auditId: string, findingId: string, dto: UpdateFindingDto): Promise<FormalFinding | undefined> {
        const index = this.findings.findIndex(f => f.audit_id === auditId && f.id === findingId);
        if (index === -1) return undefined;

        this.findings[index] = {
            ...this.findings[index],
            ...dto,
            updated_at: new Date().toISOString(),
        };
        return this.findings[index];
    }

    static async delete(auditId: string, findingId: string): Promise<boolean> {
        const initialLength = this.findings.length;
        this.findings = this.findings.filter(f => !(f.audit_id === auditId && f.id === findingId));
        return this.findings.length < initialLength;
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private static buildSummary(auditId: string): FindingsSummary {
        const auditFindings = this.findings.filter(f => f.audit_id === auditId);
        return {
            total_findings: auditFindings.length,
            high: auditFindings.filter(f => f.severity === 'high').length,
            medium: auditFindings.filter(f => f.severity === 'medium').length,
            low: auditFindings.filter(f => f.severity === 'low').length,
            findings: auditFindings,
        };
    }
}
