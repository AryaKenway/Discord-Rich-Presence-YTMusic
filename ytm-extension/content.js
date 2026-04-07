function updateDiscord() {
    const title = document.querySelector('yt-formatted-string.title.style-scope.ytmusic-player-bar')?.title;
    const artist = document.querySelector('.byline.style-scope.ytmusic-player-bar')?.innerText;
    const timeInfo = document.querySelector('.time-info.ytmusic-player-bar')?.innerText; // "1:23 / 4:56"
    
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
                total: parts[1].trim()
            })
        }).catch(err => console.log("Bridge server not running?"));
    }
}

setInterval(updateDiscord, 2000);