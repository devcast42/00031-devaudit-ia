import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('No GEMINI_API_KEY found in environment');
        return;
    }

    console.log(`Usando API Key: ${apiKey.substring(0, 5)}...`);

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await axios.get(url);
        console.log('--- Modelos disponibles ---');
        response.data.models.forEach((model: any) => {
            console.log(`${model.name} - ${model.supportedGenerationMethods.join(', ')}`);
        });
    } catch (error: any) {
        if (error.response) {
            console.error('Error de API:', error.response.status, error.response.data);
        } else {
            console.error('Error de conexión:', error.message);
        }
    }
}

listModels();
