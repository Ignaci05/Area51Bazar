// src/utils/uiUtils.js

/**
 * Muestra una alerta bonita tipo Modal en lugar del alert() feo.
 * @param {string} titulo - El encabezado (ej. "¡Éxito!" o "Error")
 * @param {string} mensaje - El texto descriptivo
 * @param {string} tipo - 'success', 'error' o 'info' (define el color e icono)
 */
export function mostrarAlerta(titulo, mensaje, tipo = 'info') {
    const modalEl = document.getElementById('modalAlertaGeneral');
    const modalTitulo = document.getElementById('modalAlertaTitulo');
    const modalCuerpo = document.getElementById('modalAlertaCuerpo');
    const modalHeader = document.getElementById('modalAlertaHeader');
    const modalIcono = document.getElementById('modalAlertaIcono');
    const btnEntendido = document.getElementById('btnAlertaEntendido');

    // 1. Configurar colores e iconos según el tipo
    let claseColor = '';
    let iconoHTML = '';

    if (tipo === 'success') {
        claseColor = 'bg-pastel-green'; // Definiremos esto en CSS
        iconoHTML = '<i class="bi bi-check-circle-fill display-3 text-success"></i>';
        btnEntendido.className = 'btn btn-success';
    } else if (tipo === 'error') {
        claseColor = 'bg-pastel-red';
        iconoHTML = '<i class="bi bi-x-circle-fill display-3 text-danger"></i>';
        btnEntendido.className = 'btn btn-danger';
    } else {
        claseColor = 'bg-pastel-purple';
        iconoHTML = '<i class="bi bi-info-circle-fill display-3 text-primary"></i>';
        btnEntendido.className = 'btn btn-primary';
    }

    // 2. Inyectar contenido
    modalTitulo.innerText = titulo;
    modalCuerpo.innerHTML = `
        <div class="text-center mb-3">${iconoHTML}</div>
        <p class="text-center fs-5 text-muted">${mensaje}</p>
    `;

    // 3. Limpiar clases viejas y poner la nueva
    modalHeader.className = `modal-header border-0 ${claseColor}`;

    // 4. Mostrar el modal usando Bootstrap
    const modalInstance = new bootstrap.Modal(modalEl);
    modalInstance.show();
}