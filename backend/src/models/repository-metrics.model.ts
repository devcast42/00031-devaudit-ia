export interface RepositoryMetrics {
    id: string;
    audit_id: string;
    repo_id: number;
    repo_name: string;
    repo_full_name: string;
    total_commits: number;
    pull_requests_count: number;
    branches_count: number;
    contributors_count: number;
    has_protected_main_branch: boolean;
    issues_count: number;
    open_issues_count: number;
    test_files_count: number;
    last_commit_date: string;
    collected_at: string;
}
