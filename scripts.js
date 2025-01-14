// Descargar Reel
async function getReelData() {
  await fetchData('reelUrl', 'reel');
}

// Descargar Estado
async function getStatusData() {
  await fetchData('statusUrl', 'status');
}

// Descargar Short
async function getShortData() {
  await fetchData('shortUrl', 'short');
}

// Función genérica para descarga
async function fetchData(inputId, prefix) {
  const videoUrl = document.getElementById(inputId).value;
  const loading = document.getElementById(`${prefix}Loading`);
  const videoContainer = document.getElementById(`${prefix}VideoContainer`);
  const thumbnail = document.getElementById(`${prefix}Thumbnail`);
  const videoQuality = document.getElementById(`${prefix}VideoQuality`);
  const downloadLink = document.getElementById(`${prefix}DownloadLink`);
  const error = document.getElementById(`${prefix}Error`);

  try {
    loading.classList.remove('d-none');
    videoContainer.classList.add('d-none');
    error.classList.add('d-none');

    const response = await fetch('https://social-media-video-downloader.p.rapidapi.com/smvd/get/all?url=' + encodeURIComponent(videoUrl), {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': 'd6eefda435msh8ae60d04d6b9b22p172e56jsn5a84a74c03bd',
        'X-RapidAPI-Host': 'social-media-video-downloader.p.rapidapi.com'
      }
    });

    if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);

    const data = await response.json();
    thumbnail.src = data.picture;
    videoQuality.textContent = data.links[1].quality;
    downloadLink.href = data.links[1].link;
    downloadLink.download = `${prefix}_${Date.now()}.mp4`;

    videoContainer.classList.remove('d-none');
    loading.classList.add('d-none');
  } catch (err) {
    error.textContent = `Error: ${err.message}`;
    error.classList.remove('d-none');
    loading.classList.add('d-none');
  }
}
