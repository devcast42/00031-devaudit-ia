import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();

router.post('/github/token', AuthController.getGitHubToken);
router.get('/github/repositories', AuthController.listRepositories);

export default router;
