# Vital Market - Senda v2

Aplicacion web de gestion y compra para drogueria con:

- Seccion de inicio y botiquin.
- Carrito y seguimiento de pedidos.
- Historial de compras.
- Notificaciones en tiempo real.
- Panel administrativo.
- Membresia premium por usuario.

## Estructura

- `index.html`: interfaz principal.
- `app.js`: logica de aplicacion, estado y Firebase.
- `style.css`: estilos globales.
- `service-worker.js` y `manifest.json`: soporte PWA.
- `premium-backend/`: backend Node.js para funciones premium.

## Ejecucion local

1. Abre la carpeta del proyecto.
2. Sirve los archivos estaticos con tu servidor local (por ejemplo Five Server).
3. Para backend premium:

```bash
cd premium-backend
npm install
npm run dev
```

## Despliegue

El repositorio incluye workflow para publicar en GitHub Pages desde `main`:

- `.github/workflows/deploy-pages.yml`

Si usas Firebase para base de datos/autenticacion, revisa:

- `reglas-firebase.json`
- `esquema-firebase.json`
- `ESQUEMA_FIREBASE_PREMIUM.md`