# Digital Forensics & Incident Response (DFIR)

## Overview
Digital Forensics and Incident Response (DFIR) involves identifying, preserving, analyzing, and presenting digital evidence in a legally admissible manner.

## Evidence Acquisition

### Disk Imaging
```bash
# dd - bit-for-bit copy
dd if=/dev/sda of=/evidence/sda.dd bs=64K conv=noerror,sync status=progress

# dcfldd - enhanced dd with hashing
dcfldd if=/dev/sda of=/evidence/sda.dd hash=sha256 hashlog=/evidence/sda.hashlog

# ewfacquire - E01 format (EnCase)
ewfacquire /dev/sda -t /evidence/sda -c best -C "Case001" -D "Evidence Drive" -E "Examiner" -N "Notes"

# guymager - GUI imager
guymager

# FTK Imager (Windows)
# FTK Imager > File > Create Disk Image
```

### Memory Acquisition
```bash
# Linux - LiME (Loadable Kernel Module)
git clone https://github.com/504ensicsLabs/LiME
cd LiME/src
make
insmod lime.ko "path=/evidence/mem.lime format=lime"

# Linux - AVML (Microsoft)
wget https://github.com/microsoft/avml/releases/download/v0.12.0/avml
chmod +x avml
./avml /evidence/mem.mem

# Windows - WinPMEM
winpmem_mini_x64.exe /evidence/mem.raw

# macOS - OSXPmem
osxpmem -o /evidence/mem.raw
```

### Network Capture
```bash
# tcpdump
tcpdump -i eth0 -w /evidence/capture.pcap -s 0 -G 3600 -W 24

# tshark (Wireshark CLI)
tshark -i eth0 -w /evidence/capture.pcap -b duration:3600 -b files:24

# Zeek (formerly Bro)
zeek -i eth0 local
```

## Evidence Preservation

### Chain of Custody
```text
Evidence Tag: EVD-2024-001-001
Case Number: CASE-2024-001
Description: Dell XPS 15, Serial: ABC123
Collected By: J. Smith, CFCE
Date/Time: 2024-01-15 14:30 UTC
Location: 123 Main St, Server Room A
Hash (SHA256): a1b2c3d4...
Storage: Evidence Locker #3, Shelf B
```

### Hash Verification
```bash
# Generate hashes
sha256sum /evidence/image.dd > /evidence/image.sha256
md5sum /evidence/image.dd > /evidence/image.md5

# Verify
sha256sum -c /evidence/image.sha256

# Multiple files
find /evidence -type f -exec sha256sum {} + > /evidence/hashes.sha256
```

### Write Blocking
```bash
# Hardware write blocker (Tableau, WiebeTech)
# Software write block (Linux)
hdparm -r1 /dev/sdb        # Set readonly
blockdev --setro /dev/sdb  # Set readonly

# Verify
hdparm -r /dev/sdb
blockdev --getro /dev/sdb
```

## File System Analysis

### Mounting Evidence
```bash
# Loop mount (read-only)
mount -o ro,loop,noexec,nodev,noatime /evidence/image.dd /mnt/evidence

# Mount specific partition
# First find offset
fdisk -l /evidence/image.dd
# Unit: sectors of 1 * 512 = 512 bytes
# Device          Start      End  Sectors  Size Id Type
# image.dd1        2048   206847   204800  100M 83 Linux
# image.dd2      206848 20971519 20764672  9.9G 83 Linux

# Mount partition 2 (offset = 206848 * 512 = 105906176)
mount -o ro,loop,offset=105906176 /evidence/image.dd /mnt/evidence

# Using losetup
losetup -f -P /evidence/image.dd
mount -o ro /dev/loop0p2 /mnt/evidence
```

### File System Tools
```bash
# The Sleuth Kit (TSK)
fls -r /evidence/image.dd          # List files (recursive)
icat /evidence/image.dd 1234       # Extract file by inode
istat /evidence/image.dd 1234      # Inode details
ffind /evidence/image.dd 1234      # Find file name by inode
fsstat /evidence/image.dd          # File system stats

# Recover deleted files
fls -d /evidence/image.dd          # List deleted only
icat /evidence/image.dd 1234 > recovered_file

# Timeline
fls -m /evidence/image.dd > body.txt
mactime -b body.txt -d > timeline.csv

# File carving
foremost -i /evidence/image.dd -o /output
photorec /evidence/image.dd
scalpel -c scalpel.conf /evidence/image.dd
```

### Windows Artifacts
```bash
# Registry hives
regripper -r /mnt/evidence/Windows/System32/config/SYSTEM -p system
regripper -r /mnt/evidence/Windows/System32/config/SOFTWARE -p software
regripper -r /mnt/evidence/Users/user/NTUSER.DAT -p user

# Event Logs
evtx_dump /mnt/evidence/Windows/System32/winevt/Logs/System.evtx > system.json
evtx_dump /mnt/evidence/Windows/System32/winevt/Logs/Security.evtx > security.json

# Prefetch
parse_prefetch.py /mnt/evidence/Windows/Prefetch/

# LNK files
lnk_parse.py /mnt/evidence/Users/user/AppData/Roaming/Microsoft/Windows/Recent/

# Jump Lists
jmp_parse.py /mnt/evidence/Users/user/AppData/Roaming/Microsoft/Windows/Recent/AutomaticDestinations/

# Shellbags
sbag_parse.py /mnt/evidence/Users/user/AppData/Local/Microsoft/Windows/UsrClass.dat

# Amcache
amcache_parse.py /mnt/evidence/Windows/AppCompat/Programs/Amcache.hve

# SRUM (System Resource Usage Monitor)
srum_dump.py /mnt/evidence/Windows/System32/sru/SRUDB.dat
```

### Linux Artifacts
```bash
# Bash history
cat /mnt/evidence/home/user/.bash_history

# SSH
cat /mnt/evidence/home/user/.ssh/authorized_keys
cat /mnt/evidence/var/log/auth.log | grep sshd

# Systemd journal
journalctl -D /mnt/evidence/var/log/journal --since "2024-01-01" --until "2024-01-16"

# Package manager logs
cat /mnt/evidence/var/log/dpkg.log
cat /mnt/evidence/var/log/yum.log
cat /mnt/evidence/var/log/pacman.log

# Cron
cat /mnt/evidence/var/log/cron
ls -la /mnt/evidence/var/spool/cron/

# System logs
cat /mnt/evidence/var/log/syslog
cat /mnt/evidence/var/log/messages

# Audit logs
ausearch -f /mnt/evidence/var/log/audit/audit.log -ts today
```

## Memory Analysis (Volatility 3)

### Installation
```bash
pip install volatility3
# Or download standalone
wget https://github.com/volatilityfoundation/volatility3/releases/download/v2.6.0/volatility3-2.6.0.zip
```

### Common Plugins
```bash
# List plugins
python3 vol.py --info

# Image info
python3 vol.py -f /evidence/mem.raw windows.info
python3 vol.py -f /evidence/mem.raw linux.info

# Process list
python3 vol.py -f /evidence/mem.raw windows.pslist.PsList
python3 vol.py -f /evidence/mem.raw windows.pstree.PsTree
python3 vol.py -f /evidence/mem.raw linux.pslist.PsList

# Network connections
python3 vol.py -f /evidence/mem.raw windows.netscan.NetScan
python3 vol.py -f /evidence/mem.raw linux.netstat.NetStat

# Command history
python3 vol.py -f /evidence/mem.raw windows.cmdline.CmdLine
python3 vol.py -f /evidence/mem.raw linux.bash.Bash

# Registry
python3 vol.py -f /evidence/mem.raw windows.registry.hivelist.HiveList
python3 vol.py -f /evidence/mem.raw windows.registry.printkey.PrintKey -o "Microsoft\\Windows\\CurrentVersion\\Run"

# Malware detection
python3 vol.py -f /evidence/mem.raw windows.malfind.Malfind
python3 vol.py -f /evidence/mem.raw windows.hollowfind.HollowFind
python3 vol.py -f /evidence/mem.raw windows.ldrmodules.LdrModules

# Dump process memory
python3 vol.py -f /evidence/mem.raw windows.memmap.Memmap --pid 1234 --dump

# Files
python3 vol.py -f /evidence/mem.raw windows.filescan.FileScan
python3 vol.py -f /evidence/mem.raw windows.dumpfiles.DumpFiles --physaddr 0x12345678
```

### Linux Memory Analysis
```bash
# Kernel modules
python3 vol.py -f /evidence/mem.raw linux.lsmod.Lsmod

# Open files
python3 vol.py -f /evidence/mem.raw linux.lsof.Lsof

# Mounted filesystems
python3 vol.py -f /evidence/mem.raw linux.mount.Mount

# Kernel symbols
python3 vol.py -f /evidence/mem.raw linux.kallsyms.Kallsyms
```

## Network Forensics

### PCAP Analysis
```bash
# tshark
tshark -r capture.pcap -Y "http.request" -T fields -e http.host -e http.request.uri
tshark -r capture.pcap -Y "dns.qry.name" -T fields -e dns.qry.name
tshark -r capture.pcap -z conv,ip -q
tshark -r capture.pcap -z endpoints,ip -q
tshark -r capture.pcap -z io,phs -q

# Zeek
zeek -r capture.pcap local
cat conn.log | zeek-cut id.orig_h id.resp_h id.resp_p proto service duration orig_bytes resp_bytes

# NetworkMiner (GUI)
# Extract files, credentials, parameters
```

### Flow Analysis
```bash
# nfdump (NetFlow)
nfdump -r /var/log/netflow/nfcapd.20240115 -O tstart -s record/bytes -n 10

# argus
ra -r capture.argus -s saddr daddr sport dport proto bytes pkts dur
```

## Malware Analysis

### Static Analysis
```bash
# File info
file malware.exe
exiftool malware.exe

# Strings
strings -n 8 malware.exe
strings -el malware.exe  # Unicode

# PE analysis (Windows)
pecheck.py malware.exe
peframe malware.exe
pestudio malware.exe

# ELF analysis (Linux)
readelf -a malware
objdump -d malware

# Hashes
md5sum malware.exe
sha256sum malware.exe
ssdeep malware.exe       # Fuzzy hash

# YARA
yara rules.yar malware.exe

# VirusTotal
vt scan file malware.exe
```

### Dynamic Analysis
```bash
# Cuckoo Sandbox
cuckoo submit malware.exe

# CAPE Sandbox
cape submit malware.exe

# Joe Sandbox
# Online: joesandbox.com

# Any.Run
# Online: any.run

# Hybrid Analysis
# Online: hybrid-analysis.com

# Local - Windows
# Process Monitor (Procmon)
# Process Hacker
# Regshot (registry comparison)
# Wireshark (network)

# Local - Linux
strace -f -o trace.log ./malware
ltrace -f -o trace.log ./malware
auditctl -a always,exit -F path=/tmp -p wa
```

## Timeline Analysis

### Create Super Timeline
```bash
# Using log2timeline (Plaso)
log2timeline.py /evidence/timeline.plaso /evidence/image.dd

# Filter and export
psort.py -z UTC -o l2tcsv /evidence/timeline.plaso "date > '2024-01-01' AND date < '2024-01-16'" > timeline.csv

# Or use mactime (TSK)
fls -m /evidence/image.dd > body.txt
mactime -b body.txt -d > timeline.csv
```

### Timeline Analysis
```bash
# Look for suspicious patterns
grep -i "temp\|tmp\|download" timeline.csv
grep -i "powershell\|cmd\|wscript\|cscript" timeline.csv
grep -i "run\|runonce\\|startup" timeline.csv
grep -i "schtasks\|at\.exe" timeline.csv
```

## Reporting

### Report Structure
```text
1. Executive Summary
2. Scope & Authorization
3. Methodology
4. Evidence Inventory
5. Findings
   5.1 Timeline of Events
   5.2 Malware Analysis
   5.3 Network Activity
   5.4 Data Exfiltration
   5.5 Persistence Mechanisms
6. Indicators of Compromise (IOCs)
7. Recommendations
8. Appendices
   A. Chain of Custody
   B. Tool Versions
   C. Full Timeline
   D. Hash Values
```

### IOC Formats
```json
// OpenIOC
<Indicators>
  <Indicator id="malware-xyz" operator="OR">
    <Context document="FileItem/FileName" search="malware.exe" type="mir"/>
    <Context document="FileItem/Sha256" search="a1b2c3..." type="mir"/>
    <Context document="Network/Hostname" search="evil.com" type="mir"/>
    <Context document="Network/IP" search="1.2.3.4" type="mir"/>
  </Indicator>
</Indicators>

// STIX 2.1
{
  "type": "indicator",
  "spec_version": "2.1",
  "id": "indicator--a1b2c3d4-...",
  "created": "2024-01-15T10:00:00.000Z",
  "modified": "2024-01-15T10:00:00.000Z",
  "pattern": "[file:hashes.'SHA-256' = 'a1b2c3d4...'] OR [domain-name:value = 'evil.com']",
  "valid_from": "2024-01-15T10:00:00.000Z",
  "labels": ["malicious-activity"]
}
```

## Tools Reference

| Category | Tools |
|----------|-------|
| **Imaging** | dd, dcfldd, ewfacquire, guymager, FTK Imager |
| **Memory** | LiME, AVML, WinPMEM, OSXPmem, Volatility 3, Rekall |
| **File System** | TSK (fls, icat, mactime), Autopsy, FTK, EnCase |
| **Registry** | RegRipper, Registry Explorer, RECmd |
| **Event Logs** | evtx_dump, EvtxECmd, Event Log Explorer |
| **Memory** | Volatility 3, Rekall, Redline |
| **Network** | Wireshark/tshark, Zeek, NetworkMiner, nfdump |
| **Malware** | YARA, PEStudio, Cuckoo, CAPE, Joe Sandbox |
| **Timeline** | Plaso/log2timeline, mactime, Timesketch |
| **Reporting** | Autopsy, Timesketch, Jupyter Notebooks |

## Legal Considerations

### Rules of Evidence
1. **Relevance** - Evidence must be relevant to the case
2. **Authenticity** - Must be what it purports to be
3. **Hearsay** - Business records exception often applies
4. **Best Evidence Rule** - Original preferred, duplicates admissible
5. **Chain of Custody** - Documented, unbroken control

### Documentation Requirements
- Who collected
- What was collected
- When collected
- Where collected
- How collected
- Who had access
- Hash verification at each transfer

## Resources
- [NIST SP 800-86](https://csrc.nist.gov/publications/detail/sp/800-86/final) - Guide to Integrating Forensic Techniques
- [NIST SP 800-61](https://csrc.nist.gov/publications/detail/sp/800-61/rev-2/final) - Computer Security Incident Handling Guide
- [SANS DFIR](https://www.sans.org/digital-forensics-and-incident-response/)
- [Volatility Foundation](https://volatilityfoundation.org/)
- [The Sleuth Kit](https://www.sleuthkit.org/)
- [Plaso](https://github.com/log2timeline/plaso)
- [MITRE ATT&CK](https://attack.mitre.org/)