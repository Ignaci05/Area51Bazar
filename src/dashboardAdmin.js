// src/dashboardAdmin.js
import { auth } from './config/firebase.js';
import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import './utils/navigation.js';
import { cargarComponente } from './utils/loader.js';

console.log("👽 Iniciando Dashboard Admin...");

async function iniciarApp() {
    
    console.log("⏳ Cargando vistas HTML...");
    
    // 1. Cargamos el HTML
    await Promise.all([
        cargarComponente('contenedor-modals', './src/components/adminModals.html'),
        cargarComponente('vista-dashboard', './src/views/dashboard.html'),
        cargarComponente('vista-inventario', './src/views/inventario.html'),
        cargarComponente('vista-empleados', './src/views/empleados.html')
    ]);

    console.log("✅ HTML insertado en el DOM.");

    // 2. Importamos los controladores
    try {
        const inventoryModule = await import('./controllers/InventoryController.js');
        const employeesModule = await import('./controllers/EmployeesController.js');
        const statsModule = await import('./controllers/StatsController.js');

        // 3. EJECUTAMOS LA INICIALIZACIÓN (Con validación)
        
        // --- VALIDACIÓN INVENTARIO ---
        if (inventoryModule.initInventoryController) {
            inventoryModule.initInventoryController();
            console.log("✅ Inventario iniciado.");
        } else {
            console.error("❌ ERROR: No se encontró 'initInventoryController'. Verifica que InventoryController.js tenga 'export function initInventoryController'.");
        }
        
        // --- VALIDACIÓN EMPLEADOS ---
        if (employeesModule.initEmployeesController) {
            employeesModule.initEmployeesController();
            console.log("✅ Empleados iniciados.");
        } else {
            console.error("❌ ERROR: No se encontró 'initEmployeesController'. Verifica EmployeesController.js.");
        }

        // --- VALIDACIÓN ESTADÍSTICAS ---
        if (statsModule.initStatsController) {
            statsModule.initStatsController();
            console.log("✅ Estadísticas iniciadas.");
        } else {
            console.error("❌ ERROR: No se encontró 'initStatsController'. Verifica StatsController.js.");
        }
    } catch (error) {
        console.error("❌ Error importando controladores:", error);
    }
}

iniciarApp();

// Logout
const btnLogout = document.getElementById('btn-logout');
if(btnLogout){
    btnLogout.addEventListener('click', async () => {
        await signOut(auth);
        window.location.href = 'index.html';
    });
}