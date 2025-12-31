import { db } from '../config/firebase.js';
import { collection, doc, setDoc, serverTimestamp, onSnapshot, query, orderBy, runTransaction, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

export class ProductModel {

    async crearProducto(data) {
        try {
            // 1. Crear una referencia con ID automático ANTES de guardar
            // Esto nos da un ID único de Firestore (ej: "A1b2C3d4...") sin ir a la base de datos todavía.
            const newDocRef = doc(collection(db, "products"));
            const autoId = newDocRef.id;

            // 2. Decidir qué código de barras usar
            // Si el usuario escribió algo, úsalo. Si no, usa el ID de Firestore.
            const codigoFinal = data.codigo_barras ? data.codigo_barras : autoId;

            const nuevoProducto = {
                id: autoId, // Guardamos el ID dentro del documento también para facilitar búsquedas
                nombre: data.nombre,
                codigo_barras: codigoFinal,
                categoria: data.categoria,
                precio: parseFloat(data.precio),
                costo: parseFloat(data.costo),
                stock: {
                    bodega: parseInt(data.cantidad_inicial),
                    tienda: 0
                },
                fecha_creacion: serverTimestamp()
            };

            // 3. Usamos setDoc para guardar en esa referencia específica
            await setDoc(newDocRef, nuevoProducto);

            console.log("Producto creado con ID:", autoId);
            return autoId;

        } catch (error) {
            console.error("Error al crear producto:", error);
            throw error;
        }
    }

    async editarProducto(id, data) {
        const productoRef = doc(db, "products", id);
        try {
            await updateDoc(productoRef, {
                nombre: data.nombre,
                categoria: data.categoria,
                precio: parseFloat(data.precio),
                costo: parseFloat(data.costo),
                // AHORA ACTUALIZAMOS EL STOCK TAMBIÉN
                stock: {
                    bodega: parseInt(data.stock_bodega),
                    tienda: parseInt(data.stock_tienda)
                }
            });
            console.log("Producto actualizado completo:", id);
        } catch (error) {
            console.error("Error al editar:", error);
            throw error;
        }
    }

    /**
     * Elimina un producto permanentemente.
     */
    async eliminarProducto(id) {
        const productoRef = doc(db, "products", id);
        try {
            await deleteDoc(productoRef);
            console.log("Producto eliminado:", id);
        } catch (error) {
            console.error("Error al eliminar:", error);
            throw error;
        }
    }

    suscribirAProductos(callback) {
        const productosRef = collection(db, "products");
        // Ordenamos por fecha para ver los nuevos primero (descendente)
        const q = query(productosRef, orderBy("fecha_creacion", "desc"));

        // onSnapshot se queda "vivo" escuchando
        return onSnapshot(q, (snapshot) => {
            const productos = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(productos);
        });
    }

    /**
     * Mueve inventario de Bodega a Tienda de forma atómica.
     */
    async traspasarBodegaATienda(productoId, cantidad) {
        const productoRef = doc(db, "products", productoId);

        try {
            await runTransaction(db, async (transaction) => {
                // 1. Leer el documento actual
                const sfDoc = await transaction.get(productoRef);
                if (!sfDoc.exists()) throw "El producto no existe.";

                const data = sfDoc.data();
                const stockBodega = data.stock.bodega;
                const stockTienda = data.stock.tienda;
                const cant = parseInt(cantidad);

                // 2. Validar que haya suficiente en bodega
                if (stockBodega < cant) {
                    throw `Solo hay ${stockBodega} piezas en bodega. No puedes mover ${cant}.`;
                }

                // 3. Calcular nuevos valores
                const nuevoBodega = stockBodega - cant;
                const nuevoTienda = stockTienda + cant;

                // 4. Actualizar
                transaction.update(productoRef, {
                    "stock.bodega": nuevoBodega,
                    "stock.tienda": nuevoTienda
                });
            });
            console.log("Traspaso exitoso");
        } catch (error) {
            console.error("Error en transacción:", error);
            // Re-lanzamos el error para que el Controller lo capture y muestre la alerta roja
            throw error;
        }
    }

    /**
     * Registra una venta: Resta stock de Tienda y guarda el historial.
     * @param {Array} carrito - Lista de items {id, cantidad, precio, ...}
     * @param {number} total - Total de la venta
     * @param {Object} vendedor - Datos del usuario {uid, nombre}
     */
    async registrarVenta(carrito, total, vendedor, metodoPago) {
        try {
            await runTransaction(db, async (transaction) => {
                // 1. LEER: Verificar stock de TODOS los productos primero
                // (Firebase exige que todas las lecturas se hagan antes de escribir)
                const lecturas = [];
                for (const item of carrito) {
                    const ref = doc(db, "products", item.id);
                    lecturas.push(transaction.get(ref));
                }

                const docsSnapshots = await Promise.all(lecturas);

                // 2. VERIFICAR: ¿Hay suficiente stock real en la base de datos?
                docsSnapshots.forEach((docSnap, index) => {
                    if (!docSnap.exists()) throw `El producto ${carrito[index].nombre} ya no existe via sistema.`;

                    const prodReal = docSnap.data();
                    const stockActualTienda = prodReal.stock.tienda;
                    const cantidadSolicitada = carrito[index].cantidad;

                    if (stockActualTienda < cantidadSolicitada) {
                        throw `Error: Solo quedan ${stockActualTienda} unidades de "${prodReal.nombre}".`;
                    }
                });

                // 3. ESCRIBIR: Restar Stock y Crear Ticket
                // A. Restamos stock producto por producto
                carrito.forEach((item) => {
                    const ref = doc(db, "products", item.id);
                    // Como no tenemos el dato "fresco" en una variable simple aquí, 
                    // usamos el increment negativo de Firestore que es atómico y seguro.
                    // (O usamos la data que leímos arriba). Vamos a usar la data leída para ser explícitos.
                    const docSnap = docsSnapshots.find(d => d.id === item.id);
                    const nuevoStock = docSnap.data().stock.tienda - item.cantidad;

                    transaction.update(ref, { "stock.tienda": nuevoStock });
                });

                // B. Guardamos el Ticket de Venta
                const ventaRef = doc(collection(db, "sales"));
                transaction.set(ventaRef, {
                    items: carrito,
                    total: total,
                    fecha: serverTimestamp(),
                    vendedor_id: vendedor.uid,
                    vendedor_nombre: vendedor.nombre,
                    metodo_pago: metodoPago
                });
            });

            console.log("✅ Venta registrada con éxito.");

        } catch (error) {
            console.error("Error en venta:", error);
            throw error;
        }
    }
}