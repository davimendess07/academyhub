import { Request, Response } from 'express';
import geminiService from '../services/gemini.service';
import { ChatRequest, ChatResponse } from '../types/chat.types';

class ChatController {
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { message, history }: ChatRequest = req.body;

      if (!message || typeof message !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Mensagem inválida',
        } as ChatResponse);
        return;
      }

      const responseText = await geminiService.generateResponse(
        message,
        history || []
      );

      res.json({
        success: true,
        message: responseText,
      } as ChatResponse);
    } catch (error: any) {
      console.error('Erro no ChatController:', error);
      
      res.status(500).json({
        success: false,
        error: error.message || 'Erro interno do servidor',
      } as ChatResponse);
    }
  }
}

export default new ChatController();