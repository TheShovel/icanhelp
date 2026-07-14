# Linux Printing & CUPS

## CUPS (Common Unix Printing System)

```bash
# Install
sudo apt install cups cups-client
sudo dnf install cups

# Start service
sudo systemctl enable --now cups

# Web interface
# http://localhost:631
# Or: http://printserver:631

# Command line
cupsctl --remote-admin              # Enable remote admin
cupsctl --remote-any                # Enable remote access
cupsctl WebInterface=yes           # Enable web interface
```

## CUPS Commands

```bash
# List printers
lpstat -p                           # All printers
lpstat -d                           # Default printer
lpstat -t                           # All CUPS status

# Print jobs
lpq                                 # Queue
lpstat -o                           # Jobs
cancel -a                           # Cancel all
cancel job-id                       # Cancel specific

# Print files
lp file.pdf
lp -d printer_name file.pdf
lp -n 3 file.pdf                    # 3 copies
lp -o landscape file.pdf
lp -o media=A4 file.pdf
lp -o fit-to-page file.pdf

# Options
lpoptions                           # Current defaults
lpoptions -p printer_name           # Printer options
lp -o sides=two-sided-long-edge file.pdf
lp -o sides=one-sided file.pdf
```

## Printer Management

```bash
# Add printer
lpadmin -p PRINTER_NAME -E -v DEVICE_URI -m DRIVER

# Examples
lpadmin -p HP -E -v usb://HP/LaserJet -m everywhere
lpadmin -p Canon -E -v socket://192.168.1.100:9100 -m everywhere
lpadmin -p PDF -E -v cups-pdf:/ -m cups-pdf.ppd

# Set default
lpoptions -d PRINTER_NAME

# Delete printer
lpadmin -x PRINTER_NAME

# Accept/reject jobs
cupsaccept PRINTER_NAME
cupsreject PRINTER_NAME

# Stop/start printer
cupsdisable PRINTER_NAME
cupsenable PRINTER_NAME
```

## Printer Drivers

```bash
# Available drivers
lpinfo -m                           # All drivers
lpinfo -v                           # All devices

# Driver types
# everywhere - IPP Everywhere (auto-discovery)
# raw - No filtering
# pdftoraster - PDF to raster conversion
# texttops - Text to PostScript

# HPLIP (HP printers)
sudo apt install hplip
hp-setup -i printer_id
hp-check                            # Check installation

# Gutenprint (high-quality drivers)
sudo apt install printer-driver-gutenprint
```

## Printer URIs

```bash
# USB
usb://HP/LaserJet%20Professional%20P1102w

# Network
socket://192.168.1.100:9100        # Raw socket
ipp://192.168.1.100:631/printer/printer_name
ipps://printer.example.com:631/ipp/print

# LPD
lpd://192.168.1.100/queue

# SMB (Windows share)
smb://server/share
smb://user:password@server/share

# CUPS (remote)
cups://printserver:631/printers/printer_name
```

## CUPS Configuration

```bash
# Main config
/etc/cups/cupsd.conf

# Key settings
Listen localhost:631                 # Listen address
Browsing On                         # Discover printers
BrowseLocalProtocols dnssd           # Protocol

# Security
<Location />
  Order allow,deny
  Allow from 192.168.1.*
</Location>

<Location /admin>
  AuthType Basic
  Require user @SYSTEM
</Location>
```

## Printer Sharing

```bash
# Share printer (in /etc/cups/cupsd.conf)
Browsing On
BrowseShareAlways Yes

# Share specific printer
lpadmin -p PRINTER_NAME -o printer-is-shared=true

# Access from client
# On client:
lpadmin -p PRINTER_NAME -E -v ipp://server:631/printers/PRINTER_NAME

# Or use IPP discovery
lpstat -v                       # Lists network printers
```

## PDF Printing

```bash
# Install PDF support
sudo apt install printer-driver-cups-pdf
sudo apt install cups-pdf

# Print to PDF
lp -d PDF file.pdf

# Configure PDF output
# /etc/cups/cups-pdf.conf
out /home/${USER}/PDF
```

## Print Troubleshooting

```bash
# Check CUPS logs
sudo journalctl -u cups -f
cat /var/log/cups/error_log

# Check printer status
lpstat -p -d
lpstat -v

# Check if printer is accepting jobs
cupsaccept PRINTER_NAME
cupsenable PRINTER_NAME

# Check raw queue
lp -d PRINTER_NAME -o raw file

# Check PPD file
cups-driverd search -m all | grep PRINTER_NAME

# Test page
# Web UI: Printers → Print Test Page
# Or: ipptool -tv http://localhost:631/printers/PRINTER_NAME print-job.test
```

## IPP Commands

```bash
# Install IPP tools
sudo apt install cups-ipp-utils

# IPP requests
ipptool -tv http://printer:631/ipp/print get-printer-attributes.test
ipptool -tv http://printer:631/ipp/print print-job.test

# Create job
ipptool -f file.pdf http://printer:631/ipp/print create-job.test

# Query printer
ippfind                                 # Find IPP printers
ippfind -T 5                            # Timeout 5 seconds
```

## Raw Printing

```bash
# Direct to printer (HP JetDirect)
echo -e "Hello World\n\f" | nc 192.168.1.100 9100

# Or with timeout
timeout 30 cat file.prn > /dev/tcp/192.168.1.100/9100

# ESC/POS (receipt printers)
printf "Hello\n\n\n" > /dev/usb/lp0
# Requires: sudo chmod 666 /dev/usb/lp0
```

## CUPS Web Interface

Key URLs:
- http://localhost:631/ - Home
- http://localhost:631/admin - Admin (needs root password)
- http://localhost:631/printers - Printer list
- http://localhost:631/jobs - Print jobs
- http://localhost:631/help - Documentation

Navigation:
- Administration → Add Printer
- Printers → Printer → Administration → Print Test Page
- Administration → Manage Printers → Modify Printer

## Printer Filters

```bash
# Check available filters
cups-filesearch -t filter

# Install filters
sudo apt install cups-filters
sudo apt install ghostscript

# Check filter chain
cupsfilter file.ps

# Custom filter
# /etc/cups/mime.types
# /etc/cups/mime.convs
```

## AirPrint (iOS/macOS)

```bash
# Install Avahi for discovery
sudo apt install avahi-daemon

# CUPS automatically publishes AirPrint-compatible printers
# Share via CUPS web UI: Administration → Share printers

# Check AirPrint
avahi-browse -rt _ipp._tcp
avahi-browse -rt _airprint._tcp

# Troubleshoot
# Some printers need: cupsfilter -m printer_name < file.pdf
```

## CUPS Backup & Restore

```bash
# Backup configuration
sudo cp -a /etc/cups /etc/cups.backup

# Backup printers
lpstat -v > printers.txt

# Restore
sudo cp -a /etc/cups.backup/* /etc/cups/
sudo systemctl restart cups

# Recreate printers from backup
# Use lpadmin commands from printers.txt
```

## CUPS Security

```bash
# Require encryption
# /etc/cups/cupsd.conf
DefaultEncryption Required

# Restrict access
<Location />
  Order deny,allow
  Deny from all
  Allow from 192.168.1.0/24
</Location>

# Use certificates
# /etc/cups/cupsd.conf
SSLOptions None
ServerCertificate /etc/ssl/server.crt
ServerKey /etc/ssl/server.key

# Firewall rules
sudo ufw allow from 192.168.1.0/24 to any port 631
```

## CUPS Logs

```bash
# Log locations
/var/log/cups/
- error_log         # Errors and warnings
- access_log        # HTTP requests
- page_log          # Print jobs

# Set log level
# /etc/cups/cupsd.conf
LogLevel debug
# Then reload: sudo systemctl reload cups

# View errors
tail -f /var/log/cups/error_log | grep -i error

# Debug print
cupsctl --debug-logging
# Print test page, check logs
cupsctl --no-debug-logging
```

## Print Release Tools

```bash
# CUPS release (enterprise)
sudo apt install cups-browsed
sudo cups-browsed

# Auto-discovery
cups-browsed -v

# Configuration
# /etc/cups/cups-browsed.conf
BrowseRemoteProtocols cups
CreateRemoteCUPSQueues Yes
```

## Command Line Examples

```bash
# Print multiple files
lp file1.pdf file2.pdf

# Print with options
lp -o media=A4 -o sides=two-sided-long-edge file.pdf

# Print from stdin
echo "Hello" | lp -o media=letter -

# Print range
lp -o page-ranges=1-5 -o media=A4 file.pdf

# Print even/odd
lp -o page-set=even file.pdf
lp -o page-set=odd file.pdf

# Priority
lp -q 100 file.pdf                    # High priority
lp -q -100 file.pdf                   # Low priority
```

## CUPS Maintenance

```bash
# Clean old jobs
cancel -a old_jobs                      # Remove old jobs

# Check disk usage
du -sh /var/spool/cups

# Rotate logs
sudo logrotate /etc/logrotate.d/cups

# Update printer cache
sudo cups-genppdupdate

# Restart cleanly
sudo systemctl restart cups
sudo cupsctl --debug-logging             # If needed
```

## Troubleshooting Scripts

```bash
#!/bin/bash
# printer-check.sh
echo "=== CUPS Status ==="
systemctl status cups --no-pager

echo -e "\n=== Printers ==="
lpstat -p -d

echo -e "\n=== Jobs ==="
lpstat -o

echo -e "\n=== Recent errors ==="
tail -20 /var/log/cups/error_log

# Check web interface
curl -s http://localhost:631 | grep -o "CUPS"
```