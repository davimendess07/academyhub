// ========================================
// SECTIONS.JS - JavaScript Compartilhado
// ========================================

// ===== ANIMAÇÕES DE SCROLL =====
document.addEventListener('DOMContentLoaded', function() {
    
    // Configuração do Observer para animações
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Aplicar animação aos elementos
    const animateElements = document.querySelectorAll('.feature-card, .stat-box, .contact-item, .mission-box');
    
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });

    // ===== HEADER SCROLL EFFECT =====
    let lastScroll = 0;
    const header = document.querySelector('header');

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        // Adicionar sombra ao rolar
        if (currentScroll > 100) {
            header.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.15)';
        } else {
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        }

        lastScroll = currentScroll;
    });

    // ===== SMOOTH SCROLL PARA LINKS =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // ===== FORMULÁRIO DE CONTATO =====
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Pegar os valores do formulário
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;

            // Validação básica
            if (!name || !email || !subject || !message) {
                showAlert('Por favor, preencha todos os campos!', 'error');
                return;
            }

            // Validar email
            if (!isValidEmail(email)) {
                showAlert('Por favor, insira um email válido!', 'error');
                return;
            }

            // Simular envio (aqui você conectaria com backend/Firebase)
            const btnSend = this.querySelector('.btn-send');
            const originalText = btnSend.innerHTML;
            
            btnSend.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            btnSend.disabled = true;

            // Simular delay de envio
            setTimeout(() => {
                showAlert('Mensagem enviada com sucesso! Entraremos em contato em breve.', 'success');
                this.reset();
                btnSend.innerHTML = originalText;
                btnSend.disabled = false;
            }, 2000);
        });
    }

    // ===== FUNÇÕES AUXILIARES =====

    // Validar email
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Mostrar alerta
    function showAlert(message, type) {
        // Remover alerta anterior se existir
        const existingAlert = document.querySelector('.custom-alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        // Criar novo alerta
        const alert = document.createElement('div');
        alert.className = `custom-alert alert-${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';
        const color = type === 'success' ? '#7cb342' : '#e74c3c';
        
        alert.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
            <button class="alert-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        alert.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            display: flex;
            align-items: center;
            gap: 1rem;
            z-index: 9999;
            animation: slideInRight 0.3s ease;
            border-left: 4px solid ${color};
            max-width: 400px;
        `;

        document.body.appendChild(alert);

        // Remover após 5 segundos
        setTimeout(() => {
            alert.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => alert.remove(), 300);
        }, 5000);
    }

    // ===== STATS COUNTER ANIMATION (PÁGINA SOBRE) =====
    const statNumbers = document.querySelectorAll('.stat-number');
    
    if (statNumbers.length > 0) {
        const animateValue = (element, start, end, duration) => {
            if (end === '∞') {
                element.textContent = '∞';
                return;
            }

            const endNum = parseInt(end);
            if (isNaN(endNum)) {
                element.textContent = end;
                return;
            }

            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                element.textContent = Math.floor(progress * (endNum - start) + start) + (end.includes('%') ? '%' : '');
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                }
            };
            window.requestAnimationFrame(step);
        };

        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    const endValue = target.textContent;
                    animateValue(target, 0, endValue, 2000);
                    statsObserver.unobserve(target);
                }
            });
        }, { threshold: 0.5 });

        statNumbers.forEach(stat => statsObserver.observe(stat));
    }

    // ===== ADICIONAR ESTILOS PARA ANIMAÇÕES =====
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }

        .custom-alert i:first-child {
            font-size: 1.5rem;
        }

        .custom-alert span {
            flex: 1;
            color: var(--dark-gray);
        }

        .alert-close {
            background: none;
            border: none;
            cursor: pointer;
            color: var(--text-gray);
            font-size: 1.2rem;
            padding: 0.3rem;
            transition: color 0.3s ease;
        }

        .alert-close:hover {
            color: var(--dark-gray);
        }
    `;
    document.head.appendChild(style);
});

// ===== MENU MOBILE (HAMBURGER) =====
// Caso você queira adicionar um menu mobile no futuro
function toggleMobileMenu() {
    const nav = document.querySelector('.header-nav');
    nav.classList.toggle('mobile-active');
}

// ===== LOADING OVERLAY =====
// Função para mostrar loading em operações assíncronas
function showLoading() {
    const loading = document.createElement('div');
    loading.id = 'loading-overlay';
    loading.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        ">
            <div style="
                background: white;
                padding: 2rem;
                border-radius: 15px;
                text-align: center;
            ">
                <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #2980b9;"></i>
                <p style="margin-top: 1rem; color: #2c3e50;">Carregando...</p>
            </div>
        </div>
    `;
    document.body.appendChild(loading);
}

function hideLoading() {
    const loading = document.getElementById('loading-overlay');
    if (loading) {
        loading.remove();
    }
}

// ===== CONSOLE INFO =====
console.log('%c🎓 AcademyHub Sistema Bibliotecário', 'color: #2980b9; font-size: 16px; font-weight: bold;');
console.log('%cDesenvolvido como TCC', 'color: #7cb342; font-size: 12px;');
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #4a9b9b;');