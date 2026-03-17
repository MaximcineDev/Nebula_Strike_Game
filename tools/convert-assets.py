#!/usr/bin/env python3
"""
Nebula Strike Asset Converter
Converts source assets to platform-specific formats
"""

import json
import os
import sys
import subprocess
import shutil
from pathlib import Path
from dataclasses import dataclass
from typing import Dict, List, Optional
import argparse

@dataclass
class AssetConfig:
    source: str
    android: str
    web: str
    metadata: Dict

class AssetConverter:
    def __init__(self, manifest_path: str):
        self.manifest_path = manifest_path
        self.manifest = self.load_manifest()
        self.base_path = Path(manifest_path).parent
        
    def load_manifest(self) -> Dict:
        with open(self.manifest_path, 'r') as f:
            return json.load(f)
    
    def ensure_directories(self):
        """Create output directories if they don't exist"""
        dirs = [
            self.base_path / "processed" / "android" / "textures",
            self.base_path / "processed" / "android" / "audio",
            self.base_path / "processed" / "android" / "models",
            self.base_path / "processed" / "android" / "data",
            self.base_path / "processed" / "web" / "textures",
            self.base_path / "processed" / "web" / "audio",
            self.base_path / "processed" / "web" / "models",
            self.base_path / "processed" / "web" / "data",
        ]
        for d in dirs:
            d.mkdir(parents=True, exist_ok=True)
    
    # ==================== TEXTURE CONVERSION ====================
    
    def convert_texture(self, name: str, config: Dict):
        """Convert texture to ETC2 (Android) and WebP (Web)"""
        source = self.base_path / config["source"]
        if not source.exists():
            print(f"⚠️  Missing source: {source}")
            return
        
        print(f"🖼️  Converting texture: {name}")
        
        # Android: ETC2 compressed texture
        android_output = self.base_path / config["android"]
        self._convert_to_etc2(source, android_output, config)
        
        # Web: WebP with fallback PNG
        web_output = self.base_path / config["web"]
        self._convert_to_webp(source, web_output, config)
        
        # Generate mipmaps for both
        if config.get("generateMipmaps", True):
            self._generate_mipmaps(source, android_output, web_output)
    
    def _convert_to_etc2(self, source: Path, output: Path, config: Dict):
        """Convert to Khronos ETC2 format using etcpack or similar"""
        # Using ImageMagick + etcpack or Mali Texture Compression Tool
        temp_png = output.with_suffix('.png')
        
        # Resize if needed
        width, height = config.get("width", 512), config.get("height", 512)
        
        # Convert to power-of-2 if needed
        cmd = [
            "convert", str(source),
            "-resize", f"{width}x{height}!",
            "-format", "RGBA",
            str(temp_png)
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        
        # Compress to ETC2 (requires etcpack or similar tool)
        # Fallback: use PNG if ETC2 tool not available
        etc_tool = self._find_etc_tool()
        if etc_tool:
            subprocess.run([
                etc_tool, str(temp_png), str(output),
                "-c", "ETC2_RGBA", "-m"
            ], check=True)
        else:
            # Fallback: use PNG with runtime compression
            shutil.copy(temp_png, output.with_suffix('.png'))
            print(f"   ⚠️  ETC2 tool not found, using PNG fallback")
        
        if temp_png.exists():
            temp_png.unlink()
    
    def _convert_to_webp(self, source: Path, output: Path, config: Dict):
        """Convert to WebP format"""
        quality = config.get("quality", 85)
        
        cmd = [
            "cwebp",
            "-q", str(quality),
            "-size", f"{config.get('width', 512)}x{config.get('height', 512)}",
            str(source),
            "-o", str(output)
        ]
        
        try:
            subprocess.run(cmd, check=True, capture_output=True)
            print(f"   ✅ WebP: {output}")
        except (subprocess.CalledProcessError, FileNotFoundError):
            # Fallback to PNG
            png_output = output.with_suffix('.png')
            shutil.copy(source, png_output)
            print(f"   ⚠️  WebP conversion failed, using PNG")
    
    def _generate_mipmaps(self, source: Path, android: Path, web: Path):
        """Generate mipmap chain for both platforms"""
        # Implementation depends on tools available
        pass
    
    def _find_etc_tool(self) -> Optional[str]:
        """Find ETC2 compression tool"""
        tools = ["etcpack", "MaliTextureTool", "PVRTexToolCLI"]
        for tool in tools:
            if shutil.which(tool):
                return tool
        return None
    
    # ==================== AUDIO CONVERSION ====================
    
    def convert_audio(self, name: str, config: Dict):
        """Convert audio to OGG (Android) and MP3 (Web)"""
        source = self.base_path / config["source"]
        if not source.exists():
            print(f"⚠️  Missing source: {source}")
            return
        
        print(f"🔊 Converting audio: {name}")
        
        # Android: OGG Vorbis
        android_output = self.base_path / config["android"]
        self._convert_audio(source, android_output, "ogg", config)
        
        # Web: MP3
        web_output = self.base_path / config["web"]
        self._convert_audio(source, web_output, "mp3", config)
        
        # Generate variations if specified
        if config.get("variations", 0) > 1:
            self._generate_variations(source, android_output, web_output, config)
    
    def _convert_audio(self, source: Path, output: Path, format: str, config: Dict):
        """Convert audio using ffmpeg"""
        quality = "4" if format == "ogg" else "2"  # VBR quality
        
        cmd = [
            "ffmpeg", "-y",
            "-i", str(source),
            "-c:a", "libvorbis" if format == "ogg" else "libmp3lame",
            "-q:a", quality,
            str(output)
        ]
        
        try:
            subprocess.run(cmd, check=True, capture_output=True)
            print(f"   ✅ {format.upper()}: {output}")
        except (subprocess.CalledProcessError, FileNotFoundError):
            # Fallback: copy as WAV
            wav_output = output.with_suffix('.wav')
            shutil.copy(source, wav_output)
            print(f"   ⚠️  FFmpeg not found, using WAV")
    
    def _generate_variations(self, source: Path, android: Path, web: Path, config: Dict):
        """Generate pitch/time variations for variety"""
        variations = config["variations"]
        for i in range(1, variations + 1):
            pitch_shift = (i - variations / 2) * 0.1  # ±10% pitch
            
            # Android variation
            var_android = android.parent / f"{android.stem}_{i}{android.suffix}"
            self._create_variation(source, var_android, "ogg", pitch_shift)
            
            # Web variation
            var_web = web.parent / f"{web.stem}_{i}{web.suffix}"
            self._create_variation(source, var_web, "mp3", pitch_shift)
    
    def _create_variation(self, source: Path, output: Path, format: str, pitch: float):
        """Create pitch-shifted variation"""
        cmd = [
            "ffmpeg", "-y",
            "-i", str(source),
            "-af", f"asetrate=44100*{1 + pitch},aresample=44100",
            "-c:a", "libvorbis" if format == "ogg" else "libmp3lame",
            str(output)
        ]
        try:
            subprocess.run(cmd, check=True, capture_output=True)
        except:
            shutil.copy(source, output)
    
    # ==================== MODEL CONVERSION ====================
    
    def convert_model(self, name: str, config: Dict):
        """Convert 3D models to binary (Android) and JSON (Web)"""
        source = self.base_path / config["source"]
        if not source.exists():
            print(f"⚠️  Missing source: {source}")
            return
        
        print(f"🎲 Converting model: {name}")
        
        # Android: Binary format (fast loading)
        android_output = self.base_path / config["android"]
        self._convert_to_binary(source, android_output, config)
        
        # Web: JSON format (human-readable, debuggable)
        web_output = self.base_path / config["web"]
        self._convert_to_json(source, web_output, config)
    
    def _convert_to_binary(self, source: Path, output: Path, config: Dict):
        """Convert to custom binary format for fast Android loading"""
        # This would use a Blender Python script or assimp
        # For now, generate placeholder
        import struct
        
        vertices = config.get("vertexCount", 100)
        has_normals = config.get("hasNormals", True)
        has_uvs = config.get("hasUVs", True)
        
        # Binary format: header + vertex data
        with open(output, 'wb') as f:
            # Header: magic + version + counts + flags
            f.write(b'NEBM')  # Magic
            f.write(struct.pack('<I', 1))  # Version
            f.write(struct.pack('<I', vertices))
            f.write(struct.pack('<I', config.get("triangleCount", 50)))
            f.write(struct.pack('<B', (has_normals << 1) | has_uvs))
            
            # Placeholder vertex data (would be actual model data)
            for i in range(vertices):
                f.write(struct.pack('<fff', 0.0, 0.0, 0.0))  # Position
                if has_normals:
                    f.write(struct.pack('<fff', 0.0, 1.0, 0.0))  # Normal
                if has_uvs:
                    f.write(struct.pack('<ff', 0.0, 0.0))  # UV
        
        print(f"   ✅ Binary: {output}")
    
    def _convert_to_json(self, source: Path, output: Path, config: Dict):
        """Convert to Three.js-compatible JSON format"""
        import numpy as np
        
        # Generate procedural asteroid if seed provided
        seed = config.get("seed")
        if seed:
            vertices = self._generate_asteroid_vertices(config["vertexCount"], seed)
        else:
            # Default ship vertices
            vertices = self._get_ship_vertices()
        
        model_data = {
            "metadata": {
                "version": 1.0,
                "type": "Geometry",
                "generator": "NebulaStrikeConverter"
            },
            "vertices": vertices["positions"],
            "normals": vertices.get("normals", []),
            "uvs": vertices.get("uvs", []),
            "faces": vertices["indices"],
            "materials": [{
                "name": "default",
                "color": 0xffffff,
                "vertexColors": False
            }]
        }
        
        with open(output, 'w') as f:
            json.dump(model_data, f, separators=(',', ':'))
        
        print(f"   ✅ JSON: {output}")
    
    def _generate_asteroid_vertices(self, count: int, seed: int) -> Dict:
        """Generate procedural asteroid geometry"""
        import random
        random.seed(seed)
        
        vertices = []
        normals = []
        uvs = []
        indices = []
        
        # Generate irregular sphere
        for i in range(count):
            theta = random.uniform(0, 2 * 3.14159)
            phi = random.uniform(0, 3.14159)
            r = 0.7 + random.uniform(0, 0.6)
            
            x = r * random.uniform(-1, 1)
            y = r * random.uniform(-1, 1)
            z = 0
            
            vertices.extend([x, y, z])
            normals.extend([0, 0, 1])
            uvs.extend([0.5 + x / 2, 0.5 + y / 2])
        
        # Generate triangle indices
        for i in range(1, count - 1):
            indices.extend([0, i, i + 1])
        
        return {
            "positions": vertices,
            "normals": normals,
            "uvs": uvs,
            "indices": indices
        }
    
    def _get_ship_vertices(self) -> Dict:
        """Get spaceship vertex data"""
        return {
            "positions": [
                0.0, 0.5, 0.0,      # nose
                -0.4, -0.2, 0.0,    # left wing
                0.4, -0.2, 0.0,     # right wing
                -0.2, -0.4, 0.0,    # left engine
                0.2, -0.4, 0.0,     # right engine
                0.0, -0.1, 0.0      # center
            ],
            "normals": [
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                0, 0, 1
            ],
            "uvs": [
                0.5, 1.0,
                0.0, 0.0,
                1.0, 0.0,
                0.2, 0.0,
                0.8, 0.0,
                0.5, 0.3
            ],
            "indices": [
                0, 1, 5,
                0, 5, 2,
                1, 3, 5,
                5, 4, 2
            ]
        }
    
    # ==================== DATA CONVERSION ====================
    
    def convert_data(self, name: str, config: Dict):
        """Convert level data and localization"""
        source = self.base_path / config["source"]
        
        if name == "levels":
            self._convert_levels(source, config)
        elif name == "localization":
            self._convert_localization(source, config)
    
    def _convert_levels(self, source: Path, config: Dict):
        """Convert level definitions"""
        levels = []
        
        for i in range(1, config["count"] + 1):
            level_file = source / f"level{i}.json"
            if level_file.exists():
                with open(level_file) as f:
                    level_data = json.load(f)
                    levels.append(level_data)
        
        # Android: Single JSON file
        android_output = self.base_path / config["android"]
        with open(android_output, 'w') as f:
            json.dump({"levels": levels}, f)
        
        # Web: Same format (shared)
        web_output = self.base_path / config["web"]
        shutil.copy(android_output, web_output)
        
        print(f"📊 Converted {len(levels)} levels")
    
    def _convert_localization(self, source: Path, config: Dict):
        """Convert string resources"""
        strings = {}
        
        for lang in config["languages"]:
            lang_file = source / f"{lang}.json"
            if lang_file.exists():
                with open(lang_file) as f:
                    strings[lang] = json.load(f)
        
        # Android: XML format
        android_output = self.base_path / config["android"]
        self._write_android_strings(strings, android_output)
        
        # Web: JSON format
        web_output = self.base_path / config["web"]
        with open(web_output, 'w') as f:
            json.dump(strings, f, indent=2)
        
        print(f"🌐 Converted {len(strings)} languages")
    
    def _write_android_strings(self, strings: Dict, output: Path):
        """Write Android strings.xml"""
        with open(output, 'w') as f:
            f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n')
            for lang, data in strings.items():
                for key, value in data.items():
                    f.write(f'    <string name="{key}_{lang}">{value}</string>\n')
            f.write('</resources>\n')
    
    # ==================== MAIN CONVERSION ====================
    
    def convert_all(self, platform: Optional[str] = None):
        """Convert all assets"""
        self.ensure_directories()
        
        assets = self.manifest["assets"]
        
        # Convert textures
        for name, config in assets.get("textures", {}).items():
            if platform in (None, "android", "web"):
                self.convert_texture(name, config)
        
        # Convert audio
        for name, config in assets.get("audio", {}).items():
            if platform in (None, "android", "web"):
                self.convert_audio(name, config)
        
        # Convert models
        for name, config in assets.get("models", {}).items():
            if platform in (None, "android", "web"):
                self.convert_model(name, config)
        
        # Convert data
        for name, config in assets.get("data", {}).items():
            self.convert_data(name, config)
        
        # Copy to platform directories
        self.sync_to_projects(platform)
    
    def sync_to_projects(self, platform: Optional[str] = None):
        """Copy processed assets to Android and PWA projects"""
        base = self.base_path.parent
        
        # Android
        if platform in (None, "android"):
            android_assets = base / "android" / "app" / "src" / "main" / "assets"
            if android_assets.exists():
                self._sync_directory(
                    self.base_path / "processed" / "android",
                    android_assets
                )
                print("📱 Synced to Android project")
        
        # PWA
        if platform in (None, "web"):
            pwa_assets = base / "pwa" / "assets"
            if pwa_assets.exists():
                self._sync_directory(
                    self.base_path / "processed" / "web",
                    pwa_assets
                )
                print("🌐 Synced to PWA project")
    
    def _sync_directory(self, source: Path, dest: Path):
        """Sync directory contents"""
        if dest.exists():
            shutil.rmtree(dest)
        shutil.copytree(source, dest)

# ==================== CLI INTERFACE ====================

def main():
    parser = argparse.ArgumentParser(description="Nebula Strike Asset Converter")
    parser.add_argument("--platform", choices=["android", "web"], 
                       help="Convert for specific platform only")
    parser.add_argument("--type", choices=["textures", "audio", "models", "data"],
                       help="Convert specific asset type only")
    parser.add_argument("--watch", action="store_true",
                       help="Watch for changes and auto-convert")
    
    args = parser.parse_args()
    
    manifest_path = Path(__file__).parent.parent / "shared-assets" / "asset-manifest.json"
    
    if not manifest_path.exists():
        print(f"❌ Manifest not found: {manifest_path}")
        sys.exit(1)
    
    converter = AssetConverter(str(manifest_path))
    
    if args.watch:
        print("👀 Watching for changes... (Press Ctrl+C to stop)")
        from watchdog.observers import Observer
        from watchdog.events import FileSystemEventHandler
        
        class AssetHandler(FileSystemEventHandler):
            def on_modified(self, event):
                if event.src_path.endswith(('.png', '.wav', '.blend', '.json')):
                    print(f"\n🔄 Change detected: {event.src_path}")
                    converter.convert_all(args.platform)
        
        observer = Observer()
        observer.schedule(AssetHandler(), str(manifest_path.parent / "raw"), recursive=True)
        observer.start()
        
        try:
            while True:
                import time
                time.sleep(1)
        except KeyboardInterrupt:
            observer.stop()
        observer.join()
    else:
        converter.convert_all(args.platform)
        print("\n✅ Asset conversion complete!")

if __name__ == "__main__":
    main()
