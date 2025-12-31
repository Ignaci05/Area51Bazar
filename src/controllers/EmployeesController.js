// src/controllers/EmployeesController.js
import { UserModel } from '../models/UserModel.js';
import { mostrarAlerta } from '../utils/uiUtils.js';

/**
 * Inicializa el controlador de empleados cuando el HTML ya existe.
 */
export function initEmployeesController() {
    console.log("👥 Iniciando Controlador de Empleados...");

    const userModel = new UserModel();
    
    // Referencias al DOM
    const listaEmpleadosContainer = document.getElementById('lista-empleados-container');
    const formEmpleado = document.getElementById('form-nuevo-empleado');

    // =========================================================
    //  1. RENDERIZAR TABLA
    // =========================================================
    function renderizarTablaEmpleados(empleados) {
        // Validación de seguridad por si cambiamos de vista rápido
        const container = document.getElementById('lista-empleados-container');
        if (!container) return;

        if (!empleados || empleados.length === 0) {
            container.innerHTML = `
                <div class="text-center p-5">
                    <p class="text-muted">No hay vendedores registrados. ¡Contrata a alguien!</p>
                </div>`;
            return;
        }

        let html = `
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead class="table-light">
                    <tr>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;

        empleados.forEach(emp => {
            const estadoBadge = emp.activo 
                ? '<span class="badge bg-pastel-green text-dark">Activo</span>' 
                : '<span class="badge bg-secondary">Bloqueado</span>';
            
            const iconoEstado = emp.activo ? 'bi-slash-circle' : 'bi-check-circle';
            const tituloEstado = emp.activo ? 'Bloquear acceso' : 'Reactivar acceso';

            html += `
                <tr>
                    <td><div class="fw-bold text-pink">${emp.nombre}</div></td>
                    <td>${emp.email}</td>
                    <td>${estadoBadge}</td>
                    <td>
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-outline-secondary btn-toggle-estado" 
                                    title="${tituloEstado}"
                                    data-uid="${emp.uid}" 
                                    data-activo="${emp.activo}">
                                <i class="bi ${iconoEstado}"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-warning btn-editar-emp" 
                                    title="Editar Nombre"
                                    data-uid="${emp.uid}" 
                                    data-nombre="${emp.nombre}">
                                <i class="bi bi-pencil-fill"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger btn-eliminar-emp" 
                                    title="Eliminar Usuario"
                                    data-uid="${emp.uid}" 
                                    data-nombre="${emp.nombre}">
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
    //  2. INTERACCIONES (Delegación de Eventos)
    // =========================================================
    if (listaEmpleadosContainer) {
        // Suscripción a Firestore
        userModel.suscribirAEmpleados(renderizarTablaEmpleados);

        listaEmpleadosContainer.addEventListener('click', async (e) => {
            // A. TOGGLE ESTADO
            const btnEstado = e.target.closest('.btn-toggle-estado');
            if (btnEstado) {
                const uid = btnEstado.dataset.uid;
                const estadoActual = btnEstado.dataset.activo === "true";
                try {
                    await userModel.toggleEstadoEmpleado(uid, estadoActual);
                } catch (error) {
                    mostrarAlerta("Error", "No se pudo cambiar el estado.", "error");
                }
            }

            // B. EDITAR EMPLEADO
            const btnEdit = e.target.closest('.btn-editar-emp');
            if (btnEdit) {
                document.getElementById('editEmpUid').value = btnEdit.dataset.uid;
                document.getElementById('editEmpNombre').value = btnEdit.dataset.nombre;
                new bootstrap.Modal(document.getElementById('modalEditarEmpleado')).show();
            }

            // C. ELIMINAR EMPLEADO
            const btnDel = e.target.closest('.btn-eliminar-emp');
            if (btnDel) {
                document.getElementById('eliminarEmpUid').value = btnDel.dataset.uid;
                document.getElementById('eliminarEmpNombre').innerText = btnDel.dataset.nombre;
                new bootstrap.Modal(document.getElementById('modalEliminarEmpleado')).show();
            }
        });
    }

    // =========================================================
    //  3. FORMULARIOS (Modales)
    // =========================================================

    // CREAR NUEVO
    if (formEmpleado) {
        // Clonar para limpiar listeners previos
        const newForm = formEmpleado.cloneNode(true);
        formEmpleado.parentNode.replaceChild(newForm, formEmpleado);

        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                nombre: document.getElementById('empNombre').value,
                email: document.getElementById('empEmail').value,
                password: document.getElementById('empPass').value
            };
            const btnCrear = document.getElementById('btn-crear-emp');
            const textoOriginal = btnCrear.innerText;

            try {
                btnCrear.disabled = true;
                btnCrear.innerText = "Creando...";
                await userModel.crearEmpleado(data);
                
                bootstrap.Modal.getInstance(document.getElementById('modalNuevoEmpleado')).hide();
                mostrarAlerta("¡Bienvenido!", `Usuario creado para ${data.nombre}`, "success");
                
                // Limpiar formulario manual pq el clone pierde la referencia directa al reset() a veces
                document.getElementById('empNombre').value = '';
                document.getElementById('empEmail').value = '';
                document.getElementById('empPass').value = '';

            } catch (error) {
                let msg = error.message;
                if(msg.includes("email-already-in-use")) msg = "Ese correo ya está registrado.";
                if(msg.includes("weak-password")) msg = "La contraseña es muy débil (mínimo 6 caracteres).";
                mostrarAlerta("Error al contratar", msg, "error");
            } finally {
                btnCrear.disabled = false;
                btnCrear.innerText = textoOriginal;
            }
        });
    }

    // EDITAR EXISTENTE
    const formEditarEmp = document.getElementById('form-editar-empleado');
    if (formEditarEmp) {
        const newForm = formEditarEmp.cloneNode(true);
        formEditarEmp.parentNode.replaceChild(newForm, formEditarEmp);

        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const uid = document.getElementById('editEmpUid').value;
            const nombre = document.getElementById('editEmpNombre').value;

            bootstrap.Modal.getInstance(document.getElementById('modalEditarEmpleado')).hide();

            try {
                await userModel.editarEmpleado(uid, { nombre });
                mostrarAlerta("Actualizado", "Datos del empleado guardados.", "success");
            } catch (error) {
                mostrarAlerta("Error", "No se pudo actualizar.", "error");
            }
        });
    }

    // ELIMINAR EXISTENTE
    const btnConfirmarEliminarEmp = document.getElementById('btnConfirmarEliminarEmp');
    if (btnConfirmarEliminarEmp) {
        const newBtn = btnConfirmarEliminarEmp.cloneNode(true);
        btnConfirmarEliminarEmp.parentNode.replaceChild(newBtn, btnConfirmarEliminarEmp);

        newBtn.addEventListener('click', async () => {
            const uid = document.getElementById('eliminarEmpUid').value;
            
            bootstrap.Modal.getInstance(document.getElementById('modalEliminarEmpleado')).hide();

            try {
                await userModel.eliminarEmpleado(uid);
                mostrarAlerta("Eliminado", "El usuario ha sido removido del sistema.", "success");
            } catch (error) {
                mostrarAlerta("Error", "No se pudo eliminar.", "error");
            }
        });
    }
}