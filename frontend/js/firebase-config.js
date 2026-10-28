// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBW0bse1nk3jM52KdFDcTOyrB89fd3sU-0",
  authDomain: "academyhub-48aac.firebaseapp.com",
  projectId: "academyhub-48aac",
  storageBucket: "academyhub-48aac.firebasestorage.app",
  messagingSenderId: "368389965221",
  appId: "1:368389965221:web:37f945e0fdfb8185b2d44c"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Exportar serviços
const auth = firebase.auth();
const db = firebase.firestore();

console.log('Firebase conectado!');
