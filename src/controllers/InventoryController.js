// src/controllers/InventoryController.js
import { ProductModel } from '../models/ProductModel.js';
import { mostrarAlerta } from '../utils/uiUtils.js';

/**
 * Función de inicialización que se llama desde dashboardAdmin.js
 * cuando el HTML del inventario ya ha sido cargado.
 */
export function initInventoryController() {
    console.log("📦 Iniciando Controlador de Inventario...");

    const productModel = new ProductModel();
    
    // Referencias al DOM (que ahora SÍ existen)
    const formProducto = document.getElementById('form-nuevo-producto');
    const listaProductosContainer = document.getElementById('lista-productos-container');

    // =========================================================
    //  PARTE A: CREAR PRODUCTO (Formulario de Alta)
    // =========================================================
    if (formProducto) {
        // Usamos un clon para limpiar listeners viejos si se recarga el módulo, 
        // o simplemente agregamos el listener si es la primera vez.
        // Para este MVP, agregar el listener directo está bien.
        formProducto.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Recolección de datos
            const data = {
                nombre: document.getElementById('nombreProd').value,
                // Nota: No enviamos código de barras para que se autogenere si está vacío
                categoria: document.getElementById('categoriaProd').value,
                precio: document.getElementById('precioProd').value,
                costo: document.getElementById('costoProd').value,
                cantidad_inicial: document.getElementById('stockBodega').value
            };

            const btnGuardar = document.getElementById('btn-guardar-prod');
            const textoOriginal = btnGuardar.innerText;

            try {
                btnGuardar.disabled = true;
                btnGuardar.innerText = "Guardando...";

                await productModel.crearProducto(data);

                // Cerrar el modal del formulario
                const modalEl = document.getElementById('modalNuevoProducto');
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                modalInstance.hide();

                // Mostrar alerta de éxito
                mostrarAlerta("¡Excelente!", "El producto se ha guardado en Bodega correctamente. 🌸", "success");
                
                formProducto.reset(); 

            } catch (error) {
                mostrarAlerta("Ups, algo pasó", error.message, "error");
            } finally {
                btnGuardar.disabled = false;
                btnGuardar.innerText = textoOriginal;
            }
        });
    }

    // =========================================================
    //  PARTE B: INTERACCIONES EN LA TABLA (Mover, Editar, Borrar)
    // =========================================================
    if (listaProductosContainer) {
        listaProductosContainer.addEventListener('click', (e) => {
            
            // 1. CASO: CLICK EN MOVER (Botón Azul)
            const btnMover = e.target.closest('.btn-mover');
            if (btnMover) {
                // Llenar Modal de Traspaso
                document.getElementById('traspasoIdProducto').value = btnMover.dataset.id;
                document.getElementById('traspasoNombre').innerText = btnMover.dataset.nombre;
                document.getElementById('traspasoStockBodega').innerText = btnMover.dataset.bodega;
                document.getElementById('traspasoStockTienda').innerText = btnMover.dataset.tienda;
                
                // Configurar input de cantidad
                const inputCant = document.getElementById('cantTraspaso');
                inputCant.value = 1;
                // Evitar mover más de lo que hay en bodega
                inputCant.max = parseInt(btnMover.dataset.bodega) > 0 ? btnMover.dataset.bodega : 1; 

                new bootstrap.Modal(document.getElementById('modalTraspaso')).show();
            }

            // 2. CASO: CLICK EN EDITAR (Botón Amarillo)
            const btnEdit = e.target.closest('.btn-editar');
            if (btnEdit) {
                // Llenar Modal de Edición
                document.getElementById('editId').value = btnEdit.dataset.id;
                document.getElementById('editNombre').value = btnEdit.dataset.nombre;
                document.getElementById('editCategoria').value = btnEdit.dataset.categoria;
                document.getElementById('editPrecio').value = btnEdit.dataset.precio;
                document.getElementById('editCosto').value = btnEdit.dataset.costo;
                
                // Llenar campos de stock (Corrección)
                document.getElementById('editStockBodega').value = btnEdit.dataset.bodega;
                document.getElementById('editStockTienda').value = btnEdit.dataset.tienda;

                new bootstrap.Modal(document.getElementById('modalEditarProducto')).show();
            }

            // 3. CASO: CLICK EN ELIMINAR (Botón Rojo)
            const btnDel = e.target.closest('.btn-eliminar');
            if (btnDel) {
                // Llenar Modal de Confirmación
                document.getElementById('eliminarIdProducto').value = btnDel.dataset.id;
                document.getElementById('eliminarNombreProducto').innerText = btnDel.dataset.nombre;

                new bootstrap.Modal(document.getElementById('modalConfirmarEliminar')).show();
            }
        });
    }

    // =========================================================
    //  PARTE C: LOGICA DE LOS MODALES (Acciones Submit)
    // =========================================================

    // 1. PROCESAR TRASPASO
    const formTraspaso = document.getElementById('form-traspaso');
    if (formTraspaso) {
        // Usamos replaceWith para eliminar listeners anteriores si se recarga
        const newForm = formTraspaso.cloneNode(true);
        formTraspaso.parentNode.replaceChild(newForm, formTraspaso);
        
        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('traspasoIdProducto').value;
            const cant = document.getElementById('cantTraspaso').value;

            const modalInstance = bootstrap.Modal.getInstance(document.getElementById('modalTraspaso'));
            modalInstance.hide();

            try {
                await productModel.traspasarBodegaATienda(id, cant);
                mostrarAlerta("Movimiento Exitoso", `Se movieron ${cant} unidades a Tienda.`, "success");
            } catch (error) {
                mostrarAlerta("Error de Traspaso", error, "error");
            }
        });
    }

    // 2. PROCESAR EDICIÓN (Guardar Cambios)
    const formEditar = document.getElementById('form-editar-producto');
    if (formEditar) {
        const newForm = formEditar.cloneNode(true);
        formEditar.parentNode.replaceChild(newForm, formEditar);

        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('editId').value;
            
            const data = {
                nombre: document.getElementById('editNombre').value,
                categoria: document.getElementById('editCategoria').value,
                precio: document.getElementById('editPrecio').value,
                costo: document.getElementById('editCosto').value,
                // Capturar stocks corregidos
                stock_bodega: document.getElementById('editStockBodega').value,
                stock_tienda: document.getElementById('editStockTienda').value
            };

            const modalInstance = bootstrap.Modal.getInstance(document.getElementById('modalEditarProducto'));
            modalInstance.hide();

            try {
                await productModel.editarProducto(id, data);
                mostrarAlerta("Actualizado", "Inventario y datos corregidos correctamente.", "success");
            } catch (error) {
                mostrarAlerta("Error", "No se pudieron guardar los cambios.", "error");
            }
        });
    }

    // 3. PROCESAR ELIMINACIÓN (Confirmar Borrado)
    const btnConfirmarBorrado = document.getElementById('btnConfirmarBorrado');
    if (btnConfirmarBorrado) {
        const newBtn = btnConfirmarBorrado.cloneNode(true);
        btnConfirmarBorrado.parentNode.replaceChild(newBtn, btnConfirmarBorrado);

        newBtn.addEventListener('click', async () => {
            const id = document.getElementById('eliminarIdProducto').value;
            
            const modalInstance = bootstrap.Modal.getInstance(document.getElementById('modalConfirmarEliminar'));
            modalInstance.hide();

            try {
                await productModel.eliminarProducto(id);
                mostrarAlerta("Eliminado", "El producto ha sido borrado del sistema.", "success");
            } catch (error) {
                mostrarAlerta("Error", "No se pudo eliminar el producto.", "error");
            }
        });
    }

    // =========================================================
    //  PARTE D: RENDERIZADO DE TABLA (Vista)
    // =========================================================

    function renderizarTabla(productos) {
        // Verificar si el contenedor aún existe (por si cambiamos de vista)
        const container = document.getElementById('lista-productos-container');
        if (!container) return;

        // Si no hay productos, mostrar mensaje vacío
        if (!productos || productos.length === 0) {
            container.innerHTML = `
                <div class="text-center p-5">
                    <p class="text-muted">📭 No hay productos registrados aún.</p>
                </div>`;
            return;
        }

        // Encabezados
        let html = `
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead class="table-light">
                    <tr>
                        <th>Producto</th>
                        <th>Categoría</th>
                        <th>Precio</th>
                        <th class="text-center">Bodega</th>
                        <th class="text-center">Tienda</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;

        // Filas
        productos.forEach(prod => {
            // Alertas visuales de stock bajo
            const alertaBodega = prod.stock.bodega < 5 ? 'text-danger fw-bold' : '';
            const alertaTienda = prod.stock.tienda < 2 ? 'text-danger fw-bold' : '';

            // Formato moneda
            const precio = parseFloat(prod.precio).toFixed(2);

            html += `
                <tr>
                    <td>
                        <div class="fw-bold text-dark">${prod.nombre}</div>
                        <small class="text-muted" style="font-size: 0.85em;">${prod.codigo_barras || 'S/N'}</small>
                    </td>
                    <td><span class="badge bg-light text-dark border">${prod.categoria}</span></td>
                    <td class="fw-bold text-success">$${precio}</td>
                    
                    <td class="text-center ${alertaBodega}" style="font-size: 1.1em;">
                        ${prod.stock.bodega}
                    </td>
                    <td class="text-center ${alertaTienda}" style="font-size: 1.1em;">
                        ${prod.stock.tienda}
                    </td>
                    
                    <td>
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-outline-primary btn-mover" 
                                title="Mover a Tienda"
                                data-id="${prod.id}" 
                                data-nombre="${prod.nombre}"
                                data-bodega="${prod.stock.bodega}"
                                data-tienda="${prod.stock.tienda}">
                                <i class="bi bi-arrow-left-right"></i>
                            </button>

                            <button class="btn btn-sm btn-outline-warning btn-editar" 
                                    title="Editar Detalles"
                                    data-id="${prod.id}"
                                    data-nombre="${prod.nombre}"
                                    data-categoria="${prod.categoria}"
                                    data-precio="${prod.precio}"
                                    data-costo="${prod.costo || 0}"
                                    data-bodega="${prod.stock.bodega}"
                                    data-tienda="${prod.stock.tienda}">
                                <i class="bi bi-pencil-fill"></i>
                            </button>

                            <button class="btn btn-sm btn-outline-danger btn-eliminar" 
                                    title="Eliminar Producto"
                                    data-id="${prod.id}"
                                    data-nombre="${prod.nombre}">
                                <i class="bi bi-trash-fill"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table></div>`;
        container.innerHTML = html;
    }

    // =========================================================
    //  PARTE E: INICIAR SUSCRIPCIÓN (Arranque)
    // =========================================================
    if (listaProductosContainer) {
        console.log("Iniciando suscripción al inventario...");
        productModel.suscribirAProductos(renderizarTabla);
    } else {
        console.warn("⚠️ No se encontró el contenedor de lista de productos.");
    }
}