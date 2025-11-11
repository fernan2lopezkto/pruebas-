// ==========================================================
// 1. LÓGICA DE NAVEGACIÓN (SPA)
// ==========================================================

function navigateTo(viewId) {
    // 1. Ocultar todas las vistas
    const allViews = document.querySelectorAll('[data-view]');
    allViews.forEach(view => {
        // Tailwind/DaisyUI clase 'hidden'
        view.classList.add('hidden');
    });

    // 2. Mostrar la vista solicitada
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.remove('hidden');
        console.log(`Navegando a la vista: ${viewId}`);
        
        // TIP: Si es el historial, lo renderizamos de nuevo para ver los cambios
        if (viewId === 'history-view') {
            renderHistoryView();
        }
    }
    
    // 3. Actualizar la URL para usar el botón de "Atrás"
    history.pushState(null, '', `#${viewId}`);
}


// Inicialización: Carga la vista según la URL o por defecto
document.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash.substring(1); 
    navigateTo(hash || 'search-view');
});


// ==========================================================
// 2. LÓGICA DE LOCALSTORAGE (HISTORIAL CON PUNTUACIÓN)
// ==========================================================

function getHistory() {
    try {
        const historyJson = localStorage.getItem('videoHistory');
        // Inicializa viewCount si no existe (para asegurar el conteo)
        return historyJson ? JSON.parse(historyJson).map(v => ({
            ...v,
            viewCount: v.viewCount || 0
        })) : [];
    } catch (e) {
        console.error("Error al obtener o parsear el historial:", e);
        return []; 
    }
}

function saveHistory(historyArray) {
    localStorage.setItem('videoHistory', JSON.stringify(historyArray));
}

/**
 * Busca un video en el historial. Si existe, sube su puntuación (viewCount)
 * y actualiza la fecha. Si no existe, lo agrega con viewCount=1.
 */
function updateAndGetVideoInfo(videoId, videoTitle) {
    const history = getHistory();
    let videoInfo = history.find(v => v.videoId === videoId);

    if (videoInfo) {
        videoInfo.viewCount += 1; // ⬆️ Aumentar la puntuación
        videoInfo.lastView = Date.now();
    } else {
        videoInfo = {
            videoId: videoId,
            title: videoTitle,
            viewCount: 1,
            lastView: Date.now()
        };
        history.push(videoInfo);
    }

    saveHistory(history);
    return videoInfo;
}

// ==========================================================
// 3. FLUJO DE REPRODUCCIÓN
// ==========================================================

function loadMainPlayer(videoId) {
    const iframe = document.getElementById('main-video-player');
    // TIP DE VALOR: Usar `https://www.youtube-nocookie.com/` mejora la privacidad y rendimiento.
    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;
    iframe.setAttribute('src', embedUrl);
}

// SIMULACIÓN: Esta función reemplazaría la llamada real a la API de YouTube
function fetchRelatedVideos(videoId) {
    const container = document.getElementById('related-videos-container');
    container.innerHTML = `
        <div class="col-span-full alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>Simulación: Buscando videos relacionados para ${videoId} y aplicando tu filtro...</span>
        </div>
    `;
    // Aquí iría tu lógica de la API de YouTube + el filtro de palabras clave.
    // También la lógica para mezclar el historial (videos con alta puntuación) con los nuevos.
}

/**
 * Función principal que se llama al hacer clic en un video (simulando PLAY)
 */
function handleVideoClick(videoId, videoTitle) {
    console.log(`Reproduciendo: ${videoTitle} (${videoId})`);
    
    // 1. Guardar/Actualizar el historial y la puntuación
    updateAndGetVideoInfo(videoId, videoTitle);

    // 2. Cargar el video grande
    loadMainPlayer(videoId);

    // 3. Buscar y cargar videos relacionados
    fetchRelatedVideos(videoId);

    // 4. Navegar a la vista de Reproducción
    navigateTo('player-view');
}


// ==========================================================
// 4. RENDERIZADO DE VISTAS
// ==========================================================

function renderHistoryView() {
    const history = getHistory();
    const historyListContainer = document.getElementById('history-list');
    historyListContainer.innerHTML = ''; // Limpiar la vista

    // Ordenar el historial: Primero por PUNTUACIÓN (descendente) y luego por fecha (último visto)
    history.sort((a, b) => {
        if (b.viewCount !== a.viewCount) {
            return b.viewCount - a.viewCount; // Más vistos primero
        }
        return b.lastView - a.lastView; // Más recientes después
    });

    if (history.length === 0) {
        historyListContainer.innerHTML = '<p class="text-lg text-gray-500">Aún no hay videos en tu historial, ¡empezá a reproducir!</p>';
        return;
    }

    // Renderizar cada elemento del historial
    history.forEach(video => {
        const historyItem = document.createElement('div');
        historyItem.className = 'card card-side bg-base-100 shadow-xl p-4 cursor-pointer hover:bg-base-200';
        historyItem.onclick = () => handleVideoClick(video.videoId, video.title);
        
        // Usamos DaisyUI para el layout del item
        historyItem.innerHTML = `
            <div class="flex-none w-24 h-16 bg-cover rounded-md" style="background-image: url('https://img.youtube.com/vi/${video.videoId}/default.jpg')"></div>
            <div class="card-body p-0 ml-4 justify-center">
                <p class="card-title text-sm font-semibold">${video.title}</p>
                <div class="text-xs text-gray-500 flex items-center">
                    <span class="badge badge-lg badge-success mr-2">Visto ${video.viewCount} ${video.viewCount === 1 ? 'vez' : 'veces'}</span>
                    <span>Último: ${new Date(video.lastView).toLocaleDateString()}</span>
                </div>
            </div>
        `;
        historyListContainer.appendChild(historyItem);
    });
}
