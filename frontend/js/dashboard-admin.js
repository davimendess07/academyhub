
        function logout() {
            if (confirm('Deseja realmente sair do sistema?')) {
                // Faz logout usando o auth do Firebase e redireciona para a página inicial
                auth.signOut().then(() => {
                    console.log('Logout realizado com sucesso');
                    window.location.href = '../index.html';
                }).catch(error => {
                    console.error('Erro ao sair:', error);
                    alert('Erro ao sair do sistema. Tente novamente.');
                });
            }
        }

        function openNewLoanModal() {
            document.getElementById('newLoanModal').style.display = 'flex';
        }

        function openReturnBookModal() {
            document.getElementById('returnBookModal').style.display = 'flex';
        }

        function closeModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
        }

        // Carregar dados do dashboard
        function loadDashboardData() {
            loadBooks();
            loadLoans();
            loadUsers();
            loadRecentLoans();
        }

        function loadBooks() {
            db.collection('books').get().then(snapshot => {
                document.getElementById('totalBooks').textContent = snapshot.size;
            });
        }

        function loadLoans() {
            const today = new Date();
            db.collection('rentals').get().then(snapshot => {
                let activeCount = 0;
                let overdueCount = 0;
                let totalCount = snapshot.size;
                
                snapshot.forEach(doc => {
                    const loan = doc.data();
                    if (loan.status === 'ativo') {
                        const dueDate = loan.dueDate.toDate();
                        activeCount++;
                        if (dueDate < today) {
                            overdueCount++;
                        }
                    }
                });
                
                document.getElementById('activeLoans').textContent = activeCount;
                document.getElementById('overdueLoans').textContent = overdueCount;
                document.getElementById('historyLoans').textContent = totalCount;
                const overdueCountEl = document.getElementById('overdueCount');
                if (overdueCountEl) overdueCountEl.textContent = overdueCount;
            });
        }

        function loadUsers() {
            db.collection('users').get().then(snapshot => {
                let userCount = 0;
                snapshot.forEach(doc => {
                    const user = doc.data();
                    if (user.role !== 'admin') {
                        userCount++;
                    }
                });
                document.getElementById('totalUsers').textContent = userCount;
            });
        }

        function loadRecentLoans() {
            const container = document.getElementById('recentLoans');
            db.collection('rentals').orderBy('loanDate', 'desc').limit(5).get().then(snapshot => {
                if (snapshot.empty) {
                    container.innerHTML = '<p style="text-align: center; color: var(--text-gray); padding: 2rem;">Nenhum empréstimo registrado.</p>';
                    return;
                }
                container.innerHTML = '';
                snapshot.forEach(doc => {
                    const loan = doc.data();
                    const div = document.createElement('div');
                    div.className = 'activity-item';
                    div.innerHTML = `
                        <div class="activity-title">${loan.bookTitle}</div>
                        <div class="activity-date">${loan.bookAuthor} - Emprestado em ${formatDate(loan.loanDate.toDate())}</div>
                    `;
                    container.appendChild(div);
                });
            }).catch(error => {
                console.error('Erro ao carregar empréstimos:', error);
                container.innerHTML = '<p style="text-align: center; color: var(--text-gray); padding: 2rem;">Erro ao carregar empréstimos.</p>';
            });
        }

        function formatDate(date) {
            return date.toLocaleDateString('pt-BR');
        }

        // Carregar dados ao abrir a página
        document.addEventListener('DOMContentLoaded', function() {
            try {
                auth.onAuthStateChanged(user => {
                    if (!user) {
                        window.location.href = '../index.html';
                    } else {
                        db.collection('users').doc(user.uid).get().then(doc => {
                            if (doc.exists) {
                                const userData = doc.data();
                                if (userData.role !== 'admin') {
                                    alert('Acesso negado! Apenas administradores podem acessar esta página.');
                                    window.location.href = '../index.html';
                                    return;
                                }
                                document.querySelector('.user-info span').textContent = userData.name;
                                document.querySelector('.user-avatar').textContent = userData.name.charAt(0).toUpperCase();
                                loadDashboardData();
                            }
                        });
                    }
                });
            } catch(e) {
                console.log('Firebase não disponível no preview');
            }
        });
