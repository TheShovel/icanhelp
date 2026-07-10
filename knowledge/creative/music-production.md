# Music Production & Audio Engineering

## Recording Setup
- **DAW** (Digital Audio Workstation): Ableton Live (electronic, live performance, session & arrangement view: clips triggerable). Logic Pro (Mac, comprehensive, good value). Pro Tools (industry standard for recording studios, tracking + editing + mixing). FL Studio (beat-making, pattern-based). GarageBand (free, good for beginners, Mac only). Reaper (cheap, customizable, $60, Windows/Mac/Linux, pro capability)
- **Interface** (audio interface): converts analog (mic/instrument) to digital (USB/Thunderbolt). Focusrite Scarlett (2i2, 4i4 — most popular entry-level, clean preamps). Universal Audio Apollo (pro, onboard DSP + UAD emulations). SSL 2 (classic SSL preamp sound). RME Babyface/UCX (rock-solid drivers, lower latency, pro reliability)
  - Key specs: preamp quality, latency (round trip, lower = better: 2-4ms RTL for pro interface, 8-15ms for budget). Number of inputs/outputs. ADAT expandability (add 8 inputs with a preamp via ADAT cable)
- **Microphone types**: dynamic (SM57, SM58 — rugged, loud sources: guitar amp, drums, live vocals. SM57 instrument icon, SM58 vocal icon — designed for "no pain/feedback" on stage but softer on nasal voices). Condenser (NT1A, AT2020, U87 — sensitive, wide frequency response: vocals, acoustic guitar, overheads. Require phantom power 48V). Ribbon (Royce 121 — fragile, smooth, natural, good for guitar amp + vintage vibe). Large diaphragm (vocals, voiceover) vs small diaphragm (acoustic, instrument, choirs)
- **Monitoring**: studio monitors (flat frequency response — not colored like consumer speakers. JBL 305, Yamaha HS series/white cone, KRK Rokit series, Adam Audio (ribbon tweeter). Room treatment essential! Bare walls create reflections = inaccurate mix). Headphones: open-back (AKG K240, Beyerdynamic DT 990, Sennheiser HD 600 — natural, simulate speakers-in-room) vs closed-back (DT 770 — for tracking/recording, no bleed into mic). Mix: monitors + open-back headphones combined

## Recording Tips
- **Mic placement**: distance = proximity effect (bass boost closer — move closer for richer, more intimate vocals; move back for neutrality). Experiment: start at 6 inches from mouth, move slightly off-axis (slightly to side = soften sibilance). Pop filter essential (stops plosives, protects capsule)
  - Acoustic guitar: aim at 12th fret (brightness + body mix, 3-6 inches back). Moving closer to bridge = more attack. Room mic 2-3 ft back for natural reverb
  - Electric guitar cabinet: SM57 on-axis at grill cloth, edge of speaker cone (center = brighter, harsher; edge = warmer). Combine with room mic = blend of direct + room
- **Signal chain**: mic → preamp (gain level: aim for -18 to -12 dBFS peak for 24-bit recording — plenty of dynamic range, leave 6 dB headroom for transients) → (compressor) → (EQ) → DAW. Track at 24-bit/48kHz minimum (CD quality = 16-bit 44.1kHz). More headroom at 24-bit makes gain staging less critical: you can afford lower levels)

## Mixing
- **Levels (faders)**: start with volume only — get rough balance before any processing. Don't use processing to fix structural mix problems. Set levels with kick and snare first, balance around them
  - VU meter: aim for average -18 dBFS (RMS) for individual tracks, mix bus around -6 to -3 dBFS peak
- **EQ (equalization)** — shaping frequencies:
  - Sub-bass (20-60Hz): feel, rumble. Kick + bass. Cut narrow for "tight" sub. Beware: eats headroom. HPF at 30Hz for most non-sub content
  - Bass (60-250Hz): warmth, fullness. Kick fundamental ~60-100Hz, bass ~80-200Hz. Cut mud at 200-350Hz for clarity
  - Low mids (250-1000Hz): body, boom. Too much = muddy. Cut vs boost at 300-500Hz for clarity. Acoustic guitar's "boxy" zone at 500Hz
  - Mids (1-5kHz): presence, clarity. Vocals: boost 2-4kHz for intelligibility, cut 1-2kHz for nasal. Snare crack at ~5kHz
  - High mids (5-10kHz): air, sparkle, sibilance. Cut 6-8kHz for harsh sibilance (de-ess), boost 8-12kHz for air. Hi-hat shimmer, cymbals sparkle
  - Highs (10-20kHz): air, space. Boost gently for sheen. Beware: adds hiss + noise
  - High-pass filter (HPF): cut below fundamental on almost everything except kick + bass (e.g., HPF vocals at 80Hz, guitar at 100Hz, snare at 150Hz). Cleans up mud, space for kick
- **Compression** — control dynamic range:
  - Threshold (level at which compression starts). Ratio (how much compression: 2:1 = for every 2dB over threshold, output = 1dB. 4:1 moderate. 10:1+ = limiting). Attack (how fast compression kicks in: fast catches peaks, slower allows transient through). Release (how fast stops compressing). Knee (soft = gradual vs hard = sudden)
  - Vocals: 2-4:1 ratio, moderate attack (10ms, let transient through), auto/medium release, 3-5dB gain reduction
  - Drums: 4-8:1 ratio, fast attack (2-5ms) for punch, faster release (50ms) for sustain. Parallel compression: blend compressed + dry signals
  - Bus compression: gentle, 1.5-2:1 on master bus / drum bus, 2dB gain reduction for "glue". Mix bus: bringing all together
  - Limiter: 10:1+ ratio, ceiling near 0dBFS. Sometimes 20:1 attack time: fast (1ms) for mastering or catching peaks. On master bus to prevent clipping
- **Reverb**: space emulation. Room (small, natural), Hall (large, symphonic), Plate (smooth, 1950s classic), Spring (guitar amp). Send (aux bus) not insert: shared reverb across tracks for cohesion. Send amount = wet/dry blend
  - Predelay (time before reverb starts: 10-30ms helps clarity — separates dry vocal from reverb tail). Decay time (1-2s for vocals, 2-4s for drums, shorter for clarity)
  - Use reverb ear: "Do I need reverb at all or is the close mic/room enough?" Sometimes close dry vocals work better
- **Delay/Echo**: timed repeats. Tempo-synced = 1/4 note, 1/8, dotted 1/8. Used for: space without washiness (reverb can get muddy). Ping-pong delay: left/right alternating
- **Panning**: create width. Drums: kick center, snare center/ slight, hi-hat slightly right, overheads L+R (audience perspective). Bass center. Vocals center. Guitars panned L+R (doubled tracks) = wide stereo image. Room mics panned wide = depth + space

## Mastering
- **Final polish** (not loudness battle): optimize for playback systems (car, phone, streaming, club). Steps: final EQ (broad, corrective — gentle smoothing), multiband compression / dynamics (balance after EQ), limiter (peak ceiling typically -0.5 to -1.0 dBTP to avoid inter-sample peaks and clipping on streaming codecs), stereo enhancement (spread width carefully, avoid mono issues). Reference tracks essential — compare to commercial releases in same genre
  - **Loudness**: streaming (LUFS-based normalization, loudness normalization: LUFS for Spotify -14 LUFS, YouTube -14 LUFS, Apple Music -16 LUFS. Don't push limiter too hard: -8 LUFS for loud genres like EDM/rock, -12 to -14 LUFS for quieter/acoustic). Louder master = less dynamic range, reduced punch, but greater streaming loudness by normalization target means no extra volume and likely more distortion = sound worse. A well-mixed track at -16 LUFS will be turned up by streaming to -14 — no penalty for good dynamics

## Audio File Formats
- **WAV**: uncompressed, lossless, huge. Studio + archive standard. 24-bit/96kHz recommended for recording (more headroom, better transient capture). 16-bit/44.1kHz for CD
- **AIFF**: compressed but mathematically similar to WAV, different byte order. Less common
- **FLAC**: free lossless compressed (about 50-70% size of WAV). Preferred for music archiving
- **MP3**: lossy (perceptual coding: removes frequencies you can't hear). 128kbps (minimal), 256kbps (near CD quality), 320kbps (basically indistinguishable). AM radio quality: 128kbps. AAC (Advanced Audio Codec): MP4 format, technically better than MP3 at same bitrate. Apple's format, used by iTunes, YouTube, Spotify
- **OGG Vorbis**: open-source, better than MP3 at low bitrates. Used in Spotify at 320kbps OGG Vorbis (vorbis works for Spotify better than MP3 due to royalty-free)
- **Sample rate**: 44.1kHz (CD). 48kHz (video). 88.2/96k (HD audio). Nyquist theorem: sample rate must be 2× highest frequency. Human hearing ~20kHz → 44.1kHz sample rate captures up to 22.05kHz, adequate. Higher rates capture more for processing headroom even if final output at 44.1
- **Bit depth**: 16-bit (CD, 96dB dynamic range). 24-bit (studio, 144dB dynamic range). Higher bit depth = more dynamic range, lower noise floor. Critical for recording: 24-bit gives huge headroom so you don't need to push levels so hot

## Home Studio Setup
- **Room treatment**: absorbs reflections, not deadens sound entirely. Panels at first reflection points (mirror trick: sit at listening position, have assistant slide mirror on wall, where you see monitor = install panel). Bass traps in corners (absorb low frequencies, most problematic in small rooms). Reflection filter behind mic (blocks room reflections from vocal recording)
  - Budget: moving blankets, thick comforters, bookshelves (diffusion). Don't need to spend thousands: focus on early reflections + bass. A room can be improved dramatically with $200 of OC703 panels
- **Acoustic treatment NOT foam**: foam only absorbs mids/highs, does almost nothing for bass. For home studios: OC703 (mineral wool rigid fiberglass) panels at first reflection points at ear height, pink fluffy insulation in corners for bass traps, then possibly move to auralex-style foam for splash reflections. Ceiling cloud over listening position if possible
