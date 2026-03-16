#!/bin/bash

# Montana Fishing Reports - Full Backup Script
# Run this to backup the current working version

echo "=========================================="
echo "BACKING UP MONTANA FISHING REPORTS"
echo "=========================================="
echo ""

# Create backup directory with timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="backups/backup-$TIMESTAMP"
mkdir -p "$BACKUP_DIR"

echo "1. Backing up Git repository..."
git bundle create "$BACKUP_DIR/repo.bundle" --all
echo "   ✓ Repository backed up"

echo ""
echo "2. Backing up favicons..."
cp -r public/favicons "$BACKUP_DIR/"
echo "   ✓ Favicons backed up ($(ls public/favicons | wc -l) icons)"

echo ""
echo "3. Backing up configuration files..."
cp app.json "$BACKUP_DIR/" 2>/dev/null || true
cp package.json "$BACKUP_DIR/" 2>/dev/null || true
cp .env.example "$BACKUP_DIR/" 2>/dev/null || true
cp railway.json "$BACKUP_DIR/" 2>/dev/null || true
echo "   ✓ Config files backed up"

echo ""
echo "4. Creating version info..."
cat > "$BACKUP_DIR/VERSION.txt" << EOL
Montana Fishing Reports Backup
Date: $(date)
Git Commit: $(git rev-parse HEAD)
Git Branch: $(git branch --show-current)
EOL
echo "   ✓ Version info created"

echo ""
echo "5. Database backup (if Railway CLI available)..."
if command -v railway &> /dev/null; then
    echo "   Run this separately to backup database:"
    echo "   railway connect"
    echo "   pg_dump -h \$PGHOST -U \$PGUSER -d \$PGDATABASE > db-backup-$TIMESTAMP.sql"
else
    echo "   Railway CLI not found. Database backup skipped."
fi

echo ""
echo "=========================================="
echo "BACKUP COMPLETE!"
echo "Location: $BACKUP_DIR"
echo "=========================================="
