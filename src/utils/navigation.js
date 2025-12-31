/**
 * Maneja la lógica de pestañas (SPA)
 */
export function cambiarVista(nombreVista, elementoLink) {
    // A. OCULTAR TODAS LAS VISTAS (Admin y Ventas)
    // Agregamos '.vista-ventas' al selector
    document.querySelectorAll('.vista-admin, .vista-ventas').forEach(seccion => {
        seccion.classList.add('d-none');
    });

    // B. MOSTRAR LA SELECCIONADA
    const idSeleccionado = 'vista-' + nombreVista;
    const seccionA_Mostrar = document.getElementById(idSeleccionado);
    
    if(seccionA_Mostrar) {
        seccionA_Mostrar.classList.remove('d-none');
    }

    // C. ACTUALIZAR MENU
    if(elementoLink) {
        // Quitamos activo de todos los links del navbar
        const navbar = elementoLink.closest('.navbar-nav'); // Busca el menú padre
        if (navbar) {
            navbar.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active-pastel');
            });
            elementoLink.classList.add('active-pastel');
        }
    }
}

window.cambiarVista = cambiarVista;