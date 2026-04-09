const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db/index');

const STREAMLABS_AUTH_URL = 'https://www.streamlabs.com/api/v1.0/authorize';
const STREAMLABS_TOKEN_URL = 'https://www.streamlabs.com/api/v1.0/token';
const STREAMLABS_USER_URL = 'https://www.streamlabs.com/api/v1.0/user';

router.get('/streamlabs', (req, res) => {
    const params = new URLSearchParams({
        client_id: process.env.STREAMLABS_CLIENT_ID,
        redirect_uri: process.env.STREAMLABS_REDIRECT_URI,
        response_type: 'code',
        scope: 'donations.read socket.token'
    });
    res.redirect(`${STREAMLABS_AUTH_URL}?${params.toString()}`);
});

router.get('/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send('No authorization code received');
    }

    try {
        const tokenResponse = await axios.post(STREAMLABS_TOKEN_URL, {
            grant_type: 'authorization_code',
            client_id: process.env.STREAMLABS_CLIENT_ID,
            client_secret: process.env.STREAMLABS_CLIENT_SECRET,
            redirect_uri: process.env.STREAMLABS_REDIRECT_URI,
            code
        });

        const { access_token, refresh_token, expires_in } = tokenResponse.data;

        const userResponse = await axios.get(STREAMLABS_USER_URL, {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        console.log('Streamlabs user response:', JSON.stringify(userResponse.data, null, 2));

        const { streamlabs_id, display_name } = userResponse.data;

        const tokenExpiresAt = new Date(Date.now() + expires_in * 1000);

        const result = await db.query(`
            INSERT INTO streamers (streamlabs_id, display_name, access_token, refresh_token, token_expires_at)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (streamlabs_id) DO UPDATE SET
                display_name = EXCLUDED.display_name,
                access_token = EXCLUDED.access_token,
                refresh_token = EXCLUDED.refresh_token,
                token_expires_at = EXCLUDED.token_expires_at,
                updated_at = NOW()
            RETURNING id
        `, [streamlabs_id, display_name, access_token, refresh_token, tokenExpiresAt]);

        req.session.streamerId = result.rows[0].id;
        req.session.displayName = display_name;

        res.redirect('/widget');

    } catch (err) {
        console.error('OAuth callback error:', err.response?.data || err.message);
        res.status(500).send('Authentication failed');
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;
