# Acoustics

Sound physics, hearing, room acoustics, and audio technology.

## Sound Physics
- **Wave properties**: Frequency (Hz — pitch), Amplitude (dB — loudness), Wavelength (λ = v/f), Speed in air (343 m/s at 20°C, increases with temperature). Sound is a longitudinal pressure wave (compression + rarefaction)
- **Sound pressure level (SPL)**: Logarithmic scale — dB = 20 log₁₀(P/P₀). 0 dB = hearing threshold (20 μPa). 60 dB = normal conversation. 85 dB+ = hearing damage with prolonged exposure. 120 dB = pain threshold. 140 dB = immediate damage. Every +10 dB = 2x perceived loudness, 10x intensity
- **Inverse square law**: Sound intensity decreases 6 dB for every doubling of distance from point source. Relevant for speaker placement, sound system design
- **Standing waves**: Reflections causing constructive/destructive interference — peaks at half-wavelength multiples of room dimension. Causes room modes (boomy bass, dead spots). Lower frequencies have longer wavelengths → standing waves more problematic in small rooms
- **Doppler effect**: Frequency shift from relative motion — source approaching = higher pitch (shorter wavelength), receding = lower pitch. Used in radar (speed measurement), medical ultrasound (blood flow)
- **Refraction**: Sound bends toward cooler air (speed decreases) — explains why sound travels farther at night (temperature inversion). Wind also bends sound (downwind = louder)

## Human Hearing
- **Anatomy**: Outer ear (pinna → ear canal) focuses sound. Middle ear (eardrum → ossicles: malleus, incus, stapes — amplify vibration 20x). Inner ear (cochlea — fluid-filled, hair cells convert mechanical to electrical signal → auditory nerve). Basilar membrane frequency mapping: high frequencies at base, low at apex
- **Frequency range**: 20 Hz - 20,000 Hz (humans). Decreases with age (presbycusis — high frequencies first). Speech frequencies: 300-3,000 Hz. Most sensitive: 2,000-5,000 Hz (evolution for speech, also why sibilants are important)
- **Loudness perception**: Fletcher-Munson curves (equal loudness contours) — ears less sensitive at low and very high frequencies. "Loudness" button boosts bass/treble at low volume to compensate. Phon scale: loudness level relative to 1 kHz reference
- **Localization**: Interaural time difference (ITD — low frequencies below 1.5 kHz, wavelengths longer than head width). Interaural level difference (ILD — high frequencies, head shadows). Pinna filtering (vertical localization). Precedence effect (first arrival determines perceived direction — reflections suppressed)

## Room Acoustics
- **Reverberation time (RT60)**: Time for sound to decay 60 dB after source stops. Optimal: speech 0.5-0.8s, classical music 1.5-2.5s, theater 1-1.5s. Calculated: Sabine equation, RT60 = 0.161V/A (V = room volume m³, A = total absorption in Sabins)
- **Absorption**: Porous absorbers (fiberglass, mineral wool, acoustic foam — absorb mid/high frequencies). Panel absorbers (wood panel over air gap — absorb low frequencies). Helmholtz resonators (tuned cavity — specific frequency absorption). People = excellent absorbers (empty room sounds different than full)
- **Diffusion**: Scatter reflections to prevent echoes/flutter while maintaining liveliness. Quadratic residue diffusers (QRD — wells of varying depth, mathematically designed). Skyline diffusers (block-based). Bookshelves with varied books = natural diffuser
- **Room modes**: Axial (between parallel walls), Tangential (4 surfaces), Oblique (6 surfaces). Axial strongest — room dimensions/aspect ratios matter. Avoid cube rooms or multiples of same dimension (mode buildup). Bolt area: ratio recommendations for even mode distribution
- **Transmission loss**: Sound isolation — STC rating (Sound Transmission Class). Single stud wall ~35 STC (can hear conversation through). Staggered/ double stud wall + insulation + two layers of drywall ~55-65 STC. Flanking paths (HVAC, under door, electrical outlets) undermine wall isolation

## Audio Technology
- **Microphones**: Dynamic (moving coil — robust, good for loud sources, guitar cabs, live vocals). Condenser (capacitor — sensitive, detailed, requires phantom power 48V — studio vocals, acoustic instruments). Ribbon (thin metal ribbon — fragile, smooth vintage sound). Polar patterns: Cardioid (heart-shaped — front pickup, reject rear), Omnidirectional (all directions), Figure-8 (front + back, reject sides), Supercardioid/ Hypercardioid (narrower, more side rejection)
- **Loudspeakers**: Driver types — woofers (<500 Hz), midrange (500 Hz-5 kHz), tweeters (>5 kHz). Active (built-in amp + crossover) vs passive (external amp needed). Enclosure: sealed (tight bass, rolloff -12dB/octave), ported (more bass output, -24dB/octave), transmission line (deep bass, complex). Sensitivity (dB at 1W/1m) — higher = louder from same power
- **Digital audio**: Sampling rate (44.1 kHz CD standard — Nyquist theorem: 2x max frequency. 48 kHz video, 96/192 kHz high-res). Bit depth (16-bit = 96 dB dynamic range, 24-bit = 144 dB). ADC/DAC convert analog ↔ digital. Aliasing = frequencies above Nyquist fold back — fixed by anti-aliasing filter
- **Compression**: Lossless (FLAC, ALAC — original perfectly reconstructed). Lossy (MP3, AAC, OGG — removes inaudible info, psychoacoustic masking. ~10:1 compression, transparency at 256-320 kbps). Bitrate vs quality tradeoff

## Applications
- **Medical ultrasound**: 1-20 MHz — piezoelectric transducer sends pulse, echoes from tissue interfaces form image. Doppler mode: blood flow direction + velocity. Applications: pregnancy, cardiac, abdominal, musculoskeletal
- **Sonar**: Sound navigation and ranging — active (send ping, measure return) and passive (listen only). Used in: naval, fishing, bathymetry, underwater mapping
- **Music production**: Equalization (boost/cut frequencies), Reverb (simulate room), Delay/echo, Compression (reduce dynamic range), Panning (stereo placement), Mastering (final polish for consistent playback across systems)
- **Architectural acoustics**: Concert hall design (shoebox: Vienna Musikverein, Boston Symphony Hall — classic. Vineyard: Berlin Philharmonic — terraced seating). Performance venue design must balance clarity (for speech) + warmth (for music) + intimacy
