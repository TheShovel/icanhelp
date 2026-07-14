# E-Waste & Electronics

## Extend Device Lifespan
The greenest device is the one you already own. Each year of extra life avoids ~80–100 kg CO2e for a laptop and ~50–70 kg for a phone (manufacturing dominates footprint).

```
keep battery 20–80%      — lithium cells degrade fastest at full/empty cycles
avoid heat               — >35°C permanently cuts capacity; never leave in car
clean vents/fans         — thermal throttling accelerates wear; compressed air quarterly
replace battery not unit — a new cell revives most 3–4 yr old laptops/phones
repair over replace      — screens, batteries, ports are usually fixable
```

Right-to-repair laws (EU, US states) now mandate spare parts and manuals for many categories.

## Selling, Donating, Recycling
Disposition order: reuse > refurbish > recycle. Functional gear keeps value and avoids mining new materials.

```
sell (Swappa, eBay)   — working devices; recovers cost, extends life with new owner
donate (schools, nonprofits) — working gear; wipe first, include charger
trade-in              — manufacturer credit; often refurbished/resold, not scrapped
certified recycle     — only when truly dead or unsafe
```

Never trash electronics: landfill bans exist in most US states and EU countries; fines apply.

## E-Waste Hazards
One metric ton of phones contains more gold than a ton of ore. Discarded devices leak toxins and waste scarce materials.

```
lead (CRT/ solder)    — neurotoxin; contaminates soil and water
mercury (screens)     — bioaccumulates; damages nervous system
cadmium (batteries)   — kidney/ bone damage; long persistence
rare earths (motors, magnets) — energy-intensive to mine; rarely recovered
brominated flame retardants — endocrine disruptors in plastics
```

Informal recycling (open burning, acid baths) in unregulated sites causes severe local harm. Use certified channels.

## Certified Recyclers
Look for third-party certification that bans landfill dumping and export to non-OECD countries.

```
R2 (Responsible Recycling)  — most common US standard; tracks chain of custody
e-Stewards                  — stricter; bans export and prison labor
EPEAT                       — procurement label for greener new electronics
local e-waste day           — municipal collection; verify it uses R2/e-Stewards
```

Ask the recycler: "Where does this go?" and "Are you R2 or e-Stewards certified?" Vague answers = red flag.

## Wipe Data Before Disposal
Always erase storage before selling, donating, or recycling. A "delete" or format is NOT secure.

```
blkdiscard /dev/sdX            — TRIM/secure-erase SSD (fast, modern drives)
shred -v -n 3 /dev/sdX         — 3-pass overwrite HDD (slow but thorough)
nvme sanitize /dev/nvme0n1     — NVMe crypto/user-data sanitize command
factory reset + remove account — phones: disable Find My / Google lock first
verify empty                   — re-mount and confirm no personal files remain
```

For HDDs, ATA `secure erase` (via `hdparm --security-erase`) is the gold standard. SSDs need sanitize/TRIM because overwriting is unreliable.

## Keep / Donate / Recycle Decision
| Condition | Action | Why |
|-----------|--------|-----|
| Works, <5 yr old | Sell or donate | Max residual value + life |
| Works, old | Donate or recycle | Still useful to someone |
| Broken, repairable | Repair or donate for parts | Avoid premature scrap |
| Broken, dead battery | Certified recycle | Safety + material recovery |
| CRT/old monitor | Certified recycle | Lead hazard, no landfill |

When in doubt, donate working gear; recycle only the truly dead.
