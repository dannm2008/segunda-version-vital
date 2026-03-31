// ============================================
// VITAL MARKET - APP PRINCIPAL
// Version corregida - Todos los botones funcionales
// ============================================

// Esperar a que Firebase cargue completamente
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Iniciando Vital Market...');

    // ============================================
    // 1. CONFIGURACION FIREBASE
    // ============================================
    const firebaseConfig = {
        apiKey: "AIzaSyBvZPnn5tAZFxV49_VakbO4QfveHYdSN9E",
        authDomain: "vital-marke--bosa.firebaseapp.com",
        databaseURL: "https://vital-marke--bosa-default-rtdb.firebaseio.com",
        projectId: "vital-marke--bosa",
        storageBucket: "vital-marke--bosa.firebasestorage.app",
        messagingSenderId: "123100524585",
        appId: "1:123100524585:web:5d891bf7b3f1305cd76c38",
        measurementId: "G-915MJF4D9Z"
    };

    // Inicializar Firebase (manejo de errores)
    let database = null;
    let auth = null;
    let firebaseInicializado = false;

    try {
        if (typeof firebase !== 'undefined') {
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
                console.log('Firebase inicializado');
            }
            database = firebase.database();
            auth = typeof firebase.auth === 'function' ? firebase.auth() : null;
            firebaseInicializado = true;
            console.log('Conexion a Database establecida');
        } else {
            console.warn('Firebase no cargado, usando datos locales');
        }
    } catch (error) {
        console.error('Error al inicializar Firebase:', error);
        console.log('Usando modo offline con datos locales');
    }

    // ============================================
    // 2. DATOS LOCALES (FALLBACK)
    // ============================================
    const datosLocales = {
        inventario: {
            amoxicilina: { nombre: 'Amoxicilina 500mg', stock: 45, precio: 12500, categoria: 'antibiotico', vence: '2024-12-31', imagen: '' },
            ibuprofeno: { nombre: 'Ibuprofeno 400mg', stock: 85, precio: 4200, categoria: 'analgesico', vence: '2024-11-30', imagen: '' },
            paracetamol: { nombre: 'Paracetamol 500mg', stock: 120, precio: 3500, categoria: 'analgesico', vence: '2025-03-15', imagen: '' },
            lantus: { nombre: 'Insulina Glargina', stock: 8, precio: 45000, categoria: 'insulina', vence: '2025-06-30', imagen: '' },
            losartan: { nombre: 'Losartan 50mg', stock: 15, precio: 2800, categoria: 'cardiovascular', vence: '2024-10-15', imagen: '' },
            metformina: { nombre: 'Metformina 850mg', stock: 32, precio: 5500, categoria: 'diabetes', vence: '2025-01-20', imagen: '' },
            omeprazol: { nombre: 'Omeprazol 20mg', stock: 67, precio: 1800, categoria: 'gastro', vence: '2025-02-28', imagen: '' },
            salbutamol: { nombre: 'Salbutamol Spray', stock: 12, precio: 12500, categoria: 'respiratorio', vence: '2024-09-30', imagen: '' },
            enalapril: { nombre: 'Enalapril 10mg', stock: 41, precio: 3200, categoria: 'cardiovascular', vence: '2025-04-15', imagen: '' },
            atorvastatina: { nombre: 'Atorvastatina 20mg', stock: 28, precio: 8900, categoria: 'cardiovascular', vence: '2025-01-10', imagen: '' }
        }
    };

    // Variable para almacenar datos actuales
    let inventarioActual = {};
    const alertasVencimientoMostradas = new Set();
    const ultimoNivelStockNotificado = {};
    let inventarioSuscrito = false;
    let guardandoInventario = false;
    let guardadoInventarioPendiente = false;
    let premiumActivo = false; // Por defecto, plan básico
    let premiumUntil = '';
    const DEFAULT_PREMIUM_BACKEND_URL = 'https://vital-market-backend.onrender.com';
    const PREMIUM_BACKEND_URL = (() => {
        const configuredUrl = localStorage.getItem('premiumBackendUrl');
        if (configuredUrl) return configuredUrl;
        const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        return isLocalHost ? 'http://localhost:8787' : DEFAULT_PREMIUM_BACKEND_URL;
    })();
    const INVENTARIO_CACHE_KEY = 'vitalMarketInventarioCache';
    const PEDIDO_SEGUIMIENTO_KEY = 'vitalMarketPedidoSeguimiento';
    const BASE_TRACKING_LAT = 4.682657958446985;
    const BASE_TRACKING_LNG = -74.05669582712905;
    const IMAGEN_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="240" height="180" viewBox="0 0 240 180"%3E%3Crect width="240" height="180" rx="16" fill="%23f1f5f9"/%3E%3Crect x="16" y="16" width="208" height="148" rx="12" fill="%23e2e8f0"/%3E%3Ccircle cx="82" cy="80" r="18" fill="%2394a3b8"/%3E%3Cpath d="M36 146l48-42 34 30 36-28 50 40H36z" fill="%2394a3b8"/%3E%3Ctext x="120" y="167" text-anchor="middle" font-family="Arial" font-size="12" fill="%2364758b"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
    const IMAGENES_CATALOGO = {
        amoxicilina: 'https://copservir.vtexassets.com/arquivos/ids/1869990-1200-auto?v=639101941221530000&width=1200&height=auto&aspect=true',
        ibuprofeno: 'https://copservir.vtexassets.com/arquivos/ids/1763204-1200-auto?v=638970576127770000&width=1200&height=auto&aspect=true',
        paracetamol: 'https://www.tiendas3b.com/wp-content/uploads/2025/10/17265-a-768x768.jpg',
        lantus: 'https://pedidosonline.farmaciaschavez.com.bo:8443/catalogofchavez/7641/INSULINALANTUS100UIMLSOLASTAR-3582910023623_7641.jpg',
        losartan: 'https://www.drogueriascafam.com.co/49526-large_default/comprar-en-cafam-losartan-50-mg-caja-con-30-tabletas-recubiertas-precio.jpg',
        metformina: 'https://www.drogueriascafam.com.co/38323-large_default/comprar-en-cafam-metformina-850-mg-caja-con-30-tabletas-precio.jpg',
        omeprazol: 'https://www.kernpharma.com/sites/default/files/styles/max_1024x1024/public/productos/imagenes/omeprazol-20-mg-comprimidos-recubiertos-con-pelicula-efg-56-comprimidos-0.webp?itok=oxMtIWKq',
        salbutamol: 'https://www.drogueriascafam.com.co/49476-large_default/comprar-en-cafam-salbutamol-100-mcg-caja-con-frasco-inhalacion-con-200-dosis-suspension-precio.jpg',
        enalapril: 'https://ik.imagekit.io/buscamed/14988883413792978205.webp?tr=w-640&v=VANtUkW',
        atorvastatina: 'https://www.drogueriascafam.com.co/49527-large_default/comprar-en-cafam-atorvastatina-40-mg-caja-con-10-tabletas-recubiertas-precio.jpg'
    };
    let panelFarmaciaAutenticado = localStorage.getItem('vitalMarketPanelAuth') === 'true';
    let clienteSesion = null;
    let seguimientoPedidoActual = null;
    let pedidosActivosMultiples = [];
    let centroNotificaciones = [];
    let pedidosEntregadosNotificados = new Set();
    let autoSyncSeguimientoEnCurso = false;
    let authEstadoInicialProcesado = false;
    let autenticandoCliente = false;

    function normalizarEmail(valor) {
        return String(valor || '').trim().toLowerCase();
    }

    function obtenerRutaClienteFirebase(basePath) {
        const uid = typeof clienteSesion?.uid === 'string' ? clienteSesion.uid : '';
        if (!uid) return null;
        return `${basePath}/${uid}`;
    }

    function premiumSigueVigente(untilIso) {
        if (!untilIso) return false;
        const ts = new Date(untilIso).getTime();
        if (!Number.isFinite(ts)) return false;
        return ts > Date.now();
    }

    function obtenerClaveNotificaciones() {
        const uid = String(clienteSesion?.uid || 'guest').trim();
        return `vitalMarketNotificaciones_${uid}`;
    }

    function obtenerClaveEntregadosNotificados() {
        const uid = String(clienteSesion?.uid || 'guest').trim();
        return `vitalMarketEntregadosNotificados_${uid}`;
    }

    function guardarNotificacionesPersistidas() {
        try {
            localStorage.setItem(obtenerClaveNotificaciones(), JSON.stringify(centroNotificaciones));
        } catch (error) {
            console.warn('No se pudo guardar notificaciones en localStorage:', error?.message || error);
        }
    }

    function cargarNotificacionesPersistidas() {
        try {
            const raw = localStorage.getItem(obtenerClaveNotificaciones());
            const arr = JSON.parse(raw || '[]');
            centroNotificaciones = Array.isArray(arr) ? arr : [];
        } catch (error) {
            centroNotificaciones = [];
        }
        actualizarCampanaNotificacionesUI();
        renderizarCentroNotificaciones();
    }

    function guardarEntregadosNotificados() {
        try {
            localStorage.setItem(obtenerClaveEntregadosNotificados(), JSON.stringify(Array.from(pedidosEntregadosNotificados)));
        } catch (error) {
            console.warn('No se pudo guardar entregados notificados:', error?.message || error);
        }
    }

    function cargarEntregadosNotificados() {
        try {
            const raw = localStorage.getItem(obtenerClaveEntregadosNotificados());
            const arr = JSON.parse(raw || '[]');
            pedidosEntregadosNotificados = new Set(Array.isArray(arr) ? arr : []);
        } catch (error) {
            pedidosEntregadosNotificados = new Set();
        }
    }

    function actualizarCampanaNotificacionesUI() {
        const badge = document.getElementById('notificaciones-badge');
        const bellBtn = document.getElementById('btn-notificaciones');
        if (!badge) return;

        const noLeidas = centroNotificaciones.filter((n) => !n?.leida).length;
        badge.textContent = String(noLeidas);
        if (noLeidas > 0) {
            badge.classList.remove('hidden');
            bellBtn?.classList.add('notif-has-unread');
        } else {
            badge.classList.add('hidden');
            bellBtn?.classList.remove('notif-has-unread');
        }
    }

    function formatearFechaHoraCorta(iso) {
        const dt = new Date(iso || Date.now());
        if (!Number.isFinite(dt.getTime())) return '--';
        return dt.toLocaleString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function agregarNotificacionCentro({ tipo = 'info', titulo = 'Notificacion', detalle = '', fechaIso = new Date().toISOString(), id = '' }) {
        const notifId = String(id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
        const yaExiste = centroNotificaciones.some((n) => String(n?.id) === notifId);
        if (yaExiste) return;

        centroNotificaciones.unshift({
            id: notifId,
            tipo,
            titulo,
            detalle,
            fechaIso,
            leida: false
        });

        centroNotificaciones = centroNotificaciones.slice(0, 100);
        guardarNotificacionesPersistidas();
        actualizarCampanaNotificacionesUI();
        renderizarCentroNotificaciones();
    }

    function renderizarCentroNotificaciones() {
        const vacioEl = document.getElementById('notificaciones-vacio');
        const listaEl = document.getElementById('notificaciones-lista');
        if (!vacioEl || !listaEl) return;

        if (!Array.isArray(centroNotificaciones) || centroNotificaciones.length === 0) {
            vacioEl.classList.remove('hidden');
            listaEl.classList.add('hidden');
            listaEl.innerHTML = '';
            return;
        }

        vacioEl.classList.add('hidden');
        listaEl.classList.remove('hidden');

        listaEl.innerHTML = centroNotificaciones.map((n) => {
            const esExito = n?.tipo === 'success';
            const clase = esExito ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50';
            const icono = esExito ? 'check_circle' : 'notifications_active';
            const fecha = formatearFechaHoraCorta(n?.fechaIso);
            return `
                <div class="border rounded-xl p-3 ${clase} ${n?.leida ? 'opacity-80' : ''}">
                    <div class="flex items-start gap-2">
                        <span class="material-symbols-outlined text-base mt-0.5">${icono}</span>
                        <div class="flex-1">
                            <p class="font-bold text-slate-900 text-sm">${n?.titulo || 'Notificacion'}</p>
                            <p class="text-slate-700 text-sm">${n?.detalle || ''}</p>
                            <p class="text-xs text-slate-500 mt-1">${fecha}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function marcarNotificacionesComoLeidas() {
        let cambio = false;
        centroNotificaciones = centroNotificaciones.map((n) => {
            if (n?.leida) return n;
            cambio = true;
            return { ...n, leida: true };
        });

        if (cambio) {
            guardarNotificacionesPersistidas();
            actualizarCampanaNotificacionesUI();
            renderizarCentroNotificaciones();
        }
    }

    function revisarPedidosEntregadosParaNotificar() {
        if (!Array.isArray(pedidosActivosMultiples) || pedidosActivosMultiples.length === 0) return;

        pedidosActivosMultiples.forEach((pedido) => {
            const codigo = String(pedido?.codigo || '').trim();
            if (!codigo) return;

            const estado = obtenerEstadoPedido(pedido?.etaIso);
            if (estado.texto !== 'ENTREGADO') return;
            if (pedidosEntregadosNotificados.has(codigo)) return;

            pedidosEntregadosNotificados.add(codigo);
            guardarEntregadosNotificados();
            agregarNotificacionCentro({
                tipo: 'success',
                id: `entregado_${codigo}`,
                titulo: `Pedido ${codigo} entregado`,
                detalle: 'Tu pedido ya llego exitosamente.',
                fechaIso: new Date().toISOString()
            });
            mostrarNotificacion(`Tu pedido ${codigo} ya fue entregado`, 'success');
        });
    }

    function obtenerPremiumUserId() {
        const key = 'vitalMarketUserId';
        let userId = localStorage.getItem(key);
        if (userId) return userId;

        userId = `user_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
        localStorage.setItem(key, userId);
        return userId;
    }

    async function sincronizarSeguimientoPedidoActual() {
        if (!firebaseInicializado || !database || !clienteSesion?.uid) {
            seguimientoPedidoActual = null;
            pedidosActivosMultiples = [];
            return;
        }

        try {
            // Cargar activos e historial para no perder pedidos en la vista de seguimiento.
            const [snapshotActivos, snapshotHistorial] = await Promise.all([
                database.ref(`seguimientoPedidosActivos/${clienteSesion.uid}`).once('value'),
                database.ref(`seguimientoPedido/${clienteSesion.uid}`).once('value')
            ]);

            const pedidosActivosObj = snapshotActivos.val();
            const pedidosHistorialObj = snapshotHistorial.val();
            const pedidosCombinados = {};

            if (pedidosHistorialObj && typeof pedidosHistorialObj === 'object') {
                Object.entries(pedidosHistorialObj).forEach(([codigo, data]) => {
                    pedidosCombinados[codigo] = { codigo, ...data };
                });
            }

            if (pedidosActivosObj && typeof pedidosActivosObj === 'object') {
                Object.entries(pedidosActivosObj).forEach(([codigo, data]) => {
                    pedidosCombinados[codigo] = { codigo, ...pedidosCombinados[codigo], ...data };
                });
            }

            pedidosActivosMultiples = Object.values(pedidosCombinados)
                .sort((a, b) => {
                    const fechaB = new Date(b.creadoIso || b.creado_iso || b.creado_fecha || 0).getTime();
                    const fechaA = new Date(a.creadoIso || a.creado_iso || a.creado_fecha || 0).getTime();
                    return fechaB - fechaA;
                });

            seguimientoPedidoActual = pedidosActivosMultiples[0] || null;
            revisarPedidosEntregadosParaNotificar();
        } catch (error) {
            console.warn('No se pudo leer seguimientos del cliente en Firebase:', error?.message || error);
            pedidosActivosMultiples = [];
            seguimientoPedidoActual = null;
        }
    }

    function construirSesionClienteDesdeAuth(user) {
        if (!user) return null;
        const email = normalizarEmail(user.email || '');
        if (!email) return null;
        return {
            uid: user.uid,
            email,
            nombre: String(user.displayName || '').trim() || email.split('@')[0]
        };
    }

    async function guardarSesionCliente(sesion) {
        clienteSesion = sesion;
        cargarNotificacionesPersistidas();
        cargarEntregadosNotificados();
        actualizarEstadoSesionClienteUI();
        await sincronizarSeguimientoPedidoActual();
        revisarPedidosEntregadosParaNotificar();
        actualizarTarjetaSeguimiento();
        // Mostrar historial de compras automáticamente al iniciar sesión
        if (document.getElementById('mis-compras-lista')) {
            cargarMisCompras();
            document.getElementById('modal-historial-compras')?.classList.remove('hidden');
        }
    }

    async function manejarCambioSesionCliente(user) {
        const sesion = construirSesionClienteDesdeAuth(user);
        if (sesion) {
            await guardarSesionCliente(sesion);
            // Si es admin panel, siempre premium y panel habilitado
            if (sesion.email && sesion.email === 'drogueria.bosa@gmail.com') {
                premiumActivo = true;
                premiumUntil = '';
                localStorage.setItem('vitalMarketPremium', 'true');
                panelFarmaciaAutenticado = true;
                window.panelFarmaciaAutenticado = true;
                localStorage.setItem('vitalMarketPanelAuth', 'true');
                actualizarEstadoPremiumUI && actualizarEstadoPremiumUI();
                actualizarEstadoAccesoPanelUI && actualizarEstadoAccesoPanelUI();
                cambiarPantalla && cambiarPantalla('panel');
            } else {
                // Usuario normal: verificar premium
                premiumUntil = localStorage.getItem('vitalMarketPremiumUntil') || '';
                if (premiumUntil && new Date(premiumUntil) > new Date()) {
                    premiumActivo = true;
                    localStorage.setItem('vitalMarketPremium', 'true');
                } else {
                    premiumActivo = false;
                    localStorage.setItem('vitalMarketPremium', 'false');
                }
                actualizarEstadoPremiumUI && actualizarEstadoPremiumUI();
            }
        } else {
            // No hay usuario: plan básico
            premiumActivo = false;
            premiumUntil = '';
            localStorage.setItem('vitalMarketPremium', 'false');
            localStorage.removeItem('vitalMarketPremiumUntil');
            clienteSesion = null;
            seguimientoPedidoActual = null;
            centroNotificaciones = [];
            pedidosEntregadosNotificados = new Set();
            actualizarCampanaNotificacionesUI();
            renderizarCentroNotificaciones();
            actualizarEstadoSesionClienteUI();
            actualizarVistaMapaSeguimiento();
            if (authEstadoInicialProcesado) {
                mostrarNotificacion('Sesion de cliente cerrada', 'info');
            }
        }

        if (!authEstadoInicialProcesado) {
            authEstadoInicialProcesado = true;
        }
    }

    function iniciarEscuchaSesionCliente() {
        if (!auth) return;
        auth.onAuthStateChanged((user) => {
            manejarCambioSesionCliente(user).catch((error) => {
                console.error('Error en estado de sesion cliente:', error);
            });
        });
    }

    async function cerrarSesionCliente() {
        if (auth?.currentUser) {
            try {
                await auth.signOut();
            } catch (error) {
                console.error('Error cerrando sesion de cliente:', error);
                mostrarNotificacion('No se pudo cerrar sesion', 'info');
            }
            // Continuar para limpiar todo el estado local
        }
        // Limpiar datos de usuario, premium y compras
        localStorage.removeItem('vitalMarketPremium');
        localStorage.removeItem('vitalMarketPremiumUntil');
        localStorage.removeItem('misCompras');
        localStorage.removeItem('carrito');
        localStorage.removeItem('clienteSesion');
        localStorage.removeItem('seguimientoPedidoActual');
        localStorage.removeItem('vitalMarketPanelAuth');
        // Si tienes más claves relacionadas, agrégalas aquí
        clienteSesion = null;
        seguimientoPedidoActual = null;
        premiumActivo = false;
        premiumUntil = '';
        actualizarEstadoSesionClienteUI();
        actualizarVistaMapaSeguimiento();
        mostrarNotificacion('Sesion de cliente cerrada', 'info');
        window.location.reload(); // Recarga la app para limpiar el estado visual
    }

    function actualizarEstadoSesionClienteUI() {
        const btn = document.getElementById('btn-cliente-sesion');
        const btnText = document.getElementById('btn-cliente-sesion-text');
        if (!btn && !btnText) return;
        if (clienteSesion?.email) {
            const texto = `Sesion: ${clienteSesion.nombre}`;
            if (btnText) {
                btnText.textContent = texto;
            } else if (btn) {
                btn.textContent = texto;
            }
        } else {
            if (btnText) {
                btnText.textContent = 'Iniciar sesion';
            } else if (btn) {
                btn.textContent = 'Iniciar sesion';
            }
        }
    }

    function abrirModalAccesoCliente() {
        const modal = document.getElementById('modal-cliente-access');
        if (modal) modal.classList.remove('hidden');

        const nombreInput = document.getElementById('cliente-access-name');
        const emailInput = document.getElementById('cliente-access-email');
        const passInput = document.getElementById('cliente-access-password');

        if (nombreInput) nombreInput.value = clienteSesion?.nombre || '';
        if (emailInput) emailInput.value = clienteSesion?.email || '';
        if (passInput) passInput.value = '';
        if (emailInput) setTimeout(() => emailInput.focus(), 20);
    }

    function cerrarModalAccesoCliente() {
        const modal = document.getElementById('modal-cliente-access');
        if (modal) modal.classList.add('hidden');
    }

    function mensajeErrorFirebaseAuth(code, rawMessage = '') {
        if (!code) return 'No se pudo validar sesion en Firebase';

        const mensajeNormalizado = String(rawMessage || '').toUpperCase();
        if (code === 'auth/internal-error' && mensajeNormalizado.includes('CONFIGURATION_NOT_FOUND')) {
            return 'Firebase Auth no esta configurado para esta API Key/proyecto. Abre Firebase Console, activa Authentication y proveedor Email/Password';
        }

        const map = {
            'auth/operation-not-allowed': 'Debes activar Email/Password en Firebase Authentication',
            'auth/invalid-api-key': 'La configuracion de Firebase API Key no es valida',
            'auth/internal-error': 'Error interno de Firebase Authentication. Revisa configuracion de Auth y dominio autorizado',
            'auth/network-request-failed': 'Sin conexion o red bloqueada al contactar Firebase',
            'auth/user-disabled': 'Esta cuenta fue deshabilitada',
            'auth/invalid-email': 'Correo no valido. Usa formato usuario@correo.com',
            'auth/too-many-requests': 'Demasiados intentos. Espera un momento e intenta de nuevo',
            'auth/wrong-password': 'Correo o clave incorrectos',
            'auth/user-not-found': 'Correo o clave incorrectos',
            'auth/email-already-in-use': 'Este correo ya existe. Intenta iniciar sesion',
            'auth/weak-password': 'La clave debe tener al menos 6 caracteres'
        };

        return map[code] || `Error de autenticacion: ${code}`;
    }

    async function autenticarAccesoCliente() {
        if (autenticandoCliente) return;

        const nombre = (document.getElementById('cliente-access-name')?.value || '').trim();
        const email = normalizarEmail(document.getElementById('cliente-access-email')?.value || '');
        const password = (document.getElementById('cliente-access-password')?.value || '').trim();
        const emailValidoBasico = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
        const btnConfirmar = document.getElementById('confirmar-cliente-access');

        if (!email || !password) {
            mostrarNotificacion('Ingresa correo y clave', 'info');
            return;
        }
        if (!emailValidoBasico) {
            mostrarNotificacion('Correo no valido. Usa formato usuario@correo.com', 'info');
            return;
        }

        // Si ya hay sesión activa con el mismo email, simplemente cierra modal
        if (clienteSesion?.email && clienteSesion.email === email) {
            mostrarNotificacion(`Ya tienes sesión activa como ${clienteSesion.nombre}`, 'info');
            cerrarModalAccesoCliente();
            return;
        }

        // 1) Intentar acceso de administrador en backend.
        // Si funciona, se habilita panel inmediatamente con el mismo formulario.
        try {
            await validarCredencialesPanelEnBackend(email, password);
            panelFarmaciaAutenticado = true;
            localStorage.setItem('vitalMarketPanelAuth', 'true');
            actualizarEstadoAccesoPanelUI();
            cerrarModalAccesoCliente();
            mostrarNotificacion('Acceso de administrador habilitado', 'success');
            cambiarPantalla('panel');
            return;
        } catch (_error) {
            // No es admin o backend no autorizo: continuar con flujo cliente.
        }

        if (!auth || !database) {
            mostrarNotificacion('Firebase Auth no disponible para iniciar sesion', 'info');
            return;
        }

        autenticandoCliente = true;
        if (btnConfirmar) {
            btnConfirmar.disabled = true;
            btnConfirmar.textContent = 'Entrando...';
        }

        try {
            let credencial = null;
            let metodosInicio = [];
            try {
                metodosInicio = await auth.fetchSignInMethodsForEmail(email);
            } catch (methodsError) {
                const methodsCode = methodsError?.code || '';
                const methodsMessage = String(methodsError?.message || '').toLowerCase();
                if (methodsMessage.includes('email address is badly formatted')) {
                    mostrarNotificacion('Correo no valido. Usa formato usuario@correo.com', 'info');
                    return;
                }
                mostrarNotificacion(mensajeErrorFirebaseAuth(methodsCode, methodsError?.message), 'info');
                console.error('Error en fetchSignInMethodsForEmail:', methodsError?.code, methodsError?.message, methodsError);
                return;
            }

            const tieneCuenta = Array.isArray(metodosInicio) && metodosInicio.length > 0;

            if (!tieneCuenta) {
                try {
                    credencial = await auth.createUserWithEmailAndPassword(email, password);
                } catch (createError) {
                    const createCode = createError?.code || '';
                    // Si el correo ya existe, intentar iniciar sesión automáticamente
                    if (createCode === 'auth/email-already-in-use') {
                        try {
                            credencial = await auth.signInWithEmailAndPassword(email, password);
                        } catch (signInError) {
                            const code = signInError?.code || '';
                            mostrarNotificacion(mensajeErrorFirebaseAuth(code, signInError?.message), 'info');
                            return;
                        }
                    } else {
                        mostrarNotificacion(mensajeErrorFirebaseAuth(createCode, createError?.message), 'info');
                        return;
                    }
                }
            } else {
                try {
                    credencial = await auth.signInWithEmailAndPassword(email, password);
                } catch (signInError) {
                    const code = signInError?.code || '';
                    mostrarNotificacion(mensajeErrorFirebaseAuth(code, signInError?.message), 'info');
                    return;
                }
            }

            const user = credencial?.user || auth.currentUser;
            if (!user) {
                mostrarNotificacion('No se pudo abrir la sesion de cliente', 'info');
                return;
            }

            const nombreFinal = nombre || user.displayName || email.split('@')[0];

            if (nombreFinal && user.displayName !== nombreFinal) {
                await user.updateProfile({ displayName: nombreFinal });
            }

            await database.ref(`clientesPerfil/${user.uid}`).update({
                nombre: nombreFinal,
                email,
                actualizadoIso: new Date().toISOString()
            });

            await manejarCambioSesionCliente(user);
            panelFarmaciaAutenticado = false;
            localStorage.removeItem('vitalMarketPanelAuth');
            actualizarEstadoAccesoPanelUI();
        } catch (error) {
            mostrarNotificacion(mensajeErrorFirebaseAuth(error?.code, error?.message), 'info');
            console.error(error);
            return;
        } finally {
            autenticandoCliente = false;
            if (btnConfirmar) {
                btnConfirmar.disabled = false;
                btnConfirmar.textContent = 'Entrar';
            }
        }

        cerrarModalAccesoCliente();
        mostrarNotificacion('Sesion de cliente activa', 'success');
    }

    function resolverImagenProducto(producto) {
        const candidata = (typeof producto?.imagen === 'string' ? producto.imagen : '').trim();
        if (candidata && candidata !== '') {
            // Si existe imagen personalizada y no es placeholder
            const esDataImage = candidata.startsWith('data:image/');
            const esHttp = candidata.startsWith('http://') || candidata.startsWith('https://');
            const esRutaLocal = candidata.startsWith('/');
            if (esDataImage || esHttp || esRutaLocal) return candidata;
        }

        // Intentar usar imagen de catálogo si existe
        const productoId = obtenerIdProductoDesdeNombre(producto?.nombre || '');
        if (productoId && IMAGENES_CATALOGO[productoId]) {
            return IMAGENES_CATALOGO[productoId];
        }

        return IMAGEN_PLACEHOLDER;
    }

    function obtenerIdProductoDesdeNombre(nombre) {
        const nombreNormalizado = nombre.toLowerCase().replace(/\s+/g, '').replace(/[áéíóú]/g, (m) => {
            const map = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' };
            return map[m] || m;
        });
        for (let id of Object.keys(inventarioActual)) {
            if (id.toLowerCase() === nombreNormalizado) return id;
        }
        return null;
    }

    function imagenNecesitaReemplazo(url) {
        const valor = (typeof url === 'string' ? url : '').trim();
        if (!valor) return true;
        if (valor.startsWith('blob:')) return true;
        if (valor.includes('via.placeholder.com')) return true;
        return false;
    }

    function abrirVisorImagen(url, nombreProducto = 'Producto') {
        const modal = document.getElementById('modal-imagen-producto');
        const img = document.getElementById('modal-imagen-contenido');
        const titulo = document.getElementById('modal-imagen-titulo');
        if (!modal || !img || !titulo) return;

        titulo.textContent = nombreProducto;
        img.src = resolverImagenProducto({ imagen: url });
        img.onerror = () => { img.src = IMAGEN_PLACEHOLDER; };
        modal.classList.remove('hidden');
    }

    function cerrarVisorImagen() {
        const modal = document.getElementById('modal-imagen-producto');
        if (modal) modal.classList.add('hidden');
    }

    function obtenerEstadoPedido(etaIso) {
        const etaTs = new Date(etaIso).getTime();
        if (!Number.isFinite(etaTs)) {
            return { texto: 'EN PREPARACION', clase: 'bg-amber-100 text-amber-700' };
        }

        const ahora = Date.now();
        const faltanMs = etaTs - ahora;
        if (faltanMs <= 0) return { texto: 'ENTREGADO', clase: 'bg-green-100 text-green-700' };
        if (faltanMs <= 15 * 60 * 1000) return { texto: 'EN CAMINO', clase: 'bg-blue-100 text-blue-700' };
        return { texto: 'EN PREPARACION', clase: 'bg-amber-100 text-amber-700' };
    }

    function obtenerCoordenadasSeguimiento(data) {
        const lat = Number(data?.lat);
        const lng = Number(data?.lng);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
            return { lat, lng };
        }

        const codigo = String(data?.codigo || 'SIN-CODIGO').toUpperCase();
        let hash = 0;
        for (let i = 0; i < codigo.length; i += 1) {
            hash = (hash * 31 + codigo.charCodeAt(i)) % 100000;
        }

        const latOffset = ((hash % 120) - 60) / 10000;
        const lngOffset = ((Math.floor(hash / 120) % 120) - 60) / 10000;
        return {
            lat: BASE_TRACKING_LAT + latOffset,
            lng: BASE_TRACKING_LNG + lngOffset
        };
    }

    async function guardarSeguimientoPedido(data) {
        seguimientoPedidoActual = data;

        if (!firebaseInicializado || !database) {
            return;
        }

        if (!clienteSesion?.uid) return;

        const codigoSeguro = String(data?.codigo || '').trim() || `VM-${Date.now()}`;

        try {
            // Guardar en pedidos activos (NO se sobrescribe, se crea una rama por código)
            const totalFinal = Number(data?.total || 0);
            const itemsCantidad = Array.isArray(data?.items)
                ? data.items.reduce((acc, item) => acc + Math.max(1, Number(item?.cantidad) || 0), 0)
                : 0;

            const pedidoPayload = {
                ...data,
                creadoIso: data?.creadoIso || new Date().toISOString(),
                totalFinal,
                itemsCantidad,
                estado: obtenerEstadoPedido(data?.etaIso).texto.toLowerCase()
            };

            // Reflejar de inmediato en memoria para que seguimiento se actualice sin recargar.
            const idx = pedidosActivosMultiples.findIndex((p) => String(p?.codigo || '') === codigoSeguro);
            if (idx >= 0) {
                pedidosActivosMultiples[idx] = { codigo: codigoSeguro, ...pedidoPayload };
            } else {
                pedidosActivosMultiples.push({ codigo: codigoSeguro, ...pedidoPayload });
            }
            pedidosActivosMultiples.sort((a, b) => {
                const fechaB = new Date(b.creadoIso || b.creado_iso || b.creado_fecha || 0).getTime();
                const fechaA = new Date(a.creadoIso || a.creado_iso || a.creado_fecha || 0).getTime();
                return fechaB - fechaA;
            });
            seguimientoPedidoActual = pedidosActivosMultiples[0] || null;

            // Guardar en PEDIDOS ACTIVOS con el código como rama (cada pedido es independiente)
            await database.ref(`seguimientoPedidosActivos/${clienteSesion.uid}/${codigoSeguro}`).set(pedidoPayload);

            // Guardar también en historial para registro completo
            await database.ref(`seguimientoPedido/${clienteSesion.uid}/${codigoSeguro}`).set(pedidoPayload);
        } catch (error) {
            console.warn('No se pudo guardar seguimiento en Firebase:', error?.message || error);
        }
    }

    function obtenerDatosEntregaFormulario() {
        const nombre = document.getElementById('entrega-nombre')?.value?.trim() || '';
        const correo = document.getElementById('entrega-correo')?.value?.trim().toLowerCase() || '';
        const direccion = document.getElementById('entrega-direccion')?.value?.trim() || '';
        const barrio = document.getElementById('entrega-barrio')?.value?.trim() || '';

        return { nombre, correo, direccion, barrio };
    }

    function cargarSeguimientoPedido() {
        return seguimientoPedidoActual;
    }

    function actualizarTarjetaSeguimiento() {
        // Actualizar la vista completa con múltiples pedidos
        actualizarVistaMapaSeguimiento();
    }

    function actualizarVistaMapaSeguimiento() {
        const contenedorPedidos = document.getElementById('contenedor-pedidos-activos');
        if (!contenedorPedidos) {
            return;
        }

        // Si hay múltiples pedidos, mostrarlos todos
        if (pedidosActivosMultiples && pedidosActivosMultiples.length > 0) {
            contenedorPedidos.innerHTML = '';

            pedidosActivosMultiples.forEach((pedido) => {
                const estado = obtenerEstadoPedido(pedido.etaIso);
                const eta = new Date(pedido.etaIso);

                const tarjeta = document.createElement('div');
                tarjeta.className = 'bg-white rounded-2xl shadow-sm border border-slate-200 p-4';
                
                // Encabezado
                const header = document.createElement('div');
                header.className = 'flex items-center justify-between mb-3';
                header.innerHTML = `
                    <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary">package_2</span>
                        ${estado.texto}
                    </h2>
                    <span class="text-[10px] font-bold px-2 py-1 rounded-full ${estado.clase}">
                        ${estado.texto.toUpperCase()}
                    </span>
                `;
                tarjeta.appendChild(header);

                // Info del pedido (grid)
                const infoGrid = document.createElement('div');
                infoGrid.className = 'grid grid-cols-2 gap-2 text-sm mb-3';
                infoGrid.innerHTML = `
                    <p class="text-slate-500">Codigo:</p>
                    <p class="font-bold text-slate-800 text-right">${pedido.codigo || '--'}</p>
                    <p class="text-slate-500">Hora de compra:</p>
                    <p class="font-bold text-slate-800 text-right">${pedido.creadoIso ? new Date(pedido.creadoIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</p>
                    <p class="text-slate-500">Llegada estimada:</p>
                    <p class="font-bold text-slate-800 text-right">${Number.isFinite(eta.getTime()) ? eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</p>
                    <p class="text-slate-500">Recibe:</p>
                    <p class="font-bold text-slate-800 text-right">${pedido?.entrega?.nombre || '--'}</p>
                `;
                tarjeta.appendChild(infoGrid);

                // Productos con botones de eliminar
                const productosSection = document.createElement('div');
                productosSection.className = 'mt-3 pt-3 border-t border-slate-200';
                productosSection.innerHTML = `<p class="text-xs font-bold text-slate-500 mb-2">Productos comprados</p>`;
                
                if (Array.isArray(pedido.items) && pedido.items.length > 0) {
                    const productosContainer = document.createElement('div');
                    productosContainer.className = 'space-y-2';
                    
                    pedido.items.forEach((item, itemIndice) => {
                        const id = String(item?.id || '').trim();
                        const nombreProducto = inventarioActual[id]?.nombre || id || 'Producto';
                        const cantidad = Math.max(1, Number(item?.cantidad) || 0);
                        
                        const productoRow = document.createElement('div');
                        productoRow.className = 'flex items-center justify-between bg-slate-50 rounded-lg p-3 text-sm';
                        productoRow.innerHTML = `
                            <span class="font-medium text-slate-800">${nombreProducto} <span class="text-slate-500">x${cantidad}</span></span>
                            <button class="btn-eliminar-producto text-red-500 hover:text-red-700 hover:bg-red-100 px-3 py-2 rounded-lg font-bold transition-all flex items-center gap-1" data-codigo="${pedido.codigo}" data-item-index="${itemIndice}" title="Eliminar este producto">
                                <span class="material-symbols-outlined text-lg">delete</span>
                                <span class="text-xs">Eliminar</span>
                            </button>
                        `;
                        productosContainer.appendChild(productoRow);
                    });
                    
                    productosSection.appendChild(productosContainer);
                } else {
                    const sinProductos = document.createElement('p');
                    sinProductos.className = 'text-sm text-slate-500 italic';
                    sinProductos.textContent = 'Sin productos registrados';
                    productosSection.appendChild(sinProductos);
                }
                
                tarjeta.appendChild(productosSection);
                contenedorPedidos.appendChild(tarjeta);

            });

            // Agregar event listeners a botones de eliminar
            document.querySelectorAll('.btn-eliminar-producto').forEach(btn => {
                btn.addEventListener('click', async function(e) {
                    e.preventDefault();
                    const codigo = this.getAttribute('data-codigo');
                    const itemIndex = parseInt(this.getAttribute('data-item-index'));
                    await eliminarProductoDelPedido(codigo, itemIndex);
                });
            });

        } else {
            // Sin pedidos activos
            contenedorPedidos.innerHTML = `
                <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                    <div class="flex items-center justify-between mb-2">
                        <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <span class="material-symbols-outlined text-primary">package_2</span>
                            Sin Pedidos Activos
                        </h2>
                    </div>
                    <p class="text-sm text-slate-700">No hay pedidos activos en este momento. Realiza una compra para ver el seguimiento aquí.</p>
                </div>
            `;

        }
    }

    async function eliminarProductoDelPedido(codigo, itemIndex) {
        if (!clienteSesion?.uid) return;

        try {
            // Encontrar el pedido
            const pedido = pedidosActivosMultiples.find(p => p.codigo === codigo);
            if (!pedido) return;

            // Mostrar modal de confirmación personalizado
            const confirmado = await mostrarConfirmacionCustom(
                `¿Eliminar este producto del pedido #${codigo}?`,
                'Confirmar',
                'No borrar'
            );

            if (!confirmado) {
                return;
            }

            // Remover el item del array
            if (Array.isArray(pedido.items)) {
                pedido.items.splice(itemIndex, 1);

                const itemsCantidad = pedido.items.reduce((acc, item) => acc + Math.max(1, Number(item?.cantidad) || 0), 0);

                // Actualizar en Firebase
                const pedidoActualizado = {
                    ...pedido,
                    items: pedido.items,
                    itemsCantidad
                };

                await database.ref(`seguimientoPedidosActivos/${clienteSesion.uid}/${codigo}`).set(pedidoActualizado);
                await database.ref(`seguimientoPedido/${clienteSesion.uid}/${codigo}`).set(pedidoActualizado);

                // Actualizar en memoria
                const indice = pedidosActivosMultiples.findIndex(p => p.codigo === codigo);
                if (indice >= 0) {
                    pedidosActivosMultiples[indice] = pedidoActualizado;
                }

                // Redibujar
                actualizarVistaMapaSeguimiento();
                mostrarNotificacion('Producto eliminado del pedido', 'success');
            }
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            mostrarNotificacion('Error al eliminar producto', 'info');
        }
    }

    function mostrarConfirmacionCustom(mensaje, textoConfirmar = 'Confirmar', textoCancel = 'Cancelar') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
            modal.innerHTML = `
                <div class="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 p-6 animate-fade-in">
                    <div class="flex items-center justify-center mb-4">
                        <span class="material-symbols-outlined text-4xl text-amber-500">warning</span>
                    </div>
                    <h3 class="text-lg font-bold text-slate-900 text-center mb-3">${mensaje}</h3>
                    <div class="flex gap-3 justify-center">
                        <button class="btn-modal-cancel px-6 py-2 bg-slate-200 text-slate-800 rounded-lg font-bold hover:bg-slate-300 transition-all">
                            ${textoCancel}
                        </button>
                        <button class="btn-modal-confirm px-6 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-all">
                            ${textoConfirmar}
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const btnConfirm = modal.querySelector('.btn-modal-confirm');
            const btnCancel = modal.querySelector('.btn-modal-cancel');

            const cerrar = () => {
                modal.remove();
            };

            btnConfirm.addEventListener('click', () => {
                cerrar();
                resolve(true);
            });

            btnCancel.addEventListener('click', () => {
                cerrar();
                resolve(false);
            });

            // Cerrar con tecla Escape
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', handleEscape);
                    cerrar();
                    resolve(false);
                }
            };
            document.addEventListener('keydown', handleEscape);
        });
    }

    function irASeguimientoPedido() {
        cambiarPantalla('mapa');
        document.getElementById('mapa-seguimiento-estado')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    async function completarImagenesCatalogoSiFaltan() {
        const updates = {};

        Object.entries(IMAGENES_CATALOGO).forEach(([id, url]) => {
            const producto = inventarioActual[id];
            if (!producto) return;
            if (imagenNecesitaReemplazo(producto.imagen)) {
                inventarioActual[id].imagen = url;
                updates[`${id}/imagen`] = url;
            }
        });

        if (Object.keys(updates).length === 0) {
            return;
        }

        guardarInventarioCacheLocal(inventarioActual);

        if (firebaseInicializado && database) {
            try {
                await database.ref('inventario').update(updates);
                console.log('Imagenes automaticas aplicadas en Firebase');
            } catch (error) {
                console.warn('No se pudieron guardar imagenes automaticas en Firebase:', error);
            }
        }
    }

    function actualizarEstadoAccesoPanelUI() {
        const panelNavBtn = document.getElementById('nav-btn-panel');
        const panelLabel = document.getElementById('panel-nav-label');
        const panelIcon = document.getElementById('panel-nav-icon');
        if (panelNavBtn) {
            panelNavBtn.classList.toggle('hidden', !panelFarmaciaAutenticado);
        }
        if (panelLabel) {
            panelLabel.textContent = 'Panel';
        }
        if (panelIcon) {
            panelIcon.textContent = 'admin_panel_settings';
        }

        const logoutBtn = document.getElementById('btn-panel-logout');
        if (logoutBtn) {
            logoutBtn.classList.toggle('hidden', !panelFarmaciaAutenticado);
        }
    }

    async function validarCredencialesPanelEnBackend(email, password) {
        const response = await fetch(`${PREMIUM_BACKEND_URL}/api/panel/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        let payload = null;
        try {
            payload = await response.json();
        } catch (_error) {
            payload = null;
        }

        if (!response.ok || !payload?.authorized) {
            const msg = payload?.message || 'No autorizado para acceder al panel';
            throw new Error(msg);
        }

        return true;
    }

    function cerrarSesionPanel() {
        panelFarmaciaAutenticado = false;
        localStorage.removeItem('vitalMarketPanelAuth');
        actualizarEstadoAccesoPanelUI();
        mostrarNotificacion('Sesion de panel cerrada', 'info');
        cambiarPantalla('home');
    }

    function abrirModalCrearProducto() {
        const modal = document.getElementById('modal-crear-producto');
        if (modal) {
            modal.classList.remove('hidden');
            document.getElementById('crear-nombre')?.focus();
        }
    }

    function cerrarModalCrearProducto() {
        const modal = document.getElementById('modal-crear-producto');
        if (modal) modal.classList.add('hidden');
        // Limpiar inputs
        document.getElementById('crear-nombre').value = '';
        document.getElementById('crear-stock').value = '';
        document.getElementById('crear-precio').value = '';
        document.getElementById('crear-categoria').value = '';
        document.getElementById('crear-vence').value = '';
    }

    async function crearProductoNuevo() {
        const nombre = (document.getElementById('crear-nombre')?.value || '').trim();
        const stock = Number(document.getElementById('crear-stock')?.value || 0);
        const precio = Number(document.getElementById('crear-precio')?.value || 0);
        const categoria = (document.getElementById('crear-categoria')?.value || '').trim();
        const vence = (document.getElementById('crear-vence')?.value || '').trim();

        if (!nombre) {
            mostrarNotificacion('Ingresa el nombre del producto', 'error');
            return;
        }

        if (stock < 0 || precio < 0) {
            mostrarNotificacion('Stock y precio no pueden ser negativos', 'error');
            return;
        }

        const nuevoId = nombre.toLowerCase().replace(/\s+/g, '_').replace(/[áéíóú]/g, (m) => {
            const map = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' };
            return map[m] || m;
        });

        const nuevoProducto = {
            nombre,
            stock,
            precio,
            categoria: categoria || 'general',
            vence: vence || '',
            imagen: ''
        };

        inventarioActual[nuevoId] = nuevoProducto;
        actualizarInterfazCompleta();

        if (firebaseInicializado && database) {
            try {
                await database.ref(`inventario/${nuevoId}`).set(nuevoProducto);
                mostrarNotificacion(`✅ Producto "${nombre}" creado exitosamente`, 'success');
            } catch (error) {
                console.error('Error creando producto en Firebase:', error);
                mostrarNotificacion('Producto creado localmente (error al sincronizar)', 'info');
            }
        }

        cerrarModalCrearProducto();
    }

    async function eliminarProducto(productoId) {
        const producto = inventarioActual[productoId];
        if (!producto) return;

        const confirmacion = confirm(`¿Eliminar "${producto.nombre}"?`);
        if (!confirmacion) return;

        delete inventarioActual[productoId];
        actualizarInterfazCompleta();

        if (firebaseInicializado && database) {
            try {
                await database.ref(`inventario/${productoId}`).remove();
                mostrarNotificacion(`✅ Producto "${producto.nombre}" eliminado`, 'success');
            } catch (error) {
                console.error('Error eliminando producto en Firebase:', error);
                mostrarNotificacion('Producto eliminado localmente (error al sincronizar)', 'info');
            }
        }
    }

    function obtenerSemaforoStock(stock) {
        const valor = Number(stock) || 0;

        if (valor <= 9) {
            return {
                nivel: 'rojo',
                etiqueta: 'CRITICO',
                colorTexto: 'text-red-600',
                colorFondo: 'bg-red-100 text-red-700',
                colorBorde: 'border-l-red-500'
            };
        }

        if (valor <= 20) {
            return {
                nivel: 'amarillo',
                etiqueta: 'POR ACABARSE',
                colorTexto: 'text-amber-600',
                colorFondo: 'bg-amber-100 text-amber-700',
                colorBorde: 'border-l-amber-500'
            };
        }

        return {
            nivel: 'verde',
            etiqueta: 'OK',
            colorTexto: 'text-green-600',
            colorFondo: 'bg-green-100 text-green-700',
            colorBorde: 'border-l-green-500'
        };
    }

    function cargarInventarioCacheLocal() {
        try {
            const raw = localStorage.getItem(INVENTARIO_CACHE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return null;
            return parsed;
        } catch (_error) {
            return null;
        }
    }

    function guardarInventarioCacheLocal(data) {
        try {
            localStorage.setItem(INVENTARIO_CACHE_KEY, JSON.stringify(data));
        } catch (error) {
            console.warn('No se pudo guardar cache local de inventario:', error?.message || error);
        }
    }

    function normalizarInventario(data) {
        const inventarioCache = cargarInventarioCacheLocal();
        const base = (inventarioActual && Object.keys(inventarioActual).length > 0)
            ? inventarioActual
            : (inventarioCache && Object.keys(inventarioCache).length > 0 ? inventarioCache : datosLocales.inventario);
        const inventarioBase = JSON.parse(JSON.stringify(base));

        if (!data || typeof data !== 'object') {
            return inventarioBase;
        }

        // Soporte a formato legado: amox/lantus + vence_amox/vence_lantus
        const tieneFormatoLegado = (
            Object.prototype.hasOwnProperty.call(data, 'amox') ||
            Object.prototype.hasOwnProperty.call(data, 'lantus') ||
            Object.prototype.hasOwnProperty.call(data, 'vence_amox') ||
            Object.prototype.hasOwnProperty.call(data, 'vence_lantus')
        );

        if (tieneFormatoLegado) {
            if (Number.isFinite(Number(data.amox))) {
                inventarioBase.amoxicilina.stock = Math.max(0, Math.floor(Number(data.amox)));
            }
            if (typeof data.vence_amox === 'string' && data.vence_amox.trim()) {
                inventarioBase.amoxicilina.vence = data.vence_amox;
            }
            if (Number.isFinite(Number(data.lantus))) {
                inventarioBase.lantus.stock = Math.max(0, Math.floor(Number(data.lantus)));
            }
            if (typeof data.vence_lantus === 'string' && data.vence_lantus.trim()) {
                inventarioBase.lantus.vence = data.vence_lantus;
            }

            return inventarioBase;
        }

        // Formato nuevo por producto
        Object.entries(data).forEach(([id, prod]) => {
            if (!prod || typeof prod !== 'object') return;

            const ref = inventarioBase[id] || {};
            const stock = Number(prod.stock);
            const precio = Number(prod.precio);

            inventarioBase[id] = {
                nombre: typeof prod.nombre === 'string' && prod.nombre.trim() ? prod.nombre : (ref.nombre || id),
                stock: Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : (Number(ref.stock) || 0),
                precio: Number.isFinite(precio) ? Math.max(0, Math.floor(precio)) : (Number(ref.precio) || 0),
                categoria: typeof prod.categoria === 'string' && prod.categoria.trim() ? prod.categoria : (ref.categoria || 'general'),
                vence: typeof prod.vence === 'string' ? prod.vence : (ref.vence || ''),
                imagen: typeof prod.imagen === 'string' && prod.imagen.trim() ? prod.imagen : (ref.imagen || '')
            };
        });

        return inventarioBase;
    }

    function tieneLlavesLegacyEnRaiz(data) {
        if (!data || typeof data !== 'object') return false;
        return (
            Object.prototype.hasOwnProperty.call(data, 'amox') ||
            Object.prototype.hasOwnProperty.call(data, 'lantus') ||
            Object.prototype.hasOwnProperty.call(data, 'vence_amox') ||
            Object.prototype.hasOwnProperty.call(data, 'vence_lantus')
        );
    }

    async function migrarInventarioLegacySiExiste(rootData, inventarioNormalizado) {
        if (!firebaseInicializado || !database) return;
        if (!tieneLlavesLegacyEnRaiz(rootData)) return;

        try {
            await database.ref('inventario').set(inventarioNormalizado);
            await database.ref().update({
                amox: null,
                lantus: null,
                vence_amox: null,
                vence_lantus: null
            });

            console.log('Migracion legacy completada: llaves antiguas movidas a inventario');
            mostrarNotificacion('Migracion de inventario completada', 'success');
        } catch (error) {
            console.error('No se pudo completar migracion legacy:', error);
        }
    }

    function actualizarEstadoPremiumUI() {
        const badge = document.getElementById('header-premium-badge');
        const premiumBenefits = document.getElementById('premium-benefits');
        const basicBenefits = document.getElementById('basic-benefits');
        const upgradeBtn = document.getElementById('upgrade-premium-btn');
        const body = document.body;

        if (badge) {
            // Solo mostrar 'MIEMBRO PREMIUM' si hay usuario logueado y premiumActivo
            if (premiumActivo && clienteSesion) {
                badge.innerText = 'MIEMBRO PREMIUM';
                badge.className = 'bg-accent text-primary text-[10px] font-black px-2 py-0.5 rounded-full';
                if (premiumUntil) {
                    badge.title = `Vence: ${new Date(premiumUntil).toLocaleDateString()}`;
                }
                body.classList.add('premium-theme');
            } else {
                badge.innerText = 'PLAN BASICO';
                badge.className = 'bg-slate-400 text-white text-[10px] font-black px-2 py-0.5 rounded-full';
                badge.title = '';
                body.classList.remove('premium-theme');
            }
        }

        if (premiumBenefits) premiumBenefits.classList.toggle('hidden', !premiumActivo);
        if (basicBenefits) basicBenefits.classList.toggle('hidden', premiumActivo);

        if (upgradeBtn) {
            if (premiumActivo) {
                upgradeBtn.textContent = 'Premium Activo';
                upgradeBtn.disabled = true;
                upgradeBtn.classList.add('opacity-60', 'cursor-not-allowed');
                cerrarModalPremium();
            } else {
                upgradeBtn.textContent = 'Actualizar a Premium';
                upgradeBtn.disabled = false;
                upgradeBtn.classList.remove('opacity-60', 'cursor-not-allowed');
            }
        }
    }

    function abrirModalPremium() {
        if (premiumActivo) {
            mostrarNotificacion('Ya tienes Premium activo', 'info');
            return;
        }

        const modal = document.getElementById('modal-premium');
        if (modal) modal.classList.remove('hidden');
    }

    function cerrarModalPremium() {
        const modal = document.getElementById('modal-premium');
        if (modal) modal.classList.add('hidden');
    }

    async function crearIntentoPremium() {
        const userId = obtenerPremiumUserId();
        const response = await fetch(`${PREMIUM_BACKEND_URL}/api/premium/create-intent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });

        if (!response.ok) {
            let message = 'No se pudo crear el intento de pago';
            try {
                const payload = await response.json();
                if (payload?.message) message = payload.message;
            } catch (_e) {
                const errorText = await response.text();
                if (errorText) message = errorText;
            }
            throw new Error(message);
        }

        const payload = await response.json();
        if (!payload?.ok || !payload?.intent) {
            throw new Error('Respuesta invalida del backend de pagos');
        }

        return payload.intent;
    }

    async function confirmarPremiumConBackend(transactionId) {
        const userId = obtenerPremiumUserId();
        const response = await fetch(`${PREMIUM_BACKEND_URL}/api/premium/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactionId, userId })
        });

        if (!response.ok) {
            let message = 'No se pudo confirmar el pago';
            try {
                const payload = await response.json();
                if (payload?.message) message = payload.message;
            } catch (_e) {
                const errorText = await response.text();
                if (errorText) message = errorText;
            }
            throw new Error(message);
        }

        const payload = await response.json();
        if (!payload?.ok || !payload?.approved) {
            throw new Error(`Pago no aprobado (${payload?.status || 'desconocido'})`);
        }

        premiumActivo = true;
        premiumUntil = payload?.premiumUntil || '';
        localStorage.setItem('vitalMarketPremium', 'true');
        if (premiumUntil) {
            localStorage.setItem('vitalMarketPremiumUntil', premiumUntil);
        }
        actualizarEstadoPremiumUI();
        cerrarModalPremium();
        mostrarNotificacion('Pago aprobado y Premium activado', 'success');
    }

    async function activarPremiumModoPrueba() {
        const userId = obtenerPremiumUserId();
        const response = await fetch(`${PREMIUM_BACKEND_URL}/api/premium/dev-activate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });

        if (!response.ok) {
            let message = 'No se pudo activar premium de prueba';
            try {
                const payload = await response.json();
                if (payload?.message) message = payload.message;
            } catch (_e) {
                const errorText = await response.text();
                if (errorText) message = errorText;
            }
            throw new Error(message);
        }

        const payload = await response.json();
        premiumActivo = true;
        premiumUntil = payload?.premiumUntil || '';
        localStorage.setItem('vitalMarketPremium', 'true');
        if (premiumUntil) {
            localStorage.setItem('vitalMarketPremiumUntil', premiumUntil);
        }
        actualizarEstadoPremiumUI();
        cerrarModalPremium();
        mostrarNotificacion('Premium de prueba activado', 'success');
    }

    async function leerPremiumDesdeFirebaseCliente() {
        if (!database) return null;

        try {
            const userId = obtenerPremiumUserId();
            const snapshot = await database.ref(`premiumUsers/${userId}/profile`).once('value');
            return snapshot.val();
        } catch (error) {
            console.warn('No se pudo leer premium desde Firebase cliente:', error?.message || error);
            return null;
        }
    }

    async function leerPremiumDesdeBackend() {
        try {
            const userId = obtenerPremiumUserId();
            const response = await fetch(`${PREMIUM_BACKEND_URL}/api/premium/status/${encodeURIComponent(userId)}`);
            if (!response.ok) return null;
            return response.json();
        } catch (_error) {
            return null;
        }
    }

    async function sincronizarEstadoPremium() {
        const perfilFirebase = await leerPremiumDesdeFirebaseCliente();

        if (perfilFirebase) {
            premiumUntil = perfilFirebase.premiumUntil || '';
            premiumActivo = Boolean(perfilFirebase.active) && premiumSigueVigente(premiumUntil);
            localStorage.setItem('vitalMarketPremium', String(premiumActivo));
            if (premiumUntil) localStorage.setItem('vitalMarketPremiumUntil', premiumUntil);
            actualizarEstadoPremiumUI();
            return;
        }

        const estadoBackend = await leerPremiumDesdeBackend();
        if (estadoBackend?.ok) {
            premiumUntil = estadoBackend.premiumUntil || '';
            premiumActivo = Boolean(estadoBackend.active) && premiumSigueVigente(premiumUntil);
            localStorage.setItem('vitalMarketPremium', String(premiumActivo));
            if (premiumUntil) localStorage.setItem('vitalMarketPremiumUntil', premiumUntil);
            actualizarEstadoPremiumUI();
            return;
        }

        // Fallback local para modo offline
        premiumActivo = premiumSigueVigente(premiumUntil) && premiumActivo;
        localStorage.setItem('vitalMarketPremium', String(premiumActivo));
        actualizarEstadoPremiumUI();
    }

    async function procesarPagoPremium() {
        if (premiumActivo) {
            mostrarNotificacion('Ya tienes Premium activo', 'info');
            return;
        }

        try {
            const intent = await crearIntentoPremium();

            if (intent?.devMode) {
                await activarPremiumModoPrueba();
                return;
            }

            if (typeof WidgetCheckout === 'undefined') {
                mostrarNotificacion('No cargo el widget de pago. Recarga la pagina.', 'info');
                return;
            }

            const checkout = new WidgetCheckout({
                currency: intent.currency,
                amountInCents: intent.amountInCents,
                reference: intent.reference,
                publicKey: intent.publicKey,
                signature: { integrity: intent.signature },
                redirectUrl: intent.redirectUrl,
                customerData: {
                    fullName: 'Cliente Vital Market'
                }
            });

            checkout.open(async (result) => {
                const transaction = result?.transaction;
                if (!transaction?.id) {
                    mostrarNotificacion('Transaccion cancelada o incompleta', 'info');
                    return;
                }

                if (transaction?.status !== 'APPROVED') {
                    mostrarNotificacion(`Estado de pago: ${transaction.status || 'PENDIENTE'}`, 'info');
                    return;
                }

                try {
                    await confirmarPremiumConBackend(transaction.id);
                } catch (error) {
                    mostrarNotificacion('Error confirmando pago en backend', 'info');
                    console.error(error);
                }
            });
        } catch (error) {
            const msg = error?.message || 'No se pudo iniciar el pago real. Revisa backend/llaves.';
            mostrarNotificacion(msg, 'info');
            console.error(error);
        }
    }

    // ============================================
    // 3. FUNCION PARA CARGAR DATOS DESDE FIREBASE
    // ============================================
    async function cargarDatos() {
        if (firebaseInicializado && database) {
            try {
                const snapshotInventario = await database.ref('inventario').once('value');
                const dataInventario = snapshotInventario.val();
                const snapshotRaiz = await database.ref().once('value');
                const dataRaiz = snapshotRaiz.val() || {};

                if (dataInventario && typeof dataInventario === 'object') {
                    inventarioActual = normalizarInventario(dataInventario);
                    await completarImagenesCatalogoSiFaltan();
                    guardarInventarioCacheLocal(inventarioActual);
                    console.log('Datos cargados desde Firebase');

                    // Si todavia existen llaves legacy en raiz, las migra y limpia.
                    await migrarInventarioLegacySiExiste(dataRaiz, inventarioActual);
                } else {
                    const cacheLocal = cargarInventarioCacheLocal();
                    inventarioActual = normalizarInventario(cacheLocal || datosLocales.inventario);
                    console.warn('No se encontro inventario en Firebase; se muestran datos locales/cache sin sobrescribir la nube');

                    // Si la raiz tenia formato legacy sin inventario, migra a la estructura nueva.
                    if (tieneLlavesLegacyEnRaiz(dataRaiz)) {
                        inventarioActual = normalizarInventario(dataRaiz);
                        await migrarInventarioLegacySiExiste(dataRaiz, inventarioActual);
                    }

                    await completarImagenesCatalogoSiFaltan();
                }
            } catch (error) {
                console.error('Error al cargar desde Firebase:', error);
                const cacheLocal = cargarInventarioCacheLocal();
                inventarioActual = normalizarInventario(cacheLocal || datosLocales.inventario);
                await completarImagenesCatalogoSiFaltan();
            }

            if (!inventarioSuscrito) {
                inventarioSuscrito = true;
                database.ref('inventario').on('value', (snapshotInventario) => {
                    const dataInventario = snapshotInventario.val();
                    if (!dataInventario || typeof dataInventario !== 'object') {
                        return;
                    }
                    inventarioActual = normalizarInventario(dataInventario);
                    guardarInventarioCacheLocal(inventarioActual);
                    actualizarInterfazCompleta();
                });
            }
        } else {
            const cacheLocal = cargarInventarioCacheLocal();
            inventarioActual = normalizarInventario(cacheLocal || datosLocales.inventario);
            await completarImagenesCatalogoSiFaltan();
            console.log('Usando datos locales/cache');
        }

        actualizarInterfazCompleta();
    }

    // ============================================
    // 4. FUNCION PARA GUARDAR EN FIREBASE
    // ============================================
    async function guardarEnFirebase() {
        if (!firebaseInicializado || !database) return;

        guardadoInventarioPendiente = true;
        if (guardandoInventario) return;

        guardandoInventario = true;

        try {
            while (guardadoInventarioPendiente) {
                guardadoInventarioPendiente = false;
                const snapshotInventario = JSON.parse(JSON.stringify(inventarioActual));
                await database.ref('inventario').set(snapshotInventario);
                guardarInventarioCacheLocal(snapshotInventario);
            }

            console.log('Datos guardados en Firebase');
        } catch (error) {
            console.error('Error al guardar:', error);
        } finally {
            guardandoInventario = false;
        }
    }

    async function guardarCambiosProductoEnFirebase(productoId, cambios) {
        if (!productoId || !cambios || typeof cambios !== 'object') return;

        const productoActual = inventarioActual[productoId] || {};
        const productoFusionado = { ...productoActual, ...cambios };
        inventarioActual[productoId] = productoFusionado;
        guardarInventarioCacheLocal(inventarioActual);

        if (!firebaseInicializado || !database) return;

        try {
            await database.ref(`inventario/${productoId}`).update(cambios);
            console.log(`Cambios guardados para ${productoId}`);
        } catch (error) {
            console.error(`Error guardando cambios de ${productoId}:`, error);
        }
    }

    async function sincronizarInventarioAhora() {
        if (!firebaseInicializado || !database) {
            mostrarNotificacion('Sincronizacion no disponible en modo offline', 'info');
            return;
        }

        try {
            const snapshot = await database.ref('inventario').once('value');
            const dataInventario = snapshot.val() || {};
            inventarioActual = normalizarInventario(dataInventario);
            guardarInventarioCacheLocal(inventarioActual);
            actualizarInterfazCompleta();
            mostrarNotificacion('Inventario sincronizado desde Firebase', 'success');
        } catch (error) {
            console.error('Error sincronizando inventario:', error);
            mostrarNotificacion('No se pudo sincronizar inventario', 'info');
        }
    }

    // ============================================
    // 5. FUNCIONES DE ACTUALIZACION DE UI
    // ============================================
    function actualizarInterfazCompleta() {
        actualizarProductosRapidos();
        actualizarListaProductos();
        actualizarInventarioCompleto();
        actualizarDashboard();
        actualizarStockCritico();
        evaluarVencimientos();
        evaluarAlertasStock();
    }

    function actualizarProductosRapidos() {
        const container = document.getElementById('quick-products');
        if (!container) return;

        const productosRapidos = Object.entries(inventarioActual).slice(0, 2);
        container.innerHTML = productosRapidos.map(([id, prod]) => `
            ${(() => {
                const semaforo = obtenerSemaforoStock(prod.stock);
                const imagenUrl = resolverImagenProducto(prod);
                return `
            <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <img src="${imagenUrl}" alt="${prod.nombre}" data-img-src="${imagenUrl}" data-img-name="${prod.nombre}" loading="lazy" onerror="this.onerror=null;this.src='${IMAGEN_PLACEHOLDER}'" class="producto-imagen-click cursor-zoom-in w-full h-28 rounded-lg object-contain bg-white border border-slate-200 mb-2 p-1">
                <p class="font-bold text-slate-800 text-sm line-clamp-2 mb-1">${prod.nombre}</p>
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-slate-600">${prod.stock} unidades</span>
                    <span class="text-[10px] font-bold ${semaforo.colorFondo} px-2 py-0.5 rounded whitespace-nowrap">
                        ${semaforo.etiqueta}
                    </span>
                </div>
            </div>
        `;
            })()}
        `).join('');
    }

    function actualizarListaProductos() {
        const container = document.getElementById('lista-productos');
        if (!container) return;

        const productos = Object.entries(inventarioActual).map(([id, prod]) => ({
            id,
            ...prod
        }));

        const busqueda = document.getElementById('buscar-productos')?.value.toLowerCase() || '';
        const categoriaActual = categoriaFiltro || 'todos';

        let filtrados = productos;
        // Evitar duplicados por ID
        const idsUnicos = new Set();
        filtrados = filtrados.filter(p => {
            if (idsUnicos.has(p.id)) return false;
            idsUnicos.add(p.id);
            return true;
        });
        // Búsqueda por nombre desde la lupa de botiquín
        const busquedaBotiquin = document.getElementById('buscar-botiquin')?.value.toLowerCase() || '';
        if (busquedaBotiquin) {
            filtrados = filtrados.filter(p => (p.nombre || '').toLowerCase().includes(busquedaBotiquin));
        }
        if (busqueda) {
            filtrados = filtrados.filter(p => (p.nombre || '').toLowerCase().includes(busqueda));
        }
        if (categoriaActual !== 'todos') {
            filtrados = filtrados.filter(p => p.categoria === categoriaActual);
        }
        // Filtrar productos vencidos
        filtrados = filtrados.filter(p => {
            const dias = diasHastaVencimiento(p.vence);
            return dias === null || dias >= 0;
        });
// Evento para buscar en botiquín
// Lógica para mostrar métodos de pago al pulsar Probar Premium
const btnProbarPremium = document.getElementById('probar-premium-btn');
if (btnProbarPremium) {
    btnProbarPremium.addEventListener('click', () => {
        if (!clienteSesion?.uid) {
            mostrarNotificacion('Debes iniciar sesión para activar premium', 'info');
            abrirModalAccesoCliente();
            return;
        }
        document.getElementById('modal-metodos-pago')?.classList.remove('hidden');
    });
}

document.getElementById('cerrar-modal-pago')?.addEventListener('click', () => {
    document.getElementById('modal-metodos-pago')?.classList.add('hidden');
});

// Simulación de pago (pruebas)
document.getElementById('pago-dev')?.addEventListener('click', async () => {
    if (!clienteSesion?.uid) {
        mostrarNotificacion('Debes iniciar sesión para activar premium', 'info');
        return;
    }
    try {
        const resp = await fetch(`${PREMIUM_BACKEND_URL}/api/premium/dev-activate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: clienteSesion.uid })
        });
        const data = await resp.json();
        if (data.ok && data.approved) {
            localStorage.setItem('vitalMarketPremium', 'true');
            localStorage.setItem('vitalMarketPremiumUntil', data.premiumUntil);
            premiumActivo = true;
            premiumUntil = data.premiumUntil;
            actualizarEstadoPremiumUI && actualizarEstadoPremiumUI();
            mostrarNotificacion('¡Ahora eres usuario Premium!', 'success');
            document.getElementById('modal-metodos-pago')?.classList.add('hidden');
        } else {
            mostrarNotificacion('No se pudo activar premium', 'error');
        }
    } catch (e) {
        mostrarNotificacion('Error al activar premium', 'error');
    }
});

// Pago real con Wompi (redirección o widget)
document.getElementById('pago-wompi')?.addEventListener('click', async () => {
    if (!clienteSesion?.uid) {
        mostrarNotificacion('Debes iniciar sesión para activar premium', 'info');
        return;
    }
    try {
        const resp = await fetch(`${PREMIUM_BACKEND_URL}/api/premium/create-intent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: clienteSesion.uid })
        });
        const data = await resp.json();
        if (data.ok && data.intent && data.intent.redirectUrl) {
            window.location.href = data.intent.redirectUrl;
        } else {
            mostrarNotificacion('No se pudo iniciar el pago', 'error');
        }
    } catch (e) {
        mostrarNotificacion('Error al iniciar pago', 'error');
    }
});
document.getElementById('buscar-botiquin')?.addEventListener('input', () => {
    actualizarListaProductos();
});

        const orden = document.getElementById('ordenar-productos')?.value || 'nombre';
        if (orden === 'precio-menor') {
            filtrados.sort((a, b) => a.precio - b.precio);
        } else if (orden === 'precio-mayor') {
            filtrados.sort((a, b) => b.precio - a.precio);
        } else {
            filtrados.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
        }

        const resultadosSpan = document.getElementById('resultados-busqueda');
        if (resultadosSpan) {
            if (busqueda || categoriaActual !== 'todos') {
                resultadosSpan.classList.remove('hidden');
                resultadosSpan.textContent = filtrados.length;
            } else {
                resultadosSpan.classList.add('hidden');
            }
        }

        const productosVisibles = document.getElementById('productos-visibles');
        if (productosVisibles) productosVisibles.textContent = filtrados.length;

        container.innerHTML = filtrados.map(prod => {
            const semaforo = obtenerSemaforoStock(prod.stock);
            const imagenUrl = resolverImagenProducto(prod);
            return `
            <div class="bg-white rounded-2xl p-3 border-t-4 ${semaforo.colorBorde} shadow-sm product-card">
                <img src="${imagenUrl}" alt="${prod.nombre}" data-img-src="${imagenUrl}" data-img-name="${prod.nombre}" loading="lazy" onerror="this.onerror=null;this.src='${IMAGEN_PLACEHOLDER}'" class="producto-imagen-click cursor-zoom-in w-full h-28 rounded-xl object-contain bg-white border border-slate-200 p-1 mb-2">
                <h3 class="font-bold text-slate-800 text-sm leading-tight line-clamp-2 min-h-[2.25rem]">${prod.nombre}</h3>
                <p class="text-[10px] text-slate-500 mt-0.5 capitalize">${prod.categoria || 'medicamento'}</p>
                <div class="flex items-center justify-between mt-1">
                    <p class="text-xs font-black text-primary">$${prod.precio.toLocaleString()}</p>
                    <span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold ${semaforo.colorFondo}">${semaforo.etiqueta}</span>
                </div>
                <p class="text-[11px] font-bold ${semaforo.colorTexto} mt-1">Stock: ${prod.stock}</p>
                <div class="grid grid-cols-2 gap-1.5 mt-2">
                    <button onclick="agregarAlCarrito('${prod.id}')" class="bg-primary text-white font-bold py-1.5 rounded-lg text-[11px] shadow-sm hover:bg-[#004488] transition flex items-center justify-center gap-1">
                        <span class="material-symbols-outlined text-xs">add</span> Agregar
                    </button>
                    <button onclick="verDetallesProducto('${prod.id}')" class="bg-slate-50 text-primary font-bold py-1.5 rounded-lg text-[11px] border border-slate-200 hover:bg-slate-100 transition">
                        Detalles
                    </button>
                </div>
            </div>
        `;
        }).join('');
    }

    function actualizarInventarioCompleto() {
        const container = document.getElementById('inventario-completo');
        if (!container) return;

        const busquedaPanel = (document.getElementById('buscar-inventario-panel')?.value || '').trim().toLowerCase();
        const totalGeneral = Object.keys(inventarioActual).length;
        const productos = Object.entries(inventarioActual)
            .filter(([_, prod]) => {
                if (!busquedaPanel) return true;
                return (prod.nombre || '').toLowerCase().includes(busquedaPanel);
            })
            .sort((a, b) => (a[1]?.nombre || '').localeCompare(b[1]?.nombre || ''));
        const totalProductos = productos.length;

        const productosCount = document.getElementById('productos-count');
        if (productosCount) productosCount.textContent = busquedaPanel ? `${totalProductos} de ${totalGeneral}` : `${totalProductos} productos`;

        container.innerHTML = productos.map(([id, prod]) => {
            const semaforo = obtenerSemaforoStock(prod.stock);
            const fechaVence = prod.vence || '';
            const imagenUrl = resolverImagenProducto(prod);
            return `
                <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h4 class="font-bold text-slate-800 text-lg mb-3">${prod.nombre}</h4>
                    
                    <div class="flex gap-4 mb-4">
                        <div class="flex flex-col items-center gap-2">
                            <img src="${imagenUrl}" alt="${prod.nombre}" data-img-src="${imagenUrl}" data-img-name="${prod.nombre}" loading="lazy" onerror="this.onerror=null;this.src='${IMAGEN_PLACEHOLDER}'" class="producto-imagen-click cursor-zoom-in w-28 h-28 rounded-lg object-contain border-2 border-slate-300 bg-white p-1">
                            <label class="text-xs font-bold text-primary cursor-pointer hover:underline">
                                📷 Subir imagen
                                <input type="file" id="file-imagen-${id}" accept="image/*" class="hidden" onchange="subirImagenProducto('${id}', this)">
                            </label>
                        </div>
                        
                        <div class="flex-1 space-y-3">
                            <div class="flex items-center gap-3">
                                <div>
                                    <p class="text-xs text-slate-500 font-semibold uppercase">Stock</p>
                                    <p class="text-2xl font-bold text-slate-700">${prod.stock}</p>
                                </div>
                                <span class="px-3 py-1 rounded-lg font-bold text-xs uppercase bg-gradient-to-r ${semaforo.colorFondo}">
                                    ${semaforo.etiqueta}
                                </span>
                            </div>
                            
                            <div>
                                <p class="text-xs text-slate-500 font-semibold uppercase mb-1">Vencimiento</p>
                                <p class="text-sm font-semibold text-slate-700">${prod.vence || 'N/A'}</p>
                            </div>
                            
                            <div>
                                <p class="text-xs text-slate-500 font-semibold uppercase mb-1">Categoría</p>
                                <p class="text-sm font-semibold text-slate-700 capitalize">${prod.categoria || 'general'}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="space-y-2 pt-3 border-t border-slate-200">
                        <div class="flex gap-2">
                            <input
                                type="number"
                                id="numero-stock-${id}"
                                min="0"
                                step="1"
                                value="${prod.stock}"
                                placeholder="Stock"
                                class="flex-1 border border-slate-300 rounded-lg px-2 py-2 text-sm font-bold text-slate-700">
                            <button onclick="confirmarStockManual('${id}')" class="bg-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-[#004488] transition text-sm">OK</button>
                        </div>
                        
                        <div class="flex gap-2">
                            <input type="date" id="vence-${id}" value="${fechaVence}" class="flex-1 border border-slate-300 rounded-lg px-2 py-2 text-sm">
                            <button onclick="actualizarVencimiento('${id}')" class="bg-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-[#004488] transition text-sm">Guardar</button>
                        </div>
                        
                        <button onclick="eliminarProducto('${id}')" class="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold transition text-sm">
                            🗑️ Eliminar Producto
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        if (productos.length === 0) {
            container.innerHTML = '<div class="col-span-full bg-white rounded-xl border border-slate-200 p-4 text-sm text-slate-500">No se encontraron productos con esa busqueda.</div>';
        }
    }

    function diasHastaVencimiento(fecha) {
        if (!fecha) return null;
        const vence = new Date(`${fecha}T00:00:00`);
        if (Number.isNaN(vence.getTime())) return null;

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const diffMs = vence.getTime() - hoy.getTime();
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }

    function evaluarVencimientos() {
        const porVencer = [];
        const vencidos = [];

        Object.entries(inventarioActual).forEach(([id, producto]) => {
            const dias = diasHastaVencimiento(producto.vence);
            if (dias === null) return;

            if (dias < 0) {
                const key = `${id}:vencido:${producto.vence}`;
                if (!alertasVencimientoMostradas.has(key)) {
                    alertasVencimientoMostradas.add(key);
                    vencidos.push(`${producto.nombre}`);
                }
                return;
            }

            if (dias <= 30) {
                const key = `${id}:porvencer:${producto.vence}`;
                if (!alertasVencimientoMostradas.has(key)) {
                    alertasVencimientoMostradas.add(key);
                    porVencer.push(`${producto.nombre} (${dias} dias)`);
                }
            }
        });

        if (vencidos.length > 0) {
            mostrarNotificacion(`VENCIDOS: ${vencidos.slice(0, 2).join(', ')}`, 'info');
        }
        if (porVencer.length > 0) {
            mostrarNotificacion(`POR VENCER: ${porVencer.slice(0, 2).join(', ')}`, 'info');
        }
    }

    function actualizarDashboard() {
        const productos = Object.values(inventarioActual);
        const totalProductos = productos.length;
        const criticos = productos.filter(p => (Number(p.stock) || 0) <= 9).length;
        const vencidos = productos.filter((p) => {
            const dias = diasHastaVencimiento(p.vence);
            return dias !== null && dias < 0;
        }).length;
        const porVencer = productos.filter((p) => {
            const dias = diasHastaVencimiento(p.vence);
            return dias !== null && dias >= 0 && dias <= 30;
        }).length;

        const dashboardLowStock = document.getElementById('dashboard-low-stock');
        if (dashboardLowStock) dashboardLowStock.textContent = criticos.toString().padStart(2, '0');

        const dashboardTotal = document.getElementById('dashboard-total');
        if (dashboardTotal) dashboardTotal.textContent = String(totalProductos);

        const dashboardExpired = document.getElementById('dashboard-expired');
        if (dashboardExpired) dashboardExpired.textContent = vencidos.toString().padStart(2, '0');

        const dashboardExpiringSummary = document.getElementById('dashboard-expiring-summary');
        if (dashboardExpiringSummary) {
            dashboardExpiringSummary.textContent = `${porVencer} por vencer (30 dias)`;
        }

        const productosCount = document.getElementById('productos-count');
        if (productosCount) productosCount.textContent = `${totalProductos} productos`;
    }

    function obtenerNombresProductosCriticos() {
        return Object.values(inventarioActual)
            .filter((p) => (Number(p.stock) || 0) <= 9)
            .map((p) => `${p.nombre} (stock: ${p.stock})`);
    }

    function obtenerNombresProductosVencidos() {
        return Object.values(inventarioActual)
            .filter((p) => {
                const dias = diasHastaVencimiento(p.vence);
                return dias !== null && dias < 0;
            })
            .map((p) => `${p.nombre} (vence: ${p.vence || 'N/A'})`);
    }

    function abrirModalListadoProductos(titulo, items) {
        const modal = document.getElementById('modal-listado-productos');
        const tituloEl = document.getElementById('modal-listado-titulo');
        const itemsEl = document.getElementById('modal-listado-items');
        if (!modal || !tituloEl || !itemsEl) return;

        tituloEl.textContent = titulo;
        if (!Array.isArray(items) || items.length === 0) {
            itemsEl.innerHTML = '<li class="text-slate-500">No hay productos para mostrar.</li>';
        } else {
            itemsEl.innerHTML = items.map((item) => `<li class="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">${item}</li>`).join('');
        }

        modal.classList.remove('hidden');
    }

    function cerrarModalListadoProductos() {
        document.getElementById('modal-listado-productos')?.classList.add('hidden');
    }

    function actualizarStockCritico() {
        const productos = Object.entries(inventarioActual);
        const criticos = productos.filter(([_, p]) => (Number(p.stock) || 0) <= 9);

        if (criticos.length > 0) {
            console.log(`${criticos.length} productos con stock critico`);
        }
    }

    function evaluarAlertasStock() {
        Object.entries(inventarioActual).forEach(([id, producto]) => {
            const semaforo = obtenerSemaforoStock(producto.stock);
            const nivelAnterior = ultimoNivelStockNotificado[id];

            if (nivelAnterior === semaforo.nivel) return;

            ultimoNivelStockNotificado[id] = semaforo.nivel;

            if (semaforo.nivel === 'rojo') {
                mostrarNotificacion(`ALERTA: ${producto.nombre} en CRITICO (${producto.stock} unidades)`, 'info');
            } else if (semaforo.nivel === 'amarillo') {
                mostrarNotificacion(`Aviso: ${producto.nombre} por acabarse (${producto.stock} unidades)`, 'info');
            }
        });
    }

    // ============================================
    // 6. FUNCIONES DE CARRITO
    // ============================================
    let carrito = [];

    window.agregarAlCarrito = function(productoId) {
        const producto = inventarioActual[productoId];
        if (!producto) return;

        if (producto.stock <= 0) {
            alert('Producto sin stock disponible');
            return;
        }

        const itemExistente = carrito.find(i => i.id === productoId);
        if (itemExistente) {
            if (itemExistente.cantidad + 1 > producto.stock) {
                alert('No hay suficiente stock');
                return;
            }
            itemExistente.cantidad++;
        } else {
            carrito.push({
                id: productoId,
                nombre: producto.nombre,
                precio: producto.precio,
                cantidad: 1,
                stock: producto.stock
            });
        }

        actualizarContadorCarrito();
        mostrarNotificacion(`${producto.nombre} agregado al carrito`, 'success');
    };

    function actualizarContadorCarrito() {
        const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
        const contador = document.getElementById('carrito-contador');
        if (contador) {
            contador.textContent = totalItems;
            contador.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    }

    function mostrarNotificacion(mensaje, tipo = 'info') {
        const notificacion = document.createElement('div');
        notificacion.className = `fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg animate-fade-in ${
            tipo === 'success' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
        }`;
        notificacion.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="material-symbols-outlined">${tipo === 'success' ? 'check_circle' : 'info'}</span>
                <span>${mensaje}</span>
            </div>
        `;
        document.body.appendChild(notificacion);
        setTimeout(() => notificacion.remove(), 3000);
    }

    function mostrarCarrito() {
        if (!clienteSesion?.email) {
            abrirModalAccesoCliente();
            mostrarNotificacion('Inicia sesion de cliente para continuar', 'info');
            return;
        }

        const modal = document.getElementById('modal-carrito');
        const carritoVacio = document.getElementById('carrito-vacio');
        const carritoItems = document.getElementById('carrito-items');
        const carritoTotalContainer = document.getElementById('carrito-total-container');
        const itemsContainer = document.getElementById('carrito-items');

        if (!itemsContainer) return;

        if (carrito.length === 0) {
            if (carritoVacio) carritoVacio.classList.remove('hidden');
            if (carritoItems) carritoItems.classList.add('hidden');
            if (carritoTotalContainer) carritoTotalContainer.classList.add('hidden');
        } else {
            carrito = carrito.filter(item => Boolean(inventarioActual[item.id]));
            carrito.forEach(item => {
                const stockVigente = Number(inventarioActual[item.id]?.stock) || 0;
                item.stock = stockVigente;
                if (item.cantidad > stockVigente) {
                    item.cantidad = Math.max(1, stockVigente);
                }
            });
            carrito = carrito.filter(item => item.stock > 0 && item.cantidad > 0);

            if (carritoVacio) carritoVacio.classList.add('hidden');
            if (carritoItems) carritoItems.classList.remove('hidden');
            if (carritoTotalContainer) carritoTotalContainer.classList.remove('hidden');

            let total = 0;
            itemsContainer.innerHTML = carrito.map(item => {
                total += item.precio * item.cantidad;
                return `
                    <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                        <div>
                            <p class="font-bold text-slate-800">${item.nombre}</p>
                            <p class="text-sm text-slate-500">$${item.precio.toLocaleString()} c/u</p>
                        </div>
                        <div class="flex items-center gap-3">
                            <button onclick="cambiarCantidad('${item.id}', -1)" class="bg-slate-200 rounded-full w-8 h-8 flex items-center justify-center">-</button>
                            <span class="font-bold">${item.cantidad}</span>
                            <button onclick="cambiarCantidad('${item.id}', 1)" class="bg-slate-200 rounded-full w-8 h-8 flex items-center justify-center">+</button>
                            <button onclick="eliminarDelCarrito('${item.id}')" class="text-red-500">
                                <span class="material-symbols-outlined">delete</span>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            const totalSpan = document.getElementById('carrito-total');
            if (totalSpan) totalSpan.textContent = `$${total.toLocaleString()}`;
        }

        const nombreInput = document.getElementById('entrega-nombre');
        const correoInput = document.getElementById('entrega-correo');
        if (nombreInput && !nombreInput.value.trim()) nombreInput.value = clienteSesion.nombre || '';
        if (correoInput && !correoInput.value.trim()) correoInput.value = clienteSesion.email || '';

        if (modal) modal.classList.remove('hidden');
    }

    window.cambiarCantidad = function(productoId, cambio) {
        const item = carrito.find(i => i.id === productoId);
        if (item) {
            const nuevaCantidad = item.cantidad + cambio;
            const stockVigente = Number(inventarioActual[item.id]?.stock) || 0;
            if (nuevaCantidad <= 0) {
                eliminarDelCarrito(productoId);
            } else if (nuevaCantidad <= stockVigente) {
                item.cantidad = nuevaCantidad;
                item.stock = stockVigente;
                mostrarCarrito();
                actualizarContadorCarrito();
            } else {
                alert('No hay suficiente stock');
            }
        }
    };

    window.eliminarDelCarrito = function(productoId) {
        carrito = carrito.filter(i => i.id !== productoId);
        actualizarContadorCarrito();
        mostrarCarrito();
    };

    async function descontarStockPedido(itemsPedido) {
        const faltantes = [];
        const nuevosStocks = {};

        itemsPedido.forEach(item => {
            const id = item.id;
            const cantidad = Math.max(0, Math.floor(Number(item.cantidad) || 0));
            const producto = inventarioActual[id];

            if (!producto) {
                faltantes.push(`${id} (ya no disponible)`);
                return;
            }

            const stockActual = Math.max(0, Math.floor(Number(producto.stock) || 0));
            if (cantidad > stockActual) {
                faltantes.push(`${producto.nombre}: stock ${stockActual}`);
                return;
            }

            nuevosStocks[id] = stockActual - cantidad;
        });

        if (faltantes.length > 0) {
            throw new Error(`Stock insuficiente en: ${faltantes.join(', ')}`);
        }

        Object.entries(nuevosStocks).forEach(([id, stockNuevo]) => {
            if (inventarioActual[id]) {
                inventarioActual[id].stock = stockNuevo;
            }
        });

        guardarInventarioCacheLocal(inventarioActual);
        actualizarInterfazCompleta();

        if (firebaseInicializado && database) {
            const promesas = Object.entries(nuevosStocks).map(([id, stockNuevo]) =>
                guardarCambiosProductoEnFirebase(id, { stock: stockNuevo })
            );
            await Promise.all(promesas);
        }
    }

    async function confirmarPedido() {
        if (carrito.length === 0) return;
        if (!clienteSesion?.email) {
            abrirModalAccesoCliente();
            mostrarNotificacion('Inicia sesion para confirmar tu pedido', 'info');
            return;
        }

        const entrega = obtenerDatosEntregaFormulario();
        const correoValido = /^\S+@\S+\.\S+$/.test(entrega.correo);
        if (!entrega.nombre || !entrega.correo || !entrega.direccion) {
            mostrarNotificacion('Completa nombre, correo y direccion de entrega', 'info');
            return;
        }
        if (!correoValido) {
            mostrarNotificacion('Ingresa un correo valido para la entrega', 'info');
            return;
        }

        try {
            await descontarStockPedido(carrito);
        } catch (error) {
            mostrarNotificacion(error?.message || 'No se pudo confirmar por stock insuficiente', 'info');
            mostrarCarrito();
            return;
        }

        const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        const ahora = new Date();
        const eta = new Date(ahora.getTime() + 35 * 60 * 1000);
        const codigoPedido = `VM-${Date.now().toString().slice(-6)}`;
        const coordsSeguimiento = obtenerCoordenadasSeguimiento({ codigo: codigoPedido });

        await guardarSeguimientoPedido({
            codigo: codigoPedido,
            creadoIso: ahora.toISOString(),
            etaIso: eta.toISOString(),
            ubicacion: entrega.direccion,
            lat: coordsSeguimiento.lat,
            lng: coordsSeguimiento.lng,
            clienteEmail: clienteSesion.email,
            entrega,
            total,
            items: carrito.map(item => ({ id: item.id, cantidad: item.cantidad }))
        });

        const horaCompra = ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        agregarNotificacionCentro({
            tipo: 'success',
            id: `compra_${codigoPedido}`,
            titulo: 'Fue exitosa tu compra',
            detalle: `Pedido ${codigoPedido} comprado a las ${horaCompra}.`,
            fechaIso: ahora.toISOString()
        });

        actualizarTarjetaSeguimiento();

        const pedidoResumen = document.getElementById('pedido-resumen');
        if (pedidoResumen) {
            pedidoResumen.innerHTML = `
                <p class="font-bold">Productos:</p>
                ${carrito.map(item => `<p>- ${item.nombre} x${item.cantidad} = $${(item.precio * item.cantidad).toLocaleString()}</p>`).join('')}
                <hr class="my-2">
                <p class="text-sm text-slate-600">Cliente: <span class="font-bold text-slate-800">${entrega.nombre}</span></p>
                <p class="text-sm text-slate-600">Correo: <span class="font-bold text-slate-800">${entrega.correo}</span></p>
                <p class="text-sm text-slate-600">Entrega en: <span class="font-bold text-slate-800">${entrega.direccion}${entrega.barrio ? `, ${entrega.barrio}` : ''}</span></p>
                <p class="text-sm text-slate-600">Codigo: <span class="font-bold text-slate-800">${codigoPedido}</span></p>
                <p class="text-sm text-slate-600">Llegada estimada: <span class="font-bold text-slate-800">${eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></p>
                <p class="font-bold">Total: $${total.toLocaleString()}</p>
                <p class="text-green-600 mt-2">Pedido confirmado</p>
            `;
        }

        const modalCarrito = document.getElementById('modal-carrito');
        if (modalCarrito) modalCarrito.classList.add('hidden');

        const modalPedido = document.getElementById('modal-pedido');
        if (modalPedido) modalPedido.classList.remove('hidden');

        carrito = [];
        actualizarContadorCarrito();
    }

    window.verDetallesProducto = function(productoId) {
        const producto = inventarioActual[productoId];
        if (producto) {
            alert(`Informacion\n${producto.nombre}\nStock: ${producto.stock} unidades\nPrecio: $${producto.precio.toLocaleString()}\nVence: ${producto.vence || 'N/A'}`);
        }
    };

    // ============================================
    // 7. FUNCIONES DE NAVEGACION
    // ============================================

    async function cargarMisCompras() {
        if (!clienteSesion?.uid) {
            console.log('No hay sesión de cliente');
            return;
        }

        const misComprasVacio = document.getElementById('mis-compras-vacio');
        const misComprasLista = document.getElementById('mis-compras-lista');

        if (!database) {
            mostrarNotificacion('Base de datos no disponible', 'info');
            return;
        }

        try {
            const pedidosRef = database.ref(`seguimientoPedido/${clienteSesion.uid}`);
            const snapshot = await pedidosRef.once('value');
            let pedidos = snapshot.val();

            if (!pedidos || Object.keys(pedidos).length === 0) {
                const activo = cargarSeguimientoPedido();
                if (!activo) {
                    misComprasVacio?.classList.remove('hidden');
                    misComprasLista?.classList.add('hidden');
                    return;
                }
                pedidos = {
                    [String(activo?.codigo || `VM-${Date.now()}`)]: {
                        ...activo,
                        creadoIso: activo?.creadoIso || new Date().toISOString(),
                        totalFinal: Number(activo?.total || 0),
                        itemsCantidad: Array.isArray(activo?.items)
                            ? activo.items.reduce((acc, item) => acc + Math.max(1, Number(item?.cantidad) || 0), 0)
                            : 0,
                        estado: obtenerEstadoPedido(activo?.etaIso).texto.toLowerCase()
                    }
                };
            }

            misComprasVacio?.classList.add('hidden');
            misComprasLista?.classList.remove('hidden');
            misComprasLista.innerHTML = '';

            // Ordenar pedidos por fecha descendente
            const pedidosArray = Object.entries(pedidos)
                .map(([id, data]) => ({ id, ...data }))
                .sort((a, b) => {
                    const fechaB = new Date(b.creadoIso || b.creado_iso || b.creado_fecha || 0).getTime();
                    const fechaA = new Date(a.creadoIso || a.creado_iso || a.creado_fecha || 0).getTime();
                    return fechaB - fechaA;
                });

            pedidosArray.forEach(pedido => {
                const fechaObj = new Date(pedido.creadoIso || pedido.creado_iso || pedido.creado_fecha || Date.now());
                const fecha = fechaObj.toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                const cantidadCalculada = Array.isArray(pedido.items)
                    ? pedido.items.reduce((acc, item) => acc + Math.max(1, Number(item?.cantidad) || 0), 0)
                    : 0;
                const itemsCantidad = Number(pedido.itemsCantidad || pedido.items_cantidad || cantidadCalculada || 0);
                const itemsText = itemsCantidad > 0 ? `${itemsCantidad} producto${itemsCantidad !== 1 ? 's' : ''}` : 'N/A';

                const totalNumero = Number(pedido.totalFinal ?? pedido.total_final ?? pedido.total ?? 0);
                const total = totalNumero > 0 ? `$${totalNumero.toLocaleString('es-CO')}` : '$0';

                const estadoPersistido = String(pedido.estado || '').toLowerCase();
                const estadoInfo = estadoPersistido === 'cancelado'
                    ? { texto: 'CANCELADO', clase: 'bg-red-100 text-red-700' }
                    : obtenerEstadoPedido(pedido.etaIso);
                const estado = estadoInfo.texto;

                const nombresProductos = Array.isArray(pedido.items)
                    ? pedido.items.map((item) => {
                        const id = String(item?.id || '').trim();
                        const nombreProducto = inventarioActual[id]?.nombre || id || 'Producto';
                        const cantidad = Math.max(1, Number(item?.cantidad) || 0);
                        return `${nombreProducto} x${cantidad}`;
                    })
                    : [];
                const productosTexto = nombresProductos.length > 0
                    ? nombresProductos.join(', ')
                    : 'Sin detalle de productos';

                const estadoNormalizado = estado.toLowerCase();
                const estiloBg = estadoNormalizado === 'entregado' ? 'bg-green-50 border-green-200' :
                                 estadoNormalizado === 'cancelado' ? 'bg-red-50 border-red-200' :
                                 estadoNormalizado === 'en preparacion' ? 'bg-amber-50 border-amber-200' :
                                 'bg-blue-50 border-blue-200';

                const estiloEstado = estadoNormalizado === 'entregado' ? 'text-green-700 bg-green-100' :
                                     estadoNormalizado === 'cancelado' ? 'text-red-700 bg-red-100' :
                                     estadoNormalizado === 'en preparacion' ? 'text-amber-700 bg-amber-100' :
                                     'text-blue-700 bg-blue-100';

                const html = `
                    <div class="border rounded-lg p-4 ${estiloBg}">
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <p class="font-bold text-slate-900">Orden #${pedido.codigo || 'N/A'}</p>
                                <p class="text-xs text-slate-600">${fecha}</p>
                            </div>
                            <span class="text-xs font-bold px-2 py-1 rounded ${estiloEstado}">
                                ${estado}
                            </span>
                        </div>
                        <div class="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <p class="text-slate-600 text-xs">Cantidad</p>
                                <p class="font-semibold">${itemsText}</p>
                            </div>
                            <div>
                                <p class="text-slate-600 text-xs">Total</p>
                                <p class="font-semibold text-primary">${total}</p>
                            </div>
                        </div>
                        <div class="mt-2">
                            <p class="text-slate-600 text-xs">Productos</p>
                            <p class="font-semibold text-slate-800">${productosTexto}</p>
                        </div>
                    </div>
                `;

                misComprasLista.insertAdjacentHTML('beforeend', html);
            });
        } catch (error) {
            console.error('Error cargando mis compras:', error);
            mostrarNotificacion('Error al cargar compras', 'error');
        }
    }

    window.cambiarPantalla = function(pantalla) {
        if (pantalla === 'panel' && !panelFarmaciaAutenticado) {
            abrirModalAccesoCliente();
            mostrarNotificacion('Inicia sesion como administrador para abrir el panel', 'info');
            return;
        }

        if (pantalla === 'mapa' && !clienteSesion?.email) {
            abrirModalAccesoCliente();
            mostrarNotificacion('Inicia sesion para ver tu entrega', 'info');
            return;
        }

        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.classList.add('hidden');
            section.classList.remove('section-active');
        });

        const targetSection = document.getElementById(`section-${pantalla}`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            targetSection.classList.add('section-active');
        }

        // Si cambias a Seguimiento (mapa), actualizar seguimiento y dejar historial listo.
        if (pantalla === 'mapa') {
            actualizarVistaMapaSeguimiento();
            sincronizarSeguimientoPedidoActual().then(() => {
                actualizarVistaMapaSeguimiento();
            });
            cargarMisCompras();
        }

        const navBtns = document.querySelectorAll('.nav-btn');
        const mapping = {
            home: 'nav-btn-home',
            botiquin: 'nav-btn-botiquin',
            mapa: 'nav-btn-mapa',
            panel: 'nav-btn-panel'
        };

        navBtns.forEach(btn => {
            btn.classList.add('text-slate-400');
            btn.classList.remove('text-primary');
        });

        const activeBtn = document.getElementById(mapping[pantalla]);
        if (activeBtn) {
            activeBtn.classList.add('text-primary');
            activeBtn.classList.remove('text-slate-400');
        }
    };

    function obtenerPantallaDesdeHash() {
        const hash = (window.location.hash || '').replace('#', '').trim().toLowerCase();
        const pantallasValidas = ['home', 'botiquin', 'mapa', 'panel'];
        return pantallasValidas.includes(hash) ? hash : 'home';
    }

    // ============================================
    // 8. EDICION DE STOCK GLOBAL
    // ============================================
    window.editarStock = async function(productoId, cambio) {
        if (inventarioActual[productoId]) {
            const nuevoStock = Math.max(0, inventarioActual[productoId].stock + cambio);
            inventarioActual[productoId].stock = nuevoStock;

            actualizarInterfazCompleta();
            await guardarCambiosProductoEnFirebase(productoId, { stock: nuevoStock });

            const cantidadAbs = Math.abs(cambio);
            const unidadTexto = cantidadAbs === 1 ? 'unidad' : 'unidades';
            mostrarNotificacion(`${inventarioActual[productoId].nombre}: ${cambio > 0 ? '+' : ''}${cambio} ${unidadTexto}`, 'success');
        }
    };

    window.confirmarStockManual = async function(productoId) {
        const producto = inventarioActual[productoId];
        const numero = document.getElementById(`numero-stock-${productoId}`);
        if (!producto || !numero) return;

        const nuevoStock = Number(numero.value);
        if (!Number.isFinite(nuevoStock) || nuevoStock < 0) {
            mostrarNotificacion('Ingresa un numero valido', 'info');
            return;
        }

        const stockAjustado = Math.max(0, Math.floor(nuevoStock));
        if (stockAjustado === producto.stock) {
            mostrarNotificacion('Sin cambios de stock', 'info');
            return;
        }

        inventarioActual[productoId].stock = stockAjustado;
        actualizarInterfazCompleta();
        await guardarCambiosProductoEnFirebase(productoId, { stock: stockAjustado });
        mostrarNotificacion(`${producto.nombre}: stock actualizado a ${stockAjustado}`, 'success');
    };

    window.actualizarVencimiento = async function(productoId) {
        const producto = inventarioActual[productoId];
        const input = document.getElementById(`vence-${productoId}`);
        if (!producto || !input) return;

        const nuevaFecha = input.value;
        if (!nuevaFecha) {
            mostrarNotificacion('Selecciona una fecha valida', 'info');
            return;
        }

        producto.vence = nuevaFecha;
        actualizarInterfazCompleta();
        await guardarCambiosProductoEnFirebase(productoId, { vence: nuevaFecha });

        const dias = diasHastaVencimiento(nuevaFecha);
        if (dias !== null && dias <= 30) {
            mostrarNotificacion(`${producto.nombre} vence en ${Math.max(0, dias)} dias`, 'info');
        } else {
            mostrarNotificacion(`Vencimiento actualizado para ${producto.nombre}`, 'success');
        }
    };

    window.subirImagenProducto = async function(productoId, inputElement) {
        const producto = inventarioActual[productoId];
        if (!producto || !inputElement.files.length) return;

        const archivo = inputElement.files[0];
        if (!archivo.type.startsWith('image/')) {
            mostrarNotificacion('Por favor sube una imagen valida', 'error');
            return;
        }

        if (archivo.size > 3000000) { // 3MB limit
            mostrarNotificacion('La imagen es muy grande (máx 3MB)', 'error');
            return;
        }

        mostrarNotificacion('Cargando imagen...', 'info');
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const imagenBase64 = e.target.result;
                producto.imagen = imagenBase64;
                actualizarInterfazCompleta();
                await guardarCambiosProductoEnFirebase(productoId, { imagen: imagenBase64 });
                mostrarNotificacion(`✅ Imagen de ${producto.nombre} actualizada`, 'success');
                console.log(`Imagen guardada para ${productoId}:`, imagenBase64.substring(0, 50) + '...');
            } catch (error) {
                mostrarNotificacion(`Error: no se pudo guardar la imagen`, 'error');
                console.error('Error subiendo imagen:', error);
            } finally {
                // Limpiar input
                inputElement.value = '';
            }
        };
        reader.onerror = () => {
            mostrarNotificacion('Error al leer la imagen', 'error');
        };
        reader.readAsDataURL(archivo);
    };

    // ============================================
    // 9. EXPORTAR A EXCEL
    // ============================================
    function obtenerFilasInventarioExportacion() {
        return Object.entries(inventarioActual).map(([id, p]) => ({
            id,
            nombre: p.nombre || '',
            stock: Number.isFinite(Number(p.stock)) ? Number(p.stock) : 0,
            precio: Number.isFinite(Number(p.precio)) ? Number(p.precio) : 0,
            categoria: p.categoria || '',
            vence: p.vence || 'N/A'
        }));
    }

    function exportarAExcel() {
        const filas = obtenerFilasInventarioExportacion();
        const fecha = new Date().toISOString().split('T')[0];

        if (typeof XLSX !== 'undefined') {
            const data = filas.map(item => ({
                ID: item.id,
                Nombre: item.nombre,
                Stock: item.stock,
                Precio: item.precio,
                Categoria: item.categoria,
                'Fecha Vencimiento': item.vence
            }));

            const worksheet = XLSX.utils.json_to_sheet(data);
            worksheet['!cols'] = [
                { wch: 14 },
                { wch: 30 },
                { wch: 10 },
                { wch: 12 },
                { wch: 16 },
                { wch: 18 }
            ];

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');
            XLSX.writeFile(workbook, `vital-market-inventario-${fecha}.xlsx`);
            mostrarNotificacion('Reporte exportado a Excel (.xlsx)', 'success');
            return;
        }

        const csv = [
            ['ID', 'Nombre', 'Stock', 'Precio', 'Categoria', 'Fecha Vencimiento'],
            ...filas.map(item => [item.id, item.nombre, item.stock, item.precio, item.categoria, item.vence])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vital-market-inventario-${fecha}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        mostrarNotificacion('Se exporto CSV como respaldo', 'info');
    }

    function exportarAPDF() {
        const filas = obtenerFilasInventarioExportacion();

        if (typeof window.jspdf === 'undefined') {
            mostrarNotificacion('No se pudo cargar la libreria PDF', 'info');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
        const fechaLocal = new Date().toLocaleString();
        const fechaArchivo = new Date().toISOString().split('T')[0];

        doc.setFontSize(16);
        doc.text('Vital Market - Inventario', 40, 42);
        doc.setFontSize(10);
        doc.text(`Generado: ${fechaLocal}`, 40, 60);

        const head = [['ID', 'Nombre', 'Stock', 'Precio', 'Categoria', 'Vencimiento']];
        const body = filas.map(item => [
            item.id,
            item.nombre,
            String(item.stock),
            `$${Number(item.precio || 0).toLocaleString()}`,
            item.categoria,
            item.vence
        ]);

        if (typeof doc.autoTable === 'function') {
            doc.autoTable({
                head,
                body,
                startY: 76,
                styles: { fontSize: 9, cellPadding: 5 },
                headStyles: { fillColor: [0, 51, 102] }
            });
        } else {
            let y = 84;
            doc.setFontSize(9);
            body.slice(0, 25).forEach(row => {
                doc.text(row.join(' | '), 40, y);
                y += 14;
            });
        }

        doc.save(`vital-market-inventario-${fechaArchivo}.pdf`);
        mostrarNotificacion('Reporte exportado a PDF', 'success');
    }

    // ============================================
    // 11. RESETEAR DATOS
    // ============================================
    async function resetearDatos() {
        if (confirm('Estas seguro? Esto restablecera todos los stocks a los valores iniciales.')) {
            inventarioActual = JSON.parse(JSON.stringify(datosLocales.inventario));
            actualizarInterfazCompleta();
            await guardarEnFirebase();
            mostrarNotificacion('Datos restablecidos correctamente', 'success');
        }
    }

    // ============================================
    // 12. FUNCION DE TEST
    // ============================================
    window.testFirebase = function() {
        console.log('=== DATOS ACTUALES ===');
        console.log(inventarioActual);
        alert(`Datos cargados:\nTotal productos: ${Object.keys(inventarioActual).length}\nConexion Firebase: ${firebaseInicializado ? 'Activa' : 'Offline'}`);
    };

    // ============================================
    // 13. INICIALIZAR EVENTOS
    // ============================================
    let categoriaFiltro = 'todos';

    function inicializarEventos() {
        document.getElementById('btn-notificaciones')?.addEventListener('click', () => {
            renderizarCentroNotificaciones();
            document.getElementById('modal-notificaciones')?.classList.remove('hidden');
            marcarNotificacionesComoLeidas();
        });
        document.getElementById('cerrar-modal-notificaciones')?.addEventListener('click', () => {
            document.getElementById('modal-notificaciones')?.classList.add('hidden');
        });
        document.getElementById('modal-notificaciones')?.addEventListener('click', (event) => {
            if (event.target.id === 'modal-notificaciones') {
                document.getElementById('modal-notificaciones')?.classList.add('hidden');
            }
        });

        document.getElementById('btn-cliente-sesion')?.addEventListener('click', () => {
            // Si ya tiene sesión activa, pregunta si quiere cerrar sesión
            if (clienteSesion?.email) {
                if (confirm(`Ya tienes sesión iniciada como ${clienteSesion.nombre}. ¿Deseas cerrar sesión?`)) {
                    cerrarSesionCliente();
                }
            } else {
                abrirModalAccesoCliente();
            }
        });
        document.getElementById('cerrar-cliente-access')?.addEventListener('click', () => {
            cerrarModalAccesoCliente();
        });
        document.getElementById('cancelar-cliente-access')?.addEventListener('click', () => {
            cerrarModalAccesoCliente();
        });
        document.getElementById('confirmar-cliente-access')?.addEventListener('click', () => {
            autenticarAccesoCliente();
        });
        document.getElementById('cliente-access-password')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                autenticarAccesoCliente();
            }
        });
        document.getElementById('cerrar-sesion-cliente')?.addEventListener('click', () => {
            cerrarSesionCliente();
            cerrarModalAccesoCliente();
        });

        document.getElementById('nav-btn-home')?.addEventListener('click', (e) => {
            e.preventDefault();
            cambiarPantalla('home');
        });
        document.getElementById('nav-btn-botiquin')?.addEventListener('click', (e) => {
            e.preventDefault();
            cambiarPantalla('botiquin');
        });
        document.getElementById('nav-btn-mapa')?.addEventListener('click', (e) => {
            e.preventDefault();
            cambiarPantalla('mapa');
        });
        document.getElementById('btn-abrir-historial-compras')?.addEventListener('click', async () => {
            await cargarMisCompras();
            document.getElementById('modal-historial-compras')?.classList.remove('hidden');
        });
        document.getElementById('cerrar-historial-compras')?.addEventListener('click', () => {
            document.getElementById('modal-historial-compras')?.classList.add('hidden');
        });
        document.getElementById('modal-historial-compras')?.addEventListener('click', (event) => {
            if (event.target.id === 'modal-historial-compras') {
                document.getElementById('modal-historial-compras')?.classList.add('hidden');
            }
        });
        document.getElementById('nav-btn-panel')?.addEventListener('click', (e) => {
            e.preventDefault();
            cambiarPantalla('panel');
        });
        document.getElementById('btn-panel-logout')?.addEventListener('click', () => {
            cerrarSesionPanel();
        });

        document.getElementById('view-all-cabinet')?.addEventListener('click', (e) => {
            e.preventDefault();
            cambiarPantalla('botiquin');
        });

        document.getElementById('ver-carrito-btn')?.addEventListener('click', () => mostrarCarrito());
        document.getElementById('cerrar-carrito')?.addEventListener('click', () => {
            document.getElementById('modal-carrito')?.classList.add('hidden');
        });
        document.getElementById('checkout-btn')?.addEventListener('click', () => confirmarPedido());
        document.getElementById('cerrar-pedido')?.addEventListener('click', () => {
            document.getElementById('modal-pedido')?.classList.add('hidden');
        });
        document.getElementById('ver-seguimiento-pedido')?.addEventListener('click', () => {
            document.getElementById('modal-pedido')?.classList.add('hidden');
            irASeguimientoPedido();
        });

        document.addEventListener('click', (event) => {
            const img = event.target.closest('.producto-imagen-click');
            if (!img) return;

            const src = img.getAttribute('data-img-src') || img.getAttribute('src') || '';
            const nombre = img.getAttribute('data-img-name') || img.getAttribute('alt') || 'Producto';
            abrirVisorImagen(src, nombre);
        });

        document.getElementById('cerrar-modal-imagen')?.addEventListener('click', () => {
            cerrarVisorImagen();
        });
        document.getElementById('modal-imagen-producto')?.addEventListener('click', (event) => {
            if (event.target.id === 'modal-imagen-producto') {
                cerrarVisorImagen();
            }
        });
        document.getElementById('btn-seguimiento-mapa')?.addEventListener('click', () => {
            cambiarPantalla('mapa');
            actualizarVistaMapaSeguimiento();
        });

        document.getElementById('comprar-ahora-btn')?.addEventListener('click', () => {
            agregarAlCarrito('amoxicilina');
            cambiarPantalla('botiquin');
        });

        document.getElementById('upgrade-premium-btn')?.addEventListener('click', () => {
            abrirModalPremium();
        });

        document.getElementById('cerrar-premium')?.addEventListener('click', () => {
            cerrarModalPremium();
        });
        document.getElementById('cancelar-premium')?.addEventListener('click', () => {
            cerrarModalPremium();
        });
        document.getElementById('confirmar-premium')?.addEventListener('click', () => {
            procesarPagoPremium();
        });

        document.getElementById('buscar-productos')?.addEventListener('input', () => {
            actualizarListaProductos();
        });

        document.getElementById('ordenar-productos')?.addEventListener('change', () => {
            actualizarListaProductos();
        });

        document.querySelectorAll('.filtro-categoria').forEach(btn => {
            btn.addEventListener('click', () => {
                categoriaFiltro = btn.dataset.categoria;
                actualizarListaProductos();
            });
        });

        document.getElementById('buscar-inventario-panel')?.addEventListener('input', () => {
            actualizarInventarioCompleto();
        });

        document.getElementById('btn-ver-criticos')?.addEventListener('click', () => {
            abrirModalListadoProductos('Productos criticos', obtenerNombresProductosCriticos());
        });
        document.getElementById('btn-ver-vencidos')?.addEventListener('click', () => {
            abrirModalListadoProductos('Productos vencidos', obtenerNombresProductosVencidos());
        });
        document.getElementById('cerrar-modal-listado')?.addEventListener('click', () => {
            cerrarModalListadoProductos();
        });
        document.getElementById('modal-listado-productos')?.addEventListener('click', (event) => {
            if (event.target.id === 'modal-listado-productos') {
                cerrarModalListadoProductos();
            }
        });

        document.getElementById('btn-sync-inventario-top')?.addEventListener('click', async () => {
            await sincronizarInventarioAhora();
        });
        document.getElementById('btn-reset-db-top')?.addEventListener('click', () => resetearDatos());
        document.getElementById('btn-test-firebase-top')?.addEventListener('click', () => testFirebase());
        document.getElementById('btn-imprimir')?.addEventListener('click', () => {
            document.getElementById('modal-exportar')?.classList.remove('hidden');
        });
        document.getElementById('cerrar-modal-exportar')?.addEventListener('click', () => {
            document.getElementById('modal-exportar')?.classList.add('hidden');
        });
        document.getElementById('cancelar-modal-exportar')?.addEventListener('click', () => {
            document.getElementById('modal-exportar')?.classList.add('hidden');
        });
        document.getElementById('modal-exportar')?.addEventListener('click', (event) => {
            if (event.target.id === 'modal-exportar') {
                document.getElementById('modal-exportar')?.classList.add('hidden');
            }
        });
        document.getElementById('btn-imprimir-pagina')?.addEventListener('click', () => {
            document.getElementById('modal-exportar')?.classList.add('hidden');
            window.print();
        });
        document.getElementById('btn-exportar-pdf-modal')?.addEventListener('click', () => {
            document.getElementById('modal-exportar')?.classList.add('hidden');
            mostrarNotificacion('Generando PDF...', 'info');
            setTimeout(() => exportarAPDF(), 300);
        });
        document.getElementById('btn-exportar-excel-modal')?.addEventListener('click', () => {
            document.getElementById('modal-exportar')?.classList.add('hidden');
            mostrarNotificacion('Generando Excel...', 'info');
            setTimeout(() => exportarAExcel(), 300);
        });

        document.getElementById('filtro-fullcombo')?.addEventListener('click', () => {
            actualizarVistaMapaSeguimiento();
            mostrarNotificacion('Seguimiento de pedido actualizado', 'info');
        });
        document.getElementById('filtro-cercanos')?.addEventListener('click', () => {
            mostrarNotificacion('Google Maps fue removido de la interfaz', 'info');
        });
        document.getElementById('mapa-recargar')?.addEventListener('click', () => {
            actualizarVistaMapaSeguimiento();
            const data = cargarSeguimientoPedido();
            const codigo = data?.codigo || 'SIN PEDIDO';
            mostrarNotificacion(`Seguimiento actualizado para ${codigo}`, 'info');
        });

        // Eventos para CRUD de productos en panel
        document.getElementById('btn-agregar-producto')?.addEventListener('click', () => {
            abrirModalCrearProducto();
        });
        document.getElementById('confirmar-crear-producto')?.addEventListener('click', () => {
            crearProductoNuevo();
        });
        document.getElementById('cancelar-crear-producto')?.addEventListener('click', () => {
            cerrarModalCrearProducto();
        });

        window.addEventListener('hashchange', () => {
            const pantallaHash = obtenerPantallaDesdeHash();
            cambiarPantalla(pantallaHash);
        });

        // Refrescar estado de pedidos automáticamente por tiempo (prep -> camino -> entregado).
        setInterval(async () => {
            if (!clienteSesion?.uid) return;
            if (autoSyncSeguimientoEnCurso) return;

            autoSyncSeguimientoEnCurso = true;

            try {
                await sincronizarSeguimientoPedidoActual();

                const pantallaActiva = obtenerPantallaDesdeHash();
                if (pantallaActiva === 'mapa') {
                    actualizarVistaMapaSeguimiento();
                }

                const modalHistorial = document.getElementById('modal-historial-compras');
                const historialVisible = modalHistorial && !modalHistorial.classList.contains('hidden');
                if (historialVisible) {
                    cargarMisCompras();
                }

                revisarPedidosEntregadosParaNotificar();
            } finally {
                autoSyncSeguimientoEnCurso = false;
            }
        }, 15000);
    }

    // ============================================
    // 14. INICIAR APLICACION
    // ============================================
    await cargarDatos();
    inicializarEventos();
    cargarNotificacionesPersistidas();
    cargarEntregadosNotificados();
    await sincronizarEstadoPremium();
    actualizarEstadoSesionClienteUI();
    iniciarEscuchaSesionCliente();
    actualizarEstadoAccesoPanelUI();
    actualizarTarjetaSeguimiento();
    cambiarPantalla(obtenerPantallaDesdeHash());

    console.log('Vital Market listo');
});
