-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    source VARCHAR(100) NOT NULL,
    river VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    title VARCHAR(255),
    last_updated VARCHAR(50),
    author VARCHAR(100),
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Create hatch_reports table for dynamic hatch data
CREATE TABLE IF NOT EXISTS hatch_reports (
    id SERIAL PRIMARY KEY,
    river VARCHAR(100) NOT NULL,
    source VARCHAR(100) NOT NULL,
    hatches TEXT[], -- Array of current hatches
    fly_recommendations TEXT[], -- Array of recommended flies
    hatch_details JSONB, -- Detailed info about each hatch
    water_temp VARCHAR(20),
    water_conditions TEXT,
    report_date DATE NOT NULL,
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_current BOOLEAN DEFAULT true
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_river ON reports(river);
CREATE INDEX IF NOT EXISTS idx_scraped_at ON reports(scraped_at);
CREATE INDEX IF NOT EXISTS idx_is_active ON reports(is_active);
CREATE INDEX IF NOT EXISTS idx_river_active ON reports(river, is_active);
CREATE INDEX IF NOT EXISTS idx_river_scraped ON reports(river, scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_hatch_river ON hatch_reports(river);
CREATE INDEX IF NOT EXISTS idx_hatch_current ON hatch_reports(is_current);
CREATE INDEX IF NOT EXISTS idx_hatch_date ON hatch_reports(report_date);

-- Additional performance indexes for API queries
CREATE INDEX IF NOT EXISTS idx_source ON reports(source);
CREATE INDEX IF NOT EXISTS idx_river_source ON reports(river, source);