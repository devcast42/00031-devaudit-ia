/**
 * STEP 4 — Findings Service v2
 * 
 * Pure transformation layer: receives AnalysisOutput from STEP 3
 * and transforms it into UI-ready data structures.
 * 
 * Guarantees:
 *   - Does NOT recalculate scores or maturity levels
 *   - Does NOT re-analyze evidence
 *   - Does NOT invent findings
 *   - Preserves complete traceability (rule, standard, evidence, repository)
 *   - Supports manual findings with validation
 */

import { v4 as uuidv4 } from 'uuid';
import { AnalysisOutput, AnalysisFinding } from '../models/analysis-v2.model';
import { UIFinding, FindingsViewData, CreateUIFindingDto, UpdateUIFindingDto } from '../models/findings-v2.model';
import { AnalysisServiceV2 } from './analysis-v2.service';

/**
 * Human-readable practice names for UI display.
 */
const PRACTICE_NAMES: Record<string, string> = {
    SCM: 'Gestión de Configuración',
    QA: 'Aseguramiento de Calidad',
    PM: 'Gestión de Proyecto',
};

/**
 * Generates a recommendation based on the practice and rule violated.
 */
function generateRecommendation(finding: AnalysisFinding): string {
    const practiceName = PRACTICE_NAMES[finding.practice] || finding.practice;
    return `Implementar controles formales para "${finding.title}" en la práctica ${practiceName}. ` +
        `Referencia: ${finding.standard_reference}. ` +
        `Se recomienda establecer procedimientos documentados y verificables.`;
}

export class FindingsServiceV2 {
    /** In-memory store for UI findings (includes both automatic and manual) */
    private static findingsStore: Map<string, UIFinding[]> = new Map();

    // ─── Generation from Analysis (Transformation Only) ─────────────────────────

    /**
     * Generates UI-ready findings from STEP 3 analysis output.
     * This is a PURE TRANSFORMATION — no recalculation.
     * 
     * @param auditId - The audit to generate findings for
     * @returns Complete FindingsViewData for UI consumption
     * @throws Error if no analysis exists for this audit
     */
    static async generateFromAnalysis(auditId: string): Promise<FindingsViewData> {
        const analysis = await AnalysisServiceV2.getAnalysisByAuditId(auditId);

        if (!analysis) {
            throw new Error(
                'No se encontró ningún análisis para esta auditoría. Ejecute el análisis primero.'
            );
        }

        // Remove previous automatic findings (keep manual ones)
        const existingManual = (this.findingsStore.get(auditId) || [])
            .filter(f => f.source === 'manual');

        // Transform AnalysisFinding[] → UIFinding[]
        const autoFindings: UIFinding[] = analysis.findings.map(af => ({
            finding_id: af.finding_id,
            repository: af.repository,
            practice: af.practice,
            practice_name: PRACTICE_NAMES[af.practice] || af.practice,
            severity: af.severity,
            title: af.title,
            description: af.description,
            recommendation: generateRecommendation(af),
            rule_violated: af.rule_violated,
            standard_reference: af.standard_reference,
            evidence_snapshot: { ...af.evidence_snapshot },
            source: 'automatic' as const,
            status: 'draft' as const,
            analysis_source_id: af.analysis_source_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }));

        // Merge: automatic + existing manual
        const allFindings = [...autoFindings, ...existingManual];
        this.findingsStore.set(auditId, allFindings);

        return this.buildViewData(auditId);
    }

    // ─── Read ───────────────────────────────────────────────────────────────────

    /**
     * Gets the current findings view data for an audit.
     */
    static async getByAuditId(auditId: string): Promise<FindingsViewData> {
        return this.buildViewData(auditId);
    }

    /**
     * Gets a single finding by ID.
     */
    static async getById(auditId: string, findingId: string): Promise<UIFinding | undefined> {
        const findings = this.findingsStore.get(auditId) || [];
        return findings.find(f => f.finding_id === findingId);
    }

    // ─── Manual Finding CRUD ────────────────────────────────────────────────────

    /**
     * Creates a manual finding.
     * Manual findings are validated to require practice and repository.
     */
    static async create(auditId: string, dto: CreateUIFindingDto): Promise<UIFinding> {
        const finding: UIFinding = {
            finding_id: uuidv4(),
            repository: dto.repository,
            practice: dto.practice,
            practice_name: PRACTICE_NAMES[dto.practice] || dto.practice,
            severity: dto.severity,
            title: dto.title,
            description: dto.description,
            recommendation: dto.recommendation,
            rule_violated: 'MANUAL',
            standard_reference: 'N/A — Hallazgo manual',
            evidence_snapshot: dto.evidence_reference
                ? { manual_reference: dto.evidence_reference }
                : {},
            source: 'manual',
            status: 'draft',
            analysis_source_id: 'manual',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const existing = this.findingsStore.get(auditId) || [];
        existing.push(finding);
        this.findingsStore.set(auditId, existing);

        return finding;
    }

    /**
     * Updates an existing finding (both automatic and manual).
     */
    static async update(
        auditId: string,
        findingId: string,
        dto: UpdateUIFindingDto
    ): Promise<UIFinding | undefined> {
        const findings = this.findingsStore.get(auditId) || [];
        const index = findings.findIndex(f => f.finding_id === findingId);
        if (index === -1) return undefined;

        findings[index] = {
            ...findings[index],
            ...dto,
            updated_at: new Date().toISOString(),
        };
        return findings[index];
    }

    /**
     * Deletes a finding.
     */
    static async delete(auditId: string, findingId: string): Promise<boolean> {
        const findings = this.findingsStore.get(auditId) || [];
        const initial = findings.length;
        const filtered = findings.filter(f => f.finding_id !== findingId);
        this.findingsStore.set(auditId, filtered);
        return filtered.length < initial;
    }

    /**
     * Adds an evidence attachment to a finding
     */
    static async addAttachment(
        auditId: string,
        findingId: string,
        fileInfo: { file_name: string; original_name: string; mime_type: string; url: string; }
    ): Promise<UIFinding | undefined> {
        const findings = this.findingsStore.get(auditId) || [];
        const index = findings.findIndex(f => f.finding_id === findingId);
        if (index === -1) return undefined;

        const attachment = { ...fileInfo, uploaded_at: new Date().toISOString() };

        const currentAttachments = findings[index].attachments || [];

        findings[index] = {
            ...findings[index],
            attachments: [...currentAttachments, attachment],
            updated_at: new Date().toISOString(),
        };

        return findings[index];
    }

    // ─── View Data Builder ──────────────────────────────────────────────────────

    /**
     * Builds the complete FindingsViewData with pre-calculated counts.
     */
    private static buildViewData(auditId: string): FindingsViewData {
        const findings = this.findingsStore.get(auditId) || [];

        const bySeverity = {
            high: findings.filter(f => f.severity === 'HIGH').length,
            medium: findings.filter(f => f.severity === 'MEDIUM').length,
            low: findings.filter(f => f.severity === 'LOW').length,
        };

        const byPractice: Record<string, number> = {};
        const byRepository: Record<string, number> = {};
        for (const f of findings) {
            byPractice[f.practice] = (byPractice[f.practice] || 0) + 1;
            byRepository[f.repository] = (byRepository[f.repository] || 0) + 1;
        }

        return {
            total_findings: findings.length,
            by_severity: bySeverity,
            by_practice: byPractice,
            by_repository: byRepository,
            findings,
        };
    }
}
