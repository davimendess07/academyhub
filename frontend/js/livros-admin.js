let allBooks = [];
let editingBookId = null;

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
    loadBooks();
  }
});

function loadBooks() {
  const grid = document.getElementById('booksGrid');
  grid.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-gray);">Carregando...</div>';
  db.collection('books').get().then(snapshot => {
    allBooks = [];
    grid.innerHTML = '';
    document.getElementById('booksTotal').textContent = snapshot.size;
    if (snapshot.empty) {
      showEmptyState();
      return;
    }
    snapshot.forEach(doc => {
      const book = doc.data();
      book.id = doc.id;
      allBooks.push(book);
      grid.appendChild(createBookItem(book));
    });
  });
}

// function createBookItem(book) {
//   const div = document.createElement('div');
//   div.className = 'book-item';
//   div.dataset.status = book.status.toLowerCase();
  
//   // Mapeamento completo dos status
//   const statusMap = {
//     'disponível': {
//       class: 'available',
//       icon: 'fa-check-circle',
//       text: 'Disponível',
//       color: 'green'
//     },
//     'disponivel': { // Para caso não tenha acento
//       class: 'available',
//       icon: 'fa-check-circle',
//       text: 'Disponível',
//       color: 'green'
//     },
//     'reservado': {
//       class: 'reserved',
//       icon: 'fa-clock',
//       text: 'Reservado',
//       color: 'orange'
//     },
//     'emprestado': {
//       class: 'borrowed',
//       icon: 'fa-book-reader',
//       text: 'Emprestado',
//       color: 'red'
//     }
//   };
  
//   // Normaliza o status para minúsculas
//   const normalizedStatus = book.status.toLowerCase();
  
//   // Obtém as informações do status ou usa "disponível" como padrão
//   const statusInfo = statusMap[normalizedStatus] || statusMap['disponível'];
  
//   div.innerHTML = `
//     <div class="book-info">
//       <div class="book-title">${book.title}</div>
//       <div class="book-author">${book.author}</div>
//     </div>
//     <div class="book-right-section">
//       <div class="book-status-text ${statusInfo.class}" style="color: ${statusInfo.color}">
//         <i class="fas ${statusInfo.icon}"></i> ${statusInfo.text}
//       </div>
//       <div class="book-actions">
//         <button class="btn-edit" onclick="editBook('${book.id}')"><i class="fas fa-edit"></i></button>
//         <button class="btn-delete" onclick="deleteBook('${book.id}', '${book.title}')"><i class="fas fa-trash"></i></button>
//       </div>
//     </div>
//   `;
//   return div;
// }


function createBookItem(book) {
  const div = document.createElement('div');
  div.className = 'book-item';
  div.dataset.status = book.available ? 'available' : 'borrowed';
  
  const statusClass = book.available ? 'available' : 'borrowed';
  const statusIcon = book.available ? 'fa-check-circle' : 'fa-book-reader';
  const statusText = book.available ? 'Disponível' : 'Emprestado' ;
  
  div.innerHTML = `
    <div class="book-info">
      <div class="book-title">${book.title}</div>
      <div class="book-author">${book.author}</div>
    </div>
    <div class="book-right-section">
      <div class="book-status-text ${statusClass}">
        <i class="fas ${statusIcon}"></i> ${statusText}
      </div>
      <div class="book-actions">
        <button class="btn-edit" onclick="editBook('${book.id}')"><i class="fas fa-edit"></i></button>
        <button class="btn-delete" onclick="deleteBook('${book.id}', '${book.title}')"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `;
  return div;
}

function openAddModal() {
  editingBookId = null;
  document.getElementById('modalTitle').textContent = 'Adicionar Livro';
  document.getElementById('bookForm').reset();
  document.getElementById('bookModal').classList.add('show');
}

function closeModal() {
  document.getElementById('bookModal').classList.remove('show');
}

function editBook(id) {
  const book = allBooks.find(b => b.id === id);
  if (!book) return;
  editingBookId = id;
  document.getElementById('modalTitle').textContent = 'Editar Livro';
  document.getElementById('bookId').value = id;
  document.getElementById('bookTitle').value = book.title;
  document.getElementById('bookAuthor').value = book.author;
  document.getElementById('bookISBN').value = book.isbn || '';
  document.getElementById('bookYear').value = book.year || '';
  document.getElementById('bookPublisher').value = book.publisher || '';
  document.getElementById('bookCategory').value = book.category || '';
  document.getElementById('bookDescription').value = book.description || '';
  document.getElementById('bookModal').classList.add('show');
}

function deleteBook(id, title) {
  if (!confirm(`Excluir "${title}"?`)) return;
  db.collection('books').doc(id).delete().then(() => {
    alert('Livro excluído!');
    loadBooks();
  });
}

// ✅ CORREÇÃO PRINCIPAL - Preserva o status 'available' ao editar
document.getElementById('bookForm').addEventListener('submit', e => {
  e.preventDefault();
  
  const data = {
    title: document.getElementById('bookTitle').value,
    author: document.getElementById('bookAuthor').value,
    isbn: document.getElementById('bookISBN').value,
    year: document.getElementById('bookYear').value,
    publisher: document.getElementById('bookPublisher').value,
    category: document.getElementById('bookCategory').value,
    description: document.getElementById('bookDescription').value
  };
  
  if (editingBookId) {
    // ✅ Ao EDITAR: NÃO alteramos o campo 'available'
    // Isso preserva o status atual do livro (emprestado ou disponível)
    db.collection('books').doc(editingBookId).update(data).then(() => {
      alert('Livro atualizado!');
      closeModal();
      loadBooks();
    }).catch(error => {
      console.error('Erro ao atualizar livro:', error);
      alert('Erro ao atualizar livro: ' + error.message);
    });
  } else {
    // ✅ Ao ADICIONAR: definimos como disponível (livro novo sempre está disponível)
    data.available = true;
    db.collection('books').add(data).then(() => {
      alert('Livro adicionado!');
      closeModal();
      loadBooks();
    }).catch(error => {
      console.error('Erro ao adicionar livro:', error);
      alert('Erro ao adicionar livro: ' + error.message);
    });
  }
});

document.getElementById('searchInput').addEventListener('input', e => {
  const term = e.target.value.toLowerCase();
  document.querySelectorAll('.book-item').forEach(item => {
    const title = item.querySelector('.book-title').textContent.toLowerCase();
    const author = item.querySelector('.book-author').textContent.toLowerCase();
    item.style.display = (title.includes(term) || author.includes(term)) ? 'flex' : 'none';
  });
});

document.querySelectorAll('.filter-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    const filter = this.dataset.filter;
    document.querySelectorAll('.book-item').forEach(item => {
      item.style.display = (filter === 'all' || item.dataset.status === filter) ? 'flex' : 'none';
    });
  });
});

function showEmptyState() {
  document.getElementById('booksGrid').style.display = 'none';
  document.getElementById('emptyState').style.display = 'block';
}

function logout() {
  if (confirm('Deseja sair?')) auth.signOut().then(() => window.location.href = '../index.html');
}