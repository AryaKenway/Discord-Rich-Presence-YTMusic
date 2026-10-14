const RPC = require('discord-rpc');
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(cors());

const clientId = '1491107428505227264'; 
let client;
let reconnectTimer;
let lastCoverStatus;
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

function getExternalImageKey(imageUrl) {
    if (typeof imageUrl !== 'string') return null;

    let parsedUrl;
    try {
        parsedUrl = new URL(imageUrl);
    } catch {
        return null;
    }

    if (parsedUrl.protocol !== 'https:' || parsedUrl.username || parsedUrl.password) return null;

    const url = parsedUrl.toString();
    const urlHash = crypto.createHash('sha256').update(url).digest('hex');
    const imageKey = `mp:external/${urlHash}/${url}`;
    return imageKey.length <= 256 ? imageKey : null;
}

app.post('/update', (req, res) => {
    const { title, artist, isPaused, current, total, coverUrl } = req.body;

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
    const coverImage = getExternalImageKey(coverUrl);
    const currentSeconds = parseTimeToSeconds(current);
    const totalSeconds = parseTimeToSeconds(total);
    const activity = {
        name: 'YouTube Music',
        type: 2,
        details: detailsStr,
        state: finalizeStr(`by ${artist}`),
        assets: {
            large_image: coverImage || 'yt_logo',
            large_text: coverImage ? finalizeStr(title) : 'YouTube Music',
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

    client.request('SET_ACTIVITY', {
        pid: process.pid,
        activity,
    }).catch(err => console.error('RPC Error (Playing):', err.message));
    res.sendStatus(200);
});

app.listen(3000, 'localhost', () => console.log('Bridge server running on http://localhost:3000'));
connectToDiscord();