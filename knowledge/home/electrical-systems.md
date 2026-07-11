# Home Electrical Systems

## Overview
Understanding residential electrical systems enables safe maintenance, troubleshooting, and informed decisions about upgrades and repairs.

## Electrical Fundamentals

### Key Concepts
| Term | Unit | Symbol | Analogy |
|------|------|--------|---------|
| Voltage | Volts | V | Water pressure |
| Current | Amperes | A | Water flow rate |
| Resistance | Ohms | Ω | Pipe restriction |
| Power | Watts | W | Water power (V × A) |
| Energy | Watt-hours | Wh | Total water used |

### Ohm's Law & Power
```
V = I × R          (Voltage = Current × Resistance)
P = V × I          (Power = Voltage × Current)
P = I² × R         (Power loss in wires)
P = V² / R
```

### AC vs DC
- **AC (Alternating Current)**: Household power, changes direction 60Hz (US)
- **DC (Direct Current)**: Batteries, solar, electronics
- **RMS Voltage**: 120V AC = 120V DC equivalent heating

## US Residential Service

### Standard Service
```
Single-phase, 3-wire, 120/240V
┌─────────────────────────────────────┐
│          Utility Transformer         │
│              (Center-tapped)         │
│                │                     │
│        ┌───────┴───────┐             │
│        │               │             │
│     Hot A (L1)      Hot B (L2)       │
│      120V            120V            │
│        │               │             │
│        └───────┬───────┘             │
│                │                      │
│           Neutral (N)                 │
│           (Grounded)                  │
└─────────────────────────────────────┘
```

### Voltage Measurements
| Measurement | Voltage | Use |
|-------------|---------|-----|
| L1 to Neutral | 120V | Standard outlets, lights |
| L2 to Neutral | 120V | Standard outlets, lights |
| L1 to L2 | 240V | Dryer, range, AC, EV charger |
| Neutral to Ground | 0V (ideally) | Safety check |

### Service Amperage
| Amperage | Typical Home | Capacity |
|----------|--------------|----------|
| 60A | Pre-1960, very small | Obsolete |
| 100A | Pre-1980, small | Minimum modern |
| 150A | 1980-2000, average | Common |
| 200A | 2000+, large | Standard new |
| 400A | Large, all-electric | Two 200A panels |

## Panel & Breakers

### Panel Anatomy
```
┌──────────────────────────────────────┐
│           Main Breaker               │
│        (100/150/200A)                │
├──────────────────────────────────────┤
│  Bus Bars: L1  │  L2                 │
│  ┌───┬───┬───┬───┐                   │
│  │ 1 │ 2 │ 3 │ 4 │  ← Breaker slots  │
│  │ 5 │ 6 │ 7 │ 8 │                   │
│  └───┴───┴───┴───┘                   │
│  Neutral Bar    Ground Bar           │
└──────────────────────────────────────┘
```

### Breaker Types
| Type | Poles | Voltage | Use |
|------|-------|---------|-----|
| Single-pole | 1 | 120V | Lights, outlets |
| Double-pole | 2 | 240V | Large appliances |
| GFCI | 1 or 2 | 120/240V | Wet locations |
| AFCI | 1 | 120V | Bedrooms, living |
| Dual Function | 1 | 120V | GFCI + AFCI |

### Breaker Sizing (80% Rule)
```
Continuous load (3+ hrs): Breaker × 0.8 = Max load
Non-continuous: Breaker = Max load

Example: 20A breaker
- Continuous max: 16A (1920W @ 120V)
- Non-continuous max: 20A (2400W)
```

## Wiring Basics

### Wire Gauge (AWG) & Ampacity (NM-B, 60°C/90°C)
| Gauge | 60°C (NM-B) | 90°C (THHN) | Common Use |
|-------|-------------|-------------|------------|
| 14 AWG | 15A | 25A | 15A circuits (lights, outlets) |
| 12 AWG | 20A | 30A | 20A circuits (kitchen, bath, garage) |
| 10 AWG | 30A | 40A | 30A (dryer, water heater) |
| 8 AWG | 40A | 55A | 40-50A (range, AC) |
| 6 AWG | 55A | 75A | 60A (subpanel, EV) |
| 4 AWG | 70A | 95A | 100A subpanel |
| 2 AWG | 95A | 130A | 150A service |
| 2/0 AWG | 135A | 195A | 200A service |

### Cable Types
| Type | Name | Use |
|------|------|-----|
| NM-B | Romex® | Interior dry locations |
| UF-B | Underground Feeder | Direct burial, wet |
| THHN/THWN | Individual conductors | Conduit |
| MC | Metal-Clad | Exposed, commercial |
| AC | Armored Cable (BX) | Old work, exposed |
| SE | Service Entrance | Meter to panel |

### Color Coding (US)
| Color | Function |
|-------|----------|
| Black / Red / Blue | Hot (ungrounded) |
| White / Gray | Neutral (grounded) |
| Green / Bare | Ground (equipment grounding) |
| White with tape | Re-identified hot (switch loops) |

## Circuits & Devices

### Required Circuits (NEC 2020+)
| Area | Circuit | Protection |
|------|---------|------------|
| Kitchen countertop | 2× 20A small appliance | GFCI |
| Bathroom | 20A | GFCI |
| Laundry | 20A | GFCI |
| Garage | 20A | GFCI |
| Outdoor | 20A | GFCI |
| Dishwasher | 15/20A | GFCI |
| Garage door opener | 15A | GFCI |
| Refrigerator | 15/20A dedicated | AFCI (not GFCI) |
| Bedrooms | 15/20A | AFCI |
| Living areas | 15/20A | AFCI |
| Hallways | 15/20A | AFCI |
| Basement (finished) | 15/20A | AFCI + GFCI |

### Outlet Types
| NEMA | Voltage | Amps | Use |
|------|---------|------|-----|
| 5-15R | 120V | 15A | Standard outlet |
| 5-20R | 120V | 20A | T-slot (kitchen, garage) |
| 6-20R | 240V | 20A | Window AC |
| 14-30R | 120/240V | 30A | Dryer (4-prong) |
| 14-50R | 120/240V | 50A | Range, EV, RV |
| 6-50R | 240V | 50A | Welder, compressor |

### Switch Types
- **Single-pole**: One location control
- **3-way**: Two locations (hallway, stairs)
- **4-way**: Three+ locations (with two 3-ways)
- **Dimmer**: Variable control (check bulb compatibility)
- **Smart**: WiFi/Z-Wave/Zigbee (requires neutral)

## Grounding & Bonding

### Grounding Electrode System
```
Main Panel
    │
    ├── Grounding Electrode Conductor (GEC)
    │       │
    │       ├── Ground Rod(s) (8ft, 5/8")
    │       ├── Water Pipe (metal, 10ft contact)
    │       ├── Concrete-Encased Electrode (Ufer)
    │       └── Ground Ring
    │
    ├── Main Bonding Jumper (Neutral ↔ Ground at MAIN only)
    │
    └── Equipment Grounding Conductors (EGC) to all circuits
```

### Subpanel Rules
- **Separate** neutral and ground bars
- **No** main bonding jumper
- **4-wire feed**: Hot, Hot, Neutral, Ground
- Ground bar bonded to panel enclosure

## Safety Devices

### GFCI (Ground Fault Circuit Interrupter)
- Trips at 4-6mA ground fault
- Protects **people** from shock
- Required: Bathrooms, kitchen, garage, outdoor, laundry, crawlspace, basement, pool, within 6ft of sink
- **Test monthly**: Press TEST → RESET

### AFCI (Arc Fault Circuit Interrupter)
- Detects dangerous arcing (series & parallel)
- Protects **property** from fire
- Required: Bedrooms, living rooms, halls, etc. (most 120V 15/20A circuits)
- **Combination AFCI**: Series + parallel + ground fault

### Dual Function (DF)
- GFCI + AFCI in one breaker
- Required where both needed

### Surge Protection
| Type | Location | Protection |
|------|----------|------------|
| Type 1 | Meter/Service | Utility surges |
| Type 2 | Panel (whole-house) | Best for panel |
| Type 3 | Point-of-use (strip) | Electronics |

**Whole-house**: 50kA+ rating, 2-pole breaker, connect to all phases + neutral + ground

## Common Tasks

### Replace Outlet
```
1. Turn off breaker, verify dead
2. Remove cover, unscrew outlet
3. Note wire positions (photo)
4. Disconnect wires
5. Connect new:
   - Black/Red → Brass (Hot)
   - White → Silver (Neutral)
   - Green/Bare → Green (Ground)
6. Fold wires neatly, screw in
7. Test with receptacle tester
```

### Add Circuit (Overview)
```
1. Plan: Load calc, wire size, breaker
2. Pull permit (usually required)
3. Run cable (staple every 4.5ft, 1.25" from edge)
4. Install box (old work or new)
5. Wire outlet/switch
6. Connect in panel (breaker last)
7. Inspect
8. Energize, test
```

### Troubleshooting Dead Outlet
```
1. Check other outlets on circuit
2. Check GFCI outlets (test/reset all)
3. Check breaker (off then on)
4. Check for loose connection (outlet, panel)
5. Check switch-controlled outlet
6. Use non-contact tester → multimeter
```

## Tools

### Essential
- Non-contact voltage tester (NCVT)
- Multimeter (CAT III 600V, True RMS)
- Receptacle tester (3-light)
- Wire strippers (Klein 11055)
- Linesman pliers
- Needle-nose pliers
- Screwdrivers (#2 Phillips, 1/4" flat)
- Fish tape / glow rods
- Drill + bits (spade, auger, flex)
- Label maker

### Advanced
- Clamp meter (current)
- Circuit tracer/breaker finder
- Thermal camera
- Insulation tester (megger)
- Power quality analyzer

## Code Reference (NEC Highlights)

### Box Fill (314.16)
```
Each 14 AWG = 2 cu in
Each 12 AWG = 2.25 cu in
Each 10 AWG = 2.5 cu in
Device yoke = 2 × largest conductor
Ground wires = 1 × largest ground
Clamps = 1 × largest conductor
```

### Conduit Fill (Chapter 9)
- 1 wire: 53%
- 2 wires: 31%
- 3+ wires: 40%

### Dedicated Space (110.26)
- Panel: 30" wide × 36" deep × 6'6" high
- No storage, plumbing, ducts in zone

### Tamper-Resistant Receptacles (406.12)
- All 15/20A 125V in dwelling units

## When to Call a Pro
- Service upgrade / panel replacement
- New service entrance
- Aluminum wiring remediation
- Knob & tube replacement
- Subpanel installation
- Generator transfer switch
- EV charger (50A+)
- Any work requiring permit you're not comfortable with

## Safety Rules
1. **Test before touch** - Every wire, every time
2. **Lockout/Tagout** - Breaker off + lock + tag
3. **One hand rule** - Reduce shock path across chest
4. **Assume live** - Until proven dead
5. **PPE** - Safety glasses, insulated tools, non-conductive footwear
6. **Know limits** - Stop if unsure

## Resources
- NFPA 70 (NEC) - Current edition
- "Wiring a House" - Rex Cauldwell
- "Electrical Wiring Residential" - Mullin
- Mike Holt Enterprises (training)
- This Old House / Ask This Old House
- EC&M magazine