#!/usr/bin/env python3
"""
Nebula Strike Audio Generator
Synthesizes all game sound effects and music
"""

import os
import math
import wave
import struct
import random
from array import array


class AudioGenerator:
    def __init__(self, output_dir="shared-assets/raw/audio"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        self.sample_rate = 44100
    
    def save_wav(self, filename, samples):
        """Save samples as WAV file"""
        path = os.path.join(self.output_dir, filename)
        
        with wave.open(path, 'w') as wav:
            wav.setnchannels(2)  # Stereo
            wav.setsampwidth(2)  # 16-bit
            wav.setframerate(self.sample_rate)
            
            # Convert float samples to 16-bit integers
            int_samples = array('h')
            for s in samples:
                # Clamp and convert
                val = max(-1.0, min(1.0, s))
                int_samples.append(int(val * 32767))
            
            wav.writeframes(int_samples.tobytes())
        
        duration = len(samples) / (2 * self.sample_rate)
        print(f"✅ {filename} ({duration:.2f}s, {len(samples)//2} samples)")
        return path
    
    def generate_sine(self, freq, duration, volume=0.5):
        """Generate sine wave"""
        samples = []
        num_samples = int(self.sample_rate * duration) * 2  # Stereo
        
        for i in range(0, num_samples, 2):
            t = i / (2 * self.sample_rate)
            # Left and right channels with slight phase for width
            left = volume * math.sin(2 * math.pi * freq * t)
            right = volume * math.sin(2 * math.pi * freq * t + 0.1)
            samples.extend([left, right])
        
        return samples
    
    def generate_sawtooth(self, freq, duration, volume=0.3):
        """Generate sawtooth wave (rich harmonics)"""
        samples = []
        num_samples = int(self.sample_rate * duration) * 2
        
        for i in range(0, num_samples, 2):
            t = i / (2 * self.sample_rate)
            # Sawtooth: sum of harmonics
            val = 0
            for h in range(1, 10):
                val += math.sin(2 * math.pi * freq * h * t) / h
            
            left = volume * val
            right = volume * val
            samples.extend([left, right])
        
        return samples
    
    def generate_noise(self, duration, volume=0.3, brown=False):
        """Generate white or brown noise"""
        samples = []
        num_samples = int(self.sample_rate * duration) * 2
        
        last_out = 0.0
        
        for i in range(0, num_samples, 2):
            if brown:
                # Brown noise (deeper)
                white = random.uniform(-1, 1)
                last_out = (last_out + (0.02 * white)) / 1.02
                val = last_out * 3.5
            else:
                # White noise
                val = random.uniform(-1, 1)
            
            samples.extend([val * volume, val * volume])
        
        return samples
    
    def apply_envelope(self, samples, attack=0.01, decay=0.1, sustain=0.7, release=0.2):
        """Apply ADSR envelope to samples"""
        total_duration = len(samples) / (2 * self.sample_rate)
        num_samples = len(samples) // 2
        
        # Calculate sample counts for each phase
        attack_samples = int(attack * self.sample_rate)
        decay_samples = int(decay * self.sample_rate)
        release_samples = int(release * self.sample_rate)
        sustain_samples = num_samples - attack_samples - decay_samples - release_samples
        
        envelope = []
        
        # Attack
        for i in range(attack_samples):
            envelope.append(i / attack_samples)
        
        # Decay
        for i in range(decay_samples):
            envelope.append(1.0 - (1.0 - sustain) * (i / decay_samples))
        
        # Sustain
        envelope.extend([sustain] * max(0, sustain_samples))
        
        # Release
        for i in range(min(release_samples, num_samples - len(envelope))):
            envelope.append(sustain * (1.0 - i / release_samples))
        
        # Pad if needed
        while len(envelope) < num_samples:
            envelope.append(0)
        
        # Apply envelope
        result = []
        for i in range(0, len(samples), 2):
            idx = i // 2
            if idx < len(envelope):
                env = envelope[idx]
                result.extend([samples[i] * env, samples[i+1] * env])
            else:
                result.extend([0, 0])
        
        return result
    
    def apply_fade(self, samples, fade_in=0, fade_out=0):
        """Apply simple fade"""
        num_samples = len(samples) // 2
        fade_in_samples = int(fade_in * self.sample_rate)
        fade_out_samples = int(fade_out * self.sample_rate)
        
        result = []
        for i in range(0, len(samples), 2):
            idx = i // 2
            vol = 1.0
            
            if idx < fade_in_samples and fade_in_samples > 0:
                vol = idx / fade_in_samples
            elif idx > num_samples - fade_out_samples and fade_out_samples > 0:
                vol = (num_samples - idx) / fade_out_samples
            
            result.extend([samples[i] * vol, samples[i+1] * vol])
        
        return result
    
    def generate_laser_shoot(self):
        """Laser shooting sound - frequency sweep down"""
        duration = 0.3
        samples = []
        num_samples = int(self.sample_rate * duration) * 2
        
        start_freq = 880  # A5
        end_freq = 220    # A3
        
        for i in range(0, num_samples, 2):
            t = i / (2 * self.sample_rate)
            progress = i / num_samples
            
            # Exponential frequency drop
            freq = start_freq * math.pow(end_freq / start_freq, progress)
            
            # Add harmonics for "buzz"
            val = math.sin(2 * math.pi * freq * t)
            val += 0.5 * math.sin(2 * math.pi * freq * 2 * t)
            val *= 0.3 * (1 - progress)  # Decay volume
            
            samples.extend([val, val])
        
        return self.save_wav("laser-shoot.wav", samples)
    
    def generate_explosion(self):
        """Explosion sound - noise with lowpass"""
        duration = 0.8
        
        # Generate brown noise
        samples = self.generate_noise(duration, volume=0.8, brown=True)
        
        # Apply envelope (quick attack, long decay)
        samples = self.apply_envelope(samples, attack=0.01, decay=0.3, sustain=0.4, release=0.5)
        
        # Add sub-bass kick
        bass = self.generate_sine(60, 0.2, volume=0.8)
        bass = self.apply_envelope(bass, attack=0.001, decay=0.1, sustain=0, release=0.1)
        
        # Mix
        mixed = []
        for i in range(min(len(samples), len(bass))):
            mixed.append(samples[i] + bass[i])
        mixed.extend(samples[len(bass):])
        
        return self.save_wav("explosion.wav", mixed)
    
    def generate_powerup(self):
        """Power-up sound - ascending arpeggio"""
        duration = 1.2
        samples = []
        
        # Chord progression: C major -> E minor -> G major
        chords = [
            [523.25, 659.25, 783.99],  # C-E-G
            [659.25, 783.99, 987.77],  # E-G-B
            [783.99, 987.77, 1174.66], # G-B-D
        ]
        
        chord_duration = duration / len(chords)
        
        for chord in chords:
            chord_samples = []
            num_samples = int(self.sample_rate * chord_duration) * 2
            
            for i in range(0, num_samples, 2):
                t = i / (2 * self.sample_rate)
                
                # Mix chord tones
                val = 0
                for freq in chord:
                    val += 0.15 * math.sin(2 * math.pi * freq * t)
                
                # Add sparkle
                val += 0.05 * math.sin(2 * math.pi * 2000 * t) * (i / num_samples)
                
                chord_samples.extend([val, val])
            
            # Fade each chord
            chord_samples = self.apply_fade(chord_samples, fade_in=0.05, fade_out=0.05)
            samples.extend(chord_samples)
        
        return self.save_wav("powerup.wav", samples)
    
    def generate_game_over(self):
        """Game over sound - sad descending slide"""
        duration = 3.0
        samples = []
        num_samples = int(self.sample_rate * duration) * 2
        
        # Descending chromatic scale
        start_freq = 440  # A4
        end_freq = 110    # A2
        
        for i in range(0, num_samples, 2):
            t = i / (2 * self.sample_rate)
            progress = i / num_samples
            
            # Slow exponential descent
            freq = start_freq * math.pow(end_freq / start_freq, math.pow(progress, 0.7))
            
            # Sine with slight vibrato (sad wobble)
            vibrato = 1 + 0.02 * math.sin(2 * math.pi * 5 * t)
            val = 0.4 * math.sin(2 * math.pi * freq * vibrato * t)
            
            # Add subtle harmony (fifth below, detuned)
            val += 0.2 * math.sin(2 * math.pi * freq * 0.666 * t + 0.1)
            
            # Fade out
            vol = 1.0 - math.pow(progress, 2)
            
            samples.extend([val * vol, val * vol])
        
        return self.save_wav("game-over.wav", samples)
    
    def generate_background_music(self):
        """Background music - ambient space drone"""
        duration = 30.0  # Short loop for testing
        samples = []
        num_samples = int(self.sample_rate * duration) * 2
        
        # Base drone frequencies (perfect fifth)
        base_freqs = [110, 164.81]  # A2, E3
        
        # Arpeggio pattern (slow)
        arp_notes = [220, 261.63, 329.63, 392, 440, 392, 329.63, 261.63]
        arp_duration = duration / len(arp_notes)
        
        for i in range(0, num_samples, 2):
            t = i / (2 * self.sample_rate)
            progress = i / num_samples
            
            # Drone layer
            drone = 0
            for freq in base_freqs:
                drone += 0.15 * math.sin(2 * math.pi * freq * t)
                # Add subtle movement
                drone += 0.05 * math.sin(2 * math.pi * freq * 1.01 * t)
            
            # Arpeggio layer
            arp_idx = int(progress * len(arp_notes)) % len(arp_notes)
            arp_freq = arp_notes[arp_idx]
            arp = 0.1 * math.sin(2 * math.pi * arp_freq * t)
            
            # Pad chords (slow changes)
            pad_freq = 130.81  # C3
            pad = 0.08 * math.sin(2 * math.pi * pad_freq * t)
            
            # Mix
            val = drone + arp + pad
            
            # Very slow filter sweep effect (via volume)
            sweep = 0.7 + 0.3 * math.sin(2 * math.pi * t / 10)
            
            samples.extend([val * sweep, val * sweep])
        
        return self.save_wav("background-music.wav", samples)
    
    def generate_all(self):
        """Generate all audio files"""
        print("🔊 Generating Audio Files...\n")
        
        self.generate_laser_shoot()
        self.generate_explosion()
        self.generate_powerup()
        self.generate_game_over()
        self.generate_background_music()
        
        print(f"\n✅ All audio saved to: {self.output_dir}")


if __name__ == "__main__":
    gen = AudioGenerator()
    gen.generate_all()
