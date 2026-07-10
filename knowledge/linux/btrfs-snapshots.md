# Btrfs Snapshots and Recovery

## Core Concepts
- Btrfs snapshots are cheap, copy-on-write views of a subvolume at a point in time.
- Snapshots are not backups by themselves: they usually live on the same disk and disappear if the disk fails.
- Use snapshots for fast rollback after updates, config changes, package installs, and accidental file edits.
- Use separate backups for disk loss, theft, filesystem corruption, and ransomware.

## Useful Commands
```bash
btrfs subvolume list /
btrfs subvolume show /
btrfs filesystem usage /
btrfs filesystem df /
btrfs scrub start -Bd /
btrfs scrub status /
btrfs check --readonly /dev/sdXN
```
Run `btrfs check` only on an unmounted filesystem unless documentation says otherwise. Never use `--repair` casually; it can make damage worse.

## Manual Snapshot Pattern
```bash
sudo btrfs subvolume snapshot -r /@ /.snapshots/root-before-change
sudo btrfs subvolume snapshot -r /@home /.snapshots/home-before-change
```
Use read-only snapshots for safety. Name snapshots with purpose and date, such as `2026-07-10-before-kernel-update`. Keep a small number of manual snapshots plus automatic hourly/daily ones.

## Snapper Basics
```bash
sudo snapper -c root create-config /
sudo snapper -c root create --description "before upgrade"
sudo snapper -c root list
sudo snapper -c root status 12..13
sudo snapper -c root diff 12..13
sudo snapper -c root undochange 12..13
```
`snapper status` shows changed files between snapshots. `undochange` reverts selected changes; review diffs before applying.

## Timeshift Basics
- Use Btrfs mode only when the distro layout is compatible with `@` and `@home` subvolumes.
- Prefer RSYNC mode on non-Btrfs filesystems.
- Include home dotfiles only if you want config rollback; avoid including all personal files unless you understand the storage impact.
- Test restore once before relying on it during an emergency.

## Rollback Safety Checklist
1. Make a fresh snapshot before rollback.
2. Confirm which subvolumes are root and home.
3. Boot from a live USB if the system will not boot.
4. Mount the Btrfs top-level subvolume with `subvolid=5`.
5. Rename broken subvolume instead of deleting it immediately.
6. Set the restored snapshot as the active subvolume or replace the active subvolume according to distro docs.

## Maintenance
- Run `btrfs scrub` monthly on SSDs/HDDs to verify checksums and detect silent corruption.
- Balance only when needed, such as after deleting many snapshots or when metadata/data allocation is badly skewed.
- Avoid full balances as routine maintenance; they can take a long time and add wear.
- Watch free space: Btrfs can report free space while metadata space is exhausted.

## Common Problems
- `No space left on device` with apparent free space: delete old snapshots, then run a limited metadata balance.
- Bootloader does not see rollback: regenerate bootloader config if snapshot entries are generated dynamically.
- Snapshot grows quickly: large databases, VM images, browser caches, and build directories change often; consider excluding or storing them outside snapshotted subvolumes.
