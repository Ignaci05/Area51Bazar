import { UserModel } from '../models/UserModel.js';

const userModel = new UserModel();

// Referencias al DOM (Vista)
const loginForm = document.getElementById('login-form');
const errorAlert = document.getElementById('error-alert');

// Manejador del evento Submit
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita que la página se recargue

        // Obtener valores de los inputs
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btnSubmit = document.getElementById('btn-login');

        // Feedback visual (Cargando...)
        btnSubmit.disabled = true;
        btnSubmit.innerText = "Verificando...";
        errorAlert.classList.add('d-none');

        try {
            // Llamamos al Modelo
            const user = await userModel.login(email, password);
            
            console.log("Login exitoso:", user);

            // Redirección según rol
            if (user.rol === 'admin') {
                window.location.href = 'dashboard-admin.html';
            } else if (user.rol === 'vendedor') {
                window.location.href = 'dashboard-ventas.html';
            } else {
                throw new Error("Rol desconocido");
            }

        } catch (error) {
            // Manejo de errores en la Vista
            errorAlert.innerText = error.message; // O un mensaje más amigable
            errorAlert.classList.remove('d-none');
        } finally {
            // Restaurar botón
            btnSubmit.disabled = false;
            btnSubmit.innerText = "Ingresar";
        }
    });
}