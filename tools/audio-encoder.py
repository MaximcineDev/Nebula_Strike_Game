#!/usr/bin/env python3
"""
Nebula Strike Audio Encoder
Converts and optimizes audio for Android (OGG) and Web (MP3)
"""

import os
import sys
import json
import argparse
import subprocess
import shutil
from pathlib import Path
from dataclasses import dataclass
from typing import List, Optional, Dict
import concurrent.futures


@dataclass
class AudioConfig:
    name: str
    source_path: Path
    android_path: Path
    web_path: Path
    duration: float
    loop: bool = False
    stream: bool = False
    variations: int = 0


class AudioEncoder:
    # Quality settings
    OGG_QUALITY = 4  # 0-10, higher is better
    MP3_QUALITY = 2  # 0-9, lower is better (VBR)
    
    # Target bitrates (kbps)
    BITRATES = {
        'sfx': 96,      # Sound effects
        'music': 128,   # Background music
        'voice': 64     # Voice/dialogue
    }
    
    def __init__(self, manifest_path: str, base_dir: str):
        self.manifest_path = manifest_path
        self.base_dir = Path(base_dir)
        self.manifest = None
        self.ffmpeg_available = self._check_ffmpeg()
        
    def _check_ffmpeg(self) -> bool:
        """Check if ffmpeg is available"""
        return shutil.which('ffmpeg') is not None
    
    def load_manifest(self) -> bool:
        """Load asset manifest"""
        try:
            with open(self.manifest_path, 'r') as f:
                self.manifest = json.load(f)
            print(f"✅ Loaded manifest: {self.manifest.get('version', 'unknown')}")
            return True
        except Exception as e:
            print(f"❌ Failed to load manifest: {e}")
            return False
    
    def ensure_directories(self):
        """Create output directories"""
        dirs = [
            self.base_dir / "processed" / "android" / "audio",
            self.base_dir / "processed" / "web" / "audio"
        ]
        for d in dirs:
            d.mkdir(parents=True, exist_ok=True)
            print(f"📁 {d}")
    
    def get_audio_type(self, name: str) -> str:
        """Determine audio type from name"""
        name_lower = name.lower()
        if 'music' in name_lower or 'bgm' in name_lower:
            return 'music'
        elif 'voice' in name_lower or 'dialog' in name_lower or 'narration' in name_lower:
            return 'voice'
        else:
            return 'sfx'
    
    def encode_ogg(self, source: Path, output: Path, audio_type: str) -> bool:
        """Encode to OGG Vorbis for Android"""
        if not self.ffmpeg_available:
            print(f"   ⚠️  ffmpeg not found, copying WAV")
            wav_source = source.with_suffix('.wav')
            if wav_source.exists():
                shutil.copy(wav_source, output.with_suffix('.wav'))
            return False
        
        bitrate = self.BITRATES.get(audio_type, 96)
        
        cmd = [
            'ffmpeg', '-y',
            '-i', str(source),
            '-c:a', 'libvorbis',
            '-q:a', str(self.OGG_QUALITY),
            '-ar', '44100',
            '-ac', '2',
            '-b:a', f'{bitrate}k',
            str(output)
        ]
        
        try:
            result = subprocess.run(
                cmd,
                check=True,
                capture_output=True,
                text=True
            )
            
            # Verify output
            if output.exists():
                size = output.stat().st_size
                print(f"   ✅ OGG: {size / 1024:.1f} KB")
                return True
            return False
            
        except subprocess.CalledProcessError as e:
            print(f"   ❌ OGG encoding failed: {e.stderr[:200]}")
            return False
    
    def encode_mp3(self, source: Path, output: Path, audio_type: str) -> bool:
        """Encode to MP3 for Web"""
        if not self.ffmpeg_available:
            print(f"   ⚠️  ffmpeg not found, using fallback")
            return False
        
        bitrate = self.BITRATES.get(audio_type, 96)
        
        cmd = [
            'ffmpeg', '-y',
            '-i', str(source),
            '-c:a', 'libmp3lame',
            '-q:a', str(self.MP3_QUALITY),
            '-ar', '44100',
            '-ac', '2',
            '-b:a', f'{bitrate}k',
            str(output)
        ]
        
        try:
            result = subprocess.run(
                cmd,
                check=True,
                capture_output=True,
                text=True
            )
            
            if output.exists():
                size = output.stat().st_size
                print(f"   ✅ MP3: {size / 1024:.1f} KB")
                return True
            return False
            
        except subprocess.CalledProcessError as e:
            print(f"   ❌ MP3 encoding failed: {e.stderr[:200]}")
            return False
    
    def generate_variations(self, source: Path, base_output: Path, 
                           count: int, format_ext: str) -> List[Path]:
        """Generate pitch/time variations"""
        variations = []
        
        for i in range(1, count + 1):
            # Calculate pitch shift (-10% to +10%)
            pitch_shift = ((i - (count + 1) / 2) / (count / 2)) * 0.1
            
            var_output = base_output.parent / f"{base_output.stem}_{i}{format_ext}"
            
            cmd = [
                'ffmpeg', '-y',
                '-i', str(source),
                '-af', f'asetrate=44100*{1 + pitch_shift},aresample=44100',
                '-c:a', 'libvorbis' if format_ext == '.ogg' else 'libmp3lame',
                '-q:a', str(self.OGG_QUALITY if format_ext == '.ogg' else self.MP3_QUALITY),
                str(var_output)
            ]
            
            try:
                subprocess.run(cmd, check=True, capture_output=True)
                variations.append(var_output)
                print(f"   🎵 Variation {i}: pitch {pitch_shift:+.1%}")
            except subprocess.CalledProcessError:
                print(f"   ⚠️  Failed to create variation {i}")
        
        return variations
    
    def analyze_audio(self, path: Path) -> Dict:
        """Get audio file information"""
        if not self.ffmpeg_available:
            return {'duration': 0, 'channels': 2, 'sample_rate': 44100}
        
        cmd = [
            'ffprobe', '-v', 'error',
            '-show_entries', 'format=duration,bit_rate',
            '-show_entries', 'stream=channels,sample_rate',
            '-of', 'json',
            str(path)
        ]
        
        try:
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            data = json.loads(result.stdout)
            
            return {
                'duration': float(data['format'].get('duration', 0)),
                'channels': int(data['streams'][0].get('channels', 2)),
                'sample_rate': int(data['streams'][0].get('sample_rate', 44100)),
                'bitrate': int(data['format'].get('bit_rate', 0)) // 1000
            }
        except:
            return {'duration': 0, 'channels': 2, 'sample_rate': 44100}
    
    def process_audio(self, name: str, config: dict) -> bool:
        """Process single audio file"""
        print(f"\n🔊 {name}")
        
        source = self.base_dir / config['source']
        if not source.exists():
            # Try with different extensions
            found = False
            for ext in ['.wav', '.mp3', '.ogg', '.flac']:
                alt_source = source.with_suffix(ext)
                if alt_source.exists():
                    source = alt_source
                    found = True
                    break
            
            if not found:
                print(f"   ❌ Source not found: {source}")
                return False
        
        # Analyze source
        info = self.analyze_audio(source)
        print(f"   📊 Source: {info['duration']:.2f}s, {info['channels']}ch, {info['sample_rate']}Hz")
        
        # Determine type
        audio_type = self.get_audio_type(name)
        
        # Setup paths
        android_output = self.base_dir / config['android']
        web_output = self.base_dir / config['web']
        
        success = True
        
        # Encode for Android
        print(f"   📱 Android (OGG):")
        if not self.encode_ogg(source, android_output, audio_type):
            # Fallback: copy original or WAV
            wav_source = source.with_suffix('.wav')
            if wav_source.exists():
                shutil.copy(wav_source, android_output.with_suffix('.wav'))
                print(f"   📋 Fallback: WAV copy")
            success = False
        
        # Encode for Web
        print(f"   🌐 Web (MP3):")
        if not self.encode_mp3(source, web_output, audio_type):
            # Try OGG for web as fallback
            web_ogg = web_output.with_suffix('.ogg')
            if self.encode_ogg(source, web_ogg, audio_type):
                print(f"   📋 Fallback: OGG for web")
            success = False
        
        # Generate variations if specified
        variations = config.get('variations', 0)
        if variations > 1 and self.ffmpeg_available:
            print(f"   🎲 Generating {variations} variations:")
            
            # Android variations
            self.generate_variations(
                source, 
                android_output.with_suffix(''), 
                variations, 
                '.ogg'
            )
            
            # Web variations
            self.generate_variations(
                source,
                web_output.with_suffix(''),
                variations,
                '.mp3'
            )
        
        return success
    
    def process_all(self, specific_files: Optional[List[str]] = None):
        """Process all audio files or specific ones"""
        if not self.load_manifest():
            return False
        
        self.ensure_directories()
        
        audio_assets = self.manifest.get('assets', {}).get('audio', {})
        
        if specific_files:
            # Process only specified files
            to_process = {k: v for k, v in audio_assets.items() if k in specific_files}
        else:
            to_process = audio_assets
        
        if not to_process:
            print("⚠️  No audio files to process")
            return False
        
        print(f"\n🎯 Processing {len(to_process)} audio file(s)\n")
        
        # Process sequentially (ffmpeg doesn't parallelize well)
        results = []
        for name, config in to_process.items():
            success = self.process_audio(name, config)
            results.append((name, success))
        
        # Summary
        print(f"\n{'='*50}")
        print("SUMMARY")
        print(f"{'='*50}")
        success_count = sum(1 for _, s in results if s)
        print(f"✅ Successful: {success_count}/{len(results)}")
        
        for name, success in results:
            status = "✅" if success else "❌"
            print(f"   {status} {name}")
        
        return success_count == len(results)
    
    def create_placeholder_audio(self):
        """Generate placeholder audio files for testing"""
        print("\n🎵 Generating placeholder audio files...")
        
        if not self.ffmpeg_available:
            print("❌ ffmpeg required for placeholder generation")
            return
        
        placeholders = {
            'laser-shoot.wav': {
                'duration': 0.3,
                'freq': 880,  # A5
                'sweep': True
            },
            'explosion.wav': {
                'duration': 0.8,
                'noise': True,
                'freq': 100
            },
            'powerup.wav': {
                'duration': 1.2,
                'freq': 523,  # C5
                'arpeggio': True
            },
            'game-over.wav': {
                'duration': 3.0,
                'freq': 220,  # A3
                'sad': True
            },
            'background-music.wav': {
                'duration': 30.0,  # Short loop for testing
                'loop': True,
                'chords': True
            }
        }
        
        raw_dir = self.base_dir / "raw" / "audio"
        raw_dir.mkdir(parents=True, exist_ok=True)
        
        for filename, params in placeholders.items():
            output = raw_dir / filename
            
            # Build ffmpeg filter
            filters = []
            
            if params.get('noise'):
                # Brown noise for explosion
                filters.append(f"anoisesrc=a={params['duration']}:c=brown")
                filters.append("highpass=f=50")
                filters.append("lowpass=f=800")
                filters.append("fade=t=out:st=0.5:d=0.3")
            elif params.get('sweep'):
                # Frequency sweep for laser
                filters.append(f"sine=frequency={params['freq']}:duration={params['duration']}")
                filters.append(f"afade=t=out:st=0:d={params['duration']}")
            elif params.get('arpeggio'):
                # Simple arpeggio
                filters.append(f"sine=frequency={params['freq']}:duration={params['duration']}")
                filters.append("vibrato=f=10:d=0.5")
            elif params.get('chords'):
                # Simple pad
                filters.append(f"sine=frequency={params['freq']}:duration={params['duration']}")
                filters.append("aecho=0.8:0.9:1000:0.3")
            else:
                # Simple tone
                filters.append(f"sine=frequency={params['freq']}:duration={params['duration']}")
                filters.append("fade=t=in:st=0:d=0.1")
                filters.append(f"fade=t=out:st={params['duration']-0.2}:d=0.2")
            
            # Add volume
            filters.append("volume=0.3")
            
            filter_str = ','.join(filters)
            
            cmd = [
                'ffmpeg', '-y',
                '-f', 'lavfi',
                '-i', filter_str,
                '-ar', '44100',
                '-ac', '2',
                str(output)
            ]
            
            try:
                subprocess.run(cmd, check=True, capture_output=True)
                print(f"   ✅ {filename} ({params['duration']}s)")
            except subprocess.CalledProcessError as e:
                print(f"   ❌ {filename}: {e}")
        
        print(f"\n📁 Placeholders saved to: {raw_dir}")
        print("📝 Update asset-manifest.json paths and run: python audio-encoder.py")


def main():
    parser = argparse.ArgumentParser(description='Nebula Strike Audio Encoder')
    parser.add_argument('--manifest', default='shared-assets/asset-manifest.json',
                       help='Path to asset manifest')
    parser.add_argument('--base-dir', default='shared-assets',
                       help='Base directory for assets')
    parser.add_argument('--files', nargs='+',
                       help='Specific files to process')
    parser.add_argument('--create-placeholders', action='store_true',
                       help='Generate placeholder audio files')
    
    args = parser.parse_args()
    
    encoder = AudioEncoder(args.manifest, args.base_dir)
    
    if args.create_placeholders:
        encoder.create_placeholder_audio()
    else:
        success = encoder.process_all(args.files)
        sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
