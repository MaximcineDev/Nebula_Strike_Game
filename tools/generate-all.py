#!/usr/bin/env python3
"""
Nebula Strike - MASTER ASSET GENERATOR
Runs ALL generators in correct order
"""

import sys
import os
import subprocess

# Ensure tools directory exists
sys.path.insert(0, os.path.dirname(__file__))

GENERATORS = [
    ("Setup Directories", "setup-complete-assets", False),
    ("UI Assets", "generate-ui-assets", True),
    ("Game Textures", "generate-game-textures", True),
    ("Audio", "generate-audio", True),
    ("3D Models", "generate-models", True),
    ("Level Data", "generate-levels", True),
    ("Localization", "generate-strings", True),
]


def run_generator(name, module, is_py):
    """Run a single generator"""
    print(f"\n{'='*60}")
    print(f"  {name}")
    print(f"{'='*60}")
    
    try:
        if is_py:
            # Python module
            mod = __import__(module)
            # Find generator class
            classes = [c for c in dir(mod) if 'Generator' in c and not c.startswith('_')]
            if classes:
                gen_class = getattr(mod, classes[0])
                generator = gen_class()
                generator.generate_all()
            else:
                # Run as script
                subprocess.run([sys.executable, f"tools/{module}.py"], check=True)
        else:
            # Run setup script
            subprocess.run([sys.executable, f"tools/{module}.py"], check=True)
        
        return True
        
    except Exception as e:
        print(f"❌ Error in {name}: {e}")
        return False


def main():
    print("=" * 70)
    print("    NEBULA STRIKE - COMPLETE ASSET PIPELINE")
    print("    Generates all textures, audio, models, levels & strings")
    print("=" * 70)
    
    results = []
    
    for name, module, is_py in GENERATORS:
        success = run_generator(name, module, is_py)
        results.append((name, success))
    
    # Summary
    print("\n" + "=" * 70)
    print("  GENERATION SUMMARY")
    print("=" * 70)
    
    for name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"  {status} - {name}")
    
    all_passed = all(s for _, s in results)
    
    print("=" * 70)
    if all_passed:
        print("  🎉 ALL ASSETS GENERATED SUCCESSFULLY!")
        print("=" * 70)
        print("\n  Next: python tools/convert-assets.py")
    else:
        print("  ⚠️  SOME GENERATORS FAILED")
        print("=" * 70)
    
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
