import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRoutes from './routes/chat.routes';
import { errorHandler } from './middlewares/error.middleware';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5500',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', chatRoutes);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AcademyHub Chatbot API está funcionando!',
    timestamp: new Date().toISOString()
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

export default app;