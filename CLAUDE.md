# AcademyHub: contexto para o Claude Code

## Projeto
Sistema de gestão de biblioteca escolar, TCC do curso técnico. Revisado após o curso para portfólio (GitHub) e candidaturas a vagas.

## Estrutura
- `frontend/`: HTML, CSS e JS puro. Firebase Auth + Firestore via SDK compat 9.22 (tags `<script>`, sem npm, sem build).
  - `aluno/`: catálogo, dashboard, meus empréstimos
  - `admin/`: dashboard, livros (CRUD), empréstimos, usuários
  - `js/firebase-config.js`: config do Firebase (pública por natureza; segurança fica nas regras)
  - `js/auth-nav.js`: troca "Login" por "Meu painel" no index quando há sessão
- `backend/`: API Express 5 + TypeScript para o chatbot Lex (Google Gemini `gemini-2.5-flash`). Rotas: `GET /health`, `POST /api/chat`.
- `chatbot-demo/`: página isolada para testar o chatbot.
- `firestore.rules` e `firestore.indexes.json`: regras e índices (aplicados manualmente no console do Firebase).

## Decisões já tomadas
- Firebase próprio (projeto `academyhub-48aac`), substituindo o de um ex-integrante.
- Banco: Firestore (não migrar para SQL Connect/PostgreSQL neste projeto).
- Coleções: `users` (name, email, role: `aluno` | `admin`), `books`, `rentals` (userId, bookId, loanDate, dueDate, status, renewCount).
- Perfil admin: o cadastro só cria `aluno`; admin é definido trocando `role` no console do Firestore.
- `.env` nunca vai para o Git; usar `backend/.env.example` como modelo.

## Ambiente local (Windows)
- Pasta do projeto: `C:\projetos\academyhub` (não existe mais a pasta duplicada).
- Back-end: `cd backend && npm install && npm run dev` (porta 3001).
- Front-end: Live Server no VS Code (porta 5500). `FRONTEND_URL` no `.env` precisa bater com a origem do navegador (127.0.0.1 vs localhost) por causa do CORS.

## Como trabalhar comigo
- Estou aprendendo: explique o porquê de cada mudança de forma simples.
- Não altere arquivos sem me mostrar o plano antes.
- Mudanças pequenas e pontuais; não refatorar o que não foi pedido.
- Toda consulta nova ao Firestore: verificar se as regras permitem e se precisa de índice (e atualizar `firestore.indexes.json`).