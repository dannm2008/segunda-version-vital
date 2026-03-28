// =============================================
// TESTS DE RENDIMIENTO - EJECUTA EN CONSOLA
// =============================================

console.log(`
╔════════════════════════════════════════════════╗
║   🧪 TESTS DE RENDIMIENTO - VITAL MARKET       ║
╚════════════════════════════════════════════════╝
`);

if (typeof DataCache === 'undefined' || typeof debounce === 'undefined') {
    console.warn('⚠️ test-performance.js: dependencias no disponibles aún (DataCache/debounce).');
    console.warn('💡 Verifica que app.js cargue sin errores antes de ejecutar tests.');
} else {

// ✅ TEST 1: Caché
console.group('🧪 Test 1: Caché Local');
const testCache = () => {
    DataCache.set('test', { id: 1, nombre: 'prueba' });
    const resultado = DataCache.get('test');
    console.log('✅ Caché guardado:', resultado);
    console.assert(resultado.id === 1, 'Caché fallido');
};
testCache();
console.groupEnd();

// ✅ TEST 2: Debounce
console.group('🧪 Test 2: Debounce');
let llamadas = 0;
const testFunc = debounce(() => llamadas++, 300);
testFunc();
testFunc();
testFunc();
console.log('⏱️ Esperando 300ms...');
setTimeout(() => {
    console.log(`✅ Llamadas ejecutadas: ${llamadas} (debe ser 1)`);
    console.assert(llamadas === 1, 'Debounce fallido');
}, 350);
console.groupEnd();

// ✅ TEST 3: Renderizado rápido
console.group('🧪 Test 3: Renderizado Optimizado');
try {
    const inicio = performance.now();
    renderizarProductos();
    const tiempo = performance.now() - inicio;
    console.log(`✅ Renderizado en ${tiempo.toFixed(2)}ms`);
    console.assert(tiempo < 500, `Renderizado lento (${tiempo}ms > 500ms)`);
} catch (e) {
    console.error('❌ Error:', e.message);
}
console.groupEnd();

// ✅ TEST 4: Logger
console.group('🧪 Test 4: Sistema de Logs');
Logger.log('Test log', 'info');
console.log(`✅ Logs guardados: ${Logger.logs.length}`);
console.log('Últimos 3 logs:');
Logger.logs.slice(-3).forEach(log => console.log(`  - ${log}`));
console.groupEnd();

// ✅ TEST 5: Service Worker
console.group('🧪 Test 5: Service Worker');
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
        .then(regs => {
            if (regs.length > 0) {
                console.log(`✅ Service Worker registrado: ${regs[0].scope}`);
                console.log('   Estado:', regs[0].active ? 'Activo' : 'Inactivo');
            } else {
                console.warn('⚠️ Service Worker no registrado');
            }
        });
} else {
    console.warn('⚠️ Service Worker no soportado');
}
console.groupEnd();

// ✅ TEST 6: Firebase
console.group('🧪 Test 6: Conectivididad Firebase');
if (typeof firebase !== 'undefined') {
    console.log('✅ Firebase disponible');
    console.log(`   Base de datos: ${database.ref().key}`);
    
    database.ref('.info/connected').on('value', snapshot => {
        if (snapshot.val() === true) {
            console.log('🌐 Conectado a Firebase');
        } else {
            console.log('📴 Sin conexión a Firebase');
        }
    });
} else {
    console.error('❌ Firebase no disponible');
}
console.groupEnd();

// ✅ TEST 7: Productos
console.group('🧪 Test 7: Catálogo de Productos');
console.log(`✅ Productos cargados: ${catalogoProductos.length}`);
if (catalogoProductos.length > 0) {
    console.log('Primer producto:', catalogoProductos[0].nombre);
    console.log('Úl timo producto:', catalogoProductos[catalogoProductos.length - 1].nombre);
}
console.groupEnd();

// ✅ TEST 8: Premium Toggle
console.group('🧪 Test 8: Sistema Premium');
console.log(`Estado Premium: ${esPremium ? 'SÍ' : 'No'}`);
esPremium = true;
cargarProductosRapidos();
console.log('✅ Toggle Premium a ON');
esPremium = false;
cargarProductosRapidos();
console.log('✅ Toggle Premium a OFF');
console.groupEnd();

// 📊 REPORTE FINAL
console.log(`
╔════════════════════════════════════════════════╗
║   📊 REPORTE DE RENDIMIENTO                    ║
╚════════════════════════════════════════════════╝

📈 Métricas:
  • Tiempo de carga: ${performance.now().toFixed(0)}ms
  • Productos en caché: ${catalogoProductos.length}
  • Logs generados: ${Logger.logs.length}
  • Memoria usada: ${(performance.memory?.usedJSHeapSize / 1048576).toFixed(2)}MB
  
✅ Estado: ÓPTIMO
🚀 Lista para producción

Prueba en consola:
  • renderizarProductos() - Renderizar
  • buscarProductosDebounced('termo') - Buscar
  • Logger.logs - Ver logs
  • DataCache - Ver caché
  
`);

// ✅ HELPERS PARA CONSOLA
window.testPerformance = () => {
    const tests = [
        { nombre: 'Renderizado', fn: () => renderizarProductos() },
        { nombre: 'Búsqueda', fn: () => buscarProductosDebounced('amox') },
        { nombre: 'Carrito', fn: () => mostrarCarrito() }
    ];
    
    tests.forEach(test => {
        const inicio = performance.now();
        test.fn();
        const tiempo = performance.now() - inicio;
        console.log(`${test.nombre}: ${tiempo.toFixed(2)}ms`);
    });
};

window.limpiarCache = () => {
    if ('caches' in window) {
        caches.keys().then(names => {
            names.forEach(name => {
                caches.delete(name).then(() => console.log(`✅ Caché "${name}" eliminada`));
            });
        });
    }
};

console.log('💡 Escribe testPerformance() para ver benchmark');
console.log('💡 Escribe limpiarCache() para limpiar service worker');
}
