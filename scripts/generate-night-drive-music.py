"""Generate the original, seamless night-drive loop used by the game."""

from array import array
import math
import random
import wave
from pathlib import Path


SAMPLE_RATE = 22_050
BPM = 84
BEAT = 60 / BPM
BARS = 16
DURATION = BARS * 4 * BEAT
TOTAL = round(DURATION * SAMPLE_RATE)


def midi(note):
    return 440 * 2 ** ((note - 69) / 12)


def envelope(t, length, attack=0.015, release=0.22):
    return min(1, t / attack) * min(1, max(0, length - t) / release)


track = array("f", [0]) * TOTAL


def add_note(start, length, note, volume, voice="keys"):
    begin = round(start * SAMPLE_RATE)
    count = min(round(length * SAMPLE_RATE), TOTAL - begin)
    frequency = midi(note)
    for i in range(max(0, count)):
        t = i / SAMPLE_RATE
        phase = 2 * math.pi * frequency * t
        env = envelope(t, length)
        if voice == "bell":
            tone = math.sin(phase) + 0.28 * math.sin(phase * 2.01) + 0.12 * math.sin(phase * 3.98)
            env *= math.exp(-2.8 * t / max(length, 0.01))
        elif voice == "bass":
            tone = 0.8 * math.sin(phase) + 0.18 * math.sin(phase * 2)
        else:
            tone = 0.72 * math.sin(phase) + 0.2 * math.sin(phase * 2) + 0.08 * math.sin(phase * 3)
            env *= 0.72 + 0.28 * math.exp(-4 * t)
        track[begin + i] += volume * env * tone


progression = [
    (45, [57, 60, 64, 67]),
    (41, [53, 57, 60, 64]),
    (48, [55, 60, 64, 67]),
    (43, [55, 59, 62, 64]),
]
melody = [
    [69, 72, 76, 72, 71, 69, 67, 64],
    [69, 67, 65, 64, 60, 64, 65, 67],
    [67, 69, 72, 76, 74, 72, 69, 67],
    [67, 71, 74, 71, 69, 67, 64, 62],
]

for bar in range(BARS):
    bass, chord = progression[bar % 4]
    start = bar * 4 * BEAT
    for note in chord:
        add_note(start, 3.85 * BEAT, note, 0.055, "keys")
    add_note(start, 1.75 * BEAT, bass, 0.11, "bass")
    add_note(start + 2 * BEAT, 1.75 * BEAT, bass + 7, 0.085, "bass")
    phrase = melody[bar % 4]
    for step, note in enumerate(phrase):
        if (bar + step) % 5 != 0:
            add_note(start + step * BEAT / 2, 0.42 * BEAT, note, 0.07, "bell")

# Soft brushed pulse and tape texture keep the loop alive without dominating play.
random.seed(20260904)
for beat_index in range(BARS * 4):
    start = round(beat_index * BEAT * SAMPLE_RATE)
    for i in range(min(round(0.075 * SAMPLE_RATE), TOTAL - start)):
        decay = math.exp(-i / (0.018 * SAMPLE_RATE))
        track[start + i] += random.uniform(-1, 1) * 0.015 * decay
for i in range(TOTAL):
    track[i] += random.uniform(-1, 1) * 0.0012

# Circular echoes preserve the seamless loop boundary.
dry = array("f", track)
for delay_seconds, gain in ((0.18, 0.12), (0.36, 0.07)):
    delay = round(delay_seconds * SAMPLE_RATE)
    for i, sample in enumerate(dry):
        track[(i + delay) % TOTAL] += sample * gain

peak = max(abs(sample) for sample in track) or 1
scale = 0.78 * 32767 / peak
pcm = array("h", (round(max(-32768, min(32767, sample * scale))) for sample in track))

output = Path(__file__).resolve().parents[1] / "src" / "assets" / "audio" / "night-drive-loop.wav"
output.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(output), "wb") as wav:
    wav.setnchannels(1)
    wav.setsampwidth(2)
    wav.setframerate(SAMPLE_RATE)
    wav.writeframes(pcm.tobytes())
print(f"generated {output} ({output.stat().st_size} bytes, {DURATION:.2f}s)")
