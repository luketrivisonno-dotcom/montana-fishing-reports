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

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_river ON reports(river);
CREATE INDEX IF NOT EXISTS idx_scraped_at ON reports(scraped_at);