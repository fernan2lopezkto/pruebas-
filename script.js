// CONSTANTES
const LS_API_KEY = 'youtube_api_key';
const LS_KEYWORDS = 'filter_keywords';
const LS_HISTORY = 'video_history';
const LS_THEME = 'youtube_filter_theme'; 
const MAX_HISTORY_ITEMS = 50; 
const BASE_URL = 'https://www.googleapis.com/youtube/v3/search';

// ESTADO GLOBAL
let API_KEY = '';
let nextPageToken = ''; // El "marcador" de página de YouTube
let isFetching = false; // Semáforo para no hacer peticiones dobles
let currentQuery = '';  // Guardamos qué se buscó
let observer; // El observador de scroll

// ELEMENTOS DOM
const fixedPlayerContainer = document.getElementById('fixed-player-container');
const scrollSentinel = document.getElementById('scroll-sentinel');
const loadingIndicator = document.getElementById('loading-indicator');
const resultsDiv = document.getElementById('results');
const body = document.body;

// =================================================================
// 0. INICIALIZACIÓN
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    loadConfig();
    setupTheme();
    setupScrollObserver(); // Configuramos el ojo mágico
    hideSections("default");
    lucide.createIcons();
});

// =================================================================
// 1. SCROLL INFINITO (INTERSECTION OBSERVER)
// =================================================================

function setupScrollObserver() {
    const options = {
        root: null, // Usa el viewport del navegador
        rootMargin: '100px', // Carga 100px antes de llegar al final
        threshold: 0.1
    };

    observer = new IntersectionObserver((entries) => {
        // Si el elemento centinela entra en pantalla y hay token de siguiente página
        if (entries[0].isIntersecting && nextPageToken && !isFetching && currentQuery) {
            console.log("👀 Llegamos al fondo, cargando más...");
            searchVideos(false); // false = no es nueva búsqueda, es cargar más
        }
    }, options);

    observer.observe(scrollSentinel);
}

// =================================================================
// 2. NAVEGACIÓN Y UI
// =================================================================

function updateBtmNav(activeId) {
    document.querySelectorAll('.btm-nav button').forEach(btn => {
        btn.classList.remove('active', 'text-primary');
        btn.classList.add('text-neutral');
        if (btn.getAttribute('data-target') === activeId) {
            btn.classList.add('active', 'text-primary');
            btn.classList.remove('text-neutral');
        }
    });
}

function hideSections(id) {
    updateBtmNav(id);
    
    // Lógica simple de visibilidad
    const isSearchMode = (id === 'search-bar' || id === 'default');
    const isConfigMode = (id === 'config-container');
    const isHistoryMode = (id === 'history-section');

    // Mostrar/Ocultar contenedores principales
    // Usamos safe checks (?) por si algún elemento no existe al inicio
    if(document.getElementById('search-bar')) 
        document.getElementById('search-bar').style.display = isSearchMode ? 'flex' : 'none';
    
    if(document.getElementById('results'))
        document.getElementById('results').style.display = isSearchMode ? 'grid' : 'none';
    
    if(document.getElementById('scroll-sentinel'))
        document.getElementById('scroll-sentinel').style.display = isSearchMode ? 'block' : 'none';
    
    if(document.getElementById('config-container'))
        document.getElementById('config-container').style.display = isConfigMode ? 'block' : 'none';
    
    if(document.getElementById('history-section'))
        document.getElementById('history-section').style.display = isHistoryMode ? 'block' : 'none';
    
    if(document.getElementById('toogle'))
        document.getElementById('toogle').style.display = !isConfigMode ? 'flex' : 'none';

    // Si hay video activo, asegurar espacio
    if (isSearchMode && fixedPlayerContainer.classList.contains('fixed-player-active')) {
        body.classList.add('body-push-down');
    }
    
    // Si es historial, renderizarlo al momento
    if(id === 'history-section') renderHistory();
}

// =================================================================
// 3. LÓGICA DE BÚSQUEDA OPTIMIZADA
// =================================================================

async function searchVideos(isNewSearch = true) {
    if (!API_KEY) {
        showToast('¡Falta la API Key! Configurala primero.', 'error');
        hideSections('config-container');
        return;
    }

    if (isFetching) return; // Evitar doble click

    if (isNewSearch) {
        const input = document.getElementById('query');
        currentQuery = input ? input.value.trim() : '';
        
        if (!currentQuery) return;
        
        nextPageToken = ''; // Resetear token
        
        // ARREGLO AQUÍ: Simplemente limpiamos el HTML. 
        // Al limpiar resultsDiv, el "initial-state" se borra solo, así que no da error.
        resultsDiv.innerHTML = ''; 
        
        hideSections('search-bar'); // Asegurar que estamos en la vista correcta
    }

    isFetching = true;
    loadingIndicator.classList.remove('hidden'); // Mostrar spinner

    const params = new URLSearchParams({
        part: 'snippet',
        q: currentQuery,
        key: API_KEY,
        type: 'video',
        maxResults: 15, // Lotes de 15
        videoEmbeddable: 'true',
        safeSearch: 'strict'
    });

    if (nextPageToken) {
        params.append('pageToken', nextPageToken);
    }

    try {
        const response = await fetch(`${BASE_URL}?${params.toString()}`);
        const data = await response.json();

        if (data.error) {
            console.error(data.error);
            showToast(`Error: ${data.error.message}`, 'error');
            isFetching = false;
            loadingIndicator.classList.add('hidden');
            return;
        }

        // Guardamos el token para la próxima página (scroll infinito)
        nextPageToken = data.nextPageToken || '';

        // Renderizamos usando DocumentFragment (Más rendimiento)
        if (data.items) {
            renderVideosEfficiently(data.items);
        }

    } catch (error) {
        showToast('Error de conexión', 'error');
        console.error(error);
    } finally {
        isFetching = false;
        loadingIndicator.classList.add('hidden');
        
        // Si no hay más páginas, ocultar centinela
        if (!nextPageToken) {
            scrollSentinel.style.display = 'none';
        } else {
            scrollSentinel.style.display = 'block';
        }
    }
}

function renderVideosEfficiently(videos) {
    const fragment = document.createDocumentFragment();
    let addedCount = 0;

    videos.forEach(video => {
        if (!video.id.videoId) return;
        if (filterVideo(video.snippet)) return; // Filtrar por palabras prohibidas

        const card = createVideoCard(video);
        fragment.appendChild(card);
        addedCount++;
    });

    resultsDiv.appendChild(fragment);
    lucide.createIcons();

    if (addedCount === 0 && !nextPageToken) {
        // Solo mostramos mensaje si no hay NADA cargado
        if(resultsDiv.children.length === 0) {
             resultsDiv.innerHTML = `<div class="col-span-full text-center p-4 opacity-50">No se encontraron videos seguros.</div>`;
        }
    }
}

function createVideoCard(video) {
    const div = document.createElement('div');
    div.className = 'card card-compact bg-base-100 shadow-sm video-item-anim hover:shadow-md transition-shadow duration-200';
    div.innerHTML = `
        <div class="video-player-wrapper cursor-pointer group">
            <img src="${video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default.url}" 
                 class="w-full h-full object-cover" loading="lazy" alt="${video.snippet.title}">
            <div class="video-overlay group-hover:bg-black/40 transition-colors">
                <div class="bg-white/20 backdrop-blur-sm p-3 rounded-full ring-1 ring-white/50">
                    <i data-lucide="play" class="w-8 h-8 text-white fill-current"></i>
                </div>
            </div>
        </div>
        <div class="p-3">
            <h3 class="font-semibold text-sm leading-tight line-clamp-2 mb-1">${video.snippet.title}</h3>
            <p class="text-xs text-base-content/60 flex items-center gap-1">
                <i data-lucide="user" class="w-3 h-3"></i> ${video.snippet.channelTitle}
            </p>
        </div>
    `;
    
    // Event Listener manual para evitar problemas con comillas en el HTML
    div.querySelector('.video-player-wrapper').addEventListener('click', () => {
        addToHistory(video);
        playVideo(video.id.videoId, video.snippet.title);
    });
    
    return div;
}

// =================================================================
// 4. REPRODUCTOR Y LÓGICA "APP"
// =================================================================

function playVideo(videoId, title) {
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&playsinline=1`;
    
    fixedPlayerContainer.innerHTML = `
        <div class="video-player-wrapper">
            <iframe class="video-player" src="${embedUrl}" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen title="${title}"></iframe>
            <button id="close-player-btn" class="absolute top-2 right-2 btn btn-circle btn-xs btn-error z-20 opacity-50 hover:opacity-100 text-white">✕</button>
        </div>
    `;

    // Listener para cerrar
    document.getElementById('close-player-btn').addEventListener('click', closePlayer);

    fixedPlayerContainer.classList.remove('fixed-player-hidden');
    fixedPlayerContainer.classList.add('fixed-player-active');
    body.classList.add('body-push-down');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closePlayer() {
    fixedPlayerContainer.classList.add('fixed-player-hidden');
    fixedPlayerContainer.classList.remove('fixed-player-active');
    setTimeout(() => {
         fixedPlayerContainer.innerHTML = ''; // Matar el iframe después de la animación
    }, 300);
    body.classList.remove('body-push-down');
}

// =================================================================
// 5. UTILIDADES (Config, Filtro, Historial)
// =================================================================

function loadConfig() {
    API_KEY = localStorage.getItem(LS_API_KEY) || '';
    if (API_KEY && document.getElementById('api-key-input')) {
        document.getElementById('api-key-input').value = API_KEY;
    }
    
    const keywords = localStorage.getItem(LS_KEYWORDS);
    if (keywords && document.getElementById('filter-keywords-input')) {
        document.getElementById('filter-keywords-input').value = keywords;
    }
}

function saveApiKey() {
    const input = document.getElementById('api-key-input');
    const val = input ? input.value.trim() : '';
    if(val) {
        localStorage.setItem(LS_API_KEY, val);
        API_KEY = val;
        showToast('API Key Guardada', 'success');
    }
}

function saveKeywords() {
    const input = document.getElementById('filter-keywords-input');
    if(input) {
        localStorage.setItem(LS_KEYWORDS, input.value.trim());
        showToast('Filtros Guardados', 'success');
    }
}

function filterVideo(snippet) {
    const rawKeywords = localStorage.getItem(LS_KEYWORDS) || '';
    const forbidden = rawKeywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k);
    
    if (!forbidden.length) return false;
    
    const text = (snippet.title + ' ' + snippet.description).toLowerCase();
    return forbidden.some(badWord => text.includes(badWord));
}

function addToHistory(video) {
    let history = JSON.parse(localStorage.getItem(LS_HISTORY) || '[]');
    history = history.filter(v => v.id.videoId !== video.id.videoId); 
    history.unshift(video);
    if (history.length > MAX_HISTORY_ITEMS) history.pop();
    localStorage.setItem(LS_HISTORY, JSON.stringify(history));
}

function renderHistory() {
    const container = document.getElementById('viewed-history');
    if(!container) return;

    const history = JSON.parse(localStorage.getItem(LS_HISTORY) || '[]');
    container.innerHTML = '';
    
    if (!history.length) {
        container.innerHTML = '<p class="text-center opacity-50 col-span-full">Aún no has visto videos.</p>';
        return;
    }

    history.forEach(video => {
        if (!filterVideo(video.snippet)) {
            container.appendChild(createVideoCard(video));
        }
    });
    lucide.createIcons();
}

function clearHistory() {
    if(confirm('¿Borrar todo el historial?')) {
        localStorage.removeItem(LS_HISTORY);
        renderHistory();
    }
}

function setupTheme() {
    const toggle = document.getElementById('theme-toggle');
    if(!toggle) return;

    const saved = localStorage.getItem(LS_THEME) || 'cupcake';
    document.documentElement.setAttribute('data-theme', saved);
    toggle.checked = saved === 'night';
    
    toggle.addEventListener('change', (e) => {
        const theme = e.target.checked ? 'night' : 'cupcake';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(LS_THEME, theme);
    });
}

function showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast toast-center z-50';
    toast.innerHTML = `
        <div class="alert alert-${type} shadow-lg">
            <span>${msg}</span>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
