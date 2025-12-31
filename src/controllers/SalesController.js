// src/controllers/SalesController.js
import { ProductModel } from '../models/ProductModel.js';
import { mostrarAlerta } from '../utils/uiUtils.js';
import { auth } from '../config/firebase.js';

export function initSalesController() {
    console.log("💰 Iniciando Controlador de Ventas...");

    const productModel = new ProductModel();

    // ESTADO DE LA APLICACIÓN
    let todosLosProductos = [];
    let carrito = [];

    // Referencias al DOM
    const buscador = document.getElementById('pos-buscador');
    const gridProductos = document.getElementById('pos-grid-productos');
    const contenedorCarrito = document.getElementById('pos-carrito-items');
    const lblSubtotal = document.getElementById('pos-subtotal');
    const lblTotal = document.getElementById('pos-total');
    const btnCobrar = document.getElementById('btn-cobrar');
    const btnCancelarOriginal = document.getElementById('btn-cancelar-venta'); // Referencia original

    // =========================================================
    //  1. CARGA DE PRODUCTOS
    // =========================================================
    productModel.suscribirAProductos((productos) => {
        todosLosProductos = productos;
        filtrarYRenderizar();
    });

    // =========================================================
    //  2. BUSCADOR & ESCÁNER
    // =========================================================
    if (buscador) {
        // Clonamos para limpiar listeners previos si se recarga
        const newBuscador = buscador.cloneNode(true);
        buscador.parentNode.replaceChild(newBuscador, buscador);
        newBuscador.focus();

        newBuscador.addEventListener('input', (e) => {
            filtrarYRenderizar(e.target.value.toLowerCase().trim());
        });

        newBuscador.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const codigo = newBuscador.value.trim();
                const productoEncontrado = todosLosProductos.find(p => p.codigo_barras === codigo);

                if (productoEncontrado) {
                    agregarAlCarrito(productoEncontrado);
                    newBuscador.value = '';
                    filtrarYRenderizar('');
                    mostrarAlerta("¡Escaneado!", `${productoEncontrado.nombre} agregado.`, "success");
                } else {
                    mostrarAlerta("No encontrado", "Código no existe.", "error");
                }
            }
        });
    }

    // =========================================================
    //  3. FUNCIONES DEL CATÁLOGO
    // =========================================================
    function filtrarYRenderizar(termino = '') {
        const grid = document.getElementById('pos-grid-productos'); // Buscar de nuevo por si cambió el DOM
        if (!grid) return;

        const filtrados = todosLosProductos.filter(p => {
            const tieneStock = p.stock.tienda > 0;
            const coincideNombre = p.nombre.toLowerCase().includes(termino);
            const coincideCodigo = p.codigo_barras && p.codigo_barras.includes(termino);
            return tieneStock && (coincideNombre || coincideCodigo);
        });

        if (filtrados.length === 0) {
            grid.innerHTML = `
                <div class="col-12 text-center py-5 text-muted">
                    <i class="bi bi-emoji-frown display-4"></i>
                    <p class="mt-2">No hay productos disponibles.</p>
                </div>`;
            return;
        }

        grid.innerHTML = filtrados.map(p => `
            <div class="col-6 col-md-4 col-lg-3">
                <div class="card h-100 shadow-sm border-0 producto-card" onclick="window.agregarDesdeClick('${p.id}')">
                    <div class="card-body text-center d-flex flex-column">
                        <h6 class="card-title fw-bold text-dark text-truncate">${p.nombre}</h6>
                        <small class="text-muted mb-2">${p.codigo_barras || 'S/N'}</small>
                        <div class="mt-auto">
                            <h5 class="text-pink fw-bold">$${parseFloat(p.precio).toFixed(2)}</h5>
                            <span class="badge bg-light text-dark border">Stock: ${p.stock.tienda}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Función global para el onclick del HTML
    window.agregarDesdeClick = (id) => {
        const prod = todosLosProductos.find(p => p.id === id);
        if (prod) agregarAlCarrito(prod);
    };

    // =========================================================
    //  4. LÓGICA DEL CARRITO
    // =========================================================
    function agregarAlCarrito(producto) {
        const itemExistente = carrito.find(item => item.id === producto.id);
        if (itemExistente) {
            if (itemExistente.cantidad + 1 > producto.stock.tienda) {
                mostrarAlerta("Stock Insuficiente", `Solo hay ${producto.stock.tienda} disponibles.`, "error");
                return;
            }
            itemExistente.cantidad++;
        } else {
            carrito.push({
                id: producto.id,
                nombre: producto.nombre,
                precio: parseFloat(producto.precio),
                cantidad: 1,
                maxStock: producto.stock.tienda
            });
        }
        renderizarCarrito();
    }

    function renderizarCarrito() {
        // Buscar referencias frescas
        const container = document.getElementById('pos-carrito-items');
        const lblS = document.getElementById('pos-subtotal');
        const lblT = document.getElementById('pos-total');
        const btnC = document.getElementById('btn-cobrar');
        const btnCan = document.getElementById('btn-cancelar-venta');

        if (!container) return;

        container.innerHTML = '';

        if (carrito.length === 0) {
            container.innerHTML = `<div class="text-center text-muted mt-5"><i class="bi bi-cart-x display-1 opacity-25"></i><p>Carrito Vacío</p></div>`;
            lblS.innerText = '$0.00';
            lblT.innerText = '$0.00';
            btnC.disabled = true;
            btnCan.disabled = true;
            return;
        }

        let totalGeneral = 0;
        carrito.forEach((item, index) => {
            const subtotalItem = item.cantidad * item.precio;
            totalGeneral += subtotalItem;
            const div = document.createElement('div');
            div.className = "card mb-2 border-0 shadow-sm bg-light";
            div.innerHTML = `
                <div class="card-body p-2 d-flex justify-content-between align-items-center">
                    <div style="width: 40%;"><h6 class="mb-0 text-truncate">${item.nombre}</h6><small class="text-muted">$${item.precio.toFixed(2)}</small></div>
                    <div class="d-flex align-items-center bg-white rounded border">
                        <button class="btn btn-sm text-danger btn-menos" data-index="${index}"><i class="bi bi-dash"></i></button>
                        <span class="px-2 fw-bold small">${item.cantidad}</span>
                        <button class="btn btn-sm text-success btn-mas" data-index="${index}"><i class="bi bi-plus"></i></button>
                    </div>
                    <div class="text-end" style="width: 25%;"><span class="fw-bold">$${subtotalItem.toFixed(2)}</span><i class="bi bi-trash text-danger btn-borrar ms-2" data-index="${index}" style="cursor: pointer;"></i></div>
                </div>`;
            container.appendChild(div);
        });

        lblS.innerText = `$${totalGeneral.toFixed(2)}`;
        lblT.innerText = `$${totalGeneral.toFixed(2)}`;
        btnC.disabled = false;
        btnCan.disabled = false;
    }

    // Eventos del Carrito (+, -, Borrar)
    if (contenedorCarrito) {
        const newContainer = contenedorCarrito.cloneNode(true);
        contenedorCarrito.parentNode.replaceChild(newContainer, contenedorCarrito);

        newContainer.addEventListener('click', (e) => {
            const btnMas = e.target.closest('.btn-mas');
            if (btnMas) {
                const idx = btnMas.dataset.index;
                if (carrito[idx].cantidad < carrito[idx].maxStock) {
                    carrito[idx].cantidad++;
                    renderizarCarrito();
                } else { mostrarAlerta("Tope", "Máximo stock alcanzado", "error"); }
            }
            const btnMenos = e.target.closest('.btn-menos');
            if (btnMenos) {
                const idx = btnMenos.dataset.index;
                if (carrito[idx].cantidad > 1) { carrito[idx].cantidad--; renderizarCarrito(); }
            }
            const btnBorrar = e.target.closest('.btn-borrar');
            if (btnBorrar) {
                carrito.splice(btnBorrar.dataset.index, 1);
                renderizarCarrito();
            }
        });
    }

    // =========================================================
    //  5. ACCIONES GLOBALES (Cancelar y Cobrar)
    // =========================================================

    // A. CANCELAR VENTA (Limpiamos listeners viejos con cloneNode)
    if (btnCancelarOriginal) {
        const btnCancelarNuevo = btnCancelarOriginal.cloneNode(true);
        btnCancelarOriginal.parentNode.replaceChild(btnCancelarNuevo, btnCancelarOriginal);

        btnCancelarNuevo.addEventListener('click', () => {
            // Solo abrimos el modal, SIN ALERTAS NATIVAS
            new bootstrap.Modal(document.getElementById('modalCancelarVenta')).show();
        });
    }

    // B. CONFIRMAR CANCELACIÓN (Dentro del Modal)
    const btnConfirmarCancelar = document.getElementById('btnConfirmarCancelar');
    if (btnConfirmarCancelar) {
        const newBtnConfirm = btnConfirmarCancelar.cloneNode(true);
        btnConfirmarCancelar.parentNode.replaceChild(newBtnConfirm, btnConfirmarCancelar);

        newBtnConfirm.addEventListener('click', () => {
            carrito = [];
            renderizarCarrito();

            // Cerrar modal
            const modalEl = document.getElementById('modalCancelarVenta');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            modalInstance.hide();

            // Regresar el foco al buscador
            const inputBus = document.getElementById('pos-buscador');
            if (inputBus) inputBus.focus();
        });
    }

    // C. COBRAR (Abrir Modal)
    if (btnCobrar) {
        const newBtnCobrar = btnCobrar.cloneNode(true);
        btnCobrar.parentNode.replaceChild(newBtnCobrar, btnCobrar);

        newBtnCobrar.addEventListener('click', () => {
            const totalStr = lblTotal.innerText.replace('$', '');
            document.getElementById('cobroTotalDisplay').innerText = `$${totalStr}`;

            // Resetear a Efectivo por defecto
            document.getElementById('pagoEfectivo').checked = true;
            document.getElementById('pagoEfectivo').dispatchEvent(new Event('change')); // Forzar actualización de UI

            // Resetear Inputs
            const inputEntregado = document.getElementById('cobroEntregado');
            inputEntregado.value = '';
            inputEntregado.disabled = false; // Habilitar por si acaso
            document.getElementById('cobroCambio').innerText = '$0.00';
            document.getElementById('btnConfirmarPago').disabled = true;

            new bootstrap.Modal(document.getElementById('modalCobrar')).show();
            setTimeout(() => inputEntregado.focus(), 500);
        });
    }

    // D. LÓGICA DENTRO DEL MODAL (Cambio de Método de Pago y Calculadora)
    const inputEntregado = document.getElementById('cobroEntregado');
    const radiosPago = document.querySelectorAll('.input-metodo-pago');
    const btnPay = document.getElementById('btnConfirmarPago');

    // 1. Detectar cambio Efectivo vs Tarjeta
    radiosPago.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const esTarjeta = e.target.value === 'tarjeta';
            const total = parseFloat(lblTotal.innerText.replace('$', ''));

            if (esTarjeta) {
                // Si es tarjeta, asumimos pago exacto
                inputEntregado.value = total;
                inputEntregado.disabled = true; // No necesita escribir
                document.getElementById('cobroCambio').innerText = "$0.00";
                btnPay.disabled = false; // Listo para cobrar
            } else {
                // Si es efectivo, limpiar y dejar escribir
                inputEntregado.value = '';
                inputEntregado.disabled = false;
                document.getElementById('cobroCambio').innerText = "$0.00";
                btnPay.disabled = true;
                inputEntregado.focus();
            }
        });
    });

    // 2. Calculadora de Cambio (Solo aplica en efectivo)
    if (inputEntregado) {
        const newInput = inputEntregado.cloneNode(true);
        inputEntregado.parentNode.replaceChild(newInput, inputEntregado);

        newInput.addEventListener('input', (e) => {
            const entregado = parseFloat(e.target.value) || 0;
            const total = parseFloat(lblTotal.innerText.replace('$', ''));
            const cambio = entregado - total;
            const lblCambio = document.getElementById('cobroCambio');
            const btnPayRef = document.getElementById('btnConfirmarPago'); // Referencia fresca

            if (cambio >= 0) {
                lblCambio.innerText = `$${cambio.toFixed(2)}`;
                lblCambio.classList.remove('text-danger');
                btnPayRef.disabled = false;
            } else {
                lblCambio.innerText = "Falta dinero";
                lblCambio.classList.add('text-danger');
                btnPayRef.disabled = true;
            }
        });

        newInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !document.getElementById('btnConfirmarPago').disabled) {
                document.getElementById('btnConfirmarPago').click();
            }
        });
    }

    // E. PROCESAR PAGO
    const btnConfirmarPago = document.getElementById('btnConfirmarPago');
    if (btnConfirmarPago) {
        const newBtnPay = btnConfirmarPago.cloneNode(true);
        btnConfirmarPago.parentNode.replaceChild(newBtnPay, btnConfirmarPago);

        newBtnPay.addEventListener('click', async () => {
            newBtnPay.disabled = true;
            newBtnPay.innerText = "Procesando...";

            try {
                const user = auth.currentUser;
                const vendedorDatos = {
                    uid: user.uid,
                    nombre: document.getElementById('nombre-vendedor').innerText || user.email
                };
                const totalVenta = parseFloat(lblTotal.innerText.replace('$', ''));

                // CAPTURAR MÉTODO SELECCIONADO
                const metodoSeleccionado = document.querySelector('input[name="metodoPago"]:checked').value;

                // Enviar metodoSeleccionado al modelo
                await productModel.registrarVenta(carrito, totalVenta, vendedorDatos, metodoSeleccionado);

                const modalEl = document.getElementById('modalCobrar');
                bootstrap.Modal.getInstance(modalEl).hide();

                mostrarAlerta("¡Venta Exitosa!", "Ticket guardado.", "success");

                carrito = [];
                renderizarCarrito();
                buscador.focus();

            } catch (error) {
                mostrarAlerta("Error al cobrar", error, "error");
            } finally {
                newBtnPay.innerText = "CONFIRMAR VENTA";
            }
        });
    }
}
