CREATE TABLE IF NOT EXISTS streamers (
    id SERIAL PRIMARY KEY,
    streamlabs_id VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    twitch_username VARCHAR(255),
    youtube_channel_id VARCHAR(255),
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    streamer_id INTEGER REFERENCES streamers(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    amount_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10),
    raw_amount NUMERIC(10,2),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stream_sessions (
    id SERIAL PRIMARY KEY,
    streamer_id INTEGER REFERENCES streamers(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_streamer_id ON events(streamer_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_platform ON events(platform);
CREATE INDEX IF NOT EXISTS idx_stream_sessions_streamer_id ON stream_sessions(streamer_id);
