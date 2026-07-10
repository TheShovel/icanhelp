# Embedded Systems & IoT

## Microcontrollers
- **Arduino**: ATmega328P (Uno), ATmega2560 (Mega), SAMD21 (Zero). 8-bit, 16 MHz, 2KB RAM (Uno). Simple, beginner-friendly. GPIO: digital (on/off), analog (via ADC). Programming: Arduino IDE (C++ simplified). Libraries: tons, easy. Shields: add-ons (WiFi, Ethernet, motor driver, sensor, relay, proto-screw)
  - Interrupts: attachInterrupt() on specific pins (Uno: pins 2,3). ISR — keep short (no delay, no Serial.print). For button press, encoder reading. Analog pins: can be used as digital GPIO (A0-A5 on Uno). PWM: pins 3,5,6,9,10,11 (using analogWrite). I2C: SDA A4, SCL A5. SPI: 10(SS), 11(MOSI), 12(MISO), 13(SCK)
- **ESP32**: dual-core Xtensa 32-bit LX6, 240 MHz, 512KB SRAM, WiFi + Bluetooth + BLE built-in. $3-5 from China. Most popular IoT platform. More computing power than Arduino Uno (way more). Two cores: run WiFi stack on core 0, main code on core 1. Deep sleep: 5μA (RTC memory wakes). ADC: 12-bit, 18 channels (some non-linear at edges). DAC: 8-bit, 2 channels. Touch sensors: capacitive touch on 10 pins (can use for buttons or sleep wake). Hall effect sensor built-in
  - ESP8266: predecessor to ESP32. Single-core 32-bit, 80-160 MHz, WiFi only, less GPIO. Still useful for simple WiFi projects. $2-3. No hardware I2C needed — bit-bang it
- **Raspberry Pi Pico**: RP2040 chip (Raspberry Pi's own MCU). Dual-core Cortex-M0+, 133 MHz, 264KB SRAM. $4. Program: C/C++ or MicroPython. PIO (Programmable I/O): runs assembly programs on separate mini-processors for custom protocols (WS2812 LEDs, DVI video generation, SD card interfaces)
- **STM32** (ARM Cortex-M series): STM32F103 ("Blue Pill", $2). 32-bit, 72 MHz, 20KB RAM. More powerful than Arduino, less beginner-friendly. Program: STM32CubeIDE + HAL libraries. Many variants: low-power (STM32L series), high-performance (STM32H7). Used in countless commercial products (drone flight controllers, 3D printer controllers, e-bikes)

## Sensors & Actuators

### Sensors (Input)
- **Temperature/humidity**: DHT11 (cheap, 1Hz sample rate, inaccurate ±2°C). DHT22/AM2302 (better ±0.5°C, 0.5Hz, 2.5s update). BME280 (pressure + temp + humidity, I2C/SPI, accurate ±0.5°C). DS18B20 (waterproof, 1-Wire bus, accurate ±0.5°C, great for outdoor/water temp sensing). SHT30/31/35 (Sensirion, best accuracy ±0.3°C, fast, I2C)
- **Distance**: HC-SR04 (ultrasonic, 2-400cm, 1cm accuracy). VL53L0X/VL53L1X (time-of-flight laser, up to 2m/4m, I2C, millimeter precision). JSN-SR04T (waterproof ultrasonic, for tanks)
- **Motion**: PIR (HC-SR501 — passive infrared, detects body heat, 3-7m range). Accelerometer (MPU6050 — 3-axis accel+gyro, I2C, orientation, motion detection). ADXL345 (3-axis, ±16g). LIS3DH (ultra-low power, 3-axis ±16g, I2C/SPI)
- **Light**: LDR (photoresistor — 1kΩ in bright, 2-15kΩ in dim. Simple, cheap, inaccurate). BH1750 (digital ambient light sensor, I2C, accurate lux values — use for screen auto-brightness)
- **Gas/air quality**: MQ-2 (smoke/LPG/propane). MQ-135 (air quality (CO₂, NH₃, benzene, smoke) — detected but broad, not specific ppm). CCS811 (VOC + eCO₂, I2C, good accuracy). SGP30 (VOC + CO₂, I2C, low power, good for indoor air quality monitors). SDS011 (PM2.5 + PM10 laser particle counter, good for air quality monitoring)
- **Current**: ACS712 (hall effect, 5A/20A/30A, analog output, 185mV/A @5A). INA219 (I2C, voltage + current + power, up to 26V/3.2A, bidirectional)

### Actuators (Output)
- **DC motor**: control with motor driver (L293D, L298N, TB6612FNG, DRV8833). Need H-bridge for forward/reverse. PWM for speed (0-255 Arduino). For high current: MOSFET + flyback diode (protection from motor back-EMF)
- **Stepper motor**: precise rotation (step angle 1.8° = 200 steps/rev). Driver: A4988, DRV8825, TMC2209. Microstepping for smoother. Use for: 3D printer axes, camera pan/tilt, linear motion
- **Servo motor**: position control (0-180°). PWM signal (500-2500μs pulse, 50Hz). SG90/SG92R ($3, micro, 1.8kg-cm). MG995 (metal gear, 10kg-cm). Standard (TowerPro MG90S for 2.2kg, MG996R for 10kg). Continuous rotation servo: modified for full rotation — used as drive motor in small robots
- **Relay**: electrically controlled switch — for high voltage/current (120VAC/12VDC). SRD-05VDC-SL-C (5V coil, 10A 250VAC). Use flyback diode across coil (protection — 1N4001 or 1N4007). Optocoupler between MCU and high voltage for isolation (transistor + base resistor ~1k). Solid-state relay (SSR) for silent no-contact switching
- **LED**: addressable strip (WS2812B/Neopixel — each pixel individually controllable via 1-wire protocol. 5V, 60mA max per pixel = 3.6A for 60 pixels at full bright white). Power injection: run separate +5V wires every 50-100 pixels for long strips. Voltage drop along strip causes pink dim at far end if not power injected. Capacitor (1000μF) across power lines + resistor (470Ω) on data line to protect

## Communication Protocols
- **I2C**: 2-wire (SDA/SCL). Multiple devices on same bus (unique address, 7-bit = 128 addresses, some reserved 0x00-0x07, some by manufacturer). Master/slave. Speed: 100kHz (standard), 400kHz (fast), 1MHz (fast+), 3.4MHz (high speed). Pull-up resistors (4.7k typical) needed. Good for: sensors, displays, EEPROM, ADCs, short distance (<1m). Wire library on Arduino
  - Address conflict: some sensors come with same address (two ADXL345 sensors = both 0x53). Resolve: multiplexer (TCA9548A) or selectable address pin (SDO/ALT — tie to VCC or GND, many sensors have this)
- **SPI**: 4-wire (MOSI, MISO, SCK, CS/chip select — one per device). Full duplex, faster than I2C (up to 80 MHz). No pull-up resistors, no addressing. Good for: displays, SD cards, ADCs, fast communication to short SPI bus. More pins per device (but CS per device). Full duplex simultaneous TX + RX
- **Serial/UART**: TX/RX. Communication between MCU and PC (USB-to-serial, CP2102/CH340). GPS modules, Bluetooth (HC-05), some sensors. Baud rates: 9600 (slow, reliable), 115200 (fast, common for GPS/ESP), 921600 (ESP flashing). 3.3V vs 5V — check voltage (use level shifter if mixing)
- **1-Wire**: single data line + ground. Each device has unique 64-bit ROM address. DS18B20 temperature sensors (multiple on same wire, unique IDs). Library: OneWire + DallasTemperature. Slow (16kbps). Power can be parasitic (sensor steals power from data line — DS18B20 can operate in parasite power mode with only 2 wires, no VCC)
- **CAN Bus**: automotive/industrial. 2-wire (CAN-H, CAN-L), differential signaling. Up to 1Mbps, up to 40m (slower for longer). Extremely reliable. Used in: cars, industrial automation, some robotics. Controller: MCP2515 + MCP2551 (SPI interface with Arduino). Lots of industrial IoT sensors available

## Power Management
- **Battery types**: Li-Ion (3.7V nominal, 4.2V full, need protection circuit for over-discharge — below 2.7V = damage. TP4056 charger module $1). LiFePO₄ (3.2V nominal, safer, longer cycle life). 18650 cells (common — use protected cells for safety). AAA/AA: NiMH rechargeable (eneloop = low self-discharge, 1.2V nominal)
- **Voltage regulation**: linear regulator (AMS1117-3.3 — simple, low noise, inefficient — drops 5V → 3.3V = 1.7V dissipated as heat. For low current only). Buck converter (efficient >85%, use for battery projects. LM2596, MP1584, Mini-360). For 3.3V: AMS1117 is fine for simple projects up to 1A with heatsink; buck if power matters (battery)
  - Sleep modes: ESP32 deep sleep (5μA), Arduino sleep (power-down ~0.1μA). Wake: timer, external interrupt, touch. Use MOSFET to cut power to sensors when sleeping
- **Solar**: 5V panel (for charging Li-Ion via TP4056 or BQ24060). 6V/1W panel → ~200mA. TP4056 has charge + protection. Consider: solar charge controller (PWM vs MPPT — MPPT 10-30% more efficient, overkill for small systems). Battery capacity: 18650 3000mAh → 12Wh. Average ESP32 project running 30mA (awake and connected): 12Wh × 1000 / (0.030A × 5V) = hours? 12Wh / 0.15W = 80 hours. With duty cycle 1%: >300 days on a single charge
