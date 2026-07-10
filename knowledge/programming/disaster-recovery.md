# Disaster Recovery & Business Continuity

## Concepts
- **RTO** (Recovery Time Objective): max acceptable downtime (e.g., 4 hours). How quickly must the system be restored? RTO = time from disaster to recovery (point at which data loss begins? Actually start of outage)
- **RPO** (Recovery Point Objective): max acceptable data loss (e.g., 5 minutes). How far back in time must data be restored? RPO = last good backup (data loss measured in time)
- **RTO/RPO tradeoff**: shorter = more expensive (replication, hot standby). RPO 0 = synchronous replication (no data loss). RTO 0 = fully redundant active-active (zero downtime). Both expensive
- **MTTR**: Mean Time To Recover (how long to fix). **MTBF**: Mean Time Between Failures (how often it breaks). **SLA**: Service Level Agreement (contractual uptime guarantee). 99.9% = 8.7 hours downtime/year. 99.99% = 52 minutes/year. 99.999% = 5.3 minutes/year

## Backup Strategies

### 3-2-1 Rule
- **3 copies** of data (1 primary + 2 backups)
- **2 different media types** (e.g., local disk + cloud, or NAS + tape)
- **1 offsite copy** (cloud, different physical location, safety deposit box)
  - Offsite = different building, different geographic region. Don't store backup in same room as server

### Backup Types
- **Full**: everything, every time. Slowest to back up, fastest to restore. Most storage. Typically weekly
- **Incremental**: only changes since last backup (any type: full or incremental). Fastest backup, slowest restore (need last full + all incrementals). Smallest storage
- **Differential**: only changes since last FULL backup. Restore: last full + last differential. Moderate backup/restore speed
- **Synthetic full**: creates a new "full" backup by merging the last full + subsequent incrementals — without touching production data
  - Restore scenario: full backup Mon, differentials Tue-Fri. If drive fails Friday: restore Monday full + Friday diff (2 files). Incremental: Monday full + 4 incremental files (5 files) = more restore time

### Backup Locations
- **Local**: USB drive, NAS (Synology, QNAP), external HDD. Fast restore. Vulnerable to same disaster (fire, flood, theft, ransomware)
- **Cloud**: AWS S3/Glacier, Backblaze B2, Google Cloud Storage (Coldline). Slow restore (download over internet). Offsite, durable. Glacier: cheap storage, expensive retrieval ($0.01/GB/month for storage, $0.03/GB for retrieval — expect $10/GB to download 1TB. Use: archive/DR, not daily ops)
  - Backup cloud providers: Backblaze ($7/month unlimited personal — includes external drives), iDrive, Carbonite, CrashPlan. AWS S3: 11 nines durability (99.999999999%). Glacier Deep Archive: $1/TB/month retrieval in 12+ hours — suitable for last resort/legal hold
- **Hybrid**: local for fast recovery, replicate to cloud for offsite
- **Image vs file**: image (full disk/partition backup — faster restore of entire system). File (selected files/folders — faster to browse + restore individual files). Best practice: both

### Database Backups
- **Logical** (SQL dump): portable, can restore to different version/architecture. Slower backup + restore. Good for schema changes, point-in-time
- **Physical** (file copy of database files): faster backup + restore, same version required. Larger. For very large databases > 100GB
- **Point-in-time recovery** (PITR): transaction logs (WAL — Write-Ahead Log in PostgreSQL, binary logs in MySQL). Allows restore to any point in time. Requires continuous archiving (WAL to S3 every few minutes). RPO = minutes. Used frequently for: finance, accounting, e-commerce, any write-heavy transactional system

## High Availability

### Active-Passive
- One server active, one standby. Failover (automatic or manual). Resource waste (standby idle). Common: database mirroring, pair of firewalls
- Cold standby: off, need to power on + configure. Warm standby: on, running, up to date but not serving traffic. Hot standby: fully running, could serve immediately at failover

### Active-Active
- Both/all servers serving traffic simultaneously. Load balanced. No resource waste. Higher complexity (data sync, session management, split-brain: when both nodes think they're the primary and overwrite each other's data — prevent with quorum system, tiebreaker, or STONITH (shoot the other node in the head))
  - Geo-active-active: servers in multiple regions, DNS routing to closest. Global load balancer. DNS failover: if region A goes down, DNS removes from rotation — TTL dependent failover (provide fast TTL for critical services, but 300 second TTL typical for DNS records)

### Database HA
- **Replication**: master-slave (one writes, replicas read only — good for read scaling). Master-master (both write — conflict resolution needed). Asynchronous (faster, risk of data loss on failure). Synchronous (slower, no data loss if quorum)
- **Clustering**: multiple nodes act as one database. PostgreSQL: Patroni + etcd (automatic failover, consensus-based). MySQL Group Replication, Galera (synchronous multi-master). MongoDB replica sets (primary + secondaries, automatic failover). Use: when RPO matters
- **Failover**: automatic (health check → promote standby). Manual (human runs script, promotes secondary, repoints app). Automatic failover reduces downtime but risks split-brain; manual increases RTO but less complex. For most: automated failover for database is increasingly robust (Patroni, Orchestrator for MySQL)

## Disaster Scenarios

### Ransomware Recovery
- **Immediate**: isolate infected systems (disconnect from network — pull cable, not just OS shutdown). Identify scope (check logs, file extensions, ransom note). Do NOT pay ransom (no guarantee of decryption, funds criminals, 2023: only 30% who pay get all data back, some pay multiple times)
  - Plan: don't pay ransom (discourages future attacks, funds crime). BUT: some companies pay after calculating cost of not paying (client data leakage, business downtime). FBI/CI5 recommend against paying. Newer regulations (sanctions, OFAC) may prohibit paying sanctioned groups
- **Restore**: wipe all systems (can't trust infected ones — backdoors may persist). Reinstall OS, restore from clean backup (verified NOT infected before restore). Test one system first: does backup still work? Scan restored system for modifications
  - Make sure backup itself wasn't encrypted (ransomware often targets backup files if they're accessible via network. Offline/immutable backup: can't delete/modify = safest)
- **Prevention**: immutable backups (can't be deleted/modified — AWS S3 Object Lock, Wasabi, Veeam hardened repo). Offline backups (tape, disconnected). 3-2-1 with one offline. Regular restore testing (test restores quarterly — don't trust backups until restored). Least privilege access to backup system

### Cloud Outage
- **Multi-region**: deploy across 2+ cloud regions. DNS failover. Data replication across regions. Costly (duplicate infrastructure). Some regions have single AZ dependencies
- **Multi-cloud**: across AWS + Azure + GCP. Even more costly, complex. For most: single region with multi-AZ is sufficient (AWS/Azure region has 3 AZs, independent power/network. Most outages are single-AZ or single-region). Multi-region for: critical applications, compliance (physical separation), extremely high uptime demands
- **Degraded mode**: core functionality still works even if some services down. Graceful degradation: e.g., if recommendation engine fails → show default recommendations, not error page. Fail open vs fail closed

### Data Corruption
- **Detect**: checksums (automatically verify data integrity — database page checksums, ZFS/Btrfs scrubbing, S3 ETag). Monitoring (compare replicas — replication lag + data mismatch). Regular restore tests (restore from backup, run application validity checks)
- **Fix**: point-in-time recovery to before corruption. May need to replay valid transaction logs to point just before corruption event. Might lose some data (RPO tradeoff — RPO of 5 minutes = lose up to 5 minutes of data if corruption went undetected for that window). Sometimes: manual repair (if corruption limited to specific records)

## Incident Response Plan
- **Team roles**: Incident Commander (makes decisions, coordinates, 1 person — not a team). Scribe (documents timeline, actions, comms). Tech lead (investigates + fixes). Comms lead (internal + external updates). Subject matter experts (for specific systems, rotated in as needed). All roles report to one Incident Commander
- **Communication plan**: who notifies? how? (PagerDuty, Slack, phone tree). Stakeholders (internal — exec, legal, PR, affected teams). External (customers, regulators, press). Regular updates every 30-60 min during active incident, even if "no update yet"
  - Templates: pre-written incident notification templates (save time during crisis). Incident message format: "We are investigating reports of [issue]. Impact: [what's affected]. Next update: [time]. Follow: [status page URL]"
- **Runbooks**: documented step-by-step for each known scenario (hardware failure, network outage, database corruption, DDoS, security breach, cloud provider outage, certificate expiry). Include: symptoms (how to diagnose), escalation path (who to call), recovery steps (detailed commands), testing steps (how to verify recovery). Keep runbooks in version control, test annually
- **Postmortem**: held within 48-72 hours after incident resolved. BLAMELESS — culture of learning, not blame. Focus: what went wrong, what went well, what tools/processes failed, what prevented detection, what can prevent recurrence. Action items: concrete, assigned, with deadlines (owner, date, bug number). Share: with org (lessons learned — all teams benefit)
  - "5 whys": root cause analysis — ask "why" five times to dig past surface causes to systemic failures. E.g., "Why did backup fail?" → "Backup drive full" → "Why wasn't monitoring alerting on disk space?" → "Monitoring threshold was 90% but backup filled drive from 85 to 95% between checks." → "Why is backup retention so large?" → etc. Backups fail weekly? No — hard to know if they work if you don't test restores!

## Testing
- **Tabletop exercise**: team walks through scenario verbally. Find gaps in plan. No actual failover. 60-90 minutes per scenario. Good for training + testing without risk
- **Failover test**: actually switch to standby. Prove it works. Run in production (scheduled, communicated). Start small (non-critical service), then critical (after proven). Schedule: at least quarterly per critical system
- **Restore test**: restore from backup to test environment. Verify data integrity + application works. Don't just restore files — test if the restored database + code actually runs = full recovery validation. Quarterly minimum
- **Chaos engineering**: intentionally break things in production to test resilience (Netflix Chaos Monkey — randomly kills instances during business hours. Principles: build systems that survive failures). Start small: kill one instance, see if auto-scaling / health checks + load balancer handle it. Level up: kill AZ, region. GameDays: scheduled exercises to simulate catastrophe
