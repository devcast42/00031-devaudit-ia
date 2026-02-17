import { Audit, CreateAuditDto } from '../models/audit.model';
import { v4 as uuidv4 } from 'uuid';

export class AuditService {
    private static audits: Audit[] = [];

    static async createAudit(data: CreateAuditDto): Promise<Audit> {
        const newAudit: Audit = {
            id: uuidv4(),
            ...data,
            status: 'Planned',
            currentStep: data.currentStep || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.audits.push(newAudit);
        return newAudit;
    }

    static async getAudits(): Promise<Audit[]> {
        return this.audits;
    }

    static async getAuditById(id: string): Promise<Audit | undefined> {
        return this.audits.find(audit => audit.id === id);
    }

    static async updateAudit(id: string, data: Partial<Audit>): Promise<Audit | undefined> {
        const index = this.audits.findIndex(audit => audit.id === id);
        if (index === -1) return undefined;

        this.audits[index] = {
            ...this.audits[index],
            ...data,
            updatedAt: new Date().toISOString()
        };
        return this.audits[index];
    }

    static async deleteAudit(id: string): Promise<boolean> {
        const initialLength = this.audits.length;
        this.audits = this.audits.filter(audit => audit.id !== id);
        return this.audits.length < initialLength;
    }
}
