// Proteção da página - só acessa se estiver logado
auth.onAuthStateChanged(function (user) {
    if (!user) {
        // Não está logado, redireciona para login
        window.location.href = '../index.html';
    } else {
        // Está logado, busca dados do usuário
        db.collection('users').doc(user.uid).get()
            .then(function (doc) {
                if (doc.exists) {
                    const userData = doc.data();
                    // Atualiza o nome no header
                    document.querySelector('.user-info span').textContent = userData.name;
                    document.querySelector('.user-avatar').textContent = userData.name.charAt(0).toUpperCase();
                }
            })
            .catch(function (error) {
                console.error('Erro ao buscar dados:', error);
            });

        // Carrega as atividades recentes
        loadRecentActivities(user.uid);
    }
});

// Função para carregar atividades recentes
// function loadRecentActivities(userId) {
//     const activityContainer = document.querySelector('.recent-activity');

//     console.log('🔍 Iniciando loadRecentActivities');
//     console.log('👤 userId:', userId);
//     console.log('📦 Container encontrado:', activityContainer);

//     // Limpa as atividades hardcoded
//     const oldActivities = activityContainer.querySelectorAll('.activity-item');
//     oldActivities.forEach(item => item.remove());
//     // TESTE: ver como está salvo no banco
//     console.log('🔍 TESTE 1: Buscando COM /users/');
//     db.collection('rentals')
//         .where('userId', '==', '/users/' + userId)
//         .get()
//         .then(snap => {
//             console.log('Resultado TESTE 1:', snap.size, 'documentos');
//         });

//     console.log('🔍 TESTE 2: Buscando SEM /users/');
//     db.collection('rentals')
//         .where('userId', '==', userId)
//         .get()
//         .then(snap => {
//             console.log('Resultado TESTE 2:', snap.size, 'documentos');
//         });

//     console.log('🔍 TESTE 3: Buscando todos e filtrando manualmente');
//     db.collection('rentals')
//         .get()
//         .then(function (querySnapshot) {
//             console.log('📊 Total de documentos na coleção:', querySnapshot.size);

//             const userRentals = [];
//             querySnapshot.forEach(function (doc) {
//                 const rental = doc.data();

//                 // Verifica se é do usuário atual
//                 let isUserRental = false;

//                 if (typeof rental.userId === 'string') {
//                     isUserRental = (rental.userId === userId || rental.userId === '/users/' + userId);
//                 } else if (rental.userId && rental.userId.id) {
//                     // É uma referência do Firestore
//                     isUserRental = (rental.userId.id === userId);
//                 }

//                 if (isUserRental) {
//                     console.log('✅ Encontrado empréstimo do usuário:', doc.id, rental);
//                     userRentals.push(rental);
//                 }
//             });

//             console.log('📋 Total de empréstimos do usuário:', userRentals.length);
//             console.log('✅ Query executada com sucesso');
//             console.log('📊 Número de documentos:', querySnapshot.size);

//             // Remove o loading
//             const loading = activityContainer.querySelector('.loading-activities');
//             if (loading) loading.remove();

//             if (querySnapshot.empty) {
//                 console.log('⚠️ Nenhum documento encontrado');
//                 activityContainer.innerHTML += `
//                     <div class="activity-item">
//                         <div class="activity-title">Nenhuma atividade recente</div>
//                         <div class="activity-date">Comece emprestando livros!</div>
//                     </div>
//                 `;
//                 return;
//             }

//             const activities = [];

//             querySnapshot.forEach(function (doc) {
//                 const rental = doc.data();
//                 console.log('📄 Documento:', doc.id, rental);

//                 const rentalDate = rental.rentaldate?.toDate();

//                 if (rentalDate) {
//                     // Adiciona atividade de empréstimo
//                     if (rental.status === 'Ativo' || rental.status === 'reservado') {
//                         activities.push({
//                             type: 'emprestimo',
//                             title: `Livro emprestado: "${rental.booktitle}"`,
//                             date: rentalDate
//                         });
//                     }

//                     // Adiciona atividade de devolução
//                     if (rental.status === 'Devolvido') {
//                         activities.push({
//                             type: 'devolucao',
//                             title: `Livro devolvido: "${rental.booktitle}"`,
//                             date: rentalDate
//                         });
//                     }
//                 }
//             });

//             console.log('📋 Atividades processadas:', activities);

//             // Ordena atividades por data (mais recente primeiro)
//             activities.sort((a, b) => b.date - a.date);

//             // Exibe as 5 atividades mais recentes
//             const recentActivities = activities.slice(0, 5);

//             if (recentActivities.length === 0) {
//                 console.log('⚠️ Nenhuma atividade válida');
//                 activityContainer.innerHTML += `
//                     <div class="activity-item">
//                         <div class="activity-title">Nenhuma atividade recente</div>
//                         <div class="activity-date">Comece emprestando livros!</div>
//                     </div>
//                 `;
//             } else {
//                 console.log('✅ Exibindo atividades:', recentActivities);
//                 recentActivities.forEach(activity => {
//                     const timeAgo = getTimeAgo(activity.date);
//                     const activityHTML = `
//                         <div class="activity-item">
//                             <div class="activity-title">${activity.title}</div>
//                             <div class="activity-date">${timeAgo}</div>
//                         </div>
//                     `;
//                     activityContainer.innerHTML += activityHTML;
//                 });
//             }
//         })
//         .catch(function (error) {
//             console.error('❌ Erro ao carregar atividades:', error);
//             const loading = activityContainer.querySelector('.loading-activities');
//             if (loading) loading.remove();
//             activityContainer.innerHTML += `
//                 <div class="activity-item">
//                     <div class="activity-title">Erro ao carregar atividades</div>
//                     <div class="activity-date">Tente novamente mais tarde</div>
//                 </div>
//             `;
//         });
// }

/* ==========================================================
   FUNÇÃO 1: Empréstimos Recentes (mantida exatamente como estava)
   ========================================================== */
function loadRecentLoans() {
    const container = document.getElementById('recentLoans');

    db.collection('rentals')
        .orderBy('loanDate', 'desc')
        .limit(5)
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                container.innerHTML = `
                    <p style="text-align: center; color: var(--text-gray); padding: 2rem;">
                        Nenhum empréstimo registrado.
                    </p>`;
                return;
            }

            container.innerHTML = '';
            snapshot.forEach(doc => {
                const loan = doc.data();
                const div = document.createElement('div');
                div.className = 'activity-item';
                div.innerHTML = `
                    <div class="activity-title">${loan.bookTitle}</div>
                    <div class="activity-date">${loan.bookAuthor} - 
                        Emprestado em ${formatDate(loan.loanDate.toDate())}
                    </div>
                `;
                container.appendChild(div);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar empréstimos:', error);
            container.innerHTML = `
                <p style="text-align: center; color: var(--text-gray); padding: 2rem;">
                    Erro ao carregar empréstimos.
                </p>`;
        });
}



/* ==========================================================
   FUNÇÃO 2: Atividades Recentes do Usuário (CORRIGIDA)
   ========================================================== */
function loadRecentActivities(userId) {

    const activityContainer = document.querySelector('.recent-activity');

    // Limpa atividades antigas
    activityContainer.innerHTML = "";

    console.log("🔍 Carregando atividades do usuário:", userId);

    // Só os empréstimos deste aluno, do mais recente para o mais antigo
    // (usa o índice composto userId + loanDate de firestore.indexes.json)
    db.collection("rentals")
        .where("userId", "==", userId)
        .orderBy("loanDate", "desc")
        .limit(5)
        .get()
        .then(snapshot => {

            const activities = [];

            snapshot.forEach(doc => {
                const rental = doc.data();

                // Data da atividade: devolução/cancelamento usam returnDate; o resto, loanDate
                const loanDate = rental.loanDate?.toDate();
                const returnDate = rental.returnDate?.toDate();
                if (!loanDate) return;

                if (rental.status === "ativo") {
                    activities.push({
                        title: `Livro emprestado: "${rental.bookTitle}"`,
                        date: loanDate
                    });
                }

                if (rental.status === "devolvido") {
                    activities.push({
                        title: `Livro devolvido: "${rental.bookTitle}"`,
                        date: returnDate || loanDate
                    });
                }

                if (rental.status === "cancelado") {
                    activities.push({
                        title: `Empréstimo cancelado: "${rental.bookTitle}"`,
                        date: returnDate || loanDate
                    });
                }
            });

            console.log("📌 Atividades encontradas:", activities);

            // Ordenar por mais recente
            activities.sort((a, b) => b.date - a.date);

            const recent = activities.slice(0, 5);

            // Se não tiver nada → mensagem padrão
            if (recent.length === 0) {
                activityContainer.innerHTML = `
                    <div class="activity-item">
                        <div class="activity-title">Nenhuma atividade recente</div>
                        <div class="activity-date">Comece emprestando livros!</div>
                    </div>`;
                return;
            }

            // Renderizar
            recent.forEach(activity => {
                const html = `
                    <div class="activity-item">
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-date">${getTimeAgo(activity.date)}</div>
                    </div>
                `;
                activityContainer.innerHTML += html;
            });
        })

        .catch(error => {
            console.error("❌ Erro ao carregar atividades:", error);
            activityContainer.innerHTML = `
                <div class="activity-item">
                    <div class="activity-title">Erro ao carregar atividades</div>
                    <div class="activity-date">Tente novamente mais tarde</div>
                </div>`;
        });
}

// Função para calcular "tempo atrás"
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffMs / 604800000);
    const diffMonths = Math.floor(diffMs / 2592000000);

    if (diffMinutes < 1) return 'Agora mesmo';
    if (diffMinutes < 60) return `${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''} atrás`;
    if (diffHours < 24) return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
    if (diffDays < 7) return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
    if (diffWeeks < 4) return `${diffWeeks} semana${diffWeeks > 1 ? 's' : ''} atrás`;
    return `${diffMonths} mês${diffMonths > 1 ? 'es' : ''} atrás`;
}

// Função de logout
function logout() {
    if (confirm('Deseja realmente sair do sistema?')) {
        auth.signOut().then(() => {
            window.location.href = '../index.html';
        });
    }
}

// Smooth scrolling para links internos
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

// Header background on scroll
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.backdropFilter = 'blur(10px)';
    } else {
        header.style.background = 'linear-gradient(135deg, var(--white) 0%, var(--light-gray) 100%)';
        header.style.backdropFilter = 'blur(10px)';
    }
});

document.addEventListener('DOMContentLoaded', function () {
    console.log('Dashboard do aluno carregado');
});