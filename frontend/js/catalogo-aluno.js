// === DEBUG - Descomentar se precisar testar ===
// console.log('✅ Arquivo JS carregou!');
// console.log('Firebase:', typeof db !== 'undefined' ? 'OK' : 'ERRO');
// ===============================================
let allBooks = [];
let currentUserId = null;
let currentFilter = 'todos';

auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = '../index.html';
    } else {
        currentUserId = user.uid;
        db.collection('users').doc(user.uid).get().then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                document.getElementById('userName').textContent = userData.name || 'Aluno';
                document.querySelector('.user-avatar').textContent = userData.name.charAt(0).toUpperCase();
            }
        });
        loadBooks();
    }
});

async function loadBooks() {
    const container = document.getElementById('booksList');
    container.innerHTML = '<div class="empty-state">Carregando...</div>';

    try {
        // 1. Carregar todos os livros
        const booksSnap = await db.collection('books').get();
        
        // 2. Carregar todos os empréstimos ativos
        const rentsSnap = await db.collection('rentals')
            .where("status", "==", "ativo")
            .get();

        // Mapear empréstimos por ID do livro
        const activeLoans = {};
        rentsSnap.forEach(r => {
            activeLoans[r.data().bookId] = true;
        });

        allBooks = [];
        let totalBooks = 0;
        let availableBooks = 0;
        let loanedBooks = 0;
        let reservedBooks = 0;

        booksSnap.forEach(doc => {
            const book = doc.data();
            book.id = doc.id;

            totalBooks++;

            // 🔥 CORREÇÃO: Determinar o status correto do livro
            let bookStatus;
            
            if (activeLoans[doc.id]) {
                // Se tem empréstimo ativo, é "emprestado"
                bookStatus = "emprestado";
            } else if (book.status) {
                // Se não tem empréstimo, usar o status do Firestore
                bookStatus = book.status.toLowerCase();
            } else if (book.available === true) {
                // Fallback para o campo antigo "available" (compatibilidade)
                bookStatus = "disponivel";
            } else if (book.available === false) {
                bookStatus = "emprestado";
            } else {
                // Padrão: disponível
                bookStatus = "disponivel";
            }

            // Salvar o status normalizado no objeto do livro
            book.status = bookStatus;

            // Contar para os filtros
            if (bookStatus === 'disponível' || bookStatus === 'disponivel') {
                availableBooks++;
            } else if (bookStatus === 'emprestado') {
                loanedBooks++;
            } else if (bookStatus === 'reservado') {
                reservedBooks++;
            }

            allBooks.push(book);
        });

        // Atualizar números na interface
        document.getElementById('totalBooks').textContent = totalBooks;
        document.getElementById('availableBooks').textContent = availableBooks;
        document.getElementById('loanedBooks').textContent = loanedBooks;
        document.getElementById('reservedBooks').textContent = reservedBooks;
        document.getElementById('totalBooksHeader').textContent = totalBooks;

        renderBooks();

    } catch (error) {
        console.error(error);
        container.innerHTML = `<div class="empty-state">Erro ao carregar livros.</div>`;
    }
}

function renderBooks() {
    const container = document.getElementById('booksList');
    container.innerHTML = '';

    let booksToShow = allBooks;

    if (currentFilter !== 'todos') {
        booksToShow = allBooks.filter(book => {
            return (book.status || 'disponivel').toLowerCase() === currentFilter;
        });
    }

    if (booksToShow.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-filter"></i>
                <h3>Nenhum livro encontrado</h3>
            </div>`;
        return;
    }

    booksToShow.forEach(book => {
        container.appendChild(createBookCard(book));
    });
}

function createBookCard(book) {
    const div = document.createElement('div');
    div.className = 'book-card';
    
    // Normalizar status
    const status = (book.status || 'disponivel').toLowerCase();
    const isAvailable = status === 'disponível' || status === 'disponivel';
    const isLoaned = status === 'emprestado';
    const isReserved = status === 'reservado';
    
    let statusClass = 'disponivel';
    let statusText = 'Disponível';
    let statusIcon = 'fa-check-circle';
    
    if (isLoaned) {
        statusClass = 'emprestado';
        statusText = 'Emprestado';
        statusIcon = 'fa-times-circle';
    } else if (isReserved) {
        statusClass = 'reservado';
        statusText = 'Reservado';
        statusIcon = 'fa-clock';
    }

    div.innerHTML = `
        <div class="book-info-section">
            <div class="book-title">
                <i class="fas fa-book"></i>
                ${book.title}
            </div>
            <div class="book-details">
                <div class="book-detail-item">
                    <i class="fas fa-user"></i>
                    <span><strong>Autor:</strong> ${book.author}</span>
                </div>
                <div class="book-detail-item">
                    <i class="fas fa-building"></i>
                    <span><strong>Editora:</strong> ${book.publisher || 'N/A'}</span>
                </div>
                <div class="book-detail-item">
                    <i class="fas fa-calendar"></i>
                    <span><strong>Ano:</strong> ${book.year || 'N/A'}</span>
                </div>
                <div class="book-detail-item">
                    <i class="fas fa-barcode"></i>
                    <span><strong>ISBN:</strong> ${book.isbn || 'Não informado'}</span>
                </div>
            </div>
        </div>
        <div class="book-actions">
            <div class="status-badge ${statusClass}">
                <i class="fas ${statusIcon}"></i>
                ${statusText}
            </div>
            ${isAvailable ? `
                <button class="btn-reserve" onclick="reserveBook('${book.id}')">
                    <i class="bi bi-calendar-check-fill"></i>
                    Reservar
                </button>
            ` : `
                <button class="btn-reserve" disabled>
                    <i class="fas fa-ban"></i>
                    Indisponível
                </button>
            `}
        </div>
    `;

    return div;
}

function filterBooks(filterType) {
    currentFilter = filterType;

    // Remover classe active de todos os filtros
    document.querySelectorAll('.filter-card').forEach(card => {
        card.classList.remove('active');
    });

    // Adicionar classe active ao filtro selecionado
    document.getElementById('filter-' + filterType).classList.add('active');

    // Renderizar livros filtrados
    renderBooks();

    // Limpar busca
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
}

function reserveBook(bookId) {
    if (!currentUserId) {
        alert('Erro: usuário não autenticado');
        return;
    }

    const book = allBooks.find(b => b.id === bookId);
    if (!book) {
        alert('Livro não encontrado');
        return;
    }

    // Confirmar reserva
    if (!confirm(`Deseja reservar o livro "${book.title}"?`)) {
        return;
    }

    // Atualizar status do livro para "reservado"
    db.collection('books').doc(bookId).update({
        status: 'reservado',
        reservedBy: currentUserId,
        reservedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        console.log('Livro reservado com sucesso!');
        showSuccessModal();
        loadBooks(); // Recarregar lista de livros
    })
    .catch(error => {
        console.error('Erro ao reservar livro:', error);
        alert('Erro ao reservar livro. Tente novamente.');
    });
}

function showSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.classList.add('show');
}

function closeModal() {
    const modal = document.getElementById('successModal');
    modal.classList.remove('show');
}

function showEmptyState() {
    document.getElementById('booksList').style.display = 'none';
    document.getElementById('emptyState').style.display = 'block';
}

document.getElementById('searchInput').addEventListener('input', e => {
    const term = e.target.value.toLowerCase();
    
    // Se tiver busca ativa, mostrar todos os livros (ignorar filtro)
    if (term) {
        document.querySelectorAll('.book-card').forEach(card => {
            const title = card.querySelector('.book-title').textContent.toLowerCase();
            const details = card.querySelector('.book-details').textContent.toLowerCase();
            card.style.display = (title.includes(term) || details.includes(term)) ? 'flex' : 'none';
        });
    } else {
        // Se não tiver busca, aplicar filtro novamente
        document.querySelectorAll('.book-card').forEach(card => {
            card.style.display = 'flex';
        });
    }
});

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modal = document.getElementById('successModal');
    if (event.target === modal) {
        closeModal();
    }
}

function logout() {
    if (confirm('Deseja sair?')) auth.signOut().then(() => window.location.href = '../index.html');
}