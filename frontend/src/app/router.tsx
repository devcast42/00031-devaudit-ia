import { createBrowserRouter } from "react-router-dom";
import { ManagementLayout } from "@/layouts/ManagementLayout";
import { AuditFlowLayout } from "@/layouts/AuditFlowLayout";

import { AuditListPage } from "@/pages/audits/AuditListPage";
import { ScopeStep } from "@/pages/audit-flow/ScopeStep";
import { EvidenceStep } from "@/pages/audit-flow/EvidenceStep";
import { AnalysisStep } from "@/pages/audit-flow/AnalysisStep";
import { FindingsStep } from "@/pages/audit-flow/FindingsStep";
import { ReportStep } from "@/pages/audit-flow/ReportStep";
import { ReportsPage } from "@/pages/reports/ReportsPage";
import { SettingsPage } from "@/pages/settings/SettingsPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const router = createBrowserRouter([
    {
        path: "/login",
        element: <LoginPage />,
    },
    {
        element: <RequireAuth><ManagementLayout /></RequireAuth>,
        children: [
            { path: "/", element: <AuditListPage /> },
            { path: "/reports", element: <ReportsPage /> },
            { path: "/settings", element: <SettingsPage /> },
        ],
    },
    {
        path: "/audit/:id",
        element: <RequireAuth><AuditFlowLayout /></RequireAuth>,
        children: [
            { path: "scope", element: <ScopeStep /> },
            { path: "evidence", element: <EvidenceStep /> },
            { path: "analysis", element: <AnalysisStep /> },
            { path: "findings", element: <FindingsStep /> },
            { path: "report", element: <ReportStep /> },
        ],
    },
]);
