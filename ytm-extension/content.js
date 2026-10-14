function getCoverUrl() {
    const artwork = navigator.mediaSession?.metadata?.artwork;
    let coverUrl;

    if (Array.isArray(artwork) && artwork.length > 0) {
        const largestArtwork = artwork.reduce((best, item) => {
            if (!item?.src) return best;

            const dimensions = item.sizes?.match(/^(\d+)x(\d+)$/);
            const area = dimensions ? Number(dimensions[1]) * Number(dimensions[2]) : 0;
            return !best || area > best.area ? { src: item.src, area } : best;
        }, null);
        coverUrl = largestArtwork?.src;
    }

    coverUrl ||= document.querySelector('ytmusic-player-bar img')?.currentSrc;
    return coverUrl?.replace(/w\d+-h\d+/, 'w512-h512');
}

function updateDiscord() {
    const title = document.querySelector('yt-formatted-string.title.style-scope.ytmusic-player-bar')?.title;
    const artist = document.querySelector('.byline.style-scope.ytmusic-player-bar')?.innerText;
    const timeInfo = document.querySelector('.time-info.ytmusic-player-bar')?.innerText; // "1:23 / 4:56"
    const coverUrl = getCoverUrl();
    
    const playPauseBtn = document.querySelector('#play-pause-button');
    const isPaused = playPauseBtn?.getAttribute('title') === 'Play';

    if (title && artist && timeInfo) {
        const parts = timeInfo.split(' / ');
        fetch('http://localhost:3000/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                title, 
                artist, 
                isPaused,
                current: parts[0].trim(),
                total: parts[1].trim(),
                coverUrl
            })
        }).then(response => {
            if (!response.ok) {
                console.error(`Discord RPC bridge returned HTTP ${response.status}`);
            }
        }).catch(err => console.log("Bridge server not running?", err));
    }
}

setInterval(updateDiscord, 2000);