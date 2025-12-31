import { SalesModel } from '../models/SalesModel.js';
import { ProductModel } from '../models/ProductModel.js';

export function initStatsController() {
    console.log("📊 Iniciando Estadísticas Interactivas...");

    const lblDinero = document.getElementById('stat-dinero-hoy');
    const lblTickets = document.getElementById('stat-tickets-hoy');
    const lblStockBajo = document.getElementById('stat-stock-bajo');
    
    // Las tarjetas clickeables
    const cardTickets = document.getElementById('card-tickets');
    const cardBajos = document.getElementById('card-bajos');

    if (!lblDinero) return;

    const salesModel = new SalesModel();
    const productModel = new ProductModel();

    // === MEMORIA LOCAL (Para guardar los datos y mostrarlos al dar clic) ===
    let listaVentasHoy = [];
    let listaProductosBajos = [];

    // 1. ESCUCHAR VENTAS (Datos y Click)
    salesModel.suscribirVentasGlobalesHoy((ventas) => {
        listaVentasHoy = ventas; // Guardamos en memoria

        // Actualizar UI
        const totalDinero = ventas.reduce((sum, v) => sum + parseFloat(v.total), 0);
        lblDinero.innerText = `$${totalDinero.toFixed(2)}`;
        lblTickets.innerText = ventas.length;
    });

    // EVENTO CLICK EN VENTAS
    if (cardTickets) {
        cardTickets.addEventListener('click', () => {
            const tbody = document.getElementById('tabla-detalle-ventas');
            tbody.innerHTML = ''; // Limpiar

            if (listaVentasHoy.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" class="text-center p-4 text-muted">Sin ventas hoy</td></tr>`;
            } else {
                // Ordenar por fecha (más reciente primero) si no viene ordenado
                listaVentasHoy.sort((a, b) => b.fecha - a.fecha);

                listaVentasHoy.forEach(v => {
                    const fechaObj = v.fecha ? v.fecha.toDate() : new Date();
                    const hora = fechaObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    // Resumen corto de items
                    const itemsStr = v.items.map(i => i.cantidad > 1 ? `(${i.cantidad}) ${i.nombre}` : i.nombre).join(', ');

                    tbody.innerHTML += `
                        <tr>
                            <td class="small">${hora}</td>
                            <td class="fw-bold text-pink small">${v.vendedor_nombre || 'Desc.'}</td>
                            <td class="small text-truncate" style="max-width: 200px;" title="${itemsStr}">${itemsStr}</td>
                            <td class="text-end fw-bold">$${parseFloat(v.total).toFixed(2)}</td>
                        </tr>
                    `;
                });
            }
            
            // Mostrar Modal
            new bootstrap.Modal(document.getElementById('modalDetalleVentas')).show();
        });
    }

    // 2. ESCUCHAR STOCK BAJO (Datos y Click)
    productModel.suscribirAProductos((productos) => {
        // Filtramos y guardamos en memoria
        listaProductosBajos = productos.filter(p => p.stock.tienda < 5);
        
        // Actualizar UI
        const cantidadBajos = listaProductosBajos.length;
        lblStockBajo.innerText = cantidadBajos;
        
        // Alerta visual en la tarjeta
        if (cantidadBajos > 0) {
            lblStockBajo.parentElement.classList.remove('bg-pastel-red');
            lblStockBajo.parentElement.classList.add('bg-danger');
            lblStockBajo.parentElement.classList.add('shadow-lg'); // Extra llamar la atención
        } else {
            lblStockBajo.parentElement.classList.add('bg-pastel-red');
            lblStockBajo.parentElement.classList.remove('bg-danger');
            lblStockBajo.parentElement.classList.remove('shadow-lg');
        }
    });

    // EVENTO CLICK EN STOCK BAJO
    if (cardBajos) {
        cardBajos.addEventListener('click', () => {
            const listaUl = document.getElementById('lista-detalle-bajos');
            listaUl.innerHTML = '';

            if (listaProductosBajos.length === 0) {
                listaUl.innerHTML = `<li class="list-group-item text-center p-4 text-success"><i class="bi bi-check-circle display-4"></i><br>¡Todo en orden!</li>`;
            } else {
                listaProductosBajos.forEach(p => {
                    listaUl.innerHTML += `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <div class="fw-bold">${p.nombre}</div>
                                <small class="text-muted">Bodega: ${p.stock.bodega}</small>
                            </div>
                            <span class="badge bg-danger rounded-pill fs-6">${p.stock.tienda} en Tienda</span>
                        </li>
                    `;
                });
            }

            // Mostrar Modal
            new bootstrap.Modal(document.getElementById('modalDetalleBajos')).show();
        });
    }
}