import axios from 'axios';
import { config } from '../config/github';

export class GitHubService {
    /**
     * Exchanges a GitHub authorization code for an access token.
     * @param code The authorization code from GitHub callback
     * @returns The access token
     */
    static async exchangeCodeForToken(code: string): Promise<string> {
        try {
            const response = await axios.post(
                'https://github.com/login/oauth/access_token',
                {
                    client_id: config.github.clientId,
                    client_secret: config.github.clientSecret,
                    code: code,
                    redirect_uri: config.github.redirectUri,
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
}
