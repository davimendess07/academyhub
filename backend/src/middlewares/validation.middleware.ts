import { Request, Response, NextFunction } from 'express';

export const validateChatRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { message, history } = req.body;

  if (!message || typeof message !== 'string') {
    res.status(400).json({
      success: false,
      error: 'Campo "message" é obrigatório e deve ser uma string',
    });
    return;
  }

  if (message.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: 'Mensagem não pode estar vazia',
    });
    return;
  }

  if (history && !Array.isArray(history)) {
    res.status(400).json({
      success: false,
      error: 'Campo "history" deve ser um array',
    });
    return;
  }

  next();
};