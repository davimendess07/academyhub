// ============================================
// CONFIGURAÇÃO DA API
// ============================================
const API_URL = 'http://localhost:3001/api/chat';

// ============================================
// ELEMENTOS DO DOM
// ============================================
const messagesArea = document.getElementById('messagesArea');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const themeToggle = document.getElementById('themeToggle');

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let messageHistory = [];

// ============================================
// EVENT LISTENERS - INPUT
// ============================================

// Auto-resize do textarea conforme o usuário digita
userInput.addEventListener('input', function() {
    // Reset altura
    this.style.height = 'auto';
    // Define nova altura (máx 200px)
    this.style.height = Math.min(this.scrollHeight, 200) + 'px';
    
    // Habilita/desabilita botão de enviar
    sendButton.disabled = !this.value.trim();
});

// Enviar mensagem ao pressionar Enter (sem Shift)
userInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Enviar mensagem ao clicar no botão
sendButton.addEventListener('click', sendMessage);

// ============================================
// FUNÇÕES DE MENSAGEM
// ============================================

/**
 * Adiciona uma mensagem na área de chat
 * @param {string} content - Conteúdo da mensagem
 * @param {string} role - 'user' ou 'assistant'
 */
function addMessage(content, role) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `message-wrapper ${role}`;
    
    const messageBubble = document.createElement('div');
    messageBubble.className = `message-bubble ${role}`;
    messageBubble.textContent = content;
    
    messageWrapper.appendChild(messageBubble);
    messagesArea.appendChild(messageWrapper);
    
    scrollToBottom();
}

/**
 * Mostra indicador de loading (3 pontinhos)
 */
function showLoading() {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = 'message-wrapper assistant';
    messageWrapper.id = 'loadingMessage';
    
    const messageBubble = document.createElement('div');
    messageBubble.className = 'message-bubble loading';
    
    // Criar 3 pontinhos
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'loading-dot';
        messageBubble.appendChild(dot);
    }
    
    messageWrapper.appendChild(messageBubble);
    messagesArea.appendChild(messageWrapper);
    
    scrollToBottom();
}

/**
 * Remove indicador de loading
 */
function hideLoading() {
    const loadingMessage = document.getElementById('loadingMessage');
    if (loadingMessage) {
        loadingMessage.remove();
    }
}

/**
 * Faz scroll automático para a última mensagem
 */
function scrollToBottom() {
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

// ============================================
// FUNÇÃO PRINCIPAL - ENVIAR MENSAGEM
// ============================================

/**
 * Envia mensagem para o backend e processa resposta
 */
async function sendMessage() {
    const message = userInput.value.trim();
    
    // Validação
    if (!message) return;
    
    // Adicionar mensagem do usuário
    addMessage(message, 'user');
    messageHistory.push({ 
        role: 'user', 
        content: message 
    });
    
    // Limpar input
    userInput.value = '';
    userInput.style.height = 'auto';
    sendButton.disabled = true;
    
    // Mostrar loading
    showLoading();
    
    try {
        // Fazer requisição para o backend
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                message: message,
                history: messageHistory
            })
        });
        
        // Processar resposta
        const data = await response.json();
        
        // Remover loading
        hideLoading();
        
        if (data.success && data.message) {
            // Adicionar resposta do Lex
            addMessage(data.message, 'assistant');
            messageHistory.push({ 
                role: 'assistant', 
                content: data.message 
            });
        } else {
            throw new Error(data.error || 'Erro desconhecido');
        }
        
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        
        // Remover loading
        hideLoading();
        
        // Mostrar mensagem de erro
        addMessage(
            'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente!',
            'assistant'
        );
    }
}

// ============================================
// SISTEMA DE TROCA DE TEMA
// ============================================

// Verificar tema salvo no localStorage
const savedTheme = localStorage.getItem('academyhub-theme');

if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    themeToggle.textContent = '☀️';
} else {
    themeToggle.textContent = '🌙';
}

// Event listener para alternar tema
themeToggle.addEventListener('click', () => {
    // Alternar classe
    document.body.classList.toggle('light-theme');
    
    // Verificar qual tema está ativo
    if (document.body.classList.contains('light-theme')) {
        // Tema claro ativado
        themeToggle.textContent = '☀️';
        localStorage.setItem('academyhub-theme', 'light');
        
        // Animação
        themeToggle.style.transform = 'rotate(180deg) scale(1.2)';
        setTimeout(() => {
            themeToggle.style.transform = 'rotate(0deg) scale(1)';
        }, 300);
    } else {
        // Tema escuro ativado
        themeToggle.textContent = '🌙';
        localStorage.setItem('academyhub-theme', 'dark');
        
        // Animação
        themeToggle.style.transform = 'rotate(-180deg) scale(1.2)';
        setTimeout(() => {
            themeToggle.style.transform = 'rotate(0deg) scale(1)';
        }, 300);
    }
});

// ============================================
// INICIALIZAÇÃO
// ============================================

window.addEventListener('load', () => {
    console.log('🤖 Chatbot Lex carregado com sucesso!');
    console.log('📡 Conectando com backend:', API_URL);
    console.log('🎨 Tema atual:', savedTheme || 'dark (padrão)');
});