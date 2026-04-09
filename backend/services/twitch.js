const axios = require('axios');
const db = require('../db/index');

let appAccessToken = null;
let tokenExpiresAt = null;

const getAppAccessToken = async () => {
    if (appAccessToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
        return appAccessToken;
    }

    const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
        params: {
            client_id: process.env.TWITCH_CLIENT_ID,
            client_secret: process.env.TWITCH_CLIENT_SECRET,
            grant_type: 'client_credentials'
        }
    });

    appAccessToken = response.data.access_token;
    tokenExpiresAt = Date.now() + (response.data.expires_in * 1000);

    return appAccessToken;
};

const getStreamStatus = async (twitchUsername) => {
    const token = await getAppAccessToken();

    const response = await axios.get('https://api.twitch.tv/helix/streams', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Client-Id': process.env.TWITCH_CLIENT_ID
        },
        params: { user_login: twitchUsername }
    });

    const stream = response.data.data[0];

    if (!stream) {
        return { isLive: false };
    }

    return {
        isLive: true,
        startedAt: new Date(stream.started_at)
    };
};

const checkAndUpdateStreamSession = async (streamerId, twitchUsername) => {
    try {
        const { isLive, startedAt } = await getStreamStatus(twitchUsername);

        if (isLive) {
            await db.query(`
                INSERT INTO stream_sessions (streamer_id, started_at)
                VALUES ($1, $2)
                ON CONFLICT DO NOTHING
            `, [streamerId, startedAt]);
        } else {
            await db.query(`
                UPDATE stream_sessions
                SET ended_at = NOW()
                WHERE streamer_id = $1
                AND ended_at IS NULL
            `, [streamerId]);
        }
    } catch (err) {
        console.error('Stream status check error:', err.message);
    }
};

module.exports = { getStreamStatus, checkAndUpdateStreamSession };
