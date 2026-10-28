
        let allUsers = [];

        auth.onAuthStateChanged(user => {
            if (!user) {
                window.location.href = '../index.html';
            } else {
                db.collection('users').doc(user.uid).get().then(doc => {
                    if (doc.exists) {
                        const userData = doc.data();
                        document.getElementById('userName').textContent = userData.name || 'Admin';
                        document.querySelector('.user-avatar').textContent = userData.name.charAt(0).toUpperCase();
                    }
                });
                loadUsers();
            }
        });

        function loadUsers() {
            const container = document.getElementById('usersList');
            container.innerHTML = '<div class="empty-state">Carregando...</div>';

            console.log('Iniciando carregamento de usuários...');

            // Buscar todos os usuários
            db.collection('users').get()
                .then(usersSnapshot => {
                    console.log('Usuários carregados:', usersSnapshot.size);
                    
                    if (usersSnapshot.empty) {
                        showEmptyState();
                        return;
                    }

                    // Buscar todos os empréstimos
                    return db.collection('rentals').get().then(rentalsSnapshot => {
                        console.log('Empréstimos carregados:', rentalsSnapshot.size);
                        
                        allUsers = [];
                        const rentalsMap = {};

                        // Organizar empréstimos por userId
                        rentalsSnapshot.forEach(doc => {
                            const rental = doc.data();
                            if (!rentalsMap[rental.userId]) {
                                rentalsMap[rental.userId] = [];
                            }
                            rentalsMap[rental.userId].push({
                                id: doc.id,
                                ...rental
                            });
                        });

                        container.innerHTML = '';
                        let usersWithLoans = 0;
                        let usersWithOverdue = 0;
                        let totalNonAdminUsers = 0;
                        const today = new Date();

                        usersSnapshot.forEach(doc => {
                            const user = doc.data();
                            user.id = doc.id;
                            
                            // Pular usuários admin
                            if (user.role === 'admin') {
                                console.log('Pulando admin:', user.email);
                                return;
                            }
                            
                            totalNonAdminUsers++;
                            user.loans = rentalsMap[doc.id] || [];
                            
                            // Contar usuários com empréstimos ativos
                            const activeLoans = user.loans.filter(loan => loan.status === 'ativo');
                            if (activeLoans.length > 0) {
                                usersWithLoans++;
                                
                                // Verificar se tem atrasos
                                const hasOverdue = activeLoans.some(loan => {
                                    const dueDate = loan.dueDate.toDate();
                                    return dueDate < today;
                                });
                                
                                if (hasOverdue) {
                                    usersWithOverdue++;
                                }
                            }

                            allUsers.push(user);
                            container.appendChild(createUserCard(user));
                        });

                        console.log('Total de usuários não-admin:', totalNonAdminUsers);
                        
                        // Verificar se há usuários não-admin
                        if (totalNonAdminUsers === 0) {
                            showEmptyState();
                            return;
                        }

                        // Atualizar estatísticas
                        document.getElementById('totalUsers').textContent = totalNonAdminUsers;
                        document.getElementById('usersWithLoans').textContent = usersWithLoans;
                        document.getElementById('usersWithOverdue').textContent = usersWithOverdue;
                        const headerTotal = document.getElementById('totalUsersHeader');
                        if (headerTotal) headerTotal.textContent = totalNonAdminUsers;
                    });
                })
                .catch(error => {
                    console.error('Erro detalhado ao carregar usuários:', error);
                    console.error('Código do erro:', error.code);
                    console.error('Mensagem do erro:', error.message);
                    container.innerHTML = `<div class="empty-state">Erro ao carregar usuários: ${error.message}</div>`;
                });
        }

        function createUserCard(user) {
            const div = document.createElement('div');
            div.className = 'user-card';
            
            const activeLoans = user.loans.filter(loan => loan.status === 'ativo');
            const hasLoans = user.loans.length > 0;
            
            let loansHTML = '';
            if (hasLoans) {
                const today = new Date();
                loansHTML = `
                    <div class="loans-section" id="loans-${user.id}">
                        ${user.loans.map(loan => {
                            const loanDate = loan.loanDate.toDate();
                            const dueDate = loan.dueDate.toDate();
                            const returnDate = loan.returnDate ? loan.returnDate.toDate() : null;
                            
                            const isOverdue = loan.status === 'ativo' && dueDate < today;
                            const statusClass = loan.status === 'devolvido' ? 'returned' : (isOverdue ? 'overdue' : 'active');
                            const statusText = loan.status === 'devolvido' ? 'Devolvido' : (isOverdue ? 'Em Atraso' : 'Ativo');
                            const statusIcon = loan.status === 'devolvido' ? 'fa-check-circle' : (isOverdue ? 'fa-exclamation-circle' : 'fa-book-reader');

                            return `
                                <div class="loan-item ${isOverdue ? 'overdue' : ''}">
                                    <div class="loan-book-title">
                                        <i class="fas fa-book" style="color: var(--blue); margin-right: 0.5rem;"></i>
                                        ${loan.bookTitle}
                                    </div>
                                    <div class="loan-dates">
                                        <div class="loan-date-item">
                                            <i class="fas fa-calendar-plus"></i>
                                            <span><strong>Empréstimo:</strong> ${formatDate(loanDate)}</span>
                                        </div>
                                        <div class="loan-date-item">
                                            <i class="fas fa-calendar-check"></i>
                                            <span><strong>Devolução prevista:</strong> ${formatDate(dueDate)}</span>
                                        </div>
                                        ${returnDate ? `
                                        <div class="loan-date-item">
                                            <i class="fas fa-calendar-day"></i>
                                            <span><strong>Devolvido em:</strong> ${formatDate(returnDate)}</span>
                                        </div>
                                        ` : ''}
                                    </div>
                                    <div class="loan-status-badge ${statusClass}">
                                        <i class="fas ${statusIcon}"></i>
                                        ${statusText}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            } else {
                loansHTML = `
                    <div class="loans-section" id="loans-${user.id}">
                        <div class="no-loans">Nenhum empréstimo registrado</div>
                    </div>
                `;
            }

            div.innerHTML = `
                <div class="user-header">
                    <div class="user-info-section">
                        <div class="user-name">
                            <i class="fas fa-user"></i>
                            ${user.name}
                        </div>
                        <div class="user-email">
                            <i class="fas fa-envelope"></i>
                            ${user.email}
                        </div>
                    </div>
                    <button class="btn-view-loans" onclick="toggleLoans('${user.id}')">
                        <i class="fas fa-book-open"></i>
                        ${hasLoans ? `Ver Empréstimos (${user.loans.length})` : 'Ver Empréstimos'}
                    </button>
                </div>
                ${loansHTML}
            `;

            return div;
        }

        function toggleLoans(userId) {
            const loansSection = document.getElementById(`loans-${userId}`);
            loansSection.classList.toggle('show');
        }

        function formatDate(date) {
            return date.toLocaleDateString('pt-BR');
        }

        function showEmptyState() {
            document.getElementById('usersList').style.display = 'none';
            document.getElementById('emptyState').style.display = 'block';
        }

        document.getElementById('searchInput').addEventListener('input', e => {
            const term = e.target.value.toLowerCase();
            document.querySelectorAll('.user-card').forEach(card => {
                const name = card.querySelector('.user-name').textContent.toLowerCase();
                const email = card.querySelector('.user-email').textContent.toLowerCase();
                card.style.display = (name.includes(term) || email.includes(term)) ? 'block' : 'none';
            });
        });

        function logout() {
            if (confirm('Deseja sair?')) auth.signOut().then(() => window.location.href = '../index.html');
        }
