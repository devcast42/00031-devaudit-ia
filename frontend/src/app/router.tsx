import { createBrowserRouter } from "react-router-dom";
import { ManagementLayout } from "@/layouts/ManagementLayout";
import { AuditFlowLayout } from "@/layouts/AuditFlowLayout";

import { AuditListPage } from "@/pages/audits/AuditListPage";
import { ScopeStep } from "@/pages/audit-flow/ScopeStep";
import { EvidenceStep } from "@/pages/audit-flow/EvidenceStep";
import { AnalysisStep } from "@/pages/audit-flow/AnalysisStep";
import { FindingsStep } from "@/pages/audit-flow/FindingsStep";
import { ReportStep } from "@/pages/audit-flow/ReportStep";

export const router = createBrowserRouter([
    {
        element: <ManagementLayout />,
        children: [
            { path: "/", element: <AuditListPage /> },
        ],
    },
    {
        path: "/audit/:id",
        element: <AuditFlowLayout />,
        children: [
            { path: "scope", element: <ScopeStep /> },
            { path: "evidence", element: <EvidenceStep /> },
            { path: "analysis", element: <AnalysisStep /> },
            { path: "findings", element: <FindingsStep /> },
            { path: "report", element: <ReportStep /> },
        ],
    },
]);
