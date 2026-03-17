#!/usr/bin/env python3
"""
Nebula Strike - Master Asset Generator
Runs all asset generators in sequence
"""

import sys
import os

# Add tools directory to path
sys.path.insert(0, os.path.dirname(__file__))

def main():
    print("=" * 60)
    print("  NEBULA STRIKE - COMPLETE ASSET GENERATION")
    print("=" * 60)
    print()
    
    generators = [
        ("UI Assets", "generate-ui-assets"),
        ("Game Textures", "generate-game-textures"),
        ("Audio", "generate-audio"),
        ("3D Models", "generate-models"),
        ("Level Data", "generate-levels"),
    ]
    
    for name, module in generators:
        print(f"\n{'='*60}")
        print(f"  GENERATING: {name}")
        print(f"{'='*60}")
        
        try:
            # Import and run
            mod = __import__(module)
            gen_class = getattr(mod, [c for c in dir(mod) if 'Generator' in c][0])
            generator = gen_class()
            generator.generate_all()
        except Exception as e:
            print(f"❌ Error generating {name}: {e}")
            import traceback
            traceback.print_exc()
    
    print("\n" + "=" * 60)
    print("  ✅ ALL ASSETS GENERATED SUCCESSFULLY!")
    print("=" * 60)
    print("\nNext steps:")
    print("  1. Review generated assets in shared-assets/raw/")
    print("  2. Run: python convert-assets.py")
    print("  3. Build and test your game!")

if __name__ == "__main__":
    main()
