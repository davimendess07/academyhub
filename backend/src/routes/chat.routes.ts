import { Router } from 'express';
import chatController from '../controllers/chat.controller';
import { validateChatRequest } from '../middlewares/validation.middleware';

const router = Router();

router.post('/chat', validateChatRequest, chatController.sendMessage);

export default router;