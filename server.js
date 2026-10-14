const RPC = require('discord-rpc');
const express = require('express');
const cors = require('cors');

const extensionOrigin = 'https://music.youtube.com';
const app = express();
app.use(express.json());
app.use(cors({ origin: extensionOrigin }));
app.use((req, res, next) => {
    if (req.get('Origin') !== extensionOrigin) {
        return res.status(403).send('Requests must originate from YouTube Music.');
    }
    next();
});

const clientId = '1491107428505227264'; 
let client;
let reconnectTimer;
let lastCoverStatus;
let lastSongUrl;
let wasPaused;

function scheduleDiscordReconnect() {
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
        reconnectTimer = undefined;
        connectToDiscord();
    }, 5000);
    reconnectTimer.unref();
}

function connectToDiscord() {
    const rpcClient = new RPC.Client({ transport: 'ipc' });
    rpcClient.on('disconnected', () => {
        if (client === rpcClient) {
            client = undefined;
            console.error('Discord RPC disconnected; retrying in 5 seconds.');
            scheduleDiscordReconnect();
        }
    });
    rpcClient.login({ clientId }).then(() => {
        client = rpcClient;
        console.log('Discord RPC Connected!');
    }).catch(err => {
        console.error('Discord RPC connection failed:', err.message);
        scheduleDiscordReconnect();
    });
}

// Helper to convert "MM:SS" or "HH:MM:SS" to total seconds
function parseTimeToSeconds(timeStr) {
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    if (parts.length === 2) return (parts[0] * 60) + parts[1];
    return 0;
}

function getExternalImageUrl(imageUrl) {
    if (typeof imageUrl !== 'string') return null;

    let parsedUrl;
    try {
        parsedUrl = new URL(imageUrl);
    } catch {
        return null;
    }

    if (parsedUrl.protocol !== 'https:' || parsedUrl.username || parsedUrl.password) return null;

    const url = parsedUrl.toString();
    return url.length <= 256 ? url : null;
}

function getYouTubeMusicTrackUrl(value) {
    if (typeof value !== 'string') return null;

    let parsedUrl;
    try {
        parsedUrl = new URL(value);
    } catch {
        return null;
    }

    const videoId = parsedUrl.searchParams.get('v');
    if (
        parsedUrl.protocol !== 'https:' ||
        parsedUrl.hostname !== 'music.youtube.com' ||
        parsedUrl.username ||
        parsedUrl.password ||
        parsedUrl.pathname !== '/watch' ||
        !/^[\w-]{11}$/.test(videoId || '')
    ) {
        return null;
    }

    return `https://music.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

app.post('/update', (req, res) => {
    const { title, artist, isPaused, current, total, coverUrl, trackUrl } = req.body;

    if (!client) {
        return res.status(503).send('Waiting for Discord Desktop to connect.');
    }

    if (isPaused) {
        if (!wasPaused) {
            client.clearActivity().then(() => {
                console.log('Presence cleared while music is paused');
            }).catch(err => console.error('RPC Error (Clear paused activity):', err.message));
            wasPaused = true;
        }
        return res.sendStatus(200);
    }

    wasPaused = false;

    // A more robust truncate that ensures the FINAL string is under 128
    const finalizeStr = (str) => {
        if (!str) return "Unknown";
        // Discord limit is 128. We cut at 125 to leave room for "..."
        return str.length > 128 ? str.substring(0, 125) + "..." : str;
    };

    // Construct the strings FIRST, then truncate the whole thing
    const detailsStr = finalizeStr(title);
    const coverImage = getExternalImageUrl(coverUrl);
    const songUrl = getYouTubeMusicTrackUrl(trackUrl);
    const songUrlChanged = songUrl !== lastSongUrl;
    const currentSeconds = parseTimeToSeconds(current);
    const totalSeconds = parseTimeToSeconds(total);
    const activity = {
        name: 'YouTube Music',
        type: 2,
        details: detailsStr,
        ...(songUrl && { details_url: songUrl }),
        state: finalizeStr(`by ${artist}`),
        assets: {
            large_image: coverImage || 'yt_logo',
            large_text: coverImage ? finalizeStr(title) : 'YouTube Music',
            ...(coverImage && {
                small_image: 'yt_logo',
                small_text: 'YouTube Music',
            }),
        },
        instance: false,
    };

    if (!isPaused) {
        const startTimestamp = Date.now() - (currentSeconds * 1000);
        const endTimestamp = startTimestamp + (totalSeconds * 1000);
        activity.timestamps = {
            start: startTimestamp,
            end: endTimestamp,
        };
    }

    const coverStatus = coverImage ? 'external cover art' : 'YouTube Music logo fallback';
    if (coverStatus !== lastCoverStatus) {
        console.log(`Presence image: ${coverStatus}`);
        lastCoverStatus = coverStatus;
    }

    if (songUrlChanged) {
        console.log(`Presence song link: ${songUrl || 'not set (invalid or missing track URL)'}`);
        lastSongUrl = songUrl;
    }

    client.request('SET_ACTIVITY', {
        pid: process.pid,
        activity,
    }).then(() => {
        if (songUrlChanged && songUrl) {
            console.log('Discord RPC accepted activity update with song link.');
        }
    }).catch(err => console.error('RPC Error (Playing):', err.message));
    res.sendStatus(200);
});

app.listen(3000, 'localhost', () => console.log('Bridge server running on http://localhost:3000'));
connectToDiscord();