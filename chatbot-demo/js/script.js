const API_URL = 'http://localhost:3001/api/chat';

const messagesArea = document.getElementById('messagesArea');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

let messageHistory = [];

userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 200) + 'px';
    sendButton.disabled = !this.value.trim();
});

userInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

sendButton.addEventListener('click', sendMessage);

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

function showLoading() {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = 'message-wrapper assistant';
    messageWrapper.id = 'loadingMessage';
    
    const messageBubble = document.createElement('div');
    messageBubble.className = 'message-bubble loading';
    
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'loading-dot';
        messageBubble.appendChild(dot);
    }
    
    messageWrapper.appendChild(messageBubble);
    messagesArea.appendChild(messageWrapper);
    scrollToBottom();
}

function hideLoading() {
    const loadingMessage = document.getElementById('loadingMessage');
    if (loadingMessage) {
        loadingMessage.remove();
    }
}

function scrollToBottom() {
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

async function sendMessage() {
    const message = userInput.value.trim();
    
    if (!message) return;
    
    addMessage(message, 'user');
    messageHistory.push({ role: 'user', content: message });
    
    userInput.value = '';
    userInput.style.height = 'auto';
    sendButton.disabled = true;
    
    showLoading();
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                history: messageHistory
            })
        });
        
        const data = await response.json();
        hideLoading();
        
        if (data.success && data.message) {
            addMessage(data.message, 'assistant');
            messageHistory.push({ role: 'assistant', content: data.message });
        } else {
            throw new Error(data.error || 'Erro desconhecido');
        }
        
    } catch (error) {
        console.error('Erro:', error);
        hideLoading();
        addMessage('Desculpe, ocorreu um erro. Tente novamente! 😅', 'assistant');
    }
}

window.addEventListener('load', () => {
    console.log('🤖 Chatbot carregado!');
    console.log('📡 Conectando com:', API_URL);
    // Histórico começa vazio - a mensagem de boas-vindas é só visual

    // ============================================
// SISTEMA DE TROCA DE TEMA (adicionar no final)
// ============================================

// Elementos
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Verificar tema salvo no localStorage
const savedTheme = localStorage.getItem('academyhub-theme');
if (savedTheme === 'light') {
    body.classList.add('light-theme');
    themeToggle.textContent = '☀️';
} else {
    themeToggle.textContent = '🌙';
}

// Função para alternar tema
themeToggle.addEventListener('click', () => {
    body.classList.toggle('light-theme');
    
    // Trocar ícone
    if (body.classList.contains('light-theme')) {
        themeToggle.textContent = '☀️';
        localStorage.setItem('academyhub-theme', 'light');
        
        // Adicionar animação
        themeToggle.style.transform = 'rotate(180deg) scale(1.2)';
        setTimeout(() => {
            themeToggle.style.transform = 'rotate(0deg) scale(1)';
        }, 300);
    } else {
        themeToggle.textContent = '🌙';
        localStorage.setItem('academyhub-theme', 'dark');
        
        // Adicionar animação
        themeToggle.style.transform = 'rotate(-180deg) scale(1.2)';
        setTimeout(() => {
            themeToggle.style.transform = 'rotate(0deg) scale(1)';
        }, 300);
    }
});

console.log('🎨 Sistema de temas carregado!');
});
