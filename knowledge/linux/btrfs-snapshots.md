# Btrfs Snapshots and Recovery

Snapshots are cheap copy-on-write views of a subvolume at a point in time. They are **not** backups by themselves (same disk); use them for fast rollback after updates/config changes. Use separate backups (rsync/borg) for disk loss or corruption.

## Inspect (safe, read-only)
```bash
btrfs subvolume list /
btrfs subvolume show /
btrfs filesystem usage /
btrfs filesystem df /
btrfs scrub start -Bd /
btrfs scrub status /
btrfs check --readonly /dev/sdXN     # unmounted only; never use --repair casually
```

## Manual Snapshot
```bash
sudo btrfs subvolume snapshot -r /@  /.snapshots/root-before-change
sudo btrfs subvolume snapshot -r /@home /.snapshots/home-before-change
```
Use read-only (`-r`) snapshots. Name with purpose+date, e.g. `2026-07-10-before-kernel-update`. Keep a few manual plus automatic hourly/daily ones.

## Snapper
```bash
sudo snapper -c root create-config /
sudo snapper -c root create --description "before upgrade"
sudo snapper -c root list
sudo snapper -c root status 12..13
sudo snapper -c root diff 12..13
sudo snapper -c root undochange 12..13
```
`status` shows changed files; review `diff` before `undochange`.

## Timeshift
- Use Btrfs mode only with `@`/`@home` subvolume layout.
- Prefer RSYNC mode on non-Btrfs filesystems.
- Test a restore once before relying on it.

## Rollback Checklist
1. Take a fresh snapshot before rollback.
2. Confirm root vs home subvolumes.
3. Boot a live USB if system won't boot.
4. Mount top-level with `subvolid=5`.
5. Rename the broken subvolume instead of deleting it.
6. Set the restored snapshot active per distro docs.

## Maintenance
- Run `btrfs scrub` monthly to verify checksums.
- Balance only when needed (after deleting many snapshots): `btrfs balance start -dusage=50 /`.
- Avoid routine full balances (wear/time). Watch free space — metadata can exhaust while data shows free.

## Common Problems
- `No space left` with free space: delete old snapshots, then limited metadata balance.
- Bootloader missing rollback: regenerate bootloader config.
- Snapshot grows fast: exclude large/changing dirs (VM images, caches, build dirs) from snapshotted subvolumes.
