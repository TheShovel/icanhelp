# Linux Backup & Restore

## rsync

### Local Backup

```bash
# Basic sync (archive mode, preserve permissions, verbose)
rsync -av /source/ /destination/

# With progress and stats
rsync -av --progress --stats /source/ /destination/

# Dry run
rsync -av --dry-run /source/ /destination/

# Delete extraneous files in destination
rsync -av --delete /source/ /destination/

# Exclude patterns
rsync -av --exclude='*.tmp' --exclude='cache/' /source/ /dest/

# From exclude file
rsync -av --exclude-from=/path/to/exclude.txt /source/ /dest/
```

### Remote Backup (SSH)

```bash
# Push to remote
rsync -avz -e ssh /source/ user@remote:/destination/

# Pull from remote
rsync -avz -e ssh user@remote:/source/ /destination/

# With specific SSH port
rsync -avz -e "ssh -p 2222" /source/ user@remote:/dest/

# With SSH key
rsync -avz -e "ssh -i ~/.ssh/backup_key" /source/ user@remote:/dest/

# Bandwidth limit (KB/s)
rsync -avz --bwlimit=10000 /source/ user@remote:/dest/
```

### Incremental Backup with Hard Links

```bash
#!/bin/bash
# incremental-backup.sh

SOURCE="/home/user/"
DEST="/mnt/backup/"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
LATEST="$DEST/latest"
CURRENT="$DEST/$DATE"

rsync -av --delete \
  --link-dest="$LATEST" \
  "$SOURCE" "$CURRENT"

# Update latest symlink
ln -sfn "$CURRENT" "$LATEST"

# Clean old backups (keep last 30)
find "$DEST" -maxdepth 1 -type d -name '20*' | sort | head -n -30 | xargs rm -rf
```

### rsync Exclude Patterns

```bash
# /etc/rsync-exclude.txt
.cache/
*.cache
*.tmp
*.swp
*~
.Trash/
lost+found/
/proc/
/sys/
/dev/
/run/
/mnt/
/media/
/tmp/
*.log
node_modules/
__pycache__/
*.pyc
.git/
*.iso
*.img
```

```bash
rsync -av --exclude-from=/etc/rsync-exclude.txt / /mnt/backup/
```

## borg (BorgBackup)

### Installation

```bash
# Ubuntu/Debian
apt install borgbackup

# Fedora
dnf install borgbackup

# Arch
pacman -S borg

# pipx (recommended)
pipx install borgbackup
```

### Initialize Repository

```bash
# Local repository
borg init --encryption=repokey /mnt/backup/borg-repo

# Remote repository (SSH)
borg init --encryption=repokey user@backup-server:/path/to/repo

# Encryption modes:
# none          - No encryption
# keyfile       - Key in ~/.config/borg/keys/
# repokey       - Key in repository config (recommended)
# authenticated - Authenticated encryption
# authenticated-blake2 - BLAKE2b authenticated
```

### Create Backup

```bash
# Basic backup
borg create --stats --compression lz4 /mnt/backup/borg-repo::'{hostname}-{now:%Y-%m-%d_%H:%M}' /home/user --exclude '*/.cache' --exclude '*/node_modules' --exclude '*.pyc'

# With options
borg create \
  --stats \
  --progress \
  --compression lz4 \
  --exclude '*/.cache' \
  --exclude '*/node_modules' \
  --exclude '*/.git' \
  --exclude '*.pyc' \
  --exclude '*.log' \
  --exclude-caches \
  /mnt/backup/borg-repo::'{hostname}-{now:%Y-%m-%d_%H:%M}' \
  /home/user \
  /etc \
  /var/www
```

### Exclude Patterns (borg)

```bash
# --exclude patterns (fnmatch)
--exclude '*.pyc'
--exclude '*/__pycache__/*'
--exclude '*/.git/*'

# --exclude-from file
--exclude-from /etc/borg-excludes.txt

# --exclude-caches (exclude directories with CACHEDIR.TAG)
--exclude-caches

# --exclude-if-present (exclude dir if file exists)
--exclude-if-present .nobackup
```

### List & Extract

```bash
# List archives
borg list /mnt/backup/borg-repo

# List archive contents
borg list /mnt/backup/borg-repo::'{hostname}-2024-01-15_02:00'

# Extract to current directory
borg extract /mnt/backup/borg-repo::'{hostname}-2024-01-15_02:00'

# Extract specific path
borg extract /mnt/backup/borg-repo::archive-name home/user/documents

# Mount archive (read-only)
mkdir /mnt/borg-mount
borg mount /mnt/backup/borg-repo::archive-name /mnt/borg-mount
# Browse files normally
fusermount -u /mnt/borg-mount
```

### Prune & Compact

```bash
# Keep last 7 daily, 4 weekly, 6 monthly
borg prune --list --stats \
  --keep-daily 7 \
  --keep-weekly 4 \
  --keep-monthly 6 \
  /mnt/backup/borg-repo

# Keep yearly
borg prune --keep-yearly 2 ...

# Compact repository (reclaim space)
borg compact /mnt/backup/borg-repo

# Check repository integrity
borg check -v /mnt/backup/borg-repo
borg check --repair /mnt/backup/borg-repo  # Repair if needed
```

### Automation Script

```bash
#!/bin/bash
# /usr/local/bin/borg-backup.sh

REPO="user@backup-server:/backups/$(hostname)"
export BORG_PASSPHRASE="your-passphrase"
export BORG_REPO="$REPO"

# Backup
borg create --stats --compression lz4 \
  --exclude-caches \
  --exclude '*/.cache' \
  --exclude '*/node_modules' \
  --exclude '*/.git' \
  --exclude '*.pyc' \
  ::{hostname}-{now:%Y-%m-%d_%H:%M} \
  /home /etc /var/www

# Prune
borg prune --list --stats \
  --keep-daily 7 \
  --keep-weekly 4 \
  --keep-monthly 6 \
  --keep-yearly 2

# Compact monthly
if [ $(date +%d) -eq 01 ]; then
  borg compact
fi

# Check
borg check -v
```

### Systemd Timer

```ini
# /etc/systemd/system/borg-backup.service
[Unit]
Description=Borg Backup
Requires=network-online.target
After=network-online.target

[Service]
Type=oneshot
Environment=BORG_REPO=user@backup:/backups/%H
Environment=BORG_PASSPHRASE=your-passphrase
ExecStart=/usr/local/bin/borg-backup.sh
Nice=19
IOSchedulingClass=best-effort
IOSchedulingPriority=7
```

```ini
# /etc/systemd/system/borg-backup.timer
[Unit]
Description=Daily Borg Backup

[Timer]
OnCalendar=daily
Persistent=true
RandomizedDelaySec=1h

[Install]
WantedBy=timers.target
```

```bash
systemctl enable --now borg-backup.timer
```

## restic

### Installation

```bash
# Ubuntu/Debian
apt install restic

# Fedora
dnf install restic

# Arch
pacman -S restic

# Binary release
curl -LO https://github.com/restic/restic/releases/latest/download/restic_0.17.0_linux_amd64.bz2
bunzip2 restic_0.17.0_linux_amd64.bz2
chmod +x restic_0.17.0_linux_amd64
mv restic_0.17.0_linux_amd64 /usr/local/bin/restic
```

### Initialize Repository

```bash
# Local
restic init --repo /mnt/backup/restic-repo

# Remote (SFTP)
restic init --repo sftp:user@host:/backups/restic

# Remote (S3)
restic init --repo s3:s3.amazonaws.com/bucket-name

# Remote (REST server)
restic init --repo rest:http://backup-server:8000/

# With password file
restic init --repo /mnt/backup/restic-repo --password-file /etc/restic/password
```

### Backup

```bash
# Basic backup
restic backup --repo /mnt/backup/restic-repo /home/user

# With options
restic backup \
  --repo /mnt/backup/restic-repo \
  --password-file /etc/restic/password \
  --verbose \
  --exclude-file /etc/restic/excludes.txt \
  --tag "daily" \
  /home/user /etc /var/www

# Exclude patterns file
# /etc/restic/excludes.txt
*.cache
*/node_modules/*
*/.git/*
*.pyc
*.log
/var/cache/*
/tmp/*
```

### List & Restore

```bash
# List snapshots
restic snapshots --repo /mnt/backup/restic-repo

# List files in snapshot
restic ls --repo /mnt/backup/restic-repo latest

# Restore to directory
restic restore --repo /mnt/backup/restic-repo --target /restore latest

# Restore specific snapshot
restic restore --repo /mnt/backup/restic-repo --target /restore abc123

# Restore specific path
restic restore --repo /mnt/backup/restic-repo --target /restore --include /home/user/docs latest

# Mount repository
mkdir /mnt/restic
restic mount --repo /mnt/backup/restic-repo /mnt/restic
# Browse snapshots in /mnt/restic/snapshots/
fusermount -u /mnt/restic
```

### Prune & Check

```bash
# Keep policies
restic forget --repo /mnt/backup/restic-repo \
  --keep-daily 7 \
  --keep-weekly 4 \
  --keep-monthly 6 \
  --keep-yearly 2 \
  --prune

# Check repository
restic check --repo /mnt/backup/restic-repo

# Check with data verification
restic check --repo /mnt/backup/restic-repo --read-data

# Rebuild index
restic rebuild-index --repo /mnt/backup/restic-repo
```

## timeshift (System Snapshots)

### Installation

```bash
# Ubuntu/Debian
apt install timeshift

# Fedora
dnf install timeshift

# Arch
pacman -S timeshift
```

### Configuration (GUI or CLI)

```bash
# CLI setup
timeshift --create --comments "Initial snapshot" --tags D

# List snapshots
timeshift --list

# Restore (requires live USB for system restore)
timeshift --restore --snapshot '2024-01-15_10-30-00' --target /dev/sda2

# Delete old snapshots
timeshift --delete --snapshot '2024-01-01_00-00-00'
```

### Configuration File

```ini
# /etc/timeshift/default.conf
[default]
snapshot_device = /dev/sda3
snapshot_dir = /timeshift
backup_device_uuid = 
backup_level = 0
exclude = ['/home/*/.cache', '/home/*/node_modules', '/var/cache', '/tmp', '/var/tmp']
include = []
exclude_patterns = ['*.log', '*.tmp', '*.cache']
stop_on_error = false
compress = true
compress_method = gzip
rsync_compress = true
```

## tar + Compression

### Basic Archives

```bash
# Create archive
tar -czf backup-$(date +%F).tar.gz /home/user

# With exclusions
tar -czf backup.tar.gz \
  --exclude='*.tmp' \
  --exclude='*/.cache' \
  --exclude='*/node_modules' \
  /home/user

# Extract
tar -xzf backup.tar.gz -C /restore/path

# List contents
tar -tzf backup.tar.gz

# Extract single file
tar -xzf backup.tar.gz -C /restore home/user/file.txt
```

### Incremental with tar

```bash
# Level 0 (full)
tar -czf backup-level0.tar.gz -g /var/log/backup.snar /home/user

# Level 1 (incremental)
tar -czf backup-level1-$(date +%F).tar.gz -g /var/log/backup.snar /home/user

# Restore incremental
tar -xzf backup-level0.tar.gz
tar -xzf backup-level1-2024-01-15.tar.gz
```

## Cloud Backup

### rclone

```bash
# Install
curl https://rclone.org/install.sh | bash

# Configure
rclone config

# Sync to cloud
rclone sync /home/user/remote:bucket/path --progress --transfers 4

# Mount cloud storage
rclone mount remote:bucket /mnt/cloud --vfs-cache-mode full
```

### Restic + Cloud

```bash
# S3
restic init --repo s3:s3.amazonaws.com/bucket-name

# Backblaze B2
restic init --repo b2:bucket-name:path

# Google Cloud
restic init --repo gs:bucket-name:path

# Azure
restic init --repo azure:container-name:path
```

## Automation with systemd

### Daily Backup Service

```ini
# /etc/systemd/system/backup.service
[Unit]
Description=Daily Backup
Requires=network-online.target
After=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/backup.sh
Nice=19
IOSchedulingClass=best-effort
IOSchedulingPriority=7
```

```ini
# /etc/systemd/system/backup.timer
[Unit]
Description=Daily Backup Timer

[Timer]
OnCalendar=daily
Persistent=true
RandomizedDelaySec=2h

[Install]
WantedBy=timers.target
```

```bash
systemctl enable --now backup.timer
```

### Backup Script Template

```bash
#!/bin/bash
# /usr/local/bin/backup.sh

set -euo pipefail

LOG_FILE="/var/log/backup.log"
REPO="/mnt/backup/borg-repo"
export BORG_PASSPHRASE="$(cat /etc/borg/passphrase)"
export BORG_REPO="$REPO"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "Starting backup"

# Pre-backup checks
if ! mountpoint -q /mnt/backup; then
    log "ERROR: Backup drive not mounted"
    exit 1
fi

# Create backup
borg create --stats --compression lz4 \
  --exclude-caches \
  --exclude '*/.cache' \
  --exclude '*/node_modules' \
  --exclude '*/.git' \
  ::{hostname}-{now:%Y-%m-%d_%H:%M} \
  /home /etc /var/www 2>&1 | tee -a "$LOG_FILE"

# Prune
borg prune --list --stats \
  --keep-daily 7 \
  --keep-weekly 4 \
  --keep-monthly 6 \
  --keep-yearly 2 2>&1 | tee -a "$LOG_FILE"

# Verify
borg check -v 2>&1 | tee -a "$LOG_FILE"

log "Backup completed"
```

## Monitoring & Alerting

```bash
# Check backup age
find /mnt/backup -name "*.tar.gz" -mtime -1 | wc -l

# Borg last backup time
borg list --last 1 /mnt/backup/borg-repo --format '{start}{nl}'

# Restic last snapshot
restic snapshots --latest 1 --repo /mnt/backup/restic-repo

# Alert if backup older than 48h
#!/bin/bash
LAST_BACKUP=$(borg list --last 1 /mnt/backup/borg-repo --format '{start:%s}')
NOW=$(date +%s)
AGE=$((NOW - LAST_BACKUP))
if [ $AGE -gt 172800 ]; then
    echo "Backup is older than 48 hours!" | mail -s "Backup Alert" admin@example.com
fi
```

## Restore Testing

```bash
#!/bin/bash
# test-restore.sh - Monthly restore test

TEST_DIR="/tmp/restore-test-$(date +%s)"
mkdir -p "$TEST_DIR"

# Test borg
borg extract /mnt/backup/borg-repo::latest "$TEST_DIR" home/user/important-file.txt

# Verify
if [ -f "$TEST_DIR/home/user/important-file.txt" ]; then
    echo "Restore test PASSED"
else
    echo "Restore test FAILED" | mail -s "Restore Test Failed" admin@example.com
fi

rm -rf "$TEST_DIR"
```

## Backup Strategy Matrix

| Data Type | Frequency | Retention | Tool | Location |
|-----------|-----------|-----------|------|----------|
| System (OS) | Weekly | 4 weeks | timeshift/borg | Local + Remote |
| User data | Daily | 90 days | borg/restic | Local + Remote |
| Databases | Daily + hourly | 30 days | pg_dump/mysqldump + borg | Local + Remote |
| Config (/etc) | Daily | 1 year | etckeeper/git + borg | Local + Remote |
| Logs | Weekly | 30 days | logrotate + rsync | Local |
| Media/Archives | Monthly | Forever | rsync | Cold storage |

## Disaster Recovery Plan

1. **Document**: Keep recovery procedures in `/root/disaster-recovery.md`
2. **Test**: Monthly restore test to staging
3. **Offsite**: At least one backup offsite (cloud/remote)
4. **Offline**: One backup offline (disconnected drive)
5. **Encryption**: All offsite backups encrypted
6. **Keys**: Backup encryption keys separately (password manager, printed)
7. **Boot media**: Keep live USB with restore tools