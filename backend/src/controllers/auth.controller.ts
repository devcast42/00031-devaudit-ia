import { Request, Response } from 'express';
import { GitHubService } from '../services/github.service';

export class AuthController {
    /**
     * Handles the GitHub OAuth callback and exchanges the code for a token.
     * @openapi
     * /auth/github/token:
     *   post:
     *     tags:
     *       - Authentication
     *     description: Exchanges a GitHub authorization code for an access token
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               code:
     *                 type: string
     *                 description: The authorization code from GitHub
     *               redirect_uri:
     *                 type: string
     *                 description: The redirect URI used in the initial request
     *     responses:
     *       200:
     *         description: Returns the access token
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 access_token:
     *                   type: string
     *       400:
     *         description: Invalid request or failed exchange
     *       500:
     *         description: Internal server error
     */
    static async getGitHubToken(req: Request, res: Response): Promise<void> {
        const { code, redirectUri } = req.body;

        if (!code) {
            res.status(400).json({ error: 'Authorization code is required' });
            return;
        }

        try {
            const accessToken = await GitHubService.exchangeCodeForToken(code, redirectUri);
            res.json({ access_token: accessToken });
        } catch (error: any) {
            res.status(400).json({ error: error.message || 'Failed to get GitHub token' });
        }
    }

    /**
     * Lists GitHub repositories for the authenticated user.
     * @openapi
     * /auth/github/repositories:
     *   get:
     *     tags:
     *       - Authentication
     *     description: Lists GitHub repositories for the authenticated user
     *     parameters:
     *       - in: header
     *         name: Authorization
     *         required: true
     *         schema:
     *           type: string
     *         description: Bearer <access_token>
     *     responses:
     *       200:
     *         description: Returns the list of repositories
     *       401:
     *         description: Unauthorized
     *       500:
     *         description: Internal server error
     */
    static async listRepositories(req: Request, res: Response): Promise<void> {
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(' ')[1];

        if (!token) {
            res.status(401).json({ error: 'GitHub access token is required' });
            return;
        }

        try {
            const repositories = await GitHubService.getRepositories(token);
            res.json(repositories);
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to fetch repositories' });
        }
    }
}
