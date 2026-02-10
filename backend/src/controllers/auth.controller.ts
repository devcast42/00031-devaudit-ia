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
        const { code } = req.body;

        if (!code) {
            res.status(400).json({ error: 'Authorization code is required' });
            return;
        }

        try {
            const accessToken = await GitHubService.exchangeCodeForToken(code);
            res.json({ access_token: accessToken });
        } catch (error: any) {
            res.status(400).json({ error: error.message || 'Failed to get GitHub token' });
        }
    }
}
