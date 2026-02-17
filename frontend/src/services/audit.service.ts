import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export interface CreateAuditDto {
    name: string;
    organization: string;
    reviewPeriod: string;
    complianceStandard: string;
}

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

export class AuditService {
    static async createAudit(data: CreateAuditDto): Promise<Audit> {
        const response = await axios.post<Audit>(`${API_URL}/audits`, data);
        return response.data;
    }

    static async getAudits(): Promise<Audit[]> {
        const response = await axios.get<Audit[]>(`${API_URL}/audits`);
        return response.data;
    }

    static async getAuditById(id: string): Promise<Audit> {
        const response = await axios.get<Audit>(`${API_URL}/audits/${id}`);
        return response.data;
    }

    static async updateAudit(id: string, data: Partial<Audit>): Promise<Audit> {
        const response = await axios.patch<Audit>(`${API_URL}/audits/${id}`, data);
        return response.data;
    }

    static async deleteAudit(id: string): Promise<void> {
        await axios.delete(`${API_URL}/audits/${id}`);
    }
}
