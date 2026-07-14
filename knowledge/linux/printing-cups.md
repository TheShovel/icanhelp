# Linux Printing & CUPS

## Install (use `sys pkg`)
```bash
sys pkg install cups
```

## Service (use `sys svc`)
```bash
sys svc enable --now cups
cupsctl WebInterface=yes          # enable http://localhost:631
lpstat -t                         # full status (verified)
```

## List & print (verified)
```bash
lpstat -p                         # printers
lpstat -d                         # default
lpq                               # queue
cancel -a                         # cancel all jobs
lp file.pdf
lp -d printername -n 3 file.pdf   # 3 copies
lp -o sides=two-sided-long-edge file.pdf
lp -o media=A4 file.pdf
lpoptions -d printername          # set default
```

## Manage printers
```bash
lpadmin -p NAME -E -v DEVICE_URI -m everywhere
lpadmin -p HP -E -v usb://HP/LaserJet -m everywhere
lpadmin -p Net -E -v socket://192.168.1.100:9100 -m everywhere
lpadmin -x NAME                   # delete
cupsenable NAME / cupsdisable NAME
cupsaccept NAME / cupsreject NAME
```

## Drivers & URIs
```bash
lpinfo -m                         # drivers (verified)
lpinfo -v                         # devices/URI schemes
# URIs: usb://..., socket://host:9100, ipp://host:631/printers/name,
#       ipps://..., lpd://host/queue, smb://user:pass@host/share
```

## Troubleshooting
```bash
sys log follow cups
cat /var/log/cups/error_log
lpstat -p -d
cupsctl --debug-logging          # then print, then --no-debug-logging
```
- **Find IPP printers**: `ippfind` (install `cups`/`avahi`).
- **Raw print**: `nc 192.168.1.100 9100 < file.prn` (HP JetDirect).
- **PDF printer**: `sys pkg install cups-pdf`, print to `PDF` queue.

## Web UI
- `http://localhost:631/` — home, `/admin` (root), `/printers`, `/jobs`.
