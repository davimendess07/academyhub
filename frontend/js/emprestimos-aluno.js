
let currentFilter = 'todos';
let allLoans = [];

// Proteção da página
auth.onAuthStateChanged(function(user) {
    if (!user) {
        window.location.href = '../index.html';
    } else {
        db.collection('users').doc(user.uid).get()
            .then(function(doc) {
                if (doc.exists) {
                    const userData = doc.data();
                    document.querySelector('.user-info span').textContent = userData.name;
                    document.querySelector('.user-avatar').textContent = userData.name.charAt(0).toUpperCase();
                }
            })
            .catch(function(error) {
                console.error('Erro ao buscar dados:', error);
            });
        
        loadLoans(user.uid);
    }
});

function filterLoans(filter) {
    currentFilter = filter;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const user = auth.currentUser;
    if (user) {
        loadLoans(user.uid);
    }
}

function loadLoans(userId) {
    const loansList = document.getElementById('loansList');
    loansList.innerHTML = '<div class="empty-state">Carregando empréstimos...</div>';
    
    db.collection('rentals')
        .where('userId', '==', userId)
        .orderBy('loanDate', 'desc')
        .get()
        .then(function(querySnapshot) {
            allLoans = [];
            loansList.innerHTML = '';
            
            if (querySnapshot.empty) {
                loansList.innerHTML = '<div class="empty-state"><i class="fas fa-book empty-icon"></i><h3>Nenhum empréstimo encontrado</h3><p>Você ainda não possui empréstimos registrados</p></div>';
                updateStats([]);
                return;
            }
            
            const today = new Date();
            
            querySnapshot.forEach(function(doc) {
                const loan = doc.data();
                loan.id = doc.id;
                allLoans.push(loan);
                
                const dueDate = loan.dueDate.toDate();
                const isOverdue = loan.status === 'ativo' && dueDate < today;
                
                // Filtros
                if (currentFilter === 'ativo' && (loan.status !== 'ativo' || isOverdue)) return;
                if (currentFilter === 'devolvido' && loan.status !== 'devolvido') return;
                if (currentFilter === 'atraso' && (!isOverdue || loan.status !== 'ativo')) return;
                
                const loanElement = createLoanElement(loan);
                loansList.appendChild(loanElement);
            });
            
            // Verificar se há itens visíveis
            if (loansList.children.length === 0) {
                loansList.innerHTML = '<div class="empty-state"><i class="fas fa-filter empty-icon"></i><h3>Nenhum empréstimo nesta categoria</h3></div>';
            }
            
            updateStats(allLoans);
        })
        .catch(function(error) {
            console.error('Erro ao buscar empréstimos:', error);
            loansList.innerHTML = '<div class="empty-state" style="color: var(--red);">Erro ao carregar empréstimos. Tente novamente.</div>';
        });
}

function createLoanElement(loan) {
    const today = new Date();
    const dueDate = loan.dueDate.toDate();
    const isOverdue = loan.status === 'ativo' && dueDate < today;

    let statusClass = 'status-returned';
    let statusText = 'Devolvido';
    let statusIcon = 'fa-check-circle';

    if (loan.status === 'ativo') {
        if (isOverdue) {
            statusClass = 'status-overdue';
            statusText = 'Em Atraso';
            statusIcon = 'fa-exclamation-circle';
        } else {
            statusClass = 'status-active';
            statusText = 'Ativo';
            statusIcon = 'fa-book-reader';
        }
    }

    const loanDateStr = formatDate(loan.loanDate.toDate());
    const dueDateStr = formatDate(dueDate);

    let actionButtons = '';
    if (loan.status === 'ativo' && !isOverdue) {
        const maxRenewals = 3;
        const renewCount = loan.renewCount || 0;
        const canRenew = renewCount < maxRenewals;
        
        if (canRenew) {
            actionButtons = `
                <button class="btn-renew" onclick="renewLoan('${loan.id}')">
                    <i class="fas fa-redo"></i> Renovar (${renewCount}/${maxRenewals})
                </button>
            `;
        } else {
            actionButtons = `<div class="renew-info">Limite de renovações atingido</div>`;
        }
    } else if (isOverdue) {
        actionButtons = `<div class="renew-info" style="color: var(--red);">Livro em atraso</div>`;
    }

    const item = document.createElement('div');
    item.className = 'loan-item';
    item.innerHTML = `
        <div class="loan-info">
            <div class="loan-title">${loan.bookTitle}</div>
            <div class="loan-details">
                ${loan.bookAuthor} • Emprestado em ${loanDateStr} • Devolução: ${dueDateStr}
            </div>
        </div>
        <div class="loan-actions">
            <div class="loan-status ${statusClass}">
                <i class="fas ${statusIcon}"></i> ${statusText}
            </div>
            ${actionButtons}
        </div>
    `;

    return item;
}

function renewLoan(loanId) {
    const loan = allLoans.find(l => l.id === loanId);
    
    if (!loan) {
        alert('Empréstimo não encontrado!');
        return;
    }
    
    const maxRenewals = 3;
    const renewCount = loan.renewCount || 0;
    
    if (renewCount >= maxRenewals) {
        alert('Você já atingiu o limite de renovações para este livro!');
        return;
    }
    
    const today = new Date();
    const currentDueDate = loan.dueDate.toDate();
    if (currentDueDate < today) {
        alert('Não é possível renovar livros em atraso. Por favor, devolva o livro primeiro.');
        return;
    }
    
    if (!confirm(`Renovar empréstimo de "${loan.bookTitle}" por mais 14 dias?`)) {
        return;
    }
    
    const newDueDate = new Date(currentDueDate);
    newDueDate.setDate(newDueDate.getDate() + 14);
    
    db.collection('rentals').doc(loanId).update({
        dueDate: firebase.firestore.Timestamp.fromDate(newDueDate),
        renewCount: renewCount + 1,
        lastRenewDate: firebase.firestore.Timestamp.now()
    })
    .then(function() {
        alert('Empréstimo renovado com sucesso!\n\nData anterior: ' + formatDate(currentDueDate) + '\nNova data: ' + formatDate(newDueDate));
        const user = auth.currentUser;
        if (user) loadLoans(user.uid);
    })
    .catch(function(error) {
        console.error('Erro ao renovar:', error);
        alert('Erro ao renovar empréstimo. Tente novamente.');
    });
}

function updateStats(loans) {
    let activeCount = 0;
    let overdueCount = 0;
    let totalCount = loans.length;
    
    const today = new Date();
    
    loans.forEach(loan => {
        if (loan.status === 'ativo') {
            const dueDate = loan.dueDate.toDate();
            if (dueDate < today) {
                overdueCount++;
            } else {
                activeCount++;
            }
        }
    });
    
    document.getElementById('activeCount').textContent = activeCount;
    document.getElementById('overdueCount').textContent = overdueCount;
    document.getElementById('totalCount').textContent = totalCount;
}

function formatDate(date) {
    return date.toLocaleDateString('pt-BR');
}

function logout() {
    if (confirm('Deseja realmente sair do sistema?')) {
        auth.signOut().then(() => {
            window.location.href = '../index.html';
        }).catch((error) => {
            console.error('Erro no logout:', error);
        });
    }
}
