import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY não encontrada no arquivo .env');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const modelConfig = {
  model: 'gemini-2.5-flash',  // ✅ Modelo mais novo e rápido
  generationConfig: {
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 2048,
  },
};

export const getModel = () => {
  return genAI.getGenerativeModel({
    model: modelConfig.model,
    generationConfig: modelConfig.generationConfig,
  });
};

export default genAI;