-- River Reports Table (Live user-submitted conditions)
CREATE TABLE IF NOT EXISTS river_reports (
    id SERIAL PRIMARY KEY,
    river VARCHAR(100) NOT NULL,
    user_email VARCHAR(255),
    user_name VARCHAR(100),
    
    -- Water Conditions
    water_color VARCHAR(50), -- clear, stained, muddy, blown
    water_clarity INTEGER, -- 1-10 scale
    weed_level VARCHAR(50), -- none, light, moderate, heavy
    flow_condition VARCHAR(50), -- normal, high, low, dropping, rising
    
    -- Fish Activity
    fish_activity VARCHAR(50), -- rising, active, slow, not_seen
    insects_active VARCHAR(200), -- comma-separated list
    fish_caught INTEGER DEFAULT 0,
    fish_rising BOOLEAN DEFAULT FALSE,
    
    -- Location & Time
    access_point VARCHAR(200),
    section_fished VARCHAR(200),
    start_time TIME,
    end_time TIME,
    date_fished DATE DEFAULT CURRENT_DATE,
    
    -- Environmental
    air_temp INTEGER,
    water_temp INTEGER,
    wind_speed INTEGER,
    wind_direction VARCHAR(10),
    
    -- Notes
    notes TEXT,
    flies_used TEXT,
    best_patterns TEXT,
    
    -- Metadata
    lat DECIMAL(10, 8),
    lon DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_river_reports_river ON river_reports(river);
CREATE INDEX IF NOT EXISTS idx_river_reports_date ON river_reports(date_fished);
CREATE INDEX IF NOT EXISTS idx_river_reports_created ON river_reports(created_at DESC);

-- HatchCast Score History (to track how scores improve with user data)
CREATE TABLE IF NOT EXISTS hatchcast_scores (
    id SERIAL PRIMARY KEY,
    river VARCHAR(100) NOT NULL,
    base_score INTEGER,
    adjusted_score INTEGER,
    user_report_count INTEGER DEFAULT 0,
    factors JSONB,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hatchcast_river ON hatchcast_scores(river);
CREATE INDEX IF NOT EXISTS idx_hatchcast_calculated ON hatchcast_scores(calculated_at DESC);
