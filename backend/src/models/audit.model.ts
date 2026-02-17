export interface Audit {
    id: string;
    name: string;
    organization: string;
    reviewPeriod: string;
    complianceStandard: string;
    status: 'Planned' | 'In Progress' | 'Completed';
    currentStep: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAuditDto {
    name: string;
    organization: string;
    reviewPeriod: string;
    complianceStandard: string;
    currentStep?: number;
}
