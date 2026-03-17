#!/usr/bin/env python3
"""
Nebula Strike - Complete Asset Directory Setup
Creates all folders and placeholder files
"""

import os
import json


def create_directory_structure():
    """Create complete asset directory tree"""
    
    base = "shared-assets"
    
    directories = [
        # Raw assets
        f"{base}/raw/textures/ui",
        f"{base}/raw/textures/game",
        f"{base}/raw/audio",
        f"{base}/raw/models",
        f"{base}/raw/data/levels",
        f"{base}/raw/data/strings",
        
        # Processed - Android
        f"{base}/processed/android/textures",
        f"{base}/processed/android/audio",
        f"{base}/processed/android/models",
        f"{base}/processed/android/data",
        
        # Processed - Web
        f"{base}/processed/web/textures",
        f"{base}/processed/web/audio",
        f"{base}/processed/web/models",
        f"{base}/processed/web/data",
    ]
    
    for d in directories:
        os.makedirs(d, exist_ok=True)
        print(f"📁 {d}")
    
    return base


def create_placeholder_files(base):
    """Create placeholder files for all assets"""
    
    # UI Textures (will be generated)
    ui_files = [
        "logo.png", "button-play.png", "button-shop.png",
        "icon-coin.png", "icon-heart.png", "icon-shield.png", "icon-laser.png"
    ]
    
    # Game Textures (will be generated)
    game_files = [
        "spaceship-diffuse.png", "spaceship-normal.png",
        "asteroid-diffuse.png", "nebula-background.png",
        "particle-fire.png", "particle-spark.png"
    ]
    
    # Audio (will be generated)
    audio_files = [
        "laser-shoot.wav", "explosion.wav", "powerup.wav",
        "game-over.wav", "background-music.wav"
    ]
    
    # Models (will be generated)
    model_files = [
        "spaceship.blend", "asteroid.blend"
    ]
    
    # Create placeholder files
    for f in ui_files:
        path = f"{base}/raw/textures/ui/{f}"
        if not os.path.exists(path):
            open(path, 'w').close()
            print(f"🖼️  {f}")
    
    for f in game_files:
        path = f"{base}/raw/textures/game/{f}"
        if not os.path.exists(path):
            open(path, 'w').close()
            print(f"🖼️  {f}")
    
    for f in audio_files:
        path = f"{base}/raw/audio/{f}"
        if not os.path.exists(path):
            open(path, 'w').close()
            print(f"🔊 {f}")
    
    for f in model_files:
        path = f"{base}/raw/models/{f}"
        if not os.path.exists(path):
            open(path, 'w').close()
            print(f"🎲 {f}")


def create_manifest(base):
    """Create asset manifest if not exists"""
    
    manifest_path = f"{base}/asset-manifest.json"
    
    if os.path.exists(manifest_path):
        print(f"\n✅ Manifest already exists: {manifest_path}")
        return
    
    manifest = {
        "version": "1.0.0",
        "lastUpdated": "2024-01-15T10:30:00Z",
        "formats": {
            "android": {
                "textureFormat": "etc2",
                "audioFormat": "ogg",
                "modelFormat": "bin"
            },
            "web": {
                "textureFormat": "webp",
                "audioFormat": "mp3",
                "modelFormat": "json"
            }
        },
        "assets": {
            "textures": {
                "logo": {
                    "source": "raw/textures/ui/logo.png",
                    "android": "processed/android/textures/logo.png",
                    "web": "processed/web/textures/logo.webp",
                    "width": 400,
                    "height": 200
                },
                "button-play": {
                    "source": "raw/textures/ui/button-play.png",
                    "android": "processed/android/textures/button-play.png",
                    "web": "processed/web/textures/button-play.webp",
                    "width": 200,
                    "height": 80
                },
                "button-shop": {
                    "source": "raw/textures/ui/button-shop.png",
                    "android": "processed/android/textures/button-shop.png",
                    "web": "processed/web/textures/button-shop.webp",
                    "width": 200,
                    "height": 80
                },
                "icon-coin": {
                    "source": "raw/textures/ui/icon-coin.png",
                    "android": "processed/android/textures/icon-coin.png",
                    "web": "processed/web/textures/icon-coin.webp",
                    "width": 64,
                    "height": 64
                },
                "icon-heart": {
                    "source": "raw/textures/ui/icon-heart.png",
                    "android": "processed/android/textures/icon-heart.png",
                    "web": "processed/web/textures/icon-heart.webp",
                    "width": 64,
                    "height": 64
                },
                "icon-shield": {
                    "source": "raw/textures/ui/icon-shield.png",
                    "android": "processed/android/textures/icon-shield.png",
                    "web": "processed/web/textures/icon-shield.webp",
                    "width": 64,
                    "height": 64
                },
                "icon-laser": {
                    "source": "raw/textures/ui/icon-laser.png",
                    "android": "processed/android/textures/icon-laser.png",
                    "web": "processed/web/textures/icon-laser.webp",
                    "width": 64,
                    "height": 64
                },
                "spaceship-diffuse": {
                    "source": "raw/textures/game/spaceship-diffuse.png",
                    "android": "processed/android/textures/spaceship-diffuse.etc2",
                    "web": "processed/web/textures/spaceship-diffuse.webp",
                    "width": 512,
                    "height": 512
                },
                "spaceship-normal": {
                    "source": "raw/textures/game/spaceship-normal.png",
                    "android": "processed/android/textures/spaceship-normal.etc2",
                    "web": "processed/web/textures/spaceship-normal.webp",
                    "width": 512,
                    "height": 512
                },
                "asteroid-diffuse": {
                    "source": "raw/textures/game/asteroid-diffuse.png",
                    "android": "processed/android/textures/asteroid-diffuse.etc2",
                    "web": "processed/web/textures/asteroid-diffuse.webp",
                    "width": 256,
                    "height": 256
                },
                "nebula-background": {
                    "source": "raw/textures/game/nebula-background.png",
                    "android": "processed/android/textures/nebula-background.etc2",
                    "web": "processed/web/textures/nebula-background.webp",
                    "width": 1024,
                    "height": 2048
                },
                "particle-fire": {
                    "source": "raw/textures/game/particle-fire.png",
                    "android": "processed/android/textures/particle-fire.etc2",
                    "web": "processed/web/textures/particle-fire.webp",
                    "width": 128,
                    "height": 128
                },
                "particle-spark": {
                    "source": "raw/textures/game/particle-spark.png",
                    "android": "processed/android/textures/particle-spark.etc2",
                    "web": "processed/web/textures/particle-spark.webp",
                    "width": 64,
                    "height": 64
                }
            },
            "audio": {
                "laser-shoot": {
                    "source": "raw/audio/laser-shoot.wav",
                    "android": "processed/android/audio/laser-shoot.ogg",
                    "web": "processed/web/audio/laser-shoot.mp3",
                    "duration": 0.3,
                    "loop": False
                },
                "explosion": {
                    "source": "raw/audio/explosion.wav",
                    "android": "processed/android/audio/explosion.ogg",
                    "web": "processed/web/audio/explosion.mp3",
                    "duration": 0.8,
                    "loop": False,
                    "variations": 3
                },
                "powerup": {
                    "source": "raw/audio/powerup.wav",
                    "android": "processed/android/audio/powerup.ogg",
                    "web": "processed/web/audio/powerup.mp3",
                    "duration": 1.2,
                    "loop": False
                },
                "game-over": {
                    "source": "raw/audio/game-over.wav",
                    "android": "processed/android/audio/game-over.ogg",
                    "web": "processed/web/audio/game-over.mp3",
                    "duration": 3.0,
                    "loop": False
                },
                "background-music": {
                    "source": "raw/audio/background-music.wav",
                    "android": "processed/android/audio/background-music.ogg",
                    "web": "processed/web/audio/background-music.mp3",
                    "duration": 120.0,
                    "loop": True,
                    "stream": True
                }
            },
            "models": {
                "spaceship": {
                    "source": "raw/models/spaceship.blend",
                    "android": "processed/android/models/spaceship.bin",
                    "web": "processed/web/models/spaceship.json",
                    "vertexCount": 156
                },
                "asteroid-small": {
                    "source": "raw/models/asteroid.blend",
                    "android": "processed/android/models/asteroid-small.bin",
                    "web": "processed/web/models/asteroid-small.json",
                    "vertexCount": 64,
                    "seed": 12345
                },
                "asteroid-medium": {
                    "source": "raw/models/asteroid.blend",
                    "android": "processed/android/models/asteroid-medium.bin",
                    "web": "processed/web/models/asteroid-medium.json",
                    "vertexCount": 96,
                    "seed": 67890
                },
                "asteroid-large": {
                    "source": "raw/models/asteroid.blend",
                    "android": "processed/android/models/asteroid-large.bin",
                    "web": "processed/web/models/asteroid-large.json",
                    "vertexCount": 128,
                    "seed": 11111
                }
            },
            "data": {
                "levels": {
                    "source": "raw/data/levels/",
                    "android": "processed/android/data/levels.json",
                    "web": "processed/web/data/levels.json",
                    "count": 9
                },
                "localization": {
                    "source": "raw/data/strings/",
                    "android": "processed/android/data/strings.xml",
                    "web": "processed/web/data/strings.json",
                    "languages": ["en", "es", "fr", "de", "it", "pt", "ru", "ja", "ko", "zh", "ar", "hi"]
                }
            }
        }
    }
    
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=2)
    
    print(f"\n✅ Created: {manifest_path}")


def main():
    print("=" * 60)
    print("  NEBULA STRIKE - COMPLETE ASSET SETUP")
    print("=" * 60)
    print()
    
    base = create_directory_structure()
    create_placeholder_files(base)
    create_manifest(base)
    
    print("\n" + "=" * 60)
    print("  ✅ SETUP COMPLETE")
    print("=" * 60)
    print("\nNext steps:")
    print("  1. python tools/generate-ui-assets.py")
    print("  2. python tools/generate-game-textures.py")
    print("  3. python tools/generate-audio.py")
    print("  4. python tools/generate-models.py")
    print("  5. python tools/generate-levels.py")
    print("  6. python tools/generate-strings.py")
    print("  7. python tools/convert-assets.py")


if __name__ == "__main__":
    main()
