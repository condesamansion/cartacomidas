// --- admin.js ---

const URL_BACKEND = "https://script.google.com/macros/s/AKfycbzwm0bU3Y7n21V1mCxhK1oGdkKa3dDG37sCf-VX5kwURnw1rr4BgIEYj1GfgLTyTWwl/exec";

let estructuraMenu = {};
let platosGlobales = []; 

const inputId = document.getElementById('plato-id');
const inputSeccion = document.getElementById('seccion');
const listaSecciones = document.getElementById('lista-secciones');
const inputGrupo = document.getElementById('grupo');
const listaGrupos = document.getElementById('lista-grupos');
const inputTipo = document.getElementById('tipo');
const listaTipos = document.getElementById('lista-tipos');

const btnToggleEdicion = document.getElementById('btn-toggle-edicion');
const contenedorEdicionRapida = document.getElementById('contenedor-edicion-rapida');
const formularioContainer = document.querySelector('.formulario-container');
const listaEdicionRapida = document.getElementById('lista-edicion-rapida');
const buscadorRapido = document.getElementById('buscador-rapido');

fetch(URL_BACKEND)
    .then(respuesta => respuesta.json())
    .then(paquete => {
        if (paquete.estado === "exito") {
            platosGlobales = paquete.datos;
            
            platosGlobales.forEach(plato => {
                if(plato.seccion && plato.grupo && plato.tipo) {
                    const sec = String(plato.seccion).toUpperCase();
                    const gru = String(plato.grupo).toUpperCase();
                    const tip = String(plato.tipo);

                    if (!estructuraMenu[sec]) { estructuraMenu[sec] = {}; }
                    if (!estructuraMenu[sec][gru]) { estructuraMenu[sec][gru] = []; }
                    if (!estructuraMenu[sec][gru].includes(tip)) { estructuraMenu[sec][gru].push(tip); }
                }
            });

            listaSecciones.innerHTML = '';
            for (const seccion in estructuraMenu) { listaSecciones.innerHTML += `<option value="${seccion}">`; }
        }
    })
    .catch(error => console.error("Error al cargar los datos:", error));

function verificarSiExiste() {
    const sec = inputSeccion.value.toUpperCase();
    const gru = inputGrupo.value.toUpperCase();
    const tip = inputTipo.value.trim().toLowerCase();

    const platoEncontrado = platosGlobales.find(p => 
        p.seccion && p.grupo && p.tipo &&
        String(p.seccion).toUpperCase() === sec && 
        String(p.grupo).toUpperCase() === gru && 
        String(p.tipo).toLowerCase() === tip
    );

    if (platoEncontrado) {
        inputId.value = platoEncontrado.id;
        document.getElementById('descripcion').value = platoEncontrado.descripcion || "";
        document.getElementById('precio').value = platoEncontrado.precio || "";
        document.getElementById('disponible').checked = (platoEncontrado.disponible !== "NO");
    } else {
        inputId.value = ""; 
    }
}

inputSeccion.addEventListener('input', function() {
    const seccionElegida = this.value.toUpperCase();
    listaGrupos.innerHTML = ''; 
    if (estructuraMenu[seccionElegida]) {
        for (const grupo in estructuraMenu[seccionElegida]) { listaGrupos.innerHTML += `<option value="${grupo}">`; }
    }
    verificarSiExiste();
});

inputGrupo.addEventListener('input', function() {
    const seccionElegida = inputSeccion.value.toUpperCase();
    const grupoElegido = this.value.toUpperCase();
    listaTipos.innerHTML = '';
    if (estructuraMenu[seccionElegida] && estructuraMenu[seccionElegida][grupoElegido]) {
        estructuraMenu[seccionElegida][grupoElegido].forEach(tipo => { listaTipos.innerHTML += `<option value="${tipo}">`; });
    }
    verificarSiExiste();
});

inputTipo.addEventListener('input', verificarSiExiste);
inputTipo.addEventListener('change', verificarSiExiste);

document.getElementById('btn-guardar').addEventListener('click', function() {
    const platoNuevo = {
        id: inputId.value,
        seccion: inputSeccion.value.toUpperCase(),
        grupo: inputGrupo.value.toUpperCase(),
        tipo: inputTipo.value,
        descripcion: document.getElementById('descripcion').value,
        precio: document.getElementById('precio').value,
        disponible: document.getElementById('disponible').checked
    };

    if(!platoNuevo.seccion || !platoNuevo.grupo || !platoNuevo.tipo) {
        alert("⚠️ Completa Sección, Grupo y Variante."); return;
    }

    const btnGuardar = document.getElementById('btn-guardar');
    btnGuardar.innerText = "⏳..."; btnGuardar.disabled = true;

    fetch(URL_BACKEND, { method: "POST", body: JSON.stringify({ accion: "guardar", plato: platoNuevo }) })
    .then(r => r.json())
    .then(d => {
        if(d.estado === "exito") { alert("✅ Guardado"); window.location.reload(); } 
        else { alert("❌ Error: " + d.mensaje); }
    })
    .finally(() => { btnGuardar.innerText = "💾 Guardar"; btnGuardar.disabled = false; });
});

document.getElementById('btn-eliminar').addEventListener('click', function() {
    const idAEliminar = inputId.value;
    if (!idAEliminar) { alert("⚠️ Selecciona un plato primero."); return; }
    if (!confirm(`¿Eliminar permanentemente "${inputTipo.value}"?`)) return;

    const btnEliminar = document.getElementById('btn-eliminar');
    btnEliminar.innerText = "🗑️..."; btnEliminar.disabled = true;

    fetch(URL_BACKEND, { method: "POST", body: JSON.stringify({ accion: "eliminar", id: idAEliminar }) })
    .then(r => r.json())
    .then(d => {
        if(d.estado === "exito") { alert("✅ Eliminado"); window.location.reload(); } 
        else { alert("❌ Error"); }
    })
    .finally(() => { btnEliminar.innerText = "🗑️ Eliminar"; btnEliminar.disabled = false; });
});

// --- MODO EDICIÓN RÁPIDA ---

btnToggleEdicion.addEventListener('click', () => {
    if (contenedorEdicionRapida.style.display === 'none') {
        contenedorEdicionRapida.style.display = 'block';
        formularioContainer.style.display = 'none';
        btnToggleEdicion.innerText = "🔙 Volver al Formulario Principal";
        btnToggleEdicion.style.backgroundColor = "#64748b"; 
        dibujarListaRapida();
    } else {
        contenedorEdicionRapida.style.display = 'none';
        formularioContainer.style.display = 'block';
        btnToggleEdicion.innerText = "⚡ Edición Rápida de Precios";
        btnToggleEdicion.style.backgroundColor = "#f59e0b"; 
        buscadorRapido.value = ""; 
    }
});

function dibujarListaRapida() {
    listaEdicionRapida.innerHTML = '';
    
    // 1. Limpiamos cualquier plato roto o fila vacía del Excel
    let platosValidos = platosGlobales.filter(p => p.id && p.tipo);

    // 2. ORDENAMIENTO 100% SEGURO (Sin localeCompare)
    let platosOrdenados = platosValidos.sort((a, b) => {
        let secA = String(a.seccion || "").toUpperCase();
        let secB = String(b.seccion || "").toUpperCase();
        if (secA < secB) return -1;
        if (secA > secB) return 1;

        let gruA = String(a.grupo || "").toUpperCase();
        let gruB = String(b.grupo || "").toUpperCase();
        if (gruA < gruB) return -1;
        if (gruA > gruB) return 1;

        let tipA = String(a.tipo || "").toUpperCase();
        let tipB = String(b.tipo || "").toUpperCase();
        if (tipA < tipB) return -1;
        if (tipA > tipB) return 1;

        return 0;
    });

    platosOrdenados.forEach(plato => {
        const fila = document.createElement('div');
        fila.className = 'fila-edicion';
        
        const estaDisponible = (plato.disponible !== "NO");
        // Escudamos las comillas dobles y simples en el nombre para el botón de borrar
        const nombreSeguro = String(plato.tipo).replace(/'/g, "\\'").replace(/"/g, '&quot;'); 
        
        fila.innerHTML = `
            <div class="fila-info-rapida">
                <div class="textos-rapidos">
                    <strong>${plato.tipo}</strong>
                    <small>${plato.seccion} > ${plato.grupo}</small>
                </div>
                <button class="btn-eliminar-rapido" onclick="eliminarRapido(event, '${plato.id}', '${nombreSeguro}')" title="Eliminar plato">🗑️</button>
            </div>
            
            <div class="controles-rapidos">
                <div class="input-precio-wrapper">
                    <span>$</span>
                    <input type="number" id="precio-rapido-${plato.id}" value="${plato.precio || ''}" placeholder="Consultar">
                </div>
                
                <label class="check-disponible-wrapper">
                    <input type="checkbox" id="disponible-rapido-${plato.id}" ${estaDisponible ? 'checked' : ''}>
                    Disponible
                </label>
            </div>

            <button class="btn-guardar-rapido" onclick="guardarPrecioRapido(event, '${plato.id}')">💾 Guardar Cambios</button>
        `;
        listaEdicionRapida.appendChild(fila);
    });
}

// BUSCADOR EN VIVO
buscadorRapido.addEventListener('input', function() {
    const termino = this.value.toLowerCase();
    const filas = document.querySelectorAll('.fila-edicion');

    filas.forEach(fila => {
        const textoFila = fila.textContent.toLowerCase(); 
        
        if (textoFila.includes(termino)) {
            fila.style.display = 'flex'; // Vuelve a mostrar la tarjeta completa
        } else {
            fila.style.display = 'none';
        }
    });
});

window.guardarPrecioRapido = function(evento, id) {
    const platoOriginal = platosGlobales.find(p => p.id.toString() === id.toString());
    const nuevoPrecio = document.getElementById(`precio-rapido-${id}`).value;
    const nuevoDisponible = document.getElementById(`disponible-rapido-${id}`).checked;
    
    if(!platoOriginal) return;

    const platoActualizado = {
        id: platoOriginal.id,
        seccion: platoOriginal.seccion,
        grupo: platoOriginal.grupo,
        tipo: platoOriginal.tipo,
        descripcion: platoOriginal.descripcion,
        precio: nuevoPrecio,
        disponible: nuevoDisponible 
    };

    const paquete = { accion: "guardar", plato: platoActualizado };
    
    const btn = evento.target.closest('button');
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = "⏳ Guardando...";
    btn.disabled = true;

    fetch(URL_BACKEND, { method: "POST", body: JSON.stringify(paquete) })
    .then(respuesta => respuesta.json())
    .then(datos => {
        if(datos.estado === "exito") {
            btn.innerHTML = "✅ ¡Guardado!";
            btn.style.backgroundColor = "#3b82f6"; 
            
            platoOriginal.precio = nuevoPrecio; 
            platoOriginal.disponible = nuevoDisponible ? "SI" : "NO";

            setTimeout(() => {
                btn.innerHTML = "💾 Guardar Cambios";
                btn.style.backgroundColor = "#10b981"; 
                btn.disabled = false;
            }, 1500);
        } else {
            alert("❌ Error: " + datos.mensaje);
            btn.innerHTML = textoOriginal;
            btn.disabled = false;
        }
    })
    .catch(error => { alert("🔌 Error de conexión"); btn.innerHTML = textoOriginal; btn.disabled = false; });
};

window.eliminarRapido = function(evento, id, nombre) {
    if (!confirm(`⚠️ ATENCIÓN: ¿Estás seguro de que quieres eliminar la variante "${nombre}" para siempre?`)) {
        return;
    }

    const btn = evento.target.closest('button');
    const fila = btn.closest('.fila-edicion'); 
    
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = "⏳";
    btn.disabled = true;

    const paquete = { accion: "eliminar", id: id };

    fetch(URL_BACKEND, { method: "POST", body: JSON.stringify(paquete) })
    .then(respuesta => respuesta.json())
    .then(datos => {
        if(datos.estado === "exito") {
            fila.style.backgroundColor = "#fee2e2"; 
            fila.style.transition = "all 0.5s ease";
            fila.style.opacity = "0";
            fila.style.transform = "scale(0.95)";
            
            setTimeout(() => {
                fila.remove();
                platosGlobales = platosGlobales.filter(p => p.id.toString() !== id.toString());
            }, 500);
        } else {
            alert("❌ Error: " + datos.mensaje);
            btn.innerHTML = textoOriginal;
            btn.disabled = false;
        }
    })
    .catch(error => { alert("🔌 Error de conexión"); btn.innerHTML = textoOriginal; btn.disabled = false; });
};