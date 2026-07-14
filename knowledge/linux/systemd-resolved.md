# systemd-resolved (DNS Resolution)

`systemd-resolved` is the local stub resolver: manages DNS, LLMNR, MulticastDNS, and DNSSEC. Listens on `127.0.0.53:53`. Integrates with `systemd-networkd` (see `systemd-networkd-detailed.md`). Inspect DNS config with `sys net dns`.

## Enable
```
sudo systemctl enable --now systemd-resolved
# /etc/resolv.conf must point at the stub resolver:
ln -sf ../run/systemd/resolve/stub-resolv.conf /etc/resolv.conf
```

## Configuration (`/etc/systemd/resolved.conf`)
```
[Resolve]
DNS=1.1.1.1 8.8.8.8
FallbackDNS=1.0.0.1 8.8.4.4
Domains=~example.com ~internal   # ~ = route-only
LLMNR=yes
MulticastDNS=yes
DNSSEC=allow-downgrade            # yes|no|allow-downgrade
Cache=yes
DNSOverTLS=opportunistic         # yes|no|opportunistic
```
Drop-ins: `/etc/systemd/resolved.conf.d/*.conf`.

## resolvectl commands
```
resolvectl status                 # per-link DNS + global config
resolvectl dns eth0 1.1.1.1 8.8.8.8   # set DNS for a link
resolvectl query example.com                 # resolve
resolvectl query -t AAAA example.com        # specific record type
resolvectl --statistics            # cache hit/miss counters
resolvectl flush-caches          # clear DNS cache
resolvectl monitor               # live DNS query monitor
```
JSON: `resolvectl --json=short query example.com`.

## DNS modes
- `stub-resolv.conf` symlink → stub resolver on `127.0.0.53` (default).
- `resolv.conf` symlink → full resolver using upstream servers.
- Per-interface DNS (from DHCP/networkd) takes precedence over global `DNS=`.

## DNSSEC & DoT
- `DNSSEC=yes` — always validate; `allow-downgrade` — opportunistic (default).
- Test: `resolvectl query dnssec-failed.org` (should fail under `yes`).
- DoT providers: `1.1.1.1#cloudflare-dns.com`, `8.8.8.8#dns.google`.

## NSS integration (`/etc/nsswitch.conf`)
```
hosts: files resolve [!UNAVAIL=return] dns
```
`resolve` = systemd-resolved (mDNS/LLMNR); `dns` = traditional fallback.

## Troubleshooting
```
resolvectl query google.com
sys net dns                        # expect nameserver 127.0.0.53
ss -tuln | grep 53              # expect 127.0.0.53:53
sys log show systemd-resolved     # journal (since "1 hour ago")
# DNSSEC failure? set DNSSEC=no or allow-downgrade
# LLMNR/mDNS conflict? disable one: LLMNR=no or MulticastDNS=no
```
