import { SalesModel } from '../models/SalesModel.js';
import { auth } from '../config/firebase.js';
// Importamos esto para "escuchar" cuando el usuario esté listo
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"; 

export function initSalesHistoryController() {
    console.log("📜 Iniciando Historial de Ventas...");

    const salesModel = new SalesModel();
    const contenedorLista = document.getElementById('lista-ventas-container');
    const lblTotalDia = document.getElementById('historial-total-dia');

    if (!contenedorLista) return;

    // === CORRECCIÓN AQUÍ ===
    // En lugar de pedir auth.currentUser una vez, nos suscribimos al cambio.
    // Así, si tarda 1 segundo en conectar, el código espera y se ejecuta cuando esté listo.
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("✅ Usuario autenticado para historial:", user.email);
            
            // Ahora sí, pedimos los datos
            salesModel.suscribirVentasDelDia(user.uid, (ventas) => {
                renderizar(ventas);
            });
        } else {
            console.log("⏳ Esperando autenticación...");
        }
    });

    // FUNCIÓN DE RENDERIZADO (Igual que antes)
    function renderizar(ventas) {
        if (ventas.length === 0) {
            contenedorLista.innerHTML = `
                <div class="text-center p-5 text-muted">
                    <i class="bi bi-receipt display-4 opacity-25"></i>
                    <p class="mt-2">No has realizado ventas hoy.</p>
                </div>`;
            lblTotalDia.innerText = "$0.00";
            return;
        }

        const totalDia = ventas.reduce((sum, v) => sum + parseFloat(v.total), 0);
        lblTotalDia.innerText = `$${totalDia.toFixed(2)}`;

        let html = `
        <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
                <thead class="bg-light">
                    <tr>
                        <th>Hora</th>
                        <th>Productos</th>
                        <th>Método</th>
                        <th class="text-end">Total</th>
                    </tr>
                </thead>
                <tbody>
        `;

        ventas.forEach(v => {
            const fechaObj = v.fecha ? v.fecha.toDate() : new Date();
            const hora = fechaObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            // Resumen inteligente de items
            const resumenItems = v.items.map(i => {
                return i.cantidad > 1 ? `${i.cantidad}x ${i.nombre}` : i.nombre;
            }).join(', ');

            const iconoPago = v.metodo_pago === 'tarjeta' 
                ? '<i class="bi bi-credit-card text-primary" title="Tarjeta"></i>' 
                : '<i class="bi bi-cash-coin text-success" title="Efectivo"></i>';

            html += `
                <tr>
                    <td class="text-muted small">${hora}</td>
                    <td>
                        <div class="text-truncate" style="max-width: 250px;" title="${resumenItems}">
                            ${resumenItems}
                        </div>
                    </td>
                    <td class="text-center fs-5">${iconoPago}</td>
                    <td class="text-end fw-bold">$${parseFloat(v.total).toFixed(2)}</td>
                </tr>
            `;
        });

        html += `</tbody></table></div>`;
        contenedorLista.innerHTML = html;
    }
}