# Music Production Basics & DAW Workflow

Beginner-oriented companion to the deeper recording/mixing guides. Focuses on how to actually use a DAW and the core concepts you need before touching knobs.

## What a DAW Does
A DAW (Digital Audio Workstation) is software that records, edits, and arranges audio and MIDI. Core building blocks:
- **Tracks**: horizontal lanes. Audio tracks hold recorded sound; MIDI tracks hold note data (not sound) that triggers virtual instruments.
- **Timeline / Arrangement**: left-to-right time. Playhead shows current position.
- **Transport**: play, stop, record, loop, tempo.
- **Mixer**: vertical channels (one per track) with faders (volume), pan, mute, solo, and inserts/sends for effects.
- **Plugins**: VST/AU/CLAP instruments (synths, samplers) and effects (EQ, reverb, compression).

## Choosing a DAW
- **Ableton Live**: best for electronic, beat-making, and live performance. Two views: Session (clip launcher, great for jamming/performing) and Arrangement (linear timeline). Steep but rewarding.
- **FL Studio**: pattern-based, excellent for hip-hop/EDM beats. Piano roll is widely loved.
- **Logic Pro** (Mac): full-featured, great stock plugins, strong value. Best all-rounder on Mac.
- **GarageBand** (Mac, free): simplified Logic. Ideal first DAW; projects transfer to Logic.
- **Pro Tools**: industry standard for studio tracking/editing. Less intuitive for beat-making.
- **Reaper** (Windows/Mac/Linux, ~$60): lightweight, infinitely customizable, pro capability. Best budget/power-user option. Runs on Linux.
- **Bitwig** (Linux/Mac/Windows): Ableton-like, strong for sound design.
- Pick one and learn it deeply. Switching costs more time than the feature differences are worth when starting.

## First Session: Project Setup
1. **Set sample rate and bit depth**: 48kHz / 24-bit is a safe default. Match your audio interface settings.
2. **Set tempo (BPM)** and time signature before recording so the grid lines up.
3. **Create tracks**: one audio track per mic source, one MIDI track per virtual instrument.
4. **Pick an audio interface** as the input/output device (not the built-in sound card) for low latency.
5. **Set buffer size**: lower (64-128 samples) for recording (less latency), higher (256-1024) for mixing (more stable). Latency = delay between playing and hearing.
6. **Save early, save often.** Use the DAW's project format, not exported audio, while working.

## Recording Audio
- **Arm the track** (record-enable) and check input monitoring isn't doubling the signal (avoid echo/phase).
- **Gain stage**: sing/play at a normal level, aim for peaks around -12 to -6 dBFS. Red = clipping = permanent distortion. Leave headroom.
- **Use a click/metronome** for tight timing, especially if layering tracks later.
- **Punch in/out** to re-record a section instead of the whole take.
- Record multiple **takes**; use comping (composite editing) to stitch the best parts.

## Working with MIDI
- MIDI carries note data: pitch, velocity (how hard), timing, length. No audio yet.
- A **virtual instrument** (VSTi) turns MIDI into sound. Swap instruments without re-recording.
- **Piano roll / step sequencer**: draw or play notes. Quantize snaps notes to the grid to fix timing (use lightly; 100% quantize sounds robotic).
- **Velocity** shapes feel: louder notes = harder hits. Humanize slightly for realism.
- **CC (control change)** automation (e.g., CC1 modulation, CC11 expression) adds movement.

## Arranging a Song
- Build sections: intro, verse, chorus, bridge, outro. Duplicate and rearrange clips.
- **Looping** a 1-2 bar idea is the fastest way to sketch a beat or riff.
- Use **markers** to label sections so navigation is easy.
- Keep the arrangement interesting: change instrumentation, drop elements out, add fills.

## Basic Effects (in order)
Signal typically flows: source -> EQ -> compression -> (send to reverb/delay) -> fader.
- **EQ**: cut what you don't need (e.g., high-pass a vocal at 80Hz) before boosting.
- **Compression**: even out levels; 2-4:1 ratio, a few dB reduction for vocals/instruments.
- **Reverb/Delay**: adds space. Use sends so multiple tracks share one reverb (cohesive, CPU-friendly).
- **Saturation**: subtle warmth/harmonics; gentler than distortion.

## Mixing Fundamentals
- **Balance first**: set fader levels by ear before adding effects.
- **Pan**: place elements in stereo space (kick/bass/vocals center; guitars/keys wide).
- **Subtractive mixing**: cut frequencies to create room rather than boosting everything.
- **Reference**: compare your mix to a professional track in the same genre at similar loudness.
- **Take breaks**: ears fatigue fast. Reset by listening to something else.

## Exporting (Bouncing)
- **Export/bounce** the master to WAV (24-bit) for archiving and MP3 (256-320kbps) for sharing.
- Bounce at the project sample rate; don't upsample unnecessarily.
- Leave a little headroom (peak around -1 dBTP) so platforms don't clip on playback.
- Keep the project file (with all tracks) so you can revise later; exported audio is final.

## Common Beginner Mistakes
- Recording too hot (clipping). Leave headroom.
- Over-processing: too much compression/reverb masks the performance.
- Skipping gain staging: inconsistent levels make mixing hard.
- Mixing on laptop speakers without references; use headphones or monitors.
- Chasing expensive gear before learning the software you have.
- Not saving versions; keep timestamped backups of the project.

## Minimum Viable Setup to Start
- A computer and DAW (GarageBand or Reaper are free/cheap).
- Headphones (closed-back to avoid mic bleed if recording).
- Optional but recommended: an audio interface + one microphone for vocals/instruments.
- You can make complete tracks with just MIDI instruments and built-in plugins, no gear required.