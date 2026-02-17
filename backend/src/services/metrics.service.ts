import { RepositoryMetrics } from '../models/repository-metrics.model';

export class MetricsService {
    private static metrics: RepositoryMetrics[] = [];

    static async saveMetrics(metrics: RepositoryMetrics[]): Promise<void> {
        // Remove old metrics for the same audit before saving new ones
        const auditIds = new Set(metrics.map(m => m.audit_id));
        this.metrics = this.metrics.filter(m => !auditIds.has(m.audit_id));
        this.metrics.push(...metrics);
    }

    static async getMetricsByAuditId(auditId: string): Promise<RepositoryMetrics[]> {
        return this.metrics.filter(m => m.audit_id === auditId);
    }

    static async deleteMetricsByAuditId(auditId: string): Promise<void> {
        this.metrics = this.metrics.filter(m => m.audit_id !== auditId);
    }
}
