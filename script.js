// --- script.js ---

const URL_BACKEND = "https://script.google.com/macros/s/AKfycbzwm0bU3Y7n21V1mCxhK1oGdkKa3dDG37sCf-VX5kwURnw1rr4BgIEYj1GfgLTyTWwl/exec";

// 1. EL ORDEN LÓGICO DE TUS SECCIONES (Puedes modificarlo o agregar más en el futuro)
const ORDEN_SECCIONES = [
    "ENTRADAS", 
    "PRINCIPALES", 
    "GUARNICIONES", 
    "BEBIDAS", 
    "POSTRES"
];

function formatearComoOracion(texto) {
    if (!texto) return ""; 
    let textoMin = texto.toLowerCase();
    let oraciones = textoMin.split('. ');
    let oracionesArregladas = oraciones.map(oracion => {
        if (oracion.length === 0) return "";
        return oracion.charAt(0).toUpperCase() + oracion.slice(1);
    });
    return oracionesArregladas.join('. ');
}

fetch(URL_BACKEND)
    .then(respuesta => respuesta.json())
    .then(paquete => {
        document.getElementById('estado-carga').style.display = 'none';
        
        const contenedor = document.getElementById('contenedor-platos');
        const platos = paquete.datos;

        const platosAgrupados = {};

        // Agrupamos todo como siempre
        platos.forEach(plato => {
            const nombreSeccion = plato.seccion.toUpperCase(); 
            const nombreGrupo = plato.grupo.toUpperCase();
            
            if (!platosAgrupados[nombreSeccion]) { platosAgrupados[nombreSeccion] = {}; }
            if (!platosAgrupados[nombreSeccion][nombreGrupo]) { platosAgrupados[nombreSeccion][nombreGrupo] = []; }
            
            platosAgrupados[nombreSeccion][nombreGrupo].push(plato);
        });

        // --- MAGIA NUEVA: ORDENAMOS ANTES DE DIBUJAR ---

        // A. Obtenemos las secciones y las ordenamos según nuestra lista maestra
        let seccionesOrdenadas = Object.keys(platosAgrupados).sort((a, b) => {
            let indiceA = ORDEN_SECCIONES.indexOf(a);
            let indiceB = ORDEN_SECCIONES.indexOf(b);
            // Si una sección no está en la lista, la mandamos al final (le damos el índice 999)
            if (indiceA === -1) indiceA = 999;
            if (indiceB === -1) indiceB = 999;
            return indiceA - indiceB;
        });

        // Dibujamos la carta siguiendo el orden perfecto
        seccionesOrdenadas.forEach(nombreSeccion => {
            
            let htmlGrupo = `<button class="acordeon-boton">${nombreSeccion}</button>`;
            htmlGrupo += `<div class="acordeon-contenido">`;
            
            // B. Obtenemos los grupos de esta sección y los ordenamos alfabéticamente (A-Z)
            let gruposOrdenados = Object.keys(platosAgrupados[nombreSeccion]).sort();

            gruposOrdenados.forEach(nombreGrupo => {
                
                htmlGrupo += `<h3 class="grupo-titulo">${nombreGrupo}</h3>`;
                
                // C. Agarramos los platos de este grupo y los ordenamos por precio (Menor a Mayor)
                let platosDelGrupo = platosAgrupados[nombreSeccion][nombreGrupo];
                platosDelGrupo.sort((a, b) => {
                    // Si el precio está vacío, lo tratamos como un número gigante para que vaya al final
                    let precioA = (a.precio && a.precio != 0) ? Number(a.precio) : 9999999;
                    let precioB = (b.precio && b.precio != 0) ? Number(b.precio) : 9999999;
                    return precioA - precioB;
                });
                
                // Ahora sí, imprimimos los platos ya ordenaditos
                platosDelGrupo.forEach(plato => {
                    
                    const estaAgotado = (plato.disponible === "NO");
                    const claseCard = estaAgotado ? "plato-item plato-agotado" : "plato-item";
                    const badgeHTML = estaAgotado ? `<span class="badge-agotado">No Disponible</span>` : "";

                    const nombreLimpio = formatearComoOracion(plato.tipo);
                    const descLimpia = formatearComoOracion(plato.descripcion);

                    let textoPrecio = "Consultar"; 
                    if (plato.precio !== "" && plato.precio !== null && plato.precio !== undefined && plato.precio != 0) {
                        textoPrecio = `$ ${plato.precio}`; 
                    }

                    htmlGrupo += `
                        <div class="${claseCard}">
                            <div class="plato-titulo">
                                <span>${nombreLimpio} ${badgeHTML}</span>
                                <span class="plato-precio">${textoPrecio}</span>
                            </div>
                            <p class="plato-descripcion">${descLimpia}</p>
                        </div>
                    `;
                });
            });
            
            htmlGrupo += `</div>`;
            contenedor.innerHTML += htmlGrupo;
        });

        // Lógica de clics del acordeón
        const botones = document.getElementsByClassName("acordeon-boton");
        for (let i = 0; i < botones.length; i++) {
            botones[i].addEventListener("click", function() {
                const contenido = this.nextElementSibling;
                if (contenido.style.display === "block") {
                    contenido.style.display = "none";
                } else {
                    contenido.style.display = "block";
                }
            });
        }
    })
    .catch(error => {
        const estadoCarga = document.getElementById('estado-carga');
        estadoCarga.innerText = "Error de conexión: " + error;
    });