const RPC = require('discord-rpc');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const clientId = 'Insert ID Here'; 
const client = new RPC.Client({ transport: 'ipc' });

// Helper to convert "MM:SS" or "HH:MM:SS" to total seconds
function parseTimeToSeconds(timeStr) {
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    if (parts.length === 2) return (parts[0] * 60) + parts[1];
    return 0;
}

app.post('/update', (req, res) => {
    let { title, artist, isPaused, current, total } = req.body;

    // A more robust truncate that ensures the FINAL string is under 128
    const finalizeStr = (str) => {
        if (!str) return "Unknown";
        // Discord limit is 128. We cut at 125 to leave room for "..."
        return str.length > 128 ? str.substring(0, 125) + "..." : str;
    };

    // Construct the strings FIRST, then truncate the whole thing
    const detailsStr = finalizeStr(isPaused ? `Paused: ${title}` : title);
    const stateStr = finalizeStr(`by ${artist}`);

    if (isPaused) {
        client.setActivity({
            details: detailsStr,
            state: stateStr,
            largeImageKey: 'yt_logo',
            largeImageText: 'YouTube Music',
            instance: false,
        }).catch(err => console.error("RPC Error (Paused):", err.message));
    } else {
        const currentSeconds = parseTimeToSeconds(current);
        const totalSeconds = parseTimeToSeconds(total);
        
        const now = Date.now();
        const startTimestamp = Math.floor(now - (currentSeconds * 1000));
        const endTimestamp = Math.floor(startTimestamp + (totalSeconds * 1000));

        client.setActivity({
            details: detailsStr,
            state: stateStr,
            startTimestamp,
            endTimestamp,
            largeImageKey: 'yt_logo',
            largeImageText: 'YouTube Music',
            instance: false,
        }).catch(err => console.error("RPC Error (Playing):", err.message));
    }
    res.sendStatus(200);
});
client.login({ clientId }).then(() => {
    console.log('Discord RPC Connected!');
    app.listen(3000, () => console.log('Bridge server running on port 3000'));
});