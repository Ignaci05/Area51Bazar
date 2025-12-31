/**
 * Carga un archivo HTML externo y lo inyecta en un contenedor.
 * @param {string} elementId - El ID del div donde pegaremos el HTML.
 * @param {string} filePath - La ruta del archivo HTML a cargar.
 */
export async function cargarComponente(elementId, filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`No se pudo cargar ${filePath}`);
        
        const html = await response.text();
        const element = document.getElementById(elementId);
        
        if (element) {
            element.innerHTML = html;
        } else {
            console.error(`El contenedor con ID "${elementId}" no existe.`);
        }
    } catch (error) {
        console.error("Error cargando HTML:", error);
    }
}