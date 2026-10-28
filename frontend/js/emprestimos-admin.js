let currentFilter = 'todos';
let allLoans = [];

function logout() {
    if (confirm('Deseja realmente sair?')) {
        auth.signOut().then(() => {
            window.location.href = '../index.html';
        });
    }
}

function openNewLoanModal() {
    document.getElementById('newLoanModal').classList.add('show');
    loadBooks();
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

function loadBooks() {
    const select = document.getElementById('bookSelect');
    select.innerHTML = '<option value="">Carregando...</option>';

    db.collection('books').where('available', '==', true).get().then(snapshot => {
        select.innerHTML = '<option value="">Selecione um livro...</option>';
        if (snapshot.empty) {
            select.innerHTML = '<option value="">Nenhum livro disponível</option>';
            return;
        }
        snapshot.forEach(doc => {
            const book = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            const reserved = book.status === 'reservado' && book.reservedBy;
            option.textContent = `${book.title} - ${book.author}${reserved ? ' (reservado)' : ''}`;
            option.dataset.bookData = JSON.stringify({ title: book.title, author: book.author });
            if (reserved) option.dataset.reservedBy = book.reservedBy;
            select.appendChild(option);
        });
    }).catch(error => {
        console.error('Erro ao carregar livros:', error);
        alert('Erro ao carregar livros: ' + error.message);
    });
}

// Ao escolher um livro reservado, preenche o e-mail de quem reservou
document.getElementById('bookSelect').addEventListener('change', function () {
    const reservedBy = this.options[this.selectedIndex]?.dataset.reservedBy;
    if (!reservedBy) return;

    db.collection('users').doc(reservedBy).get().then(doc => {
        if (doc.exists) document.getElementById('studentEmail').value = doc.data().email;
    });
});

// Remove os campos de reserva do livro (usado quando o livro é emprestado, devolvido ou liberado)
function clearReservation() {
    return {
        status: firebase.firestore.FieldValue.delete(),
        reservedBy: firebase.firestore.FieldValue.delete(),
        reservedAt: firebase.firestore.FieldValue.delete()
    };
}

function filterLoans(filter) {
    currentFilter = filter;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    loadLoans();
}

function loadLoans() {
    const container = document.getElementById('loansList');
    container.innerHTML = '<div class="empty-state">Carregando...</div>';

    db.collection('rentals').orderBy('loanDate', 'desc').get().then(snapshot => {
        allLoans = [];
        
        if (snapshot.empty) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-book empty-icon"></i><h3>Nenhum empréstimo encontrado</h3><p>Ainda não há empréstimos registrados no sistema</p></div>';
            return;
        }

        container.innerHTML = '';
        const today = new Date();
        let visibleCount = 0;

        snapshot.forEach(doc => {
            const loan = doc.data();
            loan.id = doc.id;
            allLoans.push(loan);
            
            const dueDate = loan.dueDate.toDate();
            const isOverdue = loan.status === 'ativo' && dueDate < today;

            // Aplicar filtros
            if (currentFilter === 'ativo') {
                if (loan.status !== 'ativo' || isOverdue) return;
            }
            if (currentFilter === 'devolvido' && loan.status !== 'devolvido') return;
            if (currentFilter === 'cancelado' && loan.status !== 'cancelado') return;
            if (currentFilter === 'atraso') {
                if (!isOverdue || loan.status !== 'ativo') return;
            }

            visibleCount++;

            let statusClass = 'status-returned';
            let statusText = 'Devolvido';
            let statusIcon = 'fa-check-circle';

            if (loan.status === 'cancelado') {
                statusClass = 'status-cancelled';
                statusText = 'Cancelado';
                statusIcon = 'fa-ban';
            } else if (loan.status === 'ativo') {
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

            const item = document.createElement('div');
            item.className = 'loan-item';
            
            // Botões de ação diferentes para empréstimos ativos vs devolvidos/cancelados
            let actionButtons = '';
            if (loan.status === 'ativo') {
                actionButtons = `
                    <button class="btn-icon btn-return" onclick="returnBook('${doc.id}', '${loan.bookId}')" title="Marcar como Devolvido">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn-icon btn-cancel" onclick="cancelLoan('${doc.id}', '${loan.bookId}')" title="Cancelar Empréstimo">
                        <i class="fas fa-ban"></i>
                    </button>
                `;
            }
            
            item.innerHTML = `
                <div class="loan-info">
                    <div class="loan-title">${loan.bookTitle}</div>
                    <div class="loan-details">
                        ${loan.bookAuthor} • Emprestado em ${formatDate(loan.loanDate.toDate())} • 
                        Devolução: ${formatDate(dueDate)}
                        ${loan.observacao ? ' • ' + loan.observacao : ''}
                    </div>
                </div>
                <div class="loan-actions">
                    <div class="loan-status ${statusClass}">
                        <i class="fas ${statusIcon}"></i> ${statusText}
                    </div>
                    ${actionButtons}
                    <button class="btn-icon btn-delete" onclick="deleteLoan('${doc.id}', '${loan.bookId}', '${loan.status}')" title="Excluir Registro">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(item);
        });

        if (visibleCount === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-filter empty-icon"></i><h3>Nenhum empréstimo nesta categoria</h3></div>';
        }
    });
}

// Marcar empréstimo como devolvido
function returnBook(loanId, bookId) {
    if (confirm('✅ Confirmar devolução deste livro?\n\nO livro será liberado automaticamente para novos empréstimos.')) {
        const returnDate = firebase.firestore.Timestamp.now();
        
        // Atualiza o empréstimo para devolvido
        db.collection('rentals').doc(loanId).update({
            status: 'devolvido',
            returnDate: returnDate
        })
        .then(() => {
            // Libera o livro para novos empréstimos
            return db.collection('books').doc(bookId).update({
                available: true,
                ...clearReservation()
            });
        })
        .then(() => {
            alert('✅ Livro devolvido com sucesso!\n\nO livro já está disponível para novos empréstimos.');
            loadLoans();
            loadStats();
        })
        .catch(error => {
            console.error('Erro ao processar devolução:', error);
            alert('❌ Erro ao processar devolução: ' + error.message);
        });
    }
}

// Cancelar empréstimo
function cancelLoan(loanId, bookId) {
    const motivo = prompt('⚠️ Por que deseja cancelar este empréstimo?\n\nExemplos:\n• Livro perdido\n• Aluno desistiu\n• Erro no cadastro\n\nDigite o motivo:');
    
    if (motivo === null) return;
    
    if (!motivo.trim()) {
        alert('É necessário informar um motivo para cancelar o empréstimo.');
        return;
    }
    
    // Atualiza o empréstimo para cancelado
    db.collection('rentals').doc(loanId).update({
        status: 'cancelado',
        returnDate: firebase.firestore.Timestamp.now(),
        observacao: motivo.trim()
    })
    .then(() => {
        // Libera o livro
        return db.collection('books').doc(bookId).update({
            available: true,
            ...clearReservation()
        });
    })
    .then(() => {
        alert('✅ Empréstimo cancelado com sucesso!\n\nMotivo registrado: ' + motivo + '\n\nO livro foi liberado para novos empréstimos.');
        loadLoans();
        loadStats();
    })
    .catch(error => {
        console.error('Erro ao cancelar empréstimo:', error);
        alert('❌ Erro ao cancelar empréstimo: ' + error.message);
    });
}

function loadStats() {
    const today = new Date();

    db.collection('rentals').get().then(snapshot => {
        let activeCount = 0;
        let overdueCount = 0;

        snapshot.forEach(doc => {
            const loan = doc.data();
            if (loan.status === 'ativo') {
                activeCount++;
                const dueDate = loan.dueDate.toDate();
                if (dueDate < today) {
                    overdueCount++;
                }
            }
        });

        document.getElementById('activeCount').textContent = activeCount;
        document.getElementById('overdueCount').textContent = overdueCount;
        document.getElementById('totalCount').textContent = snapshot.size;
        const headerTotal = document.getElementById('totalLoansHeader');
        if (headerTotal) headerTotal.textContent = snapshot.size;
    });
}

// ✅ FUNÇÃO CORRIGIDA - Agora exclui todos os empréstimos
function deleteLoan(loanId, bookId, status) {
    if (confirm('⚠️ Deseja realmente EXCLUIR este empréstimo?\n\nEsta ação não pode ser desfeita!')) {
        // Se o empréstimo está ativo, libera o livro primeiro
        if (status === 'ativo' && bookId) {
            db.collection('books').doc(bookId).update({
                available: true,
                ...clearReservation()
            }).then(() => {
                return db.collection('rentals').doc(loanId).delete();
            }).then(() => {
                alert('✅ Empréstimo excluído com sucesso!');
                loadLoans();
                loadStats();
            }).catch(error => {
                console.error('Erro ao excluir:', error);
                alert('❌ Erro ao excluir empréstimo: ' + error.message);
            });
        } else {
            // Se já foi devolvido ou cancelado, apenas exclui o registro
            db.collection('rentals').doc(loanId).delete()
                .then(() => {
                    alert('✅ Empréstimo excluído com sucesso!');
                    loadLoans();
                    loadStats();
                })
                .catch(error => {
                    console.error('Erro ao excluir:', error);
                    alert('❌ Erro ao excluir empréstimo: ' + error.message);
                });
        }
    }
}

function formatDate(date) {
    return date.toLocaleDateString('pt-BR');
}

// Formulário de novo empréstimo
document.getElementById('newLoanForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const studentEmail = document.getElementById('studentEmail').value.trim();
    const bookSelect = document.getElementById('bookSelect');
    const bookId = bookSelect.value;
    const dueDateInput = document.getElementById('dueDate').value;

    if (!studentEmail || !bookId || !dueDateInput) {
        alert('Por favor, preencha todos os campos!');
        return;
    }

    const bookData = JSON.parse(bookSelect.options[bookSelect.selectedIndex].dataset.bookData);
    
    // Correção do fuso horário
    const [year, month, day] = dueDateInput.split('-').map(num => parseInt(num));
    const dueDate = new Date(year, month - 1, day, 23, 59, 59, 999);

    db.collection('users').where('email', '==', studentEmail).get()
        .then(snapshot => {
            if (snapshot.empty) {
                alert('Aluno não encontrado com este email!');
                throw new Error('Usuário não encontrado');
            }

            const userDoc = snapshot.docs[0];
            return db.collection('rentals').add({
                userId: userDoc.id,
                bookId: bookId,
                bookTitle: bookData.title,
                bookAuthor: bookData.author,
                loanDate: firebase.firestore.Timestamp.now(),
                dueDate: firebase.firestore.Timestamp.fromDate(dueDate),
                status: 'ativo',
                returnDate: null
            });
        })
        .then(() => {
            return db.collection('books').doc(bookId).update({
                available: false,
                ...clearReservation()
            });
        })
        .then(() => {
            alert('✅ Empréstimo registrado com sucesso!');
            closeModal('newLoanModal');
            document.getElementById('newLoanForm').reset();
            loadLoans();
            loadStats();
        })
        .catch(error => {
            if (error.message !== 'Usuário não encontrado') {
                console.error('Erro ao registrar empréstimo:', error);
                alert('❌ Erro ao registrar empréstimo: ' + error.message);
            }
        });
});

document.addEventListener('DOMContentLoaded', function () {
    loadLoans();
    loadStats();
});