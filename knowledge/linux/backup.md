# Backup & Restore

Universal tools (`rsync`, `tar`, `find`, `openssl`) are NOT wrapped by `sys` — use them directly.

## rsync (tested for real)
```bash
rsync -av /source/ /destination/                 # archive, preserve perms
rsync -av --progress --stats /source/ /dest/
rsync -av --dry-run /source/ /dest/              # preview
rsync -av --delete /source/ /dest/               # mirror (deletes extras)
rsync -av --exclude='*.tmp' --exclude='cache/' /source/ /dest/
rsync -av --exclude-from=/etc/rsync-exclude.txt / /mnt/backup/

# Remote over SSH
rsync -avz -e ssh /source/ user@remote:/dest/
rsync -avz -e "ssh -p 2222" /source/ user@remote:/dest/
rsync -avz --bwlimit=10000 /source/ user@remote:/dest/   # KB/s limit
```

### Incremental with hard links
```bash
DATE=$(date +%Y-%m-%d_%H-%M-%S)
rsync -av --delete --link-dest="$DEST/latest" "$SRC" "$DEST/$DATE"
ln -sfn "$DEST/$DATE" "$DEST/latest"
```

## tar + Compression (tested for real)
```bash
tar -czf backup-$(date +%F).tar.gz /home/user
tar -czf backup.tar.gz --exclude='*.tmp' --exclude='*/.cache' /home/user
tar -tzf backup.tar.gz                 # list
tar -xzf backup.tar.gz -C /restore/path
tar -xzf backup.tar.gz -C /restore home/user/file.txt
# Incremental:
tar -czf lvl0.tar.gz -g /var/log/backup.snar /home/user
tar -czf lvl1.tar.gz -g /var/log/backup.snar /home/user
```

## borg (BorgBackup) — NOT installed here; syntax per docs
```bash
# Install: pacman -S borg   (or pipx install borgbackup)
borg init --encryption=repokey /mnt/backup/borg-repo
borg create --stats --compression lz4 /mnt/backup/borg-repo::'{hostname}-{now:%Y-%m-%d_%H:%M}' /home/user --exclude '*/.cache'
borg list /mnt/backup/borg-repo
borg extract /mnt/backup/borg-repo::archive-name home/user/documents
borg prune --list --stats --keep-daily 7 --keep-weekly 4 --keep-monthly 6 /mnt/backup/borg-repo
borg check -v /mnt/backup/borg-repo
```

## restic — NOT installed here; syntax per docs
```bash
# Install: pacman -S restic
restic init --repo /mnt/backup/restic-repo
restic backup --repo /mnt/backup/restic-repo --exclude-file /etc/restic/excludes.txt --tag "daily" /home/user /etc /var/www
restic snapshots --repo /mnt/backup/restic-repo
restic restore --repo /mnt/backup/restic-repo --target /restore latest
restic forget --repo /mnt/backup/restic-repo --keep-daily 7 --keep-weekly 4 --keep-monthly 6 --prune
restic check --repo /mnt/backup/restic-repo
```

## timeshift (system snapshots) — NOT installed here
```bash
# Install: pacman -S timeshift
timeshift --create --comments "Initial snapshot" --tags D
timeshift --list
timeshift --restore --snapshot '2024-01-15_10-30-00' --target /dev/sda2
```

## Cloud (rclone / restic remotes)
```bash
rclone sync /home/user remote:bucket/path --progress --transfers 4
restic init --repo s3:s3.amazonaws.com/bucket-name
restic init --repo b2:bucket-name:path
```

## Automation (systemd)
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
sys svc enable --now backup.timer
```

## Strategy
- System: weekly (timeshift/borg), local + remote.
- User data: daily (borg/restic), local + remote.
- Databases: `pg_dump`/`mysqldump` + borg, daily+hourly.
- Keep ≥1 offsite (encrypted) and ≥1 offline copy. Test restores monthly.
