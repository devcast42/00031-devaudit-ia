export interface FormalFinding {
    id: string;
    audit_id: string;
    practice_code: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    recommendation: string;
    evidence_reference?: string;
    source: 'automatic' | 'manual';
    status: 'draft' | 'approved';
    created_at: string;
    updated_at: string;
}

export interface CreateFindingDto {
    practice_code: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    recommendation: string;
    evidence_reference?: string;
}

export interface UpdateFindingDto {
    title?: string;
    description?: string;
    severity?: 'low' | 'medium' | 'high';
    recommendation?: string;
    evidence_reference?: string;
    status?: 'draft' | 'approved';
}

export interface FindingsSummary {
    total_findings: number;
    high: number;
    medium: number;
    low: number;
    findings: FormalFinding[];
}
