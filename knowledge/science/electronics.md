# Electronics & Engineering Basics

## Basic Components
- **Resistor**: opposes current flow. Color bands = value (black 0, brown 1, red 2, orange 3, yellow 4, green 5, blue 6, violet 7, gray 8, white 9)
  - Series: Rₜ = R₁+R₂+... Parallel: 1/Rₜ = 1/R₁+1/R₂+...
  - Resistor color code: 4 bands = digit-digit-multiplier-tolerance, 5 bands = digit-digit-digit-multiplier-tolerance
- **Capacitor**: stores charge, blocks DC, passes AC. Measured in farads (μF, nF, pF)
  - Smooth power supply ripple, timing circuits, filter noise
  - Electrolytic: polarized (marked negative side), high capacitance
  - Ceramic: non-polarized, small capacitance, cheap
- **Inductor**: stores magnetic field, resists current changes. Filters, transformers, power supplies
- **Diode**: conducts one direction only. LED (light), Schottky (fast, low drop), Zener (voltage regulation)
- **Transistor**: switch or amplifier. BJT (NPN/PNP) = current controlled. MOSFET = voltage controlled (most common in digital)
- **IC (Integrated Circuit)**: chip containing many components (op-amp, microcontroller, logic gates)

## Circuit Basics
- Series circuit: same current through all components, voltage divides
- Parallel circuit: same voltage across all branches, current divides
- Voltage divider: Vout = Vin × R₂/(R₁+R₂)
- Kirchhoff's current law: sum of currents entering = sum leaving
- Kirchhoff's voltage law: sum of voltages around loop = 0
- AC vs DC: DC (battery, constant polarity), AC (wall outlet, sinusoid, alternates 50/60 Hz)

## Digital Logic
- **Gates**: AND (both 1 → 1), OR (any 1 → 1), NOT (invert), NAND (AND + NOT), NOR (OR + NOT), XOR (different → 1), XNOR (same → 1)
- **Truth table**: all input combinations and their outputs
- **Flip-flop**: stores 1 bit (memory). D flip-flop (data), JK, T, SR
- **Register**: group of flip-flops (stores multiple bits)
- **Binary**: 0 = low (0V), 1 = high (5V or 3.3V or 1.8V)
- **7-segment display**: a-g segments form digits 0-9

## Arduino / Microcontrollers
- Arduino Uno: ATmega328P, 5V, 14 digital pins (6 PWM), 6 analog inputs
- DigitalWrite(pin, HIGH/LOW), analogRead(pin) (0-1023), analogWrite(pin, 0-255) (PWM)
- Common: blink LED, read sensor (temp, light, distance), control motor (via H-bridge)
- Raspberry Pi: single-board computer (Linux), not microcontroller — can run full OS
- ESP32/ESP8266: WiFi + Bluetooth, popular for IoT, Arduino-compatible

## Soldering Basics
- Equipment: iron (30-40W), solder (60/40 or lead-free rosin core), tip cleaner, third hand
- Heat the pad + component lead together (not just the solder)
- Apply solder to the joint (not the iron tip) — let it flow
- Good joint: shiny, smooth, volcano shape (concave). Bad: dull (cold joint), ball (too much), bridge (shorted)
- Safety: work in ventilated area, wash hands after (lead), iron holder, don't touch tip (600°F+)
- Desoldering: solder wick (braid) → place over joint, heat, absorbs. Solder sucker pump

## Measurement
- **Multimeter**: measures voltage, current, resistance, continuity (beep = short)
  - Voltage: measure IN PARALLEL (across component). Set to AC or DC
  - Current: measure IN SERIES (break circuit and insert meter)
  - Resistance: measure with power OFF (component isolated)
- **Oscilloscope**: shows voltage over time — waveform visualization, frequency, noise, timing
- **Logic analyzer**: captures digital signals (multiple channels, protocol decoding: I²C, SPI, UART)

## Common Tools
- Wire strippers: remove insulation without nicking wire
- Breadboard: solderless prototyping — rows connected internally
- Heat shrink tubing: insulate solder joints (shrink with heat gun)
- Multimeter: essential for any troubleshooting
- Pliers: needle-nose (small parts), lineman's (cutting, twisting)

## Electrical Safety
- Never work on live circuits (60V+ can be lethal). Disconnect power first
- Capacitors can hold charge after power off — discharge with resistor
- One hand in pocket when working with high voltage (prevents current across heart)
- Use insulated tools for electrical work
- GFCI (Ground Fault Circuit Interrupter) — cuts power if current leaks (in bathrooms, kitchens, outdoors)
- Know location of circuit breaker — label all breakers
- Damaged cords: replace, don't tape
