import dotenv from 'dotenv';

dotenv.config();

export const config = {
    github: {
        clientId: process.env.GITHUB_CLIENT_ID || 'your_client_id_here',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || 'your_client_secret_here',
        redirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:3000/auth/github/callback',
    },
    port: process.env.PORT || 3000,
};
