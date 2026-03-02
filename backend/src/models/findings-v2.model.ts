/**
 * STEP 4 — Findings View Models (UI-Ready)
 * 
 * These models are the OUTPUT of STEP 4's transformation layer.
 * STEP 4 does NOT recalculate anything — it only transforms
 * AnalysisFinding[] from STEP 3 into a format suitable for UI rendering.
 * 
 * Traceability is preserved: every UIFinding references the original rule,
 * standard section, repository, and embeds the evidence snapshot.
 */

/**
 * Evidence Attachment for external manuals or visual proofs.
 */
export interface EvidenceAttachment {
    file_name: string;
    original_name: string;
    mime_type: string;
    url: string;
    uploaded_at: string;
}

/**
 * A finding ready for UI consumption.
 * Enriched with display-friendly fields (practice_name, recommendation)
 * while preserving all traceability references.
 */
export interface UIFinding {
    finding_id: string;
    repository: string;
    practice: string;
    practice_name: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    title: string;
    description: string;
    recommendation: string;
    rule_violated: string;
    standard_reference: string;
    evidence_snapshot: Record<string, string | number | boolean>;
    source: 'automatic' | 'manual';
    status: 'draft' | 'approved';
    analysis_source_id: string;
    attachments?: EvidenceAttachment[];
    created_at: string;
    updated_at: string;
}

/**
 * Aggregated view for the findings dashboard.
 * Contains pre-calculated counts for filters and summary cards.
 */
export interface FindingsViewData {
    total_findings: number;
    by_severity: { high: number; medium: number; low: number };
    by_practice: Record<string, number>;
    by_repository: Record<string, number>;
    findings: UIFinding[];
}

/**
 * DTO for creating a manual finding in STEP 4.
 * Manual findings still require practice, repository, and severity.
 */
export interface CreateUIFindingDto {
    practice: string;
    repository: string;
    title: string;
    description: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    recommendation: string;
    evidence_reference?: string;
}

/**
 * DTO for updating an existing finding.
 */
export interface UpdateUIFindingDto {
    title?: string;
    description?: string;
    severity?: 'HIGH' | 'MEDIUM' | 'LOW';
    recommendation?: string;
    status?: 'draft' | 'approved';
}
