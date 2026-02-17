export interface AuditAnalysis {
    id: string;
    audit_id: string;
    practice_code: string;
    practice_name: string;
    score: number;
    max_score: number;
    maturity_level: number;
    calculated_at: string;
}

export interface AuditFinding {
    id: string;
    audit_id: string;
    practice_code: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    created_at: string;
}

export interface AnalysisResult {
    global_maturity_level: number;
    practices: AuditAnalysis[];
    findings: AuditFinding[];
}
