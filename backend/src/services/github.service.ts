import axios from 'axios';
import { config } from '../config/github';

export class GitHubService {
    /**
     * Exchanges a GitHub authorization code for an access token.
     * @param code The authorization code from GitHub callback
     * @returns The access token
     */
    static async exchangeCodeForToken(code: string, redirectUri?: string): Promise<string> {
        try {
            const response = await axios.post(
                'https://github.com/login/oauth/access_token',
                {
                    client_id: config.github.clientId,
                    client_secret: config.github.clientSecret,
                    code: code,
                    redirect_uri: redirectUri || config.github.redirectUri,
                },
                {
                    headers: {
                        Accept: 'application/json',
                    },
                }
            );

            if (response.data.error) {
                throw new Error(response.data.error_description || response.data.error);
            }

            return response.data.access_token;
        } catch (error: any) {
            console.error('GitHub Token Exchange Error:', error.message);
            throw new Error(error.message || 'Failed to exchange code for token');
        }
    }

    /**
     * Fetches the repositories for the authenticated user.
     * @param accessToken The GitHub access token
     * @returns List of repositories
     */
    static async getRepositories(accessToken: string): Promise<any[]> {
        try {
            const response = await axios.get('https://api.github.com/user/repos', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: 'application/json',
                },
                params: {
                    sort: 'updated',
                    per_page: 100,
                },
            });

            return response.data.map((repo: any) => ({
                id: repo.id,
                name: repo.name,
                full_name: repo.full_name,
                description: repo.description,
                html_url: repo.html_url,
                language: repo.language,
                updated_at: repo.updated_at,
                default_branch: repo.default_branch,
            }));
        } catch (error: any) {
            console.error('GitHub API Error fetching repositories:', error.message);
            throw new Error(error.message || 'Failed to fetch repositories from GitHub');
        }
    }

    /**
     * Collects detailed metrics for a specific repository.
     * @param accessToken The GitHub access token
     * @param repoFullName The full name (owner/repo) of the repository
     * @returns Partial metrics object with all collected data
     */
    static async collectRepositoryMetrics(
        accessToken: string,
        repoFullName: string
    ): Promise<{
        total_commits: number;
        pull_requests_count: number;
        branches_count: number;
        contributors_count: number;
        has_protected_main_branch: boolean;
        issues_count: number;
        open_issues_count: number;
        test_files_count: number;
        last_commit_date: string;
    }> {
        const headers = {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
        };
        const baseUrl = `https://api.github.com/repos/${repoFullName}`;

        // Run all API calls in parallel for performance
        const [
            commitsRes,
            pullsRes,
            branchesRes,
            contributorsRes,
            repoRes,
            testSearchRes,
        ] = await Promise.allSettled([
            axios.get(`${baseUrl}/commits`, { headers, params: { per_page: 1 } }),
            axios.get(`${baseUrl}/pulls`, { headers, params: { state: 'all', per_page: 1 } }),
            axios.get(`${baseUrl}/branches`, { headers, params: { per_page: 100 } }),
            axios.get(`${baseUrl}/contributors`, { headers, params: { per_page: 100 } }),
            axios.get(baseUrl, { headers }),
            axios.get(`https://api.github.com/search/code`, {
                headers,
                params: { q: `test+repo:${repoFullName}+path:test OR path:spec OR path:__tests__` },
            }),
        ]);

        // Extract total count from Link header (GitHub pagination)
        const extractCount = (res: PromiseSettledResult<any>, fallbackData?: boolean): number => {
            if (res.status !== 'fulfilled') return 0;
            const link = res.value.headers?.link || '';
            const match = link.match(/page=(\d+)>; rel="last"/);
            if (match) return parseInt(match[1], 10);
            return Array.isArray(res.value.data) ? res.value.data.length : (fallbackData ? 1 : 0);
        };

        // Commits count
        const total_commits = extractCount(commitsRes);

        // PRs count
        const pull_requests_count = extractCount(pullsRes);

        // Branches
        const branches_count = branchesRes.status === 'fulfilled'
            ? branchesRes.value.data.length
            : 0;

        // Contributors
        const contributors_count = contributorsRes.status === 'fulfilled'
            ? contributorsRes.value.data.length
            : 0;

        // Repo details (issues, open_issues, default_branch)
        const repoData = repoRes.status === 'fulfilled' ? repoRes.value.data : {};
        const open_issues_count = repoData.open_issues_count || 0;

        // GitHub's open_issues_count includes PRs, so we use it as a proxy for total issues
        const issues_count = repoData.open_issues_count || 0;

        // Check branch protection
        let has_protected_main_branch = false;
        const defaultBranch = repoData.default_branch || 'main';
        try {
            await axios.get(`${baseUrl}/branches/${defaultBranch}/protection`, { headers });
            has_protected_main_branch = true;
        } catch {
            has_protected_main_branch = false;
        }

        // Test files count
        const test_files_count = testSearchRes.status === 'fulfilled'
            ? testSearchRes.value.data.total_count || 0
            : 0;

        // Last commit date
        let last_commit_date = '';
        if (commitsRes.status === 'fulfilled' && commitsRes.value.data.length > 0) {
            last_commit_date = commitsRes.value.data[0].commit?.committer?.date || '';
        }

        return {
            total_commits,
            pull_requests_count,
            branches_count,
            contributors_count,
            has_protected_main_branch,
            issues_count,
            open_issues_count,
            test_files_count,
            last_commit_date,
        };
    }
}
