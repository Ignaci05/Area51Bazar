import { auth, db } from './config/firebase.js';
import { signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { cargarComponente } from './utils/loader.js';
import './utils/navigation.js';

console.log("🛸 Iniciando Punto de Venta...");

async function iniciarPOS() {

    // 1. Verificar Usuario y poner nombre en Navbar
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                document.getElementById('nombre-vendedor').innerText = docSnap.data().nombre;
            }
        } else {
            window.location.href = 'index.html';
        }
    });

    // 2. Cargar HTML
    await Promise.all([
        cargarComponente('vista-pos', './src/views/pos.html'),
        cargarComponente('contenedor-modals', './src/components/posModals.html'),
        cargarComponente('vista-historial', './src/views/historial_ventas.html'),
    ]);

    console.log("✅ Vista POS cargada.");

    // 3. Importar e Iniciar Controlador
    const salesModule = await import('./controllers/SalesController.js');
    const historyModule = await import('./controllers/SalesHistoryController.js');
    if (salesModule.initSalesController) {
        salesModule.initSalesController();
    }
    if (historyModule.initSalesHistoryController) {
        historyModule.initSalesHistoryController(); 
    }
}

iniciarPOS();

// Logout
const btnLogout = document.getElementById('btn-logout');
if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
        await signOut(auth);
        window.location.href = 'index.html';
    });
}