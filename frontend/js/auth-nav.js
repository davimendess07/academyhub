// Mantém a sessão visível nas páginas públicas:
// se o usuário já estiver logado, o botão "Login" vira "Meu painel".
auth.onAuthStateChanged(user => {
    const btn = document.querySelector('.btn-login');
    if (!user || !btn) return;

    db.collection('users').doc(user.uid).get().then(doc => {
        const role = doc.exists ? doc.data().role : 'aluno';
        btn.href = role === 'admin' ? 'admin/dashboard.html' : 'aluno/dashboard.html';
        btn.innerHTML = '<i class="fas fa-user"></i> Meu painel';
    });
});